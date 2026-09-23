# Workflow, categories, QA, and Strands audit

Date: 2026-09-21. Read-only implementation review plus targeted offline tests. No provider calls, source modifications, package publication, or new assets. Findings distinguish implementation evidence from generation-quality evidence. Paths/lines refer to this checkout.

## Main conclusion

Use one asset-authoring workflow with operation-based discovery and explicit, composable requirements. Preserve category labels as compatibility metadata and optional diagnostic profiles while migrating their meaningful requirements into capabilities. Do not delete category QA wholesale: it contains valuable checks and evidence contracts. The immediately actionable problem is that the shipped host workflow cannot set most of that trusted intent, whereas generated `meta.category` looks like it can but explicitly cannot.

The engine already has substantial support for this direction: custom BufferGeometry, a shared geometry API, progressive MCP discovery, immutable program revisions, capability-scoped QA, and a composition library. Categories do not gate access to modeling helpers. A model choosing `prop` does not lose roof, vehicle, or geometry helpers; it loses or changes diagnostic context.

## Atomic workflow inventory

| Surface | What it really exposes | Category / discovery behavior | Assessment |
| --- | --- | --- | --- |
| `meta.category` in source | Descriptive source label, returned as `modelCategory` | Cannot select trusted QA; seven names documented | Sound trust boundary, confusing apparent selector. `skills/kiln-author-asset/references/program-contract.md:16`; `src/render.ts:1638` |
| Core asset contract | Seven categories: prop, character, vfx, environment, architecture, vegetation, vehicle | Category plus subtype, capabilities, scope, material, animation and domain payloads | Much richer than a simple prop dropdown; preserve data compatibility. `src/contracts/asset.ts:32-42,333-337,1936-2021` |
| MCP stdio startup | Shared program registry with local evaluator, stores, collections | No shipped intent-setting tool; default context has no category | Most domain QA is not selected by source metadata. `src/mcp-server.ts:115-116`; `src/local-runtime.ts:45-139`; `src/tools/registry.ts:2354-2388` |
| MCP discovery | Overview, exact name, batches of six names, text query, category, paged results, capabilities | Category means API family (geometry/structure/etc.), not asset class | Already progressive and agnostic. `src/tools/discovery.ts:9-55` |
| MCP source loop | validate/render -> retained reference -> bounded source read -> atomic edit -> render | No need to retransmit whole programs | Strong host-agent workflow; promote as canonical. `skills/kiln-author-asset/SKILL.md:19-33` |
| MCP specialized views | Animation, roof-off interior, part inspect | Available independent of requested category | Keep capabilities independently accessible. `src/tools/registry.ts:2365-2370` |
| MCP collections | save, assets, present, export, import | Explicit pinned revisions and provenance | Separate delivery lifecycle from generation taxonomy. `src/tools/registry.ts:2475-2675` |
| CLI `render` | Offline source/ref export and optional views | `--category` accepted, no complete intent-file flag | Can choose category but cannot fully express domain requirements. `src/cli.ts:120-122,195-201,251-269` |
| CLI `generate` | Optional Strands model loop, source and GLB output | Defaults to prop; only category string, not structured intent, exposed in CLI | Convenience adapter has narrower policy control than library. `src/cli.ts:271-335`; `src/agent/run.ts:267-269` |
| CLI help/parser | Five categories in help; any string accepted | Omits vfx/environment; invalid render category falls back to prop | Packaging defect; validate input against shared enum. `src/cli.ts:41,120-122`; `src/render.ts:1317-1322` |
| Library host context | Trusted `intent` or category | Full requirements can be supplied by embedding host | Powerful but not currently equivalent to end-user MCP. `src/tools/registry.ts:117-152,334-350` |
| Strands current tools | Four shared registry tools + animation screenshot + submit | Catalog discovery is older baseline, whole-code calls | Actual six tools; source comment says five. `src/agent/tools.ts:181-205`; `src/agent/surface.ts:56-60` |
| Strands edit tools | Mutable source buffer and surgical edit workflow | Parallel mutation safety and explicit terminal handling | Existing alternative duplicates some program-store behavior. `src/agent/tools.ts:269-342`; `src/agent/run.ts:345-349` |
| Strands unified tools | draft, view, edit, render, inspect, animation, interior, finalize | No lazy list-primitives; prompt embeds full examples | Actual eight tools; source comments say six. `src/agent/tools.ts:700-711`; `src/prompt.ts:784-807` |
| Strands program tools | Full program-aware MCP tools plus submit adapter | Already shares canonical host surface | Present but not a selectable run surface. `src/agent/tools.ts:168-172`; `src/agent/surface.ts:25,95-112` |
| Inline Strands prompt | Full generated catalog by default; trimmed optional | Trimmed stub says ~70 helpers and misses newer groups | Avoid competing hand-maintained discovery maps. `src/prompt.ts:747-782` |
| Strands skill mode | AgentSkills plugin via supplied skillDir | Explicit code comment documents unified+skill mismatch | Cannot advertise all combinations as equivalent. `src/agent/run.ts:294-312` |
| Authoring skill | Subject, scale, style, destination, review, source edits, save | Program contract explains source category; no host mechanism to choose intent | Gives honest warning but does not resolve access gap. `skills/kiln-author-asset/SKILL.md:11-19`; reference contract line 16 |
| Composition skill | Arrange existing GLBs, inspect integration, deliberate transforms and overlap review | Host/library API only, not MCP composition tools | Correct separation; environment authoring is a different workflow from assembling assets. `skills/kiln-compose-scene/SKILL.md:7-17` |
| Composer library | Layout, collision, reachability, terrain, world document/package | Separate optional agent exports | Broad scope behind library seams. `src/composer/index.ts:7-19`; `package.json:64-66` |
| Public package | CLI, MCP, source API, optional agent and composer/agent exports | Strands optional peer ^1.4.0, dev pin 1.17.0 | Staleness cannot be inferred merely from dependency age; define supported adapter contract. `package.json:19-66,138-164` |

