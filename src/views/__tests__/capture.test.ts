/**
 * Capture configuration (T3.2) — model-chosen grid shape and per-cell cameras.
 *
 * The first test is the contract everything else rests on: omitting `capture`
 * must produce byte-identical output to the shipped 3x2 contact sheet. The
 * rest is new surface.
 */

import { describe, expect, it } from 'bun:test';
import {
  CAPTURE_PRESETS,
  CaptureConfigError,
  DEFAULT_CAPTURE_PRESET,
  MAX_CAPTURE_CELLS,
  captureCellLabel,
  describeCapture,
  resolveCapture,
} from '../capture';
import { SIX_VIEWS, orbitAnglesOf } from '../raster';
import { renderViewGrid } from '../index';
import { boxGeo, createPart, createRoot, cylinderGeo, gameMaterial } from '../../primitives';

function scene(): unknown {
  const root = createRoot('Rig');
  const steel = gameMaterial(0x99a0aa);
  createPart('Body', boxGeo(1.4, 0.5, 0.8), steel, { parent: root });
  createPart('Mast', cylinderGeo(0.08, 0.08, 1.2, 12), steel, {
    position: [0.5, 0.7, 0],
    parent: root,
  });
  return root;
}

describe('resolveCapture', () => {
  it('an omitted config resolves to the shipped six-view 3x2 by identity', () => {
    for (const cfg of [undefined, {}]) {
      const r = resolveCapture(cfg);
      expect(r.preset).toBe(DEFAULT_CAPTURE_PRESET);
      expect(r.cols).toBe(3);
      expect(r.isDefault).toBe(true);
      // Identity, not a copy: a future edit to SIX_VIEWS cannot desynchronise
      // the default grid from the six-view set.
      expect(r.views).toBe(SIX_VIEWS);
      expect(r.zooms.every((z) => z === undefined)).toBe(true);
    }
  });

  it('every preset yields a cell count that fits its own grid', () => {
    const capacity: Record<string, [number, number]> = {
      '1x1': [1, 1],
      '1x2': [1, 2],
      '2x1': [2, 2],
      '3x1': [3, 3],
      '2x2': [2, 4],
      '3x2': [3, 6],
      '3x3': [3, 9],
    };
    for (const preset of CAPTURE_PRESETS) {
      const r = resolveCapture({ preset });
      const [cols, cells] = capacity[preset]!;
      expect(r.cols).toBe(cols);
      expect(r.views).toHaveLength(cells);
      expect(r.zooms).toHaveLength(cells);
    }
  });

  it('a single cell is the 3/4 view, not a flat elevation', () => {
    // One orthographic elevation reads as a rectangle for most assets; the
    // quarter view carries depth, proportion and silhouette at once.
    const r = resolveCapture({ preset: '1x1' });
    expect(r.views[0]!.name).toBe('3/4');
  });

  it('explicit cells become orbit cameras with auto labels', () => {
    const r = resolveCapture({
      cells: [
        { azimuthDeg: 0, elevationDeg: 0 },
        { azimuthDeg: 210, elevationDeg: -25 },
      ],
    });
    // No preset given: the tightest one that fits (2 cells -> 1x2).
    expect(r.preset).toBe('1x2');
    expect(r.views).toHaveLength(2);
    expect(r.isDefault).toBe(false);

    const a = orbitAnglesOf(r.views[0]!.dir);
    expect(a.azimuthDeg).toBeCloseTo(0, 1);
    const b = orbitAnglesOf(r.views[1]!.dir);
    expect(b.azimuthDeg).toBeCloseTo(210, 1);
    expect(b.elevationDeg).toBeCloseTo(-25, 1);
    expect(r.views[1]!.name).toBe('A210 D25');
  });

  it('an explicit preset is honoured even when the cells would fit a smaller one', () => {
    const r = resolveCapture({
      preset: '3x3',
      cells: [{ azimuthDeg: 0, elevationDeg: 0 }],
    });
    expect(r.preset).toBe('3x3');
    expect(r.cols).toBe(3);
    expect(r.views).toHaveLength(1);
  });

  it('a custom cell name is used verbatim (upper-cased for the bitmap font)', () => {
    const r = resolveCapture({ cells: [{ azimuthDeg: 10, elevationDeg: 5, name: 'seam' }] });
    expect(r.views[0]!.name).toBe('SEAM');
  });

  it('rejects the mistakes a model actually makes, with an actionable message', () => {
    expect(() => resolveCapture({ preset: '4x4' as never })).toThrow(CaptureConfigError);
    expect(() => resolveCapture({ preset: '4x4' as never })).toThrow(/must be one of/);

    expect(() => resolveCapture({ cells: [] })).toThrow(/non-empty array/);

    const tooMany = Array.from({ length: MAX_CAPTURE_CELLS + 1 }, (_, i) => ({
      azimuthDeg: i * 20,
      elevationDeg: 0,
    }));
    expect(() => resolveCapture({ cells: tooMany })).toThrow(/maximum is 9/);

    expect(() => resolveCapture({ preset: '2x2', cells: tooMany.slice(0, 6) })).toThrow(
      /holds 4 cells but 6 were given/,
    );

    expect(() => resolveCapture({ cells: [{ azimuthDeg: Number.NaN, elevationDeg: 0 }] })).toThrow(
      /finite azimuthDeg and elevationDeg/,
    );
    expect(() => resolveCapture({ cells: [{ azimuthDeg: 0, elevationDeg: 0, zoom: 0 }] })).toThrow(
      /zoom must be a positive number/,
    );
  });
});

