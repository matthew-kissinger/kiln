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
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join, relative } from 'node:path';

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

export function renderServiceNodeArguments(dir: string): string[] {
  return [
    '--import',
    pathToFileURL(join(dir, 'src/register-hooks.mjs')).href,
    join(dir, 'src/server.mjs'),
  ];
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

// -----------------------------------------------------------------------------
// Who is listening on the shared port
// -----------------------------------------------------------------------------
//
// The socket is the registry. A service reports its pid, the session that
// started it and a fingerprint of the source it runs (`render-service/src/
// instance.mjs`), and the host reads those instead of guessing from a port
// number. A lease file would be a second source of truth that can outlive the
// process it describes; `/health` cannot.

/** The `instance` block of the service's `/health`. */
export interface RenderServiceInstance {
  version: 'kiln.render-service-instance.v1';
  pid: number;
  /** The session that started it on demand; null when started by hand. */
  ownerPid: number | null;
  startedAt: string;
  sourceDir: string;
  sourceFingerprint: string;
}

/**
 * The same walk as `fingerprintSourceDir` in `render-service/src/instance.mjs`,
 * over `<dir>/src`, so the host can compare what is on disk with what a running
 * service reports. A test imports the service's implementation and checks the
 * two agree on one directory; keep them in step.
 */
export function renderServiceSourceFingerprint(dir: string): string | undefined {
  const source = join(dir, 'src');
  if (!existsSync(source)) return undefined;
  const hash = createHash('sha256');
  hash.update('kiln.render-service-source.v1');
  const visit = (path: string): void => {
    if (statSync(path).isDirectory()) {
      for (const name of readdirSync(path).sort()) {
        if (name === 'node_modules') continue;
        visit(join(path, name));
      }
      return;
    }
    const bytes = readFileSync(path);
    hash.update(JSON.stringify([relative(source, path).replaceAll('\\', '/'), bytes.length]));
    hash.update(bytes);
  };
  visit(source);
  return `sha256:${hash.digest('hex')}`;
}

/** Whether `pid` is a live process. EPERM means it exists and is not ours to signal. */
export function processIsAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as { code?: string }).code === 'EPERM';
  }
}

export type LocalRenderServiceProbe =
  /** Nothing accepted the connection. */
  | { kind: 'absent' }
  /** The socket was accepted and then went quiet: a renderer busy on another frame. */
  | { kind: 'busy' }
  /** Something answered, and it is not a render service. */
  | { kind: 'foreign' }
  | {
      kind: 'service';
      rendererId: string;
      /** Absent on a service from before instance reporting. */
      instance?: RenderServiceInstance;
      /** Runs source that differs from `<dir>/src`. Never true when it cannot be told. */
      stale: boolean;
      /** Started on demand by a session that no longer exists. */
      orphaned: boolean;
    };

/**
 * Ask the shared port who is there. Never throws: every answer is a state the
 * caller has a policy for.
 */
export async function inspectLocalRenderService(
  url: string,
  dir = renderServiceDir(),
  timeoutMs = 1_500,
): Promise<LocalRenderServiceProbe> {
  let body: {
    ok?: boolean;
    rendererId?: string;
    instance?: Partial<RenderServiceInstance>;
  };
  try {
    const res = await fetch(new URL('/health', url), {
      signal: AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
    });
    if (!res.ok) return { kind: 'foreign' };
    body = (await res.json()) as typeof body;
  } catch (error) {
    // `AbortSignal.timeout` rejects with a TimeoutError; a refused connection
    // is a fetch failure; a listening socket whose body is not JSON is
    // somebody else's server on our port.
    if (error instanceof Error && error.name === 'TimeoutError') return { kind: 'busy' };
    return (error as { name?: string }).name === 'SyntaxError'
      ? { kind: 'foreign' }
      : { kind: 'absent' };
  }
  if (body?.ok !== true || typeof body.rendererId !== 'string') return { kind: 'foreign' };
  const raw = body.instance;
  const instance: RenderServiceInstance | undefined =
    raw &&
    raw.version === 'kiln.render-service-instance.v1' &&
    typeof raw.pid === 'number' &&
    typeof raw.sourceFingerprint === 'string'
      ? {
          version: raw.version,
          pid: raw.pid,
          ownerPid: typeof raw.ownerPid === 'number' ? raw.ownerPid : null,
          startedAt: typeof raw.startedAt === 'string' ? raw.startedAt : '',
          sourceDir: typeof raw.sourceDir === 'string' ? raw.sourceDir : '',
          sourceFingerprint: raw.sourceFingerprint,
        }
      : undefined;
  const local = renderServiceSourceFingerprint(dir);
  const stale =
    instance !== undefined && local !== undefined && instance.sourceFingerprint !== local;
  const orphaned =
    instance !== undefined && instance.ownerPid !== null && !processIsAlive(instance.ownerPid);
  return {
    kind: 'service',
    rendererId: body.rendererId,
    ...(instance ? { instance } : {}),
    stale,
    orphaned,
  };
}

