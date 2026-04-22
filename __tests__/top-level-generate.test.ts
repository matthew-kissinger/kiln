/**
 * Top-level kiln.generate() coverage (W7.3)
 *
 * The promise-y end-to-end entry point in `kiln/index.ts` was uncovered:
 * its zero-arg-spread happy path, its option pass-through to the
 * underlying generator, and its hard-failure throw. Mocks the SDK so
 * we can drive both branches without an LLM round-trip.
 */

import { describe, expect, test, mock, beforeEach } from 'bun:test';

// Per-importer mock pattern, matching companions.test.ts. Each test gets
// a fresh import of `../index` so the module-scoped mock state stays clean.
let queryImpl = async function* (_args: unknown): AsyncGenerator<unknown> {
  yield { type: 'result', subtype: 'success', result: '', session_id: 'test' };
};

mock.module('@anthropic-ai/claude-agent-sdk', () => ({
  query: (args: unknown) => queryImpl(args),
}));

let counter = 0;
let kiln: typeof import('../index');
async function freshImport(): Promise<typeof import('../index')> {
  counter += 1;
  return (await import(`../index?top-level=${counter}`)) as typeof import('../index');
}

const VALID_CODE = `
const meta = { name: 'TopLevel', category: 'prop' };
function build() {
  const root = createRoot('TopLevel');
  createPart('Body', boxGeo(1, 1, 1), gameMaterial(0xff0000), { parent: root });
  return root;
}
`;

describe('kiln.generate() top-level pipeline', () => {
  beforeEach(async () => {
    queryImpl = async function* () {
      yield {
        type: 'result',
        subtype: 'success',
        structured_output: { code: VALID_CODE },
        session_id: 'top-session',
      };
    };
    kiln = await freshImport();
  });

  test('returns code + glb + meta + warnings for a valid response', async () => {
    const out = await kiln.generate('a small red box');

    expect(out.code).toContain('TopLevel');
    expect(out.glb).toBeInstanceOf(Buffer);
    expect(out.glb.byteLength).toBeGreaterThan(1000);
    expect(out.meta.name).toBe('TopLevel');
    expect(out.meta.category).toBe('prop');
    expect(typeof out.meta.tris).toBe('number');
    expect(Array.isArray(out.warnings)).toBe(true);
  });

  test('passes category, style, includeAnimation, model, timeoutMs through to the SDK', async () => {
    let observedOptions:
      | { abortController?: AbortController; model?: string; systemPrompt?: string }
      | undefined;
    let observedPrompt: string | undefined;
    queryImpl = async function* (args: unknown) {
      const a = args as {
        prompt: string;
        options?: { abortController?: AbortController; model?: string; systemPrompt?: string };
      };
      observedPrompt = a.prompt;
      observedOptions = a.options;
      yield {
        type: 'result',
        subtype: 'success',
        structured_output: { code: VALID_CODE },
        session_id: 's',
      };
    };
    kiln = await freshImport();

    await kiln.generate('a low-poly chest', {
      category: 'prop',
      style: 'low-poly',
      includeAnimation: false,
      model: 'claude-opus-4-7',
      timeoutMs: 5000,
    });

    expect(observedOptions?.model).toBe('claude-opus-4-7');
    expect(observedOptions?.abortController).toBeInstanceOf(AbortController);
    // Style template lands in the prompt; "Do NOT include an animate()" too.
    expect(observedPrompt).toContain('Low-Poly');
    expect(observedPrompt).toContain('Do NOT include an animate()');
  });

  test('default category is prop and animation is requested by default', async () => {
    let observedPrompt: string | undefined;
    queryImpl = async function* (args: unknown) {
      observedPrompt = (args as { prompt: string }).prompt;
      yield {
        type: 'result',
        subtype: 'success',
        structured_output: { code: VALID_CODE },
        session_id: 's',
      };
    };
    kiln = await freshImport();

    await kiln.generate('a thing');
    expect(observedPrompt).toContain('Create a prop');
    expect(observedPrompt).toContain('Animation Requirements');
  });

  test('throws when SDK reports a failure', async () => {
    queryImpl = async function* () {
      yield {
        type: 'result',
        subtype: 'error_max_turns',
        errors: ['ran out of turns'],
      };
    };
    kiln = await freshImport();

    await expect(kiln.generate('x')).rejects.toThrow(/Kiln code generation failed/);
  });

  test('throws when SDK reports auth failure', async () => {
    queryImpl = async function* () {
      yield { type: 'auth_status', error: 'invalid token' };
    };
    kiln = await freshImport();

    await expect(kiln.generate('x')).rejects.toThrow(/Auth failed/);
  });

  test('throws when SDK loop yields nothing', async () => {
    // Drives the "no result received from query" branch. Yielding once
    // with an unrelated message type also reaches it (the for-await
    // loop completes without ever seeing a `result`/`auth_status` event).
    queryImpl = async function* () {
      yield { type: 'system', subtype: 'init' };
    };
    kiln = await freshImport();

    await expect(kiln.generate('x')).rejects.toThrow(/No result received/);
  });

  test('strips CLAUDECODE markers from the parent env before invoking the SDK', async () => {
    process.env['CLAUDECODE'] = '1';
    process.env['CLAUDE_CODE_ENTRYPOINT'] = 'cli';
    queryImpl = async function* () {
      // After strip, both env vars should be undefined inside the query.
      expect(process.env['CLAUDECODE']).toBeUndefined();
      expect(process.env['CLAUDE_CODE_ENTRYPOINT']).toBeUndefined();
      yield {
        type: 'result',
        subtype: 'success',
        structured_output: { code: VALID_CODE },
      };
    };
    kiln = await freshImport();

    await kiln.generate('x');
  });
});
