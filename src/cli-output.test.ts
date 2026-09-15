import { expect, it } from 'bun:test';
import {
  chmod,
  lstat,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
  mkdir,
  stat,
  symlink,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeDestinationAtomic } from './cli-output';

async function fixture(run: (directory: string) => Promise<void>) {
  const directory = await mkdtemp(join(tmpdir(), 'kiln-output-'));
  try {
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

it('creates missing parents and replaces complete output bytes', () =>
  fixture(async (directory) => {
    const path = join(directory, 'nested', 'asset.glb');
    await writeDestinationAtomic(path, 'old output with a longer tail');
    await writeDestinationAtomic(path, new Uint8Array([1, 2, 3]));
    expect(await readFile(path)).toEqual(Buffer.from([1, 2, 3]));
    expect(await readdir(join(directory, 'nested'))).toEqual(['asset.glb']);
  }));

it('preserves the previous output and cleans up after a partial write fails', () =>
  fixture(async (directory) => {
    const path = join(directory, 'asset.glb');
    await writeFile(path, 'previous output');
    const failure = new Error('write failed after some bytes');
    async function* interrupted() {
      yield Buffer.from('partial replacement');
      expect(await readFile(path, 'utf8')).toBe('previous output');
      throw failure;
    }
    await expect(writeDestinationAtomic(path, interrupted())).rejects.toBe(failure);
    expect(await readFile(path, 'utf8')).toBe('previous output');
    expect(await readdir(directory)).toEqual(['asset.glb']);
  }));

it('does not publish a new output when its write fails', () =>
  fixture(async (directory) => {
    async function* interrupted() {
      yield Buffer.from('partial');
      throw new Error('write failed');
    }
    await expect(
      writeDestinationAtomic(join(directory, 'asset.glb'), interrupted()),
    ).rejects.toThrow('write failed');
    expect(await readdir(directory)).toEqual([]);
  }));

it('preserves the destination and removes the temporary file if rename fails', () =>
  fixture(async (directory) => {
    const path = join(directory, 'asset.glb');
    await mkdir(path);
    await writeFile(join(path, 'keep'), 'previous contents');
    await expect(writeDestinationAtomic(path, 'replacement')).rejects.toThrow();
    expect(await readFile(join(path, 'keep'), 'utf8')).toBe('previous contents');
    expect(await readdir(directory)).toEqual(['asset.glb']);
  }));

it('concurrent replacements publish a complete output without sharing temporary files', () =>
  fixture(async (directory) => {
    const path = join(directory, 'asset.glb');
    const outputs = ['a'.repeat(100_000), 'b'.repeat(200_000), 'c'.repeat(300_000)];
    const results = await Promise.allSettled(
      outputs.map((output) => writeDestinationAtomic(path, output)),
    );
    expect(results.some((result) => result.status === 'fulfilled')).toBe(true);
    // Windows may reject a simultaneous replacement with a sharing violation.
    // That writer must fail safely, leaving a complete successful output.
    for (const result of results) {
      if (result.status === 'rejected') {
        expect(process.platform).toBe('win32');
        expect(['EPERM', 'EACCES', 'EBUSY']).toContain(result.reason.code);
      }
    }
    expect(outputs).toContain(await readFile(path, 'utf8'));
    expect(await readdir(directory)).toEqual(['asset.glb']);
  }));

it.skipIf(process.platform === 'win32')('preserves existing file permissions', () =>
  fixture(async (directory) => {
    const path = join(directory, 'source.js');
    await writeFile(path, 'old');
    await chmod(path, 0o640);
    await writeDestinationAtomic(path, 'new');
    expect((await stat(path)).mode & 0o777).toBe(0o640);
  }),
);

it.skipIf(process.platform === 'win32')(
  'writes through an existing symlink without replacing it',
  () =>
    fixture(async (directory) => {
      const target = join(directory, 'target.glb');
      const path = join(directory, 'link.glb');
      await writeFile(target, 'old');
      await symlink(target, path);
      await writeDestinationAtomic(path, 'new');
      expect((await lstat(path)).isSymbolicLink()).toBe(true);
      expect(await readFile(target, 'utf8')).toBe('new');
      expect((await readdir(directory)).sort()).toEqual(['link.glb', 'target.glb']);
    }),
);
