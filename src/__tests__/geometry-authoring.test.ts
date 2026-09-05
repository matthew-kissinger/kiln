import { describe, expect, it } from 'bun:test';
import * as THREE from 'three';
import {
  buildSandboxGlobals,
  copyGeometry,
  copyMaterial,
  cloneGeometry,
  cloneMaterial,
} from '../primitives';
import { meshGeo, parametricSurface, creaseNormals, geometryDiagnostics } from '../geometry';
import { subdivide } from '../ops';

describe('owned geometry and seam-preserving operations', () => {
  it('copies cached geometry and material without changing legacy reuse semantics', () => {
    const globals = buildSandboxGlobals() as {
      boxGeo: (w: number, h: number, d: number) => THREE.BufferGeometry;
    };
    const original = globals.boxGeo(1, 1, 1) as THREE.BufferGeometry;
    const copy = copyGeometry(original).translate(4, 0, 0);
    original.computeBoundingBox();
    expect(copy).not.toBe(original);
    expect(original.boundingBox!.min.x).toBe(-0.5);
    expect(globals.boxGeo(1, 1, 1)).toBe(original);
    expect(cloneGeometry(original)).toBe(original);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    copyMaterial(material).color.set(0x00ff00);
    expect(material.color.getHex()).toBe(0xff0000);
    expect(cloneMaterial(material)).toBe(material);
  });
  it('keeps UV charts and coincident seam positions through smoothing', () => {
    const box = new THREE.BoxGeometry();
    const output = subdivide(box, 1, { preserveUV: true, split: false });
    expect(output.getAttribute('uv').count).toBe(output.getAttribute('position').count);
    expect(geometryDiagnostics(output).boundaryEdges).toBe(0);
    expect(box.getAttribute('position').count).toBe(24);
    const uv = output.getAttribute('uv');
    expect(Array.from(uv.array).every(Number.isFinite)).toBe(true);
    expect(Math.min(...uv.array)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...uv.array)).toBeLessThanOrEqual(1);
    const legacy = subdivide(box, 1);
    expect(legacy.getAttribute('uv')).toBeUndefined();
    expect(legacy.userData.kilnAttributeWarnings[0].code).toBe('SUBDIVIDE_UV_DROPPED');
  });
  it('preserves UVs while creating sharp rims and smooth walls', () => {
    const cylinder = new THREE.CylinderGeometry(1, 1, 2, 16);
    const output = creaseNormals(cylinder, { angle: 45 });
    expect(output).not.toBe(cylinder);
    expect(output.getAttribute('uv').count).toBe(output.getAttribute('position').count);
    const p = output.getAttribute('position');
    const n = output.getAttribute('normal');
    const rimNormals: number[] = [];
    for (let i = 0; i < p.count; i++) {
      if (Math.abs(p.getY(i) - 1) < 1e-6 && Math.abs(p.getX(i)) < 1e-6 && p.getZ(i) > 0.99)
        rimNormals.push(n.getY(i));
    }
    expect(rimNormals.some((y) => y > 0.99)).toBe(true);
    expect(rimNormals.some((y) => Math.abs(y) < 0.01)).toBe(true);
  });
});

describe('custom geometry contract', () => {
  it('validates indexed data and diagnoses an open sheet', () => {
    const g = meshGeo({
      positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
      indices: [0, 1, 2],
      uvs: [0, 0, 1, 0, 0, 1],
    });
    expect(g.getAttribute('normal').getZ(0)).toBe(1);
    expect(geometryDiagnostics(g)).toMatchObject({
      triangles: 1,
      boundaryEdges: 3,
      nonManifoldEdges: 0,
      degenerateTriangles: 0,
    });
    expect(() => meshGeo({ positions: [0, 0, NaN] })).toThrow('finite');
    expect(() => meshGeo({ positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 4] })).toThrow(
      'index',
    );
    expect(() => meshGeo({ positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], uvs: [0, 0] })).toThrow('uv');
  });
  it('samples domains with explicit orientation and UVs', () => {
    const g = parametricSurface((u, v) => [u, v, 0], {
      u: [-2, 2],
      v: [-1, 1],
      uSegments: 4,
      vSegments: 2,
    });
    expect(g.getAttribute('position').count).toBe(15);
    expect(g.index!.count / 3).toBe(16);
    expect(g.boundingBox!.min.toArray()).toEqual([-2, -1, 0]);
    expect(g.getAttribute('normal').getZ(0)).toBeCloseTo(1);
    const reverse = parametricSurface((u, v) => [u, v, 0], {
      uSegments: 1,
      vSegments: 1,
      orientation: 'vu',
    });
    expect(reverse.getAttribute('normal').getZ(0)).toBeCloseTo(-1);
  });
  it('closes periodic torus seams without losing wrapped UVs', () => {
    const g = parametricSurface(
      (u, v) => [
        (2 + 0.5 * Math.cos(v)) * Math.cos(u),
        0.5 * Math.sin(v),
        (2 + 0.5 * Math.cos(v)) * Math.sin(u),
      ],
      {
        u: [0, Math.PI * 2],
        v: [0, Math.PI * 2],
        uSegments: 16,
        vSegments: 8,
        periodicU: true,
        periodicV: true,
      },
    );
    expect(geometryDiagnostics(g).boundaryEdges).toBe(0);
    const normal = g.getAttribute('normal');
    expect(normal.getX(0)).toBeCloseTo(normal.getX(16), 5);
    expect(g.getAttribute('uv').getX(0)).toBe(0);
    expect(g.getAttribute('uv').getX(16)).toBe(1);
    expect(() => parametricSurface((u, v) => [u, v, 0], { periodicU: true })).toThrow('periodicU');
  });
});

