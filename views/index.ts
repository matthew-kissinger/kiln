/**
 * Six-view grid rendering for the Kiln vision loop.
 *
 * Renders a scene (or a Kiln program) to a 3x2 grid PNG of orthographic
 * views — Front / Right / Back / Left | Top / 3-4 — using the pure-CPU
 * rasterizer in ./raster.ts. This is what the agent sees via the
 * kiln_screenshot tool and what ships as the views.png artifact.
 *
 * Grid order (stated in tool text instead of baked-in labels):
 *   row 1: Front, Right, Back
 *   row 2: Left,  Top,   3/4
 */

import { rasterizeView, SIX_VIEWS, type RasterOptions, type ViewSpec } from './raster';
import { encodePng } from './png';

export { rasterizeView, SIX_VIEWS, coverage } from './raster';
export type { RasterOptions, ViewSpec } from './raster';
export { encodePng } from './png';

const PAD = 4;
const PAD_COLOR: [number, number, number] = [10, 11, 13];

export interface ViewGridResult {
  png: Buffer;
  width: number;
  height: number;
  /** View names in grid order (row-major). */
  views: string[];
}

export interface ViewGridOptions extends RasterOptions {
  views?: ViewSpec[];
}

/** Render a (possibly sandbox-created) Three.js scene root into the 3x2 grid. */
export async function renderViewGrid(
  root: unknown,
  opts: ViewGridOptions = {}
): Promise<ViewGridResult> {
  const size = opts.size ?? 256;
  const views = opts.views ?? SIX_VIEWS;
  const cols = 3;
  const rows = Math.ceil(views.length / cols);
  const width = cols * size + (cols + 1) * PAD;
  const height = rows * size + (rows + 1) * PAD;

  const grid = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    grid[i * 3] = PAD_COLOR[0];
    grid[i * 3 + 1] = PAD_COLOR[1];
    grid[i * 3 + 2] = PAD_COLOR[2];
  }

  for (let vi = 0; vi < views.length; vi++) {
    const cell = rasterizeView(root, views[vi]!.dir, { size, backfaceCull: opts.backfaceCull });
    const col = vi % cols;
    const row = Math.floor(vi / cols);
    const x0 = PAD + col * (size + PAD);
    const y0 = PAD + row * (size + PAD);
    for (let y = 0; y < size; y++) {
      const src = y * size * 3;
      const dst = ((y0 + y) * width + x0) * 3;
      grid.set(cell.subarray(src, src + size * 3), dst);
    }
  }

  return {
    png: encodePng(grid, width, height),
    width,
    height,
    views: views.map((v) => v.name),
  };
}

/** Execute a Kiln program and render its scene into the 3x2 grid. */
export async function renderCodeViewGrid(
  code: string,
  opts: ViewGridOptions = {}
): Promise<ViewGridResult> {
  const { executeKilnCode } = await import('../render');
  const { root } = await executeKilnCode(code);
  return renderViewGrid(root, opts);
}
