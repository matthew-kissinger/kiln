/**
 * Where this service is allowed to listen, and what that costs the operator.
 *
 * One rule: **the bind address decides whether auth is required.** Loopback is
 * free because the operating system is the boundary; anything wider needs a
 * token, and a missing one refuses the boot rather than warning about it.
 *
 * Refusing is this file's neighbour's policy, not a new one. `server.mjs` aborts
 * on a software adapter so that a driver regression yields a service which will
 * not start, never one that quietly renders everything on CPU. The same reasoning
 * applies here: a warning on the stderr of a backgrounded process is not a
 * control, and the failure it precedes is somebody else's GPU time.
 *
 * What is reachable on an exposed bind is why this matters. `POST /render` takes a
 * 48 MB GLB, parses it with three.js and hands the buffers to Dawn and a native
 * Vulkan driver, on a queue that renders one frame at a time -- so a single caller
 * can hold the GPU indefinitely, and an untrusted binary-asset parser sits in
 * front of a kernel driver with nothing in between. That is the shape of
 * CVE-2026-7482, where a crafted model file drove a heap overread in a local
 * inference server that ~175k operators had put on the public internet. Their
 * default was loopback and they overrode it; ours, until this module, was to
 * expose by default.
 */

/**
 * Addresses that reach only this host. `0.0.0.0` and `::` are deliberately NOT
 * here: they are wildcards, not loopback, and treating an unspecified bind as
 * local is the exact mistake this module exists to prevent.
 */
const LOOPBACK = Object.freeze(['127.0.0.1', 'localhost', '::1', '[::1]']);

/** Bound when nothing asked for anything wider. */
export const DEFAULT_HOST = '127.0.0.1';

/**
 * Decide the bind address and whether it is exposed.
 *
 * @param {{host?: string, token?: string, allowUnauthenticated?: string}} env
 *   Raw environment values, unnormalized -- this function owns the trimming so a
 *   caller cannot disagree with it about what an empty string means.
 * @returns {{host: string, exposed: boolean}}
 * @throws {Error} When an exposed bind has no token and no explicit waiver. The
 *   message is the operator's whole instruction set, because it is the only thing
 *   they will see before the process exits.
 */
export function resolveBindPolicy(env = {}) {
  const host = (env.host ?? '').trim() || DEFAULT_HOST;
  const token = (env.token ?? '').trim();
  const waived = (env.allowUnauthenticated ?? '').trim() === '1';
  const exposed = !LOOPBACK.includes(host.toLowerCase());

  if (exposed && !token && !waived) {
    throw new Error(
      `HOST=${host} reaches this machine from the network, and RENDER_SERVICE_TOKEN is unset.\n` +
        'POST /render accepts a 48 MB GLB and renders it on the GPU, one frame at a time, so an ' +
        'unauthenticated exposed bind gives any caller on that network your GPU and a binary parser.\n' +
        'Set RENDER_SERVICE_TOKEN to require auth, unset HOST to listen on loopback only, or set ' +
        'RENDER_SERVICE_ALLOW_UNAUTHENTICATED=1 if something in front of this process already ' +
        'authenticates for it.',
    );
  }

  return { host, exposed };
}

/**
 * The one line the operator reads on a successful boot.
 *
 * It names the reach and the auth state together, because either alone is
 * misleading: "listening on 0.0.0.0:8000" hides whether anyone can use it, and
 * "auth required" hides whether anyone can reach it.
 */
export function describeBind({ host, exposed }, { token, allowUnauthenticated } = {}) {
  const auth = (token ?? '').trim()
    ? 'token required'
    : (allowUnauthenticated ?? '').trim() === '1'
      ? 'UNAUTHENTICATED by explicit waiver'
      : 'no auth needed (loopback only)';
  return `${host} (${exposed ? 'reachable from the network' : 'this machine only'}, ${auth})`;
}
