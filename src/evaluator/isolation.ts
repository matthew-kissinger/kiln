import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RenderGlbOptions, RenderResult } from '../render';
import {
  EvaluatorSubprocessError,
  type EvaluatorProcessLaunch,
  type EvaluatorSubprocessControls,
  renderGLBViaProcessLaunch,
  sanitizedEvaluatorEnv,
} from './subprocess';

const DEFAULT_RUNTIME_ROOT = '/app';
const DEFAULT_BWRAP_PATH = '/usr/local/bin/bwrap';
const DEFAULT_SETPRIV_PATH = '/usr/bin/setpriv';
const DEFAULT_PRLIMIT_PATH = '/usr/bin/prlimit';
const DEFAULT_NODE_PATH = '/usr/local/bin/node';
const READINESS_VERSION = 'kiln.evaluator.isolation-readiness.v1';
const PROBE_DEADLINE_MS = 8_000;
const READINESS_CHECKS = [
  'user-namespace',
  'no-new-privileges',
  'capabilities-empty',
  'environment-exact',
  'product-filesystem-denied',
  'host-filesystem-denied',
  'runtime-filesystem-read-only',
  'network-namespace-empty',
  'metadata-and-local-network-denied',
  'generated-capabilities-denied',
] as const;

export interface IsolatedEvaluatorHost {
  platform?: NodeJS.Platform;
  runtimeRoot?: string;
  bwrapPath?: string;
  setprivPath?: string;
  prlimitPath?: string;
  nodePath?: string;
  pathExists?: (path: string) => boolean;
}

export interface IsolatedEvaluatorControls extends EvaluatorSubprocessControls {
  host?: IsolatedEvaluatorHost;
}

export interface EvaluatorIsolationReadiness {
  version: typeof READINESS_VERSION;
  mode: 'isolated';
  checks: readonly string[];
}

function isolationUnavailable(): never {
  throw new EvaluatorSubprocessError('ISOLATION_UNAVAILABLE', 'Isolated evaluator is unavailable.');
}

function requiredAbsolutePath(value: string): string {
  if (!posix.isAbsolute(value) || posix.normalize(value) !== value) isolationUnavailable();
  return value;
}

function requiredRuntimeRoot(value: string): string {
  const root = requiredAbsolutePath(value);
  if (root !== DEFAULT_RUNTIME_ROOT) isolationUnavailable();
  return root;
}

function workerInsideRuntime(workerPath: string, runtimeRoot: string): string {
  const normalized = requiredAbsolutePath(workerPath);
  const packageRoot = posix.join(runtimeRoot, 'node_modules') + posix.sep;
  if (!normalized.startsWith(packageRoot)) isolationUnavailable();
  return normalized;
}

function runtimeMounts(runtimeRoot: string, pathExists: (path: string) => boolean): string[] {
  const mounts = ['/usr', '/lib', '/lib64', posix.join(runtimeRoot, 'node_modules')];
  const existing = mounts.filter((path) => pathExists(path));
  if (!existing.includes('/usr') || !existing.includes(posix.join(runtimeRoot, 'node_modules'))) {
    isolationUnavailable();
  }
  return existing;
}

/**
 * Build the exact Linux process boundary used by production AgentCore images.
 * The outer image runs as a non-root user. setpriv removes every inherited
 * capability and locks no-new-privs before bubblewrap creates fresh user, PID,
 * network, mount, IPC, UTS, and cgroup namespaces. Only the language runtime
 * and installed dependency tree are mounted read-only; scratch is tmpfs.
 */
