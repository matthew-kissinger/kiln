/**
 * `splitToolResultImages` — move any image inside a tool-result message into
 * a synthetic follow-up user message instead.
 *
 * WHY THIS EXISTS: Kiln's agent loop returns the kiln_render/kiln_screenshot
 * image as part of the tool-result content (Strands' `formatToolResultOutput`
 * emits a `file-data` part inside the `role: 'tool'` message). Most
 * OpenRouter-hosted models accept that shape fine, but Together's hosting of
 * Thinking Machines' Inkling model rejects it outright: "Multimodal
 * processing failed: multimodal placeholder count mismatch... refusing to
 * dispatch" — REGARDLESS of any inline placeholder text. Verified live
 * against the API (2026-07-19): the identical image bytes succeed in a plain
 * `user` message and fail inside a `tool` message whether or not a `<image>`
 * placeholder is added — this is a structural "no images in tool messages"
 * limitation on that endpoint, not a missing-token formatting issue.
 *
 * This proxy rewrites the outgoing prompt: any `file-data` part is stripped
 * out of its tool-result message and re-appended as a same-turn synthetic
 * `user` message carrying the same bytes as a standard `file` part. Verified
 * against the live API in exactly this shape (tool-result-without-image
 * immediately followed by a plain user message with the image) — HTTP 200.
 *
 * Model-scoped in providers.ts, NOT applied broadly — other OpenRouter
 * models already work fine with images embedded in the tool-result shape and
 * don't need (or want) this rewrite.
 */
import type {
  LanguageModelV3,
  LanguageModelV3CallOptions,
  LanguageModelV3FilePart,
  LanguageModelV3Message,
  LanguageModelV3Prompt,
} from '@ai-sdk/provider';

function rewritePrompt(prompt: LanguageModelV3Prompt): LanguageModelV3Prompt {
  const rewritten: LanguageModelV3Message[] = [];
  for (const message of prompt) {
    if (message.role !== 'tool') {
      rewritten.push(message);
      continue;
    }
    const images: LanguageModelV3FilePart[] = [];
    const nextContent = message.content.map((part) => {
      if (part.type !== 'tool-result' || part.output.type !== 'content') return part;
      const keptValue = part.output.value.filter((v) => {
        if (v.type !== 'file-data') return true;
        images.push({
          type: 'file',
          data: v.data,
          mediaType: v.mediaType,
          ...(v.filename ? { filename: v.filename } : {}),
        });
        return false;
      });
      return { ...part, output: { ...part.output, value: keptValue } };
    });
    rewritten.push({ ...message, content: nextContent });
    if (images.length > 0) rewritten.push({ role: 'user', content: images });
  }
  return rewritten;
}

/**
 * Wrap a `LanguageModelV3` so tool-result images are moved to a follow-up
 * `user` message before every call. All other properties/methods pass
 * through unchanged.
 */
export function splitToolResultImages(model: LanguageModelV3): LanguageModelV3 {
  const origDoStream = model.doStream.bind(model);
  return new Proxy(model, {
    get(target, prop, receiver) {
      if (prop === 'doStream') {
        return (options: LanguageModelV3CallOptions) =>
          origDoStream({ ...options, prompt: rewritePrompt(options.prompt) });
      }
      const value = Reflect.get(target, prop, receiver);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}
