import { expect, test } from 'bun:test';
import { Agent, Message, ToolResultBlock, ToolUseBlock, TextBlock } from '@strands-agents/sdk';
import {
  installCompletionBatchGuard,
  rejectMixedCompletionBatch,
  toolNamesInBatch,
} from './concurrency';
import { makeKilnNativeTools } from './tools';
import { ScriptedModel } from './__tests__/scripted-model';
import { MemoryProgramStore, programReference } from '../program-store';
import type { NativeCompletion } from '../tools/program-artifacts';

const code = `const meta={name:'Box'};function build(){const root=createRoot('Root');createPart('Body',boxGeo(1,1,1),gameMaterial('#ff0000'),{parent:root});return root;}`;

test('only batches mixing native completion with another call are rejected', () => {
  for (const batch of [
    ['kiln_finish', 'kiln_render'],
    ['kiln_edit', 'kiln_finish'],
    ['kiln_finish', 'kiln_finish'],
  ]) {
    expect(rejectMixedCompletionBatch(batch)).toContain('must run alone');
    expect(rejectMixedCompletionBatch(batch)).toContain('No tools');
  }
  for (const batch of [
    [],
    ['kiln_finish'],
    ['kiln_edit'],
    ['kiln_edit', 'kiln_source'],
    ['kiln_edit', 'kiln_edit'],
    ['kiln_inspect', 'kiln_render'],
  ])
    expect(rejectMixedCompletionBatch(batch)).toBeUndefined();
});

test('tool name extraction ignores text and preserves batch order', () => {
  expect(
    toolNamesInBatch(
      new Message({
        role: 'assistant',
        content: [
          new TextBlock('review and finish'),
          new ToolUseBlock({ name: 'kiln_render', toolUseId: 'a', input: {} }),
          new ToolUseBlock({ name: 'kiln_finish', toolUseId: 'b', input: {} }),
        ],
      }),
    ),
  ).toEqual(['kiln_render', 'kiln_finish']);
});

function results(agent: Agent): ToolResultBlock[] {
  return agent.messages.flatMap((message) =>
    message.content.filter((b): b is ToolResultBlock => b instanceof ToolResultBlock),
  );
}

test('real concurrent executor rejects every call in a mixed completion batch', async () => {
  const completion: NativeCompletion = {};
  const programStore = new MemoryProgramStore();
  const ref = await programStore.put(code);
  let evaluated = false;
  const agent = new Agent({
    model: new ScriptedModel([
      {
        toolCalls: [
          { name: 'kiln_render', input: { programRef: ref } },
          { name: 'kiln_finish', input: { programRef: ref } },
        ],
      },
      { text: 'stopped' },
    ]),
    tools: makeKilnNativeTools(completion, {
      programStore,
      evaluatorPort: {
        render: async () => {
          evaluated = true;
          throw new Error('must not run');
        },
      },
    }),
  });
  installCompletionBatchGuard(agent);
  await agent.invoke('build');
  expect(evaluated).toBe(false);
  expect(completion.artifact).toBeUndefined();
  expect(results(agent)).toHaveLength(2);
  for (const result of results(agent)) {
    expect(result.status).toBe('error');
    expect(JSON.stringify(result.content)).toContain('must run alone');
  }
});

test('parallel edits and source reads remain independent revisions', async () => {
  const programStore = new MemoryProgramStore();
  const programRef = await programStore.put(code);
  const agent = new Agent({
    model: new ScriptedModel([
      {
        toolCalls: [
          {
            name: 'kiln_edit',
            input: {
              programRef,
              edits: [{ oldString: '#ff0000', newString: '#0000ff' }],
              capture: { preset: '1x1' },
            },
          },
          {
            name: 'kiln_edit',
            input: {
              programRef,
              edits: [{ oldString: '#ff0000', newString: '#00ff00' }],
              capture: { preset: '1x1' },
            },
          },
          { name: 'kiln_source', input: { programRef } },
        ],
      },
      { text: 'stopped' },
    ]),
    tools: makeKilnNativeTools({}, { programStore }),
  });
  installCompletionBatchGuard(agent);
  await agent.invoke('review variants');
  expect(await programStore.get(programRef)).toBe(code);
  for (const color of ['#0000ff', '#00ff00']) {
    const changed = code.replace('#ff0000', color);
    expect(await programStore.get(await programReference(changed))).toBe(changed);
  }
  expect(results(agent)).toHaveLength(3);
  expect(results(agent).every((result) => result.status === 'success')).toBe(true);
  const source = results(agent).find((result) =>
    JSON.stringify(result.content).includes('function build'),
  );
  expect(JSON.stringify(source?.content)).toContain('#ff0000');
});
