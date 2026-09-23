# QA migration disposition

This completes P08's inventory of the 27 registered rules, not L03's migration
activation or the domain acceptance tasks. The current execution path is
`runRequirementsSceneQa`; it never constructs an old category intent. Historical
adapters remain available for differential fixtures. No mode is promoted or
demoted by this inventory.

Authoritative implementation: `src/qa/run.ts` (historical registry),
`src/qa/requirements-applicability.ts` (new selection and coverage), and
`src/qa/requirements-run.ts` (executed kernels). The existing
`requirements-applicability.test.ts` checks every registered ID and its default
mode. Finding disposition can be less severe than its rule's maximum mode.

“Retained” below means the measurement kernel is shared. It does not claim complete
acceptance of every requirement field, perceptual correctness or identical policy
selection. “Partial” names a real gap; it is not permission to discard the rule.
All test paths in the table are relative to `src/qa/`.

| Registered rule | Mode | Historical prerequisites / evidence | Neutral behavior and disposition | Evidence |
| --- | --- | --- | --- | --- |
| UNIVERSAL_SCENE_CONTENT_RULE | enforce | Every scene; renderable content | Retained; always runs, including an empty requirements context | universal.test.ts; requirements-report.test.ts |
| UNIVERSAL_FINITE_DATA_RULE | enforce | Every scene; numeric geometry/transforms/animation | Retained; finite-data kernel is unchanged | universal.test.ts |
| UNIVERSAL_INDEX_RULE | enforce | Every scene; geometry indices and POSITION count | Retained; index validity does not depend on labels | universal.test.ts |
| UNIVERSAL_ZERO_SCALE_RULE | enforce | Every scene; output-bearing or required nodes block, organizational nodes warn | Retained; requested parts feed critical-node identity | universal.test.ts |
| UNIVERSAL_NODE_NAME_RULE | enforce | Every scene; duplicate names, required nodes and required clip targets | Retained; requested part/clip names feed the same uniqueness kernel | universal.test.ts |
| UNIVERSAL_ANIMATION_TARGET_RULE | enforce | Required clips and their actual targets | Retained; requested animation clips and rig clips are combined. Clip existence/target validity does not prove motion quality | universal.test.ts; requirements-rig.test.ts |
| MATERIAL_PORTABLE_PBR_RULE | enforce | Every scene; material/texture/geometry slots; optional precomputed-tangent capability | Retained; always runs, with requested representation.precomputedTangents. Material-intent and other representation fields are not all measured | material.test.ts; requirements-effects.test.ts |
| ARCHITECTURE_PROFILE | enforce | Architecture intent, structure fields, authored surfaces/portals and opening capability | Shared structure kernel selected only by requested structure. Exact findings retained; unsupported fields stay explicit | architecture.test.ts; requirements-structure.test.ts |
| ARCHITECTURE_ADVISORY_PROFILE | observe | Same structural evidence, heuristic roof/envelope/scale findings | Shared advisory findings retained in observe mode; descriptive labels impose no house, roof or floor default | architecture.test.ts; requirements-structure.test.ts |
| CHARACTER_PROFILE | enforce | Character profile, graph/roles, body-plan applicability, contact, clips and held items | Shared rig kernel selected by requested rig. Requested bodyPlan directly selects the graph, independently of an articulation flag. This selection change needs explicit legacy review | character.test.ts; requirements-rig.test.ts |
| CHARACTER_ADVISORY_PROFILE | observe | Rig and sampled animation evidence | Shared rig advisory kernel; only requested rig selects it | character-vehicle-corpus.test.ts; requirements-rig.test.ts |
| VEHICLE_PROFILE | enforce | Vehicle profile, wheel/axle/steering/support/propulsion semantics and +X front frame | Shared mobility kernel; only requested mobility selects it. Migration explicitly preserves frontFrame +X. Zero-wheel watercraft does not acquire grounding | vehicle.test.ts; requirements-mobility.test.ts |
| VEHICLE_ADVISORY_PROFILE | observe | Mobility evidence; non-blocking findings | Same measured mobility findings separated into the advisory rule, without promotion | vehicle.test.ts; requirements-mobility.test.ts |
| VEHICLE_W6_ADVISORY_PROFILE | observe | Mobility/support/frame evidence | Shared advisory kernel. Propulsion coverage is currently limited to rotor/propeller; nonempty animationAssemblies remain unmeasured | character-vehicle-corpus.test.ts; requirements-mobility.test.ts |
| VEGETATION_CONTACT_PROFILE | enforce | Vegetation grounding intent and authored support evidence | Shared foliage contact kernel; requested foliage.grounded and optional ground plane control contact, not labels | vegetation.test.ts; requirements-foliage.test.ts |
| VEGETATION_ADVISORY_PROFILE | observe | Growth, scope, canopy, repetition, attachments and material signals | Shared foliage advisory kernel. Growth coverage requires canopy context; unsupported fields remain incomplete | vegetation.test.ts; requirements-foliage.test.ts |
| PROP_CAPABILITY_EXACT_PROFILE | enforce | Prop articulation/openable capability; narrow container subtypes; semantic pivots, moving subtrees and clearance prisms. Explicit legacy profiles allow limited name-based exceptions | Partial shared adapter: requested articulation/opening checks explicitly declared rigid mechanisms/container markers, independent of labels. Generic requests do not require those conventions or legacy-name exceptions. Neutral openings have no inferred 8 cm minimum. Motion range, dynamic collisions and usable access remain incomplete | prop.test.ts; requirements-mechanisms.test.ts; requirements-applicability.test.ts |
| PROP_ADVISORY_PROFILE | observe | Prop bounds/grounding/placement pivot; circular assembly semantics or barrel/drum subtype | Partial: shared placement kernel measures requested bounds and grounding. Circular assembly checks and their subtype inference are not carried into neutral execution | prop.test.ts; requirements-placement.test.ts |
| ENVIRONMENT_EXACT_PROFILE | enforce | Environment sockets and explicit tile/navigation contracts | Shared spatial kernels selected by requested spatialLayout/navigation/tiling/modular. Ground/path roles no longer exempt protruding obstacles. Static bounds and authored-route limitations remain; unmeasured fields stay incomplete | environment.test.ts; requirements-spatial.test.ts |
| ENVIRONMENT_ADVISORY_PROFILE | observe | Sparse edge/nav evidence and support measurements | Shared advisory kernels. Neutral minimum width/height require explicit navigation fields; legacy conversion preserves old 0.8/1.8 m advice. Missing navigation/edge evidence adds gaps instead of certifying a pass | environment.test.ts; requirements-spatial.test.ts |
| VFX_EXACT_PROFILE | enforce | VFX representation, material, facing, clip and portability contract; actual scene and final GLB evidence | Shared effects kernels selected by requested effects; final bytes are remeasured. Sidecar declarations do not prove runtime shader behavior | breadth-corpus.test.ts; requirements-effects.test.ts |
| VFX_ADVISORY_PROFILE | observe | Derived VFX runtime-cost/appearance signals | Shared effects advisory kernel, without promoting heuristic quality into a gate | breadth-corpus.test.ts; requirements-effects.test.ts |
| MODULAR_JOIN_PROFILE | enforce | Explicit modularSet scope plus engine-derived grid/socket/join evidence; inferred scope does not activate it | Unimplemented neutral adapter. Explicit modular requirements remain incomplete. The historical analyzer samples the first reciprocal cross-piece pair; it cannot certify every join of a kit | breadth-corpus.test.ts; breadth-evidence.test.ts |
| ASSET_SCOPE_PROFILE | observe | Scope and engine-derived member/dressing signals | Shared observation kernel runs only for requested scope; nested members no longer inflate top-level membership. Measurements remain advisory and do not certify semantic scope | requirements-scope.test.ts; breadth-evidence.test.ts |
| GEO_PART_SELF_INTERSECTION | observe | Actual static solid-pair volume analysis with resource bounds | Shared engine pre-pass and observation kernel. Complete pair sets are evaluated; skipped, failed or truncated coverage stays notEvaluated with available findings. Intentional overlap does not block | self-intersection.test.ts; requirements-penetration.test.ts; [compiled CLI/MCP review](2026-09-23-neutral-volume-qa.md) |
| GEO_PART_CONNECTIVITY | observe | Rest-pose AABB connected components, 20 mm adjacency tolerance, historical foliage/decal name exemptions | Shared kernel now runs independently of labels. Findings identify separations without assuming attachment is required. Disabling this optional observation does not make structural acceptance incomplete; promoting it to enforcement still fails without evidence | part-connectivity.test.ts; requirements-geometry.test.ts |
| REF_COMPARISON | observe | Explicit reference comparison evidence, separate from image-free structural QA | Neutral reference-evidence integration remains unimplemented; reported notEvaluated. Missing reference evidence cannot imply similarity | reference-comparison.test.ts |

