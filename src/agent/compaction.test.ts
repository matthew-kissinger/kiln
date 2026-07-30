/**
 * Generation-loop transcript compaction — stale render-image pruning.
 *
 * Pins the surgical contract: across a multi-render transcript only the newest
 * image-bearing tool result keeps its image(s); every older one gets a text
 * placeholder INSIDE the tool result (same toolUseId, same message count — the
 * tool-use/tool-result pairing is never disturbed), the JSON metrics half of
 * each result survives, images outside tool results (the user's reference
 * inputImage) are untouched, and the pass is idempotent. The installer test
 * mirrors hooks.test.ts's fake-agent pattern to pin the BeforeModelCallEvent
 * wiring without a live model.
 */
import { describe, expect, test } from 'bun:test';
import {
  BeforeModelCallEvent,
  ImageBlock,
  JsonBlock,
  Message,
  TextBlock,
  ToolResultBlock,
  ToolUseBlock,
} from '@strands-agents/sdk';

import {
  installGenerationCounters,
  installRenderImageCompaction,
  pruneStaleRenderImages,
  STALE_RENDER_PLACEHOLDER,
} from './compaction';
import { AfterToolCallEvent } from '@strands-agents/sdk';

const png = () => new ImageBlock({ format: 'png', source: { bytes: new Uint8Array([137, 80]) } });

const toolUse = (id: string, name = 'kiln_render'): Message =>
  new Message({
    role: 'assistant',
    content: [new ToolUseBlock({ name, toolUseId: id, input: {} })],
  });

/** A render-shaped tool result: [ImageBlock xN, JsonBlock] (toCallbackResult order). */
const renderResult = (id: string, images = 1): Message =>
  new Message({
    role: 'user',
    content: [
      new ToolResultBlock({
        toolUseId: id,
        status: 'success',
        content: [...Array.from({ length: images }, png), new JsonBlock({ json: { ok: true } })],
      }),
    ],
  });

/** An image-free tool result (e.g. kiln_validate). */
const jsonResult = (id: string): Message =>
  new Message({
    role: 'user',
    content: [
      new ToolResultBlock({
        toolUseId: id,
        status: 'success',
        content: [new JsonBlock({ json: { valid: true } })],
      }),
    ],
  });

function toolResultOf(message: Message): ToolResultBlock {
  const block = message.content[0];
  if (!(block instanceof ToolResultBlock)) throw new Error('expected a tool result block');
  return block;
}

const imageCount = (message: Message): number =>
  toolResultOf(message).content.filter((c) => (c as { type?: string }).type === 'imageBlock')
    .length;

const textOf = (message: Message): string[] =>
  toolResultOf(message)
    .content.filter((c): c is TextBlock => (c as { type?: string }).type === 'textBlock')
    .map((t) => t.text);

/** A three-render transcript with a validate call in between. */
function transcript(): Message[] {
  return [
    new Message({ role: 'user', content: [new TextBlock('build a chest')] }),
    toolUse('r1'),
    renderResult('r1'),
    toolUse('v1', 'kiln_validate'),
    jsonResult('v1'),
    toolUse('r2'),
    renderResult('r2'),
    toolUse('r3'),
    renderResult('r3'),
    new Message({ role: 'assistant', content: [new TextBlock('looks good')] }),
  ];
}

describe('pruneStaleRenderImages', () => {
  test('only the latest render image survives; older results get the placeholder', () => {
    const messages = transcript();
    const result = pruneStaleRenderImages(messages);

    expect(result).toEqual({ prunedImages: 2, prunedResults: 2 });
    expect(imageCount(messages[2]!)).toBe(0);
    expect(textOf(messages[2]!)).toEqual([STALE_RENDER_PLACEHOLDER]);
    expect(imageCount(messages[6]!)).toBe(0);
    expect(textOf(messages[6]!)).toEqual([STALE_RENDER_PLACEHOLDER]);
    // The newest render keeps its image untouched.
    expect(imageCount(messages[8]!)).toBe(1);
    expect(textOf(messages[8]!)).toEqual([]);
  });

  test('tool-use/tool-result pairing is intact: no messages added/removed, ids stable', () => {
    const messages = transcript();
    pruneStaleRenderImages(messages);

    expect(messages).toHaveLength(10);
    // Every tool use still has its matching tool result with the same id.
    for (const [useAt, id] of [
      [1, 'r1'],
      [3, 'v1'],
      [5, 'r2'],
      [7, 'r3'],
    ] as const) {
      const use = messages[useAt]!.content[0] as ToolUseBlock;
      expect(use.toolUseId).toBe(id);
      expect(toolResultOf(messages[useAt + 1]!).toolUseId).toBe(id);
    }
    // The JSON metrics half of a pruned result survives.
    const prunedContent = toolResultOf(messages[2]!).content;
    expect(prunedContent.some((c) => (c as { type?: string }).type === 'jsonBlock')).toBe(true);
  });

  test('is idempotent: a second pass prunes nothing and changes nothing', () => {
    const messages = transcript();
    pruneStaleRenderImages(messages);
    const snapshot = JSON.stringify(messages);

    const second = pruneStaleRenderImages(messages);

    expect(second).toEqual({ prunedImages: 0, prunedResults: 0 });
    expect(JSON.stringify(messages)).toBe(snapshot);
  });

  test('a multi-image result (perFrame animation) collapses to ONE placeholder', () => {
    const messages = [toolUse('a1'), renderResult('a1', 4), toolUse('r1'), renderResult('r1')];
    const result = pruneStaleRenderImages(messages);

    expect(result).toEqual({ prunedImages: 4, prunedResults: 1 });
    expect(imageCount(messages[1]!)).toBe(0);
    expect(textOf(messages[1]!)).toEqual([
      '[4 earlier render images omitted — superseded by a newer render]',
    ]);
    expect(imageCount(messages[3]!)).toBe(1);
  });

  test('images outside tool results (the reference inputImage) are never touched', () => {
    const messages = [
      new Message({ role: 'user', content: [new TextBlock('match this'), png()] }),
      toolUse('r1'),
      renderResult('r1'),
      toolUse('r2'),
      renderResult('r2'),
    ];
    pruneStaleRenderImages(messages);

    const first = messages[0]!.content;
    expect(first.some((c) => (c as { type?: string }).type === 'imageBlock')).toBe(true);
  });

  test('keep:2 preserves the two newest image-bearing results', () => {
    const messages = transcript();
    const result = pruneStaleRenderImages(messages, { keep: 2 });

    expect(result).toEqual({ prunedImages: 1, prunedResults: 1 });
    expect(imageCount(messages[2]!)).toBe(0);
    expect(imageCount(messages[6]!)).toBe(1);
    expect(imageCount(messages[8]!)).toBe(1);
  });

  test('no-op on a transcript with at most one image-bearing result', () => {
    const single = [toolUse('r1'), renderResult('r1')];
    expect(pruneStaleRenderImages(single)).toEqual({ prunedImages: 0, prunedResults: 0 });
    expect(imageCount(single[1]!)).toBe(1);
    expect(pruneStaleRenderImages([])).toEqual({ prunedImages: 0, prunedResults: 0 });
  });
});

