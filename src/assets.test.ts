import { afterEach, expect, test } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import {
  FileAssetLibrary,
  localAssetLibrary,
  collectionConfigPath,
  defaultUserLibraryRoot,
} from './assets-node';
import { decodeAssetBundle, encodeAssetBundle } from './assets';
import { renderGLB } from './render';
import { mkdir } from 'node:fs/promises';

const roots: string[] = [];
afterEach(async () => {
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true });
});
async function library() {
  const root = await mkdtemp(join(tmpdir(), 'kiln-assets-'));
  roots.push(root);
  return { root, store: new FileAssetLibrary({ project: root }) };
}
const source =
  "const meta = { name: 'Box', category: 'prop' }; function build() { const root = createRoot('Box'); createPart('Body', boxGeo(1, 1, 1), gameMaterial(0x88aa66), { position: [0, 0.5, 0], parent: root }); return root; }";
async function draft() {
  const rendered = await renderGLB(source);
  return {
    name: 'Box',
    code: source,
    glb: rendered.glb,
    build: { engine: 'test', options: {}, warnings: rendered.warnings },
  };
}

test('project and additional named collection locations persist in workspace configuration', async () => {
  const { root } = await library();
  const env = { KILN_PROGRAM_STORE: join(root, '.kiln', 'programs') };
  const config = collectionConfigPath(env);
  await mkdir(dirname(config), { recursive: true });
  await writeFile(
    config,
    JSON.stringify({ project: join(root, 'game'), 'my-game': join(root, 'library') }),
  );
  expect(
    localAssetLibrary(env)
      .collections()
      .map((c) => c.id),
  ).toEqual(['project', 'my-game']);
  expect(localAssetLibrary(env).directory('my-game')).toBe(join(root, 'library'));
  expect(
    localAssetLibrary({
      ...env,
      KILN_COLLECTIONS: JSON.stringify({ override: root }),
    }).collections()[0]!.id,
  ).toBe('override');
});
test('an unconfigured workspace exposes a project and a durable user library with clear labels', () => {
  const env = {
    KILN_PROGRAM_STORE: '/work/game/.kiln/programs',
    XDG_DATA_HOME: '/user/data',
  };
  const store = localAssetLibrary(env);
  expect(store.collections()).toEqual([
    { id: 'project', label: 'This project' },
    { id: 'library', label: 'Your library' },
  ]);
  expect(store.directory('project')).toBe(
    join(dirname(dirname(resolve(env.KILN_PROGRAM_STORE))), 'assets', 'kiln'),
  );
  expect(store.directory('library')).toBe(join('/user/data', 'kiln', 'library'));
  expect(defaultUserLibraryRoot(env, '/unused', 'linux')).toBe(
    join('/user/data', 'kiln', 'library'),
  );
});
test('a saved revision survives restarts, roundtrips without the source store, and detects tampering', async () => {
  const { root, store } = await library();
  const saved = await store.save('project', await draft());
  const restarted = new FileAssetLibrary({ project: root });
  const record = await restarted.read('project', saved.assetId, saved.revisionId);
  const bundle = decodeAssetBundle(encodeAssetBundle([record]));
  const other = await library();
  const imported = await other.store.import('project', bundle);
  expect(imported[0]!.revisionId).toBe(saved.revisionId);
  expect(
    (await other.store.read('project', saved.assetId, saved.revisionId)).files['source.kiln.js'],
  ).toEqual(new TextEncoder().encode(source));
  await writeFile(join(root, saved.assetId, 'revisions', saved.revisionId, 'asset.glb'), 'corrupt');
  await expect(restarted.read('project', saved.assetId, saved.revisionId)).rejects.toThrow(
    'integrity',
  );
});
test('concurrent child revisions both survive and list as branches', async () => {
  const { store } = await library();
  const input = await draft();
  const base = await store.save('project', input);
  const children = await Promise.all(
    ['red', 'blue'].map((description) =>
      store.save('project', {
        ...input,
        assetId: base.assetId,
        parentRevision: base.revisionId,
        description,
      }),
    ),
  );
  expect(children[0]!.revisionId).not.toBe(children[1]!.revisionId);
  expect((await store.list('project')).length).toBe(3);
  expect(
    (await store.read('project', base.assetId, base.revisionId)).manifest.parentRevision,
  ).toBeUndefined();
});
test('unknown roots and traversal are rejected; import is idempotent', async () => {
  const { store } = await library();
  const saved = await store.save('project', await draft());
  await expect(store.read('project', '..', saved.revisionId)).rejects.toThrow();
  await expect(store.list('unknown')).rejects.toThrow('collection');
  const record = await store.read('project', saved.assetId, saved.revisionId);
  await store.import('project', [record]);
  expect((await store.list('project')).length).toBe(1);
  const bad = { ...record, files: { ...record.files, '../outside': new Uint8Array([1]) } };
  expect(() => encodeAssetBundle([bad])).toThrow();
});
test('binary imports are collectible but never claim editable source', async () => {
  const { store } = await library();
  const input = await draft();
  const saved = await store.save('project', { name: 'External', glb: input.glb });
  expect(saved.editable).toBe(false);
  expect(saved.build).toBeUndefined();
  expect(Object.keys((await store.read('project', saved.assetId, saved.revisionId)).files)).toEqual(
    ['asset.glb'],
  );
  await expect(
    store.save('project', { name: 'Invalid', glb: new Uint8Array([0]) }),
  ).rejects.toThrow('GLB');
});
