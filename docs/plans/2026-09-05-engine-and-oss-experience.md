# Kiln engine and OSS experience implementation plan

Status: feature implementation, runtime/platform checks, the fifteen-attempt showcase batch and final 63-asset browser/build review are complete. A documentation-only archive carries a separate equivalence receipt against tested runtime 0d457e8f. Owner-deferred Mac/browser/device/comparison follow-ups remain unverified; they do not block this candidate. See the [local finish line](remaining-work-audit-2026-09-05.md).

Owner clarification: after implementation, update the skills, dogfood with Astra, Gemini through Antigravity (`agy`), and Meta Muse Spark through OpenCode, then refine the engine/tools/skills/docs from those results and retest. These three routes are required for final acceptance; earlier exploratory runs do not satisfy this gate.

## Current integration state

This ledger distinguishes implemented behavior from final acceptance. The task checklists below remain the acceptance contract; an implementation row is not permission to skip its remaining checks.

| Packages | Current evidence | Disposition |
| --- | --- | --- |
| B0/B1 | Starting diff/fingerprints preserved; baseline 1,555 tests. Versioned contracts, legacy fixtures and migration guide complete. | Implemented; no user work committed or discarded. |
| G0–G6 | Owned copies, export contracts, attributes, custom surfaces, deformation, sweeps/lofts and preserving CSG verified. Mirrored-input, sphere-seam and sampled-cylinder acceptance fixtures added. Gear crown/no-bore degeneracy fixed after live model discovery. | Stable within documented preservation/topology limits. |
| C0–C4 | Shared world/asset/part cameras, bounds, exact selection, measurements, animations and bounded capture grids/separate images verified. Actual RTX3070 display-transform and legacy beauty defects repaired. | Camera and material evidence remain separate; corrected GPU proof retained. |
| D0 | Grouped lookup, search/categories, effective capabilities and generated references complete. Tagged camera-input diagnostics retain the same advertised schema; safe variable/radius advice added. | Updated discovery and skills exercised by the final routes. |
| R0 | Immutable source operations, file persistence and bounded reads/atomic edits pass. All three recertification routes imported once and used refs afterward. The additional authoring batch records any recovery re-imports separately. Alias CAS trial gives one success/seven conflicts. | Immutable refs adopted; aliases remain experimental pending usability justification. |
| R1/R2 | Build/cell caches, dependency/runtime/backend identities, Node workers and real MCP cancellation pass. Windows pipe-close and cancellation-order races fixed. | No OS sandbox or total native-memory guarantee. |
| P0/P1 | Runtime candidate 0d457e8f passed all 15 Windows and all 15 Linux package checks. Canonical Node paths, project-local setup, installed skills and AGY routing verified. Native ARM/Intel Mac CI jobs configured. | Mac guide is ready; actual Mac and Apple GPU execution remain unverified. |
| E0 | All 12 matched pilot attempts reconciled, including setup/budget failures. Separate fixed-model cross-harness availability investigated. | That additional comparison was unavailable with existing authenticated subscriptions; it was not run and no harness ranking is claimed. |
| E1 | Original candidates and the additional fifteen-attempt batch complete; ten new assets accepted. All 63 public examples have square GPU posters and exact source/GLB/image receipts. Requested removals remain excluded. | Prior 53 posters and ten additions visually reviewed; authorship and poster generation remain separate. |
| W0/W1 | Redesigned site, source-edit and geometry/camera demos, package-first README and install guide complete. All 63 source/GLB/poster records and 235 HTTP downloads verified. Fourteen histories expose 46 exact snapshots. | Genuine zoom, reduced-motion-on and physical mobile testing remain unverified; desktop and narrow-layout review recorded. |
| W2 | Five skills rewritten/validated with self-contained resources; packaged core skills include grouped discovery, exact refs, current project routing and direct chosen-camera PNG export. | Earlier 833b9bf1 recertifications and new 0d457e8f authoring runs used identical packaged skills. |
| X0–X3 | 30 measured geometry cases and focused acceptance fixtures retained. General bevel declined; restricted shell/remesh and implicit surface limitations explicit. | Adoption decisions complete; no universal CAD/repair/fabrication claim. |
| X4 | Ordinary reusable recipes reduce source while preserving geometry; attachments/occlusion/named-anchor trials recorded. | JavaScript functions adopted; aliases/new DSL/automatic best-view claims not adopted. |
| Q0–Q2 | Final pinned Linux gate: 1,720 passed, 2 existing skips, 0 failures; coverage 95.60% functions/92.55% lines. Both 0d457e8f platform smokes passed all 15 checks. Final expanded gallery verified. | Windows native GLib fault remains unresolved. Documentation-only archive identity stays separate from original runtime-test receipts. |

The owner authorized live dogfooding through existing subscriptions. No paid API
fallback, credit purchase, public release, commit or push occurred. The frozen
pilot, independent authoring, creative curation and supplied-source recertification
retain their separate identities. Final shared behavior and skills were exercised
on package 833b9bf1 by all three required routes after the geometry, GPU, bootstrap
and capture changes. Reports link the actual sources, PNGs, tool calls and exports.

The unmatched fixed-model cross-harness comparison below remains explicitly
unchecked because the requested authenticated routes could not support it. This
is a recorded evaluation limitation, not an unperformed experiment presented as
success. Native Mac and the listed browser/device checks are likewise not claimed; the owner has deferred them to follow-up rather than local-candidate blockers.
See the [candidate report](../evaluation/release-candidate-2026-09-05.md) for final
identities and evidence. Public release remains a separate owner decision.

## Outcome

