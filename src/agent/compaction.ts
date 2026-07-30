/**
 * Generation-loop transcript compaction — stale render-image pruning.
 *
 * Every kiln_render / kiln_screenshot / kiln_view_interior / animation tool
 * result carries a PNG ImageBlock the model inspects ONCE, then drags through
 * every later model call (the single biggest input-token lever in a generation
 * run — a six-view grid is tens of KB of image tokens per step). Unlike the
 * composer (whose state lives in the PlacementModel, so its manager collapses
 * the WHOLE transcript — see composer/agent/compaction.ts), the generation
 * loop's transcript carries authoring context worth keeping. So this pruner is
 * surgical: before each model call it strips the image blocks out of every
 * image-bearing tool result EXCEPT the newest one(s), replacing them with a
 * short text placeholder INSIDE the tool result.
 *
 * Tool-use/tool-result pairing is never touched — no messages are added or
 * removed, no toolUseIds change; only the media inside an existing tool result
 * is swapped for text (a TextBlock is a valid ToolResultContent). The JSON
 * metrics half of each result (grade, tris, warnings) survives, so the model
 * keeps the numeric history and loses only superseded pixels. Images OUTSIDE
 * tool results (the user's reference inputImage) are always preserved.
 */
import {
  AfterToolCallEvent,
  BeforeModelCallEvent,
  TextBlock,
  type Agent,
  type Message,
} from '@strands-agents/sdk';

/** Placeholder text swapped in for a superseded render image. */
export const STALE_RENDER_PLACEHOLDER =
  '[earlier render image omitted — superseded by a newer render]';

/** What one prune pass did. */
export interface PruneImagesResult {
  /** Image blocks removed across the transcript. */
  prunedImages: number;
  /** Tool results that had their images swapped for the placeholder. */
  prunedResults: number;
}

/** Duck-typed views over the SDK block classes (mirrors run.ts's lastMessageText:
 *  the discriminators are stable, and duck-typing keeps the pruner robust to the
 *  class instances the live loop holds). */
interface BlockLike {
  type?: string;
  content?: unknown[];
}

function isImageBlock(block: unknown): boolean {
  return (block as BlockLike).type === 'imageBlock';
}

function isToolResultBlock(block: unknown): block is Required<Pick<BlockLike, 'content'>> {
  const b = block as BlockLike;
  return b.type === 'toolResultBlock' && Array.isArray(b.content);
}

/**
 * Strip image blocks from all but the newest `keep` image-bearing tool results
 * (default 1 — only the latest render image stays). Mutates the tool-result
 * content arrays in place; each pruned result gets ONE placeholder TextBlock in
 * the position of its first image. Idempotent: already-pruned results carry no
 * images and are skipped on the next pass.
 */
export function pruneStaleRenderImages(
  messages: readonly Message[],
  opts: { keep?: number } = {},
): PruneImagesResult {
  const keep = opts.keep ?? 1;

  // Collect every image-bearing tool result, in transcript order.
  const bearing: Array<{ content: unknown[] }> = [];
  for (const message of messages) {
    for (const block of message.content) {
      if (isToolResultBlock(block) && block.content.some(isImageBlock)) {
        bearing.push(block);
      }
    }
  }

  const cut = Math.max(0, bearing.length - Math.max(0, keep));
  let prunedImages = 0;
  let prunedResults = 0;
  for (const result of bearing.slice(0, cut)) {
    const images = result.content.filter(isImageBlock).length;
    const placeholder =
      images > 1
        ? new TextBlock(`[${images} earlier render images omitted — superseded by a newer render]`)
        : new TextBlock(STALE_RENDER_PLACEHOLDER);
    const next: unknown[] = [];
    let placed = false;
    for (const item of result.content) {
      if (isImageBlock(item)) {
        if (!placed) {
          next.push(placeholder);
          placed = true;
        }
        continue;
      }
      next.push(item);
    }
    result.content.splice(0, result.content.length, ...next);
    prunedImages += images;
    prunedResults += 1;
  }
  return { prunedImages, prunedResults };
}

export interface RenderImageCompactionOptions {
  /** How many newest image-bearing tool results keep their images. Default 1. */
  keep?: number;
  /** Notified after a pass that pruned something (best-effort; errors swallowed). */
  onPrune?: (info: PruneImagesResult) => void;
}

/**
 * Install the pruner on an agent: before EVERY model call, stale render images
 * are swapped for placeholders so only the newest one rides the request. Same
 * hook mechanism the composer's SceneCompactionManager uses, but additive — the
 * agent's default conversation manager stays in place. Returns the unsubscribe.
 */
export function installRenderImageCompaction(
  agent: Agent,
  opts: RenderImageCompactionOptions = {},
): () => void {
  return agent.addHook(BeforeModelCallEvent, (event) => {
    const result = pruneStaleRenderImages(
      event.agent.messages,
      opts.keep != null ? { keep: opts.keep } : {},
    );
    if (result.prunedImages > 0 && opts.onPrune) {
      try {
        opts.onPrune(result);
      } catch {
        // progress sinks are best-effort
      }
    }
  });
}

// =============================================================================
// Generation-loop counters (M1 per-call input/transcript size, M2 renders)
// =============================================================================

/** M1: one record per model call, in call order. */
export interface ModelCallStat {
  /** Projected input tokens for this call (SDK `BeforeModelCallEvent.projectedInputTokens`
   *  — the agent loop's own estimate; hook events carry no billed usage). Absent when
   *  the SDK did not compute a projection. */
  inputTokens?: number;
  /** Transcript length (`agent.messages.length`) when this call was issued. */
  messages: number;
}

/** M1/M2 loop instrumentation collected passively via hooks. Data only. */
export interface GenerationCounters {
  /** M1: per-model-call stats, in order (includes calls later cancelled by the step cap). */
  modelCalls: ModelCallStat[];
  /** M2: render-bearing tool results produced this generation — every tool result
   *  that carried at least one image (kiln_render / kiln_screenshot / inspect /
   *  animation / interior views). */
  renders: number;
}

/**
 * Install passive M1/M2 counters on an agent: before every model call, record
 * the projected input tokens and transcript length; after every tool call,
 * count image-bearing (render) results. Same additive hook mechanism as
 * {@link installRenderImageCompaction} — no messages are touched, no output is
 * printed. Returns the live counters plus an uninstaller.
 */
export function installGenerationCounters(agent: Agent): {
  counters: GenerationCounters;
  uninstall: () => void;
} {
  const counters: GenerationCounters = { modelCalls: [], renders: 0 };
  const offModel = agent.addHook(BeforeModelCallEvent, (event) => {
    counters.modelCalls.push({
      ...(typeof event.projectedInputTokens === 'number'
        ? { inputTokens: event.projectedInputTokens }
        : {}),
      messages: event.agent.messages.length,
    });
  });
  const offTool = agent.addHook(AfterToolCallEvent, (event) => {
    const content = (event.result as { content?: unknown[] } | undefined)?.content;
    if (Array.isArray(content) && content.some(isImageBlock)) counters.renders += 1;
  });
  return {
    counters,
    uninstall: () => {
      offModel();
      offTool();
    },
  };
}
