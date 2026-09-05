/** Owned custom meshes, surface sampling, and explicit topology diagnostics. */
import * as THREE from 'three';

export type Point3 = readonly [number, number, number];
export interface MeshGeoData {
  positions: ArrayLike<number>;
  indices?: ArrayLike<number>;
  normals?: ArrayLike<number>;
  uvs?: ArrayLike<number>;
  tangents?: ArrayLike<number>;
}

function finiteArray(values: ArrayLike<number>, label: string, length?: number): number[] {
  const result = Array.from(values);
  if (length !== undefined && result.length !== length)
    throw new Error(`${label}: expected ${length} values, got ${result.length}`);
  if (!result.every((n) => Number.isFinite(Math.fround(n))))
    throw new Error(`${label}: all values must be finite Float32 values`);
  return result;
}

/** Create an owned triangle mesh. Flat positions and indices use counterclockwise winding. */
export function meshGeo(data: MeshGeoData): THREE.BufferGeometry {
  const positions = finiteArray(data.positions, 'meshGeo positions');
  if (positions.length < 9 || positions.length % 3)
    throw new Error('meshGeo positions: need at least three xyz vertices');
  const count = positions.length / 3;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (data.indices) {
    const indices = Array.from(data.indices);
    if (!indices.length || indices.length % 3)
      throw new Error('meshGeo indices: need complete triangles');
    if (!indices.every((i) => Number.isInteger(i) && i >= 0 && i < count))
      throw new Error('meshGeo index out of bounds or not an integer');
    geometry.setIndex(indices);
  } else if (count % 3)
    throw new Error('meshGeo: non-indexed positions must form complete triangles');
  if (data.normals) {
    const normals = finiteArray(data.normals, 'meshGeo normals', count * 3);
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    for (let i = 0; i < count; i++)
      if (Math.hypot(normals[i * 3]!, normals[i * 3 + 1]!, normals[i * 3 + 2]!) === 0)
        throw new Error('meshGeo normals: zero-length normal');
    geometry.normalizeNormals();
  } else geometry.computeVertexNormals();
  if (data.uvs)
    geometry.setAttribute(
      'uv',
      new THREE.Float32BufferAttribute(finiteArray(data.uvs, 'meshGeo uvs', count * 2), 2),
    );
  if (data.tangents) {
    const tangents = finiteArray(data.tangents, 'meshGeo tangents', count * 4);
    for (let i = 0; i < count; i++) {
      if (
        Math.abs(Math.hypot(tangents[i * 4]!, tangents[i * 4 + 1]!, tangents[i * 4 + 2]!) - 1) >
          1e-4 ||
        Math.abs(tangents[i * 4 + 3]!) !== 1
      )
        throw new Error('meshGeo tangents: expected unit xyz and handedness +1 or -1');
    }
    geometry.setAttribute('tangent', new THREE.Float32BufferAttribute(tangents, 4));
  }
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

export interface GeometryDiagnostics {
  vertices: number;
  triangles: number;
  boundaryEdges: number;
  nonManifoldEdges: number;
  orientationConflicts: number;
  degenerateTriangles: number;
  invalidIndices: number;
  nonFiniteVertices: number;
}

/** Position-welded topology counts. UV and normal seams do not count as open boundaries. */
export function geometryDiagnostics(
  geometry: THREE.BufferGeometry,
  tolerance = 1e-6,
): GeometryDiagnostics {
  if (!Number.isFinite(tolerance) || tolerance <= 0)
    throw new Error('geometryDiagnostics tolerance must be positive');
  const p = geometry.getAttribute('position');
  if (p?.itemSize !== 3) throw new Error('geometryDiagnostics requires xyz positions');
  const result: GeometryDiagnostics = {
    vertices: p.count,
    triangles: 0,
    boundaryEdges: 0,
    nonManifoldEdges: 0,
    orientationConflicts: 0,
    degenerateTriangles: 0,
    invalidIndices: 0,
    nonFiniteVertices: 0,
  };
  const ids: number[] = [];
  const points = new Map<string, number>();
  for (let i = 0; i < p.count; i++) {
    const xyz = [p.getX(i), p.getY(i), p.getZ(i)];
    if (!xyz.every(Number.isFinite)) result.nonFiniteVertices++;
    const key = xyz.map((x) => Math.round(x / tolerance)).join(',');
    if (!points.has(key)) points.set(key, points.size);
    ids.push(points.get(key)!);
  }
  const indices = geometry.index
    ? Array.from(geometry.index.array)
    : Array.from({ length: p.count }, (_, i) => i);
  const edges = new Map<string, { count: number; direction: number }>();
  const a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    c = new THREE.Vector3();
  for (let i = 0; i < indices.length; i += 3) {
    result.triangles++;
    const triangle = indices.slice(i, i + 3);
    if (
      triangle.length !== 3 ||
      triangle.some((n) => !Number.isInteger(n) || n < 0 || n >= p.count)
    ) {
      result.invalidIndices++;
      continue;
    }
    const [ia, ib, ic] = triangle as [number, number, number];
    a.fromBufferAttribute(p, ia);
    b.fromBufferAttribute(p, ib);
    c.fromBufferAttribute(p, ic);
    if (b.sub(a).cross(c.sub(a)).lengthSq() <= tolerance ** 4) result.degenerateTriangles++;
    for (const [start, end] of [
      [ia, ib],
      [ib, ic],
      [ic, ia],
    ]) {
      const u = ids[start!]!,
        v = ids[end!]!;
      if (u === v) continue;
      const key = u < v ? `${u}:${v}` : `${v}:${u}`;
      const edge = edges.get(key) ?? { count: 0, direction: 0 };
      edge.count++;
      edge.direction += u < v ? 1 : -1;
      edges.set(key, edge);
    }
  }
  for (const edge of edges.values()) {
    if (edge.count === 1) result.boundaryEdges++;
    else if (edge.count > 2) result.nonManifoldEdges++;
    else if (edge.direction !== 0) result.orientationConflicts++;
  }
  return result;
}

export interface ParametricSurfaceOptions {
  u?: readonly [number, number];
  v?: readonly [number, number];
  uSegments?: number;
  vSegments?: number;
  periodicU?: boolean;
  periodicV?: boolean;
  orientation?: 'uv' | 'vu';
}

/** Sample an equation into a surface. Periodic seams keep separate UVs but share normals. */
export function parametricSurface(
  sample: (u: number, v: number) => Point3,
  options: ParametricSurfaceOptions = {},
): THREE.BufferGeometry {
  const {
    u = [0, 1],
    v = [0, 1],
    uSegments: nu = 24,
    vSegments: nv = 24,
    periodicU = false,
    periodicV = false,
    orientation = 'uv',
  } = options;
  for (const [name, n] of [
    ['uSegments', nu],
    ['vSegments', nv],
  ] as const)
    if (!Number.isSafeInteger(n) || n < 1)
      throw new Error(`parametricSurface ${name} must be a positive integer`);
  for (const [name, range] of [
    ['u', u],
    ['v', v],
  ] as const)
    if (range.length !== 2 || !range.every(Number.isFinite) || range[0] === range[1])
      throw new Error(`parametricSurface ${name} must be a finite nonzero domain`);
  if (orientation !== 'uv' && orientation !== 'vu')
    throw new Error('parametricSurface orientation must be uv or vu');
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  for (let j = 0; j <= nv; j++)
    for (let i = 0; i <= nu; i++) {
      const point = sample(u[0] + ((u[1] - u[0]) * i) / nu, v[0] + ((v[1] - v[0]) * j) / nv);
      if (point.length !== 3 || !point.every(Number.isFinite))
        throw new Error(
          `parametricSurface: sample (${i},${j}) must return three finite coordinates`,
        );
      positions.push(...point);
      uvs.push(i / nu, j / nv);
    }
  const groups = Array.from({ length: (nu + 1) * (nv + 1) }, (_, i) => i);
  const find = (i: number): number => {
    while (groups[i] !== i) i = groups[i]!;
    return i;
  };
  const join = (a: number, b: number, label: string) => {
    const pa = positions.slice(a * 3, a * 3 + 3),
      pb = positions.slice(b * 3, b * 3 + 3);
    const scale = Math.max(1, ...pa.map(Math.abs), ...pb.map(Math.abs));
    if (Math.hypot(...pa.map((x, k) => x - pb[k]!)) > scale * 1e-6)
      throw new Error(`parametricSurface ${label}: endpoint positions do not match`);
    groups[find(b)] = find(a);
    for (let k = 0; k < 3; k++) positions[b * 3 + k] = positions[a * 3 + k]!;
  };
  if (periodicU) for (let j = 0; j <= nv; j++) join(j * (nu + 1), j * (nu + 1) + nu, 'periodicU');
  if (periodicV) for (let i = 0; i <= nu; i++) join(i, nv * (nu + 1) + i, 'periodicV');
  for (let j = 0; j < nv; j++)
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i,
        b = a + 1,
        c = a + nu + 1,
        d = c + 1;
      indices.push(...(orientation === 'uv' ? [a, b, c, b, d, c] : [a, c, b, b, c, d]));
    }
  const out = meshGeo({ positions, indices, uvs });
  if (periodicU || periodicV) {
    const normal = out.getAttribute('normal');
    const sums = new Map<number, THREE.Vector3>();
    for (let i = 0; i < normal.count; i++) {
      const id = find(i);
      const sum = sums.get(id) ?? new THREE.Vector3();
      sum.add(new THREE.Vector3().fromBufferAttribute(normal, i));
      sums.set(id, sum);
    }
    for (let i = 0; i < normal.count; i++) {
      const n = sums.get(find(i))!.clone().normalize();
      normal.setXYZ(i, n.x, n.y, n.z);
    }
  }
  return out;
}

