import { expect, test } from 'bun:test';
import * as THREE from 'three';
import { subdivide } from '../ops';
import { geometryDiagnostics } from '../geometry';

test('both subdivision paths preserve topology and shape across unit scales', () => {
  for (const preserveUV of [false, true]) {
    const options = { preserveUV, split: false };
    const unit = subdivide(new THREE.BoxGeometry(1, 1.5, 2), 1, options);
    const reference = unit.getAttribute('position');
    for (const scale of [1e-8, 1e-3, 1e6]) {
      const source = new THREE.BoxGeometry(scale, 1.5 * scale, 2 * scale);
      const before = source.getAttribute('position').array.slice();
      const output = subdivide(source, 1, options);
      const p = output.getAttribute('position');
      expect(p.count).toBe(reference.count);
      let maxError = 0;
      for (let i = 0; i < p.count; i++)
        for (let j = 0; j < 3; j++)
          maxError = Math.max(
            maxError,
            Math.abs(p.getComponent(i, j) / scale - reference.getComponent(i, j)),
          );
      expect(maxError).toBeLessThan(1e-5);
      expect(geometryDiagnostics(output, scale * 1e-6)).toMatchObject({
        boundaryEdges: 0,
        nonManifoldEdges: 0,
        degenerateTriangles: 0,
      });
      expect(source.getAttribute('position').array).toEqual(before);
    }
  }
});

test('position-only subdivision reports removed attributes and material groups', () => {
  const source = new THREE.BoxGeometry();
  source.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(new Float32Array(24 * 3).fill(0.5), 3),
  );
  source.setAttribute(
    'tangent',
    new THREE.Float32BufferAttribute(new Float32Array(24 * 4).fill(1), 4),
  );
  source.userData.kilnAttributeWarnings = [
    { code: 'SOURCE_NOTE', message: 'Keep the source diagnostic.' },
  ];
  const output = subdivide(source, 1, { split: false });
  const warnings = output.userData.kilnAttributeWarnings as { code: string; message: string }[];
  expect(warnings.some((w) => w.code === 'SOURCE_NOTE')).toBe(true);
  expect(
    warnings.some(
      (w) =>
        w.code === 'SUBDIVIDE_ATTRIBUTES_DROPPED' &&
        w.message.includes('color') &&
        w.message.includes('tangent'),
    ),
  ).toBe(true);
  expect(warnings.some((w) => w.code === 'SUBDIVIDE_GROUPS_DROPPED')).toBe(true);
  expect(source.getAttribute('color').count).toBe(24);
  expect(source.groups.length).toBe(6);
});

test('preserving subdivision retains material coverage, colors and absolute morph deltas', () => {
  const source = new THREE.BoxGeometry();
  source.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(new Float32Array(24 * 3).fill(0.5), 3),
  );
  const morph = source.getAttribute('position').clone() as THREE.BufferAttribute;
  for (let i = 0; i < morph.count; i++)
    morph.setXYZ(i, morph.getX(i) + 0.1, morph.getY(i) + 0.2, morph.getZ(i) + 0.3);
  source.morphAttributes.position = [morph];
  const output = subdivide(source, 1, { split: false, preserveUV: true });
  expect(output.groups.length).toBe(6);
  expect(output.groups.reduce((sum, group) => sum + group.count, 0)).toBe(
    output.getAttribute('position').count,
  );
  expect(output.getAttribute('color').count).toBe(output.getAttribute('position').count);
  const result = output.morphAttributes.position![0]!;
  const p = output.getAttribute('position');
  let maxError = 0;
  for (let i = 0; i < p.count; i++)
    for (let k = 0; k < 3; k++)
      maxError = Math.max(
        maxError,
        Math.abs(result.getComponent(i, k) - p.getComponent(i, k) - [0.1, 0.2, 0.3][k]!),
      );
  expect(maxError).toBeLessThan(1e-5);
  const stripped = subdivide(source, 1, { split: false });
  expect(
    stripped.userData.kilnAttributeWarnings.some(
      (w: { code: string }) => w.code === 'SUBDIVIDE_MORPHS_DROPPED',
    ),
  ).toBe(true);
});

test('subdivision rejects skin attributes instead of interpolating discrete joint indices', () => {
  const source = new THREE.BoxGeometry();
  source.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(24 * 4), 4));
  source.setAttribute(
    'skinWeight',
    new THREE.Float32BufferAttribute(new Float32Array(24 * 4).fill(0.25), 4),
  );
  expect(() => subdivide(source, 1, { preserveUV: true })).toThrow(/skin.*before/i);
});

test('preserving subdivision interpolates all four color components and normalized storage', () => {
  const source = new THREE.BoxGeometry();
  const p = source.getAttribute('position');
  const rgba = new Float32Array(p.count * 4);
  for (let i = 0; i < p.count; i++) {
    rgba[i * 4] = p.getX(i) + 0.5;
    rgba[i * 4 + 1] = p.getY(i) + 0.5;
    rgba[i * 4 + 2] = p.getZ(i) + 0.5;
    rgba[i * 4 + 3] = (p.getX(i) + p.getY(i) + p.getZ(i)) / 6 + 0.5;
  }
  source.setAttribute('color', new THREE.Float32BufferAttribute(rgba, 4));
  source.setAttribute(
    'mask',
    new THREE.Uint8BufferAttribute(new Uint8Array(p.count).fill(128), 1, true),
  );
  const output = subdivide(source, 2, { split: false, preserveUV: true });
  const color = output.getAttribute('color'),
    position = output.getAttribute('position');
  expect(Array.from(color.array).every(Number.isFinite)).toBe(true);
  let maxError = 0;
  for (let i = 0; i < color.count; i++) {
    maxError = Math.max(
      maxError,
      Math.abs(color.getX(i) - position.getX(i) - 0.5),
      Math.abs(color.getY(i) - position.getY(i) - 0.5),
      Math.abs(color.getZ(i) - position.getZ(i) - 0.5),
      Math.abs(color.getW(i) - (position.getX(i) + position.getY(i) + position.getZ(i)) / 6 - 0.5),
    );
  }
  expect(maxError).toBeLessThan(1e-5);
  expect(output.getAttribute('mask').getX(0)).toBeCloseTo(128 / 255, 6);
  expect(Object.keys(output.attributes).sort()).toEqual(
    ['position', 'normal', 'uv', 'color', 'mask'].sort(),
  );
  expect(source.getAttribute('color').array).toEqual(rgba);
});
