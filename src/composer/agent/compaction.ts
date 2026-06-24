/**
 * Scene-composition context compaction.
 *
 * The composer's scene state lives in the `PlacementModel`, NOT the transcript —
 * every tool autosaves to the model, so the conversation history is pure working
 * memory (render images, move/face chatter) that bloats fast. Worse, with
 * image-bearing tool results it defeats the SDK's default
 * `SlidingWindowConversationManager`: its trim can't find a valid cut between a
 * tool-use and its tool-result, so it gives up ("no valid trim point found") and the
 * context grows unbounded.
 *
 * This manager exploits the externalized state. When the transcript grows past a
 * threshold, `reduce()` discards the ENTIRE history and replaces it with a single
 * synthetic user message carrying `serialize(model)` — the exact current program —
 * plus a directive to render once, make a few targeted fixes, and finalize. No LLM
 * summary (the model already IS the summary), no tool-pair surgery (we collapse to
 * one message, which is always a valid boundary), and the directive doubles as a
 * convergence nudge for a loop that would otherwise over-refine forever.
 *
 * Two triggers, both routed through `reduce`:
 *   - message-count — our own `BeforeModelCallEvent` hook; the signal that actually
 *     bloats for us, and a clean proxy for "past N steps".
 *   - context overflow — reactive, inherited from the base `ConversationManager`
 *     (`AfterModelCallEvent` on `ContextWindowOverflowError`); the hard safety net if
 *     a single step ever overflows the model window.
 */
import {
  BeforeModelCallEvent,
  ConversationManager,
  type ConversationManagerReduceOptions,
  type LocalAgent,
  Message,
  TextBlock,
} from '@strands-agents/sdk';

import { serialize } from '../dsl';
import type { PlacementModel } from '../model';

/** Telemetry for one compaction event (best-effort, for progress UIs). */
export interface SceneCompactionInfo {
  /** Transcript length immediately before the collapse. */
  messagesBefore: number;
  /** Placements in the scene at compaction time. */
  placements: number;
  /** Unresolved footprint overlaps at compaction time. */
  overlaps: number;
}

export interface SceneCompactionConfig {
  /** The live scene model — its serialization IS the compacted context. */
  model: PlacementModel;
  /** Short recap of the scene goal, re-stated in the compaction message so the
   *  collapsed transcript stays self-contained. The system prompt (conventions) is
   *  retained separately and the asset catalog is re-discoverable via
   *  scene_list_assets, so the program + goal is all the agent needs to continue. */
  taskRecap?: string;
  /** Compact when the transcript grows past this many messages. Default 24. */
  maxMessages?: number;
  /** Notified after each compaction (best-effort; errors are swallowed). */
  onCompact?: (info: SceneCompactionInfo) => void;
}

const DEFAULT_MAX_MESSAGES = 24;

/**
 * Collapses the composer transcript to the current scene program once it grows past
 * `maxMessages`, so a long compose loop stays cheap and can actually reach finalize.
 */
export class SceneCompactionManager extends ConversationManager {
  readonly name = 'kiln:scene-compaction';
  private readonly model: PlacementModel;
  private readonly taskRecap: string | undefined;
  private readonly maxMessages: number;
  private readonly onCompact: ((info: SceneCompactionInfo) => void) | undefined;

  constructor(config: SceneCompactionConfig) {
    // Base wires reactive overflow recovery only; the message-count trigger below is
    // our proactive path (token-fraction proactive is a poor fit for big-window models).
    super();
    this.model = config.model;
    this.taskRecap = config.taskRecap;
    this.maxMessages =
      config.maxMessages && config.maxMessages > 0 ? config.maxMessages : DEFAULT_MAX_MESSAGES;
    this.onCompact = config.onCompact;
  }

  /** Keep the base's reactive overflow hook, and add a per-model-call message-count
   *  trigger so we compact proactively before the transcript ever overflows. */
  override initAgent(agent: LocalAgent): void {
    super.initAgent(agent);
    agent.addHook(BeforeModelCallEvent, (event) => {
      if (event.agent.messages.length > this.maxMessages) {
        this.reduce({ agent: event.agent, model: event.model });
      }
    });
  }

  /** Replace the whole transcript with one synthetic user message carrying the current
   *  program. A single message is always a valid boundary (no dangling tool pairs) and
   *  reduces history for both the message-count trigger and reactive overflow. */
  reduce({ agent }: ConversationManagerReduceOptions): boolean {
    const messages = agent.messages;
    if (messages.length <= 1) return false;
    const before = messages.length;
    const ev = this.model.placements();
    const text = this.compactionText(
      serialize(this.model),
      ev.placements.length,
      ev.overlaps.length,
    );
    const synthetic = new Message({ role: 'user', content: [new TextBlock(text)] });
    messages.splice(0, messages.length, synthetic);
    if (this.onCompact) {
      try {
        this.onCompact({
          messagesBefore: before,
          placements: ev.placements.length,
          overlaps: ev.overlaps.length,
        });
      } catch {
        // progress sinks are best-effort
      }
    }
    return true;
  }

  /** The "proper compaction prompt": the program is the state; render, fix a little,
   *  finalize. Engineered to break the blind over-refine spiral. */
  private compactionText(program: string, placements: number, overlaps: number): string {
    const goal = this.taskRecap ? `\nScene goal: ${this.taskRecap.trim()}\n` : '';
    return (
      '[Context compacted to save budget. The scene program below is the source of truth — it ' +
      'reflects every placement you have made so far; the earlier tool history (renders, edits) has ' +
      'been dropped. Call scene_render again whenever you need to see the current state.]\n' +
      goal +
      `\nCurrent scene program — ${placements} placement(s), ${overlaps} unresolved overlap(s):\n` +
      '```\n' +
      `${program}\n` +
      '```\n\n' +
      'You are deep into your tool budget. Bring the scene to a clean finish now:\n' +
      '1. scene_render ONCE and look at all three angles.\n' +
      '2. Make at most 2-3 targeted fixes (worst overlap, anything facing the wrong way, an obvious gap).\n' +
      '3. scene_finalize. Do NOT re-layout or re-place from scratch — refine what is here, then finalize.'
    );
  }
}
