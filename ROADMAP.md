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

Ordered by whether someone arriving at the repository hits it on the documented path.

### Blocking a documented path

| # | Item | State |
|---|---|---|
| S1 | **A generated codex workspace cannot see Kiln.** `managedFiles` writes `.codex/config.toml`, and codex has no project-local config mechanism at all -- every source is `$CODEX_HOME`-rooted. The README lists `codex` as a supported `--harness` | Fix known and verified: a generated `codex.mjs` launcher passing `-c` overrides per invocation. See ledger 17.9 |
| S2 | **A generated hermes workspace cannot run.** Its launcher redirects `HERMES_HOME` so the workspace config can supply MCP servers and skills; the same redirect discards the provider selection and API key, and the run dies before the first model call | Needs hermes' equivalent of per-invocation injection. The rule from S1 applies: add configuration to the invocation, never replace the home that holds credentials |

Both were invisible to the wiring smoke, which invokes each CLI directly and never touches
the generated launcher. Whatever fixes them should come with a check that exercises the
launcher.

### Costs an agent revisions

| # | Item | State |
|---|---|---|
| S3 | `arrayLinear` silently drops the source's rotation; `arrayRadial` orbits the world origin rather than a local centre. Two models hit these independently, and they are inconsistent with each other -- the radial helper sets a rotation on every copy, the linear one carries none | Confirmed in `src/ops.ts`; no fix attempted |
| S4 | `kiln_present` puts up to 16 MiB of base64 files in `_meta` | Open with the shape decided: the widget calls `resources/read` itself. Ledger 16.4 |
| S5 | A bare `kiln_list_primitives` returns names, not signatures, and models guess the JS-conventional `createPart(parent, {…})` from it | Mitigated in the smoke brief only. Whether the overview itself should lead with a signature is undecided |

### Polish

| # | Item | State |
|---|---|---|
| S6 | The render service binds `*:8000` and warns `RENDER_SERVICE_TOKEN unset — POST routes are UNAUTHENTICATED` | Default worth revisiting before anyone runs it on a shared machine |
| S7 | `kiln render --render auto` falls back to CPU rather than starting the GPU service, though the MCP server instructions say it is "started on demand" | The two surfaces behave differently; the sentence is true of one of them |
| S8 | A server named `kiln` may be a different installation. Two live examples on the development machine: a stale 0.6.0 package in `~/.cursor/mcp.json`, and `codex_apps`' `kiln_local_*` | Documented in `docs/harnesses.md`; no code change |

## Dependencies

| Family | State |
|---|---|
| `three` r186 + `@types/three` 0.186.0 | **Taken.** The types blocker recorded in earlier plans has resolved; both are pinned at 0.186.0 |
| `webgpu` 0.6.0 to 0.6.1 in `render-service/` | **Unblocked.** It was gated on the owner's GPU smoke, and that smoke now passes: `dawn-vulkan` on a GTX 1660 Ti returned `materialFaithful: true` on 13 September 2026 |
| `zod` 4.6.2 to 4.6.4 | Patch, safe, not taken |
| `ai` 6→7, `@ai-sdk/provider` 3→4, `@openrouter/ai-sdk-provider` 2→3, `openai` 6→7 | **Still genuinely blocked, and not by money.** `@strands-agents/sdk@1.17.0` peer-requires `@ai-sdk/provider: ^3.0.0`, while `@openrouter/ai-sdk-provider@3` requires `ai: ^7`, which depends on provider 4. The conflict is structural and upstream |
| SEP-2640 / `skill://` resources | Deferred by decision; see ledger 7.12 and 14.1 |

## Not yet run

Tier 2 dogfooding -- an agent given only a repository location, which has to clone, build,
create a workspace, register the server for a harness it chooses, and only then author,
optionally launching its own headless agents to do it. It is documented in
[dogfooding](docs/dogfooding.md) and has never been executed. It is the tier most likely to
find documentation defects rather than code ones, and running it cleanly needs one harness
isolated from any user-level registration.