## Conversion consequences

The explicit converter retains the original record and proposed requirements.
Its `RULE_MIGRATION_UNQUALIFIED` entries now name the known policy differences and
unsupported obligations for each selected category, scope and modular trigger.
They require review, not automatic activation or an equivalence claim. The
[checkout disposition](2026-09-23-cutover-acceptance.md) qualifies this explicit
review/replacement path; it does not recreate every legacy assumption. In particular:

- Preserve historical requested obligations and calibrated modes. Resolve category
  and subtype assumptions explicitly, including container/circular checks, rig
  body-plan selection, and the old modularSet scope trigger.
- Handle unsupported fields separately from a kernel's availability. A rule that
  ran did not necessarily measure every field in its requirement object. Current
  `unevaluatedRequirements` is the runtime authority for those gaps.
- Required-part strings currently influence duplicate-name and zero-scale checks;
  that is not proof of semantic part presence. Forbidden extras, material intent,
  generic articulation/opening, access and other unmeasured obligations must not be
  accepted by treating existing universal checks as equivalent coverage.
- Keep data conversion, host authorization, source rebuild and artifact verification
  distinct. Old QA results and manifest claims do not establish current acceptance.

Current task dispositions are in the implementation ledger. Existing immutable
rebuilding and real old-artifact edit checks qualify explicit host replacement;
installed/platform acceptance remains separate. This inventory removes the need
to rediscover the rule set before final qualification.