/** How a stale service is described to whoever has to act on it. */
export function describeStaleService(url: string, probe: LocalRenderServiceProbe): string {
  if (probe.kind !== 'service' || !probe.instance) return `the render service on ${url} is stale`;
  const { pid, ownerPid } = probe.instance;
  const who =
    ownerPid === null
      ? 'started by hand'
      : probe.orphaned
        ? `started by session ${ownerPid}, which has exited`
        : `started by session ${ownerPid}, which is still running`;
  return `the render service on ${url} (pid ${pid}, ${who}) runs older source than the render-service directory of this installation`;
}

/**
 * Stop the service `probe` describes and wait for its port to come free.
 * Returns false when it could not be stopped in time.
 */
export async function terminateRenderService(
  url: string,
  probe: LocalRenderServiceProbe,
  waitMs = 5_000,
): Promise<boolean> {
  if (probe.kind !== 'service' || !probe.instance) return false;
  try {
    process.kill(probe.instance.pid);
  } catch {
    return false;
  }
  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline) {
    if ((await inspectLocalRenderService(url, undefined, 500)).kind === 'absent') return true;
    await new Promise((done) => setTimeout(done, 100));
  }
  return false;
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
  //
  // Unless it runs older source than this installation ships. Then joining it
  // is the confusing state this module exists to remove -- a 400 for a field
  // the old build never heard of, reported as a degrade -- so an orphan is
  // replaced and anything still owned or hand-started is named and left alone.
  const probe = await inspectLocalRenderService(url, dir);
  if (probe.kind === 'busy') return url;
  if (probe.kind === 'foreign')
    throw new Error(
      `port ${localRenderServicePort()} is in use by something that is not a render service; ` +
        'set KILN_RENDER_SERVICE_PORT to move the renderer',
    );
  if (probe.kind === 'service') {
    if (!probe.stale) return url;
    if (!probe.orphaned)
      throw new Error(
        `${describeStaleService(url, probe)}; stop it with \`kiln service stop\` and it will be started again on demand`,
      );
    if (!(await terminateRenderService(url, probe)))
      throw new Error(`${describeStaleService(url, probe)} and could not be stopped`);
  }

  const state = localRenderServiceState(dir);
  if (state !== 'ready') throw new Error(explainRenderServiceState(state, dir));

  registerTeardown();
  let stderr = '';
  child = spawn(nodeBinary(), renderServiceNodeArguments(dir), {
    cwd: dir,
    env: {
      ...process.env,
      PORT: String(localRenderServicePort()),
      // The lease. The service watches this pid and exits when it is gone, which
      // is what makes an on-demand start safe on a host that is hard-killed; and
      // a later session reads it to tell an orphan from a renderer in use.
      RENDER_SERVICE_OWNER_PID: String(process.pid),
      // Loopback, where the documented manual start binds every interface. We
      // are choosing on the user's behalf here, so the narrow choice is the
      // right one; the Docker deployment sets its own HOST and is unaffected.
      HOST: '127.0.0.1',
    },
    // NEVER `inherit`: stdout is the MCP transport, and the service greets its
    // own boot on stdout. One `listening on :8000` line in that stream is a
    // protocol error for every tool call after it.
    stdio: ['ignore', 'ignore', 'pipe'],
  });
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
