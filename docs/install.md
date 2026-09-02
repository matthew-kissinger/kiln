# Installing Kiln in an agent harness

Kiln exposes one tool surface over two transports. Pick the one your harness speaks.

Everything below needs [Bun](https://bun.sh) on `PATH` — the package ships TypeScript source rather
than a build artifact, which is also why the entry point is a `.ts` file.

```bash
git clone https://github.com/matthew-kissinger/kiln && cd kiln
bun install
```

Verify before wiring anything up:

```bash
bun run kiln render examples/crate.kiln.js --out crate.glb --views sheet.png
```

That runs the full geometry build, the QA gates, and the rasterizer with no model, no network, no
GPU, and no key. If it produces a GLB and a contact sheet, the engine is fine and any later problem
is transport configuration.

## As an MCP server

Point your client at `src/mcp-server.ts` with an **absolute** path. The server resolves every
internal path from `import.meta.url` and never reads `process.cwd()`, so the working directory the
client launches it in does not matter — only that the script path is right.

```json
{
  "mcpServers": {
    "kiln": {
      "type": "stdio",
      "command": "bun",
      "args": ["run", "/absolute/path/to/kiln/src/mcp-server.ts"],
      "env": { "KILN_RENDER": "auto" }
    }
  }
}
```

Set `KILN_RENDER` to `cpu` to pin the deterministic rasterizer, or `gpu` to fail loudly rather than
degrade. `KILN_RENDER_PORT_URL` (plus `KILN_RENDER_TOKEN`) routes views to a GPU render service.

**For textured or metallic assets, run the GPU renderer** — it ships in this repository:

```bash
cd render-service && npm install && npm start
```

It listens on `:8000`, which is where `auto` looks, so the MCP server picks it up with no further
configuration. See [`render-service/README.md`](../render-service/README.md) and the render-modes
section of the [README](../README.md).

Your agent gets six tools and is the author: it writes the program, looks at the render, and
iterates with its own model. There is no nested agent loop and no second provider key.

## As an Agent Plugin

The repository is also a plugin package. Two manifest conventions exist as of late 2026 and Kiln
ships both, because they disagree on filenames and on the path variable:

| | Portable spec | Claude Code |
|---|---|---|
| Manifest | `plugin.json` | `.claude-plugin/plugin.json` |
| MCP config | `mcp.json` | inline `mcpServers` in the manifest |
| Plugin-root variable | `${PLUGIN_ROOT}` | `${CLAUDE_PLUGIN_ROOT}` |
| Skills | `skills/<name>/SKILL.md` | same |

The skills are the same files in both cases. Installing the plugin gives you the MCP tools *and*
the three skills that teach an agent to use them well:

| Skill | When it fires |
|---|---|
| `kiln-author-asset` | create, model, build, or refine an asset |
| `kiln-qa-asset` | wire a finished GLB into a real project and prove it works |
| `kiln-compose-scene` | lay out several finished GLBs into one scene |

Together they cost about 215 tokens of always-on context; the bodies load only when a skill fires.

### Claude Code

```bash
claude plugin marketplace add matthew-kissinger/kiln
claude plugin install kiln@kiln
```

Verify with `claude mcp list` — you want `plugin:kiln:kiln … ✔ Connected`.

Claude Code's MCP config is declared **inline in `.claude-plugin/plugin.json`** rather than in a
root `.mcp.json`. That is deliberate: `.mcp.json` at a repository root is also Claude Code's
*project*-scoped config, where `${CLAUDE_PLUGIN_ROOT}` is undefined, so shipping one would hand
every contributor who opens this repo a broken server entry and a warning. Declaring it in the
manifest works identically for installed users and leaves the repo clean for contributors.

## In-process, without MCP

If your harness is TypeScript and you would rather skip the transport, import the registry directly.
[`examples/strands-harness.ts`](../examples/strands-harness.ts) is the whole integration in about
sixty lines, including both render-port injection seams.

```ts
import { createKilnToolRegistry } from 'kiln/tools';
```

`kiln/tools` is the framework-agnostic core and imports no agent SDK, so porting to a harness that
is not Strands does not drag Strands along. Each def carries `name`, `description`, a zod
`inputSchema`, and `run`. Mapping those four fields is the entire adapter — `src/mcp-server.ts` is
one such adapter and `src/agent/tools.ts` is another.
