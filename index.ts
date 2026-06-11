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
import { generateKilnCode, resolveCodegenMode } from './generate';

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
  renderApiSection,
  renderPrimitivesMarkdown,
  renderSkillQuickReference,
} from './prompt-api';
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
  capsuleXGeo,
  capsuleZGeo,
  cylinderGeo,
  cylinderXGeo,
  cylinderZGeo,
  cylinderOnAxis,
  boxGeo,
  sphereGeo,
  coneGeo,
  coneXGeo,
  coneZGeo,
  taperConeGeo,
  torusGeo,
  planeGeo,
  wingGeo,
  createWingPair,
  beamBetween,
  createLadder,
  snapTo,
  foliageCardGeo,
  crossedQuadsGeo,
  octaGridPlane,
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
  cloneGeometry,
  cloneMaterial,
  createInstance,
} from './primitives';
export type { TrackInterpolation } from './primitives';
export { boolUnion, boolDiff, boolIntersect, hull } from './solids';
export {
  arrayLinear,
  arrayRadial,
  mirror,
  subdivide,
  mergeVertices,
  curveToMesh,
  pipeAlongPath,
  lathe,
  revolveGeo,
  bezierCurve,
} from './ops';
export { autoUnwrap } from './uv';
export type { AutoUnwrapOptions } from './uv';
export { boxUnwrap, cylinderUnwrap, planeUnwrap } from './uv-shapes';
export { gearGeo, bladeGeo } from './gears';
export type { GearOptions, BladeOptions } from './gears';
export { loadTexture, pbrMaterial } from './textures';
export type { PbrMaterialOptions, TextureSource, EncodedTextureData } from './textures';

// -----------------------------------------------------------------------------
// Shared tool registry (kiln/tools) — Kiln Bench capability surface
// -----------------------------------------------------------------------------
export { kilnToolRegistry } from './tools/registry';
export type { KilnToolDef, KilnRenderMetrics } from './tools/registry';

// -----------------------------------------------------------------------------
// LOD chain generator (kiln/lod)
// -----------------------------------------------------------------------------
// Note: `countTriangles` is intentionally NOT re-exported from the kiln
// namespace — primitives.ts already exports a THREE.Object3D variant under
// the same name. Reach into `./lod/generate` if you need the Document variant.
export { generateLODChain } from './lod';
export type {
  GenerateLODChainOptions,
  GenerateLODChainResult,
  LODLevel,
} from './lod';

// -----------------------------------------------------------------------------
// Sprite atlas packer (kiln/sprite-atlas)
// -----------------------------------------------------------------------------
export { packSpriteAtlas } from './sprite-atlas';
export type {
  PackSpriteAtlasInput,
  PackSpriteAtlasOptions,
  PackSpriteAtlasResult,
  SpriteFrame,
  SpriteFrameTable,
} from './sprite-atlas';
export {
  SPRITE_ATLAS_SCHEMA_VERSION,
  SpriteFrameSchema,
  SpriteFrameTableSchema,
} from './sprite-atlas';

// -----------------------------------------------------------------------------
// FBX ingest (kiln/fbx-ingest)
// -----------------------------------------------------------------------------
export { ingestFbx, openFbxIngestSession } from './fbx-ingest';
export type { IngestFbxOptions, IngestFbxResult, IngestFbxSession } from './fbx-ingest';

// -----------------------------------------------------------------------------
// Character retex (kiln/retex)
// -----------------------------------------------------------------------------
export { retexCharacter, FACTION_PRESETS } from './retex';
export type { RetexCharacterOptions, RetexCharacterResult, FactionPreset } from './retex';

// -----------------------------------------------------------------------------
// Photogrammetry cleanup (kiln/photogrammetry)
// -----------------------------------------------------------------------------
export { cleanupPhotogrammetry } from './photogrammetry';
export type {
  CleanupPhotogrammetryOptions,
  CleanupPhotogrammetryResult,
} from './photogrammetry';

