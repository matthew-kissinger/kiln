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

// Capture the REAL './run' exports BEFORE mocking. bun's mock.module patches the
// module (and any already-imported namespace) in place, but plain function
// references captured beforehand keep pointing at the real implementations —
// so the afterAll below can restore the module for later test files
// (__tests__/run-loop.test.ts drives the real runKilnAgent) in a shared process.
const realRun = await import('./run');
const restoreRunModule = {
  runKilnAgent: realRun.runKilnAgent,
  resolveToolSurface: realRun.resolveToolSurface,
  buildAgentTools: realRun.buildAgentTools,
};

// Mutable impl the mocked runKilnAgent delegates to (set per test).
let runImpl: (opts: Record<string, unknown>) => Promise<Record<string, unknown>>;
mock.module('./run', () => ({
  runKilnAgent: (opts: Record<string, unknown>) => runImpl(opts),
}));

afterAll(() => {
  // Un-leak the module mock: put the real functions back for any test file
  // that runs after this one.
  mock.module('./run', () => restoreRunModule);
});

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

describe('generateKilnAsset viewRenderPort (B3b/B4)', () => {
  const saved: Record<string, string | undefined> = {};
  const KEYS = ['GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'KILN_MODEL', 'PIXEL_FORGE_MODEL'];
  beforeAll(() => {
    for (const k of KEYS) saved[k] = process.env[k];
    if (!process.env['GEMINI_API_KEY']) process.env['GEMINI_API_KEY'] = 'test-gemini-key';
    delete process.env['KILN_MODEL'];
    delete process.env['PIXEL_FORGE_MODEL'];
  });
  afterAll(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  const okRun = async () => ({ code: CANNED_CODE, toolCalls: ['kiln_submit'], steps: 1 });

  /** 6 tiny solid-color per-view PNGs, like a host PBR renderer would return. */
  async function stubViewPngs(size = 8): Promise<Uint8Array[]> {
    const { encodePng } = await import('../views');
    return Array.from({ length: 6 }, (_, i) => {
      const rgb = new Uint8Array(size * size * 3);
      for (let p = 0; p < size * size; p++) rgb[p * 3] = 30 + i * 30;
      return new Uint8Array(encodePng(rgb, size, size));
    });
  }

  test('option absent: views are byte-identical to the CPU grid, no degrade fields', async () => {
    runImpl = okRun;
    const r = await generateKilnAsset({ prompt: 'a crate', captureViews: true });

    const { renderCodeViewGrid } = await import('../views');
    const cpu = (await renderCodeViewGrid(CANNED_CODE)).png;
    expect(r.views).toBeInstanceOf(Buffer);
    expect(Buffer.compare(r.views!, cpu)).toBe(0);
    // Pin: the port-absent result shape is unchanged — no provenance/degrade keys.
    expect(r.viewsRendererId).toBeUndefined();
    expect(r.renderDegraded).toBeUndefined();
    expect(r.renderDegradedReason).toBeUndefined();
    expect('renderDegraded' in r).toBe(false);
  });

  test('port success: composited port views, port rendererId, renderDegraded false', async () => {
    runImpl = okRun;
    const viewsPng = await stubViewPngs();
    const requests: import('../composer/render-port').PbrRenderRequest[] = [];
    const r = await generateKilnAsset({
      prompt: 'a crate',
      captureViews: true,
      viewRenderPort: async (req) => {
        requests.push(req);
        return { ok: true, rendererId: 'dawn-vulkan:test-gpu:1.0', viewsPng };
      },
    });

    // The port saw the ALREADY-PRODUCED GLB bytes and the six grid view dirs.
    expect(requests).toHaveLength(1);
    expect(Buffer.compare(Buffer.from(requests[0]!.glb), r.glb)).toBe(0);
    expect(requests[0]!.viewDirs).toHaveLength(6);
    expect(requests[0]!.size).toBe(384);

    expect(r.renderDegraded).toBe(false);
    expect(r.renderDegradedReason).toBeUndefined();
    expect(r.viewsRendererId).toBe('dawn-vulkan:test-gpu:1.0');
    // The views are the port cells composited into the SAME 3x2 grid layout.
    const { compositeViewPngGrid } = await import('../views');
    expect(Buffer.compare(r.views!, compositeViewPngGrid(viewsPng).png)).toBe(0);
  });

  test('port is never consulted when captureViews is off', async () => {
    runImpl = okRun;
    let calls = 0;
    const r = await generateKilnAsset({
      prompt: 'a crate',
      viewRenderPort: async () => {
        calls++;
        return { ok: true, rendererId: 'dawn-vulkan:test-gpu:1.0' };
      },
    });
    expect(calls).toBe(0);
    expect(r.views).toBeUndefined();
    expect(r.renderDegraded).toBeUndefined();
  });

  test('B4: a rejecting port degrades to the CPU grid with honest provenance', async () => {
    runImpl = okRun;
    const r = await generateKilnAsset({
      prompt: 'a crate',
      captureViews: true,
      viewRenderPort: async () => {
        throw new Error('GPU service unreachable');
      },
    });

    const { renderCodeViewGrid, CPU_RASTER_RENDERER_ID } = await import('../views');
    expect(r.renderDegraded).toBe(true);
    expect(r.renderDegradedReason).toContain('GPU service unreachable');
    expect(r.viewsRendererId).toBe(CPU_RASTER_RENDERER_ID);
    expect(r.viewsRendererId).toMatch(/^cpu-raster:/);
    const cpu = (await renderCodeViewGrid(CANNED_CODE)).png;
    expect(Buffer.compare(r.views!, cpu)).toBe(0);
  });

  test('B4: an ok:false port degrades with the port error as the reason', async () => {
    runImpl = okRun;
    const r = await generateKilnAsset({
      prompt: 'a crate',
      captureViews: true,
      viewRenderPort: async () => ({
        ok: false,
        rendererId: 'dawn-vulkan:test-gpu:1.0',
        error: 'device lost',
      }),
    });
    expect(r.renderDegraded).toBe(true);
    expect(r.renderDegradedReason).toContain('device lost');
    expect(r.viewsRendererId).toMatch(/^cpu-raster:/);
    expect(r.views).toBeInstanceOf(Buffer);
  });

  test('B4: a hanging port trips the deadline and degrades', async () => {
    runImpl = okRun;
    const r = await generateKilnAsset({
      prompt: 'a crate',
      captureViews: true,
      viewRenderTimeoutMs: 25,
      viewRenderPort: () => new Promise(() => {}), // never settles
    });
    expect(r.renderDegraded).toBe(true);
    expect(r.renderDegradedReason).toContain('timed out after 25ms');
    expect(r.viewsRendererId).toMatch(/^cpu-raster:/);
    expect(r.views).toBeInstanceOf(Buffer);
  });

  test('B4: undecodable or missing port PNGs degrade instead of throwing', async () => {
    runImpl = okRun;
    const garbage = await generateKilnAsset({
      prompt: 'a crate',
      captureViews: true,
      viewRenderPort: async () => ({
        ok: true,
        rendererId: 'dawn-vulkan:test-gpu:1.0',
        viewsPng: Array.from({ length: 6 }, () => new Uint8Array([1, 2, 3])),
      }),
    });
    expect(garbage.renderDegraded).toBe(true);
    expect(garbage.renderDegradedReason).toContain('bad signature');
    expect(garbage.views).toBeInstanceOf(Buffer);

    const empty = await generateKilnAsset({
      prompt: 'a crate',
      captureViews: true,
      viewRenderPort: async () => ({ ok: true, rendererId: 'dawn-vulkan:test-gpu:1.0' }),
    });
    expect(empty.renderDegraded).toBe(true);
    expect(empty.renderDegradedReason).toContain('returned 0 view PNGs, expected 6');
  });

  test('B4: a port returning fewer PNGs than requested degrades instead of shrinking the grid', async () => {
    runImpl = okRun;
    const viewsPng = await stubViewPngs();
    const r = await generateKilnAsset({
      prompt: 'a crate',
      captureViews: true,
      viewRenderPort: async () => ({
        ok: true,
        rendererId: 'dawn-vulkan:test-gpu:1.0',
        viewsPng: viewsPng.slice(0, 3),
      }),
    });
    expect(r.renderDegraded).toBe(true);
    expect(r.renderDegradedReason).toContain('returned 3 view PNGs, expected 6');
    expect(r.viewsRendererId).toMatch(/^cpu-raster:/);
    expect(r.views).toBeInstanceOf(Buffer);
  });

  test('captureViewsViaPort is a public single-owner shell (success + degrade)', async () => {
    const { captureViewsViaPort } = await import('./generate');
    const viewsPng = await stubViewPngs();
    const okOutcome = await captureViewsViaPort(
      async () => ({ ok: true, rendererId: 'dawn-vulkan:test-gpu:1.0', viewsPng }),
      new Uint8Array([1, 2, 3]), // hosts hold Uint8Array GLBs; accepted directly
    );
    expect(okOutcome.ok).toBe(true);
    if (okOutcome.ok) {
      expect(okOutcome.rendererId).toBe('dawn-vulkan:test-gpu:1.0');
      const { compositeViewPngGrid } = await import('../views');
      expect(Buffer.compare(okOutcome.png, compositeViewPngGrid(viewsPng).png)).toBe(0);
    }

    const degraded = await captureViewsViaPort(
      async () => {
        throw new Error('GPU service unreachable');
      },
      Buffer.from([1, 2, 3]),
    );
    expect(degraded.ok).toBe(false);
    if (!degraded.ok) expect(degraded.reason).toContain('GPU service unreachable');
  });

  test('B4: the port receives a copy of the GLB bytes, not a live alias', async () => {
    runImpl = okRun;
    const viewsPng = await stubViewPngs();
    let seen: Uint8Array | undefined;
    const r = await generateKilnAsset({
      prompt: 'a crate',
      captureViews: true,
      viewRenderPort: async (req) => {
        seen = req.glb;
        req.glb.fill(0); // a hostile/buggy port scribbling on its input
        return { ok: true, rendererId: 'dawn-vulkan:test-gpu:1.0', viewsPng };
      },
    });
    expect(seen!.every((b) => b === 0)).toBe(true);
    // The returned artifact is untouched: still a valid GLB with the magic intact.
    expect(r.glb.readUInt32LE(0)).toBe(0x46546c67);
  });
});
