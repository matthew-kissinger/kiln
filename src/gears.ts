/**
 * Parametric gear / blade geometry — Round 1
 *
 * Game-asset-grade (not real involute profiles). Built directly from
 * triangulated polygons, no CSG, no WASM. Fast and cheap.
 */

import * as THREE from 'three';
import { AuthoringDiagnosticError } from './evaluator/authoring-diagnostic';
import { assertDimension, assertPrimitiveSegments } from './geometry-budget';

// =============================================================================
// gearGeo
// =============================================================================

export interface GearOptions {
  /** Number of teeth around the rim. Default 12. */
  teeth?: number;
  /** Radius at the valley between teeth. Default 0.8. */
  rootRadius?: number;
  /** Radius at the tip of each tooth. Default 1.0. */
  tipRadius?: number;
  /** Radius of the center bore (0 = no hole). Default 0.2. */
  boreRadius?: number;
  /** Thickness along Y. Default 0.3. */
  height?: number;
  /**
   * Fraction of each tooth sector occupied by the tooth itself (0..1).
   * 0.5 = tooth and valley equally wide. Default 0.5.
   */
  toothWidthFrac?: number;
}

/**
 * Build a stylized gear directly — no CSG required.
 *
 * Geometry: for each tooth i ∈ [0, N):
 *   - the sector from θ = i·(2π/N) to (i+1)·(2π/N) is split at four angles
 *     → valley-start, tooth-start, tooth-end, valley-end
 *   - alternating radii root/tip/tip/root trace the crown profile
 * The profile is then extruded along Y and capped on both ends as an annulus
 * fan (a center bore is triangulated as a concentric inner ring).
 *
 * @example
 * const g = gearGeo({ teeth: 12 });
 * const mat = gameMaterial(0x909090, { metalness: 0.8, roughness: 0.3 });
 * createPart('Gear', g, mat, { parent: root });
 */
