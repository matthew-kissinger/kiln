/**
 * Regression tests for `ensureStreamStart` — the OpenRouter/Vercel-bridge fix.
 *
 * Build a fake LanguageModelV3 whose doStream emits a chosen sequence of parts,
 * drain the wrapped stream, and assert `stream-start` leads exactly once. No
 * network. Mirrors the live OpenRouter doStream, which omits `stream-start` and
 * thus made Strands throw "Stream ended without completing a message".
 */
import { test, expect } from 'bun:test';
import { ensureStreamStart } from './stream-start';

function fakeModel(
  parts: Array<{ type: string; [k: string]: unknown }>,
  extra: Record<string, unknown> = {},
) {
  return {
    specificationVersion: 'v3',
    provider: 'fake',
    modelId: 'fake/m',
    ...extra,
    doStream: async (_opts: unknown) => ({
      stream: new ReadableStream({
        start(ctrl) {
          for (const p of parts) ctrl.enqueue(p);
          ctrl.close();
        },
      }),
    }),
  } as never;
}

async function drain(model: {
  doStream: (o: unknown) => Promise<{ stream: ReadableStream }>;
}): Promise<string[]> {
  const { stream } = await model.doStream({});
  const reader = stream.getReader();
  const types: string[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    types.push((value as { type: string }).type);
  }
  return types;
}

test('injects a leading stream-start when the provider omits it (OpenRouter shape)', async () => {
  const wrapped = ensureStreamStart(
    fakeModel([{ type: 'response-metadata' }, { type: 'tool-call' }, { type: 'finish' }]),
  );
  const types = await drain(wrapped as never);
  expect(types[0]).toBe('stream-start');
  expect(types).toEqual(['stream-start', 'response-metadata', 'tool-call', 'finish']);
  expect(types.filter((t) => t === 'stream-start').length).toBe(1);
});

test('is a no-op when the provider already emits stream-start', async () => {
  const wrapped = ensureStreamStart(
    fakeModel([{ type: 'stream-start', warnings: [] }, { type: 'finish' }]),
  );
  expect(await drain(wrapped as never)).toEqual(['stream-start', 'finish']);
});

test('injects stream-start even for an empty stream', async () => {
  const wrapped = ensureStreamStart(fakeModel([]));
  expect(await drain(wrapped as never)).toEqual(['stream-start']);
});

test('passes through non-doStream properties', () => {
  const wrapped = ensureStreamStart(fakeModel([], { modelId: 'fake/keep' }));
  expect((wrapped as unknown as { specificationVersion: string }).specificationVersion).toBe('v3');
  expect((wrapped as unknown as { modelId: string }).modelId).toBe('fake/keep');
});
