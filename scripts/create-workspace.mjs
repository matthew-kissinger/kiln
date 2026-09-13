#!/usr/bin/env node
import {
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve, relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const installation = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const quote = JSON.stringify;
const hash = (value) => createHash('sha256').update(value).digest('hex');
const harnesses = ['claude', 'codex', 'opencode', 'hermes', 'agy', 'copilot', 'cursor-agent'];
/** Where each harness family actually looks for skills, relative to the workspace. */
const skillRegistries = ['.claude/skills', '.agents/skills'];
const core = ['kiln-author-asset', 'kiln-refine-asset', 'kiln-qa-asset'];
const optional = { compose: 'kiln-compose-scene', batch: 'kiln-batch-dispatch' };
const inside = (parent, child) => {
  const rel = relative(parent, child);
  return !rel || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`));
};

export async function preflightRuntime(runtime, skills) {
  if (Number(process.versions.node.split('.')[0]) < 22)
    throw new Error('Kiln requires Node.js 22 or later.');
  let pkg;
  try {
    pkg = JSON.parse(await readFile(join(runtime, 'package.json'), 'utf8'));
    for (const file of [
      'dist/cli.mjs',
      'dist/mcp-server.mjs',
      'dist/evaluator-worker.mjs',
      'dist/build.json',
      ...skills.map((name) => `skills/${name}/SKILL.md`),
    ]) {
      if (!(await stat(join(runtime, file))).isFile()) throw new Error(file);
    }
    const build = JSON.parse(await readFile(join(runtime, 'dist/build.json'), 'utf8'));
    for (const [name, file] of [
      ['cli', 'cli.mjs'],
      ['mcp', 'mcp-server.mjs'],
      ['worker', 'evaluator-worker.mjs'],
    ]) {
      const entry = build.entries?.[name];
      if (
        build.schemaVersion !== 1 ||
        entry?.identity !== build.entries.cli?.identity ||
        entry?.bundleHash !== `sha256:${hash(await readFile(join(runtime, 'dist', file)))}`
      )
        throw new Error(`Inconsistent ${name} build`);
    }
  } catch (error) {
    throw new Error(
      `Kiln installation is incomplete or inconsistent at ${runtime}. Install dependencies and run bun run build:runtime before setup.`,
      { cause: error },
    );
  }
  const probe = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      'const m = await import(process.argv[1]); if (typeof m.main !== "function") throw new Error("Missing CLI entry");',
      pathToFileURL(join(runtime, 'dist/cli.mjs')).href,
    ],
    { cwd: runtime, encoding: 'utf8', timeout: 30000, windowsHide: true },
  );
  if (probe.status !== 0)
    throw new Error(
      `Kiln runtime dependencies could not load. Reinstall dependencies at ${runtime}. ${probe.error?.message ?? probe.stderr.trim()}`,
    );
  return pkg;
}

function managedFiles(root, runtime, harness, nodeExecutable) {
  const store = join(root, '.kiln', 'programs');
  const server = join(runtime, 'dist', 'mcp-server.mjs');
  const mcp = {
    command: nodeExecutable,
    args: [server],
    env: { KILN_PROGRAM_STORE: store, KILN_RENDER: 'auto' },
  };
  const files = {
    'kiln.mjs': `// Generated runtime launcher. Repair paths with kiln-init <workspace> --repair.\nimport { dirname, join } from 'node:path';\nimport { fileURLToPath } from 'node:url';\nprocess.env.KILN_PROGRAM_STORE = join(dirname(fileURLToPath(import.meta.url)), '.kiln', 'programs');\ntry {\n  const { main } = await import(${quote(pathToFileURL(join(runtime, 'dist/cli.mjs')).href)});\n  process.exitCode = await main(process.argv.slice(2));\n} catch (error) {\n  console.error(error.message + '\\nIf the installation moved, run kiln-init <workspace> --repair from the current Kiln installation.');\n  process.exitCode = 1;\n}\n`,
  };
  if (harness === 'claude') files['.mcp.json'] = quote({ mcpServers: { kiln_workspace: mcp } });
  if (harness === 'codex') {
    // Codex has NO project-local configuration. Every source it reads is
    // $CODEX_HOME-rooted: `-c` overrides ~/.codex/config.toml, `-p <name>` layers
    // $CODEX_HOME/<name>.config.toml, and `-C`/`--cd` changes only the working
    // directory. So this file is documentation of intent, not configuration --
    // codex will never read it, and the launcher below is what registers the
    // server. It stays because a reader looking for the workspace's MCP wiring
    // looks here first, and finding nothing is worse than finding a pointer.
    files['.codex/config.toml'] =
      `# Codex does not read a project-local config. This file records what the\n# workspace registers; \`node codex.mjs\` is what actually applies it, passing\n# these values as -c overrides per invocation.\n[mcp_servers.kiln_workspace]\ncommand = ${quote(mcp.command)}\nargs = [${quote(server)}]\n[mcp_servers.kiln_workspace.env]\nKILN_PROGRAM_STORE = ${quote(store)}\nKILN_RENDER = "auto"\n`;
    // Per-invocation `-c` overrides are the whole fix. They add the server to
    // this one run and write nothing anywhere: $CODEX_HOME keeps its own config
    // and, critically, its authentication. That is the rule a workspace has to
    // respect for any harness whose configuration is user-global -- it may add
    // configuration to an invocation, but it must not relocate the home that
    // holds credentials. Redirecting the home is what broke hermes.
    //
    // `--cd` sets the project directory; a workspace is deliberately not a git
    // checkout, so `--skip-git-repo-check` is required rather than optional.
    files['codex.mjs'] =
      `import { spawn } from 'node:child_process';\nimport { dirname } from 'node:path';\nimport { fileURLToPath } from 'node:url';\nconst root = dirname(fileURLToPath(import.meta.url));\nconst overrides = [\n  ['mcp_servers.kiln_workspace.command', ${quote(mcp.command)}],\n  ['mcp_servers.kiln_workspace.args', [${quote(server)}]],\n  ['mcp_servers.kiln_workspace.env.KILN_PROGRAM_STORE', ${quote(store)}],\n  ['mcp_servers.kiln_workspace.env.KILN_RENDER', 'auto'],\n].flatMap(([key, value]) => ['-c', key + '=' + JSON.stringify(value)]);\nconst args = process.argv.slice(2);\nconst sub = args.find(arg => !arg.startsWith('-'));\nconst rest = sub === 'exec' ? args : ['exec', ...args];\nconst child = spawn('codex', [...rest.slice(0, 1), ...overrides, '--cd', root, '--skip-git-repo-check', ...rest.slice(1)], { cwd: root, stdio: 'inherit', windowsHide: true });\nchild.on('error', error => { console.error(error.message); process.exitCode = 1; });\nchild.on('exit', code => { process.exitCode = code ?? 1; });\n`;
  }
  if (harness === 'agy') {
    files['.agents/mcp_config.json'] = quote({ mcpServers: { kiln_workspace: mcp } });
    files['agy.mjs'] =
      `import { spawn } from 'node:child_process';\nimport { dirname } from 'node:path';\nimport { fileURLToPath } from 'node:url';\nconst root = dirname(fileURLToPath(import.meta.url));\nconst args = process.argv.slice(2);\nconst has = names => args.some(arg => names.some(name => arg === name || arg.startsWith(name + '=')));\nif (!has(['--project', '--new-project', '--conversation', '--continue', '-c'])) args.unshift('--new-project');\nargs.unshift('--add-dir', root);\nif (has(['--print', '--prompt', '-p']) && !has(['--disable-slash-commands'])) args.unshift('--disable-slash-commands');\nconst child = spawn('agy', args, { cwd: root, stdio: 'inherit', windowsHide: true });\nchild.on('error', error => { console.error(error.message); process.exitCode = 1; });\nchild.on('exit', code => { process.exitCode = code ?? 1; });\n`;
  }
  // Copilot reads a workspace `.mcp.json`, the same filename as Claude Code, and
  // not the same contents: `copilot mcp add` writes `type: "local"` plus an
  // explicit tool filter where Claude writes `type: "stdio"` and no filter. The
  // spelling here is the one Copilot's own CLI produced, rather than Claude's
  // adapted by hand, because an unreadable server does not report itself -- it
  // just answers as though the tools were never mentioned.
  //
  // Its skills need no new directory: `copilot skill --help` lists
  // `.github/skills/`, `.agents/skills/` and `.claude/skills/` as project
  // sources, and the registration copies below already write the last two.
  if (harness === 'copilot')
    files['.mcp.json'] = quote({
      mcpServers: { kiln_workspace: { tools: ['*'], type: 'local', ...mcp } },
    });
  // Cursor's CLI reads `.cursor/mcp.json` here or `~/.cursor/mcp.json` globally,
  // and the user-level file is the hazard: an entry named `kiln` there can point
  // at a different installation. One did -- an extracted 0.6.0 package while the
  // checkout was 0.7.0. A workspace-local config under its own name is what keeps
  // a trial pinned to the engine it is supposed to be testing.
  //
  // Its skills need no new directory either: Cursor's project skill paths are
  // `.agents/skills/` and `.cursor/skills/`, with `.claude/skills/` supported as
  // legacy, so the registration copies below already land in one it reads. The
  // CLI also applies a project-root AGENTS.md as a rule.
  if (harness === 'cursor-agent')
    files['.cursor/mcp.json'] = quote({ mcpServers: { kiln_workspace: mcp } });
  if (harness === 'opencode')
    files['opencode.json'] = quote({
      $schema: 'https://opencode.ai/config.json',
      skills: { paths: [join(root, 'skills')] },
      mcp: {
        kiln_workspace: {
          type: 'local',
          command: [mcp.command, server],
          environment: mcp.env,
          enabled: true,
        },
      },
    });
  if (harness === 'hermes') {
    // Hermes, like codex, has no project-local configuration: everything is
    // $HERMES_HOME-rooted and `hermes mcp add` has no scope flag. This file used
    // to be made real by pointing HERMES_HOME at it -- which worked for MCP
    // servers and skills, and silently took the provider selection and the
    // credential store with it. A workspace configured that way could not reach a
    // model at all: `model.default` and `model.provider` came back unset and the
    // run died before its first call. So this is documentation of intent now, and
    // the launcher applies what it can through documented flags.
    files['.hermes/config.yaml'] = quote({
      note: 'Hermes reads no project-local config. This file records what the workspace wants; node hermes.mjs applies the skills path and program store per invocation. Registering the MCP server is user-level; START.md has the one command.',
      mcp_servers: { kiln_workspace: mcp },
      skills: { external_dirs: [join(root, '.agents', 'skills')] },
    });
    // No HERMES_HOME redirect. `--in` sets the project directory, which is what
    // makes hermes inject this workspace's AGENTS.md as a rule -- so the guide
    // reaches the agent without any skill registration. `--skills` is NOT used:
    // it takes skill NAMES resolved against configured sources, not a path, and
    // handing it a directory fails with "Unknown skill(s)".
    //
    // The program store needs no configuration file at all: the MCP server reads
    // KILN_PROGRAM_STORE from its environment, and a server hermes spawns
    // inherits this one -- so a user-level registration gets retargeted at this
    // workspace's store without anything being written outside it.
    files['hermes.mjs'] =
      `import { spawn } from 'node:child_process';\nimport { dirname, join } from 'node:path';\nimport { fileURLToPath } from 'node:url';\nconst root = dirname(fileURLToPath(import.meta.url));\nconst args = process.argv.slice(2);\nconst has = names => args.some(arg => names.some(name => arg === name || arg.startsWith(name + '=')));\nif (!has(['--in'])) args.unshift('--in', root);\nconst child = spawn('hermes', args, { cwd: root, stdio: 'inherit', windowsHide: true, env: { ...process.env, KILN_PROGRAM_STORE: join(root, '.kiln', 'programs'), KILN_RENDER: 'auto', TERMINAL_CWD: root } });\nchild.on('error', (error) => { console.error(error.message); process.exitCode = 1; });\nchild.on('exit', (code) => { process.exitCode = code ?? 1; });\n`;
  }
  return { files, store, server };
}

