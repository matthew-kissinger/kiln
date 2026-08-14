/**
 * MetricsCollector — step counting, tool-call capture, and the hard step-cap
 * runaway backstop. The collector only reads `event.cancel` / `event.toolUse.name`
 * off the hook events, so a tiny fake Agent (addHook registry + a dispatch helper)
 * exercises the loop without a live model.
 */
import { describe, expect, test } from 'bun:test';
import {
  BeforeToolCallEvent,
  BeforeModelCallEvent,
  AfterModelCallEvent,
} from '@strands-agents/sdk';
import { MetricsCollector } from './hooks';
import { createGenerationCallBudget } from './call-budget';

type Cb = (event: unknown) => void;

/** Minimal Agent stand-in: registers hooks by event class, dispatches on demand. */
function fakeAgent() {
  const hooks = new Map<unknown, Cb[]>();
  const agent = {
    addHook(EventClass: unknown, cb: Cb) {
      const arr = hooks.get(EventClass) ?? [];
      arr.push(cb);
      hooks.set(EventClass, arr);
      return () => {
        const cur = hooks.get(EventClass) ?? [];
        hooks.set(
          EventClass,
          cur.filter((c) => c !== cb),
        );
      };
    },
  };
  const dispatch = (EventClass: unknown, event: unknown) => {
    for (const cb of hooks.get(EventClass) ?? []) cb(event);
  };
  /** Simulate one model call: Before (cancellable) then, if not cancelled, After. */
  const modelCall = (
    projectedInputTokens?: number,
  ): { cancelled: boolean; cancelText?: string } => {
    const before: { cancel?: string | boolean; projectedInputTokens?: number } = {
      ...(projectedInputTokens != null ? { projectedInputTokens } : {}),
    };
    dispatch(BeforeModelCallEvent, before);
    if (before.cancel) return { cancelled: true, cancelText: String(before.cancel) };
    dispatch(AfterModelCallEvent, {});
    return { cancelled: false };
  };
  const toolCall = (name: string) => dispatch(BeforeToolCallEvent, { toolUse: { name } });
  return { agent, modelCall, toolCall };
}

