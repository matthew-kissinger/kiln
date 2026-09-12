// Opt-in, provider-free R2.9 hardware conformance. This intentionally does not
// run under `npm test`: CI always validates the embedded GLB structure while a
// workstation/worker with a real WebGPU adapter can exercise material response.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PNG } from 'pngjs';

const fixtureUrl = new URL('./fixtures/material-channels-v1.glb', import.meta.url);
const manifestUrl = new URL('./fixtures/material-channels-v1.manifest.json', import.meta.url);
const noHardware =
  /(?:no webgpu adapter|no usable .*device|software adapter refused|couldn(?:'|’)t find a suitable webgpu backend|requestadapter.*(?:failed|null)|(?:vulkan|d3d12|metal).*(?:unavailable|not found|failed to init))/i;

// A fixture with embedded PNG buffer views has no reason to cross a network
// boundary. Fail closed if a loader regression ever attempts to do so.
//
// `blob:` is exempt, and has to be. It is an in-memory object URL, not a network
// boundary: GLTFLoader mints one per embedded image and ImageBitmapLoader reads
// it back through `fetch`. Blocking every scheme therefore blocked the only path
// an embedded texture has into the renderer, and this file then measured an
// untextured render and asserted against it -- `lumaSpread: 0` on the albedo
// checker, with the real cause printed as a loader warning nobody read. The
// guard defeated the thing it was guarding.
const passthroughFetch = globalThis.fetch;
Object.defineProperty(globalThis, 'fetch', {
  configurable: true,
  writable: true,
  value: async (input, init) => {
    const target = String(typeof input === 'string' ? input : (input?.url ?? input));
    if (target.startsWith('blob:')) return passthroughFetch(input, init);
    throw new Error(`network disabled in local material conformance: ${target}`);
  },
});

// The exemption is a hole in a guard, so prove the guard is still closed around
// it before rendering anything through it.
await globalThis.fetch('https://example.invalid/texture.png').then(
  () => {
    throw new Error('network guard is open: an https fetch was permitted');
  },
  (error) => {
    if (!/network disabled/.test(String(error?.message ?? error)))
      throw new Error(`network guard failed for an unexpected reason: ${error}`);
  },
);

function pixelsIn(png, [x0, y0, x1, y1]) {
  const pixels = [];
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const offset = (y * png.width + x) * 4;
      pixels.push([png.data[offset], png.data[offset + 1], png.data[offset + 2]]);
    }
  }
  return pixels;
}

function luma([r, g, b]) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values, fraction) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) * fraction)];
}

function summarize(pixels) {
  const luminance = pixels.map(luma);
  const means = [0, 1, 2].map((channel) => mean(pixels.map((pixel) => pixel[channel])));
  return {
    meanRgb: means.map((value) => +value.toFixed(1)),
    meanLuma: +mean(luminance).toFixed(1),
    lumaSpread: +(percentile(luminance, 0.9) - percentile(luminance, 0.1)).toFixed(1),
  };
}

function halves(png, region, axis = 'x') {
  const [x0, y0, x1, y1] = region;
  if (axis === 'x') {
    const middle = Math.floor((x0 + x1) / 2);
    return [pixelsIn(png, [x0, y0, middle, y1]), pixelsIn(png, [middle, y0, x1, y1])];
  }
  const middle = Math.floor((y0 + y1) / 2);
  return [pixelsIn(png, [x0, y0, x1, middle]), pixelsIn(png, [x0, middle, x1, y1])];
}

function lumaDelta(groups) {
  return Math.abs(mean(groups[0].map(luma)) - mean(groups[1].map(luma)));
}

function colorDistance(a, b) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

