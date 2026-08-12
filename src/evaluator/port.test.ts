import { expect, test } from 'bun:test';

import { resolveEvaluatorPortV1 } from './index';

test('production profile requires an injected evaluator with no fallback', async () => {
  expect(() => resolveEvaluatorPortV1(undefined, 'evaluator-required')).toThrow(
    'Evaluator port is required',
  );
  const calls: string[] = [];
  const injected = {
    render: async (code: string) => {
      calls.push(code);
      return {} as never;
    },
  };
  expect(resolveEvaluatorPortV1(injected, 'evaluator-required')).toBe(injected);
  await resolveEvaluatorPortV1(injected, 'evaluator-required').render('source');
  expect(calls).toEqual(['source']);
});
