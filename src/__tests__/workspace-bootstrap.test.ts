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
