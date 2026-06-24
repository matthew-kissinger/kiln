/**
 * Composer overlap-validation tests — pure geometry, no LLM, no network.
 *
 * Pins the two bugs that made scene assets collide: footprint underestimation
 * and (the big one) placing a non-centred mesh by its origin as if the origin
 * were its centre. `worldAabbFromLocal` + `findPlacementOverlaps` must catch it.
 */
import { describe, expect, test } from 'bun:test';

import {
  findOverlaps,
  findPlacementOverlaps,
  isOverlapFree,
  type PlacedAsset,
  type PlacedBox,
  summarizeOverlaps,
  worldAabbFromLocal,
} from '../composer';

const box = (
  id: string,
  min: [number, number, number],
  max: [number, number, number],
): PlacedBox => ({ id, min, max });

describe('aabb overlap detection', () => {
  test('face-touching boxes do not overlap (within tolerance)', () => {
    const a = box('a', [0, 0, 0], [1, 1, 1]);
    const b = box('b', [1, 0, 0], [2, 1, 1]); // shares the x=1 face
    expect(isOverlapFree([a, b])).toBe(true);
    expect(findOverlaps([a, b])).toHaveLength(0);
  });

  test('penetrating boxes report depth + the minimum-translation axis', () => {
    const a = box('a', [0, 0, 0], [2, 2, 2]);
    const b = box('b', [1.5, 0, 0], [3.5, 2, 2]); // x-overlap 0.5, z-overlap 2
    const v = findOverlaps([a, b]);
    expect(v).toHaveLength(1);
    expect(v[0]!.axis).toBe('x'); // x is the shallower (cheaper) axis
    expect(v[0]!.penetration[0]).toBeCloseTo(0.5, 5);
    expect(v[0]!.separation[0]).toBeCloseTo(0.5, 5); // push b +x by 0.5
  });

  test('footprint mode ignores vertical separation; volume mode respects it', () => {
    const a = box('a', [0, 0, 0], [2, 2, 2]);
    const b = box('b', [0, 5, 0], [2, 7, 2]); // same XZ, stacked 3u above
    expect(findOverlaps([a, b], { mode: 'footprint' })).toHaveLength(1);
    expect(findOverlaps([a, b], { mode: 'volume' })).toHaveLength(0);
  });
});

describe('worldAabbFromLocal — the centre-offset + rotation fix', () => {
  test('preserves an off-centre local bbox (mesh not centred on its origin)', () => {
    // Geometry spans [0..10] in X/Z — centre at (5,_,5) but origin at the corner.
    const w = worldAabbFromLocal([0, 0, 0], [10, 4, 10], [0, 0, 0], 0, 1);
    expect(w.min).toEqual([0, 0, 0]);
    expect(w.max).toEqual([10, 4, 10]); // NOT recentred on the origin
  });

  test('Y-rotation swaps the XZ footprint extents', () => {
    // 10 (x) x 1 (y) x 2 (z), centred, rotated 90 deg about Y.
    const w = worldAabbFromLocal([-5, -0.5, -1], [5, 0.5, 1], [0, 0, 0], 90, 1);
    expect(w.max[0]).toBeCloseTo(1, 4); // x half-extent becomes ~1
    expect(w.max[2]).toBeCloseTo(5, 4); // z half-extent becomes ~5
  });

  test('uniform scale grows extent and offset together', () => {
    const w = worldAabbFromLocal([0, 0, 0], [2, 2, 2], [10, 0, 0], 0, 3);
    // local centre (1,1,1) -> scaled (3,3,3) -> +pos (10,0,0) => (13,3,3); half 3
    expect(w.min).toEqual([10, 0, 0]);
    expect(w.max).toEqual([16, 6, 6]);
  });
});

describe('placement overlap — the packer bug it catches', () => {
  test('two off-centre assets placed as if centred still collide', () => {
    // Each mesh spans local [0..8] in XZ from a corner origin. A packer that
    // assumes the origin is the centre places the origins only 5u apart.
    const assets: PlacedAsset[] = [
      { id: 'left', localMin: [0, 0, 0], localMax: [8, 5, 8], pos: [0, 0, 0] }, // world x[0..8]
      { id: 'right', localMin: [0, 0, 0], localMax: [8, 5, 8], pos: [5, 0, 0] }, // world x[5..13]
    ];
    const v = findPlacementOverlaps(assets);
    expect(v).toHaveLength(1);
    expect(v[0]!.penetration[0]).toBeCloseTo(3, 5); // 8 - 5
    expect(summarizeOverlaps(v)).toContain('left');
  });

  test('a cleanly spaced layout is overlap-free', () => {
    const assets: PlacedAsset[] = [
      { id: 'a', localMin: [-2, 0, -2], localMax: [2, 4, 2], pos: [0, 0, 0] },
      { id: 'b', localMin: [-2, 0, -2], localMax: [2, 4, 2], pos: [10, 0, 0] },
      { id: 'c', localMin: [-2, 0, -2], localMax: [2, 4, 2], pos: [0, 0, 10] },
    ];
    expect(findPlacementOverlaps(assets)).toHaveLength(0);
    expect(summarizeOverlaps(findPlacementOverlaps(assets))).toBe('No overlapping placements.');
  });
});
