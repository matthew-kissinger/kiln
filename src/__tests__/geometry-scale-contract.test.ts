import { expect, test } from 'bun:test';
import * as THREE from 'three';
import { creaseNormals, geometryDiagnostics, parametricSurface } from '../geometry';
import { boolDiff } from '../solids';
import { loftProfiles } from '../sweep';

test('tolerance-collapsed cavity faces do not invent nonmanifold edges', async () => {
  const make = (half: number, start: number, end: number) => {
    const mesh = new THREE.Mesh(
      loftProfiles(
        [start, end].map((y) => ({
          profile: [
            [-half, -half],
            [half, -half],
            [half, half],
            [-half, half],
          ],
          frame: { origin: [0, y, 0] },
        })),
      ),
    );
    mesh.rotation.set(0.17, THREE.MathUtils.degToRad(35), 0.31);
    mesh.position.set(3, 4, 5);
    return mesh;
  };
  const a = make(1, 0, 2),
    b = make(0.8, -0.1, 2.1);
  const result = await boolDiff('Cavity', a, b, { preserveAttributes: true });
  const original = Array.from(result.geometry.getAttribute('position').array);
  const coarse = geometryDiagnostics(result.geometry);
  expect(coarse.nonManifoldEdges).toBe(0);
  expect(coarse.collapsedByToleranceTriangles).toBeGreaterThan(0);
  expect(coarse.degenerateTriangles).toBe(0);
  expect(geometryDiagnostics(result.geometry, coarse.tolerance * 0.001)).toMatchObject({
    boundaryEdges: 0,
    nonManifoldEdges: 0,
    orientationConflicts: 0,
    degenerateTriangles: 0,
    collapsedByToleranceTriangles: 0,
  });
  expect(Array.from(result.geometry.getAttribute('position').array)).toEqual(original);
  for (const mesh of [a, b, result]) mesh.geometry.dispose();
});

test('three real incident faces still report a nonmanifold edge', () => {
  const geometry = new THREE.BufferGeometry().setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      3,
    ),
  );
  expect(geometryDiagnostics(geometry)).toMatchObject({
    nonManifoldEdges: 1,
    boundaryEdges: 6,
    collapsedByToleranceTriangles: 0,
  });
  geometry.dispose();
});

const topology = (g: THREE.BufferGeometry) => {
  const { boundaryEdges, nonManifoldEdges, orientationConflicts, degenerateTriangles } =
    geometryDiagnostics(g);
  return { boundaryEdges, nonManifoldEdges, orientationConflicts, degenerateTriangles };
};

test('default topology diagnostics distinguish solids, open sheets and collapsed faces at every scale', () => {
  for (const scale of [1e-12, 1e-9, 1, 1e9, 1e12]) {
    const box = new THREE.BoxGeometry(scale, scale * 2, scale * 3);
    expect(topology(box), `box scale ${scale}`).toEqual({
      boundaryEdges: 0,
      nonManifoldEdges: 0,
      orientationConflicts: 0,
      degenerateTriangles: 0,
    });
    const sheet = new THREE.PlaneGeometry(scale, scale * 2);
    expect(topology(sheet), `sheet scale ${scale}`).toEqual({
      boundaryEdges: 4,
      nonManifoldEdges: 0,
      orientationConflicts: 0,
      degenerateTriangles: 0,
    });
    sheet.scale(1, 0, 1);
    expect(geometryDiagnostics(sheet).degenerateTriangles).toBe(2);
  }
});

test('periodic endpoint validation rejects proportional gaps independent of scale or origin', () => {
  for (const [scale, origin] of [
    [1e-12, 0],
    [1, 1e9],
    [1e9, 0],
  ]) {
    expect(() =>
      parametricSurface((u, v) => [origin! + u * scale!, v * scale!, 0], {
        periodicU: true,
        uSegments: 4,
        vSegments: 3,
      }),
    ).toThrow('periodicU');
  }
});

