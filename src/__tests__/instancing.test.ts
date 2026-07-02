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
import { gradeGlbBytes, optimizeGlbBytes, renderSceneToGLB } from '../render';

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
      const coords: Array<[number, number]> = [
        [-0.8, 1.2],
        [0.8, 1.2],
        [-0.8, -1.2],
        [0.8, -1.2],
      ];
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

// ── M1c: the GPU-instancing pass (EXT_mesh_gpu_instancing) ────────────────────
// Perf/filesize only — the A–F grade keys on material count and must NOT move.

/** A fence run: `count` posts sharing one geometry/material via createInstance,
 *  plus a ground slab so the asset has a second, un-instanced mesh. */
function fenceScene(count: number, opts: { jointPivot?: boolean } = {}): THREE.Object3D {
  const r = createRoot('Fence');
  createPart('Ground', boxGeo(count * 1.2, 0.1, 2), gameMaterial(0x777788), {
    position: [0, -0.05, 0],
    parent: r,
  });
  const post = createPart('Post0', boxGeo(0.15, 1.2, 0.15), gameMaterial(0x8a5a2b), {
    position: [0, 0.6, 0],
    parent: r,
  });
  for (let i = 1; i < count; i++) {
    createInstance(`Post${i}`, post, { position: [i * 1.1, 0.6, 0], parent: r });
  }
  if (opts.jointPivot) {
    const j = new THREE.Object3D();
    j.name = 'Joint_Gate';
    r.add(j);
  }
  return r;
}

function glbJson(bytes: Uint8Array): { extensionsUsed?: string[] } {
  // GLB: 12-byte header, then chunk 0 header (length + 'JSON') + the JSON chunk.
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const jsonLen = view.getUint32(12, true);
  return JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + jsonLen)));
}

describe('M1c: GPU-instancing pass (instance option)', () => {
  it('instance:"on" emits EXT_mesh_gpu_instancing, cuts bytes+draws, keeps tris+grade', async () => {
    const plain = await renderSceneToGLB(fenceScene(10));
    const inst = await renderSceneToGLB(fenceScene(10), { instance: 'on' });

    expect(inst.instancing).toBeDefined();
    expect(inst.instancing!.batches).toBe(1);
    expect(inst.instancing!.instances).toBe(10);
    expect(inst.instancing!.drawsAfter).toBeLessThan(inst.instancing!.drawsBefore);
    expect(glbJson(inst.bytes).extensionsUsed).toContain('EXT_mesh_gpu_instancing');
    expect(glbJson(plain.bytes).extensionsUsed ?? []).not.toContain('EXT_mesh_gpu_instancing');
    // Smaller on the wire (10 node TRS records -> 1 batch + accessors).
    expect(inst.bytes.byteLength).toBeLessThan(plain.bytes.byteLength);
    // PERF ONLY: rendered-triangle total and the material-count grade are unchanged.
    expect(inst.instanceability!.metrics.triangles).toBe(plain.instanceability!.metrics.triangles);
    expect(inst.instanceability!.grade).toBe(plain.instanceability!.grade);
  });

  it('instance:"auto" acts only for role:"fill"', async () => {
    const fill = await renderSceneToGLB(fenceScene(10), { instance: 'auto', role: 'fill' });
    const prop = await renderSceneToGLB(fenceScene(10), { instance: 'auto', role: 'prop' });
    const none = await renderSceneToGLB(fenceScene(10), { instance: 'auto' });
    expect(fill.instancing).toBeDefined();
    expect(prop.instancing).toBeUndefined();
    expect(none.instancing).toBeUndefined();
  });

  it('below the min-node threshold nothing is batched', async () => {
    const few = await renderSceneToGLB(fenceScene(3), { instance: 'on' });
    expect(few.instancing).toBeUndefined();
    expect(glbJson(few.bytes).extensionsUsed ?? []).not.toContain('EXT_mesh_gpu_instancing');
  });

  it('animated docs and Joint_* pivots are never instanced', async () => {
    const spin = new THREE.NumberKeyframeTrack('Post0.position[y]', [0, 1], [0.6, 0.8]);
    const clip = new THREE.AnimationClip('bob', 1, [spin]);
    const animated = await renderSceneToGLB(fenceScene(10), { instance: 'on', clips: [clip] });
    expect(animated.instancing).toBeUndefined();

    const rigged = await renderSceneToGLB(fenceScene(10, { jointPivot: true }), {
      instance: 'on',
    });
    expect(rigged.instancing).toBeUndefined();
  });

  it('an instanced GLB round-trips through gradeGlbBytes and optimizeGlbBytes', async () => {
    const inst = await renderSceneToGLB(fenceScene(10), { instance: 'on' });
    // Re-grade from bytes (the studio web-side path) — must read the extension,
    // not drop it, so tris match the logical (instanced-out) total.
    const report = await gradeGlbBytes(inst.bytes);
    expect(report).toBeDefined();
    expect(report!.metrics.triangles).toBe(inst.instanceability!.metrics.triangles);
  });

  it('optimizeGlbBytes can instance from bytes (web-tier finalize seam)', async () => {
    const plain = await renderSceneToGLB(fenceScene(10));
    const out = await optimizeGlbBytes(plain.bytes, {
      mode: 'off',
      instance: 'auto',
      role: 'fill',
    });
    expect(out).toBeDefined();
    expect(out!.instancing).toBeDefined();
    expect(out!.instancing!.instances).toBe(10);
    expect(out!.summary).toBeUndefined();
    expect(glbJson(out!.bytes).extensionsUsed).toContain('EXT_mesh_gpu_instancing');
    // And a NO-op call (off + non-fill role) keeps the original bytes.
    expect(
      await optimizeGlbBytes(plain.bytes, { mode: 'off', instance: 'auto', role: 'prop' }),
    ).toBeUndefined();
  });
});
