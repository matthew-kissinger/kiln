/**
 * kiln.refactor + hardened validation wiring (W3b.4)
 *
 * Verifies that refactorCode runs the W3b.3 validator over its output and
 * re-prompts the SDK once when the first attempt fails validation. Mocks
 * the agent SDK so no network / API key needed.
 */

import { describe, expect, test, mock } from 'bun:test';

// Track every call so we can verify the re-prompt happened.
let calls = 0;
const responses: string[] = [];

mock.module('@anthropic-ai/claude-agent-sdk', () => ({
  query: () =>
    (async function* () {
      const idx = calls;
      calls += 1;
      const code = responses[idx] ?? responses[responses.length - 1] ?? '';
      yield {
        type: 'result',
        subtype: 'success',
        structured_output: { code },
        session_id: `session-${idx}`,
      };
    })(),
}));

let counter = 0;
async function freshImport(): Promise<typeof import('../index')> {
  counter += 1;
  return (await import(`../index?refactor-validation=${counter}`)) as typeof import('../index');
}

describe('kiln.refactor — hardened validation', () => {
  test('returns immediately when refactored code passes validation', async () => {
    calls = 0;
    responses.length = 0;
    responses.push(`
const meta = { name: 'OK' };
function build() { return createRoot('OK'); }
`);

    const kiln = await freshImport();
    const result = await kiln.refactor({
      instruction: 'tweak',
      geometryCode: 'old',
      target: 'geometry',
    });

    expect(result.success).toBe(true);
    expect(result.code).toContain('OK');
    expect(calls).toBe(1);
  });

  test('re-prompts once when first attempt fails validation', async () => {
    calls = 0;
    responses.length = 0;
    // First attempt: missing build() — invalid.
    responses.push(`const meta = { name: 'X' };`);
    // Retry: valid.
    responses.push(`
const meta = { name: 'X' };
function build() { return createRoot('X'); }
`);

    const kiln = await freshImport();
    const result = await kiln.refactor({
      instruction: 'tweak',
      geometryCode: 'old',
      target: 'geometry',
    });

    expect(result.success).toBe(true);
    expect(calls).toBe(2);
    expect(result.code).toContain('build');
  });

  test('skips validation for effect-only refactors', async () => {
    calls = 0;
    responses.length = 0;
    // Effect refactor returns whatever; not subject to geometry validator.
    responses.push('// some TSL effect code');

    const kiln = await freshImport();
    const result = await kiln.refactor({
      instruction: 'tweak shader',
      effectCode: 'old shader',
      target: 'effect',
    });

    expect(result.success).toBe(true);
    expect(calls).toBe(1);
  });

  test('alias `refactor` resolves to refactorCode', async () => {
    const kiln = await freshImport();
    expect(kiln.refactor).toBe(kiln.refactorCode);
  });
});
