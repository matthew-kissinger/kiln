import { test, expect } from 'bun:test';
import { renderGLBViaSubprocess } from '../evaluator/subprocess';
import { createEvaluatorRequestV1, decodeEvaluatorRequestV1 } from '../evaluator/protocol';
import { createKilnProgramToolRegistry } from '../tools/registry';
import { createLocalToolContext } from '../local-runtime';
const code = (colors = false) =>
  `const meta={name:'policy',category:'prop'};function build(){const root=createRoot('Root');const geo=boxGeo(1,1,1);${colors ? "geo.setAttribute('color',geo.getAttribute('position').clone());" : ''}createPart('Body',geo,gameMaterial('#888888'),{parent:root});return root;}`;
test('geometry export policy roundtrips through strict worker protocol and rejects unknown policy', () => {
  const request = createEvaluatorRequestV1({
    requestId: 'policy',
    code: code(),
    options: { geometryPolicy: 'strict' },
  });
  expect(decodeEvaluatorRequestV1(request.json).options.geometryPolicy).toBe('strict');
  expect(() =>
    createEvaluatorRequestV1({
      requestId: 'policy',
      code: code(),
      options: { geometryPolicy: 'ignore' as never },
    }),
  ).toThrow();
});
test('subprocess strict accepts supported geometry and rejects vertex colors while default warns', async () => {
  expect(
    (await renderGLBViaSubprocess(code(), { geometryPolicy: 'strict' })).glb.byteLength,
  ).toBeGreaterThan(0);
  const warn = await renderGLBViaSubprocess(code(true));
  expect(warn.warnings.join(' ')).toMatch(/EXPORT_ATTRIBUTE_UNSUPPORTED/);
  await expect(renderGLBViaSubprocess(code(true), { geometryPolicy: 'strict' })).rejects.toThrow();
}, 30000);
test('public host strict policy cannot be weakened by a model argument', async () => {
  const defs = createKilnProgramToolRegistry({ geometryPolicy: 'strict' });
  const out = (await defs
    .find((d) => d.name === 'kiln_render')!
    .run({ code: code(true), geometryPolicy: 'warn' })) as { ok: boolean; error: string };
  expect(out.ok).toBe(false);
  expect(out.error).toMatch(/EXPORT_ATTRIBUTE_UNSUPPORTED/);
});
test('local host validates geometry policy and prevents caller downgrade', async () => {
  expect(() => createLocalToolContext({}, { KILN_GEOMETRY_POLICY: 'ignore' })).toThrow(
    /KILN_GEOMETRY_POLICY/,
  );
  const context = createLocalToolContext(
    {},
    { KILN_EVALUATOR_MODE: 'in-process', KILN_GEOMETRY_POLICY: 'strict' },
  );
  await expect(
    context.evaluatorPort!.render(code(true), { geometryPolicy: 'warn' }),
  ).rejects.toThrow(/EXPORT_ATTRIBUTE_UNSUPPORTED/);
});
