import { createHash } from 'node:crypto';
import { isAssetCategory, validateAssetIntentV1, type AssetIntentV1 } from '../contracts';
import type { RenderGlbOptions, RenderResult } from '../render';
import type { KhronosGltfValidationReport } from '../qa/gltf';
import { isQaFinding, QA_DIMENSIONS, type AssetQaReportV1 } from '../qa/types';

export const EVALUATOR_REQUEST_VERSION = 'kiln.evaluator.request.v1' as const;
export const EVALUATOR_RESULT_VERSION = 'kiln.evaluator.result.v1' as const;
export const MAX_EVALUATOR_CODE_BYTES = 512 * 1024;
export const MAX_EVALUATOR_REQUEST_BYTES = 1024 * 1024;
export const DEFAULT_EVALUATOR_DEADLINE_MS = 60_000;
export const DEFAULT_EVALUATOR_MAX_GLB_BYTES = 16 * 1024 * 1024;
export const DEFAULT_EVALUATOR_MAX_RESPONSE_BYTES = 32 * 1024 * 1024;

export type EvaluatorOutcomeCode =
  | 'INPUT_INVALID'
  | 'EXECUTION_REJECTED'
  | 'QA_BLOCKED'
  | 'DEADLINE_EXCEEDED'
  | 'OUTPUT_LIMIT_EXCEEDED'
  | 'ISOLATION_UNAVAILABLE'
  | 'WORKER_FAILED'
  | 'PROTOCOL_ERROR';

const EVALUATOR_OUTCOME_MESSAGES: Record<EvaluatorOutcomeCode, string> = {
  INPUT_INVALID: 'Evaluator request was invalid.',
  EXECUTION_REJECTED: 'Generated asset execution was rejected.',
  QA_BLOCKED: 'Generated asset did not pass quality checks.',
  DEADLINE_EXCEEDED: 'Evaluator deadline exceeded.',
  OUTPUT_LIMIT_EXCEEDED: 'Evaluator output limit exceeded.',
  ISOLATION_UNAVAILABLE: 'Isolated evaluator is unavailable.',
  WORKER_FAILED: 'Evaluator worker failed.',
  PROTOCOL_ERROR: 'Evaluator returned invalid data.',
};

export function evaluatorOutcomeMessage(code: EvaluatorOutcomeCode): string {
  return EVALUATOR_OUTCOME_MESSAGES[code];
}

export interface EvaluatorRequestV1 {
  version: typeof EVALUATOR_REQUEST_VERSION;
  requestId: string;
  operation: 'execute-export-glb';
  code: string;
  options: Omit<RenderGlbOptions, 'textureResolver'>;
  limits: { maxGlbBytes: number };
}

export interface CreateEvaluatorRequestV1Input {
  requestId: string;
  code: string;
  options?: RenderGlbOptions;
  maxGlbBytes?: number;
}

export interface EvaluatorTransportControlsV1 {
  deadlineMs: number;
  maxResponseBytes: number;
}

export type EvaluatorTransportV1 = (
  requestJson: string,
  controls: Readonly<EvaluatorTransportControlsV1>,
) => Promise<string>;

export interface EvaluatorPortCallControlsV1 {
  deadlineMs?: number;
  maxGlbBytes?: number;
  maxResponseBytes?: number;
}

export interface EvaluatorPortV1 {
  render(
    code: string,
    options?: RenderGlbOptions,
    controls?: EvaluatorPortCallControlsV1,
  ): Promise<RenderResult>;
}

export type EvaluatorExecutionProfileV1 = 'trusted-local' | 'evaluator-required';

export function resolveEvaluatorPortV1(
  port: EvaluatorPortV1 | undefined,
  profile: EvaluatorExecutionProfileV1,
): EvaluatorPortV1 {
  if (port) return port;
  if (profile === 'evaluator-required') {
    throw new EvaluatorPortError('ISOLATION_UNAVAILABLE', 'Evaluator port is required.');
  }
  return trustedInProcessEvaluatorPortV1;
}

