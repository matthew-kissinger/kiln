/**
 * Model construction helpers for the agnostic Kiln agent.
 *
 * Native Strands providers (Anthropic/OpenAI/Google/Bedrock) are constructed by
 * the caller directly from `@strands-agents/sdk/models/*`. OpenRouter has no
 * native Strands provider, so we reach it through the Vercel AI SDK bridge
 * (`VercelModel`) wrapping a `LanguageModelV3` from `@openrouter/ai-sdk-provider`
 * — with {@link ensureStreamStart} restoring the spec-required leading
 * `stream-start` part the OpenRouter provider omits (see stream-start.ts).
 */
import { VercelModel } from '@strands-agents/sdk/models/vercel';
import { AnthropicModel } from '@strands-agents/sdk/models/anthropic';
import { OpenAIModel } from '@strands-agents/sdk/models/openai';
import { GoogleModel } from '@strands-agents/sdk/models/google';
import { BedrockModel } from '@strands-agents/sdk/models/bedrock';
import type { Model } from '@strands-agents/sdk';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import type { LanguageModelV3 } from '@ai-sdk/provider';

import { ensureStreamStart } from './stream-start';

export interface OpenRouterModelOptions {
  /** OpenRouter model id, e.g. 'x-ai/grok-4.3'. */
  modelId: string;
  /** API key. Falls back to OPENROUTER_API_KEY. */
  apiKey?: string;
  /** Max output tokens. */
  maxTokens?: number;
}

/**
 * Build a Strands `Model` for an OpenRouter model id, with the stream-start fix
 * applied so the Strands agent loop completes correctly.
 */
export function makeOpenRouterModel(opts: OpenRouterModelOptions): Model {
  const openrouter = createOpenRouter({ apiKey: opts.apiKey ?? process.env['OPENROUTER_API_KEY'] });
  const provider = ensureStreamStart(openrouter.chat(opts.modelId) as LanguageModelV3);
  return new VercelModel({
    provider,
    ...(opts.maxTokens != null ? { maxTokens: opts.maxTokens } : {}),
  });
}

// =============================================================================
// Agnostic model factory — the core-owned successor to Kiln Studio's
// agent-runtime model-factory. Every Kiln agent consumer (CLI, batch, server,
// studio) builds its Strands `Model` here, so native-provider construction lives
// in exactly one place.
// =============================================================================

/** Strands-native provider vocabulary for the Kiln agent loop. */
export type KilnAgentProvider = 'anthropic' | 'openai' | 'google' | 'bedrock' | 'openrouter';

/**
 * Minimal model descriptor `makeKilnModel` needs. Structurally compatible with
 * the Kiln Studio `ModelDescriptor` (which carries extra `tier`) and with the
 * output of {@link resolveKilnAgentModel}.
 */
export interface KilnModelDescriptor {
  provider: KilnAgentProvider;
  /** Concrete model id passed to the underlying SDK (e.g. 'gemini-3.5-flash'). */
  model: string;
  /** Output-token budget; applied to anthropic/openai/bedrock (GoogleModel uses its own default). */
  maxTokens?: number;
}

export interface MakeKilnModelOptions {
  /** BYOK / shared key override. Falls back to provider env vars when omitted. */
  apiKey?: string;
  /** AWS region for Bedrock. Defaults to AWS_REGION / us-west-2. */
  region?: string;
}

const trimmedEnv = (k: string): string | undefined => {
  const v = process.env[k];
  return v && v.trim() ? v.trim() : undefined;
};

/**
 * Construct a Strands `Model` from a provider+model descriptor — the agnostic
 * factory the whole Kiln agent path builds on. Native providers (Anthropic /
 * OpenAI / Google / Bedrock) construct directly from their model subpath;
 * OpenRouter goes through the Vercel bridge ({@link makeOpenRouterModel} +
 * `ensureStreamStart`).
 */
export function makeKilnModel(desc: KilnModelDescriptor, opts: MakeKilnModelOptions = {}): Model {
  const maxTokens = desc.maxTokens;
  switch (desc.provider) {
    case 'anthropic':
      return new AnthropicModel({ modelId: desc.model, ...(maxTokens != null ? { maxTokens } : {}) });
    case 'openai':
      return new OpenAIModel({ api: 'chat', modelId: desc.model, ...(maxTokens != null ? { maxTokens } : {}) });
    case 'google':
      return new GoogleModel({ modelId: desc.model, apiKey: opts.apiKey ?? trimmedEnv('GEMINI_API_KEY') });
    case 'bedrock':
      return new BedrockModel({
        modelId: desc.model,
        region: opts.region ?? trimmedEnv('AWS_REGION') ?? 'us-west-2',
        ...(maxTokens != null ? { maxTokens } : {}),
      });
    case 'openrouter':
      return makeOpenRouterModel({
        modelId: desc.model,
        ...(opts.apiKey ? { apiKey: opts.apiKey } : {}),
        ...(maxTokens != null ? { maxTokens } : {}),
      });
    default: {
      const exhaustive: never = desc.provider;
      throw new Error(`Unsupported Kiln agent provider: ${String(exhaustive)}`);
    }
  }
}

/**
 * Parse a model-id string into a Strands provider descriptor — the CLI / batch
 * entry, where only a string is available.
 *
 * NOTE: this is deliberately NOT `resolveKilnModelRoute` from `../../llm`. That
 * resolver speaks the single-shot harness vocabulary (`gemini`/`fal`, no
 * `google:`/`bedrock:` prefixes) and would route `google:gemini-3.5-flash` to
 * `anthropic`. The agent path speaks the Strands vocabulary, so it owns its own
 * tiny resolver.
 *
 *   google:gemini-3.5-flash         -> { google,     gemini-3.5-flash }
 *   openrouter:anthropic/claude-x   -> { openrouter, anthropic/claude-x }
 *   gemini-3.5-flash                -> { google,     gemini-3.5-flash }
 *   claude-opus-4-8                 -> { anthropic,  claude-opus-4-8 }
 *   gpt-5.5                         -> { openai,     gpt-5.5 }
 *   x-ai/grok-4.3                   -> { openrouter, x-ai/grok-4.3 }
 */
export function resolveKilnAgentModel(modelId: string): KilnModelDescriptor {
  const id = modelId.trim();
  const colon = id.indexOf(':');
  if (colon > 0) {
    const prefix = id.slice(0, colon);
    const rest = id.slice(colon + 1);
    if (
      prefix === 'anthropic' ||
      prefix === 'openai' ||
      prefix === 'google' ||
      prefix === 'bedrock' ||
      prefix === 'openrouter'
    ) {
      return { provider: prefix, model: rest };
    }
  }
  // A slash with no explicit prefix is an OpenRouter `vendor/model` id.
  if (id.includes('/')) return { provider: 'openrouter', model: id };
  if (id.startsWith('gemini-') || id.startsWith('imagen-')) return { provider: 'google', model: id };
  if (id.startsWith('gpt-') || id.startsWith('o3') || id.startsWith('o4')) return { provider: 'openai', model: id };
  // Default: Anthropic (claude-*).
  return { provider: 'anthropic', model: id };
}
