import { expect, test } from 'bun:test';
import * as THREE from 'three';
import { createAssetRequirementsV1, type AssetRequirementsV1 } from '../contracts/requirements';
import { createAssetRequirementsStore } from '../requirements-store';
import { resolveRequirementsContext } from '../requirements-context';
import { createVehicleFrame, createWheelAssembly, createWheelGeometrySet } from '../vehicle';
import { runRequirementsSceneQa } from './requirements-run';

type Mobility = Extract<
  NonNullable<AssetRequirementsV1['requirements']['mobility']>,
  { value: unknown }
>['value'];
function report(
  scene: THREE.Object3D,
  mobility?: Mobility,
  other: AssetRequirementsV1['requirements'] = {},
  policy = {},
) {
  const requirements = createAssetRequirementsStore().host.bind(
    { taskId: 'test', lineageId: 'mobility' },
    createAssetRequirementsV1({
      labels: ['prop'],
      requirements: {
        ...(mobility ? { mobility: { state: 'requested' as const, value: mobility } } : {}),
        ...other,
      },
    }),
    { actor: 'owner', source: 'brief', reason: 'Requested mobility' },
  );
  return runRequirementsSceneQa(resolveRequirementsContext(requirements), scene, [], policy);
}
const all = (r: ReturnType<typeof report>) =>
  Object.values(r.dimensions).flatMap((d) => d.findings);
const codes = (r: ReturnType<typeof report>) => all(r).map((f) => f.code);
function hull() {
  const root = new THREE.Group();
  root.name = 'HullRoot';
  const body = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 2), new THREE.MeshStandardMaterial());
  body.name = 'Hull';
  body.position.y = 4;
  root.add(body);
  return root;
}
function cart() {
  const frame = createVehicleFrame('Cart', {
    axles: [
      { id: 'front', position: [1, 0.35, 0] },
      { id: 'rear', position: [-1, 0.35, 0] },
    ],
  });
  const tire = new THREE.MeshStandardMaterial();
  const rim = new THREE.MeshStandardMaterial();
  const geometries = createWheelGeometrySet(0.35, 0.18);
  for (const [index, x] of [
    ['front', 1],
    ['rear', -1],
  ] as const)
    for (const side of ['left', 'right'] as const)
      createWheelAssembly(
        `${index}${side}`,
        { tire, rim },
        {
          radius: 0.35,
          width: 0.18,
          index,
          side,
          position: [x, 0.35, side === 'left' ? -0.8 : 0.8],
          geometries,
          parent: frame.root,
        },
      );
  return frame.root;
}

test('unrequested mobility does not derive obligations from geometry or source labels', () => {
  const root = cart();
  root.userData.category = 'vehicle';
  expect(codes(report(root)).some((code) => code.startsWith('VEH_'))).toBe(false);
});

test('wheel and axle counts are independently requested, including explicit zero', () => {
  const root = cart();
  expect(codes(report(root, { wheelCount: 2 }))).toContain('VEH_WHEEL_COUNT');
  expect(codes(report(root, { wheelCount: 0 }))).toContain('VEH_WHEEL_COUNT');
  expect(codes(report(root, { axleCount: 0 }))).toContain('VEH_AXLE_COUNT');
  const matched = report(root, { wheelCount: 4, axleCount: 2 });
  expect(matched.unevaluatedRequirements).toEqual([]);
  expect(codes(matched)).not.toContain('VEH_STEERING_PIVOT');
  expect(matched.acceptance).toBe('accepted');
});

test('waterborne support invents no wheels, ground plane, steering or front marker', () => {
  const result = report(hull(), { supportPolicy: 'waterborne' });
  expect(codes(result).filter((code) => /WHEEL|AXLE|CONTACT|STEERING|FRONT/.test(code))).toEqual(
    [],
  );
  expect(result.unevaluatedRequirements).toEqual([]);
});

test('an explicit semantic front requirement is enforced without making it a default', () => {
  const front: Mobility = { frontFrame: '+X' };
  const result = report(hull(), front);
  expect(codes(result)).toContain('VEH_FRONT_AXIS');
  expect(codes(report(cart(), front))).not.toContain('VEH_FRONT_AXIS');
});

test('an independently requested support assembly is not ignored because wheels also exist', () => {
  expect(
    codes(
      report(cart(), { wheelCount: 4, supportPolicy: 'grounded', supportAssemblies: ['skid'] }),
    ),
  ).toContain('VEH_SUPPORT_SET_MISSING');
});

test('unknown propulsion and animation assembly semantics remain explicitly unmeasured', () => {
  const result = report(hull(), {
    propulsionAssemblies: ['antigravity'],
    animationAssemblies: ['folding-wing'],
  });
  expect(result.acceptance).toBe('incomplete');
  expect(result.unevaluatedRequirements).toContainEqual({
    key: 'mobility',
    fields: ['propulsionAssemblies', 'animationAssemblies'],
    reason: expect.any(String),
  });
});

test('mobility contact uses the explicitly chosen local plane under a transformed root', () => {
  const root = cart();
  for (const child of root.children) child.position.y += 2;
  root.position.set(18, 7, -4);
  root.rotation.y = 0.7;
  const needs: Mobility = { supportPolicy: 'grounded', wheelCount: 4 };
  const requested = report(root, needs, {
    grounding: { state: 'requested', value: { planeY: 2 } },
  });
  expect(codes(requested)).not.toContain('VEH_CONTACT_PLANE');
  expect(codes(report(root, needs))).toContain('VEH_CONTACT_PLANE');
});

test('disabled or downgraded exact mobility checks leave acceptance incomplete', () => {
  for (const mode of ['off', 'observe'] as const) {
    const result = report(
      cart(),
      { wheelCount: 0 },
      {},
      {
        byRule: { VEHICLE_PROFILE: mode },
      },
    );
    expect(result.acceptance).toBe('incomplete');
    expect(all(result).some((f) => f.disposition === 'block')).toBe(false);
  }
});
