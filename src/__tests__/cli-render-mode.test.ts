/**
 * The `auto` health probe, and the difference between "no renderer" and "busy".
 *
 * This exists because of a real batch run. Three agents were dispatched against
 * one local GPU render service; the service was up the whole time, and one of the
 * runs still reported `cpu raster (no GPU service found)` and judged its materials
 * off a flat-white sheet. Nothing was broken. The renderer was simply drawing
 * somebody else's frame, and a 1.5 second probe expired against a socket that had
 * been accepted and would have answered a moment later.
 *
 * The two cases below are the whole contract: a machine with nothing listening
 * must still fall through to the CPU rasterizer immediately, and a machine whose
 * renderer is merely occupied must not be mistaken for one.
 */
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { afterEach, describe, expect, it } from 'bun:test';

import { buildRenderPort, makeRemoteRenderPort, probeRenderService } from '../cli-render-mode';

const servers: Server[] = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map((s) => new Promise<void>((resolve) => s.close(() => resolve()))),
  );
});

/** A stand-in render service whose `/health` answers after `delayMs`. */
function serve(delayMs: number, status = 200): Promise<string> {
  const server = createServer((_req, res) => {
    setTimeout(() => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: status === 200, rendererId: 'test-renderer' }));
    }, delayMs);
  });
  servers.push(server);
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
    });
  });
}

describe('probeRenderService', () => {
  it('finds a renderer that answers straight away', async () => {
    expect(await probeRenderService(await serve(0))).toBe('test-renderer');
  });

  it('finds a renderer that is busy when first asked', async () => {
    // Past the 1.5s first budget, inside the 8s second one. Before the retry
    // existed this returned undefined and the caller ran the whole session on the
    // CPU rasterizer with a healthy GPU sitting on the other end of the socket.
    expect(await probeRenderService(await serve(2_000))).toBe('test-renderer');
  });

  it('gives up on a service that answers with an error', async () => {
    expect(await probeRenderService(await serve(0, 503))).toBeUndefined();
  });

  it('falls through immediately when nothing is listening', async () => {
    // The point of the short first budget. A refused connection is an answer, and
    // waiting 8 seconds for it on every CPU-only machine would be the cure being
    // worse than the disease. One closed port, so the kernel refuses at once.
    const url = await serve(0);
    await new Promise<void>((resolve) => servers.splice(0)[0]!.close(() => resolve()));

    const started = performance.now();
    expect(await probeRenderService(url)).toBeUndefined();
    expect(performance.now() - started).toBeLessThan(1_000);
  });
});

it('sends the shared grid background to the GPU service for ordinary asset sheets', async () => {
  let body: Record<string, unknown> | undefined;
  const server = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        rendererId: 'test-renderer',
        views: [Buffer.from('png').toString('base64')],
      }),
    );
  });
  servers.push(server);
  const url = await new Promise<string>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
    });
  });

  await makeRemoteRenderPort(url)({
    glb: new Uint8Array([1]),
    viewDirs: [[1, 0, 0]],
    size: 384,
  });

  expect(body?.background).toBe('#1a1a1a');
});

it('authenticates an auto-started local renderer with its inherited service token', async () => {
  const previousClientToken = process.env.KILN_RENDER_TOKEN;
  const previousServiceToken = process.env.RENDER_SERVICE_TOKEN;
  const previousPort = process.env.KILN_RENDER_SERVICE_PORT;
  const token = 'local-renderer-test-token';
  let receivedToken: string | undefined;
  const server = createServer(async (req, res) => {
    receivedToken = req.headers['x-render-token'] as string | undefined;
    for await (const _chunk of req) {
      // Drain the request before answering, like the real render service.
    }
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        rendererId: 'test-renderer',
        views: [Buffer.from('png').toString('base64')],
      }),
    );
  });
  servers.push(server);
  const dummyServer = createServer();
  servers.push(dummyServer);
  const unusedPort = await new Promise<number>((resolve) => {
    dummyServer.listen(0, '127.0.0.1', () => {
      const port = (dummyServer.address() as AddressInfo).port;
      dummyServer.close(() => resolve(port));
    });
  });
  const url = await new Promise<string>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
    });
  });

  try {
    delete process.env.KILN_RENDER_TOKEN;
    process.env.RENDER_SERVICE_TOKEN = token;
    // Set local port to an unused port so probeRenderService fails fast to autoSpawn
    process.env.KILN_RENDER_SERVICE_PORT = String(unusedPort);
    const context = await buildRenderPort('auto', undefined, {
      autoSpawn: true,
      start: async () => url,
    });
    await context.viewRenderPort!({
      glb: new Uint8Array([1]),
      viewDirs: [[1, 0, 0]],
      size: 384,
    });
    expect(receivedToken).toBe(token);
  } finally {
    if (previousClientToken === undefined) delete process.env.KILN_RENDER_TOKEN;
    else process.env.KILN_RENDER_TOKEN = previousClientToken;
    if (previousServiceToken === undefined) delete process.env.RENDER_SERVICE_TOKEN;
    else process.env.RENDER_SERVICE_TOKEN = previousServiceToken;
    if (previousPort === undefined) delete process.env.KILN_RENDER_SERVICE_PORT;
    else process.env.KILN_RENDER_SERVICE_PORT = previousPort;
  }
});