test('valid periodic seams retain UV wraps and unit matching normals over tiny and large scales', () => {
  for (const scale of [1e-12, 1, 1e12]) {
    const g = parametricSurface((u, v) => [scale * Math.cos(u), scale * v, scale * Math.sin(u)], {
      u: [0, Math.PI * 2],
      uSegments: 16,
      vSegments: 3,
      periodicU: true,
    });
    expect(geometryDiagnostics(g).boundaryEdges).toBe(32);
    const normals = g.getAttribute('normal');
    const uv = g.getAttribute('uv');
    for (let row = 0; row <= 3; row++) {
      const a = row * 17;
      expect(uv.getX(a)).toBe(0);
      expect(uv.getX(a + 16)).toBe(1);
      const first = new THREE.Vector3().fromBufferAttribute(normals, a);
      expect(first.length()).toBeCloseTo(1, 5);
      expect(first.distanceTo(new THREE.Vector3().fromBufferAttribute(normals, a + 16))).toBe(0);
    }
  }
});

test('crease normals keep separate nearby surfaces separate without a world-unit floor', () => {
  const source = new THREE.BufferGeometry().setAttribute(
    'position',
    new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0, 2, 0, 0, 3, 0, 0, 2, 1, 1], 3),
  );
  for (const scale of [1e-15, 1, 1e15]) {
    const g = source.clone().scale(scale, scale, scale);
    const before = Array.from(g.getAttribute('position').array);
    const out = creaseNormals(g, { angle: 60 });
    const normals = out.getAttribute('normal');
    expect(normals.getY(0), `first surface scale ${scale}`).toBeCloseTo(0, 6);
    expect(normals.getZ(0)).toBeCloseTo(1, 6);
    expect(normals.getY(3)).toBeCloseTo(-Math.SQRT1_2, 5);
    expect(Array.from(g.getAttribute('position').array)).toEqual(before);
  }
});

test('diagnostics expose relative defaults and retain explicit absolute tolerance semantics', () => {
  const tiny = new THREE.PlaneGeometry(1e-9, 1e-9);
  const before = Array.from(tiny.getAttribute('position').array);
  const inferred = geometryDiagnostics(tiny);
  expect(inferred.toleranceMode).toBe('relative');
  expect(inferred.tolerance / inferred.positionScale).toBeCloseTo(1e-6, 12);
  expect(inferred.degenerateTriangles).toBe(0);
  expect(geometryDiagnostics(tiny, 1e-6)).toMatchObject({
    tolerance: 1e-6,
    toleranceMode: 'absolute',
    degenerateTriangles: 2,
  });
  expect(Array.from(tiny.getAttribute('position').array)).toEqual(before);
  for (const tolerance of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    expect(() => geometryDiagnostics(tiny, tolerance)).toThrow('tolerance');
    expect(() => creaseNormals(tiny, { tolerance })).toThrow('tolerance');
  }
  expect(() => geometryDiagnostics(new THREE.BoxGeometry(), 1e-300)).toThrow('too small');
});

test('translation does not change topology and collapsed or malformed positions stay explicit', () => {
  const box = new THREE.BoxGeometry(2, 3, 4);
  expect(topology(box.clone().translate(1e5, -2e5, 3e5))).toEqual(topology(box));
  const collapsed = box.clone().scale(0, 0, 0);
  expect(geometryDiagnostics(collapsed)).toMatchObject({
    tolerance: 0,
    positionScale: 0,
    degenerateTriangles: 12,
  });
  expect(
    Array.from(creaseNormals(collapsed).getAttribute('normal').array).every((n) => n === 0),
  ).toBe(true);
  const malformed = new THREE.BufferGeometry().setAttribute(
    'position',
    new THREE.Float32BufferAttribute([NaN, 0, 0, Infinity, 0, 0, 0, 0, 0], 3),
  );
  expect(geometryDiagnostics(malformed)).toMatchObject({ nonFiniteVertices: 2, tolerance: 0 });
  expect(() => creaseNormals(malformed)).toThrow('finite');
  malformed.setIndex([0, 1, 9]);
  expect(geometryDiagnostics(malformed).invalidIndices).toBe(1);
});
