/**
 * Canonical Composer V2 world contract.
 *
 * `WorldDocumentV2.objects` is the machine source of truth. The v1
 * `SceneModelJSON` and readable composer program are projections used by the
 * current authoring loop, never embedded parallel authorities. This module is
 * pure and browser-safe: it performs no asset lookup, network access, or I/O.
 */
import { z } from 'zod';
import type {
  CatalogAssetRole,
  CatalogTier,
  Placement,
  Role,
  SceneModelJSON,
  Statement,
} from './model';
import { placementRoleForAsset, PlacementModel } from './model';
import { PresentationParametersV1Schema } from './presentation';

export const WORLD_DOCUMENT_V2_SCHEMA_VERSION = 'kiln.world.v2' as const;

const finite = z.number().finite();
const vec2 = z.tuple([finite, finite]);
const positiveVec2 = z.tuple([finite.positive(), finite.positive()]);
const vec3 = z.tuple([finite, finite, finite]);
const sha256 = z.string().regex(/^[0-9a-f]{64}$/, 'expected 64 lowercase SHA-256 hex characters');
const nonEmptyId = z.string().min(1).max(256);
const generationIdSchema = z
  .string()
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/, 'expected a portable generation id');

const boundsSchema = z
  .object({ min: vec3, max: vec3 })
  .strict()
  .superRefine((bounds, ctx) => {
    for (let axis = 0; axis < 3; axis++) {
      if (bounds.min[axis]! > bounds.max[axis]!) {
        ctx.addIssue({
          code: 'custom',
          path: ['min', axis],
          message: 'bounds min must not exceed max',
        });
      }
    }
  });

const roleSchema = z.enum(['hero', 'support', 'fill']);
const assetRoleSchema = z.enum(['ground', 'building', 'wonder', 'poi', 'prop', 'fill', 'vehicle']);
const assetTierSchema = z.enum(['A', 'B', 'C', 'D', 'F']);
const groundThemeSchema = z.enum([
  'meadow',
  'desert',
  'egypt',
  'plaza',
  'snow',
  'arctic',
  'edo',
  'night',
  'studio',
]);

const backdropSchema = z
  .object({
    kind: z.enum(['mushroom-cloud', 'sun-disc', 'aurora', 'fuji']),
    pos: vec3.optional(),
    scale: finite.positive().optional(),
  })
  .strict();

const paintShapeSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('rect'),
      x: finite,
      z: finite,
      hx: finite.positive(),
      hz: finite.positive(),
    })
    .strict(),
  z
    .object({
      type: z.literal('strip'),
      axis: z.enum(['x', 'z']),
      offset: finite,
      half: finite.positive(),
      from: finite,
      to: finite,
    })
    .strict(),
]);

const paintZoneSchema = z
  .object({
    kind: z.enum([
      'grass',
      'concrete',
      'asphalt',
      'sand',
      'flagstone',
      'snow',
      'ice',
      'gravel',
      'stone-path',
    ]),
    shape: paintShapeSchema,
    laneLine: z.boolean().optional(),
  })
  .strict();

const portableArtifactUri = z
  .string()
  .min(1)
  .max(2048)
  .refine(
    (uri) =>
      !uri.startsWith('/') &&
      !uri.includes('\\') &&
      !uri.includes('?') &&
      !uri.includes('#') &&
      !/^[a-z][a-z0-9+.-]*:/i.test(uri) &&
      uri.split('/').every((segment) => segment.length > 0 && segment !== '.' && segment !== '..'),
    'expected a portable package-relative artifact URI',
  );

const artifactSchema = z
  .object({
    uri: portableArtifactUri,
    sha256,
    mediaType: z.string().min(1).max(128).optional(),
  })
  .strict();

const assetSchema = z
  .object({
    refId: nonEmptyId,
    generationId: generationIdSchema,
    artifactSha256: sha256,
    bounds: boundsSchema,
    name: z.string().min(1).max(256).optional(),
    tags: z.array(z.string().min(1).max(128)).max(128).optional(),
    role: assetRoleSchema.optional(),
    tier: assetTierSchema.optional(),
  })
  .strict();