A developer can install Kiln, connect their existing coding agent in a separate asset workspace, and ask it to create a distinctive asset. The agent can discover available operations, author custom geometry, inspect useful views, change a small part of the retained program, and export a faithful GLB without repeatedly transmitting the source or rebuilding for every camera change.

The README and website should demonstrate that workflow with attractive, reproducible examples and short, direct instructions. Treat frontier quality as an engineering and evaluation target. Publish specific capabilities and evidence; do not claim general model superiority or state-of-the-art results from a curated gallery.

## Scope and starting point

Implementation belongs in this OSS repository, including its local `render-service/`, CLI/MCP/library surfaces, skills, documentation, examples, packaging, and `site/`. The retired Studio and historical production infrastructure are outside this program. Any downstream private-engine integration is a separately tracked task, not an implicit copy into another repository.

Starting branch: `codex/program-references-and-public-copy`; starting committed base: `ef07a22`. Existing uncommitted work already includes program references, source reads, exact edits, local store persistence, clean-room workspace generation, public copy, and a broader model gallery. Preserve and reconcile that work before implementation. These are existing changes, not future tasks to implement a second time.

Current gaps established by the consultation:

- Custom Three.js geometry is already possible; its supported export boundary is narrower and underdocumented.
- Memoized primitives share mutable geometry; both `cloneGeometry` and `cloneMaterial` return their input.
- Subdivision can discard UVs; Boolean adapters discard attributes and approximate provenance.
- Capture grids already accept layouts and orbit angles, but the recent public descriptions hide that flexibility.
- GPU derivative capture loses inspect/animation framing, and new-looking unknown capture fields are silently stripped.
- Source references avoid retransmission, but separate calls still evaluate the program.
- Setup currently depends on a source checkout and absolute installation paths; the npm package contents do not yet constitute the promised portable Node/plugin distribution.

Consultation evidence is summarized within this plan so execution does not depend on private workspace history.

## Decisions that guide implementation

1. Keep JavaScript as the authored representation. Geometry helpers and callback equations live in the retained source, not in a second JSON modeling language or a growing menu of MCP tools.
2. Keep `kiln_source` read-only and bounded. Keep `kiln_edit` atomic and revision-based, with render as its normal follow-up. Maintain inline-code compatibility.
3. Keep immutable source references authoritative. Mutable aliases, if added, resolve to a concrete revision and require an expected previous revision for updates. Never introduce an ambiguous global current asset.
4. Separate source identity, evaluated build identity, exact artifact bytes, and capture identity. Application state must survive the conversation independently of transport sessions.
5. Resolve cameras once in the engine. CPU and GPU receive the same camera request; camera fidelity is separate from material fidelity.
6. New geometry modifiers return owned outputs. Intentional instancing remains efficient and explicit.
7. Preserve named parts and attributes according to documented contracts. A renderable surface, watertight solid, and application-ready asset are different properties.
8. Keep a small tool surface and one authoritative registry. Generate capability references where practical; keep legacy adapters explicit and test their differences.
9. Keep local first-use simple: packaged runtime, project-local configuration, existing harness authentication, optional GPU service, no global skill installation.
10. Keep experimental geometry separate from stable guarantees. Every advanced recommendation gets an implementation experiment and a recorded adoption decision; none disappears into an unspecified later bucket.

The current MCP HTTP specification removes protocol-level sessions. Persistent application handles remain the appropriate foundation; an MCP transport upgrade is not required to retain local programs. Preserve stdio compatibility and introduce HTTP only for an actual host requirement. [MCP transport specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http).

## Delivery order and parallel work

| Milestone | Deliverable | Dependencies |
| --- | --- | --- |
| M0 | Reconciled baseline, fixtures, versioned contracts, measured setup | Existing work |
| M1 | Safe copies, honest export diagnostics, corrected camera framing and discovery | M0 |
| M2 | Shared cameras/part selection, custom surfaces, deformation, sweep/loft | M1; camera and geometry lanes run independently |
| M3 | Attribute-rich CSG, reusable build/capture artifacts, packaged clean-room setup | Stable M1 contracts; overlaps M2 |
| M4 | Integrated model evaluation, redesigned README/site, stronger hero examples | Packaging plus relevant M2/M3 capabilities; design starts at M0 |
| M5 | SDF, bevel, shell, remesh and advanced inspection experiments resolved | Their prerequisite contracts, bounded execution and fixtures |
| M6 | Updated skills, final three-model dogfood, fixes/retests, local release candidate and evidence | Stable deliverables and explicit disposition of every experimental task |

M1 is a useful correctness checkpoint. M4 can produce a reviewable public-facing candidate while M5 proceeds, but the complete plan is not finished until every task is implemented or its experimental decision is documented. Do not advertise pending work as shipped.

Parallel ownership:

- Geometry lane: `primitives`, `ops`, profiles/solids, geometry tests.
- Camera lane: `views`, camera contracts, local renderer, camera tests.
- Runtime lane: program/artifact stores, evaluator, packaging, bootstrap tests.
- Experience lane: website, README, skills, example provenance, evaluation briefs.
- One integration owner controls registry/schema changes, shared exports and final merges. Agents propose changes to those files rather than race to edit them. Assign at most the available concurrent lanes and sequence the rest.

Each work package below is an independently reviewable change or a small dependent series. A package is done only when its behavior, catalog/docs, focused verification, and required broader gates agree.

## M0: establish a reliable baseline

### B0 — Preserve existing work and record the starting state

- [x] Inventory existing changed files and generated bundles; identify unrelated edits and leave them intact.
- [x] Run the current offline gate once, record failures/warnings, source revision and working-tree fingerprint. Prior test counts are history, not proof for a later tree.
- [x] Record one no-model install/render/source/edit/restart sequence from a fresh external directory.
- [x] Create a small shared fixture corpus for geometry, rotated part inspection, material seams, and moving assemblies.

