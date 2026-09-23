import { expect, test } from 'bun:test';
import * as THREE from 'three';
import { stampSemanticMetadataV1 } from '../contracts';
import { createAssetRequirementsV1, type AssetRequirementsV1 } from '../contracts/requirements';
import { createAssetRequirementsStore } from '../requirements-store';
import { resolveRequirementsContext } from '../requirements-context';
import { runRequirementsSceneQa } from './requirements-run';
import { ARCHITECTURE_REGRESSION_CORPUS } from './architecture-corpus';

type Structure = Extract<
  NonNullable<AssetRequirementsV1['requirements']['structure']>,
  { value: unknown }
>['value'];
function report(scene: THREE.Object3D, structure?: Structure, opening = false) {
  const binding = createAssetRequirementsStore().host.bind(
    { taskId: 'structure', lineageId: 'one' },
    createAssetRequirementsV1({
      labels: ['prop'],
      requirements: {
        ...(structure ? { structure: { state: 'requested', value: structure } } : {}),
        ...(opening ? { opening: { state: 'requested', value: {} } } : {}),
      },
    }),
    { actor: 'owner', source: 'brief', reason: 'Requested structure' },
  );
  return runRequirementsSceneQa(resolveRequirementsContext(binding), scene, []);
}
const findings = (r: ReturnType<typeof report>) =>
  Object.values(r.dimensions).flatMap((d) => d.findings);
const codes = (r: ReturnType<typeof report>) => findings(r).map((f) => f.code);
function building(storeys = 8) {
  const root = new THREE.Group();
  root.name = 'Building';
  for (let level = 1; level <= storeys; level++) {
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.2, 12),
      new THREE.MeshStandardMaterial(),
    );
    floor.name = `Floor${level}`;
    floor.position.y = level * 4;
    stampSemanticMetadataV1(floor, { roles: [`floor.storey.${level}`] });
    root.add(floor);
  }
  return root;
}

test('a storey count beyond old recipes imposes no roof, portal, scale or interior defaults', () => {
  const root = building();
  const good = report(root, { storeyCount: 8 });
  expect(good.unevaluatedRequirements).toEqual([]);
  expect(good.acceptance).toBe('accepted');
  expect(codes(good).filter((code) => code.startsWith('ARCH_'))).toEqual([]);
  const bad = report(root, { storeyCount: 9 });
  expect(codes(bad)).toContain('ARCH_STOREY_COUNT');
  expect(bad.acceptance).toBe('blocked');
});

test('a structure label and semantic roles create no unrequested structural policy', () => {
  const root = building();
  root.userData.category = 'architecture';
  const result = report(root);
  expect(result.rules.find((r) => r.id === 'ARCHITECTURE_PROFILE')?.status).toBe('notRequested');
  expect(codes(result).filter((code) => code.startsWith('ARCH_'))).toEqual([]);
});

test('partial roof and interior requests run independently', () => {
  const root = building();
  expect(codes(report(root, { interiorMode: 'shell' }))).toContain('ARCH_INTERIOR_MODE');
  expect(codes(report(root, { roofMode: 'fixed' }))).toContain('ARCH_ROOF_MODE');
  expect(codes(report(root, { roofMode: 'none' }))).not.toContain('ARCH_ROOF_MODE');
  expect(codes(report(root, { enterable: true }))).toContain('ARCH_BLOCKED_PORTAL');
});

test('one requested storey still needs floor evidence', () => {
  const root = building(1);
  stampSemanticMetadataV1(root.children[0]!, { roles: ['decoration.panel'] });
  expect(codes(report(root, { storeyCount: 1 }))).toContain('ARCH_STOREY_COUNT');
  stampSemanticMetadataV1(root.children[0]!, { roles: ['floor'] });
  expect(codes(report(root, { storeyCount: 1 }))).not.toContain('ARCH_STOREY_COUNT');
});

test('unqualified roof types remain available to author but explicitly unmeasured', () => {
  const result = report(building(), { roof: { type: 'tensile-membrane' } });
  expect(result.acceptance).toBe('incomplete');
  expect(result.unevaluatedRequirements).toContainEqual(
    expect.objectContaining({ key: 'structure' }),
  );
});

for (const fixture of ARCHITECTURE_REGRESSION_CORPUS) {
  test(`neutral structural reciprocal corpus: ${fixture.id}`, () => {
    const payload = fixture.build();
    const result = report(
      payload.scene,
      payload.intent.architecture,
      payload.intent.capabilities.includes('openable'),
    );
    if (fixture.expectedPrimaryCode) expect(codes(result)).toContain(fixture.expectedPrimaryCode);
    for (const code of fixture.forbiddenCodes ?? []) expect(codes(result)).not.toContain(code);
  });
}
