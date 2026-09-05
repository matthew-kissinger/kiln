import { afterEach, describe, expect, it } from 'bun:test';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  assertProgramRef,
  MemoryProgramStore,
  programReference,
  retainProgram,
  type ProgramStore,
} from '../program-store';
import { FileProgramStore } from '../program-store-node';

const directories: string[] = [];
afterEach(async () => {
  for (const directory of directories.splice(0))
    await rm(directory, { recursive: true, force: true });
});
async function fileStore() {
  const directory = await mkdtemp(join(tmpdir(), 'kiln-short-refs-'));
  directories.push(directory);
  return new FileProgramStore(directory);
}

describe('immutable short program references', () => {
  it('keeps canonical puts and returns stable registered memory handles', async () => {
    const store = new MemoryProgramStore();
    const canonical = await store.put('const dimension = 2;');
    expect(canonical).toBe(await programReference('const dimension = 2;'));
    const handle = await store.shortRef(canonical);
    expect(handle).toBe(`p_${canonical.slice(7, 19)}`);
    expect(await store.shortRef(canonical)).toBe(handle);
    expect(await store.get(handle)).toBe(await store.get(canonical));
    const revision = await retainProgram(store, 'const dimension = 3;');
    expect(revision).not.toBe(handle);
    expect(await store.get(handle)).toBe('const dimension = 2;');
    expect((await store.stats()).entries).toBe(2);
  });

  it('does not resolve an unregistered hash prefix or mint a missing source', async () => {
    const store = new MemoryProgramStore();
    const canonical = await store.put('retained');
    await expect(store.get(`p_${canonical.slice(7, 19)}`)).rejects.toThrow('Program not found');
    await expect(store.shortRef(await programReference('missing'))).rejects.toThrow(
      'Program not found',
    );
  });

  it('retainProgram supports hosts that only implement canonical storage', async () => {
    const memory = new MemoryProgramStore();
    const store: ProgramStore = { put: (code) => memory.put(code), get: (ref) => memory.get(ref) };
    expect(await retainProgram(store, 'legacy host')).toBe(await programReference('legacy host'));
  });

  it('accepts only full hashes or bounded lowercase handles', () => {
    for (const length of [12, 16, 20, 64])
      expect(() => assertProgramRef(`p_${'a'.repeat(length)}`)).not.toThrow();
    for (const ref of [
      'p_abc',
      `p_${'a'.repeat(13)}`,
      `p_${'a'.repeat(68)}`,
      `p_${'A'.repeat(12)}`,
      'p_../../secret',
      `sha256:${'a'.repeat(12)}`,
      `p_${'a'.repeat(12)}\n`,
    ])
      expect(() => assertProgramRef(ref)).toThrow('Invalid program reference');
  });

  it('persists handles across restart and lazily registers older full-hash files', async () => {
    const store = await fileStore();
    const canonical = await store.put('legacy snapshot');
    const handle = `p_${canonical.slice(7, 19)}`;
    await expect(store.get(handle)).rejects.toThrow('Program not found');
    expect(await store.shortRef(canonical)).toBe(handle);
    const restarted = new FileProgramStore(store.directory);
    expect(await restarted.get(handle)).toBe('legacy snapshot');
    expect(await restarted.get(canonical)).toBe('legacy snapshot');
    expect(await restarted.shortRef(canonical)).toBe(handle);
    expect(await restarted.shortRef(handle)).toBe(handle);
    await expect(restarted.get(`p_${canonical.slice(7, 23)}`)).rejects.toThrow('Program not found');
    expect(await readFile(join(store.directory, 'refs', `${handle}.ref`), 'utf8')).toBe(canonical);
    expect((await restarted.stats()).entries).toBe(1);
  });

  it('extends a colliding handle without replacing its original mapping', async () => {
    const store = await fileStore();
    const canonical = await store.put('collision candidate');
    const handle = `p_${canonical.slice(7, 19)}`;
    const collision = `${canonical.slice(0, -1)}${canonical.endsWith('0') ? '1' : '0'}`;
    await mkdir(join(store.directory, 'refs'));
    const mapping = join(store.directory, 'refs', `${handle}.ref`);
    await writeFile(mapping, collision);
    const extended = await store.shortRef(canonical);
    expect(extended).toBe(`p_${canonical.slice(7, 23)}`);
    expect(await readFile(mapping, 'utf8')).toBe(collision);
    expect(await new FileProgramStore(store.directory).shortRef(canonical)).toBe(extended);
    expect(await store.get(extended)).toBe('collision candidate');
  });

  it('independent file-store instances publish one stable handle concurrently', async () => {
    const store = await fileStore();
    const handles = await Promise.all(
      Array.from({ length: 8 }, () =>
        retainProgram(new FileProgramStore(store.directory), 'concurrent source'),
      ),
    );
    expect(new Set(handles).size).toBe(1);
    expect(await store.get(handles[0]!)).toBe('concurrent source');
  });

  it('extends only through the bounded canonical digest when shorter candidates are occupied', async () => {
    const store = await fileStore();
    const canonical = await store.put('maximum extension');
    const collision = `${canonical.slice(0, -1)}${canonical.endsWith('0') ? '1' : '0'}`;
    await mkdir(join(store.directory, 'refs'));
    for (let length = 12; length < 64; length += 4)
      await writeFile(
        join(store.directory, 'refs', `p_${canonical.slice(7, 7 + length)}.ref`),
        collision,
      );
    const handle = await store.shortRef(canonical);
    expect(handle).toBe(`p_${canonical.slice(7)}`);
    expect(await store.get(handle)).toBe('maximum extension');
    expect(await new FileProgramStore(store.directory).shortRef(canonical)).toBe(handle);
  });

  it('rejects malformed mappings and changed source bytes without overwriting them', async () => {
    const store = await fileStore();
    const canonical = await store.put('integrity source');
    const handle = await store.shortRef(canonical);
    const mapping = join(store.directory, 'refs', `${handle}.ref`);
    for (const invalid of [
      '../../outside.js',
      await programReference('unrelated'),
      'x'.repeat(1024),
    ]) {
      await writeFile(mapping, invalid);
      await expect(store.get(handle)).rejects.toThrow('integrity');
      await expect(store.shortRef(canonical)).rejects.toThrow('integrity');
      expect(await readFile(mapping, 'utf8')).toBe(invalid);
    }
    await writeFile(mapping, canonical);
    await writeFile(join(store.directory, `${canonical.slice(7)}.js`), 'changed bytes');
    await expect(store.get(handle)).rejects.toThrow('integrity');
  });
});
