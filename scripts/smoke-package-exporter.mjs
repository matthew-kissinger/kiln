/** Candidate-only distribution coverage. Resolves every dependency from the fresh install. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function smokePackageExporter({ runtime, workspace, cli, command }) {
  const require = createRequire(join(runtime, 'package.json'));
  const load = (name) => import(pathToFileURL(require.resolve(name)).href);
  // Optional to normal users, required for this explicit textured candidate qualification.
  const canvasPath = require.resolve('@napi-rs/canvas');
  const source = join(workspace, 'community-texture.kiln.js');
  const output = join(workspace, 'community-texture.glb');
  await writeFile(
    source,
    `const meta = { name: 'PackedCommunityTexture', category: 'prop' };
function build() {
  const root = createRoot('PackedCommunityTexture');
  const albedo = proceduralTexture({schemaVersion:2,size:8,usage:'albedo',layers:[{op:'checker',colorA:0xff0000,colorB:0x0000ff,squares:2}]});
  const pivot = createPivot('TexturePivot', [0.2,0.3,0.1], root);
  createPart('Painted', boxGeo(0.6,0.2,0.1), pbrMaterial({albedo,roughness:0.4,doubleSided:true}), {parent:pivot});
  createPart('Lamp', boxGeo(0.1,0.1,0.1), gameMaterial(0xffffff,{emissive:0xffffff,emissiveIntensity:2}), {position:[0,0.2,0],parent:pivot});
  return root;
}
function animate() {return [createClip('turn',1,[rotationTrack('Joint_TexturePivot',[{time:0,rotation:[0,0,0]},{time:1,rotation:[0,90,0]}])])];}
`,
  );
  const log = await command([cli, 'render', source, '--out', output], workspace, {
    KILN_GLTF_EXPORTER: 'three',
    KILN_EVALUATOR_MODE: 'subprocess',
    KILN_BUILD_CACHE: 'off',
  });
  const bytes = await readFile(output);
  const { NodeIO } = await load('@gltf-transform/core');
  const { ALL_EXTENSIONS } = await load('@gltf-transform/extensions');
  const validator = require('gltf-validator');
  const validation = await validator.validateBytes(new Uint8Array(bytes));
  assert.equal(validation.issues.numErrors, 0, JSON.stringify(validation.issues));
  const doc = await new NodeIO().registerExtensions(ALL_EXTENSIONS).readBinary(bytes);
  const root = doc.getRoot();
  const pivot = root.listNodes().find((node) => node.getName() === 'Joint_TexturePivot');
  assert(pivot, 'Packed candidate lost its named pivot');
  assert.deepEqual(pivot.getTranslation(), [0.2, 0.3, 0.1]);
  assert.equal(pivot.listChildren().length, 2);
  assert.equal(root.listAnimations().length, 1);
  assert.equal(root.listAnimations()[0].listChannels()[0].getTargetNode(), pivot);
  const painted = root.listMaterials().find((material) => material.getBaseColorTexture());
  assert(painted, 'Packed candidate lost its texture binding');
  assert.equal(painted.getDoubleSided(), true);
  const texture = painted.getBaseColorTexture();
  assert.equal(texture.getMimeType(), 'image/png');
  const sharp = require('sharp');
  const decoded = await sharp(Buffer.from(texture.getImage()))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.equal(decoded.info.width, 8);
  assert.equal(decoded.info.height, 8);
  const colours = new Set();
  for (let i = 0; i < decoded.data.length; i += 4)
    colours.add(decoded.data.subarray(i, i + 4).toString('hex'));
  assert.deepEqual([...colours].sort(), ['0000ffff', 'ff0000ff']);
  const emissive = root
    .listMaterials()
    .map((material) => material.getExtension('KHR_materials_emissive_strength'))
    .find(Boolean);
  assert.equal(emissive?.getEmissiveStrength(), 2, 'Candidate selector did not reach the worker');
  assert(log.includes('tris'), 'Packaged subprocess must complete a real export');
  return {
    exporter: 'three',
    evaluator: 'subprocess',
    canvasPath,
    glbSha256: createHash('sha256').update(bytes).digest('hex'),
    bytes: bytes.length,
    validationErrors: validation.issues.numErrors,
    textureSize: [decoded.info.width, decoded.info.height],
    textureColours: [...colours].sort(),
    emissiveStrength: emissive.getEmissiveStrength(),
  };
}
