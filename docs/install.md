# Installing Kiln in an agent harness

Kiln exposes one tool surface over two transports. Pick the one your harness speaks.

Everything below starts with a clone and its dependencies, because the engine ships TypeScript
source rather than a published package. [Bun](https://bun.sh) is the development toolchain and
installs them.

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

## The server runs on Node

Every config on this page launches `dist/mcp-server.mjs` with `node`. That is a committed bundle,
and both halves of that sentence were forced by real failures.

It is **Node** because `"command": "bun"` asks the harness to resolve a name against its own PATH,
and on Windows that is a coin flip: Bun's installer appends to the *User* PATH, and a process only
ever sees the environment it was born with, so anything started before the install dies with
`exec: "bun": executable file not found in %PATH%`. There is not one Bun-specific API on the
server's runtime path, so bundling for Node takes Bun out of a user's requirements entirely.

It is **committed** because a plugin install is a git clone with no build step, so an artifact that
is built on demand is an artifact that is not there when the harness looks for it.

Rebuild it with `bun run build:mcp` after changing anything under `src/`.
[`src/__tests__/mcp-bundle.test.ts`](../src/__tests__/mcp-bundle.test.ts) rebuilds it, compares byte
for byte against the committed copy, and then speaks real MCP to it under `node`, so a stale or
broken bundle fails the suite rather than somebody's install.

## As an MCP server

Point your client at `dist/mcp-server.mjs` with an **absolute** path. The server resolves every
internal path from `import.meta.url` and never reads `process.cwd()`, so the working directory the
client launches it in does not matter -- only that the script path is right.

```json
{
  "mcpServers": {
    "kiln": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/kiln/dist/mcp-server.mjs"],
      "env": { "KILN_RENDER": "auto" }
    }
  }
}
```

Codex CLI keeps the same server in TOML at `~/.codex/config.toml`:

```toml
[mcp_servers.kiln]
command = "node"
args = ["/absolute/path/to/kiln/dist/mcp-server.mjs"]
env = { KILN_RENDER = "auto" }
```

Interactive `codex` asks before each MCP call and the server works as soon as the block above is in
place. `codex exec` does not ask: it pins the approval policy to `never`, and under that policy an
MCP call is refused rather than queued, so a scripted run reports that `kiln_list_primitives` was
blocked and writes nothing. Pass `--approve-for-me`, which selects the workspace-write sandbox and
routes approvals through automatic review. It cannot be combined with `--sandbox`, because it sets
that itself.

Set `KILN_RENDER` to `cpu` to pin the deterministic rasterizer, or `gpu` to fail loudly rather than
degrade. `KILN_RENDER_PORT_URL` (plus `KILN_RENDER_TOKEN`) routes views to a GPU render service.

**For textured or metallic assets, run the GPU renderer** -- it ships in this repository:

```bash
cd render-service && npm install && npm start
```

It listens on `:8000`, which is where `auto` looks, so the MCP server picks it up with no further
configuration. See [`render-service/README.md`](../render-service/README.md) and the render-modes
section of the [README](../README.md).

Your agent gets seven tools and is the author: it writes the program, looks at the render, and
iterates with its own model. There is no nested agent loop and no second provider key.

## As an Agent Plugin

The repository is also a plugin package. Two manifest conventions exist as of late 2026 and Kiln
ships both, because they disagree on filenames and on the path variable:

| | Claude Code | Antigravity | OpenCode |
|---|---|---|---|
| Manifest | `.claude-plugin/plugin.json` | `plugin.json` (the portable spec, reused) | none -- no plugin manifest exists |
| MCP config | inline `mcpServers` in the manifest | `mcp_config.json` | user's `opencode.json`, under `mcp` |
| Plugin-root variable | `${CLAUDE_PLUGIN_ROOT}` | none -- absolute paths | none -- absolute paths |
| Consumed today? | yes | no -- see below | yes, via config rather than install |
| Skills | `skills/<name>/SKILL.md` | same | same files, copied into a skills directory |

A third filename, a bare `mcp.json` at the repository root, is specified by the portable Agent
Plugin spec and is read by none of the three. It used to ship here and was removed once that was
measured rather than assumed.

The skills are the same files in both cases. Installing the plugin gives you the MCP tools *and*
the five skills that teach an agent to use them well:

| Skill | When it fires |
|---|---|
| `kiln-author-asset` | create, model, or build an asset that does not exist yet |
| `kiln-refine-asset` | change an asset that already has a program, by patching it |
| `kiln-qa-asset` | wire a finished GLB into a real project and prove it works |
| `kiln-compose-scene` | lay out several finished GLBs into one scene |
| `kiln-batch-dispatch` | wire another harness up, or generate a whole library at once |

Together their front matter is 1,698 characters, about four hundred tokens of always-on context;
the bodies load only when a skill fires.

`kiln-batch-dispatch` is the odd one out: the other four are read by the agent building the asset,
and that one is read by whoever is pointing agents at the problem. It covers the rest of this page
as a procedure, the smoke test below, and the clean-room dispatcher the gallery was built with.

### Claude Code

```bash
claude plugin marketplace add matthew-kissinger/kiln
claude plugin install kiln@kiln
```

Verify with `claude mcp list` -- you want `plugin:kiln:kiln … ✔ Connected`.

Claude Code's MCP config is declared **inline in `.claude-plugin/plugin.json`** rather than in a
root `.mcp.json`. That is deliberate: `.mcp.json` at a repository root is also Claude Code's
*project*-scoped config, where `${CLAUDE_PLUGIN_ROOT}` is undefined, so shipping one would hand
every contributor who opens this repo a broken server entry and a warning. Declaring it in the
manifest works identically for installed users and leaves the repo clean for contributors.

#### Headless permissions

`claude -p` cannot prompt either, and `--permission-mode acceptEdits` is not enough on its own: it
grants writes and says nothing about MCP tools, so a run that reaches for `kiln_render` blocks on a
confirmation with no terminal attached. What comes back is a clean exit, no file, and a polite note
explaining which permissions the model would have needed.

Grant the server in a settings file the run will read -- the working directory's
`.claude/settings.json` is enough, and keeps the grant scoped to that directory:

```jsonc
// <working directory>/.claude/settings.json
{
  "permissions": {
    "allow": ["mcp__kiln", "mcp__plugin_kiln_kiln", "Read", "Write", "Edit", "Glob", "Grep"]
  }
}
```

Naming the server twice is not redundant: the tool prefix depends on how Kiln was installed, and it
is `plugin_kiln_kiln` for a plugin install and `kiln` for a plain `claude mcp add`. Allowing the
server allows its tools. `scripts/dispatch-asset.mjs` writes exactly this file into each sandbox,
which is why an unattended batch does not need `--dangerously-skip-permissions`.

### Antigravity (`agy`)

Antigravity accepts the portable `plugin.json` unchanged -- no Google-specific manifest is needed,
which is the whole point of shipping to a spec:

```bash
agy plugin validate .    # ok - 3 skills, 1 mcpServer
agy plugin install .
```

That installs the skills, and only the skills. **Getting the tools attached takes one more command**,
and the reason is worth knowing because the failure is silent and the diagnostics contradict each
other. Measured on `agy` 1.1.25: the CLI finds a plugin's `mcp_config.json` and reports it,

```
agy plugin validate .
  [ok]  .
        skills      : 3 processed
        mcpServers  : 1 processed
```

and then never merges it into the session:

```
agy mcp list
  No MCP servers configured.
```

The agent sees no tools, while `plugin validate` insists the server was processed. Uninstalling and
reinstalling the plugin does not change it, and neither does the path variable, which is why this
page no longer suggests hand-editing a config file at all. Register the server with the CLI's own
command:

```bash
agy mcp add --env KILN_RENDER=auto kiln node /absolute/path/to/kiln/dist/mcp-server.mjs
agy mcp list    # kiln  stdio  enabled  node /absolute/path/to/kiln/dist/mcp-server.mjs
```

That writes the entry into `~/.gemini/config/mcp_config.json` itself -- the file the CLI, the IDE
and Antigravity 2.0 share -- so there is no JSON to get wrong. Kiln still ships a correct
`mcp_config.json` in the plugin root, pointed at the same bundle, so that the day `agy` starts
merging it the plugin works with one command instead of two.

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
syntax -- each whitespace-separated token as an anchored regex, e.g. `command(git)` or
`command(npm run (build|lint|test))` -- parses correctly and still gets denied:

```
tool_confirmation_manager.go:188] Print mode: soft-denying tool confirmation "RunCommand" at step 2
```

Only `command(*)` passes. This is upstream
[antigravity-cli#548](https://github.com/google-antigravity/antigravity-cli/issues/548). Scope the
blast radius with `trustedWorkspaces`, a path-scoped `write_file`, and a `deny` list instead --
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
[`examples/radio-telescope.kiln.js`](../examples/radio-telescope.kiln.js) through this path -- and
six more of the gallery besides. Every program it wrote says so on its first line.

### OpenCode

OpenCode is the odd one out in a useful way: it has a skills system that reads Anthropic's
`SKILL.md` layout unchanged, and a plugin system that has nothing to do with either. OpenCode
plugins are JavaScript modules that hook into events; there is no manifest, no marketplace and no
install command that would consume this repository's `plugin.json`. So the MCP server is wired up
through config, and the skills are copied.

The MCP half goes in `~/.config/opencode/opencode.json` (global) or an `opencode.json` at a project
root. Both accept JSONC, and `OPENCODE_CONFIG` overrides the path:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "kiln": {
      "type": "local",
      "command": ["node", "/absolute/path/to/kiln/dist/mcp-server.mjs"],
      "enabled": true,
      "environment": { "KILN_RENDER": "auto" },
      "timeout": 30000
    }
  }
}
```

Four differences from the shape every other client on this page uses, all of them silent failures if
you paste someone else's config:

- the top-level key is `mcp`, not `mcpServers`
- `type` is `"local"`, not `"stdio"`
- the interpreter and its arguments are one `command` array, not `command` plus `args`
- environment variables live under `environment`, not `env`

The schema sets `additionalProperties: false`, so a leftover `args` or `env` key is rejected rather
than ignored. That is a kindness; it fails loudly at load instead of quietly at use.

`timeout` bounds the connection handshake rather than the tool calls that follow. The name invites
the other reading, so it is worth stating what was measured: at 200 ms the server does not connect
and `opencode mcp list` reports `kiln failed`, while at 1500 ms it connects and a `kiln_render` call
taking nine seconds still returns its picture. The handshake measured about 1.2 seconds against a
5000 ms default, so the default is already sufficient and an explicit value only covers a slow cold
start.

Verify:

```bash
opencode mcp list
```

You want `kiln connected` and the command line echoed back.

Then the skills. OpenCode searches `~/.config/opencode/skills/`, `~/.claude/skills/` and
`~/.agents/skills/` globally, and `.opencode/skills/`, `.claude/skills/` and `.agents/skills/` per
project. The files here need no modification:

```bash
cp -r skills/* ~/.config/opencode/skills/
```

**Raise the output cap before you judge a model by its assets.** OpenCode limits a single assistant
step to 32,000 output tokens by default, whatever the model's own ceiling is. Measured across every
step in its session store, nothing had ever exceeded that number -- not once, not by a single token
-- while the models involved publish limits between 80,000 and 943,718. A model that plans at length
before it writes hits the cap mid-sentence, and the run ends with no file and no error: four separate
runs, from three vendors, died exactly there. Lift it to the model's own published limit:

```bash
OPENCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX=128000 opencode run --auto -m opencode-go/<model> "..."
```

[`scripts/dispatch-asset.mjs`](../scripts/dispatch-asset.mjs) sets this per run, reading each model's
declared limit out of OpenCode's own model catalog so the ceiling is the provider's rather than one
picked here.

Two things to expect in a transcript. Tools are namespaced by server, so `kiln_render` is presented
as `kiln_kiln_render` -- harmless, and models locate the tools regardless, but it makes the skill
prose and the tool list look inconsistent. And OpenCode reaches many vendors' models behind
`provider/model` ids, so `opencode models` is worth reading before choosing one; asset quality
tracks the model far more than it tracks the harness.

### Codex CLI

Codex has a marketplace-shaped plugin system that reads this repository's manifest unchanged, so the
install itself is two familiar commands:

```bash
codex plugin marketplace add matthew-kissinger/kiln   # or a local path
codex plugin add kiln@kiln
```

`codex plugin list` will then show `kiln@kiln  installed, enabled`, and the whole tree is copied into
`~/.codex/plugins/cache/kiln/kiln/<version>`.

**That install does not give the agent the tools.** As of Codex 0.153.3, an installed and enabled
plugin's MCP servers are not registered: with the plugin enabled and no server entry in config, a run
asked to name its `kiln_*` tools answers `NONE`. Its skills do not arrive either. Register the server
yourself, exactly as in the MCP section above:

```toml
[mcp_servers.kiln]
command = "node"
args = ["/absolute/path/to/kiln/dist/mcp-server.mjs"]
env = { KILN_RENDER = "auto" }
```

`codex mcp list` should then show `kiln … enabled`. This is the same trap `agy` sets, and it fails
the same silent way: everything reports success and the agent simply has no tools.

Interactive `codex` asks before each tool call and works from there. `codex exec` does not ask -- it
pins the approval policy to `never`, and a `never` policy **refuses** an MCP call rather than
queueing it, so a scripted run comes back in well under a minute saying `kiln_list_primitives` was
blocked and having written nothing at all. Pass `--approve-for-me`, which routes approvals through
automatic review and selects the workspace-write sandbox itself. It is rejected alongside
`--sandbox`, because it sets that:

```bash
codex exec --approve-for-me --skip-git-repo-check --cd /abs/path/to/sandbox "..."
```

Because plugin skills do not load, a dispatched run reaches them as files: the sandbox carries a copy
of `skills/` and the brief names the skill it wants. That is enough -- the child finds and reads it --
but it is worth knowing that the skill is being read rather than installed.

Codex also rejects a model id newer than the CLI (`The 'gpt-6-astra' model requires a newer version of
Codex`), which reads like an entitlement problem and is not one. Update the CLI first.

### Hermes

Hermes is the harness that makes the portability claim worth stating. The other four are JavaScript
CLIs with broadly similar ideas about plugins; Hermes is a Python agent with its own YAML config, its
own skill store and its own provider routing, sharing no code and no convention with any of them. It
takes the same server and the same skills unchanged.

Two commands, both writing to `~/.hermes/config.yaml` (`%LOCALAPPDATA%\hermes\config.yaml` on
Windows):

```bash
hermes mcp add kiln --command node --args /absolute/path/to/kiln/dist/mcp-server.mjs --env KILN_RENDER=auto
hermes config set skills.external_dirs /absolute/path/to/kiln/skills
```

The first connects on the spot, prints the seven tools it found, and asks whether to enable them --
a prompt that wants a terminal, so pipe a `y` into it from a script. The second is the entire skills
story: Hermes does not read `.claude/skills` out of the working directory the way the other four do,
it reads a list of absolute directories out of its config, and pointing that list at this
repository's `skills/` is enough. Verify both:

```bash
hermes mcp list      # kiln   node …/dist/mcp-server.mjs   all   enabled
hermes skills list   # five kiln-* rows, source `local`
```

`-z` is the headless mode the dispatcher uses: one prompt in, the final response text out, no banner,
and tool approvals resolved without asking. There is no working-directory flag, so the sandbox is
simply the directory the process is spawned in -- which is also where Hermes reads `AGENTS.md` from,
so the clean room holds.

Hermes is a client rather than a model vendor, and it ships with no provider at all. Until it has
one, every run fails with `No inference provider configured` before the model sees a single token of
the brief, which looks exactly like the silent wiring failures this page keeps warning about.
`hermes status` lists the key slots it knows. Its own first-party login is Nous Portal:

```bash
hermes auth add nous --type oauth
hermes config set model.provider nous
hermes config set model.base_url https://inference-api.nousresearch.com/v1
hermes config set model.default <model id>
```

The last three lines are not optional after the login, and skipping them produces the most confusing
state on this page: the credential is stored and `hermes status` reports `Nous Portal  logged in`,
while `model.base_url` still points wherever it pointed before and every run dies on `No LLM provider
configured`. The catalog is public and OpenAI-shaped, so
`curl https://inference-api.nousresearch.com/v1/models` will tell you the ids, their pricing and
which ones accept tools without needing a key.

## Checking that it worked

Every wiring failure on this page is silent. A harness that cannot see the server does not say so,
and neither does one that can see it but will not grant it -- the agent simply answers as though the
tools were never mentioned, which is indistinguishable from a model that was not up to the job. So
do not infer from a bad asset that your model is weak. Check the wiring first:

```bash
bun run smoke:harness
```

It runs every CLI it finds on your PATH, and for each one sends a short brief into a throwaway
directory: call `kiln_list_primitives`, write a four-line program, validate it. Then it builds what
came back with the engine itself, because the child's own report of success is the one piece of
evidence that proves nothing.

```
agy       ok    105s  gemini-3.8-flash-high      built 12 tris
claude    ok     13s  sonnet                     built 12 tris
codex     ok     37s  (configured default)       built 12 tris
hermes    ok     97s  (configured default)       built 12 tris
opencode  ok     52s  opencode-go/glm-5.3-flash  built 12 tris
```

A harness you have not installed is skipped rather than failed. `--harness <name>` checks one,
`--model <id>` overrides the model, and a failure prints the last of the agent's output and the path
to the sandbox, which is left on disk so you can read the brief it was given and whatever it wrote.


## In-process, without MCP

If your harness is TypeScript and you would rather skip the transport, import the registry directly.
[`examples/strands-harness.ts`](../examples/strands-harness.ts) is the whole integration in about
sixty lines, including both render-port injection seams.

```ts
import { createKilnToolRegistry } from 'kiln/tools';
```

`kiln/tools` is the framework-agnostic core and imports no agent SDK, so porting to a harness that
is not Strands does not drag Strands along. Each def carries `name`, `description`, a zod
`inputSchema`, and `run`. Mapping those four fields is the entire adapter -- `src/mcp-server.ts` is
one such adapter and `src/agent/tools.ts` is another.
