import { describe, expect, test } from 'bun:test';
import {
  decodeEvaluatorRequestV1,
  decodeEvaluatorResultV1,
  encodeRenderResultV1,
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

describe('evaluator protocol v1', () => {
  test('accepts the exact versioned request shape', () => {
    expect(decodeEvaluatorRequestV1(JSON.stringify(request))).toEqual(request);
  });

  test('rejects unknown capabilities and oversized source', () => {
    expect(() =>
      decodeEvaluatorRequestV1(JSON.stringify({ ...request, url: 'https://example.invalid' })),
    ).toThrow('invalid evaluator request');
    expect(() =>
      decodeEvaluatorRequestV1(JSON.stringify({ ...request, code: 'x'.repeat(513 * 1024) })),
    ).toThrow('invalid evaluator request');
    expect(() =>
      decodeEvaluatorRequestV1(
        JSON.stringify({ ...request, options: { ...request.options, category: 'spaceship' } }),
      ),
    ).toThrow('invalid evaluator request');
  });

  test('round-trips binary fields and verifies the exact GLB identity', () => {
    const glb = Buffer.from('glTF-test');
    const hash = `sha256:${new Bun.CryptoHasher('sha256').update(glb).digest('hex')}` as const;
    const wire = encodeRenderResultV1('render-1', {
      glb,
      artifactGlbSha256: hash,
      tris: 0,
      meta: { name: 'Box' },
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
    });
    const decoded = decodeEvaluatorResultV1(JSON.stringify(wire), 1024);
    expect(decoded.version).toBe(EVALUATOR_RESULT_VERSION);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) {
      expect(decoded.render.glb).toEqual(glb);
      expect(decoded.render.diagnosticViews?.[0]?.png).toEqual(Buffer.from('png'));
    }

    if (!wire.ok) throw new Error('expected success wire result');
    const corrupt = {
      ...wire,
      render: { ...wire.render, artifactGlbSha256: `sha256:${'0'.repeat(64)}` },
    };
    expect(() => decodeEvaluatorResultV1(JSON.stringify(corrupt), 1024)).toThrow(
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
    expect(() => decodeEvaluatorResultV1(JSON.stringify(failure), 1024)).toThrow(
      'invalid evaluator result',
    );
  });
});
