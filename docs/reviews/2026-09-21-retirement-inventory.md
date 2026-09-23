# Retirement inventory

Source baseline: b81cfd4caed64bd90547ff83b4e513e59a1d4913. Decisions follow the owner's clean-cutover instruction. This inventory is the L01 design artifact; it is not evidence that removals or migrations have shipped.

| Surface | Decision and replacement | Callers and migration obligations | Removal/retention evidence required |
| --- | --- | --- | --- |
| `kiln_list_primitives`, `listPrimitives`, `./list-primitives` | Remove callable/export surface; shared catalog plus `kiln_discover` / `kiln discover` | Registry's old in-process definition and progressive definition, prompt API, validation allowed globals, tools tests, MCP, agent prompts, current skills/site/workspace/docs; internal data moves to the shared catalog | Installed registry lacks old name; package old subpath fails; new discovery handles all supported queries. Historical mentions allowed only as history/migration |
| Discovery `category` selector and `primitives` response dialect | Remove; `family`, semantic `tags`, typed `entries` | CLI/MCP/Strands adapters, schema reference generation and consumers | Strict schema rejection with migration instructions; no old response mode |
| Runtime `--category`, `category`/`intent` execution options | Remove category-driven policy; neutral versioned requirements | CLI parse/help, render/evaluator requests, registry trusted context, host run options, QA selection and caches | New runs have no hidden prop defaults; old requests fail usefully; policy identity matches every result |
| Stored `AssetIntentV1` and old manifests | Preserve readable data; explicitly convert before new policy execution | Collections import/restore, saved source, host-supplied intent; retain original record and report assumptions | Unmapped obligations block conversion; migration report and provenance retained; no runtime old-policy branch |
| Strands `current`, `unified`, edit-buffer production surfaces / `KILN_TOOL_SURFACE` / old surface options | Remove after program-reference conformance, before final campaign | `surface.ts`, `tools.ts`, `run.ts`, prompt variants, provider/agent tests, CLI generation | Native registry tools plus exact-reference terminal submission; retired flags cannot route to old loops on error |
| Public `createKilnToolRegistry`, `kilnToolRegistry`, standalone `kiln_screenshot` | Remove the remaining four-tool factory; current program/native registries share one validation definition and unified rendering | Public `./tools` export and former baseline tests | Public export rejection, preserved current metrics/image/context tests and actual transport checks; see the [checkout correction](2026-09-23-registry-retirement.md) |
| Public category QA aggregate and old append wrappers | Remove from `./qa`; expose requirements-based evidence collection, evaluation and final-artifact checks | Engine already uses neutral evaluation. Historical aggregate callers are internal comparison fixtures. Low-level measurement functions and old record types remain for explicit inspection/migration | Package self-reference rejects six old aggregate exports and evaluates the current policy identity. See [cutover acceptance](2026-09-23-cutover-acceptance.md) |
| `./prompt`, `getSystemPrompt`, `buildUserPrompt`, category prompt constants | Removed from source and public exports; native bootstrap plus Discovery is the supported path | No production callers remained. Retired category-injection tests removed; deterministic QA corpus and two roof fixtures retained | Focused public-import rejection gate passes. Full gate and final native qualification are recorded in the current checkpoint |
| Automatic post-finish grade refinement and the old thinking A/B runner | Remove `grade-refine` exports/module and `scripts/thinking-ab.ts`; inspect runtime metrics from the retained review and request explicit refinement | Former wrappers re-executed source with implicit optimization and referenced removed terminal verbs. Historical experiment reports remain historical; reproduce their old harness from its recorded revision | Native regression rejects exports; exact artifact tests prove no post-finish rewrite, optimization or paid turn. Runtime-cost metrics remain supported |
| `cloneGeometry`, `cloneMaterial` identity aliases | Remove globals and exports | Sandbox, primitive catalog, prompt comments, examples/tests/docs, any external source migration | Shared-resource uses become direct references; independently mutated resources use genuine copy helpers. Ambiguous intent requires explicit correction |
| `validateAsset` advisory helper | Replace with honestly named material-budget advisory | Sandbox/catalog/direct exports and generated source; engine validation remains separate | New advisory describes material count, not draw calls or full validity; old helper fails with migration guidance |
| `panelRemapV`, `boxUnwrap`, `cylinderUnwrap`, `planeUnwrap` | Removed; use remapUV for UV transforms, projectUV for explicit framed projection, copyGeometry for owned preservation, autoUnwrap for chart packing | UV module, sandbox, Discovery, examples, skills and migration guide updated | Focused seam/frame/attribute/export tests and before/after well GPU views; old invocations fail explicitly. Final model dogfood remains open |
| Legacy wording in `room` floor datum, radial/mirror semantics and single-opening walls | Correct behavior and document changed geometry rather than preserve a defective mode | Helpers, catalog and generated API references; authored sources may render differently | Geometry regression/export evidence and migration note; no opt-in bug preservation |
| `createInstance` | Retain explicitly mesh-only; add separate hierarchy-safe assembly replication | Array helpers and callers that intentionally share geometry/material resources | Mesh-only semantics documented; assemblies use new clone/replication contract rather than pretend this copies a hierarchy |
| Axis-specific primitives, surface versus solid revolution | Retain unless C09 measures true redundancy | All current exported constructors and useful aliases | Contracts distinguish axes/caps/solidity; no removal solely to reduce names |
| Animation zero-origin behavior and `Joint_` names | Retain explicit useful behaviors; add rest-frame options and semantic queries | Presets, joint naming, old GLB/source, animation targets | Rest-aware edits and semantic lookup coexist without silent ambiguous behavior |
| CPU view degradation and established/experimental exporter choices | Retain supported alternatives with explicit identity/fidelity | `captureViewsViaPort`, host port setup, export selector and preservation tests | Required GPU/material evidence cannot pass on CPU; no automatic exporter switch; source label alone does not justify retirement |
| Nested renderer dependency install | Official package owns the optional native dependency; one host-managed local service or explicit remote port remains the render boundary | Root dependency/module resolution and checkout service use are qualified. Cold installed-package/platform qualification remains H03/H04/H11 | Installed artifacts must resolve native runtime and shaders without nested installation or render-time downloads; checkout proof is not release acceptance |
| Old generated workspace/skill configuration | Explicit upgrade with user files preserved | `create-workspace.mjs`, plugin packaging, copied skills and runtime identity | Mixed versions diagnosed; current installed workflow works after upgrade/reconnect |

