/**
 * A3 mutator/reader batch guard.
 *
 * Unit level: `rejectMixedMutatorBatch` / `toolNamesInBatch` are pure, so the
 * allow/deny matrix is pinned directly. Integration level: a REAL Strands
 * `Agent` (default CONCURRENT tool executor) driven by a ScriptedModel proves
 * the guard rejects a mixed batch on the genuine run path — the batch's tool
 * results come back as errors carrying the guard's message, the mutator never
 * touches the buffer — while a solo mutator and a pure-reader batch execute.
 */
import { describe, expect, test } from 'bun:test';
import { Agent, Message, ToolResultBlock, ToolUseBlock, TextBlock } from '@strands-agents/sdk';

import {
  KILN_MUTATOR_TOOLS,
  installMutatorBatchGuard,
  rejectMixedMutatorBatch,
  toolNamesInBatch,
} from './concurrency';
import { makeKilnUnifiedTools, type UnifiedSink } from './tools';
import { ScriptedModel } from './__tests__/scripted-model';

const BOX_CODE = `
const meta = { name: 'test-box', category: 'prop' };
function build() {
  const root = createRoot('Root');
  createPart('Mesh_Box', boxGeo(1, 1, 1), gameMaterial('#ff0000'), { parent: root, position: [0, 0.5, 0] });
  return root;
}
`;

describe('rejectMixedMutatorBatch', () => {
  test('classifies exactly kiln_draft and kiln_edit as mutators', () => {
    expect([...KILN_MUTATOR_TOOLS].sort()).toEqual(['kiln_draft', 'kiln_edit']);
  });

  test('mixed mutator + reader batch is rejected with an actionable message', () => {
    const msg = rejectMixedMutatorBatch(['kiln_edit', 'kiln_render']);
    expect(msg).toBeDefined();
    expect(msg).toContain('kiln_edit');
    expect(msg).toContain('ALONE');
    expect(msg).toContain('No tools were executed');
  });

  test('two mutators together are also rejected', () => {
    expect(rejectMixedMutatorBatch(['kiln_draft', 'kiln_edit'])).toBeDefined();
    expect(rejectMixedMutatorBatch(['kiln_edit', 'kiln_edit'])).toBeDefined();
  });

  test('solo mutator is allowed', () => {
    expect(rejectMixedMutatorBatch(['kiln_draft'])).toBeUndefined();
    expect(rejectMixedMutatorBatch(['kiln_edit'])).toBeUndefined();
  });

  test('pure-reader batches are allowed', () => {
    expect(rejectMixedMutatorBatch(['kiln_view', 'kiln_render'])).toBeUndefined();
    expect(rejectMixedMutatorBatch(['kiln_render', 'kiln_inspect', 'kiln_view'])).toBeUndefined();
    expect(rejectMixedMutatorBatch([])).toBeUndefined();
  });
});

describe('toolNamesInBatch', () => {
  test('extracts toolUse names in order, ignoring text blocks', () => {
    const message = new Message({
      role: 'assistant',
      content: [
        new TextBlock('let me edit and render'),
        new ToolUseBlock({ name: 'kiln_edit', toolUseId: 'a', input: {} }),
        new ToolUseBlock({ name: 'kiln_render', toolUseId: 'b', input: {} }),
      ],
    });
    expect(toolNamesInBatch(message)).toEqual(['kiln_edit', 'kiln_render']);
  });
});

describe('installMutatorBatchGuard on a real Agent (concurrent executor)', () => {
  function toolResults(messages: readonly Message[]): ToolResultBlock[] {
    const out: ToolResultBlock[] = [];
    for (const m of messages) {
      for (const b of m.content) if (b instanceof ToolResultBlock) out.push(b);
    }
    return out;
  }

  test('a mixed kiln_draft + kiln_view batch is rejected: both calls error, buffer untouched', async () => {
    const sink: UnifiedSink = { edits: [] };
    const model = new ScriptedModel([
      { toolCalls: [{ name: 'kiln_draft', input: { code: BOX_CODE } }, { name: 'kiln_view' }] },
      { text: 'stopping after the rejection' },
    ]);
    const agent = new Agent({
      model,
      systemPrompt: 'test',
      tools: makeKilnUnifiedTools({ sink }) as never,
    });
    installMutatorBatchGuard(agent);

    await agent.invoke('build a box');

    // Neither tool ran: the draft never reached the buffer/sink.
    expect(sink.code).toBeUndefined();
    const results = toolResults(agent.messages);
    expect(results).toHaveLength(2);
    for (const r of results) {
      expect(r.status).toBe('error');
      const text = r.content
        .map((c) => ((c as { type?: string }).type === 'textBlock' ? (c as TextBlock).text : ''))
        .join(' ');
      expect(text).toContain('kiln_draft');
      expect(text).toContain('ALONE');
    }
  });

  test('a solo mutator executes, and a later pure-reader batch executes too', async () => {
    const sink: UnifiedSink = { edits: [] };
    const model = new ScriptedModel([
      { toolCalls: [{ name: 'kiln_draft', input: { code: BOX_CODE } }] },
      { toolCalls: [{ name: 'kiln_view' }, { name: 'kiln_view' }] },
      { toolCalls: [{ name: 'kiln_finalize' }] },
      { text: 'done' },
    ]);
    const agent = new Agent({
      model,
      systemPrompt: 'test',
      tools: makeKilnUnifiedTools({ sink }) as never,
    });
    installMutatorBatchGuard(agent);

    await agent.invoke('build a box');

    expect(sink.code).toBe(BOX_CODE);
    expect(sink.finalized).toBe(true);
    // Solo mutator + both readers + finalize all produced SUCCESS results.
    const results = toolResults(agent.messages);
    expect(results).toHaveLength(4);
    expect(results.every((r) => r.status === 'success')).toBe(true);
  });
});
