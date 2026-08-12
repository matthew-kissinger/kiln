import { describe, expect, test } from 'bun:test';

import type { RenderResult } from '../render';
import {
  createEvaluatorRequestV1,
  decodeEvaluatorResultV1,
  evaluateEvaluatorRequestV1,
} from './index';

const GLB = Buffer.from('glTF strict evaluator fixture');
const HASH = `sha256:${new Bun.CryptoHasher('sha256').update(GLB).digest('hex')}` as const;
const RENDER: RenderResult = {
  glb: GLB,
  artifactGlbSha256: HASH,
  tris: 1,
  meta: {},
  warnings: [],
  integrationManifest: {
    schemaVersion: 'kiln.integration-manifest.v1',
    analyzerVersion: 1,
    artifactSha256: HASH.slice(7),
    units: 'm',
    axes: { forward: '+X', up: '+Y', right: '+Z' },
    bounds: { min: [0, 0, 0], max: [1, 1, 1], size: [1, 1, 1], center: [0.5, 0.5, 0.5] },
    pivot: { convention: 'author-origin', position: [0, 0, 0] },
    ground: { groundY: 0, contactTolerance: 0.02, minY: 0, offsetToGround: 0, grounded: true },
    defaultScene: { index: 0, name: 'Scene' },
    renderMetrics: {
      triangles: 1,
      drawCalls: 1,
      uniqueGeometries: 1,
      uniqueMaterials: 1,
      textureCount: 0,
      transparentMaterials: 0,
      skinned: false,
    },
    structuralQa: {
      hasDefaultScene: true,
      finiteBounds: true,
      validatorErrors: 0,
      validatorWarnings: 0,
    },
    visualQa: 'not_assessed',
  },
};

describe('transport-neutral evaluator handler', () => {
  test('reuses the strict protocol and canonical result encoding', async () => {
    const built = createEvaluatorRequestV1({ requestId: 'http-1', code: 'fixture' });
    const resultJson = await evaluateEvaluatorRequestV1(built.json, {
      render: async () => RENDER,
    });
    expect(decodeEvaluatorResultV1(resultJson, 1024, 'http-1')).toMatchObject({
      ok: true,
      requestId: 'http-1',
      render: { artifactGlbSha256: HASH },
    });
  });

  test('sanitizes execution failures and refuses oversized encoded output', async () => {
    const built = createEvaluatorRequestV1({ requestId: 'http-2', code: 'private source marker' });
    const failed = await evaluateEvaluatorRequestV1(built.json, {
      render: async () => {
        throw new Error('private source marker and /secret/path');
      },
    });
    expect(failed).not.toContain('private source marker');
    expect(failed).not.toContain('/secret/path');
    expect(decodeEvaluatorResultV1(failed, 1024, 'http-2')).toMatchObject({
      ok: false,
      error: { code: 'EXECUTION_REJECTED' },
    });
    await expect(
      evaluateEvaluatorRequestV1(
        built.json,
        { render: async () => RENDER },
        {
          maxResponseBytes: 32,
        },
      ),
    ).rejects.toMatchObject({ code: 'OUTPUT_LIMIT_EXCEEDED' });
  });

  test('bounds the transport-neutral execution deadline', async () => {
    const built = createEvaluatorRequestV1({ requestId: 'http-deadline', code: 'fixture' });
    const failed = await evaluateEvaluatorRequestV1(
      built.json,
      { render: () => new Promise(() => {}) },
      { deadlineMs: 5 },
    );
    expect(decodeEvaluatorResultV1(failed, 1024, 'http-deadline')).toMatchObject({
      ok: false,
      error: { code: 'DEADLINE_EXCEEDED' },
    });
  });
});
