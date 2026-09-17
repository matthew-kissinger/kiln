/**
 * Finding, joining, replacing and leaving alone the render service on the
 * shared port.
 *
 * Before this, the host asked one question of whatever was listening on port
 * 8000 -- "does /health say ok" -- and joined it. That was the last way a
 * developer could reach a confusing state instead of a clean fallback: a
 * service orphaned by a hard-killed session kept running yesterday's source
 * after a pull, every session joined it, and the engine's new request field
 * came back as a 400 that the sheet reported as a CPU degrade. Nothing was
 * broken, and nothing said what was wrong.
 *
 * The socket is now the registry. `/health` names the process, the session
 * that started it and a fingerprint of the source it runs, and the host acts on
 * that in exactly one way per case:
 *
 *   current                    -> join, whoever started it
 *   stale and orphaned         -> replace it
 *   stale and still owned      -> leave it, say who owns it and how to clear it
 *   stale and started by hand  -> leave it, say how to clear it
 *   not a render service       -> say the port is taken and how to move
 */
import type { ChildProcess } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'bun:test';

import {
  inspectLocalRenderService,
  renderServiceSourceFingerprint,
  startLocalRenderService,
  stopLocalRenderService,
  type RenderServiceInstance,
} from '../render-service-host';
import { buildRenderPort, describeRenderMode, makeLazyRenderPort } from '../cli-render-mode';
import {
  FAKE_RENDERER_ID,
  deadPid,
  exited,
  freePort,
  spawnFakeRenderService,
  writeFakeRenderService,
} from './helpers/fake-render-service';

const servers: Server[] = [];
const children: ChildProcess[] = [];
const directories: string[] = [];
const savedPort = process.env['KILN_RENDER_SERVICE_PORT'];

afterEach(async () => {
  stopLocalRenderService();
  for (const child of children.splice(0)) if (child.exitCode === null) child.kill();
  await Promise.all(
    servers.splice(0).map((s) => new Promise<void>((done) => s.close(() => done()))),
  );
  await Promise.all(
    directories
      .splice(0)
      .map((d) => rm(d, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })),
  );
  if (savedPort === undefined) delete process.env['KILN_RENDER_SERVICE_PORT'];
  else process.env['KILN_RENDER_SERVICE_PORT'] = savedPort;
});

async function scratch(): Promise<string> {
  const base = resolve(import.meta.dir, '../../tmp');
  await mkdir(base, { recursive: true });
  const dir = await mkdtemp(join(base, 'service-lifecycle-'));
  directories.push(dir);
  return dir;
}

/** An in-process stand-in whose `/health` says whatever the test needs. */
function serve(health: unknown, status = 200): Promise<string> {
  const server = createServer((_req, res) => {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(typeof health === 'string' ? health : JSON.stringify(health));
  });
  servers.push(server);
  return new Promise((done) => {
    server.listen(0, '127.0.0.1', () =>
      done(`http://127.0.0.1:${(server.address() as AddressInfo).port}`),
    );
  });
}

function instance(overrides: Partial<RenderServiceInstance> = {}): RenderServiceInstance {
  return {
    version: 'kiln.render-service-instance.v1',
    pid: process.pid,
    ownerPid: null,
    startedAt: '2026-09-16T00:00:00.000Z',
    sourceDir: '/elsewhere/render-service',
    sourceFingerprint: `sha256:${'a'.repeat(64)}`,
    ...overrides,
  };
}

async function health(url: string): Promise<{ ok?: boolean; instance?: RenderServiceInstance }> {
  return (await (await fetch(new URL('/health', url))).json()) as never;
}

/** Spawn the fake service as a real process the host can kill. */
async function spawnFake(
  dir: string,
  port: number,
  env: Record<string, string>,
): Promise<ChildProcess> {
  const child = await spawnFakeRenderService(dir, port, env);
  children.push(child);
  return child;
}

