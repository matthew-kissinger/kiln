#!/usr/bin/env node
// Promote a dispatched asset from `.dogfood/` into `examples/`.
//
// Curation is a judgement call made by looking at the render, and nothing here
// tries to automate that part. What it does automate is everything that has to
// be true once the judgement is made, because each of these was got wrong by
// hand at least once: the program is copied, the authoring model is recorded in
// the file itself, and the triangle count the README will quote comes from
// re-running the program rather than from whatever the dispatch log said.
//
//   node scripts/promote-asset.mjs radio-telescope
//   node scripts/promote-asset.mjs --all-listed
//
// The provenance claim is written from the asset's own `.result.json`, and the
// clean-room sentence is only added when that manifest says the run had one.
// Assets authored before sandboxing existed are attributed without it; the
// alternative is a header making a claim about isolation that was not true.
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOGFOOD = join(REPO, '.dogfood');
const EXAMPLES = join(REPO, 'examples');

function manifestFor(name) {
  const p = join(DOGFOOD, `${name}.result.json`);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function stamp(file, { model, harness, cleanRoom, interrupted }) {
  let body = readFileSync(file, 'utf8');
  if (body.charCodeAt(0) === 0xfeff) body = body.slice(1);
  if (/^\/\/ Authored by:/m.test(body)) return false;
  const header = [
    `// Authored by: ${model}, via ${harness}.`,
    '//',
    ...(interrupted
      ? [
          '// Written by the model itself through the Kiln MCP tools, and cut off',
          '// mid-run rather than finished -- by a provider limit, or by the',
          '// dispatch deadline. The program below is what was on disk when the',
          '// session ended; how many times it had looked at its own contact sheet',
          '// by then is not recorded, so this one does not make the claim the',
          '// others do.',
        ]
      : [
          '// Written by the model itself through the Kiln MCP tools: it wrote the',
          '// program, rendered it, looked at its own six-view contact sheet, and',
          '// revised. Not a line of it is hand-authored.',
        ]),
    ...(cleanRoom
      ? [
          '//',
          '// Dispatched into a clean directory containing only the brief and the Kiln',
          '// skills, with no access to this repository or to any finished example.',
        ]
      : []),
    '',
  ].join('\n');
  writeFileSync(file, `${header}\n${body}`);
  return true;
}

function promote(name) {
  const src = join(DOGFOOD, `${name}.kiln.js`);
  if (!existsSync(src)) return { name, ok: false, why: 'no program in .dogfood' };

  const manifest = manifestFor(name);
  if (!manifest?.model) return { name, ok: false, why: 'no model attribution in .result.json' };

  const dest = join(EXAMPLES, `${name}.kiln.js`);
  copyFileSync(src, dest);
  // `cleanRoom` is absent on manifests written before sandboxing, and absent
  // means "not known to have had one", which is the honest reading.
  stamp(dest, {
    model: manifest.model,
    harness: manifest.harness ?? 'unknown harness',
    cleanRoom: manifest.cleanRoom === true,
    interrupted: manifest.interrupted === true,
  });

  // Re-run the program to get the number the README will quote. The dispatch
  // log's count came off a different copy of the file, before this header.
  const glb = join(DOGFOOD, `${name}.promote.glb`);
  const r = spawnSync('bun', ['src/cli.ts', 'render', dest, '--out', glb, '--render', 'cpu'], {
    cwd: REPO,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  const tris = /(\d+) tris/.exec(out)?.[1];
  if (r.status !== 0 || !tris) return { name, ok: false, why: `render failed: ${out.trim().slice(-200)}` };

  return {
    name,
    ok: true,
    model: manifest.model,
    cleanRoom: manifest.cleanRoom === true,
    tris: Number(tris),
    bounds: /bounds\s+(.+)/.exec(out)?.[1]?.trim() ?? null,
  };
}

const names = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!names.length) {
  console.error('usage: promote-asset.mjs <name> [<name> ...]');
  process.exit(2);
}

const rows = names.map(promote);
for (const r of rows) {
  if (!r.ok) {
    console.error(`SKIP ${r.name}: ${r.why}`);
    continue;
  }
  const room = r.cleanRoom ? 'clean room' : 'repo-visible run';
  console.log(`${r.name.padEnd(18)} ${String(r.tris).padStart(6)} tris  ${r.model}  (${room})`);
}
process.exit(rows.every((r) => r.ok) ? 0 : 1);
