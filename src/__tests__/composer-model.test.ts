/**
 * PlacementModel tests — the composer's structured source of truth.
 *
 * Pure: ops mutate the model, placements() evaluates to overlap-gated world
 * placements with provenance, and the JSON round-trip reproduces them exactly.
 */
import { describe, expect, test } from 'bun:test';

import { type CatalogEntry, PlacementModel } from '../composer';

const asset = (id: string, w = 2, h = 3, d = 2): CatalogEntry => ({
  generationId: id,
  bbox: { min: [-w / 2, 0, -d / 2], max: [w / 2, h, d / 2] },
  name: id,
});

function model(): PlacementModel {
  return new PlacementModel('Test', {
    seed: 7,
    catalog: [
      asset('well', 3, 4, 3),
      asset('stall', 4, 3, 3),
      asset('crate', 1.2, 1.2, 1.2),
      asset('lantern', 0.6, 0.9, 0.6),
    ],
  });
}

describe('place / move / face / remove', () => {
  test('place evaluates to a grounded placement facing the scene centre', () => {
    const m = model();
    const a = m.addPlace('stall', { at: [20, 0], face: 'center', role: 'hero' });
    expect(a).toBe('stall');
    const { placements, overlaps } = m.placements();
    expect(placements).toHaveLength(1);
    expect(placements[0]!.generationId).toBe('stall');
    expect(Math.abs(placements[0]!.rotYDeg)).toBeCloseTo(180, 0); // east → faces -x
    expect(placements[0]!.pos[1]).toBeCloseTo(0, 5); // grounded
    expect(overlaps).toHaveLength(0);
  });

  test('move shifts it, face re-orients it, remove drops it', () => {
    const m = model();
    const a = m.addPlace('well', { at: [0, 0] });
    const p0 = m.placements().placements[0]!.pos[0];
    expect(m.move(a, { delta: [5, 0] }).ok).toBe(true);
    expect(m.placements().placements[0]!.pos[0]).toBeCloseTo(p0 + 5, 5);
    m.face(a, 90);
    expect(m.placements().placements[0]!.rotYDeg).toBe(90);
    expect(m.remove(a).ok).toBe(true);
    expect(m.placements().placements).toHaveLength(0);
  });

  test('edit ops on a missing target return ok:false with a hint', () => {
    const r = model().move('ghost', { delta: [1, 0] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.hint).toBeDefined();
  });
});

describe('placeExact (verbatim / look-preserving import)', () => {
  // An off-centre bbox (non-zero min, centre away from origin): a normal place would
  // recentre + ground it, so it's the sharpest probe that exact does NEITHER.
  const offset = (m: PlacementModel): void =>
    m.registerAsset({
      generationId: 'offset',
      bbox: { min: [1, 2, -3], max: [5, 6, 1] },
      name: 'offset',
    });

  test('places the asset ORIGIN exactly — no grounding, recentre, or rounding', () => {
    const m = model();
    offset(m);
    const pos: [number, number, number] = [12.34, 5.67, -8.9];
    const alias = m.addPlaceExact('offset', { pos, rotYDeg: 137 });
    const p = m.placements().placements.find((x) => x.instanceId === alias)!;
    expect(p.pos).toEqual(pos); // exact origin, untouched
    expect(p.rotYDeg).toBe(137); // exact rotation — no facing resolve, no integer rounding loss
  });

  test('a normal place at the same XZ shifts the origin; exact does not', () => {
    const m = model();
    offset(m);
    const normal = m.addPlace('offset', { at: [0, 0], face: 0 });
    const exact = m.addPlaceExact('offset', { pos: [0, 0, 0], rotYDeg: 0 });
    const ps = m.placements().placements;
    const pn = ps.find((x) => x.instanceId === normal)!;
    const pe = ps.find((x) => x.instanceId === exact)!;
    expect(pe.pos).toEqual([0, 0, 0]); // verbatim
    // normal recentres by the bbox centre (3, ·, -1) and grounds (min.y=2) → [-3, -2, 1]
    expect(pn.pos).toEqual([-3, -2, 1]);
  });

  test('JSON round-trips the exact placement bit-for-bit (the machine reload)', () => {
    const m = model();
    const pos: [number, number, number] = [3.333, 1.25, -7.7];
    m.addPlaceExact('crate', { pos, rotYDeg: -45.5, scale: 1.5, alias: 'crate_x' });
    const back = PlacementModel.fromJSON(m.toJSON());
    const p = back.placements().placements.find((x) => x.instanceId === 'crate_x')!;
    expect(p.pos).toEqual(pos);
    expect(p.rotYDeg).toBe(-45.5);
    expect(p.scale).toBe(1.5);
  });
});

describe('cluster / ring / layout stay overlap-free and addressable', () => {
  test('cluster scatters N overlap-free around a point', () => {
    const m = model();
    m.addCluster('crate', { around: [15, -10], count: 12, spread: 14 });
    const r = m.placements();
    expect(r.placements).toHaveLength(12);
    expect(r.overlaps).toHaveLength(0);
  });

  test('ring places N on a circle, overlap-free, addressable as alias#i', () => {
    const m = model();
    const alias = m.addRing('lantern', { center: [0, 0], count: 8, radius: 10, faceOut: true });
    const r = m.placements();
    expect(r.placements).toHaveLength(8);
    expect(r.overlaps).toHaveLength(0);
    expect(r.placements.map((p) => p.instanceId)).toContain(`${alias}#0`);
  });

  test('layout explodes into editable place statements, overlap-free', () => {
    const m = model();
    const aliases = m.layout(['well', 'stall', 'crate', 'lantern']);
    expect(aliases).toHaveLength(4);
    expect(m.placements().overlaps).toHaveLength(0);
    // each laid-out asset is independently movable
    m.move(aliases[0]!, { to: [300, 300] });
    const moved = m.placements().placements.find((p) => p.instanceId === aliases[0]);
    expect(moved!.pos[0]).toBeGreaterThan(200);
  });
});

describe('group + provenance + persistence', () => {
  test('group tags members and moves them together', () => {
    const m = model();
    const a = m.addPlace('crate', { at: [0, 0] });
    const b = m.addPlace('crate', { at: [5, 0] });
    const g = m.group([a, b], { name: 'pile', delta: [10, 0] });
    expect(g.ok).toBe(true);
    const ps = m.placements().placements;
    expect(ps.find((p) => p.instanceId === a)!.pos[0]).toBeCloseTo(10, 5); // crate is centred
    expect(ps.find((p) => p.instanceId === b)!.pos[0]).toBeCloseTo(15, 5);
  });

  test('every instance carries provenance back to its generationId + statement', () => {
    const m = model();
    m.addRing('lantern', { center: [0, 0], count: 3, radius: 8 });
    const r = m.placements();
    for (const p of r.placements) {
      expect(r.provenance[p.instanceId]!.generationId).toBe('lantern');
      expect(r.provenance[p.instanceId]!.stmtId).toBe(p.stmtId);
    }
  });

  test('toJSON / fromJSON reproduces the evaluated scene exactly', () => {
    const m = model();
    m.addPlace('well', { at: [0, 0], face: 'center', role: 'hero' });
    m.addCluster('crate', { around: [12, 0], count: 6, spread: 10 });
    const restored = PlacementModel.fromJSON(m.toJSON());
    expect(restored.placements().placements).toEqual(m.placements().placements);
  });
});
