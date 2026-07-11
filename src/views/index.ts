/**
 * Six-view grid rendering for the Kiln vision loop.
 *
 * Renders a scene (or a Kiln program) to a 3x2 grid PNG of orthographic
 * views — Front / Right / Back / Left | Top / 3-4 — using the pure-CPU
 * rasterizer in ./raster.ts. This is what the agent sees via the
 * kiln_screenshot tool and what ships as the views.png artifact.
 *
 * Grid order (H-30: now ALSO stamped into each cell as a label + axis gnomon,
 * matching the animation/interior grids — grid-confusion literature shows
 * text-only layout descriptions silently fail):
 *   row 1: Front, Right, Back
 *   row 2: Left,  Top,   3/4
 */

import {
  rasterizeView,
  measureBounds,
  hideNodeInScene,
  SIX_VIEWS,
  type RasterOptions,
  type ViewSpec,
} from './raster';
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
import { hideArchitectureRoofInScene } from './architecture';
import {
  buildSlotIndex,
  chooseSlot,
  hexToLinearRgb,
  type SnapPaletteSlot,
  type Vec3,
} from '../palette-snap';

export { rasterizeView, measureBounds, hideNodeInScene, SIX_VIEWS, coverage } from './raster';
export type { RasterOptions, ViewSpec } from './raster';
export { encodePng } from './png';
export {
  ARCHITECTURE_ROOF_ROLE_PREFIXES,
  hasArchitectureRoofRole,
  hideArchitectureRoofInScene,
  selectArchitectureRoofNodes,
} from './architecture';
export type {
  ArchitectureRoofSelection,
  ArchitectureRoofSelectionMode,
  ArchitectureViewNode,
} from './architecture';
export { rasterizeComposedScene, SCENE_VIEWS } from './scene-raster';
export type { ComposedPart, ComposedSceneRasterResult } from './scene-raster';
export {
  GENERIC_DIAGNOSTIC_BUFFER_IDS,
  GENERIC_DIAGNOSTIC_CAMERAS,
  GENERIC_DIAGNOSTIC_REQUESTS,
  planDiagnosticViews,
  renderDiagnosticView,
  renderDiagnosticViews,
} from './diagnostic';
export {
  CHARACTER_MOTION_DIAGNOSTIC_PHASES,
  buildCharacterDiagnosticDescriptor,
  planCharacterDiagnosticRequests,
} from './character';
export type {
  CharacterDiagnosticDescriptorV1,
  CharacterDiagnosticEdgeV1,
  CharacterDiagnosticJointV1,
  CharacterDiagnosticRequestV1,
} from './character';
export {
  captureVehicleDiagnosticViews,
  createVehicleDiagnosticOverlay,
  describeVehicleDiagnostics,
} from './vehicle';
export type {
  VehicleCapturedDiagnosticV1,
  VehicleDiagnosticAxleV1,
  VehicleDiagnosticDescriptorV1,
  VehicleDiagnosticViewV1,
  VehicleDiagnosticWheelV1,
} from './vehicle';
export type {
  CategoryDiagnosticVariant,
  DiagnosticCameraSpec,
  DiagnosticOverlayRegion,
  DiagnosticRenderOptions,
  DiagnosticViewFrame,
  DiagnosticViewPlanV1,
  DiagnosticViewRequest,
  GenericDiagnosticBufferId,
} from './diagnostic';
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

interface DuckColor {
  r: number;
  g: number;
  b: number;
}

interface DuckMaterial {
  color?: DuckColor;
  emissive?: DuckColor;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  metalness?: number;
  roughness?: number;
  map?: unknown;
  vertexColors?: boolean;
}

interface DuckMesh {
  isMesh?: boolean;
  material?: DuckMaterial | DuckMaterial[];
}

interface DuckObject3D {
  traverse?: (cb: (obj: DuckMesh) => void) => void;
}

export interface ScenePaletteSnapResult {
  snapped: number;
  skipped: number;
}

function setLinearColor(color: DuckColor | undefined, rgb: Vec3): void {
  if (!color) return;
  color.r = rgb[0];
  color.g = rgb[1];
  color.b = rgb[2];
}

