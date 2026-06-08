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

// =============================================================================
// Edit-mode tool skin (surgical refine)
// =============================================================================
//
// An alternative to whole-program re-emission for REFINING an existing asset.
// Instead of re-typing the full program through `kiln_submit`, the model edits a
// working buffer seeded with the parent's code via `kiln_edit` (exact-string
// replace, like Claude Code's Edit tool). Unchanged code is guaranteed byte-for-
// byte stable, and the sequence of edits becomes a first-class diff artifact.
//
// Used only when refining in edit mode (existingCode set + refineMode='edit');
// the from-scratch generate path keeps `makeKilnTools` unchanged.

/** One applied `kiln_edit` call, recorded for provenance / the diff trace. */
export interface EditRecord {
  oldString: string;
  newString: string;
  replaceAll: boolean;
  /** How many occurrences this edit actually replaced. */
  occurrences: number;
}

/** Result of a single `kiln_edit` application (never thrown - returned to the model). */
export type EditResult =
  | { ok: true; occurrences: number; newBytes: number }
  | { ok: false; error: string; occurrences?: number; hint?: string };

/**
 * A mutable sink the edit tools write into. Create one per run with `edits: []`,
 * pass it to {@link makeKilnEditTools}, and after invoke read `.code` (the final
 * working buffer) and `.edits` (the applied edit trace).
 */
export interface EditSink {
  code?: string;
  edits: EditRecord[];
}

/**
 * The in-memory working copy of the asset being refined. Pure string ops - no
 * Strands / THREE involvement - so it is trivially unit-testable on its own.
 */
export class KilnEditBuffer {
  private buf: string;
  readonly edits: EditRecord[] = [];

  constructor(seedCode: string) {
    this.buf = seedCode;
  }

  /** The current working code. */
  get code(): string {
    return this.buf;
  }

  /** Current line count. */
  get lineCount(): number {
    return this.buf.split('\n').length;
  }

  /** Read the current buffer (raw text - exactly what `apply` matches against). */
  view(): { code: string; lines: number } {
    return { code: this.buf, lines: this.lineCount };
  }

  /** Apply one exact-string replacement. Mirrors the Edit tool's contract. */
  apply(input: { oldString: string; newString: string; replaceAll?: boolean }): EditResult {
    const { oldString, newString } = input;
    const replaceAll = input.replaceAll ?? false;

    if (oldString.length === 0) {
      return { ok: false, error: 'oldString must not be empty.' };
    }
    if (oldString === newString) {
      return { ok: false, error: 'oldString and newString are identical - there is nothing to change.' };
    }

    const occurrences = this.buf.split(oldString).length - 1;
    if (occurrences === 0) {
      return {
        ok: false,
        error: 'oldString was not found in the current code.',
        hint: 'Call kiln_view and copy an exact span (including whitespace and indentation) to edit.',
      };
    }
    if (occurrences > 1 && !replaceAll) {
      return {
        ok: false,
        occurrences,
        error: `oldString matched ${occurrences} times, so the edit is ambiguous.`,
        hint: 'Add surrounding context to make oldString unique, or set replaceAll:true to change every occurrence.',
      };
    }

    // Replace WITHOUT going through String.prototype.replace(string, string):
    // that interprets `$&` / `$1` etc. in newString. Index/splice and split/join
    // are literal.
    if (replaceAll) {
      this.buf = this.buf.split(oldString).join(newString);
    } else {
      const at = this.buf.indexOf(oldString);
      this.buf = this.buf.slice(0, at) + newString + this.buf.slice(at + oldString.length);
    }

    const applied = replaceAll ? occurrences : 1;
    this.edits.push({ oldString, newString, replaceAll, occurrences: applied });
    return { ok: true, occurrences: applied, newBytes: this.buf.length };
  }
}

const viewInput = z.object({});

const editInput = z.object({
  oldString: z
    .string()
    .describe(
      'The exact text to replace, copied verbatim from the current code (no line-number prefixes). ' +
        'Must be unique in the buffer unless replaceAll is true.',
    ),
  newString: z.string().describe('The replacement text. Must differ from oldString.'),
  replaceAll: z
    .boolean()
    .optional()
    .describe('Replace every occurrence instead of requiring a unique match. Default false.'),
});

