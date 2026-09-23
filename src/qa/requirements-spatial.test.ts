import { expect, test } from 'bun:test';
import * as THREE from 'three';
import { stampSemanticMetadataV1 } from '../contracts';
import { createAssetRequirementsV1, type AssetRequirementsV1 } from '../contracts/requirements';
import { createAssetRequirementsStore } from '../requirements-store';
import { resolveRequirementsContext } from '../requirements-context';
import { runRequirementsSceneQa } from './requirements-run';
import { validateRequirementsQaReport } from './requirements-report';
import { renderSceneToGLB } from '../render';

function report(scene: THREE.Object3D, requirements: AssetRequirementsV1['requirements']) {
  const binding = createAssetRequirementsStore().host.bind(
    { taskId: 'spatial', lineageId: 'one' },
    createAssetRequirementsV1({ requirements }),
    { actor: 'owner', source: 'brief', reason: 'Spatial obligations' },
  );
  const context = resolveRequirementsContext(binding);
  const result = runRequirementsSceneQa(context, scene, []);
  validateRequirementsQaReport(JSON.parse(JSON.stringify(result)), context);
  return result;
}
const codes = (r: ReturnType<typeof report>) =>
  Object.values(r.dimensions).flatMap((d) => d.findings.map((f) => f.code));
function route(blocker = false, marker = true) {
  const root = new THREE.Group();
  root.name = 'Arena';
  const floor = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 4), new THREE.MeshStandardMaterial());
  floor.name = 'Floor';
  floor.position.y = -0.05;
  stampSemanticMetadataV1(floor, { roles: ['environment.path.surface'] });
  root.add(floor);
  if (marker) {
    const passage = new THREE.Group();
    passage.name = 'Route';
    passage.position.y = 1;
    passage.scale.set(1, 2, 4);
    stampSemanticMetadataV1(passage, { roles: ['environment.navigation.corridor.main'] });
    root.add(passage);
  }
  if (blocker) {
    const rock = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 1, 0.5),
      new THREE.MeshStandardMaterial(),
    );
    rock.name = 'Rock';
    rock.position.y = 0.5;
    root.add(rock);
  }
  return root;
}
const navigation = { navigation: { state: 'requested', value: {} } } as const;

test('navigation does not impose human dimensions on a miniature or non-human route', () => {
  const root = route();
  const passage = root.getObjectByName('Route')!;
  passage.scale.set(0.1, 0.2, 0.4);
  passage.position.y = 0.1;
  const result = report(root, navigation);
  expect(codes(result)).not.toContain('ENV_NAV_CORRIDOR_TOO_NARROW');
  expect(codes(result)).not.toContain('ENV_NAV_HEADROOM_TOO_LOW');
  expect(result.acceptance).toBe('accepted');
});

test('requested corridor dimensions are measured independently and inferred dimensions do not apply', () => {
  const root = route();
  const passage = root.getObjectByName('Route')!;
  passage.scale.set(0.1, 0.2, 0.4);
  passage.position.y = 0.1;
  const value = { minWidth: 0.12, minHeight: 0.25 };
  const result = report(root, { navigation: { state: 'requested', value } });
  const measured = Object.values(result.dimensions).flatMap((d) => d.findings);
  expect(measured.find((f) => f.code === 'ENV_NAV_CORRIDOR_TOO_NARROW')?.measurement).toMatchObject(
    {
      actual: 0.1,
      threshold: 0.12,
    },
  );
  expect(measured.find((f) => f.code === 'ENV_NAV_HEADROOM_TOO_LOW')?.measurement).toMatchObject({
    actual: 0.2,
    threshold: 0.25,
  });
  expect(result.unevaluatedRequirements).toEqual([]);
  expect(codes(report(root, { navigation: { state: 'inferred', value } }))).not.toContain(
    'ENV_NAV_CORRIDOR_TOO_NARROW',
  );
  expect(
    codes(report(root, { navigation: { state: 'requested', value: { minWidth: 0.09 } } })),
  ).not.toContain('ENV_NAV_HEADROOM_TOO_LOW');
});

test.each([
  'environment.ground',
  'environment.surface',
  'environment.path.surface',
  'environment.bridge.deck',
])('a source role cannot exempt a protruding obstacle from navigation: %s', (role) => {
  const root = route(true);
  stampSemanticMetadataV1(root.getObjectByName('Rock')!, { roles: [role] });
  expect(codes(report(root, navigation))).toContain('ENV_NAV_CORRIDOR_BLOCKED');
  // The same support surface below the declared route does not obstruct it.
  root.getObjectByName('Rock')!.position.y = -0.5;
  expect(codes(report(root, navigation))).not.toContain('ENV_NAV_CORRIDOR_BLOCKED');
});

test('requested navigation measures an arena route without introducing storeys or a category', () => {
  const good = report(route(), navigation);
  expect(good.acceptance).toBe('accepted');
  expect(good.unevaluatedRequirements).toEqual([]);
  expect(codes(good).some((code) => code.startsWith('ARCH_'))).toBe(false);
  expect(codes(report(route(true), navigation))).toContain('ENV_NAV_CORRIDOR_BLOCKED');
});

test('navigation and tiling remain unspecified when only source geometry claims them', () => {
  const root = route(true);
  root.userData.category = 'environment';
  expect(codes(report(root, {})).filter((code) => code.startsWith('ENV_'))).toEqual([]);
});

