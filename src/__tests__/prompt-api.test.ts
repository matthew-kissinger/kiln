/** Catalog signature and generated API-reference checks. Current skill drift is checked by check:skills. */

import { describe, expect, test } from 'bun:test';

import { listHelperSpecs } from '../discovery/helper-specs';
import { renderApiSection } from '../prompt-api';
import { buildSandboxGlobals } from '../primitives';

// =============================================================================
// (1) Arity parity
// =============================================================================

/**
 * Signatures whose JS `Function.length` legitimately exceeds the documented
 * param count (e.g. internal-only trailing params). Currently empty — add a
 * name here ONLY with a comment explaining why the drift is not model-facing.
 */
const ARITY_EXCEPTIONS = new Set<string>([]);

/** Count ALL documented top-level params (required + optional, incl. rest). */
function documentedParamCount(signature: string): number {
  const open = signature.indexOf('(');
  const close = signature.lastIndexOf(')');
  if (open === -1 || close === -1) return 0;
  const inner = signature.slice(open + 1, close).trim();
  if (!inner) return 0;

  let depth = 0;
  let count = 1;
  for (const ch of inner) {
    if (ch === '(' || ch === '[' || ch === '{' || ch === '<') depth++;
    else if (ch === ')' || ch === ']' || ch === '}' || ch === '>') depth--;
    else if (ch === ',' && depth === 0) count++;
  }
  return count;
}

describe('catalog arity parity', () => {
  // Direction matters: an impl that takes FEWER declared params than documented
  // is just defensive defaults (harmless), but an impl whose Function.length
  // EXCEEDS the documented param count means the catalog omits a real
  // parameter — a model following the catalog can never discover it. That is
  // exactly how the interp param of rotation/position/scaleTrack went missing.
  test('the catalog documents at least as many params as the impl declares', () => {
    const globals = buildSandboxGlobals();
    const mismatches: string[] = [];
    for (const p of listHelperSpecs()) {
      if (ARITY_EXCEPTIONS.has(p.name)) continue;
      const fn = globals[p.name] as ((...args: unknown[]) => unknown) | undefined;
      if (typeof fn !== 'function') continue; // covered by the existing parity test
      const documented = documentedParamCount(p.signature.replace(/^await\s+/, ''));
      if (fn.length > documented) {
        mismatches.push(
          `${p.name}: impl declares ${fn.length} params but the signature documents only ${documented}`,
        );
      }
    }
    expect(mismatches).toEqual([]);
  });
});

// =============================================================================
// (2) Generated catalog renderings
// =============================================================================

describe('unified api surface (examples folded in)', () => {
  const primitives = listHelperSpecs();
  const def = renderApiSection(primitives);
  const withExamples = renderApiSection(primitives, { includeExamples: true });

  test('includeExamples:false is byte-identical to the default rendering', () => {
    expect(renderApiSection(primitives, { includeExamples: false })).toBe(def);
  });

  test('includeExamples:true folds an `e.g.` line per primitive (longer than default)', () => {
    const count = (s: string) => (s.match(/\/\/ e\.g\./g) ?? []).length;
    expect(withExamples.length).toBeGreaterThan(def.length);
    // Every primitive carries an example, so the folded render adds many `e.g.` lines.
    expect(count(withExamples)).toBeGreaterThan(count(def) + 40);
  });

  test('multi-line examples are collapsed to a single logical comment (no raw newline-in-example)', () => {
    // snapTo / createPart have multi-line examples; folded output must not leave a
    // bare un-commented continuation line (every wrapped line is `//`-prefixed).
    for (const line of withExamples.split('\n')) {
      expect(line === '' || line.trimStart().startsWith('//') || line.includes('(')).toBe(true);
    }
  });

  test('unified api snapshot (review folded examples in this diff)', () => {
    expect(withExamples).toMatchSnapshot();
  });
});
