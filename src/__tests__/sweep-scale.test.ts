import { expect, test } from 'bun:test';
import type * as THREE from 'three';
import { geometryDiagnostics, type Point3 } from '../geometry';
import { loftProfiles, sweepProfile, type ProfilePoint } from '../sweep';

const scales = [1e-12, 1e-9, 1e-6, 1, 1e6, 1e9, 1e12];
const square: ProfilePoint[] = [
  [-0.1, -0.1],
  [0.1, -0.1],
  [0.1, 0.1],
  [-0.1, 0.1],
];
const scaled = (scale: number) => square.map(([x, z]) => [x * scale, z * scale] as const);

function compare(actual: THREE.BufferGeometry, expected: THREE.BufferGeometry, scale: number) {
  expect(Array.from(actual.index!.array)).toEqual(Array.from(expected.index!.array));
  for (const key of ['position', 'normal', 'uv']) {
    const a = actual.getAttribute(key).array,
      b = expected.getAttribute(key).array;
    expect(a.length).toBe(b.length);
    for (let i = 0; i < a.length; i++)
      expect(a[i]! / (key === 'position' ? scale : 1)).toBeCloseTo(b[i]!, 5);
  }
  expect(geometryDiagnostics(actual)).toMatchObject({
    boundaryEdges: 0,
    nonManifoldEdges: 0,
    orientationConflicts: 0,
    degenerateTriangles: 0,
  });
  actual.dispose();
}

test('lofts and curved sweeps retain normalized shape, topology, UVs and normals across scales', () => {
  const make = (scale: number, loft: boolean) =>
    loft
      ? loftProfiles([
          { profile: scaled(scale) },
          { profile: scaled(scale), frame: { origin: [0, -2 * scale, 0], rotation: [0, 30, 0] } },
        ])
      : sweepProfile(scaled(scale), [
          [0, 0, 0],
          [0, scale, 0],
          [0.4 * scale, 2 * scale, 0],
        ]);
  for (const loft of [false, true]) {
    const expected = make(1, loft);
    for (const scale of scales) compare(make(scale, loft), expected, scale);
    expected.dispose();
  }
});

test('closed paths and repeated profile endpoints use proportional tolerances', () => {
  const make = (scale: number) => {
    const profile = [...scaled(scale), scaled(scale)[0]!];
    const path: Point3[] = [
      [0, 0, 0],
      [0, 2 * scale, 0],
      [2 * scale, 2 * scale, 0],
      [2 * scale, 0, 0],
    ];
    const before = JSON.stringify({ profile, path });
    const result = sweepProfile(profile, path, { closed: true });
    expect(JSON.stringify({ profile, path })).toBe(before);
    expect(() => sweepProfile(profile, [...path, path[0]!], { closed: true })).toThrow(
      /repeated endpoint/,
    );
    expect(() => sweepProfile(profile, [path[0]!, path[0]!, path[1]!])).toThrow(/distinct/);
    return result;
  };
  const expected = make(1);
  for (const scale of scales) compare(make(scale), expected, scale);
  expected.dispose();
});

test('profile validity and up direction do not depend on arbitrary unit magnitude', () => {
  for (const scale of scales) {
    const bowTie: ProfilePoint[] = [
      [-scale, -scale],
      [scale, scale],
      [-scale, scale],
      [scale, -scale],
    ];
    expect(() =>
      loftProfiles([{ profile: bowTie }, { profile: bowTie, frame: { origin: [0, scale, 0] } }]),
    ).toThrow(/self-intersects/);
    const path: Point3[] = [
      [0, 0, 0],
      [0, 2, 0],
    ];
    const expected = sweepProfile(square, path, { up: [0, 0, 1] });
    compare(sweepProfile(square, path, { up: [0, 0, scale] }), expected, 1);
    expect(() => sweepProfile(square, path, { up: [0, scale, 0] })).toThrow(/parallel/);
    expected.dispose();
  }
  expect(() =>
    sweepProfile(
      square,
      [
        [0, 0, 0],
        [0, 1, 0],
      ],
      { up: [0, 0, 0] },
    ),
  ).toThrow(/nonzero/);
});
