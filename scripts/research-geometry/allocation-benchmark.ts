/** Offline admission/ordinary-workload measurements. Run after other CPU-heavy gates. */
import * as THREE from 'three';
import { readFileSync, writeFileSync } from 'node:fs';
import { parametricSurface } from '../../src/geometry';
import { subdivide, arrayLinear, arrayRadial } from '../../src/ops';
import { GEOMETRY_ALLOCATION_LIMITS } from '../../src/geometry-budget';
const results: unknown[] = [];
function geometry(name: string, make: () => THREE.BufferGeometry) {
  const start = performance.now();
  const value = make();
  results.push({
    name,
    milliseconds: Math.round((performance.now() - start) * 100) / 100,
    vertices: value.getAttribute('position').count,
    triangles: (value.index?.count ?? value.getAttribute('position').count) / 3,
  });
  value.dispose();
}
geometry('parametric ordinary 80x80', () =>
  parametricSurface((u, v) => [u, Math.sin(u) * Math.cos(v), v], { uSegments: 80, vSegments: 80 }),
);
geometry('parametric admitted boundary 511x511', () =>
  parametricSurface((u, v) => [u, Math.sin(u) * Math.cos(v), v], {
    uSegments: 511,
    vSegments: 511,
  }),
);
for (const iterations of [3, 5])
  geometry(`subdivide box ${iterations}`, () => {
    const source = new THREE.BoxGeometry();
    try {
      return subdivide(source, iterations, { preserveUV: true });
    } finally {
      source.dispose();
    }
  });
const source = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
source.position.x = 2;
for (const count of [1000, 10000])
  for (const kind of ['linear', 'radial']) {
    const start = performance.now();
    const copies =
      kind === 'linear'
        ? arrayLinear('Copy', source, count, [0.1, 0, 0])
        : arrayRadial('Copy', source, count);
    results.push({
      name: `${kind} ${count}`,
      milliseconds: Math.round((performance.now() - start) * 100) / 100,
      copies: copies.length,
      sharedGeometry: copies.every((copy) => (copy as THREE.Mesh).geometry === source.geometry),
    });
  }
source.geometry.dispose();
(source.material as THREE.Material).dispose();
const report = {
  runtime: `bun@${process.versions.bun}`,
  nodeCompatibilityVersion: process.version,
  bun: process.versions.bun,
  platform: process.platform,
  architecture: process.arch,
  sourceIdentity: JSON.parse(readFileSync('dist/build.json', 'utf8')).entries.worker.identity,
  limits: GEOMETRY_ALLOCATION_LIMITS,
  results,
  processMaxRssKiB: process.resourceUsage().maxRSS,
  limitation:
    'Single warm process on this workstation; timings and process RSS are observations, not peak-memory or cross-platform guarantees.',
};
const output = process.argv[2];
if (output) writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
