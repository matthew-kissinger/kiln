#!/usr/bin/env node
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve, relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const installation = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const quote = JSON.stringify;
const hash = (value) => createHash('sha256').update(value).digest('hex');
const harnesses = ['claude', 'codex', 'opencode', 'hermes', 'agy'];
const core = ['kiln-author-asset', 'kiln-refine-asset', 'kiln-qa-asset'];
const optional = { compose: 'kiln-compose-scene', batch: 'kiln-batch-dispatch' };
const inside = (parent, child) => { const rel = relative(parent, child); return !rel || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`)); };

export async function preflightRuntime(runtime, skills) {
  if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Kiln requires Node.js 22 or later.');
  let pkg;
  try {
    pkg = JSON.parse(await readFile(join(runtime, 'package.json'), 'utf8'));
    for (const file of ['dist/cli.mjs', 'dist/mcp-server.mjs', 'dist/evaluator-worker.mjs', 'dist/build.json', ...skills.map((name) => `skills/${name}/SKILL.md`)]) {
      if (!(await stat(join(runtime, file))).isFile()) throw new Error(file);
    }
    const build = JSON.parse(await readFile(join(runtime, 'dist/build.json'), 'utf8'));
    for (const [name, file] of [['cli', 'cli.mjs'], ['mcp', 'mcp-server.mjs'], ['worker', 'evaluator-worker.mjs']]) {
      const entry = build.entries?.[name];
      if (build.schemaVersion !== 1 || entry?.identity !== build.entries.cli?.identity || entry?.bundleHash !== `sha256:${hash(await readFile(join(runtime, 'dist', file)))}`) throw new Error(`Inconsistent ${name} build`);
    }
  } catch (error) { throw new Error(`Kiln installation is incomplete or inconsistent at ${runtime}. Install dependencies and run bun run build:runtime before setup.`, { cause: error }); }
  const probe = spawnSync(process.execPath, ['--input-type=module', '-e', 'const m = await import(process.argv[1]); if (typeof m.main !== "function") throw new Error("Missing CLI entry");', pathToFileURL(join(runtime, 'dist/cli.mjs')).href], { cwd: runtime, encoding: 'utf8', timeout: 30000, windowsHide: true });
  if (probe.status !== 0) throw new Error(`Kiln runtime dependencies could not load. Reinstall dependencies at ${runtime}. ${probe.error?.message ?? probe.stderr.trim()}`);
  return pkg;
}

function managedFiles(root, runtime, harness, nodeExecutable) {
  const store = join(root, '.kiln', 'programs');
  const server = join(runtime, 'dist', 'mcp-server.mjs');
  const mcp = { command: nodeExecutable, args: [server], env: { KILN_PROGRAM_STORE: store, KILN_RENDER: 'auto' } };
  const files = {
    'kiln.mjs': `// Generated runtime launcher. Repair paths with kiln-init <workspace> --repair.\nimport { dirname, join } from 'node:path';\nimport { fileURLToPath } from 'node:url';\nprocess.env.KILN_PROGRAM_STORE = join(dirname(fileURLToPath(import.meta.url)), '.kiln', 'programs');\ntry {\n  const { main } = await import(${quote(pathToFileURL(join(runtime, 'dist/cli.mjs')).href)});\n  process.exitCode = await main(process.argv.slice(2));\n} catch (error) {\n  console.error(error.message + '\\nIf the installation moved, run kiln-init <workspace> --repair from the current Kiln installation.');\n  process.exitCode = 1;\n}\n`,
  };
  if (harness === 'claude') files['.mcp.json'] = quote({ mcpServers: { kiln_workspace: mcp } });
  if (harness === 'codex') files['.codex/config.toml'] = `[mcp_servers.kiln_workspace]\ncommand = ${quote(mcp.command)}\nargs = [${quote(server)}]\n[mcp_servers.kiln_workspace.env]\nKILN_PROGRAM_STORE = ${quote(store)}\nKILN_RENDER = "auto"\n`;
  if (harness === 'agy') {
    files['.agents/mcp_config.json'] = quote({ mcpServers: { kiln_workspace: mcp } });
    files['agy.mjs'] = `import { spawn } from 'node:child_process';\nimport { dirname } from 'node:path';\nimport { fileURLToPath } from 'node:url';\nconst root = dirname(fileURLToPath(import.meta.url));\nconst args = process.argv.slice(2);\nconst has = names => args.some(arg => names.some(name => arg === name || arg.startsWith(name + '=')));\nif (!has(['--project', '--new-project', '--conversation', '--continue', '-c'])) args.unshift('--new-project');\nargs.unshift('--add-dir', root);\nif (has(['--print', '--prompt', '-p']) && !has(['--disable-slash-commands'])) args.unshift('--disable-slash-commands');\nconst child = spawn('agy', args, { cwd: root, stdio: 'inherit', windowsHide: true });\nchild.on('error', error => { console.error(error.message); process.exitCode = 1; });\nchild.on('exit', code => { process.exitCode = code ?? 1; });\n`;
  }
  if (harness === 'opencode') files['opencode.json'] = quote({ $schema: 'https://opencode.ai/config.json', mcp: { kiln_workspace: { type: 'local', command: [mcp.command, server], environment: mcp.env, enabled: true } } });
  if (harness === 'hermes') {
    files['.hermes/config.yaml'] = quote({ mcp_servers: { kiln_workspace: mcp } });
    files['hermes.mjs'] = `import { spawn } from 'node:child_process';\nimport { dirname, join } from 'node:path';\nimport { fileURLToPath } from 'node:url';\nconst root = dirname(fileURLToPath(import.meta.url));\nconst child = spawn('hermes', process.argv.slice(2), { cwd: root, stdio: 'inherit', windowsHide: true, env: { ...process.env, HERMES_HOME: join(root, '.hermes'), TERMINAL_CWD: root } });\nchild.on('error', (error) => { console.error(error.message); process.exitCode = 1; });\nchild.on('exit', (code) => { process.exitCode = code ?? 1; });\n`;
  }
  return { files, store, server };
}