An explicit replacement path now exists as `kiln migrate rebuild`. A current host
binding with migration authority selects the new policy; the receipt records the
old category rules as replaced, with `equivalenceEstablished: false`. It does not
pretend those unqualified rules were preserved. Unknown data, custom profiles,
conflicting records and unmatched build options still stop. An absent intent needs
an explicitly supplied host reconstruction, kept separate from persisted history.

An isolated copy of the real Jaeger `Coastal Proving Ground` revision was rebuilt
by compiled Node CLI, then restored, edited and saved through standalone MCP.
Its unedited rebuild has identical BIN payload and identical checked glTF sections
excluding extras: 971 nodes, 142 meshes, 252 accessors, 10 materials, 6 textures,
6 images and one animation. All original demo file hashes remain unchanged.
The supplied default-prop intent reconstruction follows the recorded QA profile;
it is an explicit qualification assumption, not proof of the full historical brief.
Evidence: external `legacy-migration-review/receipt.json` and
`legacy-migration-review/artifact-comparison.json`. This is maintainer qualification,
not an additional model authoring or installed/destination acceptance result.

The mechanism adapter has compiled Node 22.23.2 CLI and actual stdio MCP evidence
for six cases: an obstructed hinge, unrequested hinge, static declared hinge,
generic motion/opening request, 2 cm container marker and obstructed opening.
CLI and MCP agree on blocking versus incomplete versus accepted outcomes. The
first MCP host injected the binding through `createKilnMcpServer`. Receipt:
`C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/neutral-mechanisms-review-final/receipt.json`.

The standard standalone launcher now accepts the same explicit `--requirements`
file as the CLI, validated before startup and fixed for the session. All six cases
were also verified through this ordinary entry point, with no custom MCP host:
`C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/neutral-mechanisms-standalone/receipt.json`.
`src/__tests__/mcp-requirements.test.ts` covers session policy retention, source
policy spoofing and invalid startup input. These are checkout checks, not live
agent or installed-package qualification.

The shared kernel also fixes a reproduced identity bug: a typed slider clearance
could satisfy a hinge with the same local id. Typed markers now match their exact
kind/id; untyped markers require an unambiguous id. Existing `prop.*` semantic
roles are portable data vocabulary, not runtime category selectors. No role alias
or name-based fallback was introduced. The historical adapter retains its explicit
profile exceptions and calibrated minimum for differential fixtures only.

