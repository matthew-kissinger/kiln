import { expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { decodeAssetBundle } from './assets';

test('CLI saves, exports, imports, and restores a revision across independent stores', async () => {
  const root = await mkdtemp(join(tmpdir(), 'kiln-asset-cli-'));
  const cli = resolve('src/cli.ts');
  const run = (workspace: string, args: string[]) =>
    spawnSync(process.execPath, [cli, ...args], {
      cwd: root,
      env: {
        ...process.env,
        KILN_RENDER: 'cpu',
        KILN_EVALUATOR_MODE: 'in-process',
        KILN_PROGRAM_STORE: join(root, workspace, '.kiln', 'programs'),
        KILN_COLLECTIONS: JSON.stringify({ project: join(root, workspace, 'collection') }),
      },
      encoding: 'utf8',
      windowsHide: true,
    });
  try {
    const saved = run('first', [
      'save',
      resolve('examples/crate.kiln.js'),
      '--name',
      'Crate',
      '--render',
      'cpu',
    ]);
    expect(saved.status).toBe(0);
    const asset = JSON.parse(saved.stdout).asset;
    const file = join(root, 'crate.zip');
    expect(run('first', ['export', asset.assetId, asset.revisionId, '--out', file]).status).toBe(0);
    expect(run('first', ['export', asset.assetId, asset.revisionId, '--out', file]).status).toBe(1);
    expect(decodeAssetBundle(new Uint8Array(await readFile(file)))[0]!.manifest.revisionId).toBe(
      asset.revisionId,
    );
    expect(run('second', ['import', file]).status).toBe(0);
    const restored = run('second', ['asset', asset.assetId, asset.revisionId, '--restore']);
    expect(restored.status).toBe(0);
    expect(JSON.parse(restored.stdout).programRef).toMatch(/^p_/);
    expect(run('second', ['import', file]).status).toBe(0);
    expect(JSON.parse(run('second', ['assets']).stdout).assets.length).toBe(1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);
