import {
  MemoryCaptureCache,
  createCachedRenderPort,
  type CaptureCache,
} from '../views/capture-cache';
/**
 * Shared tool definitions. The original four-tool registry remains the in-process
 * baseline. createKilnProgramToolRegistry exposes saved revisions, source reads,
 * edit-and-render, and the unified view tools used by the stdio server.
 */

import { z } from 'zod';
import { MemoryProgramStore, type ProgramStore } from '../program-store';
import { createKilnSourceDef, withProgramReferences } from './programs';
import { createKilnDiscoveryDef } from './discovery';
import { createCachedEvaluatorPort, MemoryBuildCache, type BuildCache } from '../build-cache';
import * as THREE from 'three';

import { validate } from '../validation';
import { inspectSceneStructure, renderSceneToGLB, type RenderResult } from '../render';
import { listPrimitives, type PrimitiveSpec } from '../list-primitives';
import type { AssetCategory, AssetIntentV1 } from '../contracts';
import type { AssetQaReportV1 } from '../qa';
import type {
  DerivativeReviewFidelityV1,
  DerivativeViewReceiptV1,
  PbrRenderPort,
  ViewFidelityReasonCode,
  ViewFidelityV1,
  ViewEvidenceHistoryV1,
} from '../composer/render-port';
import type { ViewGridResult } from '../views';
import type { EvaluatorExecutionProfileV1, EvaluatorPortV1 } from '../evaluator';
import { resolveEvaluatorPortV1 } from '../evaluator';
import { sceneNeedsPbrShading } from '../material-resources';
import { KilnDraftBuffer } from '../edit-buffer';
// `agent/diff` has no imports of its own -- it is pure string work -- so this
// does not put an agent-SDK edge into the `kiln/tools` graph.
import { unifiedDiff } from '../agent/diff';
import type { GenerationCallBudget } from '../agent/call-budget';
import {
  resolveViewRenderTimeoutMs,
  type ViewRenderTimeoutContextProvider,
  type ViewRenderTimeoutResolver,
} from '../agent/view-render-timeout';
import { ViewEvidenceHistoryStore } from '../views/evidence-history';
import type { TextureUsage } from '../textures';

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
  /**
   * Reshape a `run()` output for a text transport.
   *
   * The default MCP serialization is `JSON.stringify(output, null, 2)`, which is
   * right for a result whose fields the model needs to read individually. It is
   * wrong for a result that already contains a rendered human-readable form of
   * itself, because then the wire carries the same information twice.
   *
   * `kiln_list_primitives` is the case that forced this: it returns 92 entries
   * as a structured array (48 KB) AND as formatted text (36 KB), and pretty
   * printing the pair sent 90 KB for one call. Harnesses differ in how they cope
   * and one of them copes badly -- OpenCode truncates a result that large, spills
   * the full copy to a file, and hands the model a cut-off catalog plus the job
   * of reassembling it. A dispatched model spent twenty-two minutes grepping that
   * file and never wrote a program.
   *
   * In-process callers still get the structured array from `run()`; only the
   * wire representation changes.
   */
  text?(output: unknown): string | undefined;
}

/**
 * Host-owned context captured by tool closures. This object is never part of a
 * model-facing input schema, so generated source cannot select its own category
 * or QA profile. An intent, when present, is authoritative over the convenience
 * category field.
 */
export interface KilnToolContext {
  geometryPolicy?: import('../geometry-export').GeometryExportPolicy;
  localExecution?: import('../local-runtime').LocalExecution;
  evaluationControls?: () => import('../evaluator/protocol').EvaluatorPortCallControlsV1;
  captureLimits?: import('../views/capture-limits').CaptureLimits;
  captureCache?: CaptureCache;
  captureCacheIdentity?: string | (() => string | undefined | Promise<string | undefined>);
  cacheCaptures?: boolean;
  /** Disposable evaluated artifacts; source persistence is independently owned by programStore. */
  buildCache?: BuildCache;
  /** Host-declared engine/dependency identity for an injected evaluator. Omit to disable its reuse. */
  evaluatorCacheIdentity?: string | (() => string | undefined);
  /** The local host already wrapped its evaluator; avoid applying the cache twice. */
  evaluatorCacheManaged?: boolean;
  /** Public registries reuse compatible local builds by default. */
  cacheEvaluations?: boolean;
  /** Fail image requests rather than substitute CPU when GPU rendering is required. */
  viewRenderRequired?: boolean;
  /** Optional shared source store for the reference-based tool surface. */
  programStore?: ProgramStore;
  intent?: AssetIntentV1;
  category?: AssetCategory;
  /** Host-owned material acceptance contract. The model cannot weaken it through
   * generated source or tool input. Each required usage must be backed by an
   * exact baked procedural texture binding in the rendered GLB. */
  requiredProceduralTextureUsages?: readonly RequiredProceduralTextureUsage[];
  /**
   * Host-injected GPU renderer for the in-loop view grid. Absent by default, and
   * absent means every render stays on the CPU rasterizer — byte-identical to the
   * behavior before this existed.
   *
   * The engine never opens a socket itself (AGENTS.md): the host owns the HTTP
   * adapter, auth, and configuration, and {@link captureViewsViaPort} stays the
   * single owner of the deadline, PNG validation, grid composition, and the
   * never-throw CPU fallback. This field is the injection point, nothing more.
   */
  viewRenderPort?: PbrRenderPort;
  /**
   * Deadline for ONE in-loop port call. Deliberately separate from the deadline
   * the host uses for the post-loop artifact sheet, and expected to be far
   * shorter: nothing waits on the artifact sheet, whereas an in-loop render
   * blocks the agent mid-thought. A slow GPU must fall back to the CPU raster
   * quickly rather than stall the loop. Defaults to
   * {@link DEFAULT_INLOOP_VIEW_RENDER_TIMEOUT_MS}.
   */
  viewRenderTimeoutMs?: number;
  /** Dynamic host state sampled immediately before every port call. */
  viewRenderTimeoutContext?: ViewRenderTimeoutContextProvider;
  /** Host policy for deriving one deadline from warm-up/budget state. */
  viewRenderTimeoutResolver?: ViewRenderTimeoutResolver;
  /**
   * Host tally hook, called once per in-loop grid with whoever actually drew it.
   *
   * Reporting rides this callback rather than the tool's OUTPUT so the decision
   * stays invisible to the model's own reasoning, and rides neither the input
   * schema nor the description so the cached tool definition is untouched (the
   * program's schema/prompt-invalidation window is reserved — see the P6 rule).
   * Never throws into the render path: a host callback that throws is swallowed.
   */
  onViewsRendered?(event: InLoopViewRender): void;
  /**
   * Optional host-owned visual observer for authors that cannot consume image
   * input. When present, media-bearing tool results are sent here out of band
   * and the author receives only the returned structured observation plus the
   * ordinary JSON metrics. Raw pixels never enter the author transcript.
   *
   * The engine does not construct a model or network client. Studio owns the
   * observer model, prompt, schema validation, deadline, accounting, and retry
   * policy. A port failure degrades to an explicit unavailable marker rather
   * than leaking the image or failing the render tool.
   */
  renderObservationPort?: RenderObservationPort;
  /** Shared generation-global allowance, forwarded to the host observer port. */
  generationCallBudget?: GenerationCallBudget;
  /** Shared bounded hash-only evidence ledger for one agent/tool session. */
  viewEvidenceHistory?: ViewEvidenceHistoryStore;
  /** Host-owned generated-source execution boundary. Production selects
   * `evaluator-required`; trusted local/test callers may retain the explicit
   * compatibility profile. */
  evaluatorPort?: EvaluatorPortV1;
  evaluatorProfile?: EvaluatorExecutionProfileV1;
}

export type RequiredProceduralTextureUsage = Extract<
  TextureUsage,
  'albedo' | 'normal' | 'metallicRoughness' | 'emissive'
>;

export interface ProceduralTextureMaterialContract {
  required: RequiredProceduralTextureUsage[];
  present: RequiredProceduralTextureUsage[];
  missing: RequiredProceduralTextureUsage[];
}

function proceduralTextureMaterialContract(
  rendered: RenderResult,
  context: KilnToolContext,
): ProceduralTextureMaterialContract | undefined {
  const required = [...new Set(context.requiredProceduralTextureUsages ?? [])];
  if (required.length === 0) return undefined;
  const available = new Set(
    (rendered.bakedTextures ?? []).map((entry) => entry.usage as RequiredProceduralTextureUsage),
  );
  const present = required.filter((usage) => available.has(usage));
  const missing = required.filter((usage) => !available.has(usage));
  return { required, present, missing };
}

function missingProceduralTextureResult(
  rendered: RenderResult,
  context: KilnToolContext,
):
  | {
      ok: false;
      error: string;
      materialContract: ProceduralTextureMaterialContract;
      warnings: string[];
      qaReport?: AssetQaReportV1;
    }
  | undefined {
  const materialContract = proceduralTextureMaterialContract(rendered, context);
  if (!materialContract || materialContract.missing.length === 0) return undefined;
  const missing = materialContract.missing.join(', ');
  return {
    ok: false,
    error:
      `Material contract missing procedural texture usages: ${missing}. ` +
      'Create and bind each missing usage through pbrMaterial; derive a normal with ' +
      'normalMapFromHeight when appropriate, then render the corrected buffer again.',
    materialContract,
    warnings: [...rendered.warnings],
    ...(rendered.meta.qaReport ? { qaReport: rendered.meta.qaReport as AssetQaReportV1 } : {}),
  };
}

