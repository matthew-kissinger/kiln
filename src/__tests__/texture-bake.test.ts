/**
 * T2.2 — in-memory textures are baked to PNG at export, or warned about by name.
 *
 * The behaviour these pin was measured before the bake pass existed: a
 * `MeshStandardMaterial` carrying a hand-built 8x8 checker `map` exported 1912
 * bytes of valid GLB containing no image, with an empty `warnings` array and a
 * QA disposition of `pass` under `KILN_QA_MODE=off`. Nothing anywhere said the
 * texture had been dropped.
 */

import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';
import { renderSceneToGLB } from '../render';
import { bakeSceneTextures } from '../texture-bake';

// -----------------------------------------------------------------------------
// Fixtures
// -----------------------------------------------------------------------------

/** Deterministic checker with no random component, so byte comparisons mean something. */
function checkerTexture(size = 8, channels: 3 | 4 = 4): THREE.DataTexture {
  const data = new Uint8Array(size * size * channels);
  for (let i = 0; i < size * size; i++) {
    const x = i % size;
    const y = (i / size) | 0;
    const v = (x + y) % 2 === 0 ? 220 : 40;
    data[i * channels] = v;
    data[i * channels + 1] = 30;
    data[i * channels + 2] = 255 - v;
    if (channels === 4) data[i * channels + 3] = 255;
  }
  const tex = new THREE.DataTexture(
    data,
    size,
    size,
    channels === 4 ? THREE.RGBAFormat : THREE.RGBFormat,
    THREE.UnsignedByteType,
  );
  tex.needsUpdate = true;
  return tex;
}

function albedoTexture(name: string, size = 8, channels: 3 | 4 = 4): THREE.DataTexture {
  const tex = checkerTexture(size, channels);
  tex.name = name;
  // The bake pass never sets this; an albedo map that omits it blocks QA on
  // purpose. See the color-space test below.
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function sceneWith(material: THREE.Material, meshName = 'Mesh_Box'): THREE.Object3D {
  const root = new THREE.Object3D();
  root.name = 'Asset';
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
  mesh.name = meshName;
  root.add(mesh);
  return root;
}

function stdMaterial(name: string): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff });
  m.name = name;
  return m;
}

const glbText = (bytes: Uint8Array): string => Buffer.from(bytes).toString('latin1');

// -----------------------------------------------------------------------------
// The texture actually reaches the file
// -----------------------------------------------------------------------------

describe('procedural textures are baked into the GLB', () => {
  test('a hand-built DataTexture is encoded, embedded, and reported — not dropped', async () => {
    const mat = stdMaterial('ProcMat');
    mat.map = albedoTexture('ProcChecker');

    const out = await renderSceneToGLB(sceneWith(mat));

    // The regression this exists to catch: an image in the file, and a QA
    // verdict reached with that image present.
    expect(glbText(out.bytes)).toContain('\x89PNG');
    expect(glbText(out.bytes)).toContain('ProcChecker');
    expect(out.qaReport.disposition).toBe('pass');
    expect(out.warnings).toEqual([]);

    expect(out.bakedTextures).toHaveLength(1);
    const [rec] = out.bakedTextures!;
    expect(rec).toMatchObject({
      schemaVersion: 1,
      texture: 'ProcChecker',
      material: 'ProcMat',
      slot: 'map',
      usage: 'albedo',
      width: 8,
      height: 8,
      channels: 4,
    });
    expect(rec!.bytes).toBeGreaterThan(0);
    expect(rec!.sha1).toMatch(/^[0-9a-f]{40}$/);
  });

  test('three-channel RGB pixels bake as well as RGBA', async () => {
    const mat = stdMaterial('RgbMat');
    mat.map = albedoTexture('RgbChecker', 8, 3);

    const out = await renderSceneToGLB(sceneWith(mat));

    expect(out.warnings).toEqual([]);
    expect(out.bakedTextures?.[0]).toMatchObject({ channels: 3, width: 8, height: 8 });
    expect(glbText(out.bytes)).toContain('\x89PNG');
  });

  test('the non-PBR path is covered too — a Lambert map was just as silent', async () => {
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    mat.name = 'LambertMat';
    mat.map = albedoTexture('LambertTex');

    const out = await renderSceneToGLB(sceneWith(mat));

    expect(out.bakedTextures).toHaveLength(1);
    expect(out.bakedTextures?.[0]?.slot).toBe('map');
    expect(glbText(out.bytes)).toContain('\x89PNG');
  });

  test('every bridgeable slot bakes with the usage that slot implies', async () => {
    const mat = stdMaterial('MultiSlot');
    mat.map = albedoTexture('Albedo');
    const normal = checkerTexture();
    normal.name = 'Normal';
    mat.normalMap = normal;
    const rough = checkerTexture();
    rough.name = 'Rough';
    mat.roughnessMap = rough;

    const warnings: string[] = [];
    const baked = await bakeSceneTextures(sceneWith(mat), warnings);

    expect(warnings).toEqual([]);
    expect(baked.map((b) => [b.slot, b.usage])).toEqual([
      ['map', 'albedo'],
      ['normalMap', 'normal'],
      ['roughnessMap', 'roughness'],
    ]);
  });
});