describe('MetricsCollector', () => {
  test('counts steps and tool calls', () => {
    const m = new MetricsCollector();
    const { agent, modelCall, toolCall } = fakeAgent();
    m.attach(agent as never);
    modelCall();
    toolCall('kiln_draft');
    modelCall();
    toolCall('kiln_render');
    const out = m.readMetrics();
    expect(out.steps).toBe(2);
    expect(out.toolCalls).toEqual(['kiln_draft', 'kiln_render']);
    expect(m.wasCapped()).toBe(false);
  });

  test('no cap when maxSteps is 0/undefined — loop runs freely', () => {
    const m = new MetricsCollector(undefined, 0);
    const { agent, modelCall } = fakeAgent();
    m.attach(agent as never);
    for (let i = 0; i < 50; i++) expect(modelCall().cancelled).toBe(false);
    expect(m.readMetrics().steps).toBe(50);
    expect(m.wasCapped()).toBe(false);
  });

  test('cancels the (cap+1)-th model call and flags capped', () => {
    const m = new MetricsCollector(undefined, 3);
    const { agent, modelCall } = fakeAgent();
    m.attach(agent as never);
    // First 3 calls proceed (steps 1..3); the 4th is cancelled before running.
    expect(modelCall().cancelled).toBe(false);
    expect(modelCall().cancelled).toBe(false);
    expect(modelCall().cancelled).toBe(false);
    const fourth = modelCall();
    expect(fourth.cancelled).toBe(true);
    expect(fourth.cancelText).toContain('step cap');
    expect(m.wasCapped()).toBe(true);
    // steps stays at 3 — the cancelled call never fired AfterModelCallEvent.
    expect(m.readMetrics().steps).toBe(3);
  });

  test('two collectors debit one aggregate budget before author and repair dispatch', () => {
    const budget = createGenerationCallBudget(3);
    const author = new MetricsCollector(undefined, 40, budget, 'author');
    const repair = new MetricsCollector(undefined, 40, budget, 'repair');
    const authorAgent = fakeAgent();
    const repairAgent = fakeAgent();
    author.attach(authorAgent.agent as never);
    repair.attach(repairAgent.agent as never);

    expect(authorAgent.modelCall().cancelled).toBe(false);
    expect(authorAgent.modelCall().cancelled).toBe(false);
    expect(repairAgent.modelCall().cancelled).toBe(false);
    const exhausted = repairAgent.modelCall();

    expect(exhausted.cancelled).toBe(true);
    expect(exhausted.cancelText).toContain('generation model-call budget');
    expect(repair.wasCapped()).toBe(true);
    expect(budget.receipt()).toMatchObject({
      consumed: 3,
      remaining: 0,
      denied: 1,
      byRole: { author: 2, repair: 1 },
    });
  });

  test('local sub-cap stops before consuming the shared aggregate allowance', () => {
    const budget = createGenerationCallBudget(5);
    const integration = new MetricsCollector(undefined, 2, budget, 'author');
    const integrationAgent = fakeAgent();
    integration.attach(integrationAgent.agent as never);

    expect(integrationAgent.modelCall().cancelled).toBe(false);
    expect(integrationAgent.modelCall().cancelled).toBe(false);
    const locallyExhausted = integrationAgent.modelCall();

    expect(locallyExhausted.cancelled).toBe(true);
    expect(locallyExhausted.cancelText).toContain('step cap');
    expect(integration.wasCapped()).toBe(true);
    expect(budget.receipt()).toMatchObject({ consumed: 2, remaining: 3, denied: 0 });
  });

  test('quoted-cost admission sees projected input and refuses before consuming the call allowance', () => {
    const budget = createGenerationCallBudget(5);
    const inspected: Array<{ role: string; projectedInputTokens?: number }> = [];
    const admission = {
      tryAdmit(call: { role: 'author'; projectedInputTokens?: number }) {
        inspected.push(call);
        return call.projectedInputTokens === 128_001
          ? { ok: false as const, reason: 'quoted cost envelope input cap exceeded' }
          : { ok: true as const };
      },
    };
    const metrics = new MetricsCollector(undefined, 40, budget, 'author', admission);
    const harness = fakeAgent();
    metrics.attach(harness.agent as never);

    expect(harness.modelCall(128_000).cancelled).toBe(false);
    const blocked = harness.modelCall(128_001);

    expect(blocked).toEqual({
      cancelled: true,
      cancelText: 'quoted cost envelope input cap exceeded',
    });
    expect(inspected).toEqual([
      { role: 'author', projectedInputTokens: 128_000 },
      { role: 'author', projectedInputTokens: 128_001 },
    ]);
    expect(metrics.capReason()).toBe('quoted cost envelope input cap exceeded');
    expect(budget.receipt()).toMatchObject({ consumed: 1, remaining: 4, denied: 0 });
  });

  test('records token usage from the agent result', () => {
    const m = new MetricsCollector();
    m.recordResultUsage({ inputTokens: 1200, outputTokens: 340 });
    expect(m.readMetrics().usage).toEqual({ inputTokens: 1200, outputTokens: 340 });
  });

  test('records cache read/write token counts from a result carrying them (A2)', () => {
    const m = new MetricsCollector();
    // Shape mirrors the Strands adapters: Anthropic maps cache_read_input_tokens /
    // cache_creation_input_tokens onto these fields; Bedrock passes them through.
    m.recordResultUsage({
      inputTokens: 900,
      outputTokens: 210,
      cacheReadInputTokens: 8000,
      cacheWriteInputTokens: 1500,
    });
    expect(m.readMetrics().usage).toEqual({
      inputTokens: 900,
      outputTokens: 210,
      cacheReadInputTokens: 8000,
      cacheWriteInputTokens: 1500,
    });
  });

  test('accumulates cache counts across invokes and tolerates results without them', () => {
    const m = new MetricsCollector();
    m.recordResultUsage({ inputTokens: 100, outputTokens: 10, cacheReadInputTokens: 500 });
    // Second invoke (e.g. the grade-refine turn) adds writes and more reads.
    m.recordResultUsage({
      inputTokens: 50,
      outputTokens: 5,
      cacheReadInputTokens: 700,
      cacheWriteInputTokens: 40,
    });
    // A provider result with no cache fields must not disturb the totals.
    m.recordResultUsage({ inputTokens: 25 });
    expect(m.readMetrics().usage).toEqual({
      inputTokens: 175,
      outputTokens: 15,
      cacheReadInputTokens: 1200,
      cacheWriteInputTokens: 40,
    });
    // Undefined / empty results still record nothing.
    m.recordResultUsage(undefined);
    m.recordResultUsage({});
    expect(m.readMetrics().usage).toEqual({
      inputTokens: 175,
      outputTokens: 15,
      cacheReadInputTokens: 1200,
      cacheWriteInputTokens: 40,
    });
  });
});
