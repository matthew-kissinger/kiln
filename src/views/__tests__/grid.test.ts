/**
 * decodePng + grid compositor + CPU renderer id — the PbrRenderPort support
 * seam. PNGs for the decoder tests are hand-built per the PNG spec (all five
 * filter types, RGB + RGBA) so every unfilter branch is exercised; the decoder
 * deliberately ignores CRCs, so the builder writes zeroed ones.
 */
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

import { decodePng, encodePng } from '../png';
import { compositeCellGrid, compositeViewPngGrid, GRID_COLS, PAD, PAD_COLOR } from '../grid';
import { CPU_RASTER_RENDERER_ID } from '../renderer-id';

const SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function chunk(type: string, data: Uint8Array): Buffer {
  const out = Buffer.alloc(8 + data.length + 4); // CRC left zero — not verified
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  out.set(data, 8);
  return out;
}

/** Forward-filter one scanline (the encoder side of decodePng's unfilter). */
function filterRow(cur: Uint8Array, prior: Uint8Array, filter: number, bpp: number): Uint8Array {
  const out = new Uint8Array(cur.length);
  for (let i = 0; i < cur.length; i++) {
    const x = cur[i]!;
    const a = i >= bpp ? cur[i - bpp]! : 0;
    const b = prior[i]!;
    const c = i >= bpp ? prior[i - bpp]! : 0;
    let v: number;
    if (filter === 0) v = x;
    else if (filter === 1) v = x - a;
    else if (filter === 2) v = x - b;
    else if (filter === 3) v = x - ((a + b) >> 1);
    else {
      const p = a + b - c;
      const pa = Math.abs(p - a);
      const pb = Math.abs(p - b);
      const pc = Math.abs(p - c);
      v = x - (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
    }
    out[i] = v & 0xff;
  }
  return out;
}

function buildPng(
  pixels: Uint8Array,
  width: number,
  height: number,
  channels: 3 | 4,
  filters: number[],
): Buffer {
  const stride = width * channels;
  const raw = Buffer.alloc(height * (1 + stride));
  let prior: Uint8Array = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const f = filters[y % filters.length]!;
    const cur = pixels.subarray(y * stride, (y + 1) * stride);
    raw[y * (1 + stride)] = f;
    raw.set(filterRow(cur, prior, f, channels), y * (1 + stride) + 1);
    prior = cur;
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = channels === 4 ? 6 : 2;
  return Buffer.concat([
    Buffer.from(SIG),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', new Uint8Array(0)),
  ]);
}

/** Deterministic pseudo-gradient pixel data. */
function pixels(width: number, height: number, channels: number): Uint8Array {
  const out = new Uint8Array(width * height * channels);
  for (let i = 0; i < out.length; i++) out[i] = (i * 37 + 11) % 256;
  return out;
}

describe('decodePng', () => {
  test('round-trips encodePng output', () => {
    const rgb = pixels(5, 4, 3);
    const decoded = decodePng(encodePng(rgb, 5, 4));
    expect(decoded.width).toBe(5);
    expect(decoded.height).toBe(4);
    expect(decoded.rgb).toEqual(rgb);
  });

  test.each([[0], [1], [2], [3], [4]])('unfilters RGB scanlines with filter type %i', (f) => {
    const rgb = pixels(6, 5, 3);
    expect(decodePng(buildPng(rgb, 6, 5, 3, [f])).rgb).toEqual(rgb);
  });

  test('unfilters mixed filter types across rows', () => {
    const rgb = pixels(4, 5, 3);
    expect(decodePng(buildPng(rgb, 4, 5, 3, [0, 1, 2, 3, 4])).rgb).toEqual(rgb);
  });

  test('decodes RGBA and drops the alpha channel', () => {
    const rgba = pixels(3, 3, 4);
    const expected = new Uint8Array(3 * 3 * 3);
    for (let p = 0; p < 9; p++) {
      expected[p * 3] = rgba[p * 4]!;
      expected[p * 3 + 1] = rgba[p * 4 + 1]!;
      expected[p * 3 + 2] = rgba[p * 4 + 2]!;
    }
    expect(decodePng(buildPng(rgba, 3, 3, 4, [1, 4])).rgb).toEqual(expected);
  });

  test('rejects non-PNG bytes, unsupported formats, and corrupt streams', () => {
    expect(() => decodePng(new Uint8Array([1, 2, 3]))).toThrow('bad signature');

    const rgb = pixels(2, 2, 3);
    const png = buildPng(rgb, 2, 2, 3, [0]);

    const depth16 = Buffer.from(png);
    depth16[8 + 8 + 8] = 16; // IHDR bit depth
    expect(() => decodePng(depth16)).toThrow('unsupported PNG');

    const paletted = Buffer.from(png);
    paletted[8 + 8 + 9] = 3; // IHDR color type
    expect(() => decodePng(paletted)).toThrow('unsupported PNG');

    const interlaced = Buffer.from(png);
    interlaced[8 + 8 + 12] = 1; // IHDR interlace
    expect(() => decodePng(interlaced)).toThrow('unsupported PNG');

    const badFilter = pixels(2, 2, 3);
    const raw = Buffer.alloc(2 * (1 + 6));
    raw[0] = 7; // unknown filter type
    raw.set(badFilter.subarray(0, 6), 1);
    raw[7] = 0;
    raw.set(badFilter.subarray(6, 12), 8);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(2, 0);
    ihdr.writeUInt32BE(2, 4);
    ihdr[8] = 8;
    ihdr[9] = 2;
    const badFilterPng = Buffer.concat([
      Buffer.from(SIG),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw)),
      chunk('IEND', new Uint8Array(0)),
    ]);
    expect(() => decodePng(badFilterPng)).toThrow('unknown filter type');

    const shortRaw = Buffer.concat([
      Buffer.from(SIG),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(Buffer.from([0, 1, 2]))),
      chunk('IEND', new Uint8Array(0)),
    ]);
    expect(() => decodePng(shortRaw)).toThrow('raw bytes');

    expect(() => decodePng(Buffer.from(SIG))).toThrow('missing IHDR or IDAT');

    // Cut mid-IDAT: the chunk header fits but its declared data does not.
    const idatStart = 8 + 8 + 13 + 4; // signature + IHDR chunk
    const truncated = png.subarray(0, idatStart + 8 + 2);
    expect(() => decodePng(truncated)).toThrow('truncated chunk');
  });
});

