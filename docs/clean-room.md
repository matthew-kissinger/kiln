# A separate workspace for assets

Install Kiln once, then create asset projects outside its installation:

```sh
node scripts/create-workspace.mjs ../my-assets --harness opencode
```

An installed local package also provides `kiln-init`; see [installation](install.md).
Choose `claude`, `codex`, `opencode`, `hermes`, or `agy`. Setup preflights the runtime,
stages the complete workspace and refuses a nonempty destination. It never writes
global configuration or copies credentials.

## What the workspace contains

The project has instructions, author/refine/QA skills, a local `kiln.mjs` launcher,
the selected harness's MCP configuration, and `.kiln/workspace.json` identifying the
installation and generated configuration. Add composition and batch skills with
`--skills compose,batch` at creation. Supporting files travel with each selected skill.

CLI and MCP share `.kiln/programs`. Engine implementation and examples stay outside
the workspace. For a refinement task, supply only the intended `.kiln.js` source.
For creation, supply a brief with no starting asset. Follow the generated `START.md`
and ask the agent to read `AGENTS.md` and the relevant skill.

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

Hermes: use `node hermes.mjs --ignore-rules`. The launcher sets a separate `HERMES_HOME`,
process cwd and terminal directory without copying credentials. Authenticate that
profile or provide credentials through the environment. Ask it explicitly to read
the workspace instructions and relevant skill. Use absolute paths in headless briefs.

Codex supports `exec --ignore-user-config --ephemeral`, per-run MCP overrides and
`--cd`, while retaining authentication. OpenCode supports project MCP configuration
and `--pure`; audit inherited instructions in its trace.

Claude supports `--strict-mcp-config`, `--mcp-config`, and `--setting-sources project`.
Its `--bare` mode skips OAuth login and requires API-key authentication; do not use it
for subscription runs. Claude remains a supported configuration route, but unavailable
credits are not a reason to retry paid calls or substitute an unrequested model.

Use scoped permissions. Setup does not disable approvals globally. Headless runs need
explicit grants for Kiln and local file operations through the harness's controls.

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
