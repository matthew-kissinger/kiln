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
