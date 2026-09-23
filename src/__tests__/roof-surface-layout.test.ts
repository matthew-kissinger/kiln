import { expect, test } from 'bun:test';
import * as THREE from 'three';
import { createGableRoof, createRoofSurfaceLayout, type RoofFaceFrame } from '../architecture';

function faceBounds(item: THREE.Object3D, face: RoofFaceFrame): THREE.Box3 {
  item.updateWorldMatrix(true, false);
  const matrix = face.localToWorld.clone().invert().multiply(item.matrixWorld);
  const bounds = new THREE.Box3();
  const position = (item as THREE.Mesh).geometry.getAttribute('position');
  for (let i = 0; i < position.count; i++)
    bounds.expandByPoint(new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(matrix));
  return bounds;
}

for (const axis of ['x', 'z'] as const)
  test(`every surface family stays inside ridge-${axis} faces after parent transforms`, () => {
    const parent = new THREE.Group();
    parent.position.set(5, 3, -7);
    parent.rotation.set(0.2, 0.5, -0.3);
    parent.scale.set(-1.5, 0.8, 2);
    const material = new THREE.MeshStandardMaterial();
    const roof = createGableRoof('Roof', material, {
      spanX: 2.3,
      spanZ: 1.7,
      rise: 0.7,
      ridgeAxis: axis,
      parent,
    });
    for (const face of roof.faces)
      for (const kind of ['panels', 'shingles', 'seams', 'corrugations'] as const) {
        const layout = createRoofSurfaceLayout('Detail', material, {
          face,
          kind,
          panelWidth: 0.8,
          rowHeight: 0.4,
          spacing: 0.7,
        });
        expect(layout.items.length).toBeGreaterThan(0);
        for (const item of layout.items) {
          const bounds = faceBounds(item, face);
          expect(bounds.min.x).toBeGreaterThanOrEqual(-face.dimensions.alongRidge / 2 - 1e-6);
          expect(bounds.max.x).toBeLessThanOrEqual(face.dimensions.alongRidge / 2 + 1e-6);
          expect(bounds.min.z).toBeGreaterThanOrEqual(-1e-6);
          expect(bounds.max.z).toBeLessThanOrEqual(face.dimensions.downhill + 1e-6);
          expect(bounds.min.y).toBeCloseTo(0.002, 6);
        }
        expect(layout.cost).toEqual({
          meshes: layout.items.length,
          triangles: layout.items.length * 12,
        });
      }
  });

test('staggered shingles include clipped edge tiles and a short final row, including tiny faces', () => {
  const material = new THREE.MeshStandardMaterial();
  for (const along of [0.01, 0.3, 2.3]) {
    const roof = createGableRoof('Roof', material, {
      spanX: along,
      spanZ: 1.8,
      rise: 0.4,
      ridgeAxis: 'x',
    });
    const face = roof.faces[0];
    const layout = createRoofSurfaceLayout('Tiles', material, {
      face,
      kind: 'shingles',
      panelWidth: 0.8,
      rowHeight: 0.4,
    });
    const rows = new Map<number, THREE.Box3[]>();
    for (const item of layout.items) {
      const bounds = faceBounds(item, face);
      const row = Math.round(bounds.min.z / 0.4);
      rows.set(row, [...(rows.get(row) ?? []), bounds]);
    }
    const count = Math.ceil(face.dimensions.downhill / 0.4);
    expect(rows.size).toBe(count);
    for (const [row, boxes] of rows) {
      boxes.sort((a, b) => a.min.x - b.min.x);
      expect(boxes[0]!.min.x + along / 2).toBeLessThanOrEqual(0.8 * 0.02 + 1e-6);
      expect(along / 2 - boxes.at(-1)!.max.x).toBeLessThanOrEqual(0.8 * 0.02 + 1e-6);
      for (let i = 1; i < boxes.length; i++)
        expect(boxes[i]!.min.x - boxes[i - 1]!.max.x).toBeLessThanOrEqual(0.8 * 0.04 + 1e-6);
      expect(boxes[0]!.min.z).toBeCloseTo(row * 0.4, 6);
      if (row === count - 1) expect(boxes[0]!.max.z).toBeCloseTo(face.dimensions.downhill, 6);
    }
  }
});

test('invalid layout requests leave the destination hierarchy untouched', () => {
  const material = new THREE.MeshStandardMaterial();
  const face = createGableRoof('Roof', material, { spanX: 2, spanZ: 2, rise: 1 }).faces[0];
  const parent = new THREE.Group();
  for (const options of [
    { kind: 'guess' },
    { kind: 'panels', thickness: 0 },
    { kind: 'shingles', rowHeight: -1 },
  ]) {
    expect(() =>
      createRoofSurfaceLayout('Invalid', material, { ...options, face, parent } as never),
    ).toThrow();
    expect(parent.children).toHaveLength(0);
  }
});

test('surface repetition rejects unsafe count products before attaching a root', () => {
  const material = new THREE.MeshStandardMaterial();
  const face = createGableRoof('Roof', material, { spanX: 2, spanZ: 2, rise: 1 }).faces[0];
  const parent = new THREE.Group();
  for (const kind of ['panels', 'shingles', 'seams', 'corrugations'] as const) {
    expect(() =>
      createRoofSurfaceLayout('Huge', material, {
        face,
        parent,
        kind,
        panelWidth: 1e-20,
        rowHeight: 1e-20,
        spacing: 1e-20,
      }),
    ).toThrow(/count.*10000/);
    expect(parent.children.length).toBe(0);
  }
  expect(() =>
    createRoofSurfaceLayout('BadFace', material, {
      face: { ...face, dimensions: { ...face.dimensions, alongRidge: NaN } },
      parent,
      kind: 'panels',
    }),
  ).toThrow(/alongRidge/);
  expect(parent.children.length).toBe(0);
});

test('separate rigid parents place exact faces and impossible TRS rebasing fails visibly', () => {
  const material = new THREE.MeshStandardMaterial();
  const roof = createGableRoof('Roof', material, { spanX: 2, spanZ: 2, rise: 1 });
  roof.root.position.set(4, -3, 7);
  roof.root.rotation.y = 0.7;
  const parent = new THREE.Group();
  parent.position.set(-5, 2, 1);
  parent.rotation.set(0.1, -0.3, 0.2);
  parent.scale.setScalar(0.5);
  const face = roof.faces[1];
  const layout = createRoofSurfaceLayout('Placed', material, { face, parent, kind: 'seams' });
  for (const item of layout.items) {
    const bounds = faceBounds(item, face);
    expect(bounds.min.y).toBeCloseTo(0.002, 6);
    expect(bounds.min.z).toBeCloseTo(0, 6);
    expect(bounds.max.z).toBeCloseTo(face.dimensions.downhill, 6);
  }
  parent.scale.set(1, 2, 3);
  expect(() =>
    createRoofSurfaceLayout('Sheared', material, { face, parent, kind: 'panels' }),
  ).toThrow(/shear/);
  expect(parent.children.length).toBe(1);
  parent.scale.x = 0;
  expect(() =>
    createRoofSurfaceLayout('Singular', material, { face, parent, kind: 'panels' }),
  ).toThrow(/singular/);
  expect(parent.children.length).toBe(1);
});
