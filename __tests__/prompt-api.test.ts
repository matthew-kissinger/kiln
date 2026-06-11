/**
 * Registry-unification gates (Phase 1.3):
 *
 *  1. Arity parity — every catalog signature's required-parameter count agrees
 *     with the real sandbox function's `Function.length` (named exceptions for
 *     rest/options/destructured signatures where JS arity can't see the truth).
 *  2. Prompt composition — the system prompt embeds the generated <api>
 *     enumeration, so EVERY cataloged primitive is teachable; a snapshot makes
 *     prompt changes reviewable in diffs.
 *  3. Skill drift gate — the on-disk kiln-glb skill files match the in-memory
 *     render; regenerate with `bun run kiln:gen-skill` when this fails.
 */

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { listPrimitives } from '../list-primitives';
import {
  renderApiSection,
  renderPrimitivesMarkdown,
  renderSkillQuickReference,
} from '../prompt-api';
import {
  KILN_SYSTEM_PROMPT,
  KILN_SYSTEM_PROMPT_SECTIONS,
  KILN_API_SECTION,
} from '../prompt';
import { buildSandboxGlobals } from '../primitives';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
const SKILL_DIR = resolve(REPO_ROOT, '.claude/skills/kiln-glb');

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
    for (const p of listPrimitives()) {
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
// (2) Prompt composition
// =============================================================================

describe('system prompt embeds the generated catalog', () => {
  test('every cataloged primitive name appears in the system prompt', () => {
    const missing = listPrimitives()
      .map((p) => p.name)
      .filter((name) => !KILN_SYSTEM_PROMPT.includes(name));
    expect(missing).toEqual([]);
  });

  test('the sections compose to the full prompt in canonical order', () => {
    expect(KILN_SYSTEM_PROMPT).toBe(KILN_SYSTEM_PROMPT_SECTIONS.map(([, s]) => s).join('\n\n'));
    expect(KILN_SYSTEM_PROMPT_SECTIONS.map(([name]) => name)).toEqual([
      'header',
      'file-format',
      'coordinate-contract',
      'api',
      'architecture',
      'quality',
      'attachment-rules',
      'rules',
      'animation-format',
      'visual-qa',
      'examples',
    ]);
  });

  test('api section keeps the load-bearing hand idioms', () => {
    expect(KILN_API_SECTION).toContain('WRONG: parent.add(createPart(...))');
    expect(KILN_API_SECTION).toContain('createInstance("WheelFR"');
    expect(KILN_API_SECTION).toContain('autoUnwrap');
    expect(KILN_API_SECTION).toContain('THREE namespace is exposed');
  });

  test('api section snapshot (review prompt changes in this diff)', () => {
    expect(renderApiSection(listPrimitives())).toMatchSnapshot();
  });
});

// =============================================================================
// (3) Skill drift gate
// =============================================================================

describe('kiln-glb skill files match the catalog render', () => {
  test('references/primitives.md is up to date (bun run kiln:gen-skill)', () => {
    const onDisk = readFileSync(resolve(SKILL_DIR, 'references/primitives.md'), 'utf-8');
    expect(onDisk.replace(/\r\n/g, '\n')).toBe(renderPrimitivesMarkdown(listPrimitives()));
  });

  test('SKILL.md generated block is up to date (bun run kiln:gen-skill)', () => {
    const skill = readFileSync(resolve(SKILL_DIR, 'SKILL.md'), 'utf-8').replace(/\r\n/g, '\n');
    const begin = skill.indexOf('<!-- BEGIN GENERATED PRIMITIVES -->');
    const end = skill.indexOf('<!-- END GENERATED PRIMITIVES -->');
    expect(begin).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(begin);
    const block = skill.slice(begin, end);
    expect(block).toContain(renderSkillQuickReference(listPrimitives()));
  });
});