Acceptance: a new implementer can reproduce the baseline from documented commands and distinguish existing failures from regressions. Do not automatically commit the user's uncommitted work.

### B1 — Freeze compatibility and define the new contracts

- [x] Write concise decisions for geometry ownership/attributes, exact part paths and anchors, camera coordinates, supported export features, execution limits, and identity/cache keys.
- [x] Snapshot observable legacy behavior and schemas. Choose an explicit version/discriminant for new capture/strict geometry behavior before exposing it.
- [x] Establish canonical machine-readable helper metadata and identify intentionally different legacy/in-process/MCP surfaces.

Acceptance: no unresolved disagreement about units, winding, local frames, padding, source selectors, or compatibility blocks parallel implementation. New strict objects reject unsupported fields; legacy calls keep documented semantics.

Primary files: `src/tools/registry.ts`, `src/tools/programs.ts`, `src/contracts/`, `src/composer/render-port.ts`, `src/list-primitives.ts`.

## M1: correctness and discovery

### G0 — Define and verify the custom geometry/export boundary

- [x] Publish supported positions, indices, winding, normals, UV0, tangents, materials, and named-part behavior.
- [x] Diagnose vertex colors, extra UV sets, material groups, skinning and morph data that the current bridge cannot preserve. Keep legacy warnings initially; new strict mode rejects unsupported data.
- [x] Describe each operation's ownership, topology, UV, normal, material and provenance effects.

Acceptance: a supported custom indexed mesh survives GLB round trip with the expected attributes and topology. Unsupported features identify the named mesh and affected channel. Existing valid examples still export.

Primary files: `src/render.ts`, `src/validation.ts`, `src/metrics.ts`, `src/list-primitives.ts`.

### G1 — Make copies and deformation ownership safe

- [x] Add real owned-copy helpers for geometry and material; exact names are provisional until B1.
- [x] Deprecate the misleading legacy clone helper names without silently changing their sharing behavior. Recommend native `.clone()` until the new helpers ship.
- [x] Require new modifiers to return fresh geometry. Document that copying a material does not necessarily duplicate texture resources.

Acceptance: editing one owned copy leaves the input, later identical primitive calls and siblings unchanged. Intentional instances still share data. Copied material properties vary independently according to the texture ownership contract.

Primary files: `src/primitives.ts`, related geometry/material tests. Depends on G0.

### C0 — Restore camera discovery

- [x] Describe existing capture presets, arbitrary orbit angles, cell labels and padding in the public tool definitions, author/refine skills and rendering guide.
- [x] Remove the implication that every render must return exactly six views.
- [x] Preserve omitted-capture defaults and existing `preset/cells/zoom/name` behavior.

Acceptance: existing calls and default CPU image fixtures remain stable. A clean-room pilot can discover a two-cell custom capture from the tools/reference rather than a supplied JSON answer.

### C1 — Fix camera framing loss and honest fallback

- [x] Preserve derivative frame bounds at the GPU boundary. Until transport supports them, decline that route explicitly.
- [x] Retain union-of-poses framing for animation; never auto-fit each pose when locked framing was requested.
- [x] Report camera support separately from material fidelity. An auto fallback is valid only if the fallback honors the requested projection/framing; required-GPU failure remains a failure.
- [x] Reject new unsupported camera fields. Do not infer success from the requested values echoed in a result.

Acceptance: whole-asset and isolated-part padding 1.2 versus 4 produces different resolved framing; contextual close-ups retain context; translation remains visible with a fixed animation camera. A deliberately noncompliant backend cannot receive a faithful-camera receipt. No backend silently substitutes orthographic for perspective.

Primary files: `src/tools/registry.ts`, `src/views/inspect.ts`, `src/views/index.ts`, `render-service/src/renderer.mjs`.

### D0 — Make capability discovery useful and consistent

- [x] Extend `kiln_list_primitives` with compact overview, exact-name lookup, keyword search, valid categories, signatures, constraints, preservation behavior, and minimal examples.
- [x] Report effective runtime/export/camera capabilities through the existing discovery surface rather than adding a tool for each concern.
- [x] Correct unknown-category empty results, inaccurate welding examples, claims that detail is free, and fixed world-unit attachment/decorative rules.
- [x] Generate shared references from canonical metadata; remove duplicated public tool summaries that can hide supported inputs.
- [x] Audit in-process buffer adapters against the registry and deliberately preserve or migrate differences. Do not force accidental name parity between intentionally different modes.

Acceptance: documented signatures match runtime schemas; query results are bounded and relevant; bad categories return valid alternatives. CPU/GPU costs and limitations are described accurately. Useful tests check semantics, not marketing wording.

## M2: expressive geometry and model-directed views

### G2 — Repair attribute and shading workflows

- [x] Distinguish seam-preserving welding from explicit position-only topology welding.
- [x] Add a tested UV-preserving subdivision mode or an explicit diagnostic when preservation cannot be supported; version any change to legacy defaults.
- [x] Add crease-aware normals and correct tangent invalidation/rebuild behavior.
- [x] Provide useful diagnostics for nonfinite values, invalid indices, degenerate triangles and unsuitable topology, scoped to the operation being attempted.

Acceptance: textured cube, seamed sphere, cylinder with sharp rims and open sheet retain their declared seams/shading. Normals and bounds remain valid after modification. No operation reports preservation after discarding an attribute. Depends on G0/G1.

### G3 — Add concise mesh-data and parametric-surface helpers

