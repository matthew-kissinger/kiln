/**
 * Composer overlap validation — pure AABB geometry, no THREE, no I/O.
 *
 * Scenes place generated GLBs on the ground as placements (a generation id + a
 * transform: position, Y-rotation, uniform scale). The deterministic packer
 * *claims* to be overlap-free but underestimates each asset's footprint and
 * ignores the fact that a generated mesh is rarely centred on its own origin —
 * so buildings collide. This module is the ground truth that catches it:
 *
 *   - `worldAabbFromLocal` folds an asset's LOCAL bbox (which carries the centre
 *     offset) through uniform scale + Y-rotation + translation into a
 *     world-space axis-aligned box. This is the fix for "the mesh lands offset
 *     from where the packer reasoned".
 *   - `findOverlaps` / `findPlacementOverlaps` report every colliding pair with a
 *     penetration depth, the limiting axis, and the minimal translation vector
 *     that separates them — directly consumable by a composer tool that nudges
 *     things apart, and by a Bun test that fails on any overlap.
 *
 * `mode: 'footprint'` (default) ignores Y: everything sits on the same ground
 * plane, so two assets whose XZ footprints overlap visually intersect no matter
 * their heights — that is the failure the user sees. `mode: 'volume'` is the
 * full 3D check for stacked / interior composition.
 *
 * O(n^2) over placements; scenes cap at 200, so ~20k cheap pair tests — fine. A
 * uniform-grid broadphase is the obvious upgrade if a scene ever needs it.
 */

export type Vec3 = [number, number, number];

export interface Aabb {
  min: Vec3;
  max: Vec3;
}

export interface PlacedBox extends Aabb {
  /** Stable id for reporting (instanceId or asset id). */
  id: string;
}

/** A scene placement in the terms Studio already has: a local (asset-space)
 *  bounding box plus the transform applied to drop it into the world. */
export interface PlacedAsset {
  id: string;
  /** Asset-local bbox (e.g. GenerationRecord.metrics.bbox.min/max), unscaled. */
  localMin: Vec3;
  localMax: Vec3;
  /** World position the asset origin is placed at. */
  pos: Vec3;
  /** Y rotation in DEGREES (kiln transforms are degrees). Default 0. */
  rotYDeg?: number;
  /** Uniform scale. Default 1. */
  scale?: number;
}

export type OverlapMode = 'footprint' | 'volume';

export interface OverlapOptions {
  /** Penetration at or below this (world units) counts as "just touching", not
   *  overlapping. Default 0.01 (1cm). */
  tolerance?: number;
  /** 'footprint' ignores Y (ground-plane scenes, the default); 'volume' is full 3D. */
  mode?: OverlapMode;
}

export interface OverlapViolation {
  a: string;
  b: string;
  /** Penetration depth per axis (>=0). In 'footprint' mode the Y entry is 0. */
  penetration: Vec3;
  /** Axis of least penetration — the cheapest way to separate the pair. */
  axis: 'x' | 'y' | 'z';
  /** Minimal world translation to apply to `b` to separate it from `a` (apply
   *  the negation to `a` instead). Lies along `axis`. */
  separation: Vec3;
  /** Overlap measure for ranking: footprint area (xz) or volume (xyz). */
  severity: number;
}

const DEG = Math.PI / 180;
const AXIS_NAME = ['x', 'y', 'z'] as const;
const axisIndex = (ax: 'x' | 'y' | 'z'): 0 | 1 | 2 => (ax === 'x' ? 0 : ax === 'y' ? 1 : 2);

function center(b: Aabb): Vec3 {
  return [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2];
}

/** Per-axis penetration depth of two AABBs: min(aMax,bMax) - max(aMin,bMin).
 *  Positive ⇒ overlap on that axis; <=0 ⇒ a gap (a separating axis). */
function penetrationPerAxis(a: Aabb, b: Aabb): Vec3 {
  return [
    Math.min(a.max[0], b.max[0]) - Math.max(a.min[0], b.min[0]),
    Math.min(a.max[1], b.max[1]) - Math.max(a.min[1], b.min[1]),
    Math.min(a.max[2], b.max[2]) - Math.max(a.min[2], b.min[2]),
  ];
}

/** Test a single pair. Returns the violation (with the minimum-translation
 *  separation) or null when the boxes are clear of each other. */
