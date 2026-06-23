/**
 * Wave 1B: instancing primitives + gltf-transform dedup end-to-end.
 *
 * Verifies that a 4-wheel vehicle built with createInstance produces a
 * meaningfully smaller GLB than the naive "4 separate createPart calls"
 * version, confirming geometry + material reuse survives the export path.
 */

import { describe, it, expect } from 'bun:test';
import * as THREE from 'three';
import {
  createRoot,
  createPart,
  createInstance,
  cloneGeometry,
  cloneMaterial,
  cylinderGeo,
  boxGeo,
  gameMaterial,
} from '../primitives';
import { renderSceneToGLB } from '../render';

describe('Wave 1B: instancing primitives', () => {
  it('cloneGeometry and cloneMaterial return the same reference', () => {
    const geo = boxGeo(1, 1, 1);
    const mat = gameMaterial(0xff0000);
    expect(cloneGeometry(geo)).toBe(geo);
    expect(cloneMaterial(mat)).toBe(mat);
  });

  it('createInstance reuses geometry and material of source', () => {
    const root = createRoot('Truck');
    const wheelGeo = cylinderGeo(0.4, 0.4, 0.2, 12);
    const rubber = gameMaterial(0x1a1a1a);
    const fl = createPart('WheelFL', wheelGeo, rubber, {
      position: [-0.8, 0.3, 1.2],
      parent: root,
    });
    const fr = createInstance('WheelFR', fl, {
      position: [0.8, 0.3, 1.2],
      parent: root,
    });

    expect(fr).toBeInstanceOf(THREE.Mesh);
    expect((fr as THREE.Mesh).geometry).toBe((fl as THREE.Mesh).geometry);
    expect((fr as THREE.Mesh).material).toBe((fl as THREE.Mesh).material);
    expect(fr.parent).toBe(root);
  });

  it('createInstance from a pivot reuses the first Mesh child', () => {
    const root = createRoot('Scene');
    const pivot = createPart('Head', boxGeo(0.5, 0.5, 0.5), gameMaterial(0xffcc66), {
      pivot: true,
      parent: root,
    });
    const copy = createInstance('Head2', pivot, { position: [2, 0, 0], parent: root });
    const sourceMesh = pivot.children[0] as THREE.Mesh;
    expect((copy as THREE.Mesh).geometry).toBe(sourceMesh.geometry);
  });

  it('createInstance throws when source has no Mesh', () => {
    const empty = new THREE.Object3D();
    expect(() => createInstance('Bad', empty)).toThrow(/no Mesh/);
  });

  // A 4-wheel vehicle built three ways:
  //   1. instanced  — one geometry shared via createInstance
  //   2. independent — four fresh createPart calls with identical geo/mat
  //   3. raw-indep   — same as (2) but with dedup disabled on export
  // Ref-sharing via createInstance produces an optimal GLB without needing
  // dedup. dedup() catches agents who forget to use createInstance and
  // reaches the same optimum post-hoc. Both confirm the instancing path
  // beats naive authoring when dedup is off.
  it('instancing + dedup cuts 4-wheel GLB to ~1/3.5 of naive', async () => {
    const buildInstanced = () => {
      const r = createRoot('Instanced');
      const wg = cylinderGeo(0.4, 0.4, 0.2, 16);
      const rm = gameMaterial(0x1a1a1a);
      const fl = createPart('WheelFL', wg, rm, { position: [-0.8, 0.3, 1.2], parent: r });
      createInstance('WheelFR', fl, { position: [0.8, 0.3, 1.2], parent: r });
      createInstance('WheelRL', fl, { position: [-0.8, 0.3, -1.2], parent: r });
      createInstance('WheelRR', fl, { position: [0.8, 0.3, -1.2], parent: r });
      return r;
    };
    const buildIndependent = () => {
      const r = createRoot('Independent');
      const coords: Array<[number, number]> = [[-0.8, 1.2], [0.8, 1.2], [-0.8, -1.2], [0.8, -1.2]];
      coords.forEach(([x, z], i) => {
        createPart(`W${i}`, cylinderGeo(0.4, 0.4, 0.2, 16), gameMaterial(0x1a1a1a), {
          position: [x, 0.3, z],
          parent: r,
        });
      });
      return r;
    };

    const instanced = await renderSceneToGLB(buildInstanced());
    const rawIndep = await renderSceneToGLB(buildIndependent(), { dedup: false });
    const dedupedIndep = await renderSceneToGLB(buildIndependent());

    // Raw (no dedup, no instancing): ~4x the size.
    expect(instanced.bytes.byteLength).toBeLessThan(rawIndep.bytes.byteLength * 0.5);
    // Dedup catches the redundancy even without createInstance.
    expect(dedupedIndep.bytes.byteLength).toBeLessThan(rawIndep.bytes.byteLength * 0.5);
  });

  it('dedup: false disables the transform', async () => {
    const root = createRoot('R');
    // Two *separate* box geos with same shape — dedup should merge them,
    // dedup:false should preserve both.
    createPart('A', boxGeo(1, 1, 1), gameMaterial(0xff0000), {
      position: [0, 0, 0],
      parent: root,
    });
    createPart('B', boxGeo(1, 1, 1), gameMaterial(0xff0000), {
      position: [2, 0, 0],
      parent: root,
    });

    const withDedup = await renderSceneToGLB(root);
    const withoutDedup = await renderSceneToGLB(root, { dedup: false });
    expect(withDedup.bytes.byteLength).toBeLessThan(withoutDedup.bytes.byteLength);
  });
});
