import { describe, expect, test } from 'bun:test';
import type { SceneModelJSON } from './model';
import {
  hashWorldDocumentV2,
  migrateSceneModelV1ToWorldDocumentV2,
  parseWorldDocumentV2,
  reconcileWorldDocumentV2Objects,
  worldDocumentV2ArtifactReferences,
  type WorldPathV2,
} from './world-document';
import {
  setWorldPathsV2,
  setWorldSocketsV2,
  setWorldSpawnsV2,
  setWorldTerrainV2,
  setWorldZonesV2,
  alignWorldObjectsToPathV2,
  fillWorldPathV2,
  reconcileWorldDocumentV2Candidate,
  sampleWorldPathV2,
  snapWorldObjectToSocketV2,
  validateWorldIntegrationV2,
} from './world-integration';

const SHA_A = 'a'.repeat(64);
const SHA_B = 'b'.repeat(64);

function world() {
  const model: SceneModelJSON = {
    name: 'World',
    seed: 4,
    catalog: [
      {
        generationId: 'crate',
        bbox: { min: [-1, 0, -1], max: [1, 2, 1] },
        tags: ['cargo'],
      },
      {
        generationId: 'door',
        bbox: { min: [-0.5, 0, -0.25], max: [0.5, 2, 0.25] },
        tags: ['portal'],
      },
    ],
    statements: [
      {
        kind: 'place',
        stmtId: 's1',
        alias: 'crate-1',
        generationId: 'crate',
        role: 'support',
        scale: 1,
        at: [10, 10],
        face: 0,
        exact: { pos: [10, 0, 10], rotYDeg: 0 },
      },
    ],
  };
  return migrateSceneModelV1ToWorldDocumentV2(model, {
    worldId: 'world',
    artifactSha256ByGenerationId: { crate: SHA_A },
  });
}

