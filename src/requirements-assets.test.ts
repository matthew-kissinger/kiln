import { expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FileAssetLibrary } from './assets-node';
import { MemoryProgramStore, programReference } from './program-store';
import { createAssetRequirementsStore } from './requirements-store';
import { createAssetRequirementsV1 } from './contracts/requirements';
import { createKilnProgramToolRegistry } from './tools/registry';

const code = `const meta={name:'Saved'};function build(){const r=createRoot('Saved');createPart('Body',boxGeo(1,1,1),gameMaterial('#777777'),{parent:r});return r;}`;

test('saved requirements survive restart and require current host authority before restore or revision', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'kiln-requirements-assets-'));
  try {
    const assetLibrary = new FileAssetLibrary({ project: directory });
    const store = createAssetRequirementsStore();
    const key = { taskId: 'authoring', lineageId: 'arena' };
    const binding = store.host.bind(key, createAssetRequirementsV1({ labels: ['arena'] }), {
      actor: 'owner',
      reason: 'Requested asset',
      source: 'brief',
    });
    const programStore = new MemoryProgramStore();
    const programRef = await programStore.put(code);
    const tools = createKilnProgramToolRegistry({
      assetLibrary,
      programStore,
      requirements: binding,
    });
    const saved = (await tools
      .find((t) => t.name === 'kiln_save')!
      .run({ programRef, name: 'Arena' })) as { asset: { assetId: string; revisionId: string } };
    const record = await assetLibrary.read('project', saved.asset.assetId, saved.asset.revisionId);
    expect(record.manifest.build!.options.requirementsCheckpoint).toEqual({
      kind: 'kiln.requirements-checkpoint.v1',
      programRef: await programReference(code),
      binding,
    });
    const freshStore = new MemoryProgramStore();
    const neutral = createKilnProgramToolRegistry({ assetLibrary, programStore: freshStore });
    const restoreInput = { action: 'restore', ...saved.asset };
    await expect(neutral.find((t) => t.name === 'kiln_assets')!.run(restoreInput)).rejects.toThrow(
      'host binding',
    );
    expect((await freshStore.stats()).entries).toBe(0);
    await freshStore.put(code);
    await expect(
      neutral
        .find((t) => t.name === 'kiln_save')!
        .run({
          programRef,
          name: 'Arena',
          assetId: saved.asset.assetId,
          parentRevision: saved.asset.revisionId,
        }),
    ).rejects.toThrow('host binding');
    expect((await assetLibrary.list('project')).length).toBe(1);

    const restoredHost = createAssetRequirementsStore();
    const restoredBinding = restoredHost.host.restore(binding, {
      actor: 'owner',
      reason: 'Resume asset',
      source: 'restore',
    });
    const authorized = createKilnProgramToolRegistry({
      assetLibrary,
      programStore: freshStore,
      requirements: restoredBinding,
    });
    const restored = (await authorized
      .find((t) => t.name === 'kiln_assets')!
      .run(restoreInput)) as {
      programRef: string;
      requirements: { binding: unknown };
      acceptance: string;
    };
    expect(await freshStore.get(restored.programRef)).toBe(code);
    expect(restored.requirements.binding).toEqual(restoredBinding);
    expect(restored.acceptance).toBe('reevaluation-required');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
