import { createHash } from 'node:crypto';
import { describe, expect, test } from 'bun:test';

import {
  MAX_PORTABLE_MATERIAL_TEXTURES,
  ProceduralTextureError,
  canonicalProceduralTextureJsonV2,
  canonicalizePortableMaterialSpecV2,
  canonicalizeProceduralTextureSpecV2,
  compileProceduralTextureSpecV2,
  hashProceduralTextureSpecV2,
  migrateProceduralTextureSpecV1,
  proceduralTexture,
} from '../procedural-texture';

const pixelSha256 = (pixels: Uint8Array): string =>
  createHash('sha256').update(pixels).digest('hex');

const FIXTURE_CORPUS = [
  {
    id: 'checker-albedo-v2',
    spec: {
      schemaVersion: 2 as const,
      size: 8,
      usage: 'albedo' as const,
      name: 'FixtureChecker',
      layers: [{ op: 'checker' as const, colorA: 0x102030, colorB: 0xd0e0f0, squares: 4 }],
    },
    pixelSha256: 'e9097b266f760d03a38952165177d75878c5520dde2a3ff0b61ba8149475123a',
  },
  {
    id: 'layered-metallic-roughness-v2',
    spec: {
      schemaVersion: 2 as const,
      size: 16,
      usage: 'metallicRoughness' as const,
      name: 'FixturePackedMr',
      layers: [
        { op: 'solid' as const, color: 0x00cc44 },
        {
          op: 'noise' as const,
          colorA: 0x002211,
          colorB: 0x00ee88,
          scale: 4,
          octaves: 3,
          seed: 17,
          blend: 'overlay' as const,
          opacity: 0.35,
        },
      ],
    },
    pixelSha256: '62fb9afced5ea983d640465a954ecaf1c8af0a4abc3ad5f2e6455262a55b8212',
  },
] as const;

describe('ProceduralTextureSpecV2 strict boundary', () => {
  test('canonicalization applies defaults and makes explicit defaults byte-identical', async () => {
    const implicit = {
      schemaVersion: 2 as const,
      layers: [{ op: 'noise' as const, colorA: 0, colorB: 0xffffff }],
    };
    const explicit = {
      schemaVersion: 2 as const,
      size: 256,
      usage: 'albedo' as const,
      layers: [
        {
          op: 'noise' as const,
          colorA: 0,
          colorB: 0xffffff,
          scale: 8,
          octaves: 3,
          seed: 0,
          blend: 'normal' as const,
          opacity: 1,
        },
      ],
    };

    expect(canonicalizeProceduralTextureSpecV2(implicit)).toEqual(
      canonicalizeProceduralTextureSpecV2(explicit),
    );
    expect(canonicalProceduralTextureJsonV2(implicit)).toBe(
      canonicalProceduralTextureJsonV2(explicit),
    );
    expect(await hashProceduralTextureSpecV2(implicit)).toBe(
      await hashProceduralTextureSpecV2(explicit),
    );
    expect(await hashProceduralTextureSpecV2(implicit)).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(await hashProceduralTextureSpecV2(implicit)).toBe(
      `sha256:${createHash('sha256').update(canonicalProceduralTextureJsonV2(implicit)).digest('hex')}`,
    );

    const ignoredBaseControls = {
      schemaVersion: 2 as const,
      layers: [
        {
          op: 'noise' as const,
          colorA: 0,
          colorB: 0xffffff,
          blend: 'multiply' as const,
          opacity: 0,
        },
      ],
    };
    expect(await hashProceduralTextureSpecV2(ignoredBaseControls)).toBe(
      await hashProceduralTextureSpecV2(implicit),
    );
  });

  test('rejects unknown keys at every discriminated boundary', () => {
    expect(() =>
      canonicalizeProceduralTextureSpecV2({
        schemaVersion: 2,
        layers: [{ op: 'solid', color: 0, callback: 'return red' }],
      }),
    ).toThrow(/layers\[0\].*unknown key "callback"/i);
    expect(() =>
      canonicalizeProceduralTextureSpecV2({
        schemaVersion: 2,
        layers: [{ op: 'solid', color: 0 }],
        url: 'https://example.invalid/texture.png',
      }),
    ).toThrow(/unknown key "url"/i);
  });

  test('rejects prototype-bearing objects and prototype-pollution keys', () => {
    const inherited = Object.create({ layers: [{ op: 'solid', color: 0 }] });
    inherited.schemaVersion = 2;
    expect(() => canonicalizeProceduralTextureSpecV2(inherited)).toThrow(/plain JSON object/i);

    const polluted = JSON.parse(
      '{"schemaVersion":2,"layers":[{"op":"solid","color":0,"__proto__":{}}]}',
    );
    expect(() => canonicalizeProceduralTextureSpecV2(polluted)).toThrow(/forbidden key/i);

    const sparseLayers = new Array(1);
    expect(() =>
      canonicalizeProceduralTextureSpecV2({ schemaVersion: 2, layers: sparseLayers }),
    ).toThrow(/dense JSON array/i);

    const accessorLayer: Record<string, unknown> = { op: 'solid' };
    Object.defineProperty(accessorLayer, 'color', {
      enumerable: true,
      get: () => 0,
    });
    expect(() =>
      canonicalizeProceduralTextureSpecV2({ schemaVersion: 2, layers: [accessorLayer] }),
    ).toThrow(/data field/i);
  });

  test('rejects invalid usage, non-finite numeric fields, and excessive work before compilation', () => {
    expect(() =>
      canonicalizeProceduralTextureSpecV2({
        schemaVersion: 2,
        usage: 'diffuse',
        layers: [{ op: 'solid', color: 0 }],
      }),
    ).toThrow(/usage/i);
    expect(() =>
      canonicalizeProceduralTextureSpecV2({
        schemaVersion: 2,
        layers: [
          { op: 'stripes', colorA: 0, colorB: 0xffffff, angleDeg: Number.POSITIVE_INFINITY },
        ],
      }),
    ).toThrow(/angleDeg/i);
    expect(() =>
      canonicalizeProceduralTextureSpecV2({
        schemaVersion: 2,
        size: 2048,
        layers: [{ op: 'solid', color: 0 }],
      }),
    ).toThrow(/power of two/i);
  });
});

