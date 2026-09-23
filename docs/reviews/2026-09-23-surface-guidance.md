# Surface singularities and normal preservation

Heldout10's first blossom repair hit GLTF zero-normal validation twice. A minimal
current-checkout reproduction separates the causes:

- A regular-grid petal with a collapsed endpoint row produces 20 degenerate
  triangles and one referenced vertex with a zero normal. `parametricSurface`
  does not construct pole fans, as already stated in `docs/geometry.md`.
- `sphereGeo(.0095,20,12).scale(1,.55,1)` retains valid analytic normals.
  Calling raw `computeVertexNormals()` afterward zeros two unused pole vertices
  (20 and 252). Its face accumulation cannot supply normals for unused entries.
  The topology diagnostic remains clean because it does not validate normals.

The correction is shared Discovery and authoring guidance. Exact `parametricSurface`
detail now describes the regular grid and offers non-collapsed parameterization or
explicit `meshGeo` fan topology. Exact `sphereGeo` detail explains existing normals
and affine transforms. The shared geometry reference carries both distinctions,
including when direct position edits really do need normal updates. No geometry
healing, topology rejection policy, sphere implementation or exporter changed.

Five independent source controls were exercised through actual compiled Node CLI
and MCP on `3fe73303d7b07517747fda6b769c5ca13722846343db7dfcaffb869582d2fb11`:
collapsed grid and recomputed sphere still fail normal validation; non-collapsed
grid, explicit tip fan and scaled sphere export successfully. Each successful
CLI GLB hash matches MCP's rendered input hash. Both Discovery interfaces return
the new guidance. These CPU controls establish export behavior, not appearance.

The focused geometry/Discovery/primitive checks pass (29 tests, 1,659 assertions),
as do skill format/copy checks and the author skill validator. Fresh-model uptake
is not yet established. Frozen held-outs and their original failures are preserved.

Evidence under `C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22`:
`surface-singularity-reproduction.json`, `reproduce-surface-singularities.ts`,
`surface-guidance-review/receipt.json`, its CLI/MCP inputs and receipts, and
`surface-guidance-qualified-gate.log` and `surface-guidance-gate-recovery.log`.
The full run has 2,640 pass, two skips and one guide-size failure. Shortening
AGENTS.md fixes that documentation constraint; all nine reliability checks then
pass. The full run's engine coverage passes at 95.16% functions / 92.20% lines.
This is a full run plus targeted recovery, not a single all-green full run.
Native13's unstarted preparation was explicitly refreshed, preserving its old
manifest and changed files in `native13-before-surface-guidance/`; its refresh
receipt is `native13-surface-guidance-refresh.json`. No Google inference was sent.
