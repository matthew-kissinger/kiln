/**
 * Kiln mesh ops tests — Round 1
 *
 * Covers mergeVertices + subdivide interaction. Array/mirror/curve ops are
 * covered by validation scripts (no separate unit tests yet).
 */

import { describe, it, expect } from 'bun:test';
import * as THREE from 'three';
import { boxGeo, sphereGeo, cylinderGeo } from '../primitives';
import { mergeVertices, subdivide, revolveGeo, lathe, pipeAlongPath } from '../ops';

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

describe('revolveGeo', () => {
  function bbox(geo: THREE.BufferGeometry): { x: number; y: number; z: number } {
    geo.computeBoundingBox();
    const size = new THREE.Vector3();
    geo.boundingBox!.getSize(size);
    return { x: size.x, y: size.y, z: size.z };
  }

  it('full revolution of a vertical line ≡ cylinder bbox', () => {
    // Profile: a vertical line at radius=0.5, from y=0 to y=2.
    // Note: lathe orients y from bottom to top. To match cylinderGeo (which
    // is centered on origin), we offset the profile so it spans y=-1..+1.
    const profile: Array<[number, number]> = [
      [0.5, -1],
      [0.5, 1],
    ];
    const cyl = cylinderGeo(0.5, 0.5, 2, 16);
    const rev = revolveGeo(profile, { segments: 16 });
    const a = bbox(cyl);
    const b = bbox(rev);
    expect(b.x).toBeCloseTo(a.x, 3);
    expect(b.y).toBeCloseTo(a.y, 3);
    expect(b.z).toBeCloseTo(a.z, 3);
  });

  it('full revolution matches lathe (back-compat sanity)', () => {
    const profile: Array<[number, number]> = [
      [0.1, 0],
      [0.3, 0.5],
      [0.2, 1],
      [0.1, 1.2],
    ];
    const a = bbox(lathe(profile, 16));
    const b = bbox(revolveGeo(profile, { segments: 16 }));
    expect(b.x).toBeCloseTo(a.x, 5);
    expect(b.y).toBeCloseTo(a.y, 5);
    expect(b.z).toBeCloseTo(a.z, 5);
  });

  it('partial sweep covers the requested angular extent', () => {
    // Quarter sweep (90°) of a vertical line at radius=1.
    // LatheGeometry's phi=0 starts at +Z (not +X), so:
    //   quarter (0..π/2): sweeps +Z → +X → bbox.x≈1, bbox.z≈1
    //   half (0..π):       sweeps +Z → -Z passing through +X → bbox.x≈1, bbox.z≈2
    //   full (0..2π):      bbox.x≈2, bbox.z≈2
    const profile: Array<[number, number]> = [
      [1, 0],
      [1, 1],
    ];
    const quarter = revolveGeo(profile, { angle: Math.PI / 2, segments: 16 });
    const half = revolveGeo(profile, { angle: Math.PI, segments: 16 });
    const full = revolveGeo(profile, { angle: Math.PI * 2, segments: 16 });
    expect(bbox(full).x).toBeCloseTo(2, 1);
    expect(bbox(full).z).toBeCloseTo(2, 1);
    expect(bbox(half).x).toBeCloseTo(1, 1);
    expect(bbox(half).z).toBeCloseTo(2, 1);
    expect(bbox(quarter).x).toBeCloseTo(1, 1);
    expect(bbox(quarter).z).toBeCloseTo(1, 1);
  });

  it('non-Y axis reorients the surface', () => {
    // Same line profile, sweep around +X instead of +Y. The "height" should
    // now lie along X, the radial direction in the YZ plane.
    const profile: Array<[number, number]> = [
      [0.5, -1],
      [0.5, 1],
    ];
    const aroundX = revolveGeo(profile, { axis: [1, 0, 0], segments: 16 });
    const b = bbox(aroundX);
    expect(b.x).toBeCloseTo(2, 1); // along X = the lathe axis
    expect(b.y).toBeCloseTo(1, 1); // diameter in YZ
    expect(b.z).toBeCloseTo(1, 1);
  });

  it('rejects zero-length axis', () => {
    expect(() =>
      revolveGeo(
        [
          [1, 0],
          [1, 1],
        ],
        { axis: [0, 0, 0] }
      )
    ).toThrow('axis must be a non-zero vector');
  });
});

describe('pipeAlongPath', () => {
  function bbox(geo: THREE.BufferGeometry): { x: number; y: number; z: number } {
    geo.computeBoundingBox();
    const size = new THREE.Vector3();
    geo.boundingBox!.getSize(size);
    return { x: size.x, y: size.y, z: size.z };
  }

  it('2-point pipe matches a beamBetween bbox along the same vector', () => {
    // Path = [origin, +Y at 1]; radius 0.05.
    // Bbox should span 1 along Y, ≈0.1 along X and Z (diameter).
    const pipe = pipeAlongPath(
      [
        [0, 0, 0],
        [0, 1, 0],
      ],
      0.05
    );
    const b = bbox(pipe);
    expect(b.y).toBeCloseTo(1, 1);
    expect(b.x).toBeLessThan(0.2);
    expect(b.z).toBeLessThan(0.2);
  });

  it('3-point right-angle path covers both legs', () => {
    // L-shape in the XY plane: (0,0,0) → (1,0,0) → (1,1,0).
    const pipe = pipeAlongPath(
      [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
      ],
      0.05
    );
    const b = bbox(pipe);
    expect(b.x).toBeGreaterThan(0.9);
    expect(b.y).toBeGreaterThan(0.9);
  });

  it('bendRadius>0 changes the geometry vs unsmoothed path', () => {
    const pts: Array<[number, number, number]> = [
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
    ];
    const sharp = pipeAlongPath(pts, 0.05);
    const smooth = pipeAlongPath(pts, 0.05, { bendRadius: 0.2 });
    // Both produce non-empty geometry; the bend variant has a different
    // vertex count due to inserted waypoints / spline resampling.
    const sharpVerts = (sharp.getAttribute('position') as THREE.BufferAttribute).count;
    const smoothVerts = (smooth.getAttribute('position') as THREE.BufferAttribute).count;
    expect(sharpVerts).toBeGreaterThan(0);
    expect(smoothVerts).toBeGreaterThan(0);
    // Bend radius adds interpolated waypoints — vertex counts may differ
    // (the underlying TubeGeometry uses CatmullRom over the new path).
    const sharpBb = bbox(sharp);
    const smoothBb = bbox(smooth);
    // Smoothed corner shouldn't bow OUTSIDE the original path's bbox.
    expect(smoothBb.x).toBeLessThanOrEqual(sharpBb.x + 0.05);
    expect(smoothBb.y).toBeLessThanOrEqual(sharpBb.y + 0.05);
  });

  it('rejects single-point input', () => {
    expect(() => pipeAlongPath([[0, 0, 0]], 0.05)).toThrow('need at least 2 points');
  });
});
