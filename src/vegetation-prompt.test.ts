import { describe, expect, test } from 'bun:test';

import { createAssetIntentV1, VEGETATION_SUBTYPES } from './contracts';
import {
  VEGETATION_REJECTED_HELPER_NAMES,
  VEGETATION_SUBTYPE_RECIPES_V1,
  vegetationSubtypePromptContext,
} from './vegetation-prompt';

describe('VEG-017 model-independent subtype prompt skills', () => {
  test('selects exactly one relevant subtype recipe and no rejected helper', () => {
    for (const subtype of VEGETATION_SUBTYPES) {
      const context = vegetationSubtypePromptContext(
        createAssetIntentV1({ category: 'vegetation', vegetation: { subtype } }),
      );
      const selected = VEGETATION_SUBTYPE_RECIPES_V1[subtype];
      expect(context).toContain(selected.marker);
      expect(context).toContain(`only the ${subtype} recipe`);
      for (const otherSubtype of VEGETATION_SUBTYPES) {
        if (otherSubtype === subtype) continue;
        expect(context).not.toContain(VEGETATION_SUBTYPE_RECIPES_V1[otherSubtype].marker);
      }
      for (const helper of VEGETATION_REJECTED_HELPER_NAMES) expect(context).not.toContain(helper);
    }
  });

  test('changes only state/material guidance, preserving the selected recipe', () => {
    const sparse = vegetationSubtypePromptContext(
      createAssetIntentV1({
        category: 'vegetation',
        vegetation: { subtype: 'shrub', growthState: 'sparse' },
        material: { mode: 'flatOptimized' },
      }),
    );
    expect(sparse).toContain('RECIPE_SHRUB_V1');
    expect(sparse).toContain('requested sparse state');
    expect(sparse).toContain('one coherent foliage value role');

    const bare = vegetationSubtypePromptContext(
      createAssetIntentV1({
        category: 'vegetation',
        vegetation: { subtype: 'bare/dead', growthState: 'bare' },
      }),
    );
    expect(bare).toContain('RECIPE_BARE_DEAD_V1');
    expect(bare).toContain('Bare growth is intentional');
  });

  test('returns no category leakage for non-vegetation intent', () => {
    expect(vegetationSubtypePromptContext(createAssetIntentV1({ category: 'prop' }))).toBe('');
  });
});
