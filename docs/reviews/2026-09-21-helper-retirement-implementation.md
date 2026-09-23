# Explicit authoring-helper retirement

Date: 2026-09-21. Scope: L04 and the related helper replacements, G15/G16. This is a bounded implementation receipt; the main task owns integration gates and release acceptance.

## Result and consumer audit

The library exports and authoring sandbox no longer expose `cloneGeometry`, `cloneMaterial`, `panelRemapV`, or `validateAsset`. No callable compatibility aliases or throwing stub functions remain. The shared `REMOVED_AUTHORING_HELPERS` record contains migration text only. Source validation emits a `REMOVED_HELPER` error with that guidance for recognized unbound uses, including a retired identifier captured into a local alias. Intentional user-defined functions and ordinary object property names remain legal.

The two clone helpers were identity functions. Their production implementations had no internal dependency that required retaining them; their direct consumers were tests. Those tests now verify direct sharing and independent copies separately. Replacing all old clone calls with `copyGeometry` or `copyMaterial` would change sharing and potentially exported deduplication, so that is explicitly not the migration rule. `copyMaterial` keeps texture references shared while copying material properties.

`panelRemapV` was a narrow affine UV transform with a V default of `0.3`, an inconsistent description of its defaults, and a raw buffer loop that did not support interleaved UV attributes. Missing UVs silently returned a clone. The only current authored example consumer was `examples/well.kiln.js`, with two calls. Both now pass the same explicit U/V scaling to `remapUV`; dimensions and intended mapping are unchanged.

`validateAsset` always returned `valid: true` with no errors, selected a material threshold by category, and described distinct material count as draw calls. No current production consumer required that result shape. Its replacement is explicitly an advisory, with no category default or validity claim.

Current source searches retain the old names only for migration metadata, removed-name regression tests, or unrelated longer identifiers such as `validateAssetGlb` and `validateAssetRequirementsV1`. Historical audit and benchmark receipts remain historical evidence. The main task integrated the Discovery retirement list, exact-ID rejection guidance, new helper contracts and prompt orientation separately.

## Replacement contracts

`remapUV(geometry, { scale?: [u, v], offset?: [u, v] })` returns an owned geometry clone. Defaults are scale `[1, 1]`, offset `[0, 0]`; each UV is scaled then offset. Existing UV0 must contain two finite components per position. It reads logical values from ordinary, normalized or interleaved attributes and writes independent Float32 UVs. Invalid options, missing/mismatched UVs, nonfinite values and Float32 overflow fail explicitly. Negative scale mirrors an axis.

Topology, material groups and other attributes survive the geometry clone. Any nonidentity scale removes existing tangents and records `UV_REMAP_TANGENTS_DROPPED`; pure offsets preserve them. This helper does not project, unwrap, construct an atlas, or repair overlap. Old omitted defaults must be supplied explicitly: `panelRemapV(geo)` becomes `remapUV(geo, { scale: [1, 0.3], offset: [0, 0] })`.

`materialBudgetAdvisory(root, { maxMaterials?: number })` returns `{ materialCount, maxMaterials, exceeded, warnings }`. It counts distinct material object identities. A supplied budget must be a nonnegative safe integer; an explicit null or unknown category option is rejected. Without a budget, `maxMaterials` and `exceeded` are null and there are no warnings. There is no `valid`, `errors`, or `drawCalls` field. The historical category thresholds are documented only for deliberate migration, not retained as defaults or recommended budgets.

## TDD and checks

Initial command, before removing globals or implementing replacements:

```text
bun test --timeout 20000 src/__tests__/retired-helpers.test.ts
2 pass, 6 fail, 11 assertions
```

The failures reproduced old globals still being callable, source validation accepting removed helper calls, and missing replacement functions. After implementation the same test file passed all eight tests. A further explicit-null budget probe failed as intended: seven tests passed and one failed because null had silently become an omitted budget. The guard was corrected and the probe passed.

Final focused command:

```text
bun test --timeout 20000 src/__tests__/retired-helpers.test.ts src/__tests__/primitives.test.ts src/__tests__/geometry-authoring.test.ts src/__tests__/uv-shapes.test.ts src/__tests__/instancing.test.ts src/__tests__/validation-hardened.test.ts
149 pass, 0 fail, 2156 assertions
```

These cover absent globals and direct exports, migration diagnostics, legal local definitions, source sharing versus copied buffers/materials, shared textures, GLB deduplication/instancing, explicit UV formulas, normalized interleaved UVs, tangent handling, finite limits, honest advisory fields and existing validation behavior. Biome checks pass on the eight changed TypeScript implementation/test files.

`bun run typecheck` at this checkpoint reported no errors in this lane. It remained blocked by concurrent changes at `build-cache-requirements.test.ts:12,22` (three arguments where one or two were accepted) and `workspace-render-service-notice.test.ts:82` (literal version type mismatch). These were reported to the main task; this receipt does not claim the repository-wide gate passed.

The actual source CLI rendered the migrated well in a new temporary working directory, with CPU mode, build cache disabled and its program store isolated there:

```text
bun C:/Users/Mattm/X/kiln-oss/src/cli.ts render C:/Users/Mattm/X/kiln-oss/examples/well.kiln.js --render cpu --out <isolated-temp>/well.glb
exit 0; 2680 triangles; 254.7 KiB; bounds 1.84 x 2.45 x 1.90 m
```

The local artifact is `C:/Users/Mattm/AppData/Local/Temp/kiln-helper-migration-94ce48c745ca408da91a3af94c55aee6/well.glb`. This proves the migrated example builds through the CLI; it is not a new GPU, visual-quality, consumer-import, or cross-platform acceptance claim.

## Boundaries and remaining integration

The source migration diagnostic reuses the existing conservative declaration analysis. It treats declarations anywhere in the program as potentially in scope, so it deliberately misses some complex unbound references rather than rejecting valid locally defined helpers. It is not a lexical-scope proof or a source rewriter. Execution without source validation still has no retired global and follows the existing unbound-variable diagnostic path. No evaluator, render or QA policy was changed in this lane.

Documentation changes are limited to geometry/extension guidance and explicit source migrations. Existing programs and user workspaces were not rewritten. Shared animation changes in `primitives.ts` were preserved. No providers, live renderer process changes, commits, pushes or releases were invoked. Rebuilding all runtime entries, regenerating catalog/prompt artifacts, full offline gates and packaged dogfooding remain owned by the main task.
