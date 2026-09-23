import { expect, test } from 'bun:test';
import { MemoryCaptureCache, createCachedRenderPort } from '../capture-cache';
import { captureViewPngsViaPort } from '../port';
test('caller cancellation aborts owned port work without waiting for its deadline', async () => {
  const controller = new AbortController();
  let observed: AbortSignal | undefined;
  const result = await captureViewPngsViaPort(
    async (_request, execution) => {
      observed = execution?.signal;
      queueMicrotask(() => controller.abort(new Error('owner stopped this run')));
      return new Promise(() => {});
    },
    new Uint8Array([1]),
    100,
    [[1, 0, 0]],
    128,
    undefined,
    undefined,
    undefined,
    { signal: controller.signal },
  );
  expect(result).toEqual({ ok: false, reason: 'owner stopped this run' });
  expect(observed?.aborted).toBe(true);
});

test('an already cancelled caller never dispatches a renderer request', async () => {
  const controller = new AbortController();
  controller.abort(new Error('cancel before dispatch'));
  let calls = 0;
  const result = await captureViewPngsViaPort(
    async () => {
      calls++;
      return { ok: false, rendererId: 'fixture', error: 'should not run' };
    },
    new Uint8Array([1]),
    100,
    [[1, 0, 0]],
    128,
    undefined,
    undefined,
    undefined,
    { signal: controller.signal },
  );
  expect(calls).toBe(0);
  expect(result).toEqual({ ok: false, reason: 'cancel before dispatch' });
});
for (const identity of [undefined, 'current-gpu']) {
  test(`cache ${identity ? 'miss' : 'bypass'} preserves the caller deadline signal`, async () => {
    let signal: AbortSignal | undefined;
    const cached = createCachedRenderPort(
      async (_req, execution) => {
        signal = execution?.signal;
        return await new Promise(() => {});
      },
      { cache: new MemoryCaptureCache(), identity: () => identity },
    );
    const result = await captureViewPngsViaPort(cached, new Uint8Array([1]), 10, [[1, 0, 0]], 128);
    expect(result.ok).toBe(false);
    expect(signal?.aborted).toBe(true);
  });
}
test('canceled cache lookup never dispatches work; a separate caller still renders', async () => {
  const controller = new AbortController();
  let calls = 0;
  const cached = createCachedRenderPort(
    async () => {
      calls++;
      return { ok: true, rendererId: 'fixture', viewsPng: [] };
    },
    { cache: new MemoryCaptureCache(), identity: () => 'current-gpu' },
  );
  controller.abort(new Error('caller canceled'));
  const input = {
    glb: new Uint8Array([1]),
    viewDirs: [[1, 0, 0] as [number, number, number]],
    size: 128,
  };
  await expect(cached(input, { signal: controller.signal })).rejects.toThrow('caller canceled');
  expect(calls).toBe(0);
  await cached(input, { signal: new AbortController().signal });
  expect(calls).toBe(1);
});
