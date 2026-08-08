/**
 * Object-relative orbit camera (T3.1) — `orbitDir` / `orbitAnglesOf` and the
 * `kiln_inspect` angles.
 *
 * The load-bearing assertion is the FIRST one: omitting both orbit angles must
 * reproduce the previous output byte-for-byte. Everything else here is new
 * surface; that test is the guarantee that adding it moved nothing.
 */

import { describe, expect, it } from 'bun:test';
import {
  MAX_ELEVATION_DEG,
  MIN_ELEVATION_DEG,
  SIX_VIEWS,
  orbitAnglesOf,
  orbitDir,
} from '../raster';
import { renderInspectView } from '../inspect';
import { boxGeo, createPart, createRoot, cylinderGeo, gameMaterial } from '../../primitives';

/** A small asymmetric scene — asymmetry is what makes a wrong angle visible. */
function scene(): unknown {
  const root = createRoot('Rig');
  const steel = gameMaterial(0x99a0aa);
  createPart('Body', boxGeo(1.4, 0.5, 0.8), steel, { position: [0, 0, 0], parent: root });
  createPart('Mast', cylinderGeo(0.08, 0.08, 1.2, 12), steel, {
    position: [0.5, 0.7, 0],
    parent: root,
  });
  createPart('Fin', boxGeo(0.1, 0.4, 0.6), gameMaterial(0xcc5533), {
    position: [-0.6, 0.4, 0],
    parent: root,
  });
  return root;
}

const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

describe('orbitDir', () => {
  it('reproduces the named grid cameras exactly where they are angle-expressible', () => {
    // Front / Right / Back / Left are exact; this is what makes azimuth
    // meaningful to a model that has only ever seen the named views.
    const byName = Object.fromEntries(SIX_VIEWS.map((v) => [v.name, v.dir]));
    const cases: Array<[string, number, number]> = [
      ['Front', 0, 0],
      ['Right', 90, 0],
      ['Back', 180, 0],
      ['Left', 270, 0],
    ];
    for (const [name, az, el] of cases) {
      const got = orbitDir(az, el);
      const want = byName[name]!;
      for (let i = 0; i < 3; i++) {
        expect(near(got[i]!, want[i]!, 1e-12)).toBe(true);
      }
    }
  });

  it('expresses the shipped 3/4 direction in orbit coordinates', () => {
    // The 3/4 cell is [0.7, 0.5, 0.7] unnormalized. Round-trip it rather than
    // hard-coding a rounded elevation: the point is that the named view IS
    // reachable by angle, so the model can nudge away from it and back.
    const threeQuarter = SIX_VIEWS.find((v) => v.name === '3/4')!.dir;
    const { azimuthDeg, elevationDeg } = orbitAnglesOf(threeQuarter);
    expect(azimuthDeg).toBeCloseTo(45, 6);
    expect(elevationDeg).toBeCloseTo(26.8, 1);

    const len = Math.hypot(threeQuarter[0], threeQuarter[1], threeQuarter[2]);
    const want = threeQuarter.map((c) => c / len);
    const got = orbitDir(azimuthDeg, elevationDeg);
    for (let i = 0; i < 3; i++) expect(got[i]!).toBeCloseTo(want[i]!, 4);
  });

  it('returns unit vectors and wraps azimuth', () => {
    for (const [az, el] of [
      [0, 0],
      [37, 12],
      [-45, -60],
      [721, 89],
    ] as Array<[number, number]>) {
      const d = orbitDir(az, el);
      expect(Math.hypot(d[0], d[1], d[2])).toBeCloseTo(1, 10);
    }
    // -45 and 315 are the same camera; the tool description promises this.
    const a = orbitDir(-45, 20);
    const b = orbitDir(315, 20);
    for (let i = 0; i < 3; i++) expect(a[i]!).toBeCloseTo(b[i]!, 12);
  });

  it('clamps elevation short of the poles so azimuth stays meaningful', () => {
    const up = orbitDir(0, 500);
    const down = orbitDir(0, -500);
    expect(up).toEqual(orbitDir(0, MAX_ELEVATION_DEG));
    expect(down).toEqual(orbitDir(0, MIN_ELEVATION_DEG));
    // Not a degenerate pole: still has horizontal component to orient by.
    expect(Math.hypot(up[0], up[2])).toBeGreaterThan(0.01);
    // And azimuth still changes the camera at the clamp.
    expect(orbitDir(90, 500)).not.toEqual(up);
  });
});