This does not qualify physical motion or containment. The retained AABB clearance
test has a 4 mm tolerance, excludes declared stationary support, and the opening
test excludes shell/lid/moving roles. Container marker selection does not prove
all openings or occupied interior volume. Generic requested articulation/opening
therefore remains incomplete even when these static checks find no defect.

Connectivity integration has actual compiled Node CLI/MCP report equality for a
detached cluster, connected chain, 15 mm separation and the second coliseum baseline.
The 15 mm separation intentionally remains below the historical tolerance; this
does not repair the campaign's smaller wrist/handle gaps. The coliseum produces
two advisory groups without rejection. Evidence is in external
`neutral-connectivity-review/receipt.json`. Box overlap is not surface contact,
volume intersection, motion clearance or proof of support. The later
[part-volume integration](2026-09-23-neutral-volume-qa.md) supplies its own bounded
measurement and incomplete-coverage status. Reference integration remains open.

## Navigation relabeling and size defaults, September 22 follow-up

Two concrete defects were reproduced and repaired (F212/F213): a solid obstruction
tagged `environment.ground`, `environment.surface`, `environment.path.surface` or
`environment.bridge.deck` was excluded from navigation checks; an unobstructed
miniature route received human-sized width/headroom advice without a request.

Obstacle selection now includes all renderable parts except the corridor marker
itself. Existing penetration tolerance allows a support surface below the route
to touch its boundary, while a protruding plinth is reported. Source role edits
can no longer bypass that check. Requested navigation has optional positive
`minWidth`/`minHeight` fields; unspecified/inferred values impose nothing. Finding
modes are unchanged. The legacy conformance adapter supplies its historical
defaults explicitly, and explicit conversion includes them in its review proposal.

Five actual compiled Node 22.23.2 CLI and standalone MCP cases agree: miniature,
miniature with explicit dimensions, protruding ground-tagged plinth, supporting
floor below the route, and unrequested navigation. The split MCP SDK 2.0.0 client
was used. The original frozen build accepts the protruding plinth and adds two
unrequested size warnings to the miniature; the new build blocks the plinth and
omits those warnings. External receipt:
`C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/navigation-review-final/receipt.json`.

Runtime: `sha256:d81c53fe633053c28868bc55809c5b18758792bc82143d96f7c57666ee7089f6`.
Focused tests: 84 pass. Typecheck, lint and skills pass; full suite: 2579 pass,
4 existing skips, 0 failures, 62,272 assertions in 160.71 seconds.
Coverage gate passes at 95.08% functions / 92.29% lines with unchanged thresholds
(coverage run 170.31 seconds, same test outcomes).

This does not repair the original coliseum or prove every entrance is clear.
Corridor placement still comes from authored markers; obstacle OBBs can overstate
concave or hollow geometry, and the 4 mm tolerance is retained. Mesh-level
clearance, functional route coverage, continuous motion and fresh-model benefit
remain open under P12 and Q02. The P15 integration checks are qualified below.

## Requirements isolation, saved provenance and changed briefs

Actual compiled Node 22.23.2 CLI and independent standalone MCP sessions now
exercise the P15 attacks against shared persistent source, build-cache and asset
stores on runtime `d81c53fe...7089f6`:

- The same blocked-route source and program reference is accepted for a display
  asset and rejected for a walkable asset, including concurrent requests after
  warming the shared cache with the accepted result. Four cache entries are
  present; a successful result cannot replace another session's applicable QA.
- Authored `meta.category` and `meta.requirements` claims cannot weaken the host
  binding. Ground-tagged obstructions remain obstacles under requested navigation.
- Omitting the current binding or supplying a foreign lineage rejects saved-asset
  restore and revision. Both the CLI and MCP reject an omitted-binding restore.
- Editing the binding file does not change a live MCP session. Starting a new
  session with an explicit, contiguous changed-brief history applies revision 2,
  permits the newly requested display behavior and saves an immutable child.
  The old session cannot restore that newer policy revision.
- A synthetic historical manifest is rejected by ordinary CLI/MCP restore and
  remains byte-for-byte unchanged. Real legacy rebuild and explicit policy
  replacement remain covered by the separate `legacy-migration-review` evidence.

