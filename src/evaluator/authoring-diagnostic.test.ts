import { createKilnProgramToolRegistry } from '../tools/registry';
import { expect, test } from 'bun:test';
import { evaluateEvaluatorRequestV1 } from './handler';
import {
  createEvaluatorRequestV1,
  decodeEvaluatorResultV1,
  createEvaluatorPortV1,
} from './protocol';
import { renderGLBViaSubprocess } from './subprocess';
const code = `function build(){const uvs=[];new THREE.Float32BufferAttribute(uv,2);return createRoot('Duct');}`;
const request = () => createEvaluatorRequestV1({ requestId: 'diagnostic', code }).json;

test('rounded box radius boundary gets a closed hint through handler, subprocess, and registry', async () => {
  const source = `async function build(){await roundedBoxGeo(0.28,0.068,0.012,0.006);return createRoot('PRIVATE_SOURCE_MARKER');}`;
  const wire = await evaluateEvaluatorRequestV1(
    createEvaluatorRequestV1({ requestId: 'rounded-box', code: source }).json,
  );
  expect(JSON.parse(wire).error).toEqual({
    code: 'EXECUTION_REJECTED',
    message: 'Generated asset execution was rejected.',
    diagnostic: 'ROUNDED_BOX_RADIUS',
  });
  const decoded = decodeEvaluatorResultV1(wire, 100000, 'rounded-box');
  expect(decoded.ok).toBe(false);
  const invalidOutcome = JSON.parse(wire);
  invalidOutcome.error.code = 'WORKER_FAILED';
  invalidOutcome.error.message = 'Evaluator worker failed.';
  expect(() =>
    decodeEvaluatorResultV1(JSON.stringify(invalidOutcome), 100000, 'rounded-box'),
  ).toThrow();
  const error = await renderGLBViaSubprocess(source).catch((error: unknown) => error);
  expect(error).toMatchObject({
    code: 'EXECUTION_REJECTED',
    diagnostic: 'ROUNDED_BOX_RADIUS',
  });
  expect(String(error)).toContain('radius must be less than half the smallest dimension');
  const defs = createKilnProgramToolRegistry({ evaluatorPort: { render: renderGLBViaSubprocess } });
  const out = (await defs.find((d) => d.name === 'kiln_render')!.run({ code: source })) as {
    ok: boolean;
    error: string;
  };
  expect(out.ok).toBe(false);
  expect(out.error).toContain('radius must be less than half the smallest dimension');
  for (const output of [wire, String(error), out.error]) {
    for (const privateValue of ['0.006', '0.012', 'PRIVATE_SOURCE_MARKER', 'profile.ts']) {
      expect(output).not.toContain(privateValue);
    }
  }
}, 20000);
test('gear radii mistakes receive a closed repair hint through handler and actual subprocess', async () => {
  const source = `function build(){const root=createRoot('Lens');createPart('Gear',gearGeo({teeth:28,tipRadius:0.075,boreRadius:0.012,height:0.024}),gameMaterial(0x909090),{parent:root});return root;}`;
  const wire = await evaluateEvaluatorRequestV1(
    createEvaluatorRequestV1({ requestId: 'gear', code: source }).json,
  );
  expect(JSON.parse(wire).error.diagnostic).toBe('GEAR_RADII_ORDER');
  expect(wire).not.toContain('0.075');
  await expect(renderGLBViaSubprocess(source)).rejects.toMatchObject({
    code: 'EXECUTION_REJECTED',
    diagnostic: 'GEAR_RADII_ORDER',
  });
  await expect(renderGLBViaSubprocess(source)).rejects.toThrow(
    'specify rootRadius when changing tipRadius',
  );
}, 20000);
test('undeclared variable gets bounded actionable diagnostic through handler and port', async () => {
  const wire = await evaluateEvaluatorRequestV1(request());
  expect(JSON.parse(wire).error.diagnostic).toBe('UNBOUND_VARIABLE');
  expect(wire).not.toContain('uv');
  // Request IDs are checked, so use the actual request in the transport.
  const checked = createEvaluatorPortV1(async (json) => evaluateEvaluatorRequestV1(json));
  await expect(checked.render(code)).rejects.toThrow('Check variable spelling and scope');
});
test('actual subprocess retains safe repair advice without source or exception text', async () => {
  await expect(renderGLBViaSubprocess(code)).rejects.toMatchObject({
    code: 'EXECUTION_REJECTED',
    diagnostic: 'UNBOUND_VARIABLE',
  });
  await expect(renderGLBViaSubprocess(code)).rejects.toThrow('Check variable spelling and scope');
}, 20000);
test('diagnostic decoder rejects arbitrary strings, extra data, and inappropriate outcome codes', async () => {
  const wire = JSON.parse(await evaluateEvaluatorRequestV1(request()));
  for (const diagnostic of ['SECRET_VALUE', { code: 'UNBOUND_VARIABLE', stack: 'HOST_PATH' }]) {
    expect(() =>
      decodeEvaluatorResultV1(
        JSON.stringify({ ...wire, error: { ...wire.error, diagnostic } }),
        100000,
        'diagnostic',
      ),
    ).toThrow();
  }
  expect(() =>
    decodeEvaluatorResultV1(
      JSON.stringify({
        ...wire,
        error: {
          code: 'WORKER_FAILED',
          message: 'Evaluator worker failed.',
          diagnostic: 'UNBOUND_VARIABLE',
        },
      }),
      100000,
      'diagnostic',
    ),
  ).toThrow();
});
test('arbitrary exceptions and safety denials retain generic rejection', async () => {
  for (const source of [
    `function build(){throw new Error('SECRET_HOST_PATH');}`,
    `function build(){throw new Error('roundedBoxGeo: radius must be less than half the smallest dimension SECRET_HOST_PATH');}`,
    `function build(){throw Object.assign(new Error('SECRET_HOST_PATH'),{name:'AuthoringDiagnosticError',diagnostic:'ROUNDED_BOX_RADIUS'});}`,
    `function build(){return process.env.SECRET;}`,
  ]) {
    const result = JSON.parse(
      await evaluateEvaluatorRequestV1(
        createEvaluatorRequestV1({ requestId: 'safe', code: source }).json,
      ),
    );
    expect(result.error).toEqual({
      code: 'EXECUTION_REJECTED',
      message: 'Generated asset execution was rejected.',
    });
  }
});

test('shipping registry exposes repair advice from its isolated evaluator', async () => {
  const defs = createKilnProgramToolRegistry({ evaluatorPort: { render: renderGLBViaSubprocess } });
  const out = (await defs.find((d) => d.name === 'kiln_render')!.run({ code })) as {
    ok: boolean;
    error: string;
  };
  expect(out.ok).toBe(false);
  expect(out.error).toContain('Check variable spelling and scope');
  expect(out.error).not.toContain('uv');
}, 15000);
