/**
 * `generateKilnAsset` — the core-owned "agent loop + render" engine.
 *
 * Resolve a model id -> Strands `Model` -> drive the kiln tool loop
 * (`runKilnAgent`: list_primitives / validate / render / submit, self-correcting
 * on real render metrics) -> render the submitted program to GLB bytes. This is
 * the DEFAULT codegen path for `kiln.generate()` (primitives), the CLI / MCP
 * (runs), and the batch harness — the legacy single-shot paths stay reachable via
 * `KILN_CODEGEN=single-shot`.
 *
 * Promoted from Kiln Studio's in-process generator so CLI / batch / server share
 * one engine instead of each re-implementing buildModel -> runKilnAgent ->
 * renderGLB. Lives on the strands-isolated `kiln/agent` subpath; consumers in the
 * non-agent `kiln` module must import it lazily (dynamic `import()`), so the
 * `@strands-agents/sdk` dependency never enters the browser/editor bundle graph.
 */
import { renderGLB, type KilnCodeMeta, type RenderResult } from '../render';
import type { PbrRenderPort, ViewFidelityV1 } from '../composer/render-port';
import {
  CaptureConfigError,
  resolveGridCapture,
  type CaptureConfig,
  type CaptureShape,
  type ResolvedCapture,
} from '../views/capture';
import { compositeViewPngGrid } from '../views/grid';
import type { AssetStyle } from '../prompt';
import { createAssetIntentV1, type AssetCategory, type AssetIntentV1 } from '../contracts';
import { runKilnAgent, type RefineMode, type KilnKnowhow, type KilnInputImage } from './run';
import {
  makeKilnModel,
  resolveKilnAgentModel,
  type KilnAgentProvider,
  type KilnModelDescriptor,
} from './providers';
import type { EditRecord } from './tools';
import type { AgentUsage } from './hooks';

/**
 * The hardcoded default Kiln agent model — the verified standout for GLB codegen.
 * A per-run `model` opt, or `KILN_MODEL` / `PIXEL_FORGE_MODEL` in the env (both
 * read at call time, not import time), overrides it.
 */
export const DEFAULT_KILN_AGENT_MODEL = 'google:gemini-3.5-flash';

export interface GenerateKilnAssetOptions {
  /** Natural-language description of the asset to build. */
  prompt: string;
  /** Model id (registry-style `google:gemini-3.5-flash` or bare). Defaults to {@link DEFAULT_KILN_AGENT_MODEL}. */
  model?: string;
  /** BYOK / shared key override; falls back to provider env vars. */
  apiKey?: string;
  /** Asset category (drives prompt framing). Default 'prop'. */
  category?: AssetCategory;
  /** Full closure-owned intent. Authoritative over category when supplied. */
  intent?: AssetIntentV1;
  /** Optional style template (low-poly / stylized / voxel / detailed / realistic). */
  style?: AssetStyle;
  /** Ask the model for an animate() function too. Default false (static). */
  includeAnimation?: boolean;
  /** Know-how source: inline system prompt (default) or the kiln-glb skill. */
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
  /** Style anchor: a complete Kiln program rendered as "## Reference Asset" for
   *  FRESH generation (ignored on refine). ~5-15k input tokens/run, mostly
   *  absorbed by prompt caching when reused across a batch. */
  exemplarCode?: string;
  /** Optional reference image fed to the model as multimodal context (fresh gen + refine). */
  inputImage?: KilnInputImage;
}

