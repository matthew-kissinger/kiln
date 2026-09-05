/**
 * Shape-aware UV unwraps — Round 1 Task 5
 *
 * `autoUnwrap` (xatlas) packs charts into an atlas with arbitrary per-chart
 * rotation/scale. For Three.js built-in primitives that already carry
 * correct orientation-preserving UVs, that repack scrambles directional
 * textures — wood-plank orientation flips face-to-face, metal bands run
 * diagonally on a barrel, "KILN" text crops.
 *
 * These shape-aware unwraps PRESERVE Three.js's built-in UV layouts:
 *   - BoxGeometry      → each face maps [0,1] (all 6 faces show the full texture)
 *   - CylinderGeometry → side: u around the axis, v up the height; caps: circle-in-square
 *   - PlaneGeometry    → xy extent mapped to [0,1]
 *
 * For boxGeo used as a flat sign, the front/back faces show the texture
 * readable; use `planeUnwrap` on a unit plane instead if you don't want
 * the same texture on the edges.
 *
 * All three functions return a CLONE; the input geometry is untouched
 * (matches `autoUnwrap`'s no-mutate contract).
 */

import * as THREE from 'three';

/**
 * Preserve the built-in per-face BoxGeometry UVs (each face → [0,1]).
 *
 * Use for crates, blocks, boxes where you want the same texture pattern
 * on every face with consistent orientation. If the input isn't a
 * BoxGeometry, UVs are regenerated from the bbox (xy plane fallback).
 *
 * @example
 * const crate = boxUnwrap(boxGeo(1, 1, 1));
 * const mat = pbrMaterial({ albedo: woodPlanksTex });
 * // planks run horizontally on all 6 faces consistently.
 */
export function boxUnwrap(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const cloned = geo.clone();
  if (!cloned.getAttribute('uv')) {
    planarProjectToUVs(cloned);
  }
  return cloned;
}

/**
 * Preserve the built-in CylinderGeometry UVs: side = u around / v along,
 * caps = circle-in-square. Horizontal texture features wrap as rings;
 * vertical features run up the cylinder.
 *
 * @example
 * const barrel = cylinderUnwrap(cylinderGeo(0.5, 0.5, 1.2, 24));
 * // horizontal metal bands in the texture → bands wrapping the barrel.
 */
export function cylinderUnwrap(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const cloned = geo.clone();
  if (!cloned.getAttribute('uv')) {
    cylindricalProjectToUVs(cloned);
  }
  return cloned;
}

/**
 * Wrap UVs around the Y axis: u from the angle in the XZ plane, v from height.
 *
 * The fallback here used to be the same flat projection `boxUnwrap` uses, which
 * made the two functions identical in every case that mattered -- and the case
 * that mattered was the one this file's own header describes, a curved surface
 * carrying a directional texture. A flat projection on a curve compresses to
 * nothing where the surface turns away from the projection axis, so brick on a
 * well curb came out as horizontal smears. Built-in `cylinderGeo` never hit it
 * because Three.js ships UVs with it; anything swept or extruded did.
 *
 * u is normalized across the geometry's OWN angular span, not across a whole
 * turn. That is the same promise `boxUnwrap` makes -- each face gets the full
 * [0,1] -- and it is the difference between a brick texture that reads as brick
 * and one squeezed into the six percent of texture width a 22 degree curb stone
 * would otherwise occupy. A full cylinder spans a whole turn, so it lands on the
 * classic mapping unchanged.
 *
 * The seam is the honest limitation: a triangle that spans the -X axis has one
 * corner at u≈1 and the next at u≈0, and the texture runs backwards across it.
 * Geometry built around +X -- which a swept ring segment is, and which is what
 * this exists for -- never reaches the seam. A full revolve should keep the UVs
 * its own sweep produced.
 */
