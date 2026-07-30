/**
 * runKilnAgent integration over a ScriptedModel — the real Strands Agent loop
 * (concurrent tool executor, hooks, usage accumulation) with zero network.
 *
 * Pins the loop-efficiency wiring end to end:
 *  - A2-instrumentation: cache read/write token counts flow from the model's
 *    metadata events into `result.usage`.
 *  - M1/M2: `result.counters` carries per-model-call stats and the
 *    renders-per-generation count.
 *  - A2-cachepoint: a provider whose adapter does NOT consume system-prompt
 *    cache points receives the PLAIN STRING system prompt (block-array shaping
 *    for Anthropic/Bedrock is pinned in providers.test.ts).
 *  - A3: the mutator batch guard is installed on the real run path.
 */
import { describe, expect, test } from 'bun:test';

import { runKilnAgent } from '../run';
import { ScriptedModel } from './scripted-model';

const BOX_CODE = `
const meta = { name: 'test-box', category: 'prop' };
function build() {
  const root = createRoot('Root');
  createPart('Mesh_Box', boxGeo(1, 1, 1), gameMaterial('#ff0000'), { parent: root, position: [0, 0.5, 0] });
  return root;
}
`;

describe('runKilnAgent over a ScriptedModel (unified surface)', () => {
  test('draft -> render -> finalize: captures code, usage w/ cache counts, and M1/M2 counters', async () => {
    const model = new ScriptedModel([
      {
        toolCalls: [{ name: 'kiln_draft', input: { code: BOX_CODE } }],
        usage: {
          inputTokens: 100,
          outputTokens: 10,
          totalTokens: 110,
          cacheWriteInputTokens: 900,
        },
      },
      { toolCalls: [{ name: 'kiln_render' }] },
      { toolCalls: [{ name: 'kiln_finalize' }] },
      {
        text: 'done',
        usage: {
          inputTokens: 50,
          outputTokens: 5,
          totalTokens: 55,
          cacheReadInputTokens: 900,
        },
      },
    ]);

    const result = await runKilnAgent({
      model,
      prompt: 'a red test box',
      toolSurface: 'unified',
      gradeRefine: 'off',
    });

    expect(result.error).toBeUndefined();
    expect(result.code).toBe(BOX_CODE);
    expect(result.steps).toBe(4);
    expect(result.toolCalls).toEqual(['kiln_draft', 'kiln_render', 'kiln_finalize']);

    // A2-instrumentation: cache counts accumulated alongside the token totals.
    expect(result.usage).toEqual({
      inputTokens: 150,
      outputTokens: 15,
      cacheReadInputTokens: 900,
      cacheWriteInputTokens: 900,
    });

    // M1: one record per model call, each with the transcript length it saw.
    expect(result.counters).toBeDefined();
    expect(result.counters!.modelCalls).toHaveLength(4);
    for (const call of result.counters!.modelCalls) {
      expect(call.messages).toBeGreaterThan(0);
    }
    // The transcript grows monotonically across calls.
    const sizes = result.counters!.modelCalls.map((c) => c.messages);
    expect([...sizes].sort((a, b) => a - b)).toEqual(sizes);

    // M2: exactly one render-bearing tool result (the kiln_render six-view image;
    // draft/finalize results are JSON-only).
    expect(result.counters!.renders).toBe(1);

    // A2-cachepoint: ScriptedModel is not an Anthropic/Bedrock adapter, so the
    // system prompt must arrive as the PLAIN STRING on every model call.
    expect(model.seenSystemPrompts).toHaveLength(4);
    for (const sp of model.seenSystemPrompts) {
      expect(typeof sp).toBe('string');
      expect(sp as string).toContain('3D asset');
    }
  });

  test('A3 on the real run path: a mixed mutator batch is rejected, the model recovers', async () => {
    const model = new ScriptedModel([
      // Turn 1: illegal batch — a buffer write alongside a reader.
      { toolCalls: [{ name: 'kiln_draft', input: { code: BOX_CODE } }, { name: 'kiln_view' }] },
      // Turn 2: the model follows the guard's instruction — mutator alone.
      { toolCalls: [{ name: 'kiln_draft', input: { code: BOX_CODE } }] },
      { toolCalls: [{ name: 'kiln_finalize' }] },
      { text: 'done' },
    ]);

    const result = await runKilnAgent({
      model,
      prompt: 'a red test box',
      toolSurface: 'unified',
      gradeRefine: 'off',
    });

    expect(result.error).toBeUndefined();
    // The rejected batch never wrote the buffer; the retry did, and finalize
    // locked it in — so the run still converges on the drafted program.
    expect(result.code).toBe(BOX_CODE);
    expect(result.steps).toBe(4);
  });

  test('refine framing keeps the directive INSIDE the (cacheable) system prompt text', async () => {
    const model = new ScriptedModel([{ toolCalls: [{ name: 'kiln_finalize' }] }, { text: 'done' }]);

    await runKilnAgent({
      model,
      prompt: 'make it blue',
      toolSurface: 'unified',
      existingCode: BOX_CODE,
      gradeRefine: 'off',
    });

    const sp = model.seenSystemPrompts[0] as string;
    expect(typeof sp).toBe('string');
    // The refine directive is prepended to the same string that becomes the
    // cached TextBlock for cache-point providers.
    expect(sp.startsWith('You are MODIFYING an existing Kiln asset')).toBe(true);
  });
});