export interface GenerateKilnAssetResult {
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
}): Promise<{
  success: boolean;
  code?: string;
  usage?: { inputTokens: number; outputTokens: number };
  error?: string;
  provider?: KilnAgentProvider;
  model?: string;
}> {
  const modelId =
    opts.model ??
    process.env['KILN_MODEL'] ??
    process.env['PIXEL_FORGE_MODEL'] ??
    DEFAULT_KILN_AGENT_MODEL;
  const desc = resolveKilnAgentModel(modelId);
  const model = makeKilnModel(desc);
  const intent = opts.intent ?? createAssetIntentV1({ category: opts.category ?? 'prop' });

  const agent = await runKilnAgent({
    model,
    prompt: opts.prompt,
    category: intent.category,
    intent,
    includeAnimation: opts.includeAnimation ?? false,
    ...(opts.style ? { style: opts.style } : {}),
    ...(opts.existingCode ? { existingCode: opts.existingCode } : {}),
    ...(opts.originalPrompt ? { originalPrompt: opts.originalPrompt } : {}),
    ...(opts.inputImage ? { inputImage: opts.inputImage } : {}),
  });

  if (agent.error || !agent.code) {
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

export const DEFAULT_VIEW_RENDER_TIMEOUT_MS = 8000;

async function sha256Bytes(bytes: Uint8Array): Promise<`sha256:${string}`> {
  const input = new Uint8Array(bytes.byteLength);
  input.set(bytes);
  const digest = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', input));
  return `sha256:${[...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

export type PortViewsOutcome =
  | {
      ok: true;
      png: Buffer;
      rendererId: string;
      capture: CaptureShape;
      /** Pixel dimensions of the composited grid — the same `width`/`height` the
       *  CPU path reports alongside its grid, additive here so a caller never has
       *  to decode the PNG to learn them. */
      width: number;
      height: number;
    }
  | { ok: false; reason: string };

/**
 * Call the host view-render port with the ALREADY-PRODUCED GLB bytes and
 * composite its per-view PNGs into the same grid the CPU path emits.
 *
 * This shell is NOT a render compute path: the deadline is a plain timer (no
 * Date.now() enters any rasterizer), and every failure mode — thrown/rejected
 * port, ok:false, timeout, missing rendererId, undecodable or mismatched PNGs —
 * returns `{ ok: false, reason }` so the caller degrades to the CPU rasterizer
 * instead of failing the generation.
 *
 * Exported as the single owner of the degrade policy: hosts that assemble their
 * own generation pipeline (rather than calling generateKilnAsset) route their
 * produced GLB through this same shell instead of re-implementing it.
 *
 * T3.3: `capture` selects the grid shape and per-cell cameras, resolved through
 * the SAME {@link resolveGridCapture} the CPU rasterizer uses so both producers
 * lay out identically. Omitted keeps the shipped six-view 3x2 (H-33 env variant
 * included).
 */
export async function captureViewsViaPort(
  port: PbrRenderPort,
  glb: Buffer | Uint8Array,
  timeoutMs: number = DEFAULT_VIEW_RENDER_TIMEOUT_MS,
  capture?: CaptureConfig,
): Promise<PortViewsOutcome> {
  let resolved: ResolvedCapture;
  try {
    resolved = resolveGridCapture(capture, process.env['KILN_GRID_VARIANT']);
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
  const views = resolved.views;
  const shape: CaptureShape = { preset: resolved.preset, cols: resolved.cols, cells: views.length };

  // Per-cell zoom has no equivalent in the port contract: the request carries
  // view directions only, and the host frames each view to the asset's own
  // bounds. Rather than silently returning auto-framed cells for a request that
  // asked for tighter ones, decline and let the CPU rasterizer — which does
  // implement zoom — produce the sheet that was actually asked for.
  if (resolved.zooms.some((z) => z !== undefined)) {
    return {
      ok: false,
      reason: 'per-cell zoom is not supported by the view render port',
    };
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`view render port timed out after ${timeoutMs}ms`)),
        timeoutMs,
      );
    });
    const result = await Promise.race([
      port({
        // Copy, not alias: a buggy port implementation must not be able to
        // mutate the render.glb bytes returned as the generation artifact.
        glb: Uint8Array.from(glb),
        viewDirs: views.map((v) => [...v.dir] as [number, number, number]),
        size: 384,
      }),
      deadline,
    ]);
    if (!result?.ok) {
      return { ok: false, reason: result?.error ?? 'view render port returned ok: false' };
    }
    if (typeof result.rendererId !== 'string' || !result.rendererId.trim()) {
      return { ok: false, reason: 'view render port returned no rendererId' };
    }
    // Count must equal the cells that were REQUESTED — not a hardcoded six.
    // A host that truncates or pads the view list produces a differently-shaped
    // sheet than the caller asked for, which is a degrade, not a success.
    if (!result.viewsPng || result.viewsPng.length !== views.length) {
      return {
        ok: false,
        reason: `view render port returned ${result.viewsPng?.length ?? 0} view PNGs, expected ${views.length}`,
      };
    }
    // Annotated with the SAME cell labels + gnomon the CPU path stamps. A host
    // returns pixels and knows nothing of the Kiln camera vocabulary, so
    // without this the GPU sheet arrives unlabelled and the model quietly loses
    // its orientation cues on the one path that cannot tell it happened.
    // Degrade stays reportable through `renderDegraded` / `viewsRendererId`,
    // which is a structured field rather than a visual tell.
    const grid = compositeViewPngGrid(result.viewsPng, resolved.cols, views);
    return {
      ok: true,
      png: grid.png,
      rendererId: result.rendererId,
      capture: shape,
      width: grid.width,
      height: grid.height,
    };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/**
 * Run one Kiln agent generation end-to-end: model -> tool loop -> GLB render.
 * Throws on a hard failure (agent error / no code / render failure); non-fatal
 * issues surface via `warnings`.
 */
export async function generateKilnAsset(
  opts: GenerateKilnAssetOptions,
): Promise<GenerateKilnAssetResult> {
  const modelId =
    opts.model ??
    process.env['KILN_MODEL'] ??
    process.env['PIXEL_FORGE_MODEL'] ??
    DEFAULT_KILN_AGENT_MODEL;
  const desc: KilnModelDescriptor = resolveKilnAgentModel(modelId);
  const model = makeKilnModel(desc, opts.apiKey ? { apiKey: opts.apiKey } : {});
  const intent = opts.intent ?? createAssetIntentV1({ category: opts.category ?? 'prop' });

  const agent = await runKilnAgent({
    model,
    prompt: opts.prompt,
    category: intent.category,
    intent,
    knowhow: opts.knowhow ?? 'inline',
    includeAnimation: opts.includeAnimation ?? false,
    ...(opts.style ? { style: opts.style } : {}),
    ...(opts.skillDir ? { skillDir: opts.skillDir } : {}),
    ...(opts.existingCode ? { existingCode: opts.existingCode } : {}),
    ...(opts.originalPrompt ? { originalPrompt: opts.originalPrompt } : {}),
    ...(opts.existingCode && opts.refineMode ? { refineMode: opts.refineMode } : {}),
    ...(opts.agentName ? { agentName: opts.agentName } : {}),
    ...(opts.exemplarCode ? { exemplarCode: opts.exemplarCode } : {}),
    ...(opts.inputImage ? { inputImage: opts.inputImage } : {}),
  });

  // A salvaged run carries BOTH code and the original error (H-10) — only a
  // run with no renderable program (or an unsalvaged failure) is fatal.
  if (!agent.code || (agent.error && !agent.salvaged)) {
    throw new Error(`Kiln agent generation failed: ${agent.error ?? 'agent produced no code'}`);
  }

  // Grade-aware consolidation by default: lifts material-sprawl heroes from
  // grade C/D/F to A/B, byte-stable on already-lean assets (M1a, plan/05 §3.1).
  const render = await renderGLB(agent.code, { optimize: 'auto', intent });

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
    const inputGlbSha256 = await sha256Bytes(render.glb);
    // T3.3: validate the requested layout ONCE, up front. A malformed config is
    // a caller bug, not a render hazard, so it must not reach two producers and
    // be reported differently by each. It also must not fail the run: the views
    // artifact is best-effort by contract, so a bad config degrades to the
    // shipped default and says so in `warnings`.
    let capture = opts.capture;
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
    if (opts.viewRenderPort) {
      const port = await captureViewsViaPort(
        opts.viewRenderPort,
        render.glb,
        opts.viewRenderTimeoutMs ?? DEFAULT_VIEW_RENDER_TIMEOUT_MS,
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
        const { renderCodeViewGrid, CPU_RASTER_RENDERER_ID } = await import('../views');
        // The degrade path must reproduce the SAME layout the port was asked
        // for, or a GPU outage silently reshapes the artifact.
        const grid = await renderCodeViewGrid(agent.code, capture ? { capture } : {});
        views = grid.png;
        viewsCapture = grid.capture;
        // Honest producer provenance, but only on the port-enabled path — the
        // port-absent path stays byte-identical to the historical result shape.
        if (opts.viewRenderPort) viewsRendererId = CPU_RASTER_RENDERER_ID;
        const degradeReason =
          renderDegradedReason ?? 'material-faithful view render port unavailable';
        viewsFidelity = {
          version: 'kiln.view-fidelity.v1',
          requested: 'full-preferred',
          delivered: 'geometry-flat',
          materialFaithful: false,
          // The current CPU path re-executes source. R2.11 replaces it with a
          // GLB-native fallback; until then it cannot claim exact-artifact.
          exactArtifact: false,
          rendererId: CPU_RASTER_RENDERER_ID,
          inputGlbSha256,
          degraded: true,
          degradeReason,
        };
      } catch {
        views = undefined;
        viewsCapture = undefined;
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
            renderDegradedReason ?? 'material-faithful and geometry fallback renders unavailable',
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
