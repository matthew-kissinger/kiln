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

## Start the GPU render service

Setup asks for render mode `auto`: a GPU service when one answers on port 8000, CPU views otherwise. CPU views are honest about silhouette, proportion and contact and say nothing about colour, metalness or roughness, so without the service no render can confirm a material.

Offer to run its install. It lives in the engine installation rather than the workspace, and it is a separate package with a native dependency, so its install is its own step and is not covered by installing the engine.

```bash
cd render-service && npm install
```

That is the whole setup. Once installed, the MCP server starts the service on the first view that needs PBR shading and stops it when the session ends, so there is no terminal to leave running and no ordering to get right. Add `npm start` only when the service should outlive a single session, such as one GPU shared by a batch of dispatched agents. If the machine has no usable GPU, report that and continue on CPU views; it is a limit to state, not a setup failure.

## Verify the loadout before authoring

Accept the project and MCP trust prompts, then confirm the server is actually live rather than assuming it from configuration. Call `kiln_list_primitives` on `kiln_workspace` with `capabilities: true`; it returns the runtime, source, export and camera contract and proves the tools resolved. A server named `kiln` from a global installation is a different thing. Do not substitute it silently; report the setup problem instead.

Confirm the installed skills are readable at `skills/` in the workspace, and read the relevant one from there rather than a global copy. Whether the harness also registers them natively depends on the harness.

Report the rest of the session's loadout at the same time. Skills and MCP servers from user-level configuration load here too, and an authoring session carrying a dozen unrelated skills spends context and invites the wrong tool. List whatever is registered that has nothing to do with this task and let the user decide whether to narrow it. Do not change their global configuration.

## Wiring a workspace by hand

`--harness` covers claude, codex, opencode, hermes, agy, copilot and cursor-agent. For any other harness, or an engine installed as a package elsewhere, assemble the same loadout in an empty directory: register the installation's `dist/mcp-server.mjs` as a stdio MCP server named `kiln_workspace`, give it `KILN_PROGRAM_STORE` pointing at `.kiln/programs` inside that directory plus `KILN_RENDER=auto`, and copy the skills you need from `skills/` into both `.claude/skills/` and `.agents/skills/` there.

A hand-wired directory carries no manifest, so it gets no runtime preflight and `--repair` cannot correct its paths later. Prefer the generated workspace wherever the harness is supported, and tell the user which of the two they have.

## Relocation and repair

Moving the workspace or the engine installation breaks the generated absolute paths, and so does replacing the Node that setup validated.

```bash
node /current/kiln/scripts/create-workspace.mjs /absolute/empty-workspace --repair
```

Repair rewrites generated runtime paths only. It preserves copied skills, saved revisions and assets, refuses configuration that was edited by hand, and does not upgrade the skills. To evaluate a different engine version, create a fresh workspace from that version so instructions and tools match.

## What isolation means

A separate workspace limits task context. It is not an operating-system sandbox, and it is not a git repository. User-level instructions, memory, authentication and filesystem permissions still apply. For comparing harnesses or models, read `skills/kiln-batch-dispatch/references/clean-room-evaluation.md` in the engine checkout, which covers recording inherited context and reporting trials.
