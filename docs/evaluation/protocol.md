# Kiln authoring evaluation · protocol 1

This protocol measures whether the integrated tools help an agent build, inspect
and revise an asset. It does not rank models from different briefs or turn a
successful render into a visual-quality score. No provider call is part of CI.

## Freeze before dispatch

Retain the package tarball hash, engine/build identity, runtime and dependency
identity, harness version, requested model alias, provider-resolved model ID,
system instructions, skill/resource hashes, tool definitions, condition adapter
hash, brief hash, supplied files and declared limits. Verify model availability
immediately before the session. Never replace an unavailable model silently.

The exploratory pilot uses **Astra through Codex** and **Meta Muse Spark 1.3
Contributor through OpenCode**, subject to verified availability. It has exactly
12 scheduled cells: two briefs × two fixed model/harness routes × three conditions,
one independent attempt per cell. The selected briefs are **variable duct** and
**articulated optical instrument**. They cover variable sections, concealed
attachments, local edits and motion. The remaining four briefs are frozen for
targeted follow-up; they are not extra automatic runs.

Run conditions in these orders to reduce a fixed order effect:

| Brief | Astra/Codex | Muse/OpenCode |
| --- | --- | --- |
| Variable duct | A, B, C | C, B, A |
| Optical instrument | B, C, A | A, C, B |

Each cell gets a new workspace and a new conversation. No prior cell's source,
images, notes or repair advice enters the next cell. Route identity stays fixed
across all three conditions. A different model/harness pairing is a different
cohort, not a replacement observation.

## Three conditions

All conditions run the same integrated engine, export rules, execution limits,
source references and safety fixes. This is an **API affordance ablation**, not a
claim to reproduce a historical engine. Ordinary JavaScript, functions and raw
`THREE.BufferGeometry` remain available in every condition.

| Condition | Discovery and camera access | New geometry helpers |
| --- | --- | --- |
| A · baseline | Category-based detailed catalog; legacy preset/orbit capture and legacy part inspection | Disabled |
| B · discovery/cameras | Progressive lookup, search and capabilities; exact part paths, part-relative cameras, explicit projection and separate frames | Disabled |
| C · extended | Same discovery/cameras as B | Enabled |

The experimental host must filter both tool descriptions/catalogs **and actual
execution**. Merely hiding names is not an ablation. Freeze the disabled names
from the new geometry catalog in the receipt. Disallowed requests produce a
labelled condition-policy rejection and count toward the same call budget; do
not quietly translate them into supported requests. Existing Boolean/sweep/
deformation primitives remain where they predate this change. Shared bug fixes
are present in all three conditions and cannot be credited to condition C.

Use condition-specific versions of the **same concise skill packet**: authoring
rules, units, source-reference workflow, fidelity guidance and budget text stay
identical. A lacks progressive lookup and advanced-camera instructions; A and B
lack new-helper instructions. Do not attach the full new skills to A/B and then
punish the model for using the instructions it was given. Hash each packet and
retain a diff. Full shipping skills are used in Q1, not in this ablation.

## Limits and interventions

Before the first live call, the operator records a run/spend authorization record.
The default proposed pilot limit is 12 attempts, at most 30 Kiln calls per attempt,
48 delivered image cells per attempt, at most 512 pixels per cell side, and 15
minutes per attempt. Source reads and unsuccessful calls count. Six default views
count as six image cells. Record actual delivered pixels, including grids.

The operator must declare the monetary cap or the authorized subscription quota
window before dispatch. **Unknown price is not zero cost.** These defaults do not
authorize retries or purchase credits. If a harness cannot enforce a limit, use a
host counter/deadline or record the cell as ineligible before running it. Text
token counts are recorded when available; an unavailable token meter is null.

Do not coach during an attempt. Supply only the frozen follow-up below. Retain
errors, rejected requests and unsuccessful artifacts. A transport outage before
any model response is recorded separately; replacing an attempt still consumes
the declared run cap unless the operator explicitly approves an amended budget.

## Common follow-up

After the agent submits its first artifact, send exactly:

> Use the saved revision. Read only the source section you need, increase
> `serviceOffset` by 0.15 metres, and render the edit by reference. Keep unrelated
> source unchanged. Show the named `ServiceAssembly` closely enough to check its
> attachment and in a wider view that establishes its location. Use the camera
> controls available in this condition. Sample the translation animation before,
> during and after its movement to check that attached pieces travel together.
> Export the revised source and GLB and report the final revision reference.

Briefs deliberately require `serviceOffset` and `ServiceAssembly` so the follow-up
does not introduce task-dependent wording. Judge whether the *intended assembly*
moved, not whether a constant merely changed. A may use legacy views or explain
their limits; inability to use a hidden advanced camera is not a model failure.

## Evidence and review

Keep a receipt following `receipt.schema.json`, the full sanitized harness trace,
tool request/response records, every image actually sent to the harness, final
source/GLB, before/after source, and exact camera/fidelity receipts. Receiving an
MCP image block proves delivery to the harness transport; model-side consumption
requires harness evidence or must be marked unknown.

Human review is blind to condition/model labels where practical. Score each of
these separately on 0–3, with a short reason and the inspected views:

- Silhouette and brief adherence: absent, partial, mostly correct, convincing.
- Geometry/attachments: broken, significant defects, minor defects, sound.
- Local-edit preservation: broken/unverified, broad unintended changes, small
  unintended change, intended change only (source diff and geometry checked).
- Inspection usefulness: unusable, partial/occluded, useful, clear paired context
  and detail with truthful material/camera fidelity.

Report source bytes sent after first submission, evaluated-build/cache counts,
image/pixel counts, repair calls, wall time, export agreement and failure class
alongside the visual review. Failure classes are model/source error, discovery,
condition-policy rejection, harness/image delivery, setup/backend, camera,
materials, source integrity and visual quality. Keep more than one where needed.

One attempt per cell is exploratory. Compare A/B/C **within the same brief and
route**; do not infer model superiority from these 12 runs. Repeat only a cell
that answers a declared unresolved question, with a separately approved budget.
Any fixed-model cross-harness probe is separate, uses the identical resolved
model and brief, and is unavailable if no such shared route exists.

## Q1 · final integrated acceptance

After fixes, rebuild the package and update the shipping skills. Start fresh
workspaces and conversations on all three required routes:

| Route | New showcase candidate |
| --- | --- |
| Astra through Codex | Asymmetric research hull |
| Current Gemini through Antigravity (`agy`) | Twisting ribbed canopy |
| Meta Muse Spark 1.3 Contributor through OpenCode | Articulated optical instrument |

Use the common Q1 prompt in `q1-prompt.md` plus that route's brief. These different
briefs establish workflow coverage, not comparative model scores. Every route
must discover helpers, author an asset, receive useful images, read bounded
source, edit by reference, inspect a part, and export matching revised source/GLB.

Retest after substantive fixes. A shared engine/tool/skill/bootstrap change
invalidates the affected common workflow evidence on all three routes; a
route-specific fix invalidates that route. Hash the final installed skills,
including linked resources, rather than merely the repository copies. Human
source repairs are disclosed and require a fresh independent follow-up. Pilot
results and historical gallery assets cannot close this gate. Quota failures
leave the required route pending, without older-model or Omen substitution.

Finally rebuild site assets from the tested candidate, verify downloads/hashes,
and review desktop/mobile presentation before claiming completion.
