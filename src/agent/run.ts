/**
 * `runKilnAgent` — the agnostic, tool-driven Kiln codegen foundation.
 *
 * Drives any Strands `Model` (Anthropic / OpenAI / Google / Bedrock / Vercel-
 * bridge providers like OpenRouter) through a tool loop where it discovers Kiln
 * primitives, validates and renders its program with the shared kiln tools, then
 * submits the final code via the terminal `kiln_submit` tool. This is the
 * "interact with Kiln through tools" path — the engine's codegen foundation.
 *
 * Know-how is supplied by either an inline system prompt (`getSystemPrompt`) or
 * the kiln-glb SKILL.md via the Strands `AgentSkills` plugin — the task prompt
 * itself should stay natural language and NOT bake in conventions.
 *
 * Pure orchestration over @kiln/engine primitives + @strands-agents/sdk. The
 * caller constructs the `model` (see provider helpers) and owns any out-of-process
 * resources (e.g. an MCP client passed via `extraTools`).
 */
import {
  Agent,
  TextBlock,
  ImageBlock,
  type Plugin,
  type Tool,
  type Message,
} from '@strands-agents/sdk';
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
import type { AssetIntentV1 } from '../contracts';
import type { SubmitSink, EditSink, UnifiedSink, EditRecord, KilnRenderCandidate } from './tools';
import {
  resolveToolSurface,
  buildAgentTools,
  type KilnToolSurface,
  type RefineMode,
} from './surface';
import { unifiedDiff } from './diff';
import { MetricsCollector, type AgentUsage, type KilnAgentEvent } from './hooks';
import {
  installRenderImageCompaction,
  installGenerationCounters,
  type GenerationCounters,
} from './compaction';
import { installMutatorBatchGuard } from './concurrency';
import { toCachedSystemPrompt } from './providers';
import {
  assessProgramGrade,
  buildGradeRefineMessage,
  gradeRank,
  shouldGradeRefine,
} from './grade-refine';

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
  /** Full closure-owned intent. Authoritative over category when supplied. */
  intent?: AssetIntentV1;
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
   *  buffer-based draft/view/edit/render/finalize set (render+screenshot
   *  collapsed, no kiln_list_primitives) — the surface Kiln Studio runs in prod
   *  (KILN_TOOL_SURFACE=unified); 'current' remains the library default. */
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
  /** Transcript image compaction. 'latest' (default) prunes each superseded render
   *  image out of its tool result before every model call (a short placeholder takes
   *  its place; the JSON metrics half survives, and tool-use/result pairing is never
   *  touched) so only the newest render image rides each request — the biggest
   *  input-token lever in a multi-render run. 'off' keeps the full image history. */
  imageCompaction?: 'latest' | 'off';
  /** M1b grade-aware refine (plan/05 §3.2). 'auto' (default): after the model
   *  finalizes, the program is baked + graded exactly as the final artifact will be
   *  (grade-aware `auto` consolidation); if it still grades below B for a
   *  consolidation-fixable reason (material/texture sprawl — never a transparency-only
   *  demotion) and the step budget allows, ONE bounded feedback turn asks the model to
   *  consolidate, and the refined program is kept only if its grade improves.
   *  'off' skips the check (no extra model turn, no assessment bake). */
  gradeRefine?: 'auto' | 'off';
}

