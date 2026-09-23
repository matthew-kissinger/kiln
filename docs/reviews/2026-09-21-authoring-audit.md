# Kiln authoring audit and direction

2026-09-21 · Source snapshot `b81cfd4caed64bd90547ff83b4e513e59a1d4913`

This is the original audit snapshot. Current implementation, verified fixes and
remaining acceptance are tracked in the [progress checkpoint](../plans/2026-09-22-progress-checkpoint.md)
and [task ledger](../plans/2026-09-21-implementation-ledger.json). Findings below
remain evidence of that baseline, not claims that each defect is still present.

## Recommendation

Keep Kiln's source-driven modeling foundation. Make one asset-authoring workflow the primary product, with operation discovery and reusable specialist recipes. Separate descriptive categories from the requirements that actually determine validation. Repair composition contracts before expanding the helper catalog. Keep the Strands integration as an optional adapter until its current workflows are qualified; consolidate it around the program-reference tools rather than maintaining competing authoring dialects indefinitely.

Do **not** delete categories, change existing policy defaults, or rewrite the primitive library as a packaging prerequisite. Several alleged limitations are workflow or validation-contract limitations rather than geometry limitations. Several concrete defects are much smaller and more urgent than a paradigm change.

The premise that older models produced weaker helpers is plausible history, but it is not a correctness test. Recent geometry work already includes substantial contract design, preservation tests, and explicit experimental limits. A newer model can still be misled by an ambiguous API or faithfully reproduce a defective helper.

## Report packet and evidence

Read this synthesis first, then use the appendices for individual symbols and source evidence:

- [Geometry, helper and preset inventory](2026-09-21-geometry-inventory.md): implementation audit, verified defects, family contracts, and recommendations.
- [Workflow, category, QA and Strands audit](2026-09-21-workflow-audit.md): atomic surface matrix and source line references.
- [All 105 helpers: example/test census](2026-09-21-catalog-census.md), with [machine-readable signatures and matching files](2026-09-21-catalog-census.json).
- [Frontier research ledger](2026-09-21-research.md): primary sources, dates, results, limitations, and design inferences.
- [Adversarial review](2026-09-21-adversarial-review.md): counterarguments and conditions that could overturn the recommendations.
- [Prioritized implementation and acceptance backlog](2026-09-21-roadmap.md).

This was an implementation audit, targeted offline verification, source-usage census, and research review. It was not a new blind asset-generation benchmark, visual review of every helper, live provider qualification, or release certification. No paid model generation was run. No engine code was changed. The pre-existing untracked `qa/` directory was left alone.

## What is good

**The fundamental representation is strong.** Editable JavaScript, deterministic constructors, named parts, explicit transforms, retained program revisions, and GLB export are useful independent of the model doing the authoring. Kiln can express custom geometry rather than forcing every asset through a small set of templates.

**The newer geometry interfaces are more rigorous than a collection of ad hoc primitives.** Mesh and parametric-surface construction validate inputs. Deformation, sweep, loft, seam handling, normal generation, CSG attribute preservation, and export diagnostics have focused contracts and tests. Experimental implicit surfaces are labeled as such, with measured limitations rather than a claim of general CAD correctness. See `docs/geometry.md` and the geometry appendix.

**Discovery is already progressive.** MCP can return an overview, search operations, retrieve exact signatures, batch names, and disclose runtime capabilities. Helpers are not hidden behind asset categories. There is no need to invent a second discovery system just to make a roof helper available while building a vehicle.

**The project already separates structural evidence from appearance.** CPU output is not claimed as PBR proof, trusted intent is separated from generated metadata, and semantic frames/sockets exist. These are foundations to retain.

**There is real specialist value.** A wheel assembly, a gable face frame, and a joint chain encode knowledge that repeatedly re-authoring from raw boxes would lose. Agnostic foundations and domain-specific recipes can coexist. The opportunity is to make their contracts consistent and their limits visible.

## What is bad

**Users cannot reliably express the policy they think they selected.** Source `meta.category` is descriptive. Normal MCP startup does not establish category/intent, and trusted rendering falls back to `prop`. This is partly a product plumbing problem, not evidence that models habitually choose the wrong category. CLI exposes a category flag, but its help omits environment and VFX, and a misspelled category can fall back to prop during rendering.

**Some APIs do not compose as their names suggest.** Radial repetition loses source scale; it replaces orientation with a documented outward-facing convention whose relationship to source orientation needs clarification. Mirroring loses source rotation and scale. `snapTo` can miss a real gap when an ancestor transform has not yet been refreshed. `createInstance` intentionally copies only a mesh or first direct mesh child, not an assembly. That documented restriction makes it unsuitable as a general repeater for wheels, rooms, or mechanisms. It is not enough for the standalone helper to look correct if downstream repetition destroys its structure.

**Some helper names and defaults carry historical assumptions.** Deprecated `cloneGeometry` and `cloneMaterial` return their input. The newer `copy*` functions actually copy. Bare architecture policy implies a small navigable gabled building. A “room” and the newer gable shell disagree about floor placement relative to ground. These are avoidable surprises for humans and models alike.

