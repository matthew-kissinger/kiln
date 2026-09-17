/**
 * Setup tells a developer when the GPU render service shipped but was never
 * installed. A fresh clone carries `render-service/src` and no `node_modules`,
 * and without the notice the first authoring session silently gets CPU views
 * and can never confirm a material.
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { afterEach, expect, it } from 'bun:test';

const script = pathToFileURL(resolve(import.meta.dir, '../../scripts/create-workspace.mjs')).href;
const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

async function installation(layout: 'none' | 'source-only' | 'installed'): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'kiln-rs-notice-'));
  roots.push(root);
  if (layout === 'none') return root;
  await mkdir(join(root, 'render-service/src'), { recursive: true });
  await writeFile(join(root, 'render-service/src/server.mjs'), '');
  await writeFile(join(root, 'render-service/package.json'), '{}');
  if (layout === 'installed') {
    await mkdir(join(root, 'render-service/node_modules/webgpu'), { recursive: true });
    await mkdir(join(root, 'render-service/node_modules/three'), { recursive: true });
  }
  return root;
}

it('names the uninstalled render service and the command that installs it', async () => {
  const { renderServiceNotice } = await import(script);
  const runtime = await installation('source-only');
  const notice = renderServiceNotice(runtime) as string | undefined;
  expect(notice).toBeDefined();
  expect(notice).toContain('not installed');
  expect(notice).toContain('npm install');
  expect(notice).toContain(join(runtime, 'render-service'));
  expect(notice).toContain('CPU');
});

it('says nothing when the service is installed or was never shipped', async () => {
  const { renderServiceNotice } = await import(script);
  expect(renderServiceNotice(await installation('installed'))).toBeUndefined();
  expect(renderServiceNotice(await installation('none'))).toBeUndefined();
});
