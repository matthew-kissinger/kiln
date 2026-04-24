/**
 * kiln/sprite-atlas — shelf-packed sprite atlases with JSON frame tables.
 *
 *   import { kiln } from '@pixel-forge/core';
 *   const { atlas, frames } = await kiln.packSpriteAtlas(
 *     [{ name: 'fern-01', data: pngBuf }, ...],
 *     { maxSize: 2048, padding: 2, pot: true }
 *   );
 */

export { packSpriteAtlas } from './pack';
export type {
  PackSpriteAtlasInput,
  PackSpriteAtlasOptions,
  PackSpriteAtlasResult,
} from './pack';

export {
  SPRITE_ATLAS_SCHEMA_VERSION,
  SpriteFrameSchema,
  SpriteFrameTableSchema,
} from './schema';
export type { SpriteFrame, SpriteFrameTable } from './schema';