// -----------------------------------------------------------------------------
// Imposter baker (kiln/imposter)
// -----------------------------------------------------------------------------
export { bakeImposter, openImposterSession } from './imposter';
export type {
  BakeImposterOptions,
  BakeImposterResult,
  ImposterSession,
  OpenImposterSessionOptions,
  ImposterValidationIssue,
  ImposterValidationResult,
  ImposterMeta,
  ImposterAngleCount,
  ImposterAxis,
  LatLonImposterAxis,
  ImposterLayout,
  ImposterAuxLayer,
  ImposterBgColor,
  ImposterColorLayer,
  ImposterNormalSpace,
  ImposterTextureColorSpace,
  AnimatedClipTarget,
  AnimatedImposterMeta,
  AnimatedImposterPreBakeConfig,
  AnimatedImposterPreBakeInput,
  AnimatedImposterPreBakeReport,
  AnimatedImposterRuntimeAttribute,
  AnimatedImposterStorageEstimate,
  AnimatedImposterTextureFormat,
  AnimatedImposterTextureLayout,
  AnimatedImposterTextureMode,
  AnimatedImposterWarning,
  AnimatedImposterSession,
  AnimatedTileCamera,
  BakeAnimatedImposterOptions,
  BakeAnimatedImposterResult,
  AtlasProfileLimits,
  AtlasProfileMetaInput,
  AtlasProfileName,
  AtlasProfileValidationResult,
  AtlasProfileViolation,
  AtlasProfileViolationField,
  NpcCharacterPackFactionMetrics,
  NpcCharacterPackIssue,
  NpcCharacterPackManifest,
  NpcCharacterPackOutputMetrics,
  NpcCharacterPackValidationReport,
  ValidateImposterOptions,
  ValidateNpcCharacterPackOptions,
} from './imposter';
export {
  ANIMATED_IMPOSTER_DEFAULT_ENVELOPE_BYTES,
  ANIMATED_IMPOSTER_KIND,
  ANIMATED_IMPOSTER_SCHEMA_VERSION,
  AnimatedClipTargetSchema,
  AnimatedImposterMetaSchema,
  AnimatedImposterPreBakeInputSchema,
  AnimatedImposterRuntimeAttributeSchema,
  AnimatedImposterTextureFormatSchema,
  AnimatedImposterTextureLayoutSchema,
  AnimatedImposterTextureModeSchema,
  AnimatedImposterWarningSchema,
  ATLAS_PROFILES,
  ATLAS_PROFILE_NAMES,
  ImposterMetaSchema,
  IMPOSTER_LEGACY_SCHEMA_VERSION,
  IMPOSTER_SCHEMA_VERSION,
  dirFromAzEl,
  enumerateOctahedralTiles,
  enumerateTiles,
  estimateAnimatedImposterStorage,
  isAtlasProfileName,
  octaDecode,
  octaEncode,
  resolveLayout,
  validateAgainstAtlasProfile,
  validateAnimatedImposterPreBake,
  validateImposterSidecar,
  bakeAnimatedImposter,
  enumerateOctahedralGrid,
  openAnimatedImposterSession,
  NpcCharacterPackManifestSchema,
  validateNpcCharacterPack,
} from './imposter';

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
   * Abort milliseconds for the underlying single-shot SDK query. Defaults to
   * 720_000 (12 min). Ignored by the default 'agent' path (the tool loop manages
   * its own timeouts).
   */
  timeoutMs?: number;
  /**
   * Override the code model. In the default 'agent' path this is a Strands model
   * id (e.g. 'google:gemini-3.5-flash', 'anthropic:claude-opus-4-8'); in the
   * 'single-shot' fallback it is the Claude/harness model id.
   */
  model?: string;
  /**
   * Codegen mechanism. 'agent' (default) drives the Strands tool loop
   * (list -> validate -> render -> submit, Gemini 3.5 Flash default, self-
   * correcting on render metrics); 'single-shot' uses the legacy emit-and-render
   * path. Falls back to the `KILN_CODEGEN` env var, then 'agent'.
   */
  codegen?: 'agent' | 'single-shot';
  /**
   * Also rasterize the final asset into the six-view grid PNG (`output.views`)
   * for sidecars / review UIs. Best-effort; agent codegen path only.
   */
  captureViews?: boolean;
  /** Style anchor: a complete Kiln program rendered as "## Reference Asset"
   *  (fresh generation only). ~5-15k input tokens/run; mostly prompt-cached. */
  exemplarCode?: string;
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
  /** Resolved Strands provider (agent path only) - for honest provenance. */
  provider?: string;
  /** Resolved concrete model id (agent path only) - for honest provenance. */
  model?: string;
  /** Tools the agent called, in order (agent path only). */
  toolCalls?: string[];
  /** Number of agent-loop iterations (agent path only). */
  steps?: number;
  /** Six-view grid PNG (only when `captureViews` was set; agent path only). */
  views?: Buffer;
}


/**
 * End-to-end Kiln generation: prompt -> code -> rendered GLB.
 *
 * Default path is the Strands agent tool loop (Gemini 3.5 Flash); set
 * `codegen: 'single-shot'` or `KILN_CODEGEN=single-shot` for the legacy
 * emit-and-render fallback. Throws on any hard failure (LLM error, invalid code,
 * render failure); non-fatal issues surface via `warnings`.
 */
export async function generate(
  prompt: string,
  opts: KilnGenerateOptions = {}
): Promise<KilnGenerateOutput> {
  const category = opts.category ?? 'prop';

  // Default: the Strands agent tool loop. Imported lazily so @strands-agents/sdk
  // never enters the non-agent core module graph (browser/editor bundle safety).
  if (resolveCodegenMode(opts.codegen) === 'agent') {
    const { generateKilnAsset } = await import('./agent/generate');
    const r = await generateKilnAsset({
      prompt,
      category,
      includeAnimation: opts.includeAnimation ?? true,
      ...(opts.style ? { style: opts.style } : {}),
      ...(opts.model ? { model: opts.model } : {}),
      ...(opts.captureViews ? { captureViews: true } : {}),
      ...(opts.exemplarCode ? { exemplarCode: opts.exemplarCode } : {}),
    });
    return {
      code: r.code,
      glb: r.glb,
      meta: r.meta,
      warnings: r.warnings,
      provider: r.provider,
      model: r.model,
      toolCalls: r.toolCalls,
      steps: r.steps,
      ...(r.views ? { views: r.views } : {}),
    };
  }

  // Fallback (KILN_CODEGEN=single-shot): legacy emit-and-render.
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
