/**
 * Wave 3A: UV auto-unwrap via xatlasjs (Node WASM).
 *
 * Verifies:
 *   - autoUnwrap produces UVs within [0, 1]
 *   - atlas metadata stamped on userData
 *   - post-unwrap geometry exports cleanly through the GLB bridge
 *   - survives through CSG output (boolDiff → autoUnwrap → GLB)
 */

import { describe, it, expect } from 'bun:test';
import * as THREE from 'three';
import {
  createRoot,
  boxGeo,
  cylinderGeo,
  sphereGeo,
  gameMaterial,
} from '../primitives';
import { autoUnwrap } from '../uv';
import { boolDiff } from '../solids';
import { renderSceneToGLB } from '../render';

describe('Wave 3A: autoUnwrap (xatlasjs)', () => {
  it('produces a uv attribute on a simple box', async () => {
    const unwrapped = await autoUnwrap(boxGeo(1, 1, 1), { resolution: 512 });
    const uv = unwrapped.getAttribute('uv') as THREE.BufferAttribute | undefined;
    expect(uv).toBeDefined();
    expect(uv!.itemSize).toBe(2);
    expect(uv!.count).toBeGreaterThan(0);

    // All UV values should lie in [0, 1].
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < uv!.array.length; i++) {
      const v = uv!.array[i] as number;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    expect(min).toBeGreaterThanOrEqual(0);
    expect(max).toBeLessThanOrEqual(1);
  });

  it('stamps atlas metadata on userData', async () => {
    const unwrapped = await autoUnwrap(sphereGeo(1, 16, 12), { resolution: 1024 });
    const atlas = unwrapped.userData['atlas'] as
      | { width: number; height: number; atlasCount: number }
      | undefined;
    expect(atlas).toBeDefined();
    expect(atlas!.width).toBeGreaterThan(0);
    expect(atlas!.height).toBeGreaterThan(0);
    expect(atlas!.atlasCount).toBeGreaterThanOrEqual(1);
  });

  it('does not mutate the input geometry', async () => {
    const input = boxGeo(1, 1, 1);
    const beforeUv = input.getAttribute('uv');
    const beforeVertCount = (input.getAttribute('position') as THREE.BufferAttribute).count;

    await autoUnwrap(input);

    const afterUv = input.getAttribute('uv');
    const afterVertCount = (input.getAttribute('position') as THREE.BufferAttribute).count;
    // xatlas may reindex and duplicate seam verts, but the input shouldn't change.
    expect(afterVertCount).toBe(beforeVertCount);
    expect(afterUv).toBe(beforeUv);
  });

  it('UVs survive GLB export end-to-end', async () => {
    const root = createRoot('UvCube');
    const unwrapped = await autoUnwrap(boxGeo(1, 1, 1));
    const mat = gameMaterial(0x888888);
    const mesh = new THREE.Mesh(unwrapped, mat);
    mesh.name = 'Mesh_UvCube';
    root.add(mesh);

    const result = await renderSceneToGLB(root);
    expect(result.bytes.byteLength).toBeGreaterThan(500);
    // No UV-related warnings should surface.
    expect(result.warnings.filter((w) => w.toLowerCase().includes('uv'))).toEqual([]);
  });

  it('works on CSG output (boolDiff → autoUnwrap)', async () => {
    const body = new THREE.Mesh(boxGeo(2, 2, 2), gameMaterial(0x888888));
    const hole = new THREE.Mesh(cylinderGeo(0.4, 0.4, 3, 16), gameMaterial(0x000000));
    const pierced = await boolDiff('Pierced', body, hole);

    const unwrapped = await autoUnwrap(pierced.geometry);
    const uv = unwrapped.getAttribute('uv') as THREE.BufferAttribute | undefined;
    expect(uv).toBeDefined();
    expect(uv!.count).toBeGreaterThan(0);
  });
});
