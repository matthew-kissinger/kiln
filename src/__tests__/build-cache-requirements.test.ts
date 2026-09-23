import { expect, test } from 'bun:test';
import { createCachedEvaluatorPort, MemoryBuildCache } from '../build-cache';
import { renderGLBInProcess } from '../render';
import { createAssetRequirementsV1, requestedRequirement } from '../contracts/requirements';
import { createAssetRequirementsStore } from '../requirements-store';
const code =
  "const meta={name:'Cache'};function build(){const r=createRoot('Root');createPart('Body',boxGeo(1,1,1),gameMaterial('#888888'),{parent:r});return r;}";
function bind(taskId: string, requirements = createAssetRequirementsV1()) {
  return createAssetRequirementsStore().host.bind({ taskId, lineageId: 'asset' }, requirements, {
    actor: 'host',
    reason: 'brief',
    source: 'brief',
  });
}
test('same geometry and different requirements never reuse an incompatible acceptance report', async () => {
  let runs = 0;
  const port = createCachedEvaluatorPort(
    {
      render: async (source, options) => {
        runs++;
        return renderGLBInProcess(source, options);
      },
    },
    { cache: new MemoryBuildCache(), identity: () => 'fixture' },
  );
  const plain = await port.render(code, { requirements: bind('a') });
  const required = await port.render(code, {
    requirements: bind(
      'a',
      createAssetRequirementsV1({
        requirements: {
          structure: requestedRequirement({ roof: { type: 'custom-arched-shell' } }),
        },
      }),
    ),
  });
  expect(runs).toBe(2);
  expect(plain.meta.qaReport).toMatchObject({ acceptance: 'accepted' });
  expect(required.meta.qaReport).toMatchObject({ acceptance: 'incomplete' });
  expect(required.glb).toEqual(plain.glb);
});
test('equivalent policy reuses the artifact and refreshes the current task receipt', async () => {
  let runs = 0;
  const port = createCachedEvaluatorPort(
    {
      render: async (source, options) => {
        runs++;
        return renderGLBInProcess(source, options);
      },
    },
    { cache: new MemoryBuildCache(), identity: () => 'fixture' },
  );
  const first = await port.render(code, { requirements: bind('first') });
  const next = bind('next', createAssetRequirementsV1({ labels: ['different descriptive label'] }));
  const second = await port.render(code, { requirements: next });
  expect(runs).toBe(1);
  expect(second.buildCache?.hit).toBe(true);
  expect(second.requirements.binding).toEqual(next);
  expect(first.requirements.binding!.taskId).toBe('first');
});
test('a legacy option cannot bypass its migration error through a warm cache', async () => {
  const port = createCachedEvaluatorPort(
    { render: renderGLBInProcess },
    { cache: new MemoryBuildCache(), identity: () => 'fixture' },
  );
  await port.render(code);
  await expect(port.render(code, { category: 'prop' })).rejects.toThrow(/explicit migration/i);
});

test('a cache entry from another policy is treated as a miss, never relabeled as current', async () => {
  const foreign = await renderGLBInProcess(code);
  let runs = 0;
  const port = createCachedEvaluatorPort(
    {
      render: async (source, options) => {
        runs++;
        return renderGLBInProcess(source, options);
      },
    },
    { cache: { get: async () => foreign, put: async () => {} }, identity: () => 'fixture' },
  );
  const result = await port.render(code, {
    requirements: bind(
      'a',
      createAssetRequirementsV1({
        requirements: {
          structure: requestedRequirement({ roof: { type: 'custom-arched-shell' } }),
        },
      }),
    ),
  });
  expect(runs).toBe(1);
  expect(result.buildCache?.hit).toBe(false);
  expect(result.meta.qaReport).toMatchObject({ acceptance: 'incomplete' });
});

test('a cache entry with fabricated acceptance is not reused', async () => {
  const requirements = bind(
    'a',
    createAssetRequirementsV1({
      requirements: { structure: requestedRequirement({ roof: { type: 'custom-arched-shell' } }) },
    }),
  );
  const corrupted = await renderGLBInProcess(code, { requirements });
  Object.assign(corrupted.meta.qaReport!, {
    acceptance: 'accepted',
    disposition: 'pass',
    unevaluatedRequirements: [],
  });
  let runs = 0;
  const port = createCachedEvaluatorPort(
    {
      render: async (source, options) => {
        runs++;
        return renderGLBInProcess(source, options);
      },
    },
    { cache: { get: async () => corrupted, put: async () => {} }, identity: () => 'fixture' },
  );
  const result = await port.render(code, { requirements });
  expect(runs).toBe(1);
  expect(result.meta.qaReport).toMatchObject({ acceptance: 'incomplete' });
});

test('a fresh evaluator result from another lineage is rejected before cache admission', async () => {
  const foreign = await renderGLBInProcess(code, { requirements: bind('foreign') });
  let writes = 0;
  const port = createCachedEvaluatorPort(
    { render: async () => foreign },
    {
      cache: {
        get: async () => undefined,
        put: async () => {
          writes++;
        },
      },
      identity: () => 'fixture',
    },
  );
  await expect(port.render(code, { requirements: bind('current') })).rejects.toMatchObject({
    code: 'PROTOCOL_ERROR',
  });
  expect(writes).toBe(0);
});
