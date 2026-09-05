/**
 * Wiring tests for `generateKilnAsset` — the agent-loop + render engine.
 *
 * Only `./run` (runKilnAgent) is mocked; nothing else in the codebase imports it,
 * so the module mock is leak-safe. `makeKilnModel` + `resolveKilnAgentModel` +
 * `renderGLB` all run for real: the mocked agent returns a known-valid Kiln
 * program, which renderGLB renders to actual GLB bytes. The live e2e
 * (`pixelforge gen glb`) covers the LLM half.
 */
import { test, expect, describe, mock, beforeAll, afterAll, spyOn } from 'bun:test';
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
const PROCEDURAL_CODE = `
const meta = { name: 'TexturedBox', category: 'prop' };
function build() {
  const root = createRoot('TexturedBox');
  const albedo = proceduralTexture({
    size: 8,
    name: 'GeneratedSurface',
    layers: [{ op: 'checker', colorA: 0xffffff, colorB: 0x222222, squares: 2 }],
  });
  root.add(createPart('Body', boxGeo(1, 1, 1), pbrMaterial({ albedo }), {}));
  return root;
}
`;

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

  test('preserves baked procedural texture lineage on the public generation result', async () => {
    runImpl = async () => ({ code: PROCEDURAL_CODE, toolCalls: ['kiln_finalize'], steps: 1 });

    const r = await generateKilnAsset({ prompt: 'a textured box' });

    expect(r.bakedTextures).toHaveLength(1);
    expect(r.bakedTextures?.[0]).toMatchObject({
      texture: 'GeneratedSurface',
      slot: 'map',
      procedural: { schemaVersion: 2 },
    });
    expect(r.artifactGlbSha256).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(r.bakedTextures?.[0]?.artifactGlbSha256).toBe(r.artifactGlbSha256);
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

  test('option absent: CPU grid comes from exact final bytes and fidelity is explicitly geometry-only', async () => {
    runImpl = okRun;
    const r = await generateKilnAsset({ prompt: 'a crate', captureViews: true });

    const { renderGlbViewGrid } = await import('../views');
    const cpu = (await renderGlbViewGrid(r.glb)).png;
    expect(r.views).toBeInstanceOf(Buffer);
    expect(Buffer.compare(r.views!, cpu)).toBe(0);
    // Legacy port-specific fields remain absent; the additive fidelity contract
    // now tells callers the image is not suitable for material acceptance.
    expect(r.viewsRendererId).toBeUndefined();
    expect(r.renderDegraded).toBeUndefined();
    expect(r.renderDegradedReason).toBeUndefined();
    expect('renderDegraded' in r).toBe(false);
    expect(r.viewsFidelity).toMatchObject({
      version: 'kiln.view-fidelity.v1',
      requested: 'full-preferred',
      delivered: 'geometry-flat',
      materialFaithful: false,
      exactArtifact: true,
      degraded: true,
      degradeReason: 'material-faithful view render port unavailable',
      reasonCodes: ['FULL_MATERIAL_RENDER_UNAVAILABLE'],
    });
    expect(r.viewsFidelity?.inputGlbSha256).toBe(r.artifactGlbSha256);
  });

  test('R2.11: final CPU fallback does not execute authored source a second time', async () => {
    const countedCode = CANNED_CODE.replace(
      'boxGeo(1, 1, 1)',
      'boxGeo(0.5 + Math.clz32(1) * 0, 1, 1)',
    );
    runImpl = async () => ({ code: countedCode, toolCalls: ['kiln_submit'], steps: 1 });
    const sourceExecutionSpy = spyOn(Math, 'clz32');
    try {
      const result = await generateKilnAsset({ prompt: 'a crate', captureViews: true });
      expect(result.views).toBeInstanceOf(Buffer);
      expect(sourceExecutionSpy).toHaveBeenCalledTimes(1);
      expect(result.viewsFidelity?.exactArtifact).toBe(true);
      expect(result.viewsFidelity?.inputGlbSha256).toBe(result.artifactGlbSha256);
    } finally {
      sourceExecutionSpy.mockRestore();
    }
  });

  test('R2.11: textured exact-byte fallback reports its unsupported sampling code', async () => {
    runImpl = async () => ({ code: PROCEDURAL_CODE, toolCalls: ['kiln_submit'], steps: 1 });
    const result = await generateKilnAsset({ prompt: 'a textured crate', captureViews: true });

    expect(result.views).toBeInstanceOf(Buffer);
    expect(result.viewsFidelity).toMatchObject({
      delivered: 'geometry-flat',
      exactArtifact: true,
      materialFaithful: false,
      inputGlbSha256: result.artifactGlbSha256,
      reasonCodes: ['FULL_MATERIAL_RENDER_UNAVAILABLE', 'GLB_FLAT_TEXTURE_SAMPLING_UNSUPPORTED'],
    });
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
    expect(r.viewsFidelity).toMatchObject({
      delivered: 'full-material',
      materialFaithful: true,
      exactArtifact: true,
      rendererId: 'dawn-vulkan:test-gpu:1.0',
      degraded: false,
    });
    // The views are the port cells composited into the SAME 3x2 grid layout,
    // and stamped with the same cell labels + gnomon the CPU path applies.
    const { compositeViewPngGrid, SIX_VIEWS } = await import('../views');
    expect(Buffer.compare(r.views!, compositeViewPngGrid(viewsPng, 3, SIX_VIEWS).png)).toBe(0);
    // Annotation is not optional decoration: an unlabelled sheet would differ.
    expect(Buffer.compare(r.views!, compositeViewPngGrid(viewsPng).png)).not.toBe(0);
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

    const { renderGlbViewGrid, CPU_RASTER_RENDERER_ID } = await import('../views');
    expect(r.renderDegraded).toBe(true);
    expect(r.renderDegradedReason).toContain('GPU service unreachable');
    expect(r.viewsRendererId).toBe(CPU_RASTER_RENDERER_ID);
    expect(r.viewsRendererId).toMatch(/^cpu-raster:/);
    expect(r.viewsFidelity).toMatchObject({
      delivered: 'geometry-flat',
      materialFaithful: false,
      exactArtifact: true,
      degraded: true,
    });
    expect(r.viewsFidelity?.degradeReason).toContain('GPU service unreachable');
    expect(r.viewsFidelity?.inputGlbSha256).toBe(r.artifactGlbSha256);
    const cpu = (await renderGlbViewGrid(r.glb)).png;
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

  test('R2.7: final view timeout consumes dynamic warm-up and generation budget context', async () => {
    runImpl = okRun;
    const requests: string[] = [];
    const r = await generateKilnAsset({
      prompt: 'a crate',
      captureViews: true,
      viewRenderPort: () => new Promise(() => {}),
      viewRenderTimeoutContext: () => ({
        warmUpState: 'pending',
        remainingGenerationBudgetMs: 17,
        rendererDeadlineMs: 30,
      }),
      viewRenderTimeoutResolver: (context) => {
        requests.push(context.requestKind);
        return 1_000;
      },
    });
    expect(r.renderDegraded).toBe(true);
    expect(r.renderDegradedReason).toContain('timed out after 17ms');
    expect(requests).toEqual(['final-grid']);
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
    expect(garbage.renderDegradedReason).toContain('invalid PNG header');
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
      const { compositeViewPngGrid, SIX_VIEWS } = await import('../views');
      expect(Buffer.compare(okOutcome.png, compositeViewPngGrid(viewsPng, 3, SIX_VIEWS).png)).toBe(
        0,
      );
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

  // ===========================================================================
  // T3.3 — the persisted artifact honours the requested layout, on BOTH paths
  // ===========================================================================

  /** N solid-color per-view PNGs, like a host PBR renderer would return. */
  async function stubCells(n: number, size = 8): Promise<Uint8Array[]> {
    const { encodePng } = await import('../views');
    return Array.from({ length: n }, (_, i) => {
      const rgb = new Uint8Array(size * size * 3);
      for (let p = 0; p < size * size; p++) rgb[p * 3] = 20 + i * 20;
      return new Uint8Array(encodePng(rgb, size, size));
    });
  }

  test('T3.3 BYTE-IDENTITY: omitting capture is unchanged, and an explicit 3x2 matches it', async () => {
    runImpl = okRun;
    const base = await generateKilnAsset({ prompt: 'a crate', captureViews: true });
    const explicit = await generateKilnAsset({
      prompt: 'a crate',
      captureViews: true,
      capture: { preset: '3x2' },
    });
    expect(Buffer.compare(explicit.views!, base.views!)).toBe(0);
    expect(base.viewsCapture).toEqual({ preset: '3x2', cols: 3, cells: 6 });
    expect(explicit.viewsCapture).toEqual({ preset: '3x2', cols: 3, cells: 6 });
  });

  test('T3.3: the port is asked for the requested cell count and composited at its columns', async () => {
    runImpl = okRun;
    const viewsPng = await stubCells(9);
    const requests: import('../composer/render-port').PbrRenderRequest[] = [];
    const r = await generateKilnAsset({
      prompt: 'a crate',
      captureViews: true,
      capture: { preset: '3x3' },
      viewRenderPort: async (req) => {
        requests.push(req);
        return { ok: true, rendererId: 'dawn-vulkan:test-gpu:1.0', viewsPng };
      },
    });
    // The relaxed count check: nine views requested, nine accepted (this used to
    // be a hard six).
    expect(requests[0]!.viewDirs).toHaveLength(9);
    expect(r.renderDegraded).toBe(false);
    expect(r.viewsCapture).toEqual({ preset: '3x3', cols: 3, cells: 9 });
    const { compositeViewPngGrid, resolveCapture } = await import('../views');
    const cells = resolveCapture({ preset: '3x3' }).views;
    expect(Buffer.compare(r.views!, compositeViewPngGrid(viewsPng, 3, cells).png)).toBe(0);
  });

  test('T3.3: a 2-column request composites at 2 columns, not the default 3', async () => {
    runImpl = okRun;
    const viewsPng = await stubCells(4);
    const r = await generateKilnAsset({
      prompt: 'a crate',
      captureViews: true,
      capture: { preset: '2x2' },
      viewRenderPort: async () => ({ ok: true, rendererId: 'gpu:test', viewsPng }),
    });
    expect(r.viewsCapture).toEqual({ preset: '2x2', cols: 2, cells: 4 });
    const { compositeViewPngGrid, resolveCapture } = await import('../views');
    const cells = resolveCapture({ preset: '2x2' }).views;
    // Same cells at 3 cols would be a different image; pin that it is not that.
    expect(Buffer.compare(r.views!, compositeViewPngGrid(viewsPng, 2, cells).png)).toBe(0);
    expect(Buffer.compare(r.views!, compositeViewPngGrid(viewsPng, 3, cells).png)).not.toBe(0);
  });

  test('T3.3: a GPU degrade produces the SAME layout the port was asked for', async () => {
    runImpl = okRun;
    const capture = { preset: '3x1' as const };
    const degraded = await generateKilnAsset({
      prompt: 'a crate',
      captureViews: true,
      capture,
      viewRenderPort: async () => {
        throw new Error('GPU service unreachable');
      },
    });
    expect(degraded.renderDegraded).toBe(true);
    expect(degraded.viewsCapture).toEqual({ preset: '3x1', cols: 3, cells: 3 });

    // The whole point: a GPU outage must not reshape the artifact. The degraded
    // sheet is exactly what the CPU path produces for the same request.
    const { renderGlbViewGrid } = await import('../views');
    const cpu = await renderGlbViewGrid(degraded.glb, { capture });
    expect(Buffer.compare(degraded.views!, cpu.png)).toBe(0);
  });

  test('T3.3: per-cell zoom sends an exact camera and declines an unattested legacy reply', async () => {
    runImpl = okRun;
    let portCalls = 0;
    let requested: import('../composer/render-port').PbrRenderRequest | undefined;
    const capture = { cells: [{ azimuthDeg: 45, elevationDeg: 20, zoom: 2 }] };
    const r = await generateKilnAsset({
      prompt: 'a crate',
      captureViews: true,
      capture,
      viewRenderPort: async (request) => {
        requested = request;
        portCalls++;
        return { ok: true, rendererId: 'gpu:test', viewsPng: await stubCells(1) };
      },
    });
    expect(portCalls).toBe(1);
    expect(requested?.viewDirs).toBeUndefined();
    expect(requested?.cameras?.[0]).toMatchObject({
      projection: 'orthographic',
      halfHeight: expect.any(Number),
    });
    expect(r.renderDegraded).toBe(true);
    expect(r.renderDegradedReason).toContain('camera receipt missing');
    const { renderGlbViewGrid } = await import('../views');
    expect(Buffer.compare(r.views!, (await renderGlbViewGrid(r.glb, { capture })).png)).toBe(0);
  });

  test('T3.3: an invalid capture warns and falls back — it never fails the run', async () => {
    runImpl = okRun;
    const r = await generateKilnAsset({
      prompt: 'a crate',
      captureViews: true,
      capture: { preset: '4x4' as never },
    });
    expect(r.views).toBeInstanceOf(Buffer);
    expect(r.viewsCapture).toEqual({ preset: '3x2', cols: 3, cells: 6 });
    expect(r.warnings.some((w) => w.includes('capture config ignored'))).toBe(true);

    const base = await generateKilnAsset({ prompt: 'a crate', captureViews: true });
    expect(Buffer.compare(r.views!, base.views!)).toBe(0);
  });

  test('T3.3: a bad config degrades the port too, instead of reaching it twice differently', async () => {
    runImpl = okRun;
    let portCalls = 0;
    const r = await generateKilnAsset({
      prompt: 'a crate',
      captureViews: true,
      capture: { cells: [] },
      viewRenderPort: async () => {
        portCalls++;
        return { ok: true, rendererId: 'gpu:test', viewsPng: await stubCells(6) };
      },
    });
    // Validated once, up front: the port is asked for the DEFAULT grid, not for
    // the rejected config and not skipped entirely.
    expect(portCalls).toBe(1);
    expect(r.renderDegraded).toBe(false);
    expect(r.viewsCapture).toEqual({ preset: '3x2', cols: 3, cells: 6 });
    expect(r.warnings.some((w) => w.includes('capture config ignored'))).toBe(true);
  });

  test('T3.3: the GPU sheet carries the same cell labels and gnomon as the CPU one', async () => {
    // A host returns pixels; it knows nothing of the Kiln camera vocabulary. If
    // the engine did not stamp, the GPU sheet would arrive unlabelled and the
    // model would lose its orientation cues on the one path that cannot tell it
    // happened. Producer identity belongs in `viewsRendererId`, not in whether
    // the picture has words on it.
    runImpl = okRun;
    const viewsPng = await stubCells(2);
    const capture = { cells: [{ azimuthDeg: 0, elevationDeg: 0, name: 'seam' }] };
    const r = await generateKilnAsset({
      prompt: 'a crate',
      captureViews: true,
      capture: { preset: '1x2' },
      viewRenderPort: async () => ({ ok: true, rendererId: 'gpu:test', viewsPng }),
    });

    const { compositeViewPngGrid, resolveCapture } = await import('../views');
    const cells = resolveCapture({ preset: '1x2' }).views;
    const annotated = compositeViewPngGrid(viewsPng, 1, cells).png;
    const bare = compositeViewPngGrid(viewsPng, 1).png;
    expect(Buffer.compare(r.views!, annotated)).toBe(0);
    expect(Buffer.compare(r.views!, bare)).not.toBe(0);

    // Custom cell names reach the GPU sheet too, not just the CPU one.
    const named = resolveCapture(capture).views;
    expect(named[0]!.name).toBe('SEAM');
    const one = viewsPng.slice(0, 1);
    expect(
      Buffer.compare(compositeViewPngGrid(one, 1, named).png, compositeViewPngGrid(one, 1).png),
    ).not.toBe(0);

    // A misaligned view list is a caller bug, not something to composite anyway.
    expect(() => compositeViewPngGrid(viewsPng, 1, named)).toThrow(/align 1:1/);
  });

  test('T3.3: captureViewsViaPort takes capture as its fourth argument', async () => {
    const { captureViewsViaPort } = await import('./generate');
    const viewsPng = await stubCells(2);
    const seen: number[] = [];
    const out = await captureViewsViaPort(
      async (req) => {
        seen.push(req.viewDirs?.length ?? 0);
        return { ok: true, rendererId: 'gpu:test', viewsPng };
      },
      new Uint8Array([1, 2, 3]),
      undefined,
      { preset: '2x1' },
    );
    expect(seen).toEqual([2]);
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.capture).toEqual({ preset: '2x1', cols: 2, cells: 2 });

    // Count mismatch now reports the REQUESTED count, not a hardcoded six.
    const short = await captureViewsViaPort(
      async () => ({ ok: true, rendererId: 'gpu:test', viewsPng: viewsPng.slice(0, 1) }),
      new Uint8Array([1, 2, 3]),
      undefined,
      { preset: '2x1' },
    );
    expect(short.ok).toBe(false);
    if (!short.ok) expect(short.reason).toContain('returned 1 view PNGs, expected 2');
  });
});
