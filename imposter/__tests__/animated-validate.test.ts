/**
 * Animated imposter pre-bake validator tests.
 */

import { describe, expect, test } from 'bun:test';

import {
  estimateAnimatedImposterStorage,
  validateAnimatedImposterPreBake,
} from '../animated-validate';
import type { AnimatedImposterPreBakeInput } from '../animated-schema';

const VALID = {
  source: {
    path: 'characters/nva.glb',
    bytes: 4_200_000,
    tris: 12_000,
    skinned: true,
    clipNames: [
      'CharacterArmature|Idle',
      'CharacterArmature|Walk',
      'CharacterArmature|Run',
      'CharacterArmature|Slash',
    ],
  },
  clipTargets: ['idle', 'walking'],
  viewGrid: { x: 6, y: 6 },
  tileSize: 96,
  framesPerClip: 8,
  textureFormat: 'r8-palette-index',
  textureLayout: 'array',
  includeNormal: false,
  includeDepth: false,
  paletteWidth: 128,
  paletteRows: 1,
  envelopeBytes: 30 * 1024 * 1024,
  clipFallbacks: [],
} satisfies AnimatedImposterPreBakeInput;

describe('estimateAnimatedImposterStorage', () => {
  test('estimates one array layer per animation frame', () => {
    const storage = estimateAnimatedImposterStorage(VALID);
    expect(storage.atlasWidth).toBe(576);
    expect(storage.atlasHeight).toBe(576);
    expect(storage.layers).toBe(16);
    expect(storage.bytesPerColorPixel).toBe(1);
    expect(storage.colorBytes).toBe(576 * 576 * 16);
    expect(storage.paletteBytes).toBe(512);
    expect(storage.totalRawBytes).toBe(storage.colorBytes + storage.paletteBytes);
    expect(storage.fitsEnvelope).toBe(true);
  });

  test('accounts for rgba debug output and aux layers', () => {
    const storage = estimateAnimatedImposterStorage({
      ...VALID,
      textureFormat: 'rgba8',
      includeNormal: true,
      includeDepth: true,
    });
    const pixels = 576 * 576 * 16;
    expect(storage.colorBytes).toBe(pixels * 4);
    expect(storage.normalBytes).toBe(pixels * 4);
    expect(storage.depthBytes).toBe(pixels * 4);
    expect(storage.paletteBytes).toBe(0);
  });
});

describe('validateAnimatedImposterPreBake', () => {
  test('accepts the first-slice contract without warnings', () => {
    const report = validateAnimatedImposterPreBake(VALID);
    expect(report.ok).toBe(true);
    expect(report.blockers).toEqual([]);
    expect(report.warnings).toEqual([]);
    expect(report.clipResolution.clips.idle?.resolved).toBe('Idle');
    expect(report.clipResolution.clips.walking?.resolved).toBe('Walk');
  });

  test('blocks non-skinned sources', () => {
    const report = validateAnimatedImposterPreBake({
      ...VALID,
      source: { ...VALID.source, skinned: false },
    });
    expect(report.ok).toBe(false);
    expect(report.blockers.map((issue) => issue.code)).toContain('ANIMATED_IMPOSTER_SOURCE_NOT_SKINNED');
  });

  test('surfaces missing clip coverage without hiding the rest of the contract', () => {
    const report = validateAnimatedImposterPreBake({
      ...VALID,
      clipTargets: ['idle', 'death'],
    });
    expect(report.ok).toBe(true);
    expect(report.warnings.map((issue) => issue.code)).toContain('ANIMATED_IMPOSTER_CLIP_MISSING');
    expect(report.clipResolution.clips.death?.resolved).toBeNull();
  });

  test('reports explicit fallback clips', () => {
    const report = validateAnimatedImposterPreBake({
      ...VALID,
      source: {
        ...VALID.source,
        clipNames: ['CharacterArmature|Idle', 'CharacterArmature|Run'],
      },
      clipTargets: ['idle', 'walking', 'running'],
      clipFallbacks: [{ target: 'walking', donor: 'running' }],
    });
    expect(report.ok).toBe(true);
    expect(report.clipResolution.clips.walking?.resolved).toBe('Run');
    expect(report.clipResolution.clips.walking?.matchedBy).toBe('fallback');
    expect(report.warnings.map((issue) => issue.code)).toContain('ANIMATED_IMPOSTER_CLIP_FALLBACK');
  });

  test('blocks if no requested clips resolve', () => {
    const report = validateAnimatedImposterPreBake({
      ...VALID,
      source: { ...VALID.source, clipNames: ['Jump'] },
      clipTargets: ['idle', 'walking'],
    });
    expect(report.ok).toBe(false);
    expect(report.blockers.map((issue) => issue.code)).toContain('ANIMATED_IMPOSTER_NO_RESOLVED_CLIPS');
  });

  test('warns when the view grid or frame count leaves the initial validation lane', () => {
    const report = validateAnimatedImposterPreBake({
      ...VALID,
      viewGrid: { x: 4, y: 4 },
      tileSize: 128,
      framesPerClip: 24,
    });
    expect(report.ok).toBe(true);
    expect(report.warnings.map((issue) => issue.code)).toContain('ANIMATED_IMPOSTER_VIEW_GRID_UNPROVEN');
    expect(report.warnings.map((issue) => issue.code)).toContain('ANIMATED_IMPOSTER_TILE_SIZE_UNPROVEN');
    expect(report.warnings.map((issue) => issue.code)).toContain('ANIMATED_IMPOSTER_FRAME_COUNT_UNPROVEN');
  });

  test('blocks invalid octahedral grids and tile sizes', () => {
    const report = validateAnimatedImposterPreBake({
      ...VALID,
      viewGrid: { x: 6, y: 8 },
      tileSize: 95,
    });
    expect(report.ok).toBe(false);
    expect(report.blockers.map((issue) => issue.code)).toContain('ANIMATED_IMPOSTER_VIEW_GRID_NOT_SQUARE');
    expect(report.blockers.map((issue) => issue.code)).toContain('ANIMATED_IMPOSTER_TILE_SIZE_OUT_OF_RANGE');
  });

  test('reports source manifest drift', () => {
    const report = validateAnimatedImposterPreBake({
      ...VALID,
      source: {
        ...VALID.source,
        manifest: {
          expectedBytes: 1,
          actualBytes: 2,
          expectedHash: 'old',
          actualHash: 'new',
        },
      },
    });
    expect(report.ok).toBe(true);
    expect(report.warnings.map((issue) => issue.code)).toContain('ANIMATED_IMPOSTER_SOURCE_MANIFEST_BYTES_DRIFT');
    expect(report.warnings.map((issue) => issue.code)).toContain('ANIMATED_IMPOSTER_SOURCE_MANIFEST_HASH_DRIFT');
  });

  test('blocks storage estimates that exceed the per-character envelope', () => {
    const report = validateAnimatedImposterPreBake({
      ...VALID,
      clipTargets: ['idle', 'walking', 'running', 'shoot'],
      viewGrid: { x: 8, y: 8 },
      framesPerClip: 16,
    });
    expect(report.ok).toBe(false);
    expect(report.storage.fitsEnvelope).toBe(false);
    expect(report.blockers.map((issue) => issue.code)).toContain('ANIMATED_IMPOSTER_STORAGE_ENVELOPE_EXCEEDED');
  });
});