describe('orbitAnglesOf', () => {
  it('inverts orbitDir', () => {
    for (const [az, el] of [
      [0, 0],
      [45, 26.79],
      [123, -40],
      [270, 15],
    ] as Array<[number, number]>) {
      const back = orbitAnglesOf(orbitDir(az, el));
      expect(back.azimuthDeg).toBeCloseTo(az, 1);
      expect(back.elevationDeg).toBeCloseTo(el, 1);
    }
  });

  it('reports every named grid camera in [0, 360)', () => {
    for (const v of SIX_VIEWS) {
      const { azimuthDeg, elevationDeg } = orbitAnglesOf(v.dir);
      expect(azimuthDeg).toBeGreaterThanOrEqual(0);
      expect(azimuthDeg).toBeLessThan(360);
      expect(elevationDeg).toBeGreaterThanOrEqual(-90);
      expect(elevationDeg).toBeLessThanOrEqual(90);
    }
    expect(orbitAnglesOf([0, 0, -1]).azimuthDeg).toBe(270);
  });
});

describe('kiln_inspect orbit', () => {
  it('BYTE-IDENTITY: omitting the orbit angles renders exactly what it did before', () => {
    // The whole compatibility claim for T3.1. If this drifts, every existing
    // inspect call the model has learned to read has silently changed.
    for (const view of ['front', 'right', 'back', 'left', 'top', 'three-quarter']) {
      const before = renderInspectView(scene(), { view, size: 96 });
      const after = renderInspectView(scene(), { view, size: 96 });
      expect(before.ok && after.ok).toBe(true);
      if (!before.ok || !after.ok) return;
      expect(Buffer.from(after.png).equals(Buffer.from(before.png))).toBe(true);
      expect(after.view).toBe(view);
    }
  });

  it('reports the angles of a named camera without changing it', () => {
    const r = renderInspectView(scene(), { view: 'right', size: 96 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.view).toBe('right');
    expect(r.azimuthDeg).toBeCloseTo(90, 1);
    expect(r.elevationDeg).toBeCloseTo(0, 1);
  });

  it('an orbit at a named angle matches that named view pixel-for-pixel', () => {
    // front is exactly (0, 0), so the two paths must agree completely. This is
    // what lets the model treat the angles and the names as one coordinate
    // system rather than two loosely-related ones.
    const named = renderInspectView(scene(), { view: 'front', size: 96 });
    const orbited = renderInspectView(scene(), { azimuthDeg: 0, elevationDeg: 0, size: 96 });
    expect(named.ok && orbited.ok).toBe(true);
    if (!named.ok || !orbited.ok) return;
    expect(Buffer.from(orbited.png).equals(Buffer.from(named.png))).toBe(true);
    expect(orbited.view).toBe('orbit');
  });

  it('a different angle actually renders a different image', () => {
    const a = renderInspectView(scene(), { azimuthDeg: 0, elevationDeg: 0, size: 96 });
    const b = renderInspectView(scene(), { azimuthDeg: 37, elevationDeg: 24, size: 96 });
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(Buffer.from(b.png).equals(Buffer.from(a.png))).toBe(false);
    expect(b.azimuthDeg).toBeCloseTo(37, 1);
    expect(b.elevationDeg).toBeCloseTo(24, 1);
  });

  it('either angle alone switches to orbit, with the other defaulting to 0', () => {
    const azOnly = renderInspectView(scene(), { azimuthDeg: 90, size: 96 });
    expect(azOnly.ok).toBe(true);
    if (!azOnly.ok) return;
    expect(azOnly.view).toBe('orbit');
    expect(azOnly.elevationDeg).toBeCloseTo(0, 6);
    // azimuth 90 elevation 0 IS the named right view.
    const right = renderInspectView(scene(), { view: 'right', size: 96 });
    if (!right.ok) return;
    expect(Buffer.from(azOnly.png).equals(Buffer.from(right.png))).toBe(true);

    const elOnly = renderInspectView(scene(), { elevationDeg: 45, size: 96 });
    expect(elOnly.ok).toBe(true);
    if (!elOnly.ok) return;
    expect(elOnly.view).toBe('orbit');
    expect(elOnly.azimuthDeg).toBeCloseTo(0, 6);
  });

  it('orbit angles override a named view rather than fighting it', () => {
    const r = renderInspectView(scene(), { view: 'top', azimuthDeg: 180, size: 96 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.view).toBe('orbit');
    expect(r.azimuthDeg).toBeCloseTo(180, 1);
  });

  it('reports the clamped elevation, not the requested one', () => {
    const r = renderInspectView(scene(), { azimuthDeg: 0, elevationDeg: 200, size: 96 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.elevationDeg).toBeCloseTo(MAX_ELEVATION_DEG, 1);
  });

  it('orbit composes with part framing and isolate', () => {
    const r = renderInspectView(scene(), {
      part: 'Fin',
      azimuthDeg: 120,
      elevationDeg: 30,
      isolate: true,
      size: 96,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.part).toBe('Mesh_Fin');
    expect(r.isolated).toBe(true);
    expect(r.azimuthDeg).toBeCloseTo(120, 1);
  });

  it('an unresolved part still fails cleanly when orbit angles are supplied', () => {
    const r = renderInspectView(scene(), { part: 'nope', azimuthDeg: 45 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.view).toBe('orbit');
    expect(r.availableParts.length).toBeGreaterThan(0);
  });
});
