/**
 * Pure pre-bake validation for animated octahedral impostors.
 *
 * This stage does not load GLBs or write artifacts. Callers pass discovered
 * source facts, and the validator makes the first bake contract explicit.
 */

import {
  ANIMATED_IMPOSTER_DEFAULT_ENVELOPE_BYTES,
  AnimatedImposterPreBakeInputSchema,
  type AnimatedClipTarget,
  type AnimatedImposterPreBakeConfig,
  type AnimatedImposterPreBakeInput,
  type AnimatedImposterTextureFormat,
  type AnimatedImposterWarning,
} from './animated-schema';
import {
  applyClipFallbacks,
  resolveClips,
  type ClipResolutionReport,
  type ClipTarget,
} from './clip-resolver';

export interface AnimatedImposterStorageEstimate {
  atlasWidth: number;
  atlasHeight: number;
  layers: number;
  bytesPerColorPixel: number;
  colorBytes: number;
  normalBytes: number;
  depthBytes: number;
  paletteBytes: number;
  totalRawBytes: number;
  envelopeBytes: number;
  fitsEnvelope: boolean;
}

export interface AnimatedImposterPreBakeReport {
  ok: boolean;
  blockers: AnimatedImposterWarning[];
  warnings: AnimatedImposterWarning[];
  clipResolution: ClipResolutionReport;
  storage: AnimatedImposterStorageEstimate;
  normalized: AnimatedImposterPreBakeConfig;
}

export function estimateAnimatedImposterStorage(
  input: Pick<
    AnimatedImposterPreBakeConfig,
    | 'viewGrid'
    | 'tileSize'
    | 'framesPerClip'
    | 'clipTargets'
    | 'textureFormat'
    | 'includeNormal'
    | 'includeDepth'
    | 'paletteWidth'
    | 'paletteRows'
    | 'envelopeBytes'
  >,
): AnimatedImposterStorageEstimate {
  const atlasWidth = input.viewGrid.x * input.tileSize;
  const atlasHeight = input.viewGrid.y * input.tileSize;
  const layers = input.framesPerClip * input.clipTargets.length;
  const pixels = atlasWidth * atlasHeight * layers;
  const bytesPerColorPixel = bytesPerPixel(input.textureFormat);
  const colorBytes = pixels * bytesPerColorPixel;
  const normalBytes = input.includeNormal ? pixels * 4 : 0;
  const depthBytes = input.includeDepth ? pixels * 4 : 0;
  const paletteBytes = input.textureFormat === 'r8-palette-index'
    ? input.paletteWidth * input.paletteRows * 4
    : 0;
  const totalRawBytes = colorBytes + normalBytes + depthBytes + paletteBytes;
  const envelopeBytes = input.envelopeBytes ?? ANIMATED_IMPOSTER_DEFAULT_ENVELOPE_BYTES;

  return {
    atlasWidth,
    atlasHeight,
    layers,
    bytesPerColorPixel,
    colorBytes,
    normalBytes,
    depthBytes,
    paletteBytes,
    totalRawBytes,
    envelopeBytes,
    fitsEnvelope: totalRawBytes <= envelopeBytes,
  };
}

