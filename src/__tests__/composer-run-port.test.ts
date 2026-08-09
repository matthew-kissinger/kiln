/**
 * B3a — the composer-path PbrRenderPort seam.
 *
 * The port is landed as a TYPED OPTION ONLY: no default implementation and no
 * composer tool calls it yet. These tests pin exactly that: a real
 * `runKilnComposer` run (over a ScriptedModel driving the genuine Strands
 * Agent) with and without `pbrRender` exposes the identical tool surface and
 * produces the identical result, and the injected port is never invoked.
 */
import { describe, expect, test } from 'bun:test';
import type { Message, ModelStreamEvent, StreamOptions } from '@strands-agents/sdk';

import {
  validatePbrRenderRequest,
  type CatalogEntry,
  type PbrRenderPort,
  type PbrRenderRequest,
  type PbrRenderResult,
  type SceneRenderPort,
} from '../composer';
import { runKilnComposer } from '../composer/agent';
import { ScriptedModel } from '../agent/__tests__/scripted-model';

const PNG_B64 = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]).toString('base64');

const asset = (id: string): CatalogEntry => ({
  generationId: id,
  bbox: { min: [-1, 0, -1], max: [1, 2, 1] },
  name: id,
});

/** ScriptedModel that also records the tool surface offered on every model call. */
class ToolCapturingModel extends ScriptedModel {
  readonly toolNames: string[][] = [];

  override async *stream(
    messages: Message[],
    options?: StreamOptions,
  ): AsyncIterable<ModelStreamEvent> {
    this.toolNames.push((options?.toolSpecs ?? []).map((t) => t.name));
    yield* super.stream(messages, options);
  }
}

const render: SceneRenderPort = async () => ({ ok: true, pngBase64: PNG_B64 });

async function runOnce(pbrRender?: PbrRenderPort) {
  const model = new ToolCapturingModel([{ text: 'scene looks good' }]);
  const result = await runKilnComposer({
    model,
    prompt: 'a small plaza',
    sceneName: 'Plaza',
    catalog: [asset('well'), asset('crate')],
    seed: 7,
    render,
    ...(pbrRender ? { pbrRender } : {}),
  });
  return { result, toolNames: model.toolNames };
}

describe('composer pbrRender seam (B3a)', () => {
  test('PbrRenderPort types express the render-service contract', async () => {
    // Type-level: a conforming implementation assigns cleanly and round-trips.
    const port: PbrRenderPort = async (req: PbrRenderRequest): Promise<PbrRenderResult> => ({
      ok: true,
      rendererId: 'dawn-vulkan:nvidia-rtx-a4500:NVIDIA: 550.100',
      viewsPng: (req.viewDirs ?? []).map(() => new Uint8Array([1])),
      timings: { renderMs: 12 },
    });
    const res = await port({
      glb: new Uint8Array([0x67, 0x6c, 0x54, 0x46]),
      viewDirs: [
        [1, 0, 0],
        [0, 0, 1],
      ],
      size: 384,
      beautySize: 1024,
    });
    expect(res.ok).toBe(true);
    expect(res.rendererId).toMatch(/^[a-z0-9-]+:/);
    expect(res.viewsPng).toHaveLength(2);
  });

  test('validates and clones exact perspective camera transport without changing legacy view dirs', () => {
    const glb = new Uint8Array([1, 2, 3]);
    const input: PbrRenderRequest = {
      glb,
      width: 1280,
      height: 720,
      cameras: [
        {
          position: [12, 8, 15],
          target: [0, 1, 0],
          up: [0, 1, 0],
          fovDeg: 50,
          aspect: 16 / 9,
          near: 0.1,
          far: 500,
        },
      ],
      lightingPresetId: 'studio-day-v2',
    };
    const parsed = validatePbrRenderRequest(input);
    expect(parsed).toEqual(input);
    expect(parsed).not.toBe(input);
    expect(parsed.glb).toBe(glb);
    expect(parsed.cameras).not.toBe(input.cameras);

    const legacyInput: PbrRenderRequest = { glb, viewDirs: [[1, 0, 0]], size: 384 };
    const legacy = validatePbrRenderRequest(legacyInput);
    expect(legacy).toEqual(legacyInput);
    expect(legacy.viewDirs).not.toBe(legacyInput.viewDirs);

    expect(() =>
      validatePbrRenderRequest({ ...input, cameras: [{ ...input.cameras![0]!, far: 0.05 }] }),
    ).toThrow(/far/i);
    expect(() =>
      validatePbrRenderRequest({ ...input, cameras: [{ ...input.cameras![0]!, up: [0, 0, 0] }] }),
    ).toThrow(/up/i);
    expect(() =>
      validatePbrRenderRequest({
        ...input,
        cameras: [{ ...input.cameras![0]!, up: [3, 1.75, 3.75] }],
      }),
    ).toThrow(/collinear/i);
    expect(() => validatePbrRenderRequest({ ...input, viewDirs: [[1, 0, 0]] })).toThrow(
      /mutually exclusive/i,
    );
    expect(() => validatePbrRenderRequest({ ...input, size: 720 })).toThrow(/legacy size/i);
    expect(() => validatePbrRenderRequest({ ...input, beautySize: 1080 })).toThrow(
      /legacy size or beautySize/i,
    );
    expect(() => validatePbrRenderRequest({ ...input, height: undefined })).toThrow(
      /provided together/i,
    );
    expect(() =>
      validatePbrRenderRequest({ ...input, width: undefined, height: undefined }),
    ).toThrow(/requires width and height/i);
    expect(() => validatePbrRenderRequest({ ...input, width: 1000 })).toThrow(/aspect/i);
    expect(() => validatePbrRenderRequest({ ...input, lightingPresetId: '   ' })).toThrow(
      /lightingPresetId/i,
    );
  });

  test('threading pbrRender changes nothing: identical tool surface and result, port never called', async () => {
    let calls = 0;
    const stub: PbrRenderPort = async () => {
      calls++;
      return { ok: true, rendererId: 'dawn-vulkan:test-gpu:1.0' };
    };

    const without = await runOnce();
    const withPort = await runOnce(stub);

    // The seam is dormant: no tool ever invokes it.
    expect(calls).toBe(0);

    // Identical tool surfaces offered to the model on every call.
    expect(withPort.toolNames).toEqual(without.toolNames);
    expect(withPort.toolNames.length).toBeGreaterThan(0);
    expect(withPort.toolNames[0]).toContain('scene_render');
    expect(withPort.toolNames[0]).toContain('scene_finalize');

    // Identical run result (program, scene, placements, metrics, everything).
    expect(withPort.result).toEqual(without.result);
    expect(withPort.result.finalized).toBe(false);
    expect(withPort.result.program).toBeTruthy();
  });
});
