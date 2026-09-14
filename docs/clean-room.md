# A separate workspace for assets

Install Kiln once, then create asset projects outside its installation:

```sh
node scripts/create-workspace.mjs ../my-assets --harness opencode
```

An installed local package also provides `kiln-init`; see [installation](install.md).
Choose `claude`, `codex`, `opencode`, `hermes`, `agy`, `copilot`, or `cursor-agent`. Setup preflights the runtime,
stages the complete workspace and refuses a nonempty destination. It never writes
global configuration or copies credentials.

## What the workspace contains

The project has instructions, author/refine/QA skills, a local `kiln.mjs` launcher,
the selected harness's MCP configuration, and `.kiln/workspace.json` identifying the
installation and generated configuration. Add composition and batch skills with
`--skills compose,batch` at creation. Supporting files travel with each selected skill.

OpenCode setup registers the project's existing `skills/` folder through
`skills.paths` in `opencode.json`, so its native skill tool can discover the copies.
The same files remain available for explicit reads; repair updates the registered
path after relocation and preserves edited skills and supporting references.

CLI and MCP share `.kiln/programs`. Engine implementation and examples stay outside
the workspace. For a refinement task, supply only the intended `.kiln.js` source.
For creation, supply a brief with no starting asset. Follow the generated `START.md`
and ask the agent to read `AGENTS.md` and the relevant skill.