export interface RunKilnAgentResult {
  /** The final Kiln program, if the agent produced one. */
  code?: string;
  /** Every tool the model called, in order. */
  toolCalls: string[];
  /** Number of model calls (agent-loop iterations). */
  steps: number;
  /** Best-effort token usage (incl. provider prompt-cache read/write counts when
   *  the adapter reports them). */
  usage?: AgentUsage;
  /** M1/M2 loop instrumentation: per-model-call projected input tokens +
   *  transcript length, and render-bearing tool results per generation. */
  counters?: GenerationCounters;
  /** The last assistant text (fallback / diagnostics). */
  lastText?: string;
  /** In edit mode, the applied surgical edits in order (the patch the model produced). */
  edits?: EditRecord[];
  /** In edit mode, a unified diff from the parent code to the final buffer. */
  diff?: string;
  /** True when the run hit the step cap but the sink held a program that renders —
   *  the code is the salvaged best effort instead of a discarded run. A cap with
   *  nothing renderable is still an `error`. */
  capped?: boolean;
  /** How the returned program was salvaged, when it is a best effort rather
   *  than a clean finalize: 'step-cap' (hit the model-call cap; `capped` is the
   *  legacy alias) or 'error' (the loop THREW — MaxTokensError is the canonical
   *  case — after the sink already held a renderable program; `error` carries
   *  the original failure). H-10: salvage-on-error. */
  salvaged?: 'step-cap' | 'error';
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
  // Hard agent-loop cap (runaway backstop, NOT a throttle): a stuck model could
  // otherwise loop draft/edit/render forever, re-feeding a growing transcript
  // (input tokens scale ~linearly with step count). Default 40 — ~4x the normal
  // run (~10 model calls) and clear of the slowest legit runs observed (~23); only
  // catches genuine infinite loops. Env-overridable (set 0 to disable, raise for
  // an unusually deep build).
  const maxSteps = Number(process.env['KILN_AGENT_MAX_STEPS'] ?? 40) || 0;
  const metrics = new MetricsCollector(opts.onEvent, maxSteps);
  const surface = resolveToolSurface(opts.toolSurface);
  const trustedCategory = opts.intent?.category ?? opts.category ?? 'prop';
  const gradeAssessmentOptions = {
    category: trustedCategory,
    ...(opts.intent ? { intent: opts.intent } : {}),
  };
  // Edit mode is a `current`-surface concept (the unified surface always uses the
  // buffer factory, regardless of refineMode). Engages only when refining.
  const editMode =
    surface === 'current' && Boolean(opts.existingCode) && opts.refineMode === 'edit';
  const sink: SubmitSink = {};
  const editSink: EditSink = { edits: [] };
  const unifiedSink: UnifiedSink = { edits: [] };
  // M1/M2 counters live outside the try so every return path (success, step-cap,
  // salvage, hard error) can expose whatever was collected before the exit.
  let counters: GenerationCounters | undefined;
  try {
    const tools: Tool[] = buildAgentTools(
      surface,
      { ...opts, category: trustedCategory },
      { sink, editSink, unifiedSink },
    );
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
      // A2: providers whose adapter consumes system-prompt cache points
      // (Anthropic/Bedrock) get [TextBlock, CachePointBlock] so the whole
      // system prompt — including any refine directive prepended above, which
      // stays INSIDE the cached text — lands in the provider prompt cache.
      // Other providers keep the plain string.
      systemPrompt: toCachedSystemPrompt(systemPrompt, opts.model),
      tools: allTools as never,
      ...(plugins.length ? { plugins } : {}),
      name: opts.agentName ?? 'kiln-agent',
    });
    metrics.attach(agent);
    // A3: Strands runs a turn's tool calls concurrently; kiln_draft/kiln_edit
    // mutate the shared working buffer the other tools read. Reject any batch
    // that mixes a buffer mutator with another call (the model is told to issue
    // the mutator alone); solo mutators and pure-reader batches pass through.
    installMutatorBatchGuard(agent);
    // M1/M2: passive per-model-call + renders-per-generation counters.
    counters = installGenerationCounters(agent).counters;
    // Transcript compaction (default on): before every model call, strip the image
    // out of each superseded render tool result so only the newest render image
    // rides the request. Pairing-safe — messages and toolUseIds are untouched;
    // only media INSIDE older tool results is swapped for a text placeholder.
    if ((opts.imageCompaction ?? 'latest') === 'latest') {
      installRenderImageCompaction(agent);
    }

    // An image-only request still needs a textual anchor for prompt framing.
    const promptText =
      opts.prompt?.trim() ||
      (opts.inputImage
        ? 'Build a 3D game asset that matches the attached reference image.'
        : opts.prompt);

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
        category: trustedCategory,
        ...(opts.intent ? { intent: opts.intent } : {}),
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

    // The sink-captured program for the active surface (a REAL program, unlike
    // the structuredOutput/lastText fallbacks below) — the only code the step-cap
    // salvage and the grade-refine pass are allowed to act on.
    const readSinkCode = (): string | undefined =>
      surface === 'unified' ? unifiedSink.code : editMode ? editSink.code : sink.code;

    // Capture: the buffer-backed surfaces (unified / edit) hold the program in
    // their sink; the current generate surface captures via kiln_submit. Both
    // fall back to structuredOutput then the last assistant text.
    let code = readSinkCode();
    if (!code && result.structuredOutput) {
      const so = result.structuredOutput as { code?: unknown };
      if (typeof so.code === 'string') code = so.code;
    }
    let lastText = lastMessageText(result.lastMessage);
    if (!code) code = lastText;

    let capped = false;
    if (metrics.wasCapped()) {
      // Step-cap salvage: a cap used to discard the whole run, throwing away a
      // program the sink already held. If the captured program renders, return
      // it flagged `capped` (an honest best effort); only a cap with nothing
      // renderable stays a hard failure.
      const captured = readSinkCode();
      const salvage = captured
        ? await assessProgramGrade(captured, gradeAssessmentOptions)
        : undefined;
      if (!salvage?.ok) {
        const collected = metrics.readMetrics();
        // A QA-blocked program is not a broken program — say so (the block
        // reason is actionable; a generic step-cap error is not).
        const qaNote = salvage?.qaBlocked
          ? ` (best-effort program rendered but was QA-blocked: ${salvage.error ?? 'unknown blocker'})`
          : '';
        return {
          toolCalls: collected.toolCalls,
          steps: collected.steps,
          ...(collected.usage ? { usage: collected.usage } : {}),
          ...(counters ? { counters } : {}),
          error: `kiln agent exceeded ${maxSteps} model calls (step cap) — aborted to bound cost${qaNote}`,
        };
      }
      capped = true;
      code = captured;
    } else if ((opts.gradeRefine ?? 'auto') === 'auto') {
      // M1b grade-aware refine (plan/05 §3.2): bake + grade the finalized program
      // exactly as the final artifact will be graded (auto consolidation). If it
      // still lands below B for a consolidation-fixable reason and the budget
      // allows, feed ONE bounded feedback turn back; keep the refined program
      // only if its grade actually improves.
      const captured = readSinkCode();
      if (captured && code === captured) {
        const assess = await assessProgramGrade(captured, gradeAssessmentOptions);
        const trigger = {
          mode: 'auto' as const,
          report: assess.report,
          steps: metrics.readMetrics().steps,
          maxSteps,
        };
        if (assess.ok && assess.report && shouldGradeRefine(trigger)) {
          const report = assess.report;
          if (opts.onEvent) {
            try {
              opts.onEvent({
                type: 'grade_refine',
                step: trigger.steps,
                grade: report.grade,
                materials: report.metrics.uniqueMaterials,
              });
            } catch {
              // progress sinks are best-effort
            }
          }
          const feedback = buildGradeRefineMessage({
            report,
            ...(assess.materialLabels ? { materialLabels: assess.materialLabels } : {}),
            finalizeVerb: surface === 'unified' ? 'kiln_finalize' : 'kiln_submit',
            editHint:
              surface === 'unified'
                ? 'kiln_edit for targeted swaps (or kiln_draft to rewrite)'
                : editMode
                  ? 'kiln_edit for targeted swaps'
                  : 'rewrite the program with the consolidated materials',
          });
          try {
            const refineResult = await agent.invoke(feedback);
            metrics.recordResultUsage(refineResult.metrics?.latestAgentInvocation?.usage);
            lastText = lastMessageText(refineResult.lastMessage) ?? lastText;
            const refined = readSinkCode();
            if (refined && refined !== captured) {
              const reassess = await assessProgramGrade(refined, gradeAssessmentOptions);
              if (
                reassess.ok &&
                reassess.report &&
                gradeRank(reassess.report.grade) < gradeRank(report.grade)
              ) {
                code = refined;
              }
            }
          } catch {
            // the refine turn is best-effort — the original finalized program stands
          }
        }
      }
    }

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
      ...(counters ? { counters } : {}),
      ...(lastText ? { lastText } : {}),
      ...(emitEdits ? { edits: editsTrace } : {}),
      ...(diff ? { diff } : {}),
      ...(capped ? { capped: true, salvaged: 'step-cap' as const } : {}),
    };
  } catch (err) {
    const collected = metrics.readMetrics();
    const message = err instanceof Error ? err.message : String(err);
    const base = {
      toolCalls: collected.toolCalls,
      steps: collected.steps,
      ...(collected.usage ? { usage: collected.usage } : {}),
      ...(counters ? { counters } : {}),
    };
    // Salvage-on-error (H-10): a thrown error used to discard a program the
    // sink already held — and MaxTokensError, the canonical throw here, is
    // exactly what a too-tight token budget produces. Same predicate as the
    // step-cap path: if the captured program renders, return it flagged
    // `salvaged:'error'` with the original failure preserved. A QA-blocked
    // program stays a failure (it renders, but enforce-mode policy is not
    // silently bypassed) with the block reason surfaced; anything else stays
    // a hard failure.
    const captured =
      surface === 'unified' ? unifiedSink.code : editMode ? editSink.code : sink.code;
    if (captured) {
      const salvage = await assessProgramGrade(captured, gradeAssessmentOptions);
      if (salvage.ok) {
        return { ...base, code: captured, salvaged: 'error' as const, error: message };
      }
      if (salvage.qaBlocked) {
        return {
          ...base,
          error: `${message} (best-effort program rendered but was QA-blocked: ${salvage.error ?? 'unknown blocker'})`,
        };
      }
    }
    return { ...base, error: message };
  } finally {
    metrics.detach();
  }
}
