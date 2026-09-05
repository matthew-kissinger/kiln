# Local finish line — 5 September 2026

**Latest scope:** the owner added a fifteen-attempt showcase batch after the engine
gate and existing gallery refresh passed. The active atomic tasks are in the
[showcase expansion checklist](showcase-expansion-2026-09-05.md). The earlier local
verification sequence below is historical context; it is not a request to rerun
unchanged engine or package checks.

The owner has deferred native Mac validation to future community contributions: no Mac hardware is available. Genuine browser zoom, reduced-motion-on, physical mobile testing and a same-model cross-harness comparison remain useful unverified follow-ups; they no longer block this local candidate. None is presented as passed. Public publication remains a separate owner decision.

## Complete

- Engine geometry, source references, camera controls, caches and project-local setup are implemented. Five skills and three required model-route checks are complete, with original package identities retained.
- Public selection is now 63 assets: the requested removals remain excluded, and ten of fifteen fresh showcase attempts were accepted. The earlier 53 neutral-light images and ten accepted additions were visually reviewed; all use the same square gallery recipe.
- Site, README, guides, source-edit and camera demonstrations are complete. Responsive detail layout, text contrast and the brief/revision dialog were reviewed. Fourteen recorded examples expose 46 hash-verified source snapshots; unknown histories remain explicit. All 235 source/GLB/thumbnail/revision downloads passed final HTTP hash checks.
- The proven Windows/Bun fd3 response race has a narrow fix: 13 focused tests / 71 assertions passed. A complete response and exit zero may survive only the observed fd3 EBADF case; startup, stdin, malformed response, cancellation and other failures are not generally suppressed.

## Completed local checks

| Task | State | Owner / dependency |
| --- | --- | --- |
| Finish the full offline gate in the pinned Linux CI environment. | Done: 1,720 passed, two existing skips, zero failures; 95.60% function/92.55% line coverage. Windows native GLib fault remains unresolved, not falsely repaired. | [Full gate](../evaluation/results/linux-fullgate-2026-09-05.md). |
| Freeze runtime and create the final immutable tarball. | Runtime candidate 0d457e8f is frozen. The docs-only distribution has a companion archive/equivalence receipt. | All runtime/setup/skills/dependency components must match the original tested candidate. |
| Verify the same new tarball on Windows and Linux. | Done: all 15checks passed on both platforms for exact0d457e8f. Docs-only repack retains these receipts with their actual tested identity. | No repeated functional run unless a runtime/setup/dependency component changes. |
| Check runtime delta and preserve exact model-evidence scope. | Done:204→0d production delta is only Windows/Bun fd3 guard, inactive under standard Node. All packaged skills match. Earlier recertifications retain833; the fifteen new authoring attempts use0d directly. | [Delta receipt](../evaluation/results/runtime-delta-0d457e8f-2026-09-05.json). |
| Verify site build records against the frozen inputs and reconcile final reports/inventory. | Done: final63 build, source/GLB/poster records, 235 HTTP downloads and browser review passed; reports and inventory reconciled. | [Final gallery review](../evaluation/results/final-gallery-review-2026-09-05.md). |

The subsequently authorized fifteen-attempt showcase batch is the remaining creative scope. Finish its curation and documentation alongside packaging; additional engine features, model comparisons and publication are outside this closeout.

## Deferred follow-ups

| Follow-up | Current evidence / limit |
| --- | --- |
| Native Apple Silicon and Intel Mac package checks | Explicitly deferred by the owner to community testing/PRs. CI and installation guidance exist; neither architecture is advertised as verified. Apple GPU support is also unverified. |
| Genuine 200% browser zoom | The available shortcut did not change actual zoom. CSS scaling and responsive widths are not equivalent evidence. |
| Reduced-motion preference on | Source rules inspected; active preference behavior not exercised. |
| Physical mobile device review | Responsive desktop-browser measurements passed; no physical device result claimed. |
| Same exact model across two authenticated harnesses | No shared authorized route available. Existing pilot cannot isolate harness superiority. |

These may proceed independently when contributors have the appropriate surfaces. No credential copying, purchased fallback, global preference changes or remote publication is implied.

## Evidence

[Main plan](2026-09-05-engine-and-oss-experience.md), [candidate report](../evaluation/release-candidate-2026-09-05.md), [platform matrix](../evaluation/platform-matrix.md), [site review](../evaluation/site-review.md), [history and contrast](../evaluation/results/gallery-history-and-contrast-2026-09-05.md), [working-tree inventory](../evaluation/results/working-tree-inventory-2026-09-05.md), [pipe trace](../evaluation/results/windows-pipe-trace-2026-09-05.md).
