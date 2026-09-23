# Neutral foliage and rig QA integration

Status: implemented with focused evidence; P13 remains in progress. This is not package or live-harness qualification.

The runtime now invokes `inspectFoliageContact`, `inspectFoliageAdvisory`, `inspectRig` and `inspectRigAdvisory` with host-bound independent requirements. These kernels no longer require or synthesize an AssetIntent/category. Historical fixture adapters remain isolated in the conformance entry points until the data-retirement pass.

## Behavior and defects

- A foliage ground-contact request checks contact markers and visible supports without implying a canopy, standalone scope or material style. Explicit ground planes use the asset frame even when the root is transformed.
- An adversarial instanced support exposed F159: the checker previously ignored instance transforms and accepted a buried copy. Contact bounds now include every instance. General per-instance canopy/growth/repetition qualification remains open.
- Canopy bands run only for an explicit canopy profile; standalone-clutter and material-value advice retain their heuristic modes. Unknown plant subtypes remain unmeasured instead of crashing or receiving a biological correctness claim.
- Rig body plans independently select their declared graph, without needing a category or a second articulated flag. Contact, held-item attachment and clip-list checks are independent. An absent clip list does not forbid extra animation; an explicitly empty list does. Exact loop endpoints and existing graph/attachment findings remain intact.
- Skeleton overlays and fixed-phase motion strips are restored to the neutral export path (F160). Their findings input uses only code/path data shared by report versions. The new export regression checks valid PNGs, byte-identical GLB output with and without diagnostics, and source transform stability.
- Diagnostic allocation size is now bounded to integer 1..2048, matching mobility diagnostics (F161).

## Evidence

Focused red-to-green tests cover custom ground planes, missing versus explicit requirements, instances, graph defects, clip obligations and diagnostics. All 14 vegetation corpus cases and all 16 character cases in the character/vehicle corpus run through the neutral path while preserving their expected and forbidden codes.

- Foliage kernel/conformance check: 29 tests, 125 assertions passed before the additional instance regression; that regression reproduced the buried-instance defect and passed after the fix.
- Vegetation final-byte corpus passes, including deterministic bytes and a rejected floating adversary.
- Rig/view/corpus/export/migration group: 126 tests, 1,211 assertions passed across 10 files.
- Typecheck and lint passed; all bundled runtimes rebuilt. Full integration result is recorded in the root ledger when complete.

The W1 export corpus contains isolated limbs and roof panels. Its export check now binds its actual required parts; these slices are not full biped or storey acceptance tests. Separate neutral domain corpora preserve full-body, storey, contact and roof obligations. The migrated roof-scaffold export tests now require evaluated architecture rules and clean final bytes, while keeping the historical record's unmeasured obligations visible as incomplete.

## Remaining work

Rig locomotion/gait/root-motion coverage is not advertised as complete: the existing heuristic and sampled-motion checks do not prove all requested motion semantics. Unknown foliage subtypes, mixed rigs, skinned/morph geometry, per-instance growth/repetition identity, transformed diagnostic framing, cross-domain composition, final installed-package checks and live trace qualification remain open. No category compatibility runtime was restored, and no public completion claim follows from this checkpoint.