const guide = `# Kiln asset workspace

Author and refine assets in this directory. The engine is installed separately. Do not read its implementation or example collection to solve an asset task.

Two surfaces drive the same engine and share .kiln/programs, so either is fine and you can mix them freely. The kiln_workspace MCP server returns each render as an image in your context. The node kiln.mjs CLI writes renders to disk, so read the PNG back before judging anything visual. A server named kiln may be a different installation; do not substitute it silently, and report the setup problem instead. To check, call kiln_list_primitives with capabilities true and compare capabilities.engine.installUrl against runtime in .kiln/workspace.json.

Read the skill for your task from skills/ in this directory, never a global plugin copy. The maintained copies are there, mirrored into .claude/skills/ and .agents/skills/ because harnesses scan different directories. Use kiln_list_primitives for API signatures.

## The loop

1. Draft. Pass code once to kiln_render or kiln_validate, or import a file with node kiln.mjs source asset.kiln.js. Either returns a programRef, normally a short immutable p_ handle. Keep it even when validation fails. Copy it exactly; never construct, expand or shorten one, and do not retransmit the program.
2. Render. kiln_render, or node kiln.mjs render PROGRAM_REF --views sheet.png.
3. Review. Look at the image. Check viewFidelity before judging materials: a CPU view is honest about silhouette, proportion and contact, and says nothing about colour, metalness or roughness.
4. Edit. Read exact anchors with kiln_source and a literal query, following nextOffset for more context, then call kiln_edit with programRef and edits. Each edit returns a new programRef; use that one from then on. Rewriting the whole file through the CLI works, but it loses the anchored diff and the revision lineage.
5. Save. kiln_save, or node kiln.mjs save. Keep the exact asset and revision IDs. Save refinements as child revisions rather than replacing their parent. Browse collections with kiln_assets and inspect saved GLBs with node kiln.mjs view.

Export at any point. Source is node kiln.mjs source PROGRAM_REF --out revised.kiln.js; geometry is node kiln.mjs render PROGRAM_REF --out asset.glb --views sheet.png. Export refuses to overwrite a file. Replace PROGRAM_REF with the exact returned reference; full sha256 references also remain valid.

## Material-faithful views

This workspace asks for render mode auto: a GPU service when one answers on port 8000, CPU views otherwise. Without that service every render reports viewFidelity.materialFaithful false, and nothing rendered here can confirm a material.

To start it, read runtime from .kiln/workspace.json and run npm install && npm start in render-service/ under that path. It is a separate package with a native dependency, so the install is its own step and can take a while. Start it at any time; the CLI picks it up on the next call, and MCP starts one itself on the first render that needs it. The one case that needs a restart is installing it AFTER this session began: the MCP server checks at startup whether a renderer could run here, and a session that began before the install stays on CPU for its lifetime.

For a task about appearance, say so rather than silently accepting CPU views.

## Keep this context clean

Skills and MCP servers from user-level configuration still load here: a workspace separates task context, not operating-system permissions. When you verify the server, report anything registered that is unrelated to this task so the user can decide whether to narrow it.

Keep .kiln/programs while working. Source files are portable; references resolve only in a store containing their source.
`;

