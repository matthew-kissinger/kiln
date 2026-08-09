import { createHash } from 'node:crypto';
import { describe, expect, test } from 'bun:test';
import type { SceneModelJSON } from './model';
import { PlacementModel } from './model';
import {
  WORLD_DOCUMENT_V2_SCHEMA_VERSION,
  canonicalWorldDocumentV2Json,
  hashWorldDocumentV2,
  migrateSceneModelV1ToWorldDocumentV2,
  parseWorldDocumentV2,
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
});
