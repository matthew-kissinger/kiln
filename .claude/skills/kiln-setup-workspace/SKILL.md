---
name: kiln-setup-workspace
description: Create and verify a Kiln asset workspace for a chosen coding-agent harness. Use before authoring when the current directory is the engine repository, an empty folder, or any project without a working kiln_workspace server.
license: MIT
---

# Set up a workspace for asset authoring

This repository is the engine. Asset authoring happens in a separate workspace, and the two are different tasks with different tools. Establish which one is being asked before running anything.

Authoring an asset needs a workspace. Changing the engine's own behaviour does not; read `AGENTS.md` at the repository root instead and stay in the checkout.

Do not author assets inside the engine checkout. The authoring skills assume a workspace, and giving a model the engine implementation and the example collection alongside its task changes what it produces.

## Create the workspace

Choose an absolute path to an empty directory outside the checkout.

```bash
node scripts/create-workspace.mjs /absolute/empty-workspace --harness claude
```

From an installed package, the equivalent is `kiln-init /absolute/empty-workspace --harness claude`. Author, refine and QA skills are installed by default; `--skills compose,batch` adds the optional scene-composition and trial-dispatch workflows. Ask the user which harness they use rather than assuming; the choice writes different configuration and cannot be changed afterwards without a fresh workspace.

| `--harness` | Launch from the workspace |
| --- | --- |
| `claude` | `claude` |
| `codex` | `codex` |
| `opencode` | `opencode` |
| `agy` | `node agy.mjs` |
| `hermes` | `node hermes.mjs --ignore-rules` |

Antigravity and Hermes get a generated launcher because each needs arguments or a separate profile that the bare command does not supply. Hermes authenticates in its own profile; setup copies no credentials.

## Verify the loadout before authoring

Accept the project and MCP trust prompts, then confirm the server is actually live rather than assuming it from configuration. Call `kiln_list_primitives` on `kiln_workspace` with `capabilities: true`; it returns the runtime, source, export and camera contract and proves the tools resolved. A server named `kiln` from a global installation is a different thing. Do not substitute it silently; report the setup problem instead.

Confirm the installed skills are readable at `skills/` in the workspace, and read the relevant one from there rather than a global copy. Whether the harness also registers them natively depends on the harness.

## Relocation and repair

Moving the workspace or the engine installation breaks the generated absolute paths, and so does replacing the Node that setup validated.

```bash
node /current/kiln/scripts/create-workspace.mjs /absolute/empty-workspace --repair
```

Repair rewrites generated runtime paths only. It preserves copied skills, saved revisions and assets, refuses configuration that was edited by hand, and does not upgrade the skills. To evaluate a different engine version, create a fresh workspace from that version so instructions and tools match.

## What isolation means

A separate workspace limits task context. It is not an operating-system sandbox, and it is not a git repository. User-level instructions, memory, authentication and filesystem permissions still apply. For comparing harnesses or models, read `skills/kiln-batch-dispatch/references/clean-room-evaluation.md` in the engine checkout, which covers recording inherited context and reporting trials.
