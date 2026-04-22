/**
 * Shape-aware UV unwraps — Round 1 Task 5
 */

import { describe, it, expect } from 'bun:test';
import * as THREE from 'three';
import { boxGeo, cylinderGeo, planeGeo } from '../primitives';
import { boxUnwrap, cylinderUnwrap, planeUnwrap } from '../uv-shapes';

describe('boxUnwrap', () => {
  it('preserves BoxGeometry per-face [0,1] UVs', () => {
    const b = boxUnwrap(boxGeo(1, 2, 3));
    const uv = b.getAttribute('uv') as THREE.BufferAttribute;
    expect(uv).toBeDefined();
    // Built-in box UVs push (ix/gridX, 1-iy/gridY) — default 1×1 segments
    // means each face has 4 verts at corners (0,0), (0,1), (1,0), (1,1).
    const uniqueUs = new Set<number>();
    const uniqueVs = new Set<number>();
    for (let i = 0; i < uv.count; i++) {
      uniqueUs.add(uv.getX(i));
      uniqueVs.add(uv.getY(i));
    }
    expect(uniqueUs.size).toBe(2);
    expect(uniqueVs.size).toBe(2);
    // All UVs in [0,1].
    for (let i = 0; i < uv.count; i++) {
      expect(uv.getX(i)).toBeGreaterThanOrEqual(0);
      expect(uv.getX(i)).toBeLessThanOrEqual(1);
      expect(uv.getY(i)).toBeGreaterThanOrEqual(0);
      expect(uv.getY(i)).toBeLessThanOrEqual(1);
    }
  });

  it('does not mutate the input', () => {
    const input = boxGeo(1, 1, 1);
    const beforeUv = input.getAttribute('uv');
    boxUnwrap(input);
    expect(input.getAttribute('uv')).toBe(beforeUv);
  });
});

describe('cylinderUnwrap', () => {
  it('preserves CylinderGeometry axial UV layout', () => {
    const c = cylinderUnwrap(cylinderGeo(0.5, 0.5, 1.2, 24));
    const uv = c.getAttribute('uv') as THREE.BufferAttribute;
    expect(uv).toBeDefined();
    // Side verts: v=0 at top, v=1 at bottom; u=0..1 around the circle.
    // We should see both u=0 and u=1 in the attribute (seam verts).
    let minU = Infinity;
    let maxU = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;
    for (let i = 0; i < uv.count; i++) {
      const u = uv.getX(i);
      const v = uv.getY(i);
      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
    expect(minU).toBeCloseTo(0, 3);
    expect(maxU).toBeCloseTo(1, 3);
    expect(minV).toBeCloseTo(0, 3);
    expect(maxV).toBeCloseTo(1, 3);
  });
});

describe('planeUnwrap', () => {
  it('maps xy bbox to [0,1]', () => {
    const p = planeUnwrap(planeGeo(2, 3));
    const uv = p.getAttribute('uv') as THREE.BufferAttribute;
    expect(uv).toBeDefined();
    // 4 corners: (0,0), (1,0), (0,1), (1,1).
    const pairs = new Set<string>();
    for (let i = 0; i < uv.count; i++) {
      pairs.add(`${uv.getX(i).toFixed(3)},${uv.getY(i).toFixed(3)}`);
    }
    expect(pairs.has('0.000,0.000')).toBe(true);
    expect(pairs.has('1.000,0.000')).toBe(true);
    expect(pairs.has('0.000,1.000')).toBe(true);
    expect(pairs.has('1.000,1.000')).toBe(true);
  });

  it('works on a thin boxGeo (sign use case)', () => {
    const sign = planeUnwrap(boxGeo(1, 0.6, 0.05));
    const uv = sign.getAttribute('uv') as THREE.BufferAttribute;
    expect(uv).toBeDefined();
    // All UVs still in [0,1]; xy extent respected.
    for (let i = 0; i < uv.count; i++) {
      expect(uv.getX(i)).toBeGreaterThanOrEqual(0);
      expect(uv.getX(i)).toBeLessThanOrEqual(1);
      expect(uv.getY(i)).toBeGreaterThanOrEqual(0);
      expect(uv.getY(i)).toBeLessThanOrEqual(1);
    }
  });
});