- [x] Validate authored positions/indices and optional supported attributes through a small mesh helper.
- [x] Sample an ordinary callback over explicit domains/subdivisions; support orientation, periodic seams and UV generation.
- [x] Provide asymmetric canopy, corrugated sheet and periodic surface examples. Distinguish an open surface from a watertight solid.

Acceptance: plane, cylinder and torus fixtures have known bounds/winding/seams; asymmetric custom geometry exports correctly; editing one parameter through a source reference changes only the intended source. Depends on G2 and the bounded execution work where advertised limits require it.

### G4 — Add bend, twist, taper and displacement

- [x] Share local frame/origin, interval and falloff conventions; document degrees and distance units explicitly.
- [x] Keep outputs independent; support authored displacement equations and seeded noise recipes.
- [x] Explain tessellation requirements rather than hiding automatic density increases.

Acceptance: identity settings, analytical point transformations, affected intervals, mirrored inputs and coordinate-frame equivalence are correct. Source geometry and unaffected vertices stay unchanged. Depends on G1/G2; reuse G3 validation where useful without coupling every modifier to surface sampling.

### G5 — Add arbitrary profile sweep and loft

- [x] Sweep noncircular profiles with stable transported frames and controlled scale/twist.
- [x] Loft corresponding sections in explicit frames with deterministic correspondence and optional caps.
- [x] Define winding, holes, open/closed paths, seams and UV progression; state which combinations are initially supported.
- [x] Diagnose difficult turns and self-intersections honestly rather than promise universal watertightness.

Acceptance: variable duct, curved rectangular rail, asymmetric hull and closed-loop sweep maintain intended section orientation, caps and UV seams. Builds are deterministic; invalid inputs identify the problem. Depends on G2 and B1 frame conventions; can proceed alongside G3/G4.

### C2 — Implement a common resolved camera contract

- [x] Accept orbit or explicit position/target/up, orthographic or perspective, asset/part/bounds framing, world/asset-local/part-local coordinates, padding and target offsets.
- [x] Resolve once to world camera parameters, near/far, aspect, dimensions, subject bounds and visibility recipe.
- [x] Extend the existing render port deliberately to carry orthographic and perspective cameras; use it in CPU and GPU paths.
- [x] Define poles, thin/empty bounds, invalid FOV, nonparallel look/up vectors, negative and nonuniform parent scales.

Acceptance: resolved camera records agree across backends for rotated roots, nested parts, scaled parents, flat sheets, tiny parts in large assemblies and top/bottom views. Material pixels need not be identical across backends. Legacy input remains supported. Depends on B1/C1.

### C3 — Share deterministic selection and structural inspection

- [x] Support exact node paths and returned identities; new ambiguous selections return candidates rather than choose the first substring.
- [x] Add named local anchors and expose part bounds, local axes, transforms and useful attachment-distance measurements.
- [x] Let each capture cell frame a different subject with context or isolation. Make inspect a single-view specialization and interior a cutaway preset of the same implementation.
- [x] Keep derivative visibility/pose changes out of the saved source and original exported asset.

Acceptance: duplicate names, missing parts, empty groups, nested transforms and mixed asset/part grids behave deterministically. Measurements identify their coordinate frame and units. Source/artifact hashes remain unchanged by inspection. Depends on C2 and G0 identity rules.

### C4 — Extend image delivery and animation controls

- [x] Support ordered grids and separate images, explicit dimensions and layouts with partial last rows.
- [x] Enforce total pixels/bytes independently of requested camera count; report delivered layout.
- [x] Expose selected animation times/count with shared cameras; default to locked framing and make follow-target behavior explicit.
- [x] Return per-cell camera, selection, projection, visibility, dimensions and fidelity metadata tied to the actual result.

Acceptance: one/two/nine views, mixed close-ups, grid/separate equivalence, payload limits, chronological sampling, locked/follow motion and image-forwarding behavior pass. Unsupported combinations fail clearly. Depends on C2/C3.

## M3: artifact reuse, portable setup and richer export

### R0 — Harden retained-program workflows

- [x] Keep bounded read/search and atomic revision edits; cover restart, branching edits, corrupt/missing references and cross-process CLI/MCP use.
- [x] Align or clearly report source-store and evaluator size limits. Add store statistics and explicit lifecycle/export guidance; do not silently evict authoritative source.
- [x] Ensure the current in-process authoring mode can use explicit revision identity without breaking legacy working-buffer callers.
- [x] Trial local human-readable aliases as an optional convenience with compare-and-swap updates; every tool response resolves to an immutable revision. Adopt only if clean-room use shows less friction without ambiguity.

Acceptance: all follow-up view/edit tools accept a reference without the full source. Failed edits leave the base unchanged. Concurrent alias updates cannot overwrite unseen work. References are content identities, not access credentials.

Primary files: `src/program-store*.ts`, `src/tools/programs.ts`, `src/agent/tools.ts`, CLI/MCP tests.

### R1 — Add reusable evaluated artifacts and capture caching

- [x] Define build identity from source revision, engine/evaluator versions, build options and all relevant deterministic dependencies. Unknown hidden dependencies disable reuse.
- [x] Store immutable artifact bytes plus manifests, never a shared mutable scene between requests. Derivatives carry parent artifact and recipe identity.
- [x] Key captures by artifact/derivative identity, canonical cameras, poses/visibility, dimensions, lighting/material settings, backend and renderer version.
- [x] Let camera-only calls reuse a compatible build, and layout-only changes reuse compatible cells. Host-owned caches have explicit byte limits and eviction.
- [x] Preserve actual camera/material fidelity with cached pixels. A degraded CPU entry cannot satisfy a material-faithful request.

