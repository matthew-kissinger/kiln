import { expect, it } from 'bun:test';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { FileProgramStore } from '../program-store-node';
import { ExperimentalProgramAliases } from '../experiments/program-aliases';

it('requires explicit CAS, preserves immutable source, and rejects collisions and corrupt aliases', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'kiln-alias-test-'));
  try {
    const store = new FileProgramStore(join(directory, 'programs'));
    const aliases = new ExperimentalProgramAliases(join(directory, 'aliases'), store);
    const a = await store.put('original');
    const b = await store.put('revised');
    expect(await aliases.resolve('bridge')).toBeNull();
    await aliases.compareAndSet('bridge', null, a);
    await expect(aliases.compareAndSet('bridge', null, b)).rejects.toThrow('conflict');
    await aliases.compareAndSet('bridge', a, b);
    await expect(aliases.compareAndSet('bridge', a, a)).rejects.toThrow('conflict');
    expect(await aliases.resolve('bridge')).toBe(b);
    expect(await store.get(a)).toBe('original');
    await expect(aliases.compareAndSet('../escape', null, a)).rejects.toThrow('alias');
    await mkdir(join(directory, 'aliases', 'bridge.json.lock'));
    await expect(aliases.compareAndSet('bridge', b, a)).rejects.toThrow('busy');
    expect(await aliases.resolve('bridge')).toBe(b);
    await rm(join(directory, 'aliases', 'bridge.json.lock'), { recursive: true });
    await writeFile(join(directory, 'aliases', 'bridge.json'), '{broken');
    await expect(aliases.resolve('bridge')).rejects.toThrow('corrupt');
    await expect(aliases.compareAndSet('bridge', null, a)).rejects.toThrow('corrupt');
    await expect(
      aliases.compareAndSet('missing', null, `sha256:${'0'.repeat(64)}`),
    ).rejects.toThrow('not found');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it('rejects lost updates from eight independent processes', async () => {
  const child = Bun.spawn(
    [
      process.execPath,
      join(import.meta.dir, '../../scripts/experiment-program-aliases.ts'),
      '--check',
    ],
    { stdout: 'pipe', stderr: 'pipe' },
  );
  const timer = setTimeout(() => child.kill(), 15000);
  try {
    const [code, output, error] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
    ]);
    expect(error).toBe('');
    expect(code).toBe(0);
    expect(JSON.parse(output)).toMatchObject({
      processes: 8,
      updated: 1,
      rejected: 7,
      immutableReferencesResolved: 3,
      originalSourcePreserved: true,
    });
  } finally {
    clearTimeout(timer);
  }
}, 20000);
