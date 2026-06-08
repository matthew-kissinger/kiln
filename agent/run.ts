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
import { Agent, type Plugin, type Tool, type Message } from '@strands-agents/sdk';
import { AgentSkills } from '@strands-agents/sdk/vended-plugins/skills';

import { getSystemPrompt, buildUserPrompt, KILN_REFINE_DIRECTIVE, KILN_EDIT_DIRECTIVE } from '../prompt';
import type { AssetCategory, AssetStyle } from '../prompt';
import { makeKilnTools, makeKilnEditTools, type SubmitSink, type EditSink, type EditRecord } from './tools';
import { unifiedDiff } from './diff';
import { MetricsCollector, type AgentUsage } from './hooks';

/** How the agent learns Kiln conventions. */
export type KilnKnowhow = 'inline' | 'skill';

/** How a refine applies its change: whole-program re-emission, or surgical edits. */
export type RefineMode = 'rewrite' | 'edit';

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
  /** Agent name (for tracing). Default 'kiln-agent'. */
  agentName?: string;
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
  const metrics = new MetricsCollector();
  // Edit mode only engages when refining (existingCode set) AND explicitly chosen.
  const editMode = Boolean(opts.existingCode) && opts.refineMode === 'edit';
  const sink: SubmitSink = {};
  const editSink: EditSink = { edits: [] };
  try {
    const tools: Tool[] = editMode
      ? makeKilnEditTools({ seedCode: opts.existingCode!, sink: editSink })
      : makeKilnTools(sink);
    const allTools: unknown[] = opts.extraTools ? [...tools, ...opts.extraTools] : tools;

    const plugins: Plugin[] = [];
    let systemPrompt: string;
    if (opts.knowhow === 'skill') {
      if (!opts.skillDir) throw new Error('runKilnAgent: knowhow="skill" requires skillDir');
      plugins.push(new AgentSkills({ skills: [opts.skillDir] }));
      systemPrompt =
        'You generate exportable 3D game assets as Kiln code. Use the available ' +
        'skill(s) to learn the Kiln primitives and conventions, write the program, ' +
        'validate and render it with the kiln tools, then call kiln_submit with the ' +
        'final code.';
    } else {
      systemPrompt = getSystemPrompt('glb');
    }

    // Refine framing: edit an existing asset on top of the unchanged conventions.
    // Edit mode swaps in the surgical-edit directive (it supersedes the refine one).
    if (opts.existingCode) {
      const directive = editMode ? KILN_EDIT_DIRECTIVE : KILN_REFINE_DIRECTIVE;
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

    const userPrompt =
      buildUserPrompt({
        prompt: opts.prompt,
        mode: 'glb',
        category: opts.category ?? 'prop',
        includeAnimation: opts.includeAnimation ?? false,
        ...(opts.style ? { style: opts.style } : {}),
        ...(opts.existingCode ? { existingCode: opts.existingCode } : {}),
        ...(opts.originalPrompt ? { originalPrompt: opts.originalPrompt } : {}),
      }) +
      '\n\nWhen finished, call the kiln_submit tool exactly once with your final, ' +
      'complete Kiln program.';

    const result = await agent.invoke(userPrompt);
    metrics.recordResultUsage(result.metrics?.latestAgentInvocation?.usage);

    let code = editMode ? editSink.code : sink.code;
    if (!code && result.structuredOutput) {
      const so = result.structuredOutput as { code?: unknown };
      if (typeof so.code === 'string') code = so.code;
    }
    const lastText = lastMessageText(result.lastMessage);
    if (!code) code = lastText;

    const collected = metrics.readMetrics();
    // In edit mode, attach the patch the model produced: the applied edits + a
    // unified diff from the parent code to the final buffer (robust to a rewrite
    // fallback, since it diffs the actual submitted code).
    const diff =
      editMode && code && opts.existingCode
        ? unifiedDiff(opts.existingCode, code, { fromLabel: 'parent', toLabel: 'refined' })
        : undefined;
    return {
      ...(code ? { code } : {}),
      toolCalls: collected.toolCalls,
      steps: collected.steps,
      ...(collected.usage ? { usage: collected.usage } : {}),
      ...(lastText ? { lastText } : {}),
      ...(editMode ? { edits: editSink.edits } : {}),
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
