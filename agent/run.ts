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

import { getSystemPrompt, buildUserPrompt } from '../prompt';
import type { AssetCategory } from '../prompt';
import { makeKilnTools, type SubmitSink } from './tools';
import { MetricsCollector, type AgentUsage } from './hooks';

/** How the agent learns Kiln conventions. */
export type KilnKnowhow = 'inline' | 'skill';

export interface RunKilnAgentOptions {
  /** A constructed Strands `Model` instance (provider-agnostic). */
  model: unknown;
  /** Natural-language description of the asset to build. */
  prompt: string;
  /** Asset category (drives prompt framing). Default 'prop'. */
  category?: AssetCategory;
  /** Know-how source: inline system prompt (default) or the kiln-glb skill. */
  knowhow?: KilnKnowhow;
  /** Absolute path to a SKILL.md dir, required when knowhow='skill'. */
  skillDir?: string;
  /** Extra tools to expose (e.g. a Strands McpClient for the MCP transport). */
  extraTools?: unknown[];
  /** Ask the model for an animate() function too. Default false (static). */
  includeAnimation?: boolean;
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
  const sink: SubmitSink = {};
  try {
    const tools: Tool[] = makeKilnTools(sink);
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
      }) +
      '\n\nWhen finished, call the kiln_submit tool exactly once with your final, ' +
      'complete Kiln program.';

    const result = await agent.invoke(userPrompt);
    metrics.recordResultUsage(result.metrics?.latestAgentInvocation?.usage);

    let code = sink.code;
    if (!code && result.structuredOutput) {
      const so = result.structuredOutput as { code?: unknown };
      if (typeof so.code === 'string') code = so.code;
    }
    const lastText = lastMessageText(result.lastMessage);
    if (!code) code = lastText;

    const collected = metrics.readMetrics();
    return {
      ...(code ? { code } : {}),
      toolCalls: collected.toolCalls,
      steps: collected.steps,
      ...(collected.usage ? { usage: collected.usage } : {}),
      ...(lastText ? { lastText } : {}),
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
