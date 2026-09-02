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
 * render service, so this package installs and runs identically on a machine with no
 * GPU at all — which is why `auto` is a safe default.
 */
import type { PbrRenderPort, PbrRenderResult } from './composer/render-port';
import type { KilnToolContext } from './tools/registry';

export type RenderMode = 'auto' | 'cpu' | 'gpu';

/**
 * Where `auto` looks for a GPU renderer when no URL was given.
 *
 * Local and remote GPU are the same thing here: an HTTP service that takes GLB
 * bytes and returns PNG views. There is no in-process GPU adapter to import —
 * headless WebGPU needs Node loader hooks that Bun does not run, so the renderer
 * lives behind a socket in both cases. That is a simplification, not a limitation:
 * one code path, and a GPU on another machine works exactly like one on this one.
 */
const DEFAULT_LOCAL_PORT_URL = 'http://127.0.0.1:8000';

/** Health probe budget. Short: `auto` must not stall a CPU-only machine. */
const HEALTH_PROBE_TIMEOUT_MS = 1_500;

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
      error?: string;
    };
    if (!json.ok) throw new Error(json.error ?? 'render service reported failure');
    return {
      ok: true,
      rendererId: json.rendererId ?? 'remote',
      ...(json.views
        ? { viewsPng: json.views.map((b64) => new Uint8Array(Buffer.from(b64, 'base64'))) }
        : {}),
    };
  };
}

/**
 * Probe a render service. Never throws — a missing GPU is the expected case on
 * most machines, and `auto` degrading quietly to the CPU rasterizer is the point.
 */
async function probeRenderService(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(new URL('/health', url), {
      signal: AbortSignal.timeout(HEALTH_PROBE_TIMEOUT_MS),
    });
    if (!res.ok) return undefined;
    const json = (await res.json()) as { ok?: boolean; rendererId?: string };
    if (!json.ok) return undefined;
    return json.rendererId ?? 'unknown-renderer';
  } catch {
    return undefined;
  }
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

/**
 * Resolve the requested mode into a tool context. An absent `viewRenderPort` means
 * the CPU rasterizer — byte-identical to the behavior before ports existed.
 */
export async function buildRenderPort(
  mode: RenderMode,
  portUrl: string | undefined,
): Promise<KilnToolContext> {
  const context: KilnToolContext = {};
  const attach = (url: string, label: string): KilnToolContext => {
    context.viewRenderPort = makeRemoteRenderPort(url, process.env['KILN_RENDER_TOKEN']);
    context.viewRenderTimeoutMs = CLI_VIEW_RENDER_TIMEOUT_MS;
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

  const rendererId = await probeRenderService(DEFAULT_LOCAL_PORT_URL);
  if (rendererId) return attach(DEFAULT_LOCAL_PORT_URL, `GPU service (${rendererId})`);

  if (mode === 'gpu') {
    throw new Error(
      'no GPU render service is reachable.\n' +
        `Looked at ${DEFAULT_LOCAL_PORT_URL}; set --render-port or KILN_RENDER_PORT_URL to ` +
        'point somewhere else, or use --render auto to fall back to the CPU rasterizer.',
    );
  }

  selected.set(context, 'cpu raster (no GPU service found)');
  return context;
}
