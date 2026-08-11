import { describe, expect, test } from 'bun:test';
import type { Tool } from '@strands-agents/sdk';
import type { SceneModelJSON } from '../composer';
import { decodeColliderArtifactV1, migrateSceneModelV1ToWorldDocumentV2 } from '../composer';
import { makeWorldIntegrationToolsV2, type WorldIntegrationToolState } from '../composer/agent';

function state(): WorldIntegrationToolState {
  const model: SceneModelJSON = {
    name: 'Tools',
    seed: 1,
    catalog: [
      { generationId: 'crate', bbox: { min: [-1, 0, -1], max: [1, 2, 1] }, tags: ['cargo'] },
    ],
    statements: [
      {
        kind: 'place',
        stmtId: 's1',
        alias: 'crate',
        generationId: 'crate',
        role: 'support',
        scale: 1,
        at: [5, 5],
        face: 0,
        exact: { pos: [5, 0, 5], rotYDeg: 0 },
      },
    ],
  };
  return {
    world: migrateSceneModelV1ToWorldDocumentV2(model, {
      worldId: 'tools',
      artifactSha256ByGenerationId: { crate: 'a'.repeat(64) },
    }),
  };
}

interface Invokable {
  name: string;
  invoke(input: unknown): Promise<unknown>;
}
const call = (tools: Tool[], name: string, input: unknown) =>
  (tools.find((tool) => tool.name === name) as unknown as Invokable).invoke(input) as Promise<
    Record<string, unknown>
  >;

