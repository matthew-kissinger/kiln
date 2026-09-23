import { expect, test } from 'bun:test';
import * as THREE from 'three';
import { createWheelAssembly, createWheelGeometrySet } from '../vehicle';

const mat = new THREE.MeshStandardMaterial();
const materials = { tire: mat, rim: mat };
const options = { radius: 0.5, width: 0.2, side: 'left' as const, index: 0 };

test('shared custom wheel geometry reports measured dimensions without mutating shared buffers', () => {
  const geometries = createWheelGeometrySet(0.5, 0.2);
  const wheel = createWheelAssembly('Matching', materials, { ...options, geometries });
  expect(wheel.geometryChecks.map((check) => check.status)).toEqual(['match', 'match', 'match']);
  expect(wheel.tire.geometry).toBe(geometries.tire);
  expect(geometries.tire.boundingBox).toBeNull();
  geometries.tire.scale(2, 2, 1).translate(0.2, 0, 0.1);
  const mismatched = createWheelAssembly('Changed', materials, { ...options, geometries });
  expect(mismatched.geometryChecks[0]).toMatchObject({
    part: 'tire',
    status: 'mismatch',
    differences: ['radius', 'center'],
    declared: { radius: 0.5, width: 0.2 },
  });
  expect(mismatched.geometryChecks[0]!.observed.radius).toBeCloseTo(1.2, 6);
  expect(mismatched.contact.position.y).toBe(-0.5); // intent never silently rewritten
});

test('custom broad wheels are not constrained by the default torus profile', () => {
  const tire = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 16).rotateX(Math.PI / 2);
  const wheel = createWheelAssembly('Roller', materials, {
    ...options,
    width: 1.2,
    geometries: { tire },
  });
  expect(wheel.geometryChecks[0]!.status).toBe('match');
  expect(wheel.tire.geometry).toBe(tire);
  expect(() => createWheelAssembly('Default', materials, { ...options, width: 1.2 })).toThrow(
    /diameter/,
  );
});

test('empty or nonfinite custom wheel coordinates fail before attachment', () => {
  const parent = new THREE.Group();
  for (const tire of [
    new THREE.BufferGeometry(),
    new THREE.BufferGeometry().setAttribute(
      'position',
      new THREE.Float32BufferAttribute([NaN, 0, 0], 3),
    ),
  ]) {
    expect(() =>
      createWheelAssembly('Invalid', materials, {
        ...options,
        geometries: { tire },
        parent,
      }),
    ).toThrow(/tire.*position|tire.*finite/);
  }
  expect(parent.children).toHaveLength(0);
});
