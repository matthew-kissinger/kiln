# Running a pilot cell

The experimental host is `scripts/evaluation/server.ts`. It exposes the eight
public source-reference tools with a condition adapter. It starts no model and
makes no provider request. Do not use this adapter for Q1: final acceptance uses
the installed shipping package and shipping skills.

Create a config outside the clean-room project, with an output directory that
does not exist yet. Its parent directory must already exist:

```json
{
  "runId": "duct-astra-A-01",
  "condition": "A",
  "outputDirectory": "ABSOLUTE_PATH_TO_NEW_RESULT_DIRECTORY",
  "programStoreDirectory": "ABSOLUTE_WORKSPACE_PATH/.kiln/programs",
  "authorization": "PATH_OR_ID_OF_RECORDED_RUN_AND_SPEND_AUTHORIZATION",
  "maxToolCalls": 30,
  "maxImageCells": 48,
  "maxCellSide": 512,
  "maxWallSeconds": 900
}
```

Configure the clean-room harness's project-local MCP entry to execute:

```sh
bun ABSOLUTE_REPO_PATH/scripts/evaluation/server.ts ABSOLUTE_RUN_CONFIG.json
```

Use the same `.kiln/programs` path as the workspace CLI so source export by reference works.

Keep the host/config/results outside the model's allowed project context. The
project receives only the chosen brief, the common guide, and its condition guide.
The MCP command necessarily identifies the installed host path; this is not an
OS security boundary. Record the harness's actual filesystem restrictions.

Use `common-guide.md` in every pilot cell. Add `condition-A.md` for A,
`condition-B.md` for B, or `condition-C.md` for C. **Do not copy the shipping skill
bundle into A/B**: it teaches helpers deliberately unavailable in those cells.
Keep the supplied text/hash in the run record. These short experimental packets
control exposure; they do not replace or certify the shipping skills.

The host enforces tool-call, image-cell, per-cell-size and tool wall-time limits,
reserves image allowance before concurrent work, and stores the actual image
bytes delivered as MCP blocks. It retains arguments, text results, errors, image
hashes and counters in `events.jsonl`, source revisions in the configured project store, and its
condition/environment record in `host.json`. Files may include full model source;
retain them as evaluation evidence and review before any public release.

The external dispatcher must also stop the **model session** at the authorized
wall/spend limit. A server that rejects further tools cannot stop a harness from
continuing to generate text or incur provider usage. Do not dispatch until that
outer bound is configured. The host's run config is not a purchase authorization.

## Controlled differences and limits

- All pilot cells use CPU images in this host. This holds feedback conditions
  constant, but cannot establish PBR or texture quality. Material-faithful
  showcase review and Q1 GPU evidence are separate.
- A/B source admission rejects identifiers naming the frozen new geometry
  helpers, including aliases. Comments and string literals do not trigger it.
  The policy is conservative, including locally declared identifiers with those
  names; record such a rejection rather than treating it as a geometry failure.
- All cells use a fresh injected evaluator. Evaluated-build caching is disabled
  by this experimental adapter because it supplies no persistent evaluator cache
  identity. Capture reuse may still occur within a cell. This pilot evaluates
  authoring affordances, not build-cache speed. Q1 tests the shipping cache path.
- The B catalog uses the same signatures/examples but filters new helpers before
  pagination. C uses shipping discovery. Retain adapter and schema hashes so the
  difference is reviewable.
- An emitted image establishes transport delivery. Use harness traces to verify
  model-side attachment/consumption; otherwise record that field as unknown.

Offline checks:

```sh
bun test scripts/evaluation
```

The stdio test lists the advertised tools, obtains a real rendered image, checks
that a fourth call is rejected under a three-call cap, including an SDK-rejected invalid request, and verifies retained image
evidence. It makes no model call.

Validate final exported source against `assertConditionSource` as well as the MCP trace. A model that bypasses the host through another execution path invalidates the cell; a prompt restriction is not an OS sandbox. Retain the shared source store with the run evidence.

For a same-conversation follow-up, the observer may restart with `allowResume:true`.
It accepts only the identical recorded run configuration and restores the original
wall deadline and consumed call/image counters. The dispatcher runs each phase
sequentially; this is not a shared server for concurrent harness sessions. A new
condition or attempt always gets a new output directory and program store.

`scripts/evaluation/dispatch.mjs FROZEN_DIRECTORY --run-authorized-pilot` is the
local Windows experiment dispatcher, not a user installation command. It requires
an already recorded authorization, exact extracted package, frozen experiment
host and protocol, and the verified local Codex/OpenCode executable paths. It
runs the two declared route queues, captures each invocation and transcript,
terminates the owned process tree at the original cell deadline, and sends only
the fixed follow-up after the first source submission. It does not retry a cell.
The observer enforces Kiln budgets; ordinary harness shell activity remains in
the trace and must be reviewed for condition bypass before accepting a result.
