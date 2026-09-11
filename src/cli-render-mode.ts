import { createHash } from 'node:crypto';
/**
 * Render-mode resolution for the CLI: `auto | cpu | gpu`, plus a remote port URL.
 *
 * The engine itself has no opinion here — it takes an optional `PbrRenderPort` and
 * `captureViewsViaPort` owns the never-throw degrade to the CPU rasterizer. This
 * module only decides WHICH port (if any) to hand it, and it must never throw for
 * a missing or broken GPU: `auto` degrading silently to CPU is the whole point.
 *
 * `gpu` is the one mode that errors on unavailability, because a user who typed it
 * explicitly asked for a guarantee and would rather know than get a quiet downgrade.
 *
 * There is no GPU dependency to install. Both local and remote GPU are the same HTTP
 * render service — there is no in-process GPU adapter to import, because headless
 * WebGPU needs Node loader hooks that Bun does not run — so this package installs
 * and runs identically on a machine with no GPU at all, which is why `auto` is a
 * safe default. One code path, and a GPU on another machine works exactly like one
 * on this one.
 *
 * Where `auto` LOOKS for a local one, and where {@link RenderPortOptions.autoSpawn}
 * would start one, both resolve through `localRenderServiceUrl` so the two can never
 * disagree about where it lives.
 */
import type { PbrRenderPort, PbrRenderResult } from './composer/render-port';
import {
  explainRenderServiceState,
  localRenderServiceState,
  localRenderServiceUrl,
  renderServiceDir,
  startLocalRenderService,
} from './render-service-host';
import type { KilnToolContext } from './tools/registry';

export type RenderMode = 'auto' | 'cpu' | 'gpu';

/** Health probe budget. Short: `auto` must not stall a CPU-only machine. */
const HEALTH_PROBE_TIMEOUT_MS = 1_500;

/**
 * Second budget, used only after the first probe timed out on a socket that was
 * accepted. See `probeRenderService`: a renderer busy with somebody else's frame
 * is still a renderer, and one local service shared by a batch of dispatched
 * agents is the documented way to use this.
 */
const HEALTH_PROBE_BUSY_TIMEOUT_MS = 8_000;

/**
 * In-loop deadline. Far below the deadline appropriate for a post-loop artifact
 * sheet, because this render blocks the caller while it runs. See AGENTS.md — the
 * two deadlines must not be collapsed onto one value.
 */
export const CLI_VIEW_RENDER_TIMEOUT_MS = 20_000;

export function resolveRenderMode(value: string): RenderMode {
  if (value === 'auto' || value === 'cpu' || value === 'gpu') return value;
  throw new Error(`--render must be auto, cpu or gpu (got: ${value})`);
}

