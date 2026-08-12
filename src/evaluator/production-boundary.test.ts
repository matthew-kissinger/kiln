import { describe, expect, spyOn, test } from 'bun:test';

import * as renderModule from '../render';
import { renderGLBInProcess } from '../render';
import { inspect } from '../inspect';
import {
  createKilnRenderViewsDef,
  createKilnScreenshotAnimationDef,
  type KilnRenderViewsResult,
  type KilnScreenshotAnimationResult,
} from '../tools/registry';
import { rasterizeComposedScene, renderCodeViewGrid } from '../views';
import type { EvaluatorPortV1 } from './protocol';

const ANIMATED = `
const meta = { name: 'remote-boundary', category: 'prop' };
function build() {
  const root = createRoot('Root');
  const pivot = createPivot('Arm', [0, 0, 0], root);
  createPart('Blade', boxGeo(1, 1, 1), gameMaterial('#888888'), { parent: pivot });
  return root;
}
function animate() {
  return [createClip('move', 1, [rotationTrack('Joint_Arm', [
    { time: 0, rotation: [0, 0, 0] }, { time: 1, rotation: [0, 90, 0] }
  ])])];
}`;

describe('production evaluator boundary', () => {
  test('all source-taking review helpers consume injected evaluator GLB without local execution', async () => {
    const fixture = await renderGLBInProcess(ANIMATED);
    let calls = 0;
    const evaluatorPort: EvaluatorPortV1 = {
      async render() {
        calls++;
        return fixture;
      },
    };
    const execute = spyOn(renderModule, 'executeKilnCode');
    try {
      const context = { evaluatorPort, evaluatorProfile: 'evaluator-required' as const };
      const rendered = (await createKilnRenderViewsDef(context).run({
        code: ANIMATED,
      })) as KilnRenderViewsResult;
      const animation = (await createKilnScreenshotAnimationDef(context).run({
        code: ANIMATED,
        clip: 'move',
      })) as KilnScreenshotAnimationResult;
      const grid = await renderCodeViewGrid(ANIMATED, { ...context, size: 32 });
      const report = await inspect(ANIMATED, context);
      const scene = await rasterizeComposedScene(
        [{ code: ANIMATED, pos: [0, 0, 0], rotYDeg: 0, scale: 1 }],
        { ...context, size: 32 },
      );

      expect(rendered.ok).toBe(true);
      expect(animation.ok).toBe(true);
      expect(grid.png.byteLength).toBeGreaterThan(100);
      expect(report.triangles).toBeGreaterThan(0);
      expect(scene.png.byteLength).toBeGreaterThan(100);
      expect(calls).toBe(5);
      expect(execute).not.toHaveBeenCalled();
    } finally {
      execute.mockRestore();
    }
  });

  test('required production profile has no trusted-local fallback', async () => {
    const execute = spyOn(renderModule, 'executeKilnCode');
    try {
      const result = (await createKilnRenderViewsDef({
        evaluatorProfile: 'evaluator-required',
      }).run({ code: ANIMATED })) as KilnRenderViewsResult;
      expect(result).toMatchObject({ ok: false, error: 'Evaluator port is required.' });
      expect(execute).not.toHaveBeenCalled();
    } finally {
      execute.mockRestore();
    }
  });

  test('composed-scene exact GLB mode never evaluates source', async () => {
    const fixture = await renderGLBInProcess(ANIMATED);
    const execute = spyOn(renderModule, 'executeKilnCode');
    try {
      const scene = await rasterizeComposedScene(
        [{ glb: fixture.glb, pos: [0, 0, 0], rotYDeg: 0, scale: 1 }],
        { evaluatorProfile: 'evaluator-required', size: 32 },
      );
      expect(scene.png.byteLength).toBeGreaterThan(100);
      expect(execute).not.toHaveBeenCalled();
    } finally {
      execute.mockRestore();
    }
  });
});
