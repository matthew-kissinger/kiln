/** E04: measured existing alternatives, not a general hollow-loft/solid certificate. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { geometryDiagnostics } from '../../src/geometry';
import { extrudeProfile, type Profile2D } from '../../src/profile';
import { loftProfiles, sweepProfile } from '../../src/sweep';
import { boolDiff } from '../../src/solids';

const output = process.argv[2];
if (!output) throw Error('Pass an output JSON path.');
const rectangle = (x: number, z: number): Profile2D => [
  [-x, -z],
  [x, -z],
  [x, z],
  [-x, z],
];
const square = rectangle(1, 1);
const rows: Record<string, unknown>[] = [];
function volume(g: THREE.BufferGeometry) {
  const p = g.getAttribute('position'),
    idx = g.index;
  const points = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  let result = 0;
  for (let i = 0; i < (idx?.count ?? p.count); i += 3) {
    points.forEach((point, j) => {
      point.fromBufferAttribute(p, idx ? idx.getX(i + j) : i + j);
    });
    result += points[0]!.dot(points[1]!.cross(points[2]!)) / 6;
  }
  return result;
}
async function measure(
  name: string,
  make: () => THREE.BufferGeometry | Promise<THREE.BufferGeometry>,
) {
  const start = performance.now();
  const g = await make();
  const milliseconds = performance.now() - start;
  g.computeBoundingBox();
  const p = g.getAttribute('position'),
    n = g.getAttribute('normal'),
    uv = g.getAttribute('uv');
  const normalErrors = Array.from({ length: n?.count ?? 0 }, (_, i) =>
    Math.abs(new THREE.Vector3().fromBufferAttribute(n, i).length() - 1),
  );
  rows.push({
    name,
    milliseconds,
    volume: volume(g),
    topology: geometryDiagnostics(g),
    min: g.boundingBox!.min.toArray(),
    max: g.boundingBox!.max.toArray(),
    normalCount: n?.count ?? 0,
    invalidNormals: normalErrors.filter((e) => !Number.isFinite(e) || e > 1e-4).length,
    uvCount: uv?.count ?? 0,
    vertexCount: p.count,
    warnings: g.userData.kilnGeometryWarnings ?? [],
  });
  return g;
}
const plain = await measure('straight holed extrusion', () =>
  extrudeProfile(square, { depth: 2, holes: [rectangle(0.5, 0.5)] }),
);
const tapered = await measure('anisotropically tapered holed extrusion', () =>
  extrudeProfile(square, {
    depth: 2,
    holes: [rectangle(0.5, 0.5)],
    taper: [0.7, 0.5],
    divisions: 16,
  }),
);
const twistedCoarse = await measure('twisted tapered holed extrusion, 8 divisions', () =>
  extrudeProfile(square, {
    depth: 2,
    holes: [rectangle(0.5, 0.5)],
    taper: [0.7, 0.5],
    twist: 40,
    divisions: 8,
  }),
);
const twisted = await measure('twisted tapered holed extrusion, 32 divisions', () =>
  extrudeProfile(square, {
    depth: 2,
    holes: [rectangle(0.5, 0.5)],
    taper: [0.7, 0.5],
    twist: 40,
    divisions: 32,
  }),
);
const twistedFine = await measure('twisted tapered holed extrusion, 128 divisions', () =>
  extrudeProfile(square, {
    depth: 2,
    holes: [rectangle(0.5, 0.5)],
    taper: [0.7, 0.5],
    twist: 40,
    divisions: 128,
  }),
);
const sections = [
  { profile: square },
  {
    profile: rectangle(0.7, 0.5),
    frame: { origin: [0.3, 1, 0] as const, rotation: [0, 15, 0] as const },
  },
  {
    profile: [
      [-0.4, -0.3],
      [0.6, -0.4],
      [0.5, 0.4],
      [-0.3, 0.5],
    ] as Profile2D,
    frame: { origin: [0.5, 2, 0.2] as const },
  },
];
const before = JSON.stringify(sections);
const capped = await measure('varied corresponding profiles, capped', () => loftProfiles(sections));
const open = await measure('same profiles, uncapped surface', () =>
  loftProfiles(sections, { cap: false }),
);
const swept = await measure('polyline sweep, scaled cross-section', () =>
  sweepProfile(
    rectangle(0.1, 0.15),
    [
      [0, 0, 0],
      [0, 1, 0],
      [0.5, 2, 0.3],
    ],
    {
      scale: [
        [1, 1],
        [0.8, 1],
        [0.6, 0.7],
      ],
    },
  ),
);
// Deliberately different inner/outer section evolution. Extend the cutter through both caps.
const wall = await measure(
  'independent tapered contours via explicit solid subtraction',
  async () => {
    const outer = new THREE.Mesh(
      loftProfiles([
        { profile: square },
        { profile: rectangle(0.7, 0.5), frame: { origin: [0, 2, 0] } },
      ]),
    );
    const inner = new THREE.Mesh(
      loftProfiles(
        [-0.1, 2.1].map((y) => ({
          profile: rectangle(0.8 - 0.15 * y, 0.7 - 0.2 * y),
          frame: { origin: [0, y, 0] },
        })),
      ),
    );
    try {
      return (await boolDiff('Wall', outer, inner, { preserveAttributes: true })).geometry;
    } finally {
      outer.geometry.dispose();
      inner.geometry.dispose();
    }
  },
);
const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
const mesh = new THREE.Mesh(wall, material);
mesh.updateMatrixWorld(true);
const thicknessSamples = [0.13, 1.07, 1.91].map((y) => {
  const hits = new THREE.Raycaster(new THREE.Vector3(-3, y, 0.137), new THREE.Vector3(1, 0, 0))
    .intersectObject(mesh)
    .map((h) => h.point.x);
  const unique = hits.filter((x, i) => !i || Math.abs(x - hits[i - 1]!) > 1e-6);
  return {
    y,
    xIntersections: unique,
    leftWallAlongX: unique[1]! - unique[0]!,
    rightWallAlongX: unique[3]! - unique[2]!,
  };
});
// A cyclic shift is explicit correspondence, but may describe a collapsed/crossed surface.
const shifted = [...square.slice(2), ...square.slice(0, 2)];
const midpointMaxRadius = Math.max(
  ...square.map(([x, z], i) => Math.hypot((x + shifted[i]![0]) / 2, (z + shifted[i]![1]) / 2)),
);
const rejections = [
  [
    'collapsed correspondence: opposite starting vertex',
    () => loftProfiles([{ profile: square }, { profile: shifted, frame: { origin: [0, 2, 0] } }]),
  ],
  [
    'unequal counts',
    () =>
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
  ],
  [
    'self-crossing outline',
    () =>
      loftProfiles([
        {
          profile: [
            [-1, -1],
            [1, 1],
            [-1, 1],
            [1, -1],
          ],
        },
        { profile: square },
      ]),
  ],
  [
    'unsupported holes',
    () => loftProfiles(sections, { cap: true, holes: [rectangle(0.5, 0.5)] } as never),
  ],
] as const;
const rejected = rejections.map(([name, make]) => {
  try {
    make();
    return { name, rejected: false, message: null };
  } catch (error) {
    return { name, rejected: true, message: (error as Error).message };
  }
});
const sources = [
  'src/sweep.ts',
  'src/profile.ts',
  'src/solids.ts',
  'src/geometry.ts',
  'bun.lock',
  'scripts/research-geometry/loft-comparison.ts',
];
const report = {
  kind: 'kiln.loft-alternatives.v1',
  rows,
  thicknessSamples,
  rejected,
  correspondenceControl: {
    midpointMaxRadius,
    interpretation:
      'The four correspondence edges coincide at mid-height; this construction is now explicitly rejected. Noncollapsing crossed surfaces can still pass. Topology counts and finite normals are not a solid-validity certificate.',
  },
  twistResolution: [twistedCoarse, twisted, twistedFine].map((g, i) => ({
    divisions: [8, 32, 128][i],
    expectedContinuousVolume: 3.9,
    actualVolume: volume(g),
    relativeVolumeError: Math.abs(volume(g) - 3.9) / 3.9,
  })),
  inputUnchanged: before === JSON.stringify(sections),
  sources: Object.fromEntries(
    sources.map((p) => [p, createHash('sha256').update(readFileSync(p)).digest('hex')]),
  ),
  limitations: [
    'Single workstation, warmed WASM after the first case; timing is descriptive, not comparative benchmarking.',
    'Wall samples measure axis-aligned section gaps, not minimum normal thickness.',
    'Explicit subtraction is demonstrated for nested tapered rectangles only; arbitrary curved/hollow lofts remain unqualified.',
    'No automatic profile matching, new helper, destination import, texture image or general self-intersection test.',
  ],
};
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
assert(Math.abs(volume(plain) - 6) < 1e-5);
assert(Math.abs(volume(tapered) - 3.9) < 1e-5);
assert(Math.abs(volume(twistedFine) - 3.9) < Math.abs(volume(twisted) - 3.9));
assert(Math.abs(volume(twisted) - 3.9) < Math.abs(volume(twistedCoarse) - 3.9));
assert(Math.abs(volume(twistedFine) - 3.9) / 3.9 < 0.01);
assert(Math.abs(volume(wall) - 2.52) < 1e-5);
assert.equal(geometryDiagnostics(open).boundaryEdges, 8);
for (const g of [plain, tapered, twistedCoarse, twisted, twistedFine, capped, swept, wall]) {
  const d = geometryDiagnostics(g);
  assert.equal(
    d.boundaryEdges + d.nonManifoldEdges + d.orientationConflicts + d.degenerateTriangles,
    0,
  );
}
assert(report.inputUnchanged && rejected.every((r) => r.rejected));
assert(
  thicknessSamples.every(
    (s) =>
      s.xIntersections.length === 4 &&
      Math.abs(s.leftWallAlongX - 0.2) < 1e-6 &&
      Math.abs(s.rightWallAlongX - 0.2) < 1e-6,
  ),
);
assert.equal(midpointMaxRadius, 0);
for (const g of [plain, tapered, twistedCoarse, twisted, twistedFine, capped, open, swept, wall])
  g.dispose();
material.dispose();
console.log(
  JSON.stringify({
    fixtures: rows.length,
    rejections: rejected.length,
    thicknessSamples,
    correspondenceControl: report.correspondenceControl,
  }),
);
