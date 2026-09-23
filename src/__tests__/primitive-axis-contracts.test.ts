import { expect, test } from 'bun:test';
import * as THREE from 'three';
import { extrudeProfile } from '../profile';
import { listDiscoveryEntries } from '../discovery';
import {
  capsuleGeo,
  capsuleXGeo,
  capsuleZGeo,
  cylinderGeo,
  cylinderXGeo,
  cylinderZGeo,
  torusGeo,
  planeGeo,
  decalBox,
  wingGeo,
} from '../primitives';

function size(geometry: THREE.BufferGeometry): THREE.Vector3 {
  geometry.computeBoundingBox();
  return geometry.boundingBox!.getSize(new THREE.Vector3());
}

test('extrusion Discovery declares the signed profile mapping that asymmetric footprints actually use', async () => {
  const entry = listDiscoveryEntries().find((e) => e.id === 'operation:extrudeProfile');
  if (entry?.kind !== 'operation') throw new Error('Missing extrusion contract');
  for (const [axis, mapping, minimum, maximum] of [
    ['x', '(d, v, -u)', [0, 0, -1], [0.3, 2, 0]],
    ['y', '(u, d, -v)', [0, 0, -2], [1, 0.3, 0]],
    ['z', '(u, v, d)', [0, 0, 0], [1, 2, 0.3]],
  ] as const) {
    const geometry = await extrudeProfile(
      [
        [0, 0],
        [1, 0],
        [1, 2],
        [0, 2],
      ],
      {
        axis,
        depth: 0.3,
        center: false,
      },
    );
    geometry.computeBoundingBox();
    for (let i = 0; i < 3; i++) {
      expect(geometry.boundingBox!.min.getComponent(i)).toBeCloseTo(minimum[i]!, 6);
      expect(geometry.boundingBox!.max.getComponent(i)).toBeCloseTo(maximum[i]!, 6);
    }
    expect(entry.contract.axes).toContain(mapping);
  }
});

test('capsule length is the straight middle plus two radii on every axis', () => {
  for (const [axis, create] of [
    ['x', capsuleXGeo],
    ['y', capsuleGeo],
    ['z', capsuleZGeo],
  ] as const) {
    expect(size(create(0.25, 1.5))[axis]).toBeCloseTo(2, 7);
    expect(size(create(0.25, 0))[axis]).toBeCloseTo(0.5, 7);
  }
});

test('cylinder top/bottom radius order follows positive/negative longitudinal axes', () => {
  for (const [axis, create] of [
    [0, cylinderXGeo],
    [1, cylinderGeo],
    [2, cylinderZGeo],
  ] as const) {
    const positions = create(0.25, 0.75, 2, 8).getAttribute('position');
    const radii = [0, 0];
    for (let i = 0; i < positions.count; i++) {
      const p = [positions.getX(i), positions.getY(i), positions.getZ(i)];
      const end = p[axis]! > 0 ? 0 : 1;
      radii[end] = Math.max(
        radii[end]!,
        Math.hypot(...p.filter((_, component) => component !== axis)),
      );
    }
    expect(radii[0]).toBeCloseTo(0.25, 6);
    expect(radii[1]).toBeCloseTo(0.75, 6);
  }
});

test('torus, plane and decal axes and minimum thickness are physical dimensions', () => {
  expect(size(torusGeo(1, 0.2)).toArray()).toEqual(
    expect.arrayContaining([expect.closeTo(2.4, 6), expect.closeTo(0.4, 6)]),
  );
  expect(size(torusGeo(1, 0.2)).z).toBeCloseTo(0.4, 6);
  const plane = planeGeo(2, 3);
  expect(size(plane).toArray()).toEqual([2, 3, 0]);
  expect(plane.getAttribute('normal').getZ(0)).toBe(1);
  expect(size(decalBox(2, 3, 0)).z).toBeCloseTo(0.002, 8);
});

test('wing sweep and dihedral are signed tip displacements rather than angles', () => {
  const geometry = wingGeo({
    span: 3,
    rootChord: 2,
    tipChord: 1,
    thickness: 0.2,
    sweep: 0.4,
    dihedral: -0.3,
  });
  const p = geometry.getAttribute('position');
  const tip = new THREE.Box3();
  for (let i = 0; i < p.count; i++)
    if (Math.abs(p.getZ(i) - 3) < 1e-6)
      tip.expandByPoint(new THREE.Vector3().fromBufferAttribute(p, i));
  const center = tip.getCenter(new THREE.Vector3());
  expect(tip.max.x).toBeCloseTo(1 - 0.4, 6); // leading edge relative to rootChord/2
  expect(center.x).toBeCloseTo(0.1, 6);
  expect(center.y).toBeCloseTo(-0.3, 6);
  expect(tip.max.x - tip.min.x).toBeCloseTo(1, 6);
});
