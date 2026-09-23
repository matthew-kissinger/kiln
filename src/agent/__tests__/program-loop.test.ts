import { expect, test } from 'bun:test';
import { runKilnAgent } from '../run';
import { ScriptedModel } from './scripted-model';
import { createGenerationCallBudget } from '../call-budget';
import { MemoryProgramStore, programReference } from '../../program-store';
import { renderGLBInProcess } from '../../render';
import { createAssetRequirementsStore } from '../../requirements-store';
import { createAssetRequirementsV1 } from '../../contracts/requirements';

const code = `const meta={name:'Native cube'};
function build(){const r=createRoot('Cube');createPart('Body',boxGeo(1,1,1),gameMaterial('#778899'),{parent:r,position:[0,.5,0]});return r;}`;
const capture = { preset: '1x1' as const };

test('SDK token limits complete the current tool batch and retain a partial checkpoint', async () => {
  for (const [limits, stopReason] of [
    [{ outputTokens: 5 }, 'limitOutputTokens'],
    [{ totalTokens: 20 }, 'limitTotalTokens'],
    [{ turns: 1 }, 'limitTurns'],
  ] as const) {
    const model = new ScriptedModel([
      {
        toolCalls: [{ name: 'kiln_render', input: { code, capture } }],
        usage: { inputTokens: 20, outputTokens: 10, totalTokens: 30 },
      },
      { text: 'Must not dispatch.' },
    ]);
    const result = await runKilnAgent({ model, prompt: 'Cube', limits });
    expect(result.completion).toBe('partial');
    expect(result.code).toBe(code);
    expect(result.capped).toBe(true);
    expect(result.stopReason).toBe(stopReason);
    expect(model.seenSystemPrompts).toHaveLength(1);
  }
});

test('invalid SDK limits fail before model dispatch', async () => {
  for (const limits of [
    { turns: -1 },
    { turns: Infinity },
    { outputTokens: NaN },
    { totalTokens: 0 },
  ]) {
    const model = new ScriptedModel([{ text: 'Must not dispatch.' }]);
    const result = await runKilnAgent({ model, prompt: 'Cube', limits });
    expect(result.completion).toBe('failed');
    expect(result.error).toBeDefined();
    expect(model.seenSystemPrompts).toHaveLength(0);
    const bounded = await runKilnAgent({
      model,
      prompt: 'Cube',
      limits,
      generationCallBudget: createGenerationCallBudget(2),
    });
    expect(bounded.completion).toBe('failed');
    expect(model.seenSystemPrompts).toHaveLength(0);
  }
});

test('real harness finishes on the last admitted call and returns the exact evaluated bytes', async () => {
  const ref = await programReference(code);
  let evaluations = 0;
  const model = new ScriptedModel([
    { toolCalls: [{ name: 'kiln_discover', input: { query: 'box' } }] },
    { toolCalls: [{ name: 'kiln_render', input: { code, capture } }] },
    {
      toolCalls: [{ name: 'kiln_finish', input: { programRef: ref } }],
      usage: { inputTokens: 100, outputTokens: 10, totalTokens: 110 },
    },
    { text: 'This call must never be billed.' },
  ]);
  const result = await runKilnAgent({
    model,
    prompt: 'A cube',
    generationCallBudget: createGenerationCallBudget(3),
    evaluatorPort: {
      render: async (source, options) => {
        evaluations++;
        return renderGLBInProcess(source, options);
      },
    },
  });
  expect(result.error).toBeUndefined();
  expect(result.completion).toBe('finished');
  expect(result.programRef).toBe(ref);
  expect(result.steps).toBe(3);
  expect(result.capped).toBeUndefined();
  expect(evaluations).toBe(1);
  expect(result.artifact!.rendered.glb.byteLength).toBeGreaterThan(100);
  expect(result.artifact!.review.viewFidelity!.inputGlbSha256).toBe(
    result.artifact!.rendered.artifactGlbSha256,
  );
  expect(result.usage?.inputTokens).toBe(100);
  expect(model.seenSystemPrompts).toHaveLength(3);
  expect(String(model.seenSystemPrompts[0])).toContain('kiln_source');
  expect(String(model.seenSystemPrompts[0])).not.toContain('kiln_submit');
});

test('native completion cannot race a render in the same concurrent batch', async () => {
  const store = new MemoryProgramStore();
  const ref = await store.put(code);
  let evaluations = 0;
  const result = await runKilnAgent({
    model: new ScriptedModel([
      {
        toolCalls: [
          { name: 'kiln_render', input: { programRef: ref, capture } },
          { name: 'kiln_finish', input: { programRef: ref } },
        ],
      },
      { text: 'Stopped.' },
    ]),
    programStore: store,
    prompt: 'Cube',
    evaluatorPort: {
      render: async (source, options) => {
        evaluations++;
        return renderGLBInProcess(source, options);
      },
    },
  });
  expect(evaluations).toBe(0);
  expect(result.completion).toBe('failed');
  expect(result.error).toContain('kiln_finish');
});

