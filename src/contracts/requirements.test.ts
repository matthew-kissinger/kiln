import { describe, expect, test } from 'bun:test';
import { createAssetIntentV1 } from './asset';
import {
  createAssetRequirementsV1,
  requestedRequirement,
  validateAssetRequirementsV1,
} from './requirements';
import { migrateAssetIntentV1ToRequirements } from './requirements-migration';

describe('neutral requirements contract', () => {
  test('an unspecified brief invents no category, scope, grounding or material demand', () => {
    const result = createAssetRequirementsV1();
    expect(result.kind).toBe('kiln.asset-requirements');
    expect(result.requirements).toEqual({});
    expect(result.labels).toEqual([]);
    expect(result.scope).toBeUndefined();
    expect(result).not.toHaveProperty('category');
    expect(result).not.toHaveProperty('qaProfile');
  });

  test('structure, navigation and mobility compose without a category', () => {
    const result = createAssetRequirementsV1({
      labels: ['coliseum', 'walking platform'],
      requirements: {
        structure: requestedRequirement({ storeyCount: 6, roofMode: 'none' }),
        navigation: requestedRequirement({}),
        mobility: requestedRequirement({ supportPolicy: 'waterborne' }),
      },
    });
    expect(result.requirements.structure).toMatchObject({ value: { storeyCount: 6 } });
    expect(result.requirements.mobility).toMatchObject({ value: { supportPolicy: 'waterborne' } });
    expect(result.requirements.mobility).not.toHaveProperty('value.wheelCount');
    expect(result.requirements).not.toHaveProperty('grounding');
  });

  test('requested, inferred, unknown and inapplicable have distinct representations', () => {
    const result = createAssetRequirementsV1({
      requirements: {
        grounding: { state: 'inapplicable', reason: 'Floating sculpture' },
        navigation: { state: 'unknown' },
        articulation: { state: 'inferred', value: {}, reason: 'Suggested by the brief' },
        opening: requestedRequirement({}),
      },
    });
    expect(result.requirements.grounding?.state).toBe('inapplicable');
    expect(result.requirements.navigation?.state).toBe('unknown');
    expect(result.requirements.articulation?.state).toBe('inferred');
    expect(result.requirements.opening?.state).toBe('requested');
  });

  test.each([
    { category: 'prop' },
    { qaProfile: 'prop.default' },
    { requirements: { grounded: { state: 'requested', value: {} } } },
    { requirements: { mobility: { state: 'requested', value: { wheels: 4 } } } },
    { requirements: { grounding: { state: 'unknown', value: { planeY: 0 } } } },
    { requirements: { grounding: { state: 'requested' } } },
    { requirements: { structure: { state: 'requested', value: { storeyCount: 1.5 } } } },
    { requirements: { bounds: { state: 'requested', value: { x: Infinity, units: 'm' } } } },
    { requirements: { navigation: { state: 'requested', value: { minWidth: 0 } } } },
    { requirements: { navigation: { state: 'requested', value: { minHeight: -1 } } } },
    { requirements: { navigation: { state: 'requested', value: { minHeight: Infinity } } } },
  ])('rejects retired/misspelled fields or invalid values: %j', (input) => {
    expect(() => createAssetRequirementsV1(input as never)).toThrow();
  });

  test('validating old records never auto-converts them', () => {
    const result = validateAssetRequirementsV1(createAssetIntentV1({ category: 'prop' }));
    expect(result.valid).toBe(false);
    expect(result.value).toBeUndefined();
  });

  test('explicit migration preserves historical navigation size advice as requirements', () => {
    const result = migrateAssetIntentV1ToRequirements(
      createAssetIntentV1({ category: 'environment', capabilities: ['navigable'] }),
    );
    expect(result.proposal?.requirements.navigation).toMatchObject({
      state: 'requested',
      value: { minWidth: 0.8, minHeight: 1.8 },
    });
  });

  test('returns detached validated values', () => {
    const input = createAssetRequirementsV1({ labels: ['first'] });
    const result = validateAssetRequirementsV1(input);
    input.labels.push('second');
    expect(result.value?.labels).toEqual(['first']);
  });

  test.each([
    { grounding: requestedRequirement({}), rig: requestedRequirement({ grounded: false }) },
    { grounding: requestedRequirement({}), foliage: requestedRequirement({ grounded: false }) },
    { grounding: { state: 'inapplicable' }, rig: requestedRequirement({ grounded: true }) },
    {
      grounding: requestedRequirement({}),
      mobility: requestedRequirement({ supportPolicy: 'waterborne' }),
    },
    {
      rig: requestedRequirement({ grounded: true }),
      foliage: requestedRequirement({ grounded: false }),
    },
    { tiling: requestedRequirement({}), spatialLayout: requestedRequirement({ tileable: false }) },
    {
      navigation: requestedRequirement({}),
      spatialLayout: requestedRequirement({ navigable: false }),
    },
    {
      navigation: { state: 'inapplicable' },
      spatialLayout: requestedRequirement({ navigable: true }),
    },
    {
      structure: requestedRequirement({ enterable: true }),
      access: requestedRequirement({ enterable: false }),
    },
    {
      structure: requestedRequirement({ interiorMode: 'navigable' }),
      access: requestedRequirement({ enterable: false }),
    },
    {
      representation: requestedRequirement({ runtimeShader: false }),
      material: requestedRequirement({ mode: 'runtimeTsl' }),
    },
    { parts: requestedRequirement({ required: ['door'], forbiddenExtras: ['door'] }) },
  ])('rejects contradictory explicit obligations: %j', (requirements) => {
    expect(() => createAssetRequirementsV1({ requirements } as never)).toThrow();
  });

  test('conflicting inferred advice never overrides a requested obligation', () => {
    expect(() =>
      createAssetRequirementsV1({
        requirements: {
          grounding: requestedRequirement({}),
          rig: { state: 'inferred', value: { grounded: false } },
        },
      }),
    ).not.toThrow();
  });

  test('outdoor navigation does not require an enterable interior', () => {
    expect(() =>
      createAssetRequirementsV1({
        requirements: {
          navigation: requestedRequirement({}),
          structure: requestedRequirement({ interiorMode: 'none', roofMode: 'none' }),
          access: requestedRequirement({ enterable: false }),
        },
      }),
    ).not.toThrow();
  });

  test('new descriptive subtypes and roof shapes do not require a taxonomy update', () => {
    expect(() =>
      createAssetRequirementsV1({
        requirements: {
          structure: requestedRequirement({
            subtype: 'kinetic pavilion',
            roof: { type: 'hyperbolic-paraboloid' },
          }),
          mobility: requestedRequirement({ subtype: 'magnetic climber' }),
          foliage: requestedRequirement({ subtype: 'alien canopy' }),
          spatialLayout: requestedRequirement({ subtype: 'coliseum terraces' }),
        },
      }),
    ).not.toThrow();
  });
});