const objectSchema = z
  .object({
    id: nonEmptyId,
    assetRefId: nonEmptyId,
    transform: z
      .object({
        position: vec3,
        rotationYDeg: finite,
        uniformScale: finite.positive(),
      })
      .strict(),
    role: roleSchema,
    groupId: nonEmptyId.optional(),
    socketId: nonEmptyId.optional(),
    collision: z
      .discriminatedUnion('policy', [
        z.object({ policy: z.literal('none') }).strict(),
        z.object({ policy: z.literal('bounds') }).strict(),
        z.object({ policy: z.literal('artifact'), artifactRefId: nonEmptyId }).strict(),
      ])
      .optional(),
    provenance: z
      .object({
        sourceStatementId: nonEmptyId,
        sourcePrompt: z.string().min(1).max(4000).optional(),
        parentGenerationId: nonEmptyId.optional(),
        activeAsset: z
          .object({ generationId: generationIdSchema, artifactSha256: sha256 })
          .strict()
          .optional(),
        assetHistory: z
          .array(
            z
              .object({
                kind: z.literal('asset-swap'),
                fromGenerationId: generationIdSchema,
                toGenerationId: generationIdSchema,
                fromArtifactSha256: sha256,
                toArtifactSha256: sha256,
              })
              .strict(),
          )
          .max(128)
          .optional(),
      })
      .strict(),
  })
  .strict();

const zoneSchema = z
  .object({
    id: nonEmptyId,
    kind: z.enum(['reserved', 'portal-clearance', 'spawn-clearance']),
    shape: z.discriminatedUnion('type', [
      z.object({ type: z.literal('rect'), center: vec2, halfExtents: positiveVec2 }).strict(),
      z.object({ type: z.literal('circle'), center: vec2, radius: finite.positive() }).strict(),
    ]),
  })
  .strict();

const pathSchema = z
  .object({
    id: nonEmptyId,
    points: z.array(vec3).min(2).max(4096),
    halfWidth: finite.positive(),
  })
  .strict();

const socketSchema = z
  .object({
    id: nonEmptyId,
    kind: z.enum(['anchor', 'portal']),
    position: vec3,
    rotationYDeg: finite,
    compatibilityTags: z.array(z.string().min(1).max(128)).min(1).max(64),
    capacity: z.number().int().min(1).max(32),
    clearanceRadius: finite.positive().optional(),
  })
  .strict()
  .superRefine((socket, ctx) => {
    if (socket.kind === 'portal' && socket.clearanceRadius == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['clearanceRadius'],
        message: 'portal sockets require positive clearanceRadius',
      });
    }
    for (const duplicate of duplicateValues(socket.compatibilityTags)) {
      ctx.addIssue({
        code: 'custom',
        path: ['compatibilityTags'],
        message: `duplicate compatibility tag "${duplicate}"`,
      });
    }
  });

const terrainSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('flat'), height: finite }).strict(),
  z.object({ kind: z.literal('heightfield'), artifact: artifactSchema }).strict(),
]);

const collisionArtifactSchema = z
  .object({
    refId: nonEmptyId,
    artifact: artifactSchema,
  })
  .strict();

const spawnSchema = z
  .object({
    id: nonEmptyId,
    position: vec3,
    rotationYDeg: finite,
    clearanceRadius: finite.positive(),
  })
  .strict();

const worldEnvironmentSchema = z
  .object({
    presetId: groundThemeSchema.optional(),
    lightingPresetId: nonEmptyId,
    backdrop: backdropSchema.optional(),
    groundPaint: z.array(paintZoneSchema).max(512),
  })
  .strict();

const duplicateValues = (values: readonly string[]): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
};

const v1ProvenanceSchema = z
  .object({
    sourcePrompt: z.string().min(1).max(4000).optional(),
    parentGenerationId: nonEmptyId.optional(),
  })
  .strict();

const v1StatementCommon = {
  stmtId: nonEmptyId,
  alias: nonEmptyId,
  generationId: generationIdSchema,
  role: roleSchema,
  scale: finite.positive(),
  group: nonEmptyId.optional(),
  provenance: v1ProvenanceSchema.optional(),
};

