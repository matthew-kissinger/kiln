import { register } from 'node:module';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const [serviceDir, output] = process.argv.slice(2);
register(pathToFileURL(join(serviceDir, 'src/three-alias-hooks.mjs')));
const began = performance.now();
const { acquireGpu } = await import(pathToFileURL(join(serviceDir, 'src/gpu.mjs')));
const { initRenderer } = await import(pathToFileURL(join(serviceDir, 'src/renderer.mjs')));
const { createRendererCaptureIdentity } = await import(
  pathToFileURL(join(serviceDir, 'src/cache-identity.mjs'))
);
const imported = performance.now();
const gpu = await acquireGpu();
const acquired = performance.now();
await initRenderer();
const initialized = performance.now();
const identity = createRendererCaptureIdentity(gpu);
const fingerprinted = performance.now();
const receipt = {
  importsMs: imported - began,
  acquireMs: acquired - imported,
  initMs: initialized - acquired,
  identityMs: fingerprinted - initialized,
  totalMs: fingerprinted - began,
  identity,
  peakRssKiB: process.resourceUsage().maxRSS,
};
writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt));
process.exit(0);
