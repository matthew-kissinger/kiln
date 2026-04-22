/**
 * Parametric gear / blade geometry — Round 1
 *
 * Game-asset-grade (not real involute profiles). Built directly from
 * triangulated polygons, no CSG, no WASM. Fast and cheap.
 */

import * as THREE from 'three';

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

  if (teeth < 3) throw new Error('gearGeo: teeth must be >= 3');
  if (tipRadius <= rootRadius) throw new Error('gearGeo: tipRadius must exceed rootRadius');
  if (boreRadius >= rootRadius) throw new Error('gearGeo: boreRadius must be less than rootRadius');

  // Crown (outer) ring: 4 points per tooth around XZ plane.
  // α = half-width of the valley within each sector (so the tooth spans
  // the central toothWidthFrac of the sector).
  const sector = (Math.PI * 2) / teeth;
  const alpha = (1 - toothWidthFrac) * (sector / 2);

  // Build the 4N outer crown points in the XZ plane (y = 0 as extrusion base).
  type V2 = [number, number];
  const crown: V2[] = [];
  for (let i = 0; i < teeth; i++) {
    const base = i * sector;
    const a0 = base; // valley start
    const a1 = base + alpha; // tooth start
    const a2 = base + sector - alpha; // tooth end
    const a3 = base + sector; // valley end (= next valley start, handled by next iter)
    crown.push([rootRadius * Math.cos(a0), rootRadius * Math.sin(a0)]);
    crown.push([tipRadius * Math.cos(a1), tipRadius * Math.sin(a1)]);
    crown.push([tipRadius * Math.cos(a2), tipRadius * Math.sin(a2)]);
    crown.push([rootRadius * Math.cos(a3), rootRadius * Math.sin(a3)]);
  }
  const N = crown.length; // 4 * teeth

  // Bore (inner) ring: one point per crown point so cap triangulation is a
  // clean strip between concentric rings. N points on a circle of boreRadius.
  const bore: V2[] = [];
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
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

  // Top cap: annulus between boreTop and crownTop (CCW seen from +Y).
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    const cA = crownTop + i;
    const cB = crownTop + j;
    const bA = boreTop + i;
    const bB = boreTop + j;
    // Quad (bA, bB, cB, cA) → two tris, CCW from +Y
    indices.push(bA, cA, cB);
    indices.push(bA, cB, bB);
  }

  // Bottom cap: annulus (CCW seen from -Y, i.e. reversed winding)
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    const cA = crownBot + i;
    const cB = crownBot + j;
    const bA = boreBot + i;
    const bB = boreBot + j;
    indices.push(bA, cB, cA);
    indices.push(bA, bB, cB);
  }

  // Outer side wall: rectangle between crownTop[i] → crownTop[i+1] → crownBot[i+1] → crownBot[i]
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    const tA = crownTop + i;
    const tB = crownTop + j;
    const bA = crownBot + i;
    const bB = crownBot + j;
    indices.push(tA, bA, bB);
    indices.push(tA, bB, tB);
  }

  // Inner side wall (bore cylinder): reversed winding since the bore
  // surface faces inward toward the axis.
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    const tA = boreTop + i;
    const tB = boreTop + j;
    const bA = boreBot + i;
    const bB = boreBot + j;
    indices.push(tA, bB, bA);
    indices.push(tA, tB, bB);
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

  if (length <= 0 || baseWidth <= 0 || thickness <= 0) {
    throw new Error('bladeGeo: length, baseWidth, thickness must all be > 0');
  }
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
    // ----- Bevelled (diamond) profile -----
    // For each outline vert, build 4 ring verts:
    //   top-flat  at (x, y, ht)
    //   top-ridge at (x*(1-b), y, ht*(1-b))   // pinched toward centerline
    //     Actually simpler: keep (x, y) path, bevel on z-axis:
    //     flat verts at z = ±ht and ridge verts at z = 0 along the blade edge.
    // Scheme: at each outline vert i, emit
    //   ring[i][0] = top-flat (+z)
    //   ring[i][1] = ridge-front (z = +ht * (1 - edgeBevel))
    //   ring[i][2] = ridge-back  (z = -ht * (1 - edgeBevel))
    //   ring[i][3] = bottom-flat (-z)
    // edgeBevel=1 pinches ridge to z=0 (true diamond).
    const zFlat = ht;
    const zRidge = ht * (1 - edgeBevel);
    const vertsPerRing = 4;
    for (const [x, y] of outline) {
      positions.push(x, y, zFlat);
      positions.push(x, y, zRidge);
      positions.push(x, y, -zRidge);
      positions.push(x, y, -zFlat);
    }

    const ringIdx = (i: number, k: number) => i * vertsPerRing + k;

    // Cap at base (y=0, i=0 and i=1 are the two base corners) — simplest
    // to triangulate as a quad between [0,1] ring verts. But a quick hack:
    // triangulate the base edge (between outline[0] and outline[1]) as a
    // rectangular end-cap.
    // Actually the "profile extrusion" approach doesn't have a flat base
    // plane naturally — we fan-cap both outline polygons on each z-layer.
    // For bevelled, do fan-cap on top (zFlat) and bottom (-zFlat) flats,
    // then connect the 4 longitudinal strips.

    // Top-flat cap fan (ring[*][0])
    for (let i = 1; i < n - 1; i++) {
      indices.push(ringIdx(0, 0), ringIdx(i, 0), ringIdx(i + 1, 0));
    }
    // Bottom-flat cap fan (ring[*][3]) — reversed winding
    for (let i = 1; i < n - 1; i++) {
      indices.push(ringIdx(0, 3), ringIdx(i + 1, 3), ringIdx(i, 3));
    }

    // Longitudinal side strips: for each outline edge (i, j=i+1), connect
    // corresponding k-layer pairs into quads.
    // Layers: 0 (top-flat) ↔ 1 (ridge-front) ↔ 3 (bottom-flat, skipping 2 of opposite face? Actually face layers on +z side are 0→1, and on -z are 3→2.)
    // Simpler: treat the 4 ring layers as a tube with quads (0,1), (1,2), (2,3), (3,0).
    const layerPairs: Array<[number, number]> = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ];
    for (const [kA, kB] of layerPairs) {
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const a = ringIdx(i, kA);
        const b = ringIdx(j, kA);
        const c = ringIdx(j, kB);
        const d = ringIdx(i, kB);
        indices.push(a, d, c);
        indices.push(a, c, b);
      }
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
