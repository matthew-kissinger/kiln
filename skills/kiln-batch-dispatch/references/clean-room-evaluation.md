# Clean-room evaluation

With the Kiln package installed, create a fresh directory outside the engine checkout:

```bash
kiln-init /absolute/empty-workspace --harness opencode --skills batch
```

Supported harness names are `claude`, `codex`, `opencode`, `hermes`, and `agy`. Author, refine, and QA skills are installed by default; `--skills compose,batch` adds optional workflows. Read the generated project start instructions and run its local `node kiln.mjs` launcher.

From an engine source checkout, the equivalent setup command is:

```bash
node scripts/create-workspace.mjs /absolute/empty-workspace --harness opencode --skills batch
```

The project contains its copied skills and their resources. Keep evaluation notes and output there; do not give the model the engine implementation or prior examples unless that is the comparison being tested.

## What isolation means

A clean project limits task context. It is not an operating-system sandbox. Record inherited global instructions, tools, memory, authentication, and filesystem permissions without copying secrets into receipts. Do not alter user-wide configuration to make a run appear isolated. Use a separate Hermes profile when required by its launcher; give headless harnesses absolute project and artifact paths.

Use a new workspace when testing changed skills. `--repair` repairs generated integration files while preserving existing copied skills; it is not a way to refresh a candidate silently.

Hash the package and every installed skill resource recursively, not only `SKILL.md`. Keep the exact model identifier and harness version beside the run. When a provider reports a resolved model identity, retain it as well.

## A small but complete trial

Use a brief with three recognizable parts and one requested revision. Save the first `programRef`; render, source-view, source-edit, and inspect by reference. Export the revised source and GLB. Compare unrelated source text before and after, and verify the changed part in a targeted image. A source handle proves revision reuse; it does not by itself prove a render-cache hit.

Check the actual transcript for tool images received by the model. Metadata that labels a model as vision-capable is insufficient evidence. Keep camera framing and image count comparable between candidates.

Repository scripts such as `scripts/dispatch-asset.mjs`, `scripts/check-vision.mjs`, and harness smoke commands are optional developer tools in the engine checkout, not files promised in an installed authoring project. Provider-backed runs can incur usage. Use them only within the requested run and budget.

Report completed, interrupted, and failed trials separately. Keep provider availability, image forwarding, tool correctness, source reuse, exported geometry, and visual quality as distinct findings. Do not turn a quota interruption into an engine failure or count an unreviewed partial image as a completed result.

For Antigravity, use the generated `node agy.mjs` launcher. Print mode disables
automatic slash-command and skill expansion. In the brief, require the project skill
copies and `kiln_workspace` server; use absolute task-file paths. Before asset work,
call that server's `kiln_list_primitives` with `capabilities: true` and retain the
runtime/store receipt. Global plugins may still be available: audit which server
and skill paths were actually used, rather than trusting the final message.
