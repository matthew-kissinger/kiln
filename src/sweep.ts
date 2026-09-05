/** Corresponding-profile lofts and polyline sweeps with parallel-transport frames. */
import * as THREE from 'three';
import { meshGeo, type Point3 } from './geometry';
import { geometryFrameMatrix, type GeometryFrame } from './deform';

export type ProfilePoint = readonly [number, number];
export interface LoftSection {
  profile: readonly ProfilePoint[];
  frame?: GeometryFrame;
}
export interface LoftOptions {
  cap?: boolean;
}
export interface SweepOptions extends LoftOptions {
  closed?: boolean;
  /** Reference for the first profile's +Z axis, projected perpendicular to the path. */
  up?: Point3;
  /** Total twist along path, in degrees. Closed paths require a multiple of 360. */
  twist?: number;
  /** Uniform scale or one positive [profile X, profile Z] scale per path station. */
  scale?: number | readonly (readonly [number, number])[];
}

function profilePoints(profile: readonly ProfilePoint[]): THREE.Vector2[] {
  if (profile.length < 3 || profile.some((p) => p.length !== 2 || !p.every(Number.isFinite)))
    throw new Error('profile requires at least three finite xy points');
  const points = profile.map((p) => new THREE.Vector2(...p));
  if (points[0]!.distanceTo(points[points.length - 1]!) < 1e-10) points.pop();
  if (points.length < 3) throw new Error('profile requires three distinct points');
  const cross = (a: THREE.Vector2, b: THREE.Vector2, c: THREE.Vector2) =>
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  for (let i = 0; i < points.length; i++) {
    const a = points[i]!,
      b = points[(i + 1) % points.length]!;
    if (a.distanceToSquared(b) < 1e-20) throw new Error('profile has duplicate adjacent points');
    for (let j = i + 1; j < points.length; j++) {
      if (j === i + 1 || (i === 0 && j === points.length - 1)) continue;
      const c = points[j]!,
        d = points[(j + 1) % points.length]!;
      if (
        cross(a, b, c) * cross(a, b, d) <= 0 &&
        cross(c, d, a) * cross(c, d, b) <= 0 &&
        Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x)) <=
          Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x)) + 1e-10 &&
        Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y)) <=
          Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y)) + 1e-10
      )
        throw new Error('profile self-intersects or touches itself');
    }
  }
  const area = THREE.ShapeUtils.area(points);
  if (Math.abs(area) < 1e-12) throw new Error('profile area must be nonzero');
  // Keep the first correspondence point fixed when normalizing winding.
  if (area < 0) points.splice(1, points.length - 1, ...points.slice(1).reverse());
  return points;
}

