import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { RenderGlbOptions, RenderResult } from '../render';
import { AssetQaBlockedError } from '../qa/run';
import {
  decodeEvaluatorResultV1,
  EVALUATOR_REQUEST_VERSION,
  type EvaluatorOutcomeCode,
  type EvaluatorRequestV1,
  MAX_EVALUATOR_REQUEST_BYTES,
} from './protocol';

const DEFAULT_DEADLINE_MS = 60_000;
const DEFAULT_MAX_GLB_BYTES = 16 * 1024 * 1024;
const DEFAULT_MAX_RESPONSE_BYTES = 32 * 1024 * 1024;
const MAX_STDERR_BYTES = 16 * 1024;

export interface EvaluatorSubprocessControls {
  deadlineMs?: number;
  maxGlbBytes?: number;
  maxResponseBytes?: number;
}

export class EvaluatorSubprocessError extends Error {
  readonly code: EvaluatorOutcomeCode;

  constructor(code: EvaluatorOutcomeCode, message: string) {
    super(message);
    this.name = 'EvaluatorSubprocessError';
    this.code = code;
  }
}

export function sanitizedEvaluatorEnv(
  source: Record<string, string | undefined> = process.env,
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { NODE_ENV: 'production', NO_COLOR: '1' };
  for (const key of ['PATH', 'Path', 'SystemRoot', 'SYSTEMROOT', 'TEMP', 'TMP', 'TZ']) {
    if (source[key] !== undefined) env[key] = source[key];
  }
  return env;
}

function boundedInteger(value: number | undefined, fallback: number, max: number): number {
  const resolved = value ?? fallback;
  if (!Number.isInteger(resolved) || resolved < 1 || resolved > max) {
    throw new EvaluatorSubprocessError('INPUT_INVALID', 'Evaluator controls are invalid.');
  }
  return resolved;
}

export async function renderGLBViaSubprocess(
  code: string,
  options: RenderGlbOptions = {},
  controls: EvaluatorSubprocessControls = {},
): Promise<RenderResult> {
  if (options.textureResolver) {
    throw new EvaluatorSubprocessError(
      'INPUT_INVALID',
      'Subprocess evaluation does not accept host resolver capabilities.',
    );
  }
  const deadlineMs = boundedInteger(controls.deadlineMs, DEFAULT_DEADLINE_MS, 120_000);
  const maxGlbBytes = boundedInteger(controls.maxGlbBytes, DEFAULT_MAX_GLB_BYTES, 64 * 1024 * 1024);
  const maxResponseBytes = boundedInteger(
    controls.maxResponseBytes,
    DEFAULT_MAX_RESPONSE_BYTES,
    96 * 1024 * 1024,
  );
  const request: EvaluatorRequestV1 = {
    version: EVALUATOR_REQUEST_VERSION,
    requestId: 'render-1',
    operation: 'execute-export-glb',
    code,
    options,
    limits: { maxGlbBytes },
  };
  const requestJson = JSON.stringify(request);
  if (Buffer.byteLength(requestJson, 'utf8') > MAX_EVALUATOR_REQUEST_BYTES) {
    throw new EvaluatorSubprocessError(
      'INPUT_INVALID',
      'Evaluator request exceeds its size limit.',
    );
  }

  const workerPath = fileURLToPath(new URL('./worker.ts', import.meta.url));
  const args = process.versions.bun ? [workerPath] : ['--import', 'tsx', workerPath];

  return await new Promise<RenderResult>((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      env: sanitizedEvaluatorEnv(),
      windowsHide: true,
      stdio: ['pipe', 'ignore', 'pipe', 'pipe'],
    });
    const protocol = child.stdio[3];
    if (!protocol) {
      child.kill('SIGKILL');
      reject(new EvaluatorSubprocessError('WORKER_FAILED', 'Evaluator worker did not start.'));
      return;
    }
    const chunks: Buffer[] = [];
    let responseBytes = 0;
    let stderrBytes = 0;
    let settled = false;
    const finish = (error?: Error, result?: RenderResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(result as RenderResult);
    };
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish(new EvaluatorSubprocessError('DEADLINE_EXCEEDED', 'Evaluator deadline exceeded.'));
    }, deadlineMs);

    protocol.on('data', (chunk: Buffer) => {
      responseBytes += chunk.byteLength;
      if (responseBytes > maxResponseBytes) {
        child.kill('SIGKILL');
        finish(
          new EvaluatorSubprocessError('OUTPUT_LIMIT_EXCEEDED', 'Evaluator output limit exceeded.'),
        );
        return;
      }
      chunks.push(Buffer.from(chunk));
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      stderrBytes = Math.min(MAX_STDERR_BYTES, stderrBytes + chunk.byteLength);
    });
    child.on('error', () => {
      finish(new EvaluatorSubprocessError('WORKER_FAILED', 'Evaluator worker failed to start.'));
    });
    child.on('close', (exitCode) => {
      if (settled) return;
      if (exitCode !== 0 || chunks.length === 0) {
        finish(new EvaluatorSubprocessError('WORKER_FAILED', 'Evaluator worker failed.'));
        return;
      }
      try {
        const result = decodeEvaluatorResultV1(Buffer.concat(chunks).toString('utf8'), maxGlbBytes);
        if (!result.ok) {
          if (result.error.code === 'QA_BLOCKED' && result.error.qa) {
            finish(
              new AssetQaBlockedError(
                result.error.qa.report,
                result.error.qa.stage,
                result.error.qa.gltfValidation,
              ),
            );
            return;
          }
          finish(new EvaluatorSubprocessError(result.error.code, result.error.message));
          return;
        }
        finish(undefined, result.render);
      } catch {
        finish(new EvaluatorSubprocessError('PROTOCOL_ERROR', 'Evaluator returned invalid data.'));
      }
    });
    child.stdin?.end(requestJson);
  });
}
