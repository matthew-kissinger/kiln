/**
 * Kiln Tool Registry — shared capability surface for agents.
 *
 * Four model-facing tools (list, validate, render, screenshot), each a thin
 * wrapper over the existing kiln core functions. This registry is the single
 * source of truth for both the in-process-tool capability skin and the MCP
 * capability skin in the Kiln Bench spike: both adapters iterate
 * `kilnToolRegistry` so the tool names, descriptions, and behavior stay
 * identical across mechanisms.
 *
 * A fifth def, `kilnRenderViewsDef`, collapses render + screenshot into one
 * "see it" tool (metrics + six-view image from a single execution). It is
 * exported separately and deliberately NOT added to `kilnToolRegistry` — the
 * unified tool surface (KILN_TOOL_SURFACE='unified') consumes it, while the
 * bench baseline keeps iterating the unchanged four.
 *
 * Pure metrics only — `kiln_render` never writes files and never throws.
 */

import { z } from 'zod';
import * as THREE from 'three';

import { validate } from '../validation';
import { executeKilnCode, inspectSceneStructure, renderSceneToGLB } from '../render';
import { listPrimitives, type PrimitiveSpec } from '../list-primitives';

// =============================================================================
// Tool definition contract
// =============================================================================

export interface KilnToolDef {
  /** Stable tool name exposed to the model (in-process and over MCP). */
  name: string;
  /** Model-facing description, consistent with the kiln-glb SKILL.md language. */
  description: string;
  /** Zod schema for the tool input. */
  inputSchema: z.ZodType;
  /** Execute the tool. Returns JSON-serializable output. */
  run(input: unknown): Promise<unknown>;
  /**
   * Extract media from a `run()` output, for transports that can show the
   * model images (Strands ImageBlock tool results, MCP image content). Returns
   * the PNG bytes plus the JSON payload to send alongside them (the output
   * with any embedded base64 stripped, so the image is never double-encoded).
   * Transports without image support just use the raw `run()` output.
   */
  media?(output: unknown): { png: Uint8Array; json: unknown } | undefined;
  /**
   * Like {@link media} but for tools that return MULTIPLE images in one result
   * (kiln_screenshot_animation in perFrame mode → N frame PNGs). Transports that
   * support image arrays attach all PNGs as separate blocks; those that don't fall
   * back to {@link media} (a composite) or the raw output. Checked before `media`.
   */
  mediaMulti?(output: unknown): { pngs: Uint8Array[]; json: unknown } | undefined;
}

// =============================================================================
// Schemas
// =============================================================================

const listPrimitivesInput = z.object({
  category: z
    .string()
    .optional()
    .describe(
      'Optional category filter: geometry, material, structure, animation, utility, instancing, csg, arrays, mesh-ops, curves, uv, textures.',
    ),
});

const validateInput = z.object({
  code: z.string().describe('Kiln source code (defines `meta` + `build()`, optional `animate()`).'),
});

const renderInput = z.object({
  code: z.string().describe('Kiln source code to execute and render to an in-memory GLB.'),
});

const screenshotInput = z.object({
  code: z.string().describe('Kiln source code to execute and render to a six-view image grid.'),
});

const screenshotAnimationInput = z.object({
  code: z
    .string()
    .describe('Kiln source code to execute; must define animate() returning the named clip.'),
  clip: z
    .string()
    .describe(
      'The animation clip to view, by name (e.g. "walk", "attack"). Must be one your animate() returns.',
    ),
  camera: z
    .string()
    .optional()
    .describe(
      'Camera angle: right (default — side profile, best for leg swing + knee bend direction), front ' +
        '(reveals sideways/lateral motion), back, left, top, or three-quarter.',
    ),
  perFrame: z
    .boolean()
    .optional()
    .describe(
      'Return the frames as separate high-res images instead of one composite grid. Default false.',
    ),
});

const viewInteriorInput = z.object({
  code: z.string().describe('Kiln source code to execute and render with the roof hidden.'),
  nodeName: z
    .string()
    .optional()
    .describe(
      'The roof part to lift, by name (default "Roof"). Matches that node and its children.',
    ),
});

