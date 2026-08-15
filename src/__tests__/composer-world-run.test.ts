import { describe, expect, test } from 'bun:test';
import type { Message, ModelStreamEvent, StreamOptions } from '@strands-agents/sdk';
import type { SceneModelJSON, SceneRenderPort } from '../composer';
import {
  decodeColliderArtifactV1,
  migrateSceneModelV1ToWorldDocumentV2,
  setWorldPresentationV1,
  worldColliderAabbV1,
} from '../composer';
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

const exactRender: SceneRenderPort = async (request) => ({
  ok: true,
  pngBase64: Buffer.from('png').toString('base64'),
  degraded: false,
  receipt: {
    worldHash: request.worldHash!,
    cameras: [
      {
        position: [8, 5, 8],
        target: [0, 1, 0],
        up: [0, 1, 0],
        fovDeg: 50,
        aspect: 16 / 9,
        near: 0.1,
        far: 100,
      },
    ],
    width: request.width ?? 640,
    height: request.height ?? 360,
    lightingPresetId: request.lightingPresetId ?? 'neutral-studio-v1',
    backend: 'vulkan',
    rendererId: 'dawn-vulkan:test',
    outputSha256: `sha256:${'b'.repeat(64)}`,
    perCameraOutputSha256: [`sha256:${'b'.repeat(64)}`],
    outputSetSha256: `sha256:${'c'.repeat(64)}`,
  },
});

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
    expect(result.finalizedBy).toBe('model');
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
    expect(WORLD_INTEGRATION_PROMPT_V2).toContain('scene_world_view');
    expect(WORLD_INTEGRATION_PROMPT_V2).toContain('scene_world_set_presentation');
    expect(WORLD_INTEGRATION_PROMPT_V2).toContain('16,777,216');
    expect(WORLD_INTEGRATION_PROMPT_V2).toContain('Do not send artifactBinding');
    expect(WORLD_INTEGRATION_PROMPT_V2).toContain('scene_world_set_collision');
    expect(WORLD_INTEGRATION_PROMPT_V2).toContain('authored-submesh');
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

  test('makes exact current presentation values and aggregate limits model-visible', async () => {
    const presented = setWorldPresentationV1(world(), {
      schemaVersion: 'kiln.presentation.v1',
      grid: { columns: 1, rows: 1, cellWidth: 640, cellHeight: 360 },
      lightingPresetId: 'neutral-studio-v1',
      receiptPolicy: {
        requirePerCameraOutputSha256: true,
        requireOutputSetSha256: true,
      },
      cameras: [
        {
          id: 'model-authored-hero',
          cell: { column: 0, row: 0 },
          position: [9, 6, 7],
          target: [1, 2, 3],
          up: [0, 1, 0],
          fovDeg: 47,
          aspect: 16 / 9,
          near: 0.2,
          far: 250,
        },
      ],
    });
    const model = new ToolCapturingModel([
      { toolCalls: [{ name: 'scene_world_view' }] },
      { toolCalls: [{ name: 'scene_world_finalize' }] },
      { text: 'done' },
    ]);
    const result = await runKilnWorldIntegration({
      model,
      prompt: 'inspect the authored presentation',
      world: presented,
      render: async () => ({ ok: true }),
      maxSteps: 5,
    });

    expect(result.finalized).toBe(true);
    const modelContext = JSON.stringify(model.messages);
    expect(modelContext).toContain('model-authored-hero');
    expect(modelContext).toContain('"position":[9,6,7]');
    expect(modelContext).toContain('"target":[1,2,3]');
    expect(modelContext).toContain('"maxTotalPixels":16777216');
    expect(modelContext).toContain('"authoredByModel":false');
  });

  test('routes authored GLB node geometry through the bounded production collider ports', async () => {
    const model = new ToolCapturingModel([
      {
        toolCalls: [
          {
            name: 'scene_world_set_collision',
            input: {
              objectId: 'crate',
              policy: {
                kind: 'authored-submesh',
                transformFrame: 'asset-local',
                nodeNames: ['Collider_Main'],
              },
            },
          },
        ],
      },
      { toolCalls: [{ name: 'scene_world_finalize' }] },
      { text: 'done' },
    ]);
    let resolverRequest: unknown;
    let published: Uint8Array | undefined;
    const result = await runKilnWorldIntegration({
      model,
      prompt: 'use the authored collider node',
      world: world(),
      render: async () => ({ ok: true }),
      resolveAuthoredColliderGeometry: async (request) => {
        resolverRequest = request;
        return {
          schemaVersion: 'kiln.authored-collider-geometry.v1',
          sourceArtifactSha256: request.sourceArtifactSha256,
          transformFrame: 'asset-local',
          submeshes: [
            {
              nodeName: 'Collider_Main',
              positions: [-1, 0, -1, 1, 0, -1, 0, 2, 1],
              indices: [0, 1, 2],
            },
          ],
        };
      },
      publishColliderArtifact: async (_artifact, bytes) => {
        published = bytes;
        return { uri: 'colliders/crate-authored.collider.json' };
      },
      maxSteps: 5,
    });

    expect(result.finalized).toBe(true);
    expect(resolverRequest).toMatchObject({
      sourceArtifactSha256: `sha256:${'a'.repeat(64)}`,
      transformFrame: 'asset-local',
      nodeNames: ['Collider_Main'],
    });
    const artifact = decodeColliderArtifactV1(published!);
    expect(artifact.policy).toEqual({
      kind: 'authored-submesh',
      transformFrame: 'asset-local',
      nodeNames: ['Collider_Main'],
    });
    expect(
      worldColliderAabbV1(artifact, {
        position: result.world.objects[0]!.transform.position,
        rotationYDeg: result.world.objects[0]!.transform.rotationYDeg,
        uniformScale: result.world.objects[0]!.transform.uniformScale,
      }),
    ).toEqual({ min: [4, 0, 4], max: [6, 2, 6] });
    expect(result.world.objects[0]?.collision?.policy).toBe('artifact');
  });

  test('forwards persisted presentation parameters and accepts only their exact receipt', async () => {
    const presented = setWorldPresentationV1(world(), {
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
    });
    const model = new ToolCapturingModel([
      { toolCalls: [{ name: 'scene_world_render' }] },
      { toolCalls: [{ name: 'scene_world_finalize' }] },
      { text: 'done' },
    ]);
    let captured: Parameters<SceneRenderPort>[0] | undefined;
    const result = await runKilnWorldIntegration({
      model,
      prompt: 'inspect the authored presentation',
      world: presented,
      render: async (request) => {
        captured = request;
        return {
          ok: true,
          pngBase64: Buffer.from('png').toString('base64'),
          receipt: {
            worldHash: request.worldHash!,
            cameras: request.cameras!.map((camera) => ({
              position: camera.position,
              target: camera.target,
              up: camera.up!,
              fovDeg: camera.fovDeg!,
              aspect: camera.aspect!,
              near: camera.near!,
              far: camera.far!,
            })),
            width: request.width!,
            height: request.height!,
            lightingPresetId: request.lightingPresetId!,
            backend: 'vulkan',
            rendererId: 'gpu:test',
            perCameraOutputSha256: [`sha256:${'b'.repeat(64)}`],
            outputSetSha256: `sha256:${'c'.repeat(64)}`,
            outputSha256: `sha256:${'d'.repeat(64)}`,
          },
        };
      },
      maxSteps: 6,
    });
    expect(result.finalized).toBe(true);
    expect(result.renderEvidence).toHaveLength(1);
    expect(captured).toMatchObject({
      width: 320,
      height: 180,
      lightingPresetId: 'neutral-studio-v1',
    });
    expect(captured?.cameras).toHaveLength(1);
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
    expect(result.finalized).toBe(false);
    expect(result.error).toContain('hash-bound non-degraded render');
  });

  test('host finalizes a valid exactly rendered final world when the model omits the ceremonial commit call', async () => {
    const model = new ToolCapturingModel([
      { toolCalls: [{ name: 'scene_world_render' }] },
      { text: 'The world is ready.' },
    ]);
    const result = await runKilnWorldIntegration({
      model,
      prompt: 'inspect and finish the world',
      world: world(),
      render: exactRender,
      maxSteps: 4,
    });

    expect(result).toMatchObject({
      finalized: true,
      finalizedBy: 'host',
    });
    expect(result.error).toBeUndefined();
    expect(result.toolCalls).toEqual(['scene_world_render']);
    expect(result.renderEvidence[0]).toMatchObject({
      worldHash: result.worldHash,
      views: 1,
      degraded: false,
      receipt: { worldHash: result.worldHash },
    });
  });

  test('host refuses to finalize when the exact render predates a later world mutation', async () => {
    const model = new ToolCapturingModel([
      { toolCalls: [{ name: 'scene_world_render' }] },
      {
        toolCalls: [
          {
            name: 'scene_world_set_sockets',
            input: {
              sockets: [
                {
                  id: 'late-slot',
                  kind: 'anchor',
                  position: [0, 0, 0],
                  rotationYDeg: 0,
                  compatibilityTags: ['cargo'],
                  capacity: 1,
                },
              ],
            },
          },
        ],
      },
      { text: 'done' },
    ]);
    const result = await runKilnWorldIntegration({
      model,
      prompt: 'edit after rendering',
      world: world(),
      render: exactRender,
      maxSteps: 5,
    });

    expect(result.finalized).toBe(false);
    expect(result.finalizedBy).toBeUndefined();
    expect(result.error).toContain('hash-bound non-degraded render of the final world');
    expect(result.renderEvidence[0]!.worldHash).not.toBe(result.worldHash);
  });

  test('host refuses to finalize a valid world that was never rendered', async () => {
    const result = await runKilnWorldIntegration({
      model: new ToolCapturingModel([{ text: 'done' }]),
      prompt: 'finish without inspection',
      world: world(),
      render: exactRender,
      maxSteps: 3,
    });

    expect(result.finalized).toBe(false);
    expect(result.error).toContain('hash-bound non-degraded render');
  });

  test('host commits an exact final render even when the model-call cap blocks a ceremonial follow-up', async () => {
    const result = await runKilnWorldIntegration({
      model: new ToolCapturingModel([
        { toolCalls: [{ name: 'scene_world_render' }] },
        { toolCalls: [{ name: 'scene_world_finalize' }] },
      ]),
      prompt: 'render and finish within one admitted call',
      world: world(),
      render: exactRender,
      maxSteps: 1,
    });

    expect(result).toMatchObject({
      capped: true,
      finalized: true,
      finalizedBy: 'host',
      steps: 1,
      toolCalls: ['scene_world_render'],
    });
    expect(result.error).toBeUndefined();
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
