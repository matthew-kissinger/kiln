import { test, expect } from 'bun:test';
import { createKilnProgramToolRegistry } from '../../tools/registry';
const code =
  "const meta={name:'limit',category:'prop'};function build(){const r=createRoot('Root');createPart('Body',boxGeo(1,1,1),gameMaterial('#e24433'),{parent:r});return r;}";
test('host pixel limits reject CPU and GPU requests before evaluation or rendering', async () => {
  let called = 0;
  const defs = createKilnProgramToolRegistry({
    captureLimits: { maxTotalPixels: 100 },
    viewRenderPort: async () => {
      called++;
      throw Error('must not call');
    },
  });
  for (const name of [
    'kiln_render',
    'kiln_inspect',
    'kiln_view_interior',
    'kiln_screenshot_animation',
  ]) {
    const out = (await defs.find((d) => d.name === name)!.run({ code, clip: 'idle' })) as {
      ok: boolean;
      error: string;
    };
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/pixel budget/);
  }
  expect(called).toBe(0);
});
test('host output byte limits reject returned grid and separate images', async () => {
  const defs = createKilnProgramToolRegistry({ captureLimits: { maxOutputBytes: 10 } });
  for (const output of ['grid', 'separate']) {
    const out = (await defs
      .find((d) => d.name === 'kiln_render')!
      .run({ code, capture: { version: 'kiln.capture.v1', shots: [{}], size: 128, output } })) as {
      ok: boolean;
      error: string;
      pngBase64?: string;
    };
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/byte budget/);
    expect(out.pngBase64).toBeUndefined();
  }
});

test('low-level capture limits reject before invoking a GPU adapter', async () => {
  const { captureViewsViaPort } = await import('../port');
  let called = false;
  const out = await captureViewsViaPort(
    async () => {
      called = true;
      throw Error('unexpected');
    },
    new Uint8Array(),
    100,
    undefined,
    { maxTotalPixels: 100 },
  );
  expect(out.ok).toBe(false);
  expect(called).toBe(false);
});
test('models cannot raise default host limits', async () => {
  const { resolveCaptureLimits, DEFAULT_CAPTURE_LIMITS } = await import('../capture-limits');
  expect(resolveCaptureLimits({ maxTotalPixels: Number.MAX_SAFE_INTEGER })).toEqual(
    DEFAULT_CAPTURE_LIMITS,
  );
});
test('GPU image headers are bounded before decompression', async () => {
  const { captureViewPngsViaPort } = await import('../port');
  const { encodePng } = await import('../png');
  const png = Uint8Array.from(encodePng(new Uint8Array(3), 1, 1));
  new DataView(png.buffer).setUint32(16, 100000);
  new DataView(png.buffer).setUint32(20, 100000);
  const out = await captureViewPngsViaPort(
    async () => ({ ok: true, rendererId: 'gpu:test', viewsPng: [png] }),
    new Uint8Array(),
    100,
    [[1, 0, 0]],
    128,
  );
  expect(out).toMatchObject({ ok: false, reason: expect.stringMatching(/pixel budget/) });
});
