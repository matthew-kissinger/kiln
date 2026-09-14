import { afterEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  buildInvocation,
  classifyOutcome,
  composeBlindPrompt,
  discoverArtifacts,
  evidenceFromTrace,
  hermesRunConfig,
  parseArgs,
  receiptPathReplacements,
  runProcess,
  sanitizeReceipt,
} from './tier2-dogfood.mjs';

const roots = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('Tier 2 blind dogfood driver', () => {
  test('the prompt contains only the public repository and outcome-shaped asset goal', () => {
    const prompt = composeBlindPrompt('a tide-powered cliffside signal station');

    expect(prompt).toContain('https://github.com/matthew-kissinger/kiln');
    expect(prompt).toContain('a tide-powered cliffside signal station');
    expect(prompt).toContain('launch your own headless coding agent');
    expect(prompt).toContain('inside your current run directory');
    expect(prompt).not.toContain('kiln_render');
    expect(prompt).not.toContain('create-workspace.mjs');
    expect(prompt).not.toContain('AGENTS.md');
  });

  test('dry-run is the default and live execution needs an authorization record', () => {
    expect(parseArgs(['--harness', 'codex', '--goal', 'an intricate walking crane'])).toMatchObject(
      {
        dryRun: true,
        live: false,
        runs: 1,
      },
    );
    expect(() =>
      parseArgs(['--harness', 'codex', '--goal', 'an intricate walking crane', '--run-live']),
    ).toThrow(/authorization/i);
  });

  test('user-library capture is default-on and can be explicitly redirected or disabled', () => {
    expect(parseArgs(['--harness', 'codex', '--goal', 'an intricate walking crane'])).toMatchObject(
      { localGallery: true, galleryRoot: null },
    );
    expect(
      parseArgs([
        '--harness',
        'codex',
        '--goal',
        'an intricate walking crane',
        '--gallery-root',
        '/tmp/private-gallery',
      ]),
    ).toMatchObject({ localGallery: true, galleryRoot: resolve('/tmp/private-gallery') });
    expect(
      parseArgs([
        '--harness',
        'codex',
        '--goal',
        'an intricate walking crane',
        '--no-local-gallery',
      ]),
    ).toMatchObject({ localGallery: false });
  });

  test('Codex and Claude invocations suppress inherited customization but retain auth', () => {
    const codex = buildInvocation({
      harness: 'codex',
      model: null,
      prompt: 'brief',
      workspace: '/tmp/run',
      emptyMcpConfig: '/tmp/empty.json',
      compactTokens: 333000,
    });
    expect(codex.args).toContain('--ignore-user-config');
    expect(codex.args).toContain('--ignore-rules');
    expect(codex.args).toContain('--ephemeral');
    expect(codex.args).toContain('--dangerously-bypass-approvals-and-sandbox');
    expect(codex.args).toContain('model_auto_compact_token_limit=333000');

    const claude = buildInvocation({
      harness: 'claude',
      model: 'sonnet',
      prompt: 'brief',
      workspace: '/tmp/run',
      emptyMcpConfig: '/tmp/empty.json',
      compactTokens: 333000,
    });
    expect(claude.args).toContain('--safe-mode');
    expect(claude.args).toContain('--strict-mcp-config');
    expect(claude.args).toContain('/tmp/empty.json');
    expect(claude.args).toContain('333k');
  });

  test('OpenCode and Hermes outer runs suppress inherited Kiln configuration', () => {
    const opencode = buildInvocation({
      harness: 'opencode',
      model: 'opencode/muse-spark-1.3-contributor-free',
      prompt: 'brief',
      workspace: '/tmp/run',
      emptyMcpConfig: '/tmp/empty.json',
      compactTokens: null,
      provider: null,
      reasoning: null,
    });
    expect(opencode.args).toContain('--pure');
    expect(opencode.args).toContain('--auto');
    expect(opencode.env).toEqual({ XDG_CONFIG_HOME: join('/tmp/run', '.outer-opencode-config') });

    const hermes = buildInvocation({
      harness: 'hermes',
      model: 'gpt-5.6-luna',
      provider: 'openai-codex',
      reasoning: 'xhigh',
      prompt: 'brief',
      workspace: '/tmp/run',
      emptyMcpConfig: '/tmp/empty.json',
      compactTokens: null,
    });
    expect(hermes.args).toContain('--safe-mode');
    expect(hermes.args).toContain('--yolo');
    expect(hermes.args).toContain('openai-codex');
    expect(hermes.args).toContain('xhigh');
    expect(hermes.env).toEqual({ HERMES_HOME: join('/tmp/run', '.outer-hermes-home') });
  });

  test('only harnesses with per-run absolute controls accept compact tokens', () => {
    expect(() =>
      parseArgs([
        '--harness',
        'opencode',
        '--goal',
        'an intricate walking crane',
        '--compact-tokens',
        '333000',
      ]),
    ).toThrow(/per-run absolute compaction/i);
  });

  test('Hermes contributor tiers require an explicit isolated-home acknowledgement', () => {
    const parsed = parseArgs([
      '--harness',
      'hermes',
      '--goal',
      'an intricate walking crane',
      '--allow-data-training-tier',
    ]);
    const invocation = buildInvocation({
      harness: 'hermes',
      model: 'muse-spark-1.3-contributor-free',
      provider: 'opencode-free',
      reasoning: null,
      prompt: 'brief',
      workspace: '/tmp/run',
      emptyMcpConfig: '/tmp/empty.json',
      compactTokens: null,
      allowDataTrainingTier: parsed.allowDataTrainingTier,
    });

    expect(invocation.args).not.toContain('--safe-mode');
    expect(invocation.env).toEqual({ HERMES_HOME: join('/tmp/run', '.outer-hermes-home') });
  });

  test('an isolated Hermes home preserves the selected free route for nested agents', () => {
    expect(
      hermesRunConfig({
        model: 'nemotron-3.5-lightning-free',
        provider: 'opencode-free',
        allowDataTrainingTier: false,
      }),
    ).toBe('model:\n  default: nemotron-3.5-lightning-free\n  provider: opencode-free\n');
    expect(
      hermesRunConfig({
        model: 'muse-spark-1.3-contributor-free',
        provider: 'opencode-free',
        allowDataTrainingTier: true,
      }),
    ).toContain('allow_data_training_tiers_noninteractive: true');
  });

  test('Hermes can use an operator-prepared isolated OAuth home', () => {
    const parsed = parseArgs([
      '--harness',
      'hermes',
      '--goal',
      'an intricate walking crane',
      '--hermes-home',
      '/tmp/hermes-home',
    ]);
    const invocation = buildInvocation({
      harness: 'hermes',
      model: 'gpt-5.6-luna',
      provider: 'openai-codex',
      reasoning: 'xhigh',
      prompt: 'brief',
      workspace: '/tmp/run',
      emptyMcpConfig: '/tmp/empty.json',
      compactTokens: null,
      hermesHome: parsed.hermesHome,
    });

    expect(invocation.env).toEqual({ HERMES_HOME: resolve('/tmp/hermes-home') });
  });

  test('Agy requires an operator-prepared clean auth home and attaches its print prompt', () => {
    const parsed = parseArgs([
      '--harness',
      'agy',
      '--goal',
      'an intricate walking crane',
      '--agy-home',
      '/tmp/agy-home',
    ]);
    const invocation = buildInvocation({
      harness: 'agy',
      model: 'gemini-3.8-flash-high',
      provider: null,
      reasoning: 'high',
      prompt: 'brief',
      workspace: '/tmp/run',
      emptyMcpConfig: '/tmp/empty.json',
      compactTokens: null,
      timeoutMs: 60_000,
      agyHome: parsed.agyHome,
    });

    expect(invocation.args).toContain('--print=brief');
    expect(invocation.args).toContain('--new-project');
    expect(invocation.env).toEqual({ HOME: resolve('/tmp/agy-home') });
  });

  test('telemetry field names do not masquerade as a quota failure', () => {
    const trace = [
      JSON.stringify({
        type: 'result',
        usage: { rateLimitType: 'five_hour', tokens: 123 },
        message: 'Finished normally',
      }),
    ].join('\n');
    expect(evidenceFromTrace(trace, '')).toEqual([]);
    expect(classifyOutcome({ exitCode: 0, timedOut: false, evidence: [], artifacts: [] })).toBe(
      'asset-failure',
    );
  });

  test('quota and authentication failures require explicit error evidence', () => {
    const quota = evidenceFromTrace(
      `${JSON.stringify({ type: 'error', message: 'Usage limit reached for this account' })}\n`,
      '',
    );
    expect(quota[0]).toMatchObject({ class: 'provider-quota' });
    expect(classifyOutcome({ exitCode: 1, timedOut: false, evidence: quota, artifacts: [] })).toBe(
      'provider-quota',
    );

    const auth = evidenceFromTrace('', 'Error: OAuth token expired; please login again');
    expect(auth[0]).toMatchObject({ class: 'authentication' });

    const hermesQuota = evidenceFromTrace(
      'API call failed after 3 retries: HTTP 429: Rate limit exceeded.\n',
      '',
    );
    expect(hermesQuota[0]).toMatchObject({ class: 'provider-quota' });

    const codexQuota = evidenceFromTrace(
      '',
      "You've hit your usage limit. Upgrade to Pro or try again later.",
    );
    expect(codexQuota[0]).toMatchObject({ class: 'provider-quota' });
  });

  test('known Agy coordination notices are not failure evidence', () => {
    const evidence = evidenceFromTrace(
      '',
      'root agent idle; waiting for 1 background task(s) (bounded by --print-timeout)\nError: child process failed',
    );

    expect(evidence).toEqual([{ class: 'harness-error', message: 'Error: child process failed' }]);
  });

  test('a source and GLB are necessary but remain pending human quality review', () => {
    expect(
      classifyOutcome({
        exitCode: 0,
        timedOut: false,
        evidence: [],
        artifacts: [{ kind: 'source' }, { kind: 'glb' }],
      }),
    ).toBe('completed-pending-review');
    expect(
      classifyOutcome({
        exitCode: 0,
        timedOut: false,
        evidence: [],
        artifacts: [{ kind: 'source' }],
      }),
    ).toBe('partial-asset');
  });

  test('artifact discovery excludes installed skill samples and cloned examples', () => {
    const root = mkdtempSync(join(tmpdir(), 'kiln-tier2-artifact-test-'));
    roots.push(root);
    for (const relative of [
      'workspace/skills/author/references/sample.kiln.js',
      'workspace/.agents/skills/author/references/sample.kiln.js',
      'clone/examples/finished.kiln.js',
      'workspace/final.kiln.js',
      'workspace/final.glb',
    ]) {
      const path = join(root, relative);
      mkdirSync(join(path, '..'), { recursive: true });
      writeFileSync(path, relative);
    }
    mkdirSync(join(root, 'clone', '.git'));

    expect(discoverArtifacts(root).map(({ path }) => path)).toEqual([
      'workspace/final.glb',
      'workspace/final.kiln.js',
    ]);
  });

  test('the deadline kills only the spawned process group', async () => {
    const root = mkdtempSync(join(tmpdir(), 'kiln-tier2-timeout-test-'));
    roots.push(root);
    const marker = join(root, 'descendant-survived');
    const stdoutPath = join(root, 'stdout.jsonl');
    const stderrPath = join(root, 'stderr.log');
    const childScript = [
      "const {spawn}=require('node:child_process')",
      `spawn(process.execPath,['-e',${JSON.stringify(`setTimeout(()=>require('node:fs').writeFileSync(${JSON.stringify(marker)},'bad'),350)`)}],{stdio:'ignore'})`,
      'setInterval(()=>{},1000)',
    ].join(';');
    const result = await runProcess('node', ['-e', childScript], {
      cwd: root,
      env: process.env,
      stdoutPath,
      stderrPath,
      timeoutMs: 50,
      killGraceMs: 50,
    });
    await new Promise((resolve) => setTimeout(resolve, 450));

    expect(result.timedOut).toBe(true);
    expect(existsSync(marker)).toBe(false);
    expect(readFileSync(stderrPath, 'utf8')).toContain('deadline exceeded');
  });

  test('sanitized receipts redact credentials and machine paths', () => {
    const sanitized = sanitizeReceipt(
      {
        workspace: '/home/operator/private/run',
        note: 'Authorization: Bearer secret-token and api_key=sk-test-secret',
      },
      [
        ['/home/operator/private/run', '$WORKSPACE'],
        ['/home/operator', '$HOME'],
      ],
    );
    expect(JSON.stringify(sanitized)).toBe(
      '{"workspace":"$WORKSPACE","note":"Authorization: Bearer [REDACTED] and api_key=[REDACTED]"}',
    );
  });

  test('sanitized receipts replace operator-prepared authentication home paths', () => {
    const replacements = receiptPathReplacements({
      workspace: '/tmp/workspaces/run-01',
      workspaceRoot: '/tmp/workspaces',
      outDir: '/tmp/evidence',
      agyHome: '/tmp/private-agy-auth-home',
      hermesHome: '/tmp/private-hermes-auth-home',
      home: '/home/operator',
    });
    const sanitized = sanitizeReceipt(
      {
        agyHome: '/tmp/private-agy-auth-home',
        hermesHome: '/tmp/private-hermes-auth-home',
        details: ['HOME=/tmp/private-agy-auth-home', 'HERMES_HOME=/tmp/private-hermes-auth-home'],
      },
      replacements,
    );

    expect(sanitized).toEqual({
      agyHome: '$AGY_HOME',
      hermesHome: '$HERMES_HOME',
      details: ['HOME=$AGY_HOME', 'HERMES_HOME=$HERMES_HOME'],
    });
  });
});
