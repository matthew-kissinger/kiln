import { expect, test } from 'bun:test';
import { NodeIO } from '@gltf-transform/core';
import * as THREE from 'three';
import { geometryDiagnostics } from '../geometry';
import { renderSceneToGLB } from '../render';
import { boolDiff, boolIntersect, boolUnion, hull } from '../solids';

function operands(scale = 1, origin = 1e8) {
  const a = new THREE.Mesh(
    new THREE.BoxGeometry(scale, scale, scale),
    new THREE.MeshStandardMaterial({ color: 0xff0000 }),
  );
  const b = new THREE.Mesh(
    new THREE.BoxGeometry(scale, scale, scale),
    new THREE.MeshStandardMaterial({ color: 0x0000ff }),
  );
  a.name = 'Body';
  b.name = 'Cutter';
  a.position.set(origin, 0, 0);
  b.position.set(origin + 0.5 * scale, 0, 0);
  return { a, b };
}

test('CSG preserves analytical world shape at distant origins across scales and preservation modes', async () => {
  for (const scale of [1e-12, 1, 1e12]) {
    for (const preserveAttributes of [false, true]) {
      for (const [operation, expectedWidth] of [
        [boolUnion, 1.5],
        [boolDiff, 0.5],
        [boolIntersect, 0.5],
        [hull, 1.5],
      ] as const) {
        const origin = 1e8 * scale;
        const { a, b } = operands(scale, origin);
        const input = Array.from(a.geometry.getAttribute('position').array);
        const result = await operation('Result', a, b, { preserveAttributes });
        const bounds = new THREE.Box3().setFromObject(result);
        expect(bounds.getSize(new THREE.Vector3()).x / scale).toBeCloseTo(expectedWidth, 5);
        expect((bounds.min.x - origin) / scale).toBeCloseTo(
          operation === boolIntersect ? 0 : -0.5,
          5,
        );
        expect(geometryDiagnostics(result.geometry)).toMatchObject({
          boundaryEdges: 0,
          nonManifoldEdges: 0,
          orientationConflicts: 0,
          degenerateTriangles: 0,
        });
        expect(Array.from(a.geometry.getAttribute('position').array)).toEqual(input);
        expect(a.position.x).toBe(origin);
      }
    }
  }
});

test('CSG retains distinct parent transforms and composes another boolean from its returned mesh', async () => {
  const { a, b } = operands();
  const parent = new THREE.Group();
  parent.position.set(1e8, 3, 0);
  parent.scale.set(-2, 1, 1);
  parent.rotation.z = Math.PI / 2;
  a.position.set(0, 0, 0);
  b.position.set(0.5, 0, 0);
  parent.add(a, b);
  const first = await boolUnion('First', a, b, { preserveAttributes: true });
  const expected = new THREE.Box3().setFromObject(parent);
  const actual = new THREE.Box3().setFromObject(first);
  expect(actual.min.distanceTo(expected.min)).toBeLessThan(1e-5);
  expect(actual.max.distanceTo(expected.max)).toBeLessThan(1e-5);
  const second = await boolIntersect('Second', first, a, { preserveAttributes: true });
  const aBounds = new THREE.Box3().setFromObject(a);
  const secondBounds = new THREE.Box3().setFromObject(second);
  expect(secondBounds.min.distanceTo(aBounds.min)).toBeLessThan(1e-5);
  expect(secondBounds.max.distanceTo(aBounds.max)).toBeLessThan(1e-5);
  expect(a.parent).toBe(parent);
});

for (const gltfExporter of ['legacy', 'three'] as const) {
  test(`${gltfExporter} exports distant CSG with local detail, world placement, UVs and cut-face materials`, async () => {
    const { a, b } = operands();
    const cut = await boolDiff('Cut', a, b, { preserveAttributes: true });
    const root = new THREE.Group();
    root.add(cut);
    const result = await renderSceneToGLB(root, { gltfExporter, optimize: 'off' });
    expect(result.gltfValidation.issues.numErrors).toBe(0);
    const doc = await new NodeIO().readBinary(result.bytes);
    const bounds = new THREE.Box3();
    const materials = new Set<string>();
    for (const node of doc.getRoot().listNodes()) {
      const matrix = new THREE.Matrix4().fromArray(node.getWorldMatrix());
      for (const primitive of node.getMesh()?.listPrimitives() ?? []) {
        const p = primitive.getAttribute('POSITION')!;
        expect(primitive.getAttribute('TEXCOORD_0')?.getCount()).toBe(p.getCount());
        materials.add(JSON.stringify(primitive.getMaterial()!.getBaseColorFactor()));
        for (let i = 0; i < p.getCount(); i++)
          bounds.expandByPoint(
            new THREE.Vector3().fromArray(p.getElement(i, [])).applyMatrix4(matrix),
          );
      }
    }
    expect(bounds.min.x - 1e8).toBeCloseTo(-0.5, 5);
    expect(bounds.max.x - 1e8).toBeCloseTo(0, 5);
    expect(materials.size).toBe(2);
  });
}
