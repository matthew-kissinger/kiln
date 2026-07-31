import { describe, expect, test } from 'bun:test';
import { WebIO } from '@gltf-transform/core';
import * as THREE from 'three';

import { boxGeo, createPart } from '../primitives';
import { renderSceneToGLB } from '../render';
import { createVehicleFrame, createWheelAssembly } from '../vehicle';
import {
  KILN_SEMANTIC_EXTRAS_KEY,
  KILN_SEMANTIC_ROLES,
  createSemanticMetadataV1,
  hasSemanticRole,
  readSemanticMetadataV1,
  readSemanticMetadataV1FromExtras,
  semanticMetadataBytesV1,
  semanticRole,
  semanticRoleMatches,
  stampSemanticMetadataV1,
  validateSemanticMetadataV1,
} from './semantic';

const fullMetadata = () =>
  createSemanticMetadataV1({
    roles: ['vehicle.chassis', 'vehicle.driveable'],
    frames: [
      { id: 'axle.front', translation: [1.25, 0.42, 0], rotation: [0, 0, 0, 1] },
      {
        id: 'seat.driver',
        translation: [-0.2, 1.05, 0.35],
        rotation: [0, Math.SQRT1_2, 0, Math.SQRT1_2],
      },
    ],
    relationships: [
      {
        kind: 'supports',
        target: 'vehicle.wheel.frontLeft',
        targetType: 'role',
        sourceFrame: 'axle.front',
      },
      {
        kind: 'drivenBy',
        target: 'driver',
        targetType: 'socket',
        sourceFrame: 'seat.driver',
      },
    ],
    sockets: [
      {
        id: 'driver',
        type: 'occupant.driver',
        frame: 'seat.driver',
        compatibleTypes: ['character.seated'],
        allowedRotationsDegrees: [0, 180],
      },
    ],
  });

describe('semantic metadata contract', () => {
  test('creates detached, validated role/relationship/frame/socket metadata', () => {
    const metadata = fullMetadata();
    const object = new THREE.Group();
    stampSemanticMetadataV1(object, metadata);

    metadata.roles.push('mutated.after.stamp');
    const stamped = readSemanticMetadataV1(object);
    expect(stamped?.schemaVersion).toBe(1);
    expect(stamped?.roles).toEqual(['vehicle.chassis', 'vehicle.driveable']);
    expect(stamped?.relationships[0]?.sourceFrame).toBe('axle.front');
    expect(stamped?.sockets[0]?.frame).toBe('seat.driver');
  });

  test('rejects duplicate IDs, unknown frame references, and non-rigid frames', () => {
    const invalid = {
      schemaVersion: 1,
      roles: ['roof.slope.left'],
      relationships: [],
      frames: [
        { id: 'ridge', translation: [0, 0, 0], rotation: [0, 0, 0, 2] },
        { id: 'ridge', translation: [0, 0, 0], rotation: [0, 0, 0, 1] },
      ],
      sockets: [
        { id: 'join', type: 'roof.join', frame: 'missing', compatibleTypes: ['roof.join'] },
      ],
    };
    const result = validateSemanticMetadataV1(invalid);
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'NON_UNIT_FRAME_ROTATION',
        'DUPLICATE_FRAME_ID',
        'UNKNOWN_FRAME_REFERENCE',
      ]),
    );
  });

  test('survives final GLB export, reload, rewrite, and reload byte-for-byte in node extras', async () => {
    const root = new THREE.Group();
    root.name = 'SemanticVehicle';
    const metadata = fullMetadata();
    const chassis = createPart(
      'Chassis',
      boxGeo(2.5, 0.6, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x334455 }),
      { parent: root, semantic: metadata },
    );
    expect(readSemanticMetadataV1(chassis)?.roles).toEqual([
      'vehicle.chassis',
      'vehicle.driveable',
    ]);

    const rendered = await renderSceneToGLB(root, { optimize: 'full' });
    const io = new WebIO();
    const document = await io.readBinary(rendered.bytes);
    const loadedNode = document
      .getRoot()
      .listNodes()
      .find((node) => node.getName() === 'Mesh_Chassis');
    expect(loadedNode).toBeDefined();
    const loaded = readSemanticMetadataV1FromExtras(loadedNode!.getExtras());
    expect(loaded).toBeDefined();
    expect(semanticMetadataBytesV1(loaded!)).toEqual(semanticMetadataBytesV1(metadata));
    expect(
      Array.from(
        new TextEncoder().encode(JSON.stringify(loadedNode!.getExtras()[KILN_SEMANTIC_EXTRAS_KEY])),
      ),
    ).toEqual(Array.from(semanticMetadataBytesV1(metadata)));

    const rewritten = await io.writeBinary(document);
    const reloadedDocument = await io.readBinary(rewritten);
    const reloadedNode = reloadedDocument
      .getRoot()
      .listNodes()
      .find((node) => node.getName() === 'Mesh_Chassis');
    const reloaded = readSemanticMetadataV1FromExtras(reloadedNode!.getExtras());
    expect(semanticMetadataBytesV1(reloaded!)).toEqual(semanticMetadataBytesV1(metadata));
    expect(
      Array.from(
        new TextEncoder().encode(
          JSON.stringify(reloadedNode!.getExtras()[KILN_SEMANTIC_EXTRAS_KEY]),
        ),
      ),
    ).toEqual(Array.from(semanticMetadataBytesV1(metadata)));
  });

  test('does not silently discard malformed data placed under the reserved extras key', async () => {
    const root = new THREE.Group();
    root.userData[KILN_SEMANTIC_EXTRAS_KEY] = { schemaVersion: 999 };
    root.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial()));
    expect(renderSceneToGLB(root)).rejects.toThrow(`Invalid ${KILN_SEMANTIC_EXTRAS_KEY}`);
  });
});

