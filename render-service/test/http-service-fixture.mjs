// HTTP route integration with simulated native/GPU work. This is not rendering acceptance.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export async function until(predicate, label, timeoutMs = 5000) {
  const deadline = performance.now() + timeoutMs;
  while (performance.now() < deadline) {
    if (await predicate()) return;
    await delay(10);
  }
  assert.fail(`Timed out waiting for ${label}`);
}

export async function simulatedService(t, { mode = 'manual', idleTimeoutMs = 250 } = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'kiln-render-http-test-'));
  const entry = new URL('../src/server.mjs', import.meta.url);
  const identity = new URL('../src/build-identity.mjs', import.meta.url);
  const hooks = join(directory, 'hooks.mjs');
  const registration = join(directory, 'register.mjs');
  const fakeRenderer = join(directory, 'renderer.mjs');
  const eventsPath = join(directory, 'events.txt');
  await writeFile(eventsPath, '');
  await writeFile(
    fakeRenderer,
    `
    import { appendFile, access } from 'node:fs/promises';
    import { join } from 'node:path';
    export const PRESENTATION_PROFILE_ID = 'kiln.presentation.neutral-v1';
    export const initRenderer = async () => {};
    export async function renderGlb(bytes) {
      const document = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8'));
      const label = document.asset.generator;
      if (!/^[a-z0-9-]+$/.test(label)) throw new Error('Invalid fixture job label');
      await appendFile(${JSON.stringify(eventsPath)}, label + '\\n');
      for (;;) {
        try { await access(join(${JSON.stringify(directory)}, label + '.release')); break; } catch {}
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      return { views: [Buffer.from('simulated-png')], timings: { totalMs: 1 } };
    }
  `,
  );
  const gpuSource = `export const acquireGpu = async () => ({ rendererId: 'test-simulated-gpu', backend: 'test', summary: { description: 'SIMULATED' } });`;
  const cacheSource = `export const createRendererCaptureIdentity = () => ({ version: 'kiln.capture-producer.v1', fingerprint: 'sha256:' + 'a'.repeat(64), instanceId: 'isolated-http-test' });`;
  const identitySource = `export * from ${JSON.stringify(identity.href)}; import { RENDER_SERVICE_DEPENDENCIES } from ${JSON.stringify(identity.href)}; export const resolvedRendererDependencies = () => RENDER_SERVICE_DEPENDENCIES;`;
  const dataUrl = (source) => `data:text/javascript,${encodeURIComponent(source)}`;
  await writeFile(
    hooks,
    `
    export async function resolve(specifier, context, nextResolve) {
      if (context.parentURL === ${JSON.stringify(entry.href)}) {
        const mocks = ${JSON.stringify({ './renderer.mjs': pathToFileURL(fakeRenderer).href, './gpu.mjs': dataUrl(gpuSource), './cache-identity.mjs': dataUrl(cacheSource), './build-identity.mjs': dataUrl(identitySource) })};
        if (mocks[specifier]) return { url: mocks[specifier], shortCircuit: true };
      }
      return nextResolve(specifier, context);
    }
  `,
  );
  await writeFile(
    registration,
    `import { register } from 'node:module'; register(${JSON.stringify(pathToFileURL(hooks).href)}, import.meta.url);`,
  );
  const reservation = createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const owner = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
    windowsHide: true,
    stdio: 'ignore',
  });
  const child = spawn(
    process.execPath,
    ['--import', pathToFileURL(registration).href, fileURLToPath(entry)],
    {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PORT: String(port),
        HOST: '127.0.0.1',
        RENDER_SERVICE_TOKEN: '',
        RENDER_SERVICE_MODE: mode,
        RENDER_SERVICE_IDLE_MS: String(idleTimeoutMs),
        RENDER_SERVICE_OWNER_PID: String(owner.pid),
      },
    },
  );
  let output = '';
  child.stdout.on('data', (chunk) => {
    output += chunk;
  });
  child.stderr.on('data', (chunk) => {
    output += chunk;
  });
  const close = async () => {
    await Promise.all(
      [owner, child].map(async (process) => {
        if (process.exitCode !== null || process.signalCode !== null) return;
        const exited = once(process, 'exit');
        process.kill();
        await exited;
      }),
    );
    const absolute = resolve(directory);
    if (
      !absolute.startsWith(resolve(tmpdir()) + sep) ||
      !absolute.includes('kiln-render-http-test-')
    )
      throw new Error('Refusing invalid test cleanup path');
    await rm(absolute, { recursive: true, force: true });
  };
  t.after(close);
  const base = `http://127.0.0.1:${port}`;
  const health = async () =>
    (await fetch(`${base}/health`, { signal: AbortSignal.timeout(500) })).json();
  await until(async () => {
    if (child.exitCode !== null) throw new Error(`Simulated service exited: ${output}`);
    try {
      return (await health()).ok;
    } catch {
      return false;
    }
  }, 'simulated HTTP readiness');
  return {
    child,
    owner,
    health,
    base,
    output: () => output,
    events: async () => (await readFile(eventsPath, 'utf8')).trim().split('\n').filter(Boolean),
    release: (label) => writeFile(join(directory, `${label}.release`), ''),
    render: (bytes, signal) =>
      fetch(`${base}/render`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          glb_base64: bytes.toString('base64'),
          size: 64,
          views: [[1, 0, 0]],
        }),
        signal,
      }),
  };
}