test('capped unfinished work remains a reviewed partial checkpoint without executing a changed draft', async () => {
  const changed = code.replace('#778899', '#aabbcc');
  const result = await runKilnAgent({
    model: new ScriptedModel([
      { toolCalls: [{ name: 'kiln_render', input: { code, capture } }] },
      { toolCalls: [{ name: 'kiln_validate', input: { code: changed } }] },
    ]),
    prompt: 'Cube',
    generationCallBudget: createGenerationCallBudget(2),
  });
  expect(result.completion).toBe('partial');
  expect(result.code).toBe(code);
  expect(result.programRef).toBe(await programReference(code));
  expect(result.capped).toBe(true);
  expect(result.error).toMatch(/budget|cap/);
});

test('legacy policy and surface choices fail before invoking a model', async () => {
  for (const legacy of [{ category: 'prop' as const }, { toolSurface: 'unified' as const }]) {
    const model = new ScriptedModel([{ text: 'Must not run.' }]);
    const result = await runKilnAgent({ model, prompt: 'Cube', ...legacy });
    expect(result.completion).toBe('failed');
    expect(result.error).toMatch(/migration|removed/);
    expect(model.seenSystemPrompts).toHaveLength(0);
  }
});

test('refinement resumes retained source and finishes a new reviewed revision without losing the base', async () => {
  const store = new MemoryProgramStore();
  const base = await store.put(code);
  const changed = code.replace('#778899', '#aabbcc');
  const ref = await programReference(changed);
  const result = await runKilnAgent({
    model: new ScriptedModel([
      { toolCalls: [{ name: 'kiln_source', input: { programRef: base } }] },
      {
        toolCalls: [
          {
            name: 'kiln_edit',
            input: {
              programRef: base,
              edits: [{ oldString: '#778899', newString: '#aabbcc' }],
              capture,
            },
          },
        ],
      },
      { toolCalls: [{ name: 'kiln_finish', input: { programRef: ref } }] },
    ]),
    prompt: 'Change the color',
    programStore: store,
    existingProgramRef: base,
  });
  expect(result.completion).toBe('finished');
  expect(result.code).toBe(changed);
  expect(await store.get(base)).toBe(code);
  expect(result.diff).toContain('#aabbcc');
});

test('native completion preserves uncovered host requirements as incomplete', async () => {
  const requirements = createAssetRequirementsStore().host.bind(
    { taskId: 'arena', lineageId: 'one' },
    createAssetRequirementsV1({
      requirements: {
        structure: { state: 'requested', value: { roof: { type: 'custom-arched-shell' } } },
      },
    }),
    { actor: 'owner', reason: 'Custom roof requested', source: 'brief' },
  );
  const result = await runKilnAgent({
    model: new ScriptedModel([
      { toolCalls: [{ name: 'kiln_render', input: { code, capture } }] },
      { toolCalls: [{ name: 'kiln_finish', input: { programRef: await programReference(code) } }] },
    ]),
    prompt: 'Custom arched roof',
    requirements,
  });
  expect(result.completion).toBe('finished');
  expect(result.artifact!.rendered.requirements.binding).toEqual(requirements);
  expect(result.artifact!.rendered.meta.qaReport).toMatchObject({ acceptance: 'incomplete' });
});

test('native finish cannot promote a revision blocked by a measured storey requirement', async () => {
  const requirements = createAssetRequirementsStore().host.bind(
    { taskId: 'structure', lineageId: 'one' },
    createAssetRequirementsV1({
      requirements: { structure: { state: 'requested', value: { storeyCount: 6 } } },
    }),
    { actor: 'owner', reason: 'Six levels requested', source: 'brief' },
  );
  const result = await runKilnAgent({
    model: new ScriptedModel([
      { toolCalls: [{ name: 'kiln_render', input: { code, capture } }] },
      { toolCalls: [{ name: 'kiln_finish', input: { programRef: await programReference(code) } }] },
    ]),
    prompt: 'Six levels',
    requirements,
  });
  expect(result.completion).toBe('failed');
  expect(result.artifact).toBeUndefined();
});

test('cancelling the native run aborts an in-flight renderer and does not retain an unreviewed artifact', async () => {
  const controller = new AbortController();
  let portSignal: AbortSignal | undefined;
  const model = new ScriptedModel([
    { toolCalls: [{ name: 'kiln_render', input: { code, capture } }] },
  ]);
  const result = await runKilnAgent({
    model,
    prompt: 'Cube',
    signal: controller.signal,
    viewRenderRequired: true,
    viewRenderTimeoutMs: 100,
    viewRenderPort: async (_request, controls) => {
      portSignal = controls?.signal;
      queueMicrotask(() => controller.abort(new Error('owner cancelled')));
      return new Promise(() => {});
    },
  });
  expect(result.completion).toBe('failed');
  expect(result.error).toContain('cancel');
  expect(portSignal?.reason?.message).toBe('owner cancelled');
  expect(result.artifact).toBeUndefined();
  expect(model.seenSystemPrompts).toHaveLength(1);
});