const bufferCodeInput = z.object({
  code: z
    .string()
    .optional()
    .describe('Kiln source to check. Omit to use the current working buffer (your edited code).'),
});

const submitEditInput = z.object({
  code: z
    .string()
    .optional()
    .describe(
      'The complete final program. Omit to submit the current working buffer (your applied edits) - ' +
        'recommended. Pass a full program only to replace the buffer wholesale.',
    ),
});

/**
 * Build the edit-mode tool list for a refine run: list_primitives (as-is),
 * `kiln_view` + `kiln_edit` over a working buffer seeded with `seedCode`, plus
 * `kiln_validate` / `kiln_render` / `kiln_submit` that default to the buffer
 * when their `code` arg is omitted. The buffer's live edit trace is shared into
 * `sink.edits`; `sink.code` tracks the latest buffer (so an un-submitted run
 * still captures the edits).
 */
export function makeKilnEditTools(opts: { seedCode: string; sink: EditSink }): Tool[] {
  const buffer = new KilnEditBuffer(opts.seedCode);
  opts.sink.edits = buffer.edits; // share the live trace

  const find = (name: string): (typeof kilnToolRegistry)[number] => {
    const def = kilnToolRegistry.find((d) => d.name === name);
    if (!def) throw new Error(`makeKilnEditTools: missing registry tool ${name}`);
    return def;
  };
  const validateDef = find('kiln_validate');
  const renderDef = find('kiln_render');

  const listTool = toStrandsTool(find('kiln_list_primitives'));

  const viewTool: Tool = tool({
    name: 'kiln_view',
    description:
      'Read the current working code (the asset you are editing). Returns the full raw source and ' +
      'its line count. kiln_edit matches against exactly this text - copy spans from here.',
    inputSchema: viewInput,
    callback: () => buffer.view() as JSONValue,
  });

  const editTool: Tool = tool({
    name: 'kiln_edit',
    description:
      'Make a surgical change to the working code: replace an exact span (oldString) with newString. ' +
      'oldString must appear verbatim in the current code (call kiln_view first) and be unique unless ' +
      'replaceAll is set. Make the smallest edits that satisfy the request; do not rewrite the whole ' +
      'program. Returns { ok, occurrences, newBytes } or { ok:false, error, hint }.',
    inputSchema: editInput,
    callback: (input) => {
      const r = buffer.apply(input);
      if (r.ok) opts.sink.code = buffer.code; // capture the live buffer even if submit is skipped
      return r as JSONValue;
    },
  });

  const validateTool: Tool = tool({
    name: 'kiln_validate',
    description: `${validateDef.description} Omit code to validate the current working buffer.`,
    inputSchema: bufferCodeInput,
    callback: async (input) =>
      (await validateDef.run({ code: (input as { code?: string }).code ?? buffer.code })) as JSONValue,
  });

  const renderTool: Tool = tool({
    name: 'kiln_render',
    description: `${renderDef.description} Omit code to render the current working buffer.`,
    inputSchema: bufferCodeInput,
    callback: async (input) =>
      (await renderDef.run({ code: (input as { code?: string }).code ?? buffer.code })) as JSONValue,
  });

  const submitTool: Tool = tool({
    name: KILN_SUBMIT_TOOL_NAME,
    description:
      'Submit your FINAL edited Kiln program. Call this exactly once after your edits validate and ' +
      'render. Omit code to submit the current working buffer (recommended); pass a complete program ' +
      'only to replace the buffer wholesale (the rewrite escape hatch).',
    inputSchema: submitEditInput,
    callback: (input) => {
      const code = (input as { code?: string }).code ?? buffer.code;
      opts.sink.code = code;
      return { ok: true, recorded: true, bytes: code.length, edits: buffer.edits.length } as JSONValue;
    },
  });

  return [listTool, viewTool, editTool, validateTool, renderTool, submitTool];
}
