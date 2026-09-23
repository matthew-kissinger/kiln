/** Real Strands loop: usage, counters, recovery and model context, without network. */
import { expect, test } from 'bun:test';
import { runKilnAgent } from '../run';
import { ScriptedModel } from './scripted-model';
import { programReference } from '../../program-store';
const BOX_CODE = `
const meta = { name: 'test-box', category: 'prop' };
function build() {
  const root = createRoot('Root');
  createPart('Mesh_Box', boxGeo(1, 1, 1), gameMaterial('#ff0000'), { parent: root, position: [0, 0.5, 0] });
  return root;
}
`;

test('reference workflow retains cache usage, render counts and compact plain system text', async () => {
  const programRef = await programReference(BOX_CODE);
  const model = new ScriptedModel([
    {
      toolCalls: [{ name: 'kiln_validate', input: { code: BOX_CODE } }],
      usage: { inputTokens: 100, outputTokens: 10, totalTokens: 110, cacheWriteInputTokens: 900 },
    },
    { toolCalls: [{ name: 'kiln_render', input: { programRef, capture: { preset: '2x2' } } }] },
    {
      toolCalls: [{ name: 'kiln_finish', input: { programRef } }],
      usage: { inputTokens: 50, outputTokens: 5, totalTokens: 55, cacheReadInputTokens: 900 },
    },
    { text: 'unreachable' },
  ]);
  const candidates: { code: string; pngBase64: string; tris?: number }[] = [];
  const result = await runKilnAgent({
    model,
    prompt: 'a red box',
    onCandidate: (c) => candidates.push(c),
  });
  expect(result.completion).toBe('finished');
  expect(result.code).toBe(BOX_CODE);
  expect(result.steps).toBe(3);
  expect(result.toolCalls).toEqual(['kiln_validate', 'kiln_render', 'kiln_finish']);
  expect(result.captureSelection).toEqual({ capture: { preset: '2x2' } });
  expect(result.usage).toEqual({
    inputTokens: 150,
    outputTokens: 15,
    cacheReadInputTokens: 900,
    cacheWriteInputTokens: 900,
  });
  expect(result.counters!.modelCalls).toHaveLength(3);
  const sizes = result.counters!.modelCalls.map((c) => c.messages);
  expect(sizes.every((size) => size > 0)).toBe(true);
  expect([...sizes].sort((a, b) => a - b)).toEqual(sizes);
  expect(result.counters!.renders).toBe(1);
  expect(candidates).toHaveLength(1);
  expect(candidates[0]!.code).toBe(BOX_CODE);
  expect(candidates[0]!.pngBase64).toBe(result.artifact!.review.pngBase64!);
  expect(candidates[0]!.tris).toBeGreaterThan(0);
  expect(model.seenSystemPrompts).toHaveLength(3);
  for (const prompt of model.seenSystemPrompts) {
    expect(typeof prompt).toBe('string');
    expect(String(prompt)).toContain('3D assets');
    expect(String(prompt)).toContain('kiln_discover');
  }
});

test('a model can recover from rejected mixed completion without finishing stale work', async () => {
  const programRef = await programReference(BOX_CODE);
  const model = new ScriptedModel([
    {
      toolCalls: [
        { name: 'kiln_render', input: { code: BOX_CODE } },
        { name: 'kiln_finish', input: { programRef } },
      ],
    },
    { toolCalls: [{ name: 'kiln_render', input: { code: BOX_CODE, capture: { preset: '1x1' } } }] },
    { toolCalls: [{ name: 'kiln_finish', input: { programRef } }] },
  ]);
  const result = await runKilnAgent({ model, prompt: 'a box' });
  expect(result.error).toBeUndefined();
  expect(result.completion).toBe('finished');
  expect(result.steps).toBe(3);
  expect(result.counters!.renders).toBe(1);
});

test('refinement context carries the existing reference and keeps task changes out of constant system text', async () => {
  const ref = await programReference(BOX_CODE);
  const model = new ScriptedModel([{ text: 'stopped' }]);
  await runKilnAgent({
    model,
    prompt: 'make it cobalt',
    existingCode: BOX_CODE,
    originalPrompt: 'a red box',
  });
  const system = model.seenSystemPrompts[0];
  expect(String(system)).not.toContain('cobalt');
  const text = JSON.stringify(model.messageSnapshots[0]);
  expect(text).toContain('make it cobalt');
  expect(text).toContain(`p_${ref.slice(7, 19)}`);
  expect(text).toContain('preserve features unrelated');
  expect(text).not.toContain('function build()');
});

test('failed rendering emits no candidate and assistant source is never promoted', async () => {
  const candidates: unknown[] = [];
  const result = await runKilnAgent({
    model: new ScriptedModel([
      { toolCalls: [{ name: 'kiln_render', input: { code: 'nope(' } }] },
      { text: BOX_CODE },
    ]),
    prompt: 'box',
    onCandidate: (c) => candidates.push(c),
  });
  expect(result.completion).toBe('failed');
  expect(result.code).toBeUndefined();
  expect(candidates).toEqual([]);
});
