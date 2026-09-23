import { describe, expect, test } from 'bun:test';
import { renderGLBInProcess } from '../render';
import { AssetQaBlockedError } from '../qa/run';
import { resolveRequirementsContext } from '../requirements-context';
import { createRequirementsQaReport } from '../qa/requirements-report';
import {
  createEvaluatorPortV2,
  createEvaluatorRequestV2,
  decodeEvaluatorRequestV2,
  decodeEvaluatorResultV2,
  encodeRenderResultV2,
  EVALUATOR_REQUEST_VERSION,
  EVALUATOR_RESULT_VERSION,
} from './protocol';

const request = {
  version: EVALUATOR_REQUEST_VERSION,
  requestId: 'render-1',
  operation: 'execute-export-glb' as const,
  code: "const meta={name:'Box'}; function build(){return createRoot('Box');}",
  options: { optimize: 'off' as const },
  limits: { maxGlbBytes: 1024 },
};
const BOX_CODE = `
const meta={name:'Box'};
function build(){
  const root=createRoot('Box');
  createPart('Body', boxGeo(1,1,1), gameMaterial('#777777'), {parent:root});
  return root;
}`;

describe('evaluator protocol v2', () => {
  test('rejects a host diagnostic console rather than serializing its methods away', () => {
    expect(() =>
      createEvaluatorRequestV2({
        requestId: 'console-1',
        code: BOX_CODE,
        options: { diagnosticConsole: console },
      }),
    ).toThrow('host console capability');
  });
  test('uses a new execution version and rejects old envelopes without fallback decoding', async () => {
    expect(EVALUATOR_REQUEST_VERSION as string).toBe('kiln.evaluator.request.v2');
    expect(EVALUATOR_RESULT_VERSION as string).toBe('kiln.evaluator.result.v2');
    expect(() =>
      decodeEvaluatorRequestV2(
        JSON.stringify({ ...request, version: 'kiln.evaluator.request.v1' }),
      ),
    ).toThrow('invalid evaluator request');
    const wire = encodeRenderResultV2('render-1', await renderGLBInProcess(BOX_CODE));
    expect(() =>
      decodeEvaluatorResultV2(
        JSON.stringify({ ...wire, version: 'kiln.evaluator.result.v1' }),
        1024 * 1024,
      ),
    ).toThrow('invalid evaluator result');
  });
  test('accepts the exact versioned request shape', () => {
    expect(decodeEvaluatorRequestV2(JSON.stringify(request))).toEqual(request);
  });

  test('rejects unknown capabilities and oversized source', () => {
    expect(() =>
      decodeEvaluatorRequestV2(JSON.stringify({ ...request, url: 'https://example.invalid' })),
    ).toThrow('invalid evaluator request');
    expect(() =>
      decodeEvaluatorRequestV2(JSON.stringify({ ...request, code: 'x'.repeat(513 * 1024) })),
    ).toThrow('invalid evaluator request');
    expect(() =>
      decodeEvaluatorRequestV2(
        JSON.stringify({ ...request, options: { ...request.options, category: 'spaceship' } }),
      ),
    ).toThrow('explicit migration');
  });

  test('round-trips binary fields and verifies the exact GLB identity', () => {
    const glb = Buffer.from('glTF-test');
    const hash = `sha256:${new Bun.CryptoHasher('sha256').update(glb).digest('hex')}` as const;
    const wire = encodeRenderResultV2('render-1', {
      glb,
      requirements: resolveRequirementsContext(),
      artifactGlbSha256: hash,
      tris: 0,
      meta: {
        name: 'Box',
        qaReport: createRequirementsQaReport(resolveRequirementsContext(), { executedRules: [] }),
      },
      warnings: [],
      diagnosticViews: [
        {
          id: 'front',
          label: 'Front',
          width: 1,
          height: 1,
          png: Buffer.from('png'),
        },
      ] as never,
      integrationManifest: {} as never,
      buildCache: { key: hash, hit: true },
    });
    const decoded = decodeEvaluatorResultV2(JSON.stringify(wire), 1024);
    expect(decoded.version).toBe(EVALUATOR_RESULT_VERSION);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) {
      expect(decoded.render.glb).toEqual(glb);
      expect(decoded.render.diagnosticViews?.[0]?.png).toEqual(Buffer.from('png'));
    }

    if (!wire.ok) throw new Error('expected success wire result');
    expect(wire.render.buildCache).toBeUndefined();
    expect(() =>
      decodeEvaluatorResultV2(
        JSON.stringify({
          ...wire,
          render: { ...wire.render, buildCache: { key: hash, hit: true } },
        }),
        1024,
      ),
    ).toThrow('invalid evaluator result');
    const corrupt = {
      ...wire,
      render: { ...wire.render, artifactGlbSha256: `sha256:${'0'.repeat(64)}` },
    };
    expect(() => decodeEvaluatorResultV2(JSON.stringify(corrupt), 1024)).toThrow(
      'invalid evaluator result',
    );
  });

  test('rejects worker-controlled error text even when the outcome code is valid', () => {
    const failure = {
      version: EVALUATOR_RESULT_VERSION,
      requestId: 'render-1',
      ok: false,
      error: {
        code: 'EXECUTION_REJECTED',
        message: 'provider prompt /app/private.ts sk-not-a-real-secret-but-sensitive',
      },
    };
    expect(() => decodeEvaluatorResultV2(JSON.stringify(failure), 1024)).toThrow(
      'invalid evaluator result',
    );
  });

  test('rejects malformed or unbound QA evidence from a remote worker', () => {
    const malformed = {
      version: EVALUATOR_RESULT_VERSION,
      requestId: 'render-1',
      ok: false,
      error: {
        code: 'QA_BLOCKED',
        message: 'Generated asset did not pass quality checks.',
        qa: { report: { disposition: 'block', source: 'untrusted' }, stage: 'scene' },
      },
    };
    expect(() => decodeEvaluatorResultV2(JSON.stringify(malformed), 1024, 'render-1')).toThrow(
      'invalid evaluator result',
    );
    expect(() =>
      decodeEvaluatorResultV2(
        JSON.stringify({
          ...malformed,
          error: {
            code: 'EXECUTION_REJECTED',
            message: 'Generated asset execution was rejected.',
            qa: malformed.error.qa,
          },
        }),
        1024,
        'render-1',
      ),
    ).toThrow('invalid evaluator result');
  });

  test('builds exact transport-neutral requests and rejects host capabilities', () => {
    const built = createEvaluatorRequestV2({
      requestId: 'remote-42',
      code: BOX_CODE,
      options: { optimize: 'auto' },
      maxGlbBytes: 2048,
    });
    expect(JSON.parse(built.json)).toEqual(built.request);
    expect(built.request).toMatchObject({
      version: 'kiln.evaluator.request.v2',
      requestId: 'remote-42',
      operation: 'execute-export-glb',
      limits: { maxGlbBytes: 2048 },
    });
    expect(() =>
      createEvaluatorRequestV2({
        requestId: 'remote-43',
        code: BOX_CODE,
        options: { textureResolver: (async () => undefined) as never },
      }),
    ).toThrow('host resolver');
  });

  test('binds the response to the caller request id and enforces transport caps', async () => {
    const direct = await renderGLBInProcess(BOX_CODE);
    const port = createEvaluatorPortV2(async (requestJson) => {
      const request = decodeEvaluatorRequestV2(requestJson);
      return JSON.stringify(encodeRenderResultV2(`${request.requestId}-wrong`, direct));
    });
    await expect(port.render(BOX_CODE)).rejects.toMatchObject({ code: 'PROTOCOL_ERROR' });

    const oversized = createEvaluatorPortV2(async () => 'x'.repeat(2049), {
      maxResponseBytes: 2048,
    });
    await expect(oversized.render(BOX_CODE)).rejects.toMatchObject({
      code: 'OUTPUT_LIMIT_EXCEEDED',
    });

    const stalled = createEvaluatorPortV2(() => new Promise(() => {}), { deadlineMs: 10 });
    await expect(stalled.render(BOX_CODE)).rejects.toMatchObject({ code: 'DEADLINE_EXCEEDED' });
  });

  test('preserves bounded QA evidence for the existing repair loop', async () => {
    const direct = await renderGLBInProcess(BOX_CODE);
    const report = createRequirementsQaReport(resolveRequirementsContext(), {
      executedRules: [],
      findings: [
        {
          code: 'UNIVERSAL_EMPTY_OUTPUT',
          disposition: 'block',
          dimension: 'exportIntegrity',
          profile: 'universal',
          message: 'Fixture blocker.',
        },
      ],
    });
    const port = createEvaluatorPortV2(async (requestJson) => {
      const decoded = decodeEvaluatorRequestV2(requestJson);
      return JSON.stringify({
        version: EVALUATOR_RESULT_VERSION,
        requestId: decoded.requestId,
        ok: false,
        error: {
          code: 'QA_BLOCKED',
          message: 'Generated asset did not pass quality checks.',
          qa: { report, stage: 'scene' },
        },
      });
    });
    try {
      await port.render(BOX_CODE);
      throw new Error(`expected QA block for ${direct.artifactGlbSha256}`);
    } catch (error) {
      expect(error).toBeInstanceOf(AssetQaBlockedError);
      expect((error as AssetQaBlockedError).report).toEqual(report);
    }
  });
});