export class EvaluatorPortError extends Error {
  constructor(
    readonly code: EvaluatorOutcomeCode,
    message = evaluatorOutcomeMessage(code),
  ) {
    super(message);
    this.name = 'EvaluatorPortError';
  }
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

function validQaReport(value: unknown): value is AssetQaReportV1 {
  const dimensions = isRecord(value) && isRecord(value.dimensions) ? value.dimensions : undefined;
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['schemaVersion', 'category', 'qaProfile', 'disposition', 'dimensions']) ||
    value.schemaVersion !== 1 ||
    !isAssetCategory(value.category) ||
    typeof value.qaProfile !== 'string' ||
    value.qaProfile.length < 1 ||
    value.qaProfile.length > 128 ||
    !['pass', 'warn', 'block', 'notEvaluated', 'legacy-unassessed'].includes(
      String(value.disposition),
    ) ||
    !dimensions ||
    !hasExactKeys(dimensions, QA_DIMENSIONS) ||
    !QA_DIMENSIONS.every((dimension) => dimension in dimensions)
  ) {
    return false;
  }
  return QA_DIMENSIONS.every((dimension) => {
    const result = dimensions[dimension];
    return (
      isRecord(result) &&
      hasExactKeys(result, ['status', 'findings', 'metrics']) &&
      ['pass', 'warn', 'block', 'notEvaluated'].includes(String(result.status)) &&
      Array.isArray(result.findings) &&
      result.findings.length <= 1_000 &&
      result.findings.every(isQaFinding) &&
      (result.metrics === undefined || isRecord(result.metrics))
    );
  });
}

function validGltfValidation(value: unknown): value is KhronosGltfValidationReport {
  const issues = isRecord(value) && isRecord(value.issues) ? value.issues : undefined;
  if (!issues || !Array.isArray(issues.messages)) {
    return false;
  }
  return (
    ['numErrors', 'numWarnings', 'numInfos', 'numHints'].every((key) =>
      validInteger(issues[key], 0, Number.MAX_SAFE_INTEGER),
    ) &&
    issues.messages.length <= 1_000 &&
    issues.messages.every(
      (issue) =>
        isRecord(issue) &&
        typeof issue.code === 'string' &&
        typeof issue.message === 'string' &&
        typeof issue.severity === 'number' &&
        Number.isFinite(issue.severity),
    )
  );
}

function boundedControl(value: number | undefined, fallback: number, max: number): number {
  const resolved = value ?? fallback;
  if (!validInteger(resolved, 1, max)) {
    throw new EvaluatorPortError('INPUT_INVALID');
  }
  return resolved;
}

