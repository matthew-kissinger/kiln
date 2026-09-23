# Geometry allocation and repetition bounds

Status: focused implementation for G21/G22; installed-package and final dogfood qualification remain open.

The new `geometry-budget.ts` constants define per-call computational admission limits. They do not inspect asset category, style, dimensions or floor count.

- `parametricSurface`: at most 262,144 samples including endpoints; safe-integer product and finite nonzero domain extents checked before calling user code or allocating sampling arrays.
- `subdivide`: integer iterations 0..10, with a conservative triangle estimate before cloning or welding. Presplit contributes up to four triangles per input face and every iteration multiplies by four. Reject above 1,000,000 estimated triangles or 128 MiB of estimated output attribute storage, including morph channels. The pinned upstream implementation was inspected: its `edgeSplit` reserves four faces per source triangle, and `modify` otherwise defaults to an infinite triangle limit. Kiln does not use upstream's silent early-stop behavior as successful completion.
- `arrayLinear` / `arrayRadial`: safe-integer count 1..10,000 including the existing source. Validate finite frames, offsets/center and every final position before attaching copies. Radial axis and orientation values are explicit errors. Preserve source resources, rotation policy, coordinate frame and the original arithmetic for accepted normal workloads.

These bounds do not promise peak memory or callback termination. They bound each requested operation; evaluator process/deadline limits still protect the total authored program. The attribute estimate is conservative when a weld drops channels. No workload is silently clamped.

## Evidence

Focused failing tests used sentinel callbacks, clone overrides and destination hooks, so excessive inputs could be reproduced without allocating the excessive workloads. Initial result: four expected failures. Adversarial follow-up reproduced finite-endpoint domain subtraction overflow and non-finite source transforms; both now reject before work or graph mutation. Boundary tests include the exact permitted sample count, default presplit multiplication, morph-attribute storage and radial overflow.

The focused geometry/ops/composition/catalog group passed its behavioral checks. Two prompt snapshots changed only by the newly published sample-budget sentence; reviewed and updated. Typecheck and lint passed after formatting. Full integration and ordinary workload measurements are recorded in the root checkpoint and appended below when complete.

Discovery contract metadata and `docs/geometry.md` expose the same numeric budgets and limitations. Broader primitive dimension domains, specialized shapes, mesh metrics, seam preservation and cross-scale qualification remain separate G tasks.


## Integrated checkpoint and workstation observations

Rebuilt runtime `sha256:ac390b7f5f4ab6181300c88ae38ff2870ae5288e856aac45a8561b4dd0954758`: **2,334 pass, four skip, zero failures; 54,949 assertions across 272 files** (132.92 seconds). The two reviewed snapshots publish the sample-budget sentence. Existing primitive, array, normal/UV, authored-example and native harness tests remain green.

The reproducible offline script is `scripts/research-geometry/allocation-benchmark.ts`; raw results are in `2026-09-21-geometry-allocation-measurements.json`. On this Windows x64 workstation with Bun 1.4.2, the exact 262,144-sample boundary produced 522,242 triangles in 299.94 ms; the 80x80 case took 12.30 ms. Box subdivision at three/five iterations took 21.61/257.01 ms. Linear/radial counts of 10,000 produced 9,999 additional shared-resource meshes in 20.64/21.23 ms. Whole-process maximum RSS was 281,368 KiB across the sequence. These are single-process local observations, not a peak-memory bound or end-user Node qualification. Bun's reported Node compatibility version is recorded separately from the actual runtime.
