# Retired source diagnostics

L02 review found two connected defects. Validation treated every declared name
anywhere in a program as locally bound, allowing an unrelated parameter to hide
an obsolete global elsewhere. Rendering did not apply the retired-helper check
before execution. A compiled MCP probe then found that `kiln_validate` discarded
the validator's structured repair hints.

The shared validator now resolves binding visibility for the recognized retired
names. Functions, parameters, blocks, loops, catches, named classes, destructuring,
assignments and non-strict block-function bindings have regression coverage.
Execution rejects unbound retired globals before authored statements run. Local
helpers and property/string lookalikes remain valid. This is not a general scope,
reachability or temporal-dead-zone validator; unknown-call warnings retain their
conservative whole-program declaration check.

CLI and MCP return the same closed `REMOVED_HELPER` advice. No authored exception
text crosses the worker boundary. The shared validation tool now preserves `issues`
with codes, source lines and replacement hints, alongside its existing fields.
This also reaches native tools through their registry adapter.

Evidence under `C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/`:

- `retired-scope-red.log`: 12 failures reproduced; four additional binding/write
  boundary failures in `retired-scope-boundaries-red.log`.
- `retired-tool-guidance-red.log`: missing tool repair hints reproduced.
- `retired-scope-focused-complete.log`: 126 passing tests, 488 assertions.
- `retired-source-review-final/receipt.json`: three invalid sources rejected by
  actual compiled CLI/MCP with matching advice, no GLB/image and no earlier authored
  throw. Local-function and property controls export successfully. Specific
  `copyGeometry` migration guidance survives `kiln_validate`.
- The initial `retired-source-review/` failure discovered the missing tool hints;
  it is retained. The first coverage run was deliberately interrupted for that fix.
- `retired-scope-coverage-complete.log`: 2636 pass, 4 skip, zero failures before the
  subsequent UV contract clarification. The final combined gate is recorded in
  `retired-scope-and-uv-guidance-final.log` and the live checkpoint.

The transport receipt uses runtime `09918c...0e6e791`. The final candidate's worker
bundle is identical; its subsequent difference clarifies the Discovery UV contract.
The subsequent flag/schema pass covers the remaining diagnostic surfaces below.
Installed-package negative tests and equivalence-preserving data conversion remain
separate from L02's checkout diagnostics.

## Flag and schema follow-through

The actual negative-invocation inventory found that MCP `--category=...` and the
old Discovery selectors rejected correctly but omitted migration guidance. Both
category flag forms now use the same message. The strict Discovery schema names
`query`, `ids`/`--id` and `family`/`--family` replacements; it still rejects the old
keys. Invalid evaluator requests now name the V2 envelope and the host/worker
migration obligation without echoing any input. A V1-envelope test confirms that
the render dependency is never invoked.

| Retired input | Checkout disposition |
| --- | --- |
| CLI/MCP generation category flags | Reject before reading source or starting a renderer, including `--category=...`; point to explicit requirements. |
| Discovery category/name/names selectors | Strict schema/CLI rejection with replacement selectors; no conversion or alias. |
| Runtime category/intent and native surface controls | Existing host/native tests reject before evaluation/model dispatch; native terminal flow cannot route back to removed loops. |
| Evaluator V1 or invalid execution envelope | Closed `INPUT_INVALID` response names V2 migration; render dependency remains untouched. |
| Legacy saved policy/checkpoint/manifest | Existing requirements, CLI migration and restore tests require explicit host migration; original data is preserved. |
| Recognized retired source helpers | Scope-aware validation and execution guard described above; strings, property names and valid locals remain allowed. |
| Removed tool names, library exports and subpaths | No callable stub or alias. Registry/module resolution fails normally; the migration guide names replacements. Installed-package absence checks remain L07. |

`retired-input-inventory/receipt.json` retains the initial messages.
`retired-input-review-final/receipt.json` verifies actual compiled CLI and MCP
replacement instructions. `retired-input-red.log` has four reproduced failures;
`retired-input-focused.log` has 15 passes and 103 assertions. Existing manifest,
requirements, native retirement and source tests remain part of the full gate.
The live checkpoint records final L02 status and gate evidence.

## Facade trace follow-up

Main27 fetched `projectUV`'s exact contract, then claimed its brick mapping used
metres. The implementation instead normalizes each geometry's extents. The contract
omitted that critical distinction. Discovery and the geometry guide now state it
explicitly and explain that sharing a frame does not align density or phase across
separate pieces. The runtime mapping itself is unchanged.

`uv-density-contract-review/receipt.json` confirms the current compiled CLI and MCP
both expose this guidance. Future model uptake remains unqualified. Original
main27 source and artifacts remain unchanged, as does every historical gallery asset.

## Lantern alpha-mode contract defect

Main28 read Discovery's `pbrMaterial` contract, which described uppercase glTF
output names without stating the lowercase authoring values. Its uppercase
`alphaMode: 'OPAQUE'` repeatedly received generic evaluator rejections. Minimal
probes isolated this field; the model eventually recovered without intervention.

Discovery now states `opaque`, `mask` and `blend` explicitly and separates them
from exported glTF values. `pbrMaterial` and portable-material compilation emit the
same closed `MATERIAL_ALPHA_MODE` repair hint through the worker. Accepted input
values and geometry/material behavior are unchanged; uppercase aliases were not
added. The exact signature also includes the existing emissive/AO intensity inputs.

`alpha-mode-advice-red.log` reproduces the missing hint. `alpha-mode-review/receipt.json`
qualifies compiled CLI/MCP rejection for all three uppercase values and an invalid
portable-spec value without exposing the private input. Three lowercase controls
export the corresponding glTF modes. The exact Discovery response is retained.
The two prompt snapshots changed only for the corrected PBR signature and summary.
Main28 retains its original runtime and stopped at the provider image limit before
delivery. It contributes zero authorings or edits; the original failed trace is retained.
