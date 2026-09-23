# QA repair targets survive failed renders

F243: the QA report already identified affected meshes, but `AssetQaBlockedError`
discarded that information when composing the error read by CLI/MCP/native agents.
Missing-UV blockers therefore repeated the same anonymous advice. Trial06 reached
this failure and attempted unrelated UV changes during its unsuccessful repair loop.

The shared error now includes each detailed finding's existing `affected` record
as quoted JSON alongside its message and repair advice. The six-finding limit and
overflow count are unchanged. No new geometry rule, client-specific response,
tool schema or weaker acceptance condition was introduced.

Two focused reproductions failed before the fix. In-process and worker-backed
render tests now identify both affected caps, omit the already-valid rail, and
successfully render after restoring only the missing UV attributes. The broader
focused run passes 61 tests with 404 assertions across seven files.

Actual compiled Node CLI, stdio MCP and native SDK tools agree on both the small
fixture and unchanged source `p_cb9e588dade9` from Trial06. That original source
now identifies `Mesh_Post1`/`Mesh_FloorPlate1` and the other affected supports,
with two additional findings honestly counted after the six detailed entries.
The repaired positive fixture exports successfully. This establishes actionable
feedback, not improved live-model repair success or visual quality.

Evidence root: `C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22`:

- `qa-affected-feedback-red.log`
- `qa-affected-feedback-focused.log`
- `qa-affected-feedback-review/receipt.json`
- `qa-affected-feedback-final-gate.log`

Runtime: `sha256:e9d437939cb47ed4c5dad8e1283edd060d9cae03614966583c21149b56104b28`.
The full gate passes 2622 tests, two skips and zero failures across 322 files;
coverage is 95.19% functions / 92.21% lines with unchanged ratchets. Toolchain,
skills, typecheck, lint, built bundles, generated tool reference and diff checks pass.
Main38 retains its earlier frozen `6134bfb4...02f51be` runtime through all stages;
this maintainer replay does not alter the scored authoring trial.
