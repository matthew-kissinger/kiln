import { describe, expect, test } from 'bun:test';
import type { Message, ModelStreamEvent, StreamOptions } from '@strands-agents/sdk';
import type { SceneModelJSON, SceneRenderPort } from '../composer';
import { migrateSceneModelV1ToWorldDocumentV2 } from '../composer';
import { runKilnWorldIntegration, WORLD_INTEGRATION_PROMPT_V2 } from '../composer/agent';
import { ScriptedModel } from '../agent/__tests__/scripted-model';

class ToolCapturingModel extends ScriptedModel {
  toolNames: string[][] = [];
  override async *stream(
    messages: Message[],
    options?: StreamOptions,
  ): AsyncIterable<ModelStreamEvent> {
    this.toolNames.push((options?.toolSpecs ?? []).map(({ name }) => name));
    yield* super.stream(messages, options);
  }
}

function world() {
  const scene: SceneModelJSON = {
    name: 'World',
    seed: 2,
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
  return migrateSceneModelV1ToWorldDocumentV2(scene, {
    worldId: 'world',
    artifactSha256ByGenerationId: { crate: 'a'.repeat(64) },
  });
}

describe('runKilnWorldIntegration', () => {
  test('mutates, renders, and finalizes one canonical world authority', async () => {
    const model = new ToolCapturingModel([
      {
        toolCalls: [
          {
            name: 'scene_world_set_sockets',
            input: {
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
            },
          },
        ],
      },
      { toolCalls: [{ name: 'scene_world_snap', input: { objectId: 'crate', socketId: 'slot' } }] },
      { toolCalls: [{ name: 'scene_world_render' }] },
      { toolCalls: [{ name: 'scene_world_finalize' }] },
      { text: 'done' },
    ]);
    const calls: Parameters<SceneRenderPort>[0][] = [];
    const render: SceneRenderPort = async (request) => {
      calls.push(request);
      return { ok: true, pngBase64: Buffer.from('png').toString('base64') };
    };
    const result = await runKilnWorldIntegration({
      model,
      prompt: 'add a cargo anchor',
      world: world(),
      render,
      maxSteps: 8,
    });
    expect(result.error).toBeUndefined();
    expect(result.finalized).toBe(true);
    expect(result.world.objects[0]).toMatchObject({
      socketId: 'slot',
      transform: { position: [0, 0, 0], rotationYDeg: 90 },
    });
    expect(result.placements[0]).toMatchObject({ pos: [0, 0, 0], rotYDeg: 90 });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.worldHash).toBe(result.worldHash);
    expect(calls[0]!.worldDocument).toEqual(result.world);
    expect(model.toolNames[0]).toEqual(
      expect.arrayContaining(['scene_world_snap', 'scene_world_render', 'scene_world_finalize']),
    );
    expect(String(model.seenSystemPrompts[0])).toContain(WORLD_INTEGRATION_PROMPT_V2.slice(0, 30));
  });
});
