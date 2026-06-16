/**
 * Six-view grid rendering for the Kiln vision loop.
 *
 * Renders a scene (or a Kiln program) to a 3x2 grid PNG of orthographic
 * views — Front / Right / Back / Left | Top / 3-4 — using the pure-CPU
 * rasterizer in ./raster.ts. This is what the agent sees via the
 * kiln_screenshot tool and what ships as the views.png artifact.
 *
 * Grid order (stated in tool text instead of baked-in labels):
 *   row 1: Front, Right, Back
 *   row 2: Left,  Top,   3/4
 */

import { rasterizeView, measureBounds, SIX_VIEWS, type RasterOptions, type ViewSpec } from './raster';
import { encodePng } from './png';
import {
  prepareClip,
  poseSceneAtTime,
  planFrameTimes,
  findClip,
  clipNames,
  stampLabel,
  type DuckClip,
} from './pose';

export { rasterizeView, measureBounds, SIX_VIEWS, coverage } from './raster';
export type { RasterOptions, ViewSpec } from './raster';
export { encodePng } from './png';
export {
  prepareClip,
  poseSceneAtTime,
  planFrameTimes,
  findClip,
  clipNames,
  type DuckClip,
  type PreparedClip,
} from './pose';

const PAD = 4;
const PAD_COLOR: [number, number, number] = [10, 11, 13];

export interface ViewGridResult {
  png: Buffer;
  width: number;
  height: number;
  /** View names in grid order (row-major). */
  views: string[];
}

export interface ViewGridOptions extends RasterOptions {
  views?: ViewSpec[];
}

/** Render a (possibly sandbox-created) Three.js scene root into the 3x2 grid. */
export async function renderViewGrid(
  root: unknown,
  opts: ViewGridOptions = {}
): Promise<ViewGridResult> {
  const size = opts.size ?? 256;
  const views = opts.views ?? SIX_VIEWS;
  const cols = 3;
  const rows = Math.ceil(views.length / cols);
  const width = cols * size + (cols + 1) * PAD;
  const height = rows * size + (rows + 1) * PAD;

  const grid = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    grid[i * 3] = PAD_COLOR[0];
    grid[i * 3 + 1] = PAD_COLOR[1];
    grid[i * 3 + 2] = PAD_COLOR[2];
  }

  for (let vi = 0; vi < views.length; vi++) {
    const cell = rasterizeView(root, views[vi]!.dir, { size, backfaceCull: opts.backfaceCull });
    const col = vi % cols;
    const row = Math.floor(vi / cols);
    const x0 = PAD + col * (size + PAD);
    const y0 = PAD + row * (size + PAD);
    for (let y = 0; y < size; y++) {
      const src = y * size * 3;
      const dst = ((y0 + y) * width + x0) * 3;
      grid.set(cell.subarray(src, src + size * 3), dst);
    }
  }

  return {
    png: encodePng(grid, width, height),
    width,
    height,
    views: views.map((v) => v.name),
  };
}

/** Execute a Kiln program and render its scene into the 3x2 grid. */
export async function renderCodeViewGrid(
  code: string,
  opts: ViewGridOptions = {}
): Promise<ViewGridResult> {
  const { executeKilnCode } = await import('../render');
  const { root } = await executeKilnCode(code);
  return renderViewGrid(root, opts);
}

// =============================================================================
// Animation views — see one clip's MOTION (kiln_screenshot_animation)
// =============================================================================

/** Friendly camera names → orthographic view directions (kiln frame). The default
 *  is RIGHT: the side profile reveals forward/back leg swing, knee bend direction,
 *  and the arc of an attack — the motion defects a static grid can't show. */
const ANIM_CAMERAS: Record<string, ViewSpec> = {
  front: { name: 'Front', dir: [1, 0, 0] },
  right: { name: 'Right', dir: [0, 0, 1] },
  back: { name: 'Back', dir: [-1, 0, 0] },
  left: { name: 'Left', dir: [0, 0, -1] },
  top: { name: 'Top', dir: [0, 1, 0.0001] },
  'three-quarter': { name: '3/4', dir: [0.7, 0.5, 0.7] },
};
const ANIM_CAMERA_ALIASES: Record<string, string> = {
  '3/4': 'three-quarter',
  '34': 'three-quarter',
  threequarter: 'three-quarter',
  quarter: 'three-quarter',
  perspective: 'three-quarter',
  side: 'right',
  profile: 'right',
};

function resolveCamera(name?: string): ViewSpec {
  const key = (name ?? 'right').trim().toLowerCase().replace(/[_\s]+/g, '-');
  return ANIM_CAMERAS[key] ?? ANIM_CAMERAS[ANIM_CAMERA_ALIASES[key] ?? ''] ?? ANIM_CAMERAS['right']!;
}

export interface AnimationViewOptions extends RasterOptions {
  /** Clip to render, by name (case-insensitive, substring-tolerant). Omit → first clip. */
  clip?: string;
  /** Camera angle. Default 'right' (side profile). */
  camera?: string;
  /** Frames sampled across the clip (start→end inclusive). Default 6. */
  frames?: number;
  /** Return the frames as separate PNGs instead of one composite grid. Default false. */
  perFrame?: boolean;
}