function snapMaterialToPalette(
  mat: DuckMaterial,
  slots: readonly SnapPaletteSlot[],
  idx: ReturnType<typeof buildSlotIndex>,
): boolean | undefined {
  if (!mat.color) return undefined;
  if (mat.map || mat.vertexColors) return false;

  const emissive =
    mat.emissive && (mat.emissiveIntensity ?? 1) > 0
      ? ([
          mat.emissive.r * (mat.emissiveIntensity ?? 1),
          mat.emissive.g * (mat.emissiveIntensity ?? 1),
          mat.emissive.b * (mat.emissiveIntensity ?? 1),
        ] as Vec3)
      : undefined;
  const slotI = chooseSlot(idx, {
    baseLinear: [mat.color.r, mat.color.g, mat.color.b],
    ...(emissive ? { emissiveLinear: emissive } : {}),
    transparent: mat.transparent === true || (mat.opacity !== undefined && mat.opacity < 0.98),
  });
  if (slotI === undefined) return false;

  const slot = slots[slotI]!;
  const kind = slot.kind ?? 'opaque';
  const rgb = hexToLinearRgb(slot.color);
  setLinearColor(mat.color, rgb);
  if (mat.metalness !== undefined) mat.metalness = slot.metalness ?? 0;
  if (mat.roughness !== undefined)
    mat.roughness = slot.roughness ?? (kind === 'glass' ? 0.1 : 0.85);

  if (kind === 'glass') {
    mat.transparent = true;
    mat.opacity = slot.opacity ?? 0.4;
  } else {
    if (mat.transparent !== undefined) mat.transparent = false;
    if (mat.opacity !== undefined) mat.opacity = 1;
  }

  if (mat.emissive) {
    if (kind === 'glow') {
      setLinearColor(mat.emissive, rgb);
      mat.emissiveIntensity = Math.max(mat.emissiveIntensity ?? 1, 1);
    } else {
      setLinearColor(mat.emissive, [0, 0, 0]);
      if (mat.emissiveIntensity !== undefined) mat.emissiveIntensity = 0;
    }
  }
  return true;
}

/** Snap flat-color scene materials to a palette before CPU preview rasterization. */
export function snapSceneToPalette(
  root: unknown,
  slots: readonly SnapPaletteSlot[],
): ScenePaletteSnapResult {
  if (slots.length === 0) return { snapped: 0, skipped: 0 };
  const traverse = (root as DuckObject3D | undefined)?.traverse;
  if (!traverse) return { snapped: 0, skipped: 0 };

  const idx = buildSlotIndex(slots);
  let snapped = 0;
  let skipped = 0;
  traverse.call(root, (obj: DuckMesh) => {
    if (!obj.isMesh || !obj.material) return;
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of materials) {
      const didSnap = snapMaterialToPalette(mat, slots, idx);
      if (didSnap === true) snapped++;
      else if (didSnap === false) skipped++;
    }
  });
  return { snapped, skipped };
}

export interface ViewGridResult {
  png: Buffer;
  width: number;
  height: number;
  /** View names in grid order (row-major). */
  views: string[];
}

export interface ViewGridOptions extends RasterOptions {
  views?: ViewSpec[];
  /** Snap flat-color materials before rasterization. Mutates the provided scene root. */
  snapPalette?: readonly SnapPaletteSlot[];
}

// H-30: kiln-frame axis gnomon colors (+X fwd red, +Y up green, +Z right blue).
const GNOMON_AXES: Array<{
  label: string;
  axis: [number, number, number];
  color: [number, number, number];
}> = [
  { label: 'X', axis: [1, 0, 0], color: [235, 80, 70] },
  { label: 'Y', axis: [0, 1, 0], color: [90, 205, 90] },
  { label: 'Z', axis: [0, 0, 1], color: [90, 145, 245] },
];

/**
 * Stamp a small world-axis gnomon into a rasterized cell (bottom-left corner),
 * using the SAME camera basis as rasterizeView so the arrows are exact
 * (3DAxisPrompt: ticked/annotated axes measurably improve VLM 3D localization).
 * Axes nearly perpendicular to the image plane (projected length < 0.25) are
 * skipped — only in-plane axes disambiguate a view.
 */