export function validateAnimatedImposterPreBake(
  raw: AnimatedImposterPreBakeInput,
): AnimatedImposterPreBakeReport {
  const input = AnimatedImposterPreBakeInputSchema.parse(raw);
  const blockers: AnimatedImposterWarning[] = [];
  const warnings: AnimatedImposterWarning[] = [];

  const add = (issue: AnimatedImposterWarning) => {
    if (issue.severity === 'error') blockers.push(issue);
    else warnings.push(issue);
  };

  if (input.source.bytes <= 0) {
    add({
      code: 'ANIMATED_IMPOSTER_SOURCE_EMPTY',
      severity: 'error',
      message: 'Source GLB has no bytes.',
      fixHint: 'Pass a non-empty GLB buffer or file path before baking.',
    });
  }

  if (input.source.tris <= 0) {
    add({
      code: 'ANIMATED_IMPOSTER_SOURCE_NO_TRIS',
      severity: 'error',
      message: 'Source GLB has no triangles.',
      fixHint: 'Inspect the source GLB and select a mesh-backed character asset.',
    });
  }

  if (!input.source.skinned) {
    add({
      code: 'ANIMATED_IMPOSTER_SOURCE_NOT_SKINNED',
      severity: 'error',
      message: 'Animated octahedral impostors need a skinned source character.',
      fixHint: 'Use a skinned GLB or pivot to the static imposter path for rigid props.',
    });
  }

  if (input.source.clipNames.length === 0) {
    add({
      code: 'ANIMATED_IMPOSTER_SOURCE_NO_CLIPS',
      severity: 'error',
      message: 'Source GLB has no animation clips.',
      fixHint: 'Choose an animated character GLB before starting the bake.',
    });
  }

  let clipResolution = resolveClips(input.source.clipNames, toClipTargets(input.clipTargets));
  if (input.clipFallbacks.length > 0) {
    clipResolution = applyClipFallbacks(clipResolution, fallbackMap(input.clipFallbacks));
  }

  for (const target of input.clipTargets) {
    const clip = clipResolution.clips[target];
    if (!clip || !clip.resolved) {
      add({
        code: 'ANIMATED_IMPOSTER_CLIP_MISSING',
        severity: 'warning',
        message: `No source clip resolved for ${target}.`,
        fixHint: 'Add a clip fallback or remove the target from this bake slice.',
      });
    } else if (clip.matchedBy === 'fallback') {
      add({
        code: 'ANIMATED_IMPOSTER_CLIP_FALLBACK',
        severity: 'warning',
        message: `${target} will use ${clip.fallbackFor} as a fallback clip.`,
        fixHint: 'Treat the output as visually provisional until a dedicated clip exists.',
      });
    }
  }

  const resolvedCount = input.clipTargets.filter((target) => clipResolution.clips[target]?.resolved).length;
  if (resolvedCount === 0) {
    add({
      code: 'ANIMATED_IMPOSTER_NO_RESOLVED_CLIPS',
      severity: 'error',
      message: 'None of the requested clip targets resolved to source animation clips.',
      fixHint: 'Check the clip list from the GLB and update aliases or fallback rules.',
    });
  }

  if (input.viewGrid.x !== input.viewGrid.y) {
    add({
      code: 'ANIMATED_IMPOSTER_VIEW_GRID_NOT_SQUARE',
      severity: 'error',
      message: 'The first octahedral view grid must be square.',
      fixHint: 'Use 6x6 or 8x8 for the first implementation slice.',
    });
  }

  if (input.viewGrid.x < 4 || input.viewGrid.x > 16 || input.viewGrid.y < 4 || input.viewGrid.y > 16) {
    add({
      code: 'ANIMATED_IMPOSTER_VIEW_GRID_OUT_OF_RANGE',
      severity: 'error',
      message: 'View grid dimensions must stay between 4 and 16.',
      fixHint: 'Use 6x6 for the storage-safe spike or 8x8 for the quality spike.',
    });
  } else if (input.viewGrid.x !== 6 && input.viewGrid.x !== 8) {
    add({
      code: 'ANIMATED_IMPOSTER_VIEW_GRID_UNPROVEN',
      severity: 'warning',
      message: 'Only 6x6 and 8x8 view grids are part of the initial validation plan.',
      fixHint: 'Prefer 6x6 or 8x8 until yaw-sweep validation proves another grid.',
    });
  }

  if (input.tileSize < 32 || input.tileSize > 512 || input.tileSize % 8 !== 0) {
    add({
      code: 'ANIMATED_IMPOSTER_TILE_SIZE_OUT_OF_RANGE',
      severity: 'error',
      message: 'Tile size must be 32-512 pixels and divisible by 8.',
      fixHint: 'Use 96 for the first slice unless a validation gallery proves otherwise.',
    });
  } else if (input.tileSize !== 96) {
    add({
      code: 'ANIMATED_IMPOSTER_TILE_SIZE_UNPROVEN',
      severity: 'warning',
      message: 'The first implementation slice is budgeted around 96px tiles.',
      fixHint: 'Use 96px until storage and yaw-sweep validation produce a better target.',
    });
  }

  if (input.framesPerClip < 1 || input.framesPerClip > 64) {
    add({
      code: 'ANIMATED_IMPOSTER_FRAME_COUNT_OUT_OF_RANGE',
      severity: 'error',
      message: 'Frames per clip must be between 1 and 64.',
      fixHint: 'Use 8-16 frames per clip for the first slice.',
    });
  } else if (input.framesPerClip < 8 || input.framesPerClip > 16) {
    add({
      code: 'ANIMATED_IMPOSTER_FRAME_COUNT_UNPROVEN',
      severity: 'warning',
      message: 'The first implementation slice expects 8-16 frames per clip.',
      fixHint: 'Keep early bakes inside 8-16 frames before tuning cadence.',
    });
  }

  const manifest = input.source.manifest;
  if (
    manifest?.expectedBytes !== undefined &&
    manifest.actualBytes !== undefined &&
    manifest.expectedBytes !== manifest.actualBytes
  ) {
    add({
      code: 'ANIMATED_IMPOSTER_SOURCE_MANIFEST_BYTES_DRIFT',
      severity: 'warning',
      message: 'Source manifest byte count does not match the discovered GLB bytes.',
      fixHint: 'Refresh the source manifest before trusting cache or resumability decisions.',
    });
  }

  if (
    manifest?.expectedHash !== undefined &&
    manifest.actualHash !== undefined &&
    manifest.expectedHash !== manifest.actualHash
  ) {
    add({
      code: 'ANIMATED_IMPOSTER_SOURCE_MANIFEST_HASH_DRIFT',
      severity: 'warning',
      message: 'Source manifest hash does not match the discovered GLB hash.',
      fixHint: 'Refresh the source manifest or select the exact GLB revision intended for bake.',
    });
  }

  const storage = estimateAnimatedImposterStorage(input);
  if (!storage.fitsEnvelope) {
    add({
      code: 'ANIMATED_IMPOSTER_STORAGE_ENVELOPE_EXCEEDED',
      severity: 'error',
      message: `Raw animated imposter storage estimate is ${storage.totalRawBytes} bytes, above the ${storage.envelopeBytes} byte envelope.`,
      fixHint: 'Reduce view grid, tile size, frames per clip, clip count, or aux layers before baking.',
    });
  }

  return {
    ok: blockers.length === 0,
    blockers,
    warnings,
    clipResolution,
    storage,
    normalized: input,
  };
}

function bytesPerPixel(format: AnimatedImposterTextureFormat): number {
  return format === 'r8-palette-index' ? 1 : 4;
}

function toClipTargets(targets: AnimatedClipTarget[]): ClipTarget[] {
  return targets.map((target) => target as ClipTarget);
}

function fallbackMap(
  fallbacks: AnimatedImposterPreBakeConfig['clipFallbacks'],
): Partial<Record<ClipTarget, ClipTarget>> {
  const out: Partial<Record<ClipTarget, ClipTarget>> = {};
  for (const fallback of fallbacks) {
    out[fallback.target as ClipTarget] = fallback.donor as ClipTarget;
  }
  return out;
}
