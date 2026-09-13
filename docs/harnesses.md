# Headless harnesses

Seven coding-agent CLIs can drive Kiln unattended. This is the operational reference for
keeping exactly one install of each, invoking them headlessly, and running the repeatable
checks. For what a dispatch run *is*, see [headless asset generation](dispatch.md); for how
to compare runs fairly, see the `kiln-batch-dispatch` skill; for dated results, see
[harness checks](dogfooding.md).

The registry of record is [scripts/harness.mjs](../scripts/harness.mjs). Every flag below is
there with the diagnosis that put it there. When the two disagree, that file is right.

## One owner per tool

The thing that makes updates flaky is not a missing package manager. It is two owners of one
binary.

Measured on the development machine: `codex` existed three times -- a root-owned
`sudo npm -g` install at `/usr/bin/codex` (0.153.4), an orphaned copy in an inactive nvm tree
(0.139.0), and a current one in the user prefix. `codex doctor` reported `PATH entries (5)`.
A shell wrapper pinned the oldest of them, so `npm i -g` upgraded a binary that never ran.

Every CLI here ships its own updater. Use it, and keep one install per tool.

| harness | canonical install | upgrade | install family |
| --- | --- | --- | --- |
| agy | Antigravity installer | `agy update` | vendor self-updater |
| claude | `curl -fsSL https://claude.ai/install.sh \| bash` | `claude update` | vendor self-updater |
| opencode | `curl -fsSL https://opencode.ai/install \| bash` | `opencode upgrade` | vendor self-updater |
| cursor-agent | `curl https://cursor.com/install -fsS \| bash` | `cursor-agent update` | vendor self-updater |
| codex | `curl -fsSL https://chatgpt.com/codex/install.sh \| sh`, or `npm i -g @openai/codex` | `codex update` | either; it detects which |
| copilot | `npm i -g @github/copilot`, or brew/winget/install script | `copilot update` | either |
| hermes | `git clone` + venv | `hermes update` | git checkout |

Two notes worth keeping:

- **npm and a self-updater can coexist, but only one of them.** `codex doctor` prints
  `install method` and `managed by npm: yes|no`, then adapts `codex update` to match. An
  npm install in a single prefix is therefore fine. Two npm installs in two prefixes is not.
- **`codex doctor` is the only self-diagnosing harness here.** Run it first when codex
  misbehaves; it reports install consistency, PATH duplicates, auth, and disk.

## Headless invocation

Verified against the versions in the footer. The traps are not stylistic -- each one fails
*before* the model reads the brief, and most fail silently.

| harness | non-interactive | prompt position | unattended tool grant | working directory |
| --- | --- | --- | --- | --- |
| agy | `--print=TEXT` | **attached to the flag** | print mode | `--add-dir` |
| claude | `-p TEXT` | flag value | `--permission-mode acceptEdits` + `--allowedTools` | `--add-dir` |
| codex | `exec TEXT` | positional after `exec` | `--approve-for-me` | `--cd` |
| opencode | `run TEXT` | positional | `--auto` | `--dir` |
| copilot | `-p TEXT` | flag value | `--allow-all-tools` | `-C` and `--add-dir` |
| cursor-agent | `-p` then `TEXT` | **positional; `-p` is a boolean** | `--force --approve-mcps --trust` | `--workspace` |
| hermes | `-z TEXT` | flag value | none; `-z` resolves prompts | process CWD only |

The ones that cost real time:

- **agy `--print` takes its prompt attached.** Passed with a space, Go's flag package reads
  the next flag as the prompt and ignores what you typed.
- **cursor-agent needs three separate grants.** `--force` allows tool calls, `--approve-mcps`
  approves the server, `--trust` accepts the workspace. An unapproved MCP server is gated
  independently of tool permission, so `--force` alone leaves the Kiln tools unreachable.
- **copilot's `--allow-all-tools` is required, not hardening.** Its own help says so. Without
  it a `-p` run has no terminal to prompt on and stops at the first tool.
- **`codex exec` pins the approval policy to `never`,** under which an MCP call is not asked
  about, it is refused. `--approve-for-me` is the flag that both selects a workspace-write
  sandbox and moves approval to `on-request`.
- **A bare temp directory is not a trusted directory.** codex needs `--skip-git-repo-check`;
  cursor-agent needs `--trust`.

## Where each harness reads MCP config

`create-workspace.mjs` writes the spelling the chosen harness actually reads. The filenames
overlap; the contents do not.

| harness | workspace config | shape |
| --- | --- | --- |
| claude | `.mcp.json` | `mcpServers.<name>` |
| copilot | `.mcp.json` | `mcpServers.<name>` with `type: "local"` and `tools: ["*"]` |
| cursor-agent | `.cursor/mcp.json` | `mcpServers.<name>` |
| agy | `.agents/mcp_config.json` | `mcpServers.<name>` |
| codex | `.codex/config.toml` | `[mcp_servers.<name>]` |
| opencode | `opencode.json` | `mcp.<name>` with `type: "local"` and `command` as an array |
| hermes | `.hermes/config.yaml` | `mcp_servers.<name>` |

