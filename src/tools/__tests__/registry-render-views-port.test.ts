/**
 * In-loop GPU view-render port routing inside `runRenderViews` (the unified
 * kiln_render tool, `createKilnRenderViewsDef`).
 *
 * `sceneNeedsPbrShading` decides whether a scene needs the GPU port at all
 * (untextured, non-metal geometry never pays the round trip);
 * `captureViewsViaPort` (../../agent/generate) is the single owner of the port
 * call, its deadline, and its degrade policy; the CPU rasterizer is always the
 * fallback — absent port, false predicate, or any port failure. Follows the
 * port-stubbing pattern in ../../agent/generate.test.ts:260-288.
 */
import { describe, expect, test } from 'bun:test';

import {
  createKilnRenderViewsDef,
  type InLoopViewRender,
  type KilnRenderViewsResult,
  type KilnToolContext,
} from '../registry';
import type { PbrRenderPort, PbrRenderRequest } from '../../composer/render-port';
import {
  CPU_RASTER_RENDERER_ID,
  SIX_VIEWS,
  compositeViewPngGrid,
  encodePng,
  renderViewGrid,
} from '../../views';
import { executeKilnCode } from '../../render';

const UNTEXTURED_CODE = `
const meta = { name: 'plain-box', category: 'prop' };
function build() {
  const root = createRoot('Root');
  createPart('Body', boxGeo(1, 1, 1), gameMaterial('#8080ff'), { parent: root });
  return root;
}
`;

// A real, QA-decodable DataTexture (8-bit RGBA, srgb) — an empty `new
// THREE.Texture()` has no pixel payload and gets blocked by
// MAT_TEXTURE_DECODE_FAILED before routing is ever reached.
const TEXTURED_CODE = `
const meta = { name: 'textured-box', category: 'prop' };
function build() {
  const root = createRoot('Root');
  const mat = gameMaterial('#ffffff');
  const size = 8;
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    data[i * 4] = 200;
    data[i * 4 + 1] = 100;
    data[i * 4 + 2] = 50;
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  mat.map = tex;
  createPart('Body', boxGeo(1, 1, 1), mat, { parent: root });
  return root;
}
`;

const METAL_CODE = `
const meta = { name: 'metal-box', category: 'prop' };
function build() {
  const root = createRoot('Root');
  createPart('Body', boxGeo(1, 1, 1), gameMaterial('#c0c0c0', { metalness: 0.6 }), { parent: root });
  return root;
}
`;

/** 6 solid-color per-view PNGs at the CPU path's default 384px cell size, so a
 *  GPU-composited grid is byte-comparable to what the CPU path would produce
 *  for the same view count/columns. */
function stubViewPngs(size = 384): Uint8Array[] {
  return Array.from({ length: 6 }, (_, i) => {
    const rgb = new Uint8Array(size * size * 3);
    for (let p = 0; p < size * size; p++) rgb[p * 3] = 20 + i * 30;
    return new Uint8Array(encodePng(rgb, size, size));
  });
}