function buildLoft(
  rings: THREE.Vector3[][],
  profiles: THREE.Vector2[][],
  closed: boolean,
  cap: boolean,
): THREE.BufferGeometry {
  const n = rings[0]!.length,
    positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  const centers = rings.map((r) =>
    r.reduce((sum, p) => sum.add(p), new THREE.Vector3()).multiplyScalar(1 / n),
  );
  const lengths = [0];
  for (let i = 1; i < centers.length; i++)
    lengths.push(lengths[i - 1]! + centers[i]!.distanceTo(centers[i - 1]!));
  const total = lengths[lengths.length - 1]!;
  if (total < 1e-10) throw new Error('loft section centers must progress along a nonzero path');
  for (let i = 0; i < rings.length; i++) {
    const ring = rings[i]!,
      distance = [0];
    for (let j = 1; j <= n; j++)
      distance.push(distance[j - 1]! + ring[j % n]!.distanceTo(ring[j - 1]!));
    for (let j = 0; j <= n; j++) {
      positions.push(...ring[j % n]!.toArray());
      uvs.push(distance[j]! / distance[n]!, lengths[i]! / total);
    }
  }
  for (let i = 0; i < rings.length - 1; i++)
    for (let j = 0; j < n; j++) {
      const a = i * (n + 1) + j,
        b = a + 1,
        c = a + n + 1,
        d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  if (cap && !closed)
    for (const station of [0, rings.length - 1]) {
      const ring = rings[station]!,
        profile = profiles[station]!;
      const start = positions.length / 3;
      const bounds = new THREE.Box2().setFromPoints(profile);
      const size = bounds.getSize(new THREE.Vector2());
      for (let j = 0; j < n; j++) {
        positions.push(...ring[j]!.toArray());
        uvs.push(
          (profile[j]!.x - bounds.min.x) / (size.x || 1),
          (profile[j]!.y - bounds.min.y) / (size.y || 1),
        );
      }
      for (const tri of THREE.ShapeUtils.triangulateShape(profile, [])) {
        if (station === 0) indices.push(...tri.map((j) => start + j));
        else indices.push(...tri.toReversed().map((j) => start + j));
      }
    }
  const out = meshGeo({ positions, indices, uvs });
  // The duplicated profile UV seam should not become a shading seam.
  const normal = out.getAttribute('normal');
  for (let i = 0; i < rings.length; i++) {
    const a = i * (n + 1),
      b = a + n;
    const sum = new THREE.Vector3()
      .fromBufferAttribute(normal, a)
      .add(new THREE.Vector3().fromBufferAttribute(normal, b))
      .normalize();
    normal.setXYZ(a, sum.x, sum.y, sum.z);
    normal.setXYZ(b, sum.x, sum.y, sum.z);
  }
  if (closed)
    for (let j = 0; j <= n; j++) {
      const a = j,
        b = (rings.length - 1) * (n + 1) + j;
      const sum = new THREE.Vector3()
        .fromBufferAttribute(normal, a)
        .add(new THREE.Vector3().fromBufferAttribute(normal, b))
        .normalize();
      normal.setXYZ(a, sum.x, sum.y, sum.z);
      normal.setXYZ(b, sum.x, sum.y, sum.z);
    }
  return out;
}

/** Profiles lie in each section's local XZ plane; local +Y follows the loft. No holes in this first version. */
export function loftProfiles(
  sections: readonly LoftSection[],
  options: LoftOptions = {},
): THREE.BufferGeometry {
  if (sections.length < 2) throw new Error('loftProfiles needs at least two sections');
  const profiles = sections.map((section) => profilePoints(section.profile));
  if (profiles.some((p) => p.length !== profiles[0]!.length))
    throw new Error('loftProfiles sections must have the same point count and correspondence');
  const rings = sections.map((section, i) => {
    const frame = geometryFrameMatrix(section.frame);
    return profiles[i]!.map((p) => new THREE.Vector3(p.x, 0, p.y).applyMatrix4(frame));
  });
  const out = buildLoft(rings, profiles, false, options.cap ?? true);
  out.userData.kilnGeometryWarnings = [
    {
      code: 'LOFT_SELF_INTERSECTION_UNCHECKED',
      message:
        'Corresponding profiles are connected directly. Caps and closed boundaries do not prove the loft is free of self-intersections.',
    },
  ];
  return out;
}

/** Sweep a simple profile along supplied polyline stations. Supply enough stations for curved paths. */
export function sweepProfile(
  profile: readonly ProfilePoint[],
  path: readonly Point3[],
  options: SweepOptions = {},
): THREE.BufferGeometry {
  const points = profilePoints(profile),
    closed = options.closed ?? false,
    twist = options.twist ?? 0;
  if (!Number.isFinite(twist)) throw new Error('sweepProfile twist must be finite degrees');
  if (closed && Math.abs(twist / 360 - Math.round(twist / 360)) > 1e-8)
    throw new Error('closed sweep twist must be a multiple of 360 degrees');
  if (
    path.length < (closed ? 3 : 2) ||
    path.some((p) => p.length !== 3 || !p.every(Number.isFinite))
  )
    throw new Error('sweepProfile requires finite path points (two open or three closed)');
  const stations = path.map((p) => new THREE.Vector3(...p));
  if (closed && stations[0]!.distanceTo(stations[stations.length - 1]!) < 1e-10)
    throw new Error('closed sweep path should omit its repeated endpoint');
  const segments: THREE.Vector3[] = [];
  for (let i = 0; i < stations.length - (closed ? 0 : 1); i++) {
    const direction = stations[(i + 1) % stations.length]!.clone().sub(stations[i]!);
    if (direction.length() < 1e-10) throw new Error('sweepProfile path stations must be distinct');
    segments.push(direction.normalize());
  }
  const warnings: { code: string; message: string }[] = [];
  const radius = Math.max(...points.map((p) => p.length()));
  const tangents = stations.map((_, i) => {
    if (!closed && i === 0) return segments[0]!.clone();
    if (!closed && i === stations.length - 1) return segments[segments.length - 1]!.clone();
    const incoming = segments[(i - 1 + segments.length) % segments.length]!,
      outgoing = segments[i]!;
    if (incoming.dot(outgoing) < -0.9999)
      throw new Error('sweepProfile path has a reversal; split it into separate sweeps');
    const angle = incoming.angleTo(outgoing);
    const distance = Math.min(
      stations[i]!.distanceTo(stations[(i - 1 + stations.length) % stations.length]!),
      stations[i]!.distanceTo(stations[(i + 1) % stations.length]!),
    );
    if (radius * Math.tan(angle / 2) >= distance * 0.5)
      warnings.push({
        code: 'SWEEP_TIGHT_TURN',
        message: `Path station ${i} turns tightly relative to the profile; reduce its size or widen the turn. Self-intersection is possible.`,
      });
    return incoming.clone().add(outgoing).normalize();
  });
  const scales = stations.map((_, i) => {
    const scale =
      typeof options.scale === 'number'
        ? [options.scale, options.scale]
        : (options.scale?.[i] ?? [1, 1]);
    if (scale.length !== 2 || !scale.every((n) => Number.isFinite(n) && n > 0))
      throw new Error('sweepProfile scale requires positive finite pairs');
    return scale as readonly [number, number];
  });
  if (Array.isArray(options.scale) && options.scale.length !== stations.length)
    throw new Error('sweepProfile scale needs one pair per path station');
  const up = options.up
    ? new THREE.Vector3(...options.up)
    : Math.abs(tangents[0]!.z) < 0.9
      ? new THREE.Vector3(0, 0, 1)
      : new THREE.Vector3(1, 0, 0);
  if (![up.x, up.y, up.z].every(Number.isFinite) || up.lengthSq() < 1e-20)
    throw new Error('sweepProfile up must be a finite nonzero vector');
  let z = up.clone().addScaledVector(tangents[0]!, -up.dot(tangents[0]!));
  if (z.lengthSq() < 1e-12)
    throw new Error('sweepProfile up must not be parallel to the first path tangent');
  z.normalize();
  const normals = [z.clone()];
  if (closed) {
    stations.push(stations[0]!.clone());
    tangents.push(tangents[0]!.clone());
    scales.push(scales[0]!);
  }
  const distances = [0];
  for (let i = 1; i < stations.length; i++) {
    z = z
      .clone()
      .applyQuaternion(new THREE.Quaternion().setFromUnitVectors(tangents[i - 1]!, tangents[i]!));
    normals.push(z);
    distances.push(distances[i - 1]! + stations[i]!.distanceTo(stations[i - 1]!));
  }
  const total = distances[distances.length - 1]!;
  let correction = 0;
  if (closed)
    correction = Math.atan2(
      tangents[0]!.dot(normals[normals.length - 1]!.clone().cross(normals[0]!)),
      normals[normals.length - 1]!.dot(normals[0]!),
    );
  const rings = stations.map((station, i) => {
    const tangent = tangents[i]!,
      t = distances[i]! / total;
    const axisZ = normals[i]!.clone().applyAxisAngle(
      tangent,
      (correction + THREE.MathUtils.degToRad(twist)) * t,
    );
    const axisX = tangent.clone().cross(axisZ).normalize(),
      scale = scales[i]!;
    return points.map((p) =>
      station
        .clone()
        .addScaledVector(axisX, p.x * scale[0])
        .addScaledVector(axisZ, p.y * scale[1]),
    );
  });
  if (closed) rings[rings.length - 1] = rings[0]!.map((p) => p.clone());
  const out = buildLoft(
    rings,
    rings.map(() => points),
    closed,
    options.cap ?? true,
  );
  warnings.push({
    code: 'SWEEP_SELF_INTERSECTION_UNCHECKED',
    message:
      'Transported frames and caps do not prove a sweep is free of self-intersections. Review tight turns and nearby path segments.',
  });
  out.userData.kilnGeometryWarnings = warnings;
  return out;
}