A second fresh MCP process then restores the saved child, applies a material edit,
renders and saves. The CLI restores that revision, edits and saves another child.
Both preserve the complete requirement/history receipt and parent chain, and the
original record remains unchanged. Source-only CLI editing still performs no QA;
policy is applied when rendering or saving the asset.

Evidence: external `policy-isolation-review/receipt.json` and
`policy-isolation-review/restart-edit-receipt.json`, with every request result,
CLI output, binding, source and immutable asset retained. Reproduction drivers:
`review-policy-isolation.ts` and `review-policy-restart-edit.ts` in the campaign
root. No runtime code changed, so no unaffected full-suite rerun was needed.

P05 persistence and P15 adversarial integration acceptance are implemented for
the checkout. This is not an OS security boundary, automatic legacy-policy
equivalence, complete navigation geometry, live Strands acceptance or an installed
package qualification. P04 has stronger policy-isolation evidence; independent
render/cache reuse obligations remain separately scoped.


## Placement accuracy and equivalent-policy cache reuse

F215 corrects two reproduced placement-QA errors: a rotated triangle's height was
reported as 1.414214 m instead of 0.707107 m, while the empty corner of a different
rotated triangle's box concealed its actual 0.707107 m grounding gap. Placement
now measures transformed base vertices, including instance transforms, in the
existing asset-local frame. Conservative mechanism/clearance boxes and advisory
tolerances are unchanged. Two focused tests failed before the fix; 28 related
tests pass afterward. Compiled Node 22 CLI and standalone MCP agree with independent
GLB vertex measurements, and old/new exported GLBs are byte-identical.

P04 now also has eight actual CLI/MCP requests proving reuse across distinct task
lineages and descriptive labels with equivalent policy. Each returned receipt
contains its current host binding. Changed bounds policy creates a separate build
and the appropriate finding; returning to the old policy reuses its correct result.
CLI can reuse the MCP-built entries. All PNGs and GLBs match for unchanged geometry.
Capture-cache hit counts were not instrumented. Together with the preceding
concurrent isolation checks, P04 is implemented for the checkout.

Receipts: external `placement-bounds-review/receipt.json` and
`policy-cache-reuse-review/receipt.json`. Runtime `sha256:1981085ea5c544f0396014f64de26dad011065b7f8d1484eae30df190708ca57`.
Full coverage gate: **2583 pass, 4 skip, 0 fail**, 62,279 assertions in 187.08 s;
95.08% functions / 92.29% lines, thresholds unchanged. Typecheck, lint and skills
pass. These are base-geometry measurements, not deformation/alpha-aware occupied
space, physical support, model brief compliance or installed-package certification.
Main19's height regression remains unrepaired; this fixes a separate tool defect.


## Bounded surface search repair

F216 addresses a real main20 tool limitation: small rail straps exhausted 250,000
triangle-pair visits before completing. A deterministic balanced bounds hierarchy
now visits nearer groups first and prunes groups that cannot improve the minimum.
The input cap remains 20,000 triangles per subject; the unchanged 250,000 search
work cap now includes group expansion as well as individual pair checks. No
acceptance threshold or tool input schema changed. Unresolved work still returns
null distance and explicit bounds. An adversarial overlapping-box fixture proves
that it cannot claim completion merely because it found a plausible closest pair.

Two regressions failed before repair. Eleven focused tests now pass, including
exhaustive comparisons, reordered geometry and reflected transforms. All 44
original saved-GLB interface checks complete. The eight previously incomplete
measurements need 563–1,921 individual pair visits and agree with exhaustive
old-kernel chunks plus actual compiled Node22 CLI and standalone MCP (16 requests).
Original triangle witnesses are checked against the unchanged exported geometry.
Their distances are approximately 0.006–0.027 mm; these small positive values
are retained rather than rounded into invented contact. Original sources and GLBs
remain unchanged; this is maintainer qualification, not fresh-model use.

Receipt: external `surface-search-review/receipt.json`; reproduction driver
`review-surface-search.ts`. Runtime `sha256:9a67f95baa6c439104ddbefcbdb3eb161d261c2a2c9f8a6d6776e267519f3b21`.
Full gate: 2586 pass / 4 skip / 0 fail, 62,297 assertions in 187.55 s; coverage 95.09% functions / 92.29% lines. Typecheck, lint, skills and diff checks pass.
This improves measurement efficiency, not physical attachment, containment or
continuous-motion certification. No renderer or material behavior changed.


