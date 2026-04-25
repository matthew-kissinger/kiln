/**
 * Animated bake math tests. Live Playwright bake is covered by the review script.
 */

import { describe, expect, test } from 'bun:test';

import { enumerateOctahedralGrid } from '../animated-bake';

describe('enumerateOctahedralGrid', () => {
  test('returns one unit direction per view tile', () => {
    const tiles = enumerateOctahedralGrid(6, 6);
    expect(tiles).toHaveLength(36);
    for (const tile of tiles) {
      expect(Math.hypot(...tile.dir)).toBeCloseTo(1, 6);
    }
  });

  test('uses row-major tile order', () => {
    const tiles = enumerateOctahedralGrid(2, 2);
    expect(tiles.map((tile) => [tile.i, tile.j])).toEqual([
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ]);
  });

  test('rejects invalid dimensions', () => {
    expect(() => enumerateOctahedralGrid(0, 6)).toThrow();
    expect(() => enumerateOctahedralGrid(6.5, 6)).toThrow();
  });
});
