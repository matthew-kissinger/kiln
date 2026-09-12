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
    expect(biome.files.includes).toContain('scripts/**/*.mjs');
    expect(biome.files.includes).toContain('scripts/**/*.ts');
    // render-service joined the surface once its sources stopped being CRLF. It is
    // a shipped subsystem with 37 tests in CI, so it belongs here; what kept it out
    // was a `.gitattributes` `-text` line freezing an inconsistent line-ending mix.
    expect(biome.files.includes).toContain('render-service/src/**/*.mjs');
    expect(biome.files.includes).toContain('render-service/test/**/*.mjs');
    // And the attribute must stay gone, or the next edit reintroduces the mix.
    expect(await readText('.gitattributes')).not.toContain('render-service/src/** -text');

    // Views must be byte-reproducible: a runner that happens to reach a GPU render
    // service must not be able to change what the golden-image tests compare.
    expect(pkg.scripts['test']).toContain('KILN_RENDER=cpu');
    expect(workflow).toContain('KILN_RENDER: cpu');
    expect(bunfig).toContain('coverageReporter = ["text", "lcov"]');
    expect(bunfig).not.toContain('coverageThreshold =');
    expect(bunfig).toContain('coveragePathIgnorePatterns = [');
    // The ratchet is a contract about the shipped engine, measured over `src/`
    // alone. Without this line four files under `scripts/` are instrumented
    // because tests import them, and reflowing two dense ones moved the engine's
    // coverage by 0.35 points -- a formatting change in repo-only code moving a
    // number the repository treats as policy.
    expect(bunfig).toContain('"scripts/**",');
    // The enforced ratchets are policy: they must not move without someone
    // noticing, so they stay literal here. The measured baseline is an
    // observation, and it legitimately moves whenever code lands — so it is
    // checked for shape and then used to verify the README quotes it, rather
    // than written out a third time in this file. Three copies of one number
    // drift, and the copy in the test is the one that turns a stale sentence
    // into a red build with no idea which of the three is right.
    expect(Object.keys(thresholds).sort()).toEqual(['measuredBaseline', 'thresholds']);
    expect(thresholds.thresholds).toEqual({ functions: 94, lines: 92.1 });
    // Narrowing the scope handed back 44 lines of slack that no new test earned.
    // `lines` moves 92 -> 92.1 to hold the margin 13.3 chose rather than pocket
    // it; tightening beyond that is a separate decision with its own friction.
    expect(thresholds.measuredBaseline.measuredOver).toBe('src/');
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
  // The other half is a GitHub setting, and for three jobs it had simply never been
  // made: `build portable Node package` and both macOS package jobs ran on every pull
  // request, reported green 24 times out of 24, and were required by nothing -- so a
  // change that broke macOS packaging still merged. This test's name claimed otherwise
  // while checking only `continue-on-error`, which is the narrower of the two ways a
  // job can fail to block.
  //
  // `REQUIRED_CHECKS` cannot verify the GitHub setting from here. What it does is turn
  // the omission from silent into loud: adding a job to this workflow without deciding
  // whether it gates a merge now fails the suite.
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

    // Every check context this workflow can produce, and therefore every context that
    // has to be listed in main's branch protection. A matrix job contributes one per
    // leg, which is why the two macOS legs appear separately: GitHub requires the
    // expanded name, not the job key.
    //
    // Scoped to this workflow on purpose. `pages.yml` also reports a context -- `build
    // the gallery` -- and it must NOT be required, because that workflow is
    // path-filtered: it stays silent on a pull request touching none of `examples/`,
    // `site/`, `src/`, `scripts/authorship.ts` or `README.md`, and a required context
    // that never reports blocks every such merge instead of guarding it. `ci.yml` has
    // no path filter, so all six of its contexts always report and can all be
    // required. Conditional workflow, unrequired; unconditional workflow, required.
    const REQUIRED_CHECKS = [
      'build portable Node package',
      'Node package \u00b7 macOS arm64',
      'Node package \u00b7 macOS x64',
      'render service tests',
      'typecheck \u00b7 lint \u00b7 test',
      'typecheck \u00b7 lint \u00b7 test (Windows)',
    ];

    // Derived from the workflow rather than restated, so a renamed or added job is a
    // failure here instead of a context that silently stops being required. The job
    // key is the context when a job declares no `name`.
    const body = workflow.slice(workflow.indexOf('\njobs:'));
    const heads = [...body.matchAll(/^ {2}([a-z][\w-]*):$/gmu)];
    const produced = heads.flatMap((head, index) => {
      const job = body.slice(head.index, heads[index + 1]?.index ?? body.length);
      const declared = job.match(/^ {4}name: (.+)$/mu)?.[1] ?? head[1];
      const legs = [...job.matchAll(/^ {12}arch: (\S+)$/gmu)].map(([, arch]) => arch);
      return legs.length > 0
        ? legs.map((arch) => declared.replace(/\$\{\{ matrix\.arch \}\}/u, arch))
        : [declared];
    });

    expect(produced.sort()).toEqual([...REQUIRED_CHECKS].sort());
  });

  // The 2026-09-10 rewrite moved `refs/tags/oss-2026-09-05` as well as `main`, and a
  // tag is the one ref `git fetch` will not update on its own. That makes the stale
  // tag, not the branch, what keeps 288 MB of removed files reachable in an old clone
  // -- so the documented remedy has to force it. This is not hypothetical tidying: the
  // instructions here really did omit it, and a clone that had run them still measured
  // 228 MB against a fresh clone's 26 MB.
  //
  // Asserting the absence matters more than asserting the presence. The broken form is
  // the shorter, more obvious one, so it is what a later edit reaches for.
  test('the re-clone remedy moves the rewritten tag, not just the branch', async () => {
    const readme = await readText('README.md');

    expect(readme).toContain('git fetch --tags --force origin');
    // Both near-misses are *refused* by git rather than silently ineffective, which is
    // why a reader cannot discover `--force` by trying the obvious things first.
    expect(readme).not.toContain('git fetch origin && git reset --hard origin/main');
    expect(readme).toContain('oss-2026-09-05');
    // Forcing the tag frees nothing until the objects it pinned are actually dropped.
    expect(readme).toContain('git gc --prune=now');
  });

  // The documented offline gate ran neither `check:skills` nor render-service's 37
  // tests. CI ran both -- the first as a step in `checks`, the second as its own job
  // added by 13.7 -- so a contributor editing `render-service/` got no local signal at
  // all and found out from a red pull request. The subsystem cannot fold into
  // `bun test src scripts`: it is a separate npm project with its own lockfile and a
  // native dependency, so it gets its own script instead.
  //
  // The general defect is a documented command that does not exist, or exists and is
  // never named. Both directions are checked here rather than the one that prompted it.
  test('every command the agent guide tells you to run exists', async () => {
    const agents = await readText('AGENTS.md');
    const scripts = (await readJson('package.json')).scripts ?? {};

    const named = [...agents.matchAll(/`?bun run ([\w:-]+)/gu)].map(([, name]) => name);
    expect(named.length).toBeGreaterThan(0);
    for (const name of new Set(named)) expect(Object.keys(scripts)).toContain(name);

    // The other direction, and it has to read the gate BLOCK rather than the whole
    // file: the prose below the block names these scripts too, so "mentioned in
    // AGENTS.md" stays true after someone deletes the line that actually tells you to
    // run them. Checking the fenced block was the difference between this assertion
    // discriminating and not -- deleting the line passed until it was narrowed.
    const gate = agents.match(/```(?:sh|bash)?\n(bun install --frozen-lockfile\n[\s\S]*?)```/u);
    expect(gate).not.toBeNull();
    const gated = [...gate[1].matchAll(/^bun run ([\w:-]+)$/gmu)].map(([, name]) => name);
    expect(gated).toContain('check:skills');
    expect(gated).toContain('test:render-service');
    expect(gated).toContain('test:coverage');
    // `bun test src scripts` cannot reach render-service; the script is what does.
    expect(scripts['test:render-service']).toContain('render-service');
    expect(scripts.test).not.toContain('render-service');
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
