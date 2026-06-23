/**
 * gearGeo + bladeGeo parametric primitives — Round 1 Task 3/4
 */

import { describe, it, expect } from 'bun:test';
import * as THREE from 'three';
import { gearGeo, bladeGeo } from '../gears';

function bbox(geo: THREE.BufferGeometry) {
  geo.computeBoundingBox();
  return geo.boundingBox!;
}

describe('gearGeo', () => {
  it('produces a flat-shaded, non-indexed gear with sensible tri count', () => {
    const g = gearGeo({ teeth: 12 });
    expect(g.index).toBeNull();
    const pos = g.getAttribute('position') as THREE.BufferAttribute;
    // N = 4*teeth = 48. Triangles: 2 caps × N quads × 2 tris + 2 walls × N × 2 = 8N = 384 tris.
    // Non-indexed: 384 tris × 3 verts = 1152 verts.
    expect(pos.count).toBe(8 * 4 * 12 * 3);
    const norm = g.getAttribute('normal') as THREE.BufferAttribute;
    expect(norm).toBeDefined();
    expect(norm.count).toBe(pos.count);
  });

  it('bounding box is bounded by tipRadius and height', () => {
    const g = gearGeo({ teeth: 12, tipRadius: 1.0, rootRadius: 0.8, height: 0.3 });
    const b = bbox(g);
    // tooth-tip polar positions are offset from the cardinal axes by
    // alpha = (1-toothWidthFrac) * π/N ≈ 7.5°, so the extremal X/Z is
    // ≤ tipRadius (but close). With 12 teeth, max ≈ cos(7.5°) ≈ 0.991.
    expect(b.max.x).toBeGreaterThan(0.95);
    expect(b.max.x).toBeLessThanOrEqual(1.0);
    expect(b.min.x).toBeGreaterThanOrEqual(-1.0);
    expect(b.min.x).toBeLessThan(-0.95);
    expect(b.max.z).toBeGreaterThan(0.95);
    expect(b.max.z).toBeLessThanOrEqual(1.0);
    expect(b.min.z).toBeGreaterThanOrEqual(-1.0);
    expect(b.min.z).toBeLessThan(-0.95);
    expect(b.min.y).toBeCloseTo(-0.15, 3);
    expect(b.max.y).toBeCloseTo(0.15, 3);
  });

  it('bore is respected (no verts inside boreRadius)', () => {
    const boreR = 0.3;
    const g = gearGeo({ teeth: 10, boreRadius: boreR, rootRadius: 0.7, tipRadius: 0.9 });
    const pos = g.getAttribute('position') as THREE.BufferAttribute;
    let minR = Infinity;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const r = Math.hypot(x, z);
      if (r < minR) minR = r;
    }
    // min radius of any vertex should be ≈ boreRadius.
    expect(minR).toBeCloseTo(boreR, 2);
  });

  it('rejects invalid params', () => {
    expect(() => gearGeo({ teeth: 2 })).toThrow(/teeth must be >= 3/);
    expect(() => gearGeo({ tipRadius: 0.5, rootRadius: 0.8 })).toThrow(/tipRadius/);
    expect(() => gearGeo({ boreRadius: 1.0, rootRadius: 0.8 })).toThrow(/boreRadius/);
  });
});

describe('bladeGeo', () => {
  it('flat blade: bbox is [-w/2..+w/2, 0..length, -t/2..+t/2]', () => {
    const b = bladeGeo({ length: 1.5, baseWidth: 0.1, thickness: 0.02, tipLength: 0.25 });
    const bb = bbox(b);
    expect(bb.min.x).toBeCloseTo(-0.05, 3);
    expect(bb.max.x).toBeCloseTo(0.05, 3);
    expect(bb.min.y).toBeCloseTo(0, 3);
    expect(bb.max.y).toBeCloseTo(1.5, 3);
    expect(bb.min.z).toBeCloseTo(-0.01, 3);
    expect(bb.max.z).toBeCloseTo(0.01, 3);
  });

  it('tip tapers to a point (width at tip = 0)', () => {
    const b = bladeGeo({ length: 1.5, baseWidth: 0.1, tipLength: 0.25 });
    const pos = b.getAttribute('position') as THREE.BufferAttribute;
    // Find verts at the very tip (y = length).
    const tipVerts: Array<{ x: number; z: number }> = [];
    for (let i = 0; i < pos.count; i++) {
      if (Math.abs(pos.getY(i) - 1.5) < 1e-4) {
        tipVerts.push({ x: pos.getX(i), z: pos.getZ(i) });
      }
    }
    expect(tipVerts.length).toBeGreaterThan(0);
    // All tip verts are on the centerline (x = 0).
    for (const v of tipVerts) {
      expect(v.x).toBeCloseTo(0, 4);
    }
  });

  it('bevelled blade has a centerline ridge at z = 0', () => {
    const b = bladeGeo({ edgeBevel: 1 }); // full diamond: ridge pinches to z=0
    const pos = b.getAttribute('position') as THREE.BufferAttribute;
    // The ridge z-value in a full diamond is 0. Look for any vert with |z| < 1e-6 at a profile corner (base, shoulder, or tip).
    let foundRidge = false;
    for (let i = 0; i < pos.count; i++) {
      if (Math.abs(pos.getZ(i)) < 1e-6) {
        foundRidge = true;
        break;
      }
    }
    expect(foundRidge).toBe(true);
  });

  it('flat blade has no verts at z = 0 (no ridge)', () => {
    const b = bladeGeo({ edgeBevel: 0 });
    const pos = b.getAttribute('position') as THREE.BufferAttribute;
    let hasRidge = false;
    for (let i = 0; i < pos.count; i++) {
      if (Math.abs(pos.getZ(i)) < 1e-6) {
        hasRidge = true;
        break;
      }
    }
    // Flat cross-section has all verts at z = ±thickness/2.
    expect(hasRidge).toBe(false);
  });

  it('rejects invalid params', () => {
    expect(() => bladeGeo({ length: 0 })).toThrow();
    expect(() => bladeGeo({ length: 1, tipLength: 1 })).toThrow(/tipLength/);
  });

  it('is flat-shaded (non-indexed with per-triangle normals)', () => {
    const b = bladeGeo();
    expect(b.index).toBeNull();
    const norm = b.getAttribute('normal') as THREE.BufferAttribute;
    expect(norm).toBeDefined();
  });
});