describe('V1 migration and frozen compiler corpus', () => {
  test('legacy input migrates to the same canonical V2 recipe and pixels', () => {
    const legacy = {
      size: 8,
      usage: 'albedo' as const,
      name: 'LegacyChecker',
      layers: [{ op: 'checker' as const, colorA: 0x111111, colorB: 0xeeeeee, squares: 2 }],
    };
    const migrated = migrateProceduralTextureSpecV1(legacy);
    expect(migrated.schemaVersion).toBe(2);
    expect(compileProceduralTextureSpecV2(legacy).pixels).toEqual(
      compileProceduralTextureSpecV2(migrated).pixels,
    );
    expect(
      (proceduralTexture(legacy).userData as Record<string, unknown>)['kilnProcedural'],
    ).toMatchObject({ schemaVersion: 2 });
  });

  for (const fixture of FIXTURE_CORPUS) {
    test(`${fixture.id} has frozen deterministic pixels and canonical identity`, async () => {
      const first = compileProceduralTextureSpecV2(fixture.spec);
      const second = compileProceduralTextureSpecV2(fixture.spec);
      expect(second.pixels).toEqual(first.pixels);
      expect(pixelSha256(first.pixels)).toBe(fixture.pixelSha256);
      expect(first.canonicalJson).toBe(canonicalProceduralTextureJsonV2(fixture.spec));
      expect(first.recipeHash).toBe(await hashProceduralTextureSpecV2(fixture.spec));
    });
  }
});

describe('PortableMaterialSpecV2 compatibility boundary', () => {
  test('canonicalizes portable scalar fields and typed texture slots', () => {
    const material = canonicalizePortableMaterialSpecV2({
      schemaVersion: 2,
      model: 'pbrMetallicRoughness',
      name: 'WeatheredIron',
      baseColor: 0x6f665c,
      roughness: 0.74,
      metalness: 0.82,
      textures: {
        baseColor: {
          kind: 'procedural',
          spec: {
            schemaVersion: 2,
            usage: 'albedo',
            layers: [{ op: 'noise', colorA: 0x403a34, colorB: 0x8a8176 }],
          },
        },
        normal: { kind: 'resource', resourceId: 'kiln.texture.iron-normal.v1' },
      },
    });
    expect(material.schemaVersion).toBe(2);
    expect(material.textures.baseColor?.kind).toBe('procedural');
    expect(material.textures.normal).toEqual({
      kind: 'resource',
      resourceId: 'kiln.texture.iron-normal.v1',
    });
  });

  test('rejects slot/usage mismatch, executable references, and texture-count overflow', () => {
    expect(() =>
      canonicalizePortableMaterialSpecV2({
        schemaVersion: 2,
        model: 'pbrMetallicRoughness',
        textures: {
          normal: {
            kind: 'procedural',
            spec: {
              schemaVersion: 2,
              usage: 'albedo',
              layers: [{ op: 'solid', color: 0x8080ff }],
            },
          },
        },
      }),
    ).toThrow(/normal.*usage.*normal/i);
    expect(() =>
      canonicalizePortableMaterialSpecV2({
        schemaVersion: 2,
        model: 'pbrMetallicRoughness',
        shader: 'fn main() {}',
      }),
    ).toThrow(/unknown key "shader"/i);
    expect(MAX_PORTABLE_MATERIAL_TEXTURES).toBe(5);

    const procedural = (usage: string) => ({
      kind: 'procedural',
      spec: {
        schemaVersion: 2,
        size: 1024,
        usage,
        layers: [{ op: 'solid', color: 0 }],
      },
    });
    expect(() =>
      canonicalizePortableMaterialSpecV2({
        schemaVersion: 2,
        model: 'pbrMetallicRoughness',
        textures: {
          baseColor: procedural('albedo'),
          normal: procedural('normal'),
          metallicRoughness: procedural('metallicRoughness'),
          emissive: procedural('emissive'),
          occlusion: procedural('occlusion'),
        },
      }),
    ).toThrow(/texture budget/i);
  });
});

test('errors remain the public authoring error type', () => {
  expect(() => canonicalizeProceduralTextureSpecV2(null)).toThrow(ProceduralTextureError);
});
