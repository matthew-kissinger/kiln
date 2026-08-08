/**
 * T2.3 kit contract.
 *
 * The pass rewrites the bytes we persist and hand to users, so what matters is
 * not that it does something but that what it produces is still a valid glTF, is
 * still the same asset by default, and degrades honestly when the environment
 * cannot do part of the job.
 */
import { describe, expect, test } from 'bun:test';

import { WebIO } from '@gltf-transform/core';
import { KHRMaterialsVariants, KHRTextureBasisu } from '@gltf-transform/extensions';

import { findKtxEncoder, resetKtxEncoderProbe, type KitVariantSpec } from '../kit';
import { packKitGlb, renderGLB } from '../render';

const io = (): WebIO => new WebIO().registerExtensions([KHRMaterialsVariants, KHRTextureBasisu]);

/** Noisy, like a photographic scan. This is the case KTX2 wins decisively. */
const NOISY = `
const meta = { name: 'Rock', category: 'prop' };

async function build() {
  const root = createRoot('Rock');
  const albedo = proceduralTexture({
    size: 256,
    layers: [
      { op: 'solid', color: 0x8a5a2b },
      { op: 'noise', colorA: 0x5c3a1a, colorB: 0xa07040, octaves: 5, scale: 6, blend: 'multiply' },
      { op: 'noise', colorA: 0x2b1a0c, colorB: 0xd0b090, octaves: 4, scale: 20, blend: 'overlay' },
    ],
  });
  root.add(createPart('Body', boxGeo(1, 1, 1), pbrMaterial({ albedo, roughness: 0.9 }), {}));
  return root;
}
`;

/** Flat two-colour pattern. PNG entropy-codes this to almost nothing. */
const TEXTURED = `
const meta = { name: 'Crate', category: 'prop' };

async function build() {
  const root = createRoot('Crate');
  const albedo = proceduralTexture({
    size: 64,
    layers: [
      { op: 'solid', color: 0x8a5a2b },
      { op: 'bricks', brick: 0xc09050, mortar: 0x6a4020, scale: 4, blend: 'overlay' },
    ],
  });
  root.add(createPart('Body', boxGeo(1, 1, 1), pbrMaterial({ albedo, roughness: 0.8 }), {}));
  return root;
}
`;

const UNTEXTURED = `
const meta = { name: 'Blocks', category: 'prop' };

async function build() {
  const root = createRoot('Blocks');
  root.add(createPart('A', boxGeo(1, 1, 1), gameMaterial(0x3355aa), {}));
  root.add(createPart('B', boxGeo(1, 1, 1), gameMaterial(0xaa4433), { position: [1.2, 0, 0] }));
  return root;
}
`;

/** A flat texture plus an untextured part, so variants land and the file changes
 *  even when the KTX2 encode declines. */
const FLAT_MIXED = `
const meta = { name: 'Shelf', category: 'prop' };

async function build() {
  const root = createRoot('Shelf');
  const albedo = proceduralTexture({
    size: 64,
    layers: [
      { op: 'solid', color: 0x8a5a2b },
      { op: 'bricks', brick: 0xc09050, mortar: 0x6a4020, scale: 4, blend: 'overlay' },
    ],
  });
  root.add(createPart('Body', boxGeo(1, 1, 1), pbrMaterial({ albedo, roughness: 0.8 }), {}));
  root.add(createPart('Leg', boxGeo(0.2, 1, 0.2), gameMaterial(0x3355aa), { position: [1, 0, 0] }));
  return root;
}
`;

const PALETTES: KitVariantSpec[] = [
  { name: 'Rust', slots: [{ color: '#8a3b21' }, { color: '#c76a3a' }] },
  { name: 'Frost', slots: [{ color: '#9fc9d8' }, { color: '#e8f2f6' }] },
];

async function glbOf(code: string): Promise<Uint8Array> {
  return (await renderGLB(code, {})).glb;
}

describe('palette colourways as KHR_materials_variants', () => {
  test('one file carries every palette, and the default look is unchanged', async () => {
    const original = await glbOf(UNTEXTURED);
    const packed = await packKitGlb(original, { variants: PALETTES, ktx2: false });

    expect(packed).toBeDefined();
    expect(packed!.summary.variantsAdded).toEqual(['Rust', 'Frost']);
    expect(packed!.gltfValidation.issues.numErrors).toBe(0);

    const doc = await io().readBinary(packed!.bytes);
    const extension = doc
      .getRoot()
      .listExtensionsUsed()
      .map((value) => value.extensionName);
    expect(extension).toContain('KHR_materials_variants');

    // The material a primitive resolves to with NO variant selected must still be
    // the authored one. A viewer that ignores the extension has to show exactly
    // what it showed before this pass existed.
    const before = await new WebIO().readBinary(original);
    const beforeColors = before
      .getRoot()
      .listMeshes()
      .flatMap((mesh) => mesh.listPrimitives().map((p) => p.getMaterial()?.getBaseColorFactor()));
    const afterColors = doc
      .getRoot()
      .listMeshes()
      .flatMap((mesh) => mesh.listPrimitives().map((p) => p.getMaterial()?.getBaseColorFactor()));
    expect(afterColors).toEqual(beforeColors);
  });

  test('a textured material is left alone, exactly as the palette snap leaves it', async () => {
    const packed = await packKitGlb(await glbOf(TEXTURED), { variants: PALETTES, ktx2: false });

    // A textured material carries its own colour. Recolouring the factor would
    // multiply against the texture and mud it, which is why snapGlbToPalette
    // makes the same exception.
    expect(packed?.summary.variantMaterialsCreated ?? 0).toBe(0);
    expect(packed?.summary.variantsAdded ?? []).toEqual([]);
  });

  test('no variants requested means no extension is declared', async () => {
    const packed = await packKitGlb(await glbOf(UNTEXTURED), { ktx2: false });

    // Nothing to do and nothing done: returning bytes here would persist a
    // rewrite that changed only the file's hash.
    expect(packed).toBeUndefined();
  });
});