test('missing navigation evidence stays incomplete and survives report validation', () => {
  const result = report(route(false, false), navigation);
  expect(codes(result)).toContain('ENV_NAV_CLEARANCE_UNASSESSED');
  expect(result.acceptance).toBe('incomplete');
  expect(result.unevaluatedRequirements).toContainEqual(
    expect.objectContaining({ key: 'navigation' }),
  );
});

test('an instance in the route is a blocker even when the uninstanced mesh bounds are elsewhere', () => {
  const root = route();
  const rocks = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.5, 1, 0.5),
    new THREE.MeshStandardMaterial(),
    1,
  );
  rocks.name = 'Rocks';
  rocks.position.set(10, 0, 0);
  rocks.setMatrixAt(0, new THREE.Matrix4().makeTranslation(-10, 0.5, 0));
  root.add(rocks);
  expect(codes(report(root, navigation))).toContain('ENV_NAV_CORRIDOR_BLOCKED');
});

test('navigation can coexist with explicit tiling and unrelated mobility obligations', () => {
  const root = route();
  const result = report(root, {
    ...navigation,
    tiling: { state: 'requested', value: {} },
    mobility: { state: 'requested', value: { wheelCount: 0 } },
  });
  expect(result.rules.find((r) => r.id === 'ENVIRONMENT_EXACT_PROFILE')?.status).toBe('evaluated');
  expect(result.rules.find((r) => r.id === 'VEHICLE_PROFILE')?.status).toBe('evaluated');
  expect(codes(result)).not.toContain('VEH_WHEEL_COUNT');
  expect(result.unevaluatedRequirements.some((r) => r.key === 'tiling')).toBe(false);
});

test('requested seams detect a semantic tile height mismatch under a transformed root', () => {
  const root = new THREE.Group();
  root.name = 'TileAsset';
  root.position.set(20, 8, -3);
  root.rotation.y = 0.7;
  const geometry = new THREE.PlaneGeometry(2, 2, 4, 4);
  geometry.rotateX(-Math.PI / 2);
  const tile = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  tile.name = 'Tile';
  const frames = [
    {
      id: 'xn',
      translation: [-1, 0, 0] as [number, number, number],
      rotation: [0, 0, 0, 1] as [number, number, number, number],
    },
    {
      id: 'xp',
      translation: [1, 0, 0] as [number, number, number],
      rotation: [0, 0, 0, 1] as [number, number, number, number],
    },
    {
      id: 'zn',
      translation: [0, 0, -1] as [number, number, number],
      rotation: [0, 0, 0, 1] as [number, number, number, number],
    },
    {
      id: 'zp',
      translation: [0, 0, 1] as [number, number, number],
      rotation: [0, 0, 0, 1] as [number, number, number, number],
    },
  ];
  const types = ['x-negative', 'x-positive', 'z-negative', 'z-positive'];
  stampSemanticMetadataV1(tile, {
    roles: ['environment.tile.surface'],
    frames,
    sockets: frames.map((frame, i) => ({
      id: frame.id,
      frame: frame.id,
      type: `environment.tile.${types[i]}`,
      compatibleTypes: [`environment.tile.${types[i ^ 1]}`],
    })),
  });
  root.add(tile);
  const needs = { tiling: { state: 'requested', value: {} } } as const;
  expect(report(root, needs).acceptance).toBe('accepted');
  const positions = geometry.getAttribute('position');
  for (let i = 0; i < positions.count; i++) if (positions.getX(i) > 0.99) positions.setY(i, 0.2);
  geometry.computeVertexNormals();
  expect(codes(report(root, needs))).toContain('ENV_TILE_EDGE_HEIGHT_SEAM');
});

test('an unmeasurable sheared blocker cannot make navigation look accepted', () => {
  const root = route();
  const rock = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 0.5), new THREE.MeshStandardMaterial());
  rock.name = 'ShearedRock';
  rock.matrixAutoUpdate = false;
  rock.matrix.makeShear(0.5, 0, 0, 0, 0, 0);
  rock.matrix.setPosition(0, 0.5, 0);
  root.add(rock);
  const result = report(root, navigation);
  expect(codes(result)).toContain('ENV_NAV_CLEARANCE_UNASSESSED');
  expect(result.acceptance).toBe('incomplete');
});

test('spatial support respects a requested nonzero local ground plane', () => {
  const root = route(false, false);
  root.children[0]!.position.y = 4.05;
  const result = report(root, {
    spatialLayout: { state: 'requested', value: {} },
    grounding: { state: 'requested', value: { planeY: 4 } },
  });
  expect(
    codes(result).filter((code) =>
      /ENV_FUNCTIONAL_PART_BURIED|ENV_LAYER_UNSUPPORTED|PROP_GROUND_MISMATCH/.test(code),
    ),
  ).toEqual([]);
});

test('final-byte QA preserves missing-corridor incompleteness', async () => {
  const requirements = createAssetRequirementsStore().host.bind(
    { taskId: 'spatial', lineageId: 'export' },
    createAssetRequirementsV1({ requirements: navigation }),
    { actor: 'owner', source: 'brief', reason: 'Unmeasured passage' },
  );
  const result = await renderSceneToGLB(route(false, false), { requirements });
  expect(result.bytes.byteLength).toBeGreaterThan(0);
  expect(result.qaReport.acceptance).toBe('incomplete');
  expect(result.qaReport.dimensions.exportIntegrity.status).toBe('pass');
  validateRequirementsQaReport(JSON.parse(JSON.stringify(result.qaReport)), result.requirements);
});
