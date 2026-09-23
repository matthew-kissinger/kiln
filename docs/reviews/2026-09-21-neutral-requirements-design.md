# Neutral requirements foundation

Status: bounded foundation for P01/P02/P08. Existing rendering and QA still use the category contract until their coordinated cutover. This document does not claim P09-P15 are implemented.

## Findings and decision

`AssetIntentV1` couples seven labels to mutually exclusive domain payloads. `createAssetIntentV1` supplies a house profile for architecture, subtype-specific vehicle defaults, and grounded character/vegetation defaults. The registry uses category/subtype/capability applicability, while individual evaluators also branch on category and profile. Removing just the registry discriminator would lose checks or leave the evaluator returning nothing.

The replacement is `AssetRequirementsV1`, identified by `kind: kiln.asset-requirements` and `schemaVersion: 1`. Labels are descriptive strings. Scope is a separate optional statement. Requirements are independently composable statements: each is requested, inferred, unknown, or inapplicable. Only requested statements are obligations; inferred statements are advice. Missing means unspecified, not false. No labels select requirements. Empty input creates only the frame and empty statements, never a prop or house.

Statements carry optional explanatory provenance, but provenance text is not authority. The host owns a task/lineage requirements store. Its reader is the only interface injected into generated-source tooling. Binding and replacement are host operations; replacements require the expected revision and a reason. Source revisions cannot change the store. Snapshots contain a deterministic policy hash, revision and change history; generated metadata never enters that hash implicitly. Imported snapshots are data until the host explicitly binds validated requirements.

The schema composes existing useful concepts under behavior-oriented keys: grounding, articulation, opening, navigation, tiling, mobility, structure, rig, foliage, effects, material, animation, bounds, parts, modular, and representation. It does not require an author to populate every field. Mobility can specify waterborne support without declaring wheels. Structure can request six storeys or an open roof without inheriting house dimensions. The checker migration must report unsupported measurements separately rather than adding those restrictions to this authoring contract.

Descriptive mobility/foliage/spatial subtypes and roof shape names accept free text. Concrete measurement choices such as axis, steering arrangement, interior policy and playback remain typed. An unfamiliar roof shape is valid requested data; it must receive an explicit unsupported-checker result where the current checker cannot evaluate it. This is not evidence that current architecture QA understands that shape. The current rig/effects measurement contracts retain named supported modes and a custom body-plan option; descriptive labels remain unrestricted.

Duplicated explicit meanings are validated together: grounding versus rig/foliage/support, navigation/tiling versus spatial layout, and interior entry versus access must agree. Requested portable effects cannot demand a runtime shader simultaneously, and a part cannot be both required and forbidden. Inferred advice does not contradict or weaken a requested obligation. Outdoor navigation remains valid without an enterable interior. Statements currently address one asset lineage; part-scoped or time-varying conditions need an explicit future targeting contract rather than contradictory global flags.

The validator uses the already-installed browser-safe Zod dependency, with strict objects so misspelled or retired fields fail visibly. It imports no renderer, provider, Three.js or Node modules. Normal validation never constructs an `AssetIntentV1` and never invokes a legacy converter. The old validator is used only by the explicit migration utility.

## Explicit migration

The converter accepts fully normalized, valid `AssetIntentV1` records. It preserves frame, scope, bounds, material, animation, requested/forbidden parts, all capabilities, and every domain value as explicit statements. Former labels remain descriptive labels. Custom QA profiles and category-specific behavior that cannot yet be represented completely are returned as unresolved obligations, with the original record preserved. Such a proposal cannot be activated as successfully migrated until those obligations are resolved. There is no alternate runtime branch executing old policy.

Even ordinary profiles require the QA applicability migration to be qualified before their result can claim equivalent enforcement. In particular, old category-level advisory checks, legacy name exemptions, and subtype-dependent socket/contact checks must receive an explicit new disposition. Keeping the original record in the migration report provides review evidence, not permission for normal execution to interpret it.

## Rule inventory and required migration

All 27 registered rules at the audited head are accounted for below. This count was checked directly against `DETERMINISTIC_QA_REGISTRY.list()`. Existing promotion evidence lives with each rule in its source; mode changes are out of scope for this migration. Exact rules retain their conformance evidence, heuristic rules remain observe unless independently qualified. A gate cannot treat inferred requirements as requested requirements.