// =============================================================================
// kiln_list_primitives
// =============================================================================

function runListPrimitives(input: z.infer<typeof listPrimitivesInput>): {
  primitives: PrimitiveSpec[];
  text: string;
} {
  const all = listPrimitives();
  const category = input.category?.trim().toLowerCase();
  const primitives = category ? all.filter((p) => p.category.toLowerCase() === category) : all;

  const text = primitives
    .map((p) => `${p.signature} -> ${p.returns}\n  ${p.description}\n  e.g. ${p.example}`)
    .join('\n\n');

  return { primitives, text };
}

// =============================================================================
// kiln_validate
// =============================================================================

/** Cheaply extract the declared category from the code's `meta` block so the
 *  tri advisory has a reference point. The model writes `category` into meta, so
 *  this reaches every door (CLI/MCP/studio) without threading external context. */
function extractCategory(code: string): string | undefined {
  const m = /category\s*:\s*['"]([^'"]+)['"]/.exec(code);
  return m?.[1];
}

function runValidate(input: z.infer<typeof validateInput>): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const category = extractCategory(input.code);
  const result = validate(input.code, category ? { category } : {});
  return {
    valid: result.valid,
    errors: result.errors,
    warnings: result.warnings.map((w) => (w.fixHint ? `${w.message} (${w.fixHint})` : w.message)),
  };
}

// =============================================================================
// kiln_render
// =============================================================================

export interface KilnRenderMetrics {
  ok: boolean;
  tris?: number;
  meshes?: number;
  materials?: number;
  bbox?: { min: number[]; max: number[]; size: number[] };
  /** Mesh touching the lowest world point — ground-contact attribution. When
   *  bbox.min[1] dips below 0, this names the buried part so the agent can
   *  judge intent (earthworks/keels are fine; wheels/tails/missiles are not). */
  lowestPart?: { name: string; y: number };
  /** Post-dedup instanceability grade (informational): how cheap to render at scale. */
  instanceability?: { grade: string; summary: string };
  warnings: string[];
  error?: string;
}

/** Traversal-derived geometry metrics shared by `runRender` and `runRenderViews`. */
interface SceneMetrics {
  meshes: number;
  materials: number;
  bbox?: KilnRenderMetrics['bbox'];
  lowestPart?: KilnRenderMetrics['lowestPart'];
}

/**
 * Walk a (sandbox-created) scene root and collect mesh/material counts, the
 * world-space bounding box, and the lowest-touching mesh. Read-only — safe to
 * call alongside `renderSceneToGLB` / `renderViewGrid` on the same root.
 *
 * Mesh + material detection uses duck-typing (`.isMesh`): the sandbox THREE is
 * a different module realm than this module's THREE, so `instanceof` would
 * always be false across that boundary.
 */
function collectSceneMetrics(root: THREE.Object3D): SceneMetrics {
  let meshes = 0;
  const materialSet = new Set<unknown>();
  let lowestPart: SceneMetrics['lowestPart'];
  root.traverse((node: THREE.Object3D) => {
    const n = node as { isMesh?: boolean; material?: unknown };
    if (n.isMesh) {
      meshes += 1;
      const mat = n.material;
      if (Array.isArray(mat)) {
        for (const m of mat) materialSet.add(m);
      } else if (mat) {
        materialSet.add(mat);
      }
      // Ground-contact attribution: which mesh touches the lowest point.
      const mb = new THREE.Box3().setFromObject(node);
      if (!mb.isEmpty() && (!lowestPart || mb.min.y < lowestPart.y)) {
        lowestPart = { name: node.name || '(unnamed mesh)', y: mb.min.y };
      }
    }
  });

  // World-space bounding box.
  const box = new THREE.Box3().setFromObject(root);
  let bbox: SceneMetrics['bbox'];
  if (!box.isEmpty()) {
    const size = new THREE.Vector3();
    box.getSize(size);
    bbox = {
      min: [box.min.x, box.min.y, box.min.z],
      max: [box.max.x, box.max.y, box.max.z],
      size: [size.x, size.y, size.z],
    };
  }

  return { meshes, materials: materialSet.size, bbox, lowestPart };
}

