import { createHash } from 'node:crypto';
import { isAssetCategory, validateAssetIntentV1, type AssetIntentV1 } from '../contracts';
import type { RenderGlbOptions, RenderResult } from '../render';
import type { KhronosGltfValidationReport } from '../qa/gltf';
import type { AssetQaReportV1 } from '../qa/types';

export const EVALUATOR_REQUEST_VERSION = 'kiln.evaluator.request.v1' as const;
export const EVALUATOR_RESULT_VERSION = 'kiln.evaluator.result.v1' as const;
export const MAX_EVALUATOR_CODE_BYTES = 512 * 1024;
export const MAX_EVALUATOR_REQUEST_BYTES = 1024 * 1024;

export type EvaluatorOutcomeCode =
  | 'INPUT_INVALID'
  | 'EXECUTION_REJECTED'
  | 'QA_BLOCKED'
  | 'DEADLINE_EXCEEDED'
  | 'OUTPUT_LIMIT_EXCEEDED'
  | 'WORKER_FAILED'
  | 'PROTOCOL_ERROR';

export interface EvaluatorRequestV1 {
  version: typeof EVALUATOR_REQUEST_VERSION;
  requestId: string;
  operation: 'execute-export-glb';
  code: string;
  options: Omit<RenderGlbOptions, 'textureResolver'>;
  limits: { maxGlbBytes: number };
}

interface WireDiagnosticView {
  [key: string]: unknown;
  pngBase64: string;
}

interface WireRenderResult extends Omit<RenderResult, 'glb' | 'diagnosticViews'> {
  glbBase64: string;
  diagnosticViews?: WireDiagnosticView[];
}

export type EvaluatorResultV1 =
  | {
      version: typeof EVALUATOR_RESULT_VERSION;
      requestId: string;
      ok: true;
      render: RenderResult;
    }
  | {
      version: typeof EVALUATOR_RESULT_VERSION;
      requestId: string;
      ok: false;
      error: {
        code: EvaluatorOutcomeCode;
        message: string;
        qa?: {
          report: AssetQaReportV1;
          stage: 'scene' | 'final-glb';
          gltfValidation?: KhronosGltfValidationReport;
        };
      };
    };

export type WireEvaluatorResultV1 =
  | (Omit<Extract<EvaluatorResultV1, { ok: true }>, 'render'> & { render: WireRenderResult })
  | Extract<EvaluatorResultV1, { ok: false }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function fail(kind: 'request' | 'result'): never {
  throw new Error(`invalid evaluator ${kind}`);
}

function validRequestId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9._-]{1,64}$/.test(value);
}

function validInteger(value: unknown, min: number, max: number): value is number {
  return Number.isInteger(value) && Number(value) >= min && Number(value) <= max;
}

function parseOptions(value: unknown): Omit<RenderGlbOptions, 'textureResolver'> {
  if (!isRecord(value) || !hasExactKeys(value, ['optimize', 'instance', 'intent', 'category'])) {
    return fail('request');
  }
  const options: Omit<RenderGlbOptions, 'textureResolver'> = {};
  if (value.optimize !== undefined) {
    if (!['off', 'auto', 'palette', 'full'].includes(String(value.optimize))) fail('request');
    options.optimize = value.optimize as NonNullable<RenderGlbOptions['optimize']>;
  }
  if (value.instance !== undefined) {
    if (!['off', 'auto', 'on'].includes(String(value.instance))) fail('request');
    options.instance = value.instance as NonNullable<RenderGlbOptions['instance']>;
  }
  if (value.category !== undefined) {
    if (!isAssetCategory(value.category)) fail('request');
    options.category = value.category;
  }
  if (value.intent !== undefined) {
    const result = validateAssetIntentV1(value.intent);
    if (!result.valid) fail('request');
    options.intent = result.value as AssetIntentV1;
  }
  return options;
}

export function decodeEvaluatorRequestV1(json: string): EvaluatorRequestV1 {
  if (Buffer.byteLength(json, 'utf8') > MAX_EVALUATOR_REQUEST_BYTES) fail('request');
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    return fail('request');
  }
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['version', 'requestId', 'operation', 'code', 'options', 'limits']) ||
    value.version !== EVALUATOR_REQUEST_VERSION ||
    !validRequestId(value.requestId) ||
    value.operation !== 'execute-export-glb' ||
    typeof value.code !== 'string' ||
    Buffer.byteLength(value.code, 'utf8') > MAX_EVALUATOR_CODE_BYTES ||
    !isRecord(value.limits) ||
    !hasExactKeys(value.limits, ['maxGlbBytes']) ||
    !validInteger(value.limits.maxGlbBytes, 1, 64 * 1024 * 1024)
  ) {
    return fail('request');
  }
  return {
    version: EVALUATOR_REQUEST_VERSION,
    requestId: value.requestId,
    operation: 'execute-export-glb',
    code: value.code,
    options: parseOptions(value.options),
    limits: { maxGlbBytes: value.limits.maxGlbBytes },
  };
}

