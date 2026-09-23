import { DEFAULT_VIEW_RENDER_TIMEOUT_MS, captureViewsViaPort, sha256Bytes } from '../views/port';
/**
 * `generateKilnAsset` — the core-owned "agent loop + render" engine.
 *
 * Resolve a model id to a Strands Model, run the shared reference tools, and
 * deliver the exact artifact selected by kiln_finish. No second evaluation or
 * post-finish repair occurs. CLI/MCP authoring tools do not require this harness.
 *
 * Promoted from Kiln Studio's in-process generator so CLI / batch / server share
 * one engine instead of each re-implementing buildModel -> runKilnAgent ->
 * renderGLB. Lives on the strands-isolated `kiln/agent` subpath; consumers in the
 * non-agent `kiln` module must import it lazily (dynamic `import()`), so the
 * `@strands-agents/sdk` dependency never enters the browser/editor bundle graph.
 */
import type { KilnCodeMeta, RenderResult } from '../render';
import type { EvaluatorExecutionProfileV2, EvaluatorPortV2 } from '../evaluator';
import type { PbrRenderPort, ViewFidelityV1 } from '../composer/render-port';
import {
  CaptureConfigError,
  resolveGridCapture,
  type CaptureConfig,
  type CaptureShape,
} from '../views/capture';
import type { AssetStyle } from '../authoring-style';
import type { AssetCategory, AssetIntentV1 } from '../contracts';
import { runKilnAgent, type RefineMode, type KilnKnowhow, type KilnInputImage } from './run';
import {
  makeKilnModel,
  resolveKilnAgentModel,
  type KilnAgentProvider,
  type KilnModelDescriptor,
} from './providers';
import type { EditRecord } from './tools';
import type { RunKilnAgentOptions } from './run';
import { assertNoLegacyRuntimePolicy, resolveRequirementsContext } from '../requirements-context';
import type { RequirementsBinding } from '../requirements-store';
import type { AgentUsage } from './hooks';
import {
  resolveViewRenderTimeoutMs,
  type ViewRenderTimeoutContextProvider,
  type ViewRenderTimeoutResolver,
} from './view-render-timeout';

/**
 * Existing default model route. A per-run `model` or KILN_MODEL overrides it;
 * provider qualification and comparative quality are separate from this default.
 */
export const DEFAULT_KILN_AGENT_MODEL = 'google:gemini-3.5-flash';

