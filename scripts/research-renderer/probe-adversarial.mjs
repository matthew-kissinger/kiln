// Bounded B05 probes. Run with Bun; creates only its own ephemeral loopback servers.
// No native/GPU initialization, root package mutation, or existing-service access.
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSerialRenderQueue, validateRenderMode } from '../../render-service/src/contract.mjs';
import {
  startLocalRenderService,
  inspectLocalRenderService,
} from '../../src/render-service-host.ts';

const [serviceDir, output] = process.argv.slice(2);
if (!serviceDir || !output)
  throw new Error('Pass an existing research serviceDir and output receipt path.');
const repo = fileURLToPath(new URL('../..', import.meta.url));
const receipt = {
  scope:
    'bounded pure queue and fake loopback probes; loader performs one request to an owned local fixture server; no GPU',
  platform: process.platform,
  arch: process.arch,
  bun: process.versions.bun,
  sourceHashes: Object.fromEntries(
    [
      'src/render-service-host.ts',
      'render-service/src/server.mjs',
      'render-service/src/contract.mjs',
      'render-service/src/renderer.mjs',
    ].map((path) => [
      path,
      createHash('sha256')
        .update(readFileSync(join(repo, path)))
        .digest('hex'),
    ]),
  ),
};

async function withServer(handler, operation) {
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const previous = process.env.KILN_RENDER_SERVICE_PORT;
  process.env.KILN_RENDER_SERVICE_PORT = String(port);
  try {
    return await operation(`http://127.0.0.1:${port}`);
  } finally {
    if (previous === undefined) delete process.env.KILN_RENDER_SERVICE_PORT;
    else process.env.KILN_RENDER_SERVICE_PORT = previous;
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

receipt.unknownBusyEndpoint = await withServer(
  (_req, _res) => {},
  async (url) => {
    const began = performance.now();
    const result = await startLocalRenderService(join(repo, 'does-not-exist-b05'));
    return {
      returnedEndpoint: result === url,
      elapsedMs: performance.now() - began,
      everReturnedHealth: false,
    };
  },
);
receipt.unversionedEndpoint = await withServer(
  (_req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, rendererId: 'unversioned-probe' }));
  },
  async (url) => ({
    inspected: await inspectLocalRenderService(url),
    acceptedForStartup: (await startLocalRenderService(join(repo, 'does-not-exist-b05'))) === url,
  }),
);

const queue = createSerialRenderQueue();
let releaseHead;
const head = queue.enqueue(
  () =>
    new Promise((resolve) => {
      releaseHead = resolve;
    }),
);
await Promise.resolve();
let started = 0;
const depths = [];
const pending = Array.from({ length: 128 }, () =>
  queue.enqueue((start) => {
    started++;
    depths.push(start.queueDepthAtEnqueue);
  }),
);
receipt.queue = {
  admittedBehindBlockedJob: pending.length,
  startedWhileBlocked: started,
  note: '128 tiny jobs only; no resource exhaustion attempted. API has no admission or abort parameter.',
};
releaseHead();
await Promise.all([head, ...pending]);
receipt.queue.completed = started;
receipt.queue.maxObservedDepthAtEnqueue = Math.max(...depths);

const sizes = [128, 256, 384, 512, 768, 1024, 2048];
const mode = validateRenderMode({ size: 2048, views: Array.from({ length: 12 }, () => [1, 0, 0]) });
receipt.legacyResourceArithmetic = {
  acceptedMode: mode.mode,
  maximumSingleRequestViewPixels: 2048 * 2048 * 12,
  retainedAllRungTargetPixels: sizes.reduce((sum, size) => sum + size * size * 12, 0),
  note: 'Arithmetic only; no large targets allocated. Retained-target totals exclude beauty, depth, MSAA and scene resources.',
};

const external = spawnSync(
  'node',
  [join(dirname(fileURLToPath(import.meta.url)), 'probe-external-resource.mjs'), serviceDir],
  {
    windowsHide: true,
    encoding: 'utf8',
    timeout: 15_000,
  },
);
receipt.externalResource = {
  code: external.status,
  stdout: external.stdout,
  stderr: external.stderr,
  error: external.error?.message,
};
const bundleDir = mkdtempSync(join(tmpdir(), 'kiln-b05-browser-'));
receipt.browserBuilds = [];
for (const entry of ['src/composer/render-port.ts', 'src/primitives.ts']) {
  const result = spawnSync(
    'bun',
    [
      'build',
      entry,
      '--target',
      'browser',
      '--outfile',
      join(bundleDir, entry.replaceAll('/', '-').replace('.ts', '.js')),
    ],
    {
      cwd: repo,
      windowsHide: true,
      encoding: 'utf8',
      timeout: 15_000,
    },
  );
  receipt.browserBuilds.push({
    entry,
    code: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.error?.message,
  });
}
writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(
  JSON.stringify({
    receipt: output,
    busy: receipt.unknownBusyEndpoint,
    unversioned: receipt.unversionedEndpoint,
    queue: receipt.queue,
    external: receipt.externalResource,
  }),
);
