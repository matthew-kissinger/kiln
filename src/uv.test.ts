import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';

import { boxGeo, cylinderZGeo, torusGeo } from './primitives';
import { boolDiff } from './solids';
import { autoUnwrap } from './uv';

const RAD = Math.PI / 180;
const mat = new THREE.MeshStandardMaterial();

function zeroNormals(geo: THREE.BufferGeometry): number {
  const n = geo.getAttribute('normal') as THREE.BufferAttribute | undefined;
  if (!n) throw new Error('geometry has no normal attribute');
  let zero = 0;
  for (let i = 0; i < n.count; i++) {
    const len = Math.hypot(n.getX(i), n.getY(i), n.getZ(i));
    if (!Number.isFinite(len) || len < 1e-6) zero++;
  }
  return zero;
}

describe('autoUnwrap', () => {
  test('a plain boolean unwraps with unit normals', async () => {
    const cut = await boolDiff(
      'Plain',
      new THREE.Mesh(boxGeo(1, 1, 1), mat),
      new THREE.Mesh(cylinderZGeo(0.3, 0.3, 2, 24), mat),
      { smooth: true },
    );
    expect(zeroNormals(await autoUnwrap(cut.geometry, { resolution: 512 }))).toBe(0);
  });

  // Regression: a torus shell cut to an arc -- the cafe racer's front mudguard.
  // Manifold leaves zero-area triangles where the cutters meet the torus at a
  // shallow angle; computeVertexNormals then hands back (0, 0, 0) for every
  // vertex touched only by those, and the glTF export fails validation with
  // GLTF_ACCESSOR_VECTOR3_NON_UNIT. Measured before the fix: 118 of 662.
  test('a shallow-angle boolean shell unwraps with unit normals', async () => {
    const major = 0.341;
    const shell = (tube: number) => new THREE.Mesh(torusGeo(major, tube, 12, 72), mat);
    const coreR = major + 0.078 * Math.cos(67.5 * RAD);
    const wedge = (deg: number, sign: number) => {
      const a = deg * RAD;
      const m = new THREE.Mesh(boxGeo(2.4, 2.4, 0.8), mat);
      m.position.set(sign * Math.sin(a) * 1.2, -sign * Math.cos(a) * 1.2, 0);
      m.rotation.z = a;
      return m;
    };
    const blade = await boolDiff(
      'Blade',
      shell(0.087),
      shell(0.078),
      new THREE.Mesh(cylinderZGeo(coreR, coreR, 0.6, 72), mat),
      wedge(40, 1),
      wedge(118, -1),
      { smooth: true },
    );
    const unwrapped = await autoUnwrap(blade.geometry, { resolution: 1024 });
    expect(zeroNormals(unwrapped)).toBe(0);
    expect(unwrapped.getAttribute('uv')).toBeDefined();
  });
});