export function encodeRenderResultV1(
  requestId: string,
  render: RenderResult,
): WireEvaluatorResultV1 {
  const { glb, diagnosticViews, ...rest } = render;
  return {
    version: EVALUATOR_RESULT_VERSION,
    requestId,
    ok: true,
    render: {
      ...rest,
      glbBase64: glb.toString('base64'),
      ...(diagnosticViews
        ? {
            diagnosticViews: diagnosticViews.map(({ png, ...view }) => ({
              ...view,
              pngBase64: Buffer.from(png).toString('base64'),
            })),
          }
        : {}),
    },
  };
}

function isSha256(value: unknown): value is `sha256:${string}` {
  return typeof value === 'string' && /^sha256:[a-f0-9]{64}$/.test(value);
}

export function decodeEvaluatorResultV1(json: string, maxGlbBytes: number): EvaluatorResultV1 {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    return fail('result');
  }
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['version', 'requestId', 'ok', 'render', 'error']) ||
    value.version !== EVALUATOR_RESULT_VERSION ||
    !validRequestId(value.requestId) ||
    typeof value.ok !== 'boolean'
  ) {
    return fail('result');
  }
  if (!value.ok) {
    if (value.render !== undefined) return fail('result');
    if (!isRecord(value.error) || !hasExactKeys(value.error, ['code', 'message', 'qa'])) {
      return fail('result');
    }
    const codes: EvaluatorOutcomeCode[] = [
      'INPUT_INVALID',
      'EXECUTION_REJECTED',
      'QA_BLOCKED',
      'DEADLINE_EXCEEDED',
      'OUTPUT_LIMIT_EXCEEDED',
      'WORKER_FAILED',
      'PROTOCOL_ERROR',
    ];
    if (
      !codes.includes(value.error.code as EvaluatorOutcomeCode) ||
      typeof value.error.message !== 'string'
    ) {
      return fail('result');
    }
    return value as unknown as Extract<EvaluatorResultV1, { ok: false }>;
  }
  if (value.error !== undefined || !isRecord(value.render)) fail('result');
  const renderKeys = [
    'glbBase64',
    'artifactGlbSha256',
    'tris',
    'meta',
    'warnings',
    'diagnosticViews',
    'materialMetrics',
    'materialRecipeApplications',
    'materialResourceProvenance',
    'bakedTextures',
    'integrationManifest',
  ] as const;
  if (
    !hasExactKeys(value.render, renderKeys) ||
    typeof value.render.glbBase64 !== 'string' ||
    !validInteger(value.render.tris, 0, Number.MAX_SAFE_INTEGER) ||
    !isRecord(value.render.meta) ||
    !Array.isArray(value.render.warnings) ||
    !value.render.warnings.every((warning) => typeof warning === 'string') ||
    !isRecord(value.render.integrationManifest)
  ) {
    fail('result');
  }
  const glb = Buffer.from(value.render.glbBase64, 'base64');
  if (glb.byteLength > maxGlbBytes || glb.toString('base64') !== value.render.glbBase64)
    fail('result');
  if (!isSha256(value.render.artifactGlbSha256)) fail('result');
  const actualHash = `sha256:${createHash('sha256').update(glb).digest('hex')}`;
  if (actualHash !== value.render.artifactGlbSha256) fail('result');
  const diagnosticViews = value.render.diagnosticViews;
  if (diagnosticViews !== undefined && !Array.isArray(diagnosticViews)) fail('result');
  const decodedViews = diagnosticViews?.map((candidate) => {
    if (!isRecord(candidate) || typeof candidate.pngBase64 !== 'string') return fail('result');
    const png = Buffer.from(candidate.pngBase64, 'base64');
    if (png.toString('base64') !== candidate.pngBase64) return fail('result');
    const { pngBase64: _, ...view } = candidate;
    return { ...view, png };
  });
  const { glbBase64: _, diagnosticViews: __, ...rest } = value.render;
  return {
    version: EVALUATOR_RESULT_VERSION,
    requestId: value.requestId,
    ok: true,
    render: {
      ...rest,
      glb,
      ...(decodedViews ? { diagnosticViews: decodedViews } : {}),
    } as unknown as RenderResult,
  };
}