**Input and advisory contracts need cleanup.** Direct probes found fractional stair counts overshooting requested rise/run and zero atlas columns producing invalid UVs instead of a useful error. The exposed `validateAsset` helper always returns valid and supplies a material-count advisory; it is not the engine's full validation or QA pipeline. Its name invites more confidence than its result warrants.

**Evidence is uneven across the exposed surface.** The catalog and sandbox agree on 105 functions, grouped into 12 operation families. Forty-two have no direct call in either checked-in example tree. This includes newer deformation helpers, vehicle frames/wheels, joint chains, gable assemblies, and several material/vegetation operations. Many have deterministic tests. The missing evidence is often selection and successful use by an authoring agent in a real task, especially in combination with other helpers.

## What is ugly

**A mirrored wing can be inside-out while ordinary tests pass.** The direct probe found opposite signed volumes for the two wings because reflection is baked into geometry without restoring triangle winding. This is a concrete defect, not a taste disagreement.

**The same scene can be visually ambitious but judged under an unintended policy.** A coliseum labeled in source as architecture may still receive prop policy through normal MCP. Conversely, simply supplying the architecture category can introduce house-shaped expectations. Neither a successful render nor a category string establishes an appropriate review.

**A part can appear reusable but lose identity when repeated.** Shared geometry is useful; dropping hierarchy, child transforms, semantic sockets, or animation ownership is not assembly interchangeability. A roof or wheel generator returning multiple nodes exposes this gap immediately.

**The local-agent integration contains multiple competing workflows.** Current, mutable-buffer edit, unified-buffer, and program-reference adapters overlap. An adapter for the MCP program tools already exists but is not selectable in the main run surface. Skill/unified mismatch is acknowledged in source. This is demonstrable divergence, although the offline tests do not support calling the entire Strands integration abandoned or broken.

## Categories: retain the information, remove the coupling

There are three different concepts currently easy to conflate:

| Concept | Example | Appropriate role |
| --- | --- | --- |
| Semantic label | vehicle, architecture, vegetation | Search, explanation, optional recipe suggestions, compatibility metadata |
| Operation family | geometry, curves, structure, UV | Finding the relevant constructor or transformation |
| Output requirement | articulated, navigable, tileable, open surface, bounded resource cost | Choosing validation and destination acceptance |

The proposed direction is **requirements-first authoring with optional semantic labels**. A label can suggest requirements, but must not silently establish all of them. An articulated display model is not necessarily drivable. An architectural miniature is not necessarily enterable. A decorative wheel is not necessarily load-bearing. A leaf can legitimately be an open surface.

This is a migration recommendation, not a request to relax validation. Existing trusted requirements must remain bound across revisions. Generated source must not be allowed to change its trusted category or omit a capability to evade checks; descriptive `meta.category` can remain editable. A host agent can propose requirements from the user's brief, but those should be established through a separate, auditable policy path with clear origin and revision history. A separate tool call by the generating agent is not itself authority to lower obligations. Unknown requirements should be reported as unknown. Inferred requirements should produce visible suggestions or advisories until the host establishes them.

Existing category profiles and versioned assets need compatibility adapters. Do not reinterpret saved assets under a new neutral default. Universal checks should cover representation integrity and execution limits; domain-specific requirements should activate appropriate checks. Universal watertightness, connectedness, or ground contact would be wrong for many legitimate assets.

## The coliseum is a useful acceptance case

Architecture supports **one through five storeys in its trusted contract**, not one or two. That does not limit how many levels JavaScript can construct. Removing the numeric limit alone would not solve the user's problem.

A coliseum needs repeated bays, curved or polygonal circulation, tiered seating, entrances, stairs, dimensional relationships, appropriate part identity, and useful interior views. Seating tiers are not automatically storeys. Open sky is not a missing roof. A decorative facade and a traversable game environment require different acceptance.

Start by representing the brief as a single exportable asset with named subassemblies. Add explicit navigation requirements only when requested. Reuse profiles, sweeps, radial placement, and opening builders. Test a complete bay as an interchangeable assembly before repeating it. Evaluate edits such as changing bay count, arena dimensions, or seating pitch without rebuilding unrelated detail.

Keep this distinct from composing a scene from externally referenced assets. The existing composer library covers another useful scope; normal MCP does not currently provide its composition tool surface. Do not require users to enter a separate world-generation product merely to author one large environmental asset.

## What interchangeable parts should mean

Apart from a return value, a reusable part needs a contract for local origin, axes, units, dimensions, material slots, hierarchy, attachment frames, semantic roles, and permitted variation. Animation targets and identifiers need a cloning/renaming policy. Resource sharing needs explicit ownership rules. Tolerances should scale with the intended asset and interface, not be scattered fixed constants.

Use the existing semantic frame/socket vocabulary as the starting point. Add small helpers that remove repeated error-prone work, such as placing an assembly by mating two frames, only after representative compositions establish the need. Preserve a low-level geometry escape route.

