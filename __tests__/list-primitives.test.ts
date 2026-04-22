/**
 * Kiln primitive catalog tests (W3b.2)
 *
 * Verifies the self-describing catalog stays in sync with the actual
 * sandbox globals exposed by `buildSandboxGlobals()`. Drift between the
 * catalog and the real surface is a silent agent-facing bug, so we check
 * it here rather than relying on documentation discipline.
 */

import { describe, expect, test } from 'bun:test';

import { listPrimitives } from '../list-primitives';
import { buildSandboxGlobals } from '../primitives';

describe('kiln.listPrimitives', () => {
  test('returns a non-empty catalog with expected shape', () => {
    const spec = listPrimitives();
    expect(spec.length).toBeGreaterThan(20);
    for (const p of spec) {
      expect(p.name).toMatch(/^[a-zA-Z_][a-zA-Z0-9_]*$/);
      expect(p.signature).toContain(p.name);
      expect(p.returns.length).toBeGreaterThan(0);
      expect(p.description.length).toBeGreaterThan(0);
      expect(p.example.length).toBeGreaterThan(0);
      expect(['geometry', 'material', 'structure', 'animation', 'utility']).toContain(
        p.category
      );
    }
  });

  test('every cataloged primitive is present in the sandbox globals', () => {
    const globals = buildSandboxGlobals();
    for (const p of listPrimitives()) {
      expect(typeof globals[p.name]).toBe('function');
    }
  });

  test('every sandbox function (except Math/console) appears in the catalog', () => {
    const catalog = new Set(listPrimitives().map((p) => p.name));
    const globals = buildSandboxGlobals();

    const missing: string[] = [];
    for (const [name, value] of Object.entries(globals)) {
      if (name === 'Math' || name === 'console') continue;
      if (typeof value !== 'function') continue;
      if (!catalog.has(name)) missing.push(name);
    }

    expect(missing).toEqual([]);
  });

  test('returned array is a defensive copy', () => {
    const a = listPrimitives();
    const b = listPrimitives();
    expect(a).not.toBe(b);
    expect(a[0]).not.toBe(b[0]);
    a[0]!.name = 'mutated';
    expect(b[0]!.name).not.toBe('mutated');
  });

  test('contains canonical entries for the major primitive groups', () => {
    const names = new Set(listPrimitives().map((p) => p.name));
    for (const expected of [
      'createRoot',
      'createPivot',
      'createPart',
      'boxGeo',
      'sphereGeo',
      'cylinderGeo',
      'gameMaterial',
      'rotationTrack',
      'positionTrack',
      'createClip',
      'countTriangles',
    ]) {
      expect(names.has(expected)).toBe(true);
    }
  });
});
