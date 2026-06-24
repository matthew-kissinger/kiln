/**
 * Composer DSL tests — the scene() / asset() builder and serialize() projection.
 *
 * The builder composes the same model the tools drive; serialize() emits a clean,
 * deterministic, asset-by-generationId program where cluster/ring stay one line.
 */
import { describe, expect, test } from 'bun:test';

import { asset, scene } from '../composer';

describe('scene builder', () => {
  test('composes a model whose placements are correct and overlap-free', () => {
    const well = asset('stone_well', 'gen_e5', { min: [-1.5, 0, -1.5], max: [1.5, 4, 1.5] });
    const crate = asset('crate', 'gen_g7', { min: [-0.6, 0, -0.6], max: [0.6, 0.6, 0.6] });
    const r = scene('Market', { seed: 7 })
      .place(well, { at: [0, 0], face: 'center', role: 'hero' })
      .cluster(crate, { around: [15, -10], count: 8, spread: 12 })
      .placements();
    expect(r.placements).toHaveLength(9); // 1 hero + 8 scattered
    expect(r.overlaps).toHaveLength(0);
  });
});

describe('serialize', () => {
  test('emits a clean, deterministic program referencing assets by generationId', () => {
    const well = asset('stone_well', 'gen_e5', { min: [-1.5, 0, -1.5], max: [1.5, 4, 1.5] });
    const s = scene('Market', { seed: 7 }).place(well, {
      at: [0, 0],
      face: 'center',
      role: 'hero',
      alias: 'well',
    });
    const prog = s.serialize();
    expect(prog).toContain('const s = scene("Market", { ground: flat(), seed: 7 });');
    expect(prog).toContain(
      'const stone_well = asset("stone_well", "gen_e5", { min: [-1.5, 0, -1.5], max: [1.5, 4, 1.5] });',
    );
    expect(prog).toContain('s.place(stone_well, {');
    expect(prog).toContain('face: "center"');
    expect(prog).toContain('role: "hero"');
    expect(prog).toContain('alias: "well"');
    expect(prog).toContain('export default s;');
    expect(s.serialize()).toBe(prog); // deterministic
  });

  test('cluster and ring each serialize as a single sugar line', () => {
    const lantern = asset('lantern', 'gen_c3', { min: [-0.3, 0, -0.3], max: [0.3, 0.9, 0.3] });
    const crate = asset('crate', 'gen_g7', { min: [-0.6, 0, -0.6], max: [0.6, 0.6, 0.6] });
    const prog = scene('S')
      .ring(lantern, { center: [0, 0], count: 8, radius: 18, faceOut: true })
      .cluster(crate, { around: [10, 0], count: 12, spread: 14 })
      .serialize();
    const lines = prog.split('\n');
    expect(lines.filter((l) => l.includes('s.ring('))).toHaveLength(1);
    expect(lines.filter((l) => l.includes('s.cluster('))).toHaveLength(1);
    expect(prog).toContain('faceOut: true');
  });

  test('placeExact serializes as a verbatim line that re-evaluates to the exact pose', () => {
    const crate = asset('crate', 'gen_g7', { min: [-0.6, 0, -0.6], max: [0.6, 0.6, 0.6] });
    const s = scene('Imported').placeExact(crate, {
      pos: [12.5, 0, -7.25],
      rotYDeg: 90,
      alias: 'crate_0',
    });
    const prog = s.serialize();
    expect(prog).toContain('s.placeExact(crate, {');
    expect(prog).toContain('pos: [12.5, 0, -7.25]');
    expect(prog).toContain('rotYDeg: 90');
    expect(prog).not.toContain('s.place(crate'); // NOT the grounded form
    // and the model evaluates it verbatim (look-preserving)
    const p = s.placements().placements[0]!;
    expect(p.pos).toEqual([12.5, 0, -7.25]);
    expect(p.rotYDeg).toBe(90);
  });
});
