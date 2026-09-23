# Bounded loft, sweep and hollow-profile comparison

E04 comparison outcome: retain explicit vertex correspondence for lofts and transported
profiles for sweeps. Holed straight/twisted/tapered sections already have a useful
`extrudeProfile` path. Independently changing inner/outer contours can use explicit
solid subtraction in the measured nested-profile case. This evidence does not
justify an automatic contour-matching or general hollow-loft API.

E04's bounded comparison and rejection work is implemented. The demonstrated
collapsed-correspondence control now fails with shared CLI/MCP repair advice.
This local check cannot infer meaningful vertex correspondence or rule out every
crossed surface. Broader intersection diagnostics remain under E05; do not repeat
the completed comparison as another research lane.

One concrete defect is fixed: JavaScript callers could pass `holes` to a loft
section or loft/sweep options and receive filled geometry without an error.
Those requests now fail with an engine-owned diagnostic. Actual compiled Node CLI
and standalone MCP return identical advice, with no erroneous GLB or image;
a holed extrusion control still exports. The first CLI check caught generic worker
redaction of the new message; the existing safe diagnostic mechanism now preserves
the repair advice without exposing arbitrary exception text.

## Measurements

Reproduce with:

```sh
bun scripts/research-geometry/loft-comparison.ts /absolute/output.json
```

Nine geometry fixtures inspect returned helper geometry, normals, UVs, topology counts,
signed volume, unchanged input data and three ray-sampled wall sections. They do
not use an agent's self-assessment. Runtime source hashes are in the receipt.

| Construction | Measured result | Practical limit |
| --- | --- | --- |
| Straight square extrusion with a square hole | Volume 6.000000; 48 triangles; closed, consistently oriented boundaries | Normals present, UVs absent; project or unwrap before directional textures. |
| Anisotropically tapered version | Volume 3.89999996 versus analytic 3.9; 288 triangles | Inner and outer contours share the same taper transform. |
| Holed 40-degree twist plus taper | Volume error 4.201%, 1.168%, 0.300% at 8, 32, 128 divisions; 160, 544, 2,080 triangles | More divisions improve this discretization at a measured geometry cost; a coarse result is not an exact continuous sweep. Existing profile tests already document the same overshoot mechanism. |
| Three asymmetric loft sections in explicit translated/rotated frames | Capped: 36 triangles and no boundary edges. Uncapped: 32 triangles and eight boundary edges. Both retain finite unit normals and generated UVs | Uncapping opens ends; it creates no inner wall. Equal point counts alone do not identify meaningful correspondence. |
| Bent polyline sweep with station scales | 36 triangles, UVs and finite unit normals; no boundary/orientation defects in this fixture | Transports one cross-section; does not independently evolve holes or smooth the input polyline. |
| Separate nested tapered lofts, explicit boolean subtraction | Volume 2.52000005 versus analytic 2.52; 56 triangles, UVs retained with `preserveAttributes:true`. Three cross-sections each measure 0.200000 m wall width along X | Cutter extends through both caps. Demonstrated for nested tapered rectangles only; sampled axis gaps are not minimum normal thickness. |

Positive capped fixtures have zero counted boundary, nonmanifold, orientation or
degenerate-triangle defects. These counts do not establish global solid validity.
Unequal section counts, a self-crossing outline and an unsupported hole request
are visibly rejected. Inputs remain unchanged.

The original adversarial correspondence control shifts the square's start vertex by two
positions between sections. All four connecting edges coincide at mid-height,
yet the old output had zero boundary/nonmanifold/orientation/degenerate counts,
finite normals and a positive signed volume. The existing unchecked-intersection
warning was insufficient. This demonstrates why arbitrary equal-count correspondence cannot
be promoted to a valid-solid claim or silently inferred from point counts.
The local collapse is now rejected, as documented below. Choose corresponding
starts/order deliberately; other crossed 3D sections still need inspection.
E05 owns further bounded intersection-detection work.

## Disposition and evidence

- Keep the current distinct APIs; no automatic matching, resampling or new helper.
- Adopt explicit hole rejection and repair advice through the shared evaluator.
- Use existing holed extrusion where one transformed section is sufficient.
- Treat independently varying hollow construction as explicit geometry/CSG with
  qualified inputs, preserving the measured limits above.
- Tiny/large scale tolerance, arbitrary curved contour pairs, destination imports
  and visual texture quality are outside this experiment and remain separate work.

