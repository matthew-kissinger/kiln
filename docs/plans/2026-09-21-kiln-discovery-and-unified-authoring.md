# Kiln Discovery and unified asset authoring

Status: checkout closeout complete; 115 implemented, 8 complete, 1 research evidence-ready, 11 in progress, 1 pending. All 36 main authorings, 72 main edits, 12 held-outs and 24 held-out edits reviewed. [Exact-candidate handoff](../reviews/2026-09-23-checkout-handoff.md); original acceptance requirements remain in the ledger.

> Finish Kiln’s unified checkout by resolving remaining shared defects, reconciling completed validation and finding dispositions, and delivering accurate support documentation and an exact-candidate handoff. Preserve explicit package/install/release gates. Reuse existing evidence and reopen implementation only for a demonstrated checkout blocker.

Current progress and resume instructions: [September 22 checkpoint](2026-09-22-progress-checkpoint.md). This records completed checkout gates and later install/release requirements; it is not release acceptance.

Owner alignment: clean Discovery/category/agent cutover, optional recipes, complete audit dispositions and heavy OpenCode dogfooding. Later steering permits diverse verified free models and existing Go/ClinePass. Contributor-training consent remains granted; record exact model/runtime/guidance per trial. No release action is authorized.

Gallery scope: existing assets were authored on earlier Kiln versions and remain
unvetted showcases, not golden outputs or reference solutions. Use them only for
bounded engine regression comparisons. Their repair, regeneration and replacement
are outside this goal; qualify improvements through fresh dogfooding and shared
defect fixes. Do not turn known showcase flaws into new asset-polishing tasks.

Execution update: finish the agents already running, then complete the remaining implementation and review sequentially in the main task to reduce token consumption, accepting longer elapsed time. Do not dispatch additional agents except for OpenCode dogfooding. After each dogfood campaign, mine the actual traces for discovery misses, tool errors, missing context and skill problems; repair and recheck the affected CLI, MCP and native Strands workflows. Record live Strands qualification separately from offline validation when provider availability limits the former. This overrides earlier parallel-execution guidance.

