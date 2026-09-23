/** Workspace setup resolves the installed renderer graph without loading native code. */
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { afterEach, expect, it } from 'bun:test';
import { RENDER_SERVICE_DEPENDENCIES } from '../../render-service/src/build-identity.mjs';

const script = pathToFileURL(resolve(import.meta.dir, '../../scripts/create-workspace.mjs')).href;
const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

async function installation(shipped = true): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'kiln-rs-notice-'));
  roots.push(root);
  if (!shipped) return root;
  await mkdir(join(root, 'render-service/src'), { recursive: true });
  await writeFile(join(root, 'render-service/src/server.mjs'), '');
  await writeFile(join(root, 'render-service/package.json'), '{}');
  return root;
}

async function packages(root: string, webgpuVersion: string = RENDER_SERVICE_DEPENDENCIES.webgpu) {
  for (const [name, version] of Object.entries(RENDER_SERVICE_DEPENDENCIES)) {
    const dir = join(root, 'node_modules', name);
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, 'package.json'),
      JSON.stringify({
        name,
        version: name === 'webgpu' ? webgpuVersion : version,
        main: 'index.js',
      }),
    );
    await writeFile(
      join(dir, 'index.js'),
      'throw new Error("Native code must not load during setup")',
    );
  }
}

function notice(runtime: string): string | null {
  // The shipped command executes in Node; a fresh process also avoids resolver caches.
  const result = spawnSync(
    'node',
    [
      '--input-type=module',
      '-e',
      'const {renderServiceNotice}=await import(process.argv[1]);console.log(JSON.stringify(await renderServiceNotice(process.argv[2]) ?? null))',
      script,
      runtime,
    ],
    { encoding: 'utf8', windowsHide: true, timeout: 5000 },
  );
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout);
}

it('gives package-level optional dependency guidance when renderer dependencies are missing', async () => {
  const runtime = await installation();
  const message = notice(runtime);
  expect(message).toContain('optional dependencies');
  expect(message).toContain(runtime);
  expect(message).toContain('CPU');
  expect(message).not.toContain('Run `npm install` in that directory');
});

it('accepts hoisted dependencies in the official package without loading native code', async () => {
  const runtime = await installation();
  await packages(runtime);
  expect(notice(runtime)).toBeNull();
});

it('checks the actual nested dependency version when it shadows a compatible root install', async () => {
  const runtime = await installation();
  await packages(runtime);
  await packages(join(runtime, 'render-service'), '0.4.0');
  expect(notice(runtime)).toContain('version conflict');
  expect(notice(runtime)).toContain('0.4.0');
});

it('does not treat empty dependency directories as a working installation', async () => {
  const runtime = await installation();
  for (const name of Object.keys(RENDER_SERVICE_DEPENDENCIES))
    await mkdir(join(runtime, 'render-service/node_modules', name), { recursive: true });
  expect(notice(runtime)).toContain('not installed');
});

it('accepts a compatible nested install and stays quiet when renderer source is not shipped', async () => {
  const runtime = await installation();
  await packages(join(runtime, 'render-service'));
  expect(notice(runtime)).toBeNull();
  expect(notice(await installation(false))).toBeNull();
});
