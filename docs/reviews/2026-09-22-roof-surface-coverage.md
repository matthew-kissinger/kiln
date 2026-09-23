# Roof surface boundary qualification (G28)

Source inspection and failing fixtures confirmed that staggered shingles skipped
partial edge tiles, could generate no tiles on narrow faces, and moved the last
row upward instead of shortening it. Seam/corrugation strips extended beyond the
face boundary. Unknown layout kinds silently selected corrugation behavior, and
invalid requests attached an empty or partly constructed root before failure.
Repetition lacked a bounded allocation preflight.

The implementation clips staggered boundary cells and the last row, keeps panel
and shingle gaps explicit, clips edge strips, and reports actual generated mesh
and triangle cost. At most 10000 box elements may be requested. Validation and
construction finish before the caller hierarchy is changed. Invalid kinds,
nonfinite/Float32-inexpressible dimensions, excessive counts and singular frames
fail visibly. Narrow strips avoid overlapping duplicate geometry.

The existing lossless TRS checker is now shared by assembly replication and roof
layout placement through assembly-transform.ts. Both ridge axes, both faces,
translated/rotated/reflected/nonuniformly scaled roof parents, and separate rigid
parents have checks. Separate-parent rebasing that would need local shear fails
with an instruction to use face.roofRoot; it does not export a distorted TRS.
This is a placement limitation, not a restriction on the geometry users can build.
The default parent carries later roof changes; external-parent placement is a
construction-time snapshot. The helper does not continuously bind separate graphs.

Focused evidence: 48 tests, 1870 assertions across five files; 9 prompt tests pass
with two pre-existing legacy skill skips. Four initial tests failed before the
fixes. Source typecheck and lint pass. Full integration and GPU comparison now pass, as recorded below and in the checkpoint.

The regression probe lives outside the engine at
C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/roof-layout-probe/.
It is an engine fixture, not a model-authored acceptance run. The first attempted
after-render reused the pre-change bundle because bun run build only typechecks;
that attempt is retained as stale evidence and is not validation of this change.
Rebuild Node bundles with node scripts/build-runtime.mjs all for the real comparison.

These are simple box details, not interlocking shingles or folded sheet-metal
construction. Generated cost is not draw-call cost, and structural acceptance is
not a visual or material quality certificate. Final authoring dogfood remains open.

## Corrected actual GPU comparison

The rebuilt runtime is sha256:3786bc44310809ecc70c9000e113190db7328e870a08be82eef86857f8d93393.
The same source now produces 864 triangles / 30.6 KB versus 720 triangles / 22.6 KB;
12 additional clipped tile pieces account for the 144 triangles. Bounds changed
from 11.01 x 0.95 x 2.43 to 11.00 x 0.95 x 2.43 because edge strips no longer
protrude. Both real GPU calls report accepted structural QA. Direct review of both
six-view sheets shows the missing edge regions filled without an unrelated roof
shape change. The fixture uses simple opaque materials; it does not qualify every
roof material or destination renderer. Source/artifact/image/log hashes and the
excluded stale attempt are recorded in the external receipt.json.

The initial full gate had 2400 pass / 4 skip / 2 fail: both failures were exactly
the stale CLI/MCP bundle checks. Actual runtime bundles have now been rebuilt;
the final rerun passed 2402 tests / 4 skipped / 0 failures, 57006 assertions in
155.23 seconds across 285 files. Coverage is 95.04% functions and 92.61% lines
above unchanged thresholds. Typecheck, lint and skill validation also pass. All
five Node bundle identities were compared to a freshly computed source identity.
