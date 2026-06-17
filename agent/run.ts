/**
 * `runKilnAgent` — the agnostic, tool-driven Kiln codegen foundation.
 *
 * Drives any Strands `Model` (Anthropic / OpenAI / Google / Bedrock / Vercel-
 * bridge providers like OpenRouter) through a tool loop where it discovers Kiln
 * primitives, validates and renders its program with the shared kiln tools, then
 * submits the final code via the terminal `kiln_submit` tool. This is the
 * "interact with Kiln through tools" path — distinct from the legacy emit-and-
 * parse `generate.ts` / `llm` paths, which stay intact.
 *
 * Know-how is supplied by either an inline system prompt (`getSystemPrompt`) or
 * the kiln-glb SKILL.md via the Strands `AgentSkills` plugin — the task prompt
 * itself should stay natural language and NOT bake in conventions.
 *
 * Pure orchestration over @pixel-forge/core primitives + @strands-agents/sdk. The
 * caller constructs the `model` (see provider helpers) and owns any out-of-process
 * resources (e.g. an MCP client passed via `extraTools`).
 */
import { Agent, TextBlock, ImageBlock, type Plugin, type Tool, type Message } from '@strands-agents/sdk';
import { AgentSkills } from '@strands-agents/sdk/vended-plugins/skills';

import {
  getSystemPrompt,
  buildUserPrompt,
  KILN_REFINE_DIRECTIVE,
  KILN_EDIT_DIRECTIVE,
  KILN_REFINE_DIRECTIVE_UNIFIED,
  KILN_EDIT_DIRECTIVE_UNIFIED,
} from '../prompt';
import type { AssetCategory, AssetStyle } from '../prompt';
import type { SubmitSink, EditSink, UnifiedSink, EditRecord, KilnRenderCandidate } from './tools';
import {
  resolveToolSurface,
  buildAgentTools,
  type KilnToolSurface,
  type RefineMode,
} from './surface';
import { unifiedDiff } from './diff';
import { MetricsCollector, type AgentUsage, type KilnAgentEvent } from './hooks';

/** How the agent learns Kiln conventions. */
export type KilnKnowhow = 'inline' | 'skill';

// Tool-surface types + helpers live in ./surface so they stay testable without
// the SDK-heavy agent loop (and so generate.test.ts's mock.module('./run') does
// not also stub them). Re-exported here for the package's public agent API.
export { resolveToolSurface, buildAgentTools };
export type { KilnToolSurface, RefineMode };

/** A user-supplied reference image fed to the agent as multimodal context.
 *  `base64` is the raw image bytes base64-encoded (JSON/wire-safe); `mime` is the
 *  source content-type (e.g. 'image/png'). Gemini 3.5 Flash consumes it via the
 *  same Strands ImageBlock path the agent already uses for kiln_screenshot. */
export interface KilnInputImage {
  base64: string;
  mime: string;
}

/** Map an input-image MIME to a Strands ImageFormat (defaults to png). */
function imageFormatFromMime(mime: string): 'png' | 'jpeg' | 'gif' | 'webp' {
  const m = mime.toLowerCase();
  if (m.includes('jpeg') || m.includes('jpg')) return 'jpeg';
  if (m.includes('gif')) return 'gif';
  if (m.includes('webp')) return 'webp';
  return 'png';
}

