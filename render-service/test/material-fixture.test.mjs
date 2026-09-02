import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { PNG } from 'pngjs';
import { buildMaterialChannelsFixture } from './generate-material-fixture.mjs';

const fixtureUrl = new URL('./fixtures/material-channels-v1.glb', import.meta.url);
const manifestUrl = new URL('./fixtures/material-channels-v1.manifest.json', import.meta.url);
const MATERIAL_CHANNELS_V1_SHA256 = 'sha256:8ef3e9e5f28303639fc1d28c8648dda2494aed4c11b74ad17cb30b7726a59a9e';

function sha256(bytes) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

function parseGlb(bytes) {
  assert.equal(bytes.readUInt32LE(0), 0x46546c67, 'GLB magic');
  assert.equal(bytes.readUInt32LE(4), 2, 'GLB version');
  assert.equal(bytes.readUInt32LE(8), bytes.length, 'GLB declared length');
  const jsonLength = bytes.readUInt32LE(12);
  assert.equal(bytes.readUInt32LE(16), 0x4e4f534a, 'JSON chunk type');
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8').trim());
  const binHeader = 20 + jsonLength;
  assert.equal(bytes.readUInt32LE(binHeader + 4), 0x004e4942, 'BIN chunk type');
  const binLength = bytes.readUInt32LE(binHeader);
  const bin = bytes.subarray(binHeader + 8, binHeader + 8 + binLength);
  return { json, bin };
}

function imageBytes(glb, image) {
  assert.equal(image.mimeType, 'image/png');
  assert.equal(image.uri, undefined, `${image.name} must not use an external URI`);
  assert.ok(Number.isInteger(image.bufferView), `${image.name} must be embedded`);
  const view = glb.json.bufferViews[image.bufferView];
  return glb.bin.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength);
}

function channelRange(png, channel) {
  const values = [];
  for (let i = channel; i < png.data.length; i += 4) values.push(png.data[i]);
  return { min: Math.min(...values), max: Math.max(...values) };
}

describe('material channel conformance fixture', () => {
  it('is byte-deterministic and bound to its checked-in SHA-256 manifest', async () => {
    const checkedIn = await readFile(fixtureUrl);
    const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));
    const generated = buildMaterialChannelsFixture();
    assert.equal(Buffer.compare(checkedIn, generated.glb), 0);
    assert.equal(sha256(checkedIn), MATERIAL_CHANNELS_V1_SHA256);
    assert.equal(manifest.glbSha256, sha256(checkedIn));
    assert.deepEqual(manifest, generated.manifest);
  });

  it('embeds every required PNG and binds every PBR channel explicitly', async () => {
    const glb = parseGlb(await readFile(fixtureUrl));
    const byName = Object.fromEntries(glb.json.materials.map((material) => [material.name, material]));
    const albedo = byName.AlbedoChecker;
    const normal = byName.NormalResponse;
    const orm = byName.SharedOrmResponse;
    const ao = byName.AoResponse;
    const emissive = byName.EmissiveResponse;
    const alpha = byName.AlphaResponse;

    assert.ok(albedo.pbrMetallicRoughness.baseColorTexture);
    assert.ok(normal.normalTexture);
    assert.ok(orm.pbrMetallicRoughness.metallicRoughnessTexture);
    assert.equal(
      orm.pbrMetallicRoughness.metallicRoughnessTexture.index,
      orm.occlusionTexture.index,
      'ORM material must share one packed texture for MR and AO',
    );
    assert.equal(ao.occlusionTexture.index, orm.occlusionTexture.index);
    assert.ok(emissive.emissiveTexture);
    assert.deepEqual(emissive.emissiveFactor, [1, 1, 1]);
    assert.ok(alpha.pbrMetallicRoughness.baseColorTexture);
    assert.equal(alpha.alphaMode, 'MASK');
    assert.equal(alpha.alphaCutoff, 0.5);

    assert.equal(glb.json.images.length, 5);
    for (const image of glb.json.images) {
      const png = PNG.sync.read(imageBytes(glb, image));
      assert.equal(png.width, 16);
      assert.equal(png.height, 16);
    }
    for (const mesh of glb.json.meshes) {
      const attributes = mesh.primitives[0].attributes;
      assert.ok(Number.isInteger(attributes.TEXCOORD_0));
      assert.ok(Number.isInteger(attributes.TEXCOORD_1));
      assert.ok(Number.isInteger(attributes.TANGENT));
    }
  });

  it('pins high-contrast source pixels for each statistical GPU assertion', async () => {
    const glb = parseGlb(await readFile(fixtureUrl));
    const decoded = Object.fromEntries(glb.json.images.map((image) => [
      image.name,
      PNG.sync.read(imageBytes(glb, image)),
    ]));
    assert.deepEqual(channelRange(decoded.AlbedoChecker, 0), { min: 18, max: 245 });
    assert.deepEqual(channelRange(decoded.NormalSplit, 0), { min: 32, max: 224 });
    assert.deepEqual(channelRange(decoded.SharedOrm, 0), { min: 32, max: 255 });
    assert.deepEqual(channelRange(decoded.SharedOrm, 1), { min: 32, max: 224 });
    assert.deepEqual(channelRange(decoded.SharedOrm, 2), { min: 24, max: 232 });
    assert.deepEqual(channelRange(decoded.EmissiveChecker, 0), { min: 0, max: 255 });
    assert.deepEqual(channelRange(decoded.AlphaChecker, 3), { min: 0, max: 255 });
  });
});
