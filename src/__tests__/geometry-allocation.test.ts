import { expect, test } from 'bun:test';
import * as THREE from 'three';
import { parametricSurface } from '../geometry';
import { arrayLinear, arrayRadial, subdivide } from '../ops';

test('parametric sampling rejects unsafe products before invoking user code', () => {
  for (const [uSegments, vSegments] of [
    [Number.MAX_SAFE_INTEGER, 1],
    [512, 512],
    [1, 262144],
  ]) {
    let calls = 0;
    expect(() =>
      parametricSurface(
        () => {
          calls++;
          throw new Error('SAMPLE_WAS_CALLED');
        },
        { uSegments, vSegments },
      ),
    ).toThrow('sample budget');
    expect(calls).toBe(0);
  }
});
test('ordinary parametric sampling retains exact endpoints, UVs and triangle count', () => {
  let calls = 0;
  const g = parametricSurface(
    (u, v) => {
      calls++;
      return [u, u * v, v];
    },
    { u: [-2, 3], v: [4, 8], uSegments: 7, vSegments: 11 },
  );
  expect(calls).toBe(96);
  expect(g.getAttribute('position').count).toBe(96);
  expect(g.index?.count).toBe(7 * 11 * 6);
  expect(Array.from(g.getAttribute('position').array).slice(-3)).toEqual([3, 24, 8]);
  expect(Array.from(g.getAttribute('uv').array).slice(-2)).toEqual([1, 1]);
});
test('subdivision rejects invalid or excessive growth before cloning or welding', () => {
  for (const iterations of [NaN, Infinity, -1, 0.5, Number.MAX_SAFE_INTEGER, 10]) {
    const g = new THREE.BoxGeometry();
    let clones = 0;
    g.clone = () => {
      clones++;
      throw new Error('CLONE_WAS_CALLED');
    };
    expect(() => subdivide(g, iterations, { weld: false })).toThrow('subdivide');
    expect(clones).toBe(0);
  }
});
test('repetition rejects invalid counts before touching the destination graph', () => {
  for (const count of [NaN, Infinity, -1, 0, 1.5, 10001, Number.MAX_SAFE_INTEGER])
    for (const radial of [false, true]) {
      const source = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
      const parent = new THREE.Group();
      let adds = 0;
      parent.add = () => {
        adds++;
        throw new Error('PARENT_WAS_TOUCHED');
      };
      expect(() =>
        radial
          ? arrayRadial('Copy', source, count, 'y', parent)
          : arrayLinear('Copy', source, count, [1, 0, 0], parent),
      ).toThrow('count');
      expect(adds).toBe(0);
    }
});
test('repetition rejects invalid frames before attaching any copies', () => {
  const source = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
  const parent = new THREE.Group();
  expect(() => arrayLinear('Copy', source, 3, [NaN, 0, 0], parent)).toThrow('offset');
  expect(() => arrayLinear('Copy', source, 4, [Number.MAX_VALUE, 0, 0], parent)).toThrow(
    'position',
  );
  expect(() => arrayRadial('Copy', source, 3, 'bad' as 'x', parent)).toThrow('axis');
  expect(() => arrayRadial('Copy', source, 3, 'y', parent, [0, Infinity, 0])).toThrow('center');
  expect(() =>
    arrayRadial('Copy', source, 3, 'y', parent, undefined, { orientation: 'bad' as 'outward' }),
  ).toThrow('orientation');
  expect(parent.children).toHaveLength(0);
});
test('bounded subdivision and repetitions preserve their ownership and count contracts', () => {
  const g = new THREE.BoxGeometry();
  const before = Array.from(g.getAttribute('position').array);
  const output = subdivide(g, 2, { split: false });
  expect(output.getAttribute('position').count / 3).toBe(12 * 16);
  expect(output).not.toBe(g);
  expect(Array.from(g.getAttribute('position').array)).toEqual(before);
  const source = new THREE.Mesh(g, new THREE.MeshStandardMaterial());
  source.position.x = 2;
  expect(arrayLinear('Copy', source, 1, [1, 0, 0])).toEqual([]);
  expect(arrayLinear('Copy', source, 4, [1, 0, 0]).map((o) => o.position.x)).toEqual([3, 4, 5]);
  const copies = arrayRadial('Copy', source, 4);
  expect(copies).toHaveLength(3);
  expect(copies.every((o) => (o as THREE.Mesh).geometry === g)).toBe(true);
});

test('parametric sample budget includes the exact boundary and rejects overflowing domains', () => {
  let calls = 0;
  const stop = () => {
    calls++;
    throw new Error('SAMPLE_SENTINEL');
  };
  expect(() => parametricSurface(stop, { uSegments: 511, vSegments: 511 })).toThrow(
    'SAMPLE_SENTINEL',
  );
  expect(calls).toBe(1);
  calls = 0;
  expect(() => parametricSurface(stop, { u: [-Number.MAX_VALUE, Number.MAX_VALUE] })).toThrow(
    'domain',
  );
  expect(calls).toBe(0);
});
test('subdivision includes morph channels and pre-split expansion in its allocation budget', () => {
  const g = new THREE.BoxGeometry();
  g.morphAttributes.position = Array.from({ length: 30 }, () => g.getAttribute('position').clone());
  let clones = 0;
  g.clone = () => {
    clones++;
    throw new Error('CLONE_WAS_CALLED');
  };
  expect(() => subdivide(g, 7, { weld: false })).toThrow('attribute budget');
  expect(clones).toBe(0);
  const source = new THREE.BoxGeometry(1, 1, 1, 20, 20, 20);
  source.clone = () => {
    throw new Error('CLONE_WAS_CALLED');
  };
  expect(() => subdivide(source, 4, { weld: false })).toThrow('triangle budget');
});
test('non-finite source frames and overflowing radial positions never partially attach a pattern', () => {
  const source = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
  const parent = new THREE.Group();
  source.scale.y = Infinity;
  expect(() => arrayLinear('Copy', source, 3, [1, 0, 0], parent)).toThrow('scale');
  expect(() => arrayRadial('Copy', source, 3, 'y', parent)).toThrow('scale');
  source.scale.y = 1;
  source.position.set(Number.MAX_VALUE, 0, Number.MAX_VALUE);
  expect(() => arrayRadial('Copy', source, 8, 'y', parent)).toThrow('position');
  expect(parent.children).toHaveLength(0);
});
