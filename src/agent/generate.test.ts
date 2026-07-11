/**
 * Wiring tests for `generateKilnAsset` — the agent-loop + render engine.
 *
 * Only `./run` (runKilnAgent) is mocked; nothing else in the codebase imports it,
 * so the module mock is leak-safe. `makeKilnModel` + `resolveKilnAgentModel` +
 * `renderGLB` all run for real: the mocked agent returns a known-valid Kiln
 * program, which renderGLB renders to actual GLB bytes. The live e2e
 * (`pixelforge gen glb`) covers the LLM half.
 */
import { test, expect, describe, mock, beforeAll, afterAll } from 'bun:test';
import { createAssetIntentV1 } from '../contracts';

// A real, minimal, valid Kiln program (mirrors render-edges.test.ts). renderGLB
// executes this for real to prove the engine wires the agent's code into a GLB.
const CANNED_CODE = `
const meta = { name: 'TestBox' };
function build() {
  const root = createRoot('TestBox');
  createPart('Body', boxGeo(1, 1, 1), lambertMaterial(0xff00ff), { parent: root });
  return root;
}
`;
const FALSE_PROP_CODE = CANNED_CODE.replace(
  "const meta = { name: 'TestBox' };",
  "const meta = { name: 'TestBox', category: 'prop' };",
);

// Mutable impl the mocked runKilnAgent delegates to (set per test).
let runImpl: (opts: Record<string, unknown>) => Promise<Record<string, unknown>>;
mock.module('./run', () => ({
  runKilnAgent: (opts: Record<string, unknown>) => runImpl(opts),
}));

// mock.module must precede the import of the module under test (bun runs it in
// order; ESM imports would hoist above it, so the dynamic import is required).
const { generateKilnAsset, DEFAULT_KILN_AGENT_MODEL } = await import('./generate');

