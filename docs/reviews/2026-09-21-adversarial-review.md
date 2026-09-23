# Independent adversarial review

Date: 2026-09-21. Reviewed the workflow audit, research report, catalog census, and selected source contracts. The geometry review was still being finalized when this review began; specific geometry probes conveyed by the audit team are treated as findings to verify, not independently reproduced here. No engine code changed.

## Verdict

The proposed unified authoring entry point is a reasonable hypothesis, with an important restriction: unify the user workflow and discovery, not the authority that establishes requirements. Keep the current taxonomy readable and preserve old behavior until a versioned replacement can express and enforce equivalent obligations. Packaging should prioritize demonstrated contract defects and truthful policy reporting over taxonomy redesign.

## Challenges and dispositions

| Challenge | Adversarial case | Disposition |
| --- | --- | --- |
| A neutral entry point can become a QA bypass | A vehicle previously required wheel or axle evidence; a new generic asset omits that capability and passes fewer checks | **Accept only with safeguards.** Preserve host-bound obligations; distinguish unknown from explicitly inapplicable; show selected checks, unmet requirements, and policy origin. Capability omission must never silently weaken an existing lineage. |
| Exposing an intent setter may merely move the trust problem | The same generating agent changes requirements after a failed QA result | **Do not treat separation into another tool as trust by itself.** Establish host/user provenance, immutable revisions, visible policy changes, and restrictions on lowering obligations. Generated metadata remains descriptive. |
| “Optional diagnostic profiles” can misrepresent current enforcement | A category rule formerly gates acceptance but becomes advisory under migration | **Preserve semantics explicitly.** Map every applicable rule, disposition, exemption, and default. A deliberate policy change needs its own review and compatibility notes. |
| Categories provide useful novice scaffolding | A user requesting a car does not know to ask for articulation, dimensions, wheels, materials, or collision properties | **Retain recipes and domain prompts.** Categories may suggest requirements and questions. They should not silently force a house-like structure onto every architectural subject. Compare this guidance against neutral discovery empirically. |
| A generic primitive API can increase complexity | One combined shell helper accepts roof, hull, shade, and wing modes with incompatible parameter meanings | **Reject unification by name similarity.** Share a lower-level implementation only where contracts match; keep focused wrappers with tested semantics. |
| One part interface cannot guarantee universal interchangeability | A replacement wheel fits the axle radius but changes offset, scale, spin pivot, or animation path | **Specify the interface.** Define frame, units, extent, sockets, clearance, material slots, identity and ownership behavior; validate substitutions against that contract. |
| Fixing transforms may break authored workarounds | An existing asset compensates manually for a mirror or radial-array defect | **Fix reproducible errors, then test compatibility.** Include legacy examples and changed-output receipts. Consider versioned behavior if the existing result is widely relied upon. Do not silently bundle these fixes with a taxonomy migration. |
| Removing a five-storey limit can hide actual resource hazards | A valid architecture request creates unbounded repeated geometry or traversal work | **Separate concerns.** The 1-5 contract bound is real (`src/contracts/asset.ts:1006-1015`), but it is not a mesh-generation limit. Remove arbitrary semantic ceilings only with meaningful geometry, allocation, execution and export budgets. |
| “Stronger models” is not a causal diagnosis | A newer model produces a nicer gallery result but still misunderstands scale and attachments | **Require paired trials.** Hold briefs and budgets comparable, record failures and costs, and test edits and unfamiliar combinations. Model age neither indicts nor validates a helper. |
| Test/example counts can overstate both success and neglect | A lexical test reference only checks an exported name; an unused helper was exercised in another workspace | **Use the census as prioritization only.** Its disclosed scope is sound. Do not call 42 zero-example helpers untested, or treat a nonzero count as geometric acceptance. |
| A universal geometry rule can reject legitimate content | Thin cloth fails closed-solid checks; a flying component fails grounding; moving parts fail static contact assumptions | **Separate universal validity from task obligations.** Numerical/export integrity is broadly applicable; manifoldness, connectedness, grounding and contact require explicit applicability and exemptions. Do not let source labels alone establish exemptions. |

## Source checks that materially constrain the recommendation

`KilnToolContext` explicitly states that host-owned context is absent from model-facing schemas and generated source cannot select its QA profile (`src/tools/registry.ts:115-120`). The workflow audit preserves this boundary correctly. Any redesign that reads `meta.category` to select enforcement would regress it.

`QaRegistry.applies` selects universal, category, subtype, and capability scopes directly (`src/qa/registry.ts:525-532`). This is a migration seam, but also the mechanism through which underdeclaring capabilities suppresses checks. Capability-based policy is not intrinsically safer than category-based policy; trusted requirements, sensible unknown-state handling, and accurate applicability determine safety.

The architecture contract comments explicitly retain legacy semantics for older records with missing fields (`src/contracts/asset.ts:1002-1004`). Existing compatibility behavior must be inventoried, not overwritten with new defaults during a normalization cleanup.

The workflow audit reports 297 passing offline tests with two skipped downstream-skill tests. That establishes substantial active coverage, not live provider qualification. The recommendation to position Strands as an optional adapter is justified by product focus and documented divergence; “severely outdated” is not established.

The reported wing winding, mirror/radial transforms, and instance-hierarchy findings deserve priority if their fixtures demonstrate contract violations. They are concrete and independently fixable. They do not, by themselves, support deleting categories or introducing a new part system.

## Required migration invariants

1. An old saved intent or program continues to resolve to documented legacy policy unless explicitly migrated.
2. Editing source, changing `meta.category`, or omitting capabilities cannot lower bound requirements.
3. Validation, rendering, inspection, saving, and final export report and use the same effective policy revision where policy applies.
4. Discovery filters never hide an otherwise available geometry operation merely because of the asset label.
5. Changes to enforcement include rule-level before/after evidence and both false-positive and false-negative fixtures.
6. New requirements can compose without conflating geometry generation limits, semantic expectations, and execution/resource limits.

## Unresolved empirical questions

- Does category-neutral discovery improve completion and editability at equal effort, or only make the API look cleaner?
- Which specialist helpers are actually harder for a frontier model to use than ordinary code, and which prevent recurring geometric mistakes?
- Can a retained host-established requirement record work naturally across CLI, MCP sessions, imported assets, and local-agent runs without introducing cumbersome setup?
- How often do users need scene-level composition versus a single environment GLB, and which export/runtime budgets matter for each?
- Do the proposed part contracts improve real replacements under rotated/scaled parents, material changes and animation, rather than only synthetic dimensions?
- Which Strands surfaces have real users and compatibility commitments? Code divergence alone cannot answer removal priority.

These questions should guide a bounded acceptance campaign after concrete defects and policy transparency are addressed. They are not reasons to postpone all packaging until an ideal architecture exists.
