import { expect, test } from 'bun:test';
import { createAssetIntentV1 } from './asset';
import { migrateAssetIntentV1ToRequirements } from './requirements-migration';

function review(input: Parameters<typeof createAssetIntentV1>[0], rule: string) {
  const report = migrateAssetIntentV1ToRequirements(createAssetIntentV1(input));
  expect(report.status).toBe('review-required');
  return report.unresolved.find((issue) => issue.path === `qaRules.${rule}`)?.message;
}

test('legacy modular scope reports its missing join adapter independently of category', () => {
  const input = {
    category: 'prop',
    scope: { scope: 'modularSet', explicit: true },
  } as const;
  const message = review(input, 'MODULAR_JOIN_PROFILE');
  expect(message).toContain('enforce');
  expect(message).toContain('first reciprocal pair');
  expect(message).toContain('not evaluated');
  expect(review(input, 'ASSET_SCOPE_PROFILE')).toContain('observe');
});

test('prop review names the historical opening threshold and scene-dependent circular advice', () => {
  expect(review({ category: 'prop', subtype: 'chest' }, 'PROP_CAPABILITY_EXACT_PROFILE')).toContain(
    '0.08 m',
  );
  expect(review({ category: 'prop' }, 'PROP_ADVISORY_PROFILE')).toContain('circular');
  expect(review({ category: 'prop' }, 'PROP_ADVISORY_PROFILE')).toContain('scene');
});

test('rig migration reports the changed body-plan trigger without dropping the original request', () => {
  const original = createAssetIntentV1({
    category: 'character',
    capabilities: [],
  });
  const result = migrateAssetIntentV1ToRequirements(original);
  expect(result.original).toEqual(original);
  const rig = result.proposal?.requirements.rig;
  expect(rig?.state).toBe('requested');
  if (rig?.state !== 'requested') throw new Error('Missing retained rig request');
  expect(rig.value.bodyPlan).toBe(original.character?.bodyPlan);
  expect(
    result.unresolved.find((issue) => issue.path === 'qaRules.CHARACTER_PROFILE')?.message,
  ).toContain('articulated');
});

test('an inferred historical scope remains inferred and names its changed selection', () => {
  const result = migrateAssetIntentV1ToRequirements(createAssetIntentV1({ category: 'prop' }));
  expect(result.proposal?.scope?.state).toBe('inferred');
  expect(
    result.unresolved.find((issue) => issue.path === 'qaRules.ASSET_SCOPE_PROFILE')?.message,
  ).toContain('inferred');
});
