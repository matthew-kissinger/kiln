/**
 * kiln/imposter — octahedral / lat-lon imposter atlas baker.
 *
 * Public surface consumed via the `kiln` namespace:
 *
 *   import { kiln } from '@pixel-forge/core';
 *   const { atlas, aux, meta } = await kiln.bakeImposter(glbBuffer, {
 *     angles: 16, axis: 'hemi-y', tileSize: 512, auxLayers: ['depth'],
 *   });
 */

export { bakeImposter, openImposterSession } from './bake';
export type { BakeImposterOptions, BakeImposterResult, ImposterSession } from './bake';

export {
  IMPOSTER_SCHEMA_VERSION,
  ImposterMetaSchema,
} from './schema';
export type {
  ImposterMeta,
  ImposterAngleCount,
  ImposterAxis,
  ImposterLayout,
  ImposterAuxLayer,
  ImposterBgColor,
} from './schema';

export { resolveLayout, enumerateTiles, dirFromAzEl } from './projection';
export type { TileCamera, TileLayout } from './projection';

export {
  resolveClips,
  applyClipFallbacks,
  normalizeClipName,
  CLIP_ALIASES,
} from './clip-resolver';
export type {
  ClipTarget,
  ResolvedClip,
  ClipResolutionReport,
} from './clip-resolver';