describe('explicit V1 intent conversion', () => {
  test.each([
    'prop',
    'character',
    'vfx',
    'environment',
    'architecture',
    'vegetation',
    'vehicle',
  ] as const)(
    'preserves original %s record and surfaces unqualified rule migration',
    (category) => {
      const original = createAssetIntentV1({ category });
      const before = JSON.stringify(original);
      const result = migrateAssetIntentV1ToRequirements(original);
      expect(result.status).toBe('review-required');
      expect(result.original).toEqual(original);
      expect(result.proposal?.labels).toContain(category);
      expect(result.unresolved.length).toBeGreaterThan(0);
      expect(JSON.stringify(original)).toBe(before);
      expect(result.proposal && validateAssetRequirementsV1(result.proposal).valid).toBe(true);
    },
  );

  test('keeps zero-wheel watercraft and all propulsion/support obligations', () => {
    const original = createAssetIntentV1({
      category: 'vehicle',
      vehicle: { subtype: 'watercraft' },
    });
    const { proposal } = migrateAssetIntentV1ToRequirements(original);
    expect(proposal?.requirements.mobility).toMatchObject({
      state: 'requested',
      value: { wheelCount: 0, supportPolicy: 'waterborne' },
    });
    expect(proposal?.requirements.mobility).toMatchObject({ value: original.vehicle! });
    expect(proposal?.requirements.grounding).toBeUndefined();
  });

  test('retains architecture defaults as explicit old obligations instead of inventing neutral defaults', () => {
    const original = createAssetIntentV1({ category: 'architecture' });
    const { proposal, changes } = migrateAssetIntentV1ToRequirements(original);
    expect(proposal?.requirements.structure).toMatchObject({ value: original.architecture! });
    expect(proposal?.requirements.navigation?.state).toBe('requested');
    expect(changes.some((change) => change.from === 'architecture')).toBe(true);
  });

  test('never drops custom profiles or unknown persisted fields', () => {
    const original = {
      ...createAssetIntentV1({ category: 'prop', qaProfile: 'customer.strict' }),
      extraObligation: true,
    };
    const result = migrateAssetIntentV1ToRequirements(original);
    expect(result.unresolved.map((entry) => entry.code)).toContain('CUSTOM_QA_PROFILE');
    expect(result.unresolved.map((entry) => entry.code)).toContain('UNMAPPED_LEGACY_FIELD');
    expect(result.original).toHaveProperty('extraObligation', true);
  });

  test('invalid old records return no executable proposal', () => {
    const result = migrateAssetIntentV1ToRequirements({ schemaVersion: 1, category: 'typo' });
    expect(result.status).toBe('invalid');
    expect(result.proposal).toBeUndefined();
    expect(result.unresolved.length).toBeGreaterThan(0);
  });

  test('preserves and flags unknown nested scope/frame obligations', () => {
    const original = createAssetIntentV1({ category: 'prop' });
    const result = migrateAssetIntentV1ToRequirements({
      ...original,
      scope: { ...original.scope, maxMembers: 3 },
      frame: { ...original.frame, handedness: 'right' },
    });
    expect(result.unresolved.map((entry) => entry.path)).toContain('scope.maxMembers');
    expect(result.unresolved.map((entry) => entry.path)).toContain('frame.handedness');
  });

  test('cyclic, nonfinite and non-JSON legacy inputs fail explicitly', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    for (const input of [cyclic, { value: NaN }, { value: () => 1 }]) {
      expect(migrateAssetIntentV1ToRequirements(input)).toMatchObject({
        status: 'invalid',
        unresolved: [{ code: 'NON_JSON_LEGACY_INTENT' }],
      });
    }
  });

  test('contradictory old obligations stop conversion instead of dropping one', () => {
    const original = createAssetIntentV1({
      category: 'vehicle',
      vehicle: { subtype: 'watercraft' },
      capabilities: ['grounded'],
    });
    const result = migrateAssetIntentV1ToRequirements(original);
    expect(result.status).toBe('invalid');
    expect(result.proposal).toBeUndefined();
    expect(result.original).toEqual(original);
    expect(
      result.unresolved.some((issue) => issue.message.includes('Contradictory grounding')),
    ).toBe(true);
  });
});
