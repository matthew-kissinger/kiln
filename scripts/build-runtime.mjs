#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sha = (value) => createHash('sha256').update(value).digest('hex');
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function sources(directory, prefix = '') {
  const entries = [];
  for (const item of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
    if (item.name === '__tests__' || item.name.endsWith('.test.ts')) continue;
    const name = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.isDirectory()) entries.push(...await sources(join(directory, item.name), name));
    else if (/\.(?:ts|mjs)$/.test(item.name)) entries.push([name, sha(await readFile(join(directory, item.name)))]);
  }
  return entries;
}

export async function runtimeBuildIdentity(root) {
  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const inputs = {
    engineVersion: pkg.version,
    toolchain: pkg.packageManager,
    sourceHash: sha(JSON.stringify(await sources(join(root, 'src')))),
    dependencyHash: sha(await readFile(join(root, 'bun.lock'))),
    dependencies: pkg.dependencies ?? {},
    target: 'node',
  };
  return { identity: `sha256:${sha(JSON.stringify(inputs))}`, ...inputs };
}

export async function buildRuntime(target, root = repo) {
  const entries = { cli: 'src/cli.ts', mcp: 'src/mcp-server.ts', worker: 'src/evaluator/worker.ts', 'agent-run': 'src/agent/run.ts', 'agent-providers': 'src/agent/providers.ts' };
  const outputs = { cli: 'cli.mjs', mcp: 'mcp-server.mjs', worker: 'evaluator-worker.mjs', 'agent-run': 'agent-run.mjs', 'agent-providers': 'agent-providers.mjs' };
  if (!entries[target]) throw new Error('Choose cli, mcp, or worker.');
  const before = await runtimeBuildIdentity(root);
  const built = spawnSync('bun', ['build', entries[target], '--target=node', '--packages=external', `--outfile=dist/${outputs[target]}`], { cwd: root, stdio: 'inherit', windowsHide: true });
  if (built.status !== 0) throw new Error(`Building ${target} failed.`);
  const after = await runtimeBuildIdentity(root);
  if (before.identity !== after.identity) throw new Error('Runtime source changed during build. Rebuild from a stable tree.');
  const path = join(root, 'dist/build.json');
  let previous = { schemaVersion: 1, entries: {} };
  try { previous = JSON.parse(await readFile(path, 'utf8')); } catch {}
  if (previous.schemaVersion !== 1) previous = { schemaVersion: 1, entries: {} };
  const entry = { ...after, file: outputs[target], bundleHash: `sha256:${sha(await readFile(join(root, 'dist', outputs[target])))}` };
  previous.entries[target] = entry;
  await mkdir(join(root, 'dist'), { recursive: true });
  await writeFile(path, JSON.stringify(previous, null, 2) + '\n');
  return entry;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const targets = process.argv[2] === 'all' ? ['worker', 'agent-run', 'agent-providers', 'mcp', 'cli'] : [process.argv[2]];
    for (const target of targets) {
      const entry = await buildRuntime(target);
      console.log(`${entry.file} ${entry.bundleHash} (${entry.identity})`);
    }
  }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
