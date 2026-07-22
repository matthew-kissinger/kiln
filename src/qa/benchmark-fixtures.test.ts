import { createHash } from 'node:crypto';

import { describe, expect, test } from 'bun:test';

import { validateAssetIntentV1 } from '../contracts';
import * as qaExports from './index';
import {
  ASSET_BENCHMARK_FIXTURES_CANONICAL_SHA256,
  ASSET_BENCHMARK_FIXTURES_V1,
  PANTHEON_INSPIRED_ROTUNDA_BENCHMARK_FIXTURE_V1,
  RETRO_FUTURIST_RALLY_COUPE_BENCHMARK_FIXTURE_V1,
  STATIC_ORNATE_ENERGY_CROSSBOW_BENCHMARK_FIXTURE_V1,
  WINDSWEPT_JAPANESE_MAPLE_BENCHMARK_FIXTURE_V1,
} from './benchmark-fixtures';

function expectDeepFrozen(value: unknown, path = 'root', seen = new Set<object>()): void {
  if (typeof value !== 'object' || value === null || seen.has(value)) return;
  seen.add(value);
  expect(Object.isFrozen(value), path).toBe(true);
  for (const [key, child] of Object.entries(value)) {
    expectDeepFrozen(child, `${path}.${key}`, seen);
  }
}

describe('next-cycle deterministic benchmark fixtures', () => {
  test('exports the exact four model-independent fixture identities', () => {
    expect(ASSET_BENCHMARK_FIXTURES_V1.map((fixture) => fixture.id)).toEqual([
      'retro-futurist-rally-coupe',
      'windswept-japanese-maple',
      'static-ornate-energy-crossbow',
      'pantheon-inspired-rotunda',
    ]);
    expect(ASSET_BENCHMARK_FIXTURES_V1).toEqual([
      RETRO_FUTURIST_RALLY_COUPE_BENCHMARK_FIXTURE_V1,
      WINDSWEPT_JAPANESE_MAPLE_BENCHMARK_FIXTURE_V1,
      STATIC_ORNATE_ENERGY_CROSSBOW_BENCHMARK_FIXTURE_V1,
      PANTHEON_INSPIRED_ROTUNDA_BENCHMARK_FIXTURE_V1,
    ]);
    expect(qaExports.ASSET_BENCHMARK_FIXTURES_V1).toBe(ASSET_BENCHMARK_FIXTURES_V1);
  });

  test('freezes prompts, canonical intent/config, expected semantics, and adversaries deeply', () => {
    expectDeepFrozen(ASSET_BENCHMARK_FIXTURES_V1, 'fixtures');
    for (const fixture of ASSET_BENCHMARK_FIXTURES_V1) {
      expect(validateAssetIntentV1(fixture.intent), fixture.id).toMatchObject({
        valid: true,
        issues: [],
      });
      expect(fixture.prompt.trim().length, fixture.id).toBeGreaterThan(80);
      expect(fixture.config).toEqual({
        schemaVersion: 1,
        mode: 'glb',
        style: 'detailed',
        includeAnimation: false,
        captureViews: true,
        toolSurface: 'unified',
      });
      expect(fixture.expectedSemantics.length, fixture.id).toBeGreaterThanOrEqual(4);
      expect(fixture.adversaries.length, fixture.id).toBeGreaterThanOrEqual(3);
    }
    expect(JSON.stringify(ASSET_BENCHMARK_FIXTURES_V1)).not.toMatch(
      /modelId|providerId|judgeModel|juryModel|modelRoster|juryRoster/,
    );
  });

  test('pins exact category intent and benchmark semantics without trademark or animation drift', () => {
    expect(RETRO_FUTURIST_RALLY_COUPE_BENCHMARK_FIXTURE_V1.intent).toMatchObject({
      category: 'vehicle',
      subtype: 'wheeled',
      vehicle: {
        subtype: 'wheeled',
        wheelCount: 4,
        axleCount: 2,
        steering: 'front',
        supportPolicy: 'grounded',
      },
    });
    expect(
      RETRO_FUTURIST_RALLY_COUPE_BENCHMARK_FIXTURE_V1.intent.capabilities.includes('driveable'),
    ).toBe(true);
    expect(
      RETRO_FUTURIST_RALLY_COUPE_BENCHMARK_FIXTURE_V1.intent.capabilities.includes('grounded'),
    ).toBe(true);
    expect(RETRO_FUTURIST_RALLY_COUPE_BENCHMARK_FIXTURE_V1.prompt).toContain(
      'no manufacturer badges',
    );

    expect(WINDSWEPT_JAPANESE_MAPLE_BENCHMARK_FIXTURE_V1.intent).toMatchObject({
      category: 'vegetation',
      subtype: 'tree',
      vegetation: {
        subtype: 'tree',
        growthState: 'lush',
        canopyProfile: 'broadleaf',
        standalone: true,
        grounded: true,
      },
    });
    expect(WINDSWEPT_JAPANESE_MAPLE_BENCHMARK_FIXTURE_V1.intent.forbiddenExtras).toEqual([
      'soil disk',
      'planter',
      'display base',
      'unrelated rocks',
      'floating leaves',
    ]);

    expect(STATIC_ORNATE_ENERGY_CROSSBOW_BENCHMARK_FIXTURE_V1.intent).toMatchObject({
      category: 'prop',
      subtype: 'energy-crossbow',
      capabilities: [],
      forbiddenExtras: ['display pedestal'],
    });
    expect('animation' in STATIC_ORNATE_ENERGY_CROSSBOW_BENCHMARK_FIXTURE_V1.intent).toBe(false);
    expect(STATIC_ORNATE_ENERGY_CROSSBOW_BENCHMARK_FIXTURE_V1.config.includeAnimation).toBe(false);

    expect(PANTHEON_INSPIRED_ROTUNDA_BENCHMARK_FIXTURE_V1.intent).toMatchObject({
      category: 'architecture',
      subtype: 'rotunda',
      architecture: {
        subtype: 'rotunda',
        storeyCount: 1,
        interiorMode: 'navigable',
        roofMode: 'fixed',
        roof: { type: 'dome', pitchDegrees: 0, closedEnds: false },
      },
    });
    expect(PANTHEON_INSPIRED_ROTUNDA_BENCHMARK_FIXTURE_V1.prompt).toContain('Pantheon-inspired');
    expect(PANTHEON_INSPIRED_ROTUNDA_BENCHMARK_FIXTURE_V1.prompt).not.toContain('faithful replica');
  });

  test('pins the canonical JSON digest and reproduces it byte-for-byte', () => {
    const json = JSON.stringify(ASSET_BENCHMARK_FIXTURES_V1);
    expect(JSON.stringify(ASSET_BENCHMARK_FIXTURES_V1)).toBe(json);
    expect(createHash('sha256').update(json).digest('hex')).toBe(
      ASSET_BENCHMARK_FIXTURES_CANONICAL_SHA256,
    );
  });
});