export interface GenerateKilnAssetOptions extends Omit<RunKilnAgentOptions, 'model'> {
  /** In-loop deadline; independent of viewRenderTimeoutMs for the final sheet. */
  inLoopViewRenderTimeoutMs?: number;
  /** Natural-language description of the asset to build. */
  prompt: string;
  /** Model id (registry-style `google:gemini-3.5-flash` or bare). Defaults to {@link DEFAULT_KILN_AGENT_MODEL}. */
  model?: string;
  /** BYOK / shared key override; falls back to provider env vars. */
  apiKey?: string;
  /** Rejection-only migration field. Use host-bound requirements; no category default exists. */
  category?: AssetCategory;
  /** Rejection-only migration field. Convert legacy intent explicitly before execution. */
  intent?: AssetIntentV1;
  /** Optional style template (low-poly / stylized / voxel / detailed / realistic). */
  style?: AssetStyle;
  /** Ask the model for an animate() function too. Default false (static). */
  includeAnimation?: boolean;
  /** Compact native bootstrap (default), optionally augmented by current AgentSkills. */
  knowhow?: KilnKnowhow;
  /** Absolute path to a SKILL.md dir, required when knowhow='skill'. */
  skillDir?: string;
  /** Refine: existing Kiln program to edit (frames the run as a refine). */
  existingCode?: string;
  /** The asset's original generation prompt, surfaced as "## Original Request" when refining. */
  originalPrompt?: string;
  /** How a refine applies its change ('rewrite' default, 'edit' surgical). Only with existingCode. */
  refineMode?: RefineMode;
  /** Agent name (for tracing). */
  agentName?: string;
  /** Also rasterize the final asset into the six-view grid PNG (`result.views`).
   *  Best-effort: a views failure never fails the run. Default false. */
  captureViews?: boolean;
  /** Grid shape / per-cell cameras for the `views` artifact (T3.3). Honoured
   *  identically by the GPU port and the CPU rasterizer. Omitted keeps the
   *  shipped six-view 3x2. An invalid config degrades to that default with a
   *  warning rather than failing the run. */
  capture?: CaptureConfig;
  /** OPTIONAL host PBR renderer (GLB bytes -> per-view PNGs). Only consulted when
   *  `captureViews` is on: the already-produced GLB bytes are routed to the port
   *  and its per-view PNGs are composited into the same 3x2 grid the CPU path
   *  emits. ANY failure/timeout degrades to the CPU rasterizer (never fails the
   *  run; see `renderDegraded`). Absent = byte-identical CPU behavior. */
  viewRenderPort?: PbrRenderPort;
  /** Deadline for one `viewRenderPort` call in ms. Default 8000. */
  viewRenderTimeoutMs?: number;
  /** Dynamic host warm-up/deadline/budget state, sampled for the final request. */
  viewRenderTimeoutContext?: ViewRenderTimeoutContextProvider;
  /** Host policy for deriving the final request deadline from that state. */
  viewRenderTimeoutResolver?: ViewRenderTimeoutResolver;
  /** Style anchor: a complete Kiln program rendered as "## Reference Asset" for
   *  FRESH generation (ignored on refine). ~5-15k input tokens/run, mostly
   *  absorbed by prompt caching when reused across a batch. */
  exemplarCode?: string;
  /** Optional reference image fed to the model as multimodal context (fresh gen + refine). */
  inputImage?: KilnInputImage;
  /** Generated-source execution boundary. Production must inject the port and
   * select `evaluator-required`; trusted local/test remains compatible. */
  evaluatorPort?: EvaluatorPortV2;
  evaluatorProfile?: EvaluatorExecutionProfileV2;
}

export interface GenerateKilnAssetResult {
  completion: 'finished' | 'partial';
  stopReason?: import('./run').RunKilnAgentResult['stopReason'];
  programRef: string;
  requirements: RenderResult['requirements'];
  qaReport: RenderResult['meta']['qaReport'];
  /** The final Kiln program. */
  code: string;
  /** Rendered GLB, ready to write to disk. */
  glb: Buffer;
  /** SHA-256 identity of the exact returned GLB bytes. */
  artifactGlbSha256: `sha256:${string}`;
  /** Extracted from the code's `const meta = {...}` block, plus `tris` + `primitiveUsage`. */
  meta: KilnCodeMeta;
  /** Non-fatal issues (structural warnings, animation target missing). */
  warnings: string[];
  /** Every tool the model called, in order (proof the loop ran). */
  toolCalls: string[];
  /** Number of model calls (agent-loop iterations). */
  steps: number;
  /** Best-effort token usage. */
  usage?: AgentUsage;
  /** Resolved Strands provider (for honest provenance). */
  provider: KilnAgentProvider;
  /** Resolved concrete model id (for honest provenance). */
  model: string;
  /** Edit-mode refine: the applied surgical edits in order. */
  edits?: EditRecord[];
  /** Edit-mode refine: a unified diff from the parent code to the final buffer. */
  diff?: string;
  /** Set when the program is a salvaged best effort rather than a clean
   *  finalize: 'step-cap' or 'error' (H-10; see RunKilnAgentResult.salvaged). */
  salvaged?: 'step-cap' | 'error';
  /** The original agent-loop failure when `salvaged === 'error'`. */
  salvageError?: string;
  /** Six-view grid PNG of the final asset (only when `captureViews` was set and the render succeeded). */
  views?: Buffer;
  /** The layout `views` was actually produced in — preset, columns, cell count.
   *  Present whenever `views` is, and identical whichever producer made it, so a
   *  consumer never has to infer the grid shape from the image dimensions. */
  viewsCapture?: CaptureShape;
  /** Honest producer of `views` (only when `viewRenderPort` was supplied): the
   *  port's rendererId on success, else the CPU rasterizer's deterministic id. */
  viewsRendererId?: string;
  /** Only when `viewRenderPort` was supplied: false when the port produced the
   *  views, true when the run fell back to the CPU rasterizer. */
  renderDegraded?: boolean;
  /** Why the port was bypassed (rejection, ok:false, timeout, bad PNGs). */
  renderDegradedReason?: string;
  /** Material fidelity and exact-byte relationship of the final view sheet. */
  viewsFidelity?: ViewFidelityV1;
  /** Automatic trusted character skeleton/motion captures, when applicable. */
  diagnosticViews?: NonNullable<RenderResult['diagnosticViews']>;
  materialRecipeApplications?: NonNullable<RenderResult['materialRecipeApplications']>;
  materialResourceProvenance?: NonNullable<RenderResult['materialResourceProvenance']>;
  bakedTextures?: NonNullable<RenderResult['bakedTextures']>;
  materialMetrics?: NonNullable<RenderResult['materialMetrics']>;
  integrationManifest: RenderResult['integrationManifest'];
}

