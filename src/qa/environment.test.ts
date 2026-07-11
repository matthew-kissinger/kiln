import { describe, expect, test } from 'bun:test';
import { WebIO } from '@gltf-transform/core';
import * as THREE from 'three';

import {
  createAssetIntentV1,
  readSemanticMetadataV1FromExtras,
  stampSemanticMetadataV1,
} from '../contracts';
import { renderSceneToGLB } from '../render';
import {
  ENVIRONMENT_SOCKET_TYPES,
  ENVIRONMENT_SUBTYPES,
  evaluateEnvironmentGroundQa,
  evaluateEnvironmentNavigabilityQa,
  evaluateEnvironmentSocketQa,
  evaluateEnvironmentTileEdgeQa,
  resolveEnvironmentIntentProfile,
  resolveEnvironmentSockets,
} from './environment';
import { buildPropEnvironmentSemanticGuidance } from './prop-environment-prompt';
import type { QaContext } from './types';

const material = new THREE.MeshStandardMaterial({ color: '#68765c', roughness: 0.9 });

function context(
  root: THREE.Object3D,
  options: {
    subtype?: string;
    capabilities?: Array<'tileable' | 'navigable' | 'grounded'>;
  } = {},
): QaContext {
  return {
    intent: createAssetIntentV1({
      category: 'environment',
      ...(options.subtype ? { subtype: options.subtype } : {}),
      capabilities: options.capabilities ?? [],
    }),
    scene: root,
  };
}

function codes(findings: readonly { code: string }[]): string[] {
  return findings.map((finding) => finding.code);
}

function semanticTile(options: { heightSeam?: boolean; socketOffset?: number } = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'TileRoot';
  const geometry = new THREE.PlaneGeometry(2, 2, 4, 4);
  geometry.rotateX(-Math.PI / 2);
  if (options.heightSeam) {
    const positions = geometry.getAttribute('position');
    for (let index = 0; index < positions.count; index++) {
      if (positions.getX(index) > 0.99) positions.setY(index, 0.2);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  }
  const tile = new THREE.Mesh(geometry, material);
  tile.name = 'EnvironmentTile';
  const zOffset = options.socketOffset ?? 0;
  stampSemanticMetadataV1(tile, {
    roles: ['environment.tile.surface', 'environment.ground.surface'],
    frames: [
      { id: 'tile.x-negative', translation: [-1, 0, 0], rotation: [0, 0, 0, 1] },
      { id: 'tile.x-positive', translation: [1, 0, zOffset], rotation: [0, 0, 0, 1] },
      { id: 'tile.z-negative', translation: [0, 0, -1], rotation: [0, 0, 0, 1] },
      { id: 'tile.z-positive', translation: [0, 0, 1], rotation: [0, 0, 0, 1] },
    ],
    sockets: [
      {
        id: 'tile-x-negative',
        type: 'environment.tile.x-negative',
        frame: 'tile.x-negative',
        compatibleTypes: ['environment.tile.x-positive'],
      },
      {
        id: 'tile-x-positive',
        type: 'environment.tile.x-positive',
        frame: 'tile.x-positive',
        compatibleTypes: ['environment.tile.x-negative'],
      },
      {
        id: 'tile-z-negative',
        type: 'environment.tile.z-negative',
        frame: 'tile.z-negative',
        compatibleTypes: ['environment.tile.z-positive'],
      },
      {
        id: 'tile-z-positive',
        type: 'environment.tile.z-positive',
        frame: 'tile.z-positive',
        compatibleTypes: ['environment.tile.z-negative'],
      },
    ],
  });
  root.add(tile);
  return root;
}

function box(
  name: string,
  size: [number, number, number],
  position: [number, number, number],
  role?: string,
) {
  const value = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  value.name = name;
  value.position.set(...position);
  if (role) stampSemanticMetadataV1(value, { roles: [role] });
  return value;
}

function corridor(size: [number, number, number] = [1.2, 2, 4], blocker = false): THREE.Group {
  const root = new THREE.Group();
  root.name = 'CaveEntrance';
  root.add(box('Path', [1.4, 0.05, 4.2], [0, -0.025, 0], 'environment.path.surface'));
  const marker = new THREE.Group();
  marker.name = 'ClearRoute';
  marker.position.y = size[1] / 2;
  marker.scale.set(...size);
  stampSemanticMetadataV1(marker, { roles: ['environment.navigation.corridor.main'] });
  root.add(marker);
  if (blocker) root.add(box('RockBlocker', [0.4, 1, 0.4], [0, 0.5, 0]));
  return root;
}

function socketCarrier(types: string[]): THREE.Group {
  const opposite = new Map<string, string>([
    ['environment.tile.x-negative', 'environment.tile.x-positive'],
    ['environment.tile.x-positive', 'environment.tile.x-negative'],
    ['environment.tile.z-negative', 'environment.tile.z-positive'],
    ['environment.tile.z-positive', 'environment.tile.z-negative'],
    ['environment.road.start', 'environment.road.end'],
    ['environment.road.end', 'environment.road.start'],
  ]);
  const carrier = new THREE.Group();
  carrier.name = 'DeclaredSocketCarrier';
  stampSemanticMetadataV1(carrier, {
    roles: ['environment.socket-carrier'],
    frames: types.map((_type, index) => ({
      id: `socket.${index}`,
      translation: [index, 0, 0],
      rotation: [0, 0, 0, 1],
    })),
    sockets: types.map((type, index) => ({
      id: `socket-${index}`,
      type,
      frame: `socket.${index}`,
      compatibleTypes: opposite.has(type) ? [opposite.get(type)!] : [],
    })),
  });
  return carrier;
}

describe('ENV-001 intent profile', () => {
  test('freezes all requested subtypes and closure-owned capabilities', () => {
    expect(ENVIRONMENT_SUBTYPES).toEqual([
      'terrain-tile',
      'rock-cliff',
      'cave',
      'road-path',
      'shoreline',
      'wall-gate',
      'bridge',
      'set-dressing-cluster',
      'custom',
    ]);
    expect(ENVIRONMENT_SOCKET_TYPES).toHaveLength(13);
    const profile = resolveEnvironmentIntentProfile(
      createAssetIntentV1({
        category: 'environment',
        subtype: 'road',
        capabilities: ['tileable', 'navigable'],
      }),
    );
    expect(profile).toEqual({
      schemaVersion: 1,
      subtype: 'road-path',
      tileable: true,
      navigable: true,
    });
    expect(
      resolveEnvironmentIntentProfile(createAssetIntentV1({ category: 'prop' })),
    ).toBeUndefined();
  });
});

describe('ENV-002 tile edge continuity', () => {
  test('accepts aligned height/normal/material samples and paired semantic sockets', () => {
    const value = context(semanticTile(), { subtype: 'terrain-tile', capabilities: ['tileable'] });
    expect(evaluateEnvironmentSocketQa(value)).toEqual([]);
    expect(evaluateEnvironmentTileEdgeQa(value)).toEqual([]);
  });

  test('blocks a measured tagged height seam and socket misalignment', () => {
    const seam = context(semanticTile({ heightSeam: true }), {
      subtype: 'terrain-tile',
      capabilities: ['tileable'],
    });
    const seamFindings = evaluateEnvironmentTileEdgeQa(seam);
    expect(codes(seamFindings)).toContain('ENV_TILE_EDGE_HEIGHT_SEAM');
    expect(
      seamFindings.find((finding) => finding.code === 'ENV_TILE_EDGE_HEIGHT_SEAM')?.disposition,
    ).toBe('block');

    const socket = context(semanticTile({ socketOffset: 0.1 }), {
      subtype: 'terrain-tile',
      capabilities: ['tileable'],
    });
    expect(codes(evaluateEnvironmentSocketQa(socket))).toContain('ENV_SOCKET_PAIR_MISALIGNED');
  });

  test('keeps untagged inferred edge evidence nonblocking', () => {
    const tile = semanticTile({ heightSeam: true });
    const mesh = tile.getObjectByName('EnvironmentTile')!;
    delete mesh.userData.kilnSemantic;
    const findings = evaluateEnvironmentTileEdgeQa(
      context(tile, { subtype: 'terrain-tile', capabilities: ['tileable'] }),
    );
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.every((finding) => finding.disposition === 'warn')).toBe(true);
  });
});

