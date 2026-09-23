# Geometry correctness implementation: G01-G09

Date: 2026-09-21. Base: `b81cfd4caed64bd90547ff83b4e513e59a1d4913`, with uncommitted shared-worktree changes. These are implementation and focused-test results, not a release qualification receipt. No commit, push, provider call, or user-owned `qa/` change was made.

## Implemented behavior

| Task | Change | Evidence |
| --- | --- | --- |
| G01 | Reverse triangle indices after the baked negative-Z wing reflection, then recompute normals. | Both wings have positive signed volume, reflected vertex normals and bounds; front-sided downward ray tests hit the top surface; single-sided GLB export retains positive local signed volume. |
| G02 | `arrayRadial` carries source scale into each repeated mesh. | Every radial copy keeps the nonuniform `[2,3,4]` scale. |
| G03 | Preserve default orbit-only `outward` orientation; add an explicit seventh argument `{ orientation: 'relative' }` to compose the orbit quaternion with the source quaternion. | Tests check the default quaternion and arbitrary authored source rotation composed at every quarter turn. |
| G04 | `mirror` reflects the full local transform and decomposes the result into signed TRS; reject nonfinite, singular or manually sheared local matrices rather than approximating them. | Vertex coordinates match mathematical reflection on X/Y/Z below translated, rotated, nonuniformly scaled parents; single-sided rays hit the expected reflected face; GLB round trip preserves all reflected world vertices. |
| G05 | `snapTo` updates both ancestors and descendants before comparing world bounds. | A parent moved, rotated and scaled after an earlier world update now closes the measured gap with the correct parent-space translation. |
| G06 | Set the room floor center to `-floorThickness / 2`, so the floor top is at local Y=0. | Bounds match the documented room convention and `createGableShell`. |
| G07 | Add one shared validated wall segmentation implementation used by `wallWithOpening`, `room`, and gable shell walls. | Two doors plus a stacked window remain real holes. Stacked partial-width openings on either axis preserve exact solid volume. Actual overlapping rectangles, out-of-wall cuts and nonfinite dimensions throw. Failed shells do not attach partial output to the caller's parent. |
| G08 | Require stair count to be a positive finite safe integer before construction. | Fractional, NaN, infinite, zero and negative counts fail; a valid six-step flight retains the requested rise/run extents. |
| G09 | Require both atlas grid dimensions to be positive finite safe integers before allocating geometry. | Zero, negative, fractional, NaN and infinite dimensions fail with the field name; valid UVs remain finite. |

The follow-up adversarial pass found another wall inconsistency: the old room builder discarded panels narrower than `1e-4`, while the gable builder discarded them below a different threshold. Both now retain all positive-width/height segments that the shared builder produces. A permanent regression first reproduced one panel instead of three for a valid narrow-jamb doorway and now passes for both constructors.

## Public contracts and migration implications

`arrayRadial(name, source, count, axis?, parent?, center?, options?)` still returns the additional mesh copies, excluding the unchanged source. The default `outward` setting deliberately ignores the source orientation, preserving the existing convention. `relative` uses orbit rotation multiplied by the source rotation. Positions, center and axis are interpreted in parent-local coordinates; choosing a different output parent does not automatically convert from the source parent's world frame.

`mirror` has the same signature, but now reflects the source frame correctly. The mirror plane passes through the parent-local origin. A source with manually authored local shear or singular scale fails explicitly. Shear that arises in world space from an ordinary transformed ancestor remains supported because reflection operates before the parent transform. Mesh resources remain shared. These helpers still inherit `createInstance`'s mesh-only extraction limitation; whole-assembly reuse belongs to the separate C tasks.

`wallWithOpening` accepts either the existing singular `opening` or a new `openings` array, never both. `room` consumes every entry in its existing openings array. The shared builder tiles the solid complement of rectangular cuts, allowing horizontally overlapping spans when the rectangles are vertically separated. Cut interiors must not overlap; boundaries may touch. Side and top bounds must fit strictly within the wall, while doors reach Y=0. Invalid cuts are rejected rather than clipped. Existing single-opening panel names are retained.

Wall segmentation no longer inserts the old room builder's 0.02-unit lintel/sill overlap into adjacent panels. Shared panels meet exactly, so their summed volume describes the solid wall without duplicate overlap. This is a construction change requiring the integrated QA/example campaign, not an assertion that every old asset is already qualified.

Regenerating source using `room` moves its floor down by one floor thickness compared with the buggy behavior; existing GLBs are untouched. A program that intentionally wants its floor top raised above the local wall base must now author that offset explicitly. Source depending on silently clipped/out-of-bounds openings must correct the aperture or wall dimensions. The root-owned discovery metadata, migration guidance and final package qualification still need to incorporate these contracts.

## Audit correction

The historical geometry audit said the gable shell already built multiple wall openings. Current source inspection showed that it filtered per-wall inputs but then explicitly rejected more than one opening. This implementation removes that restriction through the shared builder. The historical audit file was left intact; this is the corrected implementation evidence.

## Test-driven evidence

1. Added `src/__tests__/geometry-composition-regression.test.ts` before runtime changes. With `KILN_RENDER=cpu`, `bun test src/__tests__/geometry-composition-regression.test.ts --timeout 20000` produced **0 pass, 13 fail, 20 assertions**. Failures included left-wing volume `-0.01800000031292437`, lost radial scale, incorrect reflected vertices, accepted shear, stale snap bounds, positive floor datum, rejected second gable opening, accepted fractional stairs and nonfinite UVs.
2. Implemented the first repair tranche. The same command produced **13 pass, 0 fail, 89 assertions**.
3. Added adversarial reflected-export/normal and stacked-wall-volume checks. Those passed against the implementation. Added the narrow-jamb check and observed its expected failure: **0 pass, 1 fail**, expected three panels, received one. Removed inconsistent positive-size cutoffs; the complete regression file then produced **16 pass, 0 fail, 149 assertions**.
4. Final focused gate, using Bun 1.4.2 and CPU mode:

   ```powershell
   $env:KILN_RENDER='cpu'
   bun test src/__tests__/primitives.test.ts src/__tests__/architecture.test.ts src/__tests__/architecture-expansion-gate.test.ts src/__tests__/billboard-primitives.test.ts src/__tests__/ops.test.ts src/__tests__/geometry-composition-regression.test.ts src/__tests__/geometry-export-contract.test.ts --timeout 20000
   ```

   Result: **151 pass, 0 fail, 1,731 assertions across seven files**.

5. `bunx --no-install biome check --error-on-warnings src/primitives.ts src/ops.ts src/architecture.ts src/wall-panels.ts src/__tests__/geometry-composition-regression.test.ts` passed. `git diff --check` passed.
6. One repository `bun run typecheck` snapshot encountered concurrent requirements modules not yet written and a discovery test fixture typing error. It reported no errors in this tranche's files. Full typecheck, lint, test and coverage gates remain root-owned integration work after the parallel lanes settle; this report does not label that snapshot green.

Remaining qualification is explicit: source migration/catalog updates, assembly-reuse semantics, broad finite/size budgets, integrated QA false-positive checks, authored examples, visual dogfooding and installed-package/destination validation belong to the plan's other tasks. Focused structural/export regression coverage is evidence for these fixes, not a replacement for those checks.
