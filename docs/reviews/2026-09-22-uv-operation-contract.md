# UV operation contract and implementation: G13/G14

`projectUV` is implemented in `src/uv-project.ts` and exposed through the sandbox,
exports and Discovery. The old three projection wrappers are removed, with explicit
migration diagnostics. `src/uv-shapes.ts` retains the distinct remapUV operation.
The behavior table below records the pre-cutover defects, not current APIs.

## Confirmed pre-cutover behavior

| Entry | Existing UVs | Missing UVs | Problem |
| --- | --- | --- | --- |
| boxUnwrap | Copies any existing UVs unchanged | XY bounds projection | Name suggests per-face box projection; side faces can collapse |
| cylinderUnwrap | Copies any existing UVs unchanged | Y-axis, origin-centered cylindrical projection with cap heuristic | Does not fix unrelated UVs, cannot name a frame, and seam-crossing triangles interpolate backwards |
| planeUnwrap | Replaces UVs | XY bounds projection | Actual projection is hidden under unwrap vocabulary |
| remapUV | Transforms U/V | Rejects missing UVs | Already a distinct operation with owned output and tangent invalidation |
| autoUnwrap | Replaces UVs with xatlas charts | Generates xatlas charts | Intentionally different chart/packing operation with changed vertex topology |

## Adopted API direction

Use one explicit `projectUV(geometry, options)` operation for planar, box and
cylindrical projection. Projection mode is required. `frame` uses the existing
rigid GeometryFrame contract: geometry-local origin, Euler XYZ degrees, no parent
transform inference. Planar projects frame XY; box uses triangle face orientation;
cylindrical projects around frame Y. Bounds fitting and angular-span behavior are
stated explicitly rather than guessing a category or object type.

For a cylinder, expose an explicit seam angle and optional start/sweep angular range
so full wraps and directional partial arcs have distinct contracts. Generate UVs per
triangle corner where necessary to split seams and cap/side boundaries. A full-wrap
seam may use U outside 0..1 and requires repeat sampling; it is not an atlas packed
inside a single tile. Explicit planar versus side cap handling must be documented.
Coarse faces crossing more than half a revolution remain ambiguous geometry, not a
mapping guarantee. Projection is not a watertightness or stretch-free unwrap claim.

All paths return owned buffers and leave inputs untouched. Retain position/normal
values, material groups and triangle order; copy supported attributes across split
vertices. Regenerate UV0 only, invalidate tangents with an explicit diagnostic, and
handle unsupported/malformed attributes visibly. Validate finite coordinates,
frames, ranges and expansion budgets before allocation. Keep units independent
of asset labels. Test covariance under translated/rotated frames, non-Y cylinders,
seam and cap interpolation, attribute/material preservation, tangent invalidation,
exported results, and bounded failures.

## Clean migration, no fallback mode

boxUnwrap, cylinderUnwrap and planeUnwrap are retired from the current source.
For retaining valid built-in UVs, use the original geometry when sharing is intended
or `copyGeometry` for independent edits. For intentional remapping use remapUV.
For generating a projection use projectUV explicitly. Keep autoUnwrap for an atlas.
Inspect each existing authored caller: replacing every old call with projection
would change textures that currently retain good built-in UVs. The well's partial
arc UVs require explicit angular extent and visual regression. Update sandbox,
exports, Discovery relationships/examples, skills and source migration guidance in
the same cutover. Removed names get migration errors, not executable aliases.

This direction reduces the three ambiguous shape wrappers to one projection
operation while keeping preservation, UV transformation and atlas creation distinct.
G14 owns implementation and measured acceptance; G27/export tests and final dogfood
must still qualify resulting material appearance.

## Implementation and observed evidence, September 22

The output is owned, nonindexed triangle-corner geometry. Triangle order, material
groups, supported corner attributes and draw range remain intact; regenerated UV0
explicitly invalidates tangents. Projection checks expansion before cloning, with
2 million corners and 128 MiB of expanded attribute storage as separate limits.
Interleaved inputs, both GLB converters and non-Y partial arcs have executable checks.
This does not establish topology, nonoverlap, stretch-free charts or material taste.

TDD began with the missing projectUV import, then reproduced partial-arc floating
point boundaries and ambiguous full-wrap triangles. Focused projection plus example
validation passed 104 tests / 914 assertions. The complete first coverage run found
one stale example-credit hash; all geometry behavior checks passed. Field-gun and
windmill now record the maintainer-directed wrapper migration, retain original model
credits, and preserve their old GPU receipts as historical evidence. They no longer
claim those old posters are exact-source renders of the revised programs.

The well's curved stones now declare their angular spans; the rotated notch uses
the corresponding rotated frame angles, and the inner lining uses an explicit full
wrap. Before and after were rendered through the real GPU service in a separate
workspace. Both report 2680 triangles, 254.7 KB, bounds 1.84 x 2.45 x 1.90, and
accepted structural QA. Direct comparison of both six-view sheets found consistent
brick/wood mapping, silhouette and parts without an obvious new smear or seam.
This is a bounded visual regression, not a universal mapping-quality claim.

Artifacts: `C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/uv-probe/`,
including well-before/after source, GLBs, PNGs and CLI logs. Current complete gate
results and runtime identity are recorded in the implementation ledger and the
[resume checkpoint](../plans/2026-09-22-progress-checkpoint.md).
