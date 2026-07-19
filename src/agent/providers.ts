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
import { splitToolResultImages } from './split-tool-result-images';

/** OpenRouter's unified reasoning control (@openrouter/ai-sdk-provider chat setting):
 *  an effort keyword or a hard reasoning-token budget. Passed straight through to
 *  the provider, which translates per upstream vendor (Anthropic adaptive thinking,
 *  OpenAI reasoning_effort, ...). */
export type OpenRouterReasoning =
  | { effort: 'xhigh' | 'high' | 'medium' | 'low' | 'minimal' | 'none' }
  | { max_tokens: number };

const OPENROUTER_EFFORTS = new Set(['xhigh', 'high', 'medium', 'low', 'minimal', 'none']);

/**
 * OpenRouter's documented effort→budget translation for budget-based upstreams
 * (Anthropic et al.): xhigh/high ≈ 80% of max_tokens, medium ≈ 50%, low ≈ 20%.
 * At 80%, a 32K-budget model keeps only ~6.4K visible tokens per turn — below
 * what a first-turn Kiln program needs, which is how the cycle-2 OR twins died
 * at step 1 with "maximum token limit, unrecoverable" (2026-07-11 postmortem).
 * When the visible remainder under 'high' would fall below this floor, the
 * effort is downgraded to 'medium' (reasoning ≤ 50% of the completion budget).
 */
const MIN_VISIBLE_OUTPUT_TOKENS = 8192;

/**
 * Map the Kiln descriptor `thinking` control onto OpenRouter's reasoning setting.
 * Keywords pass through ('max' — an Anthropic-vocabulary level OpenRouter's type
 * doesn't carry — maps to 'xhigh'); positive numbers become a reasoning token
 * budget (floored to 1024, matching the Anthropic legacy floor). Unset / 0 / ''
 * or an unknown keyword → undefined (send nothing; the OpenRouter/upstream
 * default applies — which for Claude Opus 4.8 means reasoning OFF, same as the
 * native path).
 *
 * When `maxTokens` (the completion budget) is known, reasoning is clamped so it
 * can never consume the whole turn: numeric budgets cap at 50% of maxTokens
 * (or are dropped entirely when even the 1024 floor would exceed that half),
 * and 'xhigh'/'high' downgrade to 'medium' when OpenRouter's ~80% translation
 * would leave fewer than {@link MIN_VISIBLE_OUTPUT_TOKENS} visible tokens.
 */
export function resolveOpenRouterReasoning(
  thinking?: string | number,
  maxTokens?: number,
): OpenRouterReasoning | undefined {
  if (thinking == null || thinking === '' || thinking === 0) return undefined;
  const halfBudget =
    maxTokens != null && Number.isFinite(maxTokens) && maxTokens > 0
      ? Math.floor(maxTokens / 2)
      : undefined;
  if (typeof thinking === 'number') {
    if (!Number.isFinite(thinking) || thinking <= 0) return undefined;
    const budget = Math.max(1024, Math.floor(thinking));
    if (halfBudget === undefined) return { max_tokens: budget };
    // A completion budget too small to host even the 1024 reasoning floor at
    // ≤50% means reasoning off beats a guaranteed truncated turn.
    if (halfBudget < 1024) return undefined;
    return { max_tokens: Math.min(budget, halfBudget) };
  }
  const raw = thinking.trim().toLowerCase();
  if (/^\d+$/.test(raw)) return resolveOpenRouterReasoning(Number.parseInt(raw, 10), maxTokens);
  let effort = raw === 'max' ? 'xhigh' : raw;
  if (!OPENROUTER_EFFORTS.has(effort)) return undefined;
  if (
    (effort === 'xhigh' || effort === 'high') &&
    maxTokens != null &&
    Number.isFinite(maxTokens) &&
    maxTokens > 0 &&
    maxTokens * 0.2 < MIN_VISIBLE_OUTPUT_TOKENS
  ) {
    effort = 'medium';
  }
  return { effort: effort as Extract<OpenRouterReasoning, { effort: string }>['effort'] };
}

export interface OpenRouterModelOptions {
  /** OpenRouter model id, e.g. 'x-ai/grok-4.3'. */
  modelId: string;
  /** API key. Falls back to OPENROUTER_API_KEY. */
  apiKey?: string;
  /** Max output tokens. */
  maxTokens?: number;
  /** Unified reasoning control (effort keyword or token budget). */
  reasoning?: OpenRouterReasoning;
  /** Move tool-result images to a follow-up user message instead of leaving
   *  them inline (see split-tool-result-images.ts). Together's hosting of
   *  Thinking Machines' Inkling rejects images embedded in a `tool` message
   *  outright; other OpenRouter models don't need this. Model-scoped by the
   *  caller (see the 'openrouter' case below), default false. */
  splitToolResultImages?: boolean;
}

