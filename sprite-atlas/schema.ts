/**
 * SpriteFrameTable — sidecar emitted alongside a packed sprite atlas.
 *
 * TIJ's GPUBillboardSystem reads either (frame) to render a single species
 * or the full table to pick tiles by species name at runtime.
 */

import { z } from 'zod';

export const SPRITE_ATLAS_SCHEMA_VERSION = 1 as const;

export const SpriteFrameSchema = z.object({
  /** Species / asset name, matches the input entry. */
  name: z.string(),
  /** Top-left x in atlas pixels. */
  x: z.number().int().nonnegative(),
  /** Top-left y in atlas pixels. */
  y: z.number().int().nonnegative(),
  /** Width in atlas pixels (post-trim if trimming was enabled). */
  w: z.number().int().positive(),
  /** Height in atlas pixels. */
  h: z.number().int().positive(),
  /** Original (un-trimmed) width, useful for restoring layout on the consumer. */
  sourceWidth: z.number().int().positive(),
  /** Original un-trimmed height. */
  sourceHeight: z.number().int().positive(),
});
export type SpriteFrame = z.infer<typeof SpriteFrameSchema>;

export const SpriteFrameTableSchema = z.object({
  version: z.literal(SPRITE_ATLAS_SCHEMA_VERSION),
  atlasWidth: z.number().int().positive(),
  atlasHeight: z.number().int().positive(),
  padding: z.number().int().nonnegative(),
  frames: z.array(SpriteFrameSchema),
});
export type SpriteFrameTable = z.infer<typeof SpriteFrameTableSchema>;
