/** Bounded Strands tool surface for canonical Composer V2 integration primitives. */
import { type JSONValue, type Tool, tool } from '@strands-agents/sdk';
import { z } from 'zod';
import {
  createHeightfieldArtifactV1,
  encodeHeightfieldArtifactV1,
  hashHeightfieldArtifactV1,
  type HeightfieldArtifactV1,
  fillWorldPathV2,
  setWorldPathsV2,
  setWorldSocketsV2,
  setWorldSpawnsV2,
  setWorldTerrainV2,
  setWorldZonesV2,
  snapWorldObjectToSocketV2,
  type WorldDocumentV2,
} from '..';

export interface WorldIntegrationToolState {
  world: WorldDocumentV2;
}
export interface MakeWorldIntegrationToolsV2Options {
  state: WorldIntegrationToolState;
  publishHeightfieldArtifact?: (
    artifact: HeightfieldArtifactV1,
    bytes: Uint8Array,
    sha256: string,
  ) => Promise<{ uri: string; mediaType?: string }>;
  onWorldChanged?: (world: WorldDocumentV2) => void;
}

const finite = z.number().finite();
const vec2 = z.tuple([finite, finite]);
const vec3 = z.tuple([finite, finite, finite]);
const id = z.string().min(1).max(256);
const positiveVec2 = z.tuple([finite.positive(), finite.positive()]);

export function makeWorldIntegrationToolsV2(options: MakeWorldIntegrationToolsV2Options): Tool[] {
  const commit = (world: WorldDocumentV2): JSONValue => {
    options.state.world = world;
    options.onWorldChanged?.(world);
    return { ok: true, worldId: world.worldId };
  };
  const guarded = (operation: () => WorldDocumentV2): JSONValue => {
    try {
      return commit(operation());
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  };

  const setZones: Tool = tool({
    name: 'scene_world_set_zones',
    description:
      'Replace bounded reserved/portal/spawn-clearance zones. Rect halfExtents must be positive.',
    inputSchema: z
      .object({
        zones: z
          .array(
            z
              .object({
                id,
                kind: z.enum(['reserved', 'portal-clearance', 'spawn-clearance']),
                shape: z.discriminatedUnion('type', [
                  z
                    .object({ type: z.literal('rect'), center: vec2, halfExtents: positiveVec2 })
                    .strict(),
                  z
                    .object({ type: z.literal('circle'), center: vec2, radius: finite.positive() })
                    .strict(),
                ]),
              })
              .strict(),
          )
          .max(32),
      })
      .strict(),
    callback: (input) => guarded(() => setWorldZonesV2(options.state.world, input.zones)),
  });
  const setPaths: Tool = tool({
    name: 'scene_world_set_paths',
    description: 'Replace authored navigational paths using world-space X/Y/Z points.',
    inputSchema: z
      .object({
        paths: z
          .array(
            z
              .object({
                id,
                points: z.array(vec3).min(2).max(64),
                halfWidth: finite.positive(),
              })
              .strict(),
          )
          .max(16),
      })
      .strict(),
    callback: (input) => guarded(() => setWorldPathsV2(options.state.world, input.paths)),
  });
  const setSockets: Tool = tool({
    name: 'scene_world_set_sockets',
    description:
      'Replace named anchors/portals with compatibility, capacity, and portal clearance.',
    inputSchema: z
      .object({
        sockets: z
          .array(
            z
              .object({
                id,
                kind: z.enum(['anchor', 'portal']),
                position: vec3,
                rotationYDeg: finite,
                compatibilityTags: z.array(z.string().min(1).max(128)).min(1).max(16),
                capacity: z.number().int().min(1).max(8),
                clearanceRadius: finite.positive().optional(),
              })
              .strict(),
          )
          .max(32),
      })
      .strict(),
    callback: (input) => guarded(() => setWorldSocketsV2(options.state.world, input.sockets)),
  });
  const setSpawns: Tool = tool({
    name: 'scene_world_set_spawns',
    description: 'Replace player/actor spawns, each with a positive clearance radius.',
    inputSchema: z
      .object({
        spawns: z
          .array(
            z
              .object({
                id,
                position: vec3,
                rotationYDeg: finite,
                clearanceRadius: finite.positive(),
              })
              .strict(),
          )
          .max(16),
      })
      .strict(),
    callback: (input) => guarded(() => setWorldSpawnsV2(options.state.world, input.spawns)),
  });
  const snap: Tool = tool({
    name: 'scene_world_snap',
    description:
      'Snap one compatible object exactly to a named socket; fails when incompatible or full.',
    inputSchema: z.object({ objectId: id, socketId: id }).strict(),
    callback: (input) => guarded(() => snapWorldObjectToSocketV2(options.state.world, input)),
  });
  const fillPath: Tool = tool({
    name: 'scene_world_fill_path',
    description:
      'Repeat one existing object along a path with deterministic arc-length spacing and tangent facing.',
    inputSchema: z
      .object({
        pathId: id,
        templateObjectId: id,
        idPrefix: z.string().min(1).max(240),
        count: z.number().int().min(1).max(32),
        spacing: finite.positive(),
        startDistance: finite.nonnegative().optional(),
      })
      .strict(),
    callback: (input) => guarded(() => fillWorldPathV2(options.state.world, input)),
  });
  const stampSchema = z.discriminatedUnion('kind', [
    z
      .object({
        kind: z.enum(['road', 'path']),
        points: z.array(vec2).min(2).max(64),
        halfWidth: finite.positive(),
        targetHeight: finite,
      })
      .strict(),
    z
      .object({
        kind: z.literal('pad'),
        center: vec2,
        halfExtents: positiveVec2,
        targetHeight: finite,
      })
      .strict(),
  ]);
  const setHeightfield: Tool = tool({
    name: 'scene_world_set_heightfield',
    description:
      'Generate and bind one bounded seeded heightfield with optional road/path/pad stamps.',
    inputSchema: z
      .object({
        origin: vec2,
        cellSize: finite.positive(),
        width: z.number().int().min(2).max(129),
        height: z.number().int().min(2).max(129),
        baseHeight: finite,
        amplitude: finite.nonnegative(),
        frequency: finite.positive(),
        stamps: z.array(stampSchema).max(16),
      })
      .strict(),
    callback: async (input) => {
      if (!options.publishHeightfieldArtifact)
        return {
          ok: false,
          error: 'heightfield artifact publisher is not configured',
        } as JSONValue;
      try {
        const artifact = createHeightfieldArtifactV1({ ...input, seed: options.state.world.seed });
        const bytes = encodeHeightfieldArtifactV1(artifact);
        const sha256 = await hashHeightfieldArtifactV1(artifact);
        const published = await options.publishHeightfieldArtifact(artifact, bytes, sha256);
        const result = commit(
          setWorldTerrainV2(options.state.world, {
            kind: 'heightfield',
            artifact: {
              uri: published.uri,
              sha256,
              mediaType: published.mediaType ?? 'application/vnd.kiln.heightfield+json',
            },
          }),
        ) as Record<string, JSONValue>;
        return { ...result, sha256, bytes: bytes.byteLength } as JSONValue;
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        } as JSONValue;
      }
    },
  });
  return [setZones, setPaths, setSockets, setSpawns, snap, fillPath, setHeightfield];
}