describe('installRenderImageCompaction', () => {
  type Cb = (event: unknown) => void;

  /** Minimal Agent stand-in (hooks.test.ts pattern): hook registry + dispatch. */
  function fakeAgent(messages: Message[]) {
    const hooks = new Map<unknown, Cb[]>();
    const agent = {
      messages,
      addHook(EventClass: unknown, cb: Cb) {
        const arr = hooks.get(EventClass) ?? [];
        arr.push(cb);
        hooks.set(EventClass, arr);
        return () => {};
      },
    };
    const modelCall = () => {
      for (const cb of hooks.get(BeforeModelCallEvent) ?? []) cb({ agent });
    };
    return { agent, modelCall };
  }

  test('prunes before each model call and reports via onPrune', () => {
    const messages = transcript();
    const pruned: number[] = [];
    const { agent, modelCall } = fakeAgent(messages);
    installRenderImageCompaction(agent as never, { onPrune: (i) => pruned.push(i.prunedImages) });

    modelCall();
    expect(imageCount(messages[2]!)).toBe(0);
    expect(imageCount(messages[8]!)).toBe(1);
    expect(pruned).toEqual([2]);

    // Second call: nothing left to prune, so onPrune stays quiet.
    modelCall();
    expect(pruned).toEqual([2]);
  });
});

describe('installGenerationCounters', () => {
  type Cb = (event: unknown) => void;

  /** Fake agent that also dispatches AfterToolCallEvent (tool results). */
  function fakeAgent(messages: Message[]) {
    const hooks = new Map<unknown, Cb[]>();
    const agent = {
      messages,
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
    const modelCall = (projectedInputTokens?: number) => {
      for (const cb of hooks.get(BeforeModelCallEvent) ?? []) {
        cb({ agent, ...(projectedInputTokens != null ? { projectedInputTokens } : {}) });
      }
    };
    const toolResult = (result: ToolResultBlock) => {
      for (const cb of hooks.get(AfterToolCallEvent) ?? []) cb({ agent, result });
    };
    return { agent, modelCall, toolResult };
  }

  const imageResult = (id: string, images = 1) => toolResultOf(renderResult(id, images));
  const plainResult = (id: string) => toolResultOf(jsonResult(id));

  test('M1: records projected input tokens + transcript length per model call', () => {
    const messages = transcript();
    const { agent, modelCall } = fakeAgent(messages);
    const { counters } = installGenerationCounters(agent as never);

    modelCall(1234);
    messages.push(new Message({ role: 'assistant', content: [new TextBlock('…')] }));
    modelCall(2345);
    modelCall(); // no projection available from the SDK

    expect(counters.modelCalls).toEqual([
      { inputTokens: 1234, messages: 10 },
      { inputTokens: 2345, messages: 11 },
      { messages: 11 },
    ]);
  });

  test('M2: counts image-bearing (render) tool results; JSON-only results do not count', () => {
    const { agent, toolResult } = fakeAgent([]);
    const { counters } = installGenerationCounters(agent as never);

    toolResult(imageResult('r1'));
    toolResult(plainResult('v1')); // e.g. a validation-style JSON result
    toolResult(imageResult('r2', 4)); // one multi-image result = ONE render
    expect(counters.renders).toBe(2);
    expect(counters.modelCalls).toEqual([]);
  });

  test('uninstall stops both counters', () => {
    const messages = transcript();
    const { agent, modelCall, toolResult } = fakeAgent(messages);
    const { counters, uninstall } = installGenerationCounters(agent as never);

    modelCall(10);
    toolResult(imageResult('r1'));
    uninstall();
    modelCall(20);
    toolResult(imageResult('r2'));

    expect(counters.modelCalls).toEqual([{ inputTokens: 10, messages: 10 }]);
    expect(counters.renders).toBe(1);
  });
});
