/**
 * ImposterMeta schema — sidecar written next to every baked imposter atlas.
 *
 * A consumer shader (TIJ's billboard system, or any three.js plane material)
 * uses this to:
 *   - size the billboard quad to match the source bbox (worldSize, yOffset)
 *   - map a view-direction to a tile via layout + azimuths + elevations
 *   - sample auxiliary atlases (depth for parallax popping, normal for light)
 *
 * The pipeline pins `version: 1`. Any breaking change to tile layout or aux
 * conventions increments the version and keeps prior readers working.
 */

import { z } from 'zod';

export const IMPOSTER_SCHEMA_VERSION = 1 as const;

export type ImposterAngleCount = 8 | 16 | 32;
export type ImposterAxis = 'y' | 'hemi-y';
export type ImposterLayout = 'latlon' | 'octahedral';
export type ImposterAuxLayer = 'albedo' | 'normal' | 'depth';
export type ImposterBgColor = 'magenta' | 'transparent';
export type ImposterColorLayer = 'baseColor' | 'beauty';
export type ImposterNormalSpace = 'capture-view';
export type ImposterTextureColorSpace = 'srgb';

export const ImposterMetaSchema = z.object({
  version: z.literal(IMPOSTER_SCHEMA_VERSION),

  /** Total viewpoints baked into the atlas. */
  angles: z.union([z.literal(8), z.literal(16), z.literal(32)]),
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
  yOffset: z.number(),

  /** Orthographic — imposters need constant silhouette. */
  projection: z.literal('orthographic'),

  /** Axis convention. 'y' = full sphere. 'hemi-y' = upper hemisphere only. */
  axis: z.enum(['y', 'hemi-y']),
  /** Redundant helper for shaders — true if axis === 'hemi-y'. */
  hemi: z.boolean(),

  /** Tile layout strategy. */
  layout: z.enum(['latlon', 'octahedral']),
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

  /** Axis-aligned bbox of the source mesh, world units. */
  bbox: z.object({
    min: z.tuple([z.number(), z.number(), z.number()]),
    max: z.tuple([z.number(), z.number(), z.number()]),
  }),

  /** Source mesh stats for provenance. */
  source: z.object({
    path: z.string().optional(),
    bytes: z.number().int().nonnegative(),
    tris: z.number().int().nonnegative(),
  }),

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
}).superRefine((meta, ctx) => {
  if (meta.colorLayer === 'baseColor' && !meta.auxLayers.includes('normal')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['auxLayers'],
      message: "baseColor production imposters must include a 'normal' aux layer",
    });
  }
});

export type ImposterMeta = z.infer<typeof ImposterMetaSchema>;
