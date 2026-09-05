import { expect, test } from 'bun:test';

import { createEvaluatorPortV1, resolveEvaluatorPortV1 } from './index';

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

test('cancels transport work through a host signal without putting it on the wire', async () => {
  const controller = new AbortController();
  let calls = 0;
  let observed: AbortSignal | undefined;
  let wire = '';
  const port = createEvaluatorPortV1(async (json, controls) => {
    calls++;
    observed = controls.signal;
    wire = json;
    return new Promise(() => {});
  });
  const work = port.render(
    'function build() {}',
    {},
    { signal: controller.signal, deadlineMs: 100 },
  );
  controller.abort();
  await expect(work).rejects.toMatchObject({ code: 'CANCELLED' });
  expect(observed?.aborted).toBe(true);
  expect(wire).not.toContain('signal');
  await expect(
    port.render('function build() {}', {}, { signal: controller.signal }),
  ).rejects.toMatchObject({ code: 'CANCELLED' });
  expect(calls).toBe(1);
});
