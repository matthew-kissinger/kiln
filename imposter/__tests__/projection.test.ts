/**
 * Projection math tests — pure, no WebGL, no Chromium.
 */

import { describe, expect, test } from 'bun:test';

import {
  dirFromAzEl,
  enumerateTiles,
  resolveLayout,
} from '../projection';

function unit(v: [number, number, number]): boolean {
  const len = Math.hypot(v[0], v[1], v[2]);
  return Math.abs(len - 1) < 1e-6;
}

describe('resolveLayout', () => {
  test('8 / hemi-y -> 4×2 with 4 azimuths and 2 elevations', () => {
    const layout = resolveLayout(8, 'hemi-y');
    expect(layout.tilesX).toBe(4);
    expect(layout.tilesY).toBe(2);
    expect(layout.azimuths).toHaveLength(4);
    expect(layout.elevations).toHaveLength(2);
    // Top row is HIGHER elevation than bottom row.
    expect(layout.elevations[0]!).toBeGreaterThan(layout.elevations[1]!);
  });

  test('16 / y -> 8×2 full sphere (one above, one below horizon)', () => {
    const layout = resolveLayout(16, 'y');
    expect(layout.tilesX).toBe(8);
    expect(layout.tilesY).toBe(2);
    expect(layout.elevations[0]!).toBeGreaterThan(0);
    expect(layout.elevations[1]!).toBeLessThan(0);
  });

  test('16 / hemi-y -> 4×4 hemi', () => {
    const layout = resolveLayout(16, 'hemi-y');
    expect(layout.tilesX).toBe(4);
    expect(layout.tilesY).toBe(4);
    // All elevations strictly above the horizon.
    for (const e of layout.elevations) expect(e).toBeGreaterThan(0);
  });

  test('32 / hemi-y -> 8×4', () => {
    const layout = resolveLayout(32, 'hemi-y');
    expect(layout.tilesX).toBe(8);
    expect(layout.tilesY).toBe(4);
  });

  test('rejects 8 / y', () => {
    expect(() => resolveLayout(8, 'y')).toThrow(/hemi-y/);
  });

  test('rejects 32 / y', () => {
    expect(() => resolveLayout(32, 'y')).toThrow(/hemi-y/);
  });
});

describe('dirFromAzEl', () => {
  test('azimuth 0, elevation 0 = +X (asset forward)', () => {
    const d = dirFromAzEl(0, 0);
    expect(d[0]).toBeCloseTo(1, 6);
    expect(d[1]).toBeCloseTo(0, 6);
    expect(d[2]).toBeCloseTo(0, 6);
  });

  test('azimuth pi/2, elevation 0 = +Z (asset right)', () => {
    const d = dirFromAzEl(Math.PI / 2, 0);
    expect(d[0]).toBeCloseTo(0, 6);
    expect(d[1]).toBeCloseTo(0, 6);
    expect(d[2]).toBeCloseTo(1, 6);
  });

  test('elevation pi/2 = +Y (zenith)', () => {
    const d = dirFromAzEl(0, Math.PI / 2);
    expect(d[1]).toBeCloseTo(1, 6);
  });

  test('arbitrary (az, el) returns a unit vector', () => {
    for (const az of [0.3, 1.2, 2.5, -1.7]) {
      for (const el of [0.1, 0.7, -0.4]) {
        expect(unit(dirFromAzEl(az, el))).toBe(true);
      }
    }
  });
});

describe('enumerateTiles', () => {
  test('16 / hemi-y yields exactly 16 unique unit directions', () => {
    const layout = resolveLayout(16, 'hemi-y');
    const tiles = enumerateTiles(layout);
    expect(tiles).toHaveLength(16);
    for (const t of tiles) expect(unit(t.dir)).toBe(true);

    // Each tile's (i,j) is unique.
    const keys = new Set(tiles.map((t) => `${t.i},${t.j}`));
    expect(keys.size).toBe(16);
  });

  test('row-major order: first tile is (0,0) — top-left, highest elevation', () => {
    const layout = resolveLayout(16, 'hemi-y');
    const tiles = enumerateTiles(layout);
    expect(tiles[0]!.i).toBe(0);
    expect(tiles[0]!.j).toBe(0);
    // Top row == highest elevation.
    expect(tiles[0]!.el).toBe(Math.max(...layout.elevations));
  });

  test('tile count matches angle count for every supported combo', () => {
    expect(enumerateTiles(resolveLayout(8, 'hemi-y'))).toHaveLength(8);
    expect(enumerateTiles(resolveLayout(16, 'y'))).toHaveLength(16);
    expect(enumerateTiles(resolveLayout(16, 'hemi-y'))).toHaveLength(16);
    expect(enumerateTiles(resolveLayout(32, 'hemi-y'))).toHaveLength(32);
  });
});