describe('KTX2 supercompression', () => {
  test('a missing encoder is reported as a capability, not a failure', async () => {
    resetKtxEncoderProbe();
    const previous = process.env['KILN_KTX_BIN'];
    process.env['KILN_KTX_BIN'] = '';
    try {
      // Simulated by asking for an encoder that cannot exist. The real point is
      // that offline CI and a fresh checkout have no KTX-Software, and failing
      // the whole packaging step there would break work unrelated to textures.
      const packed = await packKitGlb(await glbOf(UNTEXTURED), {
        variants: PALETTES,
        ktx2: true,
      });

      expect(packed).toBeDefined();
      // Variants still landed. Only the texture step is conditional.
      expect(packed!.summary.variantsAdded).toEqual(['Rust', 'Frost']);
      if (!packed!.summary.ktx2.applied) {
        expect(packed!.summary.ktx2.skipped).toBeTruthy();
      }
    } finally {
      if (previous === undefined) delete process.env['KILN_KTX_BIN'];
      else process.env['KILN_KTX_BIN'] = previous;
      resetKtxEncoderProbe();
    }
  });

  test('encoding shrinks textures and the result still validates', async () => {
    // Gated at run time, not at collection time: CI has no KTX-Software and the
    // developer machine that produced the size measurement does.
    if (!(await findKtxEncoder())) return;
    {
      const original = await glbOf(NOISY);
      const packed = await packKitGlb(original, { ktx2: true });

      expect(packed).toBeDefined();
      expect(packed!.summary.ktx2.applied).toBe(true);
      expect(packed!.summary.ktx2.texturesEncoded).toBeGreaterThan(0);
      // The measurement this whole task rests on. Anything short of a large win
      // would not justify a binary in a container image.
      expect(packed!.summary.ktx2.bytesAfter).toBeLessThan(packed!.summary.ktx2.bytesBefore * 0.5);
      expect(packed!.bytes.byteLength).toBeLessThan(original.byteLength);
      // Khronos, not our own opinion of validity.
      expect(packed!.gltfValidation.issues.numErrors).toBe(0);

      const doc = await io().readBinary(packed!.bytes);
      expect(
        doc
          .getRoot()
          .listExtensionsUsed()
          .map((value) => value.extensionName),
      ).toContain('KHR_texture_basisu');
      // Required, not merely used: a consumer that cannot transcode must be told
      // it cannot open this file rather than silently showing it untextured.
      expect(
        doc
          .getRoot()
          .listExtensionsRequired()
          .map((value) => value.extensionName),
      ).toContain('KHR_texture_basisu');
      for (const texture of doc.getRoot().listTextures()) {
        expect(texture.getMimeType()).toBe('image/ktx2');
      }
    }
  });

  test('a texture PNG already compresses better is left as PNG', async () => {
    if (!(await findKtxEncoder())) return;
    {
      // ETC1S is fixed-rate with a container and a mipmap chain; PNG is
      // entropy-coded. On a flat two-colour pattern PNG wins outright, and
      // encoding anyway would inflate the file AND require a transcoder to open
      // it. Both costs, none of the benefit.
      const original = await glbOf(FLAT_MIXED);
      const packed = await packKitGlb(original, { variants: PALETTES, ktx2: true });

      expect(packed).toBeDefined();
      expect(packed!.summary.ktx2.applied).toBe(false);
      expect(packed!.summary.ktx2.skipped).toMatch(/KTX2 was not smaller/);
      // Measured, so the decision is visible rather than inferred.
      expect(packed!.summary.ktx2.bytesAfter).toBeGreaterThan(packed!.summary.ktx2.bytesBefore);

      const doc = await io().readBinary(packed!.bytes);
      expect(
        doc
          .getRoot()
          .listExtensionsRequired()
          .map((value) => value.extensionName),
      ).not.toContain('KHR_texture_basisu');
      for (const texture of doc.getRoot().listTextures()) {
        expect(texture.getMimeType()).toBe('image/png');
      }
    }
  });
});
