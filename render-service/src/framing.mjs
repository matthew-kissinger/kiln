/**
 * Orthographic camera framing.
 *
 * Split out of `renderer.mjs` and written against plain arrays rather than
 * three.js vectors for one reason: it is the only part of the renderer that is
 * pure arithmetic, so it is the only part that can be tested without a GPU.
 * `renderer.mjs` needs an adapter and the three alias loader hooks before it
 * will even import.
 *
 * What this replaces: the first version of the renderer framed every view with
 * `max(sizeX, sizeY, sizeZ) * 0.72`, shared across all six cells of a sheet.
 * That is a guess twice over -- it takes the longest axis whichever way the
 * camera is pointed, and it pads by a constant -- and for anything that is not
 * a cube the frame comes out far too large. The published gallery renders were
 * running at roughly 45% fill, so more than half of every picture was
 * background. It also disagreed with the CPU rasterizer in `src/views/raster.ts`,
 * which has always fitted properly, which meant `--render cpu` and
 * `--render gpu` framed the same asset differently.
 */

/** 1 / 0.9: the CPU rasterizer's margin, matched here so the two agree. */
const MARGIN = 1 / 0.9;

function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function norm(v) {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

/**
 * The camera's right and up axes for a view direction.
 *
 * This reproduces three.js's `Object3D.lookAt` basis exactly, because the
 * extent computed here has to match the basis the camera is actually built
 * with: three takes z as (eye - target), x as (up cross z), and y as (z cross
 * x). Getting this wrong does not throw -- it silently crops one axis.
 */
export function viewBasis(dir) {
  const forward = norm(dir);
  // Looking straight down or straight up, world +Y is degenerate as an up hint.
  const worldUp = Math.abs(forward[1]) > 0.999 ? [0, 0, 1] : [0, 1, 0];
  const right = norm(cross(worldUp, forward));
  return { forward, right, up: norm(cross(forward, right)) };
}

/**
 * Half-width of a square orthographic frame that contains the box.
 *
 * An orthographic projection of an axis-aligned box is exactly the projection
 * of its eight corners, so this is a fit and not an estimate: no direction can
 * produce a corner outside the returned extent, and at least one corner sits on
 * the margin.
 */
export function orthoHalfExtent(min, max, dir) {
  const { right, up } = viewBasis(dir);
  const center = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
  let ext = 1e-6;
  for (const x of [min[0], max[0]]) {
    for (const y of [min[1], max[1]]) {
      for (const z of [min[2], max[2]]) {
        const p = [x - center[0], y - center[1], z - center[2]];
        const dr = p[0] * right[0] + p[1] * right[1] + p[2] * right[2];
        const du = p[0] * up[0] + p[1] * up[1] + p[2] * up[2];
        ext = Math.max(ext, Math.abs(dr), Math.abs(du));
      }
    }
  }
  return ext * MARGIN;
}

/**
 * How far back the camera sits, and where its far plane goes.
 *
 * `halfDepth` is deliberately the box's half-DIAGONAL rather than the depth
 * measured along this particular view direction. Orthographic projection has no
 * perspective falloff, so pulling the camera back costs nothing, and the
 * half-diagonal bounds every direction at once. Sizing the clip planes off the
 * half-extent instead would slice a long object viewed down its own axis in
 * half: the extent perpendicular to the view says nothing about the depth along
 * it.
 */
export function orthoDepth(min, max, half) {
  const halfDiag =
    Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]) / 2 + 1e-3;
  const distance = halfDiag + half * 2 + 1;
  return { distance, far: distance + halfDiag + 1 };
}