function cylindricalProjectToUVs(geo: THREE.BufferGeometry): void {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute | undefined;
  if (!pos) return;
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  if (!bb) return;
  const minY = bb.min.y;
  // A flat ring has no height to map v against; fall back to the radius so the
  // texture still varies across the surface instead of collapsing to one line.
  const height = bb.max.y - minY;
  const maxR = Math.max(Math.hypot(bb.min.x, bb.min.z), Math.hypot(bb.max.x, bb.max.z), 1e-6);
  // Caps get their own mapping, which is the other half of what the header
  // promises. A cap lies in a plane of constant y, so the cylindrical v is the
  // same number for every vertex on it and the whole face samples one row of
  // texels -- brick that turns into radial streaks the moment you look down at
  // it. Anything facing along Y is projected flat instead, circle-in-square.
  if (!geo.getAttribute('normal')) geo.computeVertexNormals();
  const nrm = geo.getAttribute('normal') as THREE.BufferAttribute | undefined;
  const spanX = Math.max(bb.max.x - bb.min.x, 1e-6);
  const spanZ = Math.max(bb.max.z - bb.min.z, 1e-6);

  let minA = Infinity;
  let maxA = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    if (nrm && Math.abs(nrm.getY(i)) > 0.7) continue;
    const a = Math.atan2(pos.getZ(i), pos.getX(i));
    if (a < minA) minA = a;
    if (a > maxA) maxA = a;
  }
  const span = maxA - minA;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (nrm && Math.abs(nrm.getY(i)) > 0.7) {
      uv[i * 2] = (x - bb.min.x) / spanX;
      uv[i * 2 + 1] = (z - bb.min.z) / spanZ;
      continue;
    }
    const a = Math.atan2(z, x);
    uv[i * 2] = span > 1e-6 ? (a - minA) / span : 0.5;
    uv[i * 2 + 1] = height > 1e-6 ? (y - minY) / height : Math.hypot(x, z) / maxR;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

/**
 * Plane / flat-quad UV: map xy extent of bounding box to [0,1].
 * Works on any geometry whose faces lie ~parallel to the xy plane.
 *
 * Useful for signs, decals, posters — when you want ONE readable texture
 * across the face without edge-face bleeding (unlike `boxUnwrap` which
 * also maps edge faces).
 *
 * @example
 * const sign = planeUnwrap(planeGeo(1, 0.6));
 * // "KILN" text reads left-to-right, bottom-to-top.
 */
export function planeUnwrap(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const cloned = geo.clone();
  planarProjectToUVs(cloned);
  return cloned;
}

/**
 * Remap an existing UV attribute to a sub-region of the texture, by scaling
 * U by `uScale` and V by `vScale` (both default 1.0 = identity), with
 * optional offsets `uOffset`/`vOffset`. Use this when you want a small mesh
 * to sample a specific zone of a SHARED texture without cloning the texture
 * itself — Three.js `Texture.clone()` runs `JSON.parse(JSON.stringify(...))`
 * on userData, which mangles the encoded PNG `Uint8Array` (becomes a plain
 * object) and breaks the GLB bridge.
 *
 * Typical use: a multi-zone albedo where the bottom 30% (v=0..0.30) is a
 * clean panel-only region and the top 70% (v=0.30..1.0) carries
 * windows/markings/decoration. The fuselage uses the full UV range; smaller
 * parts (engine cowling, tail boom, fin) call `panelRemapV(geo, 0.30)` so
 * their 0..1 UV.y collapses to 0..0.30, sampling only the clean strip.
 *
 * Operates on a CLONE of the input; input geometry is not mutated.
 *
 * @example
 * // Engine cowling shares the body's bodyMat but only samples the clean
 * // bottom strip — no doorway/window pixels show on the small part.
 * const cowlGeo = panelRemapV(cylinderUnwrap(capsuleXGeo(0.45, 1.0)), 0.30);
 * const cowl = new THREE.Mesh(cowlGeo, bodyMat);
 */
export function panelRemapV(
  geo: THREE.BufferGeometry,
  vScale = 0.3,
  vOffset = 0,
  uScale = 1,
  uOffset = 0,
): THREE.BufferGeometry {
  const cloned = geo.clone();
  const uvAttr = cloned.getAttribute('uv') as THREE.BufferAttribute | undefined;
  if (!uvAttr) return cloned;
  const arr = uvAttr.array as Float32Array;
  for (let i = 0; i < arr.length; i += 2) {
    arr[i] = (arr[i] ?? 0) * uScale + uOffset;
    arr[i + 1] = (arr[i + 1] ?? 0) * vScale + vOffset;
  }
  uvAttr.needsUpdate = true;
  return cloned;
}

// =============================================================================
// Internal helpers
// =============================================================================

function planarProjectToUVs(geo: THREE.BufferGeometry): void {
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const size = new THREE.Vector3();
  bb.getSize(size);
  const w = size.x || 1;
  const h = size.y || 1;
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uvs[i * 2] = (pos.getX(i) - bb.min.x) / w;
    uvs[i * 2 + 1] = (pos.getY(i) - bb.min.y) / h;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}
