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

    expect(pkg.packageManager).toBe('bun@1.4.2');
    expect(pkg.engines).toEqual({ bun: '1.4.2', node: '22.23.2', npm: '12.0.2' });
  });

  test('the toolchain checker verifies package and workflow metadata', async () => {
    const pkg = await readJson('package.json');
    const result = spawnSync(process.execPath, ['scripts/check-toolchain.mjs', '--files-only'], {
      cwd: rootPath,
      encoding: 'utf8',
    });

    expect(pkg.scripts['check:toolchain']).toBe('bun scripts/check-toolchain.mjs');
    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.stdout.trim()).toBe('Toolchain metadata: Bun 1.4.2, Node 22.23.2, npm 12.0.2');
  });

  test('coverage is measured, ratcheted, and retained by CI', async () => {
    const pkg = await readJson('package.json');
    const bunfig = await readText('bunfig.toml');
    const thresholds = JSON.parse((await readText('coverage-thresholds.json')) || '{}');
    // Collapse whitespace before matching prose. These assertions describe
    // sentences, and a sentence in a hard-wrapped Markdown file contains
    // newlines at positions nobody should have to predict -- the ratchet-policy
    // check below silently stopped matching when a paragraph was reflowed during
    // an edit, which is the opposite of what a documentation guard is for.
    const readme = (await readText('README.md')).replace(/\s+/g, ' ');
    const workflow = await readText('.github/workflows/ci.yml');

    expect(pkg.scripts['test:coverage']).toBe(
      'KILN_SPIKE_LIVE=0 KILN_RENDER=cpu bun test src scripts --coverage && bun scripts/check-coverage.mjs',
    );
    // A warning baseline is a number kept in prose that everyone agrees to ignore, and
    // the twenty-sixth finding arrives invisible. The tree reports nothing, so the flag
    // that makes a warning fatal is part of the contract rather than a preference.
    expect(pkg.scripts['lint']).toBe('biome check --error-on-warnings .');
    // `--error-on-warnings` does not cover Biome's info severity, which is where several
    // of these sit by default, so the rules this repository has actually cleaned carry an
    // explicit `error`. Asserted rather than trusted because the downgrade has happened
    // here before: `useIterableCallbackReturn` was pinned to `warn` around a single
    // finding, and a rule quietly lowered to keep a build green is indistinguishable from
    // a rule nobody wanted.
    const biome = JSON.parse(await readText('biome.json'));
    const severities = Object.assign(
      {},
      ...Object.values(biome.linter.rules).filter((group) => typeof group === 'object'),
    );
    for (const rule of [
      'useTemplate',
      'useOptionalChain',
      'noUnusedImports',
      'noApproximativeNumericConstant',
      'noExplicitAny',
      'noGlobalIsFinite',
      'useIterableCallbackReturn',
    ]) {
      expect(severities[rule], `${rule} must stay at error`).toBe('error');
    }
    // The gates have to be inside the lint surface. `scripts/` sat outside
    // `files.includes` while `test:coverage` measured it, so every check in this
    // directory -- including the file you are reading -- was coverage-counted and
    // never linted. Found by adding a file here and watching `biome check` on its
    // own path report "No files were processed". The surface is the gates and their
    // tests; the one-off tools beside them are a separate decision, recorded in
    // ledger 14.4 with what taking them costs.
    expect(biome.files.includes).toContain('scripts/check-*.mjs');
    expect(biome.files.includes).toContain('scripts/**/*.test.mjs');

    // Views must be byte-reproducible: a runner that happens to reach a GPU render
    // service must not be able to change what the golden-image tests compare.
    expect(pkg.scripts['test']).toContain('KILN_RENDER=cpu');
    expect(workflow).toContain('KILN_RENDER: cpu');
    expect(bunfig).toContain('coverageReporter = ["text", "lcov"]');
    expect(bunfig).not.toContain('coverageThreshold =');
    expect(bunfig).toContain('coveragePathIgnorePatterns = [');
    // The enforced ratchets are policy: they must not move without someone
    // noticing, so they stay literal here. The measured baseline is an
    // observation, and it legitimately moves whenever code lands — so it is
    // checked for shape and then used to verify the README quotes it, rather
    // than written out a third time in this file. Three copies of one number
    // drift, and the copy in the test is the one that turns a stale sentence
    // into a red build with no idea which of the three is right.
    expect(Object.keys(thresholds).sort()).toEqual(['measuredBaseline', 'thresholds']);
    expect(thresholds.thresholds).toEqual({ functions: 94, lines: 92 });
    const { functions, lines } = thresholds.measuredBaseline;
    expect(functions).toBeGreaterThanOrEqual(thresholds.thresholds.functions);
    expect(lines).toBeGreaterThanOrEqual(thresholds.thresholds.lines);
    expect(readme).toContain('docs/architecture.md');
    expect(await readText('docs/architecture.md')).toContain(
      'Threshold decreases require an explicit measured rationale.',
    );
    expect(workflow).toContain('run: bun run test:coverage');
    expect(workflow).toContain(
      'uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
    );
    expect(workflow).toContain('path: coverage/lcov.info');
  });

  // The Windows gate spent a day reporting rather than blocking, on purpose, while an
  // intermittent native fault was ruled out. Demoting it again is a decision, not a
  // detail, so it cannot happen by dropping one line back into the file unnoticed.
  //
  // This asserts the repository's half. The other half is a GitHub setting: the job's
  // check context has to be listed in main's branch protection, or a red Windows run
  // fails the workflow and still permits the merge.
  test('every CI job blocks; none of them merely reports', async () => {
    const workflow = await readText('.github/workflows/ci.yml');

    expect(workflow).toContain('typecheck \u00b7 lint \u00b7 test (Windows)');
    // Indentation is the distinction, and it is the whole point. At job level -- four
    // spaces, a sibling of `runs-on` -- `continue-on-error` demotes an entire gate to a
    // report. At step level it excuses one command. There must be none of the first.
    expect(workflow.match(/^ {4}continue-on-error:/gmu)).toBeNull();
    // The one at step level is the native dependency inventory: it exists so that IF
    // the GLib fault returns, the libvips and GLib versions arrive attached to that run.
    // It must never be why Windows reports red, so it is failure-tolerant by design.
    expect(workflow.match(/^ {8}continue-on-error:/gmu)).toHaveLength(1);
    expect(workflow).toContain('Report the native dependency inventory');
  });

  test('standalone agent context stays concise and names the safety-critical paths', async () => {
    const agents = await readText('AGENTS.md');

    expect(Buffer.byteLength(agents)).toBeGreaterThan(0);
    expect(Buffer.byteLength(agents)).toBeLessThan(12 * 1024);
    expect(agents).toContain('bun run test:coverage');
    // The invariants an editor will otherwise trip over. These are the claims this
    // repository actually makes, so AGENTS.md must keep naming them.
    expect(agents).toContain('captureViewsViaPort');
    expect(agents).toContain('never gate evidence');
    expect(agents).toContain('src/tools/registry.ts');
    expect(agents).toContain('Do not commit, push');
  });
});
