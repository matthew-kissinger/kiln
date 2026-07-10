import { describe, expect, test } from 'bun:test';

import { createAssetIntentV1, VEGETATION_SUBTYPES } from '../contracts';
import { buildUserPrompt } from '../prompt';
import {
  VEGETATION_REJECTED_HELPER_NAMES,
  VEGETATION_SUBTYPE_RECIPES_V1,
} from '../vegetation-prompt';

describe('VEG-017 generation-prompt integration', () => {
  test('injects only the resolved current-API vegetation recipe', () => {
    for (const subtype of VEGETATION_SUBTYPES) {
      const prompt = buildUserPrompt({
        prompt: `a ${subtype} specimen`,
        mode: 'glb',
        category: 'vegetation',
        intent: createAssetIntentV1({ category: 'vegetation', vegetation: { subtype } }),
      });
      expect(prompt).toContain(VEGETATION_SUBTYPE_RECIPES_V1[subtype].marker);
      for (const other of VEGETATION_SUBTYPES) {
        if (other === subtype) continue;
        expect(prompt).not.toContain(VEGETATION_SUBTYPE_RECIPES_V1[other].marker);
      }
      for (const helper of VEGETATION_REJECTED_HELPER_NAMES) expect(prompt).not.toContain(helper);
    }
  });
});
