/**
 * In-process Kiln tool skin for the agnostic Strands agent foundation.
 *
 * Adapts the shared `kilnToolRegistry` (kiln/tools/registry) into Strands
 * `tool()` instances that run in the same Node realm as the agent loop, plus a
 * terminal `kiln_submit` tool the agent calls once to record its final program.
 * The registry is the single source of truth for tool names/descriptions/schemas,
 * so any other transport (e.g. an MCP skin) stays byte-for-byte consistent.
 *
 * An explicit submit tool is preferred over `structuredOutputSchema` because the
 * latter's coexistence with a full tool set is provider-dependent; a submit tool
 * is unambiguous and works across every provider.
 */
import { tool, type Tool, type JSONValue } from '@strands-agents/sdk';
import { z } from 'zod';

import { kilnToolRegistry } from '../tools/registry';

/** Name of the terminal tool the agent calls to record its final program. */
export const KILN_SUBMIT_TOOL_NAME = 'kiln_submit';

/**
 * A mutable sink the `kiln_submit` tool writes the final code into. Create one
 * per run, pass it to {@link makeKilnTools}, and read `.code` after invoke.
 */
export interface SubmitSink {
  code?: string;
}

const submitInput = z.object({
  code: z
    .string()
    .describe(
      'The complete, final Kiln program (defines `meta` + `build()`, optional `animate()`). ' +
        'Call this exactly once when you are done to record your answer.',
    ),
});

function toStrandsTool(def: (typeof kilnToolRegistry)[number]): Tool {
  return tool({
    name: def.name,
    description: def.description,
    inputSchema: def.inputSchema as z.ZodType,
    callback: async (input) => (await def.run(input)) as JSONValue,
  });
}

/**
 * Build the in-process tool list for an agent: the kiln registry tools
 * (list_primitives / validate / render) plus the terminal `kiln_submit` tool.
 *
 * @param sink - Receives the submitted final code. Read `sink.code` after invoke.
 */
export function makeKilnTools(sink: SubmitSink): Tool[] {
  const kilnTools = kilnToolRegistry.map(toStrandsTool);
  const submitTool: Tool = tool({
    name: KILN_SUBMIT_TOOL_NAME,
    description:
      'Submit your FINAL Kiln program. Call this exactly once, after you have ' +
      'validated and rendered your code, to record the answer. The argument ' +
      '`code` must be the complete program (meta + build(), optional animate()).',
    inputSchema: submitInput,
    callback: (input) => {
      sink.code = input.code;
      return { ok: true, recorded: true, bytes: input.code.length };
    },
  });
  return [...kilnTools, submitTool];
}
