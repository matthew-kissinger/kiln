import { expect, it } from 'bun:test';
import * as THREE from 'three';
import { bend, twist, taper, displace } from '../deform';
import { meshGeo } from '../geometry';
const sheet = () =>
  meshGeo({
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0],
    indices: [0, 1, 2, 1, 3, 2],
    uvs: [0, 0, 1, 0, 0, 1, 1, 1],
  });
it('deforms owned meshes in degrees and preserves unaffected input and UVs', () => {
  const input = sheet();
  const twisted = twist(input, { angle: 90 });
  expect(twisted.getAttribute('position').getZ(3)).toBeCloseTo(-1);
  expect(input.getAttribute('position').getX(3)).toBe(1);
  expect(twisted.getAttribute('uv').array).toEqual(input.getAttribute('uv').array);
  expect(
    taper(input, { endScale: [2, 3] })
      .getAttribute('position')
      .getX(3),
  ).toBe(2);
  const bent = bend(input, { angle: 90 });
  expect(bent.getAttribute('position').getX(2)).toBeCloseTo(2 / Math.PI);
  expect(bent.getAttribute('position').getY(2)).toBeCloseTo(2 / Math.PI);
  expect(twist(input, { angle: 0 }).getAttribute('position').array).toEqual(
    input.getAttribute('position').array,
  );
  expect(bend(input, { angle: 0 }).getAttribute('position').array).toEqual(
    input.getAttribute('position').array,
  );
});
it('resolves local frame, interval and falloff consistently', () => {
  const input = sheet()
    .rotateZ(Math.PI / 2)
    .translate(4, 2, 0);
  const framed = twist(input, { angle: 90, frame: { origin: [4, 2, 0], rotation: [0, 0, 90] } });
  const expected = twist(sheet(), { angle: 90 })
    .rotateZ(Math.PI / 2)
    .translate(4, 2, 0);
  const actual = framed.getAttribute('position');
  const e = expected.getAttribute('position');
  for (let i = 0; i < actual.array.length; i++) expect(actual.array[i]).toBeCloseTo(e.array[i]!, 5);
  const limited = twist(sheet(), { angle: 90, interval: [0, 0.5] });
  expect(limited.getAttribute('position').getX(3)).toBe(1);
  expect(
    twist(sheet(), { angle: 90, falloff: () => 0 })
      .getAttribute('position')
      .getX(3),
  ).toBe(1);
});
it('displaces by a callback in local coordinates and validates outputs', () => {
  const input = sheet();
  input.setAttribute(
    'tangent',
    new THREE.Float32BufferAttribute(Array(4).fill([1, 0, 0, 1]).flat(), 4),
  );
  const moved = displace(input, ([x, y, z]) => [0, 0, x + y + z]);
  expect(moved.getAttribute('position').getZ(3)).toBe(2);
  expect(moved.getAttribute('tangent')).toBeUndefined();
  expect(input.getAttribute('tangent')).toBeDefined();
  expect(moved.boundingBox!.max.z).toBe(2);
  expect(() => displace(input, () => [NaN, 0, 0])).toThrow('finite');
  expect(() => twist(input, { angle: Infinity })).toThrow('finite');
  expect(() => bend(input, { angle: 45, interval: [1, 1] })).toThrow('interval');
  expect(() => taper(input, { endScale: [0, 1] })).toThrow('positive');
  expect(() => twist(input, { angle: 45, falloff: () => 2 })).toThrow('falloff');
});

it('retains handedness under reflected input without modifying the original buffers', () => {
  const input = sheet();
  const mirrored = input.clone().scale(-1, 1, 1);
  const before = Array.from(mirrored.getAttribute('position').array);
  const pairs = [
    [twist(mirrored, { angle: -67 }), twist(input, { angle: 67 }).scale(-1, 1, 1)],
    [bend(mirrored, { angle: -43 }), bend(input, { angle: 43 }).scale(-1, 1, 1)],
    [
      taper(mirrored, { endScale: [0.4, 1.7] }),
      taper(input, { endScale: [0.4, 1.7] }).scale(-1, 1, 1),
    ],
  ];
  for (const [actual, expected] of pairs) {
    const a = actual!.getAttribute('position'),
      b = expected!.getAttribute('position');
    for (let i = 0; i < a.array.length; i++) expect(a.array[i]).toBeCloseTo(b.array[i]!, 6);
    expect(actual!.getAttribute('uv').array).toEqual(input.getAttribute('uv').array);
    expect(Array.from(actual!.getAttribute('normal').array).every(Number.isFinite)).toBe(true);
  }
  expect(Array.from(mirrored.getAttribute('position').array)).toEqual(before);
  expect(input.getAttribute('position').getX(3)).toBe(1);
});
