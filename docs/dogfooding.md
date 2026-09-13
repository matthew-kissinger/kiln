# Dogfooding

Three tiers, and they answer different questions. Running the cheap one does not tell you
what the expensive one would have. Per-harness install, flags and MCP config locations are in
[headless harnesses](harnesses.md).

| tier | question it answers | cost |
| --- | --- | --- |
| 0 · wiring smoke | can this harness reach the tools at all? | one short turn |
| 1 · plain-prompt authoring | can an agent make an asset the way a user would? | a real authoring run |
| 2 · blind end-to-end | can an agent set Kiln up from nothing and then use it? | a clone, a build, and nested runs |

## Tier 0 — wiring smoke

```bash
bun run smoke:harness                       # every CLI on PATH
bun run smoke:harness -- --harness copilot  # one
```

**What Tier 0 cannot see: the generated launcher.** It invokes each CLI directly, so a harness
whose workspace reaches it only through `node <harness>.mjs` passes this tier while being
completely unusable from a real workspace. Two did, for months. `workspace-bootstrap.test.ts`
now covers the launcher's shape, and Tier 1 is what exercises it for real -- run Tier 1 from a
generated workspace using the command its own `START.md` names, never the bare CLI.

This is a **wiring probe, not a dogfood.** It names a tool on purpose, because its whole job
is to prove that a named tool is reachable and that the engine accepts what came back. Passing
it means the plumbing works. It says nothing about whether an agent can author anything.

## Tier 1 — plain-prompt authoring

**The prompt is the brief, and the brief is one sentence.** Create a workspace for the
harness, then ask for an asset the way a user would:

```bash
node scripts/create-workspace.mjs /tmp/dogfood-opencode --harness opencode
cd /tmp/dogfood-opencode
opencode run --auto -m PROVIDER/MODEL "Generate a weathered dockside crane asset."
```

The workspace already registers the skills and the MCP server and writes an AGENTS.md that
points at them, so the agent discovers `kiln-author-asset` and invokes it itself. That
discovery is part of what is being tested. Four rules, each of which came from a run that
failed for a reason unrelated to Kiln:

- **Never name a tool in the prompt.** Copilot namespaces MCP tools as `<server>-<tool>`, so
  an agent told to call `kiln_list_primitives` finds nothing by that literal name and
  correctly reports the tools missing -- while listing its own tools shows all thirteen as
  `kiln_workspace-kiln_*`. A prompt that names a tool is a prompt that only runs on some
  harnesses.
- **Never put the brief in a file.** Telling an agent to read `BRIEF.md` adds two failure
  modes that have nothing to do with Kiln: the agent needs working file tools, and its working
  directory has to be right. Pass the prompt as the prompt.
- **Do not script the steps.** A step list measures whether the model can follow a step list.
  It also actively suppresses skill use: a prompt ending "and nothing else" stops an agent from
  reading the skill that would have told it the real API.
- **Ask for the subject, not the API.** "A weathered dockside crane with rusted steel and
  frayed rope" gets textures because the subject needs them. "Call `pbrMaterial`" gets a
  material call and an asset nobody asked for.

Judge the result against the engine, never the agent's own report. Rebuild the saved source
independently, and read `viewFidelity` before saying anything about material: a geometry-flat
CPU view is evidence about shape only.

## Tier 2 — blind end-to-end

Tier 1 starts from a workspace this repository generated. Tier 2 does not, and that is the
point: it tests the path a new user actually walks, where the setup instructions are part of
the software under test.

Give an agent the repository location and a goal, and nothing else. It has to clone or copy the
checkout, install dependencies, build the runtime, create a workspace, register the MCP server
for whichever harness it chose, verify the tools came up, and only then author. A run that
fails here has usually found a documentation defect rather than an engine defect -- which is a
class of bug no tier-0 or tier-1 run can reach, because both are handed a working
configuration.

The fuller form nests: the blind agent launches its **own** headless agents to do the
authoring, so the thing under test is Kiln's setup surface as consumed by an agent that then
has to hand it to another agent. `kiln-setup-workspace` is the skill that path is supposed to
follow, and whether the agent finds it unaided is part of the result.