export function gearGeo(opts: GearOptions = {}): THREE.BufferGeometry {
  const {
    teeth = 12,
    rootRadius = 0.8,
    tipRadius = 1.0,
    boreRadius = 0.2,
    height = 0.3,
    toothWidthFrac = 0.5,
  } = opts;

  assertPrimitiveSegments('gearGeo teeth', teeth, 3);
  assertDimension('gearGeo rootRadius', rootRadius);
  assertDimension('gearGeo tipRadius', tipRadius);
  assertDimension('gearGeo boreRadius', boreRadius, true);
  assertDimension('gearGeo height', height);
  if (!Number.isFinite(toothWidthFrac) || toothWidthFrac <= 0 || toothWidthFrac >= 1)
    throw new RangeError('gearGeo toothWidthFrac must be strictly between 0 and 1.');
  if (tipRadius <= rootRadius || boreRadius >= rootRadius) {
    throw new AuthoringDiagnosticError('GEAR_RADII_ORDER');
  }

  // Crown (outer) ring: 3 distinct points per tooth around XZ plane.
  // α = half-width of the valley within each sector (so the tooth spans
  // the central toothWidthFrac of the sector).
  const sector = (Math.PI * 2) / teeth;
  const alpha = (1 - toothWidthFrac) * (sector / 2);

  // Each valley end is the next tooth's valley start; emit it only once.
  type V2 = [number, number];
  const crown: V2[] = [];
  for (let i = 0; i < teeth; i++) {
    const base = i * sector;
    const a0 = base; // valley start
    const a1 = base + alpha; // tooth start
    const a2 = base + sector - alpha; // tooth end
    crown.push([rootRadius * Math.cos(a0), rootRadius * Math.sin(a0)]);
    crown.push([tipRadius * Math.cos(a1), tipRadius * Math.sin(a1)]);
    crown.push([tipRadius * Math.cos(a2), tipRadius * Math.sin(a2)]);
  }
  const N = crown.length; // 3 * teeth

  // Bore (inner) ring: one point per crown point so cap triangulation is a
  // clean strip between concentric rings. N points on a circle of boreRadius.
  const bore: V2[] = [];
  for (let i = 0; i < N; i++) {
    const t = Math.atan2(crown[i]![1], crown[i]![0]);
    bore.push([boreRadius * Math.cos(t), boreRadius * Math.sin(t)]);
  }

  const halfH = height / 2;

  // Vertex layout:
  //   [0 .. N-1]            crown top
  //   [N .. 2N-1]            crown bottom
  //   [2N .. 3N-1]           bore top
  //   [3N .. 4N-1]           bore bottom
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < N; i++) {
    const p = crown[i]!;
    positions.push(p[0], halfH, p[1]);
  }
  for (let i = 0; i < N; i++) {
    const p = crown[i]!;
    positions.push(p[0], -halfH, p[1]);
  }
  for (let i = 0; i < N; i++) {
    const p = bore[i]!;
    positions.push(p[0], halfH, p[1]);
  }
  for (let i = 0; i < N; i++) {
    const p = bore[i]!;
    positions.push(p[0], -halfH, p[1]);
  }

  const crownTop = 0;
  const crownBot = N;
  const boreTop = 2 * N;
  const boreBot = 3 * N;

  // Winding convention: Three.js is right-handed (X right, Y up, Z out of
  // screen). A triangle (A,B,C) has normal = (B-A) × (C-A). For an outward
  // normal on the TOP face (+Y), we need (B-A) × (C-A) to point +Y — which
  // means A → B → C is CW when viewed from +Y looking down. (Equivalently:
  // CCW when viewed from -Y.) Getting this wrong back-face-culls the face.

  // Top cap: normal should point +Y. Verts go bore-inner → crown-outer-next
  // → crown-outer → ... so the triangle pair is (bA, cB, cA) and (bA, bB, cB).
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    const cA = crownTop + i;
    const cB = crownTop + j;
    const bA = boreTop + i;
    const bB = boreTop + j;
    indices.push(bA, cB, cA);
    if (boreRadius > 0) indices.push(bA, bB, cB);
  }

  // Bottom cap: normal should point -Y. Reverse of top-cap winding.
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    const cA = crownBot + i;
    const cB = crownBot + j;
    const bA = boreBot + i;
    const bB = boreBot + j;
    indices.push(bA, cA, cB);
    if (boreRadius > 0) indices.push(bA, cB, bB);
  }

  // Outer side wall: normal should point RADIALLY OUTWARD. Going around in
  // increasing angle (i→i+1) with top above bottom, the CW-from-outside
  // order is tA → tB → bB → bA. Triangles: (tA, tB, bB), (tA, bB, bA).
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    const tA = crownTop + i;
    const tB = crownTop + j;
    const bA = crownBot + i;
    const bB = crownBot + j;
    indices.push(tA, tB, bB);
    indices.push(tA, bB, bA);
  }

  // Inner side wall (bore): normal should point INWARD toward axis.
  // Reverse of outer wall winding.
  for (let i = 0; boreRadius > 0 && i < N; i++) {
    const j = (i + 1) % N;
    const tA = boreTop + i;
    const tB = boreTop + j;
    const bA = boreBot + i;
    const bB = boreBot + j;
    indices.push(tA, bA, bB);
    indices.push(tA, bB, tB);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  // Flat shading → each face gets its own normal (hard mechanical edges).
  const nonIndexed = geo.toNonIndexed();
  nonIndexed.computeVertexNormals();
  return nonIndexed;
}

// =============================================================================
// bladeGeo
// =============================================================================

export interface BladeOptions {
  /** Total blade length along +Y. Default 1.5. */
  length?: number;
  /** Width at the guard (base). Default 0.1. */
  baseWidth?: number;
  /** Cross-section thickness along Z. Default 0.015. */
  thickness?: number;
  /** Length of the tapered tip section at the top. Default 0.25. */
  tipLength?: number;
  /**
   * 0..1 — cross-section bevel. 0 = flat rectangle; 1 = diamond (centerline
   * ridge). Default 0 (flat) for simplicity; 0.5 for a bevelled edge.
   */
  edgeBevel?: number;
}

