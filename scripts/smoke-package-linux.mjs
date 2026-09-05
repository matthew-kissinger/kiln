#!/usr/bin/env node
// Run the distribution checklist against an existing tarball in a fresh Linux container.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const image = 'node:22.23.1-bookworm-slim@sha256:6c74791e557ce11fc957704f6d4fe134a7bc8d6f5ca4403205b2966bd488f6b3';
const [tarballArg, receiptArg, ...extra] = process.argv.slice(2);
assert(tarballArg && receiptArg && extra.length === 0, 'Usage: node scripts/smoke-package-linux.mjs <package.tgz> <receipt.json>');
const tarball = resolve(tarballArg), output = resolve(receiptArg);
assert((await stat(tarball)).isFile(), 'Tarball must be a file.');
const scripts = dirname(fileURLToPath(import.meta.url));
const name = `kiln-package-smoke-${randomUUID()}`;
const args = ['run', '--rm', '--name', name, '--memory', '2g', '--cpus', '2',
  '--mount', `type=bind,source=${tarball},target=/input/candidate.tgz,readonly`,
  '--mount', `type=bind,source=${scripts},target=/checks,readonly`,
  image, 'node', '/checks/smoke-package-linux-bootstrap.mjs'];
const child = spawn('docker', args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
let stdout = '', stderr = '';
child.stdout.on('data', data => { stdout += data; });
child.stderr.on('data', data => { stderr = (stderr + data).slice(-16000); });
let timedOut = false;
const timer = setTimeout(() => {
  timedOut = true;
  spawn('docker', ['rm', '--force', name], { windowsHide: true, stdio: 'ignore' });
}, 600000);
try {
  const code = await new Promise((done, fail) => { child.on('error', fail); child.on('exit', done); });
  const tarballSha256 = createHash('sha256').update(await readFile(tarball)).digest('hex');
  let smoke;
  try { smoke = JSON.parse(stdout); } catch { smoke = {status:'failed', error:stderr || stdout || 'No smoke receipt'}; }
  let validationError;
  try {
    assert.equal(code,0,stderr);
    assert.equal(timedOut,false);
    assert.equal(smoke.status,'passed');
    assert.equal(smoke.platform,'linux');
    assert.equal(smoke.node,'v22.23.1');
    assert.equal(smoke.npm,'12.0.1');
    assert.equal(smoke.tarballSha256,tarballSha256);
  } catch (error) { validationError = error; }
  const receipt = { status:validationError?'failed':'passed', image, tarball, tarballSha256,
    containerMemoryBytes:2147483648, containerCpus:2, timedOut, exitCode:code, smoke,
    ...(validationError ? {error:validationError.message} : {}) };
  await writeFile(output, JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify(receipt,null,2));
  if(validationError) throw validationError;
} finally { clearTimeout(timer); }
