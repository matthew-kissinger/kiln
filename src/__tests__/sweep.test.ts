import { expect, it } from 'bun:test';
import * as THREE from 'three';
import { sweepProfile, loftProfiles } from '../sweep';
import { geometryDiagnostics } from '../geometry';
const square: [number, number][] = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];
it('sweeps a capped profile with predictable bounds, UVs and outward winding', () => {
  const g = sweepProfile(square, [
    [0, 0, 0],
    [0, 2, 0],
  ]);
  expect(g.boundingBox!.min.toArray()).toEqual([-1, 0, -1]);
  expect(g.boundingBox!.max.toArray()).toEqual([1, 2, 1]);
  expect(geometryDiagnostics(g)).toMatchObject({
    boundaryEdges: 0,
    nonManifoldEdges: 0,
    orientationConflicts: 0,
    degenerateTriangles: 0,
  });
  expect(g.getAttribute('uv').count).toBe(g.getAttribute('position').count);
  let volume = 0;
  const p = g.getAttribute('position'),
    idx = g.index!;
  for (let i = 0; i < idx.count; i += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(p, idx.getX(i)),
      b = new THREE.Vector3().fromBufferAttribute(p, idx.getX(i + 1)),
      c = new THREE.Vector3().fromBufferAttribute(p, idx.getX(i + 2));
    volume += a.dot(b.cross(c)) / 6;
  }
  expect(volume).toBeCloseTo(8);
});
it('transports a noncircular profile with twist and variable scale deterministically', () => {
  const path: [number, number, number][] = [
    [0, 0, 0],
    [0, 2, 0],
    [1, 4, 0],
    [1, 6, 1],
  ];
  const a = sweepProfile(square, path, {
    twist: 30,
    scale: [
      [1, 1],
      [1, 0.8],
      [0.8, 0.6],
      [0.5, 0.4],
    ],
  });
  const b = sweepProfile(square, path, {
    twist: 30,
    scale: [
      [1, 1],
      [1, 0.8],
      [0.8, 0.6],
      [0.5, 0.4],
    ],
  });
  expect(a.getAttribute('position').array).toEqual(b.getAttribute('position').array);
  expect(geometryDiagnostics(a).boundaryEdges).toBe(0);
  expect(square).toEqual([
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]);
});
it('closes a transported loop with matched UV seams', () => {
  const path: [number, number, number][] = Array.from({ length: 16 }, (_, i) => [
    5 * Math.cos((i / 16) * Math.PI * 2),
    0,
    5 * Math.sin((i / 16) * Math.PI * 2),
  ]);
  const g = sweepProfile(square, path, { closed: true, up: [0, 1, 0] });
  expect(geometryDiagnostics(g)).toMatchObject({
    boundaryEdges: 0,
    orientationConflicts: 0,
    degenerateTriangles: 0,
  });
  expect(() => sweepProfile(square, path, { closed: true, twist: 25 })).toThrow('closed');
});
it('lofts corresponding asymmetric sections in explicit degree-based frames', () => {
  const g = loftProfiles([
    { profile: square, frame: { origin: [0, 0, 0] } },
    {
      profile: [
        [-0.5, -1],
        [1, -0.5],
        [0.7, 0.5],
        [-0.5, 0.7],
      ],
      frame: { origin: [1, 3, 0], rotation: [0, 20, 0] },
    },
  ]);
  expect(geometryDiagnostics(g).boundaryEdges).toBe(0);
  expect(g.boundingBox!.max.y).toBe(3);
  const open = loftProfiles(
    [{ profile: square }, { profile: square, frame: { origin: [0, 2, 0] } }],
    { cap: false },
  );
  expect(geometryDiagnostics(open).boundaryEdges).toBe(8);
});
it('rejects ambiguous topology and diagnoses risky turns without claiming a solid', () => {
  expect(() =>
    sweepProfile(
      [
        [0, 0],
        [1, 1],
        [0, 1],
        [1, 0],
      ],
      [
        [0, 0, 0],
        [0, 1, 0],
      ],
    ),
  ).toThrow('profile');
  expect(() =>
    sweepProfile(square, [
      [0, 0, 0],
      [0, 0, 0],
    ]),
  ).toThrow('distinct');
  expect(() =>
    sweepProfile(square, [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ]),
  ).toThrow('reversal');
  expect(() =>
    loftProfiles([
      { profile: square },
      {
        profile: [
          [0, 0],
          [1, 0],
          [0, 1],
        ],
      },
    ]),
  ).toThrow('same');
  const tight = sweepProfile(square, [
    [0, 0, 0],
    [0, 1, 0],
    [1, 1, 0],
  ]);
  expect(
    tight.userData.kilnGeometryWarnings.some(
      (w: { code: string }) => w.code === 'SWEEP_TIGHT_TURN',
    ),
  ).toBe(true);
});
