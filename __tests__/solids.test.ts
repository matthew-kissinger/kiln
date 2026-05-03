/**
 * Wave 2A: CSG primitives via manifold-3d.
 *
 * Smoke-tests boolUnion / boolDiff / boolIntersect / hull end-to-end:
 * three.js geometry -> Manifold -> result -> three.js Mesh -> GLB bytes.
 *
 * These tests pay the ~100ms WASM init on the first manifold call. Keep
 * them in a single describe block so init happens once.
 */

import { describe, it, expect } from 'bun:test';
import * as THREE from 'three';
import {
  createRoot,
  createPart,
  boxGeo,
  cylinderGeo,
  sphereGeo,
  gameMaterial,
} from '../primitives';
import { boolUnion, boolDiff, boolIntersect, hull } from '../solids';
import { renderSceneToGLB } from '../render';

describe('Wave 2A: CSG primitives (manifold-3d)', () => {
  it('boolUnion merges two boxes into a watertight mesh', async () => {
    const a = new THREE.Mesh(boxGeo(1, 1, 1), gameMaterial(0xff0000));
    const b = new THREE.Mesh(boxGeo(1, 1, 1), gameMaterial(0xff0000));
    b.position.set(0.5, 0, 0);

    const merged = await boolUnion('Merged', a, b);
    expect(merged).toBeInstanceOf(THREE.Mesh);
    const posCount = (merged.geometry.getAttribute('position') as THREE.BufferAttribute)
      .count;
    expect(posCount).toBeGreaterThan(0);
  });

  it('boolDiff carves a hole (cylinder through box)', async () => {
    const body = new THREE.Mesh(boxGeo(2, 2, 2), gameMaterial(0x888888));
    const hole = new THREE.Mesh(cylinderGeo(0.4, 0.4, 3, 16), gameMaterial(0x000000));

    const pierced = await boolDiff('Pierced', body, hole);
    // Default output is flat-shaded (non-indexed): count positions/3.
    const posCount = (pierced.geometry.getAttribute('position') as THREE.BufferAttribute).count;
    const piercedTris = pierced.geometry.index
      ? pierced.geometry.index.count / 3
      : posCount / 3;
    // A pierced box has more triangles than a plain box (12).
    expect(piercedTris).toBeGreaterThan(12);
  });

  it('builds a gear: cylinder minus 8 radially-arrayed box cutters', async () => {
    const root = createRoot('Gear');
    const body = new THREE.Mesh(cylinderGeo(1, 1, 0.3, 32), gameMaterial(0xaaaaaa));

    // 8 cutters radially arrayed around the Y axis at radius 1.1
    const cutters: THREE.Mesh[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const c = new THREE.Mesh(boxGeo(0.4, 0.4, 0.4), gameMaterial(0x000000));
      c.position.set(Math.cos(angle) * 1.1, 0, Math.sin(angle) * 1.1);
      cutters.push(c);
    }

    const gear = await boolDiff('Gear', body, ...cutters);
    root.add(gear);

    const result = await renderSceneToGLB(root);
    expect(result.bytes.byteLength).toBeGreaterThan(1000);
    // Gear should have more tris than the plain cylinder (2*32 = 64).
    expect(result.tris).toBeGreaterThan(64);
  });

  it('boolIntersect keeps overlap only', async () => {
    const a = new THREE.Mesh(boxGeo(2, 2, 2), gameMaterial(0x00ff00));
    const b = new THREE.Mesh(sphereGeo(1.2, 16, 12), gameMaterial(0x00ff00));

    const lens = await boolIntersect('Lens', a, b);
    expect(lens).toBeInstanceOf(THREE.Mesh);
    const posCount = (lens.geometry.getAttribute('position') as THREE.BufferAttribute)
      .count;
    expect(posCount).toBeGreaterThan(0);
  });

  it('hull wraps a cluster of small boxes into one convex mesh', async () => {
    const parts: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const b = new THREE.Mesh(boxGeo(0.2, 0.2, 0.2), gameMaterial(0x6699cc));
      b.position.set(Math.cos(i) * 0.8, Math.sin(i) * 0.8, 0);
      parts.push(b);
    }
    const wrapped = await hull('Cluster', ...parts);
    expect(wrapped).toBeInstanceOf(THREE.Mesh);

    const tris = (wrapped.geometry.getIndex()?.count ?? 0) / 3;
    // A convex hull of 4 small boxes has far fewer tris than 4*12=48.
    expect(tris).toBeLessThan(48);
    expect(tris).toBeGreaterThan(0);
  });

  it('errors clearly on invalid input', async () => {
    await expect(
      boolUnion('X', new THREE.Mesh(boxGeo(1, 1, 1), gameMaterial(0xff0000)))
    ).rejects.toThrow(/at least two/);
  });

  it('flat shading (default) produces non-indexed output with per-face normals', async () => {
    const body = new THREE.Mesh(boxGeo(2, 2, 2), gameMaterial(0x888888));
    const hole = new THREE.Mesh(cylinderGeo(0.4, 0.4, 3, 16), gameMaterial(0x000000));
    const pierced = await boolDiff('Pierced', body, hole);
    // Flat-shaded output is non-indexed: each triangle has 3 unique verts
    // so normals stay per-face.
    expect(pierced.geometry.index).toBeNull();
    const norm = pierced.geometry.getAttribute('normal') as THREE.BufferAttribute;
    expect(norm).toBeDefined();
  });

  it('smooth shading preserves indexed output and averages normals', async () => {
    const body = new THREE.Mesh(boxGeo(2, 2, 2), gameMaterial(0x888888));
    const hole = new THREE.Mesh(cylinderGeo(0.4, 0.4, 3, 16), gameMaterial(0x000000));
    const pierced = await boolDiff('Pierced', body, hole, { smooth: true });
    expect(pierced.geometry.index).not.toBeNull();
  });

  it('hull defaults to smooth (organic wrapping shapes)', async () => {
    const parts: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const b = new THREE.Mesh(boxGeo(0.2, 0.2, 0.2), gameMaterial(0x6699cc));
      b.position.set(Math.cos(i) * 0.8, Math.sin(i) * 0.8, 0);
      parts.push(b);
    }
    const wrapped = await hull('Cluster', ...parts);
    expect(wrapped.geometry.index).not.toBeNull();
  });

  it('hull can be opted into flat shading', async () => {
    const parts: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const b = new THREE.Mesh(boxGeo(0.2, 0.2, 0.2), gameMaterial(0x6699cc));
      b.position.set(Math.cos(i) * 0.8, Math.sin(i) * 0.8, 0);
      parts.push(b);
    }
    const wrapped = await hull('Cluster', ...parts, { smooth: false });
    expect(wrapped.geometry.index).toBeNull();
  });

  // ---- B3 mesh-range tagging ---------------------------------------------

  it('boolUnion stamps kilnRanges with one entry per operand, summing to total tris', async () => {
    // Build operands through buildSandboxGlobals so they're auto-tagged.
    const { buildSandboxGlobals } = await import('../primitives');
    const sandbox = buildSandboxGlobals();
    const aGeo = (sandbox.boxGeo as typeof boxGeo)(1, 1, 1);
    const bGeo = (sandbox.boxGeo as typeof boxGeo)(1.2, 1.2, 1.2);
    const a = new THREE.Mesh(aGeo, gameMaterial(0xff0000));
    const b = new THREE.Mesh(bGeo, gameMaterial(0xff0000));
    b.position.set(0.4, 0, 0);

    const merged = await boolUnion('Merged', a, b);
    const ranges = (merged.geometry.userData as Record<string, unknown>).kilnRanges as
      | Array<{ name: string; start: number; count: number }>
      | undefined;
    expect(Array.isArray(ranges)).toBe(true);
    expect(ranges).toHaveLength(2);

    // Total tri count from output index (or non-indexed positions).
    const idx = merged.geometry.getIndex();
    const totalTris = idx
      ? idx.count / 3
      : (merged.geometry.getAttribute('position') as THREE.BufferAttribute).count / 3;
    const sum = ranges!.reduce((s, r) => s + r.count, 0);
    expect(sum).toBe(Math.floor(totalTris));

    // Non-overlapping windows, monotonic starts.
    expect(ranges![0]!.start).toBe(0);
    expect(ranges![1]!.start).toBe(ranges![0]!.start + ranges![0]!.count);
  });

  it('GLB export round-trips without serialising kilnRanges (userData is dropped)', async () => {
    const { buildSandboxGlobals } = await import('../primitives');
    const sandbox = buildSandboxGlobals();
    const geo = (sandbox.boxGeo as typeof boxGeo)(1, 1, 1);
    const root = createRoot('Crate');
    createPart('Body', geo, gameMaterial(0xc0a26b), { parent: root });

    const { bytes } = await renderSceneToGLB(root);
    expect(bytes.length).toBeGreaterThan(0);
    // gltf-transform doesn't carry userData through the buffer; this is a
    // smoke-test that the metadata doesn't blow up the writer.
  });
});
