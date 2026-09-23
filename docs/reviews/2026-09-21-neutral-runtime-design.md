# Neutral runtime cutover contract

Status: agreed staged implementation for P03/P04/P05. The exact deterministic registry contains **27 rules**, verified by executing `DETERMINISTIC_QA_REGISTRY.list()` on 2026-09-21. The [foundation table](2026-09-21-neutral-requirements-design.md#rule-inventory-and-required-migration) accounts for all 27, including `VEHICLE_W6_ADVISORY_PROFILE`. Earlier references to 28 were incorrect.

## Input and authority

Normal render/evaluator execution receives one host-established `RequirementsBinding` snapshot, or uses an empty neutral requirements record. It never builds an `AssetIntentV1`, supplies a prop category, or invokes an old-data converter. Supplied legacy `intent` or execution `category` receives a migration-required error before source execution. Descriptive source `meta.category` remains data and does not select checks.

The snapshot is strictly validated: contract/version, task/lineage, revision, detached requirements data, current semantic hash, and contiguous provenance history. Structural validation proves consistency, not cryptographic authorship. The caller holding the host binding capability supplies it; generated source and imported checkpoint JSON cannot establish that authority. Evaluator transport carries only the validated data snapshot, never a store writer or function capability.

Execution records distinguish requested obligations, inferred advice, unknown statements, and inapplicability. Missing statements remain unspecified. Descriptive labels and reasons do not influence enforcement. Effective policy and advice hashes are separate; the binding retains its full semantic/history identity. A source revision cannot change either host-established context.

## QA and incomplete acceptance

The new report is a versioned, category-free report with a neutral requirement-readiness dimension, explicit applicability coverage, and an acceptance state separate from artifact production. A requested obligation that the current checker cannot evaluate makes acceptance **incomplete**, even when universal checks pass and a GLB is produced. Actual blockers still block. Inferred or unknown statements never become required gates. No taxonomy change promotes heuristic modes or downgrades existing exact rules.

The first cutover reuses the universal/material measurement kernels through category-free input adapters, preserving their exact promotion metadata. The 27-rule applicability map explicitly identifies migrated checks, checks not requested, and requested checks awaiting their domain migration. P09–P14 remain required work: architecture, mobility, rig, foliage, environment, effects, articulation, grounding, and other unsupported obligations must not disappear behind a successful generic report. No synthetic category is manufactured to trick an old category evaluator into running.

Historical QA report readers remain available for saved data; they are not a second normal execution path. Native/CLI/MCP context interfaces and their legacy intent callers are coordinated separately by root. They must be updated before this cutover is an accepted package.

## Cache and persistence

Evaluation/acceptance cache identity includes effective policy and advice hashes. A cache hit refreshes the current task/lineage/revision/provenance receipt so it cannot return another task's binding. Source snapshots, GLB bytes, image/capture identity, and other geometry-only caches do not gain policy or provenance inputs merely because the acceptance context changed.

Requirements receipts live in render-result and saved delivery metadata, **not GLB extras**. Identical geometry under different policy must retain identical artifact bytes. Checkpoints preserve source reference plus complete requirements provenance, but decoding one only produces an import candidate; activation requires the host's explicit restore/bind operation. Save/edit/restart wiring remains separately visible until its actual callers use the new contract.

## Required regressions

- Neutral input has no category, prop policy, house shape or default grounding obligation.
- Source relabeling and forged source requirements cannot add, erase or downgrade a host request.
- Requested and inferred versions of the same statement produce independent enforcement/advice contexts.
- Unsupported requested checks produce incomplete acceptance; inferred checks cannot cause an enforce decision.
- Existing universal/material exact blockers survive source relabeling and the new evaluator transport.
- Same source and different effective requirements do not share an incompatible acceptance result.
- Semantically equivalent policy can share a disposable result while current binding/provenance is refreshed.
- Checkpoint mutation, wrong hash/revision, legacy runtime arguments, and imported authority claims fail explicitly.
