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
import { PlacementModel } from './model';

export const WORLD_DOCUMENT_V2_SCHEMA_VERSION = 'kiln.world.v2' as const;

const finite = z.number().finite();
const vec2 = z.tuple([finite, finite]);
const vec3 = z.tuple([finite, finite, finite]);
const sha256 = z.string().regex(/^[0-9a-f]{64}$/, 'expected 64 lowercase SHA-256 hex characters');
const nonEmptyId = z.string().min(1).max(256);

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

const artifactSchema = z
  .object({
    uri: z.string().min(1).max(2048),
    sha256,
    mediaType: z.string().min(1).max(128).optional(),
  })
  .strict();

const assetSchema = z
  .object({
    refId: nonEmptyId,
    generationId: nonEmptyId,
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
      })
      .strict(),
  })
  .strict();

const zoneSchema = z
  .object({
    id: nonEmptyId,
    kind: z.enum(['reserved', 'portal-clearance', 'spawn-clearance']),
    shape: z.discriminatedUnion('type', [
      z.object({ type: z.literal('rect'), center: vec2, halfExtents: vec2 }).strict(),
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
    position: vec3,
    rotationYDeg: finite,
    tags: z.array(z.string().min(1).max(128)).max(64),
  })
  .strict();

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

const duplicateValues = (values: readonly string[]): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
};

/** Strict schema for the canonical world. Every referenced artifact carries a SHA-256. */
export const WorldDocumentV2Schema = z
  .object({
    schemaVersion: z.literal(WORLD_DOCUMENT_V2_SCHEMA_VERSION),
    worldId: nonEmptyId,
    name: z.string().min(1).max(256),
    seed: z.number().int().safe(),
    assets: z.array(assetSchema).max(200),
    objects: z.array(objectSchema).max(200),
    environment: z
      .object({
        presetId: groundThemeSchema.optional(),
        lightingPresetId: nonEmptyId,
        backdrop: backdropSchema.optional(),
        groundPaint: z.array(paintZoneSchema).max(512),
      })
      .strict(),
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
    for (let index = 0; index < world.objects.length; index++) {
      const object = world.objects[index]!;
      if (!assetRefs.has(object.assetRefId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['objects', index, 'assetRefId'],
          message: `unknown asset ref "${object.assetRefId}"`,
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
    }
  });

export type WorldDocumentV2 = z.infer<typeof WorldDocumentV2Schema>;
export type WorldAssetRefV2 = WorldDocumentV2['assets'][number];
export type WorldObjectV2 = WorldDocumentV2['objects'][number];

/** Parse and clone a v2 document. Unknown schema versions and unknown keys fail closed. */
export function parseWorldDocumentV2(input: unknown): WorldDocumentV2 {
  return WorldDocumentV2Schema.parse(input);
}

/** Non-throwing companion to `parseWorldDocumentV2`. */
export function safeParseWorldDocumentV2(input: unknown) {
  return WorldDocumentV2Schema.safeParse(input);
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
  modelJson: SceneModelJSON,
  options: MigrateSceneModelV1Options,
): WorldDocumentV2 {
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
