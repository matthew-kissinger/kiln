import { describe, expect, test } from 'bun:test';
import type * as THREE from 'three';
import { LoopSubdivision } from 'three-subdivide';

import { mergeVertices, subdivide } from '../ops';
import { boxGeo, sphereGeo } from '../primitives';

/**
 * Regression: `three-subdivide` sums the adjacent face normals into each new
 * vertex and never divides through, so the normals come out at the length of
 * however many faces met there. No raster shows it, because a shader
 * normalises before it lights; the glTF validator rejects every single one
 * (GLTF_ACCESSOR_VECTOR3_NON_UNIT) and the build dies at final-glb.
 *
 * Found by a dispatched agent building a printing press, whose bed was
 * `subdivide(boxGeo(1.5, 0.6, 0.8), 2)`: 1,104 non-unit normals out of 1,152,
 * the worst at length 0.3507, and 990-plus validator blockers on one asset.
 *
 * This is the second geometry helper in this file's history to ship un-normalised
 * normals (see lathe-normals.test.ts), which is why the check is written against
 * the raw upstream call as well: if `three-subdivide` ever fixes it, the first
 * test here fails and tells us the workaround can go.
 */
function nonUnitNormals(geo: THREE.BufferGeometry): number {
  const n = geo.getAttribute('normal') as THREE.BufferAttribute | undefined;
  if (!n) throw new Error('geometry has no normal attribute');
  let bad = 0;
  for (let i = 0; i < n.count; i++) {
    const len = Math.hypot(n.getX(i), n.getY(i), n.getZ(i));
    if (!Number.isFinite(len) || Math.abs(len - 1) > 1e-4) bad++;
  }
  return bad;
}

describe('subdivide normals', () => {
  test('raw LoopSubdivision is the thing that is broken', () => {
    const input = mergeVertices(boxGeo(1, 1, 1), { positionOnly: true });
    expect(nonUnitNormals(LoopSubdivision.modify(input, 1, {}))).toBeGreaterThan(0);
  });

  test('subdivide returns unit normals at one iteration', () => {
    expect(nonUnitNormals(subdivide(boxGeo(1, 1, 1), 1))).toBe(0);
  });

  test('the printing press bed, to the millimetre', () => {
    expect(nonUnitNormals(subdivide(boxGeo(1.5, 0.6, 0.8), 2))).toBe(0);
  });

  test('holds on a curved input and with welding off', () => {
    expect(nonUnitNormals(subdivide(sphereGeo(0.5, 12, 8), 1))).toBe(0);
    expect(nonUnitNormals(subdivide(boxGeo(1, 1, 1), 1, { weld: false }))).toBe(0);
  });

  test('normals still point outward, so the repair did not flatten the shading', () => {
    const geo = subdivide(boxGeo(1, 1, 1), 1);
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const nrm = geo.getAttribute('normal') as THREE.BufferAttribute;
    // On a subdivided cube centred at the origin every vertex normal should
    // still have a positive dot with its own position: normalising changes
    // length, never direction.
    let outward = 0;
    for (let i = 0; i < pos.count; i++) {
      const d = pos.getX(i) * nrm.getX(i) + pos.getY(i) * nrm.getY(i) + pos.getZ(i) * nrm.getZ(i);
      if (d > 0) outward++;
    }
    expect(outward).toBe(pos.count);
  });
});
