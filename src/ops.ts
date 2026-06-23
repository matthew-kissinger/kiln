/**
 * Kiln higher-level ops — Wave 2B
 *
 * Array/mirror/subdivide/curve helpers that wrap the base primitives.
 * These expand the catalog toward Blender Geometry Nodes parity without
 * bloating primitives.ts.
 *
 * - `arrayLinear` / `arrayRadial` / `mirror` use createInstance under the
 *   hood so the GLB exports as true glTF mesh instances (single geometry,
 *   many transforms).
 * - `subdivide` runs Loop subdivision on a BufferGeometry.
 * - `curveToMesh` / `lathe` wrap Three.js TubeGeometry/LatheGeometry for
 *   curves-as-primitives.
 */

import * as THREE from 'three';
import { LoopSubdivision } from 'three-subdivide';
import { mergeVertices as threeMergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createInstance } from './primitives';

// =============================================================================
// Array ops
// =============================================================================

/**
 * Linear array: place `count` copies of `source` along a constant offset.
 * Uses createInstance so all copies share geometry + material.
 *
 * @example
 * const postGeo = cylinderGeo(0.05, 0.05, 1.5, 6);
 * const postMat = gameMaterial(0x8b6f3d);
 * const first = createPart('Post0', postGeo, postMat, { position: [0, 0.75, 0], parent: root });
 * arrayLinear('Post', first, 10, [0.5, 0, 0], root);  // 10 posts, 0.5 apart on X
 */
export function arrayLinear(
  namePrefix: string,
  source: THREE.Object3D,
  count: number,
  offset: [number, number, number],
  parent?: THREE.Object3D
): THREE.Object3D[] {
  const out: THREE.Object3D[] = [];
  // Source is already at some position; clones start at offset 1.
  const base = source.position.toArray() as [number, number, number];
  for (let i = 1; i < count; i++) {
    const pos: [number, number, number] = [
      base[0] + offset[0] * i,
      base[1] + offset[1] * i,
      base[2] + offset[2] * i,
    ];
    out.push(createInstance(`${namePrefix}${i}`, source, { position: pos, parent }));
  }
  return out;
}

/**
 * Radial array: place `count` copies of `source` around an axis at radius.
 * Source stays put; clones orbit around the origin on the given axis.
 *
 * @example
 * const bolt = createPart('Bolt', cylinderGeo(0.02, 0.02, 0.1, 6), steel,
 *   { position: [1, 0, 0], parent: root });
 * arrayRadial('Bolt', bolt, 8, 'y', root);  // 8 bolts around Y axis
 */
export function arrayRadial(
  namePrefix: string,
  source: THREE.Object3D,
  count: number,
  axis: 'x' | 'y' | 'z' = 'y',
  parent?: THREE.Object3D
): THREE.Object3D[] {
  const out: THREE.Object3D[] = [];
  const basePos = source.position.clone();
  const axisVec =
    axis === 'x'
      ? new THREE.Vector3(1, 0, 0)
      : axis === 'z'
        ? new THREE.Vector3(0, 0, 1)
        : new THREE.Vector3(0, 1, 0);

  for (let i = 1; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const m = new THREE.Matrix4().makeRotationAxis(axisVec, angle);
    const rotated = basePos.clone().applyMatrix4(m);
    // Rotate local frame too so the copy faces outward consistently.
    const eulerDeg: [number, number, number] =
      axis === 'y'
        ? [0, (angle * 180) / Math.PI, 0]
        : axis === 'x'
          ? [(angle * 180) / Math.PI, 0, 0]
          : [0, 0, (angle * 180) / Math.PI];
    out.push(
      createInstance(`${namePrefix}${i}`, source, {
        position: [rotated.x, rotated.y, rotated.z],
        rotation: eulerDeg,
        parent,
      })
    );
  }
  return out;
}

/**
 * Mirror: create one mirrored instance of `source` across the given plane.
 * Plane is identified by its normal axis ('x' = mirror across YZ plane).
 *
 * Uses a negative scale on the mirror axis. Note: negative scale flips
 * triangle winding — the bridge still exports correctly but lighting on
 * the mirrored copy may invert until GLB viewers apply the TRS properly.
 */