const guide = `# Kiln asset workspace

Use the kiln_workspace MCP server configured in this project to author and refine assets in this directory. Another server named kiln may use a different installation; do not substitute it silently. The engine is installed separately. Do not read its implementation or example collection to solve an asset task.

- Read the relevant skill from this project's skills/ directory, not a global plugin copy. Use kiln_list_primitives on kiln_workspace for API signatures. If that server is unavailable, report the setup problem instead of using another installation.
- Import an existing file with node kiln.mjs source asset.kiln.js. It returns a programRef.
- For a new draft, pass code once to kiln_validate or kiln_render. Keep its programRef even if validation fails.
- Use kiln_source with programRef and a literal query to read exact edit anchors. Follow nextOffset for more context.
- Use kiln_edit with programRef and edits. It returns a new programRef and renders by default. Use that reference for later views and edits; do not resend the program.
- Review the image and diff. Check viewFidelity before judging materials.
- Save with node kiln.mjs source sha256:FULL_HASH --out revised.kiln.js. Export refuses to overwrite a file.
- Export geometry with node kiln.mjs render sha256:FULL_HASH --out asset.glb --views sheet.png.

The CLI and MCP share .kiln/programs. Keep that directory while working. Source files are portable; references resolve only in a store containing their source.
`;

async function readManifest(root) {
  try { return JSON.parse(await readFile(join(root, '.kiln/workspace.json'), 'utf8')); }
  catch { throw new Error('This is not a managed Kiln workspace. Existing files were not changed.'); }
}

async function fileHashes(directory, prefix = '') {
  const hashes = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) Object.assign(hashes, await fileHashes(join(directory, entry.name), name));
    else if (entry.isFile()) hashes[name] = hash(await readFile(join(directory, entry.name)));
  }
  return hashes;
}

