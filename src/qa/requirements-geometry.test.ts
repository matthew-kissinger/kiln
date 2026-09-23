import { expect, test } from 'bun:test';
import * as THREE from 'three';
import { createAssetRequirementsV1 } from '../contracts/requirements';
import { createAssetRequirementsStore } from '../requirements-store';
import { resolveRequirementsContext } from '../requirements-context';
import { runRequirementsSceneQa } from './requirements-run';
import { validateRequirementsQaReport } from './requirements-report';
import { PART_CONNECTIVITY_QA_RULE } from './part-connectivity';
import { createAssetIntentV1 } from '../contracts/asset';

function box(name: string, x: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());
  mesh.name = name;
  mesh.position.x = x;
  return mesh;
}
function scene() {
  const root = new THREE.Group();
  root.name = 'Asset';
  root.add(box('BodyA', 0), box('BodyB', 1), box('BodyC', 2), box('OtherA', 8), box('OtherB', 9));
  return root;
}
function report(root: THREE.Object3D, labels: string[] = [], policy = {}) {
  const binding = createAssetRequirementsStore().host.bind(
    { taskId: 'geometry', lineageId: 'one' },
    createAssetRequirementsV1({ labels }),
    { actor: 'host', source: 'brief', reason: 'Independent geometry observation' },
  );
  const context = resolveRequirementsContext(binding);
  const result = runRequirementsSceneQa(context, root, [], policy);
  expect(validateRequirementsQaReport(result, context)).toEqual(result);
  return result;
}

test('neutral QA reports detached clusters independently of labels, preserving advisory mode', () => {
  const root = scene();
  const old = PART_CONNECTIVITY_QA_RULE.evaluate({
    scene: root,
    intent: createAssetIntentV1({ category: 'prop' }),
  });
  for (const labels of [[], ['environment'], ['prop', 'vehicle']]) {
    const result = report(root, labels);
    expect(result.rules.find((r) => r.id === 'GEO_PART_CONNECTIVITY')).toMatchObject({
      status: 'evaluated',
      mode: 'observe',
    });
    expect(JSON.stringify(result.dimensions.visualQuality.findings)).toBe(JSON.stringify(old));
    expect(result.dimensions.visualQuality.findings).toHaveLength(1);
    expect(result.dimensions.visualQuality.findings[0]?.measurement).toMatchObject({ actual: 5 });
    expect(result.acceptance).toBe('accepted');
  }
});

test('intentional separations stay observational and advice does not prescribe collapsing geometry', () => {
  const finding = report(scene()).dimensions.visualQuality.findings[0]!;
  expect(finding.disposition).toBe('observe');
  expect(finding.message).toContain('bounding boxes');
  expect(finding.repairText).toContain('intentional');
  expect(finding.repairText).not.toContain('so this check skips');
  expect(() => report(scene(), [], { defaultMode: 'enforce' })).toThrow(
    'GEO_PART_CONNECTIVITY cannot enter enforce',
  );
});

test('disabled optional observations are unmeasured without weakening required structural checks', () => {
  const result = report(scene(), [], { byRule: { GEO_PART_CONNECTIVITY: 'off' } });
  expect(result.rules.find((r) => r.id === 'GEO_PART_CONNECTIVITY')).toMatchObject({
    status: 'notEvaluated',
    mode: 'off',
  });
  expect(result.dimensions.visualQuality.findings).toEqual([]);
  expect(result.acceptance).toBe('accepted');
  const broken = scene();
  broken.children[0]!.scale.x = 0;
  expect(report(broken, [], { byRule: { GEO_PART_CONNECTIVITY: 'off' } }).acceptance).toBe(
    'blocked',
  );
});

test('connected geometry reports the observation as evaluated without claiming volume or motion coverage', () => {
  const root = new THREE.Group();
  root.add(box('A', 0), box('B', 1));
  const result = report(root);
  expect(result.rules.find((r) => r.id === 'GEO_PART_CONNECTIVITY')?.status).toBe('evaluated');
  expect(result.dimensions.visualQuality.findings).toEqual([]);
  expect(result.rules.find((r) => r.id === 'GEO_PART_SELF_INTERSECTION')?.status).toBe(
    'notEvaluated',
  );
});
