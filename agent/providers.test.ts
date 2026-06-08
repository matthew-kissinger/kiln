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
    expect(resolveKilnAgentModel('google:gemini-3.5-flash')).toEqual({ provider: 'google', model: 'gemini-3.5-flash' });
    expect(resolveKilnAgentModel('anthropic:claude-opus-4-8')).toEqual({ provider: 'anthropic', model: 'claude-opus-4-8' });
    expect(resolveKilnAgentModel('openai:gpt-5.5')).toEqual({ provider: 'openai', model: 'gpt-5.5' });
    expect(resolveKilnAgentModel('bedrock:global.anthropic.claude-opus-4-8')).toEqual({
      provider: 'bedrock',
      model: 'global.anthropic.claude-opus-4-8',
    });
    expect(resolveKilnAgentModel('openrouter:anthropic/claude-opus-4.8')).toEqual({
      provider: 'openrouter',
      model: 'anthropic/claude-opus-4.8',
    });
  });

  test('a bare vendor/model slash id is OpenRouter', () => {
    expect(resolveKilnAgentModel('x-ai/grok-4.3')).toEqual({ provider: 'openrouter', model: 'x-ai/grok-4.3' });
  });

  test('bare gemini-* resolves to google (the regression the harness vocab gets wrong)', () => {
    expect(resolveKilnAgentModel('gemini-3.5-flash')).toEqual({ provider: 'google', model: 'gemini-3.5-flash' });
    expect(resolveKilnAgentModel('imagen-4')).toEqual({ provider: 'google', model: 'imagen-4' });
  });

  test('bare gpt-* / o3 / o4 resolve to openai', () => {
    expect(resolveKilnAgentModel('gpt-5.5').provider).toBe('openai');
    expect(resolveKilnAgentModel('o3-mini').provider).toBe('openai');
    expect(resolveKilnAgentModel('o4').provider).toBe('openai');
  });

  test('bare claude-* and unknown ids default to anthropic', () => {
    expect(resolveKilnAgentModel('claude-opus-4-8')).toEqual({ provider: 'anthropic', model: 'claude-opus-4-8' });
    expect(resolveKilnAgentModel('some-future-model').provider).toBe('anthropic');
  });

  test('trims surrounding whitespace', () => {
    expect(resolveKilnAgentModel('  google:gemini-3.5-flash  ')).toEqual({ provider: 'google', model: 'gemini-3.5-flash' });
  });
});

describe('makeKilnModel', () => {
  const saved: Record<string, string | undefined> = {};
  const KEYS = ['GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'OPENROUTER_API_KEY'];

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
    expect(makeKilnModel({ provider: 'google', model: 'gemini-3.5-flash' }).constructor.name).toBe('GoogleModel');
    expect(makeKilnModel({ provider: 'anthropic', model: 'claude-opus-4-8', maxTokens: 16000 }).constructor.name).toBe('AnthropicModel');
    expect(makeKilnModel({ provider: 'openai', model: 'gpt-5.5', maxTokens: 16000 }).constructor.name).toBe('OpenAIModel');
    expect(makeKilnModel({ provider: 'bedrock', model: 'global.anthropic.claude-opus-4-8', maxTokens: 16000 }).constructor.name).toBe('BedrockModel');
    expect(makeKilnModel({ provider: 'openrouter', model: 'x-ai/grok-4.3' }).constructor.name).toBe('VercelModel');
  });

  test('accepts a BYOK apiKey override for the google path', () => {
    const m = makeKilnModel({ provider: 'google', model: 'gemini-3.5-flash' }, { apiKey: 'byok-override' });
    expect(m).toBeTruthy();
  });
});
