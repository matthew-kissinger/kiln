/** Engine-owned bounds for every host-render deadline. */
export const MIN_VIEW_RENDER_TIMEOUT_MS = 1;
export const MAX_VIEW_RENDER_TIMEOUT_MS = 120_000;

export type ViewRenderRequestKind = 'in-loop-grid' | 'derivative-cell' | 'final-grid';
export type ViewRenderWarmUpState = 'unknown' | 'pending' | 'ready' | 'degraded';

/** Dynamic host state sampled immediately before each renderer request. */
export interface ViewRenderTimeoutHostContext {
  warmUpState: ViewRenderWarmUpState;
  /** Remaining wall-clock allowance for the generation. Zero means fail fast. */
  remainingGenerationBudgetMs?: number;
  /** The renderer adapter's own deadline. The Engine never waits longer. */
  rendererDeadlineMs?: number;
}

export interface ViewRenderTimeoutResolverContext extends ViewRenderTimeoutHostContext {
  requestKind: ViewRenderRequestKind;
  defaultTimeoutMs: number;
  /** Legacy numeric option after Engine bounds are applied. */
  timeoutMs: number;
}

export type ViewRenderTimeoutContextProvider = () => ViewRenderTimeoutHostContext;
export type ViewRenderTimeoutResolver = (
  context: Readonly<ViewRenderTimeoutResolverContext>,
) => number;

export interface ResolveViewRenderTimeoutInput {
  requestKind: ViewRenderRequestKind;
  defaultTimeoutMs: number;
  /** Backwards-compatible fixed deadline. */
  timeoutMs?: number;
  /** Static context, useful for deterministic adapters and tests. */
  context?: ViewRenderTimeoutHostContext;
  /** Dynamic context takes precedence and is sampled once per renderer request. */
  contextProvider?: ViewRenderTimeoutContextProvider;
  /** Optional host policy. Its result remains subject to every Engine cap. */
  resolver?: ViewRenderTimeoutResolver;
}

const WARM_UP_STATES = new Set<ViewRenderWarmUpState>(['unknown', 'pending', 'ready', 'degraded']);

function boundedTimeout(value: number, fallback: number): number {
  if (Number.isNaN(value)) return fallback;
  if (value === Number.POSITIVE_INFINITY) return MAX_VIEW_RENDER_TIMEOUT_MS;
  if (value === Number.NEGATIVE_INFINITY) return MIN_VIEW_RENDER_TIMEOUT_MS;
  return Math.min(
    MAX_VIEW_RENDER_TIMEOUT_MS,
    Math.max(MIN_VIEW_RENDER_TIMEOUT_MS, Math.floor(value)),
  );
}

function optionalBudget(value: number | undefined): number | undefined {
  if (value === undefined || Number.isNaN(value)) return undefined;
  if (value === Number.POSITIVE_INFINITY) return MAX_VIEW_RENDER_TIMEOUT_MS;
  if (value === Number.NEGATIVE_INFINITY) return 0;
  return Math.min(MAX_VIEW_RENDER_TIMEOUT_MS, Math.max(0, Math.floor(value)));
}

/**
 * Resolve one renderer deadline. Host hooks are advisory and failure-contained;
 * the numeric/default policy always remains a safe fallback. The returned value
 * is an integer inside the Engine bounds and never exceeds a supplied renderer
 * or remaining-generation allowance.
 */
export function resolveViewRenderTimeoutMs(input: ResolveViewRenderTimeoutInput): number {
  const defaultTimeoutMs = boundedTimeout(input.defaultTimeoutMs, MIN_VIEW_RENDER_TIMEOUT_MS);
  const timeoutMs = boundedTimeout(input.timeoutMs ?? defaultTimeoutMs, defaultTimeoutMs);

  let hostContext: ViewRenderTimeoutHostContext | undefined = input.context;
  let hostContextAvailable = true;
  if (input.contextProvider) {
    try {
      hostContext = input.contextProvider();
    } catch {
      hostContext = undefined;
      hostContextAvailable = false;
    }
  }

  const remainingGenerationBudgetMs = optionalBudget(hostContext?.remainingGenerationBudgetMs);
  const rendererDeadlineMs = optionalBudget(hostContext?.rendererDeadlineMs);
  const warmUpState = WARM_UP_STATES.has(hostContext?.warmUpState as ViewRenderWarmUpState)
    ? (hostContext?.warmUpState as ViewRenderWarmUpState)
    : 'unknown';
  const resolverContext: ViewRenderTimeoutResolverContext = Object.freeze({
    requestKind: input.requestKind,
    defaultTimeoutMs,
    timeoutMs,
    warmUpState,
    ...(remainingGenerationBudgetMs !== undefined ? { remainingGenerationBudgetMs } : {}),
    ...(rendererDeadlineMs !== undefined ? { rendererDeadlineMs } : {}),
  });

  let resolved = timeoutMs;
  if (input.resolver && hostContextAvailable) {
    try {
      resolved = boundedTimeout(input.resolver(resolverContext), timeoutMs);
    } catch {
      resolved = timeoutMs;
    }
  }

  if (rendererDeadlineMs !== undefined) resolved = Math.min(resolved, rendererDeadlineMs);
  if (remainingGenerationBudgetMs !== undefined) {
    resolved = Math.min(resolved, remainingGenerationBudgetMs);
  }
  return boundedTimeout(resolved, timeoutMs);
}
