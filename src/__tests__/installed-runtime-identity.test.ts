import { expect, it } from 'bun:test';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { installedRuntimeIdentity } from '../runtime-identity';

const sha = (s: string) => `sha256:${createHash('sha256').update(s).digest('hex')}`;
async function fixture(root: string) {
  await mkdir(join(root, 'dist'), { recursive: true });
  await mkdir(join(root, 'node_modules', 'geometry-runtime', 'data'), { recursive: true });
  await writeFile(
    join(root, 'package.json'),
    JSON.stringify({
      name: '@kiln/engine',
      version: '1.0.0',
      dependencies: { 'geometry-runtime': '^1' },
    }),
  );
  await writeFile(join(root, 'dist', 'evaluator-worker.mjs'), 'worker-v1');
  await writeFile(
    join(root, 'dist', 'build.json'),
    JSON.stringify({
      schemaVersion: 1,
      entries: {
        worker: {
          file: 'evaluator-worker.mjs',
          bundleHash: sha('worker-v1'),
          identity: sha('source-v1'),
        },
      },
    }),
  );
  await writeFile(
    join(root, 'node_modules', 'geometry-runtime', 'package.json'),
    JSON.stringify({ name: 'geometry-runtime', version: '1.0.0', main: 'index.js' }),
  );
  await writeFile(
    join(root, 'node_modules', 'geometry-runtime', 'index.js'),
    'export const value = 1;',
  );
  await writeFile(
    join(root, 'node_modules', 'geometry-runtime', 'data', 'kernel.wasm'),
    'kernel-v1',
  );
}

it('fingerprints installed code and native assets, not dependency ranges or installation paths', async () => {
  const a = await mkdtemp(join(tmpdir(), 'kiln-runtime-a-'));
  const b = await mkdtemp(join(tmpdir(), 'kiln-runtime-b-'));
  try {
    await fixture(a);
    await fixture(b);
    const first = await installedRuntimeIdentity(a);
    expect(first.identity).toMatch(/^sha256:/);
    expect(first.files).toBeGreaterThanOrEqual(3);
    expect((await installedRuntimeIdentity(b)).identity).toBe(first.identity);
    await writeFile(
      join(b, 'node_modules', 'geometry-runtime', 'data', 'kernel.wasm'),
      'kernel-v2',
    );
    expect((await installedRuntimeIdentity(b)).identity).not.toBe(first.identity);
    await writeFile(join(a, 'dist', 'evaluator-worker.mjs'), 'tampered-worker');
    expect((await installedRuntimeIdentity(a)).identity).toBeUndefined();
  } finally {
    await rm(a, { recursive: true, force: true });
    await rm(b, { recursive: true, force: true });
  }
});

it('fails closed for missing dependencies and bounded scan overflow', async () => {
  const root = await mkdtemp(join(tmpdir(), 'kiln-runtime-limits-'));
  try {
    await fixture(root);
    expect((await installedRuntimeIdentity(root, { maxBytes: 1 })).identity).toBeUndefined();
    expect((await installedRuntimeIdentity(root, { maxFiles: 1 })).identity).toBeUndefined();
    await writeFile(
      join(root, 'node_modules', 'geometry-runtime', 'package.json'),
      JSON.stringify({
        name: 'geometry-runtime',
        version: '1.0.0',
        main: 'index.js',
        dependencies: { missing: '1' },
      }),
    );
    const missing = await installedRuntimeIdentity(root);
    expect(missing.identity).toBeUndefined();
    expect(missing.reason).toContain('missing');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