describe('renderServiceSourceFingerprint', () => {
  it('agrees with the service’s own implementation on the same directory', async () => {
    // The service hashes its source at boot and reports it on /health; the
    // host hashes the source on disk and compares. Two implementations of one
    // walk, so this is the test that keeps them one.
    const service = (await import(
      join(import.meta.dir, '..', '..', 'render-service', 'src', 'instance.mjs')
    )) as { fingerprintSourceDir: (dir: string) => string };
    const dir = await scratch();
    await mkdir(join(dir, 'src', 'nested'), { recursive: true });
    await writeFile(join(dir, 'src', 'server.mjs'), 'export const a = 1;\n');
    await writeFile(join(dir, 'src', 'nested', 'b.mjs'), 'export const b = 2;\n');
    await mkdir(join(dir, 'src', 'node_modules', 'x'), { recursive: true });
    await writeFile(join(dir, 'src', 'node_modules', 'x', 'index.js'), 'ignored');
    expect(renderServiceSourceFingerprint(dir)).toBe(
      service.fingerprintSourceDir(join(dir, 'src')),
    );
    expect(renderServiceSourceFingerprint(dir)).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it('is undefined for an installation that does not ship the source', async () => {
    expect(renderServiceSourceFingerprint(join(await scratch(), 'nothing'))).toBeUndefined();
  });
});

describe('inspectLocalRenderService', () => {
  it('reports nothing listening as absent, fast', async () => {
    const port = await freePort();
    const started = Date.now();
    const probe = await inspectLocalRenderService(`http://127.0.0.1:${port}`, await scratch());
    expect(probe).toEqual({ kind: 'absent' });
    expect(Date.now() - started).toBeLessThan(1_500);
  });

  it('reports something that is not a render service as foreign', async () => {
    expect(await inspectLocalRenderService(await serve('<html>'), await scratch())).toEqual({
      kind: 'foreign',
    });
    expect(
      await inspectLocalRenderService(await serve({ ok: false }, 503), await scratch()),
    ).toEqual({ kind: 'foreign' });
  });

  it('reads a current service as current, whoever started it', async () => {
    const dir = await writeFakeRenderService(await scratch());
    const fingerprint = renderServiceSourceFingerprint(dir)!;
    const url = await serve({
      ok: true,
      rendererId: 'r',
      instance: instance({ sourceFingerprint: fingerprint, ownerPid: null }),
    });
    expect(await inspectLocalRenderService(url, dir)).toMatchObject({
      kind: 'service',
      rendererId: 'r',
      stale: false,
      orphaned: false,
    });
  });

  it('tells a stale orphan from a stale service someone still owns', async () => {
    const dir = await writeFakeRenderService(await scratch());
    const orphan = await serve({
      ok: true,
      rendererId: 'r',
      instance: instance({ ownerPid: deadPid() }),
    });
    expect(await inspectLocalRenderService(orphan, dir)).toMatchObject({
      kind: 'service',
      stale: true,
      orphaned: true,
    });
    const owned = await serve({
      ok: true,
      rendererId: 'r',
      instance: instance({ ownerPid: process.pid }),
    });
    expect(await inspectLocalRenderService(owned, dir)).toMatchObject({
      kind: 'service',
      stale: true,
      orphaned: false,
    });
  });

  it('treats a service from before instance reporting as current, not as stale', async () => {
    // It cannot be compared, and "unknown" must not read as "old": that would
    // turn every hosted deployment into a refused join.
    const url = await serve({ ok: true, rendererId: 'r' });
    expect(await inspectLocalRenderService(url, await scratch())).toMatchObject({
      kind: 'service',
      stale: false,
      orphaned: false,
    });
  });
});

describe('startLocalRenderService on a shared port', () => {
  it('replaces a stale orphan with a service running the source on disk', async () => {
    const dir = await writeFakeRenderService(await scratch());
    const port = await freePort();
    process.env['KILN_RENDER_SERVICE_PORT'] = String(port);
    const url = `http://127.0.0.1:${port}`;
    const orphan = await spawnFake(dir, port, {
      RENDER_SERVICE_OWNER_PID: String(deadPid()),
      FAKE_SOURCE_FINGERPRINT: `sha256:${'0'.repeat(64)}`,
    });
    expect((await health(url)).instance?.pid).toBe(orphan.pid!);

    // The fresh process reports the fingerprint of the source it was started
    // from, exactly as the real service does.
    process.env['FAKE_SOURCE_FINGERPRINT'] = renderServiceSourceFingerprint(dir)!;
    try {
      expect(await startLocalRenderService(dir)).toBe(url);
    } finally {
      delete process.env['FAKE_SOURCE_FINGERPRINT'];
    }
    const after = (await health(url)).instance!;
    expect(after.pid).not.toBe(orphan.pid!);
    // The replacement is owned by this session, so it will not outlive it.
    expect(after.ownerPid).toBe(process.pid);
    expect(await exited(orphan)).toBe(true);
  }, 30_000);

  it('leaves a stale service that another session still owns, and says how to clear it', async () => {
    const dir = await writeFakeRenderService(await scratch());
    const port = await freePort();
    process.env['KILN_RENDER_SERVICE_PORT'] = String(port);
    const owned = await spawnFake(dir, port, {
      RENDER_SERVICE_OWNER_PID: String(process.pid),
      FAKE_SOURCE_FINGERPRINT: `sha256:${'0'.repeat(64)}`,
    });
    await expect(startLocalRenderService(dir)).rejects.toThrow(/older source/);
    await expect(startLocalRenderService(dir)).rejects.toThrow(/kiln service stop/);
    await expect(startLocalRenderService(dir)).rejects.toThrow(String(process.pid));
    expect(owned.exitCode).toBeNull();
    expect((await health(`http://127.0.0.1:${port}`)).ok).toBe(true);
  }, 30_000);

  it('says the port is taken, and how to move, when something else holds it', async () => {
    const url = await serve('<html>');
    process.env['KILN_RENDER_SERVICE_PORT'] = new URL(url).port;
    const dir = await writeFakeRenderService(await scratch());
    await expect(startLocalRenderService(dir)).rejects.toThrow(/not a render service/);
    await expect(startLocalRenderService(dir)).rejects.toThrow(/KILN_RENDER_SERVICE_PORT/);
  });

  it('marks the service it starts as its own', async () => {
    const dir = await writeFakeRenderService(await scratch());
    const port = await freePort();
    process.env['KILN_RENDER_SERVICE_PORT'] = String(port);
    const url = await startLocalRenderService(dir);
    expect((await health(url)).instance?.ownerPid).toBe(process.pid);
  }, 30_000);
});

describe('buildRenderPort on a shared port', () => {
  it('auto leaves a stale service another session owns alone, attaches nothing, and says why', async () => {
    const dir = await writeFakeRenderService(await scratch());
    const port = await freePort();
    process.env['KILN_RENDER_SERVICE_PORT'] = String(port);
    const owned = await spawnFake(dir, port, {
      RENDER_SERVICE_OWNER_PID: String(process.pid),
      FAKE_SOURCE_FINGERPRINT: `sha256:${'0'.repeat(64)}`,
    });
    const context = await buildRenderPort('auto', undefined, { serviceDir: dir });
    // Not attached: attaching would make every CPU sheet report a degrade, and
    // the reason belongs in the producer line where the user reads it.
    expect(context.viewRenderPort).toBeUndefined();
    expect(describeRenderMode(context)).toMatch(/older source/);
    expect(describeRenderMode(context)).toMatch(/kiln service stop/);
    expect(owned.exitCode).toBeNull();
    // `gpu` asked for a guarantee, so it is told the same thing as an error.
    await expect(buildRenderPort('gpu', undefined, { serviceDir: dir })).rejects.toThrow(
      /kiln service stop/,
    );
  }, 30_000);

  it('auto stops a stale orphan on its way past, and gpu replaces it', async () => {
    const dir = await writeFakeRenderService(await scratch());
    const port = await freePort();
    process.env['KILN_RENDER_SERVICE_PORT'] = String(port);
    const url = `http://127.0.0.1:${port}`;
    const orphan = await spawnFake(dir, port, {
      RENDER_SERVICE_OWNER_PID: String(deadPid()),
      FAKE_SOURCE_FINGERPRINT: `sha256:${'0'.repeat(64)}`,
    });
    const context = await buildRenderPort('auto', undefined, { serviceDir: dir });
    expect(context.viewRenderPort).toBeUndefined();
    expect(describeRenderMode(context)).toMatch(/stopped/);
    expect(await exited(orphan)).toBe(true);
    await expect(fetch(new URL('/health', url))).rejects.toThrow();

    process.env['FAKE_SOURCE_FINGERPRINT'] = renderServiceSourceFingerprint(dir)!;
    try {
      const demanded = await buildRenderPort('gpu', undefined, { serviceDir: dir });
      expect(demanded.viewRenderPort).toBeDefined();
      expect(describeRenderMode(context)).not.toContain(FAKE_RENDERER_ID);
      // The lazy port starts one on first use, owned by this process.
      const result = await demanded.viewRenderPort!({ glb: new Uint8Array([1]), viewDirs: [] });
      expect(result.ok).toBe(true);
      expect((await health(url)).instance?.ownerPid).toBe(process.pid);
    } finally {
      delete process.env['FAKE_SOURCE_FINGERPRINT'];
    }
  }, 30_000);
});

describe('makeLazyRenderPort after the service goes away', () => {
  it('starts again on the next call instead of failing every render for the rest of the session', async () => {
    // Session A started the shared renderer and B joined it. A exits and takes
    // the renderer with it. B's port used to hold A's URL until B restarted;
    // every render in between was a connection refused reported as a degrade.
    const ports: number[] = [];
    const listeners: Server[] = [];
    const listen = async (): Promise<string> => {
      const server = createServer((_req, res) => {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true, rendererId: FAKE_RENDERER_ID, views: [] }));
      });
      servers.push(server);
      listeners.push(server);
      await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
      ports.push((server.address() as AddressInfo).port);
      return `http://127.0.0.1:${ports.at(-1)}`;
    };
    let starts = 0;
    const port = makeLazyRenderPort(async () => {
      starts += 1;
      return listen();
    });
    const glb = new Uint8Array([1, 2, 3]);
    expect((await port({ glb })).ok).toBe(true);
    await new Promise<void>((done) => listeners[0]!.close(() => done()));

    expect((await port({ glb })).ok).toBe(true);
    expect(starts).toBe(2);
    expect(ports[1]).not.toBe(ports[0]);
  });
});
