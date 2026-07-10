/**
 * Model construction helpers for the agnostic Kiln agent.
 *
 * Native Strands providers (Anthropic/OpenAI/Google/Bedrock) are constructed by
 * the caller directly from `@strands-agents/sdk/models/*`. OpenRouter has no
 * native Strands provider, so we reach it through the Vercel AI SDK bridge
 * (`VercelModel`) wrapping a `LanguageModelV3` from `@openrouter/ai-sdk-provider`
 * — with {@link ensureStreamStart} restoring the spec-required leading
 * `stream-start` part the OpenRouter provider omits (see stream-start.ts).
 * Meta Model API is OpenAI-compatible, but stays its own provider family for
 * honest provenance and key/pricing separation.
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
export type KilnAgentProvider =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'bedrock'
  | 'openrouter'
  | 'meta';

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
  /**
   * Anthropic thinking control (anthropic provider only; others ignore it).
   *
   * - Effort keyword (`'low' | 'medium' | 'high'`, passed through verbatim) →
   *   `thinking: {type:'adaptive'}` + `output_config: {effort}` — the
   *   Fable-5-family shape. These models think adaptively BY DEFAULT (verified
   *   live: reasoning blocks interleave with kiln tool calls on a plain
   *   request); the keyword only tunes how hard.
   * - Number → legacy `thinking: {type:'enabled', budget_tokens}` plus the
   *   interleaved-thinking beta, for pre-adaptive Claude models. Fable 5
   *   REJECTS this shape with a 400 (verified live 2026-06-11).
   *
   * Unset falls back to the `KILN_THINKING` env (read at call time); 0 / ''
   * forces default behavior even when the env is set. Default: send nothing —
   * the API default, which on Fable 5 is adaptive thinking at default effort.
   */
  thinking?: string | number;
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

const META_MODEL_API_BASE_URL = 'https://api.meta.ai/v1';

function metaApiKey(opts: MakeKilnModelOptions): string | undefined {
  return (
    opts.apiKey ??
    trimmedEnv('MODEL_API_KEY') ??
    trimmedEnv('META_MODEL_API_KEY') ??
    trimmedEnv('META_API_KEY')
  );
}

/**
 * Resolve the Anthropic thinking control: per-call descriptor wins, else the
 * `KILN_THINKING` env. Effort keywords map to the adaptive shape (Fable 5
 * family); numbers map to the legacy enabled+budget shape (floored to the API
 * minimum of 1024, interleaved beta added). Unset / 0 / '' → undefined, i.e.
 * send nothing and take the API default.
 */
function isAnthropicAdaptiveOnlyModel(model: string): boolean {
  return /^claude-sonnet-5(?:-|$)/.test(model);
}

function resolveAnthropicThinking(
  model: string,
  fromDesc?: string | number,
): { params: Record<string, unknown>; betas?: string[] } | undefined {
  const raw = fromDesc ?? trimmedEnv('KILN_THINKING');
  if (raw == null || raw === '' || raw === 0) return undefined;
  const asNum =
    typeof raw === 'number'
      ? raw
      : /^\d+$/.test(String(raw).trim())
        ? Number.parseInt(String(raw).trim(), 10)
        : undefined;
  if (asNum !== undefined) {
    if (!Number.isFinite(asNum) || asNum <= 0) return undefined;
    // Sonnet 5 has adaptive thinking on by default and rejects manual
    // extended-thinking budgets. Do not let a global KILN_THINKING number make
    // this model fail before the first tool call.
    if (isAnthropicAdaptiveOnlyModel(model)) return undefined;
    return {
      params: { thinking: { type: 'enabled', budget_tokens: Math.max(1024, Math.floor(asNum)) } },
      betas: ['interleaved-thinking-2025-05-14'],
    };
  }
  const effort = String(raw).trim().toLowerCase();
  if (!/^[a-z]+$/.test(effort)) return undefined;
  return { params: { thinking: { type: 'adaptive' }, output_config: { effort } } };
}

/**
 * Construct a Strands `Model` from a provider+model descriptor — the agnostic
 * factory the whole Kiln agent path builds on. Native providers (Anthropic /
 * OpenAI / Google / Bedrock) construct directly from their model subpath;
 * Meta uses Strands' OpenAI-compatible Responses adapter against Meta's base URL;
 * OpenRouter goes through the Vercel bridge ({@link makeOpenRouterModel} +
 * `ensureStreamStart`).
 */
