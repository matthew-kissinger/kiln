import { expect, test } from 'bun:test';
import { Message, TextBlock } from '@strands-agents/sdk';
import { makeKilnModel } from './providers';

test('explicit Gemini high reasoning reaches the OpenRouter wire through Strands unchanged', async () => {
  const previous = globalThis.fetch;
  let body: Record<string, unknown> | undefined;
  globalThis.fetch = (async (_url: unknown, init: RequestInit) => {
    body = JSON.parse(String(init.body)) as Record<string, unknown>;
    return new Response('data: [DONE]\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });
  }) as typeof fetch;
  try {
    const model = await makeKilnModel(
      {
        provider: 'openrouter',
        model: 'google/gemini-3.8-flash',
        maxTokens: 16000,
        thinking: 'high',
      },
      { apiKey: 'offline-fixture-key' },
    );
    for await (const _event of model.stream([
      new Message({ role: 'user', content: [new TextBlock('fixture')] }),
    ])) {
      // Drain the actual Strands adapter, with every HTTP dispatch replaced above.
    }
    expect(body?.model).toBe('google/gemini-3.8-flash');
    expect(body?.max_tokens).toBe(16000);
    expect(body?.reasoning).toEqual({ effort: 'high' });
  } finally {
    globalThis.fetch = previous;
  }
});
