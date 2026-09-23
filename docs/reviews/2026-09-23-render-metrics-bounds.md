# Render metrics measure the exported geometry

F245: the third foliage trial exposed disagreement between CLI bounds and
MCP/native render metrics. The latter transformed local bounding-box corners,
including empty space around rotated leaves. The model repeated that approximation
in its own verifier and incorrectly concluded that CLI under-reported the size.

`collectSceneMetrics` now measures referenced vertices in world space on the GLB
review scene, where instances are already expanded. It unions actual mesh bounds
and attributes the lowest point to the mesh that owns it. The input schema, tool
surface, QA policy, renderer and export geometry are unchanged. These are base/rest
geometry bounds, not alpha silhouettes, shader displacement or animation envelopes.

On the original plant, old MCP/native size was 0.862356 × 0.817548 × 0.828857 m.
Actual vertices measure 0.817120 × 0.811492 × 0.792107 m. Compiled Node CLI, stdio
MCP and native SDK tools now agree with that independent vertex measurement. The
exported GLB remains byte-identical:
`0e0db7c63e9f6be8bca41db4f90e4fefaf75cd228f0615b1034965dc7fe5194b`.

Three focused tests failed before implementation: indexed/non-indexed rotated
geometry and lowest-part attribution. Fifteen nearby tests now pass. The first
full run had one Windows `EBUSY` cleanup failure in the unchanged renderer
concurrent-start test. That file passed all eight tests on rerun; the complete
coverage rerun then passed 2625 tests, two skips and zero failures across 323 files.
Coverage is 95.19% functions / 92.21% lines with unchanged ratchets. Toolchain,
skills, typecheck, lint, rebuilt bundles, generated tool docs and diff checks pass.

Evidence root: `C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22`:

- `render-bounds-red-corrected.log`, `render-bounds-focused.log`
- `render-bounds-review-final/receipt.json`
- `render-bounds-final-gate.log` (initial cleanup failure retained)
- `render-bounds-lifecycle-rerun.log`, `render-bounds-final-gate-rerun.log`

Runtime: `sha256:2c002afba1dd46d6a582a4a84af12a14c044f2b17212573224c7838f999aee2c`.
Main39 kept its original frozen runtime through both edits. Its scored source and
observed mistakes remain unchanged; this replay does not establish fresh model
uptake or universal geometry quality.