/**
 * CODE-ONLY agent generation — the agent tool loop without the final GLB
 * render. The retirement bridge for the legacy `generateKilnCode` fork:
 * `kiln/generate.ts` lazy-imports this when the codegen mode is 'agent', so
 * the editor server route and `editKilnCode` ride the Strands loop with zero
 * route changes (they render separately, exactly as they did with the
 * single-shot emitter). Returns the same success/error shape that path expects.
 */
export async function generateKilnCodeAgent(opts: {
  prompt: string;
  requirements?: RequirementsBinding;
  category?: AssetCategory;
  intent?: AssetIntentV1;
  style?: AssetStyle;
  includeAnimation?: boolean;
  existingCode?: string;
  originalPrompt?: string;
  /** Optional reference image fed to the model as multimodal context. */
  inputImage?: KilnInputImage;
  /** Strands model id; defaults like {@link generateKilnAsset}. */
  model?: string;
  evaluatorPort?: EvaluatorPortV2;
  evaluatorProfile?: EvaluatorExecutionProfileV2;
}): Promise<{
  success: boolean;
  code?: string;
  usage?: { inputTokens: number; outputTokens: number };
  error?: string;
  provider?: KilnAgentProvider;
  model?: string;
}> {
  assertNoLegacyRuntimePolicy(opts);
  const active = resolveRequirementsContext(opts.requirements);
  const modelId = opts.model ?? process.env['KILN_MODEL'] ?? DEFAULT_KILN_AGENT_MODEL;
  if (process.env['PIXEL_FORGE_MODEL'] !== undefined)
    throw new Error('PIXEL_FORGE_MODEL was removed. Set KILN_MODEL or pass model explicitly.');
  const desc = resolveKilnAgentModel(modelId);
  const model = await makeKilnModel(desc);
  const agent = await runKilnAgent({ ...opts, model, requirements: active.binding });

  if (agent.completion !== 'finished' || !agent.code) {
    return { success: false, error: agent.error ?? 'agent produced no code' };
  }
  return {
    success: true,
    code: agent.code,
    usage: {
      inputTokens: agent.usage?.inputTokens ?? 0,
      outputTokens: agent.usage?.outputTokens ?? 0,
    },
    provider: desc.provider,
    model: desc.model,
  };
}

export {
  DEFAULT_VIEW_RENDER_TIMEOUT_MS,
  captureViewPngsViaPort,
  captureViewsViaPort,
} from '../views/port';
export type { PortViewPngsOutcome, PortViewsOutcome } from '../views/port';

/**
 * Run one Kiln agent generation end-to-end: model -> tool loop -> GLB render.
 * Throws on a hard failure (agent error / no code / render failure); non-fatal
 * issues surface via `warnings`.
 */
