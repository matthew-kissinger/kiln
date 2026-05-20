/**
 * ImposterMeta schema — sidecar written next to every baked imposter atlas.
 *
 * A consumer shader (TIJ's billboard system, or any three.js plane material)
 * uses this to:
 *   - size the billboard quad to match the source bbox (worldSize, yOffset)
 *   - map a view-direction to a tile via layout + azimuths + elevations
 *   - sample auxiliary atlases (depth for parallax popping, normal for light)
 *
 * Static lat/lon sidecars shipped as version 1. Version 2 adds static
 * octahedral layouts while keeping v1 lat/lon readers valid.
 */

import { z } from 'zod';

export const IMPOSTER_LEGACY_SCHEMA_VERSION = 1 as const;
export const IMPOSTER_SCHEMA_VERSION = 2 as const;

export type ImposterAngleCount = 8 | 16 | 32;
export type LatLonImposterAxis = 'y' | 'hemi-y';
export type ImposterAxis = LatLonImposterAxis | 'octahedral';
export type ImposterLayout = 'latlon' | 'octahedral';
export type ImposterAuxLayer = 'albedo' | 'normal' | 'depth';
export type ImposterBgColor = 'magenta' | 'transparent';
export type ImposterColorLayer = 'baseColor' | 'beauty';
export type ImposterNormalSpace = 'capture-view';
export type ImposterTextureColorSpace = 'srgb';

const finiteNumber = z.number().finite();
const directionTuple = z.tuple([finiteNumber, finiteNumber, finiteNumber]);
const bboxSchema = z.object({
  min: z.tuple([finiteNumber, finiteNumber, finiteNumber]),
  max: z.tuple([finiteNumber, finiteNumber, finiteNumber]),
});
const sourceSchema = z.object({
  path: z.string().optional(),
  bytes: z.number().int().nonnegative(),
  tris: z.number().int().nonnegative(),
});

const commonMetaSchema = z.object({
  /** Total viewpoints baked into the atlas. */
  angles: z.number().int().positive(),
  /** Atlas grid dimensions — tiles across / down. */
  tilesX: z.number().int().positive(),
  tilesY: z.number().int().positive(),
  /** Pixel size of a single tile (square). */
  tileSize: z.number().int().positive(),
  /** Total atlas width/height in pixels (tilesX*tileSize, tilesY*tileSize). */
  atlasWidth: z.number().int().positive(),
  atlasHeight: z.number().int().positive(),

  /** Bounding-sphere diameter of the source mesh, world units. Scale the billboard quad to this. */
  worldSize: z.number().positive(),
  /** Offset from the GLB origin to the bbox center along Y, world units. */
  yOffset: finiteNumber,

  /** Orthographic — imposters need constant silhouette. */
  projection: z.literal('orthographic'),

  /** Axis convention. 'y' = full sphere, 'hemi-y' = upper hemi, 'octahedral' = octa map. */
  axis: z.enum(['y', 'hemi-y', 'octahedral']),
  /** Redundant helper for shaders - true if axis === 'hemi-y'. False for octahedral. */
  hemi: z.boolean(),

  /** Tile layout strategy. */
  layout: z.enum(['latlon', 'octahedral']),

  /** Axis-aligned bbox of the source mesh, world units. */
  bbox: bboxSchema,

  /** Source mesh stats for provenance. */
  source: sourceSchema,

  /** Auxiliary layers packed alongside albedo (as separate PNGs). */
  auxLayers: z.array(z.enum(['albedo', 'normal', 'depth'])),

  /** Background color used for the bake. 'transparent' uses RGBA alpha. */
  bgColor: z.enum(['magenta', 'transparent']),

  /** Color layer contract. Legacy sidecars default to lit beauty output. */
  colorLayer: z.enum(['baseColor', 'beauty']).default('beauty'),
  /** Normal layer coordinate contract. Current baker emits capture/view-space normal RGB. */
  normalSpace: z.literal('capture-view').default('capture-view'),
  /** RGB bleed radius applied into transparent pixels before atlas packing. */
  edgeBleedPx: z.number().int().nonnegative().default(0),
  /** Color atlas storage space. PNG color layers are authored as sRGB. */
  textureColorSpace: z.literal('srgb').default('srgb'),
});

const latLonMetaSchema = commonMetaSchema.extend({
  version: z.union([z.literal(IMPOSTER_LEGACY_SCHEMA_VERSION), z.literal(IMPOSTER_SCHEMA_VERSION)]),
  angles: z.union([z.literal(8), z.literal(16), z.literal(32)]),
  axis: z.enum(['y', 'hemi-y']),
  layout: z.literal('latlon'),
  /**
   * For layout='latlon': azimuth angles (radians) per column. Length === tilesX.
   * Azimuth 0 = +X (the asset's forward). Increases toward +Z (right).
   */
  azimuths: z.array(z.number()),
  /**
   * For layout='latlon': elevation angles (radians) per row. Length === tilesY.
   * 0 = horizon. +π/2 = zenith. Rows go top-to-bottom = high-to-low elevation.
   */
  elevations: z.array(z.number()),
});

const octahedralMetaSchema = commonMetaSchema.extend({
  version: z.literal(IMPOSTER_SCHEMA_VERSION),
  axis: z.literal('octahedral'),
  hemi: z.literal(false),
  layout: z.literal('octahedral'),
  directionEncoding: z.literal('octahedral'),
  /** Per-tile unit direction vectors, row-major, from target center toward camera. */
  directions: z.array(directionTuple),
});

function refineCommon(meta: z.infer<typeof commonMetaSchema>, ctx: z.RefinementCtx): void {
  if (meta.colorLayer === 'baseColor' && !meta.auxLayers.includes('normal')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['auxLayers'],
      message: "baseColor production imposters must include a 'normal' aux layer",
    });
  }
  if (meta.atlasWidth !== meta.tilesX * meta.tileSize) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['atlasWidth'],
      message: 'atlasWidth must equal tilesX * tileSize',
    });
  }
  if (meta.atlasHeight !== meta.tilesY * meta.tileSize) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['atlasHeight'],
      message: 'atlasHeight must equal tilesY * tileSize',
    });
  }
}

export const ImposterMetaSchema = z.union([
  latLonMetaSchema.superRefine((meta, ctx) => {
    refineCommon(meta, ctx);
    if (meta.azimuths.length !== meta.tilesX) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['azimuths'],
        message: 'azimuths length must match tilesX',
      });
    }
    if (meta.elevations.length !== meta.tilesY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['elevations'],
        message: 'elevations length must match tilesY',
      });
    }
  }),
  octahedralMetaSchema.superRefine((meta, ctx) => {
    refineCommon(meta, ctx);
    if (meta.directions.length !== meta.tilesX * meta.tilesY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['directions'],
        message: 'directions length must match tilesX * tilesY',
      });
    }
    for (let idx = 0; idx < meta.directions.length; idx++) {
      const dir = meta.directions[idx]!;
      const len = Math.hypot(dir[0], dir[1], dir[2]);
      if (Math.abs(len - 1) > 1e-4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['directions', idx],
          message: 'direction must be a unit vector',
        });
      }
    }
  }),
]);

export type ImposterMeta = z.infer<typeof ImposterMetaSchema>;