export interface RunKilnAgentOptions {
  /** A constructed Strands `Model` instance (provider-agnostic). */
  model: unknown;
  /** Natural-language description of the asset to build. */
  prompt: string;
  /** Asset category (drives prompt framing). Default 'prop'. */
  category?: AssetCategory;
  /** Optional style template (low-poly / stylized / voxel / detailed / realistic) injected into the user prompt. */
  style?: AssetStyle;
  /** Know-how source: inline system prompt (default) or the kiln-glb skill. */
  knowhow?: KilnKnowhow;
  /** Inline-knowhow only: 'full' (default) embeds the whole primitive
   *  enumeration in the system prompt; 'trimmed' sends a ~15-line stub and
   *  relies on the kiln_list_primitives tool. The bench prompt-ablation axis. */
  apiSurface?: 'full' | 'trimmed';
  /** Absolute path to a SKILL.md dir, required when knowhow='skill'. */
  skillDir?: string;
  /** Extra tools to expose (e.g. a Strands McpClient for the MCP transport). */
  extraTools?: unknown[];
  /** Ask the model for an animate() function too. Default false (static). */
  includeAnimation?: boolean;
  /** Existing Kiln program to refine. When set, the run is framed as an edit:
   *  `prompt` becomes the Edit Request and `KILN_REFINE_DIRECTIVE` is prepended to
   *  the system prompt, so the model edits this code rather than starting over. */
  existingCode?: string;
  /** The asset's original generation prompt, surfaced as "## Original Request" when
   *  refining (existingCode set) so the model sees the asset's intent, not just code. */
  originalPrompt?: string;
  /** How a refine applies its change. 'rewrite' (default) re-emits the whole program via
   *  kiln_submit; 'edit' seeds a working buffer with `existingCode` and exposes surgical
   *  kiln_edit/kiln_view tools so the model patches it in place. Only takes effect when
   *  `existingCode` is set (a fresh generation always rewrites). */
  refineMode?: RefineMode;
  /** Which agent tool surface to use. Resolved at call time: this option, else
   *  the KILN_TOOL_SURFACE env, else 'current'. The 'unified' surface is the
   *  buffer-based draft/view/edit/validate/render/finalize six (render+screenshot
   *  collapsed, no kiln_list_primitives). Flag-gated until a bench A/B clears it. */
  toolSurface?: KilnToolSurface;
  /** Agent name (for tracing). Default 'kiln-agent'. */
  agentName?: string;
  /** Live agent-loop events (tool calls / model calls) for progress UIs.
   *  Best-effort: sink errors are swallowed and never fail the run. */
  onEvent?: (event: KilnAgentEvent) => void;
  /** Live render-candidate sink (one per successful kiln_render on the unified
   *  surface): the working buffer + its six-view image. Lets the host stream a
   *  filmstrip of intermediate renders and let the user pick a version. Best-effort;
   *  ignored on the current/edit surfaces. */
  onCandidate?: (c: KilnRenderCandidate) => void;
  /** A complete Kiln program used as a style anchor for FRESH generation —
   *  rendered as "## Reference Asset" in the user prompt (ignored when
   *  existingCode is set). ~5-15k input tokens/run; cached on most providers. */
  exemplarCode?: string;
  /** Optional reference image fed to the model alongside the text prompt. When set,
   *  the initial message becomes a [TextBlock, ImageBlock] pair and the prompt notes
   *  that a reference image is attached. Works for fresh gen AND refine. */
  inputImage?: KilnInputImage;
}

export interface RunKilnAgentResult {
  /** The final Kiln program, if the agent produced one. */
  code?: string;
  /** Every tool the model called, in order. */
  toolCalls: string[];
  /** Number of model calls (agent-loop iterations). */
  steps: number;
  /** Best-effort token usage. */
  usage?: AgentUsage;
  /** The last assistant text (fallback / diagnostics). */
  lastText?: string;
  /** In edit mode, the applied surgical edits in order (the patch the model produced). */
  edits?: EditRecord[];
  /** In edit mode, a unified diff from the parent code to the final buffer. */
  diff?: string;
  /** Error message if the run threw. */
  error?: string;
}

function lastMessageText(message: Message | undefined): string | undefined {
  if (!message) return undefined;
  const parts: string[] = [];
  for (const block of message.content) {
    if ((block as { type?: string }).type === 'textBlock') {
      const t = (block as { text?: string }).text;
      if (typeof t === 'string') parts.push(t);
    }
  }
  const joined = parts.join('\n').trim();
  return joined.length ? joined : undefined;
}

/**
 * Run one Kiln codegen session end-to-end. Never throws — failures are returned
 * on `result.error` with whatever metrics were collected beforehand.
 */
