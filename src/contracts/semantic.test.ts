import { describe, expect, test } from 'bun:test';
import { WebIO } from '@gltf-transform/core';
import * as THREE from 'three';

import { boxGeo, createPart } from '../primitives';
import { renderSceneToGLB } from '../render';
import {
  KILN_SEMANTIC_EXTRAS_KEY,
  createSemanticMetadataV1,
  readSemanticMetadataV1,
  readSemanticMetadataV1FromExtras,
  semanticMetadataBytesV1,
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