Record for every tier: the exact harness version and model id, whether images actually reached
the model, what the agent inherited (user-level skills, MCP servers, memory, permissions), and
the transcript. A quota or authentication failure is not a measure of asset quality, and an
interrupted run is not a completed asset.

## Harness checks · 5 September 2026

These checks exercise source reuse across tool calls. They are small integration tests, not a model-quality ranking.

### Procedure

Each run received a new directory outside the engine checkout, the five Kiln skills, a task brief, a local CLI launcher, and a project MCP configuration. Refinement runs also received one well program. No example library or engine implementation was supplied as task context.

The task was to change `POST_W` from `0.13` to `0.18`, preserve all other source, render the original, find the constant through `kiln_source`, edit by `programRef`, inspect a post, and export the revision. We compared exported bytes against the exact expected replacement and recorded MCP requests and responses with [observe-mcp.mjs](../scripts/observe-mcp.mjs).

The directory separation is not a security sandbox. Provider authentication remained available; harness-managed instructions and permissions could still apply. An earlier Antigravity attempt searched outside the task directory while resolving a relative brief, so it was excluded. The successful rerun used a new explicit project, added directory, and absolute paths.

### Results

| Harness and selected model | Time | Exact source edit | Qualification |
|---|---:|---|---|
| OpenCode 1.18.27 · Muse Spark 1.3 Contributor | 48 s | Pass | Five Kiln calls, all by reference; full requested sequence completed |
| OpenCode 1.18.27 · Omen Alpha | — | Not run successfully | Provider rejected the request at its weekly usage limit; no Kiln calls |
| Antigravity · Gemini 3.8 Flash High | 137 s | Pass | Four Kiln calls, all by reference; explicit project and paths required |
| Hermes · Qwen 3.5 35B A3B | 92 s | Pass | Compatibility check only; seven calls exceeded the six-call brief |
| OpenCode 1.18.27 · Gemini 3.1 Flash Lite | 36 s | Pass | Compatibility check only; omitted the requested inspection call |
| Codex 0.153.3 · configured default | 138 s | Pass | Model identity was not captured; initial CLI duplicate-start defect was found and fixed |

The requested frontier OpenCode identifier was `opencode/muse-spark-1.3-contributor-free`. Omen was requested as `opencode-go/omen-alpha`. The older Gemini and Qwen runs are retained only as compatibility evidence, not as substitutes in the frontier comparison. Claude was excluded from further runs after a provider credit refusal.

The supplied source was 10,601 bytes. Muse's edit arguments were 174 bytes, including the reference and replacement; its five Kiln requests totaled 573 bytes. Source lookup responses remain bounded source text, and images still have their normal payload cost.

All successful refinement runs used references without inline source in subsequent MCP requests. Reference-mode edit responses omitted the updated source. The server returned image blocks, and the models reported image review; those reports alone do not establish the quality of visual judgment. These refinement runs used CPU views and cannot establish material fidelity.

### What changed after testing

- Fixed duplicate CLI execution when importing the Node bundle. Source import now prints one reference; export performs one write.
- Added explicit workspace and absolute-path guidance for Antigravity and Hermes. Hermes's generated launcher sets a separate profile and terminal directory.
- Kept source viewing separate from editing. A read is bounded and has no mutation; an edit returns a new revision and renders by default.
- Shortened tool descriptions and skills, including guidance for missing references, failed edits, and degraded images.

### New asset trial

Muse Spark 1.3 Contributor also authored [the tidal observatory](../examples/tidal-observatory.kiln.js) from a design brief, with no starting asset. It used the tools to build and review the structure, then refined the island shape and category metadata after reviewer feedback using saved references.

The final geometry has 10,968 triangles. A separate GPU gallery render was inspected after authoring; the model's own views were CPU-only because the local render service required an authentication token. The result is a stylized specimen: its shiny copper and simplified rock do not fully match the requested aged surfaces. It is not evidence that material review succeeded in the model loop.

The checked-in source adds a provenance header to the model's final exported program. No geometry or materials were manually rewritten. Existing gallery examples retain their own model credits and refinement notes.

### Scope of the conclusion

The checks support using immutable source references to eliminate repeated program transmission across CLI and MCP calls. They do not establish universal model superiority, complete harness isolation, or a cross-call geometry cache. See [the design](programs.md) for storage lifetime, limits, and the current MCP rationale.
