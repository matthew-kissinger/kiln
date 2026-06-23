import { describe, expect, test } from 'bun:test';

import {
  ATLAS_PROFILES,
  ATLAS_PROFILE_NAMES,
  isAtlasProfileName,
  validateAgainstAtlasProfile,
} from '../atlas-profiles';

describe('atlas-profiles catalog', () => {
  test('exports four named profiles', () => {
    const names: string[] = [...ATLAS_PROFILE_NAMES];
    expect(names.sort()).toEqual(
      ['canopy-balanced', 'canopy-hero', 'ground-compact', 'mid-balanced'],
    );
  });

  test('ground-compact does not require normal layer', () => {
    expect(ATLAS_PROFILES['ground-compact'].normalRequired).toBe(false);
  });

  test('canopy-* and mid-balanced require normal layer', () => {
    expect(ATLAS_PROFILES['mid-balanced'].normalRequired).toBe(true);
    expect(ATLAS_PROFILES['canopy-balanced'].normalRequired).toBe(true);
    expect(ATLAS_PROFILES['canopy-hero'].normalRequired).toBe(true);
  });

  test('hero allows the largest tiles', () => {
    expect(ATLAS_PROFILES['canopy-hero'].maxTileSize).toBe(1024);
    expect(ATLAS_PROFILES['ground-compact'].maxTileSize).toBe(256);
  });
});

describe('isAtlasProfileName', () => {
  test('accepts the four named profiles', () => {
    expect(isAtlasProfileName('ground-compact')).toBe(true);
    expect(isAtlasProfileName('mid-balanced')).toBe(true);
    expect(isAtlasProfileName('canopy-balanced')).toBe(true);
    expect(isAtlasProfileName('canopy-hero')).toBe(true);
  });

  test('rejects non-string and unknown values', () => {
    expect(isAtlasProfileName('made-up-profile')).toBe(false);
    expect(isAtlasProfileName(undefined)).toBe(false);
    expect(isAtlasProfileName(42)).toBe(false);
    expect(isAtlasProfileName(null)).toBe(false);
  });
});

describe('validateAgainstAtlasProfile', () => {
  test('clean ground-compact meta passes', () => {
    const result = validateAgainstAtlasProfile(
      { tileSize: 256, angles: 8 },
      'ground-compact',
    );
    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
    expect(result.profile).toBe('ground-compact');
  });

  test('flags tileSize over the profile max', () => {
    const result = validateAgainstAtlasProfile(
      { tileSize: 1024, angles: 8 },
      'ground-compact',
    );
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.field === 'tileSize')).toBe(true);
  });

  test('flags angles over the profile max', () => {
    const result = validateAgainstAtlasProfile(
      { tileSize: 256, angles: 32 },
      'ground-compact',
    );
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.field === 'angles')).toBe(true);
  });

  test('flags missing normal aux layer when required', () => {
    const result = validateAgainstAtlasProfile(
      { tileSize: 512, angles: 16, auxLayers: [], normalSpace: 'capture-view' },
      'mid-balanced',
    );
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.field === 'normal-aux-layer')).toBe(true);
  });

  test('flags wrong normalSpace when normal layer is required', () => {
    const result = validateAgainstAtlasProfile(
      { tileSize: 512, angles: 16, auxLayers: ['normal'], normalSpace: 'world' },
      'canopy-balanced',
    );
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.field === 'normal-space')).toBe(true);
  });

  test('passes valid canopy-hero meta with normal layer + capture-view space', () => {
    const result = validateAgainstAtlasProfile(
      {
        tileSize: 1024,
        angles: 32,
        auxLayers: ['normal'],
        normalSpace: 'capture-view',
      },
      'canopy-hero',
    );
    expect(result.ok).toBe(true);
    expect(result.limits.maxTileSize).toBe(1024);
  });

  test('skips numeric checks if fields are absent (read-only validator)', () => {
    const result = validateAgainstAtlasProfile({}, 'ground-compact');
    expect(result.ok).toBe(true);
  });
});
