#!/usr/bin/env node
// Container-only bootstrap: pin npm in a disposable local prefix, never globally.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
try {
  await exec(process.execPath, ['/usr/local/lib/node_modules/npm/bin/npm-cli.js', 'install', '--prefix', '/tmp/kiln-npm', 'npm@12.0.1', '--ignore-scripts', '--no-audit', '--no-fund'], { timeout:120000, maxBuffer:1024*1024 });
  const result = await exec(process.execPath, ['/checks/smoke-package.mjs', '--tarball', '/input/candidate.tgz'], {
    timeout:480000, maxBuffer:2*1024*1024,
    env:{...process.env,npm_execpath:'/tmp/kiln-npm/node_modules/npm/bin/npm-cli.js'},
  });
  process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
} catch (error) {
  if(error.stdout) process.stdout.write(error.stdout);
  if(error.stderr) process.stderr.write(error.stderr);
  else process.stderr.write(String(error));
  process.exitCode=1;
}