/** Recompute angle-limited normals on an owned mesh; preserve per-corner UVs. Angle is degrees. */
export function creaseNormals(
  geometry: THREE.BufferGeometry,
  options: { angle?: number; tolerance?: number } = {},
): THREE.BufferGeometry {
  const angle = options.angle ?? 60;
  if (!Number.isFinite(angle) || angle < 0 || angle > 180)
    throw new Error('creaseNormals angle must be between 0 and 180 degrees');
  const out = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  const position = out.getAttribute('position');
  if (position?.itemSize !== 3 || position.count % 3 !== 0)
    throw new Error('creaseNormals requires complete xyz triangles');
  out.computeBoundingBox();
  const diagonal = out.boundingBox!.getSize(new THREE.Vector3()).length();
  const tolerance = options.tolerance ?? Math.max(diagonal * 1e-8, 1e-12);
  if (!Number.isFinite(tolerance) || tolerance <= 0)
    throw new Error('creaseNormals tolerance must be positive and finite');
  const adjacent = new Map<string, Set<number>>();
  const keys: string[] = [];
  const faces: THREE.Vector3[] = [];
  for (let i = 0; i < position.count; i += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(position, i);
    const b = new THREE.Vector3().fromBufferAttribute(position, i + 1);
    const c = new THREE.Vector3().fromBufferAttribute(position, i + 2);
    const face = b.sub(a).cross(c.sub(a)).normalize();
    faces.push(face);
    for (let j = i; j < i + 3; j++) {
      const point = new THREE.Vector3().fromBufferAttribute(position, j);
      if (![point.x, point.y, point.z].every(Number.isFinite))
        throw new Error('creaseNormals positions must be finite');
      const key = point
        .toArray()
        .map((n) => Math.round(n / tolerance))
        .join(',');
      keys.push(key);
      const neighbors = adjacent.get(key) ?? new Set<number>();
      neighbors.add(i / 3);
      adjacent.set(key, neighbors);
    }
  }
  const normals = new Float32Array(position.count * 3);
  const threshold = Math.cos(THREE.MathUtils.degToRad(angle));
  for (let i = 0; i < position.count; i++) {
    const face = faces[Math.floor(i / 3)]!,
      sum = new THREE.Vector3();
    for (const other of adjacent.get(keys[i]!)!)
      if (face.dot(faces[other]!) >= threshold - 1e-12) sum.add(faces[other]!);
    sum.normalize().toArray(normals, i * 3);
  }
  out.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  out.deleteAttribute('tangent');
  out.computeBoundingSphere();
  return out;
}