async function readManifest(root) {
  try {
    return JSON.parse(await readFile(join(root, '.kiln/workspace.json'), 'utf8'));
  } catch {
    throw new Error('This is not a managed Kiln workspace. Existing files were not changed.');
  }
}

async function fileHashes(directory, prefix = '') {
  const hashes = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory())
      Object.assign(hashes, await fileHashes(join(directory, entry.name), name));
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
  if (extras.some((name) => !Object.hasOwn(optional, name)))
    throw new Error('Optional skills: compose,batch.');
  const skills = previous?.skills ?? [...core, ...new Set(extras.map((name) => optional[name]))];
  if (
    !Array.isArray(skills) ||
    skills.some((name) => ![...core, ...Object.values(optional)].includes(name))
  )
    throw new Error('Invalid workspace skill manifest.');
  const pkg = await preflightRuntime(runtime, skills);
  let exists = false;
  try {
    const info = await lstat(root);
    if (!info.isDirectory() || info.isSymbolicLink())
      throw new Error('Choose a real directory, not a symbolic link.');
    exists = true;
    if (inside(runtime, await realpath(root)))
      throw new Error('Choose a directory outside the Kiln installation.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  // Resolve the nearest existing parent so symlinks cannot bypass the installation check.
  let ancestor = dirname(root);
  while (true) {
    try {
      ancestor = await realpath(ancestor);
      break;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const parent = dirname(ancestor);
      if (parent === ancestor) throw error;
      ancestor = parent;
    }
  }
  if (inside(runtime, root) || inside(runtime, ancestor))
    throw new Error('Choose a directory outside the Kiln installation.');
  if (!previous && exists && (await readdir(root)).length)
    throw new Error('The destination must be empty; no existing files were changed.');
  const { files, store, server } = managedFiles(root, runtime, harness, nodeExecutable);
  const manifest = {
    schemaVersion: 1,
    harness,
    runtime,
    runtimeVersion: pkg.version,
    runtimeHashes: {
      cli: hash(await readFile(join(runtime, 'dist/cli.mjs'))),
      mcp: hash(await readFile(join(runtime, 'dist/mcp-server.mjs'))),
    },
    node: nodeExecutable,
    skills,
    skillHashes: previous?.skillHashes,
    generated: Object.fromEntries(Object.entries(files).map(([name, body]) => [name, hash(body)])),
  };
  if (previous) {
    if (previous.schemaVersion !== 1) throw new Error('Unsupported workspace manifest version.');
    const originals = {};
    for (const name of Object.keys(files)) {
      if (!Object.hasOwn(previous.generated ?? {}, name)) {
        try {
          await lstat(join(root, name));
          throw new Error(`Refusing to replace existing ${name}.`);
        } catch (error) {
          if (error.code !== 'ENOENT') throw error;
        }
        originals[name] = undefined;
        continue;
      }
      const original = await readFile(join(root, name), 'utf8');
      if (hash(original) !== previous.generated?.[name])
        throw new Error(
          `Refusing to replace edited ${name}. Preserve your changes and update its runtime paths manually.`,
        );
      originals[name] = original;
    }
    const oldManifest = await readFile(join(root, '.kiln/workspace.json'), 'utf8');
    try {
      for (const [name, body] of Object.entries(files)) await writeFile(join(root, name), body);
      await writeFile(join(root, '.kiln/workspace.json'), quote(manifest));
    } catch (error) {
      for (const [name, body] of Object.entries(originals)) {
        if (body === undefined) await rm(join(root, name), { force: true });
        else await writeFile(join(root, name), body);
      }
      await writeFile(join(root, '.kiln/workspace.json'), oldManifest);
      throw error;
    }
    return { root, harness, store, server, repaired: true };
  }
  await mkdir(dirname(root), { recursive: true });
  const stage = await mkdtemp(join(dirname(root), '.kiln-init-'));
  const installed = [];
  try {
    for (const [name, body] of Object.entries(files)) {
      await mkdir(dirname(join(stage, name)), { recursive: true });
      await writeFile(join(stage, name), body);
    }
    await mkdir(join(stage, '.kiln'), { recursive: true });
    await writeFile(join(stage, '.kiln/workspace.json'), quote(manifest));
    await writeFile(join(stage, '.gitignore'), '.kiln/programs/\n.hermes/\n*.glb\n*.png\n');
    for (const name of ['AGENTS.md', 'CLAUDE.md']) await writeFile(join(stage, name), guide);
    for (const name of skills)
      await cp(join(runtime, 'skills', name), join(stage, 'skills', name), { recursive: true });
    // Registration copies. No harness scans a bare `skills/`: Claude Code reads
    // only `.claude/skills/`, while codex, opencode, hermes, agy, copilot and
    // cursor-agent read `.agents/skills/`. Without these the workspace has skill files that the
    // agent can read only when told to, which is how it worked before. Copies
    // rather than symlinks because those need developer mode or an
    // administrator on Windows.
    for (const registry of skillRegistries)
      for (const name of skills)
        await cp(join(runtime, 'skills', name), join(stage, registry, name), { recursive: true });
    manifest.skillHashes = await fileHashes(join(stage, 'skills'));
    await writeFile(join(stage, '.kiln/workspace.json'), quote(manifest));
    // Harnesses whose configuration is user-global reach this workspace only
    // through their generated launcher. codex was missing from this map, so
    // START.md told the reader to run bare `codex` -- which reads no
    // project-local config at all, and is exactly the invocation that cannot see
    // the tools.
    const launchers = { agy: 'node agy.mjs', codex: 'node codex.mjs', hermes: 'node hermes.mjs' };
    const command = launchers[harness] ?? harness;
    const launch =
      harness === 'hermes'
        ? `Hermes keeps configuration in $HERMES_HOME and has no project-local equivalent, so the launcher supplies this workspace's directory, skills and program store per invocation and leaves your provider and credentials exactly as they are. Registering the server itself is the one user-level step; run it once:\n\n\`\`\`bash\nhermes mcp add kiln_workspace --command ${nodeExecutable} --env KILN_RENDER=auto --args ${server}\n\`\`\`\n\nVerify with \`hermes mcp list\`. The launcher retargets the program store at this workspace through the environment, so one registration serves every workspace. Skills reach the agent through this directory's AGENTS.md and \`skills/\`; to have hermes register them as skills too, add \`skills.external_dirs\` pointing at ${join(root, '.agents', 'skills')} to your own config once. Pass \`--ignore-rules\` only when you want to suppress AGENTS.md along with your user-level rules.`
        : harness === 'agy'
          ? 'The launcher supplies the absolute project directory. For headless runs, use node agy.mjs --model MODEL --print "Read AGENTS.md and the project skills. Use only kiln_workspace MCP tools. YOUR TASK.". Print mode disables automatic slash-command/skill expansion to avoid automatic expansion of a global skill. Use absolute task-file paths in headless prompts and verify that tool calls use kiln_workspace; global configuration and authentication remain unchanged.'
          : harness === 'codex'
            ? 'Codex keeps configuration in $CODEX_HOME and has no project-local equivalent, so `node codex.mjs` passes this workspace\'s server, program store and directory as per-invocation `-c` overrides. It writes nothing outside this directory and leaves your $CODEX_HOME and its authentication untouched. Running bare `codex` here reaches no Kiln tools. For headless runs, add the prompt: node codex.mjs "Read AGENTS.md and the project skills, then YOUR TASK.".'
            : `This directory is configured for ${harness}.`;
    await writeFile(
      join(stage, 'START.md'),
      `# Start making assets\n\n\`\`\`bash\ncd ${root}\n${command}\n\`\`\`\n\n${launch} Accept the project/MCP trust prompts. Ask the agent to read AGENTS.md and create an asset. Kiln needs no separate model key.\n\nCore author/refine/QA skills are installed and registered for this harness. Optional compose/batch skills are selected at setup with --skills compose,batch.\n\nKeep assets here and engine source outside. This separates task context, not operating-system permissions. User instructions and authentication can still apply.\n\nRun repair after anything that invalidates the generated absolute paths: moving this workspace, moving or reinstalling the runtime, or replacing the Node that setup recorded -- an nvm switch or uninstall does that, because the manifest pins the exact interpreter the preflight check validated.\n\n\`\`\`bash\nnode ${join(runtime, 'scripts/create-workspace.mjs')} ${root} --repair\n\`\`\`\n\nThat path is where the installation was at setup. If the installation itself moved, run the same command from its current location; \`runtime\` in .kiln/workspace.json records where this workspace last expected it.\n\nRepair updates generated runtime paths only and refuses edited configuration; it preserves skills, assets, and saved revisions.\n`,
    );
    if (exists) {
      // Windows cannot remove the caller's current directory, even when empty.
      // Move only staged entries and track them so a failed install rolls back.
      if ((await readdir(root)).length)
        throw new Error('The destination changed during setup; no files were replaced.');
      for (const name of await readdir(stage)) {
        const target = join(root, name);
        try {
          await lstat(target);
          throw new Error(`Refusing to replace ${target}.`);
        } catch (error) {
          if (error.code !== 'ENOENT') throw error;
        }
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
  try {
    return realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isDirectSetupEntry()) {
  try {
    const args = process.argv.slice(2);
    if (args.includes('--help') || args.includes('-h')) {
      console.log(
        'Usage: kiln-init <empty-directory> [--harness claude|codex|opencode|hermes|agy] [--skills compose,batch]\n       kiln-init <managed-workspace> --repair',
      );
    } else {
      const directory = args.shift();
      if (!directory || directory.startsWith('--'))
        throw new Error('Provide a workspace directory. Run kiln-init --help for usage.');
      let harness = 'claude';
      const options = {};
      while (args.length) {
        const flag = args.shift();
        if (flag === '--repair') options.repair = true;
        else if (flag === '--harness' || flag === '--skills') {
          const value = args.shift();
          if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value.`);
          if (flag === '--harness') harness = value;
          else options.skills = value.split(',');
        } else throw new Error(`Unknown option: ${flag}`);
      }
      if (options.repair && options.skills)
        throw new Error('--repair does not change installed skills.');
      console.log(quote(await createWorkspace(directory, harness, options)));
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
