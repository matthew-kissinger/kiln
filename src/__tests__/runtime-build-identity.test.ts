import { expect, it } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runtimeBuildIdentity } from '../../scripts/build-runtime.mjs';

it('derives reproducible runtime identity from source and lockfile rather than test edits or timestamps', async () => {
  const root = await mkdtemp(join(tmpdir(), 'kiln-build-identity-'));
  try {
    await mkdir(join(root, 'src'));
    await writeFile(
      join(root, 'package.json'),
      JSON.stringify({ name: '@kiln/engine', version: '1.0.0', packageManager: 'bun@1.3.14' }),
    );
    await writeFile(join(root, 'bun.lock'), 'dependency-lock');
    await writeFile(join(root, 'src/a.ts'), 'export const n = 1;');
    const a = await runtimeBuildIdentity(root);
    expect(await runtimeBuildIdentity(root)).toEqual(a);
    await writeFile(join(root, 'src/a.test.ts'), 'a new assertion');
    expect(await runtimeBuildIdentity(root)).toEqual(a);
    await writeFile(join(root, 'src/a.ts'), 'export const n = 2;');
    expect((await runtimeBuildIdentity(root)).identity).not.toBe(a.identity);
    await writeFile(join(root, 'src/a.ts'), 'export const n = 1;');
    await writeFile(join(root, 'bun.lock'), 'changed dependency');
    expect((await runtimeBuildIdentity(root)).identity).not.toBe(a.identity);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
