# Solid conversion: fixing the consumer geometry boundary

F229 came from fresh main29 authoring: a centered cylindrical cut through a
revolved profile generated 16 exactly zero-area triangles and 48 zero normals.
Smoothing hid the normal errors while leaving the collapsed faces. The problem
was shared solid conversion, not the exporter, the model's cutter segment count,
or a gallery asset.

`src/solids.ts` now materializes the final asset units before checking the actual
Float32 positions consumed by Three.js and GLB. It preserves a distant world
origin in the returned node transform. If conversion collapses faces, Manifold
first rebuilds topology from those coordinates. Only residual zero-area seam
faces are then removed, with their triangle metadata, before a final validated
topology rebuild. This bounded process retains source runs, UVs and material
ownership and reports `SOLID_FLOAT32_CANONICALIZED`. Unrepresentable thickness
fails instead of exporting a partial shell. Positions and normals can change at
rounding precision relative to earlier builds.

Two measured approaches were insufficient. A plain roundtrip left two degenerate
faces in an existing shallow-angle shell fixture. Removing all degenerate faces
before rebuilding topology opened connectivity in other valid solids. The final
ordering handles both cases; failed gate logs remain available. The reimport
tolerance is capped to Float32 precision in output coordinates because shrinking
a Manifold can otherwise retain a much larger pre-transform absolute tolerance.
There is no segment-count workaround, fabricated normal or repeated repair loop.

## Evidence and limits

- The original cut is covered across five scales from `1e-12` to `1e12`, with
  smooth/flat shading, attribute preservation on/off, far-origin placement,
  independent UV interpolation and source/material ownership checks.
- Both exporters pass actual GLB validation. A solid whose thickness collapses
  entirely is rejected. Existing coordinate, attribute and shallow-shell checks
  remain in place.
- Four unchanged minimized trace programs pass compiled CLI and MCP with matching
  GLB hashes and no zero-area triangles or zero normals. The original cut has
  2,752 triangles after cleanup. The box-cut control needs no cleanup warning.
- The original fixture also passes the real RTX 3070/Dawn D3D12 renderer in
  3.83 seconds. Its material-faithful grid was visually inspected; its receipt
  still says `exactArtifact:false` and does not certify whole-asset quality.
- This does not establish arbitrary mesh repair, absence of self-intersections,
  physical fit, or reliable model use of inspection. Main29's scored sources and
  its protected-part replacement failure (F231) remain unchanged.

Runtime: `sha256:1276ef6a16fed0220544b2dad8febbec89305b87c2471d51580d7d37082c774c`.
External evidence lives under
`C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/`:
`csg-float32-review-complete/receipt.json`, `csg-float32-topology-first.log`,
the initial/full gate logs, and the precision/shallow-shell probe receipts.

Historical gallery sources, GLBs and images were not edited. Their execution
checks still run as compatibility checks. The obsolete test requiring current
tessellation to equal historical published triangle counts was retired; those
counts are labeled historical. No gallery output is a golden quality reference,
and gallery repair, regeneration and replacement remain outside this initiative.

Final checkout gate: **2,653 pass / 4 skip / 0 fail**, 95.18% functions /
92.34% lines, unchanged coverage thresholds. Typecheck and lint pass; all
five runtime bundles were rebuilt. The four skips remain explicit in the ledger.