export function stampAxisGnomon(rgb: Uint8Array, size: number, viewDir: readonly number[]): void {
  // rasterizeView's basis, duplicated deliberately (raster.ts keeps it private).
  const zl = Math.hypot(viewDir[0]!, viewDir[1]!, viewDir[2]!) || 1;
  const z = [viewDir[0]! / zl, viewDir[1]! / zl, viewDir[2]! / zl] as const;
  const up = Math.abs(z[1]) > 0.99 ? ([0, 0, -1] as const) : ([0, 1, 0] as const);
  const cx = [
    up[1] * z[2] - up[2] * z[1],
    up[2] * z[0] - up[0] * z[2],
    up[0] * z[1] - up[1] * z[0],
  ];
  const xl = Math.hypot(cx[0]!, cx[1]!, cx[2]!) || 1;
  const bx = [cx[0]! / xl, cx[1]! / xl, cx[2]! / xl] as const;
  const by = [
    z[1] * bx[2] - z[2] * bx[1],
    z[2] * bx[0] - z[0] * bx[2],
    z[0] * bx[1] - z[1] * bx[0],
  ] as const;

  const len = Math.max(12, Math.round(size * 0.055));
  // Inset the origin by the arrow length so leftward/downward projections
  // (e.g. +Z in the Front view) aren't clipped at the cell edge.
  const ox = len + 10;
  const oy = size - len - 10;
  for (const { label, axis, color } of GNOMON_AXES) {
    const dx = axis[0] * bx[0] + axis[1] * bx[1] + axis[2] * bx[2];
    const dy = axis[0] * by[0] + axis[1] * by[1] + axis[2] * by[2];
    if (Math.hypot(dx, dy) < 0.25) continue;
    const ex = ox + dx * len;
    const ey = oy - dy * len; // screen y is flipped vs the camera's up
    const steps = Math.ceil(Math.hypot(ex - ox, ey - oy));
    for (let s = 0; s <= steps; s++) {
      const px = Math.round(ox + ((ex - ox) * s) / steps);
      const py = Math.round(oy + ((ey - oy) * s) / steps);
      for (let ty = 0; ty < 2; ty++) {
        for (let tx = 0; tx < 2; tx++) {
          const x = px + tx;
          const y = py + ty;
          if (x < 0 || y < 0 || x >= size || y >= size) continue;
          const p = (y * size + x) * 3;
          rgb[p] = color[0];
          rgb[p + 1] = color[1];
          rgb[p + 2] = color[2];
        }
      }
    }
    stampLabel(rgb, size, size, Math.round(ex) + 2, Math.round(ey) - 6, label, 1);
  }
}