## Exported revision comparison for preservation review

F192/F211/F217 exposed a missing author-facing check: text diffs and requested
numbers did not reveal protected geometry changes. Shared `kiln_inspect` now
accepts `compare.programRef` and evaluates both sources under current host settings.
It compares exact exported static geometry/attributes, material resources including
texture bytes, local/world transforms and referenced-vertex bounds. Stable named
hierarchy paths match nodes; renamed/reparented nodes are additions/removals.
Changed entries paginate, while the summary covers the complete comparison.
Ambiguous names, skins, morphs, instancing and unsupported structural extensions
fail explicitly. Bounded input/work avoids silently dropping complex structures.
Material comparison uses the exported glTF graph, not the geometry-flat adapter.
The refinement skill and generated tool docs explain the operation and its limits.
The first full gate caught split render-evidence history and a schema-budget
overrun. One shared context restores history; shorter redundant descriptions
keep the existing 31 KiB limit. Neither acceptance check was weakened.

Seven focused checks pass after the initial failures, including separate geometry,
material and texture changes, reordered siblings, renamed nodes, pagination,
parent transforms, unused accessor outliers, exact shot inspection, shared-store
reuse and missing-reference errors. Eight actual compiled Node22 CLI/standalone
MCP requests agree with four original-GLB comparisons. Main19's height increase
is 11.110723 mm; main21's first edit changes only shaft/thread geometry, while
the final replacement preserves retained geometry/materials/transforms. Prior
independent reviewer scripts remain the external control. Original sources,
exports and trial results are unchanged; this does not repair authored failures
or add a campaign authoring. Fresh model use remains open.

Receipt: external `revision-comparison-final-review/receipt.json`; driver
`review-revision-comparison.ts`. Runtime: `sha256:ee40012452474b281c097db368dcd518a14a3382308598d38b436359fb190455`.
Full gate: 2592 pass / 4 skip / 0 fail, 62,338 assertions in 187.34 s; coverage 95.09% functions / 92.32% lines. Typecheck, lint (677 files), skills and diff checks pass.
Renderer code is unchanged; CPU inspection images establish no material appearance.


## Product learning from main22: intended joints and clearances

The trike repairs are supporting evidence, not the product outcome. F218 exposed
a narrow wheel contract: centerline identity was rejected, forcing a false left
label. The public type, guard and semantic resolver now accept center; explicit
left/right layouts retain behavior. The caster example and Discovery contract
explain that wheel side does not prescribe fork arms or automatic placement.

F219 and repeated F198 are authoring/review failures, not evidence that beam
geometry ignored its endpoints or the GPU misplaced parts. Guidance now derives
joints from shared local points, checks both intended neighbors, separates required
contacts from required gaps, and samples inside geometric repeats. Corrected
snapTo wording no longer calls bounding-box alignment an attachment cure. An
optional joined-frame recipe demonstrates prevention without a new primitive,
asset category or automatic repair.

Actual compiled CLI/MCP runs on a separate frame preserve baseline/resized joints
and positive deck clearance. A deliberately bad brace end remains graph-connected
but measures 86.317 mm from its intended post; both transports agree exactly.
This demonstrates the limit of connectivity, not a fabricated new QA guarantee.
Centered caster export also succeeds through both interfaces; rotated dimensional
recipe edits and centered animation pass both exporters in focused checks.
Receipt: external `attachment-learning-review/receipt.json`; runtime
`sha256:48daaad36c8d9eb79c3e4a617d236f8a08510b2815c5f66f4b78f686bee3d7d1`. Final gate: 2595 pass / 4 skip / 0 fail; 95.09% functions / 92.32% lines.
The first gate caught a hash-pinned fixture edit; original fixture bytes were
restored and supplemental centerline coverage moved to a separate file. No
conformance authorization was regenerated or acceptance weakened.

Still open: fresh-model transfer without explicit repair instructions, intended
interface selection on complex geometry, continuous motion/contact and physical
fit. A universal connectedness or two-sided-fork rule would reject legitimate
assets; no such rule was added.
