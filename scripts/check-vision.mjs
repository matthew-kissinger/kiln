#!/usr/bin/env node
// Refuse to dispatch a model that cannot see.
//
// Kiln's loop is the model rendering its own program and looking at the result,
// so a model without image input is not doing the thing this repository claims
// its assets demonstrate. It will still produce a file -- it just produces it
// blind, from the API docs alone, and the attribution header promote-asset.mjs
// writes ("looked at its own six-view contact sheet") would be a lie.
//
// This came out of a nine-model batch in which four of the nine turned out to
// be text-only. Nothing failed loudly; they simply built worse assets for
// reasons that looked like model quality and were actually a missing modality.
//
//   node scripts/check-vision.mjs opencode-go/kimi-k3 opencode-go/glm-5.3
//
// Exits non-zero and names the offenders. OpenCode answers from a local cache,
// so the whole check costs about two seconds however many models you pass.
import { spawnSync } from 'node:child_process';

/** Pull top-level JSON objects out of `opencode models --verbose` output. */
function jsonBlocks(text) {
  const out = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth === 0 && start >= 0) {
        try {
          out.push(JSON.parse(text.slice(start, i + 1)));
        } catch {
          // A model whose metadata does not parse is not this script's problem.
        }
        start = -1;
      }
    }
  }
  return out;
}

function capabilities(provider) {
  const r = spawnSync('opencode', ['models', provider, '--verbose'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  const map = new Map();
  for (const o of jsonBlocks(r.stdout ?? '')) {
    if (o.id) map.set(o.id, o.capabilities ?? {});
  }
  return map;
}

const models = process.argv.slice(2);
if (!models.length) {
  console.error('usage: check-vision.mjs <provider/model> [<provider/model> ...]');
  process.exit(2);
}

const byProvider = new Map();
for (const m of models) {
  const slash = m.indexOf('/');
  const provider = slash > 0 ? m.slice(0, slash) : 'opencode';
  const id = slash > 0 ? m.slice(slash + 1) : m;
  if (!byProvider.has(provider)) byProvider.set(provider, capabilities(provider));
}

const blind = [];
const unknown = [];
for (const m of models) {
  const slash = m.indexOf('/');
  const provider = slash > 0 ? m.slice(0, slash) : 'opencode';
  const id = slash > 0 ? m.slice(slash + 1) : m;
  const caps = byProvider.get(provider)?.get(id);
  if (!caps) unknown.push(m);
  else if (caps.attachment !== true) blind.push(m);
  const state = !caps ? 'not listed by this provider' : caps.attachment === true ? 'sees images' : 'TEXT ONLY';
  console.log(`  ${m.padEnd(44)} ${state}`);
}

if (blind.length || unknown.length) {
  console.error('');
  if (blind.length) console.error(`refusing to dispatch ${blind.length} text-only model(s): ${blind.join(', ')}`);
  if (unknown.length) console.error(`could not verify: ${unknown.join(', ')}`);
  process.exit(1);
}
console.log(`all ${models.length} models accept image input`);
