import { createHash } from 'node:crypto';
import { expect, test } from 'bun:test';
import { WebIO } from '@gltf-transform/core';
import { KHRTextureBasisu } from '@gltf-transform/extensions';

import { bindBakedTextureProvenanceToFinalGlb, renderGLBInProcess } from '../render';

const SOURCE = `
const meta = { name: 'MaterialLineage', category: 'prop' };
async function build() {
  const root = createRoot('MaterialLineage');
  const albedo = proceduralTexture({ schemaVersion: 2, size: 8, usage: 'albedo', name: 'Albedo', layers: [{ op: 'noise', colorA: 0x102030, colorB: 0x8090a0, scale: 2 }] });
  const normal = normalMapFromHeight(albedo, { name: 'Normal' });
  const mr = proceduralTexture({ schemaVersion: 2, size: 8, usage: 'metallicRoughness', name: 'MetallicRoughness', layers: [{ op: 'checker', colorA: 0x0040c0, colorB: 0x00c040, squares: 2 }] });
  const emissive = proceduralTexture({ schemaVersion: 2, size: 8, usage: 'emissive', name: 'Emissive', layers: [{ op: 'stripes', colorA: 0x00ffff, colorB: 0x000000, count: 2 }] });
  root.add(createPart('Body', boxUnwrap(boxGeo(1, 1, 1)), pbrMaterial({ albedo, normal, metallicRoughness: mr, emissive }), {}));
  return root;
}
`;

test('rebinds every baked material slot to exact final embedded image and GLB bytes', async () => {
  const source = await renderGLBInProcess(SOURCE);
  expect(source.bakedTextures?.map((texture) => texture.usage).sort()).toEqual([
    'albedo',
    'emissive',
    'metallicRoughness',
    'normal',
  ]);

  const io = new WebIO().registerExtensions([KHRTextureBasisu]);
  const doc = await io.readBinary(source.glb);
  for (const [index, texture] of doc.getRoot().listTextures().entries()) {
    texture.setImage(Uint8Array.from([0xab, 0x4b, 0x54, 0x58, index])).setMimeType('image/ktx2');
  }
  doc.createExtension(KHRTextureBasisu).setRequired(true);
  const finalGlb = await io.writeBinary(doc);
  const finalGlbSha256 = `sha256:${createHash('sha256').update(finalGlb).digest('hex')}` as const;

  const rebound = await bindBakedTextureProvenanceToFinalGlb(source.bakedTextures ?? [], finalGlb);

  expect(rebound).toHaveLength(4);
  expect(rebound.map((texture) => texture.slot).sort()).toEqual([
    'emissiveMap',
    'map',
    'normalMap',
    'roughnessMap',
  ]);
  for (const texture of rebound) {
    expect(texture.artifactGlbSha256).toBe(finalGlbSha256);
    expect(texture.finalMime).toBe('image/ktx2');
    expect(texture.finalImageSha256).toMatch(/^sha256:[0-9a-f]{64}$/);
  }
  expect(new Set(rebound.map((texture) => texture.finalImageSha256)).size).toBe(4);
});
