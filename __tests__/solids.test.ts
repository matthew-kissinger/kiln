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
    const piercedTris =
      (pierced.geometry.getIndex()?.count ?? 0) / 3;
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
});