| Existing rule | Current applicability / mode | New applicability and evidence prerequisite |
| --- | --- | --- |
| UNIVERSAL_SCENE_CONTENT_RULE | universal / enforce | Representation integrity; scene content |
| UNIVERSAL_FINITE_DATA_RULE | universal / enforce | Representation integrity; finite positions/transforms/animation |
| UNIVERSAL_INDEX_RULE | universal / enforce | Representation integrity; geometry index bounds |
| UNIVERSAL_ZERO_SCALE_RULE | universal / enforce | Representation integrity; transforms |
| UNIVERSAL_NODE_NAME_RULE | universal / enforce | Representation integrity; unique addressable names |
| UNIVERSAL_ANIMATION_TARGET_RULE | universal / enforce | Representation integrity; clips and target nodes |
| MATERIAL_PORTABLE_PBR_RULE | universal / enforce | Material/representation obligations plus actual exported material data; sidecar requirements remain explicit |
| ARCHITECTURE_PROFILE | architecture / enforce | Requested structure/openings/navigation; semantic surfaces, clearances, levels; remove house defaults and five-level schema ceiling |
| ARCHITECTURE_ADVISORY_PROFILE | architecture / observe | Structure observations; retain inference-only status and documented limitations |
| CHARACTER_PROFILE | character / enforce | Requested rig, clip, held-item and grounded behavior; semantic body plan and tracks |
| CHARACTER_ADVISORY_PROFILE | character / observe | Rig/body observations without inferring a mandatory biped |
| VEHICLE_PROFILE | vehicle / enforce | Requested mobility support, wheels, steering and propulsion; explicit per-obligation evidence; waterborne does not imply wheels or ground |
| VEHICLE_ADVISORY_PROFILE | vehicle / observe | Mobility observations and articulation evidence; no label-based gate |
| VEHICLE_W6_ADVISORY_PROFILE | vehicle / observe | Mobility relationships/clearance probes; preserve observation mode |
| VEGETATION_CONTACT_PROFILE | vegetation / enforce | Requested foliage placement plus grounding; semantic contacts and ownership |
| VEGETATION_ADVISORY_PROFILE | vegetation / observe | Foliage coverage/material observations; no universal trunk or ground requirement |
| PROP_CAPABILITY_EXACT_PROFILE | prop / enforce | Requested articulation/opening; semantic pivots, motion axes and clearances independent of descriptive labels |
| PROP_ADVISORY_PROFILE | prop / observe | Applicable circular assembly/scale/placement observations; absence is not a universal ground failure |
| ENVIRONMENT_EXACT_PROFILE | environment / enforce | Requested tiling/navigation/spatial socket obligations; semantic socket, edge and clearance evidence |
| ENVIRONMENT_ADVISORY_PROFILE | environment / observe | Spatial layering/seams/ground observations; explicit navigation and tiling can coexist with structure/mobility |
| VFX_EXACT_PROFILE | vfx / enforce | Requested effects portability, facing, playback and sidecar data; final-byte evidence |
| VFX_ADVISORY_PROFILE | vfx / observe | Inferred effects facing/appearance advice remains nonblocking |
| MODULAR_JOIN_PROFILE | universal / enforce | Requested modular grid and declared compatible joins; no category |
| ASSET_SCOPE_PROFILE | universal / observe | Scope statement plus observed roots/dressing; no default single-asset enforcement |
| GEO_PART_SELF_INTERSECTION | universal / observe | Engine-derived bounded intersection evidence; intentional contact and truncated analysis remain explicit |
| GEO_PART_CONNECTIVITY | universal / observe | Connectivity observations with explicit allowed separation/roles; category exemption replaced without universal connectedness |
| REF_COMPARISON | universal / observe | Present engine-derived reference comparison; no image evidence injected into structural QA |

## Integration boundaries still required

P03/P04 must attach the policy hash to render/validate/inspect/delivery and segregate only policy-dependent caches. P05/L03 must persist host provenance while refusing to promote imported claims automatically. P06/P07 remove execution categories. P09-P14 must refactor the evaluators themselves and preserve mode/promotion evidence, not synthesize fake categories around the old evaluators. P15/Q02 then prove source relabeling, omitted requirements, floating boats, open six-level structures, legitimate separation, concurrent assets and changed briefs cannot silently weaken or invent obligations.

## Foundation implementation and evidence

- `src/contracts/requirements.ts`: strict neutral schema and constructors. It is deliberately not exported through the public barrel yet.
- `src/contracts/requirements-migration.ts`: explicit proposal plus original data, field mapping and unresolved obligations; no runtime fallback or completed-migration claim.
- `src/requirements-store.ts`: host and reader capabilities, task/lineage isolation, detached snapshots, revision comparison, change history and canonical SHA-256 policy identity.
- `src/contracts/requirements.test.ts` and `src/requirements-store.test.ts`: tests first failed on absent modules, then newly added adversarial tests exposed 15 missing contradiction/hash/shape/nested-data behaviors before their implementations. The final focused plus existing contract suites pass: 71 tests, 307 assertions, zero failures. The five new TypeScript files pass Biome. Repository typecheck passed before concurrent catalog tests were introduced; the latest whole-tree invocation reports only that lane's missing in-progress modules. The final integration/release gate remains the root lane's responsibility.