Prefer a small number of clear contracts over one enormous helper with many unrelated modes. Keep alternate shape implementations substitutable at a defined interface. A dome and gable roof might satisfy a roof attachment boundary; they should not pretend to have identical interior-clearance behavior. A profile sweep can support rails, hull details, and architectural trim without every output sharing a semantic category.

Highest-value additions to investigate are assembly-safe replication, generic frame attachment, multiple openings in a panel, and a reusable repeated-bay recipe. A coliseum-specific mega-generator would hide the same coupling problems inside a larger preset. General bevel/remesh/shell operations should remain experimental unless their accuracy and attribute-loss contracts are defensible.

## Strands decision

Make CLI/MCP plus workspace skills the canonical supported authoring route. Keep Strands available as an optional library adapter, with explicit qualification status. Do not spend the pre-package window rebuilding another full agent product.

The practical consolidation path already exists: `makeKilnProgramTools` adapts the program registry. Wire a tested selectable adapter before retiring old surfaces. Preserve explicit terminal submission, budget handling, source lineage, provider-specific prompt caching, renderer receipts, and cancellation behavior. Submit must resolve an exact retained final revision; a model's claimed completion is insufficient.

This is not an assertion that Strands SDK itself is outdated. The audit establishes integration divergence and missing current end-to-end evidence. Targeted agent tests passed. Provider compatibility and generation quality require separate, explicitly authorized live trials.

## What current research changes

The [research ledger](2026-09-21-research.md) supports sharpening interfaces and protecting editable structure, with important limits:

- [ProcFunc](https://arxiv.org/html/2604.26943v1) is directly relevant to typed procedural function libraries. It reports substantially fewer errors in from-scratch material coding, but mixed parameter-editing results. Interface improvements need task-specific evaluation.
- [3DCodeBench](https://arxiv.org/html/2606.01057v1) reports API mismatch and disconnected geometry even when rendering succeeds. Compile success and visual preference cannot replace structural acceptance.
- [PartCrafter](https://arxiv.org/html/2506.05573v1) and the very recent [KaiNinja preprint](https://arxiv.org/abs/2609.15659v2) reinforce the value of part decomposition. They do not prove that arbitrary generated parts are dimensionally interchangeable.
- [Infinigen Indoors](https://arxiv.org/abs/2406.11824) demonstrates why environments require spatial relations and constraints beyond a larger object category. [Scene Language](https://arxiv.org/abs/2410.16770) separates semantics from program structure.
- [TRELLIS.2](https://arxiv.org/abs/2512.14692) targets open and non-manifold surfaces as well as enclosed geometry. “General 3D” must not be equated with “closed CAD solid.”

No reviewed source establishes that deleting categories improves Kiln, that stronger models make specialist helpers unnecessary, or that one universal primitive vocabulary is optimal. September 2026 preprints are recent author-reported evidence, not settled production guidance.

## Acceptance before broader claims

Run a staged comparison: current category workflow; neutral entry with explicit requirements; and neutral entry plus specialist recipe suggestions. First repair known correctness defects in a common baseline, so discovery is not unfairly blamed for broken constructors.

Use repeated, matched runs on props, articulated machines, ground and water vehicles, multi-level structures, an open coliseum, thin organic surfaces, and modular environment assemblies. Reserve some shapes and compositions as held-out briefs. Include parameter changes and part swaps after initial completion. Keep model, effort, rendering opportunities, and review process comparable.

Measure completion including failures, helper selection, API errors, repair burden, transform/attachment defects, attribute survival, import/playback behavior, resource cost, and human visual preference. Record source and output hashes, exact runtime revision, policy, model, and review conditions. Separate technical acceptance from owner taste.

Do not set an arbitrary pass percentage and call it evidence. The first baseline should establish actual distributions and defect severity. Exact contract regressions must fail deterministically; visual comparisons need paired review and enough repeated runs to show uncertainty. If neutral discovery increases omissions or repair burden, retain stronger recipe guidance for that domain.

## Scope of verification

Three targeted offline runs were performed with Bun 1.4.2 and CPU rendering: geometry/helper tests (194 passed), workflow/agent tests (297 passed, 2 skipped), and additional catalog/CSG/export/material/UV tests (65 passed). No failures were reported in these runs. Passing existing tests did not prevent the separately reproduced composition defects.

The third run used `bun test` with `--timeout 20000` on these files under `src/__tests__/`: `list-primitives.test.ts`, `csg-preservation.test.ts`, `csg-uv-integrity.test.ts`, `geometry-export.test.ts`, `geometry-export-contract.test.ts`, `geometry-policy-runtime.test.ts`, `instancing.test.ts`, `material-recipes.test.ts`, `portable-material-runtime.test.ts`, `animation-textured.test.ts`, and `uv.test.ts`. It reported 2,734 assertions across 11 files. Both `KILN_RENDER=cpu` and `KILN_SPIKE_LIVE=0` were set. The other commands and results are recorded in their respective appendices.

These are targeted checks, not the complete repository release gate. The appendix records commands and limitations. The census is static source evidence, not telemetry from users or proof of visual quality. The report's priority order reflects confirmed impact and migration risk; proposed new abstractions remain hypotheses to validate.
