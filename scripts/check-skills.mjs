#!/usr/bin/env node
/**
 * Two checks that nothing else performs.
 *
 * First, the skill files are a published format now, not a local convention:
 * Agent Skills became an open standard whose `name` and `description` rules are
 * load-bearing for every harness that reads them. A violation is silent -- the
 * harness simply skips the skill -- so the constraints are asserted here.
 *
 * Second, `skills/` is the maintained copy, but a bare clone registers nothing
 * from it: Claude Code scans only `.claude/skills/`, while codex, opencode,
 * hermes and agy scan `.agents/skills/`. Those copies exist so a fresh clone has
 * a working loadout, and copies drift. Symlinks would avoid the duplication but
 * need developer mode or an administrator on Windows, so the files are real and
 * this check is what keeps them honest.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('..', import.meta.url));
const CANONICAL = 'skills';
/** Skills that must also be registered at the repository root, and where. */
const REGISTERED = ['kiln-setup-workspace'];
const REGISTRIES = ['.claude/skills', '.agents/skills'];
const SPEC_KEYS = new Set([
  'name',
  'description',
  'license',
  'compatibility',
  'metadata',
  'allowed-tools',
]);

const errors = [];

/** Files under `dir`, relative to it, sorted, recursing into subdirectories. */
async function tree(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await tree(full)).map((p) => join(entry.name, p)));
    else out.push(entry.name);
  }
  return out.sort();
}

function frontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/u.exec(text);
  if (!match) return null;
  const fields = new Map();
  for (const line of match[1].split(/\r?\n/u)) {
    const kv = /^([A-Za-z-]+):\s*(.*)$/u.exec(line);
    if (kv) fields.set(kv[1], kv[2]);
  }
  return fields;
}

/** The specification's own constraints, applied to one skill directory. */
async function validate(label, dir, name) {
  const file = join(dir, 'SKILL.md');
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch {
    errors.push(`${label}: missing SKILL.md`);
    return;
  }
  const fields = frontmatter(text);
  if (!fields) {
    errors.push(`${label}: SKILL.md has no YAML frontmatter`);
    return;
  }
  const declared = fields.get('name');
  const description = fields.get('description');
  if (declared !== name) {
    errors.push(
      `${label}: name is ${declared ?? '(absent)'} but must match the directory, ${name}`,
    );
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/u.test(name) || name.length > 64) {
    errors.push(`${label}: name must be 1-64 lowercase alphanumerics with single hyphens`);
  }
  if (!description) errors.push(`${label}: description is required`);
  else if (description.length > 1024) {
    errors.push(`${label}: description is ${description.length} characters, over the 1024 maximum`);
  }
  for (const key of fields.keys()) {
    if (!SPEC_KEYS.has(key))
      errors.push(`${label}: ${key} is not an Agent Skills frontmatter field`);
  }
  const lines = text.split(/\r?\n/u).length;
  if (lines > 500) errors.push(`${label}: SKILL.md is ${lines} lines, over the recommended 500`);
}

const canonicalDir = join(repo, CANONICAL);
const names = (await readdir(canonicalDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (names.length === 0) errors.push(`${CANONICAL}/ contains no skills`);
for (const name of names) await validate(`${CANONICAL}/${name}`, join(canonicalDir, name), name);

for (const registry of REGISTRIES) {
  const dir = join(repo, registry);
  try {
    await stat(dir);
  } catch {
    errors.push(`${registry}/ is missing; a bare clone would register no skills there`);
    continue;
  }
  const present = (await readdir(dir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const expected = [...REGISTERED].sort();
  if (present.join(',') !== expected.join(',')) {
    errors.push(
      `${registry}/ holds [${present.join(', ')}] but must hold exactly [${expected.join(', ')}]`,
    );
  }
  for (const name of expected) {
    if (!present.includes(name)) continue;
    await validate(`${registry}/${name}`, join(dir, name), name);
    const from = join(canonicalDir, name);
    const to = join(dir, name);
    const [a, b] = await Promise.all([tree(from), tree(to)]);
    if (a.join('\n') !== b.join('\n')) {
      errors.push(`${registry}/${name} has a different file list than ${CANONICAL}/${name}`);
      continue;
    }
    for (const file of a) {
      const [left, right] = await Promise.all([
        readFile(join(from, file)),
        readFile(join(to, file)),
      ]);
      if (!left.equals(right)) {
        errors.push(
          `${relative(repo, join(to, file))} differs from ${relative(repo, join(from, file))}; copy the maintained file over it`,
        );
      }
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const mirrored = REGISTERED.length * REGISTRIES.length;
console.log(
  `Skills: ${names.length} conform to the Agent Skills specification; ${mirrored} registered copies are byte-identical.`,
);
