import { describe, expect, test } from 'bun:test';
import { renderGLBInProcess, resolveEvaluatorMode } from '../render';
import {
  EvaluatorSubprocessError,
  renderGLBViaSubprocess,
  sanitizedEvaluatorEnv,
} from './subprocess';

const BOX_CODE = `
const meta = { name: 'EvaluatorBox' };
function build() {
  const root = createRoot('EvaluatorBox');
  createPart('Body', boxGeo(1, 1, 1), gameMaterial('#ff0000'), { parent: root });
  return root;
}`;

describe('subprocess evaluator scaffold', () => {
  test('exports the same deterministic GLB through the v1 protocol', async () => {
    const direct = await renderGLBInProcess(BOX_CODE);
    const contained = await renderGLBViaSubprocess(BOX_CODE, {}, { deadlineMs: 30_000 });
    expect(contained.artifactGlbSha256).toBe(direct.artifactGlbSha256);
    expect(contained.glb).toEqual(direct.glb);
  }, 60_000);

  test('does not inherit provider, AWS, loader, or Kiln environment variables', () => {
    const env = sanitizedEvaluatorEnv({
      PATH: 'safe-path',
      SystemRoot: 'safe-root',
      AWS_SECRET_ACCESS_KEY: 'secret',
      OPENAI_API_KEY: 'secret',
      NODE_OPTIONS: '--require evil',
      KILN_EVALUATOR_MODE: 'subprocess',
      KILN_QA_MODE: 'observe',
    });
    expect(env.PATH).toBe('safe-path');
    expect(env.SystemRoot).toBe('safe-root');
    expect(env.AWS_SECRET_ACCESS_KEY).toBeUndefined();
    expect(env.OPENAI_API_KEY).toBeUndefined();
    expect(env.NODE_OPTIONS).toBeUndefined();
    expect(env.KILN_EVALUATOR_MODE).toBeUndefined();
    expect(env.KILN_QA_MODE).toBeUndefined();
  });

  test('is disabled by default and rejects misspelled modes', () => {
    expect(resolveEvaluatorMode({})).toBe('in-process');
    expect(resolveEvaluatorMode({ KILN_EVALUATOR_MODE: 'subprocess' })).toBe('subprocess');
    expect(() => resolveEvaluatorMode({ KILN_EVALUATOR_MODE: 'subproces' })).toThrow(
      'Invalid KILN_EVALUATOR_MODE',
    );
  });

  test('refuses an unserializable trusted TextureResolver capability', async () => {
    await expect(
      renderGLBViaSubprocess(BOX_CODE, { textureResolver: {} as never }),
    ).rejects.toMatchObject({ code: 'INPUT_INVALID' });
  });

  test('terminates a non-completing build at the host deadline', async () => {
    const never = `async function build(){ await new Promise(() => {}); }`;
    await expect(
      renderGLBViaSubprocess(never, {}, { deadlineMs: 100, maxResponseBytes: 1024 * 1024 }),
    ).rejects.toMatchObject({ code: 'DEADLINE_EXCEEDED' });
  }, 10_000);

  test('fails closed when the output cap is exceeded', async () => {
    try {
      await renderGLBViaSubprocess(BOX_CODE, {}, { deadlineMs: 30_000, maxGlbBytes: 32 });
      throw new Error('expected output cap failure');
    } catch (error) {
      expect(error).toBeInstanceOf(EvaluatorSubprocessError);
      expect(error).toMatchObject({ code: 'OUTPUT_LIMIT_EXCEEDED' });
    }
  }, 60_000);

  test('does not leak rejected source text through the worker error', async () => {
    const marker = 'DO_NOT_ECHO_SOURCE_8c183';
    try {
      await renderGLBViaSubprocess(
        `const ${marker} = globalThis; function build(){}`,
        {},
        {
          deadlineMs: 30_000,
        },
      );
      throw new Error('expected rejection');
    } catch (error) {
      expect(error).toBeInstanceOf(EvaluatorSubprocessError);
      expect(String(error)).not.toContain(marker);
      expect(error).toMatchObject({ code: 'EXECUTION_REJECTED' });
    }
  });
});
