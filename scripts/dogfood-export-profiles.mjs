#!/usr/bin/env node
// Ordinary local source -> render -> save -> export proof. No provider or Tier 2 calls.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { AnimationMixer, DataTexture, RGBAFormat, LoadingManager, LoopOnce } from 'three';
import sharp from 'sharp';
import { validateBytes } from 'gltf-validator';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspace = await mkdtemp(join(tmpdir(), 'kiln-export-dogfood-'));
const receipt = {
  version: 1,
  node: process.version,
  runtimeBuild: JSON.parse(await readFile(join(repo, 'dist/build.json'), 'utf8')),
  workspace,
  checks: [],
  assets: [],
};
const sha = (bytes) => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const env = {
  ...process.env,
  KILN_RENDER: 'cpu',
  KILN_PROGRAM_STORE: join(workspace, '.kiln/programs'),
  KILN_COLLECTIONS: JSON.stringify({ project: join(workspace, 'assets/kiln') }),
};
function command(args, ok = true) {
  const result = spawnSync(process.execPath, args, {
    cwd: workspace,
    env,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 180000,
  });
  if (ok) assert.equal(result.status, 0, `${args.join(' ')}\n${result.stderr}\n${result.stdout}`);
  else assert.notEqual(result.status, 0, 'Expected command rejection');
  return result.stdout;
}
const cli = (...args) => command([join(workspace, 'kiln.mjs'), ...args]);
const jsonChunk = (bytes) => JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
const binTail = (bytes) => bytes.subarray(20 + bytes.readUInt32LE(12));
const proof = (name) => {
  receipt.checks.push(name);
  console.log(name);
};

