/**
 * The committed MCP server bundle is the thing every harness actually launches,
 * and it is generated, so it can go stale without anybody noticing until an
 * install fails on someone else's machine. This file is what stops that.
 *
 * Why the bundle exists at all: the manifests used to say `"command": "bun"`,
 * which asks the harness to resolve a name against its own PATH. Bun's installer
 * appends to the Windows *User* PATH, and a process only ever sees the
 * environment it was born with, so anything started before that install looked
 * up `bun`, missed, and died with
 *
 *   kiln: exec: "bun": executable file not found in %PATH%
 *
 * There is not one Bun-specific API on the server's runtime path -- Node strips
 * the types happily and only chokes on this codebase's extensionless imports --
 * so bundling for Node removes Bun from the consumer's requirements entirely.
 * Bun stays the development toolchain; it is no longer a thing users must have.
 *
 * A plugin install is a git clone with no build step, which is why the artifact
 * is committed rather than built on demand.
 */
import { spawnSync } from 'node:child_process';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'bun:test';

import { kilnMcpToolDefs } from '../mcp-server';

const REPO = resolve(import.meta.dir, '..', '..');
const BUNDLE = join(REPO, 'dist', 'mcp-server.mjs');

const BUILD_ARGS = [
  'build',
  'src/mcp-server.ts',
  '--target=node',
  '--packages=external',
  '--outfile=',
];

const sha256 = (b: Buffer | Uint8Array) => createHash('sha256').update(b).digest('hex');

describe('mcp server bundle', () => {
  it('is committed', async () => {
    const bytes = await readFile(BUNDLE);
    expect(bytes.byteLength).toBeGreaterThan(100_000);
  });

  it('matches a fresh build, byte for byte', async () => {
    // `bun build` is deterministic for a given input and toolchain version, so
    // an exact comparison is the strongest available check and cannot pass on a
    // bundle that merely happens to still run.
    const out = join(tmpdir(), `kiln-mcp-freshness-${process.pid}.mjs`);
    const args = [...BUILD_ARGS.slice(0, -1), `--outfile=${out}`];
    const built = spawnSync(process.execPath, args, { cwd: REPO, encoding: 'utf8' });
    expect(built.status).toBe(0);
    const [fresh, committed] = await Promise.all([readFile(out), readFile(BUNDLE)]);
    expect(`dist/mcp-server.mjs ${sha256(committed)}`).toBe(`dist/mcp-server.mjs ${sha256(fresh)}`);
  });

  /**
   * Freshness alone would pass on a bundle that is current and broken. This
   * speaks real MCP to it over stdio, under `node` rather than `bun`, which is
   * the exact thing the harnesses do.
   */
  it('serves the full tool surface when launched with node', async () => {
    // Compare against the MCP surface, not `createKilnToolRegistry()`. Those
    // are deliberately different: the registry is the frozen four-tool bench
    // baseline whose `kiln_screenshot` is CPU-only by construction, and the MCP
    // server publishes the unified six, including the render-port-backed
    // `kiln_render`. `src/mcp-parity.test.ts` owns that distinction; this test
    // only has to prove the bundle publishes whatever the server says it does.
    const expected = kilnMcpToolDefs()
      .map((t) => t.name)
      .sort();

    // Negotiate initialization before tools/list. Pipelining them relies on
    // server scheduling and can race once startup does real installation work.
    const client = new Client({ name: 'bundle-test', version: '1' });
    const transport = new StdioClientTransport({
      command: 'node',
      args: [BUNDLE],
      cwd: REPO,
      env: { ...process.env, KILN_RENDER: 'cpu' } as Record<string, string>,
      stderr: 'pipe',
    });
    let errors = '';
    transport.stderr?.on('data', (chunk) => {
      errors += chunk.toString();
    });
    let names: string[];
    try {
      await client.connect(transport);
      names = (await client.listTools()).tools.map((tool) => tool.name).sort();
    } catch (error) {
      throw new Error(`Node MCP startup failed: ${errors}`, { cause: error });
    } finally {
      await client.close();
    }

    expect(names).toEqual(expected);
  }, 70_000);
});

describe('harness manifests', () => {
  /**
   * Both files are hand-maintained JSON that no compiler checks, and each one
   * names a path variable that only its own harness expands. Getting either
   * wrong is silent: the harness simply reports no tools.
   *
   * Claude Code reads `.claude-plugin/plugin.json` (or a `.mcp.json` at the
   * plugin root) and expands `${CLAUDE_PLUGIN_ROOT}`; that path is live and
   * carries the tools on its own.
   *
   * Antigravity is the one to be careful about, and the claim here is narrower
   * than it looks. Measured on `agy` 1.1.25: it locates `mcp_config.json` at the
   * plugin root -- `agy plugin validate` reports `mcpServers: 1 processed` -- and
   * then does NOT merge it into the session, so `agy mcp list` says
   * `No MCP servers configured` and the agent sees nothing. Registration there
   * is `agy mcp add`, which writes its own entry. This file is kept correct and
   * ready for the day that changes, so what is asserted below is only that it
   * names the node bundle. It notably does NOT assert that `${PLUGIN_ROOT}`
   * expands, because nothing has been observed expanding it.
   *
   * A bare `mcp.json` is read by neither harness, which is why it no longer
   * exists.
   */
  const cases = [
    { file: '.claude-plugin/plugin.json', variable: 'CLAUDE_PLUGIN_ROOT' },
    { file: 'mcp_config.json', variable: 'PLUGIN_ROOT' },
  ] as const;

  for (const { file, variable } of cases) {
    it(`${file} launches the node bundle via \${${variable}}`, async () => {
      const raw = JSON.parse(await readFile(join(REPO, file), 'utf8')) as {
        mcpServers: Record<string, { command: string; args: string[] }>;
      };
      const kiln = raw.mcpServers['kiln'];
      expect(kiln).toBeDefined();
      // The regression this whole file exists for: never resolve an interpreter
      // by bare name off the harness's PATH.
      expect(kiln!.command).toBe('node');
      expect(kiln!.args).toEqual([`\${${variable}}/dist/mcp-server.mjs`]);
    });
  }
});