Evidence is under
`C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/`:
`loft-alternatives-final.json`, `loft-hole-diagnostic-review/receipt.json`
and `loft-holes-diagnostic-final-coverage.log`. The original
`loft-alternatives.json` preserves the overly strict initial twist-error assumption;
the resolution experiment establishes convergence instead of relaxing that number
and calling the coarse mesh exact. The earlier generic CLI error remains in
`loft-hole-rejection-review/loft.stdout.json`.

The hole-diagnostic slice passed 2,602 tests, with four skips and no failures.
The later gates below supersede it for the current candidate. The
research script passes its measured assertions and typecheck/lint; the script
itself changes no runtime behavior and does not qualify a generated asset. Timings are
single-process workstation observations, with WASM initialization in the first
case, and are not comparative benchmarks or cross-platform guarantees.

## Descending-section winding defect and repair

The fresh main25 skiff baseline exposed a separate shared-helper defect. Its loft
sections advance opposite the first frame's local +Y. The old helper assumed the
other direction and returned inward side/cap faces. A square-box reproduction
gave signed volume -8 instead of +8 while all counted topology defects were zero.

`loftProfiles` now uses initial section travel relative to the first plane to
choose triangle winding before generating normals. A focused regression covers
both directions in a translated/rotated frame, capped/open side normals, analytic
box volume and a boolean wall-volume control. The sweep path is unchanged.
Coplanar starts, crossed correspondence and global self-intersection remain outside
this direction correction; it is not a general solid-validity test.

The maintainer replay uses the exact original model draft, source SHA-256
`331aee53184f2f614ebf77cec2cc4551e4f3eae3925ace5f0e3656d1d488b5ac`,
on frozen runtime `12feddbd...72e989d` and corrected runtime
`ed99ef316b1887fad5647555053c0519e42463b6c7b3951ad8fc9b3b7fbe6c32`.
Actual compiled Node CLI renders use the RTX 3070 Dawn/D3D12 service. Reviewed
before/after sheets show the corrected orange outer hull replacing the exposed
pale inner faces. Standalone MCP returns a typed image and the same corrected
GLB hash as CLI. Both receipts retain `exactArtifact:false` with
`IN_LOOP_BUILD_NOT_PERSISTED`; independent hash agreement does not change that flag.

Evidence: `loft-direction-review/receipt.json`, `before.png`, `after.png` and
`after-mcp.json` under the external evidence root above. This is an engine replay,
not an extra authoring, and no source repair or runtime update was injected into
the scored main25 trial. Other authored skiff quality questions remain for review.

The focused sweep/CSG/composition run passed 28 tests and 341 assertions. All five
runtime bundles were rebuilt; typecheck and lint passed. That slice's full gate,
`loft-direction-final-coverage.log`, has **2,603 pass / 4 skip / 0 fail**, with
source coverage **95.11% functions / 92.35% lines** and unchanged thresholds.
The ten-fixture comparison was rerun on the corrected source as
`loft-alternatives-direction-fixed.json`; the earlier receipts remain intact.

One exploratory rotated/translated cavity subtraction reported three quantized
nonmanifold edges despite the expected analytic volume. This has no separate
diagnostic reproduction receipt yet. It remains untriaged under G24/E05; the
winding regression checks source-body topology and boolean volume, and must not
be described as proving that CSG output topology clean.

## Warped-panel asymmetry exposed at the bow

The owner spotted an asymmetric bow after the winding repair. This was a second
shared defect: a fixed diagonal across each nonplanar loft panel makes mirrored
input vertices produce different triangle surfaces. The symmetric pre-CSG loft
already reproduced the mismatch, so this was not just lighting or boolean output.

The shared loft/sweep builder now divides a warped quad around its bilinear
midpoint into four consistently wound triangles. Planar panels keep two triangles.
The added midpoint is independent of a preferred diagonal. The cost is one extra
vertex and two triangles per warped panel. This changes geometry between the
input vertices, normals and potentially CSG output; it is not an exact smooth
surface or a remedy for crossed profile correspondence.

Independent centroid/edge-midpoint sampling on the same original draft measured
maximum mirrored bow-surface distances of **27.708 mm before** and
**0.000013 mm after** the midpoint repair. The matched before artifact already
contains the winding fix, isolating this change. Sampling is not a Hausdorff bound
over every point. The source SHA remains
`331aee53184f2f614ebf77cec2cc4551e4f3eae3925ace5f0e3656d1d488b5ac`.
Current runtime is
`sha256:d2df3a0cd56622fbffa77377569fee386cd78133137e753ee0a4a6bda5f905c7`.
Actual compiled CLI and standalone MCP GPU renders agree on GLB SHA-256
`9b8ca3ee6ec0e2a28269429b2621acbfbb9097e6c632269abb544fb97189fd5b`;
the typed MCP image and RTX 3070 Dawn/D3D12 fidelity receipts are retained.
They still report `exactArtifact:false`; no receipt flag is overridden.

