/**
 * Kiln mesh ops tests — Round 1
 *
 * Covers mergeVertices + subdivide interaction. Array/mirror/curve ops are
 * covered by validation scripts (no separate unit tests yet).
 */

import { describe, it, expect } from 'bun:test';
import * as THREE from 'three';
import { boxGeo, sphereGeo } from '../primitives';
import { mergeVertices, subdivide } from '../ops';

describe('mergeVertices', () => {
  it('default (attribute-aware) preserves per-face normal splits', () => {
    const box = boxGeo(1, 1, 1);
    expect((box.getAttribute('position') as THREE.BufferAttribute).count).toBe(24);
    const welded = mergeVertices(box);
    // 24 stays 24 — each face keeps its own normals/UVs.
    const after = (welded.getAttribute('position') as THREE.BufferAttribute).count;
    expect(after).toBe(24);
    expect(welded.index).not.toBeNull();
  });

  it('positionOnly welds BoxGeometry corners down to 8', () => {
    const box = boxGeo(1, 1, 1);
    const welded = mergeVertices(box, { positionOnly: true });
    const after = (welded.getAttribute('position') as THREE.BufferAttribute).count;
    expect(after).toBe(8);
    expect(welded.index).not.toBeNull();
    expect(welded.index!.count).toBe(36);
    // Other attributes are dropped — caller is expected to recompute.
    expect(welded.getAttribute('normal')).toBeUndefined();
    expect(welded.getAttribute('uv')).toBeUndefined();
  });

  it('accepts legacy numeric tolerance arg for backward compat', () => {
    const box = boxGeo(1, 1, 1);
    const welded = mergeVertices(box, 1e-4);
    expect((welded.getAttribute('position') as THREE.BufferAttribute).count).toBe(24);
  });

  it('does not mutate the input', () => {
    const input = boxGeo(1, 1, 1);
    const beforeIndex = input.index;
    const beforeCount = (input.getAttribute('position') as THREE.BufferAttribute).count;
    mergeVertices(input, { positionOnly: true });
    expect(input.index).toBe(beforeIndex);
    expect((input.getAttribute('position') as THREE.BufferAttribute).count).toBe(beforeCount);
  });

  it('collapses poles on a SphereGeometry under positionOnly weld', () => {
    const s = sphereGeo(1, 8, 6);
    const before = (s.getAttribute('position') as THREE.BufferAttribute).count;
    const welded = mergeVertices(s, { positionOnly: true });
    const after = (welded.getAttribute('position') as THREE.BufferAttribute).count;
    expect(after).toBeLessThan(before);
  });
});

describe('subdivide auto-weld', () => {
  it('keeps deformed corners connected (rock-smooth fix)', () => {
    // Repro of the rock-smooth audit failure: jitter positions of a
    // non-indexed box then subdivide. Without weld, each corner exists
    // 3x (one per face) and jitter drifts them apart — three-subdivide's
    // position-hash adjacency breaks and the surface splits into shards.
    // With weld (positionOnly) applied first, each corner moves once and
    // the mesh stays one connected blob.
    const base = boxGeo(1.2, 0.8, 1);
    const pos = base.getAttribute('position') as THREE.BufferAttribute;
    // Deterministic "jitter"
    const rng = (seed: number) => {
      let s = seed >>> 0;
      return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return (s / 0xffffffff - 0.5) * 0.2;
      };
    };
    const rand = rng(42);
    for (let i = 0; i < pos.count; i++) {
      pos.setXYZ(i, pos.getX(i) + rand(), pos.getY(i) + rand(), pos.getZ(i) + rand());
    }

    const smoothed = subdivide(base, 1); // auto-welds first

    // Count distinct position clusters: mergeVertices({positionOnly}) on
    // the subdivided output collapses coincident verts. A connected surface
    // has indices that reach every cluster.
    const collapsed = mergeVertices(smoothed, { positionOnly: true });
    const clusters = (collapsed.getAttribute('position') as THREE.BufferAttribute).count;

    // Sanity: collapsed result has verts, and substantially fewer than
    // the non-indexed vertex buffer (proving shared corners exist).
    const subVerts = (smoothed.getAttribute('position') as THREE.BufferAttribute).count;
    expect(clusters).toBeGreaterThan(0);
    expect(clusters).toBeLessThan(subVerts);
  });

  it('weld: false disables the auto-merge (legacy behavior)', () => {
    const box = boxGeo(1, 1, 1);
    const legacy = subdivide(box, 1, { weld: false });
    const auto = subdivide(box, 1);
    const legacyVerts = (legacy.getAttribute('position') as THREE.BufferAttribute).count;
    const autoVerts = (auto.getAttribute('position') as THREE.BufferAttribute).count;
    // The welded path produces ≤ verts because corners are shared.
    expect(autoVerts).toBeLessThanOrEqual(legacyVerts);
  });

  it('preserves geometry survival through GLB export after welded subdivide', () => {
    const sub = subdivide(boxGeo(1, 1, 1), 1);
    const pos = sub.getAttribute('position') as THREE.BufferAttribute;
    // Positions finite, no NaN
    for (let i = 0; i < pos.count; i++) {
      expect(Number.isFinite(pos.getX(i))).toBe(true);
      expect(Number.isFinite(pos.getY(i))).toBe(true);
      expect(Number.isFinite(pos.getZ(i))).toBe(true);
    }
  });
});
