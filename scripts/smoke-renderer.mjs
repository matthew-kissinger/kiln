// Real renderer qualification for an installed candidate. No model or public service.
// Resolves the candidate's own renderer hooks, including paths with spaces/Unicode.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [installationArg, outputArg, expected = 'hardware'] = process.argv.slice(2);
assert(
  installationArg && outputArg && ['hardware', 'software'].includes(expected),
  'Usage: smoke-renderer.mjs INSTALLATION OUTPUT_DIRECTORY [hardware|software]',
);
const installation = resolve(installationArg),
  output = resolve(outputArg);
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const receipt = {
  version: 'kiln.renderer-qualification.v1',
  expected,
  installation,
  node: process.version,
  platform: process.platform,
  arch: process.arch,
  status: 'running',
  views: [],
};
await mkdir(output, { recursive: true });
try {
  const source = `function build(){const root=createRoot('Root');
    const albedo=proceduralTexture({schemaVersion:2,size:32,usage:'albedo',layers:[{op:'checker',colorA:0xcc2211,colorB:0x22bb33,squares:4}]});
    createPart('Textured',boxGeo(1,1,1),pbrMaterial({albedo,roughness:0.7,metalness:0.1}),{parent:root});
    createPart('Blue',sphereGeo(0.35),pbrMaterial({albedo:0x2233dd,roughness:0.25,metalness:0.4}),{parent:root,position:[0,0.2,0.85]});return root;}`;
  const file = join(output, 'fixture.kiln.js'),
    glbPath = join(output, 'fixture.glb');
  await writeFile(file, source);
  const build = spawnSync(
    process.execPath,
    [
      join(installation, 'dist/cli.mjs'),
      'render',
      file,
      '--out',
      glbPath,
      '--render',
      'cpu',
      '--json',
    ],
    {
      cwd: output,
      windowsHide: true,
      encoding: 'utf8',
      timeout: 120000,
      env: { ...process.env, KILN_RENDER: 'cpu' },
    },
  );
  assert.equal(build.status, 0, build.stderr || build.stdout);
  await writeFile(join(output, 'build.json'), build.stdout);
  const glb = await readFile(glbPath);
  receipt.inputGlbSha256 = sha(glb);
  await import(pathToFileURL(join(installation, 'render-service/src/register-hooks.mjs')).href);
  const moduleUrl = pathToFileURL(join(installation, 'render-service/src/renderer.mjs')).href;
  const { initRenderer, renderGlb } = await import(moduleUrl);
  const gpu = await import(pathToFileURL(join(installation, 'render-service/src/gpu.mjs')).href);
  await initRenderer({ allowSoftware: expected === 'software' });
  const device = await gpu.acquireGpu();
  assert.equal(
    device.software,
    expected === 'software',
    'Adapter class differs from requested qualification',
  );
  receipt.adapter = device.summary;
  receipt.backend = device.backend;
  receipt.rendererId = device.rendererId;
  receipt.software = device.software;
  const require = createRequire(pathToFileURL(join(installation, 'package.json')));
  const { PNG } = require('pngjs');
  for (const backdrop of ['neutral', 'dark', 'light']) {
    const result = await renderGlb(glb, {
      size: 128,
      viewDirs: [
        [1, 0.4, 1],
        [0, 0, 1],
      ],
      backdrop,
    });
    assert.equal(result.views.length, 2);
    for (const [index, bytes] of result.views.entries()) {
      const image = PNG.sync.read(Buffer.from(bytes));
      assert.equal(image.width, 128);
      assert.equal(image.height, 128);
      let red = 0,
        green = 0;
      for (let n = 0; n < image.data.length; n += 4) {
        const [r, g, b] = image.data.subarray(n, n + 3);
        // Lit PBR colours can be pastel. Require hue separation rather than a
        // saturation ratio that rejects a correctly illuminated checkerboard.
        if (r > g + 12 && r > b + 12) red++;
        if (g > r + 12 && g > b + 12) green++;
      }
      const name = `${backdrop}-${index}.png`;
      await writeFile(join(output, name), bytes);
      receipt.views.push({ name, sha256: sha(bytes), red, green, timings: result.timings });
      assert(red > 20 && green > 20, 'Textured view lost expected red/green material evidence');
    }
  }
  receipt.status = 'passed';
  gpu.markGpuShutdown();
  device.device.destroy();
} catch (error) {
  receipt.status = 'failed';
  receipt.error = error.stack ?? String(error);
}
await writeFile(join(output, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt));
// Dawn retains process resources after device destruction; this is a one-shot probe.
process.exit(receipt.status === 'passed' ? 0 : 1);