Acceptance: repeated rendering avoids evaluation; camera changes cause zero new builds; edits and changed build options invalidate correctly; renderer updates invalidate captures; cache hit/miss semantics agree. Concurrent isolation/animation requests cannot contaminate each other. CPU/GPU entries remain distinct; GPU image hashes are not promised universal determinism. Depends on R0/C2/G0.

### R2 — Enforce advanced evaluation budgets

- [x] Inventory trusted local versus transport-backed evaluator behavior and expose effective limits.
- [x] Provide a terminable worker/process path for expensive synchronous custom geometry; enforce timeout, cancellation and configured resource limits at the host boundary.
- [x] Keep deterministic engine compute free of network and environment reads; seed procedural randomness explicitly.

Acceptance: a runaway loop and oversized surface can be stopped without taking down the server; later valid requests succeed. Ordinary assets remain deterministic. Do not describe a same-event-loop promise timeout as interruption or a worker as a complete security sandbox. Depends on B1; prerequisite for adopting SDF/custom execution claims.

### G6 — Preserve CSG properties and real operand provenance

- [x] Add tested GLB material-group support required for multi-material Boolean output.
- [x] Carry supported properties and real input runs through the installed Manifold adapter; replace proportional triangle allocation.
- [x] Define cut-face materials, normals and UV policy; keep explicit unwrap-after-Boolean available.
- [x] Mark generated/unknown boundaries accurately. Stable node identity does not promise stable triangle indices across edits.

Acceptance: textured union, colored cutter subtraction, nested booleans and repeated instances round-trip with the declared properties. Inspection identifies the correct operand where supported and reports unknown where not. Depends on G0/G2; can run independently of loft/deformation.

### P0 — Build and verify the actual distribution

- [x] Choose explicit Node CLI/MCP bundle entries and TypeScript library exports. Include required runtime files, WASM/dependency assets, skills and setup code in the distributable.
- [x] Verify all externalized dependencies from an actual local package tarball in an empty install; no source checkout, devDependencies, global modules or missing build steps may be required.
- [x] Retain Bun as the pinned contributor toolchain while documenting the separately tested end-user runtime range.
- [x] Provide a packaged project-init command with environment checks, clear failures and a supported relocation/repair story. Check runtime, bundles, dependencies, destination and harness before writing project files; recover cleanly from interrupted setup. Exact CLI names are chosen after checking collisions.
- [x] Audit plugin manifests, platform-specific MCP configuration and marketplace metadata against the packaged runtime. Remove stale claims such as automatic game readiness. Use the applicable plugin-creator instructions when modifying Codex plugin structure.
- [x] Keep CPU-only first render independent of model credentials; package and document the optional local GPU path.

Acceptance: local tarball install, first render, CSG, UV unwrap, image export, MCP tool discovery, source/edit/restart and optional GPU checks pass from directories with spaces/non-ASCII paths. Test Linux and Windows automatically; macOS is advertised only with actual verification. Public npm commands remain absent until publication exists and is separately authorized.

### P1 — Make each harness setup predictable

- [x] Generate project-local configuration with author/refine/QA skills as the default asset workflow and compose/batch as explicit opt-ins. Include referenced resources for every selected skill. Preserve global settings and authentication.
- [x] Add no-model configuration smoke tests for Codex, OpenCode, Hermes and Antigravity; maintain Claude compatibility without spending unavailable Claude credits.
- [x] Verify actual process cwd/store agreement, image delivery, inherited instruction behavior, and project identity per harness.
- [x] Distinguish clean task context from filesystem isolation. Add trace auditing to evaluation runs and explicit fresh-context launch instructions.

Acceptance: fresh asset directories share the intended CLI/MCP store, preserve existing files, load the requested skills, and can export without model transcription. Global configuration remains byte-identical. Missing auth/runtime/configuration produces actionable instructions. Depends on P0/R0.

## M4: evaluation, README and website redesign

### E0 — Establish a small, useful evaluation program

- [x] Freeze six briefs: variable duct, twisted ribbed pavilion, asymmetric hull, weathered cliff/overhang, textured Boolean enclosure, and articulated instrument with concealed attachments.
- [x] Include a source-local follow-up edit, a part-relative camera task and a translation animation test.
- [x] Run the bounded matched three-condition pilot: baseline; improved discovery/cameras; those improvements plus new geometry helpers. Preserve all 12 attempts, including failed setup/budget cells, without claiming a model ranking.
- [ ] Repeat one fixed task with the same exact model across two supported authenticated harnesses when available. The availability audit found no shared authorized route; this comparison remains unrun (X-D), not silently replaced with different models.
- [x] Start with a maximum 12-run pilot: two briefs, two available current models, three conditions, one attempt. Expand only cells that answer an unresolved question, with repeated attempts before model-level conclusions. This exploratory pilot does not replace the final acceptance run on all three owner-selected routes in Q1.
- [x] Use the requested current routes in the matrix below. Verify exact provider model IDs and harness versions at run time; retain both requested alias and resolved identity. Unsupported or exhausted rows are unavailable, without substitution. Older compatibility evidence remains outside this cohort. No Claude runs while credits are unavailable.
- [x] Keep live calls manual with a declared run/call/spend cap before dispatch. A quota failure is recorded, not bypassed through silent substitutions. Subscription usage is not reported as zero cost when monetary cost is unavailable.

Acceptance: retained source, actual model identity, trace, images delivered to the model, camera/material fidelity, source bytes, build/cache counts, repair calls, wall time and output hashes are recorded. Human review assesses silhouette, brief adherence and local-edit preservation. Classify model errors, discovery failures, missing images and backend failures separately. Do not use successful rendering as the visual-quality score.

