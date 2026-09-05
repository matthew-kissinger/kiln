import { describe, expect, test } from 'bun:test';
import {
  DEFAULT_GENERATION_MODEL_CALL_LIMIT,
  createGenerationCallBudget,
  generationModelCallLimitFromEnv,
} from './call-budget';

describe('generation-global model-call budget', () => {
  // The default is no ceiling. A cap the user did not ask for stops an asset
  // halfway for reasons that have nothing to do with the asset, and out here the
  // person running the tool is the person paying for it.
  test('defaults to no ceiling at all', () => {
    expect(DEFAULT_GENERATION_MODEL_CALL_LIMIT).toBe(0);
    expect(createGenerationCallBudget().receipt()).toMatchObject({
      limit: 0,
      consumed: 0,
      remaining: null,
      exhausted: false,
    });
  });

  test('an unconfigured budget really does keep admitting calls', () => {
    const budget = createGenerationCallBudget();
    for (let i = 0; i < 500; i++) expect(budget.tryConsume('author')).toBe(true);
    expect(budget.receipt()).toMatchObject({ consumed: 500, denied: 0, exhausted: false });
  });

  test('attributes one shared allowance across author, observer, repair, retry, and fallback', () => {
    const budget = createGenerationCallBudget(5);
    for (const role of ['author', 'observer', 'repair', 'retry', 'fallback'] as const) {
      expect(budget.tryConsume(role)).toBe(true);
    }
    expect(budget.tryConsume('repair')).toBe(false);
    expect(budget.receipt()).toEqual({
      limit: 5,
      consumed: 5,
      remaining: 0,
      exhausted: true,
      denied: 1,
      byRole: { author: 1, observer: 1, repair: 1, retry: 1, fallback: 1 },
    });
  });

  test('zero preserves the existing explicit unlimited configuration while retaining attribution', () => {
    const budget = createGenerationCallBudget(0);
    for (let i = 0; i < 50; i++) expect(budget.tryConsume('author')).toBe(true);
    expect(budget.receipt()).toMatchObject({
      limit: 0,
      consumed: 50,
      remaining: null,
      exhausted: false,
      denied: 0,
      byRole: { author: 50 },
    });
  });

  test('the generation-global env wins while the legacy step env remains a fallback', () => {
    expect(
      generationModelCallLimitFromEnv({
        KILN_GENERATION_MAX_CALLS: '12',
        KILN_AGENT_MAX_STEPS: '7',
      }),
    ).toBe(12);
    expect(generationModelCallLimitFromEnv({ KILN_AGENT_MAX_STEPS: '7' })).toBe(7);
    expect(generationModelCallLimitFromEnv({ KILN_GENERATION_MAX_CALLS: 'invalid' })).toBe(
      DEFAULT_GENERATION_MODEL_CALL_LIMIT,
    );
  });
});
