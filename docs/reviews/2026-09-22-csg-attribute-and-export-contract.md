# CSG attribute and exporter qualification

G27 has a direct conformance matrix rather than an assumption that a successful
Boolean or valid GLB preserves the author's data. The previous coordinate-frame
fix and its GPU evidence remain in the [frame report](2026-09-22-csg-computation-frame.md).

## Observed failures and corrections

Five new tests initially failed: both preservation modes silently discarded extra
attributes and source diagnostics, and instanced, skinned and active-morph operands
silently used base geometry. The other 22 new checks passed before implementation;
they qualify existing behavior and are not claimed as new fixes.

CSG now names dropped colors, secondary UVs, tangents, skin/custom attributes and
inactive morph targets. It carries prior attribute/geometry diagnostics onto the
output, copies their records and deduplicates identical messages. Both exporters
surface those warnings. UV0/material preservation remains opt-in; the documented
default first-material/no-UV mode is deliberate. Normals are regenerated. Arbitrary
user metadata, animation and morph correspondences are not retained.

Instanced meshes, skinned meshes and active morph influences are rejected with an
instruction to bake the intended instances or pose into static triangle meshes.
This replaces silently incorrect operand shapes, not a working instance/pose bake.
No automatic baking feature is claimed. Static base geometry with inactive morph
targets can be used, but the target loss is reported.

## Evidence and boundary

`src/__tests__/csg-attribute-contract.test.ts` contributes 27 tests. Combined with
the existing CSG suites, **66 tests / 2834 assertions** pass:

- All four operations, both attribute modes and both exporters: 16 combinations
  compare complete oriented triangle corner records, including normals, UVs and
  material assignment, independent of primitive splitting/index welding.
- Textured differences through both exporters use retained UV0 or explicit unwrap.
  Albedo and normal images are embedded; regenerated tangent vectors are unit length,
  perpendicular to normals, and have valid handedness. No glTF validation errors.
- Missing/empty operands, disjoint intersections and fully removed bodies reject
  with useful diagnostics in both modes and leave source geometry unchanged.
- Existing tests cover interpolated cut-face UVs, material groups, retained source
  runs and face IDs, missing-UV warnings, hull's unknown provenance, reflected parents,
  smooth UV seams and distant coordinates. The prior 112-row scale probe is reused.

The unsupported-attribute fixture also verifies that mutating an inherited output
diagnostic cannot mutate the source. Export warnings are inspected on both actual
converter paths. The computation for supported static operands is unchanged in this slice; prior GPU
comparisons are retained as earlier evidence, not relabeled with the new identity.

This qualifies CSG's stated static-mesh/UV0/material export contract. It does not
qualify every destination application's shader or playback behavior, promise all
vertex attributes, or provide universal solid/self-intersection certification.
Those destination, advanced-geometry and final dogfood tasks remain independent.

Typecheck, lint (639 files), six skills/two setup copies, and runtime rebuild pass.
Current runtime: `sha256:38474183f640104e9228510cfed0ddb5a15ed341feb24d2c9155f9640afe3813`.
Full gate: **2451 passed, 4 skipped, 0 failed**, 2455 tests across 290 files,
58910 assertions, 173.73 seconds. Coverage: 95.07% functions / 92.66% lines,
above unchanged 94.00% / 92.10% thresholds. All five bundle hashes and freshly
computed source identities match. Red/focused/prompt/typecheck/lint/build/coverage
logs are retained under the external campaign's `csg-regression/logs/` directory.
G27 is implemented against its stated local contract; final installed-package,
destination and diverse-agent qualification remains in the V/H tasks.
