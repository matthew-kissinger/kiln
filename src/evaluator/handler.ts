import { AuthoringDiagnosticError, type AuthoringDiagnostic } from './authoring-diagnostic';
import type { RenderGlbOptions, RenderResult } from '../render';
import { renderGLBInProcess } from '../render';
import { AssetQaBlockedError } from '../qa/run';
import {
  decodeEvaluatorRequestV1,
  DEFAULT_EVALUATOR_MAX_RESPONSE_BYTES,
  DEFAULT_EVALUATOR_DEADLINE_MS,
  encodeRenderResultV1,
  evaluatorOutcomeMessage,
  EVALUATOR_RESULT_VERSION,
  EvaluatorPortError,
  type EvaluatorOutcomeCode,
  type EvaluatorRequestV1,
  type WireEvaluatorResultV1,
} from './protocol';

export interface EvaluatorHandlerDependenciesV1 {
  render?(code: string, options: RenderGlbOptions): Promise<RenderResult>;
}

export interface EvaluatorHandlerControlsV1 {
  maxResponseBytes?: number;
  deadlineMs?: number;
}

function failure(
  requestId: string,
  code: EvaluatorOutcomeCode,
  diagnostic?: AuthoringDiagnostic,
  qa?: Extract<WireEvaluatorResultV1, { ok: false }>['error']['qa'],
): Extract<WireEvaluatorResultV1, { ok: false }> {
  return {
    version: EVALUATOR_RESULT_VERSION,
    requestId,
    ok: false,
    error: {
      code,
      message: evaluatorOutcomeMessage(code),
      ...(qa ? { qa } : {}),
      ...(diagnostic ? { diagnostic } : {}),
    },
  };
}

function boundedMaxResponseBytes(value: number | undefined): number {
  const resolved = value ?? DEFAULT_EVALUATOR_MAX_RESPONSE_BYTES;
  if (!Number.isInteger(resolved) || resolved < 1 || resolved > 96 * 1024 * 1024) {
    throw new EvaluatorPortError('INPUT_INVALID');
  }
  return resolved;
}

function boundedDeadlineMs(value: number | undefined): number {
  const resolved = value ?? DEFAULT_EVALUATOR_DEADLINE_MS;
  if (!Number.isInteger(resolved) || resolved < 1 || resolved > 120_000) {
    throw new EvaluatorPortError('INPUT_INVALID');
  }
  return resolved;
}

/**
 * Transport-neutral evaluator core shared by the fd3 worker and a host-owned
 * HTTP/AgentCore entrypoint. It accepts and emits only canonical v1 JSON. No
 * network, environment, path, resolver, or AWS capability enters this seam.
 */
export async function evaluateEvaluatorRequestV1(
  requestJson: string,
  dependencies: EvaluatorHandlerDependenciesV1 = {},
  controls: EvaluatorHandlerControlsV1 = {},
): Promise<string> {
  const maxResponseBytes = boundedMaxResponseBytes(controls.maxResponseBytes);
  const deadlineMs = boundedDeadlineMs(controls.deadlineMs);
  let request: EvaluatorRequestV1;
  try {
    request = decodeEvaluatorRequestV1(requestJson);
  } catch {
    return JSON.stringify(failure('invalid', 'INPUT_INVALID'));
  }
  let wire: WireEvaluatorResultV1;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const render = await Promise.race([
      (dependencies.render ?? renderGLBInProcess)(request.code, request.options),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new EvaluatorPortError('DEADLINE_EXCEEDED')), deadlineMs);
      }),
    ]);
    if (render.glb.byteLength > request.limits.maxGlbBytes) {
      wire = failure(request.requestId, 'OUTPUT_LIMIT_EXCEEDED');
    } else {
      wire = encodeRenderResultV1(request.requestId, render);
    }
  } catch (error) {
    if (error instanceof AssetQaBlockedError) {
      wire = failure(request.requestId, 'QA_BLOCKED', undefined, {
        report: error.report,
        stage: error.stage,
        ...(error.gltfValidation ? { gltfValidation: error.gltfValidation } : {}),
      });
    } else if (error instanceof EvaluatorPortError && error.code === 'DEADLINE_EXCEEDED') {
      wire = failure(request.requestId, 'DEADLINE_EXCEEDED');
    } else {
      wire = failure(
        request.requestId,
        'EXECUTION_REJECTED',
        error instanceof AuthoringDiagnosticError ? error.diagnostic : undefined,
      );
    }
  } finally {
    clearTimeout(timer);
  }
  const json = JSON.stringify(wire);
  if (Buffer.byteLength(json, 'utf8') > maxResponseBytes) {
    throw new EvaluatorPortError('OUTPUT_LIMIT_EXCEEDED');
  }
  return json;
}
