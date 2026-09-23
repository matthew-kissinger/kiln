import { expect, test } from 'bun:test';
import {
  createEvaluatorPortV2,
  createEvaluatorRequestV2,
  decodeEvaluatorRequestV2,
  decodeEvaluatorResultV2,
  encodeRenderResultV2,
} from './protocol';
import { renderGLBInProcess } from '../render';
import { createAssetRequirementsV1, requestedRequirement } from '../contracts/requirements';
import { createAssetRequirementsStore } from '../requirements-store';
const code =
  "const meta={name:'Wire'};function build(){const r=createRoot('Root');createPart('Body',boxGeo(1,1,1),gameMaterial('#888888'),{parent:r});return r;}";
const bind = (taskId: string) =>
  createAssetRequirementsStore().host.bind(
    { taskId, lineageId: 'asset' },
    createAssetRequirementsV1({
      requirements: { structure: requestedRequirement({ roof: { type: 'custom-arched-shell' } }) },
    }),
    { actor: 'host', reason: 'brief', source: 'brief' },
  );
test('the evaluator carries the detached host binding and returns incomplete acceptance faithfully', async () => {
  const binding = bind('task');
  const request = createEvaluatorRequestV2({
    requestId: 'req',
    code,
    options: { requirements: binding },
  });
  expect(decodeEvaluatorRequestV2(request.json).options.requirements).toEqual(binding);
  const port = createEvaluatorPortV2(async (json) => {
    const request = decodeEvaluatorRequestV2(json);
    return JSON.stringify(
      encodeRenderResultV2(
        request.requestId,
        await renderGLBInProcess(request.code, request.options),
      ),
    );
  });
  const result = await port.render(code, { requirements: binding });
  expect(result.requirements.binding).toEqual(binding);
  expect(result.meta.qaReport).toMatchObject({
    acceptance: 'incomplete',
    disposition: 'notEvaluated',
  });
});
test('matching geometry cannot substitute another task binding on the transport', async () => {
  const port = createEvaluatorPortV2(async (json) => {
    const request = decodeEvaluatorRequestV2(json);
    return JSON.stringify(
      encodeRenderResultV2(
        request.requestId,
        await renderGLBInProcess(code, { requirements: bind('other-task') }),
      ),
    );
  });
  await expect(port.render(code, { requirements: bind('expected-task') })).rejects.toMatchObject({
    code: 'PROTOCOL_ERROR',
  });
});
test('a worker cannot report accepted when requested applicability remains incomplete', async () => {
  const result = await renderGLBInProcess(code, { requirements: bind('task') });
  const wire = encodeRenderResultV2('req', result);
  if (!wire.ok) throw new Error('fixture');
  wire.render.meta.qaReport = {
    ...(wire.render.meta.qaReport as object),
    acceptance: 'accepted',
    disposition: 'pass',
  };
  expect(() => decodeEvaluatorResultV2(JSON.stringify(wire), 1024 * 1024, 'req')).toThrow(
    'invalid evaluator result',
  );
});
test('an imported or older render with no requirements receipt cannot pass current transport validation', async () => {
  const wire = encodeRenderResultV2('req', await renderGLBInProcess(code));
  if (!wire.ok) throw new Error('fixture');
  delete (wire.render as unknown as Record<string, unknown>).requirements;
  expect(() => decodeEvaluatorResultV2(JSON.stringify(wire), 1024 * 1024, 'req')).toThrow(
    'invalid evaluator result',
  );
});
