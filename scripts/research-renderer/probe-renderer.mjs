// Isolated research control. Never imported by the engine or shipped runtime.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { register } from 'node:module';

const [serviceDir, fixture, mode = 'direct'] = process.argv.slice(2);
const began = performance.now();
if (mode === 'cpu') {
  console.log(JSON.stringify({ mode, nativeGpuLoaded: false, node: process.version }));
  process.exit(0);
}
register(pathToFileURL(join(serviceDir, 'src/three-alias-hooks.mjs')));
try {
  const { acquireGpu } = await import(pathToFileURL(join(serviceDir, 'src/gpu.mjs')));
  const { renderGlb } = await import(pathToFileURL(join(serviceDir, 'src/renderer.mjs')));
  const gpu = await acquireGpu();
  const readyMs = performance.now() - began;
  const glb = readFileSync(fixture);
  const observations = [];
  for (let index = 0; index < 2; index++) {
    const start = performance.now();
    const result = await renderGlb(glb, { size: 128, viewDirs: [[1, 0.35, 1]] });
    const png = result.views[0];
    if (
      !Buffer.isBuffer(png) ||
      !png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ) {
      throw new Error('renderer returned invalid PNG');
    }
    observations.push({
      wallMs: performance.now() - start,
      pngBytes: png.length,
      pngSha256: createHash('sha256').update(png).digest('hex'),
      timings: result.timings,
    });
  }
  console.log(
    JSON.stringify({
      mode,
      readyMs,
      totalMs: performance.now() - began,
      observations,
      rendererId: gpu.rendererId,
      adapter: gpu.summary,
      peakRssKiB: process.resourceUsage().maxRSS,
      globalsChanged: ['navigator.gpu', 'self', 'requestAnimationFrame', 'createImageBitmap'],
    }),
  );
  // The upstream native binding intentionally remains alive while GPU is referenced.
  // This isolated control therefore exits explicitly; product shutdown is a separate gate.
  process.exit(0);
} catch (error) {
  console.log(JSON.stringify({ mode, error: error.message, totalMs: performance.now() - began }));
  process.exit(1);
}
