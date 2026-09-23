import { expect, test } from 'bun:test';
import * as THREE from 'three';
import { stampSemanticMetadataV1 } from '../contracts';
import { createAssetRequirementsV1, type AssetRequirementsV1 } from '../contracts/requirements';
import { createAssetRequirementsStore } from '../requirements-store';
import { resolveRequirementsContext } from '../requirements-context';
import { runRequirementsSceneQa } from './requirements-run';
import { W7_VEGETATION_CORPUS } from './vegetation-corpus';
type Foliage = Extract<
  NonNullable<AssetRequirementsV1['requirements']['foliage']>,
  { value: unknown }
>['value'];
function report(
  scene: THREE.Object3D,
  foliage?: Foliage,
  extra: AssetRequirementsV1['requirements'] = {},
) {
  const binding = createAssetRequirementsStore().host.bind(
    { taskId: 'foliage', lineageId: 'one' },
    createAssetRequirementsV1({
      labels: ['prop'],
      requirements: {
        ...(foliage ? { foliage: { state: 'requested', value: foliage } } : {}),
        ...extra,
      },
    }),
    { actor: 'owner', source: 'brief', reason: 'Foliage requirements' },
  );
  return runRequirementsSceneQa(resolveRequirementsContext(binding), scene, []);
}
const codes = (r: ReturnType<typeof report>) =>
  Object.values(r.dimensions).flatMap((d) => d.findings.map((f) => f.code));
function stem(base = 0) {
  const root = new THREE.Group();
  root.name = 'Plant';
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.2, 1, 8),
    new THREE.MeshStandardMaterial(),
  );
  stem.name = 'Stem';
  stem.position.y = base + 0.5;
  stampSemanticMetadataV1(stem, { roles: ['vegetation.stem'] });
  root.add(stem);
  const contact = new THREE.Group();
  contact.name = 'Contact';
  contact.position.y = base;
  stampSemanticMetadataV1(contact, { roles: ['vegetation.contact.ground'] });
  root.add(contact);
  return root;
}
test('grounded foliage checks its explicit contact without imposing a canopy or standalone scope', () => {
  expect(report(stem(), { grounded: true }).acceptance).toBe('accepted');
  const floating = report(stem(2), { grounded: true });
  expect(floating.acceptance).toBe('blocked');
  expect(codes(floating)).toContain('VEG_CONTACT_FLOATING');
  expect(codes(floating)).not.toContain('VEG_CANOPY_MISSING');
  expect(codes(report(stem(2), { grounded: false }))).not.toContain('VEG_CONTACT_FLOATING');
});
test('source vegetation tags alone introduce no contact or canopy requirement', () => {
  expect(codes(report(stem(3))).filter((code) => code.startsWith('VEG_'))).toEqual([]);
});
test('foliage contact uses the explicit asset-local plane under root transforms', () => {
  const root = stem(3);
  root.position.set(20, 5, 4);
  root.rotation.y = 0.5;
  const result = report(
    root,
    { grounded: true },
    { grounding: { state: 'requested', value: { planeY: 3 } } },
  );
  expect(codes(result).filter((code) => /VEG_CONTACT_|VEG_MATERIAL_BURIED/.test(code))).toEqual([]);
});
test('unknown foliage shapes remain authorable and explicitly unmeasured', () => {
  expect(report(stem(), { subtype: 'alien-spore' }).acceptance).toBe('incomplete');
});
for (const fixture of W7_VEGETATION_CORPUS)
  test(`neutral foliage corpus: ${fixture.id}`, () => {
    const payload = fixture.build();
    const result = report(payload.scene, payload.intent.vegetation, {
      material: { state: 'requested', value: payload.intent.material },
    });
    for (const code of fixture.expectedCodes) expect(codes(result)).toContain(code);
    for (const code of fixture.forbiddenCodes) expect(codes(result)).not.toContain(code);
  });

test('instanced foliage support cannot hide buried copies behind its base mesh transform', () => {
  const root = stem();
  const support = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.2, 1, 0.2),
    new THREE.MeshStandardMaterial(),
    2,
  );
  support.name = 'InstancedRoots';
  support.setMatrixAt(0, new THREE.Matrix4().makeTranslation(0, 0.5, 0));
  support.setMatrixAt(1, new THREE.Matrix4().makeTranslation(1, -1, 0));
  // The base transform alone is above ground; only instance #1 penetrates it.
  support.position.y = 0.6;
  stampSemanticMetadataV1(support, { roles: ['vegetation.root'] });
  root.add(support);
  expect(codes(report(root, { grounded: true }))).toContain('VEG_MATERIAL_BURIED');
});
