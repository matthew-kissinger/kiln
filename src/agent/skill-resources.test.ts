import { afterEach, expect, test } from 'bun:test';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { loadNativeSkills } from './skill-resources';

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});
async function fixture() {
  const temporary = await mkdtemp(join(tmpdir(), 'kiln-native-skills-'));
  roots.push(temporary);
  const root = join(temporary, 'test-skill');
  await mkdir(join(root, 'references'), { recursive: true });
  await writeFile(
    join(root, 'SKILL.md'),
    '---\nname: test-skill\ndescription: Test the native skill reader.\n---\nRead references/example.md.',
  );
  await writeFile(join(root, 'references/example.md'), 'abcdefghij');
  return root;
}
const page = { skill: 'test-skill', path: 'references/example.md', offset: 0, limit: 4 };

test('workspace workflow instructions do not enter native activation; technical references remain shared', async () => {
  const root = await fixture();
  await writeFile(
    join(root, 'SKILL.md'),
    '---\nname: test-skill\ndescription: Workspace workflow.\nmetadata:\n  kiln-workflow: workspace\n  kiln-shared-references: references/example.md\n---\nEXTERNAL_ONLY_START_SHELL_AND_SAVE',
  );
  await writeFile(join(root, 'references/workspace.md'), 'START_A_SHELL_AND_SAVE');
  const loaded = await loadNativeSkills(root);
  expect(loaded.skills.map((s) => s.name)).toEqual(['kiln-modeling-references']);
  expect(JSON.stringify(loaded.skills)).not.toContain('EXTERNAL_ONLY_START_SHELL_AND_SAVE');
  expect(loaded.read(page)).toMatchObject({ text: 'abcd' });
  expect(() => loaded.read({ ...page, path: 'references/workspace.md' })).toThrow(
    /Unknown skill reference/,
  );
  expect(JSON.stringify(loaded.read({ ...page, path: undefined }))).not.toContain('workspace.md');
});

test('native references are immutable, paged snapshots with stable hashes', async () => {
  const root = await fixture();
  const { read, skills } = await loadNativeSkills(join(root, 'SKILL.md'));
  expect(skills[0]?.name).toBe('test-skill');
  await writeFile(join(root, 'references/example.md'), 'changed');
  const first = read(page);
  expect(first).toMatchObject({
    text: 'abcd',
    offset: 0,
    nextOffset: 4,
    bytes: 10,
    characters: 10,
  });
  expect(read({ ...page, offset: 8 })).toMatchObject({ text: 'ij', nextOffset: null });
  expect(read({ ...page, path: undefined })).toMatchObject({
    resources: [
      { path: page.path, bytes: 10, sha256: expect.stringMatching(/^sha256:[a-f0-9]{64}$/) },
    ],
  });
  expect(read(page)).toEqual(first);
});

test('maintained workspace skills expose only declared technical files to the native harness', async () => {
  const loaded = await loadNativeSkills(fileURLToPath(new URL('../../skills', import.meta.url)));
  expect(loaded.skills.map((skill) => skill.name)).toEqual(['kiln-modeling-references']);
  for (const skill of ['kiln-author-asset', 'kiln-refine-asset']) {
    const listing = loaded.read({ skill, offset: 0, limit: 16000 }) as {
      resources: { path: string }[];
    };
    expect(listing.resources.length).toBeGreaterThan(0);
    for (const { path } of listing.resources) {
      const file = loaded.read({ skill, path, offset: 0, limit: 256 * 1024 }) as { text: string };
      expect(file.text).not.toMatch(
        /node kiln\.mjs|kiln_save|kiln_finish|kiln_present|launch.*terminal/i,
      );
    }
  }
  expect(() =>
    loaded.read({
      skill: 'kiln-author-asset',
      path: 'references/camera-cli.md',
      offset: 0,
      limit: 100,
    }),
  ).toThrow(/Unknown skill reference/);
});

test('missing declared technical references fail instead of silently reducing context', async () => {
  const root = await fixture();
  await writeFile(
    join(root, 'SKILL.md'),
    '---\nname: test-skill\ndescription: Workspace workflow.\nmetadata:\n  kiln-workflow: workspace\n  kiln-shared-references: references/missing.md\n---\nInstructions.',
  );
  await expect(loadNativeSkills(root)).rejects.toThrow(/Shared technical reference is unavailable/);
});

test('model requests cannot traverse paths or select unconfigured skills', async () => {
  const { read } = await loadNativeSkills(await fixture());
  for (const path of ['../SKILL.md', 'references/../SKILL.md', 'C:/secret', '/etc/passwd'])
    expect(() => read({ ...page, path })).toThrow(/Unknown skill reference/);
  expect(() => read({ ...page, skill: 'unknown' })).toThrow(/Unknown configured skill/);
  expect(() => read({ ...page, offset: 11 })).toThrow(/offset exceeds/);
});

test('oversized and invalid UTF-8 references fail during host preflight', async () => {
  const root = await fixture();
  await writeFile(join(root, page.path), Buffer.alloc(256 * 1024 + 1, 65));
  await expect(loadNativeSkills(root)).rejects.toThrow(/limit/);
  await writeFile(join(root, page.path), Buffer.from([0xff]));
  await expect(loadNativeSkills(root)).rejects.toThrow();
});

test('aggregate bytes, file counts, directory counts and nesting are bounded', async () => {
  const bytes = await fixture();
  for (let i = 0; i < 5; i++)
    await writeFile(join(bytes, `references/large-${i}.md`), 'a'.repeat(240 * 1024));
  await expect(loadNativeSkills(bytes)).rejects.toThrow(/limit/);
  const files = await fixture();
  for (let i = 0; i < 128; i++) await writeFile(join(files, `references/small-${i}.md`), 'a');
  await expect(loadNativeSkills(files)).rejects.toThrow(/128/);
  const nested = await fixture();
  await mkdir(join(nested, 'references', ...Array(10).fill('deep')), { recursive: true });
  await expect(loadNativeSkills(nested)).rejects.toThrow(/8-level/);
});

test('symlinked reference directories are rejected', async () => {
  const root = await fixture();
  const outside = await fixture();
  await symlink(
    join(outside, 'references'),
    join(root, 'references/linked'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  await expect(loadNativeSkills(root)).rejects.toThrow(/Symlinked/);
});

test('SDK-invalid names, empty directories and URLs fail explicitly', async () => {
  const root = await fixture();
  await mkdir(join(root, 'nested'));
  await writeFile(
    join(root, 'nested/SKILL.md'),
    '---\nname: test-skill\ndescription: Duplicate fixture.\n---\nInstructions.',
  );
  await mkdir(join(root, 'original'));
  await writeFile(
    join(root, 'original/SKILL.md'),
    '---\nname: test-skill\ndescription: Original fixture.\n---\nInstructions.',
  );
  await rm(join(root, 'SKILL.md'));
  await expect(loadNativeSkills(root)).rejects.toThrow(/does not match/);
  await expect(loadNativeSkills(join(root, 'references'))).rejects.toThrow(/No valid/);
  await expect(loadNativeSkills('https://example.com/skill')).rejects.toThrow(/local/);
});