/**
 * Execute Kiln code, render it to an in-memory GLB, and report metrics.
 * Never writes files; never throws — failures come back as { ok:false, error }.
 */
async function runRender(input: z.infer<typeof renderInput>): Promise<KilnRenderMetrics> {
  try {
    const { meta, root, clips } = await executeKilnCode(input.code);

    // Structural advisories (floating parts / stray planes at origin).
    const structuralWarnings = inspectSceneStructure(root);
    const metrics = collectSceneMetrics(root);

    // Render to GLB bytes for the triangle count. Output is discarded — pure
    // metrics, no files written.
    const category = typeof meta.category === 'string' ? meta.category : undefined;
    const rendered = await renderSceneToGLB(root, { clips, category });

    const warnings = [...structuralWarnings, ...rendered.warnings];

    return {
      ok: true,
      tris: rendered.tris,
      meshes: metrics.meshes,
      materials: metrics.materials,
      bbox: metrics.bbox,
      lowestPart: metrics.lowestPart,
      ...(rendered.instanceability
        ? {
            instanceability: {
              grade: rendered.instanceability.grade,
              summary: rendered.instanceability.summary,
            },
          }
        : {}),
      warnings,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      warnings: [],
    };
  }
}

// =============================================================================
// kiln_screenshot
// =============================================================================

export interface KilnScreenshotResult {
  ok: boolean;
  /** View names in grid order (row-major): Front, Right, Back, Left, Top, 3/4. */
  views?: string[];
  width?: number;
  height?: number;
  /** The 3x2 grid PNG, base64-encoded (transports with image support strip this and attach the bytes). */
  pngBase64?: string;
  warnings: string[];
  error?: string;
}

/**
 * Execute Kiln code and rasterize it into the 3x2 six-view grid (pure CPU —
 * no browser, no GPU). Never throws — failures come back as { ok:false, error }.
 * The renderer is imported lazily so the views module (node:zlib) never enters
 * the browser bundle graph.
 */
async function runScreenshot(
  input: z.infer<typeof screenshotInput>,
): Promise<KilnScreenshotResult> {
  try {
    const { renderViewGrid } = await import('../views');
    const { root } = await executeKilnCode(input.code);
    const warnings = inspectSceneStructure(root);
    const grid = await renderViewGrid(root);
    return {
      ok: true,
      views: grid.views,
      width: grid.width,
      height: grid.height,
      pngBase64: grid.png.toString('base64'),
      warnings,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      warnings: [],
    };
  }
}

/** Shared media extractor for screenshot-shaped outputs (pngBase64 -> bytes + stripped JSON).
 *  Used by both `kiln_screenshot` and the unified `kilnRenderViewsDef` (both carry `pngBase64`). */
export function screenshotMedia(output: unknown): { png: Uint8Array; json: unknown } | undefined {
  const o = output as KilnScreenshotResult | undefined;
  if (!o || typeof o.pngBase64 !== 'string' || o.pngBase64.length === 0) return undefined;
  const { pngBase64: _png, ...json } = o;
  return { png: new Uint8Array(Buffer.from(o.pngBase64, 'base64')), json };
}

// =============================================================================
// kiln_render (unified) — collapsed render + screenshot
// =============================================================================

export interface KilnRenderViewsResult {
  ok: boolean;
  tris?: number;
  meshes?: number;
  materials?: number;
  bbox?: { min: number[]; max: number[]; size: number[] };
  lowestPart?: { name: string; y: number };
  /** Post-dedup instanceability grade (informational): how cheap to render at scale. */
  instanceability?: { grade: string; summary: string };
  /** View names in grid order (row-major): Front, Right, Back, Left, Top, 3/4. */
  views?: string[];
  gridWidth?: number;
  gridHeight?: number;
  /** The 3x2 grid PNG, base64-encoded (transports with image support strip this and attach the bytes). */
  pngBase64?: string;
  warnings: string[];
  error?: string;
}

