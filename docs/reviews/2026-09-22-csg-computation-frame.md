# CSG computation frame and export evidence

F183 is corrected with focused regression evidence. G24/G27 remain in progress;
this does not close their broader scale, attribute and destination acceptance.

The bridge previously transformed all operands to world coordinates and stored
them in Float32 before Boolean evaluation. A unit box at X=1e8 lost its X extent.
All 56 translated cases in the retained 112-row probe failed, despite their 56
local-origin counterparts succeeding. Four new focused tests reproduced failure,
including both GLB exporters.

## Implementation and explicit return contract

All operands now share one computation frame. The first contributing mesh's world
origin is subtracted from matrix translations before transforming vertices; the
combined relative bounds then supply a center and uniform scale for Manifold.
Different operands are never normalized independently. Input geometry, hierarchy
and transforms remain unchanged. Winding still accounts for reflected transforms.

Output vertices return to physical units relative to the selected world origin,
and the unparented mesh's `position` carries that origin. Normals are computed in
normalized coordinates and retained through positive uniform restoration. Source
runs, face IDs, UV interpolation and material groups follow the same output faces.
Preserving the returned mesh therefore preserves world placement. Extracting only
its geometry or overwriting its position requires an explicit placement decision.
Geometry alone no longer promises baked world translation.

The old reflected-input test inspected a geometry-local bounding box as if it were
world-space. It now checks the returned object's world bounds. The interpolation
test also applies the output mesh transform and now runs both near and far from
the origin. These updates retain the intended geometric/UV invariants rather than
requiring the old lossy representation. Discovery contracts, prompt guidance,
authoring recipes and migration notes teach the new contract. Intersection/hull
signatures now expose their existing preservation option as well.

This cannot recover detail already rounded away in input buffers or composed
transforms. Extreme size ratios within a single combined operand extent remain a
native precision limitation. Returned geometry must still fit finite Float32
coordinates. No CAD or universal self-intersection certificate is claimed.

## Bounded evidence

The offline scale probe now returns all **112 / 112** cases across union,
difference, intersection and hull, both preservation modes, seven scales from
1e-12 to 1e12, and both tested origins. No topology defects or invalid normals
were measured. Maximum normalized volume error is below 1.28e-7. The original
failing receipt is preserved as `csg-scale-probe.json`; the new result is
`csg-scale-probe-after.json` in the external campaign directory.

The focused CSG suite passes **39 tests / 1,664 assertions**. It covers source-face
UV interpolation at both origins, cut-face materials, reflected/rotated/nonuniform
parents, chained Booleans, ownership, existing empty-result diagnostics, default
loss behavior, and both GLB exporters retaining local detail and world placement.
Prompt checks pass 9 tests with the same 2 obsolete skill skips.

The unchanged `examples/arcade-cabinet.kiln.js` was rendered through the actual CLI
and GPU before and after rebuilding. Both revisions have 19,916 triangles, bounds
0.81 x 1.78 x 0.66 m and accepted structural QA. The 1168 x 780 six-view PNGs are
byte-identical. GLB size changes from 1208.4 KB to 1205.9 KB; identical images do
not imply identical exported bytes. This checks one existing asset using coin-slot
and speaker CSG, not all artistic output or destination runtimes.

External evidence:
`C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/csg-regression/receipt.json`
binds source, both runtime build manifests, GLBs, PNGs, CLI logs and both scale
probe receipts. Before runtime is `sha256:d2ae21d36a76911fa7da57bf790463d9745eb6d1d9a961b7dcaa6e4fdeacef57`;
after runtime is `sha256:2548c8a0b85b91fbf70ff1c4c614fdaeb67388d8dbff1f054e39adf366a03673`.

## Gallery regression review and gate status

The first full gate passed 2423 tests, skipped 4 and failed one gallery metadata
assertion. Three current-source triangle counts changed after normalized CSG
triangulation. The assertion now reports all mismatches together, preserving the
same exact-count invariant. Only measured counts in `docs/examples.md` were updated;
asset source, authorship credits and published media were not rewritten.

| Asset | Triangles before / after | Mesh nodes before / after | Largest world-bounds displacement |
| --- | --- | --- | --- |
| Cathedral | 19,842 / 19,888 | 481 / 481 | 1.55e-6 m |
| Diving helmet | 16,416 / 16,420 | 96 / 96 | 1.61e-8 m |
| Cafe racer | 16,962 / 16,966 | 202 / 202 | 4.47e-8 m |

These three controls run the same source in-process. A Bun loader substitutes only
the prior `solids.ts`, whose hash must match the retained failing scale-probe receipt.
This is a controlled engine comparison, not an old installed-package run. Both sides
use actual GPU captures. No mesh node disappears or is added; visual inspection
retains openings, proportions and silhouette. Texture/shading changes remain visible,
particularly the helmet's pedestal. Changed pixel fractions are 5.90%, 17.07% and
0.586%, respectively; mean absolute RGB differences are 0.193, 0.631 and 0.0653 on
0-255 channels. These are measured differences, not claims of pixel equivalence or
universal visual acceptance. Changes in CSG triangulation can change generated UV
atlases and textures. The arcade comparison above remains byte-identical.

Each external `csg-cathedral`, `csg-diving-helmet` and `csg-cafe-racer` directory
contains before/after GLBs, GPU sheets, source/renderer receipts and bounds/pixel
comparison evidence. The last two also retain the reusable comparison script.
The initial failing full log is `%TEMP%/kiln-csg-frame-coverage.log`; follow-up gallery
logs preserve both intermediate mismatches. Final gate rerun passes **2,424 tests, 4 skipped, 0 failed**: 2,428 tests across
289 files, 57,734 assertions, 136.25 seconds. Coverage is 95.09% functions and
92.66% lines, above the unchanged 94.00% / 92.10% minimums. The nearest gallery
suite passes 94 tests / 586 assertions. Typecheck, lint (638 files), six skills
and two registered copies pass. All five runtime identities and bundle hashes
match the current source identity above. The renderer code was unchanged in this
slice; its prior 73-test result remains separately scoped.

All CSG red/focused/prompt/gallery/build/typecheck/lint/coverage logs, including
the initial failing full run, are copied under the external `csg-regression/logs/`
directory. No live model or test process from this slice remains active. G24/G27
stay in progress: wider attribute/export/empty-result fixtures and remaining
sweep/geometry-policy scale qualification must not be inferred from these checks.


Current disposition: subsequent [sweep scale](2026-09-23-sweep-scale.md) and
[topology tolerance](2026-09-23-topology-tolerance-collapse.md) work completes G24
bounded qualification. Earlier open-state statements above are historical. See
the checkpoint for the current candidate and remaining QA limits.