it('does not blend normals between separate sub-centimeter surfaces', () => {
  const g = meshGeo({
    positions: [0, 0, 0, 0.001, 0, 0, 0, 0.001, 0, 0.002, 0, 0, 0.003, 0, 0, 0.002, 0.001, 0.001],
  });
  const normal = creaseNormals(g, { angle: 60 }).getAttribute('normal');
  expect(normal.getY(0)).toBeCloseTo(0, 6);
  expect(normal.getZ(0)).toBeCloseTo(1, 6);
  expect(normal.getY(3)).toBeCloseTo(-Math.SQRT1_2, 5);
});
it('rejects finite numbers that overflow the Float32 export representation', () => {
  expect(() => meshGeo({ positions: [0, 0, 0, 1e100, 0, 0, 0, 1, 0] })).toThrow('Float32');
});
it('invalidates source triangle provenance after subdivision changes topology', () => {
  const g = new THREE.BoxGeometry();
  g.userData.kilnCsgProvenance = {
    schemaVersion: 1,
    runs: [{ sourceName: 'Body', start: 0, count: 12, materialIndex: 0 }],
  };
  const output = subdivide(g, 1, { preserveUV: true });
  expect(output.userData.kilnCsgProvenance).toBeUndefined();
  expect(
    output.userData.kilnAttributeWarnings.some(
      (warning: { code: string }) => warning.code === 'SUBDIVIDE_PROVENANCE_DROPPED',
    ),
  ).toBe(true);
});
it('preserving subdivision is scale-equivariant for millimeter-sized geometry', () => {
  const unit = subdivide(new THREE.BoxGeometry(1, 1, 1), 1, { preserveUV: true, split: false });
  const small = subdivide(new THREE.BoxGeometry(0.001, 0.001, 0.001), 1, {
    preserveUV: true,
    split: false,
  });
  const a = unit.getAttribute('position'),
    b = small.getAttribute('position');
  expect(a.count).toBe(b.count);
  for (let i = 0; i < a.array.length; i++) expect(b.array[i]! / 0.001).toBeCloseTo(a.array[i]!, 4);
  expect(geometryDiagnostics(small, 1e-9).degenerateTriangles).toBe(0);
});

it('subdivides a longitude-seamed sphere without cracks or UV interpolation across the wrap', () => {
  const sphere = new THREE.SphereGeometry(1, 16, 8);
  const sourceUV = Array.from(sphere.getAttribute('uv').array);
  const result = subdivide(sphere, 1, { preserveUV: true, split: false });
  const p = result.getAttribute('position'),
    uv = result.getAttribute('uv');
  expect(geometryDiagnostics(result)).toMatchObject({
    boundaryEdges: 0,
    nonManifoldEdges: 0,
    degenerateTriangles: 0,
  });
  const seam = new Map<string, number[]>();
  for (let i = 0; i < p.count; i++) {
    const key = [p.getX(i), p.getY(i), p.getZ(i)].map((x) => x.toFixed(5)).join(',');
    const values = seam.get(key) ?? [];
    values.push(uv.getX(i));
    seam.set(key, values);
  }
  expect(
    [...seam.values()].some(
      (values) =>
        values.some((u) => Math.abs(u) < 1e-6) && values.some((u) => Math.abs(u - 1) < 1e-6),
    ),
  ).toBe(true);
  const index = result.index;
  for (let i = 0; i < (index?.count ?? p.count); i += 3) {
    const values = [0, 1, 2].map((k) => uv.getX(index ? index.getX(i + k) : i + k));
    expect(Math.max(...values) - Math.min(...values)).toBeLessThan(0.15);
  }
  expect(Array.from(sphere.getAttribute('uv').array)).toEqual(sourceUV);
});

it('samples an open cylinder with outward winding, two boundary rings and an intact UV wrap', () => {
  const segments = 16,
    rows = 4;
  const cylinder = parametricSurface((u, v) => [2 * Math.cos(u), v, 2 * Math.sin(u)], {
    u: [0, 2 * Math.PI],
    v: [-1, 3],
    uSegments: segments,
    vSegments: rows,
    periodicU: true,
    orientation: 'vu',
  });
  expect(cylinder.boundingBox!.min.toArray()).toEqual([-2, -1, -2]);
  expect(cylinder.boundingBox!.max.toArray()).toEqual([2, 3, 2]);
  expect(geometryDiagnostics(cylinder)).toMatchObject({
    boundaryEdges: 2 * segments,
    nonManifoldEdges: 0,
    degenerateTriangles: 0,
  });
  const p = cylinder.getAttribute('position'),
    n = cylinder.getAttribute('normal'),
    uv = cylinder.getAttribute('uv');
  for (let i = 0; i < p.count; i++)
    expect(p.getX(i) * n.getX(i) + p.getZ(i) * n.getZ(i)).toBeGreaterThan(1.9);
  for (let row = 0; row <= rows; row++) {
    const a = row * (segments + 1),
      b = a + segments;
    expect([p.getX(a), p.getY(a), p.getZ(a)]).toEqual([p.getX(b), p.getY(b), p.getZ(b)]);
    expect(uv.getX(a)).toBe(0);
    expect(uv.getX(b)).toBe(1);
    expect(n.getX(a)).toBeCloseTo(n.getX(b), 6);
    expect(n.getZ(a)).toBeCloseTo(n.getZ(b), 6);
  }
});
