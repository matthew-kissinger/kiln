# Strands trace and context audit

Current disposition: Trial13 completed generation and both refinements on the
official Google route. Its bounded qualification and remaining limits are recorded
in [the final section](#trial13-completed-baseline-and-both-refinements).
Earlier sections preserve the state at each trial; they are not current dispatch
instructions. No further inference is scheduled for checkout closeout.

At the initial audit the native workflow was not yet qualified. The six pre-correction trials were mined,
including failed attempts. The 60-turn trial produced no reviewed artifact; a
subsequent alternative-model attempt was rejected upstream before any tool ran.
The evidence supports several Kiln feedback/presentation defects and a weak repair
loop on this model route. It does not isolate a defect in the Strands SDK itself.

## What actually ran

| Trial | Provider/model | Model calls | Outcome |
| --- | --- | ---: | --- |
| 01 | OpenRouter Qwen 3.8 27B free | 1 | Upstream rate limit; no tools |
| 02 | OpenRouter Nex N2.5 Pro free | 6 | Output-token exhaustion during retrieval/generation; no render |
| 03 | OpenRouter Nex N2.5 Pro free | 5 | Cancelled; no render |
| 04 | OpenRouter Ling 3.0 Flash VL free | 30 | Turn cap; 26 Discovery calls, 10 render attempts, no reviewed artifact |
| 05 | Same Ling route | 30 | Turn cap; 18 Discovery calls, five render attempts, no reviewed artifact |
| 06 | Same Ling route | 60 | Turn cap; 71 tools, 13 render attempts, no reviewed artifact |
| 07 | OpenRouter Inkling free | 1 | Upstream approved-harness restriction; no tools, no artifact, $0 debit |

Trial03's receipt says cancelled; that fact alone does not establish whether an
external cancellation or deadline caused it. Do not group all six as turn-limit
failures. Trial06 recorded 17 Discovery calls, ten skill-reference calls, 18 source
reads, six edits, five syntax validations, one renderer check and one activation.
It consumed 2,663,031 aggregate reported input tokens and 54,865 output tokens;
the input total includes repeated history, not a 2.6-million-token context window.
First/last per-call inputs were 10,374/64,788. Account usage delta was $0.

The [matched OpenCode comparison](2026-09-23-native-turn-efficiency.md) took
22/28/48 initial model turns and 7–17 turns per requested edit. These differ in
model, runtime and transport. Fewer turns also did not mean lower wall time:
Main33 MCP took 484.203 seconds for 22 turns; Main20 CLI took 266.179 for 28.

## Clean-room and version checks

Trial06 ran in `strands-06-grained-handrail`, outside the engine checkout, against
frozen runtime `sha256:32ec68d1201628d1f8901099a4640726e05b894dc4ea82fd17885dd8f0ca7b21`.
All 13 copied skill/reference files match both their recorded hashes and the
frozen runtime. These were the current candidate's files when the trial started;
subsequent fixes do not mutate this historical trial.

Its first provider request contained one user message, the native system prompt
and 12 tool definitions: eleven Kiln tools including the optional reference reader,
plus the SDK `skills` activation tool. No shell, general file reader, repository
inventory, engine source, gallery examples or arbitrary workspace files were
automatically supplied. The native tool registry is current, reference-based and
category-free; this was not the retired four-tool loop.

The harness process is not an OS sandbox. Generated code used the terminable
subprocess evaluator with a 60-second deadline, 16 MiB GLB limit and 32 MiB response
limit. The receipt explicitly says total process memory is not bounded. Native
skills are a host-selected immutable snapshot; the reader cannot traverse arbitrary
paths. Context isolation and execution containment are separate claims.

## Trial06's failure sequence

1. Turns 1–6 activated the shared skill, read four references and made eight
   Discovery calls. Initial construction moved earlier than Trial05: validation
   on turn 7 instead of 10. One response before construction nevertheless used
   20,352 reported output tokens. That is a model/route observation, not evidence
   that the harness requested 20,000 words or that more retrieval was needed.
2. The full texture contract already specified synchronous execution and the
   four supported blend modes. Source still used `soft-light`. Once capture
   schema errors were corrected, the worker hid this useful blend error behind
   a generic execution rejection. The model then changed capture settings while
   the actual problem was in source execution.
3. Turn 20 removed unsupported blends. The newly preserved `createPart` advice
   identified unawaited geometry. Turn 26 supplied an async build with awaited
   rounded boxes. This is observed uptake of F238, not speculation.
4. Turn 28 reached `MAT_TEXTURE_UV_MISSING` for the textured rounded boxes. This
   was real QA progress, but no image was delivered. The model attempted to unwrap
   the rail too, although sweep UVs already existed and its loaded directional
   recipe warned about arbitrary atlas rotation.
5. Subsequent large exact-string replacements included an anchor with the wrong
   cap placement/order and failed atomically. Multiple reads, repeated prefixes,
   another no-op edit and whole-source rewrites did not converge. By turn 59 an
   earlier geometry-argument error had returned. Turn 60 validated syntax and
   exhausted the budget without `kiln_finish`.

No render image reached the model in this trial. Consequently it provides no
evidence about native visual judgment, screenshot reasoning, or the final asset's
material quality. Successful offline media-adapter tests are a different claim.

## Confirmed shared defects and corrections

- **F238/F239, already fixed before Trial06:** preserve part repair advice; honor
  the registry's Discovery presentation in the native adapter; remove duplicated
  text; keep complete detail when a display preview is truncated. Replay of the
  old 18 Discovery calls reduced serialized result characters by 55.15%.
- **F240:** unsupported texture blend errors lacked a closed worker diagnostic.
  The fix names the supported blend values without exposing exception strings,
  authored values or host paths. The original failing source remains unchanged.
- **F241:** search returned a rounded-box summary with dimensions but omitted
  async execution. The model never fetched its full contract before use. Compact
  search/overview entries now expose sync/async from the canonical contract;
  search also states the exact-ID follow-up. Ranking, recipe freedom and offline
  operation are unchanged. Summaries still are not complete calling contracts.
- **F242:** camera prose said orbit cameras accept `subject`, despite the example
  correctly placing it on the enclosing shot. The reference now names the exact
  location and the mutually exclusive path/name selectors. This repairs shared
  guidance, not a Strands-only schema variant.

The model also made mistakes despite correct supplied information: unsupported
blend values, source-reference arguments sent to the skill reader, reintroduced
camera forms and mismatched edit anchors. Better context may help; it cannot be
claimed to have solved those behaviors without another controlled authoring run.

## Native context architecture and remaining work

Keep one authoritative geometry/material/QA knowledge set. Do not maintain a
second copy of helper contracts or fork all three author/refine/QA skills for
Strands. The shared skill in Trial06 was current but devoted substantial space
to conditional CLI, collection and presentation delivery that this native harness
does not expose. Its activation result was about 12.5k serialized characters.

The native workflow layer is now implemented through the SDK's existing
[AgentSkills plugin](https://strandsagents.com/docs/user-guide/sdk/plugins/skills/)
and its lazy activation. `src/agent/native-workflow.ts` constructs the internal
`kiln-native-workflow` skill; both inline and skill-driven modes receive its
metadata, and activation is optional. It explains retained revisions, source
versus skill-reference access, failed atomic edits, actual image review and
`kiln_finish`. Discovery remains authoritative for geometry/material contracts.
The existing Kiln resource reader provides bounded immutable reference access.

This skill is deliberately outside the shared `skills/` collection. Native
terminal instructions were removed from the shared author/refine skills. An
actual fresh OpenCode workspace, including both optional compose/batch skills,
contains no native workflow protocol across all 58 generated files. Compiled
CLI Discovery and an actual stdio MCP connection also expose none of it; MCP
lists its 14 ordinary tools. The boundary and setup guidance are documented in
`docs/runtime.md` and `docs/harnesses.md`. This proves checkout setup isolation,
not cold package installation or live model uptake.

A real SDK scripted loop activates the built-in skill without a filesystem skill
directory, renders a revision, recovers from a failed anchored edit, and finishes
the corrected exact artifact. All 195 native-agent tests pass. This is functional
offline evidence; it does not establish that an unscripted model follows the skill.

Trial07 used the new frozen runtime, original brief and 60/24 turn ceilings with
`thinkingmachines/inkling:free`. Its public endpoint advertised tool/image support
and zero pricing, but inference rejected access because the free route is limited
to approved harness applications. This is an access failure, not evidence of
poor native reasoning or skill uptake. No tool ran and the account delta was $0.
No application identity was spoofed and no tool/provider workaround was added.

Remaining work under S04/S06/V04/V09, not new scope:

1. Evaluate uptake of the implemented native-only workflow in a fresh run. Move
   more conditional delivery prose into shared references only if traces show it
   still distracts the model; do not add a second geometry knowledge set.
2. Mine the next run for capture, missing-UV and edit recovery. Failed-edit and
   exact-artifact recovery now pass a real SDK scripted loop. The subsequent
   [F243 correction](2026-09-23-qa-affected-feedback.md) preserves affected-part
   identities in blocked-render errors across CLI/MCP/native tools. Fresh model
   uptake remains unqualified; more prompt text is not the established remedy.
3. Run one fresh comparison using an already authorized alternative model after
   those bounded changes. Hold brief, skills, runtime, ceiling and renderer
   requirements fixed across model comparisons. Stop repeatedly expanding Ling's
   turn budget. Previous successful OpenCode runs do not substitute for this test.
4. Require generation plus both requested edits, actual image-bearing responses,
   inspection of final geometry and protected-feature checks. Record time to first
   successful render, retrieval repetition, repair convergence, input/output
   tokens and final quality alongside turns.

Broad context summarization is not the demonstrated remedy here. Trial06 stopped
on turns rather than overflow, and current source/repair details were mishandled
well before its context filled. The SDK's
[context strategies](https://strandsagents.com/docs/user-guide/sdk/context-management/)
can be evaluated if measured history pressure warrants them; losing a current
image or exact edit anchor would make this workflow worse.

## Evidence

Campaign root: `C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22`.
Original trace JSONL, receipts and program stores remain under each
`strands-01` through `strands-06` workspace. Derived summaries:

- `native-context-review/all-trials-profile.json`
- `native-context-review/all-trials-errors-and-retrieval.json` (Trial06 interim
  snapshot at 50 dispatches; final counts come from the terminal profile below)
- `native-context-review/trial06-loaded-context.json` (interim retrieved context)
- `native-context-review/trial06-isolation.json`
- `strands-06-grained-handrail/evidence/stage-0-efficiency-profile.json`
- `profile-native-trace.py`, which emits counts and sizes, not reasoning text
- `native-trace-followup-review/receipt.json` for compiled CLI/MCP/native replay
- `native-skill-boundary-review/receipt.json` for fresh workspace and CLI/MCP isolation
- `native-skill-setup-boundary-review/receipt.json` for the current e1139f checkout:
  a fresh workspace with all five authoring skills, compiled CLI Discovery and
  all 14 MCP tools expose no native protocol. All 25 focused native/MCP checks pass.
  README, the maintained setup skill and generated START.md now explain that
  Strands context stays inside the optional built-in agent. This documentation
  change does not establish improved live-model performance or package acceptance.
- `native-workflow-skill-focused.log` and `native-workflow-skill-final-gate.log`
- `strands-07-grained-handrail/evidence/stage-0-receipt.json` and efficiency profile

The expanded cap did not establish a live improvement. Native acceptance remains
open; see the current checkpoint for broader campaign counts; these native failures add none.

F240–F242's checkout passed 2619 tests with two skips and zero failures.
Actual compiled CLI/MCP/native replay passes both failing blend cases, both
sync/async search cases and a valid texture export. Runtime:
`sha256:d312706c3d18b67d37db8a15e8b88c667ed541d10501bf9d3ee35afb90bb6e34`.

The subsequent native-only skill and shared-context cleanup pass 2620 tests,
two skips and zero failures; coverage is 95.19% functions / 92.21% lines with
unchanged ratchets. Skills, typecheck, lint, bundles, generated tool reference and
diff checks pass. Runtime:
`sha256:6134bfb4c43d828db12bd2aa974fe2b036578adf03869922fb24b936702f51be`.
Fresh native context/model comparison remains open. S04 stays reopened, giving
93 implemented, six evidence-ready,
31 in progress and six pending tasks.


Trial08 ran on the qualified F245 runtime `2c002afb...99aee2c`, with the same
briefs and native-only skill, using the authorized `google/gemini-3.8-flash` at
high reasoning. It stopped on an upstream HTTP 504 timeout on dispatch nine.
The preceding eight calls completed: one authoring-skill activation, six Discovery
calls and one shared-reference read. No render, image-bearing response or artifact
was produced; neither edit was attempted. This is provider failure evidence, not
proof of improved native generation or a reason to alter the core toolchain.

Reported completed-call usage: 85,328 input tokens, 703 output tokens and 46,528
cached input tokens. Account usage increased by $0.03522585 during the run.
That interval can include concurrent account activity and is not a per-generation
invoice. The conservative aggregate reservation remains $2.1339741, including
the entire $1.9365888 reservation for the timed-out call without usage metadata.
The original $10 aggregate cap and fresh pre-dispatch balance checks remain.
No GCP credits were used. Original preparation, refreshed frozen runtime, original
trace, terminal receipt and efficiency profile are retained in the Trial08 folder.

The model retrieved the current authoring skill and used ordinary-language
Discovery plus batched contract lookup. It fetched `compilePortableMaterialSpecV2`
in a batch and again individually, but made no identical retrieval request. It did
not activate the native workflow skill before the provider stopped. These limited
observations do not establish context adequacy, geometry reasoning or terminal
workflow uptake. No automatic retry, provider impersonation or harness-specific
core workaround was added. Continue the main campaign before another bounded
native attempt; do not count this as a completed authoring.

## Trial09: useful images, incomplete delivery

One fresh retry kept Trial08's model, reasoning, frozen runtime, original briefs
and skills fixed. It ran for approximately 288.51 seconds, made 47 provider
dispatches and completed 47 tool calls. The loop reports 48 steps because the
next dispatch was denied by the campaign's aggregate reservation guard. It did
not reach the 60-turn ceiling or 25-minute deadline, and did not call `kiln_finish`.
No edit was attempted. Result: explicitly `partial`, not a completed handrail.

Tool calls were one shared authoring-skill activation, four reference reads,
14 Discovery calls, one renderer check, 11 syntax validations, 14 renders and
two inspections. First render was on turn 17. Eleven image-bearing results are
visible in subsequent provider snapshots. The final debug render was retained by
the host but had no next dispatched request, so its image was not delivered to
the model. All captured successful material views report the actual GPU renderer.
There was no identical retrieval repeat, but overlapping contracts were fetched
and the native workflow skill was never activated.

Confirmed trace findings:

- The model repeatedly authored isolated UV, grain and primitive experiments. It
  used no anchored `kiln_edit` calls. Eleven syntax checks did not establish that
  their geometry would execute, and the main requested artifact lost priority.
- One rejected assembly hid a misplaced tapered-cone axis behind a generic
  execution error. [F246](2026-09-23-taper-axis-feedback.md) now exposes the safe
  positional repair contract through all three interfaces. The live trial remains
  unchanged; this fix does not establish native completion.
- Missing camera subjects were repaired from returned paths twice; a missing
  camera `type` was corrected after the schema error. These recoveries worked
  without a harness-specific tool schema.
- A complete handrail candidate `p_948b27830857` was rendered, then the model
  returned to stripe experiments. The retained partial result is `StripesAngleTest`,
  two diagnostic cubes, with exact GPU/artifact hash
  `b2ffc4af28ae1a78678f16b3a3e32016c88447efb3a4ad6f2ecbfe9ec2585af5`.
  It must not be presented as the requested asset or a successful baseline.

F247 keeps native workflow efficiency open. The next bounded harness change should
address retaining the working asset while diagnosing a specific uncertainty and
returning to it for review/completion. Do not infer the target from object names,
automatically finish a partial artifact, add category restrictions, or duplicate
geometry knowledge in Strands. More turns alone are not the demonstrated remedy.
Keep any native workflow instruction change outside shared CLI/MCP skills.

For comparison, Main33's matched handrail baseline used 23 OpenCode model steps,
20 actual MCP calls and 484.203 seconds; its edits used 11/8 steps and 10/6 MCP
calls. It completed delivery, with its own recorded quality limits. Native09 is
faster in wall time but incomplete. Different models, runtimes and tool scheduling
prevent a controlled attribution to harness quality.

Reported usage is 2,098,249 input tokens, 37,765 output tokens and 1,775,018 cache
read tokens. Account-key usage rose by $0.392848575 during the run; credits-balance
movement differs, so neither interval is a precise generation invoice. Aggregate
conservative reservations total $8.163207075, and another $1.9365888 reservation
would exceed the original $10 ceiling. This is not $8.16 of established spending.
The driver deliberately overcounts cache tokens and output/reasoning rates, and
retains Trial08's unfinished-call reservation. Before further paid inference,
qualify less wasteful accounting against the pinned provider/SDK usage mapping;
do not raise the allowance, discard missing usage or silently resume this trial.

Evidence: `strands-09-grained-handrail/evidence/stage-0-{receipt,efficiency-profile,tool-review}.json`,
original trace, source store and media; `strands-authorized-budget.json`. This
adds no main-campaign completion. Strands generation plus two edits remain open.


## Bounded follow-up after Trial09

The native bootstrap now keeps the asset's retained program reference separate
from diagnostic probes and directs useful experiment results back into that
asset. Syntax validation is appropriate when syntax or sandbox legality is
uncertain; execution and image review happen through render. The optional native
workflow skill expands that guidance. This changes only the Strands prompt and
its programmatic skill, not shared skills, Discovery, CLI or MCP behavior. It
adds no category restrictions, forced construction technique or automatic finish.
The current [Strands skills documentation](https://strandsagents.com/docs/user-guide/sdk/plugins/skills/)
supports programmatic skills and on-demand loading; essential workflow guidance
remains in the native bootstrap because Trial09 never activated the optional skill.
The existing 195 native tests pass. Live effectiveness remains unproved until a
fresh baseline and both edits finish and are independently reviewed.

Campaign accounting was also corrected independently of engine behavior. The
pinned OpenRouter adapter maps total prompt tokens including cache reads to the
Vercel total, and the pinned Strands adapter forwards it unchanged. Completion
totals likewise include reasoning. Charging all input at the highest input rate
plus the cache-write surcharge and output at the higher completion/reasoning rate
still gives a conservative bound without double counting these subsets. This
uses no cache discount and does not turn balance changes into invoices. Official
[OpenRouter usage accounting](https://openrouter.ai/docs/cookbook/administration/usage-accounting)
provides the corresponding response structure; the exact installed adapter files
and versions are hashed in `native-reservation-reconciliation.json`.

Four campaign-only checks cover total-token accounting, invalid/missing metadata,
full output reservation and no cache discount. Original budget bytes are retained.
Only 55 completed Trial08/09 requests were reconciled: aggregate reservations
changed from $8.163207075 to $5.307845025. The unfinished Trial08 request keeps its
entire $1.9365888 reservation. The authorized aggregate ceiling stays $10, with
fresh balance and endpoint-price checks before further inference. These figures
are conservative reservations, not established spending. No provider or SDK code
was patched and no authorization was expanded.


## Trial10 outcome and free-route follow-up

Trial10 is terminal and partial. It made38 provider dispatches and38 tools;
the reported39steps include a next dispatch denied by the conservative aggregate
reservation guard. It did not reach60turns or25minutes. The evidence-file interval
is approximately580.22seconds. No finish, anchored edit or requested edit occurred.
It activated both the native workflow and shared authoring skill, read three
references, made23Discovery calls, one renderer check, eight renders and one
inspection. The first render was turn27. Seven image-bearing tool results appear
in subsequent requests. Two invalid camera inputs recovered from explicit schema
errors; neither required weakening the shared capture contract.

Unlike Trial09, every rendered source was a full handrail candidate. The retained
partial source hash is `597b0a239fa96c7e1aa61f7f66ebee28c9a64cd7e771f1cb0d7ccfa0f2cd5f96`;
its exported GLB and GPU evidence both match
`64fb1cc3b997e0890817f9f8c50def224447e74ee651ba723e67701644617795`.
Four separate final views were retained rather than a combined PNG; the original
base64 frames were decoded to `partial-final-view-0..3.png` without image edits.
Reviewer inspection confirms a full curved rail and four posts, with directional
but regular grain. This is not delivery or complete joint/brief qualification.

The model fetched the exact proceduralTexture contract five times and repeated
its angle query. [F248](2026-09-23-procedural-direction-discovery.md) adds the missing
angle meaning to the shared contract, independently verified on pixels and all
three interfaces. Trial10 remains frozen before that change. Native-only asset
retention guidance and F246 were present, but this uncontrolled run cannot isolate
their effect or establish native completion. F247 remains open.

Reported usage:1,500,024input tokens,128,498output tokens and1,186,237cache-read
tokens. Account-key usage increased by$0.7241664 during the observed interval;
that is not an exact generation invoice. Aggregate conservative reservations are
$8.312740725; the next full-context reservation would exceed the original$10cap.
No paid retry, allowance increase or reservation reset was performed.

Trial11 used the freshly qualified contract on `qwen/qwen3.8-27b:free`. The
ModelRun endpoint advertised images/tools and zero pricing but rejected the
standard `minLength` keyword in the Discovery query schema before any tool ran.
Five dispatch attempts yielded no token metadata, images or artifact; account
usage was unchanged. This is provider grammar incompatibility, not a reason to
remove valid Kiln schema constraints. Original failed traces are retained.

Trial12 is a separate bounded free attempt on `google/gemma-4-31b-it:free`, whose
current endpoint is Google AI Studio. Read-only endpoint checks confirm image
input, tools, reasoning and zero prompt/completion rates; the driver rejects any
nonzero endpoint pricing. It retains the same frozen runtime, skills, briefs and
60/24call ceilings as Trial11. See the checkpoint for live status. No fallback
provider or model substitution is hidden inside either trial.


Trial12 is terminal: Google AI Studio returned an upstream rate limit after six
dispatch attempts, before any tool, token metadata, image or artifact. Account-key
usage was unchanged. This does not qualify or disqualify model geometry behavior.
No automatic cross-provider fallback, schema relaxation or paid retry was added.
No native inference is active. Preserve both free-route failures; do not treat
advertised image/tool capability as proof that a route currently accepts Kiln.
Native generation plus two edits remains unqualified.


## Direct Google follow-up preparation

Trial13 is prepared in a clean native workspace on the current qualified
`e1139f...9af53e` checkout, using the original handrail brief and both edits.
The exact `gemini-3.8-flash` model is available through the configured key's
read-only model API. The existing official Strands Google adapter accepts high
thinking and 32,768 output tokens. Native workflow remains programmatic inside
the harness; the workspace contains shared domain skills only. No engine, shared
skill, CLI or MCP behavior was changed for this provider.

Provider eligibility and spending authorization were checked in private operator
records before each metered trial. Billing settings and keys were not changed.
The retained test results do not imply credits or free eligibility for other users.

[Google's standard pricing](https://ai.google.dev/gemini-api/docs/pricing) currently
charges $0.75 per million input tokens and $3.75 per million output tokens,
including thinking, through December 31, 2026. The driver reserves $0.909312 for
a full-context call before dispatch and settles only consistent usage metadata
with no cache discount. Missing metadata retains the reservation. Pinned SDK
code confirms that its output count includes thoughts and its input count
includes cached input. Four offline accounting checks pass; the first test's
floating-point equality assertion was corrected to a numeric tolerance.

Google's client defaults to up to five HTTP attempts. The campaign runner uses
its public request option `httpOptions.retryOptions.attempts: 1`, so any
Strands-level retry is a separate recorded and budgeted dispatch. This changes
only the trial configuration. An offline intercepted HTTP500 check confirms
exactly one request, high thinking and the output ceiling on the wire, without
network access or a real credential. Dry preflight passes, including current runtime
and bundle hashes, skill hashes, exact model metadata, thinking/output settings
and local evaluator configuration. GPU readiness is still on-demand, not
established by that configuration-only preflight.

Evidence: `google-native-credit-preflight.json`, `google-native-model-preflight.json`,
`native-google-usage-contract.json`, `native-google-reservation.test.mjs`,
`native-google-wire-check.json`, `native-context-external-workspace-check.json`, and
`strands-13-grained-handrail/trial.json` under the external campaign root.
No Google generation call has been sent. Run it only after the active OpenCode
sequence completes or stops; do not run simultaneous authoring agents. Live
native generation plus two edits remains unqualified.

Before the first Trial13 dispatch, the shared author/refine/QA instructions were
refreshed with the general intermediate-mount and replacement-connection guidance
from heldouts06-08. The original preparation manifest remains retained, with
before/after skill hashes in `native13-guidance-preflight-refresh.json`. The
runtime identity, briefs, provider settings and native workflow are unchanged.
This is an explicitly recorded preparation update, not a change to a scored
trial or to the frozen held-out campaign. No native-only instructions entered
the shared skills.

After Heldout10, the still-unstarted Trial13 preparation was refreshed to
`3fe733...d2fb11`, including current surface/normal Discovery guidance and the
shared geometry reference. `native13-surface-guidance-refresh.json` preserves
the earlier manifest, changed runtime files and hashes. Briefs, provider settings
and native workflow are unchanged; no Google inference was sent. Qualification
is a full run plus targeted documentation-size recovery, as recorded in the
checkpoint. Rerun dry preflight before live use.

## Trial13 completed: baseline and both refinements

The prepared Google route completed all three stages on frozen `3fe733...d2fb11`:
**33 / 15 / 18 provider calls**, each ending with the native `kiln_finish` tool.
The settled conservative total is **$3.8435685** of the separately authorized
credit budget, before any cache discount. This is usage-based accounting, not a
billing invoice. No inference remains active. Earlier failed and partial runs
remain part of the evidence; the changed model/provider prevents attributing
this result solely to harness changes.

All three retained source hashes match their program references. Exported GLB
hashes match the original GPU review inputs, with full-material fidelity from
the D3D12 renderer. Baseline reports `exactArtifact:false` because its in-loop
build had not yet been persisted; the independent byte hash matches. Both edits
report `exactArtifact:true`. All three original sheets were visually reviewed.
The wood has longitudinal procedural grain; its stripe-like appearance remains
an asset-quality limitation, not proof of photorealistic oak.

Curvature reversal changes the authored curve and its tangent only; all 76
non-rail mesh geometries, materials and texture bytes remain unchanged. The
bracket replacement preserves all 47 wood-rail, cap and floor-plate/hardware
meshes, including transforms and bindings. It shortens the four post stems by
40 mm to accommodate its forked brackets; that dependent alteration is recorded,
not hidden behind a claim that every retained part is exact. Selected interface
checks cover 30 / 30 / 50 pairs, all meeting within Float32 precision. They do
not certify full mating areas, strength or continuous clearance. A first reviewer
assumed the wrong sweep ring stride and treated section centroids as path centers;
the qualified review corrects the stride and does not use centroid offsets as a
centerline-symmetry requirement.

The observable traces show 14 / 1 / 5 Discovery calls with no identical repeated
retrievals. Baseline tried an unprefixed recipe ID, then recovered with returned
catalog IDs. It reached its first render at call 15. Two schema errors recovered:
an inspection omitted both source selectors, and a custom shot supplied both
subject name and path. These receive actionable existing errors; no harness patch
is warranted. The dispatch snapshots contain at most one image each while 5 / 5 /
6 distinct image-bearing results appear across the three stages, confirming the
native image-history policy operated. This is application-boundary evidence,
not an independent provider HTTP capture.

Every stage starts with one user message and twelve native tool definitions.
There is no filesystem or shell tool. Shared domain skills are loaded alongside
the programmatic native workflow, without repository/gallery context. This does
not establish operating-system sandboxing. CLI/MCP setup remains free of that
native workflow, as qualified separately by the workspace boundary checks.

Evidence under `strands-13-grained-handrail/evidence/`: all three receipts,
efficiency profiles, `request-boundary-review.json` and `independent-review.json`.
The current checkout `18f0f0...2ba95e` adds the later finite-mesh diagnostic;
Native13 was not retroactively updated. Its shared registry/worker repair path
has separate focused, full-suite and actual CLI/MCP evidence. This completes the
bounded live native generation/refinement check, not every provider, platform,
animation/interior live scenario or installed-package qualification.
