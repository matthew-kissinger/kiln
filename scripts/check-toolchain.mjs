import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const filesOnly = process.argv.includes('--files-only');
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const workflow = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');

const expectedPackageManager = 'bun@1.4.2';
const expectedEngines = { bun: '1.4.2', node: '22.23.2', npm: '12.0.2' };
const errors = [];

if (packageJson.packageManager !== expectedPackageManager) {
  errors.push(`packageManager must be ${expectedPackageManager}`);
}
if (packageJson.engines?.bun !== expectedEngines.bun) {
  errors.push(`engines.bun must be ${expectedEngines.bun}`);
}
if (packageJson.engines?.node !== expectedEngines.node) {
  errors.push(`engines.node must be ${expectedEngines.node}`);
}
if (packageJson.engines?.npm !== expectedEngines.npm) {
  errors.push(`engines.npm must be ${expectedEngines.npm}`);
}
if (!/^\s*bun-version:\s*1\.4\.2\s*$/mu.test(workflow)) {
  errors.push('CI bun-version must be 1.4.2');
}
if (!/^\s*node-version:\s*22\.23\.2\s*$/mu.test(workflow)) {
  errors.push('CI node-version must be 22.23.2');
}
if (!workflow.includes('npm install --global npm@12.0.2')) {
  errors.push('CI npm version must be 12.0.2');
}
if (!workflow.includes('run: bun run check:toolchain')) {
  errors.push('CI must run the toolchain metadata check');
}
for (const ref of workflow.matchAll(/uses:\s*([^\s#]+)/g)) {
  if (!ref[1].startsWith('./') && !/@[0-9a-f]{40}$/i.test(ref[1])) errors.push(`CI Action ref must use an immutable commit SHA: ${ref[1]}`);
}
if (!filesOnly && process.versions.bun !== expectedEngines.bun) {
  errors.push(`runtime Bun must be ${expectedEngines.bun} (found ${process.versions.bun ?? 'Node'})`);
}
if (!filesOnly) {
  const revision = spawnSync('bun', ['--revision'], { encoding: 'utf8', shell: false });
  const value = String(revision.stdout || revision.stderr || '').trim();
  if (revision.status !== 0 || !/^1\.4\.2\+[0-9a-f]+$/i.test(value)) {
    errors.push(`runtime Bun must be stable 1.4.2 (found ${value || 'missing'})`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Toolchain metadata: Bun ${expectedEngines.bun}, Node ${expectedEngines.node}, npm ${expectedEngines.npm}`);
