import { describe, expect, test } from 'bun:test';

import type { CharacterBodyPlan } from '../character';
import {
  createAssetIntentV1,
  type AssetIntentV1,
  type CharacterLocomotionMode,
} from '../contracts';
import { buildUserPrompt } from '../prompt';
import { evaluateCharacterQa } from './character';
import { CHARACTER_ADVISORY_QA_RULE, evaluateCharacterAdvisoryQa } from './character-advisory';
import {
  W6_CHARACTER_BODY_PLAN_COVERAGE,
  W6_CHARACTER_PROMPT_CORPUS,
  W6_CHARACTER_VEHICLE_FIXTURE_CORPUS,
  W6_VEHICLE_PROMPT_CORPUS,
} from './character-vehicle-corpus';
import { QaRegistry } from './registry';
import { evaluateVehicleQa } from './vehicle';
import { VEHICLE_W6_ADVISORY_QA_RULE, evaluateVehicleAdvisoryQa } from './vehicle-advisory';

function evaluate(
  fixture: ReturnType<(typeof W6_CHARACTER_VEHICLE_FIXTURE_CORPUS)[number]['build']>,
) {
  const context = {
    intent: fixture.intent,
    scene: fixture.scene,
    clips: fixture.clips,
  };
  return fixture.intent.category === 'character'
    ? [...evaluateCharacterQa(context), ...evaluateCharacterAdvisoryQa(context)]
    : [...evaluateVehicleQa(context), ...evaluateVehicleAdvisoryQa(context)];
}

describe('CHAR-032 / VEH-030 W6 deterministic corpus', () => {
  test('covers every requested body plan, vehicle subtype, reciprocal pair, and adversary', () => {
    expect(W6_CHARACTER_BODY_PLAN_COVERAGE).toEqual([
      'biped',
      'quadruped',
      'avian',
      'serpentine',
      'multi-limb',
      'wheeled',
    ]);
    expect(new Set(W6_VEHICLE_PROMPT_CORPUS.map((entry) => entry.subtype))).toEqual(
      new Set([
        'wheeled',
        'tracked',
        'rail',
        'watercraft',
        'fixed-wing',
        'rotorcraft',
        'hover',
        'walking',
        'custom',
      ]),
    );
    expect(W6_CHARACTER_VEHICLE_FIXTURE_CORPUS).toHaveLength(40);
    const ids = new Set(W6_CHARACTER_VEHICLE_FIXTURE_CORPUS.map((entry) => entry.id));
    for (const entry of W6_CHARACTER_VEHICLE_FIXTURE_CORPUS) {
      expect(ids.has(entry.pairId), entry.id).toBe(true);
      const pair = W6_CHARACTER_VEHICLE_FIXTURE_CORPUS.find(
        (candidate) => candidate.id === entry.pairId,
      )!;
      expect(pair.pairId).toBe(entry.id);
      expect(pair.kind).not.toBe(entry.kind);
    }
    for (const id of [
      'vehicle-offset-hub-failure',
      'vehicle-wrong-axle-failure',
      'vehicle-duplicate-wheel-failure',
      'vehicle-buried-tire-failure',
      'vehicle-sideways-body-failure',
      'vehicle-open-track-failure',
      'vehicle-off-center-rotor-failure',
    ]) {
      expect(ids.has(id), id).toBe(true);
    }
  });

  for (const fixture of W6_CHARACTER_VEHICLE_FIXTURE_CORPUS) {
    test(`${fixture.id} produces only its declared reciprocal expectations`, () => {
      const findings = evaluate(fixture.build());
      const codes = findings.map((finding) => finding.code);
      for (const code of fixture.expectedCodes) {
        expect(codes, `${fixture.id}:${code}`).toContain(code);
        const found = findings.find((finding) => finding.code === code)!;
        expect(found.measurement, `${fixture.id}:${code}:measurement`).toBeDefined();
        expect(found.viewHints?.length, `${fixture.id}:${code}:views`).toBeGreaterThan(0);
      }
      for (const code of fixture.forbiddenCodes) {
        expect(codes, `${fixture.id}:${code}`).not.toContain(code);
      }
    });
  }

  test('fixture findings and measurements reproduce byte-for-byte across builds', () => {
    const evidence = () =>
      JSON.stringify(
        W6_CHARACTER_VEHICLE_FIXTURE_CORPUS.map((fixture) => ({
          id: fixture.id,
          findings: evaluate(fixture.build()).map((finding) => ({
            code: finding.code,
            disposition: finding.disposition,
            affected: finding.affected,
            measurement: finding.measurement,
            viewHints: finding.viewHints,
          })),
        })),
      );
    expect(evidence()).toBe(evidence());
  });
});