const v1FacingSchema = z.union([z.enum(['center', 'out']), vec2, finite]);
const v1StatementSchema = z.discriminatedUnion('kind', [
  z
    .object({
      ...v1StatementCommon,
      kind: z.literal('place'),
      at: vec2,
      y: finite.optional(),
      face: v1FacingSchema,
      exact: z
        .object({
          pos: vec3,
          rotYDeg: finite,
        })
        .strict()
        .optional(),
    })
    .strict(),
  z
    .object({
      ...v1StatementCommon,
      kind: z.literal('cluster'),
      around: vec2,
      count: z.number().int().min(1).max(200),
      spread: finite.nonnegative(),
      face: v1FacingSchema,
    })
    .strict(),
  z
    .object({
      ...v1StatementCommon,
      kind: z.literal('ring'),
      center: vec2,
      count: z.number().int().min(1).max(200),
      radius: finite.nonnegative(),
      faceOut: z.boolean(),
    })
    .strict(),
]);

/** Strict runtime schema for the unversioned v1 PlacementModel persistence shape. */
export const SceneModelV1Schema = z
  .object({
    name: z.string().min(1).max(256),
    seed: z.number().int().safe(),
    catalog: z
      .array(
        z
          .object({
            generationId: generationIdSchema,
            bbox: boundsSchema,
            name: z.string().min(1).max(256).optional(),
            tags: z.array(z.string().min(1).max(128)).max(128).optional(),
            role: assetRoleSchema.optional(),
            tier: assetTierSchema.optional(),
          })
          .strict(),
      )
      .max(200),
    statements: z.array(v1StatementSchema).max(200),
    environment: groundThemeSchema.optional(),
    backdrop: backdropSchema.optional(),
    paint: z.array(paintZoneSchema).max(512).optional(),
  })
  .strict()
  .superRefine((model, ctx) => {
    const unique = (values: readonly string[], path: 'catalog' | 'statements'): void => {
      for (const duplicate of duplicateValues(values)) {
        ctx.addIssue({ code: 'custom', path: [path], message: `duplicate id "${duplicate}"` });
      }
    };
    unique(
      model.catalog.map((entry) => entry.generationId),
      'catalog',
    );
    unique(
      model.statements.map((statement) => statement.stmtId),
      'statements',
    );
    unique(
      model.statements.map((statement) => statement.alias),
      'statements',
    );

    const generations = new Set(model.catalog.map((entry) => entry.generationId));
    for (let index = 0; index < model.statements.length; index++) {
      const statement = model.statements[index]!;
      if (!generations.has(statement.generationId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['statements', index, 'generationId'],
          message: `unknown generation "${statement.generationId}"`,
        });
      }
    }
  });

