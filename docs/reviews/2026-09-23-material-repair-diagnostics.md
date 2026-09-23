# Material repair diagnostics from the fourth native trial

Strands04 used the preflighted free `inclusionai/ling-3.0-flash-vl:free` route with
high reasoning and the current native registry/skills. It stopped at the explicit
30-turn limit without an artifact. The 50 tools included 26 Discovery calls and
10 render attempts. Account usage and conservative spend reservation remained $0.
The receipt reports 1,382,448 input tokens, 24,933 output tokens and 935,798 cached
input tokens; these are provider metadata fields, not an additional billing claim.
This is a failed native attempt and adds no campaign completion.

Trace mining identified two separate API mistakes. The first source supplied a
roughness texture without a matching packed metalness channel. Later, even the
model's minimal cylinder failed because it supplied an options object as the first
`gameMaterial` argument. The helpers already rejected both shapes, but the isolated
worker discarded their repair advice and returned only `Generated asset execution
was rejected.` The model repeatedly simplified valid surrounding geometry without
learning which material contract it had violated. This is F235, a shared diagnostic
gap, not evidence that the renderer cannot draw the asset or that the provider
cannot call tools.

The color-argument guard now emits the closed `MATERIAL_COLOR_ARGUMENT` diagnostic;
the packed-texture combination guards emit `MATERIAL_PACKED_CHANNELS`. The worker
protocol explicitly recognizes both and the shared tool path supplies fixed repair
text. Color-first constructors explain their two arguments and point to the
different object-form `pbrMaterial` contract. Packed-texture advice explains
G=roughness/B=metalness, the matching usage, the supported input forms and scalar
0..1 values. Invalid inputs still fail; no alias, automatic texture conversion or
silent white-material fallback was added. Captured source keys, exception text and
stacks do not cross the worker boundary. Forged authored diagnostic objects remain
generic rejections.

Both focused regressions failed before implementation. Afterward, 132 tests and
625 assertions pass across diagnostic/protocol/primitive/texture tests. Actual
compiled Node CLI, standalone stdio MCP and the real Strands SDK native tool
adapter replay the unchanged original source and minimal fallback. All six calls
now return the appropriate repair advice. A valid numeric-color control exports
with its 0.4 roughness and 0.8 metalness intact. The replay does not repair the
authored asset or count as another live-model completion.

Evidence root: `C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22`.
The original native trace/receipt is under `strands-04-grained-handrail/evidence`.
Red tests are `material-color-diagnostic-red.log` and
`material-packed-diagnostic-red.log`; focused results are in
`material-diagnostics-focused.log`. The actual three-surface replay and positive
control are in `material-diagnostics-transport/receipt.json`, with raw responses.
`review-material-diagnostics.ts` reproduces that check. The earlier color-only
transport attempt and interrupted full gate remain retained; the original packed
texture failure was still generic in that intermediate implementation.

The current combined gate and runtime are recorded in the checkpoint. A fresh
native run must establish whether the improved messages enable recovery; this
repair alone does not qualify native generation, refinement or model capability.

Final combined gate: **2613 pass / 2 skip / 0 fail**, 377,496 assertions in
215.46 seconds; coverage 95.19% functions / 92.21% lines with unchanged thresholds.
Toolchain, skills, typecheck, lint and all five bundles pass on runtime
`sha256:d445c52e47090466d6330fba6d7bfd85b62ff15a60772c19b3c6e09ca9a68379`. `material-diagnostics-final-gate.log` retains
the full result. Six destination exports preserve the prior imported geometry and
materials (canonical bytes identical; runtime differs only in the provenance
metadata digest). Blender was not rerun; the derivation is retained under
`destination-review/material-diagnostics-recheck/`.
