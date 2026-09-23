import { expect, test } from 'bun:test';
import * as THREE from 'three';
import { bend, twist, taper, displace } from '../deform';
import { NodeIO } from '@gltf-transform/core';
import { renderSceneToGLB } from '../render';

const cylinder = () => new THREE.CylinderGeometry(0.7, 1, 2, 16, 4);

test('identity deformation preserves authored normals, UVs and owned buffers', () => {
  const source = cylinder();
  const normals = source.getAttribute('normal').array.slice();
  for (const output of [
    twist(source, { angle: 0 }),
    bend(source, { angle: 0 }),
    taper(source, { endScale: [1, 1] }),
    displace(source, () => [0, 0, 0]),
    twist(source, { angle: 80, falloff: () => 0 }),
  ]) {
    expect(output.getAttribute('normal').array).toEqual(normals);
    expect(output.getAttribute('uv').array).toEqual(source.getAttribute('uv').array);
    expect(output.getAttribute('position').array).not.toBe(source.getAttribute('position').array);
    expect(output.groups).toEqual(source.groups);
  }
});

test('bending retains smooth UV seam normals without smoothing cap creases', () => {
  const source = cylinder();
  const output = bend(source, { angle: 50 });
  const p = output.getAttribute('position'),
    n = output.getAttribute('normal');
  for (let row = 0; row <= 4; row++) {
    const a = row * 17,
      b = a + 16;
    expect(
      new THREE.Vector3()
        .fromBufferAttribute(p, a)
        .distanceTo(new THREE.Vector3().fromBufferAttribute(p, b)),
    ).toBeLessThan(1e-6);
    expect(
      new THREE.Vector3()
        .fromBufferAttribute(n, a)
        .dot(new THREE.Vector3().fromBufferAttribute(n, b)),
    ).toBeGreaterThan(1 - 1e-6);
    expect(output.getAttribute('uv').getX(a)).toBe(0);
    expect(output.getAttribute('uv').getX(b)).toBe(1);
  }
  // Three's first top-rim cap vertex follows the side vertices and 16 center copies.
  expect(
    new THREE.Vector3()
      .fromBufferAttribute(n, 0)
      .dot(new THREE.Vector3().fromBufferAttribute(n, 5 * 17 + 16)),
  ).toBeLessThan(0.5);
  expect(source.getAttribute('position').getY(0)).toBe(1);
});

test('deformation is scale-equivariant from tiny details to large structures', () => {
  const source = cylinder();
  for (const operation of [
    (g: THREE.BufferGeometry) => twist(g, { angle: 70 }),
    (g: THREE.BufferGeometry) => bend(g, { angle: 35 }),
    (g: THREE.BufferGeometry) => taper(g, { endScale: [0.4, 1.3] }),
  ]) {
    const reference = operation(source).getAttribute('position');
    for (const scale of [1e-9, 1e-4, 1e4, 1e9]) {
      const actual = operation(source.clone().scale(scale, scale, scale));
      const p = actual.getAttribute('position'),
        n = actual.getAttribute('normal');
      let maxError = 0,
        maxNormalError = 0;
      for (let i = 0; i < p.count; i++) {
        maxError = Math.max(
          maxError,
          Math.abs(p.getX(i) / scale - reference.getX(i)),
          Math.abs(p.getY(i) / scale - reference.getY(i)),
          Math.abs(p.getZ(i) / scale - reference.getZ(i)),
        );
        maxNormalError = Math.max(
          maxNormalError,
          Math.abs(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) - 1),
        );
      }
      expect(maxError).toBeLessThan(1e-5);
      expect(maxNormalError).toBeLessThan(1e-5);
    }
  }
});

test('tangent invalidation is explicit and the source remains intact', () => {
  const source = cylinder();
  source.setAttribute(
    'tangent',
    new THREE.Float32BufferAttribute(
      new Float32Array(source.getAttribute('position').count * 4).fill(1),
      4,
    ),
  );
  const result = twist(source, { angle: 30 });
  expect(result.hasAttribute('tangent')).toBe(false);
  expect(source.hasAttribute('tangent')).toBe(true);
  expect(
    result.userData.kilnAttributeWarnings?.some(
      (w: { code: string }) => w.code === 'DEFORM_TANGENTS_DROPPED',
    ),
  ).toBe(true);
});

test('tiny explicit intervals exclude nearby outside vertices and include their endpoints', () => {
  const source = new THREE.BufferGeometry();
  source.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([1e-9, 0, 0, 1e-9, 1e-9, 0, 1e-9, 2e-9, 0], 3),
  );
  const output = twist(source, { angle: 90, interval: [0, 1e-9] });
  expect(output.getAttribute('position').getZ(1) / 1e-9).toBeCloseTo(-1, 5);
  expect(output.getAttribute('position').getX(2)).toBe(source.getAttribute('position').getX(2));
  expect(output.getAttribute('position').getZ(2)).toBe(0);
});

test('unsupported morphs and excessive vertices fail before deformation callbacks', () => {
  const source = cylinder();
  source.morphAttributes.position = [
    source.getAttribute('position').clone() as THREE.BufferAttribute,
  ];
  let calls = 0;
  expect(() =>
    displace(source, () => {
      calls++;
      return [0, 0, 0];
    }),
  ).toThrow(/morph/);
  expect(calls).toBe(0);
  source.morphAttributes = {};
  Object.defineProperty(source.getAttribute('position'), 'count', { value: 2_000_001 });
  expect(() =>
    displace(source, () => {
      calls++;
      return [0, 0, 0];
    }),
  ).toThrow(/2000000/);
  expect(calls).toBe(0);
});

test('deformed smooth seams retain valid normals and UVs through both GLB converters', async () => {
  const geometry = bend(cylinder(), { angle: 50 });
  const root = new THREE.Group();
  root.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial()));
  for (const gltfExporter of ['legacy', 'three'] as const) {
    const result = await renderSceneToGLB(root, {
      gltfExporter,
      optimize: 'off',
      derivative: true,
    });
    expect(result.gltfValidation.issues.numErrors).toBe(0);
    const doc = await new NodeIO().readBinary(result.bytes);
    for (const mesh of doc.getRoot().listMeshes())
      for (const primitive of mesh.listPrimitives()) {
        const normal = primitive.getAttribute('NORMAL')!;
        expect(primitive.getAttribute('TEXCOORD_0')).not.toBeNull();
        for (let i = 0; i < normal.getCount(); i++)
          expect(Math.hypot(...normal.getElement(i, [] as number[]))).toBeCloseTo(1, 5);
      }
  }
});