describe('ENV-003 navigable negative space', () => {
  test('accepts a clear corridor, observes default dimensions, and blocks authored obstacles', () => {
    expect(
      evaluateEnvironmentNavigabilityQa(
        context(corridor(), { subtype: 'cave', capabilities: ['navigable'] }),
      ),
    ).toEqual([]);

    const undersized = evaluateEnvironmentNavigabilityQa(
      context(corridor([0.6, 1.4, 4]), { subtype: 'cave', capabilities: ['navigable'] }),
    );
    expect(codes(undersized)).toEqual(['ENV_NAV_CORRIDOR_TOO_NARROW', 'ENV_NAV_HEADROOM_TOO_LOW']);
    expect(undersized.every((finding) => finding.disposition === 'warn')).toBe(true);
    expect(
      codes(
        evaluateEnvironmentNavigabilityQa(
          context(corridor([1.2, 2, 4], true), { subtype: 'cave', capabilities: ['navigable'] }),
        ),
      ),
    ).toContain('ENV_NAV_CORRIDOR_BLOCKED');
  });

  test('measures rotated corridors in their local frame instead of their inflated AABB', () => {
    const root = corridor([0.6, 2, 4]);
    root.getObjectByName('ClearRoute')!.rotation.y = Math.PI / 4;
    root.add(box('AabbOnlyRock', [0.2, 1, 0.2], [1.2, 0.5, -1.2]));
    const outside = evaluateEnvironmentNavigabilityQa(
      context(root, { subtype: 'cave', capabilities: ['navigable'] }),
    );
    expect(codes(outside)).toContain('ENV_NAV_CORRIDOR_TOO_NARROW');
    expect(codes(outside)).not.toContain('ENV_NAV_CORRIDOR_BLOCKED');

    root.add(box('TrueBlocker', [0.2, 1, 0.2], [0, 0.5, 0]));
    expect(
      codes(
        evaluateEnvironmentNavigabilityQa(
          context(root, { subtype: 'cave', capabilities: ['navigable'] }),
        ),
      ),
    ).toContain('ENV_NAV_CORRIDOR_BLOCKED');
  });

  test('reports untagged inferred navigation as an observe-path warning, never a blocker', () => {
    const root = new THREE.Group();
    root.add(box('Road', [2, 0.1, 4], [0, 0, 0]));
    const findings = evaluateEnvironmentNavigabilityQa(
      context(root, { subtype: 'road', capabilities: ['navigable'] }),
    );
    expect(codes(findings)).toEqual(['ENV_NAV_CLEARANCE_UNASSESSED']);
    expect(findings[0]?.disposition).toBe('warn');
  });
});

