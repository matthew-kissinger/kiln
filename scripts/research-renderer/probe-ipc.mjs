// Minimal real-GPU IPC control. It is deliberately not a second product protocol.
import { fork } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { register } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const [mode, serviceDir, fixture, output] = process.argv.slice(2);
if (mode === 'worker') {
  register(pathToFileURL(join(serviceDir, 'src/three-alias-hooks.mjs')));
  const { acquireGpu } = await import(pathToFileURL(join(serviceDir, 'src/gpu.mjs')));
  const { renderGlb } = await import(pathToFileURL(join(serviceDir, 'src/renderer.mjs')));
  const gpu = await acquireGpu();
  process.send({ ready: true, rendererId: gpu.rendererId });
  process.on('message', async ({ glb }) => {
    try {
      const result = await renderGlb(Buffer.from(glb, 'base64'), {
        size: 128,
        viewDirs: [[1, 0.35, 1]],
      });
      const png = result.views[0];
      process.send({
        pngBytes: png.length,
        pngSha256: createHash('sha256').update(png).digest('hex'),
        peakRssKiB: process.resourceUsage().maxRSS,
      });
    } catch (error) {
      process.send({ error: error.message });
    }
  });
} else {
  const started = performance.now();
  const worker = fork(fileURLToPath(import.meta.url), ['worker', serviceDir], {
    silent: true,
    windowsHide: true,
  });
  let stderr = '';
  worker.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  const message = () =>
    new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('IPC response timeout')), 60_000);
      worker.once('message', (value) => {
        clearTimeout(timeout);
        resolve(value);
      });
    });
  const receipt = {
    boundary: 'child IPC',
    node: process.version,
    parentGpuGlobalBefore: Boolean(globalThis.navigator?.gpu),
  };
  try {
    receipt.ready = await message();
    receipt.readyMs = performance.now() - started;
    receipt.renders = [];
    for (let index = 0; index < 2; index++) {
      const began = performance.now();
      const pending = message();
      worker.send({ glb: readFileSync(fixture).toString('base64') });
      receipt.renders.push({ ...(await pending), ms: performance.now() - began });
    }
    receipt.parentGpuGlobalAfter = Boolean(globalThis.navigator?.gpu);
  } catch (error) {
    receipt.error = error.message;
    process.exitCode = 1;
  } finally {
    worker.kill();
    receipt.stderr = stderr;
    writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
    console.log(JSON.stringify({ receipt: output, error: receipt.error }));
  }
}
