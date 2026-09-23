import { expect, test } from 'bun:test';
import { createKilnProgramToolRegistry } from '../tools/registry';
import { createMaterialRecipeRequestV1 } from '../material-recipes';
import { canonicalizePortableMaterialSpecV2 } from '../procedural-material-v2';
import { renderGLBViaSubprocess } from './subprocess';

test.each([
  [
    "compilePortableMaterialSpecV2({schemaVersion:2,model:'pbrMetallicRoughness',baseColor:'#8a867c'})",
    'integer',
    'baseColor',
  ],
  [
    "compilePortableMaterialSpecV2({schemaVersion:2,model:'pbrMetallicRoughness',emissive:'PRIVATE_SOURCE_MARKER'})",
    'integer',
    'emissive',
  ],
  [
    "materialRecipe('kiln.material.stone.v1',{textureResources:{albedo:'kiln.texture.rough-concrete-albedo.v1'}})",
    'baseColor',
    'recipe',
  ],
  [
    "materialRecipe('kiln.material.stone.v1',{textureResources:{PRIVATE_SOURCE_MARKER:'kiln.texture.rough-concrete-albedo.v1'}})",
    'baseColor',
    'recipe',
  ],
  [
    "materialRecipe('kiln.material.stone.v1',{textureResources:{baseColor:'PRIVATE_SOURCE_MARKER'}})",
    'approved',
    'recipe',
  ],
  [
    "compilePortableMaterialSpecV2({schemaVersion:2,model:'pbrMetallicRoughness',textures:{baseColor:'PRIVATE_SOURCE_MARKER'}})",
    'resourceId',
    'kind',
  ],
  [
    "compilePortableMaterialSpecV2({schemaVersion:2,model:'pbrMetallicRoughness',textures:{baseColor:{kind:'PRIVATE_SOURCE_MARKER'}}})",
    'resourceId',
    'kind',
  ],
])(
  'material resource repair survives the evaluator boundary: %s',
  async (expression, field, shape) => {
    const render = createKilnProgramToolRegistry({
      evaluatorPort: { render: renderGLBViaSubprocess },
    }).find((tool) => tool.name === 'kiln_render')!;
    const result = (await render.run({
      code: `async function build(){await ${expression};return createRoot('Root');}`,
    })) as { ok: boolean; error: string };
    expect(result.ok).toBe(false);
    expect(result.error).toContain(field!);
    expect(result.error).toContain(shape!);
    expect(result.error).not.toContain('PRIVATE_SOURCE_MARKER');
  },
);

test('approved material resource forms remain distinct and valid', () => {
  const resourceId = 'kiln.texture.rough-concrete-albedo.v1';
  const recipe = createMaterialRecipeRequestV1('kiln.material.stone.v1', {
    textureResources: { baseColor: resourceId },
  });
  expect(recipe.overrides?.textureResources?.baseColor).toBe(resourceId);
  const portable = canonicalizePortableMaterialSpecV2({
    schemaVersion: 2,
    model: 'pbrMetallicRoughness',
    baseColor: 0x8a867c,
    emissive: 0x000000,
    textures: { baseColor: { kind: 'resource', resourceId } },
  });
  expect(portable.textures.baseColor).toEqual({ kind: 'resource', resourceId });
  expect(portable.baseColor).toBe(0x8a867c);
  expect(portable.emissive).toBe(0x000000);
});
