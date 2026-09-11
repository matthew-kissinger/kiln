/**
 * Starting the GPU render service that ships beside this package.
 *
 * This is host code, not engine code. The engine never opens a socket and never
 * starts a process; `captureViewsViaPort` stays the single owner of the deadline,
 * the renderer/PNG validation and the never-throw degrade to the CPU rasterizer.
 * Everything here is upstream of that: it decides whether a renderer can exist on
 * this machine and, if so, gets one listening. Nothing in this module is imported
 * by a deterministic render path, and `node:child_process` must not reach one.
 *
 * Why it exists. The render service is reached over HTTP in every case -- local
 * and remote are the same socket -- because headless WebGPU needs Node loader
 * hooks that Bun does not run. That is a good simplification, but it left the
 * local case with a process-ordering problem: the service had to be listening
 * BEFORE the MCP server resolved its port, and the MCP server is started by a
 * coding harness, not by the user. "Start the renderer first" is not an
 * instruction anyone can follow when they do not own the second process.
 *
 * The hosted deployment is untouched. `KILN_RENDER_PORT_URL` and `--render-port`
 * short-circuit ahead of any of this, so a RunPod or Graviton deployment remains
 * one flag and never starts anything locally.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/**
 * The port a locally started service listens on -- deliberately the SAME port the
 * README tells people to start one on by hand, rather than an ephemeral one.
 *
 * An ephemeral port would give every session its own renderer, and a batch of
 * dispatched agents would then hold one GPU context each. On the shared port the
 * first session to arrive starts the service and the rest find it already
 * listening, which is exactly what the documented manual setup produces. It also
 * means an auto-started service and a hand-started one are indistinguishable.
 */
export const DEFAULT_LOCAL_RENDER_SERVICE_PORT = 8000;

/**
 * Read per call rather than captured at module load, so a machine whose 8000 is
 * already spoken for can move the renderer with one variable — and so a test can
 * exercise the join path without reserving the real port.
 */
export function localRenderServicePort(): number {
  const raw = Number(process.env['KILN_RENDER_SERVICE_PORT']);
  return Number.isInteger(raw) && raw > 0 && raw < 65_536 ? raw : DEFAULT_LOCAL_RENDER_SERVICE_PORT;
}

export function localRenderServiceUrl(): string {
  return `http://127.0.0.1:${localRenderServicePort()}`;
}

/** How long a starting service has to answer `/health` before it is called failed. */
const STARTUP_BUDGET_MS = Number(process.env['KILN_RENDER_SERVICE_STARTUP_MS'] ?? 60_000);
const STARTUP_POLL_MS = 250;

/**
 * `render-service/` relative to this module.
 *
 * URL arithmetic only, and it lands correctly from both entry shapes for the same
 * reason `packagedSkillsDir` does: in source this module is `src/*.ts`, and in a
 * package it has been bundled into `dist/*.mjs`. Both sit one level below the
 * installation root.
 */
export function renderServiceDir(): string {
  const override = process.env['KILN_RENDER_SERVICE_DIR'];
  if (override) return override;
  return fileURLToPath(new URL('../render-service', import.meta.url));
}

/**
 * Whether a renderer could be started here, answered from the filesystem alone --
 * no socket, no process, no GPU query.
 *
 * The distinction between the two negative answers is the whole point. Callers
 * must not attach a render port on either of them, because an attached port is
 * what makes `describeDrawnBy` report an ordinary CPU render as a degrade. But
 * they are different things to say to a user: one is "this package did not ship
 * the renderer", the other is "run its install".
 */
export type LocalRenderServiceState = 'ready' | 'dependencies-missing' | 'not-packaged';

export function localRenderServiceState(dir = renderServiceDir()): LocalRenderServiceState {
  if (!existsSync(join(dir, 'src/server.mjs')) || !existsSync(join(dir, 'package.json')))
    return 'not-packaged';
  // The native WebGPU binding is the install that actually costs something, and
  // it is the one that is absent in a fresh package. `three` is checked with it
  // so a half-finished install does not read as ready.
  if (!existsSync(join(dir, 'node_modules/webgpu')) || !existsSync(join(dir, 'node_modules/three')))
    return 'dependencies-missing';
  return 'ready';
}

/** The advice line for a state that cannot render, phrased for whoever has to act. */
export function explainRenderServiceState(state: LocalRenderServiceState, dir: string): string {
  return state === 'dependencies-missing'
    ? `the GPU render service is present but not installed; run \`npm install\` in ${dir}`
    : `this installation does not ship ${dir}`;
}

