// src/agent/providers.ts
import { VercelModel } from "@strands-agents/sdk/models/vercel";
import { AnthropicModel } from "@strands-agents/sdk/models/anthropic";
import { OpenAIModel } from "@strands-agents/sdk/models/openai";
import { GoogleModel } from "@strands-agents/sdk/models/google";
import { BedrockModel } from "@strands-agents/sdk/models/bedrock";
import { CachePointBlock, TextBlock } from "@strands-agents/sdk";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

// src/agent/stream-start.ts
function ensureStreamStart(model) {
  const origDoStream = model.doStream.bind(model);
  return new Proxy(model, {
    get(target, prop, receiver) {
      if (prop === "doStream") {
        return async (options) => {
          const result = await origDoStream(options);
          let injected = false;
          const guard = new TransformStream({
            transform(chunk, ctrl) {
              if (!injected && chunk.type !== "stream-start")
                ctrl.enqueue({ type: "stream-start", warnings: [] });
              injected = true;
              ctrl.enqueue(chunk);
            },
            flush(ctrl) {
              if (!injected)
                ctrl.enqueue({ type: "stream-start", warnings: [] });
            }
          });
          return { ...result, stream: result.stream.pipeThrough(guard) };
        };
      }
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    }
  });
}

// src/agent/split-tool-result-images.ts
function rewritePrompt(prompt) {
  const rewritten = [];
  for (const message of prompt) {
    if (message.role !== "tool") {
      rewritten.push(message);
      continue;
    }
    const images = [];
    const nextContent = message.content.map((part) => {
      if (part.type !== "tool-result" || part.output.type !== "content")
        return part;
      const keptValue = part.output.value.filter((v) => {
        if (v.type !== "file-data")
          return true;
        images.push({
          type: "file",
          data: v.data,
          mediaType: v.mediaType,
          ...v.filename ? { filename: v.filename } : {}
        });
        return false;
      });
      return { ...part, output: { ...part.output, value: keptValue } };
    });
    rewritten.push({ ...message, content: nextContent });
    if (images.length > 0)
      rewritten.push({ role: "user", content: images });
  }
  return rewritten;
}
function splitToolResultImages(model) {
  const origDoStream = model.doStream.bind(model);
  return new Proxy(model, {
    get(target, prop, receiver) {
      if (prop === "doStream") {
        return (options) => origDoStream({ ...options, prompt: rewritePrompt(options.prompt) });
      }
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    }
  });
}

