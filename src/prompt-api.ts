/**
 * Model-facing renderings of the Kiln primitive catalog.
 *
 * `list-primitives.ts` is the single source of truth for what the sandbox
 * exposes; this module turns that catalog into the three places models read
 * it: the system prompt's <api> section, the kiln-glb skill's primitives
 * reference, and the SKILL.md quick-reference block. All three are generated
 * at load time (core has no build step; rendering is ~1ms and deterministic),
 * so adding a primitive to the catalog automatically updates every surface.
 *
 * Hand-written pedagogy (usage idioms, attachment rules, worked examples)
 * stays hand-authored in prompt.ts AROUND the generated enumeration — this
 * module only renders what the catalog knows.
 */

import type { PrimitiveSpec } from './list-primitives';

/** Display order + comment header for each catalog category in the prompt. */
const CATEGORY_HEADERS: Array<[PrimitiveSpec['category'], string]> = [
  ['structure', '// Scene & structure (globals — no imports needed)'],
  ['geometry', '// Geometry (returns BufferGeometry)'],
  ['material', '// Materials'],
  ['instancing', '// Instancing (share geometry+material; smaller GLBs)'],
  ['arrays', '// Arrays (replicate a source part)'],
  ['csg', '// CSG / Boolean (async — using any of these requires `async function build()`)'],
  ['mesh-ops', '// Mesh ops'],
  ['curves', '// Curves'],
  ['uv', '// UV unwrapping'],
  ['textures', '// Textures (loadTexture is async)'],
  ['animation', '// Animation — keyframes use "rotation"/"position"/"scale" keys, NOT "value"'],
  ['utility', '// Inspection utilities'],
];

/**
 * A rule that holds for EVERY primitive in a category, rendered once under the
 * category header.
 *
 * Why not `promptNotes` on each entry: the whole catalog goes into every system
 * prompt, so an identical paragraph on all four CSG ops costs four times the
 * tokens for no extra signal — and the four entries render consecutively under
 * the header anyway, so one statement sits directly above all of them.
 * Per-entry `promptNotes` stays the right home for anything that distinguishes
 * one primitive from its neighbours.
 */
const CATEGORY_NOTES: Partial<Record<PrimitiveSpec['category'], string>> = {
  csg:
    'UVs do NOT survive a boolean: the manifold bridge carries positions only, so the result has ' +
    'no uv attribute and any texture on it will not appear. Unwrap AFTER the boolean, never before — ' +
    '`mesh.geometry = await autoUnwrap(mesh.geometry)`. Unwrapping an operand first is wasted work; ' +
    'the next boolean throws the atlas away. An operand that contributes zero triangles (an empty ' +
    'Group) and an empty result both throw with the cause named, instead of silently producing an ' +
    'invisible part.',
};

const WRAP = 96;

/** Wrap text into `// `-prefixed comment lines at ~WRAP columns. */
function wrapComment(text: string, indent: string): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if (line && (indent + '// ' + line + ' ' + w).length > WRAP) {
      lines.push(`${indent}// ${line}`);
      line = w;
    } else {
      line = line ? `${line} ${w}` : w;
    }
  }
  if (line) lines.push(`${indent}// ${line}`);
  return lines;
}