/** Preflight first; create a complete project in a staging directory before installing it. */
export async function createWorkspace(directory, harness = 'claude', options = {}) {
  const root = resolve(directory);
  // Version managers can expose Node through a directory link lasting only one shell.
  const nodeExecutable = realpathSync(process.execPath);
  const runtime = await realpath(resolve(options.installation ?? installation));
  const previous = options.repair ? await readManifest(root) : undefined;
  if (previous) harness = previous.harness;
  if (!harnesses.includes(harness)) throw new Error(`Choose ${harnesses.join(', ')}.`);
  const extras = options.skills ?? [];
  if (extras.some((name) => !Object.hasOwn(optional, name))) throw new Error('Optional skills: compose,batch.');
  const skills = previous?.skills ?? [...core, ...new Set(extras.map((name) => optional[name]))];
  if (!Array.isArray(skills) || skills.some((name) => ![...core, ...Object.values(optional)].includes(name))) throw new Error('Invalid workspace skill manifest.');
  const pkg = await preflightRuntime(runtime, skills);
  let exists = false;
  try {
    const info = await lstat(root);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Choose a real directory, not a symbolic link.');
    exists = true;
    if (inside(runtime, await realpath(root))) throw new Error('Choose a directory outside the Kiln installation.');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  // Resolve the nearest existing parent so symlinks cannot bypass the installation check.
  let ancestor = dirname(root);
  while (true) { try { ancestor = await realpath(ancestor); break; } catch (error) { if (error.code !== 'ENOENT') throw error; const parent = dirname(ancestor); if (parent === ancestor) throw error; ancestor = parent; } }
  if (inside(runtime, root) || inside(runtime, ancestor)) throw new Error('Choose a directory outside the Kiln installation.');
  if (!previous && exists && (await readdir(root)).length) throw new Error('The destination must be empty; no existing files were changed.');
  const { files, store, server } = managedFiles(root, runtime, harness, nodeExecutable);
  const manifest = { schemaVersion: 1, harness, runtime, runtimeVersion: pkg.version, runtimeHashes: { cli: hash(await readFile(join(runtime, 'dist/cli.mjs'))), mcp: hash(await readFile(join(runtime, 'dist/mcp-server.mjs'))) }, node: nodeExecutable, skills, skillHashes: previous?.skillHashes, generated: Object.fromEntries(Object.entries(files).map(([name, body]) => [name, hash(body)])) };
  if (previous) {
    if (previous.schemaVersion !== 1) throw new Error('Unsupported workspace manifest version.');
    const originals = {};
    for (const name of Object.keys(files)) {
      if (!Object.hasOwn(previous.generated ?? {}, name)) {
        try { await lstat(join(root, name)); throw new Error(`Refusing to replace existing ${name}.`); }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
        originals[name] = undefined;
        continue;
      }
      const original = await readFile(join(root, name), 'utf8');
      if (hash(original) !== previous.generated?.[name]) throw new Error(`Refusing to replace edited ${name}. Preserve your changes and update its runtime paths manually.`);
      originals[name] = original;
    }
    const oldManifest = await readFile(join(root, '.kiln/workspace.json'), 'utf8');
    try {
      for (const [name, body] of Object.entries(files)) await writeFile(join(root, name), body);
      await writeFile(join(root, '.kiln/workspace.json'), quote(manifest));
    } catch (error) {
      for (const [name, body] of Object.entries(originals)) { if (body === undefined) await rm(join(root, name), { force: true }); else await writeFile(join(root, name), body); }
      await writeFile(join(root, '.kiln/workspace.json'), oldManifest);
      throw error;
    }
    return { root, harness, store, server, repaired: true };
  }
  await mkdir(dirname(root), { recursive: true });
  const stage = await mkdtemp(join(dirname(root), '.kiln-init-'));
  const installed = [];
  try {
    for (const [name, body] of Object.entries(files)) { await mkdir(dirname(join(stage, name)), { recursive: true }); await writeFile(join(stage, name), body); }
    await mkdir(join(stage, '.kiln'), { recursive: true });
    await writeFile(join(stage, '.kiln/workspace.json'), quote(manifest));
    await writeFile(join(stage, '.gitignore'), '.kiln/programs/\n.hermes/\n*.glb\n*.png\n');
    for (const name of ['AGENTS.md', 'CLAUDE.md']) await writeFile(join(stage, name), guide);
    for (const name of skills) await cp(join(runtime, 'skills', name), join(stage, 'skills', name), { recursive: true });
    manifest.skillHashes = await fileHashes(join(stage, 'skills'));
    await writeFile(join(stage, '.kiln/workspace.json'), quote(manifest));
    const launch = harness === 'hermes' ? 'Run node hermes.mjs --ignore-rules. It uses a separate profile; authenticate in that profile or supply provider credentials through the environment.' : harness === 'agy' ? 'Run node agy.mjs from this directory. The launcher supplies the absolute project directory. For headless runs, use node agy.mjs --model MODEL --print \"Read AGENTS.md and the project skills. Use only kiln_workspace MCP tools. YOUR TASK.\". Print mode disables automatic slash-command/skill expansion to avoid automatic expansion of a global skill. Use absolute task-file paths in headless prompts and verify that tool calls use kiln_workspace; global configuration and authentication remain unchanged.' : `Open ${harness} in this directory.`;
    await writeFile(join(stage, 'START.md'), `# Start making assets\n\n${launch} Accept the project/MCP trust prompts. Ask the agent to read AGENTS.md and create an asset. Kiln needs no separate model key.\n\nCore author/refine/QA skills are installed. Optional compose/batch skills are selected at setup with --skills compose,batch.\n\nKeep assets here and engine source outside. This separates task context, not operating-system permissions. User instructions and authentication can still apply.\n\nAfter relocating this workspace or the runtime, run node /current/kiln/scripts/create-workspace.mjs /absolute/workspace --repair. Repair updates generated runtime paths only and refuses edited configuration; it preserves skills, assets, and saved revisions.\n`);
    if (exists) {
      // Windows cannot remove the caller's current directory, even when empty.
      // Move only staged entries and track them so a failed install rolls back.
      if ((await readdir(root)).length) throw new Error('The destination changed during setup; no files were replaced.');
      for (const name of await readdir(stage)) {
        const target = join(root, name);
        try { await lstat(target); throw new Error(`Refusing to replace ${target}.`); }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
        await rename(join(stage, name), target);
        installed.push(target);
      }
      await rm(stage, { recursive: true });
    } else await rename(stage, root);
  } catch (error) {
    for (const path of installed) await rm(path, { recursive: true, force: true });
    await rm(stage, { recursive: true, force: true });
    throw error;
  }
  return { root, harness, store, server, skills };
}

function isDirectSetupEntry() {
  if (!process.argv[1]) return false;
  try { return realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}

if (isDirectSetupEntry()) {
  try {
    const args = process.argv.slice(2);
    if (args.includes('--help') || args.includes('-h')) {
      console.log('Usage: kiln-init <empty-directory> [--harness claude|codex|opencode|hermes|agy] [--skills compose,batch]\n       kiln-init <managed-workspace> --repair');
    } else {
      const directory = args.shift();
      if (!directory || directory.startsWith('--')) throw new Error('Provide a workspace directory. Run kiln-init --help for usage.');
      let harness = 'claude';
      const options = {};
      while (args.length) {
        const flag = args.shift();
        if (flag === '--repair') options.repair = true;
        else if (flag === '--harness' || flag === '--skills') {
          const value = args.shift();
          if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value.`);
          if (flag === '--harness') harness = value; else options.skills = value.split(',');
        } else throw new Error(`Unknown option: ${flag}`);
      }
      if (options.repair && options.skills) throw new Error('--repair does not change installed skills.');
      console.log(quote(await createWorkspace(directory, harness, options)));
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