## Findings and adversarial cases

### W1. Default prop policy is structural, not just a model habit (high)

`renderGLBInProcess` resolves `opts.intent` first, otherwise makes an intent with `isAssetCategory(opts.category) ? opts.category : 'prop'` (`src/render.ts:1317-1322`). Registry `trustedCategory` reads host intent/category only (`src/tools/registry.ts:334`). The source contract explicitly refuses to trust generated metadata (`program-contract.md:16`). Packaged local context adds execution and cache policy, not an asset intent (`src/local-runtime.ts:45-139`). No MCP tool establishes trusted requirements (`registry.ts:2354-2388`).

Consequently, a source saying architecture or vehicle can still receive prop QA in normal MCP authoring. This is not evidence the model failed to select the right category. Do not solve it by trusting whatever the same source being evaluated asserts: that lets output weaken its own obligations.

Suggested design: bind a host-established, versioned requirements record to the task/project or program lineage, visibly echo the resolved policy and origin in every result. Let a host agent propose requirements from the user's brief through a separate path, preserving change history and never allowing an ordinary source edit to silently lower requirements. Unknown requirements should remain explicitly unknown, not silently become a one-storey house.

### W2. CLI exposes an incomplete, weakly validated category selector (medium)

Help names five of seven categories and `parseArgs` does not validate the string (`src/cli.ts:41,120-122`). Offline render silently maps invalid strings to prop (`src/render.ts:1320`). Example adversarial input: `kiln render asset.kiln.js --category architecure` appears plausible but receives fallback policy. Generation additionally normalizes a full intent and may reject later; the parser should be consistent for both commands.

Immediate fix after review: derive help and parsing from `ASSET_CATEGORIES`, reject typos, document policy selection separately from source metadata, add a host-controlled intent file option if categories remain the current transport.

### W3. The architecture limit is five storeys, and its defaults are more concerning than the number (high design concern)

The current contract validates integers 1 through 5 (`src/contracts/asset.ts:1006-1015`), explicitly tests five and rejects six (`src/contracts/asset.test.ts:272-313`). The QA counts semantic `floor.storey.<index>` roles (`src/qa/architecture.ts:961-991`). This is a **contract limit**, not a limit on mesh generation or JavaScript loops. Arbitrary geometry can contain many levels.

Bare architecture intent defaults to an enterable, navigable, one-storey, 4m by 4m gabled building with 2.8m walls and a default doorway (`asset.ts:1551-1608`). That is unsuitable as a universal interpretation of a coliseum, ruins, pavilion, skyscraper, sculptural landmark, or miniature shell. Specifying intent can override several assumptions, but the CLI only exposes category and normal MCP no intent selector at all.

A coliseum test must distinguish concentric seating tiers from building storeys, traversable entrances from decorative openings, open sky from missing roof, and one asset from an asset pack. Removing the storey ceiling alone does not solve these semantics.

### W4. Environment support exists, but a singular taxonomy obscures overlapping requirements (medium)

Environment subtype contracts include terrain tile, rock/cliff, cave, road/path, shoreline, wall/gate, bridge, set-dressing cluster and custom (`src/contracts/environment.ts:3-14`). Their profile derives tileable/navigable capabilities separately (`:72-82`). A coliseum plausibly combines architecture, environment, modular assembly, navigation and decorative prop requirements; a single category cannot naturally carry all domain payloads, since validation permits architecture/character/vehicle/etc. payloads only with matching categories (`src/contracts/asset.ts:1305-1498`).

