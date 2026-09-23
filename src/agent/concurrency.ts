/** Immutable source operations can run concurrently; terminal completion must run alone. */
import { BeforeToolsEvent, type Agent } from '@strands-agents/sdk';

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

export function rejectMixedCompletionBatch(names: readonly string[]): string | undefined {
  if (names.includes('kiln_finish') && names.length > 1)
    return 'kiln_finish must run alone. No tools in this batch executed. Render or edit first, then finish in a separate call.';
  return undefined;
}

export function installCompletionBatchGuard(agent: Agent): () => void {
  return agent.addHook(BeforeToolsEvent, (event) => {
    const rejection = rejectMixedCompletionBatch(toolNamesInBatch(event.message));
    if (rejection) event.cancel = rejection;
  });
}
