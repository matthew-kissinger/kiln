# Discovery helper contracts implementation

Current implementation update (September 22): this report describes the initial catalog lane. The source now has 103 helpers (98 of 105 baseline entries retained, seven retired, five added) and 17 separate recipes. UV projection and geometry fixes are recorded in the [current checkpoint](../plans/2026-09-22-progress-checkpoint.md); historical counts and limitations below are not current acceptance claims.

This implements the catalog portion of D03. It does not switch any public CLI/MCP/Strands tool, choose a ranking backend, remove runtime helpers, or claim that all geometry defects are fixed.

The new typed catalog accounts for every one of the 105 existing helper names:

- **101 executable entries:** 88 operations and 13 assemblies across the existing 12 API families.
- **Four retirement records:** `cloneGeometry`, `cloneMaterial`, `panelRemapV`, and `validateAsset`. They are not returned as executable entries, aliases, or callable replacements. Migration guidance distinguishes intentional sharing from independent copies and does not invent an already shipped replacement.

An assembly is a composed node hierarchy or semantic scaffold, including rigs, vehicle frames, wheels, ladders, rooms and gable parts. Geometry factories, a shared wheel geometry set, single-part placement and mesh repetition remain operations. This describes actual return behavior rather than assigning a restrictive asset category. The classification does not claim all assemblies already have a common return shape or interchangeable attachment contract.

## Changed files

- [helper-contracts.ts](../../src/discovery/helper-contracts.ts): explicit per-name units, axes, origin, execution mode, ownership, coordinate space, parameter limits, topology, preservation, semantics, cost, limitations, retrieval language, source references and typed relationships.
- [catalog.ts](../../src/discovery/catalog.ts): validates the composed catalog and relationships once, exposes `listDiscoveryEntries()` as a defensive deep copy, and exports `DISCOVERY_HELPER_RETIREMENTS` as migration data.
- [catalog.test.ts](../../src/discovery/catalog.test.ts): completeness, retirement, schema, relationship, representative contract and real constructor checks.

The existing list-primitives/geometry-catalog records remain the single transitional source for human signatures, return descriptions and examples. Importing that data does not register the old tool. Root integration can relocate the data while removing the old public entrypoint without duplicating this catalog. Discovery schemas, old catalog data, registry, runtime functions, manifests and lockfiles were not changed by this lane.

## Facts that now remain visible to agents

Cached sandbox primitives share geometry even though direct module factories allocate separately. `copyGeometry` owns vertex buffers; `copyMaterial` owns material properties but still shares texture references. Mesh repetition is not hierarchy-preserving assembly duplication or automatic GPU batching.

Angles remain intentionally distinct where implementations differ: `revolveGeo` uses radians, `revolveProfile` and deformation frames use degrees, and wing `dihedral` is a linear tip displacement. `room` width spans Z while depth spans X; explicit gable spans use X/Z names. Capsule height is its straight middle length, so outer length adds both hemispherical radii. Position tracks are absolute parent-local values, despite the old catalog's imprecise “world units” description.

Surface operations do not become solid guarantees because a result has caps. Sweeps/lofts retain self-intersection limitations. Implicit surfaces remain experimental with explicit sampling budgets. Geometry diagnostics are counts rather than certification. UV-preserving copies, projections and atlas packing are distinct, and CSG preservation depends on explicit options. Material counts are not draw calls. `countTriangles` counts each mesh geometry once and does not multiply InstancedMesh instances.

Parameter and cost limits are labeled unqualified where the current code does not enforce them. This includes several primitive dimension checks, parametric sampling products, subdivision growth and user callback termination. Current zero-origin animation presets are described honestly pending their planned upgrade. Existing reflection/room/atlas/count fixes already present in the working tree are reflected in metadata; later behavior changes must update their contracts and tests.

`stable` means the existing supported helper surface, not a claim of completed model dogfooding or universal geometry correctness. Only the explicitly experimental implicit helper is marked experimental here. Source references identify implementation files; they are not assertions that every possible composition is qualified.

## Validation

TDD evidence: the focused test file was written first; its initial run failed because `./catalog` did not exist. After implementation, the combined schema/catalog suite passed **13 tests, 869 assertions**. These include real checks of cache sharing, copy independence, shared textures, room dimensions/floor datum, capsule extent and an uncapped sweep's boundary edges, in addition to all-name contract coverage and relation validation.

Typecheck passed after the initial implementation. A later concurrent root change temporarily introduced missing `./service` errors; those errors were outside these owned files and were reported rather than edited. Focused lint passes after formatting. Final repository gates belong to root integration and should be rerun on the integrated candidate.

## Integration limits

The complete detail catalog serializes to approximately 190 KB before compression. It is intended for bounded retrieval/detail responses, not unconditional inclusion in every model context or overview. No ranking engine or search results are implemented here.

The old signatures/examples are deliberately retained during transition and can still omit optional fields found in implementation; per-helper contract notes document relevant distinctions. Their comprehensive migration, retirement of actual sandbox functions and executable example checking remain separate tasks. The new catalog's removal of retired entries alone does not mean the old runtime API has already been removed.

No recipes, new geometry implementation, agent workflow or acceptance policy was introduced. Known source limitations remain visible rather than being hidden by optimistic contract text. The full initiative remains in progress.
