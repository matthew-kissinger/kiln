/**
 * `@kiln/engine/agent` — the agnostic, tool-driven Kiln codegen foundation
 * (validated in the pixel-forge kiln-bench harness, folded in 2026-06).
 *
 * Isolated on its own subpath export so the `@strands-agents/sdk` dependency
 * does not leak into the rest of the engine — import from `@kiln/engine/agent`
 * only when you want the agent loop.
 *
 * - {@link runKilnAgent}      — drive any Strands Model through the kiln tool loop
 * - {@link generateKilnAsset} — model id -> tool loop -> rendered GLB (the default codegen engine)
 * - {@link makeKilnModel}     — agnostic Strands model factory (native + OpenRouter)
 * - {@link resolveKilnAgentModel} — model-id string -> Strands provider descriptor
 * - {@link makeKilnTools}     — in-process tool skin over the shared registry
 * - {@link makeKilnEditTools} — surgical edit-tool skin for refining an existing asset
 * - {@link makeKilnUnifiedTools} — buffer-based 6-tool surface (KILN_TOOL_SURFACE='unified')
 * - {@link unifiedDiff}       — dependency-free unified diff (the refine patch artifact)
 * - {@link ensureStreamStart} — the OpenRouter/Vercel-bridge stream fix
 * - {@link makeOpenRouterModel} — build an OpenRouter Strands model with the fix
 * - {@link MetricsCollector}  — per-loop tool/step/usage metrics via hooks
 */
export { runKilnAgent } from './run';
export type { RunKilnAgentOptions, RunKilnAgentResult, KilnKnowhow, KilnInputImage } from './run';

export { resolveToolSurface, buildAgentTools } from './surface';
export type { KilnToolSurface, RefineMode } from './surface';

export { generateKilnAsset, generateKilnCodeAgent, DEFAULT_KILN_AGENT_MODEL } from './generate';
export type { GenerateKilnAssetOptions, GenerateKilnAssetResult } from './generate';

export {
  makeKilnTools,
  makeKilnEditTools,
  makeKilnUnifiedTools,
  KilnDraftBuffer,
  KilnEditBuffer,
  KILN_SUBMIT_TOOL_NAME,
} from './tools';
export type {
  SubmitSink,
  EditSink,
  UnifiedSink,
  EditRecord,
  EditResult,
  KilnRenderCandidate,
} from './tools';

export { unifiedDiff } from './diff';
export type { UnifiedDiffOptions } from './diff';

export { ensureStreamStart } from './stream-start';

export {
  makeOpenRouterModel,
  makeKilnModel,
  resolveKilnAgentModel,
  harnessIdToAgentModelId,
} from './providers';
export type {
  OpenRouterModelOptions,
  KilnAgentProvider,
  KilnModelDescriptor,
  MakeKilnModelOptions,
} from './providers';

export { MetricsCollector } from './hooks';
export type { CollectedMetrics, AgentUsage, KilnAgentEvent } from './hooks';
