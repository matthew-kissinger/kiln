import { afterEach, expect, test } from 'bun:test';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { buildRenderPort } from '../cli-render-mode';
import { createKilnDiscoveryDef } from '../tools/discovery';
import { fakeRenderHealth } from './helpers/fake-render-service';
import { createRenderCapabilitiesReader } from '../render-capabilities';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const servers: Server[] = [];
const original = { ...process.env };
afterEach(async () => {
  for (const name of [
    'KILN_RENDER_TOKEN',
    'RENDER_SERVICE_TOKEN',
    'KILN_RENDER_PORT_URL',
    'KILN_RENDER_SERVICE_PORT',
  ]) {
    if (original[name] === undefined) delete process.env[name];
    else process.env[name] = original[name];
  }
  await Promise.all(servers.splice(0).map((s) => new Promise<void>((r) => s.close(() => r()))));
});
async function service() {
  const state = { health: fakeRenderHealth(), status: 200, paths: [] as string[] };
  const server = createServer((req, res) => {
    state.paths.push(req.url!);
    res.writeHead(state.status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(state.health));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  servers.push(server);
  return { state, url: `http://127.0.0.1:${(server.address() as AddressInfo).port}` };
}
async function capabilities(context: Awaited<ReturnType<typeof buildRenderPort>>) {
  const result = (await createKilnDiscoveryDef(context).run({ capabilities: true })) as {
    capabilities: { renderer: Record<string, unknown>; materials: Record<string, unknown> };
  };
  return result.capabilities;
}

test('CPU Discovery reports disabled GPU without consulting even an explicit endpoint', async () => {
  const { state, url } = await service();
  const context = await buildRenderPort('cpu', url);
  expect((await capabilities(context)).renderer).toMatchObject({
    mode: 'cpu',
    target: 'cpu',
    status: 'disabled',
    configured: false,
  });
  expect(state.paths).toEqual([]);
});

test('Discovery refreshes remote health without starting, rendering, or changing selected mode', async () => {
  const { state, url } = await service();
  const context = await buildRenderPort('gpu', url);
  const first = await capabilities(context);
  expect(first.renderer).toMatchObject({
    mode: 'gpu',
    target: 'remote',
    status: 'available',
    configured: true,
    rendererId: 'test-renderer',
    authentication: 'not-required',
  });
  expect(first.materials.gpuRequired).toBe(true);
  state.status = 503;
  process.env.KILN_RENDER_PORT_URL = 'http://127.0.0.1:1';
  expect((await capabilities(context)).renderer).toMatchObject({
    mode: 'gpu',
    target: 'remote',
    status: 'unknown',
    configured: true,
  });
  expect(state.paths).toEqual(['/health', '/health']);
});

test('renderer health does not claim authentication success or expose credentials', async () => {
  delete process.env.KILN_RENDER_TOKEN;
  const { state, url } = await service();
  state.health.authRequired = true;
  const missing = await capabilities(await buildRenderPort('auto', url));
  expect(missing.renderer).toMatchObject({
    status: 'authentication-required',
    authentication: 'missing',
  });
  process.env.KILN_RENDER_TOKEN = 'fixture-private-token';
  const configured = await capabilities(
    await buildRenderPort('auto', `${url}/?key=fixture-secret`),
  );
  expect(configured.renderer).toMatchObject({
    status: 'authentication-unverified',
    authentication: 'configured-unverified',
  });
  expect(JSON.stringify(configured)).not.toContain('fixture-private-token');
  expect(JSON.stringify(configured)).not.toContain('fixture-secret');
  expect(state.paths.every((path) => path === '/health')).toBe(true);
});

test('opaque injected ports stay explicitly unverified and are never invoked by Discovery', async () => {
  let calls = 0;
  const context = {
    viewRenderPort: async () => {
      calls++;
      throw new Error('Must not render');
    },
  };
  expect((await capabilities(context)).renderer).toMatchObject({
    target: 'host-injected',
    status: 'unknown',
    configured: true,
  });
  expect(calls).toBe(0);
  expect((await capabilities({ viewRenderRequired: true })).renderer).toMatchObject({
    mode: 'gpu',
    status: 'unavailable',
    configured: false,
    required: true,
  });
});

test('local on-demand readiness never invokes the starter and missing installation stays unavailable', async () => {
  const { url } = await service();
  await new Promise<void>((r) => servers.at(-1)!.close(() => r()));
  process.env.KILN_RENDER_SERVICE_PORT = new URL(url).port;
  delete process.env.KILN_RENDER_PORT_URL;
  let starts = 0;
  const context = await buildRenderPort('auto', undefined, {
    start: async () => {
      starts++;
      return url;
    },
  });
  expect((await capabilities(context)).renderer).toMatchObject({
    target: 'local',
    status: 'on-demand',
    configured: true,
    installation: 'ready',
    evidence: 'configuration-only',
  });
  expect(starts).toBe(0);
  const missing = await createRenderCapabilitiesReader('gpu', undefined, {
    serviceDir: join(tmpdir(), 'kiln-nonexistent-renderer-capabilities'),
  })();
  expect(missing).toMatchObject({
    status: 'unavailable',
    required: true,
    configured: false,
    installation: 'not-packaged',
  });
  expect(
    await createRenderCapabilitiesReader('auto', undefined, { autoSpawn: false })(),
  ).toMatchObject({ status: 'unavailable', autoStart: false, configured: false });
});

test('a compatible protocol with different source is not reported as ready', async () => {
  const { state, url } = await service();
  state.health = fakeRenderHealth({
    instance: { ...state.health.instance, sourceFingerprint: `sha256:${'f'.repeat(64)}` },
  });
  const result = await capabilities(await buildRenderPort('auto', url));
  expect(result.renderer).toMatchObject({
    target: 'remote',
    configured: true,
    status: 'unavailable',
    evidence: 'health-only',
  });
  expect(result.renderer.reason).toContain('source differs');
  expect(state.paths).toEqual(['/health']);
});

test('newly healthy local service does not invent a port in an existing CPU-only session', async () => {
  const { state, url } = await service();
  process.env.KILN_RENDER_SERVICE_PORT = new URL(url).port;
  delete process.env.KILN_RENDER_PORT_URL;
  state.status = 503;
  const context = await buildRenderPort('auto', undefined);
  expect(context.viewRenderPort).toBeUndefined();
  state.status = 200;
  const result = await capabilities(context);
  expect(result.renderer).toMatchObject({
    status: 'available',
    configured: false,
    reprobeRequired: true,
  });
  expect(result.materials.gpuPortConfigured).toBe(false);
  expect(result.renderer.reason).toContain('action=reprobe');
  expect(state.paths).toEqual(['/health', '/health']);
});
