/**
 * Composer Phase-0 helper exports — the primitives the scene DSL will wrap:
 * facingToRotY (intent -> Y-rotation) and groundedPos (recentre + ground).
 */
import { describe, expect, test } from 'bun:test';

import { facingToRotY, flatGround, groundedPos, heightmap } from '../composer';

describe('facingToRotY', () => {
  test("'center' turns an east asset back toward the scene centre (~180)", () => {
    expect(Math.abs(facingToRotY('center', [95, 0], [0, 0]))).toBeCloseTo(180, 0);
  });

  test("'out' faces away from the scene centre (~0 for an east asset)", () => {
    expect(Math.abs(facingToRotY('out', [95, 0], [0, 0]))).toBeCloseTo(0, 0);
  });

  test('a world point intent faces that point', () => {
    expect(facingToRotY([10, 0], [0, 0], [0, 0])).toBeCloseTo(0, 5); // +X
  });

  test('a number is taken as explicit degrees', () => {
    expect(facingToRotY(45, [10, 10], [0, 0])).toBe(45);
  });
});

describe('groundedPos', () => {
  test('recentres an off-centre bbox so its centre lands on the target', () => {
    // geometry spans [0..10] in XZ (centre at 5,5); place that centre at (20,30).
    const p = groundedPos([0, 0, 0], [10, 4, 10], 1, [20, 30], 0, flatGround(0));
    expect(p[0]).toBeCloseTo(15, 5); // origin = centre - offset(5,5)
    expect(p[2]).toBeCloseTo(25, 5);
    expect(p[1]).toBeCloseTo(0, 5); // base (minY 0) sits on ground 0
  });

  test('drops the base onto a heightmap sampler', () => {
    const g = heightmap({ heightAt: (x) => x * 0.5 });
    const p = groundedPos([-2, 1, -2], [2, 5, 2], 1, [10, 0], 0, g);
    expect(p[1]).toBeCloseTo(10 * 0.5 - 1, 5); // ground(10)=5, minus scaled minY 1
  });
});
