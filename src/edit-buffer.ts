/**
 * The program working buffer, and the exact-string edit that patches it.
 *
 * This lives outside `agent/` on purpose. Both transports need it now -- the
 * in-process Strands refine surface and the MCP `kiln_edit` tool -- and
 * `agent/tools.ts` imports `@strands-agents/sdk` at module load. Importing the
 * buffer from there would have pulled the agent SDK into `kiln/tools` and into
 * the MCP server bundle, which is the one edge that subpath is documented not to
 * have. So the buffer moved down here, where it belongs anyway: it is pure
 * string manipulation with no THREE, no SDK, and no I/O, and it is the single
 * definition both surfaces share rather than two dialects of the same edit
 * semantics that could drift apart.
 */

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
 * The in-memory working copy of the program being authored or refined. Pure
 * string ops - no Strands / THREE involvement - so it is trivially unit-testable
 * on its own.
 *
 * Two ways to write it: {@link draft} replaces the whole buffer (the authoring
 * verb — generate starts from an empty buffer and drafts the first program),
 * and {@link apply} does a surgical exact-string edit (recorded in `edits` for
 * the refine diff). Seed defaults to empty for the from-scratch generate path;
 * pass the parent's code to seed a refine.
 */
export class KilnDraftBuffer {
  private buf: string;
  readonly edits: EditRecord[] = [];

  constructor(seedCode: string = '') {
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

  /**
   * Replace the entire working buffer (the authoring verb). NOT recorded as an
   * edit — drafting is wholesale authoring, not a surgical diff step. The refine
   * diff is always computed from the seed to the final buffer, so a draft is
   * captured there regardless.
   */
  draft(code: string): { ok: true; bytes: number; lines: number } {
    this.buf = code;
    return { ok: true, bytes: this.buf.length, lines: this.lineCount };
  }

  /** Apply one exact-string replacement. Mirrors the Edit tool's contract. */
  apply(input: { oldString: string; newString: string; replaceAll?: boolean }): EditResult {
    const { oldString, newString } = input;
    const replaceAll = input.replaceAll ?? false;

    if (oldString.length === 0) {
      return { ok: false, error: 'oldString must not be empty.' };
    }
    if (oldString === newString) {
      return {
        ok: false,
        error: 'oldString and newString are identical - there is nothing to change.',
      };
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

/** Back-compat alias: the edit-mode refine path and external importers (kiln-studio
 *  mock, tests) still refer to this as `KilnEditBuffer`. Same class. */
export { KilnDraftBuffer as KilnEditBuffer };