export interface AnimationViewResult {
  ok: boolean;
  clip?: string;
  camera?: string;
  frames: number;
  /** Phase fraction (0..1) of each frame, in order. */
  frameTimes: number[];
  /** Clip duration in seconds. */
  duration?: number;
  /** Track targets that resolve to no joint — the "frozen clip" signal (cause #1). */
  unresolvedTracks?: string[];
  width?: number;
  height?: number;
  /** Composite grid PNG (default mode). */
  png?: Buffer;
  /** Per-frame PNGs (perFrame mode). */
  pngs?: Buffer[];
  /** Clip names available in the scene (set on a not-found error). */
  availableClips?: string[];
  error?: string;
}

/** Phase percentage label for frame i of n, e.g. "0%" … "100%". */
function phaseLabel(i: number, n: number): string {
  const pct = n <= 1 ? 0 : Math.round((100 * i) / (n - 1));
  return `${pct}%`;
}

/**
 * Render one animation clip as a strip of evenly-sampled, phase-labeled frames
 * from a single camera, so the agent can SEE the motion (sideways walk, reverse
 * knee, backward swing, item not tracking the hand). MUTATES `root` (callers pass
 * a freshly executed scene — the tool re-executes per call).
 *
 * Two passes: pose+measure every frame to a union AABB (steady framing so root
 * travel reads), then pose+rasterize+label each frame against that fixed box.
 */
export async function renderClipAnimation(
  root: unknown,
  clips: readonly DuckClip[],
  opts: AnimationViewOptions = {},
): Promise<AnimationViewResult> {
  const size = opts.size ?? 256;
  const frameCount = Math.max(2, Math.min(opts.frames ?? 6, 6));
  const cam = resolveCamera(opts.camera);

  if (!clips || clips.length === 0) {
    return { ok: false, frames: 0, frameTimes: [], error: 'this asset has no animation clips', availableClips: [] };
  }
  // Resolve the requested clip by name; default to the first when none is named.
  const requested = opts.clip?.trim();
  const chosen = requested ? findClip(clips, requested) : clips[0];
  if (!chosen) {
    return {
      ok: false,
      frames: 0,
      frameTimes: [],
      ...(requested ? { clip: requested } : {}),
      error: `clip "${requested}" not found in this asset`,
      availableClips: clipNames(clips),
    };
  }

  const prepared = prepareClip(root as never, chosen);
  const times = planFrameTimes(prepared.duration, frameCount);
  const frameTimes = times.map((t) => (prepared.duration > 0 ? t / prepared.duration : 0));

  // Pass 1 — union the posed bounds so all frames share one camera framing.
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const t of times) {
    poseSceneAtTime(root as never, prepared, t);
    const b = measureBounds(root);
    for (let a = 0; a < 3; a++) {
      const lo = b.min[a]!;
      const hi = b.max[a]!;
      if (lo < min[a]!) min[a] = lo;
      if (hi > max[a]!) max[a] = hi;
    }
  }
  const frameBounds = Number.isFinite(min[0]) ? { min, max } : undefined;

  // Pass 2 — render + label each frame against the fixed framing.
  const labelScale = Math.max(2, Math.round(size / 80));
  const cells: Uint8Array[] = [];
  for (let i = 0; i < times.length; i++) {
    poseSceneAtTime(root as never, prepared, times[i]!);
    const cell = rasterizeView(root, cam.dir, {
      size,
      ...(opts.backfaceCull !== undefined ? { backfaceCull: opts.backfaceCull } : {}),
      ...(frameBounds ? { frameBounds } : {}),
    });
    stampLabel(cell, size, size, labelScale, labelScale, phaseLabel(i, times.length), labelScale);
    cells.push(cell);
  }

  const baseMeta = {
    ok: true as const,
    clip: prepared.name,
    camera: cam.name,
    frames: times.length,
    frameTimes,
    duration: prepared.duration,
    ...(prepared.unresolved.length ? { unresolvedTracks: prepared.unresolved } : {}),
  };

  if (opts.perFrame) {
    return {
      ...baseMeta,
      width: size,
      height: size,
      pngs: cells.map((c) => encodePng(c, size, size)),
    };
  }

  // Compose into a 3x2 grid (same layout as the six-view grid).
  const cols = 3;
  const rows = Math.ceil(cells.length / cols);
  const width = cols * size + (cols + 1) * PAD;
  const height = rows * size + (rows + 1) * PAD;
  const grid = new Uint8Array(width * height * 3);
  for (let p = 0; p < width * height; p++) {
    grid[p * 3] = PAD_COLOR[0];
    grid[p * 3 + 1] = PAD_COLOR[1];
    grid[p * 3 + 2] = PAD_COLOR[2];
  }
  for (let i = 0; i < cells.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x0 = PAD + col * (size + PAD);
    const y0 = PAD + row * (size + PAD);
    for (let y = 0; y < size; y++) {
      const src = y * size * 3;
      const dst = ((y0 + y) * width + x0) * 3;
      grid.set(cells[i]!.subarray(src, src + size * 3), dst);
    }
  }
  return { ...baseMeta, width, height, png: encodePng(grid, width, height) };
}
