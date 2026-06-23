/**
 * LOD chain generator tests — uses a trivial procedural mesh so the suite
 * stays fast and offline.
 */

import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';

import { renderSceneToGLB } from '../../render';
import { generateLODChain } from '../generate';

// Build a small GLB fixture with ~1000 triangles — enough for meshopt to bite.
async function makeFixture(segments = 32): Promise<Buffer> {
  const root = new THREE.Group();
  root.name = 'Fixture';
  const geom = new THREE.SphereGeometry(1, segments, segments);
  const mat = new THREE.MeshStandardMaterial({ color: 0x00aa66 });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.name = 'Sphere';
  root.add(mesh);

  const { bytes } = await renderSceneToGLB(root, {});
  return Buffer.from(bytes);
}

describe('generateLODChain', () => {
  test('default ratios produce 4 levels with descending tri counts', async () => {
    const fixture = await makeFixture(32);
    const result = await generateLODChain(fixture);

    expect(result.lods).toHaveLength(4);
    expect(result.source.triangles).toBeGreaterThan(1000);

    // LOD0 preserves the source exactly (ratio = 1.0).
    expect(result.lods[0]!.ratio).toBe(1.0);
    expect(result.lods[0]!.triangles).toBe(result.source.triangles);

    // Each subsequent LOD has strictly fewer triangles.
    for (let i = 1; i < result.lods.length; i++) {
      expect(result.lods[i]!.triangles).toBeLessThan(result.lods[i - 1]!.triangles);
    }

    // All level GLBs are valid binary (glTF magic = 0x46546C67 "glTF").
    for (const lod of result.lods) {
      expect(lod.glb.readUInt32LE(0)).toBe(0x46546c67);
      expect(lod.bytes).toBe(lod.glb.byteLength);
    }
  }, 60_000);

  test('custom ratios honored', async () => {
    const fixture = await makeFixture(24);
    const result = await generateLODChain(fixture, { ratios: [1.0, 0.2] });
    expect(result.lods).toHaveLength(2);
    expect(result.lods[0]!.ratio).toBe(1.0);
    expect(result.lods[1]!.ratio).toBe(0.2);
    // 20% target should leave far fewer than the source tris.
    expect(result.lods[1]!.triangles).toBeLessThan(result.source.triangles * 0.6);
  }, 60_000);

  test('ratio = 1.0 is a pass-through (no simplification)', async () => {
    const fixture = await makeFixture(16);
    const result = await generateLODChain(fixture, { ratios: [1.0] });
    expect(result.lods).toHaveLength(1);
    expect(result.lods[0]!.triangles).toBe(result.source.triangles);
  }, 30_000);
});