it('authenticates when joining an already-running local renderer with its inherited service token', async () => {
  const previousClientToken = process.env.KILN_RENDER_TOKEN;
  const previousServiceToken = process.env.RENDER_SERVICE_TOKEN;
  const previousPort = process.env.KILN_RENDER_SERVICE_PORT;
  const token = 'running-renderer-test-token';
  let receivedToken: string | undefined;
  const server = createServer(async (req, res) => {
    if (req.url === '/health') {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, rendererId: 'test-renderer' }));
      return;
    }
    receivedToken = req.headers['x-render-token'] as string | undefined;
    for await (const _chunk of req) {
      // Drain the request.
    }
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        rendererId: 'test-renderer',
        views: [Buffer.from('png').toString('base64')],
      }),
    );
  });
  servers.push(server);
  const port = await new Promise<number>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve((server.address() as AddressInfo).port);
    });
  });

  try {
    delete process.env.KILN_RENDER_TOKEN;
    process.env.RENDER_SERVICE_TOKEN = token;
    process.env.KILN_RENDER_SERVICE_PORT = String(port);
    // Joining an auto-discovered running local renderer (no portUrl passed)
    const context = await buildRenderPort('auto', undefined);
    await context.viewRenderPort!({
      glb: new Uint8Array([1]),
      viewDirs: [[1, 0, 0]],
      size: 384,
    });
    expect(receivedToken).toBe(token);
  } finally {
    if (previousClientToken === undefined) delete process.env.KILN_RENDER_TOKEN;
    else process.env.KILN_RENDER_TOKEN = previousClientToken;
    if (previousServiceToken === undefined) delete process.env.RENDER_SERVICE_TOKEN;
    else process.env.RENDER_SERVICE_TOKEN = previousServiceToken;
    if (previousPort === undefined) delete process.env.KILN_RENDER_SERVICE_PORT;
    else process.env.KILN_RENDER_SERVICE_PORT = previousPort;
  }
});

it('does not leak local service token to explicit remote renderers (portUrl or envUrl)', async () => {
  const previousClientToken = process.env.KILN_RENDER_TOKEN;
  const previousServiceToken = process.env.RENDER_SERVICE_TOKEN;
  const previousEnvUrl = process.env.KILN_RENDER_PORT_URL;
  let receivedToken: string | undefined;
  const server = createServer(async (req, res) => {
    receivedToken = req.headers['x-render-token'] as string | undefined;
    for await (const _chunk of req) {
      // Drain the request.
    }
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        rendererId: 'test-remote-renderer',
        views: [Buffer.from('png').toString('base64')],
      }),
    );
  });
  servers.push(server);
  const url = await new Promise<string>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
    });
  });

  try {
    delete process.env.KILN_RENDER_TOKEN;
    process.env.RENDER_SERVICE_TOKEN = 'secret-local-service-token';

    // Case A: explicit portUrl argument
    const contextArg = await buildRenderPort('auto', url);
    await contextArg.viewRenderPort!({
      glb: new Uint8Array([1]),
      viewDirs: [[1, 0, 0]],
      size: 384,
    });
    expect(receivedToken).toBeUndefined();

    // Case B: KILN_RENDER_PORT_URL environment variable
    receivedToken = 'canary';
    process.env.KILN_RENDER_PORT_URL = url;
    const contextEnv = await buildRenderPort('auto', undefined);
    await contextEnv.viewRenderPort!({
      glb: new Uint8Array([1]),
      viewDirs: [[1, 0, 0]],
      size: 384,
    });
    expect(receivedToken).toBeUndefined();
  } finally {
    if (previousClientToken === undefined) delete process.env.KILN_RENDER_TOKEN;
    else process.env.KILN_RENDER_TOKEN = previousClientToken;
    if (previousServiceToken === undefined) delete process.env.RENDER_SERVICE_TOKEN;
    else process.env.RENDER_SERVICE_TOKEN = previousServiceToken;
    if (previousEnvUrl === undefined) delete process.env.KILN_RENDER_PORT_URL;
    else process.env.KILN_RENDER_PORT_URL = previousEnvUrl;
  }
});

