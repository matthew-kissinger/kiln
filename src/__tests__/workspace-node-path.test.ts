import { expect, it } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, symlink, unlink, rm } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
it('generated MCP command survives removal of a transient Node directory link', async () => {
  const root = await mkdtemp(join(tmpdir(), 'kiln-node-link-'));
  const probe = spawnSync('node', ['-p', 'process.execPath'], { encoding: 'utf8' });
  expect(probe.status).toBe(0);
  const canonical = realpathSync(probe.stdout.trim()),
    link = join(root, 'ephemeral-shell'),
    alias = join(link, basename(canonical)),
    workspace = join(root, 'assets');
  try {
    await symlink(dirname(canonical), link, process.platform === 'win32' ? 'junction' : 'dir');
    // Some hosts canonicalize execPath themselves; emulate the fnm shell-path case consistently.
    const script = `Object.defineProperty(process,'execPath',{value:process.argv[1]});const {createWorkspace}=await import(${JSON.stringify(pathToFileURL(resolve(import.meta.dir, '../../scripts/create-workspace.mjs')).href)});await createWorkspace(process.argv[2],'claude');`;
    const created = spawnSync(alias, ['--input-type=module', '-e', script, alias, workspace], {
      encoding: 'utf8',
    });
    expect(created.status).toBe(0);
    const manifest = JSON.parse(await readFile(join(workspace, '.kiln/workspace.json'), 'utf8'));
    const config = JSON.parse(await readFile(join(workspace, '.mcp.json'), 'utf8'));
    expect(manifest.node).toBe(canonical);
    expect(config.mcpServers.kiln_workspace.command).toBe(canonical);
    await unlink(link);
    const started = spawnSync(config.mcpServers.kiln_workspace.command, ['--version'], {
      encoding: 'utf8',
    });
    expect(started.status).toBe(0);
    expect(started.stdout).toMatch(/^v22\./);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);