Do not replace these requirements with one undifferentiated asset class that loses meaningful checks. Separate descriptive labels, scope (single/cluster/module/pack member), functional requirements (grounded, enterable, tileable, articulated), and domain recipes. Existing capability-scoped QA is a useful migration seam (`src/qa/registry.ts:525-547`).

### W5. Strands is divergent and insufficiently qualified, not demonstrably abandoned (medium)

The code includes shared registry adapters, provider-specific cache handling, image history compaction, mutation-batch guards, model-call budgets, diagnostic views, bounded refinement, and safe salvage (`src/agent/run.ts:254-261,294-351,430-605`). Offline tests exercised these today. Calling it severely outdated would misrepresent the evidence.

There is concrete drift: three authoring idioms, current/unified-only runtime selection despite an existing full program-tools adapter, skill/unified mismatch documented in source, stale tool-count comments, and a downstream skill drift gate skipped in this checkout. The unified path is not progressive discovery: it deliberately removes the discovery tool and embeds catalog examples (`src/prompt.ts:784-807`).

Recommendation: make host-agent CLI/MCP the primary supported product; classify Strands as an optional adapter until current provider runs qualify it. Integrate `makeKilnProgramTools` into a tested selectable runtime surface before deleting old loops. Preserve terminal-submit semantics, budgets, trusted context, exact final-reference validation, provider cache distinction and image receipts. Deprecate duplicate surfaces only after equivalent offline and paid, explicitly authorized generation trials.

### W6. QA coverage is substantial but is not visual quality acceptance (high claim discipline)

The deterministic registry composes universal, material, architecture, character, vehicle, vegetation, prop, environment, breadth, intersection, connectivity and reference rules (`src/qa/run.ts:33-49`). Initial report dimensions are export integrity/category readiness (`:51-56`), while runtime cost is appended separately (`:109-158`). Source validation explicitly no longer uses category triangle budgets (`src/validation.ts:174-201`).

Passing a synthetic category corpus proves the tested assertions work on those fixtures. It does not establish that frontier models choose metadata consistently, understand sockets, generate plausible joints, or construct reusable multi-asset environments. Visual dogfooding and destination import checks are separate evidence. The current authoring skill already states this clearly (`skills/kiln-author-asset/SKILL.md`, final paragraph).

## Recommended sequence

1. **Before packaging:** fix CLI category help/validation; expose resolved QA policy and policy origin; document the absent MCP intent selector; qualify Strands as optional; fix stale counts and explicitly describe unsupported skill combinations. No breaking taxonomy rewrite required.
2. **Next contract increment:** represent explicit requirements independently of descriptive category, avoid domain assumptions from a category alone, and bind requirements to retained program lineage. Preserve legacy defaults behind versioned compatibility behavior.
3. **Next workflow increment:** reuse the existing program-tools adapter for Strands with terminal submission by exact retained reference; run one authoritative discovery catalog rather than additional prompt maps. Keep old surfaces during controlled comparisons.
4. **Acceptance corpus:** same brief authored in MCP and optional Strands: simple prop, articulated vehicle, floating watercraft, six-level facade, open coliseum, cave, tileable road/bridge, terrain cluster, modular building kit. Include deliberate mislabeled source category, omitted requirements, invalid CLI category, and requirement-changing edits. Compare images, export/import, metadata, QA false positives/negatives, edits, latency and call cost. A category corpus alone is insufficient.
5. **Later simplification:** remove redundant category UI only after composable requirements can select the checks users actually need. Keep domain recipes discoverable as suggestions, never gates that hide general geometry.

## Validation run

Command (PowerShell environment set to offline CPU):

```powershell
$env:KILN_SPIKE_LIVE='0'
$env:KILN_RENDER='cpu'
bun test src/contracts/asset.test.ts src/mcp-parity.test.ts src/agent src/__tests__/prompt-api.test.ts src/__tests__/mcp-instructions.test.ts src/qa/architecture.test.ts --timeout 20000
```

Observed: **297 pass, 2 skip, 0 fail; 299 tests across 22 files, 2,530 assertions, 2 snapshots; 16.75 seconds.** The two skipped tests are downstream `.claude/skills/kiln-glb` generated-catalog drift gates, intentionally skipped when that downstream skill is absent (`src/__tests__/prompt-api.test.ts:159-173`). Output retained for this run in the OS temporary file `kiln-workflow-audit-tests.txt`. These are targeted tests, not the full release gate, live provider validation, visual dogfooding, or destination-runtime acceptance.
