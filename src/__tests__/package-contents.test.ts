import { expect, it } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

it('declares Node commands and the files needed by an installed workspace', async () => {
  const pkg = JSON.parse(await readFile(resolve(import.meta.dir, '../../package.json'), 'utf8'));
  expect(pkg.private).toBe(true);
  expect(pkg.bin.kiln).toBe('./dist/cli.mjs');
  expect(pkg.bin['kiln-init']).toBe('./scripts/create-workspace.mjs');
  for (const path of [
    'dist/*.mjs',
    'scripts/create-workspace.mjs',
    'skills/',
    'docs/',
    'src/**/*.mjs',
    'plugin.json',
    '.claude-plugin/',
  ]) {
    expect(pkg.files).toContain(path);
  }
  for (const [name, file] of Object.entries({
    './geometry': './src/geometry.ts',
    './deform': './src/deform.ts',
    './sweep': './src/sweep.ts',
    './implicit': './src/implicit.ts',
    './programs': './src/program-store.ts',
    './programs/node': './src/program-store-node.ts',
    './cache': './src/build-cache.ts',
    './cache/node': './src/build-cache-node.ts',
  })) {
    expect(pkg.exports[name]).toBe(file);
    expect(
      (await readFile(resolve(import.meta.dir, '../..', file), 'utf8')).length,
    ).toBeGreaterThan(0);
  }
});
