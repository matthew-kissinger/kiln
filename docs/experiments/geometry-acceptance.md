# Bevel, shell and remesh acceptance follow-up

## Current checkout decision, September 23

E01–E03 are evaluated using the original cases below, repeated on runtime
`1276ef6a…82c774c` after the Float32 solid-conversion correction. The
[current receipt](geometry-acceptance-2026-09-23.json) preserves all twelve cases
and three supported shell-construction alternatives. The older results below
remain historical evidence. No new general-purpose modifier is promoted.

- **Shell:** the open-sheet prototype still drops UVs and folds across the axis
  when an inward 0.1 offset exceeds the 0.06 curvature radius, despite clean
  topology counters. Keep it experimental. Current `extrudeProfile` produces a
  planar 0.1 wall; explicit inner/outer `revolveProfile` contours produce 0.1 and
  0.01 radial walls. Each passed 96 independent triangle-ray samples and topology
  checks. At 96 segments, midpoint-facet thickness is `t * cos(PI / 96)`, rather
  than exactly the analytic radial difference. These supported constructions
  require authored contours and new material/UV assignment; they do not offset
  arbitrary textured meshes or certify global minimum thickness.
- **Bevel:** profile rounding remains the practical bounded tool. The refreshed
  concave Minkowski case drops from 1,514 to 1,500 triangles and its diagnostic
  findings clear. The mixed case drops from 1,582 to 1,574, with four degeneracy
  and four over-shared-edge findings at the current relative diagnostic tolerance.
  Those tolerance-based findings differ from the exact-zero faces addressed by
  the conversion fix. Thin erosion still becomes empty; arbitrary selected-edge
  control and attribute transport remain absent. Decline a general modifier.
  Current profile erosion failures now include repair advice through CLI/MCP.
- **Remesh:** the three field reconstructions retain the earlier triangle counts
  (1,798 / 1,560 / 2,712), sampled shape errors and attribute loss. Warped and
  Boolean inputs gain better triangle proportions, but finite sampling cannot
  guarantee preservation of features. Keep field reconstruction experimental;
  explicit source segmentation remains appropriate when the authored surface
  must be retained. The refinement control's sampled error stays below `4e-8`;
  it neither improves aspect ratios nor establishes attribute transfer.

These are completed bounded evaluations, not three newly shipped capabilities.
The existing public helpers and the measured alternatives satisfy the useful
construction cases without silently adding destructive general modifiers. E05's
broader intersection diagnostics, C09's API consolidation and the aggregate C10
decision remain separate work. No gallery asset was repaired or regenerated.

## Original September 5 evaluation

This follow-up covers the representative shapes missing from the [initial experiments](geometry-frontier.md). Run `node scripts/geometry-acceptance.mjs` to reproduce its twelve offline cases. Each gets a separate Bun process and a 20-second deadline. The [receipt](geometry-acceptance-2026-09-05.json) records dimensions, topology, error samples, attributes and timings. These are exploratory single-run timings while other validation was active, not comparative performance benchmarks.

## Bevel: concave junctions, mixed surfaces and thin features

| Input/candidate | Time | Triangles | Result |
| --- | ---: | ---: | --- |
| Concave cross, profile rounding | 18.9 ms | 284 | Outer bounds retained; no recorded topology findings; cap edges remain sharp |
| Same cross, Minkowski erosion/dilation | 1,248 ms | 1,514 | Outer bounds retained; sampled corner displacement 0.0732; 14 degenerate triangles and eight over-shared edges after Float32 conversion |
| Cylinder joined to square flange, Minkowski | 2,861 ms | 1,582 | Outer bounds retained; sampled displacement 0.0732; 12 degenerates and ten over-shared edges |
| Plate 0.12 thick, rounding radius 0.1 | 94 ms | 0 | Erosion removes the input; the candidate rejects further construction |

The profile control and Minkowski operation are intentionally different: profile rounding controls sweep-parallel edges, while Minkowski also changes caps. Neither candidate exposes arbitrary selected-edge control. The position-only Minkowski path does not transport UVs, materials, or source-face identity. Diagnostic findings are at the downstream Float32 position-matching tolerance, not assertions about Manifold's internal exact-solid contract.

The thin-feature trial initially revealed a missing empty-result guard: blindly dilating an empty erosion produced the kernel itself. The recorded candidate now checks for empty erosion and returns no geometry. That is an actionable unsupported case, not a successful bevel.