it('prioritizes explicit KILN_RENDER_TOKEN over RENDER_SERVICE_TOKEN', async () => {
  const previousClientToken = process.env.KILN_RENDER_TOKEN;
  const previousServiceToken = process.env.RENDER_SERVICE_TOKEN;
  const previousPort = process.env.KILN_RENDER_SERVICE_PORT;
  let receivedToken: string | undefined;
  const server = createServer(async (req, res) => {
    if (req.url === '/health') {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, rendererId: 'test-renderer' }));
      return;
    }
    receivedToken = req.headers['x-render-token'] as string | undefined;
    for await (const _chunk of req) {
      // Drain the request.
    }
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        rendererId: 'test-renderer',
        views: [Buffer.from('png').toString('base64')],
      }),
    );
  });
  servers.push(server);
  const port = await new Promise<number>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve((server.address() as AddressInfo).port);
    });
  });

  try {
    process.env.KILN_RENDER_TOKEN = 'explicit-client-token';
    process.env.RENDER_SERVICE_TOKEN = 'local-service-token';
    process.env.KILN_RENDER_SERVICE_PORT = String(port);

    // Case 1: local running renderer
    const contextLocal = await buildRenderPort('auto', undefined);
    await contextLocal.viewRenderPort!({
      glb: new Uint8Array([1]),
      viewDirs: [[1, 0, 0]],
      size: 384,
    });
    expect(receivedToken).toBe('explicit-client-token');

    // Case 2: explicit remote renderer URL
    let remoteReceivedToken: string | undefined;
    server.removeAllListeners('request');
    server.on('request', async (req, res) => {
      remoteReceivedToken = req.headers['x-render-token'] as string | undefined;
      for await (const _chunk of req) {
      }
      res.setHeader('content-type', 'application/json');
      res.end(
        JSON.stringify({
          ok: true,
          rendererId: 'test-renderer',
          views: [Buffer.from('png').toString('base64')],
        }),
      );
    });
    const contextRemote = await buildRenderPort('auto', `http://127.0.0.1:${port}`);
    await contextRemote.viewRenderPort!({
      glb: new Uint8Array([1]),
      viewDirs: [[1, 0, 0]],
      size: 384,
    });
    expect(remoteReceivedToken).toBe('explicit-client-token');

    // Case 3: auto-spawned local renderer
    let spawnReceivedToken: string | undefined;
    server.removeAllListeners('request');
    server.on('request', async (req, res) => {
      spawnReceivedToken = req.headers['x-render-token'] as string | undefined;
      for await (const _chunk of req) {
      }
      res.setHeader('content-type', 'application/json');
      res.end(
        JSON.stringify({
          ok: true,
          rendererId: 'test-renderer',
          views: [Buffer.from('png').toString('base64')],
        }),
      );
    });
    const contextSpawn = await buildRenderPort('auto', undefined, {
      autoSpawn: true,
      start: async () => `http://127.0.0.1:${port}`,
    });
    await contextSpawn.viewRenderPort!({
      glb: new Uint8Array([1]),
      viewDirs: [[1, 0, 0]],
      size: 384,
    });
    expect(spawnReceivedToken).toBe('explicit-client-token');
  } finally {
    if (previousClientToken === undefined) delete process.env.KILN_RENDER_TOKEN;
    else process.env.KILN_RENDER_TOKEN = previousClientToken;
    if (previousServiceToken === undefined) delete process.env.RENDER_SERVICE_TOKEN;
    else process.env.RENDER_SERVICE_TOKEN = previousServiceToken;
    if (previousPort === undefined) delete process.env.KILN_RENDER_SERVICE_PORT;
    else process.env.KILN_RENDER_SERVICE_PORT = previousPort;
  }
});

it('sends no token when neither KILN_RENDER_TOKEN nor RENDER_SERVICE_TOKEN is set', async () => {
  const previousClientToken = process.env.KILN_RENDER_TOKEN;
  const previousServiceToken = process.env.RENDER_SERVICE_TOKEN;
  const previousPort = process.env.KILN_RENDER_SERVICE_PORT;
  let receivedToken: string | undefined;
  const server = createServer(async (req, res) => {
    if (req.url === '/health') {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, rendererId: 'test-renderer' }));
      return;
    }
    receivedToken = req.headers['x-render-token'] as string | undefined;
    for await (const _chunk of req) {
      // Drain the request.
    }
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        rendererId: 'test-renderer',
        views: [Buffer.from('png').toString('base64')],
      }),
    );
  });
  servers.push(server);
  const port = await new Promise<number>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve((server.address() as AddressInfo).port);
    });
  });

  try {
    delete process.env.KILN_RENDER_TOKEN;
    delete process.env.RENDER_SERVICE_TOKEN;
    process.env.KILN_RENDER_SERVICE_PORT = String(port);

    const context = await buildRenderPort('auto', undefined);
    await context.viewRenderPort!({
      glb: new Uint8Array([1]),
      viewDirs: [[1, 0, 0]],
      size: 384,
    });
    expect(receivedToken).toBeUndefined();
  } finally {
    if (previousClientToken === undefined) delete process.env.KILN_RENDER_TOKEN;
    else process.env.KILN_RENDER_TOKEN = previousClientToken;
    if (previousServiceToken === undefined) delete process.env.RENDER_SERVICE_TOKEN;
    else process.env.RENDER_SERVICE_TOKEN = previousServiceToken;
    if (previousPort === undefined) delete process.env.KILN_RENDER_SERVICE_PORT;
    else process.env.KILN_RENDER_SERVICE_PORT = previousPort;
  }
});