No provider calls are part of CI. A full Cartesian benchmark is not required merely to fill a table.

| Harness lane | Intended model | Availability rule |
| --- | --- | --- |
| Configured Astra-capable harness | GPT-6 Astra | Required final lane; record actual configured harness and model identity |
| Antigravity (`agy`) | Current Gemini | Required final lane; verify exact current model identity and image support |
| OpenCode | Meta Muse Spark 1.3 Contributor | Required final lane; verify exact provider/model identity |

Omen and Hermes remain historical or optional compatibility coverage, not substitutes for the required lanes. Maintain Claude configuration compatibility without paid Claude runs. If any required lane is unavailable, record it as pending and continue independent work; final three-model acceptance is incomplete until that lane runs successfully.

### E1 — Build credible, varied showcase examples

- [x] Curate six to eight strong examples across multiple current models, shapes and workflows; retain good Astra examples and avoid one-model dominance.
- [x] Produce at least three new candidates that exercise the new capabilities: an asymmetric research vessel/hull, a twisting ribbed canopy, and an articulated optical instrument with a visible inspection/edit sequence.
- [x] Retain unsuccessful attempts in evaluation evidence without presenting them as hero work. Disclose human edits and starting examples.
- [x] Capture source revision, GLB hash, engine build, camera recipe and material fidelity for every displayed state; before/after views use matched cameras.

Acceptance: each selected hero is visually reviewed at useful scale, has downloadable source/GLB, correct credit and a reproducible build. Source/asset agreement is established by hashes/build records, not absolute marketing claims. Human-directed showcase work and independent clean-room evaluations are visibly distinguished.

### W0 — Design the page around an editable asset

Design direction: an asset-centered developer tool page with generous spacing, strong readable typography, restrained color, and a large model view. Let the geometry provide the visual interest. Avoid a wall of identical cards, oversized slogans or decorative effects that compete with the examples.

- [x] Replace the hero grid-first layout with one exceptional interactive asset, backed by a static poster. Pair it with a short actual edit and a before/after control using matched cameras.
- [x] Give visitors clear actions: try locally, browse examples, read the source. Lazy-load WebGL and avoid multiple active canvases on the landing page.
- [x] Follow with the concrete loop: author once, inspect selected views, edit a parameter, export. Show concise real calls and returned references.
- [x] Present a curated cross-model gallery with provenance available on each detail page.
- [x] Add subject/name search, model/harness/category and animated/static filters, and curated/recent sorting. Keep technical costs in useful secondary details rather than rank quality by triangle count.
- [x] Improve asset detail pages with the design brief, viewer, source/GLB downloads, available inspection controls and refinement history. Preserve the existing restrained dark palette and warm accent while improving hierarchy.
- [x] Add a first-run section with a harness selector and truthful tested commands; keep contributor build details in development docs.
- [x] Demonstrate part-relative inspection and custom geometry with one focused example each, then link to deeper guides.
- [x] Finish with concise capabilities/limitations and contribution paths.

Acceptance: keyboard access, visible focus, semantic controls, readable contrast, reduced motion, 200% browser zoom, touch-safe interactions, no horizontal overflow at 360/768/1440px, useful poster/error state without WebGL, and no eager download of the full GLB collection. Record loading and interaction performance on named devices; do not advertise an unmeasured universal performance claim.

Primary files: `site/src/Home.tsx`, `Gallery.tsx`, `Viewer.tsx`, `styles.css`, `types.ts`, `site/scripts/build-assets.mjs`.

### W1 — Rebuild README and guides as a coherent user path

README order:

1. One plain sentence describing the job Kiln does, plus a strong visual.
2. A verified first render with no model call.
3. Connect an agent in a separate project.
4. One compact create/read/edit/render-by-reference example with configurable capture.
5. What users can build, with custom geometry and current limitations stated plainly.
6. CLI/MCP/library entry points, contributions, license and deeper links.

- [x] Rewrite installation, rendering/cameras, geometry, source revisions, clean-room use, architecture and example guides around actual tasks.
- [x] Add authoring and extension guides for parts, frames, ownership, recipes and host integration, plus a generated tool reference. Keep one canonical camera guide and redirect obsolete links rather than maintain conflicting documents.
- [x] Keep the README skimmable and remove duplicated tool catalogs and internal release machinery from the first-run path.
- [x] Correct gallery claims that geometry is built from source in the browser when it is actually prebuilt and loaded there.
- [x] Replace the single clean-room boolean with provenance fields for source access, starting example, inherited context, human intervention and review fidelity; represent unknown honestly.
- [x] Maintain a claim-to-evidence checklist internally; publish only claims supported by the candidate.
- [x] Audit `plugin.json`, `.claude-plugin/plugin.json`, marketplace metadata, package description, page title/meta and generated `START.md` alongside README/site/skills. Every public entry point describes the same supported workflow.

Acceptance: every install command is tested on the candidate package; every illustrated API matches shipped schemas; links/downloads work; a developer unfamiliar with the engine can follow first render and first edit using only public instructions.

### W2 — Polish skills and tool definitions together

- [x] Read the skill-creator instructions when editing skills, then keep instructions short, task-specific and consistent with the registry.
- [x] Teach discovery before guessing, explicit source revisions, bounded reads, local edits, targeted camera choices, material-fidelity checks and preservation of unrelated parts.
- [x] Put complex geometry recipes in linked resources rather than expanding every always-loaded skill.
- [x] Verify that tool descriptions expose useful options without becoming tutorials or repeating every schema field.
- [x] Keep optional composition/batch skills available without loading them into every single-asset task.
- [x] After integration, update and package the final skill revisions before Q1. Refresh all evaluation workspaces from that package and record skill/resource hashes so an older copied skill cannot silently stand in for the candidate.