// =============================================================================
// Role vocabulary — the shared constants Studio's city-kit reads back.
//
// The point of these constants is that producer and consumer stop typing the
// same string independently. So the tests that matter are the CONFORMANCE ones:
// what the engine actually stamps on a real vehicle must be addressable through
// the exported vocabulary alone, with no literal typed in the reader.
// =============================================================================
describe('semantic role vocabulary', () => {
  test('semanticRole joins instance segments onto a base and drops blanks', () => {
    expect(semanticRole(KILN_SEMANTIC_ROLES.wheelTire, 'left.0')).toBe('wheel.tire.left.0');
    expect(semanticRole(KILN_SEMANTIC_ROLES.axle, 0)).toBe('axle.0');
    expect(semanticRole(KILN_SEMANTIC_ROLES.socket, 'axle', 'rear')).toBe('socket.axle.rear');
    expect(semanticRole(KILN_SEMANTIC_ROLES.chassis)).toBe('chassis');
    expect(semanticRole(KILN_SEMANTIC_ROLES.chassis, '', '  ')).toBe('chassis');
  });

  test('semanticRoleMatches is segment-bounded, not a bare prefix test', () => {
    expect(semanticRoleMatches('roof.assembly', KILN_SEMANTIC_ROLES.roof)).toBe(true);
    expect(semanticRoleMatches('roof', KILN_SEMANTIC_ROLES.roof)).toBe(true);
    // The whole reason a shared matcher exists: startsWith would say true here.
    expect(semanticRoleMatches('rooftop.garden', KILN_SEMANTIC_ROLES.roof)).toBe(false);
    expect(semanticRoleMatches('wheel.tireish.0', KILN_SEMANTIC_ROLES.wheelTire)).toBe(false);
    expect(semanticRoleMatches('wheel.tire.left.0', KILN_SEMANTIC_ROLES.wheelTire)).toBe(true);
  });

  test('hasSemanticRole scans a role list with the same boundary rule', () => {
    const roles = ['wheel.assembly.left.0', 'wheel.pivot.left.0', 'wheel.load-bearing.left.0'];
    expect(hasSemanticRole(roles, KILN_SEMANTIC_ROLES.wheelAssembly)).toBe(true);
    expect(hasSemanticRole(roles, KILN_SEMANTIC_ROLES.wheelLoadBearing)).toBe(true);
    expect(hasSemanticRole(roles, KILN_SEMANTIC_ROLES.wheelTire)).toBe(false);
    expect(hasSemanticRole([], KILN_SEMANTIC_ROLES.wheelTire)).toBe(false);
  });

  test('the vocabulary is frozen — values are the published GLB contract', () => {
    expect(Object.isFrozen(KILN_SEMANTIC_ROLES)).toBe(true);
    expect(KILN_SEMANTIC_ROLES.vehicleFrame).toBe('vehicle.frame');
    expect(KILN_SEMANTIC_ROLES.wheelAssembly).toBe('wheel.assembly');
    expect(KILN_SEMANTIC_ROLES.chassisMain).toBe('chassis.main');
    expect(KILN_SEMANTIC_ROLES.roof).toBe('roof');
  });

  test('CONFORMANCE: a real engine-built vehicle is fully addressable through the vocabulary', () => {
    const frame = createVehicleFrame('Cart', {
      axles: [{ id: '0', position: [0.8, 0.3, 0] }],
      seats: [{ id: 'driver', position: [0, 0.6, 0] }],
    });
    const rubber = new THREE.MeshStandardMaterial();
    createWheelAssembly(
      'Cart',
      { tire: rubber, rim: rubber },
      {
        side: 'left',
        index: 0,
        radius: 0.3,
        width: 0.16,
        position: [0.8, 0.3, 0.5],
        steering: true,
        parent: frame.root,
      },
    );

    const rolesAt = (node: THREE.Object3D): readonly string[] =>
      readSemanticMetadataV1(node)?.roles ?? [];
    const findWith = (base: string): THREE.Object3D | undefined => {
      let hit: THREE.Object3D | undefined;
      frame.root.traverse((node) => {
        if (!hit && hasSemanticRole(rolesAt(node), base)) hit = node;
      });
      return hit;
    };

    // Every base a downstream rig reader needs must resolve on the real asset.
    for (const base of [
      KILN_SEMANTIC_ROLES.vehicleFrame,
      KILN_SEMANTIC_ROLES.chassis,
      KILN_SEMANTIC_ROLES.axle,
      KILN_SEMANTIC_ROLES.seat,
      KILN_SEMANTIC_ROLES.socket,
      KILN_SEMANTIC_ROLES.wheelAssembly,
      KILN_SEMANTIC_ROLES.wheelPivot,
      KILN_SEMANTIC_ROLES.wheelLoadBearing,
      KILN_SEMANTIC_ROLES.wheelTire,
      KILN_SEMANTIC_ROLES.wheelRim,
      KILN_SEMANTIC_ROLES.wheelHub,
      KILN_SEMANTIC_ROLES.wheelContact,
      KILN_SEMANTIC_ROLES.contact,
      KILN_SEMANTIC_ROLES.steeringPivot,
    ]) {
      expect(findWith(base)).toBeDefined();
    }

    // The exact spellings that cross the repo boundary, pinned.
    expect(rolesAt(frame.root)).toEqual(['vehicle.frame', 'vehicle.front.+x']);
    expect(rolesAt(frame.chassis)).toEqual(['socket.chassis.main', 'chassis.main']);
    expect(rolesAt(frame.axles[0]!)).toEqual(['socket.axle.0', 'axle.0']);
    expect(rolesAt(frame.seats[0]!)).toEqual(['socket.seat.driver', 'seat.driver']);
    expect(rolesAt(findWith(KILN_SEMANTIC_ROLES.wheelAssembly)!)).toEqual([
      'wheel.assembly.left.0',
      'wheel.pivot.left.0',
      'wheel.load-bearing.left.0',
    ]);
  });
});
