import { expect, test } from 'bun:test';
import * as THREE from 'three';
import { stampSemanticMetadataV1 } from '../contracts';
import { createAssetRequirementsV1, type AssetRequirementsV1 } from '../contracts/requirements';
import { createAssetRequirementsStore } from '../requirements-store';
import { resolveRequirementsContext } from '../requirements-context';
import { analyzeAssetScopeObservationV1 } from './breadth-evidence';
import { runRequirementsSceneQa } from './requirements-run';
import { validateRequirementsQaReport } from './requirements-report';

function member(name: string) {
  const group = new THREE.Group();
  group.name = name;
  stampSemanticMetadataV1(group, { roles: ['asset.member'] });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
  mesh.name = `${name}Body`;
  group.add(mesh);
  return group;
}
function cluster() {
  const root = new THREE.Group();
  root.name = 'Assembly';
  root.add(member('Left'), member('Right'));
  return root;
}
function report(
  scene: unknown,
  scope: AssetRequirementsV1['scope'] = { state: 'requested', value: 'single' },
  labels: string[] = [],
  policy = {},
) {
  const binding = createAssetRequirementsStore().host.bind(
    { taskId: 'scope', lineageId: 'one' },
    createAssetRequirementsV1({ scope, labels }),
    { actor: 'owner', source: 'brief', reason: 'Requested asset scope' },
  );
  const context = resolveRequirementsContext(binding);
  const result = runRequirementsSceneQa(context, scene, [], policy);
  expect(validateRequirementsQaReport(result, context)).toEqual(result);
  return result;
}
const scopeFindings = (result: ReturnType<typeof report>) =>
  Object.values(result.dimensions).flatMap((d) =>
    d.findings.filter((f) => f.code.startsWith('ASSET_SCOPE_')),
  );

test('requested scope reaches actual scene measurements independently of descriptive labels', () => {
  for (const labels of [[], ['prop'], ['environment', 'architecture']]) {
    const result = report(cluster(), { state: 'requested', value: 'single' }, labels);
    expect(result.rules.find((r) => r.id === 'ASSET_SCOPE_PROFILE')).toMatchObject({
      status: 'evaluated',
      mode: 'observe',
    });
    expect(scopeFindings(result)).toEqual([
      expect.objectContaining({
        code: 'ASSET_SCOPE_EXPLICIT_SINGLE_CLUSTER',
        disposition: 'observe',
        dimension: 'promptAlignment',
      }),
    ]);
    expect(result.dimensions.promptAlignment.metrics).toMatchObject({
      scopeTopLevelAssetRoots: 2,
      scopeReusableMemberCount: 2,
    });
    // These are advisory semantic signals, never a scope certification.
    expect(result.acceptance).toBe('incomplete');
  }
});

test('inference, unknown scope and labels do not turn assemblies into scope violations', () => {
  for (const scope of [
    { state: 'inferred', value: 'single' },
    { state: 'unknown' },
    { state: 'inapplicable' },
  ] as const) {
    const result = report(cluster(), scope, ['single', 'prop']);
    expect(scopeFindings(result)).toEqual([]);
    expect(result.rules.find((r) => r.id === 'ASSET_SCOPE_PROFILE')?.status).toBe('notRequested');
    expect(result.dimensions.promptAlignment.metrics).toBeUndefined();
    expect(result.acceptance).toBe('accepted');
  }
});

test('nested reusable parts belong to one member root; sibling member roots remain distinct', () => {
  const root = new THREE.Group();
  root.name = 'Asset';
  const assembly = member('Machine');
  assembly.add(member('ReplaceableArm'));
  root.add(assembly);
  expect(analyzeAssetScopeObservationV1(root)).toMatchObject({
    topLevelAssetRoots: 1,
    reusableMemberCount: 1,
  });
  expect(scopeFindings(report(root))).toEqual([]);
  root.add(member('OtherMachine'));
  expect(analyzeAssetScopeObservationV1(root)).toMatchObject({
    topLevelAssetRoots: 2,
    reusableMemberCount: 2,
  });
  expect(scopeFindings(report(root)).map((f) => f.code)).toContain(
    'ASSET_SCOPE_EXPLICIT_SINGLE_CLUSTER',
  );
});

test('scope analysis ignores authored count receipts and keeps dressing signals advisory', () => {
  const root = cluster();
  root.userData.assetScope = { topLevelAssetRoots: 1, reusableMemberCount: 1 };
  root.userData.category = 'prop';
  const dressing = member('Backdrop');
  stampSemanticMetadataV1(dressing, { roles: ['scene.dressing'] });
  root.add(dressing);
  const result = report(root, { state: 'requested', value: 'packMember' });
  expect(scopeFindings(result).map((f) => f.code)).toContain('ASSET_SCOPE_ACCIDENTAL_DIORAMA');
  expect(result.dimensions.promptAlignment.metrics).toMatchObject({
    scopeTopLevelAssetRoots: 2,
    // One role and two name matches are signals, not three separate objects.
    scopeDressingSignalCount: 3,
  });
  expect(result.acceptance).toBe('incomplete');
});

test('a requested cluster allows members and scenery without silently certifying other scopes', () => {
  const root = cluster();
  const dressing = member('Diorama');
  stampSemanticMetadataV1(dressing, { roles: ['scene.dressing'] });
  root.add(dressing);
  const result = report(root, { state: 'requested', value: 'cluster' });
  expect(scopeFindings(result)).toEqual([]);
  expect(result.rules.find((r) => r.id === 'ASSET_SCOPE_PROFILE')?.status).toBe('evaluated');
  expect(result.unevaluatedRequirements).toEqual([
    { key: 'scope', fields: ['*'], reason: expect.stringContaining('advisory') },
  ]);
});

test('disabled or unavailable scope measurements are not reported as a measured pass', () => {
  const disabled = report(cluster(), undefined, [], { byRule: { ASSET_SCOPE_PROFILE: 'off' } });
  const unavailable = report(undefined);
  for (const result of [disabled, unavailable]) {
    expect(result.rules.find((r) => r.id === 'ASSET_SCOPE_PROFILE')?.status).toBe('notEvaluated');
    expect(result.dimensions.promptAlignment.metrics).toBeUndefined();
    expect(result.acceptance).not.toBe('accepted');
  }
});

test('scope heuristics cannot be promoted into geometry blockers without evidence', () => {
  expect(() =>
    report(cluster(), undefined, [], { byRule: { ASSET_SCOPE_PROFILE: 'enforce' } }),
  ).toThrow('frozen promotion evidence');
});
