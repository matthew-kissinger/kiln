import { expect, test } from 'bun:test';
import { createKilnProgramToolRegistry, type KilnEditResult } from '../registry';
import { trustedInProcessEvaluatorPortV2 } from '../../evaluator';

const code = `const WIDTH=1; function build(){const r=createRoot('Root');
for(const name of ['Door','ProtectedWall'])createPart(name,boxGeo(WIDTH,1,1),gameMaterial('#888888'),{parent:r});return r;}`;
test('rendered edits expose global parameter spillover without a second model tool call', async () => {
  let evaluations = 0;
  const tools = createKilnProgramToolRegistry({
    evaluatorCacheIdentity: 'test',
    evaluatorPort: {
      render: (...args) => {
        evaluations++;
        return trustedInProcessEvaluatorPortV2.render(...args);
      },
    },
  });
  const edit = tools.find((t) => t.name === 'kiln_edit')!;
  const request = {
    code,
    edits: [{ oldString: 'WIDTH=1', newString: 'WIDTH=2' }],
    capture: { preset: '1x1' },
  };
  const result = (await edit.run(request)) as KilnEditResult;
  expect(result.ok).toBe(true);
  expect(result.preservation?.status).toBe('compared');
  expect(
    result.preservation?.comparison?.changes
      .filter((c) => c.fields.includes('geometry'))
      .map((c) => c.name)
      .sort(),
  ).toEqual(['Mesh_Door', 'Mesh_ProtectedWall']);
  expect(result.preservation?.comparison?.after.glbSha256).toBe(
    result.render?.viewFidelity?.inputGlbSha256,
  );
  expect(evaluations).toBe(2);
  await edit.run(request);
  expect(evaluations).toBe(2);
});
test('source-only edits do not evaluate or imply geometry preservation', async () => {
  const tools = createKilnProgramToolRegistry({
    evaluatorPort: {
      render: async () => {
        throw Error('must not evaluate');
      },
    },
  });
  const result = (await tools
    .find((t) => t.name === 'kiln_edit')!
    .run({
      code,
      render: false,
      edits: [{ oldString: 'WIDTH=1', newString: 'WIDTH=2' }],
    })) as KilnEditResult;
  expect(result.ok).toBe(true);
  expect(result.preservation?.status).toBe('not_assessed');
  expect(result.preservation?.comparison).toBeUndefined();
});
test('repairing an invalid baseline succeeds with explicitly unavailable comparison', async () => {
  const tools = createKilnProgramToolRegistry();
  const result = (await tools
    .find((t) => t.name === 'kiln_edit')!
    .run({
      code: code.replace('WIDTH=1', 'WIDTH=NaN'),
      edits: [{ oldString: 'WIDTH=NaN', newString: 'WIDTH=1' }],
    })) as KilnEditResult;
  expect(result.ok).toBe(true);
  expect(result.render?.ok).toBe(true);
  expect(result.preservation?.status).toBe('not_assessed');
  expect(result.preservation?.reason).toContain('comparison unavailable');
});