/** Render a (possibly sandbox-created) Three.js scene root into the 3x2 grid. */
export async function renderViewGrid(
  root: unknown,
  opts: ViewGridOptions = {},
): Promise<ViewGridResult> {
  // H-31: 384px cells (was 256). Measured input-image cost of the full grid:
  // Anthropic ~w*h/750 tokens => 1168x780 ≈ 1,215 tok (vs 784x524 ≈ 548) —
  // negligible against 32-64K reasoning budgets; 512 would double it again for
  // marginal legibility gain at typical asset scales. Candidate thumbnails
  // downscale separately (Studio thumbnailFor), unaffected.
  const size = opts.size ?? 384;
  const views = opts.views ?? SIX_VIEWS;
  if (opts.snapPalette?.length) snapSceneToPalette(root, opts.snapPalette);
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

  const labelScale = Math.max(2, Math.round(size / 96));
  for (let vi = 0; vi < views.length; vi++) {
    const cell = rasterizeView(root, views[vi]!.dir, { size, backfaceCull: opts.backfaceCull });
    // H-30: stamp the view name + axis gnomon into the cell (small, corner-
    // anchored, away from the centered silhouette — SeeAct caveat).
    stampLabel(cell, size, size, labelScale, labelScale, views[vi]!.name, labelScale);
    stampAxisGnomon(cell, size, views[vi]!.dir);
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
  opts: ViewGridOptions = {},
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
  const key = (name ?? 'right')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');
  return (
    ANIM_CAMERAS[key] ?? ANIM_CAMERAS[ANIM_CAMERA_ALIASES[key] ?? ''] ?? ANIM_CAMERAS['right']!
  );
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
    return {
      ok: false,
      frames: 0,
      frameTimes: [],
      error: 'this asset has no animation clips',
      availableClips: [],
    };
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

// =============================================================================
// Interior views — see INSIDE an enterable building, roof off (kiln_view_interior)
// =============================================================================

export interface InteriorGridResult extends ViewGridResult {
  /** Roof subtree roots hidden (0 → the roof part was not named like nodeName). */
  roofsHidden: number;
  /** Near-wall subtree roots hidden for the eye-level cutaway (0 → not a room()). */
  wallsHidden: number;
}

export interface InteriorGridOptions extends RasterOptions {
  /** Name of the roof part to lift. Default 'Roof'. */
  nodeName?: string;
}

/** Outward face normals of room() walls, by lowercased name suffix (front faces +X). */
const ROOM_WALL_NORMALS: Array<{ suffix: string; n: [number, number, number] }> = [
  { suffix: 'wallfront', n: [1, 0, 0] },
  { suffix: 'wallback', n: [-1, 0, 0] },
  { suffix: 'wallleft', n: [0, 0, -1] },
  { suffix: 'wallright', n: [0, 0, 1] },
];

const INTERIOR_VIEWS: ViewSpec[] = [
  { name: 'Floor plan', dir: [0, 1, 0.0001] }, // top-down, roof off
  { name: 'Dollhouse', dir: [0.7, 0.5, 0.7] }, // 3/4 cutaway, roof off
  { name: 'Eye-level', dir: [0.55, 0.35, 0.45] }, // low angle, roof + near walls off
];

function normalizeVec(v: [number, number, number]): [number, number, number] {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}
function dotVec(a: [number, number, number], b: [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * Render an enterable building with its roof — and, for the eye-level cell, the
 * near walls — hidden, so the agent can SEE the interior the six exterior views
 * cannot. Three roof-off cells in one row: Floor plan (top-down, layout +
 * walkability), Dollhouse (3/4 cutaway, fixtures sit on the floor), Eye-level
 * (low angle through the doorway with the camera-facing walls removed, so the
 * doorway reads as a real gap and nothing is buried inside a solid mass).
 *
 * MUTATES `root` (callers pass a freshly executed scene — the tool re-executes
 * per call). Interior faces point AWAY from the camera once the lid/near walls
 * are off, so backface culling is OFF for every cell (the exterior grid keeps it
 * ON to reveal winding bugs).
 */
export async function renderInteriorGrid(
  root: unknown,
  opts: InteriorGridOptions = {},
): Promise<InteriorGridResult> {
  const size = opts.size ?? 256;
  const labelScale = Math.max(2, Math.round(size / 80));

  // Lift the roof once — persists for every cell. Explicit nodeName remains an
  // opt-in compatibility override; ordinary architecture views are semantic
  // first with a narrow historical-name fallback.
  const roofsHidden = opts.nodeName
    ? hideNodeInScene(root, opts.nodeName)
    : hideArchitectureRoofInScene(root).nodes.length;

  let wallsHidden = 0;
  const cells: Uint8Array[] = [];
  for (const view of INTERIOR_VIEWS) {
    if (view.name === 'Eye-level') {
      // Cutaway: also remove the walls facing the camera so the eye looks past
      // them onto the far wall + floor. room() names walls `<root>_Wall<Side>`.
      const d = normalizeVec(view.dir);
      wallsHidden = hideNodeInScene(root, (name) => {
        const lower = name.toLowerCase();
        for (const w of ROOM_WALL_NORMALS) {
          if (lower.endsWith(w.suffix) && dotVec(w.n, d) > 0.2) return true;
        }
        return false;
      });
    }
    const cell = rasterizeView(root, view.dir, { size, backfaceCull: false });
    stampLabel(cell, size, size, labelScale, labelScale, view.name, labelScale);
    cells.push(cell);
  }

  // Single-row grid (reuse the six-view PAD/PAD_COLOR layout).
  const cols = INTERIOR_VIEWS.length;
  const width = cols * size + (cols + 1) * PAD;
  const height = size + 2 * PAD;
  const grid = new Uint8Array(width * height * 3);
  for (let p = 0; p < width * height; p++) {
    grid[p * 3] = PAD_COLOR[0];
    grid[p * 3 + 1] = PAD_COLOR[1];
    grid[p * 3 + 2] = PAD_COLOR[2];
  }
  for (let i = 0; i < cells.length; i++) {
    const x0 = PAD + i * (size + PAD);
    const y0 = PAD;
    for (let y = 0; y < size; y++) {
      const src = y * size * 3;
      const dst = ((y0 + y) * width + x0) * 3;
      grid.set(cells[i]!.subarray(src, src + size * 3), dst);
    }
  }

  return {
    png: encodePng(grid, width, height),
    width,
    height,
    views: INTERIOR_VIEWS.map((v) => v.name),
    roofsHidden,
    wallsHidden,
  };
}
