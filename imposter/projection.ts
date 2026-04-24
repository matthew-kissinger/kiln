/**
 * Imposter camera-direction math.
 *
 * Lat/lon layout (azimuth × elevation). For the angle counts supported:
 *
 *   angles=8   hemi-y   4 az × 2 el → 4×2 tile grid
 *   angles=16  y        8 az × 2 el → 8×2 tile grid  (full sphere: 2 elevations = +45° and -45°)
 *   angles=16  hemi-y   4 az × 4 el → 4×4 tile grid
 *   angles=32  hemi-y   8 az × 4 el → 8×4 tile grid
 *
 * Tiles are stored row-major, left-to-right / top-to-bottom. The TOP row is the
 * HIGHEST elevation; this is the convention baked into the atlas and recorded
 * in meta.elevations (top to bottom = high to low). Both arrays go in the
 * order the shader expects when indexing by (tileX, tileY).
 *
 * Kiln world frame: +X forward (asset nose / canopy front), +Y up, +Z right.
 * Azimuth 0 looks at the asset from +X. Azimuth increases toward +Z (right-side
 * profile at azimuth π/2). All camera up-vectors stay (0,1,0).
 */

export type ImposterAngleCount = 8 | 16 | 32;
export type ImposterAxis = 'y' | 'hemi-y';

export interface TileCamera {
  /** Tile column (0 = leftmost). */
  i: number;
  /** Tile row (0 = topmost = highest elevation). */
  j: number;
  /** Azimuth in radians. */
  az: number;
  /** Elevation in radians. 0 = horizon, positive = above. */
  el: number;
  /** Unit direction FROM target center TOWARD camera. */
  dir: [number, number, number];
}

export interface TileLayout {
  tilesX: number;
  tilesY: number;
  azimuths: number[];  // length === tilesX
  elevations: number[]; // length === tilesY (top row first)
  axis: ImposterAxis;
}

/**
 * Resolve grid dimensions + angle sequences for a given (angles, axis) combo.
 * Throws on unsupported combinations.
 */
export function resolveLayout(angles: ImposterAngleCount, axis: ImposterAxis): TileLayout {
  if (angles === 8) {
    if (axis !== 'hemi-y') {
      throw new Error(`8-angle imposter requires axis='hemi-y' (got '${axis}')`);
    }
    return {
      tilesX: 4,
      tilesY: 2,
      axis,
      azimuths: evenAzimuths(4),
      // Two elevations above the horizon: steep + shallow. Top row = high.
      elevations: [degToRad(55), degToRad(15)],
    };
  }

  if (angles === 16) {
    if (axis === 'y') {
      return {
        tilesX: 8,
        tilesY: 2,
        axis,
        azimuths: evenAzimuths(8),
        // One above horizon, one below — full-sphere with minimal rows.
        elevations: [degToRad(30), degToRad(-30)],
      };
    }
    // hemi-y: 4 × 4. Elevations pushed higher at the top so aircraft/helicopter
    // cameras looking down still land on a populated tile. Top row is nearly
    // straight-down (85°); bottom row near-horizon (5°).
    return {
      tilesX: 4,
      tilesY: 4,
      axis,
      azimuths: evenAzimuths(4),
      elevations: [degToRad(85), degToRad(60), degToRad(30), degToRad(5)],
    };
  }

  if (angles === 32) {
    if (axis !== 'hemi-y') {
      throw new Error(`32-angle imposter requires axis='hemi-y' (got '${axis}')`);
    }
    // 8 azimuths × 4 elevations. Elevation 85° gives near-zenith coverage for
    // aerial cameras; the full column spread means smoother transitions as a
    // helicopter banks.
    return {
      tilesX: 8,
      tilesY: 4,
      axis,
      azimuths: evenAzimuths(8),
      elevations: [degToRad(85), degToRad(60), degToRad(30), degToRad(5)],
    };
  }

  throw new Error(`Unsupported angle count: ${angles}`);
}

/** Enumerate every tile for a layout, left-to-right top-to-bottom. */
export function enumerateTiles(layout: TileLayout): TileCamera[] {
  const out: TileCamera[] = [];
  for (let j = 0; j < layout.tilesY; j++) {
    for (let i = 0; i < layout.tilesX; i++) {
      const az = layout.azimuths[i]!;
      const el = layout.elevations[j]!;
      out.push({ i, j, az, el, dir: dirFromAzEl(az, el) });
    }
  }
  return out;
}

/** Unit direction FROM target TOWARD camera, from (azimuth, elevation). */
export function dirFromAzEl(az: number, el: number): [number, number, number] {
  const ce = Math.cos(el);
  const x = Math.cos(az) * ce;
  const z = Math.sin(az) * ce;
  const y = Math.sin(el);
  return [x, y, z];
}

function evenAzimuths(count: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) out.push((i / count) * Math.PI * 2);
  return out;
}

function degToRad(deg: number): number {
  return (deg / 180) * Math.PI;
}