describe('compositeCellGrid', () => {
  test('lays cells into the padded 3-column grid with the gutter color', () => {
    const size = 2;
    const red = new Uint8Array(size * size * 3);
    for (let p = 0; p < size * size; p++) red[p * 3] = 255;
    const green = new Uint8Array(size * size * 3);
    for (let p = 0; p < size * size; p++) green[p * 3 + 1] = 255;

    const { rgb, width, height } = compositeCellGrid([red, green], size);
    expect(width).toBe(GRID_COLS * size + (GRID_COLS + 1) * PAD);
    expect(height).toBe(size + 2 * PAD);

    // Gutter pixel at (0,0).
    expect([rgb[0], rgb[1], rgb[2]]).toEqual([...PAD_COLOR]);
    // Cell 0 top-left pixel at (PAD, PAD) is red.
    const c0 = (PAD * width + PAD) * 3;
    expect([rgb[c0], rgb[c0 + 1], rgb[c0 + 2]]).toEqual([255, 0, 0]);
    // Cell 1 top-left pixel at (PAD + (size+PAD), PAD) is green.
    const c1 = (PAD * width + PAD + size + PAD) * 3;
    expect([rgb[c1], rgb[c1 + 1], rgb[c1 + 2]]).toEqual([0, 255, 0]);
  });

  test('six cells make the 3x2 layout; bad input throws', () => {
    const size = 4;
    const cells = Array.from({ length: 6 }, () => new Uint8Array(size * size * 3));
    const grid = compositeCellGrid(cells, size);
    expect(grid.width).toBe(3 * size + 4 * PAD);
    expect(grid.height).toBe(2 * size + 3 * PAD);

    expect(() => compositeCellGrid([], size)).toThrow('no cells');
    expect(() => compositeCellGrid([new Uint8Array(5)], size)).toThrow('must be');
  });
});

describe('compositeViewPngGrid', () => {
  test('decodes per-view PNGs and composites the same 3x2 layout as the CPU grid', () => {
    const size = 8;
    const views = Array.from({ length: 6 }, (_, i) => {
      const rgb = new Uint8Array(size * size * 3);
      for (let p = 0; p < size * size; p++) rgb[p * 3] = i * 40;
      return new Uint8Array(encodePng(rgb, size, size));
    });
    const grid = compositeViewPngGrid(views);
    expect(grid.cellSize).toBe(size);
    expect(grid.width).toBe(3 * size + 4 * PAD);
    expect(grid.height).toBe(2 * size + 3 * PAD);

    // Round-trip the composited PNG and spot-check cell 3 (row 2, col 1).
    const decoded = decodePng(grid.png);
    const p3 = ((PAD + size + PAD) * grid.width + PAD) * 3;
    expect(decoded.rgb[p3]).toBe(120);
  });

  test('rejects an empty view list and mismatched cell sizes', () => {
    expect(() => compositeViewPngGrid([])).toThrow('no views');
    const a = new Uint8Array(encodePng(new Uint8Array(4 * 4 * 3), 4, 4));
    const b = new Uint8Array(encodePng(new Uint8Array(8 * 8 * 3), 8, 8));
    expect(() => compositeViewPngGrid([a, b])).toThrow('square');
  });
});

describe('CPU_RASTER_RENDERER_ID', () => {
  test('is the deterministic cpu-raster:<engine-version> constant', () => {
    const pkg = JSON.parse(
      readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'),
    ) as { version: string };
    expect(CPU_RASTER_RENDERER_ID).toBe(`cpu-raster:${pkg.version}`);
    expect(CPU_RASTER_RENDERER_ID).toMatch(/^[a-z0-9-]+:/);
  });
});