export function mirror(
  name: string,
  source: THREE.Object3D,
  axis: 'x' | 'y' | 'z',
  parent?: THREE.Object3D
): THREE.Object3D {
  const sourcePos = source.position.toArray() as [number, number, number];
  const pos: [number, number, number] = [
    axis === 'x' ? -sourcePos[0] : sourcePos[0],
    axis === 'y' ? -sourcePos[1] : sourcePos[1],
    axis === 'z' ? -sourcePos[2] : sourcePos[2],
  ];
  const scale: [number, number, number] = [
    axis === 'x' ? -1 : 1,
    axis === 'y' ? -1 : 1,
    axis === 'z' ? -1 : 1,
  ];
  return createInstance(name, source, { position: pos, scale, parent });
}

// =============================================================================
// Mesh ops
// =============================================================================

/**
 * Weld coincident vertices into shared indexed ones.
 *
 * Three.js's built-in BoxGeometry / CylinderGeometry / SphereGeometry carry
 * 4 verts per face so per-face normals and UVs stay independent. That's
 * correct for rendering but breaks any op that depends on vertex adjacency
 * — subdivision, smooth shading, per-vertex deformation.
 *
 * By default Three's `mergeVertices` hashes position + normal + uv, so
 * face-adjacent verts with different normals (e.g. a cube corner touching
 * 3 faces) do NOT collapse. Pass `{ positionOnly: true }` to weld purely
 * by position — the other attributes get dropped; the caller is
 * responsible for recomputing normals / UVs afterward.
 *
 * @example
 * // Full weld (preserves seams where normals or UVs differ):
 * const welded = mergeVertices(boxGeo(1, 1, 1));   // stays 24 verts
 *
 * @example
 * // Position-only weld (collapses shared corners for subdivision):
 * const merged = mergeVertices(boxGeo(1, 1, 1), { positionOnly: true }); // 8 verts
 * const smoothed = subdivide(merged, 2);            // single connected blob
 */
export function mergeVertices(
  geometry: THREE.BufferGeometry,
  opts: { tolerance?: number; positionOnly?: boolean } | number = {}
): THREE.BufferGeometry {
  // Legacy numeric second-arg still works: mergeVertices(geo, 1e-4)
  const { tolerance = 1e-4, positionOnly = false } =
    typeof opts === 'number' ? { tolerance: opts } : opts;

  if (!positionOnly) return threeMergeVertices(geometry, tolerance);

  // Strip non-position attributes so the hash only keys on position.
  const stripped = new THREE.BufferGeometry();
  const pos = geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
  if (!pos) return geometry;
  stripped.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(pos.array), pos.itemSize, pos.normalized)
  );
  if (geometry.index) {
    stripped.setIndex(new THREE.BufferAttribute(new Uint32Array(geometry.index.array), 1));
  }
  return threeMergeVertices(stripped, tolerance);
}

/**
 * Subdivide a geometry using Loop subdivision (via three-subdivide).
 * Returns a new BufferGeometry; the input is not mutated.
 *
 * Higher `iterations` = smoother but exponentially more triangles.
 * 1 iteration ~= 4x triangle count, 2 ~= 16x. Budget accordingly.
 *
 * Non-indexed inputs (Three's built-in primitives) are auto-welded via
 * `mergeVertices` first so shared corners subdivide as one surface, not
 * as disconnected face patches. Pass `opts.weld = false` to skip.
 *
 * @example
 * const smoothRock = subdivide(boxGeo(1, 1, 1), 2);
 */
export function subdivide(
  geometry: THREE.BufferGeometry,
  iterations = 1,
  opts: {
    split?: boolean;
    uvSmooth?: boolean;
    preserveEdges?: boolean;
    flatOnly?: boolean;
    weld?: boolean;
  } = {}
): THREE.BufferGeometry {
  const { weld = true, ...subOpts } = opts;
  // Subdivision wants position-only adjacency. Weld shared corners so
  // Three's box/sphere/cylinder (which keep 4 verts per face for
  // independent normals/UVs) become a single connected surface.
  const input = weld ? mergeVertices(geometry, { positionOnly: true }) : geometry;
  return LoopSubdivision.modify(input, iterations, subOpts);
}