/**
 * Build a Strands `Model` for an OpenRouter model id, with the stream-start fix
 * applied so the Strands agent loop completes correctly.
 */
export function makeOpenRouterModel(opts: OpenRouterModelOptions): Model {
  const openrouter = createOpenRouter({ apiKey: opts.apiKey ?? process.env['OPENROUTER_API_KEY'] });
  let provider = ensureStreamStart(
    openrouter.chat(
      opts.modelId,
      opts.reasoning ? { reasoning: opts.reasoning } : {},
    ) as LanguageModelV3,
  );
  if (opts.splitToolResultImages) provider = splitToolResultImages(provider);
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
  /** Output-token budget; applied to anthropic/openai/bedrock/google (Gemini's
   *  API default is 65,536 — omit to keep it) and to openrouter (where it also
   *  bounds the reasoning clamp in {@link resolveOpenRouterReasoning}). */
  maxTokens?: number;
  /**
   * Reasoning/thinking control. Honored by the `anthropic` provider (shapes
   * below), by `openrouter` (mapped onto OpenRouter's unified `reasoning`
   * setting via {@link resolveOpenRouterReasoning} — so OpenRouter-hosted Claude
   * twins behave like the native transport), and by `google` (effort keywords
   * map to Gemini `thinkingConfig.thinkingLevel`; numbers are ignored). Other
   * providers ignore it.
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
  // Every model that REJECTS the legacy `thinking: {type:'enabled', budget_tokens}`
  // shape with a 400: Sonnet 5, Fable 5 / Mythos 5 (thinking always-on; verified
  // live 2026-06-11), and Opus 4.7/4.8 (budget_tokens removed — Anthropic migration
  // guide). Pre-adaptive models (Sonnet/Haiku 4.5 and older) still take the number.
  return /^claude-(sonnet-5|fable-5|mythos-5|opus-4-[78])(?:-|$)/.test(model);
}

/**
 * Map the descriptor `thinking` control onto Gemini's `thinkingConfig.thinkingLevel`
 * vocabulary ('low' | 'medium' | 'high'). 'xhigh'/'max' collapse to 'high';
 * numbers and unknown keywords → undefined (send nothing — Gemini's dynamic
 * thinking default applies, which is what every Google row ran before this knob
 * existed). Deliberately does NOT read KILN_THINKING: that env is Anthropic
 * vocabulary and history — only an explicit per-model config reaches Gemini.
 */
function resolveGoogleThinkingLevel(
  fromDesc?: string | number,
): 'low' | 'medium' | 'high' | undefined {
  if (fromDesc == null || typeof fromDesc === 'number') return undefined;
  const raw = fromDesc.trim().toLowerCase();
  if (raw === 'xhigh' || raw === 'max') return 'high';
  if (raw === 'low' || raw === 'medium' || raw === 'high') return raw;
  return undefined;
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
    case 'google': {
      // H-43/B1: forward the descriptor budget + thinking level into the Gemini
      // generationConfig (GoogleModel spreads `params` into the request config).
      // Only descriptor-explicit thinking applies — the KILN_THINKING env stays
      // Anthropic-only so a global env flip can't perturb Gemini defaults.
      const thinkingLevel = resolveGoogleThinkingLevel(desc.thinking);
      const googleParams = {
        ...(maxTokens != null ? { maxOutputTokens: maxTokens } : {}),
        ...(thinkingLevel ? { thinkingConfig: { thinkingLevel } } : {}),
      };
      return new GoogleModel({
        modelId: desc.model,
        apiKey: opts.apiKey ?? trimmedEnv('GEMINI_API_KEY'),
        ...(Object.keys(googleParams).length > 0 ? { params: googleParams } : {}),
      });
    }
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
    case 'openrouter': {
      // The same descriptor `thinking` control the anthropic case honors, mapped
      // onto OpenRouter's unified reasoning setting — so an OpenRouter-hosted
      // Claude (e.g. anthropic/claude-opus-4.8) gets its thinking turned on just
      // like the native transport would. maxTokens rides along so reasoning can
      // never start with a budget ≥ the completion budget (the cycle-2 step-1
      // MaxTokens deaths).
      const reasoning = resolveOpenRouterReasoning(desc.thinking, maxTokens);
      return makeOpenRouterModel({
        modelId: desc.model,
        ...(opts.apiKey ? { apiKey: opts.apiKey } : {}),
        ...(maxTokens != null ? { maxTokens } : {}),
        ...(reasoning ? { reasoning } : {}),
        // Together's Inkling hosting rejects images embedded in a tool-result
        // message (verified live 2026-07-19) — see split-tool-result-images.ts.
        ...(desc.model === 'thinkingmachines/inkling' ? { splitToolResultImages: true } : {}),
      });
    }
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