Explicit research exception: the owner subsequently authorized focused sub-agent research of Three.js PRs [34525](https://github.com/mrdoob/three.js/pull/34525) and [34572](https://github.com/mrdoob/three.js/pull/34572), and of Node/Bun/optional Strands packaging. Evaluate exact upstream revisions and reproduce relevant assumptions before changing renderer architecture. Draft potential upstream contributions from measured evidence; posting remains a separate user instruction. All other implementation remains sequential after existing assignments finish. This extends B05/B06 and N01 evidence, not a requirement to adopt either PR.

Strands live-run authorization: try verified free routes first. The requested paid fallback is OpenRouter `google/gemini-3.8-flash` with high reasoning, within the verified balance and $10 total ceiling. A separate authorization permits at most $20 of eligible GCP credits, with no out-of-pocket billing; recheck eligibility before use. Later owner steering permits other verified free tool/image models. Preserve trial identity, never expose credentials and report missing access. Native13 baseline and both refinements are complete and independently reviewed on one verified Google model route; broader provider and installation qualification remain separate.

Strands engineering direction: use current official documentation and the published TypeScript SDK's supported lifecycle, tool, skill and hook APIs. Prefer SDK-owned controls over local replicas. A compatibility adapter needs a reproduction against current packages and an explicit removal condition; do not modify SDK internals or equate a newer package with a qualified improvement. The [current SDK review](../reviews/2026-09-21-strands-current-sdk.md) records the 1.18.0 integration and the decision to retain the SDK foundation instead of adding general-purpose harness defaults.

End-user runtime update: before V1, separate the exact maintainer/release toolchain from the supported installed-package Node range. A community user reports successful Cline use after installing Node 22 because their Debian installation provided Node 20, and intends to recommend Kiln in programming classes. Treat that as a concrete installation-friction report, not proof of Node 20 compatibility. Audit shipped dependencies and Node APIs, test the proposed runtime floor with the actual package, and reconcile engines, setup checks and instructions. The upstream Node release page lists Node 20 as EOL and Node 22/24 as LTS when checked on September 21, 2026; consider supported lifecycle and actual distribution patches in the decision. Keep release pins unchanged while qualifying user support. Four added N tasks extend the original 132-task scope to 136 tasks.

Source baseline: `b81cfd4caed64bd90547ff83b4e513e59a1d4913`, verified unchanged from the audit. This plan incorporates the subsequent product alignment: category-free generation, optional discoverable recipes, and a fully supported prompt-driven Strands agent using the current shared workflow. It supersedes the sequencing and product-positioning recommendations in the [initial roadmap](../reviews/2026-09-21-roadmap.md). The audit remains the evidence record.

## Active goal boundary: pre-packaging qualification

The owner adopted the revised goal after the value review. Finish implementation
and the 36 main / 12 held-out authorings and edits against checkout workspaces now.
All 136 original tasks and acceptance requirements remain in the ledger; installed
package, destination and cross-device checks are recorded separately where not yet
executable or authorized. Do not produce a release package, commit, push, publish
or deploy. Checkout campaign completion is pre-packaging evidence, not completion
of the installed-package clauses in V03/V10/H/N. The current-stage finish line is
all authorized implementation and checkout qualification, with release-only gates
listed atomically and no unresolved in-scope defect hidden behind passing tests.

## Value and sequencing correction, September 22

The owner requested an explicit check against low-value testing and ceremony.
The [value review and remaining atomic tasks](../reviews/2026-09-22-value-and-remaining-work.md)
separate implemented capability from missing implementation and acceptance.
All 36 main authorings and their 72 edits are reviewed. All twelve held-outs and their twenty-four edits are reviewed on the frozen
candidate; their failures and trace findings remain visible. Reuse completed geometry, renderer,
QA/migration and Discovery evidence. Do not repeat the original audit or settled
comparisons. Native completion and final finding dispositions are now recorded. Later
installed-package gates remain explicit. Update the ledgers after coherent
outcomes, not as a substitute for product work.

All 136 tasks and the 36+12 campaign remain accounted for. Formative checkout runs
are not installed-package acceptance. The no-release-packaging instruction remains
in force; later installed/platform/destination gates remain explicit. This changes
work order and emphasis, not scope or the final acceptance standard.

## 1. Product decisions

Priority clarification from the owner: this is the complete Kiln unification and
V1 improvement initiative. Strands is a supporting integration, not the main
deliverable. Finish shared tooling, primitives, interoperability, diagnostics and
polish and dogfood with authorized OpenCode model routes, then mine the traces.
Check output quality and geometric diversity as well as tool correctness; avoid
guidance that pushes unrelated briefs into one construction style. Do not produce
the release package tonight. Keep unfinished installed-package or release checks
visible rather than treating source/workspace checks as their equivalent.

The entry experience is: **describe an asset, discover useful modeling knowledge, build it, inspect it, revise it, and deliver it.** Selecting a category is not a prerequisite. A recipe offers a useful construction approach; it does not determine which shapes, operations, or other recipes are allowed.

| Decision | Target behavior |
| --- | --- |
| Discovery name | Human-facing name **Kiln Discovery**; implemented tool ID `kiln_discover`; CLI command `kiln discover` |
| Discovery scope | Operations, reusable assemblies, recipes, and host/runtime capabilities through one service |
| Discovery requirements | Complete offline CPU search with no model weights, inference runtime, API key, GPU or search server; optional future enhancement cannot be a prerequisite |
| Categories | Optional searchable tags and recipe collections; no mandatory generation category |
| Requirements | Derived from the actual brief and destination when relevant; no replacement category questionnaire |
| Geometry | General helpers plus custom JavaScript/Three.js geometry remain available throughout authoring |
| Validation | Universal representation checks plus applicable brief-specific checks; retrieving a recipe never changes enforcement |
| Strands | A supported agent people can instantiate or invoke with a prompt, using the same current catalog and workflow as CLI/MCP |
| Compatibility | Preserve readable artifacts and sound unchanged APIs; explicitly migrate obsolete inputs; remove retired executable paths instead of silently routing to them |

`kiln_discover` is implemented across the shared registry, MCP and native adapters; `kiln discover` provides CLI access. The old callable and package subpath are removed. Checkout D07/D12 migration, stale-session and guidance checks are complete; cold installed retirement remains L07. Avoid exposing one MCP tool per primitive or per category.

The intended outcome for Strands updates the initial audit recommendation. It can remain an optional installation dependency so offline CLI/MCP users need no provider SDK, while receiving first-class behavior, documentation, and qualification when installed.

## 2. The authoring experience

For “make an open coliseum with tiered seating and traversable entrances,” the agent should:

1. Capture the requested open arena, seating, and traversal needs without assigning an architecture mode.
2. Search Discovery for repeated bays, arches/openings, radial placement, seating tiers, and stairs.
3. Retrieve only the relevant contracts and recipes, then mix them with ordinary modeling code.
4. Build one coherent bay or subassembly, inspect it, and repeat it while preserving frames and part identity.
5. Inspect the overall silhouette, entrances, seating, and circulation using relevant views and measurements.
6. Revise parameters and parts, then deliver source and the exact reviewed GLB.

Searching “architecture” remains useful, but returns suggestions. It does not require a roof, assume a one-storey house, restrict floor count, or exclude vehicle/vegetation operations. An author can ignore a gable recipe and construct a dome, ruin, or open structure. A single environment GLB does not require entering the separate scene-composer workflow.

Ordinary users should not have to author a requirements document. The calling agent or host can establish the requested needs as part of task setup. An optional explicit requirements input is for automation and precision. Ask the user only when an ambiguity materially changes the result, such as display miniature versus traversable game asset.

## 3. Shared Discovery design

### 3.1 One catalog, several views

Extend the existing catalog and `createKilnDiscoveryDef` implementation. Keep tool definitions and schemas owned by `src/tools/registry.ts`; CLI and Strands consume the shared service rather than maintaining their own inventories. Existing source files can remain modular, but every exposed entry must have one authoritative definition.

| Entry kind | Contents | Example |
| --- | --- | --- |
| Operation | Executable helper contract | `sweepProfile`, `mirror`, `meshGeo`, `copyGeometry` |
| Assembly | Executable constructor producing a meaningful part/subtree | Wheel assembly, gable shell, stair flight |
| Recipe | Inspectable construction guidance using existing operations/assemblies | Repeated structural bay, seating tier, directional-textured rail |

Material recipes remain versioned material data and are discoverable as recipes with a material subject. Character body-plan graphs remain graph scaffolds, not claims of complete skinned characters. Existing factory helpers can be classified as assemblies without changing their JavaScript names or return values.

Each entry should expose stable ID, kind, name, summary, tags, stability, related entry IDs, and references. Detailed operation/assembly contracts add signature, return shape, units, axes, origin, sync/async behavior, ownership, coordinate space, parameter bounds, topology assumptions, preservation/loss of attributes, semantic effects, and cost considerations. Recipes add prerequisites, construction steps, example source, adaptation points, limitations, and useful review checks.

Use `family` for operation groupings such as geometry or UV, and `tags` for semantic search terms such as architecture or vehicle. Avoid the overloaded word `category` in the new interface. Historical category fields are handled by explicit data migration, not an alternate discovery/runtime mode.

### 3.2 Retrieval behavior

The shared service should support a compact overview, ranked natural-language search, exact IDs/names, small batches, family/kind/tag filtering, paginated detail, and capability inspection. Authors must not have to know API spellings. Start with weighted local full-text retrieval, controlled concept expansion and bounded typo tolerance; do not introduce an embedding service or model call as a dependency of discovery. This is a relevance implementation, not just a rename of the existing substring filter.

Exact lookup wins over fuzzy suggestions. Search results explain why an entry matched, show relevant limitations, and offer related alternatives when no direct recipe exists. Searching “coliseum” must not hallucinate a finished coliseum generator. It can return structural repetition, openings and seating guidance.

Both human-readable text and structured output are bounded. The retired overview returned a full `primitives` array; the implemented overview returns summaries and compact starting signatures. Full examples and contracts appear on detail requests. Stable ordering, pagination and selector rejection have local checks. Preserve that small orientation guide so agents do not need several searches merely to create a root and first part.

Capability responses describe the actual installation, available recipe resources, selected exporter, renderer fidelity, execution limits, storage, and optional dependencies. A catalog entry may be discoverable while unavailable on this host, but that distinction must be explicit. Reading Discovery has no generation, network-fetch, policy-mutation, or asset-save side effects.

Implemented calls (the generated [tool reference](../tools.md) owns the full schema):

```js
kiln_discover({ query: 'arched openings and repeated bays' })
kiln_discover({ kind: 'recipe', tags: ['architecture'] })
kiln_discover({ ids: ['sweepProfile', 'createPart'] })
kiln_discover({ capabilities: true })
```

```sh
kiln discover --query "tiered seating" --json
kiln discover --id sweepProfile
```

These commands are available in the current built checkout. They were absent at the original audit revision. Installed-package qualification remains a later gate.

### 3.2.1 Ranked retrieval without mandatory embeddings

**Implemented behavior:** `src/discovery/lexical-index.ts` uses MiniSearch 7.2.0 with weighted names, aliases, intent phrases, summaries, families and tags. Token normalization, bounded prefix/typo matching and strict exact lookup replace the audit's all-words substring filter. The index is built in process from the catalog; it has no serialized cache or model dependency. Fresh recipe judgments and broader acceptance remain under D18.

**Target:** “put supports evenly around a circle” should find radial repetition without knowing `arrayRadial`. “cut windows into a wall” should find opening construction and appropriate alternatives. “make a tube follow a curved path” should find pipe/sweep operations. These are acceptance queries, not promises that the current engine already returns those results.

The retrieval design and acceptance criteria are:

1. **Normalize language and identifiers.** Split camelCase and punctuation, normalize case and common inflections, and retain meaningful multiword phrases. Remove low-information filler without discarding important technical terms, axes or units. Keep exact IDs/names in a separate lookup path.
2. **Retrieve by weighted fields.** Index names, aliases, intent phrases, tags, short descriptions, and recipe purpose. Use BM25-style relevance or a measured equivalent, with stronger weights for names/intent and lower weights for examples/long prose. Useful rare terms and phrase matches should outrank incidental mentions in long descriptions. Partial matches are candidates; all query words need not appear in one entry.
3. **Expand relevant concepts conservatively.** Treat genuinely interchangeable wording as aliases, such as “repeat around a circle” and “radial pattern.” Maintain related concepts separately: an axle is related to a wheel but is not a synonym. Expansion is bounded and weighted below direct evidence, not an unrestricted thesaurus that makes every geometry tool match everything.
4. **Recover small spelling differences.** Use prefix and edit-distance/trigram matching only with bounded token lengths and candidate counts. Exact API retrieval remains strict and can suggest corrections; a mistyped exact ID must not silently resolve to a different function. Fuzzy matches rank below good literal/concept matches.
5. **Add a few useful related results.** Follow typed catalog relationships such as alternative, prerequisite or companion after finding strong candidates. Mark those results as related and avoid filling the first page with aliases of one operation. Preserve distinct surface/solid, copy/share and geometry/assembly choices.
6. **Return a small ranked result set.** Give a short purpose, entry kind, key limitation and optional brief match explanation. Numeric scores stay internal; debug traces can support evaluation. A ranking score is not a calibrated confidence percentage. Preserve deterministic ties and pagination.

Example target responses:

| Query | Expected useful discoveries | Important distinction |
| --- | --- | --- |
| “put supports evenly around a circle” | Radial repetition; repeated-bay recipe | Assembly repetition versus mesh-only reuse |
| “hollow enclosure with a doorway” | Wall openings; room/shell recipe; boolean alternatives | Enclosure does not automatically mean gable house |
| “tube along a curved path” | Pipe/path operations; sweep | Open endpoints versus capped solid |
| “make another part that I can edit separately” | Owned geometry/material copies; assembly copying | Identity aliases must not rank as independent copies |
| “arena seating” | Seating-tier guidance; stairs; structural repetition | Related construction guidance is not a complete arena generator |

**Implementation choice:** Orama, FlexSearch and MiniSearch have now been compared with identical intent metadata, followed by local SPARSEUP and Qwen challengers. MiniSearch is the implemented lexical engine selected from the independent helper-query comparison; the neural improvements do not justify making model inference a package requirement. See the [measured comparison](../reviews/2026-09-21-discovery-first-experiment.md) and [offline search decision](../reviews/2026-09-21-discovery-offline-decision.md). Recipe queries, unsupported requests, growth measurements and actual CLI/MCP/native use now have checkout evidence; D18 retains low-power and installed limits. Choose using relevance, maintenance, license suitability, installed size, startup/query cost and Node/Bun/platform compatibility. Do not build a bespoke search framework or require Elasticsearch/SQLite just for this catalog. The [candidate review](../reviews/2026-09-21-discovery-search-options.md) preserves the original research comparison.

**Low-power baseline:** ship a single in-process lexical index with weighted fields, reviewed aliases/intent phrases and typed related links. Normal discovery must work without network access, model files, a Python/inference runtime, a GPU or a provider key. No automatic model downloads or inference-service startup. Metadata can be improved during development and shipped as ordinary versioned text; authors do not need a model to read or search it. The calling agent may break a complex brief into modeling operations using its existing reasoning, but the search service itself makes no model calls. This is the supported default, not a degraded fallback.

Do not ship an optional neural backend merely because it was benchmarked. Keep the internal retrieval interface modular; a later opt-in enhancement needs independent quality gains, measured memory/latency/download costs, explicit availability and failure behavior, and unchanged exact-lookup semantics. Offline lexical acceptance must pass independently. Precomputed document embeddings alone would not remove query-encoding requirements, so they are not a substitute for this baseline.

Established retrieval systems combine lexical ranking, synonyms, and sometimes additional retrievers/rerankers. Elastic documents BM25-based lexical relevance, synonym expansion, and rank fusion; SQLite documents local BM25 full-text ranking. We are borrowing those techniques, not proposing those products as dependencies. [Elastic ranking](https://www.elastic.co/docs/solutions/search/ranking), [synonym handling](https://www.elastic.co/docs/solutions/search/full-text/search-with-synonyms), [SQLite FTS5](https://www.sqlite.org/fts5.html). Sources checked during this planning turn; these are engineering documentation, not evidence of measured Kiln performance.

The implemented index is initialized from each process's catalog and reused. New entries enter retrieval through catalog metadata; aliases/intent phrases and author-independent test queries remain part of entry review. No serialized-index migration is needed because none is stored. D19 covers version identity and rebuild behavior; do not add a disk cache to satisfy an obsolete subproblem. Host availability is evaluated against current runtime context.

**Evaluation:** establish a judged query set before tuning: direct terms, paraphrases, typos, ambiguous words, multi-intent requests, rare operations, long natural-language requests, unsupported requests and misleading near-matches. Hold out paraphrases and some newly added entries. Measure useful-result recall in the first five, rank quality, false-positive/no-result behavior, query latency, initialization cost and response size. Compare against the current substring baseline, then verify the agent actually chooses and uses the returned tool correctly. Tune weights on a development set; do not advertise optimality from a few handpicked examples.

Evaluate semantic and reranking challengers against the same judgments as research, separately from default-runtime eligibility. Rank fusion can combine independent result lists without pretending their raw scores are comparable. A reranker cannot recover a relevant entry missing from its candidate pool, so measure candidate recall separately; a full-catalog quality reference is an additional experiment if needed to justify adopting a model backend. Embeddings remain evidence-driven and optional, not prohibited and not automatically required. Paid/network query rewriting is not part of the default path. Current evidence supports deferring any shipped model backend.

**Skills:** teach agents to describe the operation they want in ordinary language, inspect a handful of results, and fetch exact contracts before invoking unfamiliar helpers. Include a few search examples and a small orientation map, not a copied list of all helper names. Generate that map from the catalog so it grows with the product. Do not make agents guess the “magic words” or compensate for poor ranking with repeated trial-and-error queries.

### 3.3 Clean cutover and migration

Ship `kiln_discover` as the sole executable discovery tool. Remove `kiln_list_primitives` from MCP and in-process registries, generated tool definitions, shipped instructions and current examples. Do not keep a hidden alias, fallback implementation or old response dialect. A stale MCP caller receives the protocol's unknown-tool error; migration documentation and workspace preflight explain that it must update and reconnect. Do not re-register a deprecated tool merely to return a warning.

Refresh workspace skills/configuration, runtime bundles and catalog manifests as one versioned installation. A mixed old-skill/new-runtime setup must report a clear mismatch rather than silently operating partially. Provide an explicit workspace upgrade path that preserves user-authored briefs, source and customized files. Update registry/parity assertions to the actual intended tool set; no stale tool-count assumptions.

Publish a concise removed-name → replacement → behavior-change table and executable before/after migration examples. Preserve useful stable source APIs that still have one sound implementation. For actually retired APIs, convert old source or records explicitly into the current contract; preserve originals and show changes. Do not run the old behavior behind an adapter while claiming a completed migration. Unsupported conversions stop with a useful explanation.

### 3.4 Retirement policy across the package

The rule is **one supported behavior per operation, with explicit migrations where needed**. It applies to Discovery, category-driven generation, old Strands surfaces, misleading helper aliases and stale skills. Create an inventory of every deprecated/legacy path touched by the audit, its callers, replacement, removal test and artifact implications.

| Item | Target disposition |
| --- | --- |
| `kiln_list_primitives` | Remove; use `kiln_discover`; update installed skills and require session refresh |
| Mandatory category / runtime `--category` route | Remove from new execution surface; explicit converter maps old intent into neutral requirements |
| Strands current/edit/unified legacy surfaces | Remove after new program-reference implementation passes local conformance, before final campaign; no failed-run fallback |
| Identity `cloneGeometry` / `cloneMaterial` helpers | Remove misleading names; migrate intended sharing to direct references and actual editing to `copy*` after review |
| Misleading `validateAsset` advisory | Replace with clearly named advisory/metrics access; real validation remains the real pipeline |
| `panelRemapV` and obsolete wrapper paths selected for retirement | Migrate to canonical explicit APIs; retain old spelling only in migration/history material |
| Old GLBs, saved source and historical reports | Preserve bytes and readability; conversion/revalidation creates a new revision and does not rewrite historical evidence |
| Unchanged useful APIs and named axis variants | Keep when they have clear semantics; age or alias-like spelling alone is not a defect |

Do not conflate retirement with deliberately supported alternatives. The established exporter remains the current default and the experimental converter remains explicitly selectable unless its own review changes that decision. Likewise, the existing never-throw CPU renderer degradation is an intentional engine contract: retain its explicit fidelity reporting, and fail a required-material/GPU acceptance condition when it cannot be satisfied. Do not delete these merely because code calls something “legacy” or “fallback.”

Search/model/provider selection must never silently switch to an older or cheaper implementation to conceal failure. Optional backends must declare availability and chosen mode; a user-requested backend failure is visible. Temporary comparison implementations can live in research/test fixtures and must not become a second production runtime.

## 4. Category-free authoring and requirements

### 4.1 New semantics

Introduce a versioned neutral authoring context with no mandatory semantic category. This must change actual policy resolution, not merely hide a selector while silently retaining `prop` QA. Convert legacy `AssetIntentV1` through an explicit migration step outside the normal execution path; the current runtime consumes one normalized requirements contract.

Separate labels, asset scope, requested behavior, and representation/delivery needs. A single record may express articulation and navigation together without having to choose one mutually exclusive domain payload. Unknown, requested, inferred, and explicitly inapplicable are distinct states. Keep universal checks focused on finite data, structural/export integrity, execution constraints and supported representation. Watertightness, grounding, contact, human clearance and tile continuity are not universal obligations.

Recipes can suggest checks. The brief or calling host establishes which checks are required. A successful Discovery lookup neither adds nor removes an obligation. Source `meta.category` remains editable descriptive metadata and cannot select enforcement.

### 4.2 Practical ownership and persistence

Use the existing host-context boundary. The orchestrator establishes the initial requirements from the user's request outside the generated source, and execution tools receive the resolved context. For CLI automation, allow an optional requirements file. For MCP, define a task/asset-scoped binding path accessible to the host, with a neutral default that requires no preliminary category call. Bind per asset or authoring lineage, not to a mutable server-wide singleton: one session may work on several unrelated assets.

A source revision cannot silently lower the brief's obligations. A separate tool call from the generating agent is not automatically authority to erase a failed requirement. Host-authorized changes based on a changed brief are supported and recorded; this does not imply a confirmation dialog for every normal edit. Inferred advice can be corrected without being confused with explicit user requirements.

Keep program content identity separate from policy identity. A program may be evaluated under multiple review profiles. Validation results and policy-dependent cached builds must identify the effective policy version/hash. Geometry-only or image-only caches should include policy only where it affects their output; do not invalidate unrelated work indiscriminately.

Retain requirements and their provenance across edits, save/restore, and delivery records. Imported manifests can describe historical intent but do not establish new host authority by themselves. Old assets remain readable; an old policy that requires conversion receives a migration result or explicit migration-required error before current QA execution. Unversioned new requests must be distinguishable from legacy records. Test cache separation, concurrent tasks, restart, import and policy changes.

### 4.3 Migrating QA without losing useful checks

Create a rule-by-rule applicability map for the existing universal, category, subtype and capability rules. Record current mode, prerequisites, evidence, legacy behavior and new requirement mapping. Preserve calibrated rule modes; a taxonomy migration is not permission to turn all gates into warnings or vice versa.

Move meaningful checks onto independent requirements in bounded domain increments: prop/contact; vehicle/articulation; architecture/openings; environment/navigation/tiling; character/rig; vegetation/material; VFX/portability. Display unsupported or unmeasured requirements honestly. New architecture use should not inherit the house template or five-storey semantic ceiling. Keep computational budgets and explicit limitations of a checker separate from what geometry can be authored.

Remove `--category` from supported render/generate execution. Detect its use and return a migration error pointing to descriptive tags and optional requirements; do not convert it silently to `prop` or a house profile. The explicit migration utility understands the seven old categories and preserves their actual obligations where representable. Unrepresentable assumptions are surfaced for review, not discarded. Update library callers in the same pass.

## 5. Geometry reliability and reusable parts

### 5.1 Correctness first

Fix the independently reproduced failures through focused failing tests before implementation: baked wing reflection winding; mirror transform loss; radial scale loss; stale-ancestor bounds in `snapTo`; room floor datum; dropped same-wall openings; fractional stair counts; invalid atlas dimensions. Define radial orientation semantics explicitly because outward orientation is already documented. Assess changed output for assets with workarounds; do not silently redefine documented behavior as part of unrelated cleanup.

`createInstance` is a documented mesh extractor, not a general subtree copier. Give mesh reuse and assembly replication explicit contracts; retain the existing API only if it remains a deliberate, unambiguous supported operation. Remove deprecated `cloneGeometry`/`cloneMaterial` identity aliases. Migrate sharing to direct references and actual mutation to `copy*`; blindly replacing every identity call with a copy would change semantics. Shared primitive caching is intentional, so tests must cover the difference between sandbox reuse and direct-library fresh allocation.

### 5.2 Assembly contract

Use existing semantic frames/sockets. Define a common assembly result with a root, stable roles, named attachment frames, material slots, bounds/dimensions and explicit resource ownership. New constructors can conform directly; existing constructors can use adapters so callers are not broken by changed return shapes.

A correct replica preserves subtree transforms and shared geometry/material resources while assigning coherent new node identities. Internal role/socket relationships and animation targets must be remapped; external relationships require an explicit policy. Nonuniform scale, reflections, parent transforms and possible shear need defined behavior rather than silent lossy TRS decomposition. Unsupported skinned/morph/external-reference cases must be rejected or marked unsupported, not claimed as preserved.

Exercise the contract with wheel assemblies, gable structures, ladders, and articulated chains. A ladder needs a stable local frame and assembly root; its width direction should not collapse when the path aligns with a fixed world axis. Custom wheel geometry should agree with declared dimensions or disclose that the dimensions are assertions rather than measured evidence.

Frame-to-frame attachment is a candidate after those cases demonstrate need. `snapTo` remains AABB alignment; overlapping boxes do not prove surface contact. Ordinary JavaScript functions remain the reuse language. No new prefab DSL or remote recipe execution system is required.

### 5.3 Complete the contract cleanup

Cover all audit families, without equating cleanup with a rewrite:

- Document dimensions and axes, including capsule total extent, top/bottom radius order, wing displacement parameters, plane/torus orientation, and decal minimum thickness.
- Validate finite values and integer/domain constraints before allocating geometry. Add bounded sampling/subdivision/repetition growth and preserve host termination for nonreturning callbacks.
- Distinguish UV preservation, projection and remapping. Keep surface revolution distinct from solid revolution, with explicit units. Do not unify APIs whose topology promises differ.
- Preserve or explicitly report loss of UVs, tangents, material groups and semantics through CSG, deformation, subdivision and export. Test seams and scales rather than only triangle counts.
- Make animation presets rest-transform aware through compatible options or explicit animation pivots; validate keyframe timing, values and targets.
- Replace the misleading `validateAsset` advisory name, expose honest geometry/material/draw-cost metrics, and use semantic joint discovery with explicit support for older named nodes where useful.
- Label stylized gears, alpha glass, atlas cards and character graph scaffolds accurately. Resource availability, material appearance and destination behavior are separate claims.

Experimental implicit surfaces remain experimental. General bevel, shell, remesh, automatic loft correspondence and robust self-intersection proposals receive bounded experiments and documented conclusions in this pass. Do not mark these complete with a vague “later”; record the measured limit, useful supported alternative, and whether a bounded addition earns implementation. Universal CAD guarantees are not implied by including an experiment. Any genuinely larger unresolved feature must be explicitly listed at the final review rather than hidden as completed work.

## 6. Recipes and dogfooding

Start by packaging inspectable recipes from existing knowledge: structural bay, multiple openings, roof attachment, stairs/seating tiers, wheel articulation, branched/non-humanoid chains, foliage cards, and directional UV use. Prefer short parameterized functions and named anchors. Recipes should declare what is assumed, which helpers they use, how to vary them, and where they stop being appropriate.

A recipe that needs a missing low-level operation should not quietly copy an entire alternative engine into its example. Record the need, compare an existing-code approach, and promote a helper only if it reduces repeated errors or substantial duplicated logic. Revisit the existing negative roof-expansion experiment before adding shed/hip factories.

The static census of 105 sandbox functions and 42 without direct example calls is a prioritization aid. Maintain a per-entry evidence ledger distinguishing contract tests, executed examples, agent usage, visual review and downstream import. The seven lexical test-reference gaps include aliases and do not prove seven untested behaviors.

Dogfood in separate clean-room workspaces according to the setup skill. Use the same corrected geometry baseline for comparison conditions. Old guidance may be an isolated historical benchmark arm, not a shipped alternate runtime. Final acceptance uses only the new Discovery and recipe workflow. Failure of discovery should improve guidance rather than restore mandatory categories or silently use the removed tool.

Use repeated matched briefs and held-out edits: familiar prop, rotated/scaled repetition, articulated vehicle, boat, multi-level facade, open coliseum, thin organic surface, foliage, directional-textured sweep, and modular bridge/terrain. Include part swap, resize, repetition-count, material and animation edits. Record failures as well as gallery successes, exact source/runtime/policy identities, actual helper use, repairs, cost, visual review and destination import. Separate harness and model effects. Establish baseline variance before declaring a numerical quality bar.

### 6.1 Required OpenCode campaign

The primary lane is **OpenCode with verified free models or the existing Go subscription**. Muse Contributor training consent remains recorded; later owner instructions also allow other capable tool/image models. Record the exact route for each trial and keep it fixed through its edits. Do not silently change a model mid-trial or infer permission for additional purchases. Three preflights are complete; repeating them is unnecessary without a changed access/setup condition.

Agreed workload (36 main authorings and 72 edits reviewed; nine held-outs and eighteen edits reviewed; three held-outs remain):

| Stage | Workload | Purpose |
| --- | --- | --- |
| Route/package preflight | 3 short runs | Verify model identity, fresh workspace skills, actual workspace MCP discovery, source/edit/save/export and renderer evidence |
| Main campaign | 12 brief families × 3 independent runs = 36 authorings | Repeated coverage of the complete upgraded surface rather than a few curated successes |
| Revision challenge | At least 2 requested edits per successful main/final authoring | Part swap/resize/repetition/material or articulation changes; expose composition and source-locality failures |
| Fix and regression loop | Affected cases plus related adversarial fixtures after each fix | Turn reproducible defects into permanent tests; preserve failed attempts; no rerun-until-lucky acceptance |
| Final held-out campaign | 6 unseen briefs × 2 runs = 12 authorings | Confirm the frozen checkout after the fix loop; installed-candidate qualification remains a separate later gate |

This is 48 substantive OpenCode authorings plus 3 preflights, with edits and bounded repair reruns. Proposed operating limits: one authoring process at a time under the later sequential-work direction, 45 minutes per initial authoring, 15 minutes per edit, and at most one infrastructure retry per attempt. Record timeouts/refusals as outcomes; halt a lane on repeated identical infrastructure failures rather than spend the whole campaign retrying. These are campaign defaults to implement, not claims that existing scripts already enforce every limit. If actual run cost or availability changes materially, report it before expanding the workload.

The twelve main families are: detailed prop; rotated/scaled repeated mechanism; steerable wheeled assembly; watercraft; multi-level facade; open coliseum; thin/organic surface; foliage cutouts; directional-textured sweep; tileable terrain/bridge; branched articulated non-humanoid; and a small mechanical assembly. Include discoveries phrased without API names, ambiguous near-matches, unsupported requests, and intentional dimension/attachment mistakes. Keep some relevant combinations out of recipe examples and tuning queries.

Use a separate OpenCode process rooted in the clean workspace so it actually loads the intended MCP server. Prior repository receipts show that nested authoring can accidentally exercise CLI only and that outer-session telemetry can miss child MCP calls (`docs/dogfooding.md:245-246`). Capture the actual authoring session's tool events. Report MCP and CLI coverage separately; CLI success cannot stand in for the required MCP lane. No manual source repair by the reviewer before scoring a run; an intervention is part of the result.

Every run retains the brief, exact model/harness identity, skill/catalog/package hashes, policy, source revisions, tool events, error history, GLBs, review images and acceptance outcome. Use material-faithful views for material claims. Review visuals and destination import/playback separately from deterministic QA. Include false warnings and missed defects, not just whether QA was green. OpenCode success does not certify the Strands adapter: also run a smaller matched Strands generation/refinement lane using a verified supported provider. Do not equate an OpenCode contributor route with a directly callable Strands provider.

### 6.2 Full audit coverage and scope accounting

Every audit finding, including suggested improvements, must appear in a finding-to-task ledger with one outcome: fixed and tested; upgraded and qualified; retained with a justified contract; or a bounded experiment with explicit results and a remaining limitation. No finding closes merely because documentation now calls it experimental. Where a universal solution is infeasible, complete the bounded experiment, improve diagnostics/available alternatives, and surface the remaining scope for owner review.

This pass explicitly includes parts/assemblies, all primitive/helper families, parameter validation, geometry/material/UV/animation preservation, semantic metadata, QA applicability and false-result behavior, Discovery relevance, skills/docs, clean-room setup, Strands, packaging and migration. Existing supported code is not rewritten just for age. Improvements outside the original user wording are included when directly supported by audit evidence, notably resource-allocation limits, policy-sensitive cache correctness, exact-final-revision delivery, and accurate inspection/resource metrics.

## 7. Strands as a proper supported agent

The target is a public library entry and `kiln generate "<prompt>"` that perform the current workflow end to end. Keep one underlying engine implementation and adapt it to Strands; a supported agent does not require a second modeling system.

The native program-reference path is implemented through `createKilnNativeToolRegistry` and `makeKilnProgramTools`; obsolete production current/edit/unified selection is removed. Discovery, source/edit, render and inspection use the shared definitions, while delivery tools depend on injected storage. `kiln_finish` selects an exact retained revision. Remaining S/H tasks concern complete retirement, context and lifecycle acceptance plus successful live generation/refinement; offline parity is not live qualification. Preserve these intentional adapter differences without shipping fallback surfaces.

The loop should interpret the brief, discover selectively, construct, inspect images/metrics, repair concrete problems, and finish against an exact retained revision. It should not preload the whole catalog or blindly render the same asset repeatedly. Unresolved blockers, unsupported requirements and budget exhaustion need a useful partial result, not a false completion.

Terminal submission must identify the exact final program revision and evidence; resolve it through the store and verify the final artifact belongs to that revision. Return source reference, output descriptors, diagnostics, unresolved limitations and usage summary. CLI output, saved collection records, and the reported final result must agree. Support refinement from an existing revision and orderly resume from saved source; preserving a source checkpoint is not a promise to resume an arbitrary provider conversation.

Preserve provider-specific cache semantics, image compaction, mutation ordering, cancellation, call/time budgets, renderer fidelity and evaluator isolation. Two agent instances must not share mutable task state inadvertently. Skill-mode and inline prompts should teach the same verbs and derive catalog knowledge from Discovery. Missing optional provider packages should produce clear setup errors without affecting offline tools.

Provider compatibility must be verified against official SDK/provider documentation at implementation time and then qualified by actual authorized runs. The audit's passing mocked/offline tests are not current live-generation certification. Final package verification asserts that old executable surfaces are absent and that failures cannot route into them. Rollback means using the previous package version, not quietly switching behavior within the new one.

## 8. Sequence, scope and release gates

### 8.1 Native harness integration and unified renderer packaging

Owner follow-up: Strands should use tools built into its harness, while the official Kiln installation should own the normal local rendering experience and retain optional rendering on another device. Shared adapters and root renderer dependencies are implemented in this checkout. Cold official-package and full platform qualification remain outstanding.

**Current evidence:** native Strands tools wrap the shared registry directly. The root package owns renderer source and optional `webgpu`/canvas dependencies; ordinary resolution replaces the former nested installation. CLI and MCP use the shared on-demand service lifecycle, with compatible-service reuse, bounded idle lifetime and explicit remote routing. Actual Windows GPU, Linux dependency installation and Windows-to-Linux material and animation fixtures have receipts. Real Windows/Linux material and nine-phase animation comparisons now pass; see [cross-device evidence](../reviews/2026-09-23-cross-device-rendering.md). Native live completion and the cold installed-platform matrix remain open. See the [adapter matrix](../architecture.md#tool-surfaces), [renderer guide](../rendering.md) and [checkpoint](2026-09-22-progress-checkpoint.md).

Use one capability implementation and registry with deliberate adapters:

| Surface | Execution and responsibilities |
| --- | --- |
| Strands | Native in-process tools; harness injects stores, requirements, rendering and telemetry. Owns model loop, budgets, cancellation, image context, progress and terminal submission of an exact revision. No local MCP server or CLI subprocess needed for ordinary tool execution. |
| MCP | Protocol adapter for an external agent. Preserves program references, media and errors; the external harness owns reasoning, credentials and completion. No autonomous submit tool. |
| CLI | Command adapter with flags, files, exit codes and structured output. `generate` can invoke the Strands harness; ordinary build/render commands need no model. |

Shared schemas and semantics do not require identical tool counts or message envelopes. Record every intentional difference, including metrics-only versus image-bearing responses and terminal submission. Keep definitions in the registry; test capability conformance and adapter behavior rather than forcing false name parity. Reuse skill guidance and Discovery metadata through a native prompt/context loader; Strands should not depend on a coding harness installing workspace MCP configuration or expose every catalog entry as a separate tool.

**Product target, architecture provisional:** one official Kiln installation experience and one supported rendering implementation. A managed local GPU process is the leading architecture hypothesis, not a decision the research lane must confirm. Compare it against alternatives below before implementation. Keep CPU-only imports free from eager native GPU loading. Ordinary supported installations should not require users to enter a nested directory, run another package manager, or locate the renderer themselves. Renderer source, shaders/hooks, runtime dependencies and release identity belong to the official release. Internal platform-specific optional artifacts are acceptable as implementation details installed through the normal package flow, not a separately operated user product. One user-facing package does not require one physical npm archive or one operating-system process.

First qualify whether pinned native dependencies can install reliably through that flow on supported Windows, Linux and macOS targets. Measure installation size, startup and native binary availability; test package managers, disabled install scripts, read-only installs and CPU-only hosts. Do not promise that bundling supplies missing drivers or makes every GPU compatible. Unsupported systems retain explicit CPU use and actionable diagnostics. If a repair command is necessary, it must be a Kiln-owned operation with pinned, verified artifacts; no hidden package-manager invocation or arbitrary download during a render call.

Unify host policy across CLI, MCP and Strands: local `auto` should start or join the managed renderer when the request needs PBR evidence, using the existing shading predicate and bounded startup. This deliberately changes the CLI's present join-only `auto` behavior and requires documentation and cold-start qualification. Explicit CPU never starts GPU work. Required GPU/material evidence fails visibly if unavailable. Preserve the single-machine socket registry, stale-owner rules, separate in-loop/artifact deadlines, and `captureViewsViaPort` as the single degradation owner. CPU views remain labeled structural evidence; pixel output never becomes structural QA input. If renderer availability changes during a session, expose a deliberate refresh/reprobe instead of requiring an unexplained harness restart.

For another device, configure a remote render endpoint through the same render port abstraction. Send the self-contained GLB and capture parameters; receive validated views and fidelity metadata. Source programs, model credentials and unrelated workspace files stay with the authoring host. A tunnel can carry that connection, but tunneling is deployment infrastructure rather than a second renderer API. Explicit remote selection must not silently switch to local GPU execution. Define how optional CPU degradation is reported under `auto`; required remote/GPU evidence remains a failure when unmet.

Remote qualification covers authenticated transport, endpoint protocol/capability compatibility, request limits, cancellation/timeouts, service/device identity and cache separation. Local source fingerprint matching must not be imposed on a different host as the compatibility protocol. Maintain existing authenticated non-loopback binding; prefer HTTPS or an authenticated tunnel beyond a trusted local network. Render the same material/animation fixtures locally and remotely, checking contracts and visual tolerances rather than promising pixel identity across GPUs.

The architecture research and native Strands distinction belong in this pass. Local packaging unification is a conditional implementation lane following the research decision; do not force an unreliable native distribution merely to meet a one-install slogan. An infeasible approach must produce a concrete alternative and visible scope decision before closing H04. A hosted renderer control plane, automatic provisioning and tunnel management are outside this pass. Remote operation remains a supported explicit endpoint, qualified on a second machine when one is available. A loopback test is not proof of cross-device acceptance; record that acceptance as outstanding if hardware is unavailable.

### 8.2 Renderer architecture and distribution research lane

Implementation update: B01-B05 produced Windows package/execution receipts and independent adversarial findings. The [B06 decision](../reviews/2026-09-21-renderer-decision.md) selects exact optional upstream native dependencies plus the managed HTTP service for implementation, with lifecycle/identity/admission/self-contained-input corrections below. Non-Windows and final installed-package qualification remain open. This decision supersedes the earlier provisional architecture language; it does not turn unrun gates into passes.

Research precedes H03/H04 and can run alongside Discovery and geometry work. Its deliverable is an evidence-backed architecture decision, runnable packaging prototypes, a scored alternatives table, measured platform receipts and implementation/migration tasks. A literature summary alone does not close the lane. Existing lifecycle and fidelity contracts remain unchanged during experiments; any proposed contract revision must be explicit.

Evaluate distribution and execution separately rather than conflating them:

- Distribution: pinned native dependencies in the main package; automatically selected platform packages; a Kiln-managed explicit provisioning command; and the existing separate install as a baseline. Compare optional dependencies with required dependencies: preserving a CPU-only install must not conceal a failed GPU installation.
- Execution: the existing managed local service; a dedicated child process with IPC; direct in-process execution as a control; and remote service deployment. Compare startup, crash isolation, concurrent sessions, memory/GPU ownership, version skew, cancellation and operational complexity. A shared service losing its initiating owner while other sessions remain active needs an explicit qualification case.
- Renderer technology: qualify the existing Three.js/Dawn implementation first. Include a browser-backed or other native backend only where primary-source evidence suggests it resolves a measured blocker; avoid turning package integration into an unbounded renderer rewrite. One distribution change need not change the rendering technology.

Test packed artifacts in fresh installations, not just the checkout. Cover supported OS/architecture/runtime combinations, npm and Bun behavior, disabled lifecycle scripts, omitted optional dependencies, offline reuse, restricted/read-only directories, absent drivers, GPU initialization failures and multiple installed Kiln versions. Record compressed/downloaded/installed bytes separately, startup-to-first-PBR-image, steady render time, peak memory and failure diagnostics. Distinguish simulated failure tests from actual native installation/GPU receipts; missing hardware is an evidence gap, not a passing platform result.

Include native binary provenance, redistribution licenses/notices, integrity verification, update cadence and supply-chain maintenance in the decision. No arbitrary dependency resolution or downloads during an asset render. Examine whether upstream prebuilt binaries actually cover the pinned version and supported targets instead of treating a generic availability statement as sufficient.

Primary-source starting points checked on 2026-09-21: [Dawn's Node binding documentation](https://dawn.googlesource.com/dawn/+/HEAD/src/dawn/node/README.md) identifies an npm package with prebuilt bindings; [webgpu](https://www.npmjs.com/package/webgpu) is the current dependency family; [npm package metadata](https://docs.npmjs.com/files/package.json/) documents optional dependencies and platform restrictions. These establish candidate mechanisms, not Kiln installation qualification. In particular, optional dependency installation failure can leave the main installation successful, so capability diagnostics are part of the architecture, not documentation polish.

Choose using hard gates first: artifact fidelity, explicit failures, CPU-only usability, supported-platform installation and local/remote contract integrity. Then weigh install friction, footprint, latency and maintenance. The decision may recommend an explicit one-time Kiln setup step if measured constraints make automatic installation unreliable. Report that tradeoff honestly rather than preserving an extra install while describing it as seamless. Record rejected alternatives and the conditions that would justify reconsidering them. No new backend or physical package layout is selected by this plan alone.

| Milestone | Deliverable | Exit condition |
| --- | --- | --- |
| M0 | Contracts and migration decisions | Discovery naming/schema, compatibility behavior, neutral requirements boundary and assembly contract recorded |
| M1 | Reliable modeling foundation and Discovery | Confirmed defects fixed; new catalog/search plus CLI/MCP tested; retired discovery tool absent and upgrade errors actionable |
| M2 | Category-free authoring | Neutral policy is the sole normal path; meaningful QA maps to requirements; explicit old-data migrations preserve provenance |
| M3 | Composable parts and useful recipes | Assembly reuse and targeted recipes survive transformed parents, edits, export and semantic inspection |
| M4 | Supported Strands workflow | Program-reference agent completes, refines, cancels and delivers coherent results using Discovery |
| M5 | Checkout dogfooding, repair and handoff | Authorized OpenCode campaign, supporting Strands checks, repair loop, held-outs and candidate evidence; packaging and publication remain later |

M1 correctness fixes can proceed while Discovery contracts are finalized. M2 depends on the requirements design, not on every optional recipe. M4 shares the M1/M2 interfaces and should not wait for speculative advanced geometry. M5 must not be claimed from unit tests alone. This plan defines dependency milestones, not ungrounded calendar estimates.

The full pass includes every task listed below. Candidate tasks must deliver bounded experiments and an explicit adoption/limitation decision, not an unexamined deferral. Adopted improvements join the implementation and final dogfood gates; unimplemented research-scale capabilities remain visible at final review. Task dependency columns describe direct implementation dependencies; release membership additionally prevents unrelated required fixes from disappearing. Smaller local milestones may be reviewed, but no commit/push/publication precedes the requested final dogfooding sequence.

For behavior changes, follow repository TDD: focused failing test, smallest correction, focused pass, then required offline gates. Use pinned toolchain versions. Run toolchain/skill checks, typecheck, lint, tests and coverage at appropriate integration boundaries. Run render-service tests if that project changes; rebuild committed runtime bundles after CLI/MCP runtime changes; test packaged installation, generated workspaces, shared schemas, current tool conformance and explicit rejection of retired calls. Check both exporter paths for affected preservation contracts while retaining the existing default unless explicitly changed. The audit's 556 passing targeted tests are historical baseline evidence, not a passing receipt for any future implementation or release candidate.

Final dogfooding may use the authorized free routes and existing subscriptions, with identity fixed per trial and contributor-training consent retained. Spending stays within the recorded provider-specific ceilings. This phase does not package, commit, push, publish or deploy.

Because the owner wants dogfooding before commits, bind precommit receipts to base HEAD plus the reviewed working-tree/input manifest, toolchain, bundle/package SHA-256, catalog/skill versions and source hashes. A HEAD SHA alone does not identify an uncommitted candidate. After commit authorization, verify committed source matches the qualified candidate, rebuild/reconcile metadata and rerun affected checks if bytes change. Remote CI follows an authorized push; any deployment/publication needs its own destination verification. Do not claim an uncommitted candidate was already qualified under a future commit SHA.

Rollback uses the prior package/version with preserved original assets. New code does not contain a legacy policy/agent/tool fallback. An exporter default change or promotion of experimental geometry still requires its own evidence; those are not automatic consequences of clean-cutover work.

## 9. Audit coverage map

| Audit issue or recommendation | Task IDs below |
| --- | --- |
| Category selection unavailable/misleading; hidden prop fallback | P01–P07 |
| Architecture defaults, floor ceiling, mixed environment requirements | P08–P14 |
| Progressive discovery, overloaded category terminology, full structured overview | D01–D09 |
| Ranked relevance, natural-language queries, synonyms, typo tolerance and growing catalog | D13–D19 |
| Catalog metadata, copy aliases, unsupported capabilities and legacy names | D02–D04, D10–D12, G10 |
| Mirrored wings, radial/mirror transforms, stale snap bounds | G01–G05 |
| Room datum, missing openings, stair/atlas invalid parameters | G06–G09 |
| Ownership, animation rest values, UV naming/fallback, misleading utility metrics | G10–G18 |
| Uneven input validation, sampling/resource growth | G19–G22 |
| Axes/units, tolerances, preservation, sweep warning, roof coverage | G23–G28 |
| Mesh-only reuse, inconsistent assembly roots, sockets and wheel dimensions | C01–C07 |
| Preset/recipe limitations, existing roof expansion evidence, speculative helpers | C08–C10, R01–R06 |
| Weak end-to-end evidence despite tests and examples | V01–V05 |
| Strands surface divergence, skills, budgets, providers and final revision | S01–S10 |
| Packaging, generated skill drift, bundles, exporter/destination acceptance | D12, V05–V08 |
| Clean removal, explicit source/data migration, workspace upgrades and no hidden legacy paths | L01–L08 |
| Every finding accounted for; false-positive/false-negative QA and fidelity gaps | Q01–Q03 |
| Advanced geometry opportunities receive measured experiments in this pass | E01–E05, C10 |
| Owner's final OpenCode campaign, fix loop, held-out verification and precommit identity | V02–V04, V09–V11 |
| Native harness differences, one-install local renderer and explicit remote deployment | H01–H11 |
| Renderer distribution/execution alternatives and measured architecture decision | B01–B06 |

The [geometry inventory](../reviews/2026-09-21-geometry-inventory.md), [workflow audit](../reviews/2026-09-21-workflow-audit.md), [research ledger](../reviews/2026-09-21-research.md), and [adversarial review](../reviews/2026-09-21-adversarial-review.md) supply source evidence and qualifications. This plan makes design choices from that evidence; it does not claim new research establishes the proposed API as optimal.

## 10. Atomic task list

Current status is recorded in the implementation ledger; these rows define scope and acceptance. Each row is one independently reviewable deliverable with an acceptance condition. Priority: P1 = core correctness or target-workflow prerequisite; P2 = contract completeness/qualification; P3 = bounded research/candidate evaluation, still included in this pass. Dependencies refer to task IDs, not implicit permission gates. A decision task needs measured evidence and a concrete disposition; an implementation task cannot finish merely by recommending future work. Candidate adoption is conditional, but performing and reporting the experiment is required.

### Discovery

| ID | Priority | Task and primary scope | Acceptance | Depends on |
| --- | --- | --- | --- | --- |
| D01 | P1 | Record the Discovery interface and clean rename contract (`tools/discovery`, registry) | `kiln_discover`, CLI naming, selectors and versioning specified; no old executable alias | L01 |
| D02 | P1 | Define the typed catalog entry schema | Operations, assemblies and recipes share IDs/tags but retain distinct payloads; invalid entries rejected | D01 |
| D03 | P1 | Populate contracts for all 105 existing sandbox helpers | Inventory reconciles every helper with kind, units, ownership, return shape, stability and documented limitations | D02 |
| D04 | P1 | Integrate the shared discovery query service | Exact lookup, ranked candidates, related results, filtering and pagination have deterministic tested behavior | D15,D16,D17 |
| D05 | P1 | Bound overview and detail payloads | Overview text and structured JSON contain summaries only; detail limits and truncation/paging are explicit | D03,D04 |
| D06 | P1 | Register the canonical MCP Discovery tool | Registry owns schema; actual MCP result matches shared query output and version contract | D05 |
| D07 | P1 | Remove the old primitive discovery tool | `kiln_list_primitives` absent from executable registries/schemas; stale calls fail and docs point to upgrade | D06 |
| D08 | P1 | Add the CLI discovery command | Human and JSON modes use the shared service; selectors, errors and pagination match MCP | D05 |
| D09 | P2 | Make capability output reflect the actual host | Selected exporter/render mode/resources/dependencies and unavailable features reported accurately without side effects | D06,D08 |
| D10 | P2 | Index material recipes and character scaffolds | Ten material recipes and available body-plan graphs/guidance discoverable with honest portability/completeness labels | D03,D04 |
| D11 | P1 | Migrate authoring/refinement/QA instructions to Discovery | Skills teach natural-language operation queries and fetching exact contracts, with a generated orientation map rather than a static name dump; old tool documented | D06,D07,D08 |
| D12 | P2 | Update generated discovery docs and installed-skill parity checks | Registry, docs, skills, workspace copies and site discovery resources agree; no reliance solely on absent downstream skill tests | D10,D11,D19 |
| D13 | P1 | Establish judged retrieval queries before tuning | Direct names, paraphrases, typos, compound/ambiguous/unsupported requests have relevance judgments and held-out split | D02 |
| D14 | P1 | Implement normalized intent/alias indexing | CamelCase, phrases and common wording indexed; synonyms distinguished from related concepts; expansion bounded | D02 |
| D15 | P1 | Select and implement the default relevance backend | Orama/FlexSearch/MiniSearch compared with common metadata and semantic/reranking research challengers; default works offline on CPU without models/inference dependencies/keys/downloads; tradeoff recorded; no every-word-match requirement | D13,D14 |
| D16 | P1 | Implement bounded typo and prefix recovery | Misspellings recover useful candidates without flooding results; explicit name/ID lookup remains strict with suggestions | D15 |
| D17 | P2 | Implement related-result expansion and deduplication | Companions/alternatives clearly marked; top results not monopolized by aliases; API differences preserved | D15 |
| D18 | P1 | Evaluate ranking against baseline and held-out queries | Recall/rank quality, unsupported queries, fresh recipe/helper holdouts, warm/cold latency, incremental memory and payload size measured; isolated offline/CPU installation passes without model artifacts; no optimality claim from tuned examples | D04,D13 |
| D19 | P2 | Make index growth/version behavior reliable | Added entries appear automatically; serialized stale indexes detected; build/init costs measured; host availability remains live | D18,D09 |

### Neutral authoring and QA

| ID | Priority | Task and primary scope | Acceptance | Depends on |
| --- | --- | --- | --- | --- |
| P01 | P1 | Define neutral requirements and explicit old-data conversion | Labels/scope/requirements independent; V1 converts outside normal execution; no dual policy runtime | L01 |
| P02 | P1 | Implement asset-scoped requirements binding | Host-established context isolated per task/lineage; source cannot lower it; authorized brief changes recorded | P01 |
| P03 | P1 | Propagate policy identity through evaluation/results | Validate/render/inspect/delivery agree on effective policy; model label and resolved policy distinguishable | P02 |
| P04 | P1 | Correct policy-sensitive cache identity | Same source under different requirements cannot reuse an incompatible QA result; unrelated caches remain reusable | P03 |
| P05 | P1 | Persist requirements with saved/restored assets | Current edits/restarts preserve provenance; old policy needs explicit conversion; imported claims not trusted silently | P02,P03,L03 |
| P06 | P1 | Implement neutral CLI and MCP authoring entry | New requests need no category/setup questionnaire and no hidden prop profile; explicit requirements optional | P03,P07 |
| P07 | P1 | Remove category-driven CLI execution | `--category` produces actionable migration error; no prop fallback; all supported paths use neutral requirements | P01 |
| P08 | P1 | Inventory every QA rule's migration mapping | Modes, applicability, evidence and old/new behavior recorded; no rule disappears without disposition | P01 |
| P09 | P1 | Migrate prop/contact applicability | Explicit grounding/contact requirements select checks; floating or disconnected legitimate assets not universally rejected | P03,P08 |
| P10 | P1 | Migrate vehicle applicability | Wheel/load-bearing/articulation obligations independent of semantic vehicle label; boat case receives no invented wheel requirement | P03,P08 |
| P11 | P1 | Migrate architecture applicability | Roofless ruin, dome, display miniature, arena seating distinct from storeys, non-house dimensions and six-level fixtures accepted when appropriate; checker limits reported separately from modeling limits | P03,P08 |
| P12 | P1 | Migrate environment applicability | Navigation and tile seams selectable together with other requirements; seating tiers are not automatically storeys | P03,P08 |
| P13 | P2 | Migrate character and vegetation applicability | Rig/body-plan and foliage/material checks preserve current evidence modes without mandatory labels | P03,P08 |
| P14 | P2 | Migrate VFX portability applicability | Portable/sidecar and animation obligations explicit; no generic-asset path falsely certifies unsupported runtime effects | P03,P08 |
| P15 | P1 | Add migration adversarial integration fixtures | Source relabeling, omitted requirements, concurrent assets, changed briefs and old manifests cannot silently change obligations | P04,P05,P09,P10,P11,P12,P13,P14 |

### Geometry and helper corrections

| ID | Priority | Task and primary scope | Acceptance | Depends on |
| --- | --- | --- | --- | --- |
| G01 | P1 | Repair baked wing reflection (`primitives`) | Both wings have outward winding/normals and mirrored bounds; single-sided/export regression passes | None |
| G02 | P1 | Repair radial source-scale preservation (`ops`) | Nonuniformly scaled source retains expected dimensions in all repeated copies | None |
| G03 | P1 | Specify and implement compatible radial orientation behavior | Outward convention retained/documented; arbitrary source-frame composition available through explicit semantics | G02 |
| G04 | P1 | Repair mirror transform composition | Rotated/scaled source reflects correctly in documented space; parent transforms and shear limitations tested | None |
| G05 | P1 | Refresh ancestors for `snapTo` bounds | Mid-build moved-parent case closes intended AABB gap with correct parent conversion | None |
| G06 | P1 | Reconcile room floor datum | Ground/threshold convention matches documentation and composed shell behavior; changed-output compatibility recorded | None |
| G07 | P1 | Support multiple same-wall openings through one validated builder | Two openings survive room construction; overlapping/out-of-wall cases have defined handling; gable path shares applicable logic | G06 |
| G08 | P1 | Reject invalid stair counts | Fractional/nonfinite/nonpositive counts fail before construction; valid rise/run bounds preserved | None |
| G09 | P1 | Reject invalid atlas grid dimensions | Zero/noninteger/nonfinite dimensions produce clear errors and no invalid UV allocation | None |
| G10 | P2 | Remove identity clone aliases and correct ownership | Retired globals/exports removed; source migrations preserve intended sharing versus copying; mutation guidance tested | D03,L04 |
| G11 | P2 | Add compatible rest-transform handling to position presets | Breathing/bobbing can preserve authored offset; legacy zero-origin behavior remains explicit | None |
| G12 | P2 | Validate animation track invariants | Invalid times/values/targets fail clearly; duration and quaternion behavior documented and covered | None |
| G13 | P2 | Specify UV preservation/projection/remap contracts | Existing fallback semantics and seams explicit; new API proposal distinguishes operations and frames | D03 |
| G14 | P2 | Implement explicit frame-aware UV projection | Rotated non-Y mapping and seam/cap policy tested; surviving preservation/projection APIs have distinct explicit contracts | G13 |
| G15 | P2 | Replace ambiguous UV remapping entry | Canonical U/V remap available; `panelRemapV` retired with explicit source migration | G13,L04 |
| G16 | P2 | Replace misleading `validateAsset` advisory | Clearly named advisory/metrics API replaces old function; real QA not bypassed; migration and failure cases tested | D03,L04 |
| G17 | P2 | Expose honest resource metrics | Triangle, mesh, unique-material and estimated draw costs distinguished; no material-count-as-draw-call claim | G16 |
| G18 | P2 | Provide semantic joint discovery | Wheel pivots and joint chains discoverable by semantics; legacy `Joint_` query remains compatible | None |
| G19 | P2 | Validate basic primitive numeric domains | Finite dimensions and bounded integer segment contracts consistent; intentional surfaces/degeneracies handled explicitly | D03 |
| G20 | P2 | Validate specialized part numeric domains | Wing, gear, blade and repeated-detail invalid inputs fail with named causes; art-grade scope preserved | D03 |
| G21 | P1 | Bound parametric-surface allocation | Segment product checked before allocation/callback work; normal workloads unchanged | None |
| G22 | P1 | Bound subdivision and repetition growth | Excessive growth rejected before expensive work; limits are computational, not category triangle budgets | None |
| G23 | P2 | Publish and test dimension/axis contracts | Capsule extent, radius ordering, torus/plane axes, wing units and decal clamp reflected in Discovery | D03 |
| G24 | P2 | Qualify geometry tolerances across scales | Tiny/mechanical and large/environment fixtures yield explained diagnostics; no unsupported solid-validity claim | None |
| G25 | P2 | Verify scaled sweep warning accuracy | Tight-turn warning includes effective station scale or explicitly states limitation with a regression fixture | None |
| G26 | P2 | Qualify deformation and subdivision seams | Ownership, interval boundaries, UV seams, tangent invalidation and normals preserved/reported per contract | None |
| G27 | P2 | Qualify CSG-to-material-to-export preservation | Preserved and intentionally dropped attributes tested across supported converters, including empty results and cut faces | None |
| G28 | P2 | Qualify roof surface layout boundaries | Partial rows, both ridge axes and transformed faces stay within documented coverage; mesh cost reported | None |

### Assembly composition and candidate unification

| ID | Priority | Task and primary scope | Acceptance | Depends on |
| --- | --- | --- | --- | --- |
| C01 | P1 | Define the common assembly interface | Root, frames, roles, materials, dimensions, ownership and identity/remapping contracts specified using existing semantics | None |
| C02 | P1 | Add hierarchy-preserving assembly replication | Children/local transforms survive; geometry/material sharing explicit; legacy `createInstance` remains mesh-only | C01,G04 |
| C03 | P1 | Remap replicated semantic/animation identity | Internal references and animation targets point to the replica; external/unsupported cases handled explicitly | C02,G12 |
| C04 | P2 | Adapt wheel and roof assembly results to common accessors | Both can be inspected/repeated through common contract without breaking existing return shapes | C01,C03 |
| C05 | P2 | Add an assembly-root and robust frame path for ladders | Arbitrary endpoint direction supports perpendicular width; rail/rung result fields remain, with an explicit root/parent-layout migration | C01 |
| C06 | P2 | Reconcile custom wheel geometry with declared dimensions | Mismatched geometry/metadata produces defined validation or explicit advisory; ordinary shared sets pass | C01 |
| C07 | P1 | Add part replacement and repetition acceptance fixtures | Wheel, roof, bay and articulated chain survive transforms, replacement, name remapping and export | C03,C04,C05,C06 |
| C08 | P3 | Implement and evaluate a bounded frame-attachment candidate | Test wheel/roof/bay mating against manual placement; adopt and qualify if useful, otherwise report measured reason and supported alternative | C07 |
| C09 | P3 | Evaluate path/revolution consolidation with executable fixtures | Surface/solid/interpolation/caps/units stay distinct; remove actual redundant retired paths or document why separate current APIs are necessary | G23 |
| C10 | P3 | Resolve advanced geometry experiment outcomes | Each E-task has measured limits; useful bounded additions implemented/qualified or remaining scope explicitly reviewed, not silently deferred | E01,E02,E03,E04,E05 |

### Recipes and evidence catalog

| ID | Priority | Task and primary scope | Acceptance | Depends on |
| --- | --- | --- | --- | --- |
| R01 | P1 | Define inspectable recipe format | Versioned ID, prerequisites, steps, source, adaptation points and limitations; retrieval never mutates policy | D02 |
| R02 | P2 | Publish structural bay/opening/seating guidance | Parameterized examples combine existing operations, allow open structures, and preserve editable parts | R01,G07,C07 |
| R03 | P2 | Publish wheel and branched articulation guidance | Recipes preserve frames/rest transforms without assuming every asset is a vehicle or biped | R01,C07,G11 |
| R04 | P2 | Publish foliage and directional-material guidance | Cutout and UV recipes distinguish CPU shape evidence from GPU material review and destination limitations | R01,G14,G27 |
| R05 | P2 | Build the per-entry evidence ledger | All helpers/recipes distinguish tests, examples, agent use, visual review and import evidence; zeros not labeled proof of nonuse | D03,R01 |
| R06 | P3 | Decide additional helper/recipe promotions from evidence | Revisit shed/hip negative evidence and segmented-primitive needs; adoption/defer decisions tied to actual failure cases | R05,V04 |

### Strands agent

| ID | Priority | Task and primary scope | Acceptance | Depends on |
| --- | --- | --- | --- | --- |
| S01 | P1 | Specify public prompt-to-asset agent contract | Construction/invocation, host dependencies, result, refinement and error behavior documented without mandatory categories | P01,D01 |
| S02 | P1 | Implement the canonical program-reference agent path | Current Discovery/shared context used; temporary comparisons isolated to tests; no duplicate tool definitions | S01,D06,P06 |
| S03 | P1 | Implement exact-reference terminal completion | Final source/artifact/evidence resolve to the same retained revision; unrendered or mismatched submission cannot claim success | S02,P03 |
| S04 | P1 | Align inline and skill-driven agent instructions | Both teach identical current verbs, selective discovery, inspect/repair and completion; old unified+skill mismatch eliminated | S02,D11 |
| S05 | P1 | Preserve budgets, cancellation and mutation ordering | Cancellation stops owned work; budgets return honest partial results; conflicting writes serialized; independent agents isolated | S02 |
| S06 | P1 | Integrate current render/inspection feedback | GPU fidelity, part/interior/animation views and image compaction usable in the loop with separate deadlines | S02 |
| S07 | P1 | Deliver coherent CLI/library generation outputs | Prompt invocation returns source and matching GLB/output descriptors, limitations and usage; missing optional SDK setup errors clear | S03,S04,S05,S06 |
| S08 | P2 | Support refinement and checkpoint restart | Existing/saved program resumes editing without whole-source retransmission or lost requirements; partial saves clearly labeled | S07,P05 |
| S09 | P2 | Qualify supported provider adapters | Official current SDK checks, offline contract tests and authorized live trials cover cache/usage/image/tool behavior | S07,V02 |
| S10 | P1 | Remove old production agent surfaces before final dogfood | Program-reference loop is sole supported path; old flags fail clearly; cancellation/errors cannot fall back to old loops | S08,S09 |

### Clean retirement and migration

| ID | Priority | Task and primary scope | Acceptance | Depends on |
| --- | --- | --- | --- | --- |
| L01 | P1 | Inventory all retirement decisions and callers | Every old tool/helper/policy/agent path classified remove, explicit migrate, or supported retain with reason; renderer/exporter alternatives distinguished | None |
| L02 | P1 | Add retired-input diagnostics | Old flags/schema/source globals fail before partial execution with migration guidance; lexical lookalikes/local identifiers not falsely blocked | L01 |
| L03 | P1 | Implement explicit intent/manifest conversion | Originals preserved; conversion outputs new version plus diff/report; unmappable obligations stop visibly; no runtime legacy branch | P01 |
| L04 | P1 | Implement source migration for removed helpers | Reviewed rewrites preserve sharing/copying and dimensions; ambiguous transforms require explicit correction; never blanket-rewrite identity clone to copy | L01 |
| L05 | P1 | Implement workspace/runtime/skill upgrade | Mixed versions diagnosed; current config/skills refreshed with user files preserved; session restart instructions accurate | D11,L02 |
| L06 | P1 | Update shipped docs/examples and API migration guide | Current instructions invoke only current APIs; historical names confined to labeled migration/history content; examples execute | D07,P07,G10,G15,G16,S10,L04 |
| L07 | P1 | Prove retired paths are absent and cannot mask failures | Negative tests on installed package/registries reject old invocations; no hidden aliases or catch-and-route behavior | L02,L06 |
| L08 | P1 | Qualify old-artifact reading and explicit migration | Existing GLBs/source readable unchanged; migrated edits run current code; stale workspace gets usable upgrade/error rather than partial success | L03,L04,L05,V06 |

### QA completeness and advanced experiments

| ID | Priority | Task and primary scope | Acceptance | Depends on |
| --- | --- | --- | --- | --- |
| Q01 | P1 | Build a complete finding-to-task closure ledger | Every atomic audit finding/improvement maps to evidence, task and final disposition; no uncategorized omissions | None |
| Q02 | P1 | Measure QA false-positive and false-negative behavior | Valid open/floating/articulated fixtures and deliberately defective counterparts check applicability, thresholds and misleading green outcomes | P15,V01 |
| Q03 | P1 | Verify view/inspection and acceptance evidence consistency | Part paths/frames, current policy, source hashes and renderer fidelity agree; CPU degradation cannot satisfy required material evidence | P03,S06 |
| E01 | P3 | Evaluate bounded shell construction | Open/curved/thin cases measure thickness, topology, attributes and limits; practical alternative or qualified bounded implementation delivered | G24,G27 |
| E02 | P3 | Evaluate bounded bevel improvements | Concave/mixed/thin fixtures measure shape and attribute effects; prior experiment results reused and extended where missing | G24,G27 |
| E03 | P3 | Evaluate remeshing usefulness and loss | Warped/boolean/uneven fixtures measure quality, error, topology, attributes and growth; no unqualified general remesh claim | G24,G27 |
| E04 | P3 | Evaluate loft holes/correspondence needs | Varied sections and holes compared with existing extrusion/sweep approaches; reject ambiguous correspondence visibly; bounded outcome documented | G25 |
| E05 | P3 | Evaluate self-intersection diagnostics | Positive/negative fixtures quantify detection limits, scale/cost and false results; improve bounded diagnostics without claiming universal CAD certification | G24,G25 |

### Renderer research and architecture decision

| ID | Priority | Task and primary scope | Acceptance | Depends on |
| --- | --- | --- | --- | --- |
| B01 | P1 | Establish renderer requirements and baseline | Current cold install/render measured; supported target matrix and hard gates explicit | None |
| B02 | P1 | Research native distribution feasibility | Pinned upstream binaries, licensing, install behavior and release maintenance verified from primary sources | B01 |
| B03 | P1 | Prototype shortlisted package layouts | At least two viable candidate layouts or measured exclusion evidence; fresh packed-install receipts include failure cases | B02 |
| B04 | P1 | Compare execution boundaries | Managed service, child IPC and in-process tradeoffs assessed with targeted probes; concurrent owner-exit and remote boundary covered | B01 |
| B05 | P1 | Adversarially review renderer recommendation | Attempt to disprove preferred design using installation failures, missing GPU, version skew and resource/lifecycle cases; gaps explicit | B03,B04 |
| B06 | P1 | Record architecture decision and revise implementation lane | Scored options, evidence, rejected alternatives, migration and concrete H-task updates; conditional scope resolved without claiming unrun gates | B05 |

### Native harness and unified renderer

| ID | Priority | Task and primary scope | Acceptance | Depends on |
| --- | --- | --- | --- | --- |
| H01 | P1 | Specify adapter capability matrix | Shared registry semantics and intentional Strands/MCP/CLI differences documented, including media and terminal submission | S01 |
| H02 | P1 | Qualify native Strands execution | Direct tools use injected per-run stores/rendering and lazy Discovery; no MCP/CLI hop; isolation, media and cancellation tested | H01,S02,S05,S06 |
| H03 | P1 | Qualify native renderer dependency packaging | B06 optional native strategy uses real module/version resolution; notices/provenance and supported-platform installation, script-disabled/readonly/CPU-only cases covered | B06 |
| H04 | P1 | Integrate renderer into official installation | Packed install resolves runtime/shader/native files without nested manual install; release identity includes renderer | H03 |
| H05 | P1 | Unify local startup and shared-service lifetime | PBR auto starts/joins compatible service; explicit CPU avoids it; GPU requirement fails visibly; bounded idle lifetime survives initiating-owner exit while queued/active work protects service; one socket registry | H04 |
| H06 | P1 | Add renderer status and deliberate reprobe | Users can diagnose and refresh availability without unexplained session restart; no hidden installation on render | H05 |
| H07 | P1 | Specify remote compatibility and routing | Validated protocol/build/dependency identity; unknown/timed-out listeners never joined; auth, decoded-resource limits and degradation defined; explicit endpoint never selects local GPU | None |
| H08 | P1 | Qualify remote adapter and material evidence | Invalid/missing identity, timeouts, bounded queue, abandoned jobs and decoded allocations tested; self-contained GLB gate prevents external fetches; required fidelity validated against local contract | H07,H05 |
| H09 | P1 | Exercise real second-device rendering | Local/remote material and animation fixtures compared; actual hosts recorded or cross-device acceptance explicitly outstanding | H08 |
| H10 | P1 | Update unified install and rendering instructions | README, generated workspaces, skills and CLI help explain default local plus optional remote; obsolete nested setup removed | H02,H06,H08 |
| H11 | P1 | Run installed renderer and harness qualification | Cold install to PBR image through CLI/MCP/native tools on supported targets; offline/CPU and remote failures truthful | H02,H04,H05,H06,H08,H10 |

### Qualification and packaging

| ID | Priority | Task and primary scope | Acceptance | Depends on |
| --- | --- | --- | --- | --- |
| V01 | P1 | Add cross-helper adversarial conformance matrix | Reflection/parent transforms, ownership, seams, preservation and assembly edits tested as invariants | G01,G03,G04,G05,G26,G27,C07 |
| V02 | P1 | Specify the bounded OpenCode campaign | Exact contributor route resolved; owner's training consent recorded; 36 main plus 12 held-out authorings, edits, limits and independent review specified | R05,S01 |
| V03 | P1 | Run the main OpenCode CLI/MCP campaign | 3 preflights and 36 authorings exercise new installed package only; actual child MCP events, failures, images and edits retained | V02,D12,P15,R02,R03,R04,V01,V06,L07,L08,Q02,Q03,C10 |
| V04 | P1 | Run matched Strands parity checks | Real new-loop generation/refinement assessed separately; verified provider required; OpenCode route not assumed directly callable | V03,S10 |
| V05 | P1 | Qualify destination imports and playback | Representative GLBs retain dimensions/materials/parts/animation; runtime vs editable deliveries tested | V01,S07 |
| V06 | P1 | Rebuild and test runtime/package/workspace artifacts | Pinned gates pass; installed artifacts expose only intended current APIs; explicit migration and version mismatch behavior tested | D12,P15,S10,L05,L06,H11 |
| V07 | P2 | Finalize support/migration documentation | Recipe maturity, limits and agent support match final held-out evidence; no retired-path instructions in current skills | V05,V06,V10 |
| V08 | P1 | Assemble exact-candidate release evidence | Precommit base HEAD plus intended tree/package/bundle hashes identify tested candidate; findings/limitations accounted for | V05,V06,V07,Q01,L07,L08,H09,N04 |
| V09 | P1 | Close dogfood findings through fixes and regression tests | Every failure triaged; engine/skills/recipes corrected where needed; affected cases rerun and originals retained; adopted candidates included | V04,R06,C08,C09,C10 |
| V10 | P1 | Run final held-out campaign on frozen local package | 12 unseen OpenCode authorings plus edits run after fixes; final artifacts/reports assessed without reviewer repairs; unresolved failures visible | V09,V05,V06 |
| V11 | P1 | Present precommit completion and publication handoff | Owner receives qualified hashes, results and open limitations before commit/push; later authorized commit reconciled to tested tree, remote CI/publication separate | V08 |

### End-user runtime compatibility

| ID | Priority | Task and primary scope | Acceptance | Depends on |
| --- | --- | --- | --- | --- |
| N01 | P1 | Audit the installed runtime floor separately from release pins | Shipped Node APIs, transitive engine requirements, optional renderer/provider constraints and current support lifecycle identify a justified minimum; Debian/Cline feedback recorded | None |
| N02 | P1 | Implement the supported end-user runtime contract | Package engines, setup checks and actionable diagnostics agree; exact Bun/Node/npm release pins remain maintainer checks; incompatible optional capabilities do not unnecessarily block offline Discovery | N01 |
| N03 | P1 | Qualify actual installed-package runtime boundaries | Minimum supported and representative newer Node versions run CLI/MCP setup, Discovery, source/edit/render/export and optional capability checks; Debian/container and Cline evidence distinct from simulated fixtures; unsupported versions fail clearly | N02,H04,S10 |
| N04 | P1 | Update installation and classroom-facing guidance | Clear user prerequisites without unnecessary maintainer pins; tested Debian/Cline setup and limitations documented; community feedback attributed without inventing the unnamed reporter identity | N03,V07 |