// -----------------------------------------------------------------------------
// Determinism — T2.2's stated acceptance criterion
// -----------------------------------------------------------------------------

describe('determinism', () => {
  test('the same pixels produce the same PNG bytes across independent renders', async () => {
    const build = () => {
      const mat = stdMaterial('DetMat');
      mat.map = albedoTexture('DetTex');
      return sceneWith(mat);
    };

    const a = await renderSceneToGLB(build());
    const b = await renderSceneToGLB(build());

    expect(a.bakedTextures?.[0]?.sha1).toBe(b.bakedTextures![0]!.sha1);
    // Byte-identical GLBs, not merely identical textures: this is the property
    // the pinned-SHA fixture corpus depends on staying true.
    expect(Buffer.compare(Buffer.from(a.bytes), Buffer.from(b.bytes))).toBe(0);
  });

  test('different pixels produce a different hash (the check above can fail)', async () => {
    const matA = stdMaterial('M');
    matA.map = albedoTexture('T', 8);
    const matB = stdMaterial('M');
    matB.map = albedoTexture('T', 16);

    const a = await bakeSceneTextures(sceneWith(matA), []);
    const b = await bakeSceneTextures(sceneWith(matB), []);

    expect(a[0]!.sha1).not.toBe(b[0]!.sha1);
  });
});

// -----------------------------------------------------------------------------
// What cannot be baked is named, not swallowed
// -----------------------------------------------------------------------------

