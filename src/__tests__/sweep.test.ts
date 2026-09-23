import { expect, it } from 'bun:test';
import * as THREE from 'three';
import { sweepProfile, loftProfiles } from '../sweep';
import { geometryDiagnostics } from '../geometry';
import { boolDiff } from '../solids';
const square: [number, number][] = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];

it('rejects collapsed corresponding edges without forbidding noncollapsing twists', () => {
  for (const scale of [0.001, 1, 1000]) {
    const profile = square.map(([x, z]) => [x * scale, z * scale] as [number, number]);
    const shifted = [...profile.slice(2), ...profile.slice(0, 2)].map(
      ([x, z]) => [x * 0.5, z * 0.5] as [number, number],
    );
    const before = JSON.stringify([profile, shifted]);
    expect(() =>
      loftProfiles([
        { profile, frame: { origin: [3 * scale, 0, -4 * scale], rotation: [0, 35, 0] } },
        {
          profile: shifted,
          frame: { origin: [3 * scale, -2 * scale, -4 * scale], rotation: [0, 35, 0] },
        },
      ]),
    ).toThrow(/corresponding.*collapse.*intermediate/i);
    expect(JSON.stringify([profile, shifted])).toBe(before);
    const valid = loftProfiles([
      { profile },
      { profile, frame: { origin: [0, 2 * scale, 0], rotation: [0, 150, 0] } },
    ]);
    expect(geometryDiagnostics(valid).boundaryEdges).toBe(0);
    valid.dispose();
  }
  expect(() =>
    sweepProfile(
      square,
      [
        [0, 0, 0],
        [0, 2, 0],
      ],
      { twist: 180 },
    ),
  ).toThrow(/corresponding.*collapse/i);
});
function signedVolume(g: THREE.BufferGeometry) {
  const p = g.getAttribute('position'),
    indices = g.index;
  let volume = 0;
  for (let i = 0; i < (indices?.count ?? p.count); i += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(p, indices ? indices.getX(i) : i);
    const b = new THREE.Vector3().fromBufferAttribute(p, indices ? indices.getX(i + 1) : i + 1);
    const c = new THREE.Vector3().fromBufferAttribute(p, indices ? indices.getX(i + 2) : i + 2);
    volume += a.dot(b.cross(c)) / 6;
  }
  return volume;
}

it('keeps loft faces outward for either traversal direction in rotated frames', async () => {
  for (const direction of [-1, 1]) {
    const make = (half: number, start: number, end: number, cap = true) =>
      loftProfiles(
        [start, end].map((t) => ({
          profile: square.map(([x, z]) => [x * half, z * half] as [number, number]),
          frame: { origin: [3 - t * direction, 4, 5] as const, rotation: [0, 0, 90] as const },
        })),
        { cap },
      );
    const body = make(1, 0, 2);
    expect(signedVolume(body)).toBeCloseTo(8, 5);
    const open = make(1, 0, 2, false);
    expect(geometryDiagnostics(open).boundaryEdges).toBe(8);
    const p = open.getAttribute('position'),
      n = open.getAttribute('normal');
    // The centerline lies on world Y=4/Z=5; every side normal points away from it.
    for (let i = 0; i < p.count; i++)
      expect((p.getY(i) - 4) * n.getY(i) + (p.getZ(i) - 5) * n.getZ(i)).toBeGreaterThan(0);
    const cavity = make(0.8, -0.1, 2.1);
    const wall = await boolDiff('Wall', new THREE.Mesh(body), new THREE.Mesh(cavity), {
      preserveAttributes: true,
    });
    expect(signedVolume(wall.geometry)).toBeCloseTo(2.88, 4);
    expect(geometryDiagnostics(body)).toMatchObject({
      boundaryEdges: 0,
      nonManifoldEdges: 0,
      orientationConflicts: 0,
    });
    for (const g of [body, open, cavity, wall.geometry]) g.dispose();
  }
});
it('rejects unsupported holes instead of silently filling a JavaScript request', () => {
  const hole = square.map(([x, z]) => [x * 0.5, z * 0.5]);
  const sections = [
    { profile: square },
    { profile: square, frame: { origin: [0, 2, 0] as const } },
  ];
  // Model-authored JavaScript does not get TypeScript's excess-property check.
  const options = { cap: true, holes: [hole] };
  const firstWithHole = { ...sections[0]!, holes: [hole] };
  const lastWithHole = { ...sections[1]!, holes: [hole] };
  expect(() => loftProfiles(sections, options)).toThrow(/holes.*extrudeProfile/);
  expect(() => loftProfiles([firstWithHole, sections[1]!])).toThrow(
    /section 0.*holes.*extrudeProfile/,
  );
  expect(() => loftProfiles([sections[0]!, lastWithHole])).toThrow(
    /section 1.*holes.*extrudeProfile/,
  );
  expect(() =>
    sweepProfile(
      square,
      [
        [0, 0, 0],
        [0, 2, 0],
      ],
      options,
    ),
  ).toThrow(/holes.*extrudeProfile/);
});
it('tight-turn diagnostics use the effective profile scale at each station', () => {
  const path: [number, number, number][] = [
    [0, 0, 0],
    [0, 1, 0],
    [1, 1, 0],
  ];
  const warns = (geometry: THREE.BufferGeometry) =>
    geometry.userData.kilnGeometryWarnings.some(
      (warning: { code: string }) => warning.code === 'SWEEP_TIGHT_TURN',
    );
  expect(warns(sweepProfile(square, path, { scale: 0.1 }))).toBe(false);
  const small = square.map(([x, y]) => [x * 0.05, y * 0.05] as [number, number]);
  expect(warns(sweepProfile(small, path))).toBe(false);
  expect(warns(sweepProfile(small, path, { scale: 20 }))).toBe(true);
  expect(
    warns(
      sweepProfile(small, path, {
        scale: [
          [1, 1],
          [20, 1],
          [1, 1],
        ],
      }),
    ),
  ).toBe(true);
  expect(
    warns(
      sweepProfile(small, path, {
        scale: [
          [1, 1],
          [1, 20],
          [1, 1],
        ],
      }),
    ),
  ).toBe(true);
});
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
