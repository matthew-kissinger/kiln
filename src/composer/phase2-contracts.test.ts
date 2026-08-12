import { describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import {
  AUTHORED_COLLIDER_GEOMETRY_LIMITS_V1,
  AUTHORED_COLLIDER_GEOMETRY_V1_SCHEMA_VERSION,
  COLLIDER_ARTIFACT_V1_SCHEMA_VERSION,
  PRESENTATION_DOCUMENT_V1_SCHEMA_VERSION,
  WORLD_PACKAGE_V2_SCHEMA_VERSION,
  canonicalPresentationDocumentV1Json,
  compileColliderArtifactV1,
  createHeightfieldArtifactV1,
  createWorldPackageV2,
  decodeColliderArtifactV1,
  encodeColliderArtifactV1,
  hashColliderArtifactV1,
  hashHeightfieldArtifactV1,
  hashPresentationDocumentV1,
  hashWorldPackageV2,
  parseAuthoredColliderGeometryV1,
  parseColliderPolicyV1,
  parsePresentationDocumentV1,
  parseWorldDocumentV2,
  parseWorldPackageV2,
  setWorldPresentationV1,
  validatePresentationReceiptV1,
  validateWorldPackageV2,
  validateWorldPackageArtifactBytesV2,
  validateWorldReachabilityV1,
  worldColliderAabbV1,
  type PresentationDocumentV1,
  type WorldDocumentV2,
} from './index';

const A = 'a'.repeat(64);
const B = 'b'.repeat(64);

function world(): WorldDocumentV2 {
  return {
    schemaVersion: 'kiln.world.v2',
    worldId: 'phase2-fixture',
    name: 'Phase 2 Fixture',
    seed: 7,
    assets: [
      {
        refId: 'asset:wall',
        generationId: 'wall',
        artifactSha256: A,
        bounds: { min: [-0.5, 0, -2], max: [0.5, 2, 2] },
      },
    ],
    objects: [
      {
        id: 'wall-1',
        assetRefId: 'asset:wall',
        transform: { position: [5, 0, 5], rotationYDeg: 90, uniformScale: 2 },
        role: 'support',
        collision: { policy: 'bounds' },
        provenance: { sourceStatementId: 'fixture:wall' },
      },
    ],
    environment: { lightingPresetId: 'neutral-studio-v1', groundPaint: [] },
    terrain: { kind: 'flat', height: 0 },
    authored: { zones: [], paths: [], sockets: [] },
    collisionArtifacts: [],
    spawns: [
      { id: 'start', position: [1, 0, 1], rotationYDeg: 0, clearanceRadius: 0.4 },
      { id: 'goal', position: [9, 0, 9], rotationYDeg: 0, clearanceRadius: 0.4 },
    ],
    runtimePolicy: { mode: 'static-explore' },
    provenance: { source: 'composer-v2' },
  };
}

function presentation(): PresentationDocumentV1 {
  return {
    schemaVersion: PRESENTATION_DOCUMENT_V1_SCHEMA_VERSION,
    grid: { columns: 2, rows: 1, cellWidth: 320, cellHeight: 180 },
    lightingPresetId: 'neutral-studio-v1',
    artifactBinding: { kind: 'world', sha256: `sha256:${A}` },
    receiptPolicy: { requirePerCameraOutputSha256: true, requireOutputSetSha256: true },
    cameras: [
      {
        id: 'front',
        cell: { column: 0, row: 0 },
        position: [0, 4, 10],
        target: [0, 1, 0],
        up: [0, 1, 0],
        fovDeg: 50,
        aspect: 16 / 9,
        near: 0.1,
        far: 100,
      },
      {
        id: 'right',
        cell: { column: 1, row: 0 },
        position: [10, 4, 0],
        target: [0, 1, 0],
        up: [0, 1, 0],
        fovDeg: 50,
        aspect: 16 / 9,
        near: 0.1,
        far: 100,
      },
    ],
  };
}

function presentationParameters() {
  const { artifactBinding: _artifactBinding, ...parameters } = presentation();
  return parameters;
}

describe('C5.1/C5.2 strict deterministic collider artifacts', () => {
  test('freezes four policies, canonical bytes, and asset-local/world transform parity', async () => {
    for (const kind of ['none', 'bounds', 'authored-submesh', 'generated-mesh'] as const) {
      const policy =
        kind === 'authored-submesh'
          ? { kind, transformFrame: 'asset-local' as const, nodeNames: ['Collider_Main'] }
          : kind === 'generated-mesh'
            ? { kind, transformFrame: 'asset-local' as const, method: 'bounds-box' as const }
            : { kind, transformFrame: 'asset-local' as const };
      expect(parseColliderPolicyV1(policy)).toEqual(policy);
    }

    const artifact = compileColliderArtifactV1(
      { kind: 'generated-mesh', transformFrame: 'asset-local', method: 'bounds-box' },
      {
        sourceArtifactSha256: `sha256:${A}`,
        bounds: { min: [-1, 0, -2], max: [1, 3, 2] },
      },
    );
    expect(artifact.schemaVersion).toBe(COLLIDER_ARTIFACT_V1_SCHEMA_VERSION);
    expect(encodeColliderArtifactV1(artifact)).toEqual(encodeColliderArtifactV1(artifact));
    expect(decodeColliderArtifactV1(encodeColliderArtifactV1(artifact))).toEqual(artifact);
    expect(await hashColliderArtifactV1(artifact)).toMatch(/^sha256:[0-9a-f]{64}$/);
    const worldBounds = worldColliderAabbV1(artifact, {
      position: [5, 1, -3],
      rotationYDeg: 90,
      uniformScale: 2,
    });
    expect(worldBounds.min).toEqual([1, 1, -5]);
    expect(worldBounds.max[0]).toBe(9);
    expect(worldBounds.max[1]).toBe(7);
    expect(worldBounds.max[2]).toBeCloseTo(-1, 12);
  });

  test('rejects unknown keys, prototype keys, missing authored submeshes, and invalid triangles', () => {
    expect(() =>
      parseColliderPolicyV1({
        kind: 'bounds',
        transformFrame: 'asset-local',
        extra: true,
      }),
    ).toThrow();
    const forged = Object.create(null) as Record<string, unknown>;
    forged.kind = 'bounds';
    forged.transformFrame = 'asset-local';
    Object.defineProperty(forged, '__proto__', {
      value: 'forged',
      enumerable: true,
    });
    expect(() => parseColliderPolicyV1(forged)).toThrow();
    expect(() =>
      compileColliderArtifactV1(
        { kind: 'authored-submesh', transformFrame: 'asset-local', nodeNames: ['Missing'] },
        {
          sourceArtifactSha256: `sha256:${A}`,
          bounds: { min: [0, 0, 0], max: [1, 1, 1] },
          authoredSubmeshes: [],
        },
      ),
    ).toThrow('COLLIDER_AUTHORED_SUBMESH_MISSING');
    expect(() =>
      compileColliderArtifactV1(
        { kind: 'authored-submesh', transformFrame: 'asset-local', nodeNames: ['Collider_Main'] },
        {
          sourceArtifactSha256: `sha256:${A}`,
          bounds: { min: [0, 0, 0], max: [1, 1, 1] },
          authoredSubmeshes: [
            {
              nodeName: 'Collider_Main',
              positions: [0, 0, 0, 1, 0, 0],
              indices: [0, 1, 2],
            },
          ],
        },
      ),
    ).toThrow('COLLIDER_AUTHORED_SUBMESH_INVALID');
  });

  test('strictly bounds host-resolved GLB node geometry in the asset-local frame', () => {
    const resolved = parseAuthoredColliderGeometryV1({
      schemaVersion: AUTHORED_COLLIDER_GEOMETRY_V1_SCHEMA_VERSION,
      sourceArtifactSha256: `sha256:${A}`,
      transformFrame: 'asset-local',
      submeshes: [
        {
          nodeName: 'Collider_Main',
          positions: [-1, 0, -2, 1, 0, -2, 0, 3, 2],
          indices: [0, 1, 2],
        },
      ],
    });
    expect(resolved.submeshes[0]?.nodeName).toBe('Collider_Main');
    expect(AUTHORED_COLLIDER_GEOMETRY_LIMITS_V1).toEqual({
      maxNodes: 64,
      maxVertices: 65_536,
      maxTriangles: 65_536,
    });
    const secondSubmesh = {
      nodeName: 'Collider_Second',
      positions: [2, 0, 0, 3, 0, 0, 2, 1, 0],
      indices: [0, 1, 2],
    };
    const authoredPolicy = {
      kind: 'authored-submesh' as const,
      transformFrame: 'asset-local' as const,
      nodeNames: ['Collider_Second', 'Collider_Main'],
    };
    const compileResolved = (submeshes: typeof resolved.submeshes) =>
      compileColliderArtifactV1(authoredPolicy, {
        sourceArtifactSha256: resolved.sourceArtifactSha256,
        bounds: { min: [-1, 0, -2], max: [3, 3, 2] },
        authoredSubmeshes: submeshes,
      });
    const ordered = compileResolved([...resolved.submeshes, secondSubmesh]);
    const reversed = compileResolved([secondSubmesh, ...resolved.submeshes]);
    expect(ordered.primitives.map(({ nodeName }) => nodeName)).toEqual([
      'Collider_Main',
      'Collider_Second',
    ]);
    expect(encodeColliderArtifactV1(ordered)).toEqual(encodeColliderArtifactV1(reversed));
    expect(() =>
      parseAuthoredColliderGeometryV1({ ...resolved, sourceUrl: 'file:///secret/model.glb' }),
    ).toThrow();
    expect(() =>
      parseAuthoredColliderGeometryV1({ ...resolved, transformFrame: 'world' }),
    ).toThrow();
    const forged = { ...resolved } as Record<string, unknown>;
    Object.defineProperty(forged, '__proto__', {
      value: 'forged',
      enumerable: true,
    });
    expect(() => parseAuthoredColliderGeometryV1(forged)).toThrow(/forbidden/);
    expect(() =>
      parseAuthoredColliderGeometryV1({
        ...resolved,
        submeshes: [
          {
            nodeName: 'Collider_Main',
            positions: Array.from({ length: 65_537 * 3 }, () => 0),
            indices: [0, 1, 2],
          },
        ],
      }),
    ).toThrow('COLLIDER_BUDGET_EXCEEDED');
  });
});

describe('C5.3/C5.4 bounded spawn and critical-path reachability', () => {
  test('finds a deterministic route around transformed bounds and reports exact budgets', async () => {
    const report = await validateWorldReachabilityV1(world(), {
      schemaVersion: 'kiln.reachability.v1',
      grid: { origin: [0, 0], cellSize: 1, width: 11, height: 11 },
      agent: { radius: 0.4, maxStepHeight: 0.5, maxSlopeDeg: 45 },
      budget: { maxVisitedCells: 121, maxColliderTests: 1024 },
      criticalPaths: [
        {
          id: 'start-to-goal',
          from: { kind: 'spawn', id: 'start' },
          to: { kind: 'spawn', id: 'goal' },
        },
      ],
    });
    expect(report.valid).toBe(true);
    expect(report.paths).toHaveLength(1);
    expect(report.paths[0]?.status).toBe('reachable');
    expect(report.paths[0]?.cells[0]).toEqual([1, 1]);
    expect(report.paths[0]?.cells.at(-1)).toEqual([9, 9]);
    expect(report.visitedCells).toBeLessThanOrEqual(121);
  });

  test('fails closed on a blocked endpoint and on exhausted traversal budget', async () => {
    const blocked = world();
    blocked.spawns[0]!.position = [5, 0, 5];
    const request = {
      schemaVersion: 'kiln.reachability.v1' as const,
      grid: { origin: [0, 0] as [number, number], cellSize: 1, width: 11, height: 11 },
      agent: { radius: 0.4, maxStepHeight: 0.5, maxSlopeDeg: 45 },
      budget: { maxVisitedCells: 121, maxColliderTests: 1024 },
      criticalPaths: [
        {
          id: 'route',
          from: { kind: 'spawn' as const, id: 'start' },
          to: { kind: 'spawn' as const, id: 'goal' },
        },
      ],
    };
    expect((await validateWorldReachabilityV1(blocked, request)).issues[0]?.code).toBe(
      'ENDPOINT_BLOCKED',
    );
    expect(
      (
        await validateWorldReachabilityV1(world(), {
          ...request,
          budget: { ...request.budget, maxVisitedCells: 2 },
        })
      ).issues.some((issue) => issue.code === 'VISIT_BUDGET_EXCEEDED'),
    ).toBe(true);
  });

  test('hash-binds canonical collider artifacts before using them for traversal', async () => {
    const artifact = compileColliderArtifactV1(
      { kind: 'generated-mesh', transformFrame: 'asset-local', method: 'bounds-box' },
      {
        sourceArtifactSha256: `sha256:${A}`,
        bounds: { min: [-0.5, 0, -2], max: [0.5, 2, 2] },
      },
    );
    const hash = await hashColliderArtifactV1(artifact);
    const canonical = world();
    canonical.collisionArtifacts = [
      {
        refId: 'collision:wall',
        artifact: {
          uri: 'colliders/wall.collider.json',
          sha256: hash.slice('sha256:'.length),
          mediaType: 'application/vnd.kiln.collider+json',
        },
      },
    ];
    canonical.objects[0]!.collision = {
      policy: 'artifact',
      artifactRefId: 'collision:wall',
    };
    const request = {
      schemaVersion: 'kiln.reachability.v1' as const,
      grid: { origin: [0, 0] as [number, number], cellSize: 1, width: 11, height: 11 },
      agent: { radius: 0.4, maxStepHeight: 0.5, maxSlopeDeg: 45 },
      budget: { maxVisitedCells: 121, maxColliderTests: 1024 },
      criticalPaths: [
        {
          id: 'route',
          from: { kind: 'spawn' as const, id: 'start' },
          to: { kind: 'spawn' as const, id: 'goal' },
        },
      ],
    };
    expect(
      (
        await validateWorldReachabilityV1(canonical, request, {
          collidersByRefId: { 'collision:wall': artifact },
        })
      ).valid,
    ).toBe(true);
    const forged = structuredClone(artifact);
    forged.sourceArtifactSha256 = `sha256:${B}`;
    expect(
      (
        await validateWorldReachabilityV1(canonical, request, {
          collidersByRefId: { 'collision:wall': forged },
        })
      ).issues[0]?.code,
    ).toBe('COLLIDER_ARTIFACT_HASH_MISMATCH');
  });

  test('samples only the hash-bound canonical heightfield for step and slope checks', async () => {
    const heightfield = createHeightfieldArtifactV1({
      seed: 7,
      origin: [0, 0],
      cellSize: 1,
      width: 11,
      height: 11,
      baseHeight: 0,
      amplitude: 0,
      frequency: 0.25,
      stamps: [],
    });
    const terrainHash = await hashHeightfieldArtifactV1(heightfield);
    const terrainWorld = world();
    terrainWorld.terrain = {
      kind: 'heightfield',
      artifact: {
        uri: 'terrain/world.heightfield.json',
        sha256: terrainHash,
      },
    };
    const request = {
      schemaVersion: 'kiln.reachability.v1' as const,
      grid: { origin: [0, 0] as [number, number], cellSize: 1, width: 11, height: 11 },
      agent: { radius: 0.4, maxStepHeight: 0.5, maxSlopeDeg: 45 },
      budget: { maxVisitedCells: 121, maxColliderTests: 1024 },
      criticalPaths: [
        {
          id: 'route',
          from: { kind: 'spawn' as const, id: 'start' },
          to: { kind: 'spawn' as const, id: 'goal' },
        },
      ],
    };
    expect((await validateWorldReachabilityV1(terrainWorld, request, { heightfield })).valid).toBe(
      true,
    );
    const drifted = structuredClone(heightfield);
    drifted.heights[0] = 1;
    expect(
      (
        await validateWorldReachabilityV1(terrainWorld, request, {
          heightfield: drifted,
        })
      ).issues[0]?.code,
    ).toBe('TERRAIN_ARTIFACT_HASH_MISMATCH');
  });
});

describe('C5.6/C5.7 strict presentation contract and world persistence', () => {
  test('canonicalizes ordered camera cells and validates an exact receipt binding', async () => {
    const doc = parsePresentationDocumentV1(presentation());
    expect(JSON.parse(canonicalPresentationDocumentV1Json(doc))).toEqual(doc);
    expect(await hashPresentationDocumentV1(doc)).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(
      validatePresentationReceiptV1(doc, {
        worldHash: `sha256:${A}`,
        cameras: doc.cameras.map(({ id: _id, cell: _cell, ...camera }) => camera),
        width: 320,
        height: 180,
        lightingPresetId: 'neutral-studio-v1',
        backend: 'webgpu',
        rendererId: 'gpu:test',
        perCameraOutputSha256: [`sha256:${A}`, `sha256:${B}`],
        outputSetSha256: `sha256:${B}`,
        outputSha256: `sha256:${B}`,
      }),
    ).toEqual({ ok: true });
    expect(setWorldPresentationV1(world(), presentationParameters()).presentation).toEqual(
      presentationParameters(),
    );
  });

  test('rejects duplicate cells, aspect drift, unknown fields, and receipt camera drift', () => {
    const duplicate = presentation();
    duplicate.cameras[1]!.cell = { column: 0, row: 0 };
    expect(() => parsePresentationDocumentV1(duplicate)).toThrow();
    const badAspect = presentation();
    badAspect.cameras[0]!.aspect = 1;
    expect(() => parsePresentationDocumentV1(badAspect)).toThrow();
    expect(() => parsePresentationDocumentV1({ ...presentation(), shader: 'raw' })).toThrow();
    const doc = presentation();
    expect(
      validatePresentationReceiptV1(doc, {
        worldHash: `sha256:${A}`,
        cameras: doc.cameras.map(({ id: _id, cell: _cell, ...camera }) => camera).reverse(),
        width: 320,
        height: 180,
        lightingPresetId: 'neutral-studio-v1',
        backend: 'webgpu',
        rendererId: 'gpu:test',
        outputSha256: `sha256:${B}`,
      }),
    ).toEqual({ ok: false, reason: 'CAMERA_ORDER_MISMATCH' });
  });
});

describe('C5.8 WorldPackageV2 closure', () => {
  test('binds world, presentation, assets, runtime policy, and provenance deterministically', async () => {
    const packageWorld = world();
    packageWorld.collisionArtifacts = [
      {
        refId: 'collision:wall',
        artifact: { uri: 'colliders/wall.collider.json', sha256: B },
      },
    ];
    packageWorld.objects[0]!.collision = {
      policy: 'artifact',
      artifactRefId: 'collision:wall',
    };
    packageWorld.terrain = {
      kind: 'heightfield',
      artifact: { uri: 'terrain/world.heightfield.json', sha256: 'c'.repeat(64) },
    };
    const withPresentation = setWorldPresentationV1(packageWorld, presentationParameters());
    const packageA = await createWorldPackageV2({ world: withPresentation });
    const packageB = await createWorldPackageV2({ world: withPresentation });
    expect(packageA).toEqual(packageB);
    expect(packageA.schemaVersion).toBe(WORLD_PACKAGE_V2_SCHEMA_VERSION);
    expect(packageA.artifacts.map((entry) => entry.path)).toEqual([
      'models/wall.glb',
      'colliders/wall.collider.json',
      'terrain/world.heightfield.json',
    ]);
    expect(packageA.runtimePolicy).toEqual({ mode: 'static-explore' });
    expect(packageA.provenance.objectSources).toEqual([
      { objectId: 'wall-1', sourceStatementId: 'fixture:wall' },
    ]);
    expect(await hashWorldPackageV2(packageA)).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  test('rejects hash drift, missing presentation, and arbitrary package paths', async () => {
    await expect(createWorldPackageV2({ world: world() })).rejects.toThrow('presentation');
    const built = await createWorldPackageV2({
      world: setWorldPresentationV1(world(), presentationParameters()),
    });
    expect(() =>
      parseWorldPackageV2({
        ...built,
        artifacts: [{ ...built.artifacts[0], path: '../escape.glb' }],
      }),
    ).toThrow();
    await expect(validateWorldPackageV2({ ...built, worldSha256: `sha256:${B}` })).rejects.toThrow(
      'worldSha256',
    );
  });

  test('rejects package-path aliases across model, terrain, and collider namespaces', async () => {
    const collisionAlias = world();
    collisionAlias.collisionArtifacts = [
      {
        refId: 'collision:wall',
        artifact: { uri: 'models/wall.glb', sha256: B },
      },
    ];
    collisionAlias.objects[0]!.collision = {
      policy: 'artifact',
      artifactRefId: 'collision:wall',
    };
    expect(() => parseWorldDocumentV2(collisionAlias)).toThrow(/duplicate package path/i);
    await expect(
      createWorldPackageV2({
        world: { ...collisionAlias, presentation: presentationParameters() },
      }),
    ).rejects.toThrow(/duplicate package path/i);

    const terrainAlias = world();
    terrainAlias.terrain = {
      kind: 'heightfield',
      artifact: { uri: 'models/wall.glb', sha256: B },
    };
    expect(() => parseWorldDocumentV2(terrainAlias)).toThrow(/duplicate package path/i);

    const packageWorld = world();
    packageWorld.terrain = {
      kind: 'heightfield',
      artifact: { uri: 'terrain/world.heightfield.json', sha256: B },
    };
    const built = await createWorldPackageV2({
      world: setWorldPresentationV1(packageWorld, presentationParameters()),
    });
    const forged = structuredClone(built);
    forged.artifacts[1]!.path = forged.artifacts[0]!.path;
    expect(() => parseWorldPackageV2(forged)).toThrow(/duplicate package path/i);
    await expect(validateWorldPackageV2(forged)).rejects.toThrow(/duplicate package path/i);
  });

  test('verifies every exact artifact byte and refuses omissions, drift, or extras', async () => {
    const assetBytes = new TextEncoder().encode('exact wall glb fixture');
    const assetHash = createHash('sha256').update(assetBytes).digest('hex');
    const exactWorld = world();
    exactWorld.assets[0]!.artifactSha256 = assetHash;
    const built = await createWorldPackageV2({
      world: setWorldPresentationV1(exactWorld, presentationParameters()),
    });
    await expect(
      validateWorldPackageArtifactBytesV2(built, {
        'models/wall.glb': assetBytes,
      }),
    ).resolves.toBeUndefined();
    await expect(validateWorldPackageArtifactBytesV2(built, {})).rejects.toThrow('missing');
    await expect(
      validateWorldPackageArtifactBytesV2(built, {
        'models/wall.glb': new TextEncoder().encode('drift'),
      }),
    ).rejects.toThrow('hash mismatch');
    await expect(
      validateWorldPackageArtifactBytesV2(built, {
        'models/wall.glb': assetBytes,
        'extra.bin': assetBytes,
      }),
    ).rejects.toThrow('unexpected');
  });
});