describe('captureCellLabel', () => {
  it('uses only glyphs the 3x5 bitmap font has', () => {
    // There is no '-' glyph: a minus would render as a blank box, so sign is
    // carried by U/D instead.
    const labels = [
      captureCellLabel(0, 0),
      captureCellLabel(45, 30),
      captureCellLabel(200, -15),
      captureCellLabel(-45, -89),
      captureCellLabel(720, 0),
    ];
    expect(labels).toEqual(['A0 U0', 'A45 U30', 'A200 D15', 'A315 D89', 'A0 U0']);
    for (const l of labels) expect(l).toMatch(/^[A-Z0-9 ]+$/);
  });
});

describe('describeCapture', () => {
  it('reports the grid in the same coordinates the model steers with', () => {
    const text = describeCapture(resolveCapture({ preset: '2x1' }));
    expect(text).toContain('2x1 grid');
    expect(text).toContain('2 cells');
    expect(text).toMatch(/az \d/);
    expect(describeCapture(resolveCapture({ preset: '1x1' }))).toContain('1 cell:');
  });
});

describe('renderViewGrid capture', () => {
  it('BYTE-IDENTITY: no capture config renders exactly the shipped grid', async () => {
    const base = await renderViewGrid(scene(), { size: 64 });
    const explicitDefault = await renderViewGrid(scene(), { size: 64, capture: {} });
    const explicit3x2 = await renderViewGrid(scene(), { size: 64, capture: { preset: '3x2' } });

    expect(Buffer.from(explicitDefault.png).equals(Buffer.from(base.png))).toBe(true);
    expect(Buffer.from(explicit3x2.png).equals(Buffer.from(base.png))).toBe(true);
    expect(base.views).toEqual(['Front', 'Right', 'Back', 'Left', 'Top', '3/4']);
    expect(base.capture).toEqual({ preset: '3x2', cols: 3, cells: 6 });
  });

  it('each preset composites to the right pixel dimensions', async () => {
    // width = cols*size + (cols+1)*PAD, height = rows*size + (rows+1)*PAD, PAD = 4.
    const size = 32;
    const expected: Record<string, [number, number]> = {
      '1x1': [1, 1],
      '1x2': [1, 2],
      '2x1': [2, 1],
      '3x1': [3, 1],
      '2x2': [2, 2],
      '3x2': [3, 2],
      '3x3': [3, 3],
    };
    for (const preset of CAPTURE_PRESETS) {
      const g = await renderViewGrid(scene(), { size, capture: { preset } });
      const [cols, rows] = expected[preset]!;
      expect(g.width).toBe(cols * size + (cols + 1) * 4);
      expect(g.height).toBe(rows * size + (rows + 1) * 4);
      expect(g.capture!.preset).toBe(preset);
      expect(g.capture!.cols).toBe(cols);
    }
  });

  it('custom cells actually change the rendered pixels and the reported names', async () => {
    const a = await renderViewGrid(scene(), {
      size: 48,
      capture: { cells: [{ azimuthDeg: 0, elevationDeg: 0 }] },
    });
    const b = await renderViewGrid(scene(), {
      size: 48,
      capture: { cells: [{ azimuthDeg: 90, elevationDeg: 40 }] },
    });
    expect(a.views).toEqual(['A0 U0']);
    expect(b.views).toEqual(['A90 U40']);
    expect(Buffer.from(b.png).equals(Buffer.from(a.png))).toBe(false);
  });

  it('per-cell zoom changes framing, and omitting it keeps the default path', async () => {
    const plain = await renderViewGrid(scene(), {
      size: 48,
      capture: { cells: [{ azimuthDeg: 30, elevationDeg: 20 }] },
    });
    const zoomed = await renderViewGrid(scene(), {
      size: 48,
      capture: { cells: [{ azimuthDeg: 30, elevationDeg: 20, zoom: 3 }] },
    });
    expect(Buffer.from(zoomed.png).equals(Buffer.from(plain.png))).toBe(false);

    // zoom on ONE cell must not disturb the framing of a cell without it —
    // but both share one measured scene box, so this also pins that only the
    // zoomed cell takes the frameBounds path.
    const mixed = await renderViewGrid(scene(), {
      size: 48,
      capture: {
        preset: '2x1',
        cells: [
          { azimuthDeg: 30, elevationDeg: 20 },
          { azimuthDeg: 30, elevationDeg: 20, zoom: 3 },
        ],
      },
    });
    expect(mixed.views).toHaveLength(2);
    expect(mixed.capture!.cols).toBe(2);
  });

  it('an explicit views[] still wins over capture, so internal callers are unaffected', async () => {
    const g = await renderViewGrid(scene(), {
      size: 32,
      views: [SIX_VIEWS[0]!],
      capture: { preset: '3x3' },
    });
    expect(g.views).toEqual(['Front']);
    // The preset still drives the column count; only the cameras are overridden.
    expect(g.capture!.preset).toBe('3x3');
  });

  it('a bad capture config throws rather than rendering something wrong', async () => {
    await expect(
      renderViewGrid(scene(), { size: 32, capture: { preset: 'nope' as never } }),
    ).rejects.toThrow(CaptureConfigError);
  });
});
