import { describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { WebIO } from '@gltf-transform/core';
import * as THREE from 'three';

import { applyMaterialRecipeV1 } from '../material-recipe-runtime';
import {
  MATERIAL_RECIPE_IDS,
  createMaterialRecipeRequestV1,
  listMaterialRecipeCapabilitiesV1,
  materialRecipeSnapshotV1,
  resolveMaterialRecipeV1,
  validateMaterialRecipeRequestV1,
} from '../material-recipes';
import { executeKilnCode, renderSceneToGLB } from '../render';

describe('MAT-013 versioned material recipe contract', () => {
  test('publishes ten exact versioned IDs and rejects unsupported IDs/overrides', () => {
    expect(MATERIAL_RECIPE_IDS).toEqual([
      'kiln.material.bark.v1',
      'kiln.material.leaf.v1',
      'kiln.material.wood.v1',
      'kiln.material.stone.v1',
      'kiln.material.rubber.v1',
      'kiln.material.painted-metal.v1',
      'kiln.material.cloth.v1',
      'kiln.material.skin.v1',
      'kiln.material.glass.v1',
      'kiln.material.emissive.v1',
    ]);
    expect(
      validateMaterialRecipeRequestV1({ schemaVersion: 1, id: 'wood-ish' }).issues.map(
        (issue) => issue.code,
      ),
    ).toContain('UNSUPPORTED_RECIPE_ID');
    expect(
      validateMaterialRecipeRequestV1({
        schemaVersion: 1,
        id: 'kiln.material.skin.v1',
        overrides: { opacity: 0.4 },
      }).issues.map((issue) => issue.code),
    ).toContain('UNSUPPORTED_OVERRIDE');
    expect(() =>
      createMaterialRecipeRequestV1('kiln.material.leaf.v1', { alphaCutoff: 4 }),
    ).toThrow(/alphaCutoff/);
  });

  test('validates approved resource slot and recipe compatibility', () => {
    const unsupportedOverride = validateMaterialRecipeRequestV1({
      schemaVersion: 1,
      id: 'kiln.material.glass.v1',
      overrides: {
        textureResources: { normal: 'kiln.texture.leaf-mask-albedo.v1' },
      },
    });
    expect(unsupportedOverride.valid).toBe(false);
    expect(unsupportedOverride.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(['UNSUPPORTED_OVERRIDE']),
    );
    const wrongSlot = validateMaterialRecipeRequestV1({
      schemaVersion: 1,
      id: 'kiln.material.bark.v1',
      overrides: {
        textureResources: { baseColor: 'kiln.texture.neutral-normal.v1' },
      },
    });
    expect(wrongSlot.issues.map((issue) => issue.code)).toContain('RESOURCE_SLOT_MISMATCH');
    const wrongRecipe = validateMaterialRecipeRequestV1({
      schemaVersion: 1,
      id: 'kiln.material.leaf.v1',
      overrides: {
        textureResources: { baseColor: 'kiln.texture.bark-albedo.v1' },
      },
    });
    expect(wrongRecipe.issues.map((issue) => issue.code)).toContain('RESOURCE_RECIPE_MISMATCH');

    const leaf = validateMaterialRecipeRequestV1({
      schemaVersion: 1,
      id: 'kiln.material.leaf.v1',
      overrides: {
        textureResources: { baseColor: 'kiln.texture.leaf-mask-albedo.v1' },
      },
    });
    expect(leaf.valid).toBe(true);
  });

  test('recipe snapshot is byte-stable and contains only core glTF PBR fields', () => {
    const snapshot = `${JSON.stringify(materialRecipeSnapshotV1(), null, 2)}\n`;
    expect(Buffer.byteLength(snapshot)).toBe(5742);
    expect(createHash('sha256').update(snapshot).digest('hex')).toBe(
      'a3a10b73867e6e2c615e490b6d3d63c1b264d278be931c513917103b4871f737',
    );
    for (const entry of materialRecipeSnapshotV1()) {
      expect(entry.defaults).toEqual(
        expect.objectContaining({
          baseColorFactor: expect.any(Array),
          metallicFactor: expect.any(Number),
          roughnessFactor: expect.any(Number),
          emissiveFactor: expect.any(Array),
          alphaMode: expect.stringMatching(/^(OPAQUE|MASK|BLEND)$/),
          doubleSided: expect.any(Boolean),
          textureResources: expect.any(Object),
        }),
      );
      expect(entry.defaults).not.toHaveProperty('shader');
      expect(entry.defaults).not.toHaveProperty('extension');
    }
  });

  test('masked leaf remains distinct from blended glass', () => {
    const leaf = resolveMaterialRecipeV1(createMaterialRecipeRequestV1('kiln.material.leaf.v1'));
    const glass = resolveMaterialRecipeV1(createMaterialRecipeRequestV1('kiln.material.glass.v1'));
    expect(leaf).toMatchObject({ alphaMode: 'MASK', alphaCutoff: 0.5, doubleSided: true });
    expect(glass).toMatchObject({ alphaMode: 'BLEND', doubleSided: true });
    expect(leaf.alphaMode).not.toBe(glass.alphaMode);
  });
});

describe('MAT-014 executable portable recipe library', () => {
  test('all ten recipes render as validator-clean core glTF materials', async () => {
    const root = new THREE.Group();
    root.name = 'MaterialRecipeGallery';
    for (const [index, id] of MATERIAL_RECIPE_IDS.entries()) {
      const applied = await applyMaterialRecipeV1(createMaterialRecipeRequestV1(id));
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), applied.material);
      mesh.name = `Recipe_${id}`;
      mesh.position.x = index;
      root.add(mesh);
    }
    const rendered = await renderSceneToGLB(root, { sceneName: 'MaterialRecipeGallery' });
    expect(rendered.gltfValidation.issues.numErrors).toBe(0);
    const document = await new WebIO().readBinary(rendered.bytes);
    expect(document.getRoot().listExtensionsUsed()).toEqual([]);
    const byName = new Map(
      document
        .getRoot()
        .listMaterials()
        .map((material) => [material.getName(), material]),
    );
    for (const id of MATERIAL_RECIPE_IDS) expect(byName.has(id)).toBe(true);
    expect(byName.get('kiln.material.leaf.v1')?.getAlphaMode()).toBe('MASK');
    expect(byName.get('kiln.material.leaf.v1')?.getDoubleSided()).toBe(true);
    expect(byName.get('kiln.material.glass.v1')?.getAlphaMode()).toBe('BLEND');
    expect(byName.get('kiln.material.emissive.v1')?.getEmissiveFactor()).not.toEqual([0, 0, 0]);
  });

  test('sandbox executes the discovered helper with approved resource IDs', async () => {
    const executed = await executeKilnCode(`
      const meta = { name: 'RecipeSandbox', category: 'vegetation' };
      async function build() {
        const root = createRoot('RecipeSandbox');
        const leaf = await materialRecipe('kiln.material.leaf.v1', {
          alphaCutoff: 0.42,
          textureResources: { baseColor: 'kiln.texture.leaf-mask-albedo.v1' },
        });
        createPart('Mesh_Leaf', foliageCardGeo({ width: 1, height: 1 }), leaf, { parent: root });
        return root;
      }
    `);
    expect(executed.primitiveUsage).toMatchObject({
      materialRecipe: 1,
      createRoot: 1,
      createPart: 1,
      foliageCardGeo: 1,
    });
    const rendered = await renderSceneToGLB(executed.root, { sceneName: 'RecipeSandbox' });
    expect(rendered.gltfValidation.issues.numErrors).toBe(0);
    expect(rendered.materialRecipeApplications).toMatchObject([
      {
        schemaVersion: 1,
        recipeId: 'kiln.material.leaf.v1',
        recipeVersion: 1,
        portableModel: 'pbrMetallicRoughness',
      },
    ]);
    expect(rendered.materialResourceProvenance).toMatchObject([
      {
        schemaVersion: 1,
        resourceId: 'kiln.texture.leaf-mask-albedo.v1',
        usage: 'albedo',
        colorSpace: 'srgb',
      },
    ]);
    expect(rendered.materialResourceProvenance?.[0]?.contentHash).toMatch(/^[a-f0-9]{64}$/);
    const document = await new WebIO().readBinary(rendered.bytes);
    const material = document.getRoot().listMaterials()[0];
    expect(material?.getAlphaMode()).toBe('MASK');
    expect(material?.getAlphaCutoff()).toBeCloseTo(0.42);
    expect(document.getRoot().listTextures()).toHaveLength(1);
  });

  test('capability DTO is executable, bounded, and path-free', () => {
    const capabilities = listMaterialRecipeCapabilitiesV1();
    expect(capabilities.recipes).toHaveLength(10);
    expect(capabilities.resources.length).toBeGreaterThan(0);
    expect(JSON.stringify(capabilities)).not.toMatch(/(?:file:|[A-Z]:\\|\/home\/|secret|token)/i);
    expect(capabilities.recipes.every((recipe) => recipe.portable)).toBe(true);
  });
});
