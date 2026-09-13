# Kiln roadmap

The active plan is [Engine and OSS experience](docs/plans/2026-09-05-engine-and-oss-experience.md), accepted in direction on 2026-09-05. It covers engine correctness, more expressive geometry, camera control, retained-program workflows, packaging, model evaluation, and a redesigned README and website.

The delivery order is:

1. Establish the baseline and fix geometry ownership, camera framing, export diagnostics and discovery.
2. Add shared part-relative cameras, custom surfaces, deformation, profile sweeps and lofts.
3. Preserve Boolean attributes, reuse evaluated artifacts, and ship a verified local setup.
4. Evaluate the workflow across current models and redesign the README/site around stronger examples.
5. Resolve bounded experiments in SDFs, beveling, shelling, remeshing and reusable parts.
6. Update and package the skills, dogfood the integrated result with Astra, Gemini through Antigravity (`agy`), and Meta Muse Spark through OpenCode, fix the findings, and retest before delivering the local release candidate.

Final dogfooding uses fresh workspaces and conversations with the candidate's skills and runtime. Every required route must complete authoring, targeted inspection, a source-reference edit and export. Earlier pilot runs or substitute models do not satisfy this gate.

These are planned capabilities, not a list of features already shipped. Task dependencies, acceptance criteria and completion checklists live in the linked plan.

## Where step 6 stands · 13 September 2026

Step 6 has run, wider than planned: seven harnesses rather than three. Tier 0 (can a harness
reach the tools) passes 7/7. Tier 1 (one plain sentence, agent finds the skill unaided)
produced a saved asset on 6 of 7. Method and tiers are in
[dogfooding](docs/dogfooding.md); per-harness install, flags and MCP config locations are in
[headless harnesses](docs/harnesses.md); the findings and their evidence are Phase 17 of the
[engine ledger](docs/plans/repo-size-and-r2-migration-2026-09-10.md).

What that run changed is the shape of the remaining work: the defects that matter for a
newcomer are in **setup**, not in the engine.

## Stabilisation queue

Closed 2026-09-13. Ordered as it was worked: whatever broke a documented path first.

| # | Item | Outcome |
|---|---|---|
| S1 | A generated codex workspace could not see Kiln -- `.codex/config.toml` was inert, because codex reads no project-local config | **Fixed.** A generated `codex.mjs` passes `-c` overrides per invocation. Verified by authoring through it: the program landed in the workspace store, which only the override could do, while `$CODEX_HOME` and its auth were untouched. `START.md` also stopped telling codex users to run the bare CLI |
| S2 | A generated hermes workspace could not reach a model | **Fixed, and the diagnosis was wrong at first.** There is no provider key: `~/.hermes/.env` holds tool toggles, and the provider is a subscription OAuth. `HERMES_HOME` resolves the config path *and* the credential path, so the redirect left `model.default` and `model.provider` unset. The launcher no longer redirects it; `--in` supplies the project directory and the program store rides the environment into the MCP child. Verified end to end on a real model call. `--skills` turned out to take names rather than a path, and `--ignore-rules` was suppressing the workspace's own AGENTS.md |
| S3 | `arrayLinear` dropped the source's rotation; `arrayRadial` could orbit only the parent origin | **Both addressed, as two different things.** Dropping rotation and scale was a defect -- copies now carry both. Orbiting the parent origin was documented behaviour with no way around it, so `arrayRadial` gained an optional `center`. The array helpers had no unit tests at all; they have seven now |
| S5 | A bare `kiln_list_primitives` returned names, so models guessed `createPart(parent, {...})` | **Fixed.** The overview now carries the exact signatures of the two helpers every program calls, read from the catalog so it cannot drift from the detail view |
| S6 | The render service bound `*:8000` unauthenticated | **Fixed with a policy, not a flag.** The bind address decides whether auth is required: loopback is free, anything wider requires `RENDER_SERVICE_TOKEN` or refuses to boot. `RENDER_SERVICE_ALLOW_UNAUTHENTICATED=1` is the explicit waiver. All three paths verified on hardware, including that a LAN address is now refused by default |
| S7 | `--render auto` fell back to CPU rather than starting the GPU service | **Split, because only half was a defect.** `auto` not spawning is correct and stays -- a one-shot sheet should not pay a GPU boot. `--render gpu` erroring while a shippable renderer sat one spawn away was the defect; it now starts one. Verified from cold: a GPU render, not a throw. The workspace guide's claim about restarting a session was also wrong about *why*, and now states the one case where it is true |
| S8 | A server named `kiln` may be a different installation | **Both instances were stale local state, not repo defects** -- an extracted 0.6.0 package in `~/.cursor/mcp.json`, and a cached tool namespace in `~/.codex/cache/`. What the repo lacked was a way to *check*: `kiln_list_primitives {capabilities:true}` now reports `engine.version` and `engine.installUrl`, so the workspace guide's "do not substitute it silently" has something behind it |
| S4 | `kiln_present` puts up to 16 MiB of base64 in `_meta` | **Deferred to the next cycle** by decision. The shape is settled and the MCP Apps spec confirms it: a UI iframe may call `resources/read`, so the widget can fetch what the manifest names. Today's over-limit behaviour is a graceful refusal, not a failure |

The structural fix matters more than any single row: both S1 and S2 were invisible because
`harness-smoke.mjs` invokes each CLI directly and never touches the generated launcher. A test now
asserts the launcher's shape -- that it registers per invocation and never relocates the home holding
credentials -- so the next harness whose config mechanism we guess at fails loudly.

## Dependencies

| Family | State |
|---|---|
| `three` r186 + `@types/three` 0.186.0 | **Taken.** The types blocker recorded in earlier plans has resolved; both are pinned at 0.186.0 |
| `webgpu` 0.6.0 to 0.6.1 in `render-service/` | **Taken** 2026-09-13, after the GPU smoke it was gated on passed. Re-verified on the same hardware: `dawn-vulkan` on a GTX 1660 Ti boots and renders through the engine on 0.6.1 |
| `zod` 4.6.2 to 4.6.4 | **Taken** 2026-09-13 |
| `ai` 6→7, `@ai-sdk/provider` 3→4, `@openrouter/ai-sdk-provider` 2→3, `openai` 6→7 | **Still genuinely blocked, and not by money.** `@strands-agents/sdk@1.17.0` peer-requires `@ai-sdk/provider: ^3.0.0`, while `@openrouter/ai-sdk-provider@3` requires `ai: ^7`, which depends on provider 4. The conflict is structural and upstream |
| SEP-2640 / `skill://` resources | Deferred by decision; see ledger 7.12 and 14.1 |

## Not yet run

Tier 2 dogfooding -- an agent given only a repository location, which has to clone, build,
create a workspace, register the server for a harness it chooses, and only then author,
optionally launching its own headless agents to do it. It is documented in
[dogfooding](docs/dogfooding.md) and has never been executed. It is the tier most likely to
find documentation defects rather than code ones, and running it cleanly needs one harness
isolated from any user-level registration.