export function isolatedEvaluatorLaunch(
  workerPath: string,
  host: IsolatedEvaluatorHost = {},
): EvaluatorProcessLaunch {
  const platform = host.platform ?? process.platform;
  if (platform !== 'linux') isolationUnavailable();
  const runtimeRoot = requiredRuntimeRoot(host.runtimeRoot ?? DEFAULT_RUNTIME_ROOT);
  const pathExists = host.pathExists ?? existsSync;
  const bwrapPath = requiredAbsolutePath(host.bwrapPath ?? DEFAULT_BWRAP_PATH);
  const setprivPath = requiredAbsolutePath(host.setprivPath ?? DEFAULT_SETPRIV_PATH);
  const prlimitPath = requiredAbsolutePath(host.prlimitPath ?? DEFAULT_PRLIMIT_PATH);
  const nodePath = requiredAbsolutePath(host.nodePath ?? DEFAULT_NODE_PATH);
  for (const executable of [bwrapPath, setprivPath, prlimitPath, nodePath]) {
    if (!pathExists(executable)) isolationUnavailable();
  }
  const resolvedWorkerPath = workerInsideRuntime(workerPath, runtimeRoot);
  if (!pathExists(resolvedWorkerPath)) isolationUnavailable();

  const bwrapArgs = [
    '--unshare-all',
    '--die-with-parent',
    '--new-session',
    '--disable-userns',
    '--cap-drop',
    'ALL',
    '--clearenv',
    '--setenv',
    'NODE_ENV',
    'production',
    '--setenv',
    'NO_COLOR',
    '1',
    '--proc',
    '/proc',
    '--dev',
    '/dev',
    '--tmpfs',
    '/tmp',
    '--dir',
    runtimeRoot,
    '--dir',
    posix.join(runtimeRoot, 'node_modules'),
  ];
  for (const mount of runtimeMounts(runtimeRoot, pathExists)) {
    bwrapArgs.push('--ro-bind', mount, mount);
  }
  bwrapArgs.push(
    '--chdir',
    runtimeRoot,
    '--preserve-fds',
    '1',
    '--',
    prlimitPath,
    '--cpu=65:65',
    '--as=6442450944:6442450944',
    '--fsize=100663296:100663296',
    '--nofile=64:64',
    '--nproc=64:64',
    '--',
    nodePath,
    '--max-old-space-size=512',
    '--disable-proto=throw',
    '--import',
    'tsx',
    resolvedWorkerPath,
  );

  return {
    command: setprivPath,
    args: [
      '--no-new-privs',
      '--inh-caps=-all',
      '--ambient-caps=-all',
      '--bounding-set=-all',
      '--',
      bwrapPath,
      ...bwrapArgs,
    ],
    // The wrapper receives no product/provider environment. bubblewrap clears
    // even this two-key environment before creating the worker environment.
    env: sanitizedEvaluatorEnv({}),
    detached: true,
  };
}

export async function renderGLBViaIsolatedEvaluator(
  code: string,
  options: RenderGlbOptions = {},
  controls: IsolatedEvaluatorControls = {},
): Promise<RenderResult> {
  const workerPath = fileURLToPath(new URL('./worker.ts', import.meta.url));
  const launch = isolatedEvaluatorLaunch(workerPath, controls.host);
  const { host: _, ...processControls } = controls;
  return renderGLBViaProcessLaunch(code, options, processControls, launch);
}

function strictReadinessResult(value: unknown): EvaluatorIsolationReadiness {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) isolationUnavailable();
  const record = value as Record<string, unknown>;
  if (
    Object.keys(record).sort().join(',') !== 'checks,mode,version' ||
    record.version !== READINESS_VERSION ||
    record.mode !== 'isolated' ||
    !Array.isArray(record.checks) ||
    record.checks.length !== READINESS_CHECKS.length ||
    record.checks.join(',') !== READINESS_CHECKS.join(',')
  ) {
    isolationUnavailable();
  }
  return record as unknown as EvaluatorIsolationReadiness;
}

/** Fail-closed boot/readiness proof. Package presence alone is not accepted. */
export async function assertIsolatedEvaluatorReady(
  host: IsolatedEvaluatorHost = {},
): Promise<EvaluatorIsolationReadiness> {
  if (typeof process.getuid !== 'function' || process.getuid() === 0) isolationUnavailable();
  const probePath = fileURLToPath(new URL('./probe-worker.ts', import.meta.url));
  const launch = isolatedEvaluatorLaunch(probePath, host);
  return await new Promise<EvaluatorIsolationReadiness>((resolve, reject) => {
    const child = spawn(launch.command, launch.args, {
      env: launch.env,
      windowsHide: true,
      detached: true,
      stdio: ['ignore', 'ignore', 'pipe', 'pipe'],
    });
    const protocol = child.stdio[3];
    const chunks: Buffer[] = [];
    let bytes = 0;
    let settled = false;
    const fail = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(
        new EvaluatorSubprocessError(
          'ISOLATION_UNAVAILABLE',
          'Isolated evaluator readiness check failed.',
        ),
      );
    };
    const timer = setTimeout(() => {
      try {
        if (child.pid) process.kill(-child.pid, 'SIGKILL');
      } catch {}
      fail();
    }, PROBE_DEADLINE_MS);
    if (!protocol) {
      fail();
      return;
    }
    protocol.on('data', (chunk: Buffer) => {
      bytes += chunk.byteLength;
      if (bytes > 16 * 1024) {
        try {
          if (child.pid) process.kill(-child.pid, 'SIGKILL');
        } catch {}
        fail();
        return;
      }
      chunks.push(Buffer.from(chunk));
    });
    child.once('error', fail);
    child.once('close', (code) => {
      if (settled) return;
      try {
        if (code !== 0 || chunks.length === 0) return fail();
        const result = strictReadinessResult(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        settled = true;
        clearTimeout(timer);
        resolve(result);
      } catch {
        fail();
      }
    });
  });
}
