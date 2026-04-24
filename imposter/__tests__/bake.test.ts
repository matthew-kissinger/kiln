/**
 * Live bake test — gated on KILN_IMPOSTER_LIVE=1.
 *
 * Real Chromium launch + GLB load + tile render. Slow (~15-30s). Skipped by
 * default so the core test suite stays fast. Exercises the full pipeline
 * against a known-good vegetation GLB from the Poly Pizza tier-A set.
 *
 * To run:
 *   KILN_IMPOSTER_LIVE=1 cd packages/core && bun test imposter/bake.test.ts
 */

import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { bakeImposter } from '../bake';
import { ImposterMetaSchema } from '../schema';

const LIVE = process.env.KILN_IMPOSTER_LIVE === '1';

// Vegetation-research fixture. Pick any bamboo variant; they're all small.
const here = resolve(fileURLToPath(import.meta.url), '..');
const FIXTURE_CANDIDATES = [
  // Primary: vegetation-research mount on the dev workstation.
  'C:/Users/Mattm/X/vegetation-research/assets/tier-a-psx/polypizza/bamboo-google-1/model.glb',
  // Fallback: any tiny GLB bundled in war-assets/ for CI.
  join(here, '../../../../../../war-assets/validation/gear.glb'),
];

function findFixture(): string | null {
  for (const p of FIXTURE_CANDIDATES) {
    if (existsSync(p)) return p;
  }
  return null;
}

describe.if(LIVE)('bakeImposter (live)', () => {
  test('bakes a 16-angle hemi atlas with non-zero content', async () => {
    const fixture = findFixture();
    if (!fixture) {
      throw new Error(
        `no imposter fixture found. Tried:\n  ${FIXTURE_CANDIDATES.join('\n  ')}`,
      );
    }
    const glb = readFileSync(fixture);

    const result = await bakeImposter(glb, {
      angles: 16,
      axis: 'hemi-y',
      tileSize: 256,
      auxLayers: ['depth'],
      bgColor: 'transparent',
      sourcePath: fixture,
    });

    // Meta shape is valid.
    const meta = ImposterMetaSchema.parse(result.meta);
    expect(meta.angles).toBe(16);
    expect(meta.tilesX).toBe(4);
    expect(meta.tilesY).toBe(4);
    expect(meta.atlasWidth).toBe(1024);
    expect(meta.atlasHeight).toBe(1024);
    expect(meta.source.tris).toBeGreaterThan(0);
    expect(meta.worldSize).toBeGreaterThan(0);

    // Albedo atlas is a valid PNG buffer.
    expect(result.atlas.byteLength).toBeGreaterThan(1000);
    expect(result.atlas.subarray(0, 4).toString('hex')).toBe('89504e47'); // PNG magic

    // Aux depth atlas present.
    expect(result.aux.depth).toBeTruthy();
    expect(result.aux.depth!.byteLength).toBeGreaterThan(1000);
  }, 60_000);
});

// When LIVE is off, still run at least one placeholder so bun reports the file.
describe.if(!LIVE)('bakeImposter (skipped)', () => {
  test('set KILN_IMPOSTER_LIVE=1 to run', () => {
    expect(LIVE).toBe(false);
  });
});