describe('WorldDocumentV2 integration primitives', () => {
  test('authors deterministic full replacements and rejects non-positive rect half extents', async () => {
    let doc = world();
    doc = setWorldZonesV2(doc, [
      { id: 'z2', kind: 'reserved', shape: { type: 'circle', center: [20, 20], radius: 2 } },
      {
        id: 'z1',
        kind: 'reserved',
        shape: { type: 'rect', center: [30, 30], halfExtents: [2, 3] },
      },
    ]);
    doc = setWorldPathsV2(doc, [
      {
        id: 'p',
        points: [
          [0, 0, 0],
          [2, 0, 2],
        ],
        halfWidth: 1,
      },
    ]);
    doc = setWorldSocketsV2(doc, [
      {
        id: 'socket',
        kind: 'anchor',
        position: [5, 0, 5],
        rotationYDeg: 90,
        compatibilityTags: ['cargo'],
        capacity: 1,
      },
    ]);
    doc = setWorldSpawnsV2(doc, [
      { id: 'spawn', position: [-20, 0, -20], rotationYDeg: 0, clearanceRadius: 2 },
    ]);
    doc = setWorldTerrainV2(doc, { kind: 'flat', height: 3 });
    expect(doc.authored.zones.map(({ id }) => id)).toEqual(['z1', 'z2']);
    expect(doc.authored.paths).toHaveLength(1);
    expect(doc.authored.sockets).toHaveLength(1);
    expect(doc.spawns).toHaveLength(1);
    expect(doc.terrain).toEqual({ kind: 'flat', height: 3 });
    expect(await hashWorldDocumentV2(setWorldZonesV2(doc, [...doc.authored.zones].reverse()))).toBe(
      await hashWorldDocumentV2(doc),
    );
    expect(() =>
      setWorldZonesV2(doc, [
        {
          id: 'bad',
          kind: 'reserved',
          shape: { type: 'rect', center: [0, 0], halfExtents: [0, 1] },
        },
      ]),
    ).toThrow();
  });

  test('snaps compatible objects and validates occupancy, portal, reserved, and spawn clearance', () => {
    let doc = setWorldSocketsV2(world(), [
      {
        id: 'cargo-slot',
        kind: 'anchor',
        position: [0, 0, 0],
        rotationYDeg: 45,
        compatibilityTags: ['cargo'],
        capacity: 1,
      },
    ]);
    doc = snapWorldObjectToSocketV2(doc, { objectId: 'crate-1', socketId: 'cargo-slot' });
    expect(doc.objects[0]).toMatchObject({
      id: 'crate-1',
      socketId: 'cargo-slot',
      transform: { position: [0, 0, 0], rotationYDeg: 45 },
    });
    expect(validateWorldIntegrationV2(doc)).toEqual([]);

    expect(() =>
      setWorldZonesV2(doc, [
        {
          id: 'reserved',
          kind: 'reserved',
          shape: { type: 'circle', center: [0, 0], radius: 3 },
        },
      ]),
    ).toThrow('reserved zone');

    expect(() =>
      setWorldSocketsV2(world(), [
        {
          id: 'portal',
          kind: 'portal',
          position: [10, 0, 10],
          rotationYDeg: 0,
          compatibilityTags: ['portal'],
          capacity: 1,
          clearanceRadius: 3,
        },
      ]),
    ).toThrow('blocks portal');
    expect(() =>
      setWorldSpawnsV2(world(), [
        { id: 'spawn', position: [10, 0, 10], rotationYDeg: 0, clearanceRadius: 3 },
      ]),
    ).toThrow('blocks spawn');
    expect(() =>
      setWorldZonesV2(world(), [
        {
          id: 'portal-zone',
          kind: 'portal-clearance',
          shape: { type: 'circle', center: [10, 10], radius: 3 },
        },
      ]),
    ).toThrow('portal-clearance zone');
    expect(() =>
      setWorldZonesV2(world(), [
        {
          id: 'spawn-zone',
          kind: 'spawn-clearance',
          shape: { type: 'rect', center: [10, 10], halfExtents: [3, 3] },
        },
      ]),
    ).toThrow('spawn-clearance zone');
  });

  test('samples, aligns, and fills paths with deterministic tangent facing', () => {
    const path: WorldPathV2 = {
      id: 'route',
      points: [
        [0, 0, 0],
        [10, 0, 0],
        [10, 0, 10],
      ],
      halfWidth: 1,
    };
    const samples = sampleWorldPathV2(path, { spacing: 5 });
    expect(samples.map(({ position, rotationYDeg }) => ({ position, rotationYDeg }))).toEqual([
      { position: [0, 0, 0], rotationYDeg: -0 },
      { position: [5, 0, 0], rotationYDeg: -0 },
      { position: [10, 0, 0], rotationYDeg: -90 },
      { position: [10, 0, 5], rotationYDeg: -90 },
      { position: [10, 0, 10], rotationYDeg: -90 },
    ]);
    let doc = setWorldPathsV2(world(), [path]);
    doc = alignWorldObjectsToPathV2(doc, {
      pathId: 'route',
      objectIds: ['crate-1'],
      spacing: 5,
      startDistance: 5,
    });
    expect(doc.objects[0]!.transform).toMatchObject({ position: [5, 0, 0], rotationYDeg: -0 });
    const filled = fillWorldPathV2(doc, {
      pathId: 'route',
      templateObjectId: 'crate-1',
      idPrefix: 'route-crate',
      count: 2,
      spacing: 5,
      startDistance: 10,
    });
    expect(
      filled.objects
        .filter(({ id }) => id.startsWith('route-crate'))
        .map(({ id, transform }) => ({ id, transform })),
    ).toEqual([
      {
        id: 'route-crate#0',
        transform: { position: [10, 0, 0], rotationYDeg: -90, uniformScale: 1 },
      },
      {
        id: 'route-crate#1',
        transform: { position: [10, 0, 5], rotationYDeg: -90, uniformScale: 1 },
      },
    ]);
    expect(
      fillWorldPathV2(doc, {
        pathId: 'route',
        templateObjectId: 'crate-1',
        idPrefix: 'route-crate',
        count: 2,
        spacing: 5,
        startDistance: 10,
      }),
    ).toEqual(filled);
  });

  test('locks asset swaps while preserving world state and stable edit history', async () => {
    let doc = setWorldSocketsV2(world(), [
      {
        id: 'slot',
        kind: 'anchor',
        position: [0, 0, 0],
        rotationYDeg: 0,
        compatibilityTags: ['cargo'],
        capacity: 1,
      },
    ]);
    doc = snapWorldObjectToSocketV2(doc, { objectId: 'crate-1', socketId: 'slot' });
    doc.objects[0]!.collision = { policy: 'bounds' };
    const beforeAuthored = structuredClone(doc.authored);
    const swapped = reconcileWorldDocumentV2Objects(doc, {
      objects: [
        {
          id: 'crate-1',
          generationId: 'door',
          position: [2, 0, 3],
          rotationYDeg: 10,
          uniformScale: 1,
        },
      ],
      assets: [
        {
          generationId: 'door',
          artifactSha256: SHA_B,
          bounds: { min: [-0.5, 0, -0.25], max: [0.5, 2, 0.25] },
          tags: ['portal'],
        },
      ],
    });
    expect(swapped.authored).toEqual(beforeAuthored);
    expect(swapped.objects[0]!.id).toBe('crate-1');
    expect(swapped.objects[0]!.socketId).toBeUndefined();
    expect(swapped.objects[0]!.collision).toEqual({ policy: 'bounds' });
    expect(swapped.objects[0]!.provenance.activeAsset).toEqual({
      generationId: 'door',
      artifactSha256: SHA_B,
    });
    expect(swapped.objects[0]!.provenance.assetHistory).toHaveLength(1);
    expect(await hashWorldDocumentV2(swapped)).not.toBe(await hashWorldDocumentV2(doc));
  });

  test('enumerates a deterministic portable artifact closure', () => {
    const doc = world();
    doc.terrain = {
      kind: 'heightfield',
      artifact: {
        uri: 'terrain/world.heightfield.json',
        sha256: SHA_B,
        mediaType: 'application/vnd.kiln.heightfield+json',
      },
    };
    doc.collisionArtifacts.push({
      refId: 'collision:crate',
      artifact: {
        uri: 'collision/crate.glb',
        sha256: 'c'.repeat(64),
        mediaType: 'model/gltf-binary',
      },
    });
    doc.objects[0]!.collision = { policy: 'artifact', artifactRefId: 'collision:crate' };
    const refs = worldDocumentV2ArtifactReferences(parseWorldDocumentV2(doc));
    expect(refs).toEqual([
      {
        kind: 'asset',
        refId: 'asset:crate',
        uri: 'models/crate.glb',
        packagePath: 'models/crate.glb',
        sha256: SHA_A,
      },
      {
        kind: 'collision',
        refId: 'collision:crate',
        uri: 'collision/crate.glb',
        packagePath: 'collision/crate.glb',
        sha256: 'c'.repeat(64),
      },
      {
        kind: 'heightfield',
        refId: 'terrain',
        uri: 'terrain/world.heightfield.json',
        packagePath: 'terrain/world.heightfield.json',
        sha256: SHA_B,
      },
    ]);
  });

  test('reconciles an agent candidate without dropping parent integration state', () => {
    let parent = setWorldSocketsV2(world(), [
      {
        id: 'slot',
        kind: 'anchor',
        position: [10, 0, 10],
        rotationYDeg: 0,
        compatibilityTags: ['cargo'],
        capacity: 1,
      },
    ]);
    parent = snapWorldObjectToSocketV2(parent, { objectId: 'crate-1', socketId: 'slot' });
    parent = setWorldZonesV2(parent, [
      {
        id: 'reserve',
        kind: 'reserved',
        shape: { type: 'circle', center: [100, 100], radius: 3 },
      },
    ]);
    parent = setWorldPathsV2(parent, [
      {
        id: 'road',
        points: [
          [0, 0, 0],
          [20, 0, 0],
        ],
        halfWidth: 2,
      },
    ]);
    parent = setWorldSpawnsV2(parent, [
      { id: 'spawn', position: [-20, 0, -20], rotationYDeg: 0, clearanceRadius: 2 },
    ]);
    parent.objects[0]!.collision = { policy: 'bounds' };

    const candidate = structuredClone(parent);
    candidate.authored = { zones: [], paths: [], sockets: [] };
    candidate.spawns = [];
    candidate.objects[0]!.transform.position = [20, 0, 20];
    delete candidate.objects[0]!.socketId;
    candidate.objects.push({
      ...structuredClone(candidate.objects[0]!),
      id: 'agent-new',
      transform: { position: [30, 0, 30], rotationYDeg: 25, uniformScale: 1 },
      role: 'fill',
      provenance: {
        sourceStatementId: 'agent:s9',
        activeAsset: { generationId: 'crate', artifactSha256: SHA_A },
      },
    });
    const merged = reconcileWorldDocumentV2Candidate(parent, candidate);
    expect(merged.authored).toEqual(parent.authored);
    expect(merged.spawns).toEqual(parent.spawns);
    expect(merged.objects.find(({ id }) => id === 'crate-1')).toMatchObject({
      collision: { policy: 'bounds' },
      transform: { position: [20, 0, 20] },
    });
    expect(merged.objects.find(({ id }) => id === 'crate-1')!.socketId).toBeUndefined();
    expect(merged.objects.find(({ id }) => id === 'agent-new')).toMatchObject({
      role: 'fill',
      provenance: { sourceStatementId: 'agent:s9' },
    });
  });
});
