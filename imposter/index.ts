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
export {
  ANIMATED_IMPOSTER_DEFAULT_ENVELOPE_BYTES,
  ANIMATED_IMPOSTER_KIND,
  ANIMATED_IMPOSTER_SCHEMA_VERSION,
  AnimatedClipTargetSchema,
  AnimatedImposterMetaSchema,
  AnimatedImposterPreBakeInputSchema,
  AnimatedImposterRuntimeAttributeSchema,
  AnimatedImposterTextureFormatSchema,
  AnimatedImposterTextureLayoutSchema,
  AnimatedImposterTextureModeSchema,
  AnimatedImposterWarningSchema,
} from './animated-schema';
export type {
  ImposterMeta,
  ImposterAngleCount,
  ImposterAxis,
  ImposterLayout,
  ImposterAuxLayer,
  ImposterBgColor,
} from './schema';
export type {
  AnimatedClipTarget,
  AnimatedImposterMeta,
  AnimatedImposterPreBakeConfig,
  AnimatedImposterPreBakeInput,
  AnimatedImposterRuntimeAttribute,
  AnimatedImposterTextureFormat,
  AnimatedImposterTextureLayout,
  AnimatedImposterTextureMode,
  AnimatedImposterWarning,
} from './animated-schema';

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

export {
  estimateAnimatedImposterStorage,
  validateAnimatedImposterPreBake,
} from './animated-validate';
export type {
  AnimatedImposterPreBakeReport,
  AnimatedImposterStorageEstimate,
} from './animated-validate';

export {
  bakeAnimatedImposter,
  enumerateOctahedralGrid,
  openAnimatedImposterSession,
} from './animated-bake';
export type {
  AnimatedImposterSession,
  AnimatedTileCamera,
  BakeAnimatedImposterOptions,
  BakeAnimatedImposterResult,
} from './animated-bake';