The focused regression failed on the old triangulation, then passed for both
loft directions and an anisotropically scaled sweep, alongside topology, UV,
normal and planar-cost checks. Five gallery assets have changed triangle counts;
their ten before/after GPU sheets show no obvious new silhouette, missing-part
or material regression at contact-sheet resolution. Those gallery baselines
predate both fixes, so they are broader regression checks, not single-change
isolation. Destination import and animation qualification remain separate.
These older showcase assets remain unvetted. Existing defects, including timber
passing through the pavilion roof, are not accepted as correct design or protected
as golden behavior. Gallery repair and replacement are outside this initiative;
fresh authorings qualify the upgraded workflow.

The ten-fixture comparison was rerun as `loft-alternatives-midpoint.json`; the
table above uses its current counts. Earlier receipts preserve the previous
20/16-triangle loft and 20-triangle sweep results. The planar nested subtraction
still measures the expected volume and three 0.2 m wall samples. The ambiguous
correspondence control still passed those incomplete topology checks at this
midpoint milestone; the subsequent bounded guard below closes that specific gap.

Evidence under the external root: `loft-symmetry-review/receipt.json`,
`after-mcp.json`, `migration-receipt.json`, `loft-symmetry-gallery/receipt.json`,
and `evidence-main-25-river-skiff-mcp-deepseek/symmetry-review-matched.json`.
The original scored trial remains unchanged. A separately rendered final-skiff
copy removes its three manual winding workarounds for the corrected engine,
without changing dimensions or design parameters. That is a maintainer migration
demonstration, not another scored authoring or model repair. See the explicit
[migration guidance](../migration.md#loft-winding-and-warped-panels).

Final midpoint gate: **2605 pass / 4 skip / 0 fail**, 2609 tests /
318 files / 62,681 assertions, 205.22 s. Source coverage:
**95.11% functions / 92.36% lines**, unchanged thresholds. Log:
`loft-symmetry-final-coverage-clean.log`. The earlier three failures are retained in
`loft-symmetry-final-coverage.log`: measured gallery triangle counts and corrected
prompt wording needed expectation updates. Focused follow-up passed 105 tests
with two existing skips. No renderer implementation changed in this slice.

## Collapsed-correspondence rejection

The shared builder now checks whether a corresponding profile edge collapses
between consecutive stations. For endpoint edge vectors `e0` and `e1`, it checks
the minimum length of `e0 + t * (e1 - e0)` for interior `t`. Normalization uses
edge length, with a relative `1e-10` collapse tolerance, independent of station
spacing. The check is linear in side-panel count and does not reorder inputs.

The shifted-square control now fails before returning geometry. Tests also cover
an unequal-size collapse away from the midpoint, translated/rotated frames and
scales 0.001, 1 and 1,000. A 150-degree loft remains accepted. A 180-degree sweep
across one interval rejects; adding a middle station resolves that particular
collapse and exports successfully. Global intersection and meaningful semantic
correspondence remain unchecked; these controls do not certify solid validity.

Actual compiled CLI and standalone MCP deliver identical advice to check start
vertices/order or add intermediate stations for intended twisting. Rejected cases
produce no GLB or image. The worker preserves a closed engine-owned diagnostic,
without leaking source or exception details. The earlier generic hole-diagnostic
mechanism is reused.

The updated experiment has nine returned-geometry fixtures, four explicit
rejections and the original three successful wall samples. Evidence:
`loft-alternatives-correspondence.json`,
`loft-correspondence-review-final/receipt.json` and
`loft-correspondence-focused.log` under the external evidence root.
Two focused tests failed before implementation; the focused run then passed
40 tests / 474 assertions. Runtime:
`sha256:d3c87887013264ea03f734382df76f3acc262b6d1a949d168c1cb7f4e7a571a8`.
All bundles, typecheck and lint pass. Full gate: **2,607 pass / 4 skip / 0 fail**,
62,695 assertions in 188.94 s; source coverage **95.11% functions / 92.36% lines**.
The clean log is `loft-correspondence-final-coverage-clean.log`. The preceding
gate's sole failure was AGENTS.md exceeding its existing size limit after the
gallery-scope clarification; the paragraph was shortened without relaxing the limit.
