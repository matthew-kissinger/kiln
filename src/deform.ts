/** Geometry deformations in a rigid local frame. These always return owned buffers. */
import * as THREE from 'three';
import type { Point3 } from './geometry';

export interface GeometryFrame {
  origin?: Point3;
  /** Euler XYZ rotation, in degrees. */
  rotation?: Point3;
}
export interface DeformOptions {
  frame?: GeometryFrame;
  /** Affected local Y distances, inclusive. Outside vertices are unchanged. */
  interval?: readonly [number, number];
  /** Weight from 0 to 1, evaluated at normalized distance along the interval. */
  falloff?: (t: number) => number;
}

/** Resolve a rigid local frame; units match the authored mesh. */
export function geometryFrameMatrix(frame: GeometryFrame = {}): THREE.Matrix4 {
  const origin = frame.origin ?? [0, 0, 0],
    rotation = frame.rotation ?? [0, 0, 0];
  if (
    origin.length !== 3 ||
    rotation.length !== 3 ||
    ![...origin, ...rotation].every(Number.isFinite)
  )
    throw new Error('geometry frame requires finite xyz origin and rotation');
  return new THREE.Matrix4().compose(
    new THREE.Vector3(...origin),
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        ...(rotation.map(THREE.MathUtils.degToRad) as [number, number, number]),
        'XYZ',
      ),
    ),
    new THREE.Vector3(1, 1, 1),
  );
}

function deform(
  geometry: THREE.BufferGeometry,
  options: DeformOptions,
  map: (point: THREE.Vector3, t: number, low: number, length: number) => THREE.Vector3,
): THREE.BufferGeometry {
  const source = geometry.getAttribute('position');
  if (source?.itemSize !== 3 || source.count === 0)
    throw new Error('deformation requires nonempty xyz positions');
  const matrix = geometryFrameMatrix(options.frame),
    inverse = matrix.clone().invert();
  const points = Array.from({ length: source.count }, (_, i) =>
    new THREE.Vector3().fromBufferAttribute(source, i).applyMatrix4(inverse),
  );
  if (points.some((p) => ![p.x, p.y, p.z].every(Number.isFinite)))
    throw new Error('deformation positions must be finite');
  let low = Infinity,
    high = -Infinity;
  for (const point of points) {
    low = Math.min(low, point.y);
    high = Math.max(high, point.y);
  }
  if (options.interval) {
    if (
      options.interval.length !== 2 ||
      !options.interval.every(Number.isFinite) ||
      options.interval[1] <= options.interval[0]
    )
      throw new Error('deformation interval must be finite and increasing');
    [low, high] = options.interval;
  }
  const length = high - low;
  const out = geometry.clone();
  const position = out.getAttribute('position');
  for (let i = 0; i < points.length; i++) {
    const point = points[i]!;
    // Allow roundoff introduced by an explicitly rotated frame at either endpoint.
    const epsilon = Math.max(1, Math.abs(low), Math.abs(high)) * 1e-7;
    if (point.y < low - epsilon || point.y > high + epsilon) continue;
    const t = length > epsilon ? THREE.MathUtils.clamp((point.y - low) / length, 0, 1) : 0;
    const weight = options.falloff?.(t) ?? 1;
    if (!Number.isFinite(weight) || weight < 0 || weight > 1)
      throw new Error('deformation falloff must return a finite weight between 0 and 1');
    const mapped = map(point.clone(), t, low, length);
    if (![mapped.x, mapped.y, mapped.z].every(Number.isFinite))
      throw new Error('deformation callback must return finite coordinates');
    point.lerp(mapped, weight).applyMatrix4(matrix);
    if (![point.x, point.y, point.z].every((n) => Number.isFinite(Math.fround(n))))
      throw new Error('deformation output must fit finite Float32 coordinates');
    position.setXYZ(i, point.x, point.y, point.z);
  }
  position.needsUpdate = true;
  out.deleteAttribute('tangent');
  out.computeVertexNormals();
  out.computeBoundingBox();
  out.computeBoundingSphere();
  return out;
}

export function twist(
  geometry: THREE.BufferGeometry,
  options: DeformOptions & { angle: number },
): THREE.BufferGeometry {
  if (!Number.isFinite(options.angle)) throw new Error('twist angle must be finite degrees');
  return deform(geometry, options, (p, t) =>
    p.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(options.angle) * t),
  );
}

/** Bend +Y toward +X. Angle is the total centerline turn across the affected interval. */
export function bend(
  geometry: THREE.BufferGeometry,
  options: DeformOptions & { angle: number },
): THREE.BufferGeometry {
  if (!Number.isFinite(options.angle)) throw new Error('bend angle must be finite degrees');
  const angle = THREE.MathUtils.degToRad(options.angle);
  return deform(geometry, options, (p, t, low, length) => {
    if (Math.abs(angle) < 1e-10 || length === 0) return p;
    const radius = length / angle,
      theta = angle * t;
    return new THREE.Vector3(
      radius - (radius - p.x) * Math.cos(theta),
      low + (radius - p.x) * Math.sin(theta),
      p.z,
    );
  });
}

/** Scale local X/Z linearly from startScale to endScale along local Y. */
export function taper(
  geometry: THREE.BufferGeometry,
  options: DeformOptions & {
    startScale?: readonly [number, number];
    endScale: readonly [number, number];
  },
): THREE.BufferGeometry {
  const start = options.startScale ?? [1, 1],
    end = options.endScale;
  if (
    start.length !== 2 ||
    end.length !== 2 ||
    ![...start, ...end].every((n) => Number.isFinite(n) && n > 0)
  )
    throw new Error('taper scales must be two finite positive values');
  return deform(geometry, options, (p, t) =>
    p.set(
      p.x * THREE.MathUtils.lerp(start[0], end[0], t),
      p.y,
      p.z * THREE.MathUtils.lerp(start[1], end[1], t),
    ),
  );
}

/** Callback returns a displacement vector in the supplied frame, not an absolute position. */
export function displace(
  geometry: THREE.BufferGeometry,
  offset: (point: Point3, t: number) => Point3,
  options: DeformOptions = {},
): THREE.BufferGeometry {
  return deform(geometry, options, (p, t) => {
    const delta = offset([p.x, p.y, p.z], t);
    if (delta.length !== 3 || !delta.every(Number.isFinite))
      throw new Error('displace callback must return three finite offsets');
    return p.add(new THREE.Vector3(...delta));
  });
}