/** One `/health` request, answering only "is it listening and well". */
async function healthy(url: string, timeoutMs: number): Promise<boolean> {
  try {
    const res = await fetch(new URL('/health', url), { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return false;
    return ((await res.json()) as { ok?: boolean }).ok === true;
  } catch {
    return false;
  }
}

/**
 * The Node binary to run the service with.
 *
 * Not `process.execPath`: under Bun that is the Bun binary, and the service needs
 * Node's `--import` loader hooks, which is the reason the renderer lives behind a
 * socket in the first place. When we ARE Node, its own path is the most reliable
 * answer available and needs no PATH lookup; otherwise `node` is resolved by the
 * platform, including `node.exe` on Windows.
 */
function nodeBinary(): string {
  const override = process.env['KILN_RENDER_SERVICE_NODE'];
  if (override) return override;
  return process.versions.bun ? 'node' : process.execPath;
}

let child: ChildProcess | undefined;
let teardownRegistered = false;

/** Kill a service this process started. A service it merely found is left alone. */
export function stopLocalRenderService(): void {
  const running = child;
  child = undefined;
  if (!running || running.killed || running.exitCode !== null) return;
  running.kill();
}

function registerTeardown(): void {
  if (teardownRegistered) return;
  teardownRegistered = true;
  // `exit` cannot await, and it does not need to: killing is synchronous. The
  // signal handlers exist because a harness shutting a server down sends one, and
  // without them the renderer would outlive the process that started it.
  process.once('exit', stopLocalRenderService);
  for (const signal of ['SIGINT', 'SIGTERM'] as const)
    process.once(signal, () => {
      stopLocalRenderService();
    });
}

/**
 * Get a local render service listening, and return its base URL.
 *
 * Joins one that is already listening before starting anything, so two sessions
 * racing for the shared port converge on one renderer rather than fighting over
 * it -- including the case where our own spawn loses the race and exits on
 * EADDRINUSE, which is why the loop re-probes rather than trusting the child.
 *
 * Throws when no renderer can be got. Callers turn that into a degrade; this
 * function does not decide policy.
 */
export async function startLocalRenderService(dir = renderServiceDir()): Promise<string> {
  const url = localRenderServiceUrl();
  // Join before starting. A renderer someone else is running is a renderer, and
  // this branch is also what keeps `stopLocalRenderService` honest: `child` stays
  // undefined, so leaving this process never takes down a service it found. A
  // batch of dispatched agents sharing one GPU depends on exactly that.
  if (await healthy(url, 1_500)) return url;

  const state = localRenderServiceState(dir);
  if (state !== 'ready') throw new Error(explainRenderServiceState(state, dir));

  registerTeardown();
  let stderr = '';
  child = spawn(
    nodeBinary(),
    ['--import', join(dir, 'src/register-hooks.mjs'), join(dir, 'src/server.mjs')],
    {
      cwd: dir,
      env: {
        ...process.env,
        PORT: String(localRenderServicePort()),
        // Loopback, where the documented manual start binds every interface. We
        // are choosing on the user's behalf here, so the narrow choice is the
        // right one; the Docker deployment sets its own HOST and is unaffected.
        HOST: '127.0.0.1',
      },
      // NEVER `inherit`: stdout is the MCP transport, and the service greets its
      // own boot on stdout. One `listening on :8000` line in that stream is a
      // protocol error for every tool call after it.
      stdio: ['ignore', 'ignore', 'pipe'],
    },
  );
  child.stderr?.on('data', (chunk: Buffer) => {
    stderr = `${stderr}${chunk.toString()}`.slice(-2_000);
  });

  const deadline = Date.now() + STARTUP_BUDGET_MS;
  while (Date.now() < deadline) {
    if (await healthy(url, 1_000)) return url;
    if (child.exitCode !== null || child.signalCode !== null) {
      // Losing the port race is a success: somebody else's renderer is listening.
      if (await healthy(url, 1_500)) return url;
      child = undefined;
      throw new Error(
        `render service exited during startup${stderr.trim() ? `: ${stderr.trim().split('\n').slice(-3).join(' ')}` : ''}`,
      );
    }
    await new Promise((done) => setTimeout(done, STARTUP_POLL_MS));
  }
  stopLocalRenderService();
  throw new Error(`render service did not answer within ${STARTUP_BUDGET_MS}ms`);
}
