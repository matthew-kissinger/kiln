/**
 * ScriptedModel — a deterministic offline Strands `Model` for agent-loop tests.
 *
 * Plays back a fixed list of turns: each turn is either a set of tool calls
 * (with complete JSON inputs) or a final text. Events are emitted in the exact
 * shapes the SDK's `streamAggregated` consumes (verified against
 * @strands-agents/sdk 1.10.0 dist/src/models/model.js), so a REAL `Agent` runs
 * its genuine loop — hooks, concurrent tool execution, usage accumulation —
 * against it with no network and no provider SDK.
 *
 * Test helper only (lives under __tests__ so it is coverage-exempt).
 */
import { Model, type Message, type StreamOptions, type Usage } from '@strands-agents/sdk';
import type { BaseModelConfig, ModelStreamEvent } from '@strands-agents/sdk';

export interface ScriptedToolCall {
  name: string;
  input?: unknown;
  id?: string;
}

export type ScriptedTurn =
  | { toolCalls: ScriptedToolCall[]; usage?: Usage }
  | { text: string; usage?: Usage };

export class ScriptedModel extends Model {
  /** `options.systemPrompt` captured per stream() call, in order. */
  readonly seenSystemPrompts: unknown[] = [];
  private turnIndex = 0;

  constructor(private readonly turns: ScriptedTurn[]) {
    super();
  }

  override updateConfig(_config: BaseModelConfig): void {
    // scripted — nothing to configure
  }

  override getConfig(): BaseModelConfig {
    return { modelId: 'scripted-test-model' };
  }

  override async *stream(
    _messages: Message[],
    options?: StreamOptions,
  ): AsyncIterable<ModelStreamEvent> {
    this.seenSystemPrompts.push(options?.systemPrompt);
    const turn: ScriptedTurn = this.turns[this.turnIndex] ?? { text: '(script exhausted)' };
    this.turnIndex += 1;

    yield { type: 'modelMessageStartEvent', role: 'assistant' };
    if ('toolCalls' in turn) {
      let i = 0;
      for (const call of turn.toolCalls) {
        yield {
          type: 'modelContentBlockStartEvent',
          start: {
            type: 'toolUseStart',
            name: call.name,
            toolUseId: call.id ?? `scripted_${this.turnIndex}_${i}`,
          },
        };
        yield {
          type: 'modelContentBlockDeltaEvent',
          delta: { type: 'toolUseInputDelta', input: JSON.stringify(call.input ?? {}) },
        };
        yield { type: 'modelContentBlockStopEvent' };
        i += 1;
      }
    } else {
      yield { type: 'modelContentBlockStartEvent' };
      yield { type: 'modelContentBlockDeltaEvent', delta: { type: 'textDelta', text: turn.text } };
      yield { type: 'modelContentBlockStopEvent' };
    }
    if (turn.usage) yield { type: 'modelMetadataEvent', usage: turn.usage };
    yield {
      type: 'modelMessageStopEvent',
      stopReason: 'toolCalls' in turn ? 'toolUse' : 'endTurn',
    };
  }
}
