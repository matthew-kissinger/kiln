import { writeFileSync } from 'node:fs';
import { AssetQaBlockedError } from '../qa/run';
import { renderGLBInProcess } from '../render';
import {
  decodeEvaluatorRequestV1,
  encodeRenderResultV1,
  evaluatorOutcomeMessage,
  EVALUATOR_RESULT_VERSION,
  MAX_EVALUATOR_REQUEST_BYTES,
  type EvaluatorOutcomeCode,
  type WireEvaluatorResultV1,
} from './protocol';

async function readBoundedInput(): Promise<string> {
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of process.stdin) {
    const buffer = Buffer.from(chunk);
    bytes += buffer.byteLength;
    if (bytes > MAX_EVALUATOR_REQUEST_BYTES) throw new Error('request limit');
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function sanitizedFailure(requestId: string, error: unknown): WireEvaluatorResultV1 {
  if (error instanceof AssetQaBlockedError) {
    return {
      version: EVALUATOR_RESULT_VERSION,
      requestId,
      ok: false,
      error: {
        code: 'QA_BLOCKED',
        message: evaluatorOutcomeMessage('QA_BLOCKED'),
        qa: {
          report: error.report,
          stage: error.stage,
          ...(error.gltfValidation ? { gltfValidation: error.gltfValidation } : {}),
        },
      },
    };
  }
  const code: EvaluatorOutcomeCode =
    error instanceof Error && error.message.includes('exceeds its configured output limit')
      ? 'OUTPUT_LIMIT_EXCEEDED'
      : 'EXECUTION_REJECTED';
  return {
    version: EVALUATOR_RESULT_VERSION,
    requestId,
    ok: false,
    error: {
      code,
      message: evaluatorOutcomeMessage(code),
    },
  };
}

let output: WireEvaluatorResultV1;
try {
  const request = decodeEvaluatorRequestV1(await readBoundedInput());
  try {
    const render = await renderGLBInProcess(request.code, request.options);
    if (render.glb.byteLength > request.limits.maxGlbBytes) {
      throw new Error('GLB exceeds its configured output limit');
    }
    output = encodeRenderResultV1(request.requestId, render);
  } catch (error) {
    output = sanitizedFailure(request.requestId, error);
  }
} catch {
  output = {
    version: EVALUATOR_RESULT_VERSION,
    requestId: 'invalid',
    ok: false,
    error: { code: 'INPUT_INVALID', message: evaluatorOutcomeMessage('INPUT_INVALID') },
  };
}

writeFileSync(3, JSON.stringify(output), { encoding: 'utf8' });
