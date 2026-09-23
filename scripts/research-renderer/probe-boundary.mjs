// Real renderer + independent live observer. Uses ephemeral loopback, never port 8000.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [serviceDir, fixture, output] = process.argv.slice(2);
const receipt = {
  serviceDir,
  node: process.version,
  scope: 'real local GPU HTTP; not a second-machine test',
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const reservation = createServer();
await new Promise((resolve) => reservation.listen(0, '127.0.0.1', resolve));
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const base = `http://127.0.0.1:${port}`;
const owner = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
  stdio: 'ignore',
  windowsHide: true,
});
let observer;
const started = performance.now();
const renderer = spawn(
  process.execPath,
  [
    '--import',
    pathToFileURL(join(serviceDir, 'src/register-hooks.mjs')).href,
    join(serviceDir, 'src/server.mjs'),
  ],
  {
    cwd: serviceDir,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PORT: String(port),
      HOST: '127.0.0.1',
      RENDER_SERVICE_TOKEN: '',
      RENDER_SERVICE_ALLOW_UNAUTHENTICATED: '',
      RENDER_SERVICE_OWNER_PID: String(owner.pid),
    },
  },
);
let stderr = '';
let stdout = '';
renderer.stderr.on('data', (chunk) => {
  stderr += chunk;
});
renderer.stdout.on('data', (chunk) => {
  stdout += chunk;
});
try {
  while (performance.now() - started < 60_000) {
    if (renderer.exitCode !== null) throw new Error(`service exited: ${stderr}`);
    try {
      const response = await fetch(`${base}/health`, { signal: AbortSignal.timeout(1000) });
      if (response.ok) {
        receipt.health = await response.json();
        break;
      }
    } catch {}
    await sleep(100);
  }
  if (!receipt.health) throw new Error('service startup timeout');
  receipt.readyMs = performance.now() - started;
  const payload = JSON.stringify({
    glb_base64: readFileSync(fixture).toString('base64'),
    size: 128,
    views: [[1, 0.35, 1]],
  });
  const render = async () => {
    const start = performance.now();
    const response = await fetch(`${base}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      signal: AbortSignal.timeout(60_000),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(JSON.stringify(result));
    const bytes = Buffer.from(result.views[0], 'base64');
    return {
      ms: performance.now() - start,
      pngBytes: bytes.length,
      pngSha256: createHash('sha256').update(bytes).digest('hex'),
      operational: result.operationalEvidence,
      fidelity: result.renderFidelity,
      timings: result.timings,
    };
  };
  receipt.firstRender = await render();
  receipt.startupToFirstPngMs = performance.now() - started;
  receipt.concurrentRenders = await Promise.all([render(), render()]);
  observer = spawn(
    process.execPath,
    [
      '-e',
      `setInterval(async () => { try { const r = await fetch(${JSON.stringify(`${base}/health`)}); process.stdout.write(r.ok ? 'ok\\n' : 'error\\n'); } catch { process.stdout.write('unreachable\\n'); } }, 200)`,
    ],
    { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] },
  );
  let observations = '';
  observer.stdout.on('data', (chunk) => {
    observations += chunk;
  });
  await sleep(800);
  receipt.observerReachedServiceBeforeOwnerExit = observations.includes('ok');
  const ownerExit = performance.now();
  owner.kill();
  while (
    renderer.exitCode === null &&
    renderer.signalCode === null &&
    performance.now() - ownerExit < 6000
  )
    await sleep(100);
  await sleep(600);
  receipt.ownerExit = {
    serviceExited: renderer.exitCode !== null || renderer.signalCode !== null,
    serviceExitCode: renderer.exitCode,
    serviceSignal: renderer.signalCode,
    elapsedMs: performance.now() - ownerExit,
    observerStillAlive: observer.exitCode === null && observer.signalCode === null,
    observerLostService: observations.includes('unreachable'),
    observations: observations.trim().split('\n'),
  };
} catch (error) {
  receipt.error = error.message;
  process.exitCode = 1;
} finally {
  owner.kill();
  observer?.kill();
  renderer.kill();
  receipt.stderr = stderr;
  receipt.serviceLog = stdout;
  writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(
    JSON.stringify({ receipt: output, ownerExit: receipt.ownerExit, error: receipt.error }),
  );
}
