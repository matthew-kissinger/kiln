/** Material-specific prompt/API discovery block; coordinator wires it into root prompt surfaces. */

import {
  MATERIAL_RECIPE_IDS,
  MATERIAL_RECIPE_LIBRARY_V1,
  type MaterialRecipeRequestV1,
} from './material-recipes';

export const MATERIAL_RECIPE_HELPER_SIGNATURE =
  'await materialRecipe(recipeId, { baseColor?, roughness?, metalness?, opacity?, alphaCutoff?, doubleSided?, emissiveColor?, emissiveIntensity?, textureResources? })';

/** Executable, provider-independent examples used by MAT-019's prompt ablation. */
export const MATERIAL_RECIPE_EXECUTABLE_EXAMPLES_V1 = `
\`\`\`js
const bark = await materialRecipe('kiln.material.bark.v1', { baseColor: '#654126' });
const leafDark = await materialRecipe('kiln.material.leaf.v1', { baseColor: '#285b32' });
const leafLight = await materialRecipe('kiln.material.leaf.v1', { baseColor: '#609447' });
const wood = await materialRecipe('kiln.material.wood.v1');
const stone = await materialRecipe('kiln.material.stone.v1');
const rubber = await materialRecipe('kiln.material.rubber.v1');
const paintedMetal = await materialRecipe('kiln.material.painted-metal.v1');
const cloth = await materialRecipe('kiln.material.cloth.v1');
const skin = await materialRecipe('kiln.material.skin.v1');
const glass = await materialRecipe('kiln.material.glass.v1');
const glow = await materialRecipe('kiln.material.emissive.v1');
\`\`\``;

export const MATERIAL_RECIPE_PROMPT_CONTEXT_V1 = `## Portable material recipes

Use ${MATERIAL_RECIPE_HELPER_SIGNATURE}. Recipe IDs are versioned and executable; do not invent an
ID or pass a host path. Available IDs: ${MATERIAL_RECIPE_IDS.join(', ')}. Recipes export through core
glTF pbrMetallicRoughness. Leaf uses MASK (not BLEND); glass is the explicit blended recipe. Texture
slots accept only approved kiln.texture.* resource IDs reported by capabilities.

Choose recipes from the requested real-world material even when the user does not name this helper:
${MATERIAL_RECIPE_EXECUTABLE_EXAMPLES_V1}`;

export function materialRecipeRequestDirective(request: MaterialRecipeRequestV1): string {
  const recipe = MATERIAL_RECIPE_LIBRARY_V1[request.id];
  return [
    '## Requested portable material recipe',
    `Use exactly ${request.id} (${recipe.name}), recipe schema/version 1.`,
    request.overrides
      ? `Apply only these validated typed overrides: ${JSON.stringify(request.overrides)}.`
      : 'Use the recipe defaults without inventing overrides.',
    'Keep the result portable glTF PBR; do not substitute a runtime shader or filesystem texture path.',
  ].join('\n');
}
