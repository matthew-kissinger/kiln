import { expect, it } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { MemoryProgramStore, MAX_PROGRAM_BYTES } from '../program-store';
import { FileProgramStore } from '../program-store-node';

it('reports deduplicated UTF-8 memory usage, limits and no eviction', async () => {
  const store = new MemoryProgramStore(6);
  expect(await store.stats()).toEqual({
    entries: 0,
    bytes: 0,
    maxSourceBytes: MAX_PROGRAM_BYTES,
    maxBytes: 6,
    eviction: 'none',
  });
  const ref = await store.put('é');
  await store.put('é');
  await store.put('abc');
  await expect(store.put('xx')).rejects.toThrow('full');
  expect(await store.stats()).toMatchObject({ entries: 2, bytes: 5 });
  expect(await store.get(ref)).toBe('é');
});
it('reports only persisted source files across file-store instances and ignores temporary files', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'kiln-store-stats-'));
  try {
    const store = new FileProgramStore(join(directory, 'programs'));
    expect(await store.stats()).toEqual({
      entries: 0,
      bytes: 0,
      maxSourceBytes: MAX_PROGRAM_BYTES,
      eviction: 'none',
    });
    const ref = await store.put('abc');
    await store.put('abc');
    await store.put('defg');
    await writeFile(join(store.directory, '.write-ignored'), 'temporary');
    expect(await new FileProgramStore(store.directory).stats()).toEqual({
      entries: 2,
      bytes: 7,
      maxSourceBytes: MAX_PROGRAM_BYTES,
      eviction: 'none',
    });
    expect(await store.get(ref)).toBe('abc');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
