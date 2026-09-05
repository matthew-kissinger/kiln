// Local GPU poster generation from the exact downloadable gallery GLB.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import sharp from 'sharp';
import { Vector3 } from 'three';
import { heroCamera } from '../src/hero-camera';
import { makeRemoteRenderPort, probeCaptureIdentity } from '../../src/cli-render-mode';
const name = process.argv[2];
if (!/^[a-z0-9-]+$/.test(name ?? '')) throw Error('Expected exact gallery name');
const glb = await readFile(`site/public/assets/${name}.glb`),
  source = await readFile(`site/public/assets/${name}.kiln.js`);
const hash = (x) => createHash('sha256').update(x).digest('hex');
const loaded = await new GLTFLoader().parseAsync(
  glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength),
  '',
);
const camera = heroCamera(loaded.scene);
const square = process.argv.includes('--square');
if (square) {
  const target = new Vector3().fromArray(camera.target);
  const direction = new Vector3().fromArray(camera.position).sub(target).normalize();
  const right = new Vector3().crossVectors(new Vector3(0, 1, 0), direction).normalize();
  const up = new Vector3().crossVectors(direction, right).normalize();
  const point = new Vector3();
  let halfExtent = 0;
  loaded.scene.traverse(mesh => {
    if (!mesh.isMesh) return;
    const positions = mesh.geometry.getAttribute('position');
    for (let i=0; i<positions.count; i++) {
      point.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld).sub(target);
      halfExtent = Math.max(halfExtent, Math.abs(point.dot(right)), Math.abs(point.dot(up)));
    }
  });
  camera.aspect = 1;
  camera.halfHeight = halfExtent * 1.12;
}
const height = square ? 1024 : 768;
const lightingPresetId = 'gallery-studio-v1';
const captureIdentity = await probeCaptureIdentity('http://127.0.0.1:8000');
if (!captureIdentity) throw new Error('Renderer did not provide an exact build identity');
const rendered = await makeRemoteRenderPort(
  'http://127.0.0.1:8000',
  process.env.KILN_RENDER_TOKEN || process.env.RENDER_SERVICE_TOKEN,
)({ glb, cameras: [camera], width: 1024, height, lightingPresetId });
if (
  !rendered.ok ||
  !rendered.viewsPng?.length ||
  !rendered.derivativeFidelity?.materialFaithful ||
  !isDeepStrictEqual(rendered.cameras?.[0], camera)
)
  throw Error('No faithful exact-camera GPU image');
if ((await probeCaptureIdentity('http://127.0.0.1:8000')) !== captureIdentity)
  throw new Error('Renderer changed during poster generation');
const png = rendered.viewsPng[0];
const receipt = {
  captureIdentity: JSON.parse(captureIdentity),
  sourceHash: hash(source),
  artifactHash: hash(glb),
  imageHash: hash(png),
  width: 1024,
  height,
  camera,
  rendererId: rendered.rendererId,
  materialFaithful: true,
  lightingPresetId,
  purpose:
    'Gallery poster generated from the exact downloadable GLB; separate from authoring feedback.',
};
if (process.argv.includes('--preview') || process.argv.includes('--background-preview')) {
  const previewDirectory = process.argv.includes('--background-preview') ? 'tmp/gallery-background-preview' : 'tmp/gallery-lighting-preview';
  await mkdir(previewDirectory, { recursive: true });
  await writeFile(`${previewDirectory}/${name}.png`, png);
  await writeFile(`${previewDirectory}/${name}.json`, JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify({ name, lightingPresetId, preview: true }));
  process.exit(0);
}
await writeFile(`examples/renders/${name}.png`, png);
await writeFile(`examples/renders/${name}.json`, JSON.stringify(receipt, null, 2) + '\n');
await writeFile(`site/public/assets/${name}.poster.json`, JSON.stringify(receipt, null, 2) + '\n');
await sharp(png)
  .resize(560, 560, { fit: 'inside' })
  .webp({ quality: 86 })
  .toFile(`site/public/thumbs/${name}.webp`);
const side = JSON.parse(await readFile(`examples/${name}.provenance.json`, 'utf8'));
side.provenance.poster =
  'Gallery GPU render of the exact downloadable GLB. Source, artifact, image hashes and camera settings are recorded alongside the poster.';
side.provenance.posterReceipt = receipt;
await writeFile(`examples/${name}.provenance.json`, JSON.stringify(side, null, 2) + '\n');
const index = JSON.parse(await readFile('site/public/assets/index.json', 'utf8'));
const row = index.find((x) => x.name === name);
if (row) {
  row.provenance = side.provenance;
  await writeFile('site/public/assets/index.json', JSON.stringify(index, null, 2) + '\n');
}
const build = JSON.parse(await readFile('site/public/assets/build.json', 'utf8'));
build.indexHash = hash(await readFile('site/public/assets/index.json'));
build.metadataNote =
  'Posters and captions updated after GLB generation; source and artifact hashes unchanged.';
await writeFile('site/public/assets/build.json', JSON.stringify(build, null, 2) + '\n');
console.log(JSON.stringify(receipt));
