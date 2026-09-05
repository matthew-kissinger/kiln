import { expect, it } from 'bun:test';
import * as THREE from 'three';
import { NodeIO } from '@gltf-transform/core';
import { boolDiff, boolUnion } from '../solids';
import { renderGLB } from '../render';
const box = (name: string, size: number, color: number, x = 0) => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size, size, size),
    new THREE.MeshStandardMaterial({ color }),
  );
  mesh.name = name;
  mesh.position.x = x;
  return mesh;
};
it('preserves operand UVs and cut-face materials on request', async () => {
  const body = box('Body', 2, 0xff0000),
    cutter = box('Cutter', 1, 0x0000ff, 1);
  const result = await boolDiff('Cut', body, cutter, { preserveAttributes: true });
  expect(Array.isArray(result.material)).toBe(true);
  expect(result.geometry.getAttribute('uv').count).toBe(
    result.geometry.getAttribute('position').count,
  );
  expect(Array.from(result.geometry.getAttribute('uv').array).every(Number.isFinite)).toBe(true);
  expect(result.geometry.groups.length).toBeGreaterThanOrEqual(2);
  expect(
    result.geometry.userData.kilnCsgProvenance.runs.map(
      (r: { sourceName: string }) => r.sourceName,
    ),
  ).toEqual(expect.arrayContaining(['Body', 'Cutter']));
  expect(
    result.geometry.userData.kilnCsgProvenance.runs.some((r: { backside: boolean }) => r.backside),
  ).toBe(true);
  expect(body.geometry.getAttribute('position').count).toBe(24);
  const legacy = await boolDiff('Legacy', body, cutter);
  expect(legacy.geometry.getAttribute('uv')).toBeUndefined();
  expect(legacy.material).toBe(body.material);
});
it('does not fabricate provenance for completely removed operands', async () => {
  const result = await boolUnion(
    'Contains',
    box('Outer', 3, 0xff0000),
    box('Inner', 0.5, 0x00ff00),
    { preserveAttributes: true },
  );
  expect(
    result.geometry.userData.kilnCsgProvenance.runs.every(
      (r: { sourceName: string }) => r.sourceName === 'Outer',
    ),
  ).toBe(true);
  const count =
    (result.geometry.index?.count ?? result.geometry.getAttribute('position').count) / 3;
  expect(
    result.geometry.userData.kilnRanges.reduce(
      (sum: number, r: { count: number }) => sum + r.count,
      0,
    ),
  ).toBe(count);
});
it('retains named sources and materials across a second boolean', async () => {
  const first = await boolUnion('First', box('Red', 1, 0xff0000), box('Green', 1, 0x00ff00, 0.5), {
    preserveAttributes: true,
  });
  const second = await boolDiff('Second', first, box('Blue cutter', 0.5, 0x0000ff, 0.7), {
    preserveAttributes: true,
  });
  const names = second.geometry.userData.kilnCsgProvenance.runs.map(
    (r: { sourceName: string }) => r.sourceName,
  );
  expect(names).toEqual(expect.arrayContaining(['Red', 'Green', 'Blue cutter']));
  expect((second.material as THREE.Material[]).length).toBe(3);
});
it('exports material groups into GLB primitives with correct triangle coverage', async () => {
  const result = await renderGLB(
    `const meta={name:'Groups',category:'prop'};function build(){const root=createRoot('Root');const a=gameMaterial(0xff0000),b=gameMaterial(0x0000ff);const g=boxGeo(1,1,1);for(const group of g.groups)group.materialIndex=group.materialIndex%2;const mesh=new THREE.Mesh(g,[a,b]);mesh.name='Mesh_Groups';root.add(mesh);return root;}`,
  );
  const document = await new NodeIO().readBinary(result.glb);
  const primitives = document
    .getRoot()
    .listMeshes()
    .flatMap((m) => m.listPrimitives());
  expect(new Set(primitives.map((p) => p.getMaterial()!.getBaseColorFactor().join(','))).size).toBe(
    2,
  );
  expect(primitives.reduce((sum, p) => sum + p.getIndices()!.getCount() / 3, 0)).toBe(12);
  expect(
    result.warnings.some((w) => w.includes('material groups') && w.includes('not preserved')),
  ).toBe(false);
});
import { boolIntersect, hull } from '../solids';

