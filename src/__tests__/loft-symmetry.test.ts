import { expect, test } from 'bun:test';
import { Triangle, Vector3, type BufferGeometry } from 'three';
import { geometryDiagnostics } from '../geometry';
import { loftProfiles, sweepProfile, type ProfilePoint } from '../sweep';

const wide: ProfilePoint[] = [
  [-1, 0],
  [-0.4, -0.5],
  [0, -1],
  [0.4, -0.5],
  [1, 0],
  [0, 0.3],
];
const narrow: ProfilePoint[] = [
  [-0.2, 0],
  [-0.15, -0.1],
  [0, -0.2],
  [0.15, -0.1],
  [0.2, 0],
  [0, 0.1],
];

/** Compare actual triangle surfaces, not just the symmetric input vertices. */
function mirroredSurfaceError(geometry: BufferGeometry): number {
  const p = geometry.getAttribute('position'),
    index = geometry.index!;
  const faces: Triangle[] = [];
  for (let i = 0; i < index.count; i += 3)
    faces.push(
      new Triangle(
        ...([0, 1, 2].map((k) => new Vector3().fromBufferAttribute(p, index.getX(i + k))) as [
          Vector3,
          Vector3,
          Vector3,
        ]),
      ),
    );
  let maximum = 0;
  for (const face of faces) {
    const samples = [
      face.getMidpoint(new Vector3()),
      face.a.clone().lerp(face.b, 0.5),
      face.b.clone().lerp(face.c, 0.5),
      face.c.clone().lerp(face.a, 0.5),
    ];
    for (const point of samples) {
      point.x *= -1;
      const minimum = Math.min(
        ...faces.map((f) => f.closestPointToPoint(point, new Vector3()).distanceTo(point)),
      );
      maximum = Math.max(maximum, minimum);
    }
  }
  return maximum;
}

test('symmetric nonplanar loft and scaled sweep panels retain mirrored surfaces', () => {
  const input = JSON.stringify([wide, narrow]);
  for (const geometry of [
    loftProfiles([{ profile: wide }, { profile: narrow, frame: { origin: [0, 1.3, 0] } }]),
    loftProfiles([{ profile: wide }, { profile: narrow, frame: { origin: [0, -1.3, 0] } }]),
    sweepProfile(
      wide,
      [
        [0, 0, 0],
        [0, 1.3, 0],
      ],
      {
        scale: [
          [1, 1],
          [0.25, 0.6],
        ],
      },
    ),
  ]) {
    expect(mirroredSurfaceError(geometry)).toBeLessThan(1e-6);
    expect(geometryDiagnostics(geometry)).toMatchObject({
      boundaryEdges: 0,
      nonManifoldEdges: 0,
      orientationConflicts: 0,
      degenerateTriangles: 0,
    });
    const positions = geometry.getAttribute('position'),
      normals = geometry.getAttribute('normal'),
      uvs = geometry.getAttribute('uv');
    expect(uvs.count).toBe(positions.count);
    for (let i = 0; i < normals.count; i++)
      expect(new Vector3().fromBufferAttribute(normals, i).length()).toBeCloseTo(1, 5);
    expect(Array.from(uvs.array).every(Number.isFinite)).toBe(true);
    geometry.dispose();
  }
  expect(JSON.stringify([wide, narrow])).toBe(input);
});

test('planar loft panels retain the compact two-triangle layout', () => {
  const profile: ProfilePoint[] = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  const g = loftProfiles([{ profile }, { profile, frame: { origin: [0, 2, 0] } }]);
  expect(g.index!.count / 3).toBe(12);
  expect(g.getAttribute('position').count).toBe(18);
  g.dispose();
});