// =============================================================================
// Curve ops
// =============================================================================

/**
 * Sweep a circular profile along a path of points to produce a tube mesh.
 * The simplest "curve to mesh" — matches Blender's Curve to Mesh node when
 * the profile is a circle.
 *
 * @param points — array of [x, y, z] waypoints defining the path
 * @param radius — tube radius
 * @param tubularSegments — segments along the path (default 32)
 * @param radialSegments — segments around the tube (default 8)
 * @param closed — loop the path back to start (default false)
 *
 * @example
 * const pipeGeo = curveToMesh([[0,0,0], [0,1,0], [1,1,0], [1,2,0]], 0.1);
 */
export function curveToMesh(
  points: Array<[number, number, number]>,
  radius: number,
  tubularSegments = 32,
  radialSegments = 8,
  closed = false
): THREE.BufferGeometry {
  const vectors = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  const curve = new THREE.CatmullRomCurve3(vectors, closed);
  return new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, closed);
}

/**
 * Construct a lathe (surface of revolution) by spinning a 2D profile
 * around the Y axis. Classic for bottles, vases, wheels, turned wood.
 *
 * @param profile — array of [x, y] points; x is radial distance, y is height
 * @param segments — radial segments (default 12)
 */
export function lathe(
  profile: Array<[number, number]>,
  segments = 12
): THREE.BufferGeometry {
  const points2d = profile.map((p) => new THREE.Vector2(p[0], p[1]));
  return new THREE.LatheGeometry(points2d, segments);
}

/**
 * Surface of revolution with explicit axis + sweep angle. Generalises
 * `lathe` (which is locked to a full revolution around +Y) for cases where
 * you need a partial sweep (e.g. half a dome, a 90° wedge of a wheel) or
 * a non-Y axis of revolution (e.g. a fan blade revolved around +X).
 *
 * The 2D `profile` is in the same convention as `lathe`: x = radial
 * distance from the axis, y = position along the axis. Then:
 *   - `angle` controls the sweep (default `2π` = full revolution).
 *   - `axis` reorients the resulting Y-up surface to point along the
 *     supplied unit vector (defaults to `[0, 1, 0]` = no reorientation).
 *
 * Pattern adapted from chili3d's `revolve(profile, axis: Line, angle)` —
 * the parameter shape is the same, but the implementation is mesh-only
 * (Three.js LatheGeometry + a quaternion reorientation) rather than B-rep.
 *
 * @example
 * // Half-dome: profile traces a quarter circle, sweep 180°.
 * const dome = revolveGeo(
 *   [...Array(8)].map((_, i) => {
 *     const t = (i / 7) * Math.PI / 2;
 *     return [Math.cos(t), Math.sin(t)] as [number, number];
 *   }),
 *   { angle: Math.PI }
 * );
 */
export function revolveGeo(
  profile: Array<[number, number]>,
  options: {
    angle?: number;
    axis?: [number, number, number];
    segments?: number;
  } = {}
): THREE.BufferGeometry {
  const { angle = Math.PI * 2, axis = [0, 1, 0], segments = 12 } = options;
  const points2d = profile.map((p) => new THREE.Vector2(p[0], p[1]));
  // LatheGeometry signature: (points, segments, phiStart, phiLength).
  const geo = new THREE.LatheGeometry(points2d, segments, 0, angle);

  const n = new THREE.Vector3(axis[0], axis[1], axis[2]);
  if (n.lengthSq() < 1e-12) {
    throw new Error(`revolveGeo: axis must be a non-zero vector (got [${axis.join(',')}]).`);
  }
  n.normalize();
  if (n.x !== 0 || n.y !== 1 || n.z !== 0) {
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    geo.applyQuaternion(q);
  }
  return geo;
}

