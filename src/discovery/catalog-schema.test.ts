import { describe, expect, test } from 'bun:test';
import { parseCatalog, discoveryEntrySchema, type DiscoveryEntry } from './catalog-schema';

const operation = {
  version: 'kiln.catalog-entry.v1',
  id: 'operation:copyGeometry',
  kind: 'operation',
  name: 'copyGeometry',
  summary: 'Creates independently editable geometry.',
  family: 'geometry',
  tags: ['ownership'],
  aliases: ['duplicate geometry'],
  intents: ['edit a copy without changing the original'],
  stability: 'stable',
  related: [],
  references: ['docs/geometry.md'],
  limitations: ['Copies geometry, not the containing hierarchy.'],
  contract: {
    signature: 'copyGeometry(geometry: THREE.BufferGeometry)',
    returns: 'THREE.BufferGeometry',
    units: 'Preserves source units.',
    axes: 'Preserves source axes.',
    origin: 'Preserves source origin.',
    execution: 'sync',
    ownership: 'Returns an independent geometry copy.',
    coordinates: 'Geometry local space.',
    parameters: ['A THREE.BufferGeometry.'],
    topology: ['Preserves source topology.'],
    preservation: ['Preserves geometry attributes.'],
    semantics: ['Does not clone Object3D metadata.'],
    cost: 'Linear in geometry size.',
    example: 'const owned = copyGeometry(shared);',
  },
} satisfies DiscoveryEntry;

describe('Discovery catalog contracts', () => {
  test('accepts complete typed operations without discarding fields', () => {
    expect(discoveryEntrySchema.parse(operation)).toEqual(operation);
  });

  test('rejects misleading namespace, missing ownership, and unknown keys', () => {
    expect(() => discoveryEntrySchema.parse({ ...operation, id: 'recipe:copyGeometry' })).toThrow();
    expect(() => discoveryEntrySchema.parse({ ...operation, id: 'operation:mirror' })).toThrow();
    const { ownership: _, ...contract } = operation.contract;
    expect(() => discoveryEntrySchema.parse({ ...operation, contract })).toThrow();
    expect(() => discoveryEntrySchema.parse({ ...operation, category: 'prop' })).toThrow();
  });

  test('recipes have guidance, not a pretend executable signature', () => {
    const { contract: _, ...base } = operation;
    const recipe = {
      ...base,
      id: 'recipe:independent-part',
      kind: 'recipe',
      name: 'Independent part',
      recipe: {
        prerequisites: ['operation:copyGeometry'],
        steps: ['Copy the geometry before mutating it.'],
        example: 'const owned = copyGeometry(shared);',
        adaptations: ['Share the material if it remains unchanged.'],
        checks: ['Verify the original geometry is unchanged.'],
      },
    };
    expect(discoveryEntrySchema.parse(recipe).kind).toBe('recipe');
    expect(() => discoveryEntrySchema.parse({ ...recipe, contract: operation.contract })).toThrow();
  });

  test('catalog rejects duplicate IDs and dangling relations or prerequisites', () => {
    expect(() => parseCatalog([operation, operation])).toThrow(/Duplicate/);
    expect(() =>
      parseCatalog([operation, { ...operation, id: 'assembly:copyGeometry', kind: 'assembly' }]),
    ).toThrow(/Duplicate executable/);
    expect(() =>
      parseCatalog([
        { ...operation, related: [{ id: 'operation:missing', relation: 'alternative' }] },
      ]),
    ).toThrow(/Unknown/);
    expect(parseCatalog([operation])).toHaveLength(1);
  });

  test('typed relationships preserve alternative versus companion meaning', () => {
    const assembly = {
      ...operation,
      id: 'assembly:copyAssembly',
      kind: 'assembly',
      name: 'copyAssembly',
      related: [{ id: operation.id, relation: 'companion' }],
    };
    expect(parseCatalog([operation, assembly])[1]?.related[0]?.relation).toBe('companion');
    expect(() =>
      discoveryEntrySchema.parse({
        ...assembly,
        related: [{ id: operation.id, relation: 'synonym' }],
      }),
    ).toThrow();
  });
});