/**
 * Collapsed "see it" tool for the unified surface: execute the code ONCE, then
 * report geometry metrics AND the six-view image grid together. A build error
 * throws before any image is produced, so failures come back image-free
 * ({ ok:false, error }, no `pngBase64`) — the model never gets a picture of a
 * model that did not build. Warnings mirror `runRender` exactly (structural +
 * render warnings) so this is a drop-in superset of `kiln_render` plus an image.
 * The views module is imported lazily (node:zlib) to keep it out of the browser
 * bundle graph.
 */
async function runRenderViews(input: z.infer<typeof renderInput>): Promise<KilnRenderViewsResult> {
  try {
    const { renderViewGrid } = await import('../views');
    const { meta, root, clips } = await executeKilnCode(input.code);

    const structuralWarnings = inspectSceneStructure(root);
    const metrics = collectSceneMetrics(root);

    // Single execution, two consumers — both read-only on `root`.
    const category = typeof meta.category === 'string' ? meta.category : undefined;
    const rendered = await renderSceneToGLB(root, { clips, category });
    const grid = await renderViewGrid(root);

    const warnings = [...structuralWarnings, ...rendered.warnings];

    return {
      ok: true,
      tris: rendered.tris,
      meshes: metrics.meshes,
      materials: metrics.materials,
      bbox: metrics.bbox,
      lowestPart: metrics.lowestPart,
      ...(rendered.instanceability
        ? {
            instanceability: {
              grade: rendered.instanceability.grade,
              summary: rendered.instanceability.summary,
            },
          }
        : {}),
      views: grid.views,
      gridWidth: grid.width,
      gridHeight: grid.height,
      pngBase64: grid.png.toString('base64'),
      warnings,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      warnings: [],
    };
  }
}

/**
 * The unified-surface render tool: render + screenshot collapsed into one.
 * Exported separately and intentionally NOT part of `kilnToolRegistry` (which
 * stays the four-tool bench baseline). Shares `screenshotMedia` so transports
 * with image support attach the PNG bytes and strip the base64 from the JSON.
 */
export const kilnRenderViewsDef: KilnToolDef = {
  name: 'kiln_render',
  description:
    'Execute the current model and SEE it: returns geometry metrics (triangle count, mesh + material counts, world-space bounding box, lowestPart — the mesh touching the lowest point, which must be intentional below Y=0 like earthworks or keels, never wheels/tails/equipment, and an instanceability grade A–F — informational, how cheap to render at scale) TOGETHER with a six-view image grid. ' +
    'Row 1 = Front (camera on +X, the nose/muzzle should face you), Right (+Z, the long profile), Back (-X); ' +
    'row 2 = Left (-Z), Top (+Y, check symmetry), 3/4 perspective (check part contact and overall read). ' +
    'Use it to confirm the model builds and to verify orientation (+X forward), attachment (no floating parts), proportion, and silhouette. ' +
    'If the build fails you get an error and NO image — fix the code and render again. Flat-shaded CPU render; writes no files.',
  inputSchema: renderInput,
  run: async (input) => runRenderViews(renderInput.parse(input)),
  media: screenshotMedia,
};

// =============================================================================
// kiln_screenshot_animation — SEE one clip's motion (6 phase-labeled frames)
// =============================================================================

export interface KilnScreenshotAnimationResult {
  ok: boolean;
  clip?: string;
  camera?: string;
  /** Frames rendered (6). */
  frames: number;
  /** Phase fraction (0..1) of each frame, in order. */
  frameTimes?: number[];
  duration?: number;
  /** Track targets that bind to no joint → the clip looks FROZEN. Fix the joint name. */
  unresolvedTracks?: string[];
  width?: number;
  height?: number;
  /** Composite 3x2 grid PNG, base64 (default; transports with image support strip + attach it). */
  pngBase64?: string;
  /** Per-frame PNGs, base64 (perFrame mode; image transports attach each separately). */
  framesBase64?: string[];
  /** Clip names available in the scene (set when the requested clip wasn't found). */
  availableClips?: string[];
  warnings: string[];
  error?: string;
}

