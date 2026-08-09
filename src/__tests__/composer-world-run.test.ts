import { describe, expect, test } from 'bun:test';
import type { Message, ModelStreamEvent, StreamOptions } from '@strands-agents/sdk';
import type { SceneModelJSON, SceneRenderPort } from '../composer';
import { migrateSceneModelV1ToWorldDocumentV2 } from '../composer';
import { createGenerationCallBudget } from '../agent/call-budget';
import {
  runKilnComposer,
  runKilnWorldIntegration,
  WORLD_INTEGRATION_PROMPT_V2,
} from '../composer/agent';
import { ScriptedModel } from '../agent/__tests__/scripted-model';

class ToolCapturingModel extends ScriptedModel {
  toolNames: string[][] = [];
  messages: Message[][] = [];
  override async *stream(
    messages: Message[],
    options?: StreamOptions,
  ): AsyncIterable<ModelStreamEvent> {
    this.toolNames.push((options?.toolSpecs ?? []).map(({ name }) => name));
    this.messages.push(structuredClone(messages));
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
    const initialWorld = world();
    expect(initialWorld.environment.lightingPresetId).toBe('legacy-scene-v1');
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
      world: initialWorld,
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
    expect(calls[0]).not.toHaveProperty('lightingPresetId');
    expect(model.toolNames[0]).toEqual(
      expect.arrayContaining(['scene_world_snap', 'scene_world_render', 'scene_world_finalize']),
    );
    expect(String(model.seenSystemPrompts[0])).toContain(WORLD_INTEGRATION_PROMPT_V2.slice(0, 30));
  });

  test('surfaces and returns an exact GPU receipt for persistence', async () => {
    const receiptBase = {
      cameras: [
        {
          position: [12, 8, 15] as [number, number, number],
          target: [0, 1, 0] as [number, number, number],
          up: [0, 1, 0] as [number, number, number],
          fovDeg: 50,
          aspect: 16 / 9,
          near: 0.1,
          far: 500,
        },
      ],
      width: 1280,
      height: 720,
      lightingPresetId: 'studio-day-v2',
      backend: 'vulkan',
      rendererId: 'dawn-vulkan:test',
      outputSha256: `sha256:${'c'.repeat(64)}` as const,
      perCameraOutputSha256: [`sha256:${'c'.repeat(64)}` as const],
      outputSetSha256: `sha256:${'e'.repeat(64)}` as const,
    };
    const model = new ToolCapturingModel([
      { toolCalls: [{ name: 'scene_world_render' }] },
      { toolCalls: [{ name: 'scene_world_finalize' }] },
      { text: 'done' },
    ]);
    let receipt: (typeof receiptBase & { worldHash: `sha256:${string}` }) | undefined;
    let requestedLighting = false;
    const result = await runKilnWorldIntegration({
      model,
      prompt: 'inspect the world',
      world: world(),
      render: async (request) => {
        requestedLighting = Object.hasOwn(request, 'lightingPresetId');
        receipt = { ...receiptBase, worldHash: request.worldHash! };
        return {
          ok: true,
          pngBase64: Buffer.from('png').toString('base64'),
          degraded: false,
          receipt,
        };
      },
      maxSteps: 6,
    });

    expect(result.renderEvidence).toEqual([
      {
        worldHash: result.renderEvidence[0]!.worldHash,
        views: 1,
        degraded: false,
        receipt,
      },
    ]);
    expect(requestedLighting).toBe(false);
    expect(result.renderEvidence[0]!.receipt!.lightingPresetId).toBe('studio-day-v2');
    const modelContext = JSON.stringify(model.messages);
    expect(modelContext).toContain('dawn-vulkan:test');
    expect(modelContext).toContain('outputSha256');
    expect(modelContext).toContain('perCameraOutputSha256');
    expect(modelContext).toContain('outputSetSha256');
    expect(modelContext).toContain('"degraded":false');
    expect(modelContext).not.toContain('fallbackReceipt');

    receipt!.perCameraOutputSha256[0] = `sha256:${'f'.repeat(64)}`;
    expect(result.renderEvidence[0]!.receipt!.perCameraOutputSha256).toEqual([
      `sha256:${'c'.repeat(64)}`,
    ]);
  });

  test('rejects mismatched per-camera output evidence and exact/fallback ambiguity', async () => {
    const exact = {
      worldHash: `sha256:${'a'.repeat(64)}` as const,
      cameras: [
        {
          position: [12, 8, 15] as [number, number, number],
          target: [0, 1, 0] as [number, number, number],
          up: [0, 1, 0] as [number, number, number],
          fovDeg: 50,
          aspect: 1,
          near: 0.1,
          far: 500,
        },
      ],
      width: 512,
      height: 512,
      lightingPresetId: 'neutral-studio-v1',
      backend: 'vulkan',
      rendererId: 'dawn-vulkan:test',
      outputSha256: `sha256:${'b'.repeat(64)}` as const,
      perCameraOutputSha256: [
        `sha256:${'b'.repeat(64)}` as const,
        `sha256:${'c'.repeat(64)}` as const,
      ],
      outputSetSha256: `sha256:${'d'.repeat(64)}` as const,
    };
    const fallback = {
      cameraAttested: false as const,
      backend: 'cpu',
      rendererId: 'cpu-raster:test',
      outputSha256: `sha256:${'e'.repeat(64)}` as const,
    };
    const run = async (render: SceneRenderPort) => {
      const model = new ToolCapturingModel([{ toolCalls: [{ name: 'scene_world_render' }] }]);
      const result = await runKilnWorldIntegration({
        model,
        prompt: 'inspect the world',
        world: world(),
        render,
        maxSteps: 3,
      });
      return { result, context: JSON.stringify(model.messages) };
    };

    const mismatched = await run(async () => ({
      ok: true,
      pngBase64: Buffer.from('png').toString('base64'),
      receipt: exact,
    }));
    expect(mismatched.context).toContain('per-camera output hashes');

    const ambiguous = await run(async () => ({
      ok: true,
      pngBase64: Buffer.from('png').toString('base64'),
      receipt: { ...exact, perCameraOutputSha256: exact.perCameraOutputSha256.slice(0, 1) },
      fallbackReceipt: fallback,
    }));
    expect(ambiguous.context).toContain('both exact and fallback receipts');
  });

  test('surfaces an ok CPU fallback as degraded evidence without inventing a receipt', async () => {
    const fallbackReceipt = {
      cameraAttested: false as const,
      backend: 'cpu',
      rendererId: 'cpu-raster:test',
      outputSha256: `sha256:${'d'.repeat(64)}` as const,
    };
    const model = new ToolCapturingModel([
      { toolCalls: [{ name: 'scene_world_render' }] },
      { text: 'done' },
    ]);
    const result = await runKilnWorldIntegration({
      model,
      prompt: 'inspect the world',
      world: world(),
      render: async () => ({
        ok: true,
        pngBase64: Buffer.from('png').toString('base64'),
        degraded: true,
        degradeReason: 'GPU deadline; deterministic CPU fallback',
        fallbackReceipt,
      }),
      maxSteps: 4,
    });

    expect(result.renderEvidence).toEqual([
      {
        worldHash: result.renderEvidence[0]!.worldHash,
        views: 1,
        degraded: true,
        degradeReason: 'GPU deadline; deterministic CPU fallback',
        fallbackReceipt,
      },
    ]);
    const modelContext = JSON.stringify(model.messages);
    expect(modelContext).toContain('"degraded":true');
    expect(modelContext).toContain('GPU deadline; deterministic CPU fallback');
    expect(modelContext).toContain('cpu-raster:test');
    expect(modelContext).toContain('outputSha256');
    expect(modelContext).toContain('"cameraAttested":false');
    expect(modelContext).not.toContain('"receipt":');
  });

  test('shares one aggregate model-call allowance across compose and integration', async () => {
    const budget = createGenerationCallBudget(1);
    const render: SceneRenderPort = async () => ({ ok: true });
    const composed = await runKilnComposer({
      model: new ScriptedModel([{ text: 'first stage done' }]),
      prompt: 'compose a crate',
      catalog: [
        {
          generationId: 'crate',
          bbox: { min: [-1, 0, -1], max: [1, 2, 1] },
          tags: ['cargo'],
        },
      ],
      render,
      maxSteps: 8,
      generationCallBudget: budget,
    });
    expect(composed.callBudget).toMatchObject({ consumed: 1, remaining: 0, denied: 0 });

    const integrated = await runKilnWorldIntegration({
      model: new ScriptedModel([{ text: 'must not dispatch' }]),
      prompt: 'add integration',
      world: world(),
      render,
      generationCallBudget: budget,
    });
    expect(integrated.capped).toBe(true);
    expect(integrated.callBudget).toMatchObject({ consumed: 1, remaining: 0, denied: 1 });
    expect(budget.receipt()).toEqual(integrated.callBudget!);
  });

  test('enforces its local sub-cap without consuming the aggregate remainder', async () => {
    const budget = createGenerationCallBudget(5);
    const integrated = await runKilnWorldIntegration({
      model: new ScriptedModel([
        { toolCalls: [{ name: 'scene_world_render' }] },
        { toolCalls: [{ name: 'scene_world_render' }] },
        { text: 'must not dispatch' },
      ]),
      prompt: 'inspect twice within the integration slice',
      world: world(),
      render: async () => ({ ok: true }),
      maxSteps: 2,
      generationCallBudget: budget,
    });

    expect(integrated.capped).toBe(true);
    expect(integrated.steps).toBe(2);
    expect(integrated.callBudget).toMatchObject({
      limit: 5,
      consumed: 2,
      remaining: 3,
      denied: 0,
      byRole: { author: 2 },
    });
    expect(budget.receipt()).toEqual(integrated.callBudget!);
  });
});