Migration transforms must parse syntax or structured data. Do not text-replace arbitrary strings, local identifiers, comments, or persisted historical evidence. Unknown schema versions fail visibly. Explicitly preserved stable behavior above is not a fallback to a retired implementation.

The full current caller set is checked again at each removal and during installed-package qualification, because callers can change during this initiative. Generated bundles are rebuilt only from the accepted source; hand-editing a bundle is not a source migration.

The C04 pass removed the duplicate primitive `createRoofPlanes` constructor, its
Euler compatibility patch and half-thickness shift. The single outer-eave constructor
remains a documented datum alternative to wall-bearing `createGableRoof`, not a
retired runtime fallback. See the [assembly evidence](2026-09-22-assembly-interoperability.md).

## September 23 checkout rejection proof

D07 is implemented for the checkout. Actual compiled Node 22 CLI and stdio MCP
reject the removed Discovery name and all three old selectors (`category`, `name`,
`names`). Both CLI discovery and render reject `--category`. The MCP listing has
fourteen current tools and no `kiln_list_primitives`. Node export resolution rejects
`./list-primitives` and `./prompt` with `ERR_PACKAGE_PATH_NOT_EXPORTED`, while the
supported `./primitives` export resolves as a positive control. Generated tool docs
also pass the registry drift check. Current setup skills and README provide the
upgrade instructions; there is no callable alias or catch-and-route behavior.

Receipt: `C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/retirement-checkout-review/receipt.json`.
Runtime: `sha256:41212c7f1f8331430ac0b11b187866c753e225dc4bdc647e5d2b8948bd02290a`.
An initial probe's unnormalized Windows `createRequire` path failed even for the
positive control; its corrected normalized-path probe is retained. No engine change
was made for that test-driver error. Installed-package rejection remains L07's
later gate; this evidence does not imply a packaged release.


P07 checkout qualification is complete. On runtime 75411f46...e3dca3a0,
eight actual pinned-Node entrypoint calls reject split and equals forms of
`--category` in render, generate, MCP startup and the dispatcher, before source,
provider or harness work. Existing passing neutral-context and dispatcher tests
cover label independence and host binding. No provider was called. Receipt:
`C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/category-retirement-review/receipt.json`.
This closes a stale checkout acceptance item; it does not change geometry or
complete L07's later installed-package checks.