function renderPrimitiveLines(p: PrimitiveSpec, includeExamples = false): string[] {
  const oneLiner = `${p.signature}  // ${p.description}`;
  const lines: string[] = [];
  if (oneLiner.length <= WRAP + 20 && !p.description.includes('\n')) {
    lines.push(oneLiner);
  } else {
    lines.push(p.signature);
    lines.push(...wrapComment(p.description, '  '));
  }
  if (p.promptNotes) {
    lines.push(...wrapComment(`NOTE: ${p.promptNotes}`, '  '));
  }
  if (includeExamples && p.example) {
    // Fold the per-primitive example into the <api> (replaces the dropped
    // kiln_list_primitives tool's only extra signal). Collapse internal newlines
    // in multi-line examples (snapTo/createPart) to one logical line so the
    // section stays scannable; wrapComment re-wraps long ones at WRAP columns.
    const collapsed = p.example
      .replace(/\s*\n\s*/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    lines.push(...wrapComment(`e.g. ${collapsed}`, '  '));
  }
  return lines;
}

/**
 * Render the catalog enumeration that fills the system prompt's <api> section:
 * category comment headers followed by one entry per primitive (signature plus
 * a wrapped description comment and any promptNotes). Order is the canonical
 * category order, primitives in catalog order within each category.
 *
 * `includeExamples` (default false → byte-identical to today) appends each
 * primitive's collapsed example, used by the unified tool surface to fold in the
 * signal the dropped kiln_list_primitives tool used to carry.
 */
export function renderApiSection(
  primitives: PrimitiveSpec[],
  opts: { includeExamples?: boolean } = {},
): string {
  const includeExamples = opts.includeExamples ?? false;
  const byCategory = new Map<string, PrimitiveSpec[]>();
  for (const p of primitives) {
    const list = byCategory.get(p.category) ?? [];
    list.push(p);
    byCategory.set(p.category, list);
  }

  const blocks: string[] = [];
  for (const [category, header] of CATEGORY_HEADERS) {
    const list = byCategory.get(category);
    if (!list || list.length === 0) continue;
    const lines = [header];
    const note = CATEGORY_NOTES[category];
    if (note) lines.push(...wrapComment(`NOTE: ${note}`, ''));
    for (const p of list) lines.push(...renderPrimitiveLines(p, includeExamples));
    blocks.push(lines.join('\n'));
  }

  // Catch categories the header table does not know yet — never drop entries.
  const known = new Set(CATEGORY_HEADERS.map(([c]) => c));
  for (const [category, list] of byCategory) {
    if (known.has(category as PrimitiveSpec['category'])) continue;
    const lines = [`// ${category}`];
    for (const p of list) lines.push(...renderPrimitiveLines(p, includeExamples));
    blocks.push(lines.join('\n'));
  }

  return blocks.join('\n\n');
}

/**
 * Render the full markdown primitives reference for the kiln-glb skill
 * (`references/primitives.md`). One section per category, one subsection per
 * primitive with signature, returns, description, notes, and example.
 */
export function renderPrimitivesMarkdown(primitives: PrimitiveSpec[]): string {
  const byCategory = new Map<string, PrimitiveSpec[]>();
  for (const p of primitives) {
    const list = byCategory.get(p.category) ?? [];
    list.push(p);
    byCategory.set(p.category, list);
  }

  const titles: Record<string, string> = {
    structure: 'Scene & Structure',
    geometry: 'Geometry',
    material: 'Materials',
    instancing: 'Instancing',
    arrays: 'Arrays',
    csg: 'CSG / Boolean (async)',
    'mesh-ops': 'Mesh Ops',
    curves: 'Curves',
    uv: 'UV Unwrapping',
    textures: 'Textures',
    animation: 'Animation',
    utility: 'Inspection Utilities',
  };

  const parts: string[] = [
    '# Kiln Primitives Reference',
    '',
    '<!-- GENERATED FILE — do not edit by hand. -->',
    '<!-- Source: packages/core/src/kiln/list-primitives.ts -->',
    '<!-- Regenerate: bun run kiln:gen-skill -->',
    '',
    `Every helper the Kiln sandbox exposes to generated code (${primitives.length} primitives). No imports needed — all are globals inside build()/animate().`,
  ];

  const order = [...CATEGORY_HEADERS.map(([c]) => c)];
  for (const [category] of byCategory) {
    if (!order.includes(category as PrimitiveSpec['category'])) {
      order.push(category as PrimitiveSpec['category']);
    }
  }

  for (const category of order) {
    const list = byCategory.get(category);
    if (!list || list.length === 0) continue;
    parts.push('', `## ${titles[category] ?? category}`);
    const categoryNote = CATEGORY_NOTES[category as PrimitiveSpec['category']];
    if (categoryNote) parts.push('', `**Applies to every ${category} helper:** ${categoryNote}`);
    for (const p of list) {
      parts.push('', `### ${p.name}`, '', '```typescript', p.signature, '```', '');
      parts.push(`Returns: ${p.returns}`, '', p.description);
      if (p.promptNotes) parts.push('', `**Note:** ${p.promptNotes}`);
      parts.push('', '```javascript', p.example, '```');
    }
  }

  parts.push('');
  return parts.join('\n');
}

/**
 * Render the compact quick-reference block for SKILL.md (spliced between the
 * BEGIN/END GENERATED PRIMITIVES markers): per-category signature lists only,
 * pointing at references/primitives.md for detail.
 */
export function renderSkillQuickReference(primitives: PrimitiveSpec[]): string {
  const byCategory = new Map<string, PrimitiveSpec[]>();
  for (const p of primitives) {
    const list = byCategory.get(p.category) ?? [];
    list.push(p);
    byCategory.set(p.category, list);
  }

  const lines: string[] = [
    `All ${primitives.length} sandbox primitives, grouped (full signatures, descriptions, and examples in \`references/primitives.md\`):`,
    '',
    '```typescript',
  ];
  for (const [category, header] of CATEGORY_HEADERS) {
    const list = byCategory.get(category);
    if (!list || list.length === 0) continue;
    lines.push(header);
    const categoryNote = CATEGORY_NOTES[category];
    if (categoryNote) lines.push(...wrapComment(`NOTE: ${categoryNote}`, ''));
    for (const p of list) {
      lines.push(p.signature);
      if (p.promptNotes) lines.push(...wrapComment(`NOTE: ${p.promptNotes}`, '  '));
    }
    lines.push('');
  }
  while (lines[lines.length - 1] === '') lines.pop();
  lines.push('```');
  return lines.join('\n');
}
