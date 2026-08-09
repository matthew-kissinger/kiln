import { createHash } from 'node:crypto';
import { describe, expect, test } from 'bun:test';
import { facingToRotY } from './layout';
import type { SceneModelJSON } from './model';
import { PlacementModel } from './model';
import {
  WORLD_DOCUMENT_V2_SCHEMA_VERSION,
  canonicalWorldDocumentV2Json,
  hashWorldDocumentV2,
  migrateSceneModelV1ToWorldDocumentV2,
  parseWorldDocumentV2,
  reconcileWorldDocumentV2Objects,
  safeParseWorldDocumentV2,
  worldDocumentV2ToSceneModelJSON,
} from './world-document';

const HOUSE_SHA = '1'.repeat(64);
const TREE_SHA = '2'.repeat(64);

function v1Model(): SceneModelJSON {
  return {
    name: 'Exact legacy scene',
    seed: 17,
    catalog: [
      {
        generationId: 'house',
        name: 'House',
        bbox: { min: [-2, -0.25, -3], max: [4, 6, 3] },
        role: 'building',
        tier: 'B',
      },
      {
        generationId: 'tree',
        name: 'Tree',
        bbox: { min: [-1, 0, -1], max: [1, 8, 1] },
        tags: ['vegetation'],
        role: 'fill',
      },
    ],
    statements: [
      {
        kind: 'place',
        stmtId: 's4',
        alias: 'house_exact',
        generationId: 'house',
        role: 'hero',
        scale: 1.125,
        at: [12.3456789, -9.25],
        face: -37.75,
        exact: { pos: [12.3456789, 0.03125, -9.25], rotYDeg: -37.75 },
        provenance: { sourcePrompt: 'Put the house on the ridge.' },
      },
      {
        kind: 'ring',
        stmtId: 's9',
        alias: 'trees',
        generationId: 'tree',
        role: 'fill',
        scale: 0.85,
        center: [0, 0],
        count: 3,
        radius: 20,
        faceOut: true,
        group: 'grove',
      },
    ],
    environment: 'edo',
    backdrop: { kind: 'fuji', pos: [0, 0, -80], scale: 1.5 },
    paint: [
      {
        kind: 'stone-path',
        shape: { type: 'strip', axis: 'z', offset: 2, half: 1.5, from: -20, to: 20 },
      },
    ],
  };
}

const migrationOptions = {
  worldId: 'scene-123',
  artifactSha256ByGenerationId: { house: HOUSE_SHA, tree: TREE_SHA },
  lightingPresetId: 'legacy-scene-v1',
} as const;

