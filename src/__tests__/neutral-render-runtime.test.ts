import { expect, test } from 'bun:test';
import { renderGLBInProcess, renderSceneToGLB } from '../render';
import { createAssetRequirementsV1, requestedRequirement } from '../contracts/requirements';
import { createAssetRequirementsStore } from '../requirements-store';
import { Group } from 'three';
const source = (category = 'prop', extra = '') =>
  `const meta={name:'Neutral',category:${JSON.stringify(category)}${extra}};function build(){const r=createRoot('Root');createPart('Body',boxGeo(1,1,1),gameMaterial('#888888'),{parent:r,position:[0,0.5,0]});return r;}`;
const bind = (requirements = createAssetRequirementsV1()) =>
  createAssetRequirementsStore().host.bind(
    { taskId: 'fixture-task', lineageId: 'fixture-asset' },
    requirements,
    { actor: 'host', reason: 'brief', source: 'brief' },
  );
test('the normal renderer emits neutral QA without an implicit category or grounding demand', async () => {
  const result = await renderGLBInProcess(source());
  expect(result.meta.qaReport).toMatchObject({ schemaVersion: 2, acceptance: 'accepted' });
  expect(result.meta.qaReport).not.toHaveProperty('category');
  expect(result.meta.category).toBeUndefined();
  expect(result.requirements.requirements.requirements).toEqual({});
});
test('source relabeling and forged metadata cannot weaken a requested unsupported obligation', async () => {
  const requirements = bind(
    createAssetRequirementsV1({
      requirements: {
        structure: requestedRequirement({ roof: { type: 'custom-arched-shell' } }),
        navigation: requestedRequirement({}),
      },
    }),
  );
  for (const category of ['prop', 'architecture', 'spaceship']) {
    const result = await renderGLBInProcess(
      source(
        category,
        ",requirements:{requirements:{}},policyHash:'forged',qaReport:{disposition:'pass'}",
      ),
      { requirements },
    );
    expect(result.meta.qaReport).toMatchObject({
      schemaVersion: 2,
      acceptance: 'incomplete',
      disposition: 'notEvaluated',
    });
    expect(result.requirements.binding).toEqual(requirements);
    expect(result.meta.requirements).toBeUndefined();
    expect(result.meta.policyHash).toBeUndefined();
  }
});
test('legacy execution options fail before source execution and have no silent converter', async () => {
  await expect(
    renderGLBInProcess("throw new Error('SOURCE EXECUTED');", { category: 'prop' }),
  ).rejects.toThrow(/explicit migration/i);
  await expect(renderSceneToGLB(new Group(), { category: 'architecture' })).rejects.toThrow(
    /explicit migration/i,
  );
});

test('source relabeling cannot bypass a measured requested storey count', async () => {
  const requirements = bind(
    createAssetRequirementsV1({
      requirements: {
        structure: requestedRequirement({ storeyCount: 6 }),
      },
    }),
  );
  for (const category of ['prop', 'architecture', 'spaceship']) {
    await expect(renderGLBInProcess(source(category), { requirements })).rejects.toMatchObject({
      report: {
        acceptance: 'blocked',
        dimensions: {
          requirementReadiness: {
            findings: expect.arrayContaining([
              expect.objectContaining({ code: 'ARCH_STOREY_COUNT', disposition: 'block' }),
            ]),
          },
        },
      },
    });
  }
});
test('host-requested clips remain exact blockers while inference cannot enforce them', async () => {
  await expect(
    renderGLBInProcess(source(), {
      requirements: bind(
        createAssetRequirementsV1({
          requirements: { animation: requestedRequirement({ clips: ['Wave'] }) },
        }),
      ),
    }),
  ).rejects.toMatchObject({ report: { schemaVersion: 2, acceptance: 'blocked' } });
  const inferred = await renderGLBInProcess(source(), {
    requirements: bind(
      createAssetRequirementsV1({
        requirements: { animation: { state: 'inferred', value: { clips: ['Wave'] } } },
      }),
    ),
  });
  expect(inferred.meta.qaReport).toMatchObject({ acceptance: 'accepted' });
});
test('different acceptance context leaves identical geometry bytes unchanged', async () => {
  const plain = await renderGLBInProcess(source(), { requirements: bind() });
  const constrained = await renderGLBInProcess(source(), {
    requirements: bind(
      createAssetRequirementsV1({ requirements: { grounding: requestedRequirement({}) } }),
    ),
  });
  expect(constrained.glb).toEqual(plain.glb);
  expect(constrained.requirements.policyHash).not.toBe(plain.requirements.policyHash);
});
