/**
 * Billboard primitive tests — foliageCardGeo / crossedQuadsGeo / octaGridPlane.
 */

import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';

import {
  crossedQuadsGeo,
  foliageCardGeo,
  octaGridPlane,
} from '../primitives';

function bbox(g: THREE.BufferGeometry): { min: THREE.Vector3; max: THREE.Vector3 } {
  g.computeBoundingBox();
  return { min: g.boundingBox!.min, max: g.boundingBox!.max };
}

describe('foliageCardGeo', () => {
  test('yPivot=0 sits the quad above the ground plane', () => {
    const g = foliageCardGeo({ width: 2, height: 4, yPivot: 0 });
    const { min, max } = bbox(g);
    expect(min.y).toBeCloseTo(0, 5);
    expect(max.y).toBeCloseTo(4, 5);
  });

  test('yPivot=0.5 centers the quad on origin', () => {
    const g = foliageCardGeo({ width: 2, height: 4, yPivot: 0.5 });
    const { min, max } = bbox(g);
    expect(min.y).toBeCloseTo(-2, 5);
    expect(max.y).toBeCloseTo(2, 5);
  });

  test('defaults to a 1×1 card with bottom pivot', () => {
    const g = foliageCardGeo();
    const { min, max } = bbox(g);
    expect(min.y).toBeCloseTo(0, 5);
    expect(max.y).toBeCloseTo(1, 5);
    expect(max.x - min.x).toBeCloseTo(1, 5);
  });
});

describe('crossedQuadsGeo', () => {
  test('planes=2 yields 2 planes × 2 tris = 4 triangles', () => {
    const g = crossedQuadsGeo({ width: 1, height: 1, planes: 2 });
    const tris = (g.index!.count / 3);
    expect(tris).toBe(4);
  });

  test('planes=3 yields 6 triangles', () => {
    const g = crossedQuadsGeo({ width: 1, height: 1, planes: 3 });
    const tris = (g.index!.count / 3);
    expect(tris).toBe(6);
  });

  test('has position, normal, uv attributes', () => {
    const g = crossedQuadsGeo({ width: 1, height: 1, planes: 2 });
    expect(g.attributes.position).toBeTruthy();
    expect(g.attributes.normal).toBeTruthy();
    expect(g.attributes.uv).toBeTruthy();
  });
});

describe('octaGridPlane', () => {
  test('UVs cover 1/tilesX × 1/tilesY top-left rect', () => {
    const g = octaGridPlane({ tilesX: 4, tilesY: 4, width: 1, height: 1 });
    const uv = g.attributes.uv!;
    let minU = Infinity,
      maxU = -Infinity,
      minV = Infinity,
      maxV = -Infinity;
    for (let i = 0; i < uv.count; i++) {
      minU = Math.min(minU, uv.getX(i));
      maxU = Math.max(maxU, uv.getX(i));
      minV = Math.min(minV, uv.getY(i));
      maxV = Math.max(maxV, uv.getY(i));
    }
    expect(minU).toBeCloseTo(0, 5);
    expect(maxU).toBeCloseTo(0.25, 5);
    // Top-left tile — V spans [0.75, 1.0] with top row convention.
    expect(minV).toBeCloseTo(0.75, 5);
    expect(maxV).toBeCloseTo(1.0, 5);
  });

  test('tilesX=8 tilesY=4 → quarter-height, eighth-width UV rect', () => {
    const g = octaGridPlane({ tilesX: 8, tilesY: 4, width: 1, height: 1 });
    const uv = g.attributes.uv!;
    let maxU = -Infinity;
    let minV = Infinity;
    for (let i = 0; i < uv.count; i++) {
      maxU = Math.max(maxU, uv.getX(i));
      minV = Math.min(minV, uv.getY(i));
    }
    expect(maxU).toBeCloseTo(1 / 8, 5);
    expect(minV).toBeCloseTo(1 - 1 / 4, 5);
  });
});
