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

import { probeRenderService } from '../cli-render-mode';

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
