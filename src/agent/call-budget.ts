/** One deterministic model-call allowance shared by every paid role in a generation. */

export const DEFAULT_GENERATION_MODEL_CALL_LIMIT = 40;

export type GenerationModelCallRole = 'author' | 'observer' | 'repair' | 'retry' | 'fallback';

export interface GenerationCallBudgetReceipt {
  /** Aggregate ceiling. Zero preserves the legacy explicit unlimited setting. */
  limit: number;
  consumed: number;
  /** Null only for an unlimited budget. */
  remaining: number | null;
  exhausted: boolean;
  /** Dispatches refused before reaching a provider. */
  denied: number;
  byRole: Partial<Record<GenerationModelCallRole, number>>;
}

export interface GenerationCallBudget {
  /** Atomically reserve one call for a role. False means do not dispatch. */
  tryConsume(role: GenerationModelCallRole): boolean;
  /** Immutable JSON-safe snapshot for metrics, persistence, and tests. */
  receipt(): GenerationCallBudgetReceipt;
}

/** Invalid configuration must not turn the cost guard off. */
export function resolveGenerationModelCallLimit(raw: unknown): number {
  if (raw === undefined || raw === null || raw === '') return DEFAULT_GENERATION_MODEL_CALL_LIMIT;
  const parsed = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    return DEFAULT_GENERATION_MODEL_CALL_LIMIT;
  }
  return parsed;
}

export function generationModelCallLimitFromEnv(
  env: Readonly<{
    KILN_GENERATION_MAX_CALLS?: string;
    KILN_AGENT_MAX_STEPS?: string;
  }> = process.env as {
    KILN_GENERATION_MAX_CALLS?: string;
    KILN_AGENT_MAX_STEPS?: string;
  },
): number {
  return resolveGenerationModelCallLimit(env.KILN_GENERATION_MAX_CALLS ?? env.KILN_AGENT_MAX_STEPS);
}

export function createGenerationCallBudget(
  limit = DEFAULT_GENERATION_MODEL_CALL_LIMIT,
): GenerationCallBudget {
  const resolvedLimit = resolveGenerationModelCallLimit(limit);
  let consumed = 0;
  let denied = 0;
  const byRole: Partial<Record<GenerationModelCallRole, number>> = {};

  return {
    tryConsume(role) {
      if (resolvedLimit > 0 && consumed >= resolvedLimit) {
        denied += 1;
        return false;
      }
      consumed += 1;
      byRole[role] = (byRole[role] ?? 0) + 1;
      return true;
    },
    receipt() {
      const remaining = resolvedLimit === 0 ? null : Math.max(0, resolvedLimit - consumed);
      return {
        limit: resolvedLimit,
        consumed,
        remaining,
        exhausted: resolvedLimit > 0 && remaining === 0,
        denied,
        byRole: { ...byRole },
      };
    },
  };
}
