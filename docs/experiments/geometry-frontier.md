# Geometry candidate measurements

Measured locally on 2026-09-05 with the installed dependency versions. This is an exploratory engineering comparison, not a cross-machine performance claim. Each case ran in a separate process with a 20-second deadline. Timings include construction and conversion to Three.js geometry, but exclude process startup and Manifold initialization. Each table entry is one run.

Reproduce from the repository root:

```sh
node scripts/geometry-experiments.mjs
```

The runner writes `output/geometry-experiments/results.json`. The [recorded results](geometry-frontier-2026-09-05.json) include bounds, topology diagnostics, elapsed time, and case-specific measurements. These are offline experiments; they do not call model providers.

## General bevel: retain the focused solid helpers

| Candidate | Time | Output triangles | Observation |
|---|---:|---:|---|
| Existing rounded box | 12.9 ms | 156 | Exact requested outer bounds |
| Minkowski erosion/dilation, box | 68.1 ms | 156 | Exact requested outer bounds |
| Rounded holed profile extrusion | 16.7 ms | 288 | Fast; its cap edges deliberately remain sharp |
| Minkowski erosion/dilation, holed box | 1,680.9 ms | 2,062 | Much more work; exported-position diagnostics found four degenerates and eight edges shared by more than two triangles |

**Decision:** keep `roundedBoxGeo`, `extrudeProfile`, and `revolveProfile` as the supported rounding tools. Do not expose this Minkowski prototype as a general edge-bevel modifier. The holed case is not equivalent to the profile helper, because the Minkowski candidate also rounds cap edges. It demonstrates the extra cost of a broader operation, not that the operations are interchangeable.

The topology diagnostic matches positions at `1e-6` after Float32 export. Its findings are downstream representation/tolerance evidence, not a claim that Manifold's internal solid violated its own contract. A future general bevel must handle selected edges, concave junctions, attribute seams, tolerances, and bounded interactive cost before adoption. The experiment and its outcome remain recorded rather than disappearing from the plan.

## Shelling: reject a general normal-offset implementation

The candidate creates an inner surface by moving vertices 0.1 units opposite their averaged normals and reversing its triangles.

| Input | Measured result |
|---|---|
| Sphere | Axis inset approximately 0.1; the simple rounded case behaves as intended |
| Box | Axis inset only 0.033–0.041, despite requesting 0.1 |
| Plate, thickness 0.12 | Inner surface has negative signed volume: it inverted |

All three outputs had closed position-matched edges. That alone did not establish correct wall thickness or a valid cavity.

**Decision:** do not ship this as general `solidify` or shelling. Use explicit inner/outer profiles and Boolean subtraction for authored cavities. General shelling needs feature-aware offsets, boundary treatment, collision handling, and a thickness contract. A restricted planar or analytic-shell helper could be considered separately, with its supported shapes stated in its name and tests.

## Remeshing: keep mesh-to-field reconstruction experimental

The candidate computes distance to input triangles, determines sign with Manifold ray intersections, then samples that field through `implicitSurface` at `edgeLength: 0.15`.

| Input | Time | Triangles before → after | Measured result |
|---|---:|---:|---|
| Box | 123.5 ms | 12 → 4,056 | Bounds retained; near-zero output-vertex distance to source faces |
| Thin plate, thickness 0.06 | 103.0 ms | 12 → 4,056 | Width shrank from 2 to 1.9125; maximum measured output-vertex distance 0.03 |

Neither result retained UVs. The distance statistic checks output vertices against source triangles; it is **not** a two-sided Hausdorff bound and can miss surface loss between vertices.

**Decision:** do not ship this as a general remesh/optimization command. It considerably increases triangle count on a simple input and changes thin features. It remains a reproducible candidate for applications that intentionally want field reconstruction. Adoption would require feature and attribute handling, a defensible error measure, acceleration for larger source meshes, and measured benefit for a declared task.

## Implicit surfaces: expose as an explicit experiment

| Field | Edge length | Time | Triangles | Callback evaluations |
|---|---:|---:|---:|---:|
| Sphere | 0.25 | 15.7 ms | 696 | 2,331 |
| Sphere | 0.10 | 49.1 ms | 6,312 | 29,449 |
| Cellular field inside a sphere | 0.10 | 81.0 ms | 18,732 | 29,449 |

These samples had no boundary, non-manifold-edge, orientation-conflict, or degenerate-triangle findings at the recorded diagnostic tolerance. They do not establish a universal accuracy guarantee.

**Decision:** expose `implicitSurface` with an experimental label, required bounds/resolution, an up-front grid-size check, and an actual callback count limit. It offers a useful new way to author organic and cellular forms without pretending to preserve arbitrary mesh attributes. It returns no UVs. Thin features and bounds need visual review. Process-based evaluation is still required to stop a callback that never returns; an evaluation counter cannot interrupt such a callback.

## Representative-shape follow-up

The [acceptance follow-up](geometry-acceptance.md) adds twelve cases: concave/mixed/thin bevels, inward/outward capped open and curved shells, and remeshing of warped, uneven and Boolean geometry. It records a real triangle-quality benefit for field reconstruction while preserving the experimental status and explicit error/attribute limits.

## What these decisions do and do not establish

The ordinary geometry, deformation, sweep, loft, and Boolean-preservation features have deterministic tests and export checks elsewhere in the suite. This report records why advanced candidates were adopted experimentally or declined as general-purpose APIs. It does not certify model-generated aesthetic quality, runtime performance on every device, manufacturing tolerances, or arbitrary-shape correctness.

The [implicit-surface follow-up](implicit-acceptance.md) measures organic, mixed sharp/smooth and cellular fields at two resolutions, with repeated hashes and field residuals. Its fine cellular case records downstream topology findings under a different sampling grid; the earlier clean fixture is not a general guarantee.