describe('Composer V2 world tools', () => {
  test('exposes a bounded nine-tool integration surface and authors canonical state', async () => {
    const target = state();
    const tools = makeWorldIntegrationToolsV2({ state: target });
    expect(tools.map(({ name }) => name).sort()).toEqual(
      [
        'scene_world_set_heightfield',
        'scene_world_set_collision',
        'scene_world_set_paths',
        'scene_world_set_presentation',
        'scene_world_set_sockets',
        'scene_world_set_spawns',
        'scene_world_set_zones',
        'scene_world_snap',
        'scene_world_fill_path',
      ].sort(),
    );
    expect(
      (
        await call(tools, 'scene_world_set_sockets', {
          sockets: [
            {
              id: 'slot',
              kind: 'anchor',
              position: [0, 0, 0],
              rotationYDeg: 90,
              compatibilityTags: ['cargo'],
              capacity: 1,
            },
          ],
        })
      ).ok,
    ).toBe(true);
    expect(
      (await call(tools, 'scene_world_snap', { objectId: 'crate', socketId: 'slot' })).ok,
    ).toBe(true);
    expect(target.world.objects[0]).toMatchObject({
      socketId: 'slot',
      transform: { position: [0, 0, 0], rotationYDeg: 90 },
    });
    expect(
      (
        await call(tools, 'scene_world_set_presentation', {
          presentation: {
            schemaVersion: 'kiln.presentation.v1',
            grid: { columns: 1, rows: 1, cellWidth: 320, cellHeight: 180 },
            lightingPresetId: 'neutral-studio-v1',
            receiptPolicy: {
              requirePerCameraOutputSha256: true,
              requireOutputSetSha256: true,
            },
            cameras: [
              {
                id: 'hero',
                cell: { column: 0, row: 0 },
                position: [8, 5, 8],
                target: [0, 1, 0],
                up: [0, 1, 0],
                fovDeg: 50,
                aspect: 16 / 9,
                near: 0.1,
                far: 100,
              },
            ],
          },
        })
      ).ok,
    ).toBe(true);
    expect(target.world.presentation?.cameras[0]?.id).toBe('hero');
    await expect(
      call(tools, 'scene_world_set_presentation', {
        presentation: {
          schemaVersion: 'kiln.presentation.v1',
          grid: { columns: 4, rows: 3, cellWidth: 4096, cellHeight: 4096 },
          lightingPresetId: 'neutral-studio-v1',
          receiptPolicy: {
            requirePerCameraOutputSha256: true,
            requireOutputSetSha256: true,
          },
          cameras: Array.from({ length: 12 }, (_, index) => ({
            id: `oversized-${index}`,
            cell: { column: index % 4, row: Math.floor(index / 4) },
            position: [index + 1, 2, 3],
            target: [0, 0, 0],
            up: [0, 1, 0],
            fovDeg: 50,
            aspect: 1,
            near: 0.1,
            far: 100,
          })),
        },
      }),
    ).rejects.toThrow(/total pixel budget/i);
  });

  test('publishes the exact heightfield bytes and binds the returned URI/hash', async () => {
    const target = state();
    let published: Uint8Array | undefined;
    const tools = makeWorldIntegrationToolsV2({
      state: target,
      publishHeightfieldArtifact: async (_artifact, bytes) => {
        published = bytes;
        return { uri: 'terrain/generated.heightfield.json' };
      },
    });
    const result = await call(tools, 'scene_world_set_heightfield', {
      origin: [-2, -2],
      cellSize: 1,
      width: 5,
      height: 5,
      baseHeight: 0,
      amplitude: 2,
      frequency: 0.2,
      stamps: [],
    });
    expect(result.ok).toBe(true);
    expect(published!.byteLength).toBeGreaterThan(0);
    expect(target.world.terrain).toMatchObject({
      kind: 'heightfield',
      artifact: { uri: 'terrain/generated.heightfield.json' },
    });
  });

  test('compiles and publishes a bounded generated collider while simple policies stay inline', async () => {
    const target = state();
    let published: Uint8Array | undefined;
    const tools = makeWorldIntegrationToolsV2({
      state: target,
      publishColliderArtifact: async (_artifact, bytes) => {
        published = bytes;
        return { uri: 'colliders/crate.collider.json' };
      },
    });
    expect(
      (
        await call(tools, 'scene_world_set_collision', {
          objectId: 'crate',
          policy: { kind: 'bounds', transformFrame: 'asset-local' },
        })
      ).ok,
    ).toBe(true);
    expect(target.world.objects[0]?.collision).toEqual({ policy: 'bounds' });

    const generated = await call(tools, 'scene_world_set_collision', {
      objectId: 'crate',
      policy: { kind: 'generated-mesh', transformFrame: 'asset-local', method: 'bounds-box' },
    });
    expect(generated.ok).toBe(true);
    expect(published).toBeDefined();
    expect(decodeColliderArtifactV1(published!)).toMatchObject({
      sourceArtifactSha256: `sha256:${'a'.repeat(64)}`,
      bounds: { min: [-1, 0, -1], max: [1, 2, 1] },
    });
    const collisionRefId = `collision:${String(generated.sha256).slice('sha256:'.length)}`;
    expect(target.world.objects[0]?.collision).toEqual({
      policy: 'artifact',
      artifactRefId: collisionRefId,
    });
    expect(target.world.collisionArtifacts[0]).toMatchObject({
      refId: collisionRefId,
      artifact: { uri: 'colliders/crate.collider.json' },
    });

    const unsupported = makeWorldIntegrationToolsV2({ state: state() });
    expect(
      await call(unsupported, 'scene_world_set_collision', {
        objectId: 'crate',
        policy: { kind: 'generated-mesh', transformFrame: 'asset-local', method: 'bounds-box' },
      }),
    ).toEqual({ ok: false, error: 'collider artifact publisher is not configured' });
    expect(
      await call(unsupported, 'scene_world_set_collision', {
        objectId: 'crate',
        policy: {
          kind: 'authored-submesh',
          transformFrame: 'asset-local',
          nodeNames: ['Collider_Main'],
        },
      }),
    ).toEqual({
      ok: false,
      error: 'authored-submesh compilation requires host-supplied GLB node geometry',
    });
  });
});