/** Strict schema for the canonical world. Every referenced artifact carries a SHA-256. */
export const WorldDocumentV2Schema = z
  .object({
    schemaVersion: z.literal(WORLD_DOCUMENT_V2_SCHEMA_VERSION),
    worldId: nonEmptyId,
    name: z.string().min(1).max(256),
    seed: z.number().int().safe(),
    assets: z.array(assetSchema).max(200),
    objects: z.array(objectSchema).max(200),
    environment: worldEnvironmentSchema,
    terrain: terrainSchema,
    authored: z
      .object({
        zones: z.array(zoneSchema).max(512),
        paths: z.array(pathSchema).max(512),
        sockets: z.array(socketSchema).max(2048),
      })
      .strict(),
    collisionArtifacts: z.array(collisionArtifactSchema).max(512),
    spawns: z.array(spawnSchema).max(128),
    /** Additive Phase 2 presentation state. Historical v2 worlds may omit it. */
    presentation: PresentationParametersV1Schema.optional(),
    runtimePolicy: z.object({ mode: z.literal('static-explore') }).strict(),
    provenance: z
      .object({
        source: z.enum(['composer-v1', 'composer-v2', 'manual']),
        sourcePrompt: z.string().min(1).max(4000).optional(),
        parentWorldHash: z
          .string()
          .regex(/^sha256:[0-9a-f]{64}$/, 'expected sha256:<64 lowercase hex characters>')
          .optional(),
      })
      .strict(),
  })
  .strict()
  .superRefine((world, ctx) => {
    const unique = (values: readonly string[], path: string): void => {
      for (const duplicate of duplicateValues(values)) {
        ctx.addIssue({ code: 'custom', path: [path], message: `duplicate id "${duplicate}"` });
      }
    };
    unique(
      world.assets.map((asset) => asset.refId),
      'assets',
    );
    unique(
      world.assets.map((asset) => asset.generationId),
      'assets',
    );
    unique(
      world.objects.map((object) => object.id),
      'objects',
    );
    unique(
      world.authored.zones.map((zone) => zone.id),
      'authored',
    );
    unique(
      world.authored.paths.map((path) => path.id),
      'authored',
    );
    unique(
      world.authored.sockets.map((socket) => socket.id),
      'authored',
    );
    unique(
      world.collisionArtifacts.map((artifact) => artifact.refId),
      'collisionArtifacts',
    );
    unique(
      world.spawns.map((spawn) => spawn.id),
      'spawns',
    );

    const assetRefs = new Set(world.assets.map((asset) => asset.refId));
    const collisionRefs = new Set(world.collisionArtifacts.map((artifact) => artifact.refId));
    const socketRefs = new Set(world.authored.sockets.map((socket) => socket.id));
    const referencedAssets = new Set<string>();
    const referencedCollisions = new Set<string>();
    for (let index = 0; index < world.objects.length; index++) {
      const object = world.objects[index]!;
      referencedAssets.add(object.assetRefId);
      if (!assetRefs.has(object.assetRefId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['objects', index, 'assetRefId'],
          message: `unknown asset ref "${object.assetRefId}"`,
        });
      }
      if (object.socketId && !socketRefs.has(object.socketId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['objects', index, 'socketId'],
          message: `unknown socket ref "${object.socketId}"`,
        });
      }
      if (
        object.collision?.policy === 'artifact' &&
        !collisionRefs.has(object.collision.artifactRefId)
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['objects', index, 'collision', 'artifactRefId'],
          message: `unknown collision artifact ref "${object.collision.artifactRefId}"`,
        });
      }
      if (object.collision?.policy === 'artifact') {
        referencedCollisions.add(object.collision.artifactRefId);
      }
    }
    for (let index = 0; index < world.assets.length; index++) {
      const asset = world.assets[index]!;
      if (!referencedAssets.has(asset.refId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['assets', index, 'refId'],
          message: `unreferenced asset "${asset.refId}"`,
        });
      }
    }
    for (let index = 0; index < world.collisionArtifacts.length; index++) {
      const artifact = world.collisionArtifacts[index]!;
      if (!referencedCollisions.has(artifact.refId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['collisionArtifacts', index, 'refId'],
          message: `unreferenced collision artifact "${artifact.refId}"`,
        });
      }
    }

    const packagePaths = [
      ...world.assets.map((asset, index) => ({
        path: `models/${asset.generationId}.glb`,
        issuePath: ['assets', index, 'generationId'] as (string | number)[],
      })),
      ...(world.terrain.kind === 'heightfield'
        ? [
            {
              path: world.terrain.artifact.uri,
              issuePath: ['terrain', 'artifact', 'uri'] as (string | number)[],
            },
          ]
        : []),
      ...world.collisionArtifacts.map((artifact, index) => ({
        path: artifact.artifact.uri,
        issuePath: ['collisionArtifacts', index, 'artifact', 'uri'] as (string | number)[],
      })),
    ];
    const seenPackagePaths = new Set<string>();
    for (const entry of packagePaths) {
      if (seenPackagePaths.has(entry.path)) {
        ctx.addIssue({
          code: 'custom',
          path: entry.issuePath,
          message: `duplicate package path "${entry.path}"`,
        });
      }
      seenPackagePaths.add(entry.path);
    }
  });

export type WorldDocumentV2 = z.infer<typeof WorldDocumentV2Schema>;
export type WorldAssetRefV2 = WorldDocumentV2['assets'][number];
export type WorldObjectV2 = WorldDocumentV2['objects'][number];
export type WorldZoneV2 = WorldDocumentV2['authored']['zones'][number];
export type WorldPathV2 = WorldDocumentV2['authored']['paths'][number];
export type WorldSocketV2 = WorldDocumentV2['authored']['sockets'][number];
export type WorldSpawnV2 = WorldDocumentV2['spawns'][number];
export type WorldTerrainV2 = WorldDocumentV2['terrain'];

