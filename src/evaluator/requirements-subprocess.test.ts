import { expect, test } from 'bun:test';
import {
  renderGLBViaProcessLaunch,
  renderGLBViaSubprocess,
  sanitizedEvaluatorEnv,
} from './subprocess';
import { encodeRenderResultV2 } from './protocol';
import { renderGLBInProcess } from '../render';
import { createAssetRequirementsV1, requestedRequirement } from '../contracts/requirements';
import { createAssetRequirementsStore } from '../requirements-store';
const code =
  "const meta={name:'Bound'};function build(){const r=createRoot('Root');createPart('Body',boxGeo(1,1,1),gameMaterial('#888888'),{parent:r});return r;}";
const bind = (taskId: string) =>
  createAssetRequirementsStore().host.bind(
    { taskId, lineageId: 'asset' },
    createAssetRequirementsV1({
      requirements: { structure: requestedRequirement({ roof: { type: 'custom-arched-shell' } }) },
    }),
    { actor: 'host', reason: 'brief', source: 'brief' },
  );
const launch = (output: string) => ({
  command: process.execPath,
  args: [
    '-e',
    `process.stdin.resume();process.stdin.on('end',()=>{require('node:fs').writeFileSync(3,${JSON.stringify(output)});});`,
  ],
  env: sanitizedEvaluatorEnv(),
});

test('a real subprocess preserves current host requirements and incomplete acceptance', async () => {
  const requirements = bind('current');
  const result = await renderGLBViaSubprocess(code, { requirements }, { deadlineMs: 30000 });
  expect(result.requirements.binding).toEqual(requirements);
  expect(result.meta.qaReport).toMatchObject({ acceptance: 'incomplete' });
}, 40000);

test('a subprocess result from another lineage is rejected despite valid bytes and self-consistent QA', async () => {
  const wire = encodeRenderResultV2(
    'render-1',
    await renderGLBInProcess(code, { requirements: bind('foreign') }),
  );
  await expect(
    renderGLBViaProcessLaunch(
      code,
      { requirements: bind('current') },
      { deadlineMs: 10000 },
      launch(JSON.stringify(wire)),
    ),
  ).rejects.toMatchObject({ code: 'PROTOCOL_ERROR' });
}, 20000);

test('a subprocess cannot substitute another request identity', async () => {
  const wire = encodeRenderResultV2('foreign-request', await renderGLBInProcess(code));
  await expect(
    renderGLBViaProcessLaunch(code, {}, { deadlineMs: 10000 }, launch(JSON.stringify(wire))),
  ).rejects.toMatchObject({ code: 'PROTOCOL_ERROR' });
}, 20000);

test('subprocess legacy policy fails before a worker can launch', async () => {
  await expect(
    renderGLBViaProcessLaunch(
      code,
      { category: 'prop' },
      {},
      { command: 'missing-worker-must-not-start', args: [], env: {} },
    ),
  ).rejects.toThrow(/explicit migration/i);
});