describe('ENV-004 semantic placement sockets', () => {
  test('enforces only socket pairs that were explicitly declared', () => {
    expect(evaluateEnvironmentSocketQa(context(new THREE.Group(), { subtype: 'road' }))).toEqual(
      [],
    );
    expect(
      codes(
        evaluateEnvironmentSocketQa(
          context(socketCarrier(['environment.road.start']), { subtype: 'road' }),
        ),
      ),
    ).toEqual(['ENV_SOCKET_MISSING']);
    expect(
      evaluateEnvironmentSocketQa(
        context(socketCarrier(['environment.tile.x-negative', 'environment.tile.x-positive']), {
          subtype: 'terrain-tile',
          capabilities: ['tileable'],
        }),
      ),
    ).toEqual([]);
  });

  test('resolves declared frames in asset-local space', () => {
    const sockets = resolveEnvironmentSockets(semanticTile());
    expect(sockets.map((socket) => socket.type)).toEqual([
      'environment.tile.x-negative',
      'environment.tile.x-positive',
      'environment.tile.z-negative',
      'environment.tile.z-positive',
    ]);
    expect(
      sockets.find((socket) => socket.type === 'environment.tile.x-positive')?.translation,
    ).toEqual([1, 0, 0]);
  });

  test('preserves exact frame/socket metadata through GLB export and reload', async () => {
    const root = semanticTile();
    const rendered = await renderSceneToGLB(root, {
      intent: createAssetIntentV1({
        category: 'environment',
        subtype: 'terrain-tile',
        capabilities: ['tileable'],
      }),
      optimize: 'full',
    });
    const document = await new WebIO().readBinary(rendered.bytes);
    const node = document
      .getRoot()
      .listNodes()
      .find((candidate) => candidate.getName() === 'EnvironmentTile');
    const loaded = readSemanticMetadataV1FromExtras(node?.getExtras() ?? {});
    expect(loaded?.frames.map((frame) => frame.id)).toEqual([
      'tile.x-negative',
      'tile.x-positive',
      'tile.z-negative',
      'tile.z-positive',
    ]);
    expect(loaded?.sockets.map((socket) => socket.type)).toEqual([
      'environment.tile.x-negative',
      'environment.tile.x-positive',
      'environment.tile.z-negative',
      'environment.tile.z-positive',
    ]);
  });
});

describe('ENV-005 ground policy', () => {
  test('allows intentional terrain volume and localizes buried, floating, and skirt layers', () => {
    const root = new THREE.Group();
    root.add(
      box('Terrain', [4, 0.6, 4], [0, -0.3, 0], 'environment.terrain.volume.main'),
      box('BuriedRoad', [2, 0.2, 2], [0, -0.1, 0], 'environment.road.surface'),
      box('FloatingDeck', [1, 0.1, 1], [3, 1, 0], 'environment.bridge.deck'),
      box('ThinSkirt', [3, 0.04, 3], [-4, -0.2, 0]),
    );
    const findings = evaluateEnvironmentGroundQa(context(root, { subtype: 'custom' }));
    expect(codes(findings)).toEqual([
      'ENV_FUNCTIONAL_PART_BURIED',
      'ENV_LAYER_UNSUPPORTED',
      'ENV_GROUND_UNDECLARED_SKIRT',
    ]);
    expect(findings.every((finding) => finding.disposition === 'warn')).toBe(true);
  });
});

describe('prop/environment prompt guidance', () => {
  test('names subtype, tile seams, sockets, corridor, and ground-policy roles', () => {
    const intent = createAssetIntentV1({
      category: 'environment',
      subtype: 'bridge',
      capabilities: ['tileable', 'navigable'],
    });
    const guidance = buildPropEnvironmentSemanticGuidance(intent);
    expect(guidance).toContain('Resolved subtype: bridge');
    expect(guidance).toContain('environment.bridge.start/end');
    expect(guidance).toContain('sampled height, vertex normal');
    expect(guidance).toContain('explicitly requested tile axis');
    expect(guidance).not.toContain('opposing X and Z');
    expect(guidance).toContain('environment.navigation.corridor.<id>');
    expect(guidance).toContain('environment.terrain.volume.*');
  });
});