/** JSON-safe value accepted from a host visual observer. */
export type RenderObservationValue =
  | null
  | boolean
  | number
  | string
  | RenderObservationValue[]
  | { [key: string]: RenderObservationValue };

/** Evidence passed to a host visual observer, never to the author model. */
export interface RenderObservationInput {
  /** Model-facing tool that produced the evidence. */
  toolName: string;
  /** One grid PNG for ordinary render/inspect, or multiple animation frames. */
  pngs: readonly Uint8Array[];
  /** The same base64-free metrics JSON a direct-vision author would receive. */
  json: unknown;
  /** Trusted request intent, when the host supplied one. */
  intent?: AssetIntentV1;
  /**
   * Shared generation-global allowance. The host must debit role `observer`
   * immediately before each actual provider dispatch; image preparation,
   * sub-cap rejection, and other pre-dispatch failures must not consume it.
   */
  generationCallBudget?: GenerationCallBudget;
}

/** Host-injected, model-free engine seam for a bounded VLM observer. */
export type RenderObservationPort = (
  input: RenderObservationInput,
) => Promise<RenderObservationValue>;

/** One in-loop grid, and who drew it. Counted by the host, never shown to the model. */
export interface InLoopViewRender {
  /** The port's own renderer id when the GPU drew it; `cpu-raster` when it did not. */
  renderer: string;
  /** True when a port was injected and did not produce the grid. */
  degraded: boolean;
  /** Why the port was bypassed. Only set when `degraded`. */
  degradedReason?: string;
  /** Whether the scene held anything a flat raster cannot show (the routing predicate). */
  neededPbr: boolean;
}

/**
 * In-loop port deadline. Well under the engine's post-loop default because the
 * cost of waiting is completely different here: this one blocks the agent.
 */
export const DEFAULT_INLOOP_VIEW_RENDER_TIMEOUT_MS = 6000;

function resolveInLoopViewRenderTimeoutMs(
  context: KilnToolContext,
  requestKind: 'in-loop-grid' | 'derivative-cell',
): number {
  return resolveViewRenderTimeoutMs({
    requestKind,
    defaultTimeoutMs: DEFAULT_INLOOP_VIEW_RENDER_TIMEOUT_MS,
    ...(context.viewRenderTimeoutMs !== undefined
      ? { timeoutMs: context.viewRenderTimeoutMs }
      : {}),
    ...(context.viewRenderTimeoutContext
      ? { contextProvider: context.viewRenderTimeoutContext }
      : {}),
    ...(context.viewRenderTimeoutResolver ? { resolver: context.viewRenderTimeoutResolver } : {}),
  });
}

function trustedCategory(context: KilnToolContext): AssetCategory | undefined {
  return context.intent?.category ?? context.category;
}

async function evaluateGeneratedSource(
  code: string,
  context: KilnToolContext,
  optimize: 'off' | 'auto' = 'off',
): Promise<RenderResult> {
  return resolveEvaluatorPortV1(
    context.evaluatorPort,
    context.evaluatorProfile ?? 'trusted-local',
  ).render(
    code,
    {
      optimize,
      ...(context.geometryPolicy ? { geometryPolicy: context.geometryPolicy } : {}),
      ...(trustedCategory(context) ? { category: trustedCategory(context) } : {}),
      ...(context.intent ? { intent: context.intent } : {}),
    },
    context.evaluationControls?.(),
  );
}

async function loadEvaluatedReviewScene(code: string, context: KilnToolContext) {
  const rendered = await evaluateGeneratedSource(code, context);
  const { loadGlbReviewScene } = await import('../views');
  const scene = await loadGlbReviewScene(rendered.glb);
  return { rendered, ...scene };
}

const viewEvidenceHistoryByContext = new WeakMap<KilnToolContext, ViewEvidenceHistoryStore>();
const VIEW_EVIDENCE_GUIDANCE =
  ' viewEvidence.current describes ONLY this request. lastFaithful is older hash-only evidence for reference, not reused pixels and not current verification.';

function withViewEvidenceHistory(context: KilnToolContext): KilnToolContext {
  if (context.viewEvidenceHistory) return context;
  let history = viewEvidenceHistoryByContext.get(context);
  if (!history) {
    history = new ViewEvidenceHistoryStore();
    viewEvidenceHistoryByContext.set(context, history);
  }
  return { ...context, viewEvidenceHistory: history };
}

