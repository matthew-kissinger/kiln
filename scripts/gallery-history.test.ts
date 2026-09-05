import { afterAll, describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { buildExampleHistory } from '../site/scripts/history.mjs';

const prefix = join(tmpdir(), 'kiln-gallery-history-');
const workspace = await mkdtemp(prefix);
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const initial = 'const shelfHeight = 0.2;\n';
const current = 'const shelfHeight = 0.35;\n';
const record = () => ({
  version: 1,
  currentSourceHash: hash(current),
  brief: { kind: 'summary', text: 'Make a workbench with a lower shelf.' },
  revisions: [
    { title: 'First draft', description: 'Initial shelf position.', file: 'initial.kiln.js', sourceHash: hash(initial) },
    { title: 'Raised shelf', description: 'Only the shelf height changed.', file: 'current.kiln.js', sourceHash: hash(current) },
  ],
});

async function fixture(name: string, value: unknown = record()) {
  const input = join(workspace, name, 'input');
  const output = join(workspace, name, 'output');
  await mkdir(input, { recursive: true });
  await writeFile(join(input, 'history.json'), JSON.stringify(value));
  await writeFile(join(input, 'initial.kiln.js'), initial);
  await writeFile(join(input, 'current.kiln.js'), current);
  return { input, output };
}

afterAll(async () => {
  if (!resolve(workspace).startsWith(resolve(prefix))) throw new Error('Unsafe test cleanup path');
  await rm(workspace, { recursive: true, force: true });
});

describe('published example history', () => {
  test('copies exact revisions and identifies the displayed source, rather than assuming the last entry', async () => {
    const value = record();
    value.revisions.reverse();
    const { input, output } = await fixture('valid', value);
    const result = await buildExampleHistory('workbench', current, input, output);
    expect(result?.brief).toEqual(value.brief);
    expect(result?.revisions.map((entry: { current: boolean }) => entry.current)).toEqual([true, false]);
    expect(result?.revisions[1].source).toBe('assets/history/workbench/initial.kiln.js');
    expect(await readFile(join(output, 'history/workbench/initial.kiln.js'), 'utf8')).toBe(initial);
    expect(await readFile(join(output, 'history/workbench/current.kiln.js'), 'utf8')).toBe(current);
  });

  test('missing historical records stay unknown', async () => {
    expect(await buildExampleHistory('workbench', current, join(workspace, 'missing'), join(workspace, 'unused'))).toBeUndefined();
  });

  test('rejects attribution for a different displayed source', async () => {
    const { input, output } = await fixture('stale-current');
    await expect(buildExampleHistory('workbench', 'changed source', input, output)).rejects.toThrow('displayed source');
  });

  test('rejects changed snapshot bytes before publishing any history files', async () => {
    const { input, output } = await fixture('stale-revision');
    await writeFile(join(input, 'current.kiln.js'), 'changed source');
    await expect(buildExampleHistory('workbench', current, input, output)).rejects.toThrow('snapshot hash');
    await expect(readFile(join(output, 'history/workbench/initial.kiln.js'))).rejects.toThrow();
  });

  test('does not expose files outside the recorded snapshot directory', async () => {
    const value = record();
    value.revisions[0]!.file = '../private.kiln.js';
    const { input, output } = await fixture('unsafe', value);
    await expect(buildExampleHistory('workbench', current, input, output)).rejects.toThrow('snapshot filename');
  });

  test('requires the displayed revision to be represented', async () => {
    const value = record();
    value.revisions.pop();
    const { input, output } = await fixture('no-current', value);
    await expect(buildExampleHistory('workbench', current, input, output)).rejects.toThrow('displayed revision');
  });
});