Acceptance: a fresh harness can discover, author, inspect and revise through the public surface; prompts do not mandate unnecessary view counts or source repetition. Relevant skills/catalog updates ship with each feature rather than wait for a final cleanup pass.

W0 visual exploration starts after B0. Final W0/W1/W2 copy and media depend on shipped capabilities and E1 evidence.

## M5: resolve advanced recommendations through bounded experiments

### X0 — Implicit surfaces / SDF

- [x] Implement an experimental wrapper around the installed Manifold level-set facility with bounds, resolution, sign convention, seeded recipes and host cancellation.
- [x] Measure blended organic shapes, cellular forms and mixed sharp/smooth boundaries at multiple resolutions.

Adopt when output is deterministic, resource behavior is bounded, surface error matches declared resolution, and model users can select useful settings without repeated resource failures. Otherwise record the limitation and a supported alternative. Depends on G3/R2. No additional geometry engine is presumed necessary.

### X1 — General bevel

- [x] Compare candidate approaches on boxes, holed plates, concave junctions and mixed curved/sharp shapes.
- [x] Evaluate selected-edge control, dimension drift, topology, attribute handling and interactive cost.

Adopt only when these properties are predictable on a declared input class. Existing rounded profiles remain the documented alternative for unsupported cases. Historical slow-bevel notes are hypotheses to retest, not proof about current algorithms.

### X2 — Shell / solidify

- [x] Prototype meaningful thickness, inward/outward direction and boundary caps for open and curved surfaces.
- [x] Diagnose concavity, thin features and self-intersections; test material/UV policy.

Adopt for a documented surface class when thickness and caps are correct and failures are actionable. Do not claim fabrication suitability merely because the surface renders.

### X3 — Remeshing

- [x] Compare approaches on deformation repair, uneven tessellation and difficult Boolean output.
- [x] Measure shape error, feature preservation, UV/material/provenance loss and resource cost.

Adopt only with a measurable downstream benefit and explicit preservation/error bounds. X1–X3 depend on G0/G2/R2 and G6 wherever material/provenance preservation is claimed. Every experiment ends with supported, experimental, or declined status and evidence; unresolved is not complete.

### X4 — Reusable parts and adaptive inspection

- [x] Build local parameterized part recipes with typed parameters and named anchors, using ordinary functions first. Trial versioned cross-program recipe references only if duplication remains a measured problem.
- [x] Trial view suggestions informed by part bounds, occlusion and review findings after explicit cameras work reliably. Preserve model control and expose why each view was selected.
- [x] Add structural visibility/attachment checks only where they can be computed honestly; keep visual preference separate from image-free structural QA.

Adopt modules or automatic views when they reduce repeated source/repair effort on matched tasks without hidden dependencies, worse framing or excessive images. Explicit source and camera workflows remain the baseline. Depends on C3/C4/R1/E0.

## M6: local release candidate and final evidence

### Q0 — Integrate and verify

- [x] Finish the post-fd3 full offline gate: ordinary pinned Linux CI command passed; focused failing tests and narrow fixes are complete. Keep the existing coverage ratchet; do not lower it to accommodate new code.
- [x] Run pinned toolchain check, typecheck, lint, tests/coverage, CLI/MCP bundle builds and distribution smokes.
- [x] Build site assets and production site. Review desktop and simulated mobile widths, automated downloads/source links, failure states and actual hero framing in a browser. Native mobile and the unexercised accessibility conditions remain separate open acceptance checks.
- [x] Run local GPU checks for camera/material fidelity; distinguish backend-math tests from observed pixels. Verify exact exported asset correspondence.
- [x] Reconcile migration notes, runtime/package support matrix, experimental statuses and model evidence. Retain intentional 0.6.0 candidate packaging; publication and final release-version selection remain owner decisions.

Current contributor commands: `bun run check:toolchain`, `bun run typecheck`, `bun run lint`, `bun run test:coverage`, `bun run build:mcp`, `bun run build:cli`, `bun run site:assets`, `bun run site:build`. Package/bootstrap distribution checks now run against the immutable tarball. Do not run retired Studio deployment gates for an OSS-only change.

### Q1 — Dogfood the integrated result, refine, and retest

- [x] Start fresh clean-room workspaces and conversations from the integrated package and updated skills for Astra, Gemini through `agy`, and Meta Muse Spark through OpenCode. Record package/build identity, exact model and harness, skill/resource hashes and supplied context.
- [x] On every route, complete the user journey: discover capabilities, author a meaningful asset, read bounded source, make a local edit by reference, choose useful asset/part views, and export the revised source and GLB. Verify actual reference-only calls, image delivery, agreement between exported source and GLB, and preservation of unrelated source rather than accepting the model's final assertion.
- [x] Include geometry/camera challenge cases across the three routes, using the same brief and criteria wherever comparative claims are made. Earlier pilot or gallery results are context only.
- [x] Triage observed friction into engine correctness, schema/discovery, skill guidance, harness/image delivery, setup, source reuse, or visual quality. Fix the responsible layer, refine the README/site examples where needed, and update affected skills and linked resources with each change.
- [x] Rebuild the package/bundles and rerun affected tasks from fresh workspaces after substantive fixes. A human repair cannot stand in for independent model success; record it and require a clean follow-up run. Keep iteration within the declared run/spend budget and record unresolved issues rather than substitute models or hide failures.
- [x] Obtain final workflow evidence on all three required routes using the final candidate. A later shared engine/tool/skill/bootstrap change that can affect all routes requires their common workflow to be rerun; route-specific changes require that route's rerun. Reuse unaffected checks where inputs have not changed; do not repeat the exploratory matrix without a new question.
- [x] Rebuild and recheck the public page/README after refinements; ensure screenshots, source links, commands and capability claims describe the same tested candidate.

