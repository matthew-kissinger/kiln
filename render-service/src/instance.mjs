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
 * `ownerPid` is the process that started this one on demand. It exists for two
 * reasons. A host that finds an orphan running stale source may replace it,
 * where it must not touch a service somebody started by hand or is still
 * using. And on Windows a hard-killed host cannot run its exit hook, so the
 * service watches the owner itself and exits when it is gone (see
 * {@link startOwnerWatch}); a service started by hand has no owner and never
 * exits on its own.
 *
 * The engine mirrors {@link fingerprintSourceDir} in `src/render-service-host.ts`
 * and a test there fails if the two ever disagree on a directory.
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

/**
 * Poll the owner and call `onOrphaned` exactly once when it is gone.
 *
 * Injected timers and liveness so the rule is testable in milliseconds without
 * a real process to kill. Returns the stop function.
 */
export function startOwnerWatch({
  ownerPid,
  onOrphaned,
  isAlive = processIsAlive,
  intervalMs = 2_000,
  setTimer = setInterval,
  clearTimer = clearInterval,
}) {
  let fired = false;
  const handle = setTimer(() => {
    if (fired || isAlive(ownerPid)) return;
    fired = true;
    clearTimer(handle);
    onOrphaned(ownerPid);
  }, intervalMs);
  // Never the reason the process stays up: the listening socket is.
  if (typeof handle?.unref === 'function') handle.unref();
  return () => clearTimer(handle);
}

/** The `instance` block of `/health`. Frozen at boot; nothing in it is a secret. */
export function describeInstance({ pid, ownerPid, startedAt, sourceDir, sourceFingerprint }) {
  return Object.freeze({
    version: 'kiln.render-service-instance.v1',
    pid,
    ownerPid: ownerPid ?? null,
    startedAt,
    sourceDir,
    sourceFingerprint,
  });
}
