# Geometry scale contracts and remaining CSG precision defect

G24 has additional implemented corrections and measured limits. It remains in
progress, alongside G27. No general solid-validity, CAD or destination-import
qualification follows from these tests.

## Reproduced and corrected

The first focused run failed all four new cases. A valid box at scale `1e-12`
reported all 12 triangles degenerate. A proportionally open periodic sheet at that
scale was silently snapped closed. A translated open sheet could also pass because
endpoint tolerance grew with its absolute coordinates. Separate surfaces at scale
`1e-15` were blended by the crease-normal tolerance floor: the first normal's Y
component became approximately `-0.382683` instead of zero.

`geometryDiagnostics` now uses `1e-6` times the finite-position bounding-box diagonal
by default, while an explicit numeric tolerance retains absolute distance semantics.
Results expose effective `tolerance`, `toleranceMode` and `positionScale`. Area
comparisons use normalized edges, and position quantization is relative to the
bounds minimum. Nonfinite positions remain reported; their triangles do not
contribute meaningless area/edge counts. Collapsed geometry still reports degenerate
triangles. Explicit tolerances too fine for safe integer quantization are rejected.

Periodic matching uses the sampled extent without an absolute-coordinate scale or
world-unit floor. `creaseNormals` uses its relative `1e-8` tolerance without the
old `1e-12` floor, with normalized edge arithmetic for face normals. Neither
operation changes input buffers. Discovery signatures/contracts, generated prompt
snapshots, geometry documentation and explicit migration guidance now agree.

These remain approximate grid-based seam counts, not exact radius welding or a
self-intersection test. A large combined mesh can contain fine features below its
relative tolerance; choose a deliberate absolute tolerance for that inspection.
Float32 position storage also limits small detail at distant origins, independently
of these diagnostic changes.

## Evidence

- Focused conformance: 43 passing tests / 2,521 assertions across scale, existing
  authoring/composition and catalog contracts. Additional prompt checks: 9 pass,
  2 existing skipped obsolete skill checks, 630 assertions.
- Valid solid/open-sheet/collapsed-face cases span `1e-12` through `1e12`.
  Periodic UV wraps/normals span `1e-12` through `1e12`; separate crease surfaces
  span `1e-15` through `1e15`. Translation, explicit absolute tolerance, malformed
  data and input ownership have direct checks. These are bounded fixtures.
- Full gate: **2,420 pass, 4 skip, 0 fail**, 2,424 tests / 288 files /
  57,540 assertions, 139.14 seconds. Coverage: 95.06% functions and 92.65% lines,
  above unchanged 94.00% / 92.10% thresholds. Typecheck, lint, six skills/two
  registered copies and whitespace checks pass.
- All five rebuilt Node entries match
  `sha256:d2ae21d36a76911fa7da57bf790463d9745eb6d1d9a961b7dcaa6e4fdeacef57`.
  Logs: `%TEMP%/kiln-scale-{focused,prompt,typecheck,runtime-build,coverage}.log`.
  The renderer implementation was unchanged; its prior 73-test result is retained.

## CSG probe: clear next defect

`scripts/research-geometry/scale-probe.ts` measures union, difference, intersection
and hull of overlapping boxes, with and without attribute preservation. Seven
scales from `1e-12` through `1e12` and two origins produce 112 rows. The result is
retained at
`C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/csg-scale-probe.json`, including
source hashes and errors rather than filtered successful rows.

All 56 cases at the local origin return the expected closed topology, unit normals,
and analytical normalized volume within `1.28e-7`. All 56 equivalent cases translated
by `1e8` times their size fail with `Non-finite vertex`. The bridge currently applies
world transforms before storing operands as Float32. A unit box at X=`1e8` has
encoded width zero (`fround(1e8 + .5) - fround(1e8 - .5)`), demonstrating local detail
loss at that boundary. The library message alone does not describe the finite input
or this precision limit adequately.

F180-F182 track the corrected diagnostic/seam/normal defects. F183 tracks this
unresolved CSG precision failure. Next: qualify a common local computation frame
for all operands and preserve its world placement, source/material/UV provenance
and both exporter results. Do not silently rescale individual operands, discard
transforms, relax solid checks, or count these failed rows as acceptance. Broader
tiny/large geometry policy, sweep tolerances and CSG/export qualification remain open.

## Follow-up disposition

The subsequent [CSG computation-frame slice](2026-09-22-csg-computation-frame.md)
corrects F183 and repeats all 112 cases successfully, with both exporters and
before/after gallery regression evidence. The failure discussion above describes
the preserved baseline, not the current implementation. Broader G24/G27 acceptance
remains open; use the progress checkpoint for the latest runtime and gate result.

Current disposition: subsequent [sweep scale](2026-09-23-sweep-scale.md) and
[topology tolerance](2026-09-23-topology-tolerance-collapse.md) work completes G24
bounded qualification. Earlier open-state statements above are historical. See
the checkpoint for the current candidate and remaining QA limits.