describe('generateKilnAsset', () => {
  const saved: Record<string, string | undefined> = {};
  const KEYS = ['GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'KILN_MODEL', 'PIXEL_FORGE_MODEL'];
  beforeAll(() => {
    for (const k of KEYS) saved[k] = process.env[k];
    // Dummy keys so native model construction never touches the network.
    if (!process.env['GEMINI_API_KEY']) process.env['GEMINI_API_KEY'] = 'test-gemini-key';
    if (!process.env['ANTHROPIC_API_KEY']) process.env['ANTHROPIC_API_KEY'] = 'test-anthropic-key';
    // Clear model overrides so the default (gemini) resolves at call time.
    delete process.env['KILN_MODEL'];
    delete process.env['PIXEL_FORGE_MODEL'];
  });
  afterAll(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  test('default model is gemini 3.5 flash (google)', () => {
    expect(DEFAULT_KILN_AGENT_MODEL).toBe('google:gemini-3.5-flash');
  });

  test('defaults to gemini, drives runKilnAgent, renders the submitted code to GLB', async () => {
    let captured: Record<string, unknown> | undefined;
    runImpl = async (opts) => {
      captured = opts;
      return {
        code: CANNED_CODE,
        toolCalls: ['kiln_list_primitives', 'kiln_validate', 'kiln_render', 'kiln_submit'],
        steps: 3,
        usage: { inputTokens: 100, outputTokens: 200 },
      };
    };

    const r = await generateKilnAsset({ prompt: 'a wooden crate' });

    // Default model resolved to the google/gemini descriptor (honest provenance).
    expect(r.provider).toBe('google');
    expect(r.model).toBe('gemini-3.5-flash');
    // Tool-loop metrics passed through.
    expect(r.toolCalls).toContain('kiln_submit');
    expect(r.steps).toBe(3);
    expect(r.usage?.outputTokens).toBe(200);
    // The agent's code was rendered for real.
    expect(r.glb).toBeInstanceOf(Buffer);
    expect(r.glb.byteLength).toBeGreaterThan(500);
    expect(r.meta.tris ?? 0).toBeGreaterThan(0);
    // Prompt + category threaded into the agent.
    expect(captured?.['prompt']).toBe('a wooden crate');
    expect(captured?.['category']).toBe('prop');
  });

  test('threads an explicit model + refine fields', async () => {
    let captured: Record<string, unknown> | undefined;
    runImpl = async (opts) => {
      captured = opts;
      return { code: CANNED_CODE, toolCalls: ['kiln_submit'], steps: 1 };
    };

    const r = await generateKilnAsset({
      prompt: 'make it taller',
      model: 'anthropic:claude-opus-4-8',
      existingCode: 'const meta={};function build(){return createRoot();}',
      refineMode: 'edit',
      originalPrompt: 'a tower',
    });

    expect(r.provider).toBe('anthropic');
    expect(r.model).toBe('claude-opus-4-8');
    expect(captured?.['existingCode']).toBeTruthy();
    expect(captured?.['refineMode']).toBe('edit');
    expect(captured?.['originalPrompt']).toBe('a tower');
  });

  test('full intent is authoritative through agent options and final render', async () => {
    let captured: Record<string, unknown> | undefined;
    runImpl = async (opts) => {
      captured = opts;
      return { code: FALSE_PROP_CODE, toolCalls: ['kiln_submit'], steps: 1 };
    };
    const intent = createAssetIntentV1({ category: 'environment', subtype: 'set-piece' });

    const result = await generateKilnAsset({
      prompt: 'a compact car',
      category: 'vehicle',
      intent,
    });

    expect(captured?.['category']).toBe('environment');
    expect(captured?.['intent']).toBe(intent);
    expect(result.meta.category).toBe('environment');
    expect(result.meta.modelCategory).toBe('prop');
    const qaReport = result.meta.qaReport as {
      category: string;
      dimensions: { runtimeCost: { status: string; metrics?: Record<string, unknown> } };
    };
    expect(qaReport.category).toBe('environment');
    expect(qaReport.dimensions.runtimeCost.status).toBe('pass');
    expect(qaReport.dimensions.runtimeCost.metrics?.['instanceabilityGrade']).toBeDefined();
  });

  test('throws when the agent returns an error', async () => {
    runImpl = async () => ({
      error: 'stream ended without completing a message',
      toolCalls: [],
      steps: 0,
    });
    await expect(generateKilnAsset({ prompt: 'x' })).rejects.toThrow(/stream ended/);
  });

  test('throws when the agent returns no code', async () => {
    runImpl = async () => ({ toolCalls: ['kiln_validate'], steps: 1 });
    await expect(generateKilnAsset({ prompt: 'x' })).rejects.toThrow(/no code/);
  });

  test('H-10: a salvaged-on-error run (code + error + salvaged) renders instead of throwing', async () => {
    runImpl = async () => ({
      code: CANNED_CODE,
      toolCalls: ['kiln_draft', 'kiln_render'],
      steps: 12,
      salvaged: 'error',
      error: 'MaxTokensError: the model hit its maximum token output limit',
    });

    const r = await generateKilnAsset({ prompt: 'a crate' });

    // The salvaged program was rendered for real, flagged honestly.
    expect(r.glb.byteLength).toBeGreaterThan(500);
    expect(r.salvaged).toBe('error');
    expect(r.salvageError).toMatch(/MaxTokensError/);
    expect(r.warnings.some((w) => w.includes('salvaged best effort'))).toBe(true);
  });

  test('H-10: a step-cap salvage threads salvaged without a salvageError', async () => {
    runImpl = async () => ({
      code: CANNED_CODE,
      toolCalls: ['kiln_draft', 'kiln_render'],
      steps: 40,
      capped: true,
      salvaged: 'step-cap',
    });

    const r = await generateKilnAsset({ prompt: 'a crate' });

    expect(r.salvaged).toBe('step-cap');
    expect(r.salvageError).toBeUndefined();
    expect(r.warnings.some((w) => w.includes('step cap'))).toBe(true);
  });

  test('H-10: an UNSALVAGED error with leftover code still throws (no silent bypass)', async () => {
    runImpl = async () => ({
      code: CANNED_CODE,
      toolCalls: ['kiln_draft'],
      steps: 2,
      error: 'provider returned 500',
    });
    await expect(generateKilnAsset({ prompt: 'x' })).rejects.toThrow(/provider returned 500/);
  });
});