describe('WorldDocumentV2 contract', () => {
  test('migrates v1 deterministically and preserves every evaluated transform exactly', () => {
    const source = v1Model();
    const expected = PlacementModel.fromJSON(source).placements().placements;
    const a = migrateSceneModelV1ToWorldDocumentV2(source, migrationOptions);
    const b = migrateSceneModelV1ToWorldDocumentV2(source, migrationOptions);

    expect(a).toEqual(b);
    expect(a.schemaVersion).toBe(WORLD_DOCUMENT_V2_SCHEMA_VERSION);
    expect(a.assets.map((asset) => [asset.generationId, asset.artifactSha256])).toEqual([
      ['house', HOUSE_SHA],
      ['tree', TREE_SHA],
    ]);
    expect(
      a.objects.map((object) => ({
        instanceId: object.id,
        generationId: a.assets.find((asset) => asset.refId === object.assetRefId)!.generationId,
        pos: object.transform.position,
        rotYDeg: object.transform.rotationYDeg,
        scale: object.transform.uniformScale,
        stmtId: object.provenance.sourceStatementId,
      })),
    ).toEqual(expected);
    expect(a.environment).toEqual({
      presetId: 'edo',
      lightingPresetId: 'legacy-scene-v1',
      backdrop: source.backdrop,
      groundPaint: source.paint!,
    });
    expect(a.terrain).toEqual({ kind: 'flat', height: 0 });
    expect(a.authored).toEqual({ zones: [], paths: [], sockets: [] });
    expect(a.collisionArtifacts).toEqual([]);
    expect(a.spawns).toEqual([]);
  });

  test('projects canonical objects to exact v1 places for drift-free refine', () => {
    const world = migrateSceneModelV1ToWorldDocumentV2(v1Model(), migrationOptions);
    const projected = worldDocumentV2ToSceneModelJSON(world);
    const placements = PlacementModel.fromJSON(projected).placements().placements;

    expect(
      placements.map(({ instanceId, generationId, pos, rotYDeg, scale }) => ({
        instanceId,
        generationId,
        pos,
        rotYDeg,
        scale,
      })),
    ).toEqual(
      world.objects.map((object) => ({
        instanceId: object.id,
        generationId: world.assets.find((asset) => asset.refId === object.assetRefId)!.generationId,
        pos: object.transform.position,
        rotYDeg: object.transform.rotationYDeg,
        scale: object.transform.uniformScale,
      })),
    );
    expect(
      projected.statements.every((statement) => statement.kind === 'place' && statement.exact),
    ).toBe(true);
    expect(projected.environment).toBe('edo');
    expect(projected.backdrop).toEqual(v1Model().backdrop);
    expect(projected.paint).toEqual(v1Model().paint);
  });

  test('projected exact places remain editable through move, face, and group operations', () => {
    const world = migrateSceneModelV1ToWorldDocumentV2(v1Model(), migrationOptions);
    const model = PlacementModel.fromJSON(worldDocumentV2ToSceneModelJSON(world));
    const before = new Map(
      model.placements().placements.map((placement) => [placement.instanceId, placement]),
    );

    expect(model.move('house_exact', { delta: [7.25, -3.5], scale: 1.75 }).ok).toBe(true);
    expect(model.face('house_exact', 42.125).ok).toBe(true);
    const group = model.group(['trees#0', 'trees#1'], { name: 'moved-grove', delta: [4, -2] });
    expect(group.ok).toBe(true);
    expect(model.face('trees#0', 'center').ok).toBe(true);
    expect(model.face('trees#1', [40, -10]).ok).toBe(true);

    const after = new Map(
      model.placements().placements.map((placement) => [placement.instanceId, placement]),
    );
    expect(after.get('house_exact')!.pos).toEqual([
      before.get('house_exact')!.pos[0] + 7.25,
      before.get('house_exact')!.pos[1],
      before.get('house_exact')!.pos[2] - 3.5,
    ]);
    expect(after.get('house_exact')!.rotYDeg).toBe(42.125);
    expect(after.get('house_exact')!.scale).toBe(1.75);

    for (const id of ['trees#0', 'trees#1']) {
      expect(after.get(id)!.pos).toEqual([
        before.get(id)!.pos[0] + 4,
        before.get(id)!.pos[1],
        before.get(id)!.pos[2] - 2,
      ]);
    }
    expect(after.get('trees#0')!.rotYDeg).toBe(
      facingToRotY('center', [after.get('trees#0')!.pos[0], after.get('trees#0')!.pos[2]], [0, 0]),
    );
    expect(after.get('trees#1')!.rotYDeg).toBe(
      facingToRotY([40, -10], [after.get('trees#1')!.pos[0], after.get('trees#1')!.pos[2]], [0, 0]),
    );

    const persisted = model.toJSON();
    const house = persisted.statements.find((statement) => statement.alias === 'house_exact');
    expect(house?.kind === 'place' && house.exact).toEqual({
      pos: after.get('house_exact')!.pos,
      rotYDeg: 42.125,
    });
    expect(
      persisted.statements
        .filter((statement) => statement.alias === 'trees#0' || statement.alias === 'trees#1')
        .every((statement) => statement.group === 'moved-grove'),
    ).toBe(true);
  });

  test('uses caller-supplied evaluated placements as the exact migration seam', () => {
    const source = v1Model();
    const placements = PlacementModel.fromJSON(source).placements().placements;
    placements[0] = {
      ...placements[0]!,
      instanceId: 'host-authoritative-id',
      pos: [1.234567890123, -2.5, 9.876543210987],
      rotYDeg: 123.456789,
    };
    const world = migrateSceneModelV1ToWorldDocumentV2(source, {
      ...migrationOptions,
      placements,
    });

    expect(world.objects[0]).toMatchObject({
      id: 'host-authoritative-id',
      transform: {
        position: [1.234567890123, -2.5, 9.876543210987],
        rotationYDeg: 123.456789,
        uniformScale: 1.125,
      },
    });
  });

  test('canonical JSON and SHA-256 are byte-stable and key-order independent', async () => {
    const world = migrateSceneModelV1ToWorldDocumentV2(v1Model(), migrationOptions);
    const reordered = JSON.parse(JSON.stringify(world)) as Record<string, unknown>;
    const reversedTopLevel = Object.fromEntries(Object.entries(reordered).reverse());
    const json = canonicalWorldDocumentV2Json(world);

    expect(canonicalWorldDocumentV2Json(reversedTopLevel)).toBe(json);
    expect(json.endsWith('\n')).toBe(false);
    const expected = createHash('sha256').update(json).digest('hex');
    expect(await hashWorldDocumentV2(world)).toBe(`sha256:${expected}`);
    expect(await hashWorldDocumentV2(world)).toBe(await hashWorldDocumentV2(reversedTopLevel));

    const changed = structuredClone(world);
    changed.assets[0]!.artifactSha256 = 'a'.repeat(64);
    expect(await hashWorldDocumentV2(changed)).not.toBe(await hashWorldDocumentV2(world));
  });

  test('fails closed on unknown versions, unknown keys, bad refs, duplicate ids, and non-finite numbers', () => {
    const world = migrateSceneModelV1ToWorldDocumentV2(v1Model(), migrationOptions);
    expect(() => parseWorldDocumentV2({ ...world, schemaVersion: 'kiln.world.v3' })).toThrow();
    expect(() => parseWorldDocumentV2({ ...world, unexpected: true })).toThrow();

    const badRef = structuredClone(world);
    badRef.objects[0]!.assetRefId = 'missing';
    expect(safeParseWorldDocumentV2(badRef).success).toBe(false);

    const duplicate = structuredClone(world);
    duplicate.objects[1]!.id = duplicate.objects[0]!.id;
    expect(safeParseWorldDocumentV2(duplicate).success).toBe(false);

    const infinite = structuredClone(world);
    infinite.objects[0]!.transform.position[0] = Number.POSITIVE_INFINITY;
    expect(safeParseWorldDocumentV2(infinite).success).toBe(false);
  });

  test('rejects unreferenced asset and collision artifacts', () => {
    const world = migrateSceneModelV1ToWorldDocumentV2(v1Model(), migrationOptions);
    const unusedAsset = structuredClone(world);
    unusedAsset.assets.push({
      ...structuredClone(unusedAsset.assets[0]!),
      refId: 'asset:unused',
      generationId: 'unused',
    });
    expect(safeParseWorldDocumentV2(unusedAsset).success).toBe(false);

    const unusedCollision = structuredClone(world);
    unusedCollision.collisionArtifacts.push({
      refId: 'collision:unused',
      artifact: {
        uri: 'colliders/unused.glb',
        sha256: 'b'.repeat(64),
        mediaType: 'model/gltf-binary',
      },
    });
    expect(safeParseWorldDocumentV2(unusedCollision).success).toBe(false);

    const referencedCollision = structuredClone(unusedCollision);
    referencedCollision.objects[0]!.collision = {
      policy: 'artifact',
      artifactRefId: 'collision:unused',
    };
    expect(safeParseWorldDocumentV2(referencedCollision).success).toBe(true);
  });

  test('accepts an empty world and exactly 200 objects, but rejects 201', () => {
    const empty = migrateSceneModelV1ToWorldDocumentV2(
      { name: 'Empty', seed: 1, catalog: [], statements: [] },
      { worldId: 'empty', artifactSha256ByGenerationId: {} },
    );
    expect(empty.assets).toEqual([]);
    expect(empty.objects).toEqual([]);

    const base = migrateSceneModelV1ToWorldDocumentV2(v1Model(), migrationOptions);
    const boundary = structuredClone(base);
    boundary.objects = Array.from({ length: 200 }, (_, index) => ({
      ...structuredClone(base.objects[0]!),
      id: `object-${index}`,
    }));
    boundary.assets = [structuredClone(base.assets[0]!)];
    expect(safeParseWorldDocumentV2(boundary).success).toBe(true);

    boundary.objects.push({ ...structuredClone(base.objects[0]!), id: 'object-200' });
    expect(safeParseWorldDocumentV2(boundary).success).toBe(false);
  });

  test('reconciles moved objects while preserving retained world-only fields', async () => {
    const world = migrateSceneModelV1ToWorldDocumentV2(v1Model(), migrationOptions);
    world.objects[0]!.collision = { policy: 'bounds' };
    const beforeHash = await hashWorldDocumentV2(world);
    const replacements = world.objects.map((object) => {
      const asset = world.assets.find((candidate) => candidate.refId === object.assetRefId)!;
      return {
        id: object.id,
        generationId: asset.generationId,
        position: object.transform.position,
        rotationYDeg: object.transform.rotationYDeg,
        uniformScale: object.transform.uniformScale,
      };
    });
    replacements[0] = {
      ...replacements[0]!,
      position: [99, 4, -33],
      rotationYDeg: 77.5,
      uniformScale: 2,
    };
    const reconciled = reconcileWorldDocumentV2Objects(world, { objects: replacements });

    expect(reconciled.objects.find((object) => object.id === 'house_exact')).toEqual({
      ...world.objects[0]!,
      transform: { position: [99, 4, -33], rotationYDeg: 77.5, uniformScale: 2 },
    });
    expect(reconciled.environment).toEqual(world.environment);
    expect(reconciled.terrain).toEqual(world.terrain);
    expect(reconciled.authored).toEqual(world.authored);
    expect(reconciled.provenance).toEqual(world.provenance);
    expect(await hashWorldDocumentV2(reconciled)).not.toBe(beforeHash);
  });

  test('reconciles additions and removals with closed asset and collision references', () => {
    const world = migrateSceneModelV1ToWorldDocumentV2(v1Model(), migrationOptions);
    world.collisionArtifacts.push({
      refId: 'collision:house',
      artifact: { uri: 'collision/house.glb', sha256: 'c'.repeat(64) },
    });
    world.objects[0]!.collision = { policy: 'artifact', artifactRefId: 'collision:house' };

    const reconciled = reconcileWorldDocumentV2Objects(world, {
      objects: [
        {
          id: 'trees#0',
          generationId: 'tree',
          position: [20, 0, 0],
          rotationYDeg: 0,
          uniformScale: 0.85,
        },
        {
          id: 'new-lantern',
          generationId: 'lantern',
          position: [3, 0, 4],
          rotationYDeg: 15,
          uniformScale: 1,
        },
      ],
      assets: [
        {
          generationId: 'lantern',
          artifactSha256: 'd'.repeat(64),
          bounds: { min: [-0.5, 0, -0.5], max: [0.5, 2, 0.5] },
          name: 'Lantern',
          role: 'prop',
        },
      ],
      environment: {
        presetId: 'night',
        lightingPresetId: 'night-v2',
        groundPaint: [],
      },
    });

    expect(reconciled.objects.map((object) => object.id)).toEqual(['new-lantern', 'trees#0']);
    expect(reconciled.assets.map((asset) => asset.generationId)).toEqual(['lantern', 'tree']);
    expect(reconciled.collisionArtifacts).toEqual([]);
    expect(reconciled.environment).toEqual({
      presetId: 'night',
      lightingPresetId: 'night-v2',
      groundPaint: [],
    });
    expect(reconciled.objects[0]).toMatchObject({
      id: 'new-lantern',
      role: 'support',
      provenance: { sourceStatementId: 'manual:new-lantern' },
    });
  });

  test('reconciliation is input-order independent and artifact-hash sensitive', async () => {
    const world = migrateSceneModelV1ToWorldDocumentV2(v1Model(), migrationOptions);
    const objects = world.objects.map((object) => ({
      id: object.id,
      generationId: world.assets.find((asset) => asset.refId === object.assetRefId)!.generationId,
      position: object.transform.position,
      rotationYDeg: object.transform.rotationYDeg,
      uniformScale: object.transform.uniformScale,
    }));
    const ordered = reconcileWorldDocumentV2Objects(world, { objects });
    const reversed = reconcileWorldDocumentV2Objects(world, { objects: [...objects].reverse() });
    expect(reversed).toEqual(ordered);
    expect(await hashWorldDocumentV2(reversed)).toBe(await hashWorldDocumentV2(ordered));

    const house = world.assets.find((asset) => asset.generationId === 'house')!;
    const changedHash = reconcileWorldDocumentV2Objects(world, {
      objects,
      assets: [
        {
          generationId: house.generationId,
          artifactSha256: 'e'.repeat(64),
          bounds: house.bounds,
          ...(house.name ? { name: house.name } : {}),
          ...(house.tags ? { tags: house.tags } : {}),
          ...(house.role ? { role: house.role } : {}),
          ...(house.tier ? { tier: house.tier } : {}),
        },
      ],
    });
    expect(await hashWorldDocumentV2(changedHash)).not.toBe(await hashWorldDocumentV2(ordered));
  });

  test('keeps only referenced assets and requires a real hash for each one', () => {
    const withUnusedCatalogAsset = v1Model();
    withUnusedCatalogAsset.catalog.push({
      generationId: 'unused-prop',
      bbox: { min: [-1, 0, -1], max: [1, 2, 1] },
      role: 'prop',
    });
    const migrated = migrateSceneModelV1ToWorldDocumentV2(withUnusedCatalogAsset, migrationOptions);
    expect(migrated.assets.map((asset) => asset.generationId)).toEqual(['house', 'tree']);

    expect(() =>
      migrateSceneModelV1ToWorldDocumentV2(v1Model(), {
        worldId: 'scene-123',
        artifactSha256ByGenerationId: { house: HOUSE_SHA },
      }),
    ).toThrow('missing artifact SHA-256 for generation "tree"');

    expect(() =>
      migrateSceneModelV1ToWorldDocumentV2(v1Model(), {
        worldId: 'scene-123',
        artifactSha256ByGenerationId: { house: 'not-a-hash', tree: TREE_SHA },
      }),
    ).toThrow();
  });

  test('rejects unknown and malformed persisted v1 model shapes before evaluation', () => {
    expect(() =>
      migrateSceneModelV1ToWorldDocumentV2(
        { ...v1Model(), unknownRoot: true } as unknown as SceneModelJSON,
        migrationOptions,
      ),
    ).toThrow();

    const malformed = v1Model() as unknown as { statements: Array<Record<string, unknown>> };
    malformed.statements[0]!.kind = 'unsupported';
    expect(() =>
      migrateSceneModelV1ToWorldDocumentV2(
        malformed as unknown as SceneModelJSON,
        migrationOptions,
      ),
    ).toThrow();

    const nonFinite = v1Model();
    nonFinite.statements[0]!.scale = Number.POSITIVE_INFINITY;
    expect(() => migrateSceneModelV1ToWorldDocumentV2(nonFinite, migrationOptions)).toThrow();
  });

  test('rejects duplicate v1 ids and aliases plus dangling asset references', () => {
    const duplicateGeneration = v1Model();
    duplicateGeneration.catalog.push(structuredClone(duplicateGeneration.catalog[0]!));
    expect(() =>
      migrateSceneModelV1ToWorldDocumentV2(duplicateGeneration, migrationOptions),
    ).toThrow();

    const duplicateStatement = v1Model();
    duplicateStatement.statements[1]!.stmtId = duplicateStatement.statements[0]!.stmtId;
    expect(() =>
      migrateSceneModelV1ToWorldDocumentV2(duplicateStatement, migrationOptions),
    ).toThrow();

    const duplicateAlias = v1Model();
    duplicateAlias.statements[1]!.alias = duplicateAlias.statements[0]!.alias;
    expect(() => migrateSceneModelV1ToWorldDocumentV2(duplicateAlias, migrationOptions)).toThrow();

    const dangling = v1Model();
    dangling.statements[0]!.generationId = 'missing-generation';
    expect(() => migrateSceneModelV1ToWorldDocumentV2(dangling, migrationOptions)).toThrow();
  });
});
