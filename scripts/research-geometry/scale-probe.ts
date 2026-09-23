/** Offline measured probes; failures are retained as findings, not silently skipped. */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { geometryDiagnostics } from '../../src/geometry';
import { boolDiff, boolIntersect, boolUnion, hull } from '../../src/solids';

const rows: Record<string, unknown>[] = [];
for (const scale of [1e-12, 1e-9, 1e-6, 1, 1e6, 1e9, 1e12]) {
  for (const originRatio of [0, 1e8]) {
    for (const preserveAttributes of [false, true]) {
      for (const operation of ['union', 'difference', 'intersection', 'hull'] as const) {
        const row = { scale, originRatio, preserveAttributes, operation };
        const origin = scale * originRatio;
        const a = new THREE.Mesh(
          new THREE.BoxGeometry(scale, scale, scale),
          new THREE.MeshStandardMaterial(),
        );
        const b = new THREE.Mesh(
          new THREE.BoxGeometry(scale, scale, scale),
          new THREE.MeshStandardMaterial(),
        );
        a.position.x = origin;
        b.position.x = origin + scale * 0.5;
        a.name = 'Body';
        b.name = 'Offset';
        try {
          const options = { preserveAttributes };
          const mesh =
            operation === 'union'
              ? await boolUnion('Result', a, b, options)
              : operation === 'difference'
                ? await boolDiff('Result', a, b, options)
                : operation === 'intersection'
                  ? await boolIntersect('Result', a, b, options)
                  : await hull('Result', a, b, options);
          mesh.updateWorldMatrix(true, false);
          const position = mesh.geometry.getAttribute('position');
          const normal = mesh.geometry.getAttribute('normal');
          const index = mesh.geometry.index;
          const vertices = Array.from({ length: position.count }, (_, i) => {
            const point = new THREE.Vector3()
              .fromBufferAttribute(position, i)
              .applyMatrix4(mesh.matrixWorld);
            return point.sub(new THREE.Vector3(origin, 0, 0)).divideScalar(scale);
          });
          let volume = 0;
          for (let i = 0; i < (index?.count ?? position.count); i += 3) {
            const p = [0, 1, 2].map((k) => vertices[index ? index.getX(i + k) : i + k]!);
            volume += p[0]!.dot(new THREE.Vector3().crossVectors(p[1]!, p[2]!)) / 6;
          }
          const normalizedBounds = new THREE.Box3()
            .setFromPoints(vertices)
            .getSize(new THREE.Vector3())
            .toArray();
          const expectedVolume = operation === 'union' || operation === 'hull' ? 1.5 : 0.5;
          rows.push({
            ...row,
            outcome: 'returned',
            normalizedBounds,
            volume,
            expectedVolume,
            volumeError: Math.abs(volume - expectedVolume),
            diagnostics: geometryDiagnostics(mesh.geometry),
            invalidNormalCount: Array.from({ length: normal.count }, (_, i) =>
              new THREE.Vector3().fromBufferAttribute(normal, i).length(),
            ).filter((n) => !Number.isFinite(n) || Math.abs(n - 1) > 1e-4).length,
          });
        } catch (error) {
          rows.push({
            ...row,
            outcome: 'error',
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }
}
const paths = ['src/geometry.ts', 'src/solids.ts', 'bun.lock'];
const result = {
  kind: 'kiln.geometry-scale-probe.v1',
  scope: 'CSG box fixtures only; no general solid or export qualification',
  sources: Object.fromEntries(
    paths.map((path) => [path, createHash('sha256').update(readFileSync(path)).digest('hex')]),
  ),
  rows,
};
if (!process.argv[2]) throw new Error('Pass an output JSON path.');
writeFileSync(process.argv[2], `${JSON.stringify(result, null, 2)}\n`);
console.log(
  JSON.stringify({
    rows: rows.length,
    returned: rows.filter((r) => r.outcome === 'returned').length,
    errors: rows.filter((r) => r.outcome === 'error').length,
    inaccurate: rows.filter((r) => r.outcome === 'returned' && Number(r.volumeError) > 1e-4).length,
  }),
);
