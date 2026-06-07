/**
 * `@pixel-forge/core/kiln/agent` — the agnostic, tool-driven Kiln codegen
 * foundation (validated in packages/kiln-bench, folded into core 2026-06).
 *
 * This is an ADDITIVE surface: it does not replace the legacy emit-and-parse
 * `generate.ts` / `llm` paths. It is isolated on its own subpath export so the
 * `@strands-agents/sdk` dependency does not leak into the rest of core — import
 * from `@pixel-forge/core/kiln/agent` only when you want the agent loop.
 *
 * - {@link runKilnAgent}      — drive any Strands Model through the kiln tool loop
 * - {@link makeKilnTools}     — in-process tool skin over the shared registry
 * - {@link ensureStreamStart} — the OpenRouter/Vercel-bridge stream fix
 * - {@link makeOpenRouterModel} — build an OpenRouter Strands model with the fix
 * - {@link MetricsCollector}  — per-loop tool/step/usage metrics via hooks
 */
export { runKilnAgent } from './run';
export type { RunKilnAgentOptions, RunKilnAgentResult, KilnKnowhow } from './run';

export { makeKilnTools, KILN_SUBMIT_TOOL_NAME } from './tools';
export type { SubmitSink } from './tools';

export { ensureStreamStart } from './stream-start';

export { makeOpenRouterModel } from './providers';
export type { OpenRouterModelOptions } from './providers';

export { MetricsCollector } from './hooks';
export type { CollectedMetrics, AgentUsage } from './hooks';
