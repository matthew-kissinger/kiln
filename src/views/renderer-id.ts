/**
 * Deterministic identity of the pure-CPU rasterizer view producer.
 *
 * Mirrors the external render-service `rendererId` contract
 * ("<family>:<identity...>", e.g. "dawn-vulkan:nvidia-rtx-a4500:NVIDIA: 550.100")
 * so QA evidence and generation results can always name the honest producer of a
 * view artifact. The engine version is read from package.json ONCE at module
 * load — never per call — keeping the constant deterministic for a given build.
 */

import { readFileSync } from 'node:fs';

function engineVersion(): string {
  try {
    const raw = readFileSync(new URL('../../package.json', import.meta.url), 'utf8');
    const version = (JSON.parse(raw) as { version?: unknown }).version;
    return typeof version === 'string' && version.length > 0 ? version : 'unknown';
  } catch {
    return 'unknown';
  }
}

/** e.g. "cpu-raster:0.6.0" — the CPU rasterizer's deterministic rendererId. */
export const CPU_RASTER_RENDERER_ID = `cpu-raster:${engineVersion()}`;