/**
 * Execute Kiln code and rasterize ONE animation clip into a strip of six
 * evenly-sampled, phase-labeled frames from one camera (pure CPU). This is the
 * motion analogue of kiln_screenshot: it lets the agent SEE its animation and
 * catch defects invisible in a static pose — sideways walks, reverse-bending
 * knees, attacks that swing behind the body, and held items that don't track the
 * hand. Never throws — build/clip failures come back as { ok:false, error }.
 */
async function runScreenshotAnimation(
  input: z.infer<typeof screenshotAnimationInput>,
): Promise<KilnScreenshotAnimationResult> {
  try {
    const { renderClipAnimation } = await import('../views');
    const { root, clips } = await executeKilnCode(input.code);
    const warnings = inspectSceneStructure(root);
    const r = await renderClipAnimation(root, clips, {
      clip: input.clip,
      ...(input.camera ? { camera: input.camera } : {}),
      ...(input.perFrame ? { perFrame: true } : {}),
    });
    if (!r.ok) {
      return {
        ok: false,
        frames: 0,
        warnings,
        ...(r.error ? { error: r.error } : {}),
        ...(r.clip ? { clip: r.clip } : {}),
        ...(r.availableClips ? { availableClips: r.availableClips } : {}),
      };
    }
    const base: KilnScreenshotAnimationResult = {
      ok: true,
      frames: r.frames,
      warnings,
      ...(r.clip ? { clip: r.clip } : {}),
      ...(r.camera ? { camera: r.camera } : {}),
      ...(r.frameTimes ? { frameTimes: r.frameTimes } : {}),
      ...(r.duration != null ? { duration: r.duration } : {}),
      ...(r.unresolvedTracks ? { unresolvedTracks: r.unresolvedTracks } : {}),
      ...(r.width ? { width: r.width } : {}),
      ...(r.height ? { height: r.height } : {}),
    };
    if (r.pngs) return { ...base, framesBase64: r.pngs.map((p) => p.toString('base64')) };
    return { ...base, pngBase64: r.png!.toString('base64') };
  } catch (err) {
    return {
      ok: false,
      frames: 0,
      error: err instanceof Error ? err.message : String(err),
      warnings: [],
    };
  }
}

/** Media extractor for the composite-grid result (pngBase64 → bytes + stripped JSON). */
export function screenshotAnimationMedia(
  output: unknown,
): { png: Uint8Array; json: unknown } | undefined {
  const o = output as KilnScreenshotAnimationResult | undefined;
  if (!o || typeof o.pngBase64 !== 'string' || o.pngBase64.length === 0) return undefined;
  const { pngBase64: _png, framesBase64: _frames, ...json } = o;
  return { png: new Uint8Array(Buffer.from(o.pngBase64, 'base64')), json };
}

/** Media extractor for the perFrame result (framesBase64 → N bytes + stripped JSON). */
export function screenshotAnimationMediaMulti(
  output: unknown,
): { pngs: Uint8Array[]; json: unknown } | undefined {
  const o = output as KilnScreenshotAnimationResult | undefined;
  if (!o || !Array.isArray(o.framesBase64) || o.framesBase64.length === 0) return undefined;
  const { pngBase64: _png, framesBase64: _frames, ...json } = o;
  return { pngs: o.framesBase64.map((b) => new Uint8Array(Buffer.from(b, 'base64'))), json };
}

/**
 * The animation-feedback tool: render one clip's motion as a 6-frame strip.
 * Exported separately and intentionally NOT in `kilnToolRegistry` (the bench
 * baseline stays the unchanged four); the agent tool surfaces add it explicitly.
 * Carries both `media` (grid) and `mediaMulti` (perFrame) so image transports show
 * the right thing in either mode.
 */