export function makeKilnModel(desc: KilnModelDescriptor, opts: MakeKilnModelOptions = {}): Model {
  const maxTokens = desc.maxTokens;
  switch (desc.provider) {
    case 'anthropic': {
      const thinking = resolveAnthropicThinking(desc.model, desc.thinking);
      return new AnthropicModel({
        modelId: desc.model,
        ...(opts.apiKey ? { apiKey: opts.apiKey } : {}),
        ...(maxTokens != null ? { maxTokens } : {}),
        ...(thinking ? { params: thinking.params } : {}),
        ...(thinking?.betas ? { betas: thinking.betas } : {}),
      });
    }
    case 'openai':
      return new OpenAIModel({
        api: 'chat',
        modelId: desc.model,
        ...(opts.apiKey ? { apiKey: opts.apiKey } : {}),
        ...(maxTokens != null ? { maxTokens } : {}),
      });
    case 'google':
      return new GoogleModel({
        modelId: desc.model,
        apiKey: opts.apiKey ?? trimmedEnv('GEMINI_API_KEY'),
      });
    case 'bedrock':
      return new BedrockModel({
        modelId: desc.model,
        region: opts.region ?? trimmedEnv('AWS_REGION') ?? 'us-west-2',
        ...(maxTokens != null ? { maxTokens } : {}),
      });
    case 'meta': {
      const apiKey = metaApiKey(opts);
      if (!apiKey) {
        throw new Error(
          'Meta Model API key is required. Set MODEL_API_KEY, META_MODEL_API_KEY, or META_API_KEY.',
        );
      }
      return new OpenAIModel({
        modelId: desc.model,
        apiKey,
        clientConfig: { baseURL: META_MODEL_API_BASE_URL },
        params: {
          reasoning: { effort: trimmedEnv('KILN_META_REASONING') ?? 'low' },
          parallel_tool_calls: false,
        },
        ...(maxTokens != null ? { maxTokens } : {}),
      });
    }
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
 *   meta:muse-spark-1.1             -> { meta,       muse-spark-1.1 }
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
      prefix === 'openrouter' ||
      prefix === 'meta'
    ) {
      return { provider: prefix, model: rest };
    }
  }
  // A slash with no explicit prefix is an OpenRouter `vendor/model` id.
  if (id.includes('/')) return { provider: 'openrouter', model: id };
  if (id.startsWith('gemini-') || id.startsWith('imagen-'))
    return { provider: 'google', model: id };
  if (id.startsWith('gpt-') || id.startsWith('o3') || id.startsWith('o4'))
    return { provider: 'openai', model: id };
  // Default: Anthropic (claude-*).
  return { provider: 'anthropic', model: id };
}

/**
 * Translate a HARNESS model id (the `llm.resolveKilnModelRoute` vocabulary the
 * single-shot path takes via `KILN_MODEL` / `--model`) into a Strands agent
 * model id, or null when the id has no agent-path equivalent.
 *
 * This explicit bridge exists because the two resolvers use different provider
 * vocabularies (harness `gemini` vs Strands `google`; harness routes via the
 * AI-SDK, Strands via native providers) — DO NOT merge the resolvers: feeding
 * a Strands id like `google:gemini-3.5-flash` through the harness resolver (or
 * vice versa) misroutes silently. A null return means "no agent route — let
 * the single-shot fallback handle this id".
 */
export function harnessIdToAgentModelId(id: string): string | null {
  const trimmed = id.trim();
  if (!trimmed) return null;
  // Already a Strands-form id (provider:model) — pass through untouched.
  if (/^(anthropic|openai|google|bedrock|openrouter|meta):/.test(trimmed)) return trimmed;
  // OpenRouter `vendor/model` slashes route the same on both paths.
  if (trimmed.includes('/')) return `openrouter:${trimmed}`;
  if (trimmed.startsWith('claude-')) return `anthropic:${trimmed}`;
  if (trimmed.startsWith('gemini-')) return `google:${trimmed}`;
  if (trimmed.startsWith('gpt-') || /^o[34]/.test(trimmed)) return `openai:${trimmed}`;
  // Unknown family (imagen, embeddings, harness-only aliases): no agent route.
  return null;
}
