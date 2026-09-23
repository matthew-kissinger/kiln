/** One deterministic model-call allowance shared by every paid role in a generation. */

/**
 * No cap by default. Zero is this module's "unlimited" value, honoured by
 * `tryConsume` and the shared pre-dispatch admission hook.
 *
 * It used to be 40, which was a cost guard carried over from a hosted product
 * where the operator paid for every call. Out here the person running the tool
 * is the person paying for it, and a ceiling they did not choose is one that
 * stops an asset halfway for reasons that have nothing to do with the asset.
 * Set `KILN_GENERATION_MAX_CALLS` (or `--max-steps`) to put a bound back.
 */
export const DEFAULT_GENERATION_MODEL_CALL_LIMIT = 0;

export type GenerationModelCallRole = 'author' | 'observer' | 'repair' | 'retry' | 'fallback';

export interface GenerationModelCallAdmissionInput {
  role: GenerationModelCallRole;
  /** Strands' pre-dispatch input-token projection. An admission policy that
   * requires a hard bound must reject a missing value. */
  projectedInputTokens?: number;
}

export type GenerationModelCallAdmissionDecision = { ok: true } | { ok: false; reason: string };

/** Optional host-owned admission policy evaluated immediately before provider
 * dispatch. The engine supplies orchestration facts; pricing and reservations
 * remain outside this package. */
export interface GenerationModelCallAdmission {
  tryAdmit(input: GenerationModelCallAdmissionInput): GenerationModelCallAdmissionDecision;
}

export interface GenerationCallBudgetReceipt {
  /** Aggregate ceiling. Zero means unlimited, which is the default. */
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

/** An invalid explicit spending limit must never turn into unlimited dispatch. */
export function resolveGenerationModelCallLimit(raw: unknown): number {
  if (raw === undefined || raw === null || raw === '') return DEFAULT_GENERATION_MODEL_CALL_LIMIT;
  const parsed =
    typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() ? Number(raw) : NaN;
  if (!Number.isSafeInteger(parsed) || parsed < 0)
    throw new Error(
      'Generation model-call limit must be a nonnegative safe integer; use 0 for unlimited.',
    );
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
