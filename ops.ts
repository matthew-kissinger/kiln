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
 * Subdivide a geometry using Loop subdivision (via three-subdivide).
 * Returns a new BufferGeometry; the input is not mutated.
 *
 * Higher `iterations` = smoother but exponentially more triangles.
 * 1 iteration ~= 4x triangle count, 2 ~= 16x. Budget accordingly.
 *
 * @example
 * const smoothRock = subdivide(boxGeo(1, 1, 1), 2);
 */
export function subdivide(
  geometry: THREE.BufferGeometry,
  iterations = 1,
  opts: { split?: boolean; uvSmooth?: boolean; preserveEdges?: boolean; flatOnly?: boolean } = {}
): THREE.BufferGeometry {
  return LoopSubdivision.modify(geometry, iterations, opts);
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