export interface WorldDocumentV2ArtifactReference {
  kind: 'asset' | 'collision' | 'heightfield';
  refId: string;
  /** Canonical package-relative URI. Asset URIs are Engine-derived. */
  uri: string;
  packagePath: string;
  /** Plain lowercase 64-hex SHA-256. */
  sha256: string;
}

/** Parse and clone current v1 persistence before it reaches PlacementModel.fromJSON. */
export function parseSceneModelV1JSON(input: unknown): SceneModelJSON {
  return SceneModelV1Schema.parse(input) as SceneModelJSON;
}

/** Parse and clone a v2 document. Unknown schema versions and unknown keys fail closed. */
export function parseWorldDocumentV2(input: unknown): WorldDocumentV2 {
  return WorldDocumentV2Schema.parse(input);
}

/** Non-throwing companion to `parseWorldDocumentV2`. */
export function safeParseWorldDocumentV2(input: unknown) {
  return WorldDocumentV2Schema.safeParse(input);
}

/**
 * Enumerate the complete portable artifact closure in deterministic order.
 * Asset GLB paths are derived from their stable ref ids; terrain/collider paths
 * are the validated package-relative URIs stored in the document.
 */
export function worldDocumentV2ArtifactReferences(
  input: unknown,
): WorldDocumentV2ArtifactReference[] {
  const world = parseWorldDocumentV2(input);
  const references: WorldDocumentV2ArtifactReference[] = world.assets.map((asset) => {
    const packagePath = `models/${asset.generationId}.glb`;
    return {
      kind: 'asset',
      refId: asset.refId,
      uri: packagePath,
      packagePath,
      sha256: asset.artifactSha256,
    };
  });
  if (world.terrain.kind === 'heightfield') {
    references.push({
      kind: 'heightfield',
      refId: 'terrain',
      uri: world.terrain.artifact.uri,
      packagePath: world.terrain.artifact.uri,
      sha256: world.terrain.artifact.sha256,
    });
  }
  for (const collision of world.collisionArtifacts) {
    references.push({
      kind: 'collision',
      refId: collision.refId,
      uri: collision.artifact.uri,
      packagePath: collision.artifact.uri,
      sha256: collision.artifact.sha256,
    });
  }
  return references.sort((a, b) =>
    a.kind === b.kind
      ? a.refId < b.refId
        ? -1
        : a.refId > b.refId
          ? 1
          : 0
      : a.kind < b.kind
        ? -1
        : 1,
  );
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(',')}}`;
  }
  throw new TypeError(`unsupported canonical JSON value: ${typeof value}`);
}

/** Validated RFC-8259 JSON with recursively sorted object keys and preserved array order. */
export function canonicalWorldDocumentV2Json(input: unknown): string {
  return canonicalJson(parseWorldDocumentV2(input));
}

/** Browser-safe SHA-256 over `canonicalWorldDocumentV2Json`. */
export async function hashWorldDocumentV2(input: unknown): Promise<`sha256:${string}`> {
  const bytes = new TextEncoder().encode(canonicalWorldDocumentV2Json(input));
  const digest = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes));
  const hex = [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `sha256:${hex}`;
}

const reconciliationSchema = z
  .object({
    objects: z
      .array(
        z
          .object({
            id: nonEmptyId,
            generationId: generationIdSchema,
            position: vec3,
            rotationYDeg: finite,
            uniformScale: finite.positive(),
          })
          .strict(),
      )
      .max(200),
    assets: z
      .array(
        z
          .object({
            generationId: generationIdSchema,
            artifactSha256: sha256,
            bounds: boundsSchema,
            name: z.string().min(1).max(256).optional(),
            tags: z.array(z.string().min(1).max(128)).max(128).optional(),
            role: assetRoleSchema.optional(),
            tier: assetTierSchema.optional(),
          })
          .strict(),
      )
      .max(200)
      .optional(),
    /** Complete replacement when manual PUT changes presentation state. */
    environment: worldEnvironmentSchema.optional(),
  })
  .strict()
  .superRefine((input, ctx) => {
    for (const duplicate of duplicateValues(input.objects.map((object) => object.id))) {
      ctx.addIssue({ code: 'custom', path: ['objects'], message: `duplicate id "${duplicate}"` });
    }
    for (const duplicate of duplicateValues(
      (input.assets ?? []).map((asset) => asset.generationId),
    )) {
      ctx.addIssue({
        code: 'custom',
        path: ['assets'],
        message: `duplicate generation "${duplicate}"`,
      });
    }
    const referencedGenerations = new Set(input.objects.map((object) => object.generationId));
    for (let index = 0; index < (input.assets ?? []).length; index++) {
      const asset = input.assets![index]!;
      if (!referencedGenerations.has(asset.generationId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['assets', index, 'generationId'],
          message: `unreferenced asset metadata "${asset.generationId}"`,
        });
      }
    }
  });

export type ReconcileWorldDocumentV2Input = z.infer<typeof reconciliationSchema>;

/**
 * Reconcile a host-authoritative complete placement set into an existing world.
 * Retained object ids preserve role/group/edit history and untouched world
 * fields. Same-asset edits preserve collision/socket bindings. An asset content
 * swap resets asset-bound collision to bounds, clears socket attachment, and
 * records the active asset transition. Removed references are pruned and output
 * arrays are sorted so caller ordering cannot change the document hash.
 */
export function reconcileWorldDocumentV2Objects(
  current: unknown,
  replacement: unknown,
): WorldDocumentV2 {
  const world = parseWorldDocumentV2(current);
  const input = reconciliationSchema.parse(replacement);
  const existingObjects = new Map(world.objects.map((object) => [object.id, object]));
  const existingAssets = new Map(world.assets.map((asset) => [asset.generationId, asset]));
  const existingAssetsByRef = new Map(world.assets.map((asset) => [asset.refId, asset]));
  const suppliedAssets = new Map((input.assets ?? []).map((asset) => [asset.generationId, asset]));
  const compareId = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

  const resolvedAssets = new Map<string, WorldAssetRefV2>();
  const objects = [...input.objects]
    .sort((a, b) => compareId(a.id, b.id))
    .map((object) => {
      const previous = existingObjects.get(object.id);
      const existingAsset = existingAssets.get(object.generationId);
      const suppliedAsset = suppliedAssets.get(object.generationId);
      if (!existingAsset && !suppliedAsset) {
        throw new Error(`missing asset metadata for generation "${object.generationId}"`);
      }
      const refId = existingAsset?.refId ?? assetRefId(object.generationId);
      const asset = assetSchema.parse({
        refId,
        ...(suppliedAsset ?? existingAsset!),
      });
      resolvedAssets.set(asset.refId, asset);
      const previousAsset = previous ? existingAssetsByRef.get(previous.assetRefId) : undefined;
      const previousActive =
        previous?.provenance.activeAsset ??
        (previousAsset
          ? {
              generationId: previousAsset.generationId,
              artifactSha256: previousAsset.artifactSha256,
            }
          : undefined);
      const assetChanged =
        previousActive != null &&
        (previousActive.generationId !== asset.generationId ||
          previousActive.artifactSha256 !== asset.artifactSha256);
      const assetHistory = [
        ...(previous?.provenance.assetHistory ?? []),
        ...(assetChanged
          ? [
              {
                kind: 'asset-swap' as const,
                fromGenerationId: previousActive.generationId,
                toGenerationId: asset.generationId,
                fromArtifactSha256: previousActive.artifactSha256,
                toArtifactSha256: asset.artifactSha256,
              },
            ]
          : []),
      ];
      const provenance = {
        ...(previous?.provenance ?? {
          sourceStatementId: `manual:${object.id}`.slice(0, 256),
        }),
        activeAsset: {
          generationId: asset.generationId,
          artifactSha256: asset.artifactSha256,
        },
        ...(assetHistory.length ? { assetHistory } : {}),
      };
      const reconciled: WorldObjectV2 = {
        id: object.id,
        assetRefId: asset.refId,
        transform: {
          position: object.position,
          rotationYDeg: object.rotationYDeg,
          uniformScale: object.uniformScale,
        },
        role: previous?.role ?? placementRoleForAsset(asset.role) ?? 'support',
        provenance,
        ...(previous?.groupId ? { groupId: previous.groupId } : {}),
        ...(!assetChanged && previous?.socketId ? { socketId: previous.socketId } : {}),
        ...(assetChanged
          ? { collision: { policy: 'bounds' as const } }
          : previous?.collision
            ? { collision: previous.collision }
            : {}),
      };
      return reconciled;
    });

  const referencedCollisions = new Set(
    objects.flatMap((object) =>
      object.collision?.policy === 'artifact' ? [object.collision.artifactRefId] : [],
    ),
  );
  return parseWorldDocumentV2({
    ...world,
    assets: [...resolvedAssets.values()].sort((a, b) => compareId(a.refId, b.refId)),
    objects,
    collisionArtifacts: world.collisionArtifacts.filter((artifact) =>
      referencedCollisions.has(artifact.refId),
    ),
    ...(input.environment ? { environment: input.environment } : {}),
  });
}

export interface MigrateSceneModelV1Options {
  /** Stable product-owned scene/world id. No random id is invented in the pure engine. */
  worldId: string;
  /** Existing GLB content hashes, resolved by the host before migration. */
  artifactSha256ByGenerationId: Readonly<Record<string, string>>;
  /** Host-authoritative evaluated transforms. Defaults to flat-ground v1 evaluation. */
  placements?: readonly Placement[];
  /** Presentation preset identity; does not change transforms. */
  lightingPresetId?: string;
  sourcePrompt?: string;
  parentWorldHash?: `sha256:${string}`;
}

const assetRefId = (generationId: string): string => `asset:${generationId}`;

/**
 * Deterministically migrate the current PlacementModel JSON to canonical exact
 * objects. Cluster/ring sugar is intentionally flattened: the evaluated
 * instance transforms are the visual truth and survive reload bit-for-bit.
 */
export function migrateSceneModelV1ToWorldDocumentV2(
  input: unknown,
  options: MigrateSceneModelV1Options,
): WorldDocumentV2 {
  const modelJson = parseSceneModelV1JSON(input);
  const evaluated = PlacementModel.fromJSON(modelJson).placements();
  const placements = options.placements ?? evaluated.placements;
  const statements = new Map(
    modelJson.statements.map((statement) => [statement.stmtId, statement]),
  );
  const catalog = new Map(modelJson.catalog.map((entry) => [entry.generationId, entry]));
  const referencedGenerations = new Set(placements.map((placement) => placement.generationId));

  const assets = modelJson.catalog
    .filter((entry) => referencedGenerations.has(entry.generationId))
    .map((entry) => {
      const artifactSha256 = options.artifactSha256ByGenerationId[entry.generationId];
      if (!artifactSha256) {
        throw new Error(`missing artifact SHA-256 for generation "${entry.generationId}"`);
      }
      return {
        refId: assetRefId(entry.generationId),
        generationId: entry.generationId,
        artifactSha256,
        bounds: entry.bbox,
        ...(entry.name ? { name: entry.name } : {}),
        ...(entry.tags ? { tags: entry.tags } : {}),
        ...(entry.role ? { role: entry.role } : {}),
        ...(entry.tier ? { tier: entry.tier } : {}),
      };
    });

  const objects = placements.map((placement) => {
    if (!catalog.has(placement.generationId)) {
      throw new Error(
        `placement "${placement.instanceId}" references unknown generation "${placement.generationId}"`,
      );
    }
    const statement = statements.get(placement.stmtId);
    if (!statement) {
      throw new Error(
        `placement "${placement.instanceId}" references unknown statement "${placement.stmtId}"`,
      );
    }
    const evaluatedProvenance = evaluated.provenance[placement.instanceId];
    const sourcePrompt = evaluatedProvenance?.sourcePrompt ?? statement.provenance?.sourcePrompt;
    const parentGenerationId =
      evaluatedProvenance?.parentGenerationId ?? statement.provenance?.parentGenerationId;
    return {
      id: placement.instanceId,
      assetRefId: assetRefId(placement.generationId),
      transform: {
        position: [placement.pos[0], placement.pos[1], placement.pos[2]] as [
          number,
          number,
          number,
        ],
        rotationYDeg: placement.rotYDeg,
        uniformScale: placement.scale,
      },
      role: statement.role,
      ...(statement.group ? { groupId: statement.group } : {}),
      provenance: {
        sourceStatementId: placement.stmtId,
        ...(sourcePrompt ? { sourcePrompt } : {}),
        ...(parentGenerationId ? { parentGenerationId } : {}),
        activeAsset: {
          generationId: placement.generationId,
          artifactSha256: options.artifactSha256ByGenerationId[placement.generationId]!,
        },
      },
    };
  });

  return parseWorldDocumentV2({
    schemaVersion: WORLD_DOCUMENT_V2_SCHEMA_VERSION,
    worldId: options.worldId,
    name: modelJson.name,
    seed: modelJson.seed,
    assets,
    objects,
    environment: {
      ...(modelJson.environment ? { presetId: modelJson.environment } : {}),
      lightingPresetId: options.lightingPresetId ?? 'legacy-scene-v1',
      ...(modelJson.backdrop ? { backdrop: modelJson.backdrop } : {}),
      groundPaint: modelJson.paint ?? [],
    },
    terrain: { kind: 'flat', height: 0 },
    authored: { zones: [], paths: [], sockets: [] },
    collisionArtifacts: [],
    spawns: [],
    runtimePolicy: { mode: 'static-explore' },
    provenance: {
      source: 'composer-v1',
      ...(options.sourcePrompt ? { sourcePrompt: options.sourcePrompt } : {}),
      ...(options.parentWorldHash ? { parentWorldHash: options.parentWorldHash } : {}),
    },
  });
}

/**
 * Derive the current authoring model from canonical v2 exact objects. The
 * projection deliberately uses one exact `place` statement per object so
 * evaluation cannot recenter, reground, or reinterpret facing.
 */
export function worldDocumentV2ToSceneModelJSON(input: unknown): SceneModelJSON {
  const world = parseWorldDocumentV2(input);
  const assets = new Map(world.assets.map((asset) => [asset.refId, asset]));
  const statements: Statement[] = world.objects.map((object, index) => {
    const asset = assets.get(object.assetRefId)!;
    const provenance = {
      ...(object.provenance.sourcePrompt ? { sourcePrompt: object.provenance.sourcePrompt } : {}),
      ...(object.provenance.parentGenerationId
        ? { parentGenerationId: object.provenance.parentGenerationId }
        : {}),
    };
    return {
      kind: 'place',
      stmtId: `s${index + 1}`,
      alias: object.id,
      generationId: asset.generationId,
      role: object.role as Role,
      scale: object.transform.uniformScale,
      at: [object.transform.position[0], object.transform.position[2]],
      face: object.transform.rotationYDeg,
      exact: {
        pos: [
          object.transform.position[0],
          object.transform.position[1],
          object.transform.position[2],
        ],
        rotYDeg: object.transform.rotationYDeg,
      },
      ...(object.groupId ? { group: object.groupId } : {}),
      ...(Object.keys(provenance).length ? { provenance } : {}),
    };
  });

  return {
    name: world.name,
    seed: world.seed,
    catalog: world.assets.map((asset) => ({
      generationId: asset.generationId,
      bbox: asset.bounds,
      ...(asset.name ? { name: asset.name } : {}),
      ...(asset.tags ? { tags: asset.tags } : {}),
      ...(asset.role ? { role: asset.role as CatalogAssetRole } : {}),
      ...(asset.tier ? { tier: asset.tier as CatalogTier } : {}),
    })),
    statements,
    ...(world.environment.presetId ? { environment: world.environment.presetId } : {}),
    ...(world.environment.backdrop ? { backdrop: world.environment.backdrop } : {}),
    ...(world.environment.groundPaint.length ? { paint: world.environment.groundPaint } : {}),
  };
}
