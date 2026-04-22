/**
 * @pixel-forge/core - Kiln public API
 *
 * Headless Kiln pipeline: prompt -> Claude -> code -> GLB Buffer.
 *
 * This is the W1.1 spike surface. W2 will migrate the server and client to
 * consume these entry points (replacing the duplicate copies currently
 * living in packages/{client,shared,server}).
 */

import type { KilnCodeMeta } from './render';
import { renderGLB } from './render';
import { generateKilnCode } from './generate';

export { renderGLB, renderSceneToGLB, inspectGeneratedAnimation } from './render';
export {
  generateKilnCode,
  editKilnCode,
  compactCode,
  refactorCode,
  // Companion aliases on the namespace for agent ergonomics:
  editKilnCode as editCode,
  compactCode as compact,
  refactorCode as refactor,
} from './generate';
export type {
  RefactorRequest,
  KilnGenerateResult,
  KilnGenerateCallOptions,
} from './generate';
export { validate, validateKilnCode } from './validation';
export { inspect } from './inspect';
export type {
  InspectResult,
  InspectNamedPart,
  InspectAnimationTrack,
  InspectBoundingBox,
  Vec3Tuple,
} from './inspect';
export { listPrimitives } from './list-primitives';
export type { PrimitiveSpec } from './list-primitives';
export {
  buildUserPrompt,
  getSystemPrompt,
  STYLE_TEMPLATES,
  KILN_SYSTEM_PROMPT,
  KILN_TSL_SYSTEM_PROMPT,
  KILN_BOTH_SYSTEM_PROMPT,
  type KilnGenerateRequest,
  type RenderMode,
  type AssetCategory,
  type AssetStyle,
  type AssetBudget,
} from './prompt';
export type {
  KilnCodeMeta,
  RenderResult,
  RenderSceneResult,
  RenderSceneOptions,
  ExecutedKilnCode,
} from './render';
export { executeKilnCode } from './render';
export {
  buildSandboxGlobals,
  countTriangles,
  countMaterials,
  getJointNames,
  validateAsset,
  // Primitive re-exports so the editor can `import { createRoot, boxGeo, ... } from '@pixel-forge/core/kiln'`
  createRoot,
  createPivot,
  createPart,
  capsuleGeo,
  cylinderGeo,
  boxGeo,
  sphereGeo,
  coneGeo,
  torusGeo,
  planeGeo,
  gameMaterial,
  basicMaterial,
  glassMaterial,
  lambertMaterial,
  rotationTrack,
  positionTrack,
  scaleTrack,
  createClip,
  idleBreathing,
  bobbingAnimation,
  spinAnimation,
} from './primitives';

// =============================================================================
// Top-level `generate()` - the full pipeline: prompt -> code -> GLB
// =============================================================================

export interface KilnGenerateOptions {
  /** Spike supports glb only. Ignored if set otherwise. */
  mode?: 'glb';
  category?: 'character' | 'prop' | 'vfx' | 'environment';
  style?: 'low-poly' | 'stylized' | 'voxel' | 'detailed' | 'realistic';
  referenceImageUrl?: string;
  /**
   * Whether to ask the LLM to emit an animate() function. Defaults to true to
   * match the server's behavior.
   */
  includeAnimation?: boolean;
  /**
   * Abort milliseconds for the underlying SDK query. Defaults to 720_000
   * (12 min) to fit Opus variance on coordinate-heavy prompts.
   */
  timeoutMs?: number;
  /** Override the Claude model id used for generation. */
  model?: string;
}

export interface KilnGenerateOutput {
  /** The JS code the LLM produced. */
  code: string;
  /** Rendered GLB, ready to write to disk. */
  glb: Buffer;
  /** Extracted from the code's `const meta = {...}` block, plus `tris`. */
  meta: KilnCodeMeta;
  /** Non-fatal issues (e.g. animation target missing). */
  warnings: string[];
}

/**
 * End-to-end Kiln generation: call Claude, validate the code, render GLB.
 *
 * Throws on any hard failure (LLM error, invalid code, render failure).
 * Non-fatal issues surface via `warnings`.
 */
export async function generate(
  prompt: string,
  opts: KilnGenerateOptions = {}
): Promise<KilnGenerateOutput> {
  const category = opts.category ?? 'prop';

  const genResult = await generateKilnCode(
    {
      prompt,
      mode: 'glb',
      category,
      style: opts.style,
      includeAnimation: opts.includeAnimation ?? true,
      referenceImageUrl: opts.referenceImageUrl,
    },
    {
      timeoutMs: opts.timeoutMs,
      model: opts.model,
    }
  );

  if (!genResult.success || !genResult.code) {
    throw new Error(`Kiln code generation failed: ${genResult.error ?? 'unknown error'}`);
  }

  const render = await renderGLB(genResult.code);

  return {
    code: genResult.code,
    glb: render.glb,
    meta: render.meta,
    warnings: render.warnings,
  };
}