export async function runKilnAgent(opts: RunKilnAgentOptions): Promise<RunKilnAgentResult> {
  const metrics = new MetricsCollector(opts.onEvent);
  const surface = resolveToolSurface(opts.toolSurface);
  // Edit mode is a `current`-surface concept (the unified surface always uses the
  // buffer factory, regardless of refineMode). Engages only when refining.
  const editMode =
    surface === 'current' && Boolean(opts.existingCode) && opts.refineMode === 'edit';
  const sink: SubmitSink = {};
  const editSink: EditSink = { edits: [] };
  const unifiedSink: UnifiedSink = { edits: [] };
  try {
    const tools: Tool[] = buildAgentTools(surface, opts, { sink, editSink, unifiedSink });
    const allTools: unknown[] = opts.extraTools ? [...tools, ...opts.extraTools] : tools;

    const plugins: Plugin[] = [];
    let systemPrompt: string;
    if (opts.knowhow === 'skill') {
      if (!opts.skillDir) throw new Error('runKilnAgent: knowhow="skill" requires skillDir');
      plugins.push(new AgentSkills({ skills: [opts.skillDir] }));
      // NOTE: SKILL.md's working-loop reference still uses the current verbs; only
      // the terminal verb in this top-level instruction is surface-aware (the
      // unified+skill combination is a documented gap, not the prod inline path).
      const finalize =
        surface === 'unified'
          ? 'then call kiln_finalize to lock in your final asset.'
          : 'then call kiln_submit with the final code.';
      systemPrompt =
        'You generate exportable 3D game assets as Kiln code. Use the available ' +
        'skill(s) to learn the Kiln primitives and conventions, write the program, ' +
        'validate and render it with the kiln tools, ' +
        finalize;
    } else {
      systemPrompt = getSystemPrompt('glb', {
        ...(opts.apiSurface ? { apiSurface: opts.apiSurface } : {}),
        ...(surface === 'unified' ? { toolSurface: 'unified' as const } : {}),
      });
    }

    // Refine framing: edit an existing asset on top of the unchanged conventions.
    // The directive variant follows the surface (unified uses the finalize-verb
    // directives) and the refine mechanics (edit vs rewrite emphasis).
    if (opts.existingCode) {
      const directive =
        surface === 'unified'
          ? opts.refineMode === 'edit'
            ? KILN_EDIT_DIRECTIVE_UNIFIED
            : KILN_REFINE_DIRECTIVE_UNIFIED
          : editMode
            ? KILN_EDIT_DIRECTIVE
            : KILN_REFINE_DIRECTIVE;
      systemPrompt = `${directive}\n\n${systemPrompt}`;
    }

    const agent = new Agent({
      model: opts.model as never,
      systemPrompt,
      tools: allTools as never,
      ...(plugins.length ? { plugins } : {}),
      name: opts.agentName ?? 'kiln-agent',
    });
    metrics.attach(agent);

    // An image-only request still needs a textual anchor for prompt framing.
    const promptText =
      opts.prompt?.trim() || (opts.inputImage ? 'Build a 3D game asset that matches the attached reference image.' : opts.prompt);

    const reviewNote =
      surface === 'unified'
        ? '\n\nBefore finalizing, call kiln_render once and look at the six views: correct ' +
          'facing in Front, a clean silhouette in Right, symmetry in Top, and no floating or ' +
          'detached parts in the 3/4 view. Fix anything that looks wrong (kiln_edit or ' +
          'kiln_draft), then call kiln_finalize exactly once.'
        : '\n\nBefore submitting, call kiln_screenshot once on your final code and check ' +
          'the six views: correct facing in Front, a clean silhouette in Right, symmetry in ' +
          'Top, and no floating or detached parts in the 3/4 view. Fix anything that looks ' +
          'wrong, then call the kiln_submit tool exactly once with your final, complete ' +
          'Kiln program.';

    const userPrompt =
      buildUserPrompt({
        prompt: promptText,
        mode: 'glb',
        category: opts.category ?? 'prop',
        includeAnimation: opts.includeAnimation ?? false,
        ...(opts.style ? { style: opts.style } : {}),
        ...(opts.existingCode ? { existingCode: opts.existingCode } : {}),
        ...(opts.originalPrompt ? { originalPrompt: opts.originalPrompt } : {}),
        ...(opts.exemplarCode ? { exemplarCode: opts.exemplarCode } : {}),
      }) +
      (opts.inputImage
        ? '\n\nA reference image of the desired asset is attached. Match its overall form, ' +
          'proportions, and silhouette; treat the text above as the intent and any specific changes.'
        : '') +
      reviewNote;

    // With a reference image, send a [text, image] content-block pair (the same
    // ImageBlock path kiln_screenshot uses); otherwise a plain string prompt.
    const invokeArgs = opts.inputImage
      ? [
          new TextBlock(userPrompt),
          new ImageBlock({
            format: imageFormatFromMime(opts.inputImage.mime),
            source: { bytes: new Uint8Array(Buffer.from(opts.inputImage.base64, 'base64')) },
          }),
        ]
      : userPrompt;

    const result = await agent.invoke(invokeArgs as never);
    metrics.recordResultUsage(result.metrics?.latestAgentInvocation?.usage);

    // Capture: the buffer-backed surfaces (unified / edit) hold the program in
    // their sink; the current generate surface captures via kiln_submit. Both
    // fall back to structuredOutput then the last assistant text.
    let code = surface === 'unified' ? unifiedSink.code : editMode ? editSink.code : sink.code;
    if (!code && result.structuredOutput) {
      const so = result.structuredOutput as { code?: unknown };
      if (typeof so.code === 'string') code = so.code;
    }
    const lastText = lastMessageText(result.lastMessage);
    if (!code) code = lastText;

    const collected = metrics.readMetrics();
    // Buffer-backed surfaces (unified or edit-mode refine) carry a surgical-edit
    // trace; when refining (existingCode set) also attach a unified diff from the
    // parent to the final code (robust to a draft/rewrite fallback — it diffs the
    // actual captured code, not the edit log).
    const emitEdits = surface === 'unified' || editMode;
    const editsTrace = surface === 'unified' ? unifiedSink.edits : editSink.edits;
    const diff =
      emitEdits && code && opts.existingCode
        ? unifiedDiff(opts.existingCode, code, { fromLabel: 'parent', toLabel: 'refined' })
        : undefined;
    return {
      ...(code ? { code } : {}),
      toolCalls: collected.toolCalls,
      steps: collected.steps,
      ...(collected.usage ? { usage: collected.usage } : {}),
      ...(lastText ? { lastText } : {}),
      ...(emitEdits ? { edits: editsTrace } : {}),
      ...(diff ? { diff } : {}),
    };
  } catch (err) {
    const collected = metrics.readMetrics();
    return {
      toolCalls: collected.toolCalls,
      steps: collected.steps,
      ...(collected.usage ? { usage: collected.usage } : {}),
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    metrics.detach();
  }
}
