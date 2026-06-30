# Changelog

All notable changes to `@kiln/engine`. This is a **private** package; semver is tracked
for the consuming app's lockfile + tarball provenance, not public npm releases.

## [Unreleased]

### Documentation
- Clarified that `@kiln/engine` remains private execution infrastructure. External developer access
  is mediated by Studio `/v1`, private SDK/skills, and future AgentCore Gateway product tools rather
  than direct engine, raw Forge, or composer harness exposure.

### Added — scene composer (`@kiln/engine/composer`, `/composer/agent`)
A THREE-free scene-composition surface: a `PlacementModel` single-source-of-truth with a
small scene DSL (`scene()`/`asset()`), terrain-agnostic hierarchy-aware layout, an overlap
validator (MTV resolution), a ground sampler, and a `SceneRenderPort`; plus the Strands
agent loop (`runKilnComposer`, 14 `scene_*` tools) isolated under `/composer/agent` so the
SDK never leaks into the pure core. Transcript compaction collapses to `serialize(model)`
past a threshold (the externalized model IS the state), with a soft step-cap backstop and a
`scene_layout`-first prompt so large many-asset scenes converge. ~990 lines of new tests.

> Studio consumes this via the committed `@kiln/engine` 0.1.0 tarball (the surface landed
> without a version bump); bump to 0.2.0 + re-`sync:engine` when a release is cut.

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
- 36 source test files ported (382 pass / 2 skip / 0 fail offline). Live agent tests
  gated behind `KILN_SPIKE_LIVE=1` (off in CI). Dropped: the 6 OUT-module test suites,
  `deps-smoke` (old dep set), `spike`/`top-level-generate` (tested the deleted barrel
  `generate()` wrapper), and `companions`/`refactor-validation` (tested the legacy
  `generate.ts` companion aliases `kiln.editCode`/`kiln.refactor`, also pruned).
- Provider SDKs (`@anthropic-ai/sdk`, `@google/genai`, `openai`, `ai`,
  `@aws-sdk/client-bedrock-runtime`) are **devDependencies only** — needed to exercise
  the multi-provider `makeKilnModel` factory in `providers.test.ts`; they never enter
  runtime `dependencies`. The kiln-glb skill-drift gate is `skipIf`-guarded (the skill
  lives outside the engine repo).

### Tooling
- **Biome 2.5.1** adopted (lint + format). Source formatted to Biome style (single
  quotes, 2-space, 100-col); `bun run lint` is green. A baseline of 19 stylistic
  warnings (`noExplicitAny`/`useTemplate`/`useOptionalChain`/`noGlobalIsFinite`/…) is
  left visible for a hardening pass; `noNonNullAssertion`/`useLiteralKeys` are off and
  `useIterableCallbackReturn` is warn (all idiomatic in the extracted code).

### Follow-ups (deliberately deferred from WS0 — see ../plan/03-standards-harness.md)
- Burn down the 19 Biome warnings + re-promote `useIterableCallbackReturn` to error.
- Tighten `tsconfig` (`exactOptionalPropertyTypes`); currently mirrors pixel-forge core
  for a zero-drift green typecheck.
- Consider `tsup` `dist` build + Vitest golden-image render harness (engine ships TS
  source today for drop-in parity with how Studio consumes core).
- Rename the live-test gate `KILN_SPIKE_LIVE` → `KILN_LIVE`.
