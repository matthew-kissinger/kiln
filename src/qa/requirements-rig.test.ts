import { expect, test } from 'bun:test';
import * as THREE from 'three';
import {
  BIPED_RIG_PRESET_V1,
  QUADRUPED_RIG_PRESET_V1,
  stampCharacterJointDescriptorV1,
  stampCharacterRigGraphV1,
  type CharacterRigGraphV1,
} from '../character';
import { createAssetRequirementsV1, type AssetRequirementsV1 } from '../contracts/requirements';
import { createAssetRequirementsStore } from '../requirements-store';
import { resolveRequirementsContext } from '../requirements-context';
import { W6_CHARACTER_VEHICLE_FIXTURE_CORPUS } from './character-vehicle-corpus';
import { renderSceneToGLB } from '../render';
import { captureCharacterDiagnosticViews } from '../views/character-capture';
import { runRequirementsSceneQa } from './requirements-run';
type Rig = Extract<
  NonNullable<AssetRequirementsV1['requirements']['rig']>,
  { value: unknown }
>['value'];
function skeleton(graph: CharacterRigGraphV1 = BIPED_RIG_PRESET_V1) {
  const root = new THREE.Group();
  root.name = 'Rig';
  stampCharacterRigGraphV1(root, graph);
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.2, 0.2),
    new THREE.MeshStandardMaterial(),
  );
  mesh.name = 'Body';
  root.add(mesh);
  const byRole = new Map<string, THREE.Object3D>();
  for (const descriptor of graph.joints) {
    const node = new THREE.Group();
    node.name = `Joint_${descriptor.role.replace(/[^A-Za-z0-9]+/g, '_')}`;
    node.position.fromArray(descriptor.rest.translation);
    node.quaternion.fromArray(descriptor.rest.rotation);
    node.scale.fromArray(descriptor.rest.scale);
    stampCharacterJointDescriptorV1(node, descriptor);
    (descriptor.parentRole ? byRole.get(descriptor.parentRole)! : root).add(node);
    byRole.set(descriptor.role, node);
  }
  return { root, byRole };
}
function report(
  scene: THREE.Object3D,
  rig?: Rig,
  clips: THREE.AnimationClip[] = [],
  extra: AssetRequirementsV1['requirements'] = {},
) {
  const binding = createAssetRequirementsStore().host.bind(
    { taskId: 'rig', lineageId: 'one' },
    createAssetRequirementsV1({
      labels: ['prop'],
      requirements: { ...(rig ? { rig: { state: 'requested', value: rig } } : {}), ...extra },
    }),
    { actor: 'owner', source: 'brief', reason: 'Rig contract' },
  );
  return runRequirementsSceneQa(resolveRequirementsContext(binding), scene, clips);
}
const codes = (r: ReturnType<typeof report>) =>
  Object.values(r.dimensions).flatMap((d) => d.findings.map((f) => f.code));
test('body plans select exact graphs independently of a category or articulation flag', () => {
  for (const [bodyPlan, graph] of [
    ['biped', BIPED_RIG_PRESET_V1],
    ['quadruped', QUADRUPED_RIG_PRESET_V1],
  ] as const) {
    const { root, byRole } = skeleton(graph);
    expect(report(root, { bodyPlan }).acceptance).toBe('accepted');
    byRole.get(graph.joints.at(-1)!.role)!.removeFromParent();
    expect(codes(report(root, { bodyPlan }))).toContain(
      bodyPlan === 'biped' ? 'CHAR_BIPED_REQUIRED_ROLE' : 'CHAR_QUADRUPED_REQUIRED_ROLE',
    );
  }
});
test('grounded contact alone imposes no body plan and honors the asset-local plane', () => {
  const { root, byRole } = skeleton();
  for (const node of byRole.values()) if (node.parent === root) node.position.y += 2;
  root.position.set(10, 4, 5);
  root.rotation.y = 0.8;
  const result = report(root, { grounded: true }, [], {
    grounding: { state: 'requested', value: { planeY: 2 } },
  });
  expect(codes(result).filter((c) => c.startsWith('CHAR_CONTACT_'))).toEqual([]);
  expect(codes(report(root, { grounded: true }))).toContain('CHAR_CONTACT_FLOATING');
  expect(codes(report(root))).not.toContain('CHAR_CONTACT_FLOATING');
});
test('unspecified clip lists permit additional animation but explicit loop requirements are checked', () => {
  const { root } = skeleton();
  const clip = new THREE.AnimationClip('Spin', 1, [
    new THREE.VectorKeyframeTrack('Body.position', [0, 1], [0, 0, 0, 1, 0, 0]),
  ]);
  expect(report(root, { bodyPlan: 'biped' }, [clip]).acceptance).toBe('accepted');
  expect(codes(report(root, { clips: [{ name: 'Spin', playback: 'loop' }] }, [clip]))).toContain(
    'CHAR_LOOP_ENDPOINT',
  );
  expect(codes(report(root, { clips: [] }, [clip]))).toContain('CHAR_CLIP_UNEXPECTED');
});
test('held-item requirements and unrequested body-plan rules compose independently', () => {
  const { root } = skeleton();
  expect(codes(report(root, { heldItem: { required: true, attachmentRole: 'grip' } }))).toContain(
    'CHAR_HELD_ITEM_MISSING',
  );
  expect(
    codes(report(root, { heldItem: { required: false, attachmentRole: 'grip' } })),
  ).not.toContain('CHAR_HELD_ITEM_MISSING');
});

for (const fixture of W6_CHARACTER_VEHICLE_FIXTURE_CORPUS.filter((f) => f.category === 'character'))
  test(`neutral rig corpus: ${fixture.id}`, () => {
    const payload = fixture.build();
    const result = report(payload.scene, payload.intent.character, payload.clips);
    for (const code of fixture.expectedCodes) expect(codes(result)).toContain(code);
    for (const code of fixture.forbiddenCodes) expect(codes(result)).not.toContain(code);
  });
test('neutral rig exports retain diagnostic overlays and exact source bytes', async () => {
  const { root } = skeleton();
  root.updateMatrixWorld(true);
  const before = root.toJSON();
  const baseline = await renderSceneToGLB(root, { optimize: 'off' });
  const binding = createAssetRequirementsStore().host.bind(
    { taskId: 'views', lineageId: 'one' },
    createAssetRequirementsV1({
      requirements: { rig: { state: 'requested', value: { bodyPlan: 'biped' } } },
    }),
    { actor: 'owner', source: 'brief', reason: 'Rig body plan' },
  );
  const result = await renderSceneToGLB(root, { requirements: binding, optimize: 'off' });
  expect(result.qaReport.acceptance).toBe('accepted');
  expect(result.diagnosticViews?.map((v) => v.id)).toEqual([
    'character.skeleton.front',
    'character.skeleton.right',
  ]);
  expect(result.diagnosticViews?.every((v) => v.png.subarray(1, 4).toString() === 'PNG')).toBe(
    true,
  );
  expect(result.bytes).toEqual(baseline.bytes);
  expect(root.toJSON()).toEqual(before);
});
test('rig diagnostic capture rejects invalid allocations before rendering', async () => {
  for (const size of [0, -1, 1.5, 2049, Infinity, NaN])
    await expect(
      captureCharacterDiagnosticViews(skeleton().root, [], {}, [], size),
    ).rejects.toThrow('size');
});
