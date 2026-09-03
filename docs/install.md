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

| | Portable spec | Claude Code | Antigravity |
|---|---|---|---|
| Manifest | `plugin.json` | `.claude-plugin/plugin.json` | `plugin.json` (reuses the portable one) |
| MCP config | `mcp.json` | inline `mcpServers` in the manifest | `mcp_config.json` |
| Plugin-root variable | `${PLUGIN_ROOT}` | `${CLAUDE_PLUGIN_ROOT}` | none — absolute paths |
| Skills | `skills/<name>/SKILL.md` | same | same |

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

### Antigravity (`agy`)

Antigravity accepts the portable `plugin.json` unchanged — no Google-specific manifest is needed,
which is the whole point of shipping to a spec:

```bash
agy plugin validate .    # ok - 3 skills, 1 mcpServer
agy plugin install .
```

That installs the skills. **Getting the tools attached takes one more step**, for two reasons worth
knowing before you start:

1. Antigravity documents no plugin-root path variable, so a `${PLUGIN_ROOT}` in a plugin's
   `mcp_config.json` does not expand.
2. As of `agy` 1.1.15 a plugin's `mcp_config.json` is staged but not merged into the session's
   server list.

So register the server in Antigravity's central config, `~/.gemini/config/mcp_config.json`, with an
absolute path — this is the file the CLI, the IDE, and Antigravity 2.0 all share:

```json
{
  "mcpServers": {
    "kiln": {
      "command": "bun",
      "args": ["/absolute/path/to/kiln/src/mcp-server.ts"],
      "env": { "KILN_RENDER": "auto" }
    }
  }
}
```

Remote servers use `serverUrl` rather than `url` or `httpUrl`, which are not supported.

#### Headless permissions

`agy -p=...` cannot prompt, so any tool that would ask is soft-denied and the model reports it as
unavailable. Grants live under `permissions.allow` in the CLI's own settings file:

```jsonc
// ~/.gemini/antigravity-cli/settings.json
{
  "permissions": {
    "allow": [
      "mcp(kiln/*)",
      "read_file(*)",
      "write_file(/absolute/path/to/your/project)",
      "command(*)"
    ]
  },
  "trustedWorkspaces": ["/absolute/path/to/your/project"]
}
```

A second file, `~/.gemini/config/config.json`, contributes *shared* grants under
`userSettings.globalPermissionGrants` and is merged with the above. Both are read; the CLI logs
`applyUserSettings: stored shared config permissions` for the shared file and
`CLI settings initialized: permissions=…` for the effective set. If a grant is not taking effect,
`--log-file` and those two lines tell you what the CLI actually parsed.

**`command` is the one rule kind that does not accept a target in headless mode.** The documented
syntax — each whitespace-separated token as an anchored regex, e.g. `command(git)` or
`command(npm run (build|lint|test))` — parses correctly and still gets denied:

```
tool_confirmation_manager.go:188] Print mode: soft-denying tool confirmation "RunCommand" at step 2
```

Only `command(*)` passes. This is upstream
[antigravity-cli#548](https://github.com/google-antigravity/antigravity-cli/issues/548). Scope the
blast radius with `trustedWorkspaces`, a path-scoped `write_file`, and a `deny` list instead —
those are honoured. `mcp(kiln/*)` and `write_file(<abs path>)` were both verified working in
headless mode with the shared wildcard removed, so scope everything you can and treat `command(*)`
as the known exception rather than the default.

Three more sharp edges:

- `--print` takes its prompt **attached** (`--print="..."`). Passed separately, Go's flag package
  reads the next flag as the prompt and silently ignores what you typed.
- The effort-suffixed model ids already encode effort, so `--model gemini-3.8-flash-high --effort high`
  is rejected as a conflict. Pick one.
- **Use absolute paths in prompts.** `agy` resolves relative paths against the *installed plugin
  copy* under `~/.gemini/config/plugins/kiln`, not your working tree, so a prompt saying
  `README.md` reads the wrong file.

Verified end to end with Gemini 3.8 Flash, which authored
[`examples/arcade-cabinet.kiln.js`](../examples/arcade-cabinet.kiln.js) through this path.

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