/**
 * Build a game-grade sword blade: tapered profile from base to shoulder,
 * then shoulder to tip point. Cross-section is a flat rectangle or an
 * optional diamond (edgeBevel > 0).
 *
 * Origin is at (0, 0, 0) = the base of the blade (guard side). Tip is at
 * (0, length, 0). Center the blade on the grip by translating after.
 *
 * @example
 * const b = bladeGeo({ length: 1.5, baseWidth: 0.08, tipLength: 0.3 });
 * createPart('Blade', b, steelMat, { position: [0, 0, 0], parent: root });
 */
export function bladeGeo(opts: BladeOptions = {}): THREE.BufferGeometry {
  const {
    length = 1.5,
    baseWidth = 0.1,
    thickness = 0.015,
    tipLength = 0.25,
    edgeBevel = 0,
  } = opts;

  for (const [name, value] of Object.entries({ length, baseWidth, thickness }))
    assertDimension(`bladeGeo ${name}`, value);
  assertDimension('bladeGeo tipLength', tipLength, true);
  if (!Number.isFinite(edgeBevel) || edgeBevel < 0 || edgeBevel > 1)
    throw new RangeError('bladeGeo edgeBevel must be between 0 and 1.');
  if (tipLength >= length) {
    throw new Error('bladeGeo: tipLength must be less than length');
  }

  const hw = baseWidth / 2;
  const ht = thickness / 2;
  const shoulderY = length - tipLength;

  // 5-point outline in the XY plane (top surface of the blade looking down
  // from +Z). Outline traced CCW for a +Z-facing top.
  //   base-left  → base-right → shoulder-right → tip → shoulder-left
  const outline: Array<[number, number]> = [
    [-hw, 0],
    [hw, 0],
    [hw, shoulderY],
    [0, length],
    [-hw, shoulderY],
  ];
  const n = outline.length; // 5

  // If edgeBevel = 0, build a prism: extrude the outline by ±thickness/2.
  // If edgeBevel > 0, add a centerline ridge on each side that pinches
  // inward from the full thickness toward the edge of the outline.
  const positions: number[] = [];
  const indices: number[] = [];

  if (edgeBevel <= 0) {
    // ----- Flat-profile prism -----
    // verts: 0..n-1 = top (+Z), n..2n-1 = bottom (-Z)
    for (const [x, y] of outline) positions.push(x, y, ht);
    for (const [x, y] of outline) positions.push(x, y, -ht);

    // Top face: triangle fan from base-left (idx 0).
    // Outline 0,1,2,3,4 → fan (0,1,2) (0,2,3) (0,3,4).
    for (let i = 1; i < n - 1; i++) {
      indices.push(0, i, i + 1);
    }
    // Bottom face: reversed winding. Indices n..2n-1.
    for (let i = 1; i < n - 1; i++) {
      indices.push(n, n + i + 1, n + i);
    }
    // Side walls: for each outline edge (i, i+1), connect top+bottom.
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const tA = i;
      const tB = j;
      const bA = n + i;
      const bB = n + j;
      indices.push(tA, bA, bB);
      indices.push(tA, bB, tB);
    }
  } else {
    // A convex XZ section at base and shoulder, joined to one sharp tip.
    // edgeBevel controls edge thickness; the center ridge stays at +/-ht.
    // Full diamond sections have four distinct corners, partial bevels six.
    const edge = ht * (1 - edgeBevel);
    const section: Array<[number, number]> =
      edgeBevel === 1
        ? [
            [-hw, 0],
            [0, -ht],
            [hw, 0],
            [0, ht],
          ]
        : [
            [-hw, -edge],
            [0, -ht],
            [hw, -edge],
            [hw, edge],
            [0, ht],
            [-hw, edge],
          ];
    const count = section.length;
    for (const y of [0, shoulderY]) for (const [x, z] of section) positions.push(x, y, z);
    const baseCenter = positions.length / 3;
    positions.push(0, 0, 0);
    const tip = positions.length / 3;
    positions.push(0, length, 0);
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      // XZ section winding gives -Y at the base. Side and taper faces
      // consistently face outward; no closing strip overlaps the sides.
      indices.push(baseCenter, i, j);
      indices.push(i, count + j, j, i, count + i, count + j);
      indices.push(count + i, tip, count + j);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  // Flat shading: mechanical edges, crisp tip.
  const nonIndexed = geo.toNonIndexed();
  nonIndexed.computeVertexNormals();
  return nonIndexed;
}