describe('kiln_render in-loop GPU port routing', () => {
  test('no port injected: CPU raster runs, onViewsRendered reports cpu-raster:* and degraded:false', async () => {
    const events: InLoopViewRender[] = [];
    const def = createKilnRenderViewsDef({ onViewsRendered: (e) => events.push(e) });
    const out = (await def.run({ code: UNTEXTURED_CODE })) as KilnRenderViewsResult;

    expect(out.ok).toBe(true);
    expect(out.pngBase64).toBeDefined();
    expect(events).toHaveLength(1);
    expect(events[0]!.renderer).toBe(CPU_RASTER_RENDERER_ID);
    expect(events[0]!.renderer).toMatch(/^cpu-raster:/);
    expect(events[0]!.degraded).toBe(false);
    expect(events[0]!.neededPbr).toBe(false);
  });

  test('port injected + untextured metalness-0 scene: port is never called, CPU still draws', async () => {
    const events: InLoopViewRender[] = [];
    const requests: PbrRenderRequest[] = [];
    const port: PbrRenderPort = async (req) => {
      requests.push(req);
      return { ok: true, rendererId: 'gpu:test', viewsPng: stubViewPngs() };
    };
    const def = createKilnRenderViewsDef({
      viewRenderPort: port,
      onViewsRendered: (e) => events.push(e),
    });
    const out = (await def.run({ code: UNTEXTURED_CODE })) as KilnRenderViewsResult;

    expect(out.ok).toBe(true);
    expect(requests).toHaveLength(0);
    expect(events).toHaveLength(1);
    expect(events[0]!.renderer).toBe(CPU_RASTER_RENDERER_ID);
    expect(events[0]!.degraded).toBe(false);
    expect(events[0]!.neededPbr).toBe(false);
  });

  test('port injected + scene with a bound texture: port IS called, its PNG is what comes back', async () => {
    const viewsPng = stubViewPngs();
    const events: InLoopViewRender[] = [];
    const requests: PbrRenderRequest[] = [];
    const port: PbrRenderPort = async (req) => {
      requests.push(req);
      return { ok: true, rendererId: 'dawn-vulkan:test-gpu:1.0', viewsPng };
    };
    const def = createKilnRenderViewsDef({
      viewRenderPort: port,
      onViewsRendered: (e) => events.push(e),
    });
    const out = (await def.run({ code: TEXTURED_CODE })) as KilnRenderViewsResult;

    expect(out.ok).toBe(true);
    expect(requests).toHaveLength(1);
    expect(requests[0]!.viewDirs).toHaveLength(6);
    expect(requests[0]!.size).toBe(384);

    const expected = compositeViewPngGrid(viewsPng, 3, SIX_VIEWS).png;
    expect(Buffer.compare(Buffer.from(out.pngBase64!, 'base64'), expected)).toBe(0);

    expect(events).toHaveLength(1);
    expect(events[0]!.renderer).toBe('dawn-vulkan:test-gpu:1.0');
    expect(events[0]!.degraded).toBe(false);
    expect(events[0]!.neededPbr).toBe(true);
  });

  test('port injected + untextured metalness>0 scene: port IS called (the metal case)', async () => {
    const requests: PbrRenderRequest[] = [];
    const port: PbrRenderPort = async (req) => {
      requests.push(req);
      return { ok: true, rendererId: 'gpu:test', viewsPng: stubViewPngs() };
    };
    const def = createKilnRenderViewsDef({ viewRenderPort: port });
    const out = (await def.run({ code: METAL_CODE })) as KilnRenderViewsResult;

    expect(out.ok).toBe(true);
    expect(requests).toHaveLength(1);
  });

  test('port returns ok:false: CPU fallback draws, degraded:true with the reason, result stays ok:true', async () => {
    const events: InLoopViewRender[] = [];
    const port: PbrRenderPort = async () => ({
      ok: false,
      rendererId: 'gpu:test',
      error: 'device lost',
    });
    const def = createKilnRenderViewsDef({
      viewRenderPort: port,
      onViewsRendered: (e) => events.push(e),
    });
    const out = (await def.run({ code: TEXTURED_CODE })) as KilnRenderViewsResult;

    expect(out.ok).toBe(true);
    expect(out.pngBase64).toBeDefined();
    expect(events).toHaveLength(1);
    expect(events[0]!.renderer).toBe(CPU_RASTER_RENDERER_ID);
    expect(events[0]!.degraded).toBe(true);
    expect(events[0]!.degradedReason).toContain('device lost');
    expect(events[0]!.neededPbr).toBe(true);
  });

  test('port throws: falls back to CPU, no throw escapes the tool', async () => {
    const events: InLoopViewRender[] = [];
    const port: PbrRenderPort = async () => {
      throw new Error('GPU service unreachable');
    };
    const def = createKilnRenderViewsDef({
      viewRenderPort: port,
      onViewsRendered: (e) => events.push(e),
    });
    const out = (await def.run({ code: TEXTURED_CODE })) as KilnRenderViewsResult;

    expect(out.ok).toBe(true);
    expect(out.pngBase64).toBeDefined();
    expect(events[0]!.degraded).toBe(true);
    expect(events[0]!.degradedReason).toContain('GPU service unreachable');
  });

  test('port never resolves: the in-loop deadline trips and falls back to CPU', async () => {
    const events: InLoopViewRender[] = [];
    const port: PbrRenderPort = () => new Promise(() => {});
    const def = createKilnRenderViewsDef({
      viewRenderPort: port,
      viewRenderTimeoutMs: 25,
      onViewsRendered: (e) => events.push(e),
    });
    const out = (await def.run({ code: TEXTURED_CODE })) as KilnRenderViewsResult;

    expect(out.ok).toBe(true);
    expect(out.pngBase64).toBeDefined();
    expect(events[0]!.degraded).toBe(true);
    expect(events[0]!.degradedReason).toContain('timed out after 25ms');
  });

  test('an onViewsRendered callback that throws does not fail the render', async () => {
    const context: KilnToolContext = {
      onViewsRendered: () => {
        throw new Error('host bookkeeping bug');
      },
    };
    const def = createKilnRenderViewsDef(context);
    const out = (await def.run({ code: UNTEXTURED_CODE })) as KilnRenderViewsResult;

    expect(out.ok).toBe(true);
    expect(out.pngBase64).toBeDefined();
  });

  test('GPU path view names and grid dimensions match the CPU path for the same capture config', async () => {
    const viewsPng = stubViewPngs();
    const port: PbrRenderPort = async () => ({ ok: true, rendererId: 'gpu:test', viewsPng });
    const def = createKilnRenderViewsDef({ viewRenderPort: port });
    const gpuOut = (await def.run({ code: TEXTURED_CODE })) as KilnRenderViewsResult;

    const { root } = await executeKilnCode(TEXTURED_CODE);
    const cpuGrid = await renderViewGrid(root);

    expect(gpuOut.views).toEqual(cpuGrid.views);
    expect(gpuOut.gridWidth).toBe(cpuGrid.width);
    expect(gpuOut.gridHeight).toBe(cpuGrid.height);
    expect(gpuOut.capture).toEqual(cpuGrid.capture);
  });
});