If the brief depends on texture, roughness, metalness, glass or other material evidence,
start the optional [GPU render service](rendering.md#running-the-gpu-renderer) before the
first authoring session. CPU views are sufficient for shape and contact, but not materials.
The MCP server probes renderer availability when its session starts; installing the renderer
afterward requires restarting that agent session before it can use the new service.

If paths move, use the [repair command](install.md#move-or-repair-an-installation).
Repair preserves instruction/skill copies; new evaluations require fresh workspaces,
not repaired old instructions.

## Normal use and evaluation isolation

A separate directory avoids putting the engine implementation into the agent's task
context. It is not a filesystem security sandbox. Authentication, managed policy and
user-level instructions can still apply; broad shell access can reach other folders.
Normal use need not remove a user's useful preferences.

For a clean-room evaluation, start a new conversation and forbid reading engine source,
example collections, prior runs or unrelated directories. Retain and audit tool traces.
An unobserved boundary is recorded as unknown, not promoted to a clean-room guarantee.
Operating-system isolation, if used, is a separate host configuration and claim.

## Harness launch details

Antigravity: launch `node agy.mjs`. It supplies the absolute project directory and
adds `--disable-slash-commands` for print mode to avoid automatic expansion of an
older global skill. For example:

```sh
node agy.mjs --model MODEL --print "Read AGENTS.md and skills/kiln-author-asset/SKILL.md. Use only kiln_workspace MCP tools. Read the task at ABSOLUTE_BRIEF_PATH."
```

Pass absolute brief and output paths in headless runs. Project MCP configuration is
[`.agents/mcp_config.json`](https://antigravity.google/docs/cli/mcp/). User-level
plugins can remain available, so verify the actual server name and local skill paths
in the trace. A server named `kiln` may point to a different installation. Ask first
for `kiln_workspace/kiln_list_primitives` with `capabilities: true` and verify its
runtime and source store. The standalone `agy mcp list` view is not proof of which
project tools the conversation used.

For an interactive Antigravity recording, complete first-run onboarding first.
Open `/mcp` and wait for the project server's connected status before the asset
prompt. The September 8 Hub print probe worked immediately, while the first TUI
attempt lacked model-visible MCP tools. Restarting after onboarding and checking
the native manager restored access without changing the generated configuration.
The fresh corrected battleship creation and same-conversation roof-color revision
then completed through native MCP, with saved lineage and validated exports.
This is an assisted readiness retest; retain the failed first take separately.

Hermes: register `kiln_workspace` once with the exact command printed in `START.md`, then
use `node hermes.mjs`. The launcher deliberately does **not** replace `HERMES_HOME`, because
that single home contains the operator's provider selection, MCP registration and credentials.
It supplies the workspace directory and program store per invocation. For a headless run:

```sh
node hermes.mjs -z \
  'Read AGENTS.md and the project skills, then create an ornate astronomical clock.'
```

Do not add `--ignore-rules` unless you intend to suppress this workspace's own `AGENTS.md`.
Use absolute paths when a headless prompt must refer to a file.

Codex supports `exec --ignore-user-config --ephemeral`, per-run MCP overrides and
`--cd`, while retaining authentication.

For OpenCode, finish setup, change into the generated asset directory, then launch
a fresh session as described in its `START.md`. Do not assume a session that created
the workspace has loaded that workspace's MCP configuration. In our OpenCode 1.18.27
test, the original setup session used CLI commands; a fresh session in `my-assets`
loaded the native Kiln tools and completed a requested revision. Check actual tool
calls before describing a run as native MCP. `--pure` disables external plugins;
do not use it as a general isolation switch for a workflow that needs those plugins.
Audit inherited instructions separately.

For headless Codex evaluation, use the generated launcher. Codex has no project-local
configuration; `.codex/config.toml` records the intended server for a human reader, while
`codex.mjs` supplies the server and program store through per-run overrides:

```sh
node codex.mjs --ignore-user-config --ephemeral --approve-for-me \
  'Read AGENTS.md and the project skills, then create an articulated survey drone.'
```

This retains authentication while ignoring unrelated user configuration, writes no session
rollout with `--ephemeral`, and leaves the workspace-scoped MCP override intact. The launcher
also supplies `--cd` and `--skip-git-repo-check`; running bare `codex` in the workspace does
not load Kiln. Verify actual native calls in the conversation trace before starting asset work.

Claude supports `--strict-mcp-config`, `--mcp-config`, and `--setting-sources project`.
Its `--bare` mode skips OAuth login and requires API-key authentication; do not use it
for subscription runs. A complete project-only headless invocation is:

```sh
claude -p --strict-mcp-config --mcp-config .mcp.json \
  --setting-sources project --autocompact auto \
  --permission-mode acceptEdits \
  --allowedTools 'mcp__kiln_workspace__*,Read,Write,Edit,Glob,Grep,Bash(node kiln.mjs *)' \
  'Read AGENTS.md and the project skills, then create a derelict signal tower.'
```

For a confirmed context window larger than 333k, `--autocompact 333k` is a useful
evaluation ceiling. Otherwise keep `auto`. Claude remains a supported configuration route,
but unavailable credits are not a reason to retry paid calls or substitute an unrequested model.

Use scoped permissions. Setup does not disable approvals globally. Headless runs need
explicit grants for Kiln and local file operations through the harness's controls.

For every harness, keep automatic compaction enabled and have long-running agents maintain
the `KILN_PROGRESS.md` handoff described in the generated `AGENTS.md`. The default behavior,
manual commands, public controls and the conditional 333k evaluation profile are in
[headless harnesses](harnesses.md#long-running-sessions-and-compaction). Opaque harnesses
keep their native policy; Kiln does not guess at a hidden threshold.

## Record a reproducible run

Use the same brief and a fresh directory/conversation for each attempt. Record:

- Engine candidate and CLI/MCP hashes; copied skill/resource and brief hashes.
- Harness version, requested model ID, and actual resolved model identity.
- Starting source, inherited context, permitted directories, and trace audit result.
- Actual tool calls, image delivery, camera/material fidelity and errors.
- Source/artifact hashes, requested edit preservation, elapsed time and measured cost.
- Human intervention and any departure from the procedure.

Check saved files and tool results independently of the model's final response. A
successful render is not a visual-quality score. CPU images support geometry review;
they do not establish PBR material fidelity.

Required current evaluation routes are Astra, Gemini through Antigravity, and Meta
Muse Spark through OpenCode. Resolve exact IDs at run time. Do not substitute older
models or count a quota error as a completed route. Omen can provide an additional
comparison when requested and available.

After implementation, install the final package into fresh workspaces with current
skills, dogfood each required route, fix findings, rebuild and retest affected routes.
A shared tool/skill change requires the common workflow to be rerun across the routes
it affects. Initial runs against pre-fix instructions do not establish completion.
Record unavailable or failing required routes as outstanding.

Sources: [Claude CLI](https://code.claude.com/docs/en/cli-usage),
[Codex non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode),
[Codex MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli),
[OpenCode configuration](https://dev.opencode.ai/docs/config).