Copilot and Claude Code read the same *filename* and not the same *contents*: `copilot mcp
add` writes `type: "local"` plus an explicit tool filter where Claude writes `type: "stdio"`
and no filter. The generated Copilot config is the one Copilot's own CLI produced, because a
config a harness cannot read does not announce itself -- the agent simply answers as though
the tools were never mentioned.

**A server named `kiln` may be a different installation.** A user-level
`~/.cursor/mcp.json` on the development machine named `kiln` and pointed at an extracted
0.6.0 package while the checkout was 0.7.0; `cursor-agent mcp list` reported it
`Connection failed`. Workspaces therefore register `kiln_workspace` under their own name.
Report a mismatch rather than silently substituting it.

Skills need no per-harness directory beyond the two the generator already writes. Claude Code
reads `.claude/skills/`. Every other harness here reads `.agents/skills/`: `copilot skill
--help` lists `.github/skills/`, `.agents/skills/` and `.claude/skills/`, and Cursor's project
skill paths are `.agents/skills/` and `.cursor/skills/` with `.claude/skills/` supported as
legacy. cursor-agent additionally applies a project-root `AGENTS.md` as a rule, alongside
`.cursor/rules/`.

## Running the checks

Three tools, cheapest first. None is part of `bun run test`: they spend provider quota and
need CLIs that CI does not have.

```bash
# 1. Can this harness reach the tools at all? One short turn each.
bun run smoke:harness                          # every CLI on PATH
bun run smoke:harness -- --harness copilot     # one

# 2. Can it author an asset? Keeps brief, transcript, source, GLB, views.
node scripts/dispatch-asset.mjs --harness opencode --model PROVIDER/MODEL \
  --name water-tower "A steel water tower on a riveted lattice frame"

# 3. What went over the wire? Transparent stdio proxy, for payload questions.
node scripts/observe-mcp.mjs
```

`smoke:harness` skips a harness whose binary is absent rather than failing it, and the parent
process runs the engine over whatever program came back -- the child's own claim of success is
the one piece of evidence that proves nothing.

Before trusting a new model id, confirm image support with
`node scripts/check-vision.mjs PROVIDER/MODEL`, then confirm the harness actually forwards
the images. Provider metadata alone verifies neither.

### Reading a result honestly

- A quota or authentication failure is not a measure of asset quality.
- An interrupted run is not a completed asset.
- `viewFidelity.materialFaithful: false` means a CPU view: evidence about shape, not
  material. Judge colour and roughness only from a GPU render.
- The prompt should *be* the brief. Writing the brief to a file and telling the agent to read
  it adds two failure modes that have nothing to do with Kiln -- the agent needs working file
  tools, and its working directory has to be right.

## Excluded

- **Gemini CLI.** Google switched it off for individual tiers on 18 June 2026 and replaced it
  with Antigravity CLI (`agy`). It now fails at startup with
  `IneligibleTierError: This client is no longer supported for Gemini Code Assist for
  individuals`. Only enterprise Code Assist licences and paid API keys still reach it, so it
  has no adapter. Use `agy` for Gemini models.
- **The VS Code Copilot Chat extension.** A GUI, not a headless harness. It matters anyway
  because it shares the `copilot` CLI's schema validator: a JSON Schema 2020-12 tuple renders
  as `prefixItems` plus `items: false`, which that validator rejects with `tool parameters
  array type must have items`, disabling the tool before the model sees it. The `copilot`
  adapter is the standing reproduction for that class of breakage without an editor open.

## Adding a harness

1. Add an entry to `HARNESSES` in [scripts/harness.mjs](../scripts/harness.mjs): `bin`,
   `defaultModel` (`null` when account entitlement is unknowable), `probe`, `argv`, and
   `fallbackModels`. Record *why* each flag is there.
2. Add its MCP config spelling to `managedFiles` in
   [scripts/create-workspace.mjs](../scripts/create-workspace.mjs) and its name to the
   `harnesses` list beside it.
3. Add a case to the workspace test in
   [src/\_\_tests\_\_/workspace-bootstrap.test.ts](../src/__tests__/workspace-bootstrap.test.ts)
   asserting the generated config names the runtime's `dist/mcp-server.mjs`.
4. Run `bun run smoke:harness -- --harness <name>` before trusting it with a brief.

Prefer a `defaultModel` of `null` over a guess. A model id hardcoded here overrides a working
operator configuration, and a harness that rejects an unentitled id fails before the brief.

## Verified on

13 September 2026, Linux, `KILN_RENDER=cpu` for the engine gates.

agy 1.2.2 · claude 2.1.269 · codex 0.154.0 · copilot 1.0.83 · cursor-agent 2026.09.10-fd3934a
· hermes 0.21.2 · opencode 1.18.30 · node 22.23.2 · bun 1.4.2 · npm 12.0.2
