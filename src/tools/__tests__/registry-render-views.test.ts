/**
 * kilnRenderViewsDef — the unified-surface "see it" tool that collapses
 * kiln_render (metrics) and kiln_screenshot (image) into a single execution.
 * Returns geometry metrics AND the six-view grid PNG; failures are image-free.
 */
import { describe, expect, test } from 'bun:test';
import {
  kilnRenderViewsDef,
  kilnToolRegistry,
  screenshotMedia,
  type KilnRenderViewsResult,
} from '../registry';

const BOX_CODE = `
const meta = { name: 'test-box', category: 'prop' };
function build() {
  const root = createRoot('Root');
  createPart('Mesh_Box', boxGeo(1, 1, 1), gameMaterial('#ff0000'), { parent: root, position: [0, 0.5, 0] });
  return root;
}
`;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('kilnRenderViewsDef (unified kiln_render)', () => {
  test('is named kiln_render and is NOT part of the four-tool registry baseline', () => {
    expect(kilnRenderViewsDef.name).toBe('kiln_render');
    expect(kilnRenderViewsDef.media).toBe(screenshotMedia);
    // The registry array stays at four; the unified def lives outside it.
    expect(kilnToolRegistry).toHaveLength(4);
    expect(kilnToolRegistry.filter((d) => d === kilnRenderViewsDef)).toEqual([]);
  });

  test('describes the conditional GPU PBR path and the flat-shaded CPU fallback honestly', () => {
    expect(kilnRenderViewsDef.description).toContain('GPU PBR shading');
    expect(kilnRenderViewsDef.description).toContain('textured or metallic materials');
    expect(kilnRenderViewsDef.description).toContain('flat-shaded CPU render');
    expect(kilnRenderViewsDef.description).toContain('viewFidelity');
    expect(kilnRenderViewsDef.description).toContain('do not judge material');
  });

  test('valid code returns metrics AND the six-view grid PNG from one execution', async () => {
    const out = (await kilnRenderViewsDef.run({ code: BOX_CODE })) as KilnRenderViewsResult;
    expect(out.ok).toBe(true);
    // Metrics (the kiln_render half).
    expect(out.tris).toBeGreaterThan(0);
    expect(out.meshes).toBe(1);
    expect(out.materials).toBe(1);
    expect(out.bbox).toBeDefined();
    expect(out.bbox!.size).toHaveLength(3);
    // Image (the kiln_screenshot half).
    expect(out.views).toEqual(['Front', 'Right', 'Back', 'Left', 'Top', '3/4']);
    expect(out.gridWidth).toBeGreaterThan(0);
    expect(out.gridHeight).toBeGreaterThan(0);
    const png = Buffer.from(out.pngBase64!, 'base64');
    expect(png.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
  });

  test('build failure is image-free: ok:false, error set, no pngBase64', async () => {
    const out = (await kilnRenderViewsDef.run({
      code: 'not a kiln program (',
    })) as KilnRenderViewsResult;
    expect(out.ok).toBe(false);
    expect(out.error).toBeDefined();
    expect(out.pngBase64).toBeUndefined();
    expect(out.views).toBeUndefined();
  });

  test('media() extracts the PNG bytes and strips base64 from the JSON payload', async () => {
    const out = await kilnRenderViewsDef.run({ code: BOX_CODE });
    const media = kilnRenderViewsDef.media!(out);
    expect(media).toBeDefined();
    expect(Buffer.from(media!.png.subarray(0, 8)).equals(PNG_SIGNATURE)).toBe(true);
    const json = media!.json as Record<string, unknown>;
    expect(json['ok']).toBe(true);
    // Metrics survive in the JSON half so the model still sees them alongside the image.
    expect(json['tris']).toBeGreaterThan(0);
    expect(json['views']).toEqual(['Front', 'Right', 'Back', 'Left', 'Top', '3/4']);
    expect('pngBase64' in json).toBe(false);
  });

  test('media() returns undefined for a failed run (no image to attach)', async () => {
    const out = await kilnRenderViewsDef.run({ code: 'throw new Error("boom")' });
    expect(kilnRenderViewsDef.media!(out)).toBeUndefined();
  });
});