/** Build a port that speaks the remote render service's HTTP contract. */
export function makeRemoteRenderPort(url: string, token?: string): PbrRenderPort {
  return async (req): Promise<PbrRenderResult> => {
    const body: Record<string, unknown> = {
      glb_base64: Buffer.from(req.glb).toString('base64'),
    };
    const inputGlbSha256 = `sha256:${createHash('sha256').update(req.glb).digest('hex')}` as const;
    body['input_glb_sha256'] = inputGlbSha256;
    if (req.cameras) {
      body['cameras'] = req.cameras;
      body['width'] = req.width;
      body['height'] = req.height;
      if (req.lightingPresetId) body['lighting_preset_id'] = req.lightingPresetId;
    }
    if (req.viewDirs) body['views'] = req.viewDirs;
    if (req.size !== undefined) body['size'] = req.size;
    if (req.beautySize !== undefined) body['beauty_size'] = req.beautySize;

    const res = await fetch(new URL('/render', url), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        // The RunPod-style edge gateway consumes `Authorization`, so app-layer
        // auth rides a custom header instead.
        ...(token ? { 'x-render-token': token } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(CLI_VIEW_RENDER_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`render service returned ${res.status}`);
    const json = (await res.json()) as {
      ok?: boolean;
      rendererId?: string;
      views?: string[];
      beauty?: string;
      error?: string;
      cameras?: PbrRenderResult['cameras'];
      width?: number;
      height?: number;
      fidelity?: {
        version?: string;
        producer?: string;
        materialFaithful?: boolean;
        delivered?: string;
        degraded?: boolean;
        inputGlbSha256?: string;
        rendererId?: string;
      };
    };
    if (!json.ok) throw new Error(json.error ?? 'render service reported failure');
    return {
      ok: true,
      rendererId: json.rendererId ?? 'remote',
      ...(json.cameras ? { cameras: json.cameras, width: json.width, height: json.height } : {}),
      ...(json.fidelity?.version === 'kiln.render-fidelity.v1' &&
      json.fidelity.producer === 'kiln-render-service' &&
      json.fidelity.materialFaithful === true &&
      json.fidelity.delivered === 'full-material' &&
      json.fidelity.degraded === false &&
      json.fidelity.inputGlbSha256 === inputGlbSha256 &&
      json.fidelity.rendererId === json.rendererId
        ? { derivativeFidelity: { materialFaithful: true as const, inputGlbSha256 } }
        : {}),
      ...(json.views
        ? { viewsPng: json.views.map((b64) => new Uint8Array(Buffer.from(b64, 'base64'))) }
        : {}),
      ...(json.beauty ? { beautyPng: new Uint8Array(Buffer.from(json.beauty, 'base64')) } : {}),
    };
  };
}

/**
 * A port that gets a renderer listening on its first call, then behaves exactly
 * like {@link makeRemoteRenderPort} for the rest of the session.
 *
 * It deliberately AWAITS the start rather than failing fast and warming in the
 * background. `captureViewsViaPort` already owns a deadline for one in-loop call
 * and degrades to the CPU rasterizer when it expires, so a slow start is already
 * handled by the policy that handles a slow render -- and adding a second budget
 * here would be the duplicated degrade policy AGENTS.md forbids. A start that
 * outruns the in-loop deadline costs one CPU view; the service keeps warming and
 * the next render gets it.
 *
 * A start that FAILS is cached as failed. A renderer that could not start will
 * not start for the next view either, and re-attempting a spawn per render would
 * stall the loop this exists to serve.
 */
export function makeLazyRenderPort(start: () => Promise<string>, token?: string): PbrRenderPort {
  let resolving: Promise<PbrRenderPort> | undefined;
  return async (req) => {
    resolving ??= start().then(
      (url) => makeRemoteRenderPort(url, token),
      (err: unknown) => {
        throw new Error(
          `render service could not start: ${err instanceof Error ? err.message : String(err)}`,
        );
      },
    );
    return (await resolving)(req);
  };
}

/** Fresh attestation per capture; unknown/older/unreachable services bypass cell reuse. */
export async function probeCaptureIdentity(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(new URL('/health', url), {
      signal: AbortSignal.timeout(HEALTH_PROBE_TIMEOUT_MS),
      cache: 'no-store',
    });
    if (!response.ok) return undefined;
    const health = (await response.json()) as {
      ok?: boolean;
      rendererId?: string;
      captureIdentity?: { version?: string; fingerprint?: string; instanceId?: string };
    };
    const identity = health.captureIdentity;
    if (
      !health.ok ||
      !health.rendererId ||
      identity?.version !== 'kiln.capture-producer.v1' ||
      !/^sha256:[a-f0-9]{64}$/.test(identity.fingerprint ?? '') ||
      !identity.instanceId?.trim()
    )
      return undefined;
    return JSON.stringify([
      identity.version,
      identity.fingerprint,
      identity.instanceId,
      health.rendererId,
    ]);
  } catch {
    return undefined;
  }
}

/** One `/health` request. `busy` means the socket was accepted and then went quiet. */
type Probe = { kind: 'ok'; rendererId: string } | { kind: 'busy' } | { kind: 'absent' };

async function probeOnce(url: string, timeoutMs: number): Promise<Probe> {
  try {
    const res = await fetch(new URL('/health', url), {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return { kind: 'absent' };
    const json = (await res.json()) as { ok?: boolean; rendererId?: string };
    if (!json.ok) return { kind: 'absent' };
    return { kind: 'ok', rendererId: json.rendererId ?? 'unknown-renderer' };
  } catch (err) {
    // `AbortSignal.timeout` rejects with a TimeoutError; everything else here —
    // ECONNREFUSED, DNS, a socket hangup — arrives as a TypeError from fetch.
    const timedOut = err instanceof Error && err.name === 'TimeoutError';
    return timedOut ? { kind: 'busy' } : { kind: 'absent' };
  }
}

/**
 * Probe a render service. Never throws — a missing GPU is the expected case on
 * most machines, and `auto` degrading quietly to the CPU rasterizer is the point.
 *
 * The probe asks whether a renderer is THERE, which is not the same question as
 * whether it is free. The service renders on the GPU from a single-threaded Node
 * process, so while it is drawing somebody else's frame it accepts the socket and
 * answers nothing, and a 1.5 second budget expires. One local renderer shared by a
 * batch of dispatched agents is the documented way to use this, so that state is
 * routine rather than exceptional — and reading it as "no GPU here" silently drops
 * the whole session onto the CPU rasterizer, where every textured material draws
 * flat white and the agent cannot tell. It looks like a model with bad taste.
 *
 * Nothing listening is a different answer and still has to be fast, or `auto`
 * would stall on every CPU-only machine. It is: the kernel refuses the connection
 * in about a millisecond, which arrives here as `absent` rather than `busy`, so
 * only a socket that was actually accepted is worth waiting longer for.
 */
/**
 * Exported for `src/__tests__/cli-render-mode.test.ts`, which is the only place
 * the two budgets can be observed: `buildRenderPort` reaches the probe only on
 * the no-URL path, and that path is pinned to port 8000 on the host machine.
 */
export async function probeRenderService(url: string): Promise<string | undefined> {
  const first = await probeOnce(url, HEALTH_PROBE_TIMEOUT_MS);
  if (first.kind === 'ok') return first.rendererId;
  if (first.kind === 'absent') return undefined;
  const second = await probeOnce(url, HEALTH_PROBE_BUSY_TIMEOUT_MS);
  return second.kind === 'ok' ? second.rendererId : undefined;
}

/** What actually got selected, for honest CLI reporting. */
const selected = new WeakMap<object, string>();

export function describeRenderMode(context: KilnToolContext): string {
  return selected.get(context) ?? 'cpu raster';
}

/**
 * The honest producer line for one completed screenshot.
 *
 * `describeRenderMode` reports what was CONFIGURED. That is not the same thing as
 * what drew the pixels: `kiln_render` routes to the port only when the scene
 * actually needs PBR shading, so a correctly-skipped GPU would otherwise be
 * reported as though it had rendered. The tool output already carries the truth in
 * its `kiln.view-fidelity.v1` block; this reads it rather than restating intent.
 */
export function describeDrawnBy(output: unknown, context: KilnToolContext): string {
  const fidelity = (output as { viewFidelity?: ViewFidelityLike } | undefined)?.viewFidelity;
  if (!fidelity) return describeRenderMode(context);

  if (fidelity.materialFaithful) return `GPU ${fidelity.rendererId}`;

  // `degraded` means "this scene wanted PBR and did not get it". With no port
  // configured that is the documented default, not an incident, and reporting it
  // as a degrade would make the ordinary no-GPU path look like a failure.
  if (!context.viewRenderPort) return describeRenderMode(context);

  if (fidelity.degraded) {
    const why = fidelity.degradeReason ? `: ${fidelity.degradeReason}` : '';
    return `cpu raster (GPU degraded${why})`;
  }
  // A port was configured and the render did not degrade, so the scene simply did
  // not need PBR. Sending a flat, untextured scene to a GPU buys nothing the CPU
  // rasterizer does not already draw correctly.
  return 'cpu raster (GPU configured; scene needs no PBR shading)';
}

/** The fields of `kiln.view-fidelity.v1` this module reads. */
interface ViewFidelityLike {
  rendererId: string;
  materialFaithful: boolean;
  degraded: boolean;
  degradeReason?: string;
}

/** Host policy for {@link buildRenderPort}. Every field is opt-in. */
export interface RenderPortOptions {
  /**
   * Start the render service that ships with this installation when no renderer
   * is already listening. Off by default, and deliberately so: a one-shot CLI
   * invocation should not pay a GPU process's startup to draw one sheet, whereas
   * a long-lived MCP server amortizes it across a whole session.
   *
   * Attaching happens ONLY where a renderer could actually run. On a machine that
   * did not install one, `viewRenderPort` stays absent and the session is
   * byte-identical to one built without this option -- which is what keeps
   * `describeDrawnBy` reporting an ordinary CPU render as ordinary rather than as
   * a degrade.
   */
  autoSpawn?: boolean;
  /** Injection seam for tests: how a service gets started. */
  start?: () => Promise<string>;
  /** Injection seam for tests: where the packaged render service lives. */
  serviceDir?: string;
}

/**
 * Resolve the requested mode into a tool context. An absent `viewRenderPort` means
 * the CPU rasterizer — byte-identical to the behavior before ports existed.
 */
export async function buildRenderPort(
  mode: RenderMode,
  portUrl: string | undefined,
  options?: RenderPortOptions,
): Promise<KilnToolContext> {
  const context: KilnToolContext = mode === 'gpu' ? { viewRenderRequired: true } : {};
  const attach = (url: string, label: string): KilnToolContext => {
    context.viewRenderPort = makeRemoteRenderPort(url, process.env['KILN_RENDER_TOKEN']);
    context.viewRenderTimeoutMs = CLI_VIEW_RENDER_TIMEOUT_MS;
    context.captureCacheIdentity = () => probeCaptureIdentity(url);
    selected.set(context, label);
    return context;
  };
  const attachLazy = (start: () => Promise<string>, label: string): KilnToolContext => {
    let url: string | undefined;
    context.viewRenderPort = makeLazyRenderPort(async () => {
      url = await start();
      return url;
    }, process.env['KILN_RENDER_TOKEN']);
    context.viewRenderTimeoutMs = CLI_VIEW_RENDER_TIMEOUT_MS;
    // Nothing to attest until a producer exists. `undefined` bypasses cell reuse,
    // which is the correct reading of "no renderer has drawn anything yet".
    context.captureCacheIdentity = () => (url ? probeCaptureIdentity(url) : undefined);
    selected.set(context, label);
    return context;
  };

  if (mode === 'cpu') {
    selected.set(context, 'cpu raster');
    return context;
  }

  // An explicit URL is taken on trust: the user said where the renderer is, and a
  // health probe that fails would only turn their explicit choice into a silent
  // downgrade. `captureViewsViaPort` still degrades per-call if it does not answer.
  if (portUrl) return attach(portUrl, `GPU service (${portUrl})`);

  const envUrl = process.env['KILN_RENDER_PORT_URL'];
  if (envUrl) return attach(envUrl, `GPU service (${envUrl})`);

  const localUrl = localRenderServiceUrl();
  const rendererId = await probeRenderService(localUrl);
  if (rendererId) return attach(localUrl, `GPU service (${rendererId})`);

  // Nothing is listening. If this installation can start one, hand back a port
  // that will -- lazily, so a session that never renders a material never pays
  // for a GPU process, and so the start is not in front of the first connection.
  if (options?.autoSpawn) {
    const dir = options.serviceDir ?? renderServiceDir();
    const state = options.start ? 'ready' : localRenderServiceState(dir);
    if (state === 'ready') {
      const start = options.start ?? (() => startLocalRenderService(dir));
      return attachLazy(start, 'GPU service (started on demand)');
    }
    if (mode === 'gpu')
      throw new Error(
        `no GPU render service is reachable, and ${explainRenderServiceState(state, dir)}.\n` +
          'Set --render-port or KILN_RENDER_PORT_URL to point at one elsewhere, or use ' +
          '--render auto to fall back to the CPU rasterizer.',
      );
  }

  if (mode === 'gpu') {
    throw new Error(
      'no GPU render service is reachable.\n' +
        `Looked at ${localUrl}; set --render-port or KILN_RENDER_PORT_URL to ` +
        'point somewhere else, or use --render auto to fall back to the CPU rasterizer.',
    );
  }

  selected.set(context, 'cpu raster (no GPU service found)');
  return context;
}
