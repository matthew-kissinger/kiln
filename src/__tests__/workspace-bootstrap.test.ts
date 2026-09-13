import { expect, it } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const repo = resolve(import.meta.dir, '../..');
const setup = join(repo, 'scripts/create-workspace.mjs');
const run = (args: string[], cwd: string) =>
  spawnSync('node', [setup, ...args], { cwd, encoding: 'utf8' });

it('registers the existing local skill tree for OpenCode and preserves edits when repairing paths', async () => {
  const root = await mkdtemp(join(tmpdir(), 'kiln-opencode-skills-'));
  try {
    const before = join(root, 'before');
    const after = join(root, 'moved');
    expect(run([before, '--harness', 'opencode', '--skills', 'compose'], root).status).toBe(0);
    const config = JSON.parse(await readFile(join(before, 'opencode.json'), 'utf8'));
    expect(config.skills?.paths).toEqual([join(before, 'skills')]);
    const reference = join('skills', 'kiln-author-asset', 'references', 'program-contract.md');
    expect(await readFile(join(before, reference), 'utf8')).toBe(
      await readFile(join(repo, reference), 'utf8'),
    );
    expect((await readdir(join(before, 'skills'))).length).toBe(4);
    const author = join('skills', 'kiln-author-asset', 'SKILL.md');
    await writeFile(join(before, author), '# owner-edited skill');
    await writeFile(join(before, reference), '# owner-edited reference');
    await rename(before, after);
    expect(run([after, '--repair'], root).status).toBe(0);
    expect(JSON.parse(await readFile(join(after, 'opencode.json'), 'utf8')).skills.paths).toEqual([
      join(after, 'skills'),
    ]);
    expect(await readFile(join(after, author), 'utf8')).toBe('# owner-edited skill');
    expect(await readFile(join(after, reference), 'utf8')).toBe('# owner-edited reference');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);

it('defaults to core skills, supports optional skills, and refuses invalid setup before writing', async () => {
  const root = await mkdtemp(join(tmpdir(), 'kiln-bootstrap-'));
  try {
    const task = join(root, 'assets cafÃ©');
    const invalid = run([task, '--harness', 'codex', '--skills', 'unknown'], root);
    expect(invalid.status).toBe(1);
    expect(await readdir(root)).toEqual([]);
    expect(run([task, '--harness', 'codex'], root).status).toBe(0);
    expect((await readdir(join(task, 'skills'))).sort()).toEqual([
      'kiln-author-asset',
      'kiln-qa-asset',
      'kiln-refine-asset',
    ]);
    const optional = join(root, 'scene');
    expect(run([optional, '--harness', 'opencode', '--skills', 'compose,batch'], root).status).toBe(
      0,
    );
    expect((await readdir(join(optional, 'skills'))).length).toBe(5);
    expect(
      JSON.parse(await readFile(join(task, '.kiln/workspace.json'), 'utf8')).runtimeVersion,
    ).toBeString();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);

it('repairs a moved workspace without replacing assets or silently overwriting edited configuration', async () => {
  const root = await mkdtemp(join(tmpdir(), 'kiln-bootstrap-'));
  try {
    const before = join(root, 'before');
    const after = join(root, 'after cafÃ©');
    expect(run([before, '--harness', 'opencode'], root).status).toBe(0);
    await writeFile(join(before, 'keep.kiln.js'), '// authored source');
    await rename(before, after);
    expect(run([after, '--repair'], root).status).toBe(0);
    const config = JSON.parse(await readFile(join(after, 'opencode.json'), 'utf8'));
    expect(config.mcp.kiln_workspace.environment.KILN_PROGRAM_STORE).toBe(
      join(after, '.kiln/programs'),
    );
    expect(await readFile(join(after, 'keep.kiln.js'), 'utf8')).toBe('// authored source');
    await writeFile(join(after, 'opencode.json'), '{"custom":true}');
    expect(run([after, '--repair'], root).status).toBe(1);
    expect(await readFile(join(after, 'opencode.json'), 'utf8')).toBe('{"custom":true}');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);

it('checks the installation before creating a destination', async () => {
  const root = await mkdtemp(join(tmpdir(), 'kiln-bootstrap-'));
  try {
    const script = `import { createWorkspace } from ${JSON.stringify(pathToFileURL(setup).href)}; await createWorkspace(process.argv[1], 'codex', { installation: process.argv[2] });`;
    const result = spawnSync(
      'node',
      ['--input-type=module', '-e', script, join(root, 'assets'), join(root, 'missing')],
      { encoding: 'utf8' },
    );
    expect(result.status).toBe(1);
    expect(await readdir(root)).toEqual([]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);

it('refuses an otherwise loadable installation without the packaged worker before writing', async () => {
  const root = await mkdtemp(join(tmpdir(), 'kiln-bootstrap-'));
  try {
    const runtime = join(root, 'runtime');
    await mkdir(join(runtime, 'dist'), { recursive: true });
    await writeFile(join(runtime, 'package.json'), '{"name":"@kiln/engine","version":"1.0.0"}');
    await writeFile(join(runtime, 'dist/cli.mjs'), 'export function main() {}');
    await writeFile(join(runtime, 'dist/mcp-server.mjs'), '');
    for (const name of ['kiln-author-asset', 'kiln-refine-asset', 'kiln-qa-asset']) {
      await mkdir(join(runtime, 'skills', name), { recursive: true });
      await writeFile(join(runtime, 'skills', name, 'SKILL.md'), '# fixture');
    }
    const script = `import { createWorkspace } from ${JSON.stringify(pathToFileURL(setup).href)}; await createWorkspace(process.argv[1], 'codex', { installation: process.argv[2] });`;
    const result = spawnSync(
      'node',
      ['--input-type=module', '-e', script, join(root, 'assets'), runtime],
      { encoding: 'utf8' },
    );
    expect(result.status).toBe(1);
    expect(await readdir(root)).toEqual(['runtime']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

it('launches Agy in its own project and disables automatic skill expansion for headless runs', async () => {
  const root = await mkdtemp(join(tmpdir(), 'kiln-agy-bootstrap-'));
  try {
    const task = join(root, 'assets');
    expect(run([task, '--harness', 'agy'], root).status).toBe(0);
    const preload = join(root, 'capture.mjs');
    await writeFile(
      preload,
      `import cp from 'node:child_process';import {syncBuiltinESMExports} from 'node:module';import {EventEmitter} from 'node:events';cp.spawn=(command,args,options)=>{console.log(JSON.stringify({command,args,cwd:options.cwd,windowsHide:options.windowsHide}));const child=new EventEmitter();queueMicrotask(()=>child.emit('exit',0));return child;};syncBuiltinESMExports();`,
    );
    const invoke = (args: string[]) =>
      spawnSync('node', ['--import', pathToFileURL(preload).href, join(task, 'agy.mjs'), ...args], {
        cwd: root,
        encoding: 'utf8',
      });
    const first = invoke(['--print=Make a lamp']);
    expect(first.status).toBe(0);
    const launch = JSON.parse(first.stdout);
    expect(launch.cwd).toBe(task);
    expect(launch.windowsHide).toBe(true);
    expect(launch.args).toContain('--disable-slash-commands');
    expect(launch.args).toContain('--new-project');
    expect(launch.args[launch.args.indexOf('--add-dir') + 1]).toBe(task);
    const resumed = JSON.parse(
      invoke(['--conversation', 'existing', '--print', 'Continue']).stdout,
    );
    expect(resumed.args).not.toContain('--new-project');
    expect(JSON.parse(invoke([]).stdout).args).not.toContain('--disable-slash-commands');
    expect(await readFile(join(task, 'AGENTS.md'), 'utf8')).toContain('kiln_workspace');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);

it('adds a new managed launcher during repair but refuses an existing user file', async () => {
  const root = await mkdtemp(join(tmpdir(), 'kiln-agy-migrate-'));
  try {
    for (const collision of [false, true]) {
      const task = join(root, String(collision));
      expect(run([task, '--harness', 'agy'], root).status).toBe(0);
      const path = join(task, '.kiln/workspace.json');
      const manifest = JSON.parse(await readFile(path, 'utf8'));
      delete manifest.generated['agy.mjs'];
      await writeFile(path, JSON.stringify(manifest));
      if (collision) await writeFile(join(task, 'agy.mjs'), '// user launcher');
      else await rm(join(task, 'agy.mjs'));
      expect(run([task, '--repair'], root).status).toBe(collision ? 1 : 0);
      expect(await readFile(join(task, 'agy.mjs'), 'utf8')).toContain(
        collision ? '// user launcher' : '--disable-slash-commands',
      );
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);

it('steers the session to the loop, the render service and its own inherited context', async () => {
  const root = await mkdtemp(join(tmpdir(), 'kiln-guide-'));
  try {
    const task = join(root, 'w');
    expect(run([task, '--harness', 'claude'], root).status).toBe(0);
    const guide = await readFile(join(task, 'AGENTS.md'), 'utf8');
    // Both surfaces are legitimate, so the guide has to name the two things that
    // actually differ rather than express a preference: where the image lands, and
    // that the CPU fallback is not material evidence.
    expect(guide).toContain('read the PNG back');
    expect(guide).toContain('materialFaithful');
    expect(guide).toContain('render-service');
    // `--repair` regenerates only the managedFiles set, never this guide, so an
    // absolute engine path baked in here would rot silently the first time the
    // installation moved. The manifest is the indirection that repair does keep.
    expect(guide).toContain('.kiln/workspace.json');
    expect(guide).not.toContain(repo);
    // Inherited user-level skills and servers are the measured context leak; the
    // workspace cannot prevent them, so it must at least ask for them to be reported.
    expect(guide).toContain('user-level configuration');
    expect(await readFile(join(task, 'CLAUDE.md'), 'utf8')).toBe(guide);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);

it('writes each harness the MCP config spelling it actually reads', async () => {
  const root = await mkdtemp(join(tmpdir(), 'kiln-harness-mcp-'));
  const server = /dist[\\/]mcp-server\.mjs$/;
  try {
    // Copilot loads a workspace `.mcp.json` -- the same filename Claude Code
    // reads -- but not the same contents: `copilot mcp add` writes
    // `type: "local"` and an explicit tool filter where Claude writes
    // `type: "stdio"` and none. One file cannot serve both, so the generator
    // has to know which harness asked.
    const copilot = join(root, 'copilot');
    expect(run([copilot, '--harness', 'copilot'], root).status).toBe(0);
    const forCopilot = JSON.parse(await readFile(join(copilot, '.mcp.json'), 'utf8'));
    expect(forCopilot.mcpServers.kiln_workspace.type).toBe('local');
    expect(forCopilot.mcpServers.kiln_workspace.tools).toEqual(['*']);
    expect(forCopilot.mcpServers.kiln_workspace.args[0]).toMatch(server);

    // Cursor's CLI reads `.cursor/mcp.json`, and a user-level entry there can
    // name a different installation entirely -- so the workspace gets its own.
    const cursor = join(root, 'cursor');
    expect(run([cursor, '--harness', 'cursor-agent'], root).status).toBe(0);
    const forCursor = JSON.parse(await readFile(join(cursor, '.cursor/mcp.json'), 'utf8'));
    expect(forCursor.mcpServers.kiln_workspace.args[0]).toMatch(server);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);

// The two defects this covers were invisible to every existing check, because
// `harness-smoke.mjs` invokes each CLI directly and never touches the generated
// launcher. A generated codex workspace could not see Kiln at all -- codex reads
// no project-local config, so `.codex/config.toml` was inert -- and a generated
// hermes workspace could not reach a model, because redirecting HERMES_HOME to
// the workspace took the provider selection and the credential store with it.
//
// Both are launcher-shaped, so this asserts the launcher's shape. Running one for
// real needs a signed-in CLI and costs money, which is what `docs/dogfooding.md`
// Tier 0 is for; what belongs in CI is that the launcher exists, is valid JS, and
// carries the flags the fix depends on.
it('gives every user-global harness a launcher that configures without relocating its home', async () => {
  const root = await mkdtemp(join(tmpdir(), 'kiln-harness-launcher-'));
  try {
    const codexDir = join(root, 'codex');
    expect(run([codexDir, '--harness', 'codex'], root).status).toBe(0);
    const codex = await readFile(join(codexDir, 'codex.mjs'), 'utf8');
    // Per-invocation `-c` overrides are the fix: they register the server for one
    // run and write nothing, so $CODEX_HOME keeps its config AND its auth.
    expect(codex).toContain('mcp_servers.kiln_workspace.command');
    expect(codex).toContain('mcp_servers.kiln_workspace.args');
    expect(codex).toContain('mcp_servers.kiln_workspace.env.KILN_PROGRAM_STORE');
    expect(codex).toContain("'-c'");
    // A workspace is deliberately not a git checkout.
    expect(codex).toContain('--skip-git-repo-check');
    expect(codex).toContain("'--cd'");
    // The launcher must never move the home that holds credentials.
    expect(codex).not.toContain('CODEX_HOME');

    const hermesDir = join(root, 'hermes');
    expect(run([hermesDir, '--harness', 'hermes'], root).status).toBe(0);
    const hermes = await readFile(join(hermesDir, 'hermes.mjs'), 'utf8');
    // The regression under test. HERMES_HOME resolves BOTH the config path and
    // the credential path, so redirecting it is what broke the run.
    expect(hermes).not.toContain('HERMES_HOME');
    // `--in` is what makes hermes treat this directory as the project, which is
    // also what injects the workspace's AGENTS.md.
    expect(hermes).toContain("'--in'");
    // The program store rides the environment, so no config file is needed for
    // it and a user-level registration still lands in THIS workspace.
    expect(hermes).toContain('KILN_PROGRAM_STORE');
    // `--skills` takes skill NAMES, not a path; passing a directory fails with
    // "Unknown skill(s)" and takes the whole run with it.
    expect(hermes).not.toContain("'--skills'");

    // Parsed by the interpreter that will run it, not by a regex: a launcher is
    // generated from a template string, so a stray escape produces a file that
    // looks fine and throws on the user's first invocation.
    for (const path of [join(codexDir, 'codex.mjs'), join(hermesDir, 'hermes.mjs')]) {
      const check = spawnSync('node', ['--check', path], { encoding: 'utf8' });
      expect(check.status, `${path}: ${check.stderr}`).toBe(0);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);
