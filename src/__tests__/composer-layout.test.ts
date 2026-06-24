/**
 * Composer layout tests — pure geometry, no LLM, no network.
 *
 * Pins the properties that make the layout a flexible, intelligent foundation:
 * overlap-free by construction across anchors, hero centrepieces, intentional
 * facing, terrain grounding via the sampler seam (heightmap-ready), grouping,
 * and full determinism.
 */
import { describe, expect, test } from 'bun:test';

import {
  type GroundSampler,
  type LayoutItem,
  layoutScene,
  worldAabbFromLocal,
  zonedCenters,
} from '../composer';

/** Item centred on its XZ origin, base at y=0, footprint w x d, height h. */
const item = (
  id: string,
  w: number,
  h: number,
  d: number,
  extra: Partial<LayoutItem> = {},
): LayoutItem => ({
  id,
  localMin: [-w / 2, 0, -d / 2],
  localMax: [w / 2, h, d / 2],
  ...extra,
});

function worldCenter(
  localMin: [number, number, number],
  localMax: [number, number, number],
  pos: [number, number, number],
  rotYDeg: number,
  scale: number,
): [number, number, number] {
  const b = worldAabbFromLocal(localMin, localMax, pos, rotYDeg, scale);
  return [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2];
}

describe('layout is overlap-free across anchors', () => {
  test('a full 5-zone scene (heroes + support + fill) has zero overlaps', () => {
    const items: LayoutItem[] = [];
    for (const z of ['hub', 'north', 'east', 'south', 'west']) {
      items.push(item(`${z}-hero`, 12, 20, 12, { role: 'hero', zone: z }));
      for (let i = 0; i < 3; i++)
        items.push(item(`${z}-sup${i}`, 6, 8, 6, { role: 'support', zone: z }));
      for (let i = 0; i < 5; i++)
        items.push(item(`${z}-fill${i}`, 2, 2, 2, { role: 'fill', zone: z, group: `${z}-hero` }));
    }
    const res = layoutScene(items, { anchors: zonedCenters(95) });
    expect(res.placements).toHaveLength(items.length);
    expect(res.overlaps).toHaveLength(0);
  });

  test('with no anchors (single root) it still packs overlap-free', () => {
    const items = Array.from({ length: 24 }, (_, i) => item(`p${i}`, 3 + (i % 4), 5, 3 + (i % 3)));
    expect(layoutScene(items).overlaps).toHaveLength(0);
  });
});

describe('hierarchy + facing + grouping', () => {
  test("a zone's hero anchors its centre", () => {
    const items: LayoutItem[] = [
      item('east-hero', 12, 20, 12, { role: 'hero', zone: 'east' }),
      item('east-sup', 6, 8, 6, { role: 'support', zone: 'east' }),
    ];
    const res = layoutScene(items, { anchors: zonedCenters(95) });
    const hero = res.placements.find((p) => p.id === 'east-hero')!;
    const c = worldCenter([-6, 0, -6], [6, 20, 6], hero.pos, hero.rotYDeg, hero.scale);
    expect(c[0]).toBeCloseTo(95, 1); // east anchor at [95,0]
    expect(c[2]).toBeCloseTo(0, 1);
  });

  test("'scene-in' turns an east asset to face the scene centre (+X points -X ~180deg)", () => {
    const res = layoutScene([item('e', 8, 10, 8, { role: 'hero', zone: 'east' })], {
      anchors: zonedCenters(95),
      facing: 'scene-in',
    });
    expect(Math.abs(res.placements[0]!.rotYDeg)).toBeCloseTo(180, 0);
  });

  test('fill clusters around its group hero', () => {
    const items: LayoutItem[] = [
      item('mkt', 8, 10, 8, { role: 'hero', zone: 'east', group: 'market' }),
      ...Array.from({ length: 6 }, (_, i) =>
        item(`stall${i}`, 2, 2, 2, { role: 'fill', zone: 'east', group: 'market' }),
      ),
    ];
    const res = layoutScene(items, { anchors: zonedCenters(95) });
    const hero = res.placements.find((p) => p.id === 'mkt')!;
    for (const s of res.placements.filter((p) => p.id.startsWith('stall'))) {
      const d = Math.hypot(s.pos[0] - hero.pos[0], s.pos[2] - hero.pos[2]);
      expect(d).toBeLessThan(20); // hug the market, not scattered across the zone
    }
  });
});

describe('terrain seam (heightmap-ready) + grounding', () => {
  test('placements drop onto a custom ground sampler', () => {
    const slope: GroundSampler = { heightAt: (x) => x * 0.1 };
    const res = layoutScene([item('a', 4, 6, 4, { zone: 'east' })], {
      anchors: zonedCenters(95),
      ground: slope,
    });
    const p = res.placements[0]!;
    expect(p.pos[1]).toBeCloseTo(p.pos[0] * 0.1, 1); // base follows the terrain
  });

  test('an asset whose geometry starts above its origin is dropped to the ground', () => {
    const floaty: LayoutItem = { id: 'f', localMin: [-2, 2, -2], localMax: [2, 8, 2] }; // base 2u above origin
    const res = layoutScene([floaty]);
    expect(res.placements[0]!.pos[1]).toBeCloseTo(-2, 5); // origin sinks so base sits at y=0
  });
});

describe('determinism', () => {
  test('same seed reproduces the layout exactly; different seed differs', () => {
    const items = Array.from({ length: 16 }, (_, i) =>
      item(`p${i}`, 3, 5, 3, { zone: i % 2 ? 'east' : 'west' }),
    );
    const a = layoutScene(items, { anchors: zonedCenters(95), seed: 7 });
    const b = layoutScene(items, { anchors: zonedCenters(95), seed: 7 });
    const c = layoutScene(items, { anchors: zonedCenters(95), seed: 99 });
    expect(a.placements).toEqual(b.placements);
    expect(a.placements).not.toEqual(c.placements);
  });
});
