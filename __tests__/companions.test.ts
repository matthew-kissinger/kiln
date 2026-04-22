/**
 * Kiln companion entries (W2.1)
 *
 * Render-only + mocked-SDK tests for the `editKilnCode`, `compactCode`,
 * `refactorCode`, and `inspectGeneratedAnimation` entry points. Keeps us
 * honest that the ports from `packages/server/src/services/claude.ts` into
 * `@pixel-forge/core/kiln` behave the same, and that the new joint-warning
 * inspector catches common LLM animation mistakes.
 *
 * All SDK calls are mocked — no network, no ANTHROPIC_API_KEY, no cost.
 */

import { describe, expect, test, mock, beforeEach } from 'bun:test';

// Mocks must be declared before importing the module under test.
let queryImpl = async function* (_args: unknown): AsyncGenerator<unknown> {
  yield { type: 'result', subtype: 'success', result: '', session_id: 'test' };
};

mock.module('@anthropic-ai/claude-agent-sdk', () => ({
  query: (args: unknown) => queryImpl(args),
}));

// Fresh import helper so each test gets a clean module registry slot —
// prevents cross-test mock bleed when bun runs several tests in a row.
let counter = 0;
let kiln: typeof import('../index');
async function freshImport() {
  counter += 1;
  return (await import(`../index?test=${counter}`)) as typeof import('../index');
}

describe('kiln.editCode', () => {
  beforeEach(async () => {
    queryImpl = async function* () {
      yield {
        type: 'result',
        subtype: 'success',
        structured_output: {
          code: 'const meta = { name: "Edited" }; function build() { return {}; }',
        },
        session_id: 'edit-session',
      };
    };
    kiln = await freshImport();
  });

  test('returns edited code with session id', async () => {
    const result = await kiln.editKilnCode('const meta = {}; function build() { return {}; }', 'make it red');
    expect(result.success).toBe(true);
    expect(result.code).toContain('Edited');
    expect(result.sessionId).toBe('edit-session');
  });
});

describe('kiln.compactCode', () => {
  test('extracts code from markdown fence', async () => {
    queryImpl = async function* () {
      yield {
        type: 'assistant',
        message: { content: [{ type: 'text', text: '```js\nconst x=1;\n```' }] },
      };
    };
    kiln = await freshImport();
    const result = await kiln.compactCode('verbose code');
    expect(result.success).toBe(true);
    expect(result.code).toBe('const x=1;');
  });

  test('returns raw text when no fence', async () => {
    queryImpl = async function* () {
      yield {
        type: 'assistant',
        message: { content: [{ type: 'text', text: 'bare text' }] },
      };
    };
    kiln = await freshImport();
    const result = await kiln.compactCode('verbose code');
    expect(result.success).toBe(true);
    expect(result.code).toBe('bare text');
  });

  test('accepts timeoutMs override', async () => {
    let observedOptions: { abortController?: AbortController } | undefined;
    queryImpl = async function* (args: unknown) {
      observedOptions = (args as { options?: { abortController?: AbortController } }).options;
      yield { type: 'assistant', message: { content: [{ type: 'text', text: 'ok' }] } };
    };
    kiln = await freshImport();
    await kiln.compactCode('code', { timeoutMs: 1000 });
    expect(observedOptions?.abortController).toBeInstanceOf(AbortController);
  });
});

describe('kiln.refactorCode', () => {
  test('returns structured output with session id', async () => {
    queryImpl = async function* () {
      yield {
        type: 'result',
        subtype: 'success',
        structured_output: { code: 'new geo', effectCode: 'new eff' },
        session_id: 'refactor-session',
      };
    };
    kiln = await freshImport();
    const result = await kiln.refactorCode({
      instruction: 'reshape',
      geometryCode: 'old geo',
      effectCode: 'old eff',
      target: 'both',
    });
    expect(result.success).toBe(true);
    expect(result.code).toBe('new geo');
    expect(result.effectCode).toBe('new eff');
    expect(result.sessionId).toBe('refactor-session');
  });

  test('surfaces thrown errors from query', async () => {
    // eslint-disable-next-line require-yield -- the throw is the whole point of this fake
    queryImpl = async function* () {
      throw new Error('SDK boom');
    };
    kiln = await freshImport();
    const result = await kiln.refactorCode({
      instruction: 'fail me',
      geometryCode: 'x',
      target: 'geometry',
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe('SDK boom');
  });
});

describe('kiln.inspectGeneratedAnimation', () => {
  test('flags tracks targeting unknown nodes', async () => {
    kiln = await freshImport();

    // Execute a minimal code string so we can get a real Three scene + clip
    // pair to pass into the inspector.
    const code = `
const meta = { name: 'InspectTest' };
function build() {
  const root = createRoot('InspectTest');
  createPivot('Body', [0, 1, 0], root);
  return root;
}
function animate() {
  // Note: "Joint_Missing" does NOT exist in the scene — this should warn.
  return [createClip('wiggle', 1, [
    rotationTrack('Joint_Missing', [{ time: 0, rotation: [0, 0, 0] }, { time: 1, rotation: [30, 0, 0] }]),
  ])];
}
`;
    const { root, clips } = await kiln.executeKilnCode(code);
    const warnings = kiln.inspectGeneratedAnimation(root, clips);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w) => w.includes('Joint_Missing'))).toBe(true);
  });

  test('is silent when all tracks resolve', async () => {
    kiln = await freshImport();
    const code = `
const meta = { name: 'Good' };
function build() {
  const root = createRoot('Good');
  createPivot('Body', [0, 1, 0], root);
  return root;
}
function animate() {
  return [createClip('breathe', 1, [
    rotationTrack('Joint_Body', [{ time: 0, rotation: [0, 0, 0] }, { time: 1, rotation: [10, 0, 0] }]),
  ])];
}
`;
    const { root, clips } = await kiln.executeKilnCode(code);
    const warnings = kiln.inspectGeneratedAnimation(root, clips);
    expect(warnings).toEqual([]);
  });

  test('returns [] when no clips present', async () => {
    kiln = await freshImport();
    const code = `
const meta = { name: 'Static' };
function build() {
  const root = createRoot('Static');
  return root;
}
`;
    const { root, clips } = await kiln.executeKilnCode(code);
    expect(clips).toEqual([]);
    expect(kiln.inspectGeneratedAnimation(root, clips)).toEqual([]);
  });
});

describe('kiln.generateKilnCode', () => {
  test('passes timeoutMs through to query', async () => {
    let observedOptions: { abortController?: AbortController; model?: string } | undefined;
    queryImpl = async function* (args: unknown) {
      observedOptions = (args as { options?: { abortController?: AbortController; model?: string } }).options;
      yield {
        type: 'result',
        subtype: 'success',
        structured_output: {
          code: 'const meta = {}; function build() { return {}; }',
        },
        session_id: 's',
      };
    };
    kiln = await freshImport();
    await kiln.generateKilnCode(
      { prompt: 'x', mode: 'glb', category: 'prop' },
      { timeoutMs: 5000, model: 'claude-opus-4-7' }
    );
    expect(observedOptions?.model).toBe('claude-opus-4-7');
    expect(observedOptions?.abortController).toBeInstanceOf(AbortController);
  });
});