export const kilnScreenshotAnimationDef: KilnToolDef = {
  name: 'kiln_screenshot_animation',
  description:
    'SEE one animation clip move: renders the named clip as six frames sampled evenly from start to end ' +
    '(each labeled with its phase %) from one camera, as a 3x2 grid. Use this after animating ANY asset to ' +
    'verify the MOTION — a static screenshot cannot show it — whether it is a character walking, a door or ' +
    'chest lid swinging on its hinge, a wheel/gear/turret/windmill turning on its axle, a lever or hatch ' +
    'throwing, or a flag/frond/branch swaying. Read the side (right) view and confirm each moving part ' +
    'travels the way it should about its OWN real pivot, and that the static base stays put. For a ' +
    'character specifically: a walk swings the legs forward and back (not splayed sideways and not sliding ' +
    'the body sideways), knees bend backward at the joint (not forward like a bird), an attack swings down ' +
    'and FORWARD through the front (not behind the back), and a held weapon tracks the hand through the ' +
    'swing. args: clip (required, the clip name), camera (default right; also front/back/left/top/' +
    'three-quarter), perFrame (optional, separate high-res frames). If unresolvedTracks comes back ' +
    'non-empty the clip targets joints that do not exist (a name mismatch) and looks frozen — fix the ' +
    'track names. Flat-shaded CPU render; writes no files.',
  inputSchema: screenshotAnimationInput,
  run: async (input) => runScreenshotAnimation(screenshotAnimationInput.parse(input)),
  media: screenshotAnimationMedia,
  mediaMulti: screenshotAnimationMediaMulti,
};

// =============================================================================
// kiln_view_interior (unified) — see INSIDE an enterable building, roof off
// =============================================================================

export interface KilnViewInteriorResult {
  ok: boolean;
  /** View names in grid order: Floor plan, Dollhouse, Eye-level. */
  views?: string[];
  gridWidth?: number;
  gridHeight?: number;
  /** Roof subtree roots hidden (0 → the roof part was not named "Roof"). */
  roofsHidden?: number;
  /** Near-wall subtree roots removed for the eye-level cutaway (0 → not a room()). */
  wallsHidden?: number;
  /** The single-row grid PNG, base64 (image transports strip this and attach the bytes). */
  pngBase64?: string;
  warnings: string[];
  error?: string;
}

/**
 * Render the asset with its roof hidden so the agent can SEE the interior the six
 * exterior views cannot (open/walkable floor, a doorway that is a real gap, fixtures
 * on the floor, nothing buried/sealed). Three roof-off cells: Floor plan, Dollhouse,
 * Eye-level. A build error comes back image-free ({ ok:false, error }). When the roof
 * could not be lifted (roofsHidden === 0) the interior stays occluded — a warning tells
 * the agent to name the roof part "Roof". Pure visual QA: does NOT run the structural
 * inspector (the agent already gets floating/stray warnings from kiln_render). The views
 * module is imported lazily to keep node:zlib out of the browser bundle graph.
 */
async function runViewInterior(
  input: z.infer<typeof viewInteriorInput>,
): Promise<KilnViewInteriorResult> {
  try {
    const { renderInteriorGrid } = await import('../views');
    const { root } = await executeKilnCode(input.code);
    const nodeName = input.nodeName ?? 'Roof';
    const grid = await renderInteriorGrid(root, { nodeName });
    const warnings: string[] = [];
    if (grid.roofsHidden === 0) {
      warnings.push(
        `No node named "${nodeName}" was found, so the roof could not be lifted and the interior is still occluded. Name the roof group exactly "${nodeName}".`,
      );
    }
    return {
      ok: true,
      views: grid.views,
      gridWidth: grid.width,
      gridHeight: grid.height,
      roofsHidden: grid.roofsHidden,
      wallsHidden: grid.wallsHidden,
      pngBase64: grid.png.toString('base64'),
      warnings,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      warnings: [],
    };
  }
}

