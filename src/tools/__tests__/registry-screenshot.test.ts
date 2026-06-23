/**
 * kiln_screenshot registry tool: six-view grid output + the `media` contract
 * transports use to attach the PNG as a real image block.
 */
import { describe, expect, test } from 'bun:test';
import { kilnToolRegistry, type KilnScreenshotResult } from '../registry';

const BOX_CODE = `
const meta = { name: 'test-box', category: 'prop' };
function build() {
  const root = createRoot('Root');
  createPart('Mesh_Box', boxGeo(1, 1, 1), gameMaterial('#ff0000'), { parent: root, position: [0, 0.5, 0] });
  return root;
}
`;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function screenshotDef() {
  const def = kilnToolRegistry.find((d) => d.name === 'kiln_screenshot');
  if (!def) throw new Error('kiln_screenshot missing from registry');
  return def;
}

describe('kiln_screenshot', () => {
  test('renders valid code to a six-view grid PNG', async () => {
    const out = (await screenshotDef().run({ code: BOX_CODE })) as KilnScreenshotResult;
    expect(out.ok).toBe(true);
    expect(out.views).toEqual(['Front', 'Right', 'Back', 'Left', 'Top', '3/4']);
    expect(out.width).toBeGreaterThan(0);
    expect(out.height).toBeGreaterThan(0);
    expect(out.warnings).toEqual([]);
    const png = Buffer.from(out.pngBase64!, 'base64');
    expect(png.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
  });

  test('returns ok:false with the error message instead of throwing', async () => {
    const out = (await screenshotDef().run({ code: 'not a kiln program (' })) as KilnScreenshotResult;
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
});
