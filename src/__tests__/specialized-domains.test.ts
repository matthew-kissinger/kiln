import { expect, test } from 'bun:test';
import { Vector3 } from 'three';
import { gearGeo, bladeGeo } from '../gears';
import {
  wingGeo,
  foliageCardGeo,
  crossedQuadsGeo,
  createLadder,
  createStairs,
  createWingPair,
  gameMaterial,
  createRoot,
} from '../primitives';
import { geometryDiagnostics } from '../geometry';

test('gear, blade and wing reject invalid dimensions and bounded shape controls', () => {
  for (const value of [NaN, Infinity, -1]) {
    for (const create of [
      () => gearGeo({ rootRadius: value }),
      () => gearGeo({ boreRadius: value }),
      () => gearGeo({ height: value }),
      () => bladeGeo({ length: value }),
      () => bladeGeo({ edgeBevel: value }),
      () => wingGeo({ span: value }),
      () => wingGeo({ thickness: value }),
    ])
      expect(create).toThrow(/gearGeo|bladeGeo|wingGeo/);
  }
  for (const teeth of [3.5, 4097]) expect(() => gearGeo({ teeth })).toThrow(/teeth/);
  for (const toothWidthFrac of [0, 1, NaN])
    expect(() => gearGeo({ toothWidthFrac })).toThrow(/toothWidthFrac/);
  expect(() => bladeGeo({ edgeBevel: 1.01 })).toThrow(/edgeBevel/);
  expect(() => bladeGeo({ tipLength: -0.1 })).toThrow(/tipLength/);
  expect(() => wingGeo({ sweep: NaN })).toThrow(/sweep/);
});

test('foliage card and crossed planes reject invalid allocation inputs', () => {
  expect(() => foliageCardGeo({ width: NaN })).toThrow(/width/);
  expect(() => foliageCardGeo({ yPivot: Infinity })).toThrow(/yPivot/);
  for (const create of [foliageCardGeo, crossedQuadsGeo])
    expect(() => create({ height: 1e30, yPivot: 1e30 })).toThrow(/pivot|yPivot/);
  for (const planes of [0, 2.5, 1000000])
    expect(() => crossedQuadsGeo({ planes: planes as 2 })).toThrow(/planes/);
  // A pivot outside the panel is useful and stays explicitly supported.
  expect(foliageCardGeo({ yPivot: 2 }).getAttribute('position').count).toBe(4);
});

test('bevelled blade is one closed oriented surface without overlapping strips or zero-area faces', () => {
  for (const edgeBevel of [0, 0.25, 0.5, 1]) {
    for (const tipLength of [0, 0.25]) {
      const g = bladeGeo({ edgeBevel, tipLength });
      const report = geometryDiagnostics(g);
      expect(report).toMatchObject({
        boundaryEdges: 0,
        nonManifoldEdges: 0,
        orientationConflicts: 0,
        degenerateTriangles: 0,
      });
      const p = g.getAttribute('position');
      const normals = g.getAttribute('normal');
      let volume = 0;
      for (let i = 0; i < p.count; i += 3) {
        const a = new Vector3().fromBufferAttribute(p, i);
        const b = new Vector3().fromBufferAttribute(p, i + 1);
        const c = new Vector3().fromBufferAttribute(p, i + 2);
        volume += a.dot(b.cross(c)) / 6;
      }
      expect(volume).toBeGreaterThan(0);
      for (let i = 0; i < normals.count; i++)
        expect(new Vector3().fromBufferAttribute(normals, i).length()).toBeCloseTo(1, 5);
    }
  }
});

test('a pointed wing retains a closed nondegenerate boundary', () => {
  expect(geometryDiagnostics(wingGeo({ tipChord: 0 }))).toMatchObject({
    boundaryEdges: 0,
    nonManifoldEdges: 0,
    degenerateTriangles: 0,
  });
});

test('repeated parts reject invalid counts and placement before mutating the parent', () => {
  const parent = createRoot('Untouched');
  const material = gameMaterial('#778899');
  for (const rungCount of [NaN, 1.5, -1, 10001])
    expect(() =>
      createLadder('Ladder', { bottom: [0, 0, 0], top: [0, 2, 0], material, rungCount, parent }),
    ).toThrow(/rungCount/);
  expect(() => createWingPair('Wings', material, { rootZ: NaN, parent })).toThrow(/root/);
  expect(() =>
    createStairs('Steps', material, { steps: 10001, totalRise: 1, totalRun: 1, width: 1, parent }),
  ).toThrow(/steps/);
  expect(parent.children).toHaveLength(0);
});

test('descending and reversed stairs keep signed placement with positive solid dimensions', () => {
  const stairs = createStairs('Down', gameMaterial('#778899'), {
    steps: 3,
    totalRise: -1,
    totalRun: -2,
    width: 1,
    riser: true,
  });
  expect(stairs.steps).toHaveLength(3);
  expect(stairs.steps[2]!.position.y).toBeLessThan(0);
});