export function aabbOverlap(
  a: PlacedBox,
  b: PlacedBox,
  opts: OverlapOptions = {},
): OverlapViolation | null {
  const tol = opts.tolerance ?? 0.01;
  const mode = opts.mode ?? 'footprint';
  const pen = penetrationPerAxis(a, b);
  const tested: ReadonlyArray<0 | 1 | 2> = mode === 'footprint' ? [0, 2] : [0, 1, 2];

  for (const i of tested) {
    if (pen[i] <= tol) return null; // a separating axis ⇒ no overlap
  }
  // Minimum-penetration axis among the tested axes ⇒ cheapest separation (MTV).
  let mtv: 0 | 1 | 2 = 0; // x is always tested
  for (const i of tested) {
    if (pen[i] < pen[mtv]) mtv = i;
  }

  const dir = center(b)[mtv] >= center(a)[mtv] ? 1 : -1; // push b away from a
  const separation: Vec3 = [0, 0, 0];
  separation[mtv] = dir * pen[mtv];

  return {
    a: a.id,
    b: b.id,
    penetration: [pen[0], mode === 'footprint' ? 0 : pen[1], pen[2]],
    axis: AXIS_NAME[mtv],
    separation,
    severity: mode === 'footprint' ? pen[0] * pen[2] : pen[0] * pen[1] * pen[2],
  };
}

/** Every overlapping pair among `boxes`, worst (deepest) first. */
export function findOverlaps(boxes: PlacedBox[], opts: OverlapOptions = {}): OverlapViolation[] {
  const out: OverlapViolation[] = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const v = aabbOverlap(boxes[i]!, boxes[j]!, opts);
      if (v) out.push(v);
    }
  }
  out.sort((p, q) => q.severity - p.severity);
  return out;
}

/** Cheap boolean: does any pair overlap? Short-circuits on the first hit. */
export function isOverlapFree(boxes: PlacedBox[], opts: OverlapOptions = {}): boolean {
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (aabbOverlap(boxes[i]!, boxes[j]!, opts)) return false;
    }
  }
  return true;
}

/** Fold an asset's LOCAL bbox through uniform scale, Y-rotation (about the asset
 *  origin — NOT the bbox centre, since generated meshes are rarely centred), and
 *  translation into a world-space AABB. Captures both the centre offset and the
 *  footprint growth a Y-rotation produces. */
export function worldAabbFromLocal(
  localMin: Vec3,
  localMax: Vec3,
  pos: Vec3,
  rotYDeg = 0,
  scale = 1,
): Aabb {
  // Scaled local centre + half-extents.
  const cx = ((localMin[0] + localMax[0]) / 2) * scale;
  const cy = ((localMin[1] + localMax[1]) / 2) * scale;
  const cz = ((localMin[2] + localMax[2]) / 2) * scale;
  const ex = (Math.abs(localMax[0] - localMin[0]) / 2) * scale;
  const ey = (Math.abs(localMax[1] - localMin[1]) / 2) * scale;
  const ez = (Math.abs(localMax[2] - localMin[2]) / 2) * scale;

  const th = rotYDeg * DEG;
  const cos = Math.cos(th);
  const sin = Math.sin(th);

  // Rotate the centre about the origin (three.js Y-rotation of a vector), and
  // grow the axis-aligned XZ half-extents to bound the rotated box. Y unchanged.
  const rcx = cx * cos + cz * sin;
  const rcz = -cx * sin + cz * cos;
  const rex = ex * Math.abs(cos) + ez * Math.abs(sin);
  const rez = ex * Math.abs(sin) + ez * Math.abs(cos);

  const wx = pos[0] + rcx;
  const wy = pos[1] + cy;
  const wz = pos[2] + rcz;
  return { min: [wx - rex, wy - ey, wz - rez], max: [wx + rex, wy + ey, wz + rez] };
}

/** World AABB for one placement (its local bbox through its transform). */
export function placedAssetToBox(a: PlacedAsset): PlacedBox {
  const { min, max } = worldAabbFromLocal(
    a.localMin,
    a.localMax,
    a.pos,
    a.rotYDeg ?? 0,
    a.scale ?? 1,
  );
  return { id: a.id, min, max };
}

/** Overlaps among placements expressed as local-bbox + transform. The ergonomic
 *  entry for Studio's compose step and the composer's check tool. */
export function findPlacementOverlaps(
  assets: PlacedAsset[],
  opts: OverlapOptions = {},
): OverlapViolation[] {
  return findOverlaps(assets.map(placedAssetToBox), opts);
}

/** One-line-per-pair human summary for tool output / failing-test messages. */
export function summarizeOverlaps(violations: OverlapViolation[]): string {
  if (violations.length === 0) return 'No overlapping placements.';
  const lines = violations.map((v) => {
    const mag = Math.abs(v.separation[axisIndex(v.axis)]);
    return `  "${v.a}" overlaps "${v.b}" — separate by ${mag.toFixed(2)}u along ${v.axis}`;
  });
  return `${violations.length} overlapping pair(s):\n${lines.join('\n')}`;
}
