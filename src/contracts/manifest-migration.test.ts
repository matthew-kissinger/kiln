import { expect, test } from 'bun:test';
import { createAssetIntentV1 } from './asset';
import { migrateAssetManifestV1ToRequirements } from './requirements-migration';
import { createAssetRequirementsV1 } from './requirements';

function manifest() {
  return {
    version: 'kiln.asset.v1',
    assetId: 'a_old',
    revisionId: 'r_old',
    name: 'Old watercraft',
    tags: ['boat'],
    createdAt: '2026-09-01T00:00:00.000Z',
    editable: true,
    files: {
      'asset.glb': { sha256: `sha256:${'a'.repeat(64)}`, bytes: 400 },
      'source.kiln.js': { sha256: `sha256:${'b'.repeat(64)}`, bytes: 120 },
    },
    build: {
      engine: 'old-engine',
      options: {
        category: 'vehicle',
        intent: createAssetIntentV1({ category: 'vehicle', vehicle: { subtype: 'watercraft' } }),
        optimize: 'off',
        geometryPolicy: 'warn',
      },
      warnings: [],
      qa: { disposition: 'pass' },
      rebuild: 'engine-required',
    },
  };
}
test('manifest migration retains original provenance and identifies a rebuild proposal without fabricating current QA', () => {
  const input = manifest();
  const before = JSON.stringify(input);
  const report = migrateAssetManifestV1ToRequirements(input);
  expect(report.status).toBe('review-required');
  expect(report.original).toEqual(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(report.proposal).toMatchObject({
    kind: 'kiln.asset-migration-proposal',
    schemaVersion: 1,
    rebuildRequired: true,
    originalRevision: { assetId: 'a_old', revisionId: 'r_old' },
    source: input.files['source.kiln.js'],
    retainedFiles: input.files,
    artifactVerification: 'not-performed',
    requirements: {
      requirements: { mobility: { value: { wheelCount: 0, supportPolicy: 'waterborne' } } },
    },
  });
  expect(report.proposal).not.toHaveProperty('build');
  expect(report.proposal).not.toHaveProperty('qa');
  expect(report.proposal).not.toHaveProperty('binding');
  expect(report.unresolved.some((i) => i.code === 'RULE_MIGRATION_UNQUALIFIED')).toBe(true);
  expect(report.changes.some((i) => i.from === 'build.qa')).toBe(true);
  input.files['asset.glb'].bytes = 999;
  expect(report.proposal!.retainedFiles['asset.glb']!.bytes).toBe(400);
});
test('a category-only manifest never invents a historical intent or activates a neutral default', () => {
  const input = manifest();
  delete (input.build.options as Record<string, unknown>).intent;
  const report = migrateAssetManifestV1ToRequirements(input);
  expect(report.status).toBe('invalid');
  expect(report.proposal).toBeUndefined();
  expect(report.original).toEqual(input);
  expect(report.unresolved.map((i) => i.code)).toContain('MISSING_LEGACY_INTENT');
});

test('an explicit recovered intent is distinguished from persisted history and cannot replace it', () => {
  const input = manifest();
  const legacyIntent = input.build.options.intent;
  expect(
    migrateAssetManifestV1ToRequirements(input, { legacyIntent }).unresolved.map((i) => i.code),
  ).toContain('LEGACY_INTENT_ALREADY_PRESENT');
  delete (input.build.options as Record<string, unknown>).intent;
  const recovered = migrateAssetManifestV1ToRequirements(input, { legacyIntent });
  expect(recovered.status).toBe('review-required');
  expect(recovered.original).toEqual(input);
  expect(recovered.original).not.toHaveProperty('build.options.intent');
  expect(recovered.recoveredIntent).toEqual({ source: 'host-reconstruction', value: legacyIntent });
  expect(recovered.changes.some((c) => c.from.startsWith('recoveredIntent.'))).toBe(true);
  expect(migrateAssetManifestV1ToRequirements(input, { legacyIntent: {} }).status).toBe('invalid');
});
test('unknown manifest fields, build options and contradictory category records remain visible', () => {
  const input = manifest();
  input.build.options.category = 'prop';
  Object.assign(input, { customPolicy: { clearance: 0.2 }, toString: 'custom legacy field' });
  Object.assign(input.build.options, { customGate: true });
  const report = migrateAssetManifestV1ToRequirements(input);
  expect(report.unresolved.map((i) => i.code)).toContain('LEGACY_CATEGORY_CONFLICT');
  expect(report.unresolved.map((i) => i.path)).toContain('customPolicy');
  expect(report.unresolved.map((i) => i.path)).toContain('toString');
  expect(report.unresolved.map((i) => i.path)).toContain('build.options.customGate');
  expect(report.original).toEqual(input);
  expect(report.proposal!.retainedBuildOptions).toEqual({
    optimize: 'off',
    geometryPolicy: 'warn',
    customGate: true,
  });
});
test('source-less, current-policy, malformed and non-JSON manifests cannot produce migration proposals', () => {
  const noSource = manifest();
  delete (noSource.files as Record<string, unknown>)['source.kiln.js'];
  noSource.editable = false;
  const current = manifest();
  Object.assign(current.build.options, { requirements: createAssetRequirementsV1() });
  const malformed = { ...manifest(), revisionId: '../escape' };
  const cyclic: Record<string, unknown> = {};
  cyclic.self = cyclic;
  for (const input of [noSource, current, malformed, cyclic]) {
    const report = migrateAssetManifestV1ToRequirements(input);
    expect(report.status).toBe('invalid');
    expect(report.proposal).toBeUndefined();
    expect(report.unresolved.length).toBeGreaterThan(0);
  }
});

test('legacy metadata cannot make the proposed current requirements invalid', () => {
  const input = manifest();
  input.tags.push('');
  const report = migrateAssetManifestV1ToRequirements(input);
  expect(report.status).toBe('invalid');
  expect(report.proposal).toBeUndefined();
  expect(report.original).toEqual(input);
  expect(
    report.unresolved.some((issue) => issue.path.startsWith('proposal.requirements.labels')),
  ).toBe(true);
});
