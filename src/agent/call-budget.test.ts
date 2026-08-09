import { describe, expect, test } from 'bun:test';
import {
  DEFAULT_GENERATION_MODEL_CALL_LIMIT,
  createGenerationCallBudget,
  generationModelCallLimitFromEnv,
} from './call-budget';

describe('generation-global model-call budget', () => {
  test('defaults to the existing aggregate 40-call ceiling', () => {
    expect(createGenerationCallBudget().receipt()).toMatchObject({
      limit: DEFAULT_GENERATION_MODEL_CALL_LIMIT,
      consumed: 0,
      remaining: 40,
      exhausted: false,
    });
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
    expect(generationModelCallLimitFromEnv({ KILN_GENERATION_MAX_CALLS: 'invalid' })).toBe(40);
  });
});
