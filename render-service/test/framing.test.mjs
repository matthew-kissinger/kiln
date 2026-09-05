import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { orthoDepth, orthoHalfExtent, viewBasis } from '../src/framing.mjs';

/** Project a point into the view basis, the way the camera will. */
function project(p, center, dir) {
  const { right, up, forward } = viewBasis(dir);
  const v = [p[0] - center[0], p[1] - center[1], p[2] - center[2]];
  return {
    x: v[0] * right[0] + v[1] * right[1] + v[2] * right[2],
    y: v[0] * up[0] + v[1] * up[1] + v[2] * up[2],
    z: v[0] * forward[0] + v[1] * forward[1] + v[2] * forward[2],
  };
}

function corners(min, max) {
  const out = [];
  for (const x of [min[0], max[0]]) {
    for (const y of [min[1], max[1]]) {
      for (const z of [min[2], max[2]]) out.push([x, y, z]);
    }
  }
  return out;
}

/**
 * Directions worth covering: the six axes (which include the two where world
 * +Y is a degenerate up hint), the sheet's 3/4, the gallery's hero angle, and a
 * handful of arbitrary ones so the invariants are not just passing on the
 * symmetric cases.
 */
const DIRS = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
  [0.7, 0.5, 0.7],
  [0.82, 0.44, 0.58],
  [0.13, 0.91, -0.4],
  [-0.6, 0.02, 0.33],
];

/** A cube, a slab, a long rod, and an off-origin box. */
const BOXES = [
  { name: 'cube', min: [-1, -1, -1], max: [1, 1, 1] },
  { name: 'slab', min: [-4, -0.1, -2.5], max: [4, 0.1, 2.5] },
  { name: 'rod', min: [-5, -0.08, -0.08], max: [5, 0.08, 0.08] },
  { name: 'off-origin', min: [0, 0, -0.3], max: [1.93, 1.33, 0.26] },
];

describe('orthographic framing', () => {
  it('contains every corner of the box, for every box and direction', () => {
    for (const box of BOXES) {
      const center = box.min.map((v, i) => (v + box.max[i]) / 2);
      for (const dir of DIRS) {
        const half = orthoHalfExtent(box.min, box.max, dir);
        for (const c of corners(box.min, box.max)) {
          const p = project(c, center, dir);
          assert.ok(
            Math.abs(p.x) <= half + 1e-9 && Math.abs(p.y) <= half + 1e-9,
            `${box.name} @ ${dir}: corner ${c} projects to (${p.x}, ${p.y}) outside ±${half}`,
          );
        }
      }
    }
  });

  it('fits tightly -- some corner reaches the 0.9 margin', () => {
    for (const box of BOXES) {
      const center = box.min.map((v, i) => (v + box.max[i]) / 2);
      for (const dir of DIRS) {
        const half = orthoHalfExtent(box.min, box.max, dir);
        let reach = 0;
        for (const c of corners(box.min, box.max)) {
          const p = project(c, center, dir);
          reach = Math.max(reach, Math.abs(p.x), Math.abs(p.y));
        }
        // The margin is 1/0.9, so the extreme corner must land at 90% of half.
        assert.ok(
          Math.abs(reach / half - 0.9) < 1e-9,
          `${box.name} @ ${dir}: fill is ${(reach / half).toFixed(4)}, expected 0.9`,
        );
      }
    }
  });

  it('frames a rod by its length across, and by its width down its axis', () => {
    const rod = BOXES[2];
    const across = orthoHalfExtent(rod.min, rod.max, [0, 0, 1]);
    const along = orthoHalfExtent(rod.min, rod.max, [1, 0, 0]);
    assert.ok(across > 5, `across the rod should frame its 10 m length, got ${across}`);
    assert.ok(along < 0.2, `down the rod's axis should frame its 0.16 m width, got ${along}`);
    // This is the regression: the old framing used max(sizes) for every
    // direction, so both of these came out at 7.2 and the end-on view was
    // 45x too wide.
    assert.ok(along < across / 25);
  });

  it('never clips a long object viewed down its own axis', () => {
    const rod = BOXES[2];
    const dir = [1, 0, 0];
    const center = [0, 0, 0];
    const half = orthoHalfExtent(rod.min, rod.max, dir);
    const { distance, far } = orthoDepth(rod.min, rod.max, half);
    for (const c of corners(rod.min, rod.max)) {
      const p = project(c, center, dir);
      // Depth from the camera along its own forward axis.
      const depth = distance - p.z;
      assert.ok(depth > 0.01, `corner ${c} is at depth ${depth}, in front of the near plane`);
      assert.ok(depth < far, `corner ${c} is at depth ${depth}, beyond the far plane ${far}`);
    }
  });

  it('picks a non-degenerate up vector when looking straight down', () => {
    for (const dir of [
      [0, 1, 0],
      [0, -1, 0],
    ]) {
      const { right, up } = viewBasis(dir);
      assert.ok(Math.hypot(...right) > 0.999, `right is degenerate for ${dir}`);
      assert.ok(Math.hypot(...up) > 0.999, `up is degenerate for ${dir}`);
    }
  });
});
