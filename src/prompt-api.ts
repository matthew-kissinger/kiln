/**
 * Catalog text formatters for integrations that explicitly need a full reference.
 *
 * `discovery/helper-specs.ts` is the single source of truth for what the sandbox
 * exposes. These pure formatters do not write skill files or configure an agent.
 * The native harness uses its compact bootstrap and lazy Discovery; maintained
 * skills live in skills/. No full reference is injected into the native prompt.
 */

import type { HelperSpec } from './discovery/helper-specs';

/** Display order + comment header for each catalog category in the prompt. */
const CATEGORY_HEADERS: Array<[HelperSpec['category'], string]> = [
  ['structure', '// Scene & structure (globals — no imports needed)'],
  ['geometry', '// Geometry (returns BufferGeometry)'],
  ['material', '// Materials'],
  ['instancing', '// Instancing (share geometry+material; smaller GLBs)'],
  ['arrays', '// Arrays (replicate a source part)'],
  ['csg', '// CSG / Boolean (async — using any of these requires `async function build()`)'],
  ['mesh-ops', '// Mesh ops'],
  ['curves', '// Curves'],
  ['uv', '// UV unwrapping'],
  ['textures', '// Textures (approved resource loading is async)'],
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
const CATEGORY_NOTES: Partial<Record<HelperSpec['category'], string>> = {
  csg:
    'For textured or multi-material booleans, pass { preserveAttributes: true } as the final options argument. ' +
    'This preserves UV0 and source materials through actual operand runs; exposed cut faces inherit the cutter material and UVs. ' +
    'Legacy calls omit that option and discard UVs, so unwrap their result afterward: `mesh.geometry = await autoUnwrap(mesh.geometry)`. ' +
    'Tangents are regenerated when needed. Empty operands/results fail with a named cause. Convex hull faces are newly generated and have no original-face provenance. ' +
    'Use static meshes: bake instances and poses first. Colors, secondary UVs, custom attributes and morph targets do not survive CSG; inspect the reported losses. ' +
    'Keep the returned mesh transform: its position is the first contributing mesh world origin, with world-aligned geometry local to that origin. All operands use one shared computation frame; geometry alone does not include world translation.',
};

const WRAP = 96;

/** Wrap text into `// `-prefixed comment lines at ~WRAP columns. */
function wrapComment(text: string, indent: string): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if (line && `${indent}// ${line} ${w}`.length > WRAP) {
      lines.push(`${indent}// ${line}`);
      line = w;
    } else {
      line = line ? `${line} ${w}` : w;
    }
  }
  if (line) lines.push(`${indent}// ${line}`);
  return lines;
}

function renderPrimitiveLines(p: HelperSpec, includeExamples = false): string[] {
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
    // Optionally fold the per-primitive example into the reference. Collapse internal newlines
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
 * `includeExamples` (default false) appends each primitive's collapsed example.
 * This is a text formatter, not an alternative tool surface.
 */
export function renderApiSection(
  primitives: HelperSpec[],
  opts: { includeExamples?: boolean } = {},
): string {
  const includeExamples = opts.includeExamples ?? false;
  const byCategory = new Map<string, HelperSpec[]>();
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
    if (known.has(category as HelperSpec['category'])) continue;
    const lines = [`// ${category}`];
    for (const p of list) lines.push(...renderPrimitiveLines(p, includeExamples));
    blocks.push(lines.join('\n'));
  }

  return blocks.join('\n\n');
}

/**
 * Render a full markdown primitives reference. One section per category, one subsection per
 * primitive with signature, returns, description, notes, and example.
 */
export function renderPrimitivesMarkdown(primitives: HelperSpec[]): string {
  const byCategory = new Map<string, HelperSpec[]>();
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
    '<!-- Source: src/discovery/helper-specs.ts; formatter: renderPrimitivesMarkdown -->',
    '',
    `Every helper the Kiln sandbox exposes to generated code (${primitives.length} primitives). No imports needed — all are globals inside build()/animate().`,
  ];

  const order = [...CATEGORY_HEADERS.map(([c]) => c)];
  for (const [category] of byCategory) {
    if (!order.includes(category as HelperSpec['category'])) {
      order.push(category as HelperSpec['category']);
    }
  }

  for (const category of order) {
    const list = byCategory.get(category);
    if (!list || list.length === 0) continue;
    parts.push('', `## ${titles[category] ?? category}`);
    const categoryNote = CATEGORY_NOTES[category as HelperSpec['category']];
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
export function renderSkillQuickReference(primitives: HelperSpec[]): string {
  const byCategory = new Map<string, HelperSpec[]>();
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