/**
 * The unified-surface interior-QA tool. Exported separately and intentionally NOT
 * part of `kilnToolRegistry` (the four-tool bench baseline stays unchanged). Shares
 * `screenshotMedia` so image transports attach the PNG bytes and strip the base64.
 */
export const kilnViewInteriorDef: KilnToolDef = {
  name: 'kiln_view_interior',
  description:
    'SEE INSIDE an enterable building: renders it with the roof (the part named "Roof") lifted off, as a ' +
    'three-view grid. (1) Floor plan: top-down — check the interior is open and walkable and the footprint ' +
    'is right. (2) Dollhouse: a 3/4 cutaway — check built-in fixtures (hearth, counter, shelves) rest ON the ' +
    'floor, not floating or sunk, and the walls enclose a real volume with headroom. (3) Eye-level: a low ' +
    'angle looking in through the doorway with the near walls also removed — confirm the doorway is a REAL ' +
    'gap you could walk through (not a panel) and no wall or glass is buried inside a solid mass. ' +
    'Call this before finalizing any building. If roofsHidden comes back 0 the roof part was not named ' +
    '"Roof" (the interior stays hidden — rename it). Flat-shaded CPU render; writes no files.',
  inputSchema: viewInteriorInput,
  run: async (input) => runViewInterior(viewInteriorInput.parse(input)),
  media: screenshotMedia,
};

// =============================================================================
// Registry
// =============================================================================

export const kilnToolRegistry: KilnToolDef[] = [
  {
    name: 'kiln_list_primitives',
    description:
      'List the Kiln sandbox primitives available to generated 3D code: geometry helpers (boxGeo, cylinderXGeo, capsuleGeo, ...), materials (gameMaterial, glassMaterial, ...), structure (createRoot, createPart, createPivot), animation, CSG, arrays, UV, and textures. Call this before writing Kiln code to discover exact signatures and idiomatic usage. Optionally filter by category.',
    inputSchema: listPrimitivesInput,
    run: async (input) => runListPrimitives(listPrimitivesInput.parse(input)),
  },
  {
    name: 'kiln_validate',
    description:
      'Statically validate Kiln source code before rendering. Checks for the required `meta` const and `build()` function, `value:` keyframe typos, infinite loops, recursive build() calls, and syntax errors. Returns { valid, errors, warnings }. Warnings are advisory only (they never make code invalid), including a soft, generous triangle-count nudge. Run this to catch mistakes cheaply before kiln_render.',
    inputSchema: validateInput,
    run: async (input) => runValidate(validateInput.parse(input)),
  },
  {
    name: 'kiln_render',
    description:
      'Execute Kiln code and render it to an in-memory GLB, returning geometry metrics: triangle count, mesh count, material count, the world-space bounding box, lowestPart (the mesh touching the lowest point — anything below Y=0 must be intentionally below-grade like earthworks or keels, never wheels/tails/equipment), and an instanceability grade (A–F, informational: how cheap the asset is to render at scale — driven by distinct-material count; fewer shared materials grade higher). Includes structural warnings for floating parts and stray planes left at the origin. Use this to confirm a model builds and to inspect its size and structure. Does not write any files.',
    inputSchema: renderInput,
    run: async (input) => runRender(renderInput.parse(input)),
  },
  {
    name: 'kiln_screenshot',
    description:
      'Render Kiln code to a six-view image grid so you can SEE the asset: ' +
      'row 1 = Front (camera on +X, the nose/muzzle should face you), Right (+Z, the long profile), Back (-X); ' +
      'row 2 = Left (-Z), Top (+Y, check symmetry), 3/4 perspective (check part contact and overall read). ' +
      'Use it to verify orientation (+X forward), attachment (no floating parts), and silhouette before submitting. ' +
      'If a view looks wrong, fix the code and screenshot again. Flat-shaded CPU render; does not write files.',
    inputSchema: screenshotInput,
    run: async (input) => runScreenshot(screenshotInput.parse(input)),
    media: screenshotMedia,
  },
];
