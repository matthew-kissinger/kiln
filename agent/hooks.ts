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
import { type Agent, BeforeToolCallEvent, AfterModelCallEvent } from '@strands-agents/sdk';

/** Token-usage subset we surface. */
export interface AgentUsage {
  inputTokens?: number;
  outputTokens?: number;
}

/** A live agent-loop event, emitted as the loop runs (for progress UIs). */
export type KilnAgentEvent =
  | { type: 'tool'; tool: string; step: number }
  | { type: 'model_call'; step: number };

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
  private cleanups: Array<() => void> = [];

  /**
   * @param onEvent - Optional live sink, fired as the loop runs (tool calls,
   * model calls). Errors thrown by the sink are swallowed — a broken progress
   * listener must never fail a generation.
   */
  constructor(private readonly onEvent?: (event: KilnAgentEvent) => void) {}

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
    this.cleanups.push(offTool, offModel);
    return () => this.detach();
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
