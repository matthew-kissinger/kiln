# Part construction repair advice across the evaluator boundary

The fifth native Strands trial used the same free Ling route after the material
diagnostic fix. It received and acted on the color-first material advice, then
failed to await `roundedBoxGeo` before passing its result to `createPart`.
The library already detected the Promise and explained the repair, but the
isolated evaluator reduced that error to a generic execution rejection.

The run ended at 30 model steps and 42 tool calls, with no successful render or
completed artifact. Account usage delta was zero. The original run remains a
failure, and contributes no campaign authoring or edit. Its evidence is under
`C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/strands-05-grained-handrail/evidence`.

The existing `createPart` argument guards now carry three closed, engine-owned
diagnostics for name, geometry and material arguments. The worker returns static
signature and repair advice without copying authored names, exception messages or
stacks. Promise geometry still fails; it is not implicitly awaited. The direct
library keeps its detailed error and valid calls retain their existing behavior.
Forged authored diagnostic objects remain generic rejections.

The focused worker regression was observed failing before implementation.
Focused checks pass (108 tests), as does the full gate (2616 tests, two skips,
zero failures). The unchanged native failure and a function-as-geometry probe
return actionable advice through actual compiled CLI, MCP and SDK native tools;
a valid control still exports. See external `part-diagnostics-transport/receipt.json`.
No new live recovery or installed-package acceptance is claimed.