async function checkHttpResources(asset, expected) {
  const child = spawn(process.execPath, [join(workspace, 'kiln.mjs'), 'view', '--port', '0'], {
    cwd: workspace,
    env,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    const url = await new Promise((done, fail) => {
      let output = '';
      const timer = setTimeout(() => fail(new Error('Viewer did not start')), 15000);
      child.once('error', (error) => {
        clearTimeout(timer);
        fail(error);
      });
      child.once('exit', (code) => {
        clearTimeout(timer);
        fail(new Error(`Viewer exited ${code}`));
      });
      child.stdout.on('data', (data) => {
        output += data;
        const match = output.match(/http:\/\/127\.0\.0\.1:\d+\//);
        if (match) {
          clearTimeout(timer);
          done(match[0]);
        }
      });
    });
    for (const [name, bytes] of expected) {
      const response = await fetch(
        `${url}files/project/${asset.assetId}/${asset.revisionId}/${name}?download`,
      );
      assert.equal(response.status, 200);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
    }
  } finally {
    child.kill();
  }
  proof('built local viewer HTTP runtime GLB and sidecar endpoints return exact MCP bytes');
}

async function loadOffline(bytes) {
  const json = jsonChunk(bytes);
  const binary = binTail(bytes).subarray(8);
  const decoded = [];
  for (const image of json.images ?? []) {
    assert.equal(image.mimeType, 'image/png');
    const view = json.bufferViews[image.bufferView];
    const encoded = binary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength);
    const { data, info } = await sharp(encoded, { failOn: 'warning' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    decoded.push({ data, info, sha256: sha(data) });
  }
  const manager = new LoadingManager();
  manager.setURLModifier(() => {
    throw new Error('External fetch attempted');
  });
  const loader = new GLTFLoader(manager);
  loader.register(() => ({
    name: 'DOGFOOD_DECODED_PNG',
    loadTexture(index) {
      const image = decoded[json.textures[index].source];
      const texture = new DataTexture(image.data, image.info.width, image.info.height, RGBAFormat);
      texture.flipY = false;
      texture.needsUpdate = true;
      return Promise.resolve(texture);
    },
  }));
  return {
    loaded: await loader.parseAsync(Uint8Array.from(bytes).buffer, ''),
    images: decoded.map(({ sha256, info }) => ({ sha256, width: info.width, height: info.height })),
  };
}

async function checkExport(asset, label) {
  const revisionPath = join(workspace, 'assets/kiln', asset.assetId, 'revisions', asset.revisionId);
  const canonical = await readFile(join(revisionPath, 'asset.glb'));
  const manifestBefore = await readFile(join(revisionPath, 'manifest.json'));
  const outputPath = join(workspace, `${label}.glb`);
  cli('export', asset.assetId, asset.revisionId, '--out', outputPath, '--profile', 'runtime');
  const runtime = await readFile(outputPath);
  const sidecar = await readFile(join(workspace, `${label}.kiln-metadata.json`));
  const before = jsonChunk(canonical),
    after = jsonChunk(runtime);
  assert.equal(after.asset.extras.kilnProvenanceV1.metadata.sha256, sha(sidecar));
  assert.equal(after.asset.extras.kilnProvenanceV1.metadata.uri, `${label}.kiln-metadata.json`);
  assert.equal(JSON.parse(sidecar).source.glbSha256, sha(canonical));
  assert.deepEqual(binTail(runtime), binTail(canonical));
  delete after.asset.extras.kilnProvenanceV1;
  if (!before.asset.extras) delete after.asset.extras;
  for (const scene of before.scenes ?? []) if (scene.extras) delete scene.extras.kilnReviewClipsV1;
  assert.deepEqual(after, before);
  const [base, derived] = await Promise.all([loadOffline(canonical), loadOffline(runtime)]);
  assert.deepEqual(derived.images, base.images);
  assert.deepEqual(
    derived.loaded.animations.map((clip) => clip.name),
    base.loaded.animations.map((clip) => clip.name),
  );
  const snapshot = (scene) => {
    const result = [];
    scene.traverse((node) =>
      result.push([
        node.name,
        ...node.position.toArray(),
        ...node.quaternion.toArray(),
        ...node.scale.toArray(),
      ]),
    );
    return result;
  };
  let poses = 0;
  for (let i = 0; i < base.loaded.animations.length; i++) {
    const mixers = [base, derived].map(({ loaded }) => {
      const mixer = new AnimationMixer(loaded.scene);
      const action = mixer.clipAction(loaded.animations[i]);
      action.setLoop(LoopOnce, 1);
      action.clampWhenFinished = true;
      action.play();
      return mixer;
    });
    for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
      for (const mixer of mixers) mixer.setTime(base.loaded.animations[i].duration * fraction);
      assert.deepEqual(snapshot(derived.loaded.scene), snapshot(base.loaded.scene));
      poses++;
    }
    for (const mixer of mixers) mixer.stopAllAction();
  }
  const validator = await validateBytes(new Uint8Array(runtime), { maxIssues: 100 });
  assert.equal(validator.issues.numErrors, 0, JSON.stringify(validator.issues));
  cli(
    'export',
    asset.assetId,
    asset.revisionId,
    '--out',
    join(workspace, `${label}-editable.glb`),
    '--format',
    'glb',
    '--profile',
    'editable',
  );
  assert.deepEqual(await readFile(join(workspace, `${label}-editable.glb`)), canonical);
  command(
    [
      join(workspace, 'kiln.mjs'),
      'export',
      asset.assetId,
      asset.revisionId,
      '--out',
      outputPath,
      '--profile',
      'runtime',
    ],
    false,
  );
  assert.deepEqual(await readFile(outputPath), runtime);
  assert.deepEqual(await readFile(join(revisionPath, 'asset.glb')), canonical);
  assert.deepEqual(await readFile(join(revisionPath, 'manifest.json')), manifestBefore);
  const imported = JSON.parse(cli('import', outputPath, '--name', 'Runtime binary only')).assets[0];
  assert.equal(imported.editable, false);
  command(
    [join(workspace, 'kiln.mjs'), 'asset', imported.assetId, imported.revisionId, '--restore'],
    false,
  );
  command(
    [
      join(workspace, 'kiln.mjs'),
      'export',
      imported.assetId,
      imported.revisionId,
      '--out',
      join(workspace, `${label}-twice.glb`),
      '--profile',
      'runtime',
    ],
    false,
  );
  receipt.assets.push({
    label,
    canonicalBytes: canonical.length,
    runtimeBytes: runtime.length,
    sidecarBytes: sidecar.length,
    canonicalSha256: sha(canonical),
    runtimeSha256: sha(runtime),
    sidecarSha256: sha(sidecar),
    clips: base.loaded.animations.length,
    tracks: base.loaded.animations.reduce((n, clip) => n + clip.tracks.length, 0),
    comparedPoses: poses,
    decodedImages: derived.images,
    validatorErrors: validator.issues.numErrors,
    validatorWarnings: validator.issues.numWarnings,
  });
  proof(
    `${label}: exact native JSON/BIN, decoded PNGs, all sampled animation poses, standalone load without sidecar, canonical unchanged, exclusive exports, binary-only import`,
  );
  return { runtime, sidecar };
}

let client;
try {
  command([join(repo, 'scripts/create-workspace.mjs'), workspace, '--harness', 'codex']);
  await readFile(join(workspace, 'START.md'));
  await readFile(join(workspace, 'skills/kiln-author-asset/SKILL.md'));
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(repo, 'dist/mcp-server.mjs')],
    cwd: workspace,
    env,
    stderr: 'pipe',
  });
  client = new Client({ name: 'kiln_workspace', version: '1' });
  await client.connect(transport);
  const call = async (name, args) => {
    const result = await client.callTool({ name, arguments: args }, undefined, { timeout: 180000 });
    assert.notEqual(result.isError, true, JSON.stringify(result.content));
    const text = result.content.find((block) => block.type === 'text').text;
    try {
      return JSON.parse(text);
    } catch {
      return { text };
    }
  };
  await call('kiln_discover', { capabilities: true });
  proof('fresh generated workspace reaches its built-runtime kiln_workspace MCP');
  const source = `const meta = { name: 'Export Profile Demonstrator' };
async function build() {
  const root = createRoot('Demonstrator');
  const map = proceduralTexture({schemaVersion:2,size:64,usage:'albedo',name:'Paint',layers:[{op:'solid',color:0x60758d},{op:'noise',colorA:0x475468,colorB:0x99a5b4,scale:12,octaves:2,seed:9,opacity:0.25,blend:'overlay'}]});
  const paint = pbrMaterial({albedo:map,roughness:0.6,metalness:0.1});
  createPart('Base',boxGeo(1,0.2,1),paint,{parent:root,position:[0,0.1,0]});
  const arm = createPivot('Arm',[0,0.25,0],root);
  createPart('ArmArmor',boxGeo(0.25,1,0.25),paint,{parent:arm,position:[0,0.5,0]});
  return root;
}
function animate() {return [createClip('Swing',2,[rotationTrack('Joint_Arm',[{time:0,rotation:[0,0,-25]},{time:1,rotation:[0,0,25]},{time:2,rotation:[0,0,-25]}])])];}
`;
  await writeFile(join(workspace, 'demonstrator.kiln.js'), source, { flag: 'wx' });
  const ref = cli('source', 'demonstrator.kiln.js').match(/p_[a-f0-9]+/)[0];
  const rendered = await call('kiln_render', { programRef: ref });
  assert.equal(rendered.ok, true);
  const saved = await call('kiln_save', { programRef: ref, name: 'Export Profile Demonstrator' });
  assert.equal(saved.asset.editable, true);
  const asset = saved.asset;
  cli(
    'export',
    asset.assetId,
    asset.revisionId,
    '--out',
    join(workspace, 'demonstrator-editable.zip'),
  );
  const restored = JSON.parse(cli('asset', asset.assetId, asset.revisionId, '--restore'));
  assert.equal(restored.programRef, ref);
  proof(
    'new textured articulated source renders, saves, exports default editable ZIP and restores exact source',
  );
  await checkExport(asset, 'demonstrator');
  const exported = await call('kiln_export', {
    assetId: asset.assetId,
    revisionId: asset.revisionId,
    profile: 'runtime',
  });
  const files = new Map();
  for (const link of exported.resources) {
    const result = await client.readResource({ uri: link.uri });
    const content = result.contents[0];
    const bytes = content.blob ? Buffer.from(content.blob, 'base64') : Buffer.from(content.text);
    assert.equal(bytes.length, link.size);
    files.set(link.name, bytes);
  }
  assert.equal(
    jsonChunk(files.get('runtime.glb')).asset.extras.kilnProvenanceV1.metadata.sha256,
    sha(files.get('runtime.kiln-metadata.json')),
  );
  proof('built MCP runtime descriptors deliver hash-matching GLB and metadata bytes');
  await checkHttpResources(asset, files);
  const fixture = process.argv[2];
  if (fixture) {
    const original = await readFile(resolve(fixture));
    const imported = JSON.parse(cli('import', resolve(fixture), '--name', 'External real asset'))
      .assets[0];
    await checkExport(imported, 'external-asset');
    assert.deepEqual(await readFile(resolve(fixture)), original);
  }
  receipt.status = 'passed';
} catch (error) {
  receipt.status = 'failed';
  receipt.error = String(error.stack ?? error);
  throw error;
} finally {
  await client?.close();
  await writeFile(join(workspace, 'export-profile-receipt.json'), JSON.stringify(receipt, null, 2));
  console.log(`Receipt: ${join(workspace, 'export-profile-receipt.json')}`);
}
