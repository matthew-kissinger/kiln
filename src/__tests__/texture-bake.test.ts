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
import { renderGLB, renderSceneToGLB } from '../render';
import { bakeSceneTextures, ensureNormalMapTangents } from '../texture-bake';

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
  test('public renderGLB preserves baked procedural lineage instead of dropping the sidecar', async () => {
    const out = await renderGLB(`
const meta = { name: 'PublicLineage', category: 'prop' };
async function build() {
  const root = createRoot('PublicLineage');
  const albedo = proceduralTexture({
    size: 8,
    name: 'AuthoredChecker',
    layers: [
      { op: 'solid', color: 0x224466 },
      { op: 'checker', colorA: 0xffffff, colorB: 0x000000, squares: 2, blend: 'overlay' },
    ],
  });
  root.add(createPart('Body', boxGeo(1, 1, 1), pbrMaterial({ albedo }), {}));
  return root;
}
`);

    expect(out.bakedTextures).toHaveLength(1);
    expect(out.bakedTextures?.[0]).toMatchObject({
      schemaVersion: 1,
      texture: 'AuthoredChecker',
      node: 'Mesh_Body',
      slot: 'map',
      usage: 'albedo',
      mime: 'image/png',
      colorSpace: 'srgb',
      procedural: { schemaVersion: 2, size: 8, usage: 'albedo' },
    });
    expect(out.bakedTextures?.[0]?.procedural?.recipeHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(out.bakedTextures?.[0]?.imageSha256).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(out.artifactGlbSha256).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(out.bakedTextures?.[0]?.artifactGlbSha256).toBe(out.artifactGlbSha256);
  });

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
    expect(rec!.imageSha256).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(rec!.artifactGlbSha256).toBe(out.artifactGlbSha256);
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

  test('shared textures retain every node/material/slot binding while encoding once', async () => {
    const shared = albedoTexture('SharedSurface');
    const first = stdMaterial('FirstMaterial');
    first.map = shared;
    const second = stdMaterial('SecondMaterial');
    second.map = shared;
    const root = new THREE.Group();
    root.name = 'Root';
    root.add(
      new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), first),
      new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), second),
    );
    root.children[0]!.name = 'FirstNode';
    root.children[1]!.name = 'SecondNode';

    const warnings: string[] = [];
    const baked = await bakeSceneTextures(root, warnings);

    expect(warnings).toEqual([]);
    expect(baked).toHaveLength(1);
    expect(baked[0]?.bindings.map(({ node, material, slot }) => [node, material, slot])).toEqual([
      ['FirstNode', 'FirstMaterial', 'map'],
      ['SecondNode', 'SecondMaterial', 'map'],
    ]);
    expect(baked[0]?.imageSha256).toMatch(/^sha256:[0-9a-f]{64}$/);
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

// -----------------------------------------------------------------------------
// Tangents — a normal map without them is non-portable
// -----------------------------------------------------------------------------

describe('normal-mapped meshes get a tangent basis', () => {
  /** Box geometry with UVs, which is what a normal map needs to be sampled at all. */
  function uvBox(): THREE.BufferGeometry {
    return new THREE.BoxGeometry(1, 1, 1);
  }

  function normalMapped(name = 'NormalMat'): THREE.MeshStandardMaterial {
    const mat = stdMaterial(name);
    const n = checkerTexture();
    n.name = 'NormalTex';
    mat.normalMap = n;
    return mat;
  }

  test('the Khronos tangent-space warning is gone and TANGENT is in the file', async () => {
    // Measured before this pass existed: the same asset validated with
    // MESH_PRIMITIVE_GENERATED_TANGENT_SPACE and carried no tangent accessor.
    const mat = normalMapped();
    const root = new THREE.Object3D();
    root.name = 'Asset';
    const mesh = new THREE.Mesh(uvBox(), mat);
    mesh.name = 'Mesh_Box';
    root.add(mesh);

    const out = await renderSceneToGLB(root);

    expect(out.warnings).toEqual([]);
    const issues = JSON.stringify(out.gltfValidation);
    expect(issues).not.toContain('GENERATED_TANGENT_SPACE');
    expect(glbText(out.bytes)).toContain('TANGENT');
  });

  test('tangents are unit length, perpendicular to the normal, with ±1 handedness', () => {
    const geometry = uvBox();
    const mesh = new THREE.Mesh(geometry, normalMapped());
    mesh.name = 'Mesh_Box';
    const root = new THREE.Object3D();
    root.add(mesh);

    expect(ensureNormalMapTangents(root, [])).toBe(1);

    const tangent = geometry.getAttribute('tangent')!;
    expect(tangent.itemSize).toBe(4);
    const normal = geometry.getAttribute('normal')!;
    for (let i = 0; i < tangent.count; i++) {
      const t = new THREE.Vector3(tangent.getX(i), tangent.getY(i), tangent.getZ(i));
      const n = new THREE.Vector3(normal.getX(i), normal.getY(i), normal.getZ(i));
      expect(t.length()).toBeCloseTo(1, 5);
      expect(Math.abs(t.dot(n))).toBeLessThan(1e-5);
      expect(Math.abs(tangent.getW(i))).toBe(1);
    }
  });

  test('a mesh with no normal map is left alone — the attribute changes the bytes', () => {
    const geometry = uvBox();
    const mesh = new THREE.Mesh(geometry, stdMaterial('Plain'));
    const root = new THREE.Object3D();
    root.add(mesh);

    expect(ensureNormalMapTangents(root, [])).toBe(0);
    expect(geometry.getAttribute('tangent')).toBeUndefined();
  });

  test('an existing tangent attribute is never recomputed', () => {
    const geometry = uvBox();
    const mine = new THREE.BufferAttribute(
      new Float32Array(geometry.getAttribute('position')!.count * 4),
      4,
    );
    geometry.setAttribute('tangent', mine);
    const mesh = new THREE.Mesh(geometry, normalMapped());
    const root = new THREE.Object3D();
    root.add(mesh);

    expect(ensureNormalMapTangents(root, [])).toBe(0);
    expect(geometry.getAttribute('tangent')).toBe(mine);
  });

  test('a normal-mapped mesh with no UVs is warned about, pointing at autoUnwrap', () => {
    const geometry = uvBox();
    geometry.deleteAttribute('uv');
    const mesh = new THREE.Mesh(geometry, normalMapped());
    mesh.name = 'Mesh_NoUv';
    const root = new THREE.Object3D();
    root.add(mesh);

    const warnings: string[] = [];
    expect(ensureNormalMapTangents(root, warnings)).toBe(0);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('"Mesh_NoUv"');
    expect(warnings[0]).toContain('autoUnwrap');
  });

  test('a non-indexed normal-mapped mesh is warned about by name', () => {
    const geometry = uvBox().toNonIndexed();
    const mesh = new THREE.Mesh(geometry, normalMapped());
    mesh.name = 'Mesh_Flat';
    const root = new THREE.Object3D();
    root.add(mesh);

    const warnings: string[] = [];
    expect(ensureNormalMapTangents(root, warnings)).toBe(0);
    expect(warnings[0]).toContain('"Mesh_Flat"');
    expect(warnings[0]).toContain('not indexed');
  });

  test('geometry shared by two normal-mapped meshes is computed once', () => {
    const geometry = uvBox();
    const root = new THREE.Object3D();
    for (const i of [0, 1]) {
      const mesh = new THREE.Mesh(geometry, normalMapped(`Mat${i}`));
      mesh.name = `Mesh_${i}`;
      root.add(mesh);
    }
    expect(ensureNormalMapTangents(root, [])).toBe(1);
  });
});
