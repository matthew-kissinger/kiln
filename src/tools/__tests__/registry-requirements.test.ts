import { expect, test } from 'bun:test';
import { createKilnProgramToolRegistry, createKilnNativeToolRegistry } from '../registry';
import { createAssetRequirementsStore } from '../../requirements-store';
import { createAssetRequirementsV1 } from '../../contracts/requirements';
import { inspect } from '../../inspect';
import { renderGLBInProcess } from '../../render';
import type { RequirementsContext } from '../../requirements-context';

const source = `const meta={name:'Box',category:'vehicle',requirements:{}};
function build(){const r=createRoot('Box');createPart('Body',boxGeo(1,1,1),gameMaterial('#777777'),{parent:r});return r;}`;
function binding(lineageId: string) {
  return createAssetRequirementsStore().host.bind(
    { taskId: 'brief', lineageId },
    createAssetRequirementsV1({ labels: ['roofless arena'] }),
    { actor: 'owner', reason: 'Asset brief', source: 'brief' },
  );
}
async function call(
  registry: ReturnType<typeof createKilnProgramToolRegistry>,
  name: string,
  input: unknown,
) {
  return (await registry.find((tool) => tool.name === name)!.run(input)) as {
    requirements: RequirementsContext;
    qaReport: { schemaVersion: number; category?: string };
    validationScope?: string;
  };
}

test('neutral tools expose the resolved requirements without promoting authored labels', async () => {
  const tools = createKilnProgramToolRegistry();
  const syntax = await call(tools, 'kiln_validate', { code: source });
  const rendered = await call(tools, 'kiln_render', { code: source });
  expect(syntax.validationScope).toBe('syntax-and-sandbox');
  expect(syntax.requirements.binding).toBeUndefined();
  expect(rendered.requirements).toEqual(syntax.requirements);
  expect(rendered.qaReport.schemaVersion).toBe(2);
  expect(rendered.qaReport.category).toBeUndefined();
});

test('independent asset contexts retain their own binding with identical source', async () => {
  const a = binding('arena');
  const b = binding('display');
  const [left, right] = await Promise.all(
    [a, b].map((requirements) =>
      call(createKilnProgramToolRegistry({ requirements }), 'kiln_render', {
        code: source,
      }),
    ),
  );
  expect(left!.requirements.binding).toEqual(a);
  expect(right!.requirements.binding).toEqual(b);
  const report = await inspect(source, { requirements: a });
  expect(report.requirements.binding).toEqual(a);
});

test('evaluation snapshots a binding before an asynchronous host can change its input', async () => {
  const requirements = binding('before');
  const tools = createKilnProgramToolRegistry({
    requirements,
    evaluatorPort: {
      render: async (code, options) => {
        requirements.lineageId = 'changed-after-dispatch';
        return renderGLBInProcess(code, options);
      },
    },
  });
  const rendered = await call(tools, 'kiln_render', { code: source });
  expect(rendered.requirements.binding!.lineageId).toBe('before');
});

test('legacy host category is rejected when constructing both tool surfaces', () => {
  expect(() => createKilnNativeToolRegistry({ category: 'prop' }, {})).toThrow(
    'explicit migration',
  );
  expect(() => createKilnProgramToolRegistry({ category: 'vehicle' })).toThrow(
    'explicit migration',
  );
});
