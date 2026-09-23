# Retire the remaining four-tool registry

F236: CLI, MCP and the native Strands skin had moved to the program-reference
workflow, but the public `@kiln/engine/tools` export still exposed
`createKilnToolRegistry` and `kilnToolRegistry`. A library caller could recreate
the old metrics-only render plus standalone `kiln_screenshot` workflow. The current
registry also constructed that whole unused tool list just to obtain validation.

Both old exports and their separate render implementation are removed. A single
private validation definition feeds the current program registry; the native
registry continues to consume that registry. The shared render implementation
records `kiln_render` as the actual view tool. There is no alias or error fallback.
The migration guide names the supported replacements.

The focused public-export test failed before removal. The seven affected test
files then passed 41 tests and 258 assertions through the current tools, retaining
coverage of metrics, PNG media, GPU port selection, backdrop, part pagination,
requirement binding and neutral Discovery. Source-level checks are not an
installed-package qualification. The full gate passes 2,614 tests, with two skipped and none failed. Coverage is
95.18% functions / 92.21% lines; existing thresholds are unchanged. Toolchain,
skills, typecheck, lint, rebuilt bundles, generated tool docs and diff checks pass.

Actual compiled Node 22 CLI and stdio MCP retain valid rendering. MCP advertises
14 tools, rejects `kiln_screenshot`, and returns geometry metrics plus an image
block from unified rendering. The real SDK adapter advertises 10 native tools,
returns image/JSON blocks and finishes the reviewed reference. These are offline
adapter checks, not a successful live model authoring. The external probe initially
misconfigured a managed workspace and assumed JSON-only native success; corrected
driver evidence is retained, with no product workaround.

Runtime: `sha256:75411f46ddc4d6c6e69e67409cf208da8c833e483430dbb285536018e3dca3a0`.
Evidence: external `registry-retirement-transport/receipt.json` and
`registry-retirement-final-gate-complete.log`. Six current exports remain equivalent
to previously imported Blender inputs; Blender was not rerun. Main36 remains on
its original d445c52e frozen runtime.