describe('W6 advisory rollout boundary', () => {
  test('registry rewrites every character and vehicle heuristic to observe', () => {
    const registry = new QaRegistry([CHARACTER_ADVISORY_QA_RULE, VEHICLE_W6_ADVISORY_QA_RULE]);
    for (const fixture of W6_CHARACTER_VEHICLE_FIXTURE_CORPUS.filter(
      (entry) =>
        entry.kind === 'failure' &&
        !entry.expectedCodes.includes('CHAR_HELD_ITEM_GRIP_BREAK') &&
        !entry.expectedCodes.includes('VEH_DUPLICATE_ASSEMBLY') &&
        !entry.expectedCodes.includes('VEH_SUPPORT_SET_MISSING') &&
        !entry.expectedCodes.includes('VEH_SUPPORT_PLANE') &&
        !entry.expectedCodes.includes('VEH_WHEEL_CONCENTRICITY') &&
        !entry.expectedCodes.includes('VEH_WHEEL_AXLE_AXIS') &&
        !entry.expectedCodes.includes('VEH_CONTACT_PLANE') &&
        !entry.expectedCodes.includes('VEH_ROTOR_PIVOT'),
    )) {
      const payload = fixture.build();
      const result = registry.run({
        intent: payload.intent,
        scene: payload.scene,
        clips: payload.clips,
      });
      expect(result.findings.length, fixture.id).toBeGreaterThan(0);
      expect(
        result.findings.every((finding) => finding.disposition === 'observe'),
        fixture.id,
      ).toBe(true);
      expect(
        result.decisions.every((decision) => decision.mode === 'observe'),
        fixture.id,
      ).toBe(true);
    }
  });

  test('only explicit grip, duplicate-corner, and declared support contracts block', () => {
    for (const [id, code] of [
      ['character-grip-motion-failure', 'CHAR_HELD_ITEM_GRIP_BREAK'],
      ['vehicle-duplicate-wheel-failure', 'VEH_DUPLICATE_ASSEMBLY'],
      ['vehicle-support-set-failure', 'VEH_SUPPORT_SET_MISSING'],
      ['vehicle-support-plane-failure', 'VEH_SUPPORT_PLANE'],
    ] as const) {
      const fixture = W6_CHARACTER_VEHICLE_FIXTURE_CORPUS.find((entry) => entry.id === id)!;
      const finding = evaluate(fixture.build()).find((entry) => entry.code === code)!;
      expect(finding.disposition, id).toBe('block');
      expect(finding.repairText?.length, id).toBeGreaterThan(50);
    }
  });
});

describe('CHAR-031/032 and VEH-030 resolved prompt corpus', () => {
  const locomotion = (subtype: string, motion: 'static' | 'animated'): CharacterLocomotionMode => {
    if (motion === 'static') return 'stationary';
    if (subtype === 'avian') return 'fly';
    if (subtype === 'serpentine') return 'slither';
    if (subtype === 'wheeled') return 'roll';
    return 'walk';
  };

  for (const entry of W6_CHARACTER_PROMPT_CORPUS) {
    test(`${entry.id} injects only its resolved body-plan contract`, () => {
      const movement = locomotion(entry.subtype, entry.motion);
      const intent = createAssetIntentV1({
        category: 'character',
        character: {
          bodyPlan: entry.subtype as CharacterBodyPlan,
          grounded: movement !== 'fly',
          locomotion: movement,
          gait: movement,
          rootMotion: 'inPlace',
          clips: entry.motion === 'animated' ? [{ name: movement, playback: 'loop' }] : [],
        },
      });
      const prompt = buildUserPrompt({
        prompt: entry.prompt,
        category: 'character',
        mode: 'glb',
        intent,
        includeAnimation: entry.motion === 'animated',
      });
      for (const expected of entry.expectedGuidance) expect(prompt).toContain(expected);
      for (const other of ['BIPED', 'QUADRUPED', 'AVIAN', 'SERPENTINE', 'MULTI-LIMB']) {
        if (other === entry.subtype.toUpperCase()) continue;
        expect(prompt).not.toContain(`Resolved body plan: ${other}.`);
      }
    });
  }

  for (const entry of W6_VEHICLE_PROMPT_CORPUS) {
    test(`${entry.id} injects subtype-specific vehicle guidance`, () => {
      const intent = createAssetIntentV1({
        category: 'vehicle',
        subtype: entry.subtype,
        vehicle: { subtype: entry.subtype as NonNullable<AssetIntentV1['vehicle']>['subtype'] },
      });
      const prompt = buildUserPrompt({
        prompt: entry.prompt,
        category: 'vehicle',
        mode: 'glb',
        intent,
        includeAnimation: entry.motion === 'animated',
      });
      expect(prompt).toContain('## Resolved Vehicle Contract');
      for (const expected of entry.expectedGuidance) expect(prompt).toContain(expected);
      expect(prompt).not.toContain('## Resolved Character Contract');
    });
  }
});
