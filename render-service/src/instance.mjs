/**
 * Who this process is, for a host that has to decide whether to join it,
 * replace it, or leave it alone.
 *
 * The service listens on one shared port per machine, and the host that finds
 * something listening there has three questions it could not answer before:
 * is it a render service at all, is it running the source that is on disk, and
 * is anyone still using it. `/health` now carries the answers as `instance`, so
 * the socket itself is the registry -- there is no lease file that could
 * disagree with what is actually listening.
 *
 * `ownerPid` records who initiated the process, but never grants lifetime
 * authority over other clients. Managed services expire only after bounded
 * inactivity with no admitted work. Manual services are explicitly long-lived.
 *
 * The host imports this source fingerprint and the shared build identity helper
 * so readiness and health compare the same source and dependency contract.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * A digest of every file under `dir`, in sorted relative-path order, skipping
 * `node_modules`. Path, length and bytes all enter the hash, so a rename, a
 * truncation and an edit each change it. Deliberately NOT the capture-identity
 * fingerprint: that one includes the installed renderer packages, the Node
 * version and the adapter, none of which the engine can compute for itself.
 */
export function fingerprintSourceDir(dir) {
  const hash = createHash('sha256');
  hash.update('kiln.render-service-source.v1');
  const visit = (path) => {
    if (statSync(path).isDirectory()) {
      for (const name of readdirSync(path).sort()) {
        if (name === 'node_modules') continue;
        visit(join(path, name));
      }
      return;
    }
    const bytes = readFileSync(path);
    hash.update(JSON.stringify([relative(dir, path).replaceAll('\\', '/'), bytes.length]));
    hash.update(bytes);
  };
  visit(dir);
  return `sha256:${hash.digest('hex')}`;
}

/** The owner pid from the environment, or undefined when nothing valid was given. */
export function parseOwnerPid(raw) {
  const pid = Number(raw);
  return Number.isInteger(pid) && pid > 0 ? pid : undefined;
}

/** Whether `pid` is a live process. EPERM means it exists and is not ours to signal. */
export function processIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === 'EPERM';
  }
}

export const DEFAULT_MANAGED_IDLE_MS = 300000;

export function serviceLifecycleOptions(env = {}) {
  const mode =
    env.RENDER_SERVICE_MODE ?? (parseOwnerPid(env.RENDER_SERVICE_OWNER_PID) ? 'managed' : 'manual');
  if (!['managed', 'manual'].includes(mode))
    throw new RangeError('RENDER_SERVICE_MODE must be managed or manual');
  const idleTimeoutMs = Number(env.RENDER_SERVICE_IDLE_MS ?? DEFAULT_MANAGED_IDLE_MS);
  if (!Number.isSafeInteger(idleTimeoutMs) || idleTimeoutMs < 1 || idleTimeoutMs > 3600000)
    throw new RangeError('RENDER_SERVICE_IDLE_MS must be an integer in [1,3600000]');
  return { mode, idleTimeoutMs };
}

/** Only admitted work extends lifetime. Health polling cannot hold a GPU forever. */
export function createServiceLifecycle({
  mode = 'manual',
  idleTimeoutMs = DEFAULT_MANAGED_IDLE_MS,
  onIdle,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
}) {
  serviceLifecycleOptions({ RENDER_SERVICE_MODE: mode, RENDER_SERVICE_IDLE_MS: idleTimeoutMs });
  let active = 0;
  let timer;
  let stopped = false;
  let generation = 0;
  const cancel = () => {
    generation++;
    if (timer !== undefined) clearTimer(timer);
    timer = undefined;
  };
  const arm = () => {
    cancel();
    if (mode !== 'managed' || stopped || active) return;
    const current = generation;
    timer = setTimer(() => {
      if (current !== generation || stopped || active) return;
      stopped = true;
      cancel();
      onIdle();
    }, idleTimeoutMs);
    timer?.unref?.();
  };
  arm();
  return Object.freeze({
    setActivity(count) {
      if (!Number.isSafeInteger(count) || count < 0)
        throw new RangeError('activity must be a nonnegative integer');
      if (stopped) return;
      const changed = active !== count;
      active = count;
      if (active) cancel();
      else if (changed) arm();
    },
    stop() {
      stopped = true;
      cancel();
    },
  });
}

/** The `instance` block of `/health`. Frozen at boot; nothing in it is a secret. */
export function describeInstance({
  pid,
  ownerPid,
  startedAt,
  sourceDir,
  sourceFingerprint,
  mode = 'manual',
  idleTimeoutMs = DEFAULT_MANAGED_IDLE_MS,
}) {
  return Object.freeze({
    version: 'kiln.render-service-instance.v2',
    pid,
    ownerPid: ownerPid ?? null,
    mode,
    idleTimeoutMs: mode === 'managed' ? idleTimeoutMs : null,
    startedAt,
    sourceDir,
    sourceFingerprint,
  });
}
