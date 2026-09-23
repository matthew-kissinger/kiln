// Current nested renderer install, staged unchanged outside the checkout.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const [npmCli, output] = process.argv.slice(2);
const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const work = mkdtempSync(join(tmpdir(), 'kiln-renderer-baseline-'));
for (const file of ['src', 'package.json', 'package-lock.json'])
  cpSync(join(repo, 'render-service', file), join(work, file), { recursive: true });
const began = performance.now();
const install = spawnSync(
  process.execPath,
  [npmCli, 'ci', '--cache', join(work, 'npm-cache'), '--no-audit', '--no-fund'],
  { cwd: work, windowsHide: true, encoding: 'utf8', timeout: 180_000 },
);
const installMs = performance.now() - began;
const probe = spawnSync(
  process.execPath,
  [
    join(here, 'probe-renderer.mjs'),
    work,
    join(repo, 'render-service/test/fixtures/material-channels-v1.glb'),
  ],
  { cwd: work, windowsHide: true, encoding: 'utf8', timeout: 60_000 },
);
const size = (path) =>
  statSync(path).isDirectory()
    ? readdirSync(path).reduce((sum, name) => sum + size(join(path, name)), 0)
    : statSync(path).size;
const receipt = {
  work,
  node: process.version,
  installMs,
  installStatus: install.status,
  installStdout: install.stdout,
  installStderr: install.stderr,
  nodeModulesBytes: size(join(work, 'node_modules')),
  renderStatus: probe.status,
  renderStdout: probe.stdout,
  renderStderr: probe.stderr,
};
writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(
  JSON.stringify({
    receipt: output,
    installStatus: install.status,
    renderStatus: probe.status,
    installMs,
  }),
);