describe('unbakeable textures warn by material and slot', () => {
  test('float pixel data is reported as unbakeable, and does not throw', async () => {
    const mat = stdMaterial('FloatMat');
    const tex = new THREE.DataTexture(
      new Float32Array(8 * 8 * 4),
      8,
      8,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    tex.name = 'FloatTex';
    mat.map = tex;

    const warnings: string[] = [];
    const baked = await bakeSceneTextures(sceneWith(mat), warnings);

    expect(baked).toEqual([]);
    expect(warnings).toHaveLength(1);
    // The three facts that make it actionable: which texture, which material,
    // which slot — none of which the bridge itself could have named.
    expect(warnings[0]).toContain('"FloatTex"');
    expect(warnings[0]).toContain('"FloatMat"');
    expect(warnings[0]).toContain('(map)');
    expect(warnings[0]).toContain('float');
  });

  test('a texture with no readable pixels is reported, naming the slot', async () => {
    const mat = stdMaterial('EmptyMat');
    const tex = new THREE.Texture();
    tex.name = 'NoPixels';
    mat.normalMap = tex;

    const warnings: string[] = [];
    const baked = await bakeSceneTextures(sceneWith(mat), warnings);

    expect(baked).toEqual([]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('"NoPixels"');
    expect(warnings[0]).toContain('(normalMap)');
  });

  test('a byte count that is neither RGB nor RGBA is reported with the numbers', async () => {
    const mat = stdMaterial('RaggedMat');
    // 8x8 at 2 bytes/pixel — a plausible mistake (luminance+alpha), unsupported.
    const tex = new THREE.DataTexture(new Uint8Array(8 * 8 * 2), 8, 8);
    tex.name = 'Ragged';
    mat.map = tex;

    const warnings: string[] = [];
    await bakeSceneTextures(sceneWith(mat), warnings);

    expect(warnings[0]).toContain('128 bytes for 8x8');
  });

  test('one bad slot does not stop the others from baking', async () => {
    const mat = stdMaterial('MixedMat');
    mat.map = albedoTexture('GoodTex');
    const bad = new THREE.Texture();
    bad.name = 'BadTex';
    mat.emissiveMap = bad;

    const warnings: string[] = [];
    const baked = await bakeSceneTextures(sceneWith(mat), warnings);

    expect(baked.map((b) => b.texture)).toEqual(['GoodTex']);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('"BadTex"');
  });
});

// -----------------------------------------------------------------------------
// Boundaries: what the pass must NOT do
// -----------------------------------------------------------------------------

describe('bake boundaries', () => {
  test('an already-encoded texture is left exactly as loadTexture left it', async () => {
    const mat = stdMaterial('LoadedMat');
    const tex = albedoTexture('Loaded');
    const original = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]);
    (tex.userData as Record<string, unknown>)['encoded'] = {
      mime: 'image/png',
      bytes: original,
    };
    mat.map = tex;

    const warnings: string[] = [];
    const baked = await bakeSceneTextures(sceneWith(mat), warnings);

    expect(baked).toEqual([]);
    expect(warnings).toEqual([]);
    expect((tex.userData as Record<string, unknown>)['encoded']).toEqual({
      mime: 'image/png',
      bytes: original,
    });
  });

  test('a texture shared by two materials is encoded once and stays shared', async () => {
    const shared = albedoTexture('SharedTex');
    const matA = stdMaterial('MatA');
    matA.map = shared;
    const matB = stdMaterial('MatB');
    matB.map = shared;

    const root = new THREE.Object3D();
    root.name = 'Asset';
    for (const [i, m] of [matA, matB].entries()) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), m);
      mesh.name = `Mesh_${i}`;
      root.add(mesh);
    }

    const warnings: string[] = [];
    const baked = await bakeSceneTextures(root, warnings);

    // Encoding twice would be wasted work; cloning would break the bridge's
    // texture cache, which dedupes by object identity.
    expect(baked).toHaveLength(1);
    expect(matA.map).toBe(matB.map);
  });

  test('color space is never set for the author — a linear albedo still blocks', async () => {
    const mat = stdMaterial('LinearMat');
    const tex = checkerTexture();
    tex.name = 'LinearAlbedo';
    // Deliberately left at the DataTexture default (linear) while filling the
    // sRGB `map` slot.
    mat.map = tex;

    const warnings: string[] = [];
    await bakeSceneTextures(sceneWith(mat), warnings);

    // Baked (so the pixels are exportable) but still honestly described as
    // linear, so QA can catch the mismatch instead of the pass hiding it.
    expect(warnings).toEqual([]);
    const meta = (tex.userData as Record<string, unknown>)['kilnTexture'] as {
      colorSpace: string;
    };
    expect(meta.colorSpace).toBe('linear');
    expect(tex.colorSpace).toBe(THREE.NoColorSpace);

    await expect(renderSceneToGLB(sceneWith(mat))).rejects.toThrow('MAT_TEXTURE_COLOR_SPACE');
  });

  test('an untextured scene bakes nothing and reports nothing', async () => {
    const out = await renderSceneToGLB(sceneWith(stdMaterial('Plain')));
    expect(out.bakedTextures).toBeUndefined();
    expect(out.warnings).toEqual([]);
  });
});