export async function generateKilnAsset(
  opts: GenerateKilnAssetOptions,
): Promise<GenerateKilnAssetResult> {
  assertNoLegacyRuntimePolicy(opts);
  const active = resolveRequirementsContext(opts.requirements);
  if (process.env['PIXEL_FORGE_MODEL'] !== undefined)
    throw new Error('PIXEL_FORGE_MODEL was removed. Set KILN_MODEL or pass model explicitly.');
  const modelId = opts.model ?? process.env['KILN_MODEL'] ?? DEFAULT_KILN_AGENT_MODEL;
  const desc: KilnModelDescriptor = resolveKilnAgentModel(modelId);
  const model = await makeKilnModel(desc, opts.apiKey ? { apiKey: opts.apiKey } : {});
  const agent = await runKilnAgent({
    ...opts,
    model,
    requirements: active.binding,
    viewRenderTimeoutMs: opts.inLoopViewRenderTimeoutMs,
  });
  if (
    !agent.code ||
    !agent.artifact ||
    (agent.completion !== 'finished' && agent.completion !== 'partial')
  ) {
    throw new Error(
      `Kiln agent generation failed: ${agent.error ?? 'agent produced no code or reviewed artifact'}`,
    );
  }
  // Completion is a selection of already evaluated bytes. Never run a hidden
  // optimization or a second source evaluation after the model reviewed them.
  const render = agent.artifact.rendered;

  // Best-effort views artifact: what the vision loop / review UIs show.
  // Never fails the run — a rasterizer error just drops the sidecar.
  let views: Buffer | undefined;
  let viewsCapture: CaptureShape | undefined;
  let viewsRendererId: string | undefined;
  let renderDegraded: boolean | undefined;
  let renderDegradedReason: string | undefined;
  let viewsFidelity: ViewFidelityV1 | undefined;
  const captureWarnings: string[] = [];
  if (opts.captureViews) {
    const viewRenderPort = opts.viewRenderState
      ? opts.viewRenderState().viewRenderPort
      : opts.viewRenderPort;
    const inputGlbSha256 = await sha256Bytes(render.glb);
    // T3.3: validate the requested layout ONCE, up front. A malformed config is
    // a caller bug, not a render hazard, so it must not reach two producers and
    // be reported differently by each. It also must not fail the run: the views
    // artifact is best-effort by contract, so a bad config degrades to the
    // shipped default and says so in `warnings`.
    let capture = opts.capture ?? agent.captureSelection?.capture;
    if (capture) {
      try {
        resolveGridCapture(capture, process.env['KILN_GRID_VARIANT']);
      } catch (err) {
        if (!(err instanceof CaptureConfigError)) throw err;
        captureWarnings.push(
          `views capture config ignored (using the default grid): ${err.message}`,
        );
        capture = undefined;
      }
    }

    // B3b: an injected host PBR renderer sees the already-produced GLB bytes
    // (never re-executes the program). B4: ANY port failure degrades to the CPU
    // rasterizer below — the GPU being unavailable can never fail a generation.
    if (viewRenderPort) {
      const port = await captureViewsViaPort(
        viewRenderPort,
        render.glb,
        resolveViewRenderTimeoutMs({
          requestKind: 'final-grid',
          defaultTimeoutMs: DEFAULT_VIEW_RENDER_TIMEOUT_MS,
          ...(opts.viewRenderTimeoutMs !== undefined
            ? { timeoutMs: opts.viewRenderTimeoutMs }
            : {}),
          ...(opts.viewRenderTimeoutContext
            ? { contextProvider: opts.viewRenderTimeoutContext }
            : {}),
          ...(opts.viewRenderTimeoutResolver ? { resolver: opts.viewRenderTimeoutResolver } : {}),
        }),
        capture,
      );
      if (port.ok) {
        views = port.png;
        viewsCapture = port.capture;
        viewsRendererId = port.rendererId;
        renderDegraded = false;
        viewsFidelity = {
          version: 'kiln.view-fidelity.v1',
          requested: 'full-preferred',
          delivered: 'full-material',
          materialFaithful: true,
          exactArtifact: true,
          rendererId: port.rendererId,
          inputGlbSha256,
          degraded: false,
        };
      } else {
        renderDegraded = true;
        renderDegradedReason = port.reason;
      }
    }
    if (!views) {
      try {
        // Keep the renderer id on this same lazy entrypoint. renderer-id.ts reads
        // package metadata at module initialization; an eager import changes the
        // production agent boot graph even when no CPU fallback is needed.
        const { renderGlbViewGrid, CPU_RASTER_RENDERER_ID } = await import('../views');
        // The degrade path must reproduce the SAME layout the port was asked
        // for, or a GPU outage silently reshapes the artifact.
        // R2.11: parse the exact final artifact. Generated source has already
        // been executed once to produce render.glb and is never run again here.
        const grid = await renderGlbViewGrid(render.glb, capture ? { capture } : {});
        if (grid.inputGlbSha256 !== inputGlbSha256) {
          throw new Error(
            `GLB-native fallback hash mismatch (${grid.inputGlbSha256} != ${inputGlbSha256})`,
          );
        }
        views = grid.png;
        viewsCapture = grid.capture;
        // Honest producer provenance, but only on the port-enabled path — the
        // port-absent path stays byte-identical to the historical result shape.
        if (viewRenderPort) viewsRendererId = CPU_RASTER_RENDERER_ID;
        const degradeReason =
          renderDegradedReason ?? 'material-faithful view render port unavailable';
        viewsFidelity = {
          version: 'kiln.view-fidelity.v1',
          requested: 'full-preferred',
          delivered: 'geometry-flat',
          materialFaithful: false,
          exactArtifact: true,
          rendererId: CPU_RASTER_RENDERER_ID,
          inputGlbSha256: grid.inputGlbSha256,
          degraded: true,
          degradeReason,
          reasonCodes: ['FULL_MATERIAL_RENDER_UNAVAILABLE', ...grid.reasonCodes],
        };
      } catch (error) {
        views = undefined;
        viewsCapture = undefined;
        const reasonCode =
          error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
            ? error.code
            : undefined;
        viewsFidelity = {
          version: 'kiln.view-fidelity.v1',
          requested: 'full-preferred',
          delivered: 'none',
          materialFaithful: false,
          exactArtifact: false,
          rendererId: 'none',
          inputGlbSha256,
          degraded: true,
          degradeReason:
            renderDegradedReason ??
            `material-faithful and geometry fallback renders unavailable${error instanceof Error ? `: ${error.message}` : ''}`,
          reasonCodes: [
            'FULL_MATERIAL_RENDER_UNAVAILABLE',
            ...(reasonCode ? [reasonCode] : []),
          ] as ViewFidelityV1['reasonCodes'],
        };
      }
    }
  }

  const warnings = [...(render.warnings ?? []), ...captureWarnings];
  if (agent.salvaged) {
    warnings.push(
      agent.salvaged === 'error'
        ? `salvaged best effort: agent loop threw (${agent.error ?? 'unknown error'}) but the sink held a renderable program`
        : 'salvaged best effort: agent hit the step cap with a renderable program in the sink',
    );
  }

  return {
    completion: agent.completion,
    ...(agent.stopReason ? { stopReason: agent.stopReason } : {}),
    programRef: agent.artifact.programRef,
    requirements: render.requirements,
    qaReport: render.meta.qaReport,
    code: agent.code,
    glb: render.glb,
    artifactGlbSha256: render.artifactGlbSha256,
    meta: render.meta,
    warnings,
    toolCalls: agent.toolCalls,
    steps: agent.steps,
    ...(agent.usage ? { usage: agent.usage } : {}),
    provider: desc.provider,
    model: desc.model,
    ...(agent.edits ? { edits: agent.edits } : {}),
    ...(agent.diff ? { diff: agent.diff } : {}),
    ...(agent.salvaged ? { salvaged: agent.salvaged } : {}),
    ...(agent.salvaged && agent.error ? { salvageError: agent.error } : {}),
    ...(views ? { views } : {}),
    ...(views && viewsCapture ? { viewsCapture } : {}),
    ...(viewsRendererId ? { viewsRendererId } : {}),
    ...(renderDegraded !== undefined ? { renderDegraded } : {}),
    ...(renderDegradedReason ? { renderDegradedReason } : {}),
    ...(viewsFidelity ? { viewsFidelity } : {}),
    ...(render.diagnosticViews ? { diagnosticViews: render.diagnosticViews } : {}),
    ...(render.materialRecipeApplications
      ? { materialRecipeApplications: render.materialRecipeApplications }
      : {}),
    ...(render.materialResourceProvenance
      ? { materialResourceProvenance: render.materialResourceProvenance }
      : {}),
    ...(render.bakedTextures ? { bakedTextures: render.bakedTextures } : {}),
    ...(render.materialMetrics ? { materialMetrics: render.materialMetrics } : {}),
    integrationManifest: render.integrationManifest,
  };
}
