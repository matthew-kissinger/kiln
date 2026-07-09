/**
 * Unit tests for the agnostic Kiln model factory + the agent-vocab resolver.
 *
 * `resolveKilnAgentModel` is the bug-prone piece: the single-shot harness vocab
 * (`gemini`/`fal`, no `google:`/`bedrock:`) would route `google:gemini-3.5-flash`
 * to anthropic, so the agent path owns its own resolver. These tests pin that.
 * `makeKilnModel` is checked for the correct Strands class per provider (dummy
 * keys so native construction never touches the network).
 */
import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { resolveKilnAgentModel, makeKilnModel } from './providers';

describe('resolveKilnAgentModel', () => {
  test('explicit provider prefixes win and keep the model id intact', () => {
    expect(resolveKilnAgentModel('google:gemini-3.5-flash')).toEqual({
      provider: 'google',
      model: 'gemini-3.5-flash',
    });
    expect(resolveKilnAgentModel('anthropic:claude-opus-4-8')).toEqual({
      provider: 'anthropic',
      model: 'claude-opus-4-8',
    });
    expect(resolveKilnAgentModel('openai:gpt-5.5')).toEqual({
      provider: 'openai',
      model: 'gpt-5.5',
    });
    expect(resolveKilnAgentModel('bedrock:global.anthropic.claude-opus-4-8')).toEqual({
      provider: 'bedrock',
      model: 'global.anthropic.claude-opus-4-8',
    });
    expect(resolveKilnAgentModel('openrouter:anthropic/claude-opus-4.8')).toEqual({
      provider: 'openrouter',
      model: 'anthropic/claude-opus-4.8',
    });
    expect(resolveKilnAgentModel('meta:muse-spark-1.1')).toEqual({
      provider: 'meta',
      model: 'muse-spark-1.1',
    });
  });

  test('a bare vendor/model slash id is OpenRouter', () => {
    expect(resolveKilnAgentModel('x-ai/grok-4.3')).toEqual({
      provider: 'openrouter',
      model: 'x-ai/grok-4.3',
    });
  });

  test('bare gemini-* resolves to google (the regression the harness vocab gets wrong)', () => {
    expect(resolveKilnAgentModel('gemini-3.5-flash')).toEqual({
      provider: 'google',
      model: 'gemini-3.5-flash',
    });
    expect(resolveKilnAgentModel('imagen-4')).toEqual({ provider: 'google', model: 'imagen-4' });
  });

  test('bare gpt-* / o3 / o4 resolve to openai', () => {
    expect(resolveKilnAgentModel('gpt-5.5').provider).toBe('openai');
    expect(resolveKilnAgentModel('o3-mini').provider).toBe('openai');
    expect(resolveKilnAgentModel('o4').provider).toBe('openai');
  });

  test('bare claude-* and unknown ids default to anthropic', () => {
    expect(resolveKilnAgentModel('claude-opus-4-8')).toEqual({
      provider: 'anthropic',
      model: 'claude-opus-4-8',
    });
    expect(resolveKilnAgentModel('some-future-model').provider).toBe('anthropic');
  });

  test('trims surrounding whitespace', () => {
    expect(resolveKilnAgentModel('  google:gemini-3.5-flash  ')).toEqual({
      provider: 'google',
      model: 'gemini-3.5-flash',
    });
  });
});

