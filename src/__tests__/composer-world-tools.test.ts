import { describe, expect, test } from 'bun:test';
import type { Tool } from '@strands-agents/sdk';
import type { SceneModelJSON } from '../composer';
import { migrateSceneModelV1ToWorldDocumentV2 } from '../composer';
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
  test('exposes a bounded eight-tool integration surface and authors canonical state', async () => {
    const target = state();
    const tools = makeWorldIntegrationToolsV2({ state: target });
    expect(tools.map(({ name }) => name).sort()).toEqual(
      [
        'scene_world_set_heightfield',
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
});