/**
 * Path-driven swept circle. Generalises `beamBetween` (point-to-point) and
 * `curveToMesh` (raw catmull-rom) into a single helper that accepts a path
 * of waypoints plus an optional bend-radius for smoothing sharp corners.
 *
 * Compared to `curveToMesh`:
 *   - Same TubeGeometry/CatmullRomCurve3 backbone, so the visual result is
 *     identical for unsmoothed paths.
 *   - `bendRadius > 0` inserts interpolated waypoints near each interior
 *     turn so the spline reads as a rounded corner instead of a single
 *     control point yanking the curve.
 *   - `closed` loops the path end back to start.
 *
 * Pattern adapted from chili3d's PipeNode (`bendRadius` + path interpolation
 * for sharp turns) — implementation is original Three.js mesh-side code.
 *
 * @example
 * // Cable run along the gunwale of a boat:
 * const cable = pipeAlongPath(
 *   [[0, 0.5, 0], [1, 0.5, 0], [1, 0.5, 2]],
 *   0.02,
 *   { bendRadius: 0.1 }
 * );
 */
export function pipeAlongPath(
  points: Array<[number, number, number]>,
  radius: number,
  options: {
    bendRadius?: number;
    closed?: boolean;
    tubularSegments?: number;
    radialSegments?: number;
  } = {}
): THREE.BufferGeometry {
  const {
    bendRadius = 0,
    closed = false,
    tubularSegments = 32,
    radialSegments = 8,
  } = options;

  if (points.length < 2) {
    throw new Error(
      `pipeAlongPath: need at least 2 points (got ${points.length}).`
    );
  }

  let pathPoints = points;

  // Bend smoothing: at each interior corner, replace the corner point with
  // two points offset along the incoming/outgoing edges by `bendRadius`.
  // The Catmull-Rom spline then curves smoothly between them instead of
  // pinching tightly to the corner. Skipped for endpoints (or always for a
  // closed path's first/last, since they're not corners).
  if (bendRadius > 0 && points.length >= 3) {
    const smoothed: Array<[number, number, number]> = [];
    smoothed.push(points[0]!);
    for (let i = 1; i < points.length - 1; i++) {
      const prev = new THREE.Vector3(...points[i - 1]!);
      const cur = new THREE.Vector3(...points[i]!);
      const next = new THREE.Vector3(...points[i + 1]!);
      const inDir = cur.clone().sub(prev);
      const outDir = next.clone().sub(cur);
      const inLen = inDir.length();
      const outLen = outDir.length();
      // Cap the offset so adjacent segments don't overlap.
      const inOffset = Math.min(bendRadius, inLen / 2);
      const outOffset = Math.min(bendRadius, outLen / 2);
      const before = cur.clone().sub(inDir.clone().normalize().multiplyScalar(inOffset));
      const after = cur.clone().add(outDir.clone().normalize().multiplyScalar(outOffset));
      smoothed.push([before.x, before.y, before.z]);
      smoothed.push([after.x, after.y, after.z]);
    }
    smoothed.push(points[points.length - 1]!);
    pathPoints = smoothed;
  }

  const vectors = pathPoints.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  const curve = new THREE.CatmullRomCurve3(vectors, closed);
  return new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, closed);
}

/**
 * Quadratic or cubic Bézier curve sampled into a point list for curveToMesh.
 * 3 points = quadratic, 4 points = cubic.
 *
 * @example
 * const path = bezierCurve([[0,0,0], [1,2,0], [3,2,0], [4,0,0]], 24);
 * const geo = curveToMesh(path, 0.1);
 */
export function bezierCurve(
  controlPoints: Array<[number, number, number]>,
  samples = 32
): Array<[number, number, number]> {
  const vecs = controlPoints.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  let curve: THREE.Curve<THREE.Vector3>;
  if (vecs.length === 3) {
    curve = new THREE.QuadraticBezierCurve3(vecs[0]!, vecs[1]!, vecs[2]!);
  } else if (vecs.length === 4) {
    curve = new THREE.CubicBezierCurve3(vecs[0]!, vecs[1]!, vecs[2]!, vecs[3]!);
  } else {
    throw new Error(`bezierCurve: need 3 or 4 control points, got ${vecs.length}`);
  }
  return curve.getPoints(samples).map((v) => [v.x, v.y, v.z] as [number, number, number]);
}
