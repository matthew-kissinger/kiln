/**
 * ImposterMeta zod schema round-trip tests.
 */

import { describe, expect, test } from 'bun:test';

import { IMPOSTER_SCHEMA_VERSION, ImposterMetaSchema, type ImposterMeta } from '../schema';

const VALID: ImposterMeta = {
  version: IMPOSTER_SCHEMA_VERSION,
  angles: 16,
  tilesX: 4,
  tilesY: 4,
  tileSize: 512,
  atlasWidth: 2048,
  atlasHeight: 2048,
  worldSize: 6.25,
  yOffset: 3.1,
  projection: 'orthographic',
  axis: 'hemi-y',
  hemi: true,
  layout: 'latlon',
  azimuths: [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2],
  elevations: [1.3, 0.87, 0.44, 0.087],
  bbox: { min: [-0.5, 0, -0.5], max: [0.5, 6.2, 0.5] },
  source: { path: 'foo.glb', bytes: 12345, tris: 987 },
  auxLayers: ['albedo', 'depth'],
  bgColor: 'transparent',
};

describe('ImposterMetaSchema', () => {
  test('accepts a valid payload', () => {
    expect(() => ImposterMetaSchema.parse(VALID)).not.toThrow();
  });

  test('round-trips via JSON', () => {
    const json = JSON.stringify(VALID);
    const decoded = ImposterMetaSchema.parse(JSON.parse(json));
    expect(decoded).toEqual(VALID);
  });

  test('rejects unsupported angles', () => {
    const bad = { ...VALID, angles: 24 as unknown as 16 };
    expect(() => ImposterMetaSchema.parse(bad)).toThrow();
  });

  test('rejects non-orthographic projection', () => {
    const bad = { ...VALID, projection: 'perspective' as unknown as 'orthographic' };
    expect(() => ImposterMetaSchema.parse(bad)).toThrow();
  });

  test('rejects mismatched version', () => {
    const bad = { ...VALID, version: 99 as unknown as typeof IMPOSTER_SCHEMA_VERSION };
    expect(() => ImposterMetaSchema.parse(bad)).toThrow();
  });

  test('source.path is optional', () => {
    const noPath = { ...VALID, source: { bytes: 0, tris: 0 } };
    expect(() => ImposterMetaSchema.parse(noPath)).not.toThrow();
  });
});
