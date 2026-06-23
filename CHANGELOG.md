# Changelog

All notable changes to `@kiln/engine`. This is a **private** package; semver is tracked
for the consuming app's lockfile + tarball provenance, not public npm releases.

## [0.1.0] — 2026-06-23

Initial extraction of the Kiln 3D engine from `pixel-forge/packages/core/src/kiln`
(source `d396c10`), file history preserved via `git subtree split`.

### Included (the reachable runtime closure of agent/render/palette/views/arena)
- `agent/` Strands agent loop · `arena/` ranking math · `render.ts` GLB bake/grade/optimize/snap/composeScene
- `primitives.ts` · `solids.ts` (CSG) · `ops.ts` · `gears.ts` · `uv.ts`/`uv-shapes.ts` · `textures.ts`
- `validation.ts` (AST) · `inspect.ts` · `metrics.ts` · `palette.ts`/`palette-snap.ts`
- `list-primitives.ts` · `prompt.ts`/`prompt-api.ts` · `tools/registry.ts` · `views/` (CPU rasterizer + PNG)

### Removed vs pixel-forge core/kiln (what makes it lean)
- TIJ pipeline modules `imposter/`, `fbx-ingest/`, `sprite-atlas/`, `retex/`,
  `photogrammetry/`, `lod/` — the only modules pulling in Playwright + the heavier
  image path.
- Legacy single-shot `generate.ts` (Studio uses the agent path) and the entangled root
  `index.ts` barrel (Studio consumes subpaths, not the barrel).
- Dropped deps: `@anthropic-ai/*`, `@ai-sdk/{anthropic,google,openai}`, `@google/genai`,
  `openai`, `@fal-ai/client`, Vercel `ai`, `playwright`, `meshoptimizer`, `xatlas-three`,
  `@pixel-forge/shared`.

### Retained runtime deps (lazy-loaded)
- `sharp` — texture decode in `loadTexture` (`await import('sharp')`).
- `xatlasjs` — UV atlas in `autoUnwrap` (`await import('xatlasjs/dist/node/...')`).

### Tests
- 38 source test files ported. Live agent tests gated behind `KILN_SPIKE_LIVE=1`
  (off in CI). Dropped: the 6 OUT-module test suites, `deps-smoke` (old dep set), and
  `spike`/`top-level-generate` (tested the deleted barrel `generate()` wrapper).

### Follow-ups (deliberately deferred from WS0 — see ../plan/03-standards-harness.md)
- Tighten `tsconfig` (`exactOptionalPropertyTypes`); currently mirrors pixel-forge core
  for a zero-drift green typecheck.
- Add Biome lint config.
- Consider `tsup` `dist` build + Vitest golden-image render harness (engine ships TS
  source today for drop-in parity with how Studio consumes core).
- Rename the live-test gate `KILN_SPIKE_LIVE` → `KILN_LIVE`.
