import { expect, test } from 'bun:test';
import * as THREE from 'three';
import { createAssetIntentV1, stampSemanticMetadataV1 } from '../contracts';
import { createAssetRequirementsV1, type AssetRequirementsV1 } from '../contracts/requirements';
import { resolveRequirementsContext } from '../requirements-context';
import { createAssetRequirementsStore } from '../requirements-store';
import { evaluatePropArticulationQa, evaluatePropContainerQa } from './prop';
import { runRequirementsSceneQa } from './requirements-run';

function report(
  scene: THREE.Object3D,
  requirements: AssetRequirementsV1['requirements'],
  labels: string[] = [],
) {
  const binding = createAssetRequirementsStore().host.bind(
    { taskId: 'mechanism', lineageId: 'fixture' },
    createAssetRequirementsV1({ labels, requirements }),
    { actor: 'owner', source: 'brief', reason: 'Requested behavior' },
  );
  return runRequirementsSceneQa(resolveRequirementsContext(binding), scene, []);
}
const requested = { state: 'requested' as const, value: {} };
const findings = (result: ReturnType<typeof report>) =>
  Object.values(result.dimensions).flatMap((d) => d.findings);
const codes = (result: ReturnType<typeof report>) => findings(result).map((f) => f.code);
function marker(name: string, role: string, size: [number, number, number]) {
  const node = new THREE.Group();
  node.name = name;
  node.scale.set(...size);
  stampSemanticMetadataV1(node, { roles: [role] });
  return node;
}
function mesh(name: string, size: [number, number, number]) {
  const node = new THREE.Mesh(new THREE.BoxGeometry(...size), new THREE.MeshStandardMaterial());
  node.name = name;
  return node;
}
function mechanism(blocked = false) {
  const root = new THREE.Group();
  root.name = 'Machine';
  const pivot = new THREE.Group();
  pivot.name = 'Pivot';
  stampSemanticMetadataV1(pivot, {
    roles: ['prop.pivot.hinge.arm'],
    frames: [{ id: 'axis.+x', translation: [0, 0, 0], rotation: [0, 0, 0, 1] }],
  });
  const arm = mesh('Arm', [0.5, 0.1, 0.1]);
  stampSemanticMetadataV1(arm, { roles: ['prop.motion.hinge.arm'] });
  pivot.add(arm);
  root.add(pivot, marker('Sweep', 'prop.clearance.hinge.arm', [1, 1, 1]));
  if (blocked) root.add(mesh('Obstruction', [0.2, 0.2, 0.2]));
  return root;
}
function opening(size: number, blocked = false) {
  const root = new THREE.Group();
  root.name = 'Opening';
  const body = mesh('Body', [size, size, size]);
  body.position.x = size * 3;
  root.add(
    body,
    marker('Interior', 'prop.container.interior.main', [size, size, size]),
    marker('Entry', 'prop.container.opening.main', [size, size, size]),
  );
  if (blocked) root.add(mesh('Filler', [size, size, size]));
  return root;
}

test('requested mechanisms run shared structural measurements independently of descriptive labels', () => {
  const scene = mechanism(true);
  for (const labels of [[], ['vehicle'], ['architecture', 'rig']]) {
    const result = report(scene, { articulation: requested }, labels);
    expect(result.rules.find((r) => r.id === 'PROP_CAPABILITY_EXACT_PROFILE')).toMatchObject({
      status: 'evaluated',
      mode: 'enforce',
    });
    expect(codes(result)).toContain('PROP_ARTICULATION_CLEARANCE_BLOCKED');
    expect(result.acceptance).toBe('blocked');
  }
  expect(
    evaluatePropArticulationQa({
      intent: createAssetIntentV1({ category: 'prop', capabilities: ['articulated'] }),
      scene,
    }).map((f) => f.code),
  ).toEqual(['PROP_ARTICULATION_CLEARANCE_BLOCKED']);
});

test('labels, inference and unrequested semantics never impose mechanism obligations', () => {
  for (const requirements of [{}, { articulation: { state: 'inferred' as const, value: {} } }]) {
    const result = report(mechanism(true), requirements, ['prop', 'articulated']);
    expect(codes(result).some((code) => code.startsWith('PROP_ARTICULATION'))).toBe(false);
    expect(result.rules.find((r) => r.id === 'PROP_CAPABILITY_EXACT_PROFILE')?.status).toBe(
      'notRequested',
    );
  }
});

test('generic motion or opening requests do not require a hinge or a container', () => {
  const root = new THREE.Group();
  root.add(mesh('FlexibleBody', [1, 1, 1]));
  const result = report(root, { articulation: requested, opening: requested });
  expect(codes(result).filter((code) => code.startsWith('PROP_'))).toEqual([]);
  expect(result.acceptance).toBe('incomplete');
  expect(result.unevaluatedRequirements.map((r) => r.key)).toEqual(['articulation', 'opening']);
});

test('valid static semantic evidence cannot certify requested animation, travel or usable opening', () => {
  const result = report(mechanism(), { articulation: requested });
  expect(result.rules.find((r) => r.id === 'PROP_CAPABILITY_EXACT_PROFILE')?.status).toBe(
    'evaluated',
  );
  expect(result.acceptance).toBe('incomplete');
  expect(result.unevaluatedRequirements[0]?.reason).toContain('motion');
});

test('a slider clearance cannot satisfy a hinge with the same local assembly id', () => {
  const root = mechanism();
  root.remove(root.getObjectByName('Sweep')!);
  const slider = new THREE.Group();
  slider.name = 'Slider';
  stampSemanticMetadataV1(slider, {
    roles: ['prop.pivot.slider.arm'],
    frames: [{ id: 'axis.+x', translation: [0, 0, 0], rotation: [0, 0, 0, 1] }],
  });
  const carriage = mesh('Carriage', [0.1, 0.1, 0.1]);
  stampSemanticMetadataV1(carriage, { roles: ['prop.motion.slider.arm'] });
  slider.add(carriage);
  slider.position.x = 3;
  const clearance = marker('SliderTravel', 'prop.clearance.slider.arm', [1, 1, 1]);
  clearance.position.x = 3;
  root.add(slider, clearance);
  const result = report(root, { articulation: requested });
  expect(
    findings(result).filter((f) => f.code === 'PROP_ARTICULATION_CLEARANCE_MISSING'),
  ).toMatchObject([{ affected: { node: 'Pivot' } }]);
});

test('neutral openings preserve shared blocker detection without a category-derived eight-centimeter floor', () => {
  const tiny = report(opening(0.02), { opening: requested });
  expect(tiny.rules.find((r) => r.id === 'PROP_CAPABILITY_EXACT_PROFILE')?.status).toBe(
    'evaluated',
  );
  expect(codes(tiny)).not.toContain('PROP_CONTAINER_INTERIOR_UNUSABLE');
  expect(tiny.acceptance).toBe('incomplete');
  const scene = opening(0.2, true);
  expect(codes(report(scene, { opening: requested }))).toContain('PROP_CONTAINER_OPENING_BLOCKED');
  expect(
    evaluatePropContainerQa({
      intent: createAssetIntentV1({ category: 'prop', capabilities: ['openable'] }),
      scene,
    }).map((f) => f.code),
  ).toContain('PROP_CONTAINER_OPENING_BLOCKED');
  // The old adapter retains its calibrated assumption for historical comparison.
  expect(
    evaluatePropContainerQa({
      intent: createAssetIntentV1({ category: 'prop', capabilities: ['openable'] }),
      scene: opening(0.02),
    }).map((f) => f.code),
  ).toContain('PROP_CONTAINER_INTERIOR_UNUSABLE');
});
