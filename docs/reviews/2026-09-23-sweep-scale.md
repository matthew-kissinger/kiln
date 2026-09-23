# Loft and sweep scale correction

Three focused regressions failed before the fix. Fixed absolute profile-distance,
profile-area and path-distance cutoffs rejected valid small lofts and sweeps. The
`up` vector also had a magnitude-dependent validity cutoff despite specifying a
direction. This is a shared G24 defect, unrelated to gallery asset quality.

Profile validation now works in a translated, extent-normalized frame while
retaining the original profile coordinates and correspondence. Path station
tolerances use the path extent; nonzero loft travel has no fixed world-unit
minimum. Sweep `up` is normalized before testing parallelism. Self-touching
profiles, duplicate path stations, repeated closed endpoints and zero/parallel
directions still fail. Inputs are not mutated.

The focused suite passes **14 tests / 5,283 assertions**. Seven scales from
`1e-12` through `1e12` retain normalized positions, triangle indices, UVs,
normals and closed topology for curved sweeps, descending twisted lofts and
closed paths. Existing outward-face, correspondence-collapse and mirrored-panel
checks also pass. Output remains Float32; this does not recover small detail
already lost at a distant baked origin or certify self-intersection freedom.

Actual compiled CLI and standalone MCP renders additionally agree on GLB hashes
for six sweep/loft fixtures at scales `1e-9`, `1` and `1e9`. Exported attributes
are finite. These are CPU geometry checks, not GPU material acceptance. MCP's
hash identifies the input GLB; its `exactArtifact: false` remains visible because
the in-loop build was not persisted. No delivery guarantee is inferred from it.

Evidence is under
`C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/`:

- `sweep-scale-before.log`, `sweep-scale-focused.log`: failing and passing checks.
- `sweep-scale-final-gate.log`: toolchain/skills/typecheck/lint passed; the first
  rebuild hit a Windows file-write failure on `cli.mjs`.
- `sweep-scale-qualified-gate.log`: subsequent rebuild and full coverage gate.
- `sweep-scale-transport-qualified/receipt.json`: six actual CLI/MCP cases.

The first transport probe read the wrong MCP hash field and failed its reviewer
assertion. Its evidence is preserved in `sweep-scale-transport-review/`; the
qualified probe uses the documented view-fidelity input hash. No product change
was made to accommodate that probe mistake. Use the checkpoint for final gate
status and candidate identity. The [follow-up diagnostic correction](2026-09-23-topology-tolerance-collapse.md)
resolves the recorded cavity issue. G24 has bounded implementation qualification;
physical clearance and general solid-validity claims remain outside these checks.
