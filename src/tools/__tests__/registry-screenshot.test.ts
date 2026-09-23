/**
 * kiln_render registry tool: six-view grid output + the `media` contract
 * transports use to attach the PNG as a real image block.
 */
import { describe, expect, test } from 'bun:test';
import { createKilnProgramToolRegistry, type KilnScreenshotResult } from '../registry';
import type { PbrRenderPort, PbrRenderRequest } from '../../composer/render-port';
import { BACKDROPS } from '../../views/background';
import { decodePng } from '../../views/png';
import { encodePng } from '../../views';
import { PAD } from '../../views/grid';

const BOX_CODE = `
const meta = { name: 'test-box', category: 'prop' };
function build() {
  const root = createRoot('Root');
  createPart('Mesh_Box', boxGeo(1, 1, 1), gameMaterial('#ff0000'), { parent: root, position: [0, 0.5, 0] });
  return root;
}
`;

const METAL_CODE = `
const meta = { name: 'metal-box', category: 'prop' };
function build() {
  const root = createRoot('Root');
  createPart('Body', boxGeo(1, 1, 1), gameMaterial('#c0c0c0', { metalness: 0.6 }), { parent: root });
  return root;
}
`;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Six flat per-view PNGs at the default cell size, standing in for a GPU. */
function stubViewPngs(size = 384): Uint8Array[] {
  return Array.from({ length: 6 }, (_, i) => {
    const rgb = new Uint8Array(size * size * 3);
    for (let p = 0; p < size * size; p++) rgb[p * 3] = 20 + i * 30;
    return new Uint8Array(encodePng(rgb, size, size));
  });
}

function screenshotDef() {
  const def = createKilnProgramToolRegistry().find((d) => d.name === 'kiln_render');
  if (!def) throw new Error('kiln_render missing from registry');
  return def;
}

describe('kiln_render', () => {
  test('renders valid code to a six-view grid PNG', async () => {
    const out = (await screenshotDef().run({
      code: BOX_CODE,
    })) as KilnScreenshotResult;
    expect(out.ok).toBe(true);
    expect(out.views).toEqual(['Front', 'Right', 'Back', 'Left', 'Top', '3/4']);
    expect(out.gridWidth).toBeGreaterThan(0);
    expect(out.gridHeight).toBeGreaterThan(0);
    expect(out.warnings).toEqual([]);
    const png = Buffer.from(out.pngBase64!, 'base64');
    expect(png.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
  });

  test('returns ok:false with the error message instead of throwing', async () => {
    const out = (await screenshotDef().run({
      code: 'not a kiln program (',
    })) as KilnScreenshotResult;
    expect(out.ok).toBe(false);
    expect(out.error).toBeDefined();
    expect(out.pngBase64).toBeUndefined();
  });

  test('media() extracts the PNG bytes and strips the base64 from the JSON payload', async () => {
    const def = screenshotDef();
    const out = await def.run({ code: BOX_CODE });
    const media = def.media!(out);
    expect(media).toBeDefined();
    expect(Buffer.from(media!.png.subarray(0, 8)).equals(PNG_SIGNATURE)).toBe(true);
    const json = media!.json as Record<string, unknown>;
    expect(json['ok']).toBe(true);
    expect(json['views']).toEqual(['Front', 'Right', 'Back', 'Left', 'Top', '3/4']);
    expect('pngBase64' in json).toBe(false);
  });

  test('media() returns undefined for a failed run (no image to attach)', async () => {
    const def = screenshotDef();
    const out = await def.run({ code: 'throw new Error("boom")' });
    expect(def.media!(out)).toBeUndefined();
  });

  test('accepts capture configuration and paints the named backdrop', async () => {
    expect(
      screenshotDef().inputSchema.safeParse({
        code: BOX_CODE,
        capture: { backdrop: 'dark' },
      }).success,
    ).toBe(true);
    const out = (await screenshotDef().run({
      code: BOX_CODE,
      capture: { backdrop: 'dark' },
    })) as KilnScreenshotResult;
    expect(out.ok).toBe(true);
    expect(out.capture?.backdrop).toBe('dark');
    const png = decodePng(Buffer.from(out.pngBase64!, 'base64'));
    // A corner inside the first cell's padding is backdrop, whatever the asset is.
    const at = ((PAD + 1) * png.width + (png.width - PAD - 2)) * 3;
    expect([...png.rgb.subarray(at, at + 3)]).toEqual([...BACKDROPS.dark.rgb]);
    expect(out.viewFidelity?.version).toBe('kiln.view-fidelity.v1');
  });

  test('routes a metallic scene through the injected render port', async () => {
    const requests: PbrRenderRequest[] = [];
    const port: PbrRenderPort = async (req) => {
      requests.push(req);
      return {
        ok: true,
        rendererId: 'dawn-vulkan:test-gpu:1.0',
        viewsPng: stubViewPngs(),
      };
    };
    const def = createKilnProgramToolRegistry({ viewRenderPort: port }).find(
      (d) => d.name === 'kiln_render',
    )!;
    const out = (await def.run({ code: METAL_CODE })) as KilnScreenshotResult;
    expect(out.ok).toBe(true);
    expect(requests).toHaveLength(1);
    expect(out.viewFidelity).toMatchObject({
      materialFaithful: true,
      rendererId: 'dawn-vulkan:test-gpu:1.0',
      degraded: false,
    });
    // The evidence trail names the tool the model actually called.
    expect(JSON.stringify(out.viewEvidence ?? {})).toContain('"kiln_render"');
  });

  test('says what it can and cannot show, instead of calling itself flat-shaded', () => {
    const description = screenshotDef().description;
    expect(description).not.toContain('Flat-shaded CPU render');
    expect(description).toContain('viewFidelity');
    expect(description).toContain('capture');
  });
});
