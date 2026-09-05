import { expect, it } from 'bun:test';
import { mkdtemp, mkdir, rm, symlink, writeFile, copyFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
it('executes a Node CLI symlink once and stays inert when imported', async () => {
  const base = resolve(import.meta.dir, '../../tmp');
  await mkdir(base, { recursive: true });
  const directory = await mkdtemp(join(base, 'cli-entry-'));
  try {
    const runtime = join(directory, 'runtime');
    await mkdir(runtime);
    const bundle = join(runtime, 'cli.mjs');
    const result = await Bun.build({
      entrypoints: [resolve(import.meta.dir, '../cli.ts')],
      target: 'node',
      packages: 'external',
      outdir: runtime,
      naming: 'cli.mjs',
    });
    expect(result.success).toBe(true);
    let alias = join(directory, 'kiln');
    if (process.platform === 'win32') {
      const linkedDirectory = join(directory, 'bin');
      await symlink(runtime, linkedDirectory, 'junction');
      alias = join(linkedDirectory, 'cli.mjs');
    } else await symlink(bundle, alias, 'file');
    const run = (path: string) =>
      Bun.spawnSync(['node', path, '--help'], { stdout: 'pipe', stderr: 'pipe' });
    const direct = run(bundle),
      linked = run(alias);
    expect(direct.exitCode).toBe(0);
    expect(direct.stdout.toString()).toContain('kiln render');
    expect(linked.exitCode).toBe(0);
    expect(linked.stdout.toString()).toBe(direct.stdout.toString());
    const setup = join(runtime, 'create-workspace.mjs');
    await copyFile(resolve(import.meta.dir, '../../scripts/create-workspace.mjs'), setup);
    let setupAlias = join(directory, 'kiln-init');
    if (process.platform === 'win32') setupAlias = join(directory, 'bin/create-workspace.mjs');
    else await symlink(setup, setupAlias, 'file');
    const directSetup = run(setup),
      linkedSetup = run(setupAlias);
    expect(directSetup.stdout.toString()).toContain('Usage: kiln-init');
    expect(linkedSetup.exitCode).toBe(0);
    expect(linkedSetup.stdout.toString()).toBe(directSetup.stdout.toString());
    const importer = join(directory, 'import.mjs');
    await writeFile(
      importer,
      `await import(${JSON.stringify(pathToFileURL(bundle).href)});await import(${JSON.stringify(pathToFileURL(setup).href)});console.log('IMPORTED_ONLY');`,
    );
    const imported = run(importer);
    expect(imported.exitCode).toBe(0);
    expect(imported.stdout.toString().trim()).toBe('IMPORTED_ONLY');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 20000);
