/**
 * A3 — mutator/reader tool-batch concurrency guard.
 *
 * Strands executes a turn's tool calls CONCURRENTLY by default (Agent
 * `toolExecutor: 'concurrent'`), and the kiln buffer surfaces share one mutable
 * `KilnDraftBuffer`: `kiln_draft` / `kiln_edit` write `buffer.code` while every
 * other kiln tool reads it (validate-on-write, render, view, inspect, finalize,
 * ...). A batch that mixes a buffer write with anything else therefore races —
 * a reader can observe the buffer mid-turn in either the before or after state,
 * and two writes can interleave.
 *
 * Rather than forcing `toolExecutor: 'sequential'` (which would serialize the
 * harmless read-only batches too), this guard rejects only the dangerous shape:
 * a single assistant turn requesting 2+ tool calls where at least one call is a
 * buffer mutator. The whole batch gets a clear, actionable tool error telling
 * the model to issue the mutator alone; pure-reader batches and solo mutators
 * pass through untouched.
 *
 * Seam: the SDK's `BeforeToolsEvent` fires once per turn BEFORE any tool runs
 * and carries the full assistant message (every `toolUse` block of the batch);
 * setting `event.cancel` to a string makes the SDK return that string as the
 * error tool result for every call in the batch — exactly the reject-the-batch
 * contract, on the real run path.
 */
import { BeforeToolsEvent, type Agent } from '@strands-agents/sdk';

/** Kiln tools that WRITE the shared working buffer. Everything else on the kiln
 *  surfaces only reads it (kiln_submit / kiln_finalize capture into the sink but
 *  never change `buffer.code`). */
export const KILN_MUTATOR_TOOLS: ReadonlySet<string> = new Set(['kiln_draft', 'kiln_edit']);

/** Duck-typed view over an assistant-message content block (same discriminator
 *  convention as run.ts / compaction.ts — robust across SDK class realms). */
interface ToolUseBlockLike {
  type?: string;
  name?: string;
}

/** Extract the tool names requested by an assistant message's toolUse blocks. */
export function toolNamesInBatch(message: { content: readonly unknown[] }): string[] {
  const names: string[] = [];
  for (const block of message.content) {
    const b = block as ToolUseBlockLike;
    if (b.type === 'toolUseBlock' && typeof b.name === 'string') names.push(b.name);
  }
  return names;
}

/**
 * Decide whether a tool batch must be rejected. Returns the rejection message
 * when the batch mixes a buffer mutator with any other call (including a second
 * mutator), or undefined when the batch is safe (solo calls, pure readers).
 */
export function rejectMixedMutatorBatch(names: readonly string[]): string | undefined {
  if (names.length < 2) return undefined;
  const mutators = names.filter((n) => KILN_MUTATOR_TOOLS.has(n));
  if (mutators.length === 0) return undefined;
  return (
    `kiln: rejected this tool batch — ${[...new Set(mutators)].join(' and ')} ` +
    'modifies the shared working buffer, and the batch requested ' +
    `${names.length} tools to run concurrently (${names.join(', ')}). ` +
    'Buffer-writing tools (kiln_draft, kiln_edit) must run ALONE. ' +
    'Re-issue the buffer-writing call as the only tool call of the turn, then ' +
    'make your other calls in the next turn. No tools were executed.'
  );
}

/**
 * Install the guard on an agent. Returns the unsubscribe function.
 */
export function installMutatorBatchGuard(agent: Agent): () => void {
  return agent.addHook(BeforeToolsEvent, (event) => {
    const rejection = rejectMixedMutatorBatch(toolNamesInBatch(event.message));
    if (rejection) event.cancel = rejection;
  });
}
