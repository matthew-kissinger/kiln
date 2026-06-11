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
import { renderGLB, type KilnCodeMeta } from '../render';
import type { AssetCategory, AssetStyle } from '../prompt';
import { runKilnAgent, type RefineMode, type KilnKnowhow } from './run';
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
  /** Style anchor: a complete Kiln program rendered as "## Reference Asset" for
   *  FRESH generation (ignored on refine). ~5-15k input tokens/run, mostly
   *  absorbed by prompt caching when reused across a batch. */
  exemplarCode?: string;
}

export interface GenerateKilnAssetResult {
  /** The final Kiln program. */
  code: string;
  /** Rendered GLB, ready to write to disk. */
  glb: Buffer;
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
  /** Six-view grid PNG of the final asset (only when `captureViews` was set and the render succeeded). */
  views?: Buffer;
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
  style?: AssetStyle;
  includeAnimation?: boolean;
  existingCode?: string;
  originalPrompt?: string;
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

  const agent = await runKilnAgent({
    model,
    prompt: opts.prompt,
    category: opts.category ?? 'prop',
    includeAnimation: opts.includeAnimation ?? false,
    ...(opts.style ? { style: opts.style } : {}),
    ...(opts.existingCode ? { existingCode: opts.existingCode } : {}),
    ...(opts.originalPrompt ? { originalPrompt: opts.originalPrompt } : {}),
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

  const agent = await runKilnAgent({
    model,
    prompt: opts.prompt,
    category: opts.category ?? 'prop',
    knowhow: opts.knowhow ?? 'inline',
    includeAnimation: opts.includeAnimation ?? false,
    ...(opts.style ? { style: opts.style } : {}),
    ...(opts.skillDir ? { skillDir: opts.skillDir } : {}),
    ...(opts.existingCode ? { existingCode: opts.existingCode } : {}),
    ...(opts.originalPrompt ? { originalPrompt: opts.originalPrompt } : {}),
    ...(opts.existingCode && opts.refineMode ? { refineMode: opts.refineMode } : {}),
    ...(opts.agentName ? { agentName: opts.agentName } : {}),
    ...(opts.exemplarCode ? { exemplarCode: opts.exemplarCode } : {}),
  });

  if (agent.error || !agent.code) {
    throw new Error(`Kiln agent generation failed: ${agent.error ?? 'agent produced no code'}`);
  }

  const render = await renderGLB(agent.code);

  // Best-effort views artifact: what the vision loop / review UIs show.
  // Never fails the run — a rasterizer error just drops the sidecar.
  let views: Buffer | undefined;
  if (opts.captureViews) {
    try {
      const { renderCodeViewGrid } = await import('../views');
      views = (await renderCodeViewGrid(agent.code)).png;
    } catch {
      views = undefined;
    }
  }

  return {
    code: agent.code,
    glb: render.glb,
    meta: render.meta,
    warnings: [...(render.warnings ?? [])],
    toolCalls: agent.toolCalls,
    steps: agent.steps,
    ...(agent.usage ? { usage: agent.usage } : {}),
    provider: desc.provider,
    model: desc.model,
    ...(agent.edits ? { edits: agent.edits } : {}),
    ...(agent.diff ? { diff: agent.diff } : {}),
    ...(views ? { views } : {}),
  };
}