it('retained UV coordinates agree with source-face interpolation, including cut faces', async () => {
  const body = box('Body', 2, 0xff0000),
    cutter = box('Cutter', 1, 0x0000ff, 0.8);
  cutter.rotation.z = 0.2;
  const result = await boolDiff('Carved', body, cutter, { preserveAttributes: true });
  const output = result.geometry,
    p = output.getAttribute('position'),
    uv = output.getAttribute('uv');
  for (const run of output.userData.kilnCsgProvenance.runs) {
    const source = run.sourceName === 'Body' ? body : cutter;
    source.updateWorldMatrix(true, false);
    const sp = source.geometry.getAttribute('position'),
      su = source.geometry.getAttribute('uv'),
      si = source.geometry.index!;
    for (let v = run.start * 3; v < (run.start + run.count) * 3; v++) {
      const point = new THREE.Vector3().fromBufferAttribute(p, v);
      let matched = false;
      for (let t = 0; t < si.count; t += 3) {
        const vertices = [0, 1, 2].map((k) =>
          new THREE.Vector3()
            .fromBufferAttribute(sp, si.getX(t + k))
            .applyMatrix4(source.matrixWorld),
        );
        const triangle = new THREE.Triangle(vertices[0]!, vertices[1]!, vertices[2]!);
        const bary = triangle.getBarycoord(point, new THREE.Vector3());
        if (
          !bary ||
          Math.min(bary.x, bary.y, bary.z) < -1e-5 ||
          triangle.closestPointToPoint(point, new THREE.Vector3()).distanceTo(point) > 1e-5
        )
          continue;
        const weights = [bary.x, bary.y, bary.z];
        const expectedUV = [0, 1].map((component) =>
          weights.reduce((sum, w, k) => sum + w * su.getComponent(si.getX(t + k), component), 0),
        );
        if (
          Math.abs(expectedUV[0]! - uv.getX(v)) < 1e-5 &&
          Math.abs(expectedUV[1]! - uv.getY(v)) < 1e-5
        ) {
          matched = true;
          break;
        }
      }
      expect(matched).toBe(true);
    }
  }
});

it('supports reflected parent transforms and reports missing UVs and generated hull provenance', async () => {
  const parent = new THREE.Group();
  parent.position.set(3, 0, 0);
  parent.scale.x = -1;
  const body = box('Reflected', 2, 0xff0000);
  parent.add(body);
  const cutter = box('Cutter', 1, 0x0000ff, 3.8);
  cutter.geometry.deleteAttribute('uv');
  const result = await boolIntersect('Intersection', body, cutter, {
    preserveAttributes: true,
    smooth: true,
  });
  expect(result.geometry.boundingBox!.min.x).toBeGreaterThan(2);
  expect(result.geometry.userData.kilnAttributeWarnings[0].code).toBe('CSG_UV_MISSING');
  const wrapped = await hull('Wrap', body, cutter, { preserveAttributes: true });
  expect(wrapped.geometry.getAttribute('uv')).toBeUndefined();
  expect(wrapped.geometry.userData.kilnCsgProvenance.unknownTriangles).toBeGreaterThan(0);
  expect(
    wrapped.geometry.userData.kilnRanges.every(
      (r: { certainty: string }) => r.certainty === 'unknown',
    ),
  ).toBe(true);
});
it('keeps source face IDs alongside real output triangle runs', async () => {
  const mesh = await boolDiff('Faces', box('Shell', 2, 0xff0000), box('Port', 1, 0x0000ff, 0.9), {
    preserveAttributes: true,
  });
  const provenance = mesh.geometry.userData.kilnCsgProvenance;
  expect(provenance.faceIds.length).toBe(mesh.geometry.getAttribute('position').count / 3);
  expect(provenance.faceIds.every((id: number) => Number.isInteger(id) && id >= 0 && id < 12)).toBe(
    true,
  );
});
it('smooths across retained UV seams without changing material boundaries', async () => {
  const result = await boolUnion('Smooth', box('A', 1, 0xff0000), box('B', 1, 0x00ff00, 0.5), {
    preserveAttributes: true,
    smooth: true,
  });
  const position = result.geometry.getAttribute('position'),
    normal = result.geometry.getAttribute('normal');
  const seen = new Map<string, THREE.Vector3>();
  for (let i = 0; i < position.count; i++) {
    const key = [position.getX(i), position.getY(i), position.getZ(i)].join(',');
    const n = new THREE.Vector3().fromBufferAttribute(normal, i),
      prior = seen.get(key);
    if (prior) expect(prior.dot(n)).toBeCloseTo(1, 5);
    else seen.set(key, n);
  }
  expect(result.geometry.index).not.toBeNull();
  expect(result.geometry.groups.length).toBeGreaterThan(1);
});
