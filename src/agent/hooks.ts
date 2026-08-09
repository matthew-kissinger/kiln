/**
 * Agent-loop metrics via Strands lifecycle hooks.
 *
 * A `MetricsCollector` attaches to an Agent and records:
 *   - toolCalls[] — every tool the model called, in order (BeforeToolCallEvent)
 *   - steps       — number of model calls (AfterModelCallEvent count)
 *   - usage       — best-effort token usage, filled from the AgentResult after
 *                   invoke via `recordResultUsage()` (hook events carry no usage)
 *
 * Usage: construct, `attach(agent)`, run `agent.invoke(...)`, call
 * `recordResultUsage(result.metrics?.latestAgentInvocation?.usage)`, read
 * `readMetrics()`, then `detach()`.
 */
import {
  type Agent,
  BeforeToolCallEvent,
  BeforeModelCallEvent,
  AfterModelCallEvent,
} from '@strands-agents/sdk';
import type { GenerationCallBudget, GenerationModelCallRole } from './call-budget';

/** Token-usage subset we surface. The cache fields mirror the Strands `Usage`
 *  type (dist/src/models/streaming.d.ts): the Anthropic adapter fills them from
 *  `cache_read_input_tokens` / `cache_creation_input_tokens` and the Bedrock
 *  adapter passes its converse-stream `cacheReadInputTokens` /
 *  `cacheWriteInputTokens` counts through under the same names. Providers
 *  without prompt caching simply omit them. */
export interface AgentUsage {
  inputTokens?: number;
  outputTokens?: number;
  /** Input tokens served from the provider's prompt cache (cache hits). */
  cacheReadInputTokens?: number;
  /** Input tokens written to the provider's prompt cache (cache creation). */
  cacheWriteInputTokens?: number;
}

/** The AgentUsage fields recordResultUsage accumulates, in surface order. */
const USAGE_FIELDS = [
  'inputTokens',
  'outputTokens',
  'cacheReadInputTokens',
  'cacheWriteInputTokens',
] as const;

/** A live agent-loop event, emitted as the loop runs (for progress UIs). */
export type KilnAgentEvent =
  | { type: 'tool'; tool: string; step: number }
  | { type: 'model_call'; step: number }
  | {
      /** The composer compacted its transcript (state lives in the scene model, not
       *  the history) — surfaced so a progress UI can show the loop staying lean. */
      type: 'compaction';
      step: number;
      messagesBefore: number;
      placements: number;
      overlaps: number;
    }
  | {
      /** M1b: the finalized program graded below B for a consolidation-fixable
       *  reason, and one bounded grade-refine turn is being fed back to the model. */
      type: 'grade_refine';
      step: number;
      grade: string;
      materials: number;
    };

/** The agent-loop-derived metrics this collector produces. */
export interface CollectedMetrics {
  toolCalls: string[];
  steps: number;
  usage?: AgentUsage;
}

export class MetricsCollector {
  private readonly toolCalls: string[] = [];
  private steps = 0;
  private usage: AgentUsage | undefined;
  private capped = false;
  private cleanups: Array<() => void> = [];

  /**
   * @param onEvent - Optional live sink, fired as the loop runs (tool calls,
   * model calls). Errors thrown by the sink are swallowed — a broken progress
   * listener must never fail a generation.
   * @param maxSteps - Optional per-collector sub-cap. When a shared budget is
   * also present, both bounds apply and the tighter remaining bound wins.
   * @param generationCallBudget - Shared allowance across author, observer, and
   * repair work. It is consumed only after the local sub-cap admits dispatch.
   */
  constructor(
    private readonly onEvent?: (event: KilnAgentEvent) => void,
    private readonly maxSteps?: number,
    private readonly generationCallBudget?: GenerationCallBudget,
    private readonly modelCallRole: GenerationModelCallRole = 'author',
  ) {}

  private emit(event: KilnAgentEvent): void {
    if (!this.onEvent) return;
    try {
      this.onEvent(event);
    } catch {
      // progress sinks are best-effort
    }
  }

  /** Attach hooks; returns a cleanup function (also tracked for `detach()`). */
  attach(agent: Agent): () => void {
    const offTool = agent.addHook(BeforeToolCallEvent, (event) => {
      this.toolCalls.push(event.toolUse.name);
      this.emit({ type: 'tool', tool: event.toolUse.name, step: this.steps });
    });
    const offModel = agent.addHook(AfterModelCallEvent, () => {
      this.emit({ type: 'model_call', step: this.steps });
    });
    // Hard cost caps: enforce the local phase allowance first, then reserve from
    // the aggregate budget. A locally denied call must not consume or increment
    // the shared allowance.
    // The SDK ends the loop with stopReason 'endTurn' (no exception) — `capped`
    // lets the caller turn that bounded stop into a clear failed generation.
    const offDispatch = agent.addHook(BeforeModelCallEvent, (event) => {
      if (this.maxSteps && this.maxSteps > 0 && this.steps >= this.maxSteps) {
        this.capped = true;
        event.cancel = `kiln: agent step cap reached (${this.maxSteps} model calls) — aborted to bound cost`;
        return;
      }
      if (this.generationCallBudget && !this.generationCallBudget.tryConsume(this.modelCallRole)) {
        this.capped = true;
        const receipt = this.generationCallBudget.receipt();
        event.cancel =
          `kiln: generation model-call budget reached (${receipt.limit} aggregate calls) — ` +
          'aborted before provider dispatch to bound cost';
        return;
      }
      // Count admitted provider dispatches, never the SDK's synthetic after-event
      // for a call cancelled by one of the bounds above.
      this.steps += 1;
    });
    this.cleanups.push(offTool, offModel, offDispatch);
    return () => this.detach();
  }

  /** True if the loop was halted by the model-call cap (vs the model stopping). */
  wasCapped(): boolean {
    return this.capped;
  }

  /** Remove all attached hooks. Idempotent. */
  detach(): void {
    for (const off of this.cleanups) {
      try {
        off();
      } catch {
        // best-effort cleanup
      }
    }
    this.cleanups = [];
  }

  /** Record token usage from the AgentResult after an invoke completes.
   *  Accumulates across calls — a grade-refine pass is a SECOND invoke on the
   *  same agent, and `latestAgentInvocation.usage` is per-invocation, so the
   *  run's usage is the sum. Single-invoke callers are unaffected. */
  recordResultUsage(usage: AgentUsage | undefined): void {
    if (!usage) return;
    const next: AgentUsage = { ...this.usage };
    let recorded = false;
    for (const field of USAGE_FIELDS) {
      const value = usage[field];
      if (typeof value === 'number') {
        next[field] = (next[field] ?? 0) + value;
        recorded = true;
      }
    }
    if (recorded) this.usage = next;
  }

  /** Read the collected metrics (a fresh copy each call). */
  readMetrics(): CollectedMetrics {
    return {
      toolCalls: [...this.toolCalls],
      steps: this.steps,
      ...(this.usage ? { usage: { ...this.usage } } : {}),
    };
  }
}
