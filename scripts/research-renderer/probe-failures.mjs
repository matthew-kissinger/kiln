// Failure injection is explicitly simulated, not evidence from driverless hardware.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [serviceDir, output] = process.argv.slice(2);
const work = mkdtempSync(join(tmpdir(), 'kiln-renderer-failures-'));
const failures = [];
for (const scenario of ['no-adapter', 'software-adapter', 'request-device-rejected']) {
  const dir = join(work, scenario);
  mkdirSync(dir);
  const adapter =
    scenario === 'no-adapter'
      ? 'null'
      : scenario === 'software-adapter'
        ? '{ info: { description: "Microsoft Basic Render Driver" } }'
        : '{ info: { description: "injected hardware" }, features: [], requestDevice: async () => { throw new Error("injected driver initialization failure"); } }';
  writeFileSync(
    join(dir, 'webgpu.mjs'),
    `export const globals = {}; export const create = () => ({ requestAdapter: async () => (${adapter}) });\n`,
  );
  writeFileSync(
    join(dir, 'hooks.mjs'),
    `export function resolve(specifier, context, next) { if (specifier === 'webgpu') return { url: ${JSON.stringify(pathToFileURL(join(dir, 'webgpu.mjs')).href)}, shortCircuit: true }; if (specifier === 'three') return next('three/webgpu', context); return next(specifier, context); }\n`,
  );
  writeFileSync(
    join(dir, 'register.mjs'),
    `import { register } from 'node:module'; register('./hooks.mjs', import.meta.url);\n`,
  );
  const began = performance.now();
  const result = spawnSync(
    process.execPath,
    ['--import', pathToFileURL(join(dir, 'register.mjs')).href, join(serviceDir, 'src/server.mjs')],
    {
      windowsHide: true,
      encoding: 'utf8',
      timeout: 15_000,
      env: {
        ...process.env,
        PORT: '0',
        HOST: '127.0.0.1',
        RENDER_SERVICE_TOKEN: '',
        RENDER_SERVICE_ALLOW_UNAUTHENTICATED: '',
        RENDER_SERVICE_OWNER_PID: '',
      },
    },
  );
  failures.push({
    scenario,
    simulated: true,
    code: result.status,
    signal: result.signal,
    ms: performance.now() - began,
    stdout: result.stdout,
    stderr: result.stderr,
    neverListened: !result.stdout.includes('listening on'),
  });
}
writeFileSync(
  output,
  `${JSON.stringify({ scope: 'injected WebGPU provider, unchanged service source', failures }, null, 2)}\n`,
);
console.log(
  JSON.stringify({
    receipt: output,
    allFailClosed: failures.every((failure) => failure.code === 1 && failure.neverListened),
  }),
);
