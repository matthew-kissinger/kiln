/**
 * Minimal, dependency-free unified diff for small text buffers.
 *
 * Kiln programs are a few KB, so a line-based LCS is plenty: we compute the
 * longest common subsequence of lines, backtrack into a `' '`/`'-'`/`'+'` op
 * stream, then group the ops into standard `@@ -a,b +c,d @@` hunks with a few
 * lines of surrounding context. The result records *what a surgical refine
 * changed* (parent -> final buffer) as a first-class provenance artifact, with
 * no new runtime dependency.
 */

export interface UnifiedDiffOptions {
  /** Label for the "before" file (the `---` header). Default: omit the header. */
  fromLabel?: string;
  /** Label for the "after" file (the `+++` header). Default: omit the header. */
  toLabel?: string;
  /** Lines of unchanged context to keep around each change. Default 3. */
  context?: number;
}

type Tag = ' ' | '-' | '+';
interface LocatedOp {
  tag: Tag;
  line: string;
  /** 0-based line index in the "before" file at this op. */
  a: number;
  /** 0-based line index in the "after" file at this op. */
  b: number;
}

/** LCS-backed line diff -> a flat op stream (equal / delete / insert). */
function diffLines(a: string[], b: string[]): Array<{ tag: Tag; line: string }> {
  const n = a.length;
  const m = b.length;

  // lcs[i][j] = length of the LCS of a[i..] and b[j..].
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i]![j] =
        a[i] === b[j] ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
    }
  }

  const ops: Array<{ tag: Tag; line: string }> = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ tag: ' ', line: a[i]! });
      i++;
      j++;
    } else if (lcs[i + 1]![j]! >= lcs[i]![j + 1]!) {
      ops.push({ tag: '-', line: a[i]! });
      i++;
    } else {
      ops.push({ tag: '+', line: b[j]! });
      j++;
    }
  }
  while (i < n) ops.push({ tag: '-', line: a[i++]! });
  while (j < m) ops.push({ tag: '+', line: b[j++]! });
  return ops;
}

/**
 * Compute a unified diff between two strings. Returns `''` when they are equal.
 * Output is a standard unified diff (optionally with `---`/`+++` headers).
 */
export function unifiedDiff(before: string, after: string, opts: UnifiedDiffOptions = {}): string {
  if (before === after) return '';
  const context = Math.max(0, opts.context ?? 3);
  const a = before.split('\n');
  const b = after.split('\n');

  // Annotate each op with its source line numbers as we walk the stream.
  let ai = 0;
  let bi = 0;
  const located: LocatedOp[] = diffLines(a, b).map((op) => {
    const rec: LocatedOp = { tag: op.tag, line: op.line, a: ai, b: bi };
    if (op.tag === ' ') {
      ai++;
      bi++;
    } else if (op.tag === '-') {
      ai++;
    } else {
      bi++;
    }
    return rec;
  });

  const changeIdx = located.map((o, k) => (o.tag === ' ' ? -1 : k)).filter((k) => k >= 0);
  if (changeIdx.length === 0) return '';

  // Group changes whose context windows touch into single hunks.
  const groups: Array<[number, number]> = [];
  let gStart = Math.max(0, changeIdx[0]! - context);
  let gEnd = Math.min(located.length - 1, changeIdx[0]! + context);
  for (let k = 1; k < changeIdx.length; k++) {
    const ci = changeIdx[k]!;
    if (ci - context <= gEnd + 1) {
      gEnd = Math.min(located.length - 1, ci + context);
    } else {
      groups.push([gStart, gEnd]);
      gStart = Math.max(0, ci - context);
      gEnd = Math.min(located.length - 1, ci + context);
    }
  }
  groups.push([gStart, gEnd]);

  const out: string[] = [];
  if (opts.fromLabel || opts.toLabel) {
    out.push(`--- ${opts.fromLabel ?? 'a'}`);
    out.push(`+++ ${opts.toLabel ?? 'b'}`);
  }

  for (const [s, e] of groups) {
    const slice = located.slice(s, e + 1);
    const first = slice[0]!;
    let aLen = 0;
    let bLen = 0;
    for (const o of slice) {
      if (o.tag === ' ') {
        aLen++;
        bLen++;
      } else if (o.tag === '-') {
        aLen++;
      } else {
        bLen++;
      }
    }
    // 1-based start lines; when a side contributes no lines, git uses the
    // 0-based position of the insertion point.
    const aStart = aLen > 0 ? first.a + 1 : first.a;
    const bStart = bLen > 0 ? first.b + 1 : first.b;
    out.push(`@@ -${aStart},${aLen} +${bStart},${bLen} @@`);
    for (const o of slice) out.push(`${o.tag}${o.line}`);
  }

  return out.join('\n');
}
