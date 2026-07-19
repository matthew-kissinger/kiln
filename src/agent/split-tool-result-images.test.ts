/**
 * Regression tests for `splitToolResultImages` — the Together/Inkling fix.
 *
 * Build a fake LanguageModelV3 whose doStream just captures the options it
 * received, so we can assert on the REWRITTEN prompt shape. No network.
 */
import { test, expect } from 'bun:test';
import { splitToolResultImages } from './split-tool-result-images';

function fakeModel(captured: { options?: unknown }) {
  return {
    specificationVersion: 'v3',
    provider: 'fake',
    modelId: 'fake/m',
    doStream: async (opts: unknown) => {
      captured.options = opts;
      return {
        stream: new ReadableStream({
          start(ctrl) {
            ctrl.close();
          },
        }),
      };
    },
  } as never;
}

test('moves a file-data tool-result image into a follow-up user message', async () => {
  const captured: { options?: unknown } = {};
  const wrapped = splitToolResultImages(fakeModel(captured));
  await (wrapped as unknown as { doStream: (o: unknown) => Promise<unknown> }).doStream({
    prompt: [
      { role: 'user', content: [{ type: 'text', text: 'render it' }] },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'call_1',
            toolName: 'kiln_render',
            output: {
              type: 'content',
              value: [
                { type: 'text', text: 'rendered ok' },
                { type: 'file-data', data: 'BASE64BYTES', mediaType: 'image/png' },
              ],
            },
          },
        ],
      },
    ],
  });
  const prompt = (captured.options as { prompt: unknown[] }).prompt;
  expect(prompt).toHaveLength(3);
  const toolMessage = prompt[1] as {
    role: string;
    content: Array<{ output: { value: unknown[] } }>;
  };
  expect(toolMessage.role).toBe('tool');
  expect(toolMessage.content[0]!.output.value).toEqual([{ type: 'text', text: 'rendered ok' }]);
  expect(prompt[2]).toEqual({
    role: 'user',
    content: [{ type: 'file', data: 'BASE64BYTES', mediaType: 'image/png' }],
  });
});

test('is a no-op for a tool result with no image', async () => {
  const captured: { options?: unknown } = {};
  const wrapped = splitToolResultImages(fakeModel(captured));
  const original = {
    prompt: [
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'call_1',
            toolName: 'kiln_validate',
            output: { type: 'text', value: 'ok' },
          },
        ],
      },
    ],
  };
  await (wrapped as unknown as { doStream: (o: unknown) => Promise<unknown> }).doStream(original);
  expect((captured.options as { prompt: unknown[] }).prompt).toEqual(original.prompt);
});

test('passes through non-doStream properties', () => {
  const wrapped = splitToolResultImages(fakeModel({}));
  expect((wrapped as unknown as { specificationVersion: string }).specificationVersion).toBe('v3');
  expect((wrapped as unknown as { modelId: string }).modelId).toBe('fake/m');
});
