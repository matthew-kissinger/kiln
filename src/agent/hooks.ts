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

/** Token-usage subset we surface. */
export interface AgentUsage {
  inputTokens?: number;
  outputTokens?: number;
}

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
   * @param maxSteps - Optional hard cap on model calls (agent-loop iterations).
   * When the loop reaches this many calls, the NEXT model call is cancelled
   * (SDK `BeforeModelCallEvent.cancel`), ending the loop with a clean stop
   * instead of an unbounded tool/edit/render loop. A pure cost backstop — set
   * well above normal runs (~10 calls); only catches runaways. 0/undefined = off.
   */
  constructor(
    private readonly onEvent?: (event: KilnAgentEvent) => void,
    private readonly maxSteps?: number,
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
      this.steps += 1;
      this.emit({ type: 'model_call', step: this.steps });
    });
    // Hard step cap: before a model call that would exceed maxSteps, cancel it.
    // The SDK ends the loop with stopReason 'endTurn' (no exception) — `capped`
    // lets the caller turn that bounded stop into a clear failed generation.
    const offCap =
      this.maxSteps && this.maxSteps > 0
        ? agent.addHook(BeforeModelCallEvent, (event) => {
            if (this.steps >= this.maxSteps!) {
              this.capped = true;
              event.cancel = `kiln: agent step cap reached (${this.maxSteps} model calls) — aborted to bound cost`;
            }
          })
        : undefined;
    this.cleanups.push(offTool, offModel);
    if (offCap) this.cleanups.push(offCap);
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

  /** Record token usage from the AgentResult after invoke completes. */
  recordResultUsage(usage: AgentUsage | undefined): void {
    if (!usage) return;
    const next: AgentUsage = {};
    if (typeof usage.inputTokens === 'number') next.inputTokens = usage.inputTokens;
    if (typeof usage.outputTokens === 'number') next.outputTokens = usage.outputTokens;
    if (next.inputTokens !== undefined || next.outputTokens !== undefined) this.usage = next;
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
