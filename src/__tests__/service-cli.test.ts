/**
 * `kiln service status | stop | prune` against real processes on a private port.
 *
 * The host acts on a stale orphan by itself; these commands are for the service
 * it will not touch -- started by hand or owned by a session that is still
 * running -- and for seeing the facts it acts on. So the tests spawn the fake
 * service as a process, give it an owner or none, and check both what is
 * printed and whether the process is still there afterwards.
 */
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { ChildProcess } from 'node:child_process';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'bun:test';

import { serviceMain } from '../service-cli';
import { renderServiceSourceFingerprint } from '../render-service-host';
import {
  deadPid,
  exited,
  freePort,
  removeDirectory,
  spawnFakeRenderService,
  writeFakeRenderService,
} from './helpers/fake-render-service';

const children: ChildProcess[] = [];
const servers: Server[] = [];
const directories: string[] = [];
const saved = {
  port: process.env['KILN_RENDER_SERVICE_PORT'],
  dir: process.env['KILN_RENDER_SERVICE_DIR'],
};

afterEach(async () => {
  await Promise.all(
    children.splice(0).map(async (child) => {
      if (child.exitCode === null && child.signalCode === null) child.kill();
      await exited(child);
    }),
  );
  await Promise.all(
    servers.splice(0).map((s) => new Promise<void>((done) => s.close(() => done()))),
  );
  await Promise.all(directories.splice(0).map((d) => removeDirectory(d)));
  for (const [key, value] of [
    ['KILN_RENDER_SERVICE_PORT', saved.port],
    ['KILN_RENDER_SERVICE_DIR', saved.dir],
  ] as const) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

async function installation(): Promise<{ dir: string; port: number }> {
  const base = resolve(import.meta.dir, '../../tmp');
  await mkdir(base, { recursive: true });
  const dir = await writeFakeRenderService(await mkdtemp(join(base, 'service-cli-')));
  directories.push(dir);
  const port = await freePort();
  process.env['KILN_RENDER_SERVICE_PORT'] = String(port);
  process.env['KILN_RENDER_SERVICE_DIR'] = dir;
  return { dir, port };
}

async function run(argv: string[]): Promise<{ code: number; out: string; err: string }> {
  const out: string[] = [];
  const err: string[] = [];
  const code = await serviceMain(argv, {
    log: (line) => out.push(line),
    error: (line) => err.push(line),
  });
  return { code, out: out.join('\n'), err: err.join('\n') };
}

async function alive(port: number): Promise<boolean> {
  try {
    return (await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(1_000) }))
      .ok;
  } catch {
    return false;
  }
}

describe('kiln service', () => {
  it('prints usage without a command and refuses one it does not know', async () => {
    expect((await run([])).code).toBe(2);
    expect((await run([])).out).toContain('kiln service status');
    const unknown = await run(['restart']);
    expect(unknown.code).toBe(2);
    expect(unknown.err).toContain('unknown service command');
  });

  it('status says nothing is listening, and where it looked', async () => {
    const { port } = await installation();
    const { code, out } = await run(['status']);
    expect(code).toBe(0);
    expect(out).toContain(`http://127.0.0.1:${port}`);
    expect(out).toContain('listening        no');
    expect(out).toContain('installation     ready');
  });

  it('status names the process, its owner and whether its source is current', async () => {
    const { dir, port } = await installation();
    const child = await spawnFakeRenderService(dir, port, {
      FAKE_SOURCE_FINGERPRINT: renderServiceSourceFingerprint(dir)!,
    });
    children.push(child);
    const { out } = await run(['status']);
    expect(out).toContain('listening        yes  fake-renderer');
    expect(out).toContain(`pid ${child.pid}, started by hand`);
    expect(out).toContain('source           current');
  }, 30_000);

  it('prune keeps a current service and a stale one somebody still owns; stop stops either', async () => {
    const { dir, port } = await installation();
    const current = await spawnFakeRenderService(dir, port, {
      FAKE_SOURCE_FINGERPRINT: renderServiceSourceFingerprint(dir)!,
    });
    children.push(current);
    const kept = await run(['prune']);
    expect(kept.code).toBe(0);
    expect(kept.out).toContain('kept');
    expect(await alive(port)).toBe(true);

    const stopped = await run(['stop']);
    expect(stopped.code).toBe(0);
    expect(stopped.out).toContain(`pid ${current.pid}`);
    expect(await alive(port)).toBe(false);

    const owned = await spawnFakeRenderService(dir, port, {
      RENDER_SERVICE_OWNER_PID: String(process.pid),
      FAKE_SOURCE_FINGERPRINT: `sha256:${'0'.repeat(64)}`,
    });
    children.push(owned);
    const keptOwned = await run(['prune']);
    expect(keptOwned.code).toBe(0);
    expect(keptOwned.out).toContain('kept');
    expect(keptOwned.out).toContain(`session ${process.pid}, which is still running`);
    expect(await alive(port)).toBe(true);
  }, 30_000);

  it('prune stops a stale orphan and says what it was', async () => {
    const { dir, port } = await installation();
    const orphan = await spawnFakeRenderService(dir, port, {
      RENDER_SERVICE_OWNER_PID: String(deadPid()),
      FAKE_SOURCE_FINGERPRINT: `sha256:${'0'.repeat(64)}`,
    });
    children.push(orphan);
    const { code, out } = await run(['prune']);
    expect(code).toBe(0);
    expect(out).toContain('stopped');
    expect(out).toContain('which has exited');
    expect(await alive(port)).toBe(false);
  }, 30_000);

  it('refuses to stop something that is not a render service', async () => {
    await installation();
    const server = createServer((_req, res) => {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end('<html>');
    });
    servers.push(server);
    await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
    const port = (server.address() as AddressInfo).port;
    process.env['KILN_RENDER_SERVICE_PORT'] = String(port);
    const { code, err } = await run(['stop']);
    expect(code).toBe(1);
    expect(err).toContain('not a render service');
    expect(err).toContain('KILN_RENDER_SERVICE_PORT');
    expect(server.listening).toBe(true);
  });
});