describe('makeKilnModel', () => {
  const saved: Record<string, string | undefined> = {};
  const KEYS = ['GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'OPENROUTER_API_KEY', 'MODEL_API_KEY'];

  beforeAll(() => {
    for (const k of KEYS) {
      saved[k] = process.env[k];
      if (!process.env[k]) process.env[k] = `test-${k.toLowerCase()}`;
    }
  });
  afterAll(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  test('constructs the right Strands model class per provider', () => {
    expect(makeKilnModel({ provider: 'google', model: 'gemini-3.5-flash' }).constructor.name).toBe(
      'GoogleModel',
    );
    expect(
      makeKilnModel({ provider: 'anthropic', model: 'claude-opus-4-8', maxTokens: 16000 })
        .constructor.name,
    ).toBe('AnthropicModel');
    expect(
      makeKilnModel({ provider: 'openai', model: 'gpt-5.5', maxTokens: 16000 }).constructor.name,
    ).toBe('OpenAIModel');
    expect(
      makeKilnModel({
        provider: 'bedrock',
        model: 'global.anthropic.claude-opus-4-8',
        maxTokens: 16000,
      }).constructor.name,
    ).toBe('BedrockModel');
    expect(makeKilnModel({ provider: 'openrouter', model: 'x-ai/grok-4.3' }).constructor.name).toBe(
      'VercelModel',
    );
    expect(
      makeKilnModel({ provider: 'meta', model: 'muse-spark-1.1', maxTokens: 4096 }).constructor
        .name,
    ).toBe('OpenAIModel');
  });

  test('accepts a BYOK apiKey override for the google path', () => {
    const m = makeKilnModel(
      { provider: 'google', model: 'gemini-3.5-flash' },
      { apiKey: 'byok-override' },
    );
    expect(m).toBeTruthy();
  });

  test('passes a BYOK apiKey through to the anthropic and openai clients', () => {
    const clientKey = (m: unknown): unknown =>
      (m as { _client?: { apiKey?: unknown } })._client?.apiKey;
    expect(
      clientKey(
        makeKilnModel(
          { provider: 'anthropic', model: 'claude-opus-4-8' },
          { apiKey: 'byok-anthropic' },
        ),
      ),
    ).toBe('byok-anthropic');
    expect(
      clientKey(makeKilnModel({ provider: 'openai', model: 'gpt-5.5' }, { apiKey: 'byok-openai' })),
    ).toBe('byok-openai');
    expect(
      clientKey(
        makeKilnModel({ provider: 'meta', model: 'muse-spark-1.1' }, { apiKey: 'byok-meta' }),
      ),
    ).toBe('byok-meta');
  });

  test('meta uses the Meta base URL and explicit Responses params', () => {
    const model = makeKilnModel({ provider: 'meta', model: 'muse-spark-1.1', maxTokens: 4096 });
    const cfg = (model as unknown as { getConfig(): Record<string, unknown> }).getConfig();
    expect(cfg['modelId']).toBe('muse-spark-1.1');
    expect(cfg['maxTokens']).toBe(4096);
    expect(cfg['params']).toEqual({
      reasoning: { effort: 'low' },
      parallel_tool_calls: false,
    });
    expect((model as { _client?: { baseURL?: string } })._client?.baseURL).toBe(
      'https://api.meta.ai/v1',
    );
  });

  describe('anthropic thinking control (KILN_THINKING)', () => {
    const getCfg = (m: unknown): Record<string, unknown> =>
      (m as { getConfig(): Record<string, unknown> }).getConfig();

    test('sends nothing by default — the API default (adaptive on Fable 5), the verified config', () => {
      const cfg = getCfg(makeKilnModel({ provider: 'anthropic', model: 'claude-fable-5' }));
      expect(cfg['params']).toBeUndefined();
      expect(cfg['betas']).toBeUndefined();
    });

    test('effort keyword maps to the adaptive shape (Fable 5 family), no beta header', () => {
      const cfg = getCfg(
        makeKilnModel({ provider: 'anthropic', model: 'claude-fable-5', thinking: 'high' }),
      );
      expect(cfg['params']).toEqual({
        thinking: { type: 'adaptive' },
        output_config: { effort: 'high' },
      });
      expect(cfg['betas']).toBeUndefined();
    });

    test('numeric budget maps to the legacy enabled shape + interleaved beta (pre-adaptive models)', () => {
      const cfg = getCfg(
        makeKilnModel({ provider: 'anthropic', model: 'claude-opus-4-8', thinking: 8000 }),
      );
      expect(cfg['params']).toEqual({ thinking: { type: 'enabled', budget_tokens: 8000 } });
      expect(cfg['betas']).toEqual(['interleaved-thinking-2025-05-14']);
    });

    test('Sonnet 5 ignores numeric thinking budgets because it is adaptive-only', () => {
      const cfg = getCfg(
        makeKilnModel({ provider: 'anthropic', model: 'claude-sonnet-5', thinking: 8000 }),
      );
      expect(cfg['params']).toBeUndefined();
      expect(cfg['betas']).toBeUndefined();
    });

    test('env keyword/number applies (numbers floored to 1024); descriptor 0 forces default; google ignores it', () => {
      const prev = process.env['KILN_THINKING'];
      try {
        process.env['KILN_THINKING'] = 'medium';
        const adaptive = getCfg(makeKilnModel({ provider: 'anthropic', model: 'claude-fable-5' }));
        expect(adaptive['params']).toEqual({
          thinking: { type: 'adaptive' },
          output_config: { effort: 'medium' },
        });

        process.env['KILN_THINKING'] = '512';
        const floored = getCfg(makeKilnModel({ provider: 'anthropic', model: 'claude-opus-4-8' }));
        expect(floored['params']).toEqual({ thinking: { type: 'enabled', budget_tokens: 1024 } });

        const off = getCfg(
          makeKilnModel({ provider: 'anthropic', model: 'claude-fable-5', thinking: 0 }),
        );
        expect(off['params']).toBeUndefined();

        // Non-anthropic providers must not grow a thinking param from the env.
        const google = getCfg(makeKilnModel({ provider: 'google', model: 'gemini-3.5-flash' }));
        expect(google['params']).toBeUndefined();
      } finally {
        if (prev === undefined) delete process.env['KILN_THINKING'];
        else process.env['KILN_THINKING'] = prev;
      }
    });
  });
});