// src/agent/providers.ts
var OPENROUTER_EFFORTS = new Set(["xhigh", "high", "medium", "low", "minimal", "none"]);
var MIN_VISIBLE_OUTPUT_TOKENS = 8192;
function resolveOpenRouterReasoning(thinking, maxTokens) {
  if (thinking == null || thinking === "" || thinking === 0)
    return;
  const halfBudget = maxTokens != null && Number.isFinite(maxTokens) && maxTokens > 0 ? Math.floor(maxTokens / 2) : undefined;
  if (typeof thinking === "number") {
    if (!Number.isFinite(thinking) || thinking <= 0)
      return;
    const budget = Math.max(1024, Math.floor(thinking));
    if (halfBudget === undefined)
      return { max_tokens: budget };
    if (halfBudget < 1024)
      return;
    return { max_tokens: Math.min(budget, halfBudget) };
  }
  const raw = thinking.trim().toLowerCase();
  if (/^\d+$/.test(raw))
    return resolveOpenRouterReasoning(Number.parseInt(raw, 10), maxTokens);
  let effort = raw === "max" ? "xhigh" : raw;
  if (!OPENROUTER_EFFORTS.has(effort))
    return;
  if ((effort === "xhigh" || effort === "high") && maxTokens != null && Number.isFinite(maxTokens) && maxTokens > 0 && maxTokens * 0.2 < MIN_VISIBLE_OUTPUT_TOKENS) {
    effort = "medium";
  }
  return { effort };
}
function makeOpenRouterModel(opts) {
  const openrouter = createOpenRouter({ apiKey: opts.apiKey ?? process.env["OPENROUTER_API_KEY"] });
  let provider = ensureStreamStart(openrouter.chat(opts.modelId, {
    ...opts.reasoning ? { reasoning: opts.reasoning } : {},
    ...opts.promptCache ? { cache_control: { type: "ephemeral" } } : {},
    ...opts.providerSort ? { provider: { sort: opts.providerSort } } : {}
  }));
  if (opts.splitToolResultImages)
    provider = splitToolResultImages(provider);
  return new VercelModel({
    provider,
    ...opts.maxTokens != null ? { maxTokens: opts.maxTokens } : {}
  });
}
var trimmedEnv = (k) => {
  const v = process.env[k];
  return v && v.trim() ? v.trim() : undefined;
};
var META_MODEL_API_BASE_URL = "https://api.meta.ai/v1";
function metaApiKey(opts) {
  return opts.apiKey ?? trimmedEnv("MODEL_API_KEY") ?? trimmedEnv("META_MODEL_API_KEY") ?? trimmedEnv("META_API_KEY");
}
function isAnthropicAdaptiveOnlyModel(model) {
  return /^claude-(sonnet-5|fable-5|mythos-5|opus-4-[78])(?:-|$)/.test(model);
}
function resolveGoogleThinkingLevel(fromDesc) {
  if (fromDesc == null || typeof fromDesc === "number")
    return;
  const raw = fromDesc.trim().toLowerCase();
  if (raw === "xhigh" || raw === "max")
    return "high";
  if (raw === "low" || raw === "medium" || raw === "high")
    return raw;
  return;
}
function resolveAnthropicThinking(model, fromDesc) {
  const raw = fromDesc ?? trimmedEnv("KILN_THINKING");
  if (raw == null || raw === "" || raw === 0)
    return;
  const asNum = typeof raw === "number" ? raw : /^\d+$/.test(String(raw).trim()) ? Number.parseInt(String(raw).trim(), 10) : undefined;
  if (asNum !== undefined) {
    if (!Number.isFinite(asNum) || asNum <= 0)
      return;
    if (isAnthropicAdaptiveOnlyModel(model))
      return;
    return {
      params: { thinking: { type: "enabled", budget_tokens: Math.max(1024, Math.floor(asNum)) } },
      betas: ["interleaved-thinking-2025-05-14"]
    };
  }
  const effort = String(raw).trim().toLowerCase();
  if (!/^[a-z]+$/.test(effort))
    return;
  return { params: { thinking: { type: "adaptive" }, output_config: { effort } } };
}
function makeKilnModel(desc, opts = {}) {
  const maxTokens = desc.maxTokens;
  switch (desc.provider) {
    case "anthropic": {
      const thinking = resolveAnthropicThinking(desc.model, desc.thinking);
      return new AnthropicModel({
        modelId: desc.model,
        ...opts.apiKey ? { apiKey: opts.apiKey } : {},
        ...maxTokens != null ? { maxTokens } : {},
        ...thinking ? { params: thinking.params } : {},
        ...thinking?.betas ? { betas: thinking.betas } : {}
      });
    }
    case "openai":
      return new OpenAIModel({
        api: "chat",
        modelId: desc.model,
        ...opts.apiKey ? { apiKey: opts.apiKey } : {},
        ...maxTokens != null ? { maxTokens } : {}
      });
    case "google": {
      const thinkingLevel = resolveGoogleThinkingLevel(desc.thinking);
      const googleParams = {
        ...maxTokens != null ? { maxOutputTokens: maxTokens } : {},
        ...thinkingLevel ? { thinkingConfig: { thinkingLevel } } : {}
      };
      return new GoogleModel({
        modelId: desc.model,
        apiKey: opts.apiKey ?? trimmedEnv("GEMINI_API_KEY"),
        ...Object.keys(googleParams).length > 0 ? { params: googleParams } : {}
      });
    }
    case "bedrock":
      return new BedrockModel({
        modelId: desc.model,
        region: opts.region ?? trimmedEnv("AWS_REGION") ?? "us-west-2",
        ...maxTokens != null ? { maxTokens } : {}
      });
    case "meta": {
      const apiKey = metaApiKey(opts);
      if (!apiKey) {
        throw new Error("Meta Model API key is required. Set MODEL_API_KEY, META_MODEL_API_KEY, or META_API_KEY.");
      }
      return new OpenAIModel({
        modelId: desc.model,
        apiKey,
        clientConfig: { baseURL: META_MODEL_API_BASE_URL },
        params: {
          reasoning: { effort: trimmedEnv("KILN_META_REASONING") ?? "low" },
          parallel_tool_calls: false
        },
        ...maxTokens != null ? { maxTokens } : {}
      });
    }
    case "openrouter": {
      const reasoning = resolveOpenRouterReasoning(desc.thinking, maxTokens);
      return makeOpenRouterModel({
        modelId: desc.model,
        ...opts.apiKey ? { apiKey: opts.apiKey } : {},
        ...maxTokens != null ? { maxTokens } : {},
        ...reasoning ? { reasoning } : {},
        providerSort: "throughput",
        ...desc.model === "thinkingmachines/inkling" ? { splitToolResultImages: true } : {},
        ...desc.model.startsWith("anthropic/") ? { promptCache: true } : {}
      });
    }
    default: {
      const exhaustive = desc.provider;
      throw new Error(`Unsupported Kiln agent provider: ${String(exhaustive)}`);
    }
  }
}
function modelConsumesSystemPromptCachePoints(model) {
  return model instanceof AnthropicModel || model instanceof BedrockModel;
}
function toCachedSystemPrompt(text, model) {
  if (!modelConsumesSystemPromptCachePoints(model))
    return text;
  return [new TextBlock(text), new CachePointBlock({ cacheType: "default" })];
}
function resolveKilnAgentModel(modelId) {
  const id = modelId.trim();
  const colon = id.indexOf(":");
  if (colon > 0) {
    const prefix = id.slice(0, colon);
    const rest = id.slice(colon + 1);
    if (prefix === "anthropic" || prefix === "openai" || prefix === "google" || prefix === "bedrock" || prefix === "openrouter" || prefix === "meta") {
      return { provider: prefix, model: rest };
    }
  }
  if (id.includes("/"))
    return { provider: "openrouter", model: id };
  if (id.startsWith("gemini-") || id.startsWith("imagen-"))
    return { provider: "google", model: id };
  if (id.startsWith("gpt-") || id.startsWith("o3") || id.startsWith("o4"))
    return { provider: "openai", model: id };
  return { provider: "anthropic", model: id };
}
function harnessIdToAgentModelId(id) {
  const trimmed = id.trim();
  if (!trimmed)
    return null;
  if (/^(anthropic|openai|google|bedrock|openrouter|meta):/.test(trimmed))
    return trimmed;
  if (trimmed.includes("/"))
    return `openrouter:${trimmed}`;
  if (trimmed.startsWith("claude-"))
    return `anthropic:${trimmed}`;
  if (trimmed.startsWith("gemini-"))
    return `google:${trimmed}`;
  if (trimmed.startsWith("gpt-") || /^o[34]/.test(trimmed))
    return `openai:${trimmed}`;
  return null;
}
export {
  toCachedSystemPrompt,
  resolveOpenRouterReasoning,
  resolveKilnAgentModel,
  modelConsumesSystemPromptCachePoints,
  makeOpenRouterModel,
  makeKilnModel,
  harnessIdToAgentModelId
};
