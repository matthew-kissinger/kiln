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
import { CachePointBlock, TextBlock } from '@strands-agents/sdk';
import {
  resolveKilnAgentModel,
  makeKilnModel,
  resolveOpenRouterReasoning,
  modelConsumesSystemPromptCachePoints,
  toCachedSystemPrompt,
} from './providers';

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
  const KEYS = [
    'GEMINI_API_KEY',
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY',
    'OPENROUTER_API_KEY',
    'MODEL_API_KEY',
  ];

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

  describe('openrouter reasoning control (thinking → unified reasoning)', () => {
    test('effort keywords pass through; max maps to xhigh (OpenRouter vocabulary)', () => {
      expect(resolveOpenRouterReasoning('high')).toEqual({ effort: 'high' });
      expect(resolveOpenRouterReasoning('xhigh')).toEqual({ effort: 'xhigh' });
      expect(resolveOpenRouterReasoning('max')).toEqual({ effort: 'xhigh' });
      expect(resolveOpenRouterReasoning(' HIGH ')).toEqual({ effort: 'high' });
    });

    test('numbers become a reasoning token budget floored to 1024', () => {
      expect(resolveOpenRouterReasoning(8000)).toEqual({ max_tokens: 8000 });
      expect(resolveOpenRouterReasoning(512)).toEqual({ max_tokens: 1024 });
      expect(resolveOpenRouterReasoning('8000')).toEqual({ max_tokens: 8000 });
    });

    test('unset / 0 / empty / unknown keywords send nothing', () => {
      expect(resolveOpenRouterReasoning(undefined)).toBeUndefined();
      expect(resolveOpenRouterReasoning(0)).toBeUndefined();
      expect(resolveOpenRouterReasoning('')).toBeUndefined();
      expect(resolveOpenRouterReasoning('ultra')).toBeUndefined();
    });

    test('A7 clamp: numeric budgets cap at 50% of the completion budget', () => {
      // reasoning == completion budget would guarantee zero visible text.
      expect(resolveOpenRouterReasoning(32000, 32000)).toEqual({ max_tokens: 16000 });
      // Already under half: untouched.
      expect(resolveOpenRouterReasoning(8000, 64000)).toEqual({ max_tokens: 8000 });
      // Completion budget too small to host even the 1024 floor at ≤50%: off.
      expect(resolveOpenRouterReasoning(4096, 1500)).toBeUndefined();
      // No completion budget known: legacy pass-through.
      expect(resolveOpenRouterReasoning(32000)).toEqual({ max_tokens: 32000 });
    });

    test("A7 clamp: high/xhigh downgrade to medium when OpenRouter's ~80% translation would starve visible output", () => {
      // The cycle-2 step-1 deaths: Sonnet 4.6 twin at 32K + 'high' → ~6.4K visible.
      expect(resolveOpenRouterReasoning('high', 32000)).toEqual({ effort: 'medium' });
      expect(resolveOpenRouterReasoning('xhigh', 16000)).toEqual({ effort: 'medium' });
      // The 64K/48K twins keep 'high' (visible remainder ≥ 8192) — the live
      // config that put Fable 5 / Sonnet 5 in the #1 tie group stays untouched.
      expect(resolveOpenRouterReasoning('high', 64000)).toEqual({ effort: 'high' });
      expect(resolveOpenRouterReasoning('high', 48000)).toEqual({ effort: 'high' });
      // medium/low are never rewritten.
      expect(resolveOpenRouterReasoning('medium', 16000)).toEqual({ effort: 'medium' });
      expect(resolveOpenRouterReasoning('low', 16000)).toEqual({ effort: 'low' });
    });

    test('an OpenRouter-hosted Claude with thinking still constructs the Vercel bridge', () => {
      const m = makeKilnModel({
        provider: 'openrouter',
        model: 'anthropic/claude-opus-4.8',
        maxTokens: 64000,
        thinking: 'high',
      });
      expect(m.constructor.name).toBe('VercelModel');
    });
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

  describe('google thinking + budget (B1/H-43)', () => {
    const getCfg = (m: unknown): Record<string, unknown> =>
      (m as { getConfig(): Record<string, unknown> }).getConfig();

    test('descriptor maxTokens + thinking flow into the Gemini generationConfig params', () => {
      const cfg = getCfg(
        makeKilnModel({
          provider: 'google',
          model: 'gemini-3.5-flash',
          maxTokens: 65536,
          thinking: 'high',
        }),
      );
      expect(cfg['params']).toEqual({
        maxOutputTokens: 65536,
        thinkingConfig: { thinkingLevel: 'high' },
      });
    });

    test('a bare descriptor sends no params — the pre-knob API-default behavior', () => {
      const cfg = getCfg(makeKilnModel({ provider: 'google', model: 'gemini-3.5-flash' }));
      expect(cfg['params']).toBeUndefined();
    });

    test('xhigh/max collapse to high; numbers and unknown keywords are ignored', () => {
      const level = (thinking: string | number) =>
        (
          getCfg(makeKilnModel({ provider: 'google', model: 'gemini-3.5-flash', thinking }))[
            'params'
          ] as { thinkingConfig?: { thinkingLevel?: string } } | undefined
        )?.thinkingConfig?.thinkingLevel;
      expect(level('xhigh')).toBe('high');
      expect(level('max')).toBe('high');
      expect(level('medium')).toBe('medium');
      expect(level(8000)).toBeUndefined();
      expect(level('ultra')).toBeUndefined();
    });
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
        makeKilnModel({ provider: 'anthropic', model: 'claude-haiku-4-5', thinking: 8000 }),
      );
      expect(cfg['params']).toEqual({ thinking: { type: 'enabled', budget_tokens: 8000 } });
      expect(cfg['betas']).toEqual(['interleaved-thinking-2025-05-14']);
    });

    test('adaptive-only models ignore numeric thinking budgets (budget_tokens 400s on them)', () => {
      for (const model of [
        'claude-sonnet-5',
        'claude-fable-5',
        'claude-opus-4-8',
        'claude-opus-4-7',
      ]) {
        const cfg = getCfg(makeKilnModel({ provider: 'anthropic', model, thinking: 8000 }));
        expect(cfg['params']).toBeUndefined();
        expect(cfg['betas']).toBeUndefined();
      }
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
        const floored = getCfg(makeKilnModel({ provider: 'anthropic', model: 'claude-haiku-4-5' }));
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

describe('toCachedSystemPrompt (A2 portable cache breakpoint)', () => {
  const TEXT = 'You generate exportable 3D game assets as Kiln code.';

  test('Anthropic models get [TextBlock, CachePointBlock] — the adapter emits cache_control', () => {
    const model = makeKilnModel(
      { provider: 'anthropic', model: 'claude-opus-4-8' },
      { apiKey: 'test-key' },
    );
    expect(modelConsumesSystemPromptCachePoints(model)).toBe(true);
    const shaped = toCachedSystemPrompt(TEXT, model);
    expect(Array.isArray(shaped)).toBe(true);
    const blocks = shaped as unknown[];
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toBeInstanceOf(TextBlock);
    expect((blocks[0] as TextBlock).text).toBe(TEXT);
    expect(blocks[1]).toBeInstanceOf(CachePointBlock);
    expect((blocks[1] as CachePointBlock).cacheType).toBe('default');
    // The discriminators the anthropic/bedrock adapters branch on (1.10.0).
    expect((blocks[0] as { type: string }).type).toBe('textBlock');
    expect((blocks[1] as { type: string }).type).toBe('cachePointBlock');
  });

  test('Bedrock models get the block array too (converse cachePoint entry)', () => {
    const model = makeKilnModel(
      { provider: 'bedrock', model: 'global.anthropic.claude-opus-4-8' },
      { region: 'us-west-2' },
    );
    expect(modelConsumesSystemPromptCachePoints(model)).toBe(true);
    expect(Array.isArray(toCachedSystemPrompt(TEXT, model))).toBe(true);
  });

  test('Google keeps the plain string (its adapter drops cache points)', () => {
    const model = makeKilnModel(
      { provider: 'google', model: 'gemini-3.5-flash' },
      { apiKey: 'test-key' },
    );
    expect(modelConsumesSystemPromptCachePoints(model)).toBe(false);
    expect(toCachedSystemPrompt(TEXT, model)).toBe(TEXT);
  });

  test('OpenAI / OpenRouter (Vercel bridge) / unknown models keep the plain string', () => {
    const openai = makeKilnModel({ provider: 'openai', model: 'gpt-5.5' }, { apiKey: 'test-key' });
    expect(toCachedSystemPrompt(TEXT, openai)).toBe(TEXT);
    const openrouter = makeKilnModel(
      { provider: 'openrouter', model: 'x-ai/grok-4.3' },
      { apiKey: 'test-key' },
    );
    expect(toCachedSystemPrompt(TEXT, openrouter)).toBe(TEXT);
    expect(toCachedSystemPrompt(TEXT, undefined)).toBe(TEXT);
    expect(toCachedSystemPrompt(TEXT, {})).toBe(TEXT);
  });
});

describe('OpenRouter-Anthropic prompt caching (cache_control)', () => {
  /** The LanguageModelV3 the Vercel bridge wraps (through the stream-start proxy,
   *  which forwards every non-doStream property untouched). */
  const settingsOf = (model: unknown): Record<string, unknown> =>
    (model as { _provider: { settings: Record<string, unknown> } })._provider.settings;

  test('an anthropic/* slug is built with the ephemeral cache_control directive', () => {
    const model = makeKilnModel(
      { provider: 'openrouter', model: 'anthropic/claude-sonnet-5' },
      { apiKey: 'test-key' },
    );
    expect(settingsOf(model)['cache_control']).toEqual({ type: 'ephemeral' });
  });

  test('the directive reaches the outgoing request body (fetch captured, no network)', async () => {
    const model = makeKilnModel(
      { provider: 'openrouter', model: 'anthropic/claude-opus-4.8' },
      { apiKey: 'test-key' },
    );
    const provider = (model as unknown as { _provider: { doStream(o: unknown): Promise<unknown> } })
      ._provider;

    const realFetch = globalThis.fetch;
    let body: Record<string, unknown> | undefined;
    globalThis.fetch = (async (_url: unknown, init: { body: string }) => {
      body = JSON.parse(init.body) as Record<string, unknown>;
      return new Response('data: [DONE]\n\n', {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      });
    }) as unknown as typeof fetch;
    try {
      const result = (await provider.doStream({
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }],
      })) as { stream: ReadableStream<unknown> };
      const reader = result.stream.getReader();
      while (!(await reader.read()).done) {
        // drain
      }
    } finally {
      globalThis.fetch = realFetch;
    }

    expect(body?.['model']).toBe('anthropic/claude-opus-4.8');
    // Top-level directive → Anthropic automatic caching of the stable prefix.
    expect(body?.['cache_control']).toEqual({ type: 'ephemeral' });
  });

  test('non-Anthropic OpenRouter vendors do NOT get the flag', () => {
    for (const model of ['x-ai/grok-4.3', 'openai/gpt-5.5', 'moonshotai/kimi-k2.5']) {
      const built = makeKilnModel({ provider: 'openrouter', model }, { apiKey: 'test-key' });
      expect(settingsOf(built)['cache_control']).toBeUndefined();
    }
    // ...and the reasoning setting is still the only thing that lands there.
    const reasoning = makeKilnModel(
      { provider: 'openrouter', model: 'x-ai/grok-4.3', maxTokens: 64000, thinking: 'high' },
      { apiKey: 'test-key' },
    );
    expect(settingsOf(reasoning)).toEqual({ reasoning: { effort: 'high' } });
  });

  test('the two caching mechanisms stay separate: cache_control is not a system cache point', () => {
    const model = makeKilnModel(
      { provider: 'openrouter', model: 'anthropic/claude-sonnet-5' },
      { apiKey: 'test-key' },
    );
    // The Vercel bridge DROPS CachePointBlocks, so the system prompt must stay a
    // plain string even for the vendor whose upstream supports caching. The
    // request-settings directive above is how OpenRouter gets it instead.
    expect(modelConsumesSystemPromptCachePoints(model)).toBe(false);
    expect(toCachedSystemPrompt('SYSTEM', model)).toBe('SYSTEM');
  });
});