export function createEvaluatorRequestV1(input: CreateEvaluatorRequestV1Input): {
  request: EvaluatorRequestV1;
  json: string;
} {
  if (input.options?.textureResolver) {
    throw new EvaluatorPortError(
      'INPUT_INVALID',
      'Evaluator requests do not accept a host resolver capability.',
    );
  }
  const maxGlbBytes = boundedControl(
    input.maxGlbBytes,
    DEFAULT_EVALUATOR_MAX_GLB_BYTES,
    64 * 1024 * 1024,
  );
  const { textureResolver: _, ...options } = input.options ?? {};
  const request: EvaluatorRequestV1 = {
    version: EVALUATOR_REQUEST_VERSION,
    requestId: input.requestId,
    operation: 'execute-export-glb',
    code: input.code,
    options,
    limits: { maxGlbBytes },
  };
  const json = JSON.stringify(request);
  // Reuse the strict decoder as the single authority for ids, source, options,
  // prototype-key rejection, and request budgets.
  const decoded = decodeEvaluatorRequestV1(json);
  return { request: decoded, json };
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

export function decodeEvaluatorResultV1(
  json: string,
  maxGlbBytes: number,
  expectedRequestId?: string,
): EvaluatorResultV1 {
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
  if (expectedRequestId !== undefined && value.requestId !== expectedRequestId) fail('result');
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
      'ISOLATION_UNAVAILABLE',
      'WORKER_FAILED',
      'PROTOCOL_ERROR',
    ];
    if (
      !codes.includes(value.error.code as EvaluatorOutcomeCode) ||
      typeof value.error.message !== 'string' ||
      value.error.message !== evaluatorOutcomeMessage(value.error.code as EvaluatorOutcomeCode)
    ) {
      return fail('result');
    }
    if (value.error.qa !== undefined) {
      if (
        value.error.code !== 'QA_BLOCKED' ||
        !isRecord(value.error.qa) ||
        !hasExactKeys(value.error.qa, ['report', 'stage', 'gltfValidation']) ||
        !validQaReport(value.error.qa.report) ||
        !['scene', 'final-glb'].includes(String(value.error.qa.stage)) ||
        (value.error.qa.gltfValidation !== undefined &&
          !validGltfValidation(value.error.qa.gltfValidation))
      ) {
        return fail('result');
      }
    } else if (value.error.code === 'QA_BLOCKED') {
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

export function createEvaluatorPortV1(
  transport: EvaluatorTransportV1,
  defaults: EvaluatorPortCallControlsV1 = {},
): EvaluatorPortV1 {
  let sequence = 0;
  return {
    async render(code, options = {}, controls = {}) {
      const deadlineMs = boundedControl(
        controls.deadlineMs ?? defaults.deadlineMs,
        DEFAULT_EVALUATOR_DEADLINE_MS,
        120_000,
      );
      const maxGlbBytes = boundedControl(
        controls.maxGlbBytes ?? defaults.maxGlbBytes,
        DEFAULT_EVALUATOR_MAX_GLB_BYTES,
        64 * 1024 * 1024,
      );
      const maxResponseBytes = boundedControl(
        controls.maxResponseBytes ?? defaults.maxResponseBytes,
        DEFAULT_EVALUATOR_MAX_RESPONSE_BYTES,
        96 * 1024 * 1024,
      );
      const requestId = `eval-${++sequence}`;
      const built = createEvaluatorRequestV1({ requestId, code, options, maxGlbBytes });
      let timer: ReturnType<typeof setTimeout> | undefined;
      let response: string;
      try {
        response = await Promise.race([
          transport(built.json, { deadlineMs, maxResponseBytes }),
          new Promise<never>((_, reject) => {
            timer = setTimeout(
              () => reject(new EvaluatorPortError('DEADLINE_EXCEEDED')),
              deadlineMs,
            );
          }),
        ]);
      } catch (error) {
        if (error instanceof EvaluatorPortError) throw error;
        throw new EvaluatorPortError('WORKER_FAILED');
      } finally {
        clearTimeout(timer);
      }
      if (typeof response !== 'string') throw new EvaluatorPortError('PROTOCOL_ERROR');
      if (Buffer.byteLength(response, 'utf8') > maxResponseBytes) {
        throw new EvaluatorPortError('OUTPUT_LIMIT_EXCEEDED');
      }
      let result: EvaluatorResultV1;
      try {
        result = decodeEvaluatorResultV1(response, maxGlbBytes, requestId);
      } catch {
        throw new EvaluatorPortError('PROTOCOL_ERROR');
      }
      if (!result.ok) {
        if (result.error.code === 'QA_BLOCKED' && result.error.qa) {
          const { AssetQaBlockedError } = await import('../qa/run');
          throw new AssetQaBlockedError(
            result.error.qa.report,
            result.error.qa.stage,
            result.error.qa.gltfValidation,
          );
        }
        throw new EvaluatorPortError(result.error.code);
      }
      return result.render;
    },
  };
}

/** Explicit trusted/test compatibility port. Production hosts must inject a
 * transport-backed port and select `evaluator-required`; there is no fallback. */
export const trustedInProcessEvaluatorPortV1: EvaluatorPortV1 = {
  async render(code, options = {}) {
    const { renderGLBInProcess } = await import('../render');
    return renderGLBInProcess(code, options);
  },
};
