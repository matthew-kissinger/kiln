import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const rootPath = fileURLToPath(root);

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, root), 'utf8'));
}

async function readText(path) {
  return readFile(new URL(path, root), 'utf8').catch(() => '');
}

describe('repository reliability contracts', () => {
  test('package metadata declares the CI-supported runtimes', async () => {
    const pkg = await readJson('package.json');

    expect(pkg.packageManager).toBe('bun@1.3.14');
    expect(pkg.engines).toEqual({ bun: '1.3.14', node: '22.23.1', npm: '12.0.1' });
  });

  test('the toolchain checker verifies package and workflow metadata', async () => {
    const pkg = await readJson('package.json');
    const result = spawnSync(process.execPath, ['scripts/check-toolchain.mjs', '--files-only'], {
      cwd: rootPath,
      encoding: 'utf8',
    });

    expect(pkg.scripts['check:toolchain']).toBe('bun scripts/check-toolchain.mjs');
    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.stdout.trim()).toBe('Toolchain metadata: Bun 1.3.14, Node 22.23.1, npm 12.0.1');
  });

  test('coverage is measured, ratcheted, and retained by CI', async () => {
    const pkg = await readJson('package.json');
    const bunfig = await readText('bunfig.toml');
    const thresholds = JSON.parse((await readText('coverage-thresholds.json')) || '{}');
    const readme = await readText('README.md');
    const workflow = await readText('.github/workflows/ci.yml');

    expect(pkg.scripts['test:coverage']).toBe(
      'KILN_SPIKE_LIVE=0 bun test --coverage && bun scripts/check-coverage.mjs',
    );
    expect(bunfig).toContain('coverageReporter = ["text", "lcov"]');
    expect(bunfig).not.toContain('coverageThreshold =');
    expect(bunfig).toContain('coveragePathIgnorePatterns = [');
    expect(thresholds).toEqual({
      measuredBaseline: { functions: 95.38, lines: 91.8 },
      thresholds: { functions: 92, lines: 91 },
    });
    expect(readme).toContain('95.38% functions / 91.80% lines');
    expect(readme).toContain('Threshold decreases require an explicit measured rationale.');
    expect(workflow).toContain('run: bun run test:coverage');
    expect(workflow).toContain('uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02');
    expect(workflow).toContain('path: coverage/lcov.info');
  });

  test('standalone agent context stays concise and names the safety-critical paths', async () => {
    const agents = await readText('AGENTS.md');

    expect(Buffer.byteLength(agents)).toBeGreaterThan(0);
    expect(Buffer.byteLength(agents)).toBeLessThan(12 * 1024);
    expect(agents).toContain('bun run test:coverage');
    expect(agents).toContain('bun run sync:engine');
    expect(agents).toContain('npm --legacy-peer-deps');
    expect(agents).toContain('Do not deploy, commit, push');
  });
});