async function main() {
  const [glb, manifestText] = await Promise.all([
    readFile(fixtureUrl),
    readFile(manifestUrl, 'utf8'),
  ]);
  const manifest = JSON.parse(manifestText);
  let rendered;
  try {
    const { renderGlb } = await import('../src/renderer.mjs');
    rendered = await renderGlb(glb, {
      cameras: manifest.render.cameras,
      width: manifest.render.width,
      height: manifest.render.height,
      lightingPresetId: manifest.render.lightingPresetId,
    });
  } catch (error) {
    const message = String(error?.message ?? error);
    if (noHardware.test(message)) {
      process.stdout.write(
        `SKIP material GPU conformance: no usable hardware WebGPU adapter (${message})\n`,
      );
      process.exit(0);
    }
    throw error;
  }

  assert.equal(rendered.views.length, 1, 'one fixed camera must produce one PNG');
  const png = PNG.sync.read(rendered.views[0]);
  assert.equal(png.width, manifest.render.width);
  assert.equal(png.height, manifest.render.height);
  const region = (name) => manifest.regions[name];
  const stats = Object.fromEntries(
    Object.entries(manifest.regions).map(([name, box]) => [name, summarize(pixelsIn(png, box))]),
  );

  assert.ok(
    stats.AlbedoChecker.lumaSpread >= 45,
    `albedo checker did not modulate base color: ${stats.AlbedoChecker.lumaSpread}`,
  );

  // This threshold is measured, and it was previously a guess that had never run:
  // the albedo assertion above always failed first, so nothing below it was ever
  // evaluated against a real render. What it has to discriminate is "the normal
  // map perturbs shading" from "the normal map is absent", and absent reads as
  // roughly zero -- the way the albedo checker read exactly 0 while textures were
  // being blocked.
  //
  // The value is small because the tone curve compresses it, not because the
  // response is weak. This panel sits at mean luma ~242 of 255 under the fixture's
  // own `neutral-studio-v1` exposure of 1.38, which is past the shoulder of the
  // ACES curve where a perturbation barely moves an 8-bit output. Measured on
  // dawn-vulkan/GTX 1660 Ti: 1.51 at exposure 1.38, and 2.61 at the
  // `gallery-studio-v1` exposure of 0.9 with nothing else changed. Re-exposing the
  // fixture would buy headroom and is the better instrument, but it would change
  // what this file conforms -- the default tool rig.
  const normalDelta = lumaDelta(halves(png, region('NormalResponse')));
  assert.ok(
    normalDelta >= 1,
    `normal map halves did not change lighting response: ${normalDelta.toFixed(1)}`,
  );

  assert.ok(
    stats.SharedOrmResponse.lumaSpread >= 5,
    `shared ORM channels did not change material response: ${stats.SharedOrmResponse.lumaSpread}`,
  );

  const aoDelta = lumaDelta(halves(png, region('AoResponse')));
  assert.ok(aoDelta >= 5, `AO red channel did not occlude one half: ${aoDelta.toFixed(1)}`);

  const emissivePixels = pixelsIn(png, region('EmissiveResponse'));
  const emissive = summarize(emissivePixels);
  assert.ok(emissive.lumaSpread >= 30, `emissive checker response is flat: ${emissive.lumaSpread}`);
  assert.ok(
    percentile(
      emissivePixels.map((pixel) => pixel[0]),
      0.9,
    ) >=
      percentile(
        emissivePixels.map((pixel) => pixel[1]),
        0.9,
      ) +
        35,
    'emissive red channel is not visibly dominant',
  );

  const backgroundSamples = [
    [png.data[0], png.data[1], png.data[2]],
    (() => {
      const i = (png.width - 1) * 4;
      return [png.data[i], png.data[i + 1], png.data[i + 2]];
    })(),
    (() => {
      const i = (png.height - 1) * png.width * 4;
      return [png.data[i], png.data[i + 1], png.data[i + 2]];
    })(),
    (() => {
      const i = (png.width * png.height - 1) * 4;
      return [png.data[i], png.data[i + 1], png.data[i + 2]];
    })(),
  ];
  const background = [0, 1, 2].map((channel) =>
    mean(backgroundSamples.map((pixel) => pixel[channel])),
  );
  const alphaPixels = pixelsIn(png, region('AlphaResponse'));
  const backgroundFraction =
    alphaPixels.filter((pixel) => colorDistance(pixel, background) <= 8).length /
    alphaPixels.length;
  assert.ok(
    backgroundFraction >= 0.2 && backgroundFraction <= 0.8,
    `alpha mask must expose both material and background: ${(backgroundFraction * 100).toFixed(1)}% background`,
  );

  process.stdout.write(
    `${JSON.stringify({
      result: 'PASS',
      fixtureId: manifest.fixtureId,
      normalHalfLumaDelta: +normalDelta.toFixed(1),
      aoHalfLumaDelta: +aoDelta.toFixed(1),
      alphaBackgroundFraction: +backgroundFraction.toFixed(3),
      regions: stats,
    })}\n`,
  );
  process.exit(0);
}

await main();