async function sha256Glb(bytes: Uint8Array): Promise<`sha256:${string}`> {
  const digest = new Uint8Array(
    await globalThis.crypto.subtle.digest('SHA-256', Uint8Array.from(bytes)),
  );
  return `sha256:${[...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

/** Render one purpose-built review GLB. Generated source has already executed;
 * both GPU and geometry-flat fallback consume only the serialized derivative. */
async function renderDerivativeCell(
  input: import('../views').DerivativeCellRenderInput,
  context: KilnToolContext,
): Promise<import('../views').DerivativeCellRenderResult> {
  let derivativeRoot = input.root as THREE.Object3D;
  if (input.backfaceCull === false) {
    derivativeRoot = derivativeRoot.clone(true);
    derivativeRoot.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      const prepare = (material: THREE.Material) => {
        const copy = material.clone();
        copy.side = THREE.DoubleSide;
        return copy;
      };
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map(prepare)
        : prepare(mesh.material);
    });
  }
  const rendered = await renderSceneToGLB(derivativeRoot, {
    // The scene here was loaded back from a GLB this engine already produced
    // and adjudicated. Submitting it for judgement a second time fails on the
    // round trip rather than on the asset: see `derivative` in render.ts.
    derivative: true,
    ...(trustedCategory(context) ? { category: trustedCategory(context) } : {}),
    ...(context.intent ? { intent: context.intent } : {}),
  });
  const { cameraFromBounds, measureBounds } = await import('../views');
  const camera =
    input.camera ??
    cameraFromBounds(
      input.frameBounds ?? measureBounds(input.root),
      input.view.dir,
      1,
      undefined,
      measureBounds(input.root),
    );
  const derivativeGlb = Uint8Array.from(rendered.bytes);
  const inputGlbSha256 = await sha256Glb(derivativeGlb);
  let degradeReason: string | undefined;
  const derivativeReasonCodes: ViewFidelityReasonCode[] = [];

  if (context.viewRenderPort) {
    const { captureViewPngsViaPort } = await import('../views/port');
    const ported = await captureViewPngsViaPort(
      context.viewRenderPort,
      derivativeGlb,
      resolveInLoopViewRenderTimeoutMs(context, 'derivative-cell'),
      [input.view.dir],
      input.size,
      [camera],
      context.captureLimits,
    );
    if (ported.ok && ported.derivativeFidelityAttested) {
      if (ported.inputGlbSha256 !== inputGlbSha256) {
        throw new Error(
          `validated derivative receipt hash mismatch (${ported.inputGlbSha256} != ${inputGlbSha256})`,
        );
      }
      const receipt: DerivativeViewReceiptV1 = {
        version: 'kiln.view-fidelity.v1',
        derivativeLabel: input.label,
        camera,
        cameraFidelity: 'echo-validated',
        ...(ported.captureCache ? { captureCache: ported.captureCache } : {}),
        requested: 'full-preferred',
        delivered: 'full-material',
        materialFaithful: true,
        exactArtifact: false,
        rendererId: ported.rendererId,
        inputGlbSha256,
        degraded: false,
      };
      try {
        context.onViewsRendered?.({
          renderer: ported.rendererId,
          degraded: false,
          neededPbr: true,
        });
      } catch {
        /* best effort */
      }
      return { png: Buffer.from(ported.pngs[0]!), receipt };
    }
    if (ported.ok) {
      degradeReason = 'view render port returned no derivative material/hash receipt';
      derivativeReasonCodes.push('DERIVATIVE_RECEIPT_UNAVAILABLE');
    } else {
      degradeReason = ported.reason;
      if (ported.reason.includes('derivative receipt hash mismatch')) {
        derivativeReasonCodes.push('DERIVATIVE_RECEIPT_INVALID');
      }
    }
  } else if (input.gpuUnsupportedReasonCode) {
    degradeReason = 'GPU auto-framing cannot preserve the requested derivative focus bounds';
  } else {
    degradeReason = 'material-faithful view render port unavailable';
  }

  if (context.viewRenderRequired) throw new Error(`Required GPU render failed: ${degradeReason}`);
  const { renderGlbViewCell, CPU_RASTER_RENDERER_ID } = await import('../views');
  const produceFlat = async () =>
    renderGlbViewCell(derivativeGlb, input.view, {
      size: input.size,
      camera,
      ...(input.backfaceCull !== undefined ? { backfaceCull: input.backfaceCull } : {}),
      ...(input.frameBounds ? { frameBounds: input.frameBounds } : {}),
    });
  const flat: import('../views').GlbViewCellResult & { captureCache?: { hit: boolean } } =
    context.captureCache
      ? await (await import('../views/capture-cache')).captureCpuCell(
          context.captureCache,
          {
            artifactGlbSha256: inputGlbSha256,
            rendererId: CPU_RASTER_RENDERER_ID,
            camera,
            size: input.size,
            backfaceCull: input.backfaceCull ?? true,
          },
          produceFlat,
        )
      : await produceFlat();
  if (flat.inputGlbSha256 !== inputGlbSha256) {
    throw new Error(
      `derivative GLB fallback hash mismatch (${flat.inputGlbSha256} != ${inputGlbSha256})`,
    );
  }
  const reasonCodes = [
    'FULL_MATERIAL_RENDER_UNAVAILABLE',
    ...(input.gpuUnsupportedReasonCode ? [input.gpuUnsupportedReasonCode] : []),
    ...derivativeReasonCodes,
    ...flat.reasonCodes,
  ] as ViewFidelityReasonCode[];
  const receipt: DerivativeViewReceiptV1 = {
    version: 'kiln.view-fidelity.v1',
    derivativeLabel: input.label,
    camera,
    cameraFidelity: 'engine-resolved',
    ...(flat.captureCache
      ? {
          captureCache: {
            hit: flat.captureCache.hit,
            reused: flat.captureCache.hit ? 1 : 0,
            total: 1,
          },
        }
      : {}),
    requested: 'full-preferred',
    delivered: 'geometry-flat',
    materialFaithful: false,
    exactArtifact: false,
    rendererId: CPU_RASTER_RENDERER_ID,
    inputGlbSha256,
    degraded: true,
    degradeReason,
    reasonCodes,
  };
  try {
    context.onViewsRendered?.({
      renderer: CPU_RASTER_RENDERER_ID,
      degraded: true,
      degradedReason: degradeReason,
      neededPbr: true,
    });
  } catch {
    /* best effort */
  }
  return { png: flat.png, receipt };
}

function derivativeReviewFidelity(
  receipts: DerivativeViewReceiptV1[] | undefined,
): DerivativeReviewFidelityV1 | undefined {
  if (!receipts?.length) return undefined;
  const materialFaithful = receipts.every((receipt) => receipt.materialFaithful);
  const reasonCodes = [
    ...new Set(receipts.flatMap((receipt) => receipt.reasonCodes ?? [])),
  ] as ViewFidelityReasonCode[];
  return {
    version: 'kiln.derivative-review-fidelity.v1',
    requested: 'full-preferred',
    delivered: materialFaithful ? 'full-material' : 'geometry-flat',
    materialFaithful,
    exactArtifact: false,
    degraded: receipts.some((receipt) => receipt.degraded),
    receipts,
    ...(reasonCodes.length ? { reasonCodes } : {}),
  };
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

/**
 * `kiln_render` (unified surface only) additionally accepts a capture config.
 * Kept off the shared `renderInput` on purpose: the four-tool baseline's
 * metrics-only `kiln_render` produces no image, so a grid shape would be a
 * meaningless argument there and would change that schema for no reason.
 */
const legacyCaptureInput = z
  .object({
    preset: z
      .enum(['1x1', '1x2', '2x1', '3x1', '2x2', '3x2', '3x3'])
      .optional()
      .describe(
        'Grid shape as COLSxROWS. Default 3x2. Choose fewer views for simple shapes, up to 3x3 for more angles.',
      ),
    cells: z
      .array(
        z.object({
          azimuthDeg: z.number().describe('0 = front, 90 = right, 180 = back, 270 = left. Wraps.'),
          elevationDeg: z
            .number()
            .describe(
              '0 = eye level, positive looks down, negative from below. Clamped to -89..89.',
            ),
          zoom: z
            .number()
            .optional()
            .describe(
              'Padding multiplier around the asset bounds for this cell only. Omit for the ' +
                'default framing; below 1 crops in, above 1 pulls back.',
            ),
          name: z
            .string()
            .optional()
            .describe('Cell label. Auto-derived from the angles if omitted.'),
        }),
      )
      .optional()
      .describe(
        'One camera per cell, in row-major order. Omit to use the preset default cameras. ' +
          'Must not exceed the preset capacity (max 9 overall).',
      ),
  })
  .optional()
  .describe(
    'Optional. Choose the contact-sheet shape and cameras. Omit it entirely for the standard ' +
      'six-view 3x2 grid, which is the right default for most assets.',
  );

const cameraVec3Input = z.tuple([z.number(), z.number(), z.number()]);
const cameraShotInput = z
  .object({
    name: z.string().optional(),
    subject: z
      .object({ path: z.string().optional(), name: z.string().optional() })
      .strict()
      .refine((v) => (v.path === undefined) !== (v.name === undefined), {
        message: 'Choose subject path OR exact name.',
      })
      .optional(),
    visibility: z.enum(['context', 'isolate']).optional(),
    camera: z
      .discriminatedUnion('type', [
        z
          .object({
            type: z.literal('orbit'),
            azimuthDeg: z.number().optional(),
            elevationDeg: z.number().optional(),
            relativeTo: z.enum(['world', 'asset', 'part']).optional(),
            padding: z.number().positive().max(100).optional(),
          })
          .strict(),
        z
          .object({
            type: z.literal('explicit'),
            projection: z.enum(['orthographic', 'perspective']),
            position: cameraVec3Input,
            target: cameraVec3Input.optional(),
            relativeTo: z.enum(['world', 'asset', 'part', 'local']).optional(),
            frame: z
              .object({ origin: cameraVec3Input.optional(), rotation: cameraVec3Input.optional() })
              .strict()
              .optional(),
            framing: z.enum(['explicit', 'bounds']).optional(),
            padding: z.number().positive().max(100).optional(),
            targetOffset: cameraVec3Input.optional(),
            up: cameraVec3Input.optional(),
            halfHeight: z.number().positive().optional(),
            fovDeg: z.number().positive().lt(180).optional(),
            near: z.number().positive().optional(),
            far: z.number().positive().optional(),
          })
          .strict(),
      ])
      .optional(),
  })
  .strict();
const advancedCaptureInput = z
  .object({
    version: z.literal('kiln.capture.v1'),
    shots: z.array(cameraShotInput).min(1).max(9),
    cols: z.number().int().min(1).max(3).optional(),
    size: z.number().int().min(128).max(1024).optional(),
    output: z.enum(['grid', 'separate']).optional(),
  })
  .strict();
// Error selection only: tagged input should explain its shot fields, not the
// legacy branch's unknown keys. This does not coerce values or change JSON Schema.
function taggedCaptureError(issue: { input?: unknown }): string | undefined {
  const input = issue.input;
  if (
    typeof input !== 'object' ||
    input === null ||
    !('version' in input) ||
    input.version !== 'kiln.capture.v1'
  )
    return undefined;
  const parsed = advancedCaptureInput.safeParse(input);
  if (parsed.success) return undefined;
  const issues = parsed.error.issues;
  const details = issues
    .slice(0, 6)
    .map((problem) => `${problem.path.join('.') || 'capture'}: ${problem.message.slice(0, 240)}`);
  return `Invalid kiln.capture.v1: ${details.join('; ')}${issues.length > 6 ? '; additional issues omitted' : ''}`;
}
const captureInput = z
  .union(
    [
      advancedCaptureInput,
      z.strictObject(legacyCaptureInput.unwrap().shape, { error: taggedCaptureError }),
    ],
    { error: taggedCaptureError },
  )
  .optional()
  .describe(
    'Use legacy preset/cells for an orbit sheet, or version kiln.capture.v1 with 1..9 shots for exact part framing, local axes, perspective and separate images. Omit for six default views.',
  );

const renderViewsInput = renderInput.extend({ capture: captureInput });

/** Unified-agent schema: the working buffer supplies `code`, while the model
 * still owns the deliberately bounded camera selection. Keeping this derived
 * from the registry schema prevents the Strands skin from silently lagging the
 * canonical capture contract. */
export const renderViewsBufferInput = renderViewsInput.omit({ code: true });

const screenshotAnimationInput = z.object({
  shot: cameraShotInput.optional(),
  frames: z.number().int().min(2).max(6).optional(),
  frameTimes: z
    .array(z.number().min(0).max(1))
    .min(1)
    .max(9)
    .optional()
    .describe('Ordered phase fractions 0..1; mutually exclusive with frames.'),
  framing: z.enum(['locked', 'follow']).optional(),
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
  capture: advancedCaptureInput.optional(),
  code: z.string().describe('Kiln source code to execute and render with the roof hidden.'),
  nodeName: z
    .string()
    .optional()
    .describe(
      'Override: lift the roof by exact node name instead of by role. Matches that node and its ' +
        'children. Normally OMIT it — Kiln finds the roof from its semantic role (anything built ' +
        'with createRoofPlanes/createGableRoof), falling back to historical "Roof" naming.',
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

function runValidate(
  input: z.infer<typeof validateInput>,
  context: KilnToolContext,
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const category = trustedCategory(context);
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
  buildCache?: { key: `sha256:${string}`; hit: boolean };
  parts?: { path: string; name: string }[];
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
  /** Structured deterministic report; five dimensions remain separate. */
  qaReport?: AssetQaReportV1;
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
async function runRender(
  input: z.infer<typeof renderInput>,
  context: KilnToolContext,
): Promise<KilnRenderMetrics> {
  try {
    const { root, rendered } = await loadEvaluatedReviewScene(input.code, context);
    const materialContractFailure = missingProceduralTextureResult(rendered, context);
    if (materialContractFailure) return materialContractFailure;
    const category = trustedCategory(context);

    // Structural advisories (floating parts / stray planes at origin).
    const structuralWarnings = inspectSceneStructure(root, { category });
    const metrics = collectSceneMetrics(root);

    const warnings = [...structuralWarnings, ...rendered.warnings];
    const instanceability = rendered.meta.instanceability;

    return {
      ok: true,
      ...(rendered.buildCache ? { buildCache: rendered.buildCache } : {}),
      parts: (await import('../views'))
        .listCameraSubjects(root)
        .slice(0, 80)
        .map(({ path, name }) => ({ path, name })),
      tris: rendered.tris,
      meshes: metrics.meshes,
      materials: metrics.materials,
      bbox: metrics.bbox,
      lowestPart: metrics.lowestPart,
      ...(instanceability
        ? {
            instanceability: {
              grade: instanceability.grade,
              summary: instanceability.summary,
            },
          }
        : {}),
      warnings,
      qaReport: rendered.meta.qaReport as AssetQaReportV1 | undefined,
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
  /** View names in grid order (row-major). Defaults to Front, Right, Back, Left, Top, 3/4. */
  views?: string[];
  /** Grid shape actually rendered — echoes the capture config back, or `3x2` by default. */
  capture?: { preset: string; cols: number; cells: number };
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
  context: KilnToolContext,
): Promise<KilnScreenshotResult> {
  try {
    const { renderGlbViewGrid } = await import('../views');
    const { root, rendered } = await loadEvaluatedReviewScene(input.code, context);
    const warnings = inspectSceneStructure(root, { category: trustedCategory(context) });
    // No capture config here on purpose: kiln_screenshot belongs to the frozen
    // four-tool baseline, whose schemas stay byte-for-byte unchanged.
    const grid = await renderGlbViewGrid(rendered.glb);
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
  captureCache?: { hit: boolean; reused: number; total: number };
  buildCache?: { key: `sha256:${string}`; hit: boolean };
  cameraShots?: import('../views').ResolvedCameraShotV1[];
  parts?: { path: string; name: string }[];
  derivativeReceipts?: DerivativeViewReceiptV1[];
  framesBase64?: string[];
  ok: boolean;
  tris?: number;
  meshes?: number;
  materials?: number;
  bbox?: { min: number[]; max: number[]; size: number[] };
  lowestPart?: { name: string; y: number };
  /** Post-dedup instanceability grade (informational): how cheap to render at scale. */
  instanceability?: { grade: string; summary: string };
  /** Structured deterministic report; five dimensions remain separate. */
  qaReport?: AssetQaReportV1;
  materialContract?: ProceduralTextureMaterialContract;
  /** View names in grid order (row-major). Defaults to Front, Right, Back, Left, Top, 3/4. */
  views?: string[];
  /** Grid shape actually rendered — echoes the capture config back, or `3x2` by default. */
  capture?: { preset: string; cols: number; cells: number };
  gridWidth?: number;
  gridHeight?: number;
  /** The 3x2 grid PNG, base64-encoded (transports with image support strip this and attach the bytes). */
  pngBase64?: string;
  /** Truthful material fidelity delivered by this render, visible to the model. */
  viewFidelity?: ViewFidelityV1;
  viewEvidence?: ViewEvidenceHistoryV1;
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
async function runRenderViews(
  input: z.infer<typeof renderViewsInput>,
  context: KilnToolContext,
): Promise<KilnRenderViewsResult> {
  try {
    // `CPU_RASTER_RENDERER_ID` and `resolveGridCapture` come from this SAME lazy
    // import rather than static ones on purpose. `../views/renderer-id` reads
    // package.json with `readFileSync` at MODULE LOAD, so a static import would
    // put a `node:fs` edge — evaluated on import, not on call — into this
    // module's graph, which is exactly what the lazy `../views` import at the top
    // of this file exists to prevent.
    const { renderGlbViewGrid, CPU_RASTER_RENDERER_ID, resolveGridCapture } = await import(
      '../views'
    );
    const { root, rendered, reasonCodes } = await loadEvaluatedReviewScene(input.code, context);
    const materialContractFailure = missingProceduralTextureResult(rendered, context);
    if (materialContractFailure) return materialContractFailure;
    const category = trustedCategory(context);

    const structuralWarnings = inspectSceneStructure(root, { category });
    const metrics = collectSceneMetrics(root);
    if ('shots' in (input.capture ?? {})) {
      const { renderCaptureGrid, listCameraSubjects } = await import('../views');
      const grid = await renderCaptureGrid(root, input.capture!, (cell) =>
        renderDerivativeCell(cell, context),
      );
      const receipts = grid.derivativeReceipts;
      const materialFaithful = receipts.every((r) => r.materialFaithful);
      return {
        ok: true,
        ...(rendered.buildCache ? { buildCache: rendered.buildCache } : {}),
        tris: rendered.tris,
        meshes: metrics.meshes,
        materials: metrics.materials,
        bbox: metrics.bbox,
        lowestPart: metrics.lowestPart,
        views: grid.views,
        capture: grid.capture,
        ...(grid.captureCache ? { captureCache: grid.captureCache } : {}),
        gridWidth: grid.width,
        gridHeight: grid.height,
        cameraShots: grid.cameraShots,
        parts: listCameraSubjects(root)
          .slice(0, 80)
          .map(({ path, name }) => ({ path, name })),
        derivativeReceipts: receipts,
        ...('output' in input.capture! && input.capture.output === 'separate'
          ? { framesBase64: grid.perFramePngs.map((p) => p.toString('base64')) }
          : { pngBase64: grid.png.toString('base64') }),
        viewFidelity: {
          version: 'kiln.view-fidelity.v1',
          requested: 'full-preferred',
          delivered: materialFaithful ? 'full-material' : 'geometry-flat',
          materialFaithful,
          exactArtifact: false,
          rendererId: [...new Set(receipts.map((r) => r.rendererId))].join(', '),
          inputGlbSha256: await sha256Glb(Uint8Array.from(rendered.glb)),
          degraded: !materialFaithful,
        },
        warnings: [...structuralWarnings, ...rendered.warnings],
      };
    }

    // Route to the GPU only when a flat-shaded raster would misrepresent the
    // scene. A prop made of untextured `gameMaterial` looks the same either way,
    // so sending it costs a round trip and a warm GPU to draw a picture the CPU
    // already draws correctly. `renderSceneToGLB` above ALREADY produced the
    // bytes the port needs — this reuses them rather than paying a second bake.
    const neededPbr =
      sceneNeedsPbrShading(root) ||
      (rendered.materialMetrics?.texturedMaterials ?? 0) > 0 ||
      (rendered.materialMetrics?.materialExtensionCount ?? 0) > 0 ||
      reasonCodes.length > 0;
    let grid: ViewGridResult | undefined;
    let drawnBy: InLoopViewRender | undefined;
    let materialFaithful = false;

    if (context.viewRenderPort && (neededPbr || context.viewRenderRequired)) {
      // Lazy import: `../agent/generate` sits upstream of this module in the
      // agent tool-surface graph (tools/registry <- agent/tools <- agent/surface
      // <- agent/run <- agent/generate), so a static import of
      // `captureViewsViaPort` here would be a real runtime import cycle. Loaded
      // lazily exactly like the `../views` import above.
      const { captureViewsViaPort } = await import('../views/port');
      const ported = await captureViewsViaPort(
        context.viewRenderPort,
        rendered.glb,
        resolveInLoopViewRenderTimeoutMs(context, 'in-loop-grid'),
        input.capture,
      );
      if (ported.ok) {
        // The port reports pixels only, not view names. Derive the same names
        // the CPU path would report for this capture config through the SAME
        // resolver both producers share, so the two paths agree on cell order.
        const resolvedViews = resolveGridCapture(input.capture, process.env['KILN_GRID_VARIANT']);
        grid = {
          png: ported.png,
          views: resolvedViews.views.map((v) => v.name),
          width: ported.width,
          height: ported.height,
          capture: ported.capture,
          ...(ported.captureCache ? { captureCache: ported.captureCache } : {}),
        };
        materialFaithful = true;
        drawnBy = { renderer: ported.rendererId, degraded: false, neededPbr };
      } else {
        drawnBy = {
          renderer: CPU_RASTER_RENDERER_ID,
          degraded: true,
          degradedReason: ported.reason,
          neededPbr,
        };
      }
    }

    // The CPU path is unchanged and is still what runs for every scene that does
    // not need PBR, every host with no port, and every port call that did not
    // come back. It is never skipped as an optimisation — it is the fallback.
    if (!grid && context.viewRenderRequired)
      throw new Error(
        `Required GPU render failed: ${drawnBy?.degradedReason ?? 'renderer unavailable'}`,
      );
    if (!grid) {
      grid = await renderGlbViewGrid(rendered.glb, {
        ...(input.capture ? { capture: input.capture } : {}),
        ...(context.captureCache ? { captureCache: context.captureCache } : {}),
      });
    }
    drawnBy ??= context.viewRenderPort
      ? { renderer: CPU_RASTER_RENDERER_ID, degraded: false, neededPbr }
      : {
          renderer: CPU_RASTER_RENDERER_ID,
          degraded: neededPbr,
          ...(neededPbr
            ? { degradedReason: 'material-faithful view render port unavailable' }
            : {}),
          neededPbr,
        };

    // Copy into an ArrayBuffer-backed view: render bytes are typed as
    // `Uint8Array<ArrayBufferLike>`, while Web Crypto deliberately rejects a
    // possible SharedArrayBuffer at its boundary.
    const hashInput = new Uint8Array(rendered.glb.byteLength);
    hashInput.set(rendered.glb);
    const digest = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', hashInput));
    const inputGlbSha256 = `sha256:${[...digest]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')}` as const;
    const viewFidelity: ViewFidelityV1 = {
      version: 'kiln.view-fidelity.v1',
      requested: 'full-preferred',
      delivered: materialFaithful ? 'full-material' : 'geometry-flat',
      materialFaithful,
      exactArtifact: false,
      rendererId: drawnBy.renderer,
      inputGlbSha256,
      degraded: drawnBy.degraded,
      ...(drawnBy.degradedReason ? { degradeReason: drawnBy.degradedReason } : {}),
    };
    const viewEvidence = context.viewEvidenceHistory?.record('kiln_render', viewFidelity);

    // A host bookkeeping hook must never be able to fail a render the model is
    // waiting on.
    try {
      context.onViewsRendered?.(drawnBy);
    } catch {
      /* ignore */
    }

    const warnings = [...structuralWarnings, ...rendered.warnings];
    const materialContract = proceduralTextureMaterialContract(rendered, context);

    return {
      ok: true,
      ...(rendered.buildCache ? { buildCache: rendered.buildCache } : {}),
      parts: (await import('../views'))
        .listCameraSubjects(root)
        .slice(0, 80)
        .map(({ path, name }) => ({ path, name })),
      tris: rendered.tris,
      meshes: metrics.meshes,
      materials: metrics.materials,
      bbox: metrics.bbox,
      lowestPart: metrics.lowestPart,
      ...(rendered.meta.instanceability
        ? {
            instanceability: {
              grade: rendered.meta.instanceability.grade,
              summary: rendered.meta.instanceability.summary,
            },
          }
        : {}),
      views: grid.views,
      ...(grid.capture ? { capture: grid.capture } : {}),
      ...(grid.captureCache ? { captureCache: grid.captureCache } : {}),
      gridWidth: grid.width,
      gridHeight: grid.height,
      pngBase64: grid.png.toString('base64'),
      viewFidelity,
      ...(viewEvidence ? { viewEvidence } : {}),
      warnings,
      qaReport: rendered.meta.qaReport as AssetQaReportV1 | undefined,
      ...(materialContract ? { materialContract } : {}),
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
const KILN_RENDER_VIEWS_DESCRIPTION =
  'Build the current asset and return geometry metrics, exact part paths and images. Omit capture for six orthographic views. Choose preset/cells for a smaller orbit sheet, or version kiln.capture.v1 with shots for per-part framing, local axes, perspective and separate images. +X is forward, +Y up, +Z right. Review silhouette, attachments, proportion and ground contact. GPU PBR shading supports textured or metallic materials; a flat-shaded CPU render supports geometry review. Read viewFidelity; do not judge material fidelity from CPU views. Failed builds return errors without images.' +
  VIEW_EVIDENCE_GUIDANCE;

/** Create the unified render/view definition with host-owned QA context. */
export function createKilnRenderViewsDef(context: KilnToolContext = {}): KilnToolDef {
  const statefulContext = withViewEvidenceHistory(context);
  return {
    name: 'kiln_render',
    description: KILN_RENDER_VIEWS_DESCRIPTION,
    mediaMulti: screenshotAnimationMediaMulti,
    inputSchema: renderViewsInput,
    run: async (input) =>
      guardCaptureBudget('kiln_render', input, statefulContext, () =>
        runRenderViews(renderViewsInput.parse(input), statefulContext),
      ),
    media: screenshotMedia,
  };
}

/** Neutral compatibility export. It never reads category from generated source. */
export const kilnRenderViewsDef: KilnToolDef = createKilnRenderViewsDef();

// =============================================================================
// kiln_screenshot_animation — SEE one clip's motion (6 phase-labeled frames)
// =============================================================================

export interface KilnScreenshotAnimationResult {
  cameraShots?: import('../views').ResolvedCameraShotV1[];
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
  /** Material fidelity and SHA-256 receipt for every posed derivative GLB. */
  viewFidelity?: DerivativeReviewFidelityV1;
  viewEvidence?: ViewEvidenceHistoryV1;
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
  context: KilnToolContext,
): Promise<KilnScreenshotAnimationResult> {
  try {
    const { renderClipAnimation } = await import('../views');
    const { root, clips } = await loadEvaluatedReviewScene(input.code, context);
    const warnings = inspectSceneStructure(root, { category: trustedCategory(context) });
    const r = await renderClipAnimation(root, clips, {
      clip: input.clip,
      ...(input.shot ? { shot: input.shot } : {}),
      ...(input.frames !== undefined ? { frames: input.frames } : {}),
      ...(input.frameTimes ? { frameTimes: input.frameTimes } : {}),
      ...(input.framing ? { framing: input.framing } : {}),
      ...(input.camera ? { camera: input.camera } : {}),
      ...(input.perFrame ? { perFrame: true } : {}),
      renderDerivativeCell: (cell) => renderDerivativeCell(cell, context),
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
    const viewFidelity = derivativeReviewFidelity(r.derivativeReceipts);
    const viewEvidence = viewFidelity
      ? context.viewEvidenceHistory?.record('kiln_screenshot_animation', viewFidelity)
      : undefined;
    const base: KilnScreenshotAnimationResult = {
      ok: true,
      frames: r.frames,
      ...(r.cameraShots ? { cameraShots: r.cameraShots } : {}),
      warnings,
      ...(r.clip ? { clip: r.clip } : {}),
      ...(r.camera ? { camera: r.camera } : {}),
      ...(r.frameTimes ? { frameTimes: r.frameTimes } : {}),
      ...(r.duration != null ? { duration: r.duration } : {}),
      ...(r.unresolvedTracks ? { unresolvedTracks: r.unresolvedTracks } : {}),
      ...(r.width ? { width: r.width } : {}),
      ...(r.height ? { height: r.height } : {}),
      ...(viewFidelity ? { viewFidelity } : {}),
      ...(viewEvidence ? { viewEvidence } : {}),
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
const KILN_SCREENSHOT_ANIMATION_DESCRIPTION =
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
  'track names. Each frame is rendered from deterministic posed GLB bytes: GPU PBR when available, ' +
  'otherwise a GLB-native geometry-flat fallback. Read viewFidelity before judging materials; writes no files.' +
  VIEW_EVIDENCE_GUIDANCE;

/** Create an animation-view definition with host-owned QA context. */
export function createKilnScreenshotAnimationDef(context: KilnToolContext = {}): KilnToolDef {
  const statefulContext = withViewEvidenceHistory(context);
  return {
    name: 'kiln_screenshot_animation',
    description: KILN_SCREENSHOT_ANIMATION_DESCRIPTION,
    inputSchema: screenshotAnimationInput,
    run: async (input) =>
      guardCaptureBudget('kiln_screenshot_animation', input, statefulContext, () =>
        runScreenshotAnimation(screenshotAnimationInput.parse(input), statefulContext),
      ),
    media: screenshotAnimationMedia,
    mediaMulti: screenshotAnimationMediaMulti,
  };
}

/** Neutral compatibility export. It never reads category from generated source. */
export const kilnScreenshotAnimationDef: KilnToolDef = createKilnScreenshotAnimationDef();

// =============================================================================
// kiln_view_interior (unified) — see INSIDE an enterable building, roof off
// =============================================================================

export interface KilnViewInteriorResult {
  cameraShots?: import('../views').ResolvedCameraShotV1[];
  framesBase64?: string[];
  ok: boolean;
  /** View names in grid order: Floor plan, Dollhouse, Eye-level. */
  views?: string[];
  gridWidth?: number;
  gridHeight?: number;
  /** Roof subtree roots hidden (0 → no roof was resolvable by role or by name). */
  roofsHidden?: number;
  /** Near-wall subtree roots removed for the eye-level cutaway (0 → not a room()). */
  wallsHidden?: number;
  /** The single-row grid PNG, base64 (image transports strip this and attach the bytes). */
  pngBase64?: string;
  /** Material fidelity and SHA-256 receipt for every cutaway derivative GLB. */
  viewFidelity?: DerivativeReviewFidelityV1;
  viewEvidence?: ViewEvidenceHistoryV1;
  warnings: string[];
  error?: string;
}

/**
 * Render the asset with its roof hidden so the agent can SEE the interior the six
 * exterior views cannot (open/walkable floor, a doorway that is a real gap, fixtures
 * on the floor, nothing buried/sealed). Three roof-off cells: Floor plan, Dollhouse,
 * Eye-level. A build error comes back image-free ({ ok:false, error }). When the roof
 * could not be lifted (roofsHidden === 0) the interior stays occluded — the warning is
 * mode-specific: a bad explicit nodeName vs no resolvable roof at all. Pure visual QA:
 * does NOT run the structural inspector uses the same host-owned category as every other
 * view path. The views module is imported lazily to keep node:zlib out of the browser
 * bundle graph.
 */
async function runViewInterior(
  input: z.infer<typeof viewInteriorInput>,
  context: KilnToolContext,
): Promise<KilnViewInteriorResult> {
  try {
    const { renderInteriorGrid } = await import('../views');
    const { root } = await loadEvaluatedReviewScene(input.code, context);
    // No default name. An explicit nodeName stays an exact-name override; with
    // none, the grid resolves the roof from its semantic role (and only then
    // falls back to historical "Roof" naming) — so a correctly-roled roof named
    // anything at all still lifts.
    const nodeName = input.nodeName?.trim() ? input.nodeName : undefined;
    const grid = await renderInteriorGrid(root, {
      ...(input.capture ? { capture: input.capture } : {}),
      ...(nodeName ? { nodeName } : {}),
      renderDerivativeCell: (cell) => renderDerivativeCell(cell, context),
    });
    const warnings = inspectSceneStructure(root, { category: trustedCategory(context) });
    if (grid.roofsHidden === 0) {
      warnings.push(
        nodeName
          ? `No node named "${nodeName}" was found, so the roof could not be lifted and the interior is still occluded. Check that name, or omit nodeName so the roof is found by its semantic role instead.`
          : 'No roof was found, so nothing could be lifted and the interior is still occluded. Build the roof with createRoofPlanes/createGableRoof (which tag it as a roof), or name the roof group "Roof".',
      );
    }
    const viewFidelity = derivativeReviewFidelity(grid.derivativeReceipts);
    const viewEvidence = viewFidelity
      ? context.viewEvidenceHistory?.record('kiln_view_interior', viewFidelity)
      : undefined;
    return {
      ok: true,
      views: grid.views,
      gridWidth: grid.width,
      gridHeight: grid.height,
      ...(grid.cameraShots ? { cameraShots: grid.cameraShots } : {}),
      roofsHidden: grid.roofsHidden,
      wallsHidden: grid.wallsHidden,
      ...(input.capture?.output === 'separate' && grid.perFramePngs
        ? { framesBase64: grid.perFramePngs.map((p) => p.toString('base64')) }
        : { pngBase64: grid.png.toString('base64') }),
      ...(viewFidelity ? { viewFidelity } : {}),
      ...(viewEvidence ? { viewEvidence } : {}),
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
const KILN_VIEW_INTERIOR_DESCRIPTION =
  'SEE INSIDE an enterable building: renders it with the roof lifted off, as a ' +
  'three-view grid. (1) Floor plan: top-down — check the interior is open and walkable and the footprint ' +
  'is right. (2) Dollhouse: a 3/4 cutaway — check built-in fixtures (hearth, counter, shelves) rest ON the ' +
  'floor, not floating or sunk, and the walls enclose a real volume with headroom. (3) Eye-level: a low ' +
  'angle looking in through the doorway with the near walls also removed — confirm the doorway is a REAL ' +
  'gap you could walk through (not a panel) and no wall or glass is buried inside a solid mass. ' +
  'Call this before finalizing any building. Take no argument: the roof is found from its semantic ' +
  'role, so any roof built with createRoofPlanes/createGableRoof lifts whatever it is named. If ' +
  'roofsHidden comes back 0 no roof was resolvable and the interior stays hidden — build the roof ' +
  'with a roof primitive (or name the group "Roof"). Each cell is rendered from deterministic cutaway ' +
  'GLB bytes: GPU PBR when available, otherwise a GLB-native geometry-flat fallback. Read viewFidelity ' +
  'before judging materials; writes no files.' +
  VIEW_EVIDENCE_GUIDANCE;

/** Create the interior-view definition with host-owned QA context. */
export function createKilnViewInteriorDef(context: KilnToolContext = {}): KilnToolDef {
  const statefulContext = withViewEvidenceHistory(context);
  return {
    name: 'kiln_view_interior',
    mediaMulti: screenshotAnimationMediaMulti,
    description: KILN_VIEW_INTERIOR_DESCRIPTION,
    inputSchema: viewInteriorInput,
    run: async (input) =>
      guardCaptureBudget('kiln_view_interior', input, statefulContext, () =>
        runViewInterior(viewInteriorInput.parse(input), statefulContext),
      ),
    media: screenshotMedia,
  };
}

/** Neutral compatibility export. It never reads category from generated source. */
export const kilnViewInteriorDef: KilnToolDef = createKilnViewInteriorDef();

// =============================================================================
// kiln_inspect (unified) — part-framed close-up of one suspect region
// =============================================================================

const attachmentEndpointInput = z
  .object({
    subject: z.object({ path: z.string().optional(), name: z.string().optional() }).strict(),
    point: cameraVec3Input.optional(),
  })
  .strict();
const inspectInput = z.object({
  measure: z
    .object({ from: attachmentEndpointInput, to: attachmentEndpointInput })
    .strict()
    .optional()
    .describe(
      'Straight-line distance between exact named node origins or subject-local points; asset units, not surface clearance.',
    ),
  shot: cameraShotInput
    .optional()
    .describe('Exact framed shot; omit legacy part/view/orbit fields when using this.'),
  code: z.string().describe('Kiln source code to execute and inspect.'),
  part: z
    .string()
    .optional()
    .describe(
      'The part to frame, by node name from your program (case-insensitive; substring match as a ' +
        'fallback). Omit to frame the whole asset.',
    ),
  view: z
    .string()
    .optional()
    .describe(
      'Camera angle: front, right, back, left, top, or three-quarter (default). Ignored when ' +
        'azimuthDeg or elevationDeg is given.',
    ),
  azimuthDeg: z
    .number()
    .optional()
    .describe(
      'Orbit the camera around the asset: 0 = front, 90 = right, 180 = back, 270 = left. Wraps, ' +
        'so 315 and -45 are the same. Use it to look between the named views — at a corner, a ' +
        'seam, or whatever angle the last render left ambiguous.',
    ),
  elevationDeg: z
    .number()
    .optional()
    .describe(
      'Orbit the camera up or down: 0 = eye level, positive looks down from above, negative from ' +
        'below. Clamped to -89..89. Combine with azimuthDeg for any three-quarter angle you want.',
    ),
  zoom: z
    .number()
    .optional()
    .describe(
      'Padding multiplier around the part bounds, clamped to 1-4. Default 1.2; raise it to see ' +
        'more surrounding context.',
    ),
  isolate: z
    .boolean()
    .optional()
    .describe(
      'Hide everything except the named part (and its descendants) so nothing can block the view. ' +
        'Use it when the part is buried inside or behind other geometry. Needs `part`; without ' +
        'one it does nothing. Default false — surrounding geometry stays visible for context.',
    ),
});

/** Unified-agent schema: identical inspection controls, with source supplied
 * by the working buffer instead of the model. */
export const inspectBufferInput = inspectInput.omit({ code: true });

export interface KilnInspectResult {
  measurement?: ReturnType<typeof import('../views/measurement').measureAttachment>;
  subjectFrame?: ReturnType<typeof import('../views/measurement').describeSubjectFrame>;
  cameraShot?: import('../views').ResolvedCameraShotV1;
  ok: boolean;
  /** Resolved part name that was framed (absent when the whole asset was framed). */
  part?: string;
  view?: string;
  /** Orbit angles actually rendered — reported for named cameras too. */
  azimuthDeg?: number;
  elevationDeg?: number;
  zoom?: number;
  /** True when everything outside the framed part was hidden (isolate honored). */
  isolated?: boolean;
  /** One line stating what was framed and from which view. */
  framed?: string;
  width?: number;
  height?: number;
  /** The close-up PNG, base64 (image transports strip this and attach the bytes). */
  pngBase64?: string;
  /** Fidelity and exact derivative-byte receipt for this close-up. */
  viewFidelity?: DerivativeReviewFidelityV1;
  viewEvidence?: ViewEvidenceHistoryV1;
  /** Part names available for framing (set when the requested part was not found). */
  availableParts?: string[];
  error?: string;
}

/**
 * Execute Kiln code and render ONE view framed to a named part's world bounds
 * (the part and its descendants), so the agent can see a suspect region at
 * full-image detail instead of one grid cell. An unresolved part name is not an
 * error thrown at the loop — it comes back as { ok:false, availableParts } so
 * the model can retry by name. The views module is imported lazily (node:zlib)
 * to keep it out of the browser bundle graph.
 */
async function runInspect(
  input: z.infer<typeof inspectInput>,
  context: KilnToolContext,
): Promise<KilnInspectResult> {
  try {
    const { prepareInspectView } = await import('../views/inspect');
    const { root } = await loadEvaluatedReviewScene(input.code, context);
    const { measureAttachment, describeSubjectFrame } = await import('../views/measurement');
    const measurement = input.measure ? measureAttachment(root, input.measure) : undefined;
    if (input.shot) {
      if (
        [
          input.part,
          input.view,
          input.azimuthDeg,
          input.elevationDeg,
          input.zoom,
          input.isolate,
        ].some((v) => v !== undefined)
      )
        throw new Error('shot cannot be combined with legacy inspection controls');
      const { renderCaptureGrid } = await import('../views');
      const grid = await renderCaptureGrid(
        root,
        { version: 'kiln.capture.v1', shots: [input.shot], size: 512 },
        (cell) => renderDerivativeCell(cell, context),
      );
      return {
        ok: true,
        cameraShot: grid.cameraShots[0],
        subjectFrame: describeSubjectFrame(root, input.shot.subject),
        ...(measurement ? { measurement } : {}),
        pngBase64: grid.perFramePngs[0]!.toString('base64'),
        width: 512,
        height: 512,
        viewFidelity: derivativeReviewFidelity(grid.derivativeReceipts),
      };
    }

    const r = prepareInspectView(root, {
      ...(input.part !== undefined ? { part: input.part } : {}),
      ...(input.view !== undefined ? { view: input.view } : {}),
      ...(input.azimuthDeg !== undefined ? { azimuthDeg: input.azimuthDeg } : {}),
      ...(input.elevationDeg !== undefined ? { elevationDeg: input.elevationDeg } : {}),
      ...(input.zoom !== undefined ? { zoom: input.zoom } : {}),
      ...(input.isolate !== undefined ? { isolate: input.isolate } : {}),
    });
    if (!r.ok) {
      return {
        ok: false,
        view: r.view,
        zoom: r.zoom,
        error: r.error,
        availableParts: r.availableParts,
      };
    }
    const rendered = await renderDerivativeCell(
      {
        root: r.root,
        label: r.part ? `inspect:${r.part}` : 'inspect:whole-asset',
        view: r.viewSpec,
        size: r.size,
        frameBounds: r.frameBounds,
      },
      context,
    );
    const viewFidelity = derivativeReviewFidelity([rendered.receipt]);
    const viewEvidence = viewFidelity
      ? context.viewEvidenceHistory?.record('kiln_inspect', viewFidelity)
      : undefined;
    // Always state the angles, named camera or not, so the model can step from
    // where it actually is instead of guessing the next view by name.
    const from = `the ${r.view} view (azimuth ${r.azimuthDeg}deg, elevation ${r.elevationDeg}deg)`;
    const framed = r.part
      ? `Framed part "${r.part}" (with its descendants) from ${from} at zoom ${r.zoom}.` +
        (r.isolated
          ? ' Everything else is hidden, so nothing in this image occludes it.'
          : ' Surrounding geometry is still drawn and may occlude it.')
      : `Framed the whole asset from ${from}.`;
    return {
      ok: true,
      ...(r.part ? { part: r.part } : {}),
      ...(measurement ? { measurement } : {}),
      view: r.view,
      azimuthDeg: r.azimuthDeg,
      elevationDeg: r.elevationDeg,
      zoom: r.zoom,
      isolated: r.isolated,
      framed,
      width: r.size,
      height: r.size,
      pngBase64: rendered.png.toString('base64'),
      ...(viewFidelity ? { viewFidelity } : {}),
      ...(viewEvidence ? { viewEvidence } : {}),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * The unified-surface close-up tool. Exported separately and intentionally NOT
 * part of `kilnToolRegistry` (the four-tool bench baseline stays unchanged). No
 * host context: it renders pixels only — no validation or category-aware QA.
 * Shares `screenshotMedia` so image transports attach the PNG bytes and strip
 * the base64.
 */
const KILN_INSPECT_DESCRIPTION =
  'ZOOM IN on one part: renders a single 512x512 close-up framed to the named part (the node name ' +
  'you gave createPart, matched case-insensitively with a substring fallback) and its descendants, ' +
  'from one camera. Use it after kiln_render reveals a suspect region — a floating part, a bad ' +
  'joint, a wrong proportion — to see fine detail one grid cell cannot show. args: part (omit to ' +
  'frame the whole asset in one large view), view (front/right/back/left/top/three-quarter, ' +
  'default three-quarter), azimuthDeg + elevationDeg (orbit to ANY angle instead of a named view: ' +
  'azimuth 0 = front, 90 = right, 180 = back, 270 = left; elevation 0 = eye level, positive looks ' +
  'down, clamped to -89..89), zoom (padding multiplier around the part bounds, 1 = tight crop up ' +
  'to 4 = wide context, default 1.2), isolate (hide everything except that part, default false). ' +
  'Reach for the orbit angles when a named view puts the thing you need to judge edge-on or ' +
  'behind something — the reply always tells you the azimuth/elevation it used, so you can step ' +
  'from there. ' +
  'If the part name does not resolve you get the list of available part names back — pick one and ' +
  'retry. By default surrounding geometry stays visible for context and can occlude the part: ' +
  'either pick a different view, or set isolate:true to hide everything else and see the part ' +
  'unobstructed (use it for anything buried inside or behind other geometry). The view is rendered ' +
  'from deterministic derivative GLB bytes; GPU PBR is used only when it can preserve the requested ' +
  'framing, otherwise the GLB-native geometry-flat fallback reports why in viewFidelity. Writes no files.' +
  VIEW_EVIDENCE_GUIDANCE;

/** Create the close-up inspection definition. */
export function createKilnInspectDef(context: KilnToolContext = {}): KilnToolDef {
  const statefulContext = withViewEvidenceHistory(context);
  return {
    name: 'kiln_inspect',
    description: KILN_INSPECT_DESCRIPTION,
    inputSchema: inspectInput,
    run: async (input) =>
      guardCaptureBudget('kiln_inspect', input, statefulContext, () =>
        runInspect(inspectInput.parse(input), statefulContext),
      ),
    media: screenshotMedia,
  };
}

/** Neutral compatibility export. It never reads category from generated source. */
export const kilnInspectDef: KilnToolDef = createKilnInspectDef();

// =============================================================================
// Registry
// =============================================================================

/**
 * Create the four-tool baseline registry with trusted host context captured in
 * every validate/render/view closure. Tool schemas remain byte-for-byte neutral:
 * the model cannot provide or override this context.
 */
// =============================================================================
// kiln_edit — patch an existing program and see the result in one call
// =============================================================================
//
// The refine verb. Authoring a new asset and fixing an existing one are
// different jobs, and until now only the first had a tool: every MCP surface
// took a whole program and rendered it, so "change the wheel radius" meant
// re-emitting the entire file and hoping nothing else moved.
//
// Two decisions in here are worth stating, because the obvious alternatives are
// both wrong.
//
// It is STATELESS. The in-process surface keeps a working buffer across turns,
// and porting that to MCP would have meant session state living in the server
// while the host agent holds the same program on disk -- two copies, no
// reconciliation, and a desync the model cannot see. Over MCP the host owns the
// text, which is the invariant the rest of this transport already keeps. So the
// caller passes the code in and gets the patched code back, and there is exactly
// one copy at every moment.
//
// It is ALL-OR-NOTHING. Edits apply in order against a buffer seeded from
// `code`, and if any one of them fails to match, nothing is returned but the
// error. A partial application would hand back a program in a state the model
// did not ask for and would have to diff against its own intent to discover.
// Failing whole means the retry is the same call with a corrected edit.
//
// The render is folded in for the same reason `kiln_render` collapses metrics
// and views: the loop is edit-then-look, and splitting it across two calls
// doubles the round trips for no gain.
//
// Like `kilnRenderViewsDef`, this sits OUTSIDE `createKilnToolRegistry`. That
// array is the frozen four-tool bench baseline and adding to it would silently
// change what the benchmark measures. The in-process agent does not need this
// def either -- it has a working buffer across turns and its own edit tools, so
// `kiln_edit` is reached through `kilnMcpToolDefs()`, where the host holds the
// program and nothing else does.

const editOperationInput = z.object({
  oldString: z
    .string()
    .describe(
      'The exact text to replace, copied verbatim from the program (including whitespace and ' +
        'indentation, and with no line-number prefixes). Must be unique unless replaceAll is true.',
    ),
  newString: z.string().describe('The replacement text. Use an empty string to delete.'),
  replaceAll: z
    .boolean()
    .optional()
    .describe('Replace every occurrence instead of failing when oldString matches more than once.'),
});

const editInput = z.object({
  code: z.string().describe('The Kiln program to patch. The full current source.'),
  edits: z
    .array(editOperationInput)
    .min(1)
    .max(20)
    .describe(
      'Edits applied in order against the program. If any one fails to match, none are applied ' +
        'and the reply says which. Batch related changes into a single call.',
    ),
  render: z
    .boolean()
    .optional()
    .describe(
      'Render the patched program and return the views (default true). false = patch only.',
    ),
  capture: captureInput,
});

/** Result of one `kiln_edit` call. */
export interface KilnEditResult {
  framesBase64?: string[];
  ok: boolean;
  /** Why the call failed. Present only when ok is false. */
  error?: string;
  /** 1-based index of the edit that failed to apply. */
  failedEdit?: number;
  /** How to fix the failure. */
  hint?: string;
  /** The patched program. Present only when every edit applied. */
  code?: string;
  /** Occurrences replaced, per edit, in the order given. */
  applied?: { occurrences: number }[];
  /** Unified diff from the submitted code to the patched code. */
  diff?: string;
  /** The render of the patched program, when render was not disabled. */
  render?: KilnRenderViewsResult;
  /** Six-view PNG, lifted from the render so transports can attach it as an image. */
  pngBase64?: string;
}

async function runEdit(
  input: z.infer<typeof editInput>,
  context: KilnToolContext,
): Promise<KilnEditResult> {
  const buffer = new KilnDraftBuffer(input.code);
  const applied: { occurrences: number }[] = [];

  for (const [index, edit] of input.edits.entries()) {
    const result = buffer.apply(edit);
    if (!result.ok) {
      return {
        ok: false,
        failedEdit: index + 1,
        error: result.error,
        ...(result.hint ? { hint: result.hint } : {}),
        // No `code`: nothing was applied, so there is no new program to report.
      };
    }
    applied.push({ occurrences: result.occurrences });
  }

  const code = buffer.code;
  const diff = unifiedDiff(input.code, code, {
    fromLabel: 'before',
    toLabel: 'after',
  });

  if (input.render === false) return { ok: true, code, applied, diff };

  const rendered = await runRenderViews(
    { code, ...(input.capture ? { capture: input.capture } : {}) } as z.infer<
      typeof renderViewsInput
    >,
    context,
  );

  // Lift the image to the top level and strip it from the nested result, so the
  // PNG crosses the wire once rather than being carried in both places.
  const { pngBase64, framesBase64, ...renderJson } = rendered as KilnRenderViewsResult & {
    pngBase64?: string;
  };
  return {
    ok: true,
    code,
    applied,
    diff,
    render: renderJson as KilnRenderViewsResult,
    ...(pngBase64 ? { pngBase64 } : {}),
    ...(framesBase64 ? { framesBase64 } : {}),
  };
}

const KILN_EDIT_DESCRIPTION =
  'Patch an EXISTING Kiln program with exact-string replacements and render the result in one ' +
  'call. This is the refine verb: use it to change an asset you already have rather than ' +
  're-emitting the whole file, so every line you did not touch stays byte-for-byte identical and ' +
  'the reply carries a unified diff of what actually changed. Pass the full current source as ' +
  '`code` and one or more { oldString, newString } edits, copied verbatim from that source. ' +
  'Edits apply in order and the call is all-or-nothing: if any oldString does not match, or ' +
  'matches more than once without replaceAll, NOTHING is applied and the reply names the edit ' +
  'that failed -- fix it and call again. The patched program comes back as `code`; write it to ' +
  'your file to keep it. Renders by default, so you see the change immediately; pass ' +
  'render:false to patch without rendering. Writes no files.';

/** Create the refine/edit definition with host-owned QA context. */
export function createKilnEditDef(context: KilnToolContext = {}): KilnToolDef {
  const statefulContext = withViewEvidenceHistory(context);
  return {
    name: 'kiln_edit',
    mediaMulti: screenshotAnimationMediaMulti,
    description: KILN_EDIT_DESCRIPTION,
    inputSchema: editInput,
    run: async (input) =>
      guardCaptureBudget('kiln_edit', input, statefulContext, () =>
        runEdit(editInput.parse(input), statefulContext),
      ),
    media: (output) => {
      const o = output as KilnEditResult | undefined;
      if (!o || typeof o.pngBase64 !== 'string' || o.pngBase64.length === 0) return undefined;
      const { pngBase64: _png, ...json } = o;
      return { png: new Uint8Array(Buffer.from(o.pngBase64, 'base64')), json };
    },
  };
}

/** Neutral compatibility export. */
export const kilnEditDef: KilnToolDef = createKilnEditDef();

export function createKilnToolRegistry(context: KilnToolContext = {}): KilnToolDef[] {
  return [
    {
      name: 'kiln_list_primitives',
      description:
        'List the Kiln sandbox primitives available to generated 3D code: geometry helpers (boxGeo, cylinderXGeo, capsuleGeo, ...), materials (gameMaterial, glassMaterial, ...), structure (createRoot, createPart, createPivot), animation, CSG, arrays, UV, and textures. Call this before writing Kiln code to discover exact signatures and idiomatic usage. Optionally filter by category.',
      inputSchema: listPrimitivesInput,
      run: async (input) => runListPrimitives(listPrimitivesInput.parse(input)),
      // The `primitives` array and `text` carry identical information; the model
      // reads the text. Sending both is what made this call 90 KB.
      text: (output) => (output as { text: string }).text,
    },
    {
      name: 'kiln_validate',
      description:
        'Statically validate Kiln source code before rendering. Checks for the required `meta` const and `build()` function, `value:` keyframe typos, infinite loops, recursive build() calls, and syntax errors. Returns { valid, errors, warnings }. Warnings are advisory only (they never make code invalid). There is NO triangle budget: density is never warned about, so build as much detail as the asset deserves. Run this to catch mistakes cheaply before kiln_render.',
      inputSchema: validateInput,
      run: async (input) => runValidate(validateInput.parse(input), context),
    },
    {
      name: 'kiln_render',
      description:
        'Execute Kiln code and render it to an in-memory GLB, returning geometry metrics: triangle count, mesh count, material count, the world-space bounding box, lowestPart (the mesh touching the lowest point — anything below Y=0 must be intentionally below-grade like earthworks or keels, never wheels/tails/equipment), and an instanceability grade (A–F, informational: how cheap to render at scale — driven by distinct-material count; fewer shared materials grade higher). Includes structural warnings for floating parts and stray planes left at the origin. Use this to confirm a model builds and to inspect its size and structure. Does not write any files.',
      inputSchema: renderInput,
      run: async (input) => runRender(renderInput.parse(input), context),
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
      run: async (input) =>
        guardCaptureBudget('kiln_screenshot', input, context, () =>
          runScreenshot(screenshotInput.parse(input), context),
        ),
      media: screenshotMedia,
    },
  ];
}

/** Neutral compatibility registry. It never reads category from generated source. */
export const kilnToolRegistry: KilnToolDef[] = createKilnToolRegistry();

/** Portable authoring surface. Hosts share a store explicitly; no hidden current program. */
let localCacheScope = 0;
function withBuildCache(context: KilnToolContext): KilnToolContext {
  if (
    context.evaluatorCacheManaged ||
    context.cacheEvaluations === false ||
    (context.evaluatorPort && !context.evaluatorCacheIdentity)
  )
    return context;
  // The implicit identity never leaves this process/registry. Persistent or shared
  // host caches should supply an exact engine/dependency identity explicitly.
  const scope = `kiln-local-registry-${++localCacheScope}`;
  const evaluator = {
    render: (...args: Parameters<import('../evaluator').EvaluatorPortV1['render']>) =>
      resolveEvaluatorPortV1(
        context.evaluatorPort,
        context.evaluatorProfile ?? 'trusted-local',
      ).render(...args),
  };
  return {
    ...context,
    evaluatorPort: createCachedEvaluatorPort(evaluator, {
      cache: context.buildCache ?? new MemoryBuildCache(),
      identity: () => {
        const declared =
          typeof context.evaluatorCacheIdentity === 'function'
            ? context.evaluatorCacheIdentity()
            : context.evaluatorCacheIdentity;
        if (context.evaluatorPort) return declared;
        const env = typeof process === 'undefined' ? {} : process.env;
        return JSON.stringify([
          declared ?? scope,
          env['KILN_QA_MODE'],
          env['KILN_BAKE_OPTIMIZE'],
          env['KILN_BAKE_INSTANCE'],
        ]);
      },
    }),
  };
}

async function guardCaptureBudget(
  name: string,
  input: unknown,
  context: KilnToolContext,
  run: () => Promise<unknown>,
): Promise<unknown> {
  try {
    const { enforceCapturePixels, enforceCaptureBytes } = await import('../views/capture-limits');
    const args = input as {
      capture?: import('../views').CaptureConfig;
      frames?: number;
      frameTimes?: number[];
      render?: boolean;
      shot?: unknown;
    };
    if (name === 'kiln_edit' && args.render === false) return await run();
    let cells = 6,
      size = 384,
      cols = 3,
      compose = true;
    if (name === 'kiln_inspect') {
      cells = 1;
      size = 512;
      cols = 1;
      compose = Boolean(args.shot);
    } else if (name === 'kiln_screenshot_animation') {
      cells = args.frameTimes?.length ?? args.frames ?? 6;
      size = 256;
    } else if (name === 'kiln_view_interior') {
      cells = 3;
      size = 256;
    }
    if (args.capture) {
      if (args.capture.shots) {
        cells = args.capture.shots.length;
        size = args.capture.size ?? 384;
        cols = args.capture.cols ?? Math.min(3, cells);
      } else {
        const { resolveGridCapture } = await import('../views/capture');
        const resolved = resolveGridCapture(args.capture);
        cells = resolved.views.length;
        cols = resolved.cols;
      }
    }
    enforceCapturePixels(cells, size, cols, context.captureLimits, compose);
    const out = await run();
    if (out && typeof out === 'object') {
      const media = out as { pngBase64?: string; framesBase64?: string[] };
      const encoded = media.framesBase64 ?? (media.pngBase64 ? [media.pngBase64] : []);
      enforceCaptureBytes(
        encoded.map((value) => Buffer.from(value, 'base64')),
        context.captureLimits,
      );
    }
    return out;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function withCaptureCache(context: KilnToolContext): KilnToolContext {
  if (context.cacheCaptures === false) return { ...context, captureCache: undefined };
  const cache = context.captureCache ?? new MemoryCaptureCache();
  const identity = () =>
    typeof context.captureCacheIdentity === 'function'
      ? context.captureCacheIdentity()
      : context.captureCacheIdentity;
  return {
    ...context,
    captureCache: cache,
    ...(context.viewRenderPort && context.captureCacheIdentity
      ? { viewRenderPort: createCachedRenderPort(context.viewRenderPort, { cache, identity }) }
      : {}),
  };
}

export function createKilnProgramToolRegistry(
  suppliedContext: KilnToolContext = {},
): KilnToolDef[] {
  const context = withCaptureCache(withBuildCache(suppliedContext));
  const store = context.programStore ?? new MemoryProgramStore();
  const baseline = createKilnToolRegistry(context);
  return [
    createKilnDiscoveryDef({ ...suppliedContext, programStore: store }),
    ...[
      baseline.find((d) => d.name === 'kiln_validate')!,
      createKilnRenderViewsDef(context),
      createKilnScreenshotAnimationDef(context),
      createKilnViewInteriorDef(context),
      createKilnInspectDef(context),
      createKilnEditDef(context),
    ].map((def) => withProgramReferences(def, store)),
    createKilnSourceDef(store),
  ];
}