**Decision: decline a stable general bevel API from this candidate.** Existing profile rounding remains supported for its stated edge class. These broader cases reinforce that a valid general tool needs selected-edge semantics, feature limits, attribute handling, and trustworthy exported topology. Preserved outer bounds do not mean preserved corners or manufacturing dimensions.

## Shell: meaningful offsets and capped boundaries

A second prototype thickens one indexed, oriented open sheet. It copies the sheet along its normals, reverses the opposite skin, and connects each boundary edge. This tests the open-surface case omitted by the original closed-solid experiment.

| Input | Signed offset | Evidence |
| --- | ---: | --- |
| 2 by 2 plane | -0.1 and +0.1 | Correct inward/outward bounds, volume 0.4, boundary caps closed |
| Radius-1 cylindrical sheet covering 270 degrees | -0.1 and +0.1 | Corresponding vertices move 0.1 within Float32 error; cap/topology checks pass |
| Radius-0.06 cylindrical sheet | -0.1 | Offset passes through the analytic axis; closed edges and positive volume still fail to identify the fold |

The curved values measure corresponding vertex travel, not a global minimum wall thickness. Sampled normals near open boundaries differ slightly from analytic radial normals. The close-curvature case demonstrates why successful planar caps are insufficient evidence for a general shell tool.

Input sheets contain UVs; this prototype drops them and does not assign independent skin/rim materials. It does not weld arbitrary seams, identify general self-intersections, or validate a curvature-dependent maximum thickness. A focused regression checks both plane directions, their thickness and closed topology.

**Decision: keep the capped-sheet prototype experimental; decline general solidify.** Planar and analytic curved sheets are a useful restricted direction. Stable adoption needs explicit accepted input classes, actionable collision/thickness rejection, cap UV/material policy and tests for seams and branching boundaries. Authored inner/outer profiles remain the supported way to construct cavities.

## Remesh: triangle quality versus shape and attributes

The field reconstruction now runs on a warped cylinder, an anisotropically scaled sphere, and a Boolean-cut plate. It is compared with Manifold's plain triangle-refinement control. The control adds triangles without changing the underlying piecewise-linear surface.

| Input | Triangles before / field / control | Median aspect before / field | Sampled source-to-field error | Sampled field-to-source error |
| --- | ---: | ---: | ---: | ---: |
| Warped cylinder | 540 / 1,798 / 2,160 | 9.17 / 1.95 | 0.0798 | 0.0422 |
| Uneven ellipsoid | 288 / 1,560 / 1,152 | 2.03 / 1.98 | 0.0493 | 0.0312 |
| Boolean-cut plate | 112 / 2,712 / 448 | 8.63 / 2.00 | 0.0659 | 0.0408 |

Aspect is longest-edge squared divided by twice triangle area; lower is better, with an equilateral value around 1.155. Field reconstruction improves poor triangle shapes substantially for the warped and Boolean cases; it barely improves the ellipsoid median. The refinement control retains the original aspect distribution and has sampled surface error below 4e-8. Field volumes shrink about 1.8-1.9% on these fixtures. Field runs took 299-558 ms including the error measurements.

Error samples include vertices and centroids from at most 192 triangles in each direction. Degenerate target triangles are excluded from distance calculation. This improves on the original one-sided vertex-only check, but remains a finite sampled estimate, not a Hausdorff bound. The warped fixture tests post-deformation triangle quality; it does not claim repair of every invalid topology. The Boolean fixture tests long, thin triangles around a cut, not every difficult Boolean arrangement.

Tagged input UVs, a material group and source-face IDs are all absent from field output. Tags make loss observable; this is not a claim that the inputs had production-quality texture atlases. Plain refinement is a geometry control here, not a demonstrated material-preserving pipeline.

**Decision: keep mesh-to-field reconstruction experimental, not a stable repair/optimization API.** There is now a measured benefit for poorly shaped triangles, alongside concrete shape error, more geometry and lost attributes. That tradeoff may suit untextured deformation or sculpting workflows with a declared tolerance; it does not suit dimension-sensitive or textured assets by default. Stable adoption needs an accelerated distance/sign implementation, meaningful task-specific error bounds, feature checks and explicit attribute transfer or rejection.

## Acceptance disposition

X1 has representative convex, holed, concave, mixed and thin-feature evidence and is declined as a general API. X2 demonstrates both offset directions and open/curved boundary caps, but remains experimental because collision/thickness and attribute guarantees are missing. X3 demonstrates both a useful triangle-quality benefit and its cost on all three requested input classes, and remains experimental pending error/attribute guarantees. No new stable helper is advertised from these prototypes.
