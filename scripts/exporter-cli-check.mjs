/** Exercise the built CLI -> sanitized worker -> disk cache, not an in-process substitute. */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const runtime = args.includes('--node') ? args[args.indexOf('--node') + 1] : process.execPath;
const directory = await mkdtemp(path.join(os.tmpdir(), 'kiln-exporter-cli-'));
const sourcePath = path.join(directory, 'fixture.kiln.js');
await writeFile(
  sourcePath,
  `
const meta = { name: 'ExporterCacheProbe', category: 'prop' };
function build() {
  const root = createRoot('ExporterCacheProbe');
  const albedo = proceduralTexture({schemaVersion:2,size:8,usage:'albedo',layers:[{op:'checker',colorA:0xff0000,colorB:0x0000ff,squares:2}]});
  const pivot = createPivot('Vane', [0.2, 0.3, 0.1], root);
  createPart('Painted', boxGeo(0.6,0.2,0.1), pbrMaterial({albedo,roughness:0.4}), {parent:pivot});
  createPart('Lamp', boxGeo(0.1,0.1,0.1), gameMaterial(0xffaa00,{emissive:0xff8800,emissiveIntensity:0.25}), {position:[0,0.3,0],parent:pivot});
  return root;
}
function animate() {return [createClip('turn',1,[rotationTrack('Joint_Vane',[{time:0,rotation:[0,0,0]},{time:1,rotation:[0,90,0]}])])];}
`,
);
const version = spawnSync(runtime, ['--version'], { encoding: 'utf8', windowsHide: true });
assert.equal(version.status, 0, version.stderr);
const records = [];
for (const backend of ['legacy', 'three']) {
  let key;
  let previousBytes;
  for (const repeat of [1, 2]) {
    const output = path.join(directory, `${backend}-${repeat}.glb`);
    const result = spawnSync(
      runtime,
      [path.join(root, 'dist/cli.mjs'), 'render', sourcePath, '--out', output],
      {
        cwd: directory,
        encoding: 'utf8',
        timeout: 120_000,
        windowsHide: true,
        env: {
          ...process.env,
          KILN_GLTF_EXPORTER: backend,
          KILN_EVALUATOR_MODE: 'subprocess',
          KILN_BUILD_CACHE: 'disk',
          KILN_BUILD_CACHE_DIR: path.join(directory, 'cache'),
        },
      },
    );
    const log = `${result.stdout ?? ''}${result.stderr ?? ''}`;
    await writeFile(path.join(directory, `${backend}-${repeat}.log`), log);
    assert.equal(result.status, 0, `${backend} run ${repeat} failed: ${result.error ?? log}`);
    const bytes = await readFile(output);
    const hash = createHash('sha256').update(bytes).digest('hex');
    if (repeat === 1) {
      key = log.match(/build created (sha256:[a-f0-9]+)/)?.[1];
      assert(key, `${backend}: expected its own new disk-cache entry, got ${log}`);
      previousBytes = bytes;
      records.push({ backend, key, bytes: bytes.length, sha256: hash });
    } else {
      assert(
        log.includes(`build reused ${key}`),
        `${backend}: expected its own cache hit, got ${log}`,
      );
      assert(bytes.equals(previousBytes), `${backend}: cache hit changed GLB bytes`);
    }
  }
}
assert.notEqual(records[0].key, records[1].key, 'Exporter backends collided in the disk cache');
assert.notEqual(
  records[0].sha256,
  records[1].sha256,
  'Candidate did not change the known emissive fixture; check sanitized worker selection',
);
const receipt = {
  runtime: version.stdout.trim(),
  cliSha256: createHash('sha256')
    .update(await readFile(path.join(root, 'dist/cli.mjs')))
    .digest('hex'),
  directory,
  records,
  ownCacheHits: true,
};
await writeFile(path.join(directory, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt, null, 2));