Acceptance: all three required routes independently complete the workflow with truthful camera/material feedback, retained references, working exports and the final packaged skills. Blocking defects in setup, source integrity, export or camera correctness are resolved and retested. Record remaining visual limitations honestly. A quota outage leaves that lane pending; a single initial dogfood pass or stale pre-fix skill set cannot close this task. Depends on Q0, W2 and the integrated stable work.

### Q2 — Present the reviewable result

- [x] Deliver the local production preview, polished README, curated examples, concise migration notes and a report of known limitations.
- [x] Mark every task's actual state and remaining work in this plan.
- [x] Record tested runtime 0d457e8f after platform smokes and maintain the final working-tree inventory. The documentation-refreshed archive has a companion hash/equivalence receipt; its runtime components must match the tested artifact.

Publishing packages, public repository mutations, commits/pushes and deployment follow repository authorization rules after the local result is concrete. Approval of this implementation direction is not a claim that publication already occurred.

## Final local evidence and open acceptance

The pre-expansion collection contained 53 examples with matching source/GLB/poster records and square studio images. Every final neutral-light PNG was visually reviewed: [0–17](../evaluation/results/gallery-neutral-review-0-17-2026-09-05.md), [18–35](../evaluation/results/gallery-neutral-review-18-35-2026-09-05.md), [36–52](../evaluation/results/gallery-final-review-36-52-2026-09-05.md). The later authorized showcase expansion has separate [Astra reviews](../evaluation/results/astra-showcase-review-2026-09-05.md), [curation decisions](../evaluation/results/showcase-curation-2026-09-05.md) and an [atomic ledger](showcase-expansion-2026-09-05.md). Automated record/download verification and representative browser review complement the per-asset image checks. Optional carousel-angle and pinball-reflection curation remain future work.

Current runtime platform evidence and the new independent showcase batch use package `0d457e8f8763730079da013abfa6662aadc02843f090fcae594c0f711399d16c`; the earlier three recertification runs retain their actual `833b9bf14468798640447d2ba98d16d1bcedaaff8ac8752d266881e29aaabb97` identity. See the [candidate report](../evaluation/release-candidate-2026-09-05.md), [platform matrix](../evaluation/platform-matrix.md), [CLI delta](../evaluation/results/cli-diagnostic-delta-204f1a7d-2026-09-05.json) and [working-tree inventory](../evaluation/results/working-tree-inventory-2026-09-05.md).

The final pinned Linux full gate passed 1,720 tests with two existing skips and zero failures; unchanged coverage thresholds passed. The evaluation observer reservation fix is script-only. Windows native GLib failures remain retained and unresolved; the Linux pass does not claim to repair them. Runtime candidate 0d457e8f passed all 15 package checks on both platforms. See the [full gate](../evaluation/results/linux-fullgate-2026-09-05.md) and [runtime delta](../evaluation/results/runtime-delta-0d457e8f-2026-09-05.json).

The owner deferred native Mac support validation to community contributions. The following unverified checks are follow-ups, not blockers for the local candidate:

- [ ] A4: genuine 200% browser zoom.
- [ ] A5: reduced-motion preference enabled and behavior observed.
- [ ] X-A: native Apple Silicon package smoke receipt.
- [ ] X-B: native Intel Mac package smoke receipt.
- [ ] X-C: named physical mobile device review.
- [ ] X-D: same exact model across two authorized harnesses, when available.

## Definition of done

- An installed package can create an external authoring workspace and complete create, inspect, local edit, restart and export with no engine-source access needed.
- Follow-up tools accept retained references; camera-only requests reuse compatible evaluated artifacts.
- Custom geometry and new modifiers have documented ownership, attributes and export behavior.
- Cameras frame the requested asset/part in the declared coordinates; actual camera and material fidelity are reported honestly.
- Astra, Gemini through `agy`, and Meta Muse Spark through OpenCode each have final-candidate clean-room evidence for the complete workflow, including a local revision and useful view selection. Skills and documentation reflect the fixes made during dogfooding; affected workflows have been retested after those fixes.
- README/site are visually reviewed, accessible, accurate and centered on reproducible examples from several models.
- Local stable runtime/package checks pass; advanced experiments have an evidence-backed disposition. Owner-deferred platform/accessibility/comparison checks stay explicitly unverified.
- No remaining claim relies on an unsupported feature, a hidden operator repair, an unverified model label or a silent rendering fallback.

## Research basis

The plan applies the prior consultation rather than assuming all established modeling operations belong in Kiln. Procedural code, documentation retrieval and targeted inspection are useful precedents: [LL3M](https://arxiv.org/abs/2508.08228), [SimWorlds](https://arxiv.org/abs/2607.01766). Shape callbacks and explicit deformation frames also have established API precedents: [Three.js ParametricGeometry](https://threejs.org/docs/pages/ParametricGeometry.html), [Blender Simple Deform](https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/simple_deform.html). Manifold already exposes richer mesh properties and level-set generation: [mesh properties](https://manifoldcad.org/docs/html/structmanifold_1_1_mesh_g_l_p.html), [JavaScript API](https://manifoldcad.org/docs/jsuser/classes/Manifold.html).

These sources inform the proposed design. They do not prove Kiln is frontier-leading; that claim would require a clearly defined, reproducible comparison.
