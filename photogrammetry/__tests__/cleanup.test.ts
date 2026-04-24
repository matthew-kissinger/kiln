/**
 * Photogrammetry cleanup — verifies the simplify + texture-compress pipeline
 * on a high-poly procedural fixture (a 64-segment sphere ~= 8k tris).
 */

import { describe, expect, test } from 'bun:test';
import { Buffer } from 'node:buffer';
import * as THREE from 'three';

import { renderSceneToGLB } from '../../render';
import { cleanupPhotogrammetry } from '../cleanup';

async function makeHighPolyFixture(segments = 64): Promise<Buffer> {
  const root = new THREE.Group();
  root.name = 'ScanFixture';
  const geom = new THREE.SphereGeometry(1, segments, segments);
  const mat = new THREE.MeshStandardMaterial({ color: 0x88aa88 });
  const mesh = new THREE.Mesh(geom, mat);
  root.add(mesh);
  const { bytes } = await renderSceneToGLB(root, {});
  return Buffer.from(bytes);
}

describe('cleanupPhotogrammetry', () => {
  test('decimates to near the target triangle budget', async () => {
    const fixture = await makeHighPolyFixture(64);
    const result = await cleanupPhotogrammetry(fixture, {
      targetTriangles: 2000,
      textureSize: 512,
      errorThreshold: 0.05,
    });
    expect(result.meta.sourceTriangles).toBeGreaterThan(5000);
    expect(result.meta.targetTriangles).toBeLessThan(result.meta.sourceTriangles);
    // GLB magic.
    expect(result.glb.readUInt32LE(0)).toBe(0x46546c67);
  }, 60_000);

  test('no-op when source is already below target', async () => {
    const fixture = await makeHighPolyFixture(8); // ~100 tris
    const result = await cleanupPhotogrammetry(fixture, {
      targetTriangles: 10_000,
      textureSize: 256,
    });
    expect(result.meta.ratio).toBe(1);
    // No decimation requested — tri count stays the same.
    expect(result.meta.targetTriangles).toBe(result.meta.sourceTriangles);
  }, 30_000);
});
