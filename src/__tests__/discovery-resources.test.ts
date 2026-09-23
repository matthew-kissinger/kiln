import { expect, test } from 'bun:test';
import { createKilnDiscoveryDef } from '../tools/discovery';
import { createLocalToolContext } from '../local-runtime';
import { MemoryProgramStore } from '../program-store';
import type { KilnToolContext } from '../tools/registry';
import { ApprovedTextureResourceCache, approvedTextureCatalogV1 } from '../material-resources';
import { APPROVED_TEXTURE_RESOURCES_V1 } from '../material-recipes';

async function materials(context: KilnToolContext) {
  const result = (await createKilnDiscoveryDef(context).run({ capabilities: true })) as {
    capabilities: { materials: Record<string, unknown> };
  };
  return result.capabilities.materials;
}

test('Discovery reports production texture IDs by usable slot and excludes placeholder swatches', async () => {
  const production = approvedTextureCatalogV1();
  expect(approvedTextureCatalogV1({ includePlaceholders: true }).length).toBeGreaterThan(
    production.length,
  );
  const result = await materials({});
  expect(result).toMatchObject({
    approvedTextureCount: production.length,
    resourceScope: 'in-process',
    resourceEvidence: 'configuration-only',
    placeholders: 'excluded',
  });
  const slots = result.approvedTextures as Record<string, string[]>;
  for (const entry of production)
    for (const slot of entry.allowedSlots) expect(slots[slot]).toContain(entry.id);
  expect(Object.values(slots).flat()).not.toContain('kiln.texture.bark-albedo.v1');
});

test('opaque evaluators do not inherit the parent material resource catalog', async () => {
  expect(
    await materials({
      evaluatorPort: {
        render: async () => {
          throw new Error('Must not evaluate');
        },
      },
    }),
  ).toMatchObject({ approvedTextures: null, resourceScope: 'unspecified-by-host' });
  expect(await materials({ evaluatorProfile: 'evaluator-required' })).toMatchObject({
    approvedTextures: null,
    resourceEvidence: 'unspecified-by-host',
  });
});

test('host-declared resources refresh availability without fetching bytes or claiming successful resolution', async () => {
  const id = 'kiln.texture.bark-albedo.v1';
  let loads = 0;
  const cache = new ApprovedTextureResourceCache({
    registry: {
      ...APPROVED_TEXTURE_RESOURCES_V1,
      [id]: { ...APPROVED_TEXTURE_RESOURCES_V1[id], delivery: 'runtime', quality: 'production' },
    },
  });
  const context: KilnToolContext = {
    evaluatorPort: {
      render: async () => {
        throw new Error('Must not evaluate');
      },
    },
    approvedTextureResources: () => approvedTextureCatalogV1({ cache }),
  };
  const before = (await materials(context)).approvedTextures;
  cache.setResolver(async () => {
    loads++;
    throw new Error('Resource backend offline');
  });
  const ready = await materials(context);
  expect(ready).toMatchObject({
    resourceScope: 'host-declared',
    resourceEvidence: 'configuration-only',
  });
  expect((ready.approvedTextures as Record<string, string[]>).baseColor).toContain(id);
  expect(loads).toBe(0);
  cache.setResolver(undefined);
  expect((await materials(context)).approvedTextures).toEqual(before);
});

test('local evaluator construction reports its own resources, not an unrelated injected host declaration', async () => {
  for (const mode of ['subprocess', 'isolated', 'in-process']) {
    const context = createLocalToolContext(
      {
        programStore: new MemoryProgramStore(),
        approvedTextureResources: () => {
          throw new Error('Unrelated host catalog');
        },
      },
      { KILN_EVALUATOR_MODE: mode },
    );
    expect(await materials(context)).toMatchObject({
      approvedTextureCount: approvedTextureCatalogV1().length,
      resourceScope: mode === 'in-process' ? 'in-process' : 'embedded-only',
      resourceEvidence: 'configuration-only',
    });
  }
});
