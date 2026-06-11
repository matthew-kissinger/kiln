/**
 * Kiln Tool Registry — shared capability surface for agents.
 *
 * Three model-facing tools, each a thin wrapper over the existing kiln core
 * functions. This registry is the single source of truth for both the
 * in-process-tool capability skin and the MCP capability skin in the Kiln
 * Bench spike: both adapters iterate `kilnToolRegistry` so the tool names,
 * descriptions, and behavior stay identical across mechanisms.
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
}

// =============================================================================
// Schemas
// =============================================================================

const listPrimitivesInput = z.object({
  category: z
    .string()
    .optional()
    .describe(
      'Optional category filter: geometry, material, structure, animation, utility, instancing, csg, arrays, mesh-ops, curves, uv, textures.'
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

// =============================================================================
// kiln_list_primitives
// =============================================================================

function runListPrimitives(input: z.infer<typeof listPrimitivesInput>): {
  primitives: PrimitiveSpec[];
  text: string;
} {
  const all = listPrimitives();
  const category = input.category?.trim().toLowerCase();
  const primitives = category
    ? all.filter((p) => p.category.toLowerCase() === category)
    : all;

  const text = primitives
    .map((p) => `${p.signature} -> ${p.returns}\n  ${p.description}\n  e.g. ${p.example}`)
    .join('\n\n');

  return { primitives, text };
}

// =============================================================================
// kiln_validate
// =============================================================================

function runValidate(input: z.infer<typeof validateInput>): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const result = validate(input.code);
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
  warnings: string[];
  error?: string;
}

/**
 * Execute Kiln code, render it to an in-memory GLB, and report metrics.
 * Never writes files; never throws — failures come back as { ok:false, error }.
 */
async function runRender(input: z.infer<typeof renderInput>): Promise<KilnRenderMetrics> {
  try {
    const { root, clips } = await executeKilnCode(input.code);

    // Structural advisories (floating parts / stray planes at origin).
    const structuralWarnings = inspectSceneStructure(root);

    // Mesh + material counts via duck-typing (sandbox THREE is a different
    // realm than this module's THREE — `instanceof` would always be false).
    let meshes = 0;
    const materialSet = new Set<unknown>();
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
      }
    });

    // World-space bounding box.
    const box = new THREE.Box3().setFromObject(root);
    let bbox: KilnRenderMetrics['bbox'];
    if (!box.isEmpty()) {
      const size = new THREE.Vector3();
      box.getSize(size);
      bbox = {
        min: [box.min.x, box.min.y, box.min.z],
        max: [box.max.x, box.max.y, box.max.z],
        size: [size.x, size.y, size.z],
      };
    }

    // Render to GLB bytes for the triangle count. Output is discarded — pure
    // metrics, no files written.
    const rendered = await renderSceneToGLB(root, { clips });

    const warnings = [...structuralWarnings, ...rendered.warnings];

    return {
      ok: true,
      tris: rendered.tris,
      meshes,
      materials: materialSet.size,
      bbox,
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
async function runScreenshot(input: z.infer<typeof screenshotInput>): Promise<KilnScreenshotResult> {
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

/** Shared media extractor for screenshot-shaped outputs (pngBase64 -> bytes + stripped JSON). */
function screenshotMedia(output: unknown): { png: Uint8Array; json: unknown } | undefined {
  const o = output as KilnScreenshotResult | undefined;
  if (!o || typeof o.pngBase64 !== 'string' || o.pngBase64.length === 0) return undefined;
  const { pngBase64: _png, ...json } = o;
  return { png: new Uint8Array(Buffer.from(o.pngBase64, 'base64')), json };
}

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
      'Statically validate Kiln source code before rendering. Checks for the required `meta` const and `build()` function, `value:` keyframe typos, infinite loops, recursive build() calls, syntax errors, and triangle-budget advisories. Returns { valid, errors, warnings }. Run this to catch mistakes cheaply before kiln_render.',
    inputSchema: validateInput,
    run: async (input) => runValidate(validateInput.parse(input)),
  },
  {
    name: 'kiln_render',
    description:
      'Execute Kiln code and render it to an in-memory GLB, returning geometry metrics: triangle count, mesh count, material count, and the world-space bounding box. Includes structural warnings for floating parts and stray planes left at the origin. Use this to confirm a model builds and to inspect its size and structure. Does not write any files.',
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
