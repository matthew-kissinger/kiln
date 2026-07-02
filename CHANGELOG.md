# Changelog

All notable changes to `@kiln/engine`. This is a **private** package; semver is tracked
for the consuming app's lockfile + tarball provenance, not public npm releases.

## [Unreleased]

## [0.3.0] — 2026-07-02

### Added
- **Generation-loop transcript compaction (default on).** Before every model call,
  `runKilnAgent` now strips the image out of each SUPERSEDED render tool result
  (kiln_render / kiln_screenshot / kiln_view_interior / animation strips), swapping it for
  a short text placeholder — only the newest render image rides each request. The prune is
  surgical, unlike the composer's whole-transcript collapse: no messages are added or
  removed, toolUseIds are untouched (tool-use/tool-result pairing stays valid on every
  provider), and the JSON metrics half of each result survives. This was the biggest
  input-token/cost lever in a multi-render run — previously every render image rode ALL
  later model calls. Opt out per run with `imageCompaction: 'off'`. New helpers exported
  from `agent`: `pruneStaleRenderImages`, `installRenderImageCompaction`,
  `STALE_RENDER_PLACEHOLDER`.
- **M1b grade-aware refine loop (plan/05 §3.2, default on).** After the model finalizes,
  the run bakes + grades the program exactly as the shipped artifact will be graded
  (grade-aware `auto` consolidation, matching `generateKilnAsset` and the Studio web-tier
  re-bake). If it still grades below B for a consolidation-fixable reason — material
  sprawl (>3 distinct) or texture sprawl (>4), never a transparency-only demotion (glass
  caps at C by design) — and the step budget leaves headroom, ONE bounded feedback turn
  (grade, material count, offending material list, consolidation directive) is fed back;
  the refined program is kept only if its grade actually improves. Opt out with
  `gradeRefine: 'off'`. Emits a `grade_refine` progress event; token usage now accumulates
  across the extra invoke. New helpers exported from `agent`: `assessProgramGrade`,
  `shouldGradeRefine`, `buildGradeRefineMessage`, `gradeRank`.

### Fixed
- **Step-cap abort no longer discards a rendered program.** A run halted by the model-call
  cap used to return only an error, throwing away the working-buffer program the sink
  already held. If the captured program renders, the run now returns it with the new
  `RunKilnAgentResult.capped: true` flag (mirrors the composer's `capped` semantics); a
  cap with nothing renderable is still an `error`.

## [0.2.0] — 2026-07-02

The release cut the 0.1.1 composer note promised: formally versions the scene composer
surface (`@kiln/engine/composer`, `/composer/agent` — shipped in 0.1.x without a bump)
plus the fixes below.

### Fixed
- **`auto` consolidation now fires on 4-material assets.** `PALETTE_MIN` dropped 5 → 4,
  aligning the trigger with the instanceability rubric (grade B tops out at 3 materials,
  so 4 is the first grade-C count). Previously a 4-material asset graded C and `auto`
  never consolidated it.
- **Uint32 indices for >65,535-vertex geometry.** `bridgeGeometry` always wrote
  `Uint16Array` indices, silently wrapping values past 65,535 (corrupt GLB). It now
  selects `Uint32Array` when the vertex count exceeds the Uint16 ceiling; the GLB
  writer emits the matching `componentType` (5125).
- **BYOK `apiKey` reaches Anthropic/OpenAI.** `makeKilnModel` dropped `opts.apiKey` on
  the `anthropic` and `openai` branches (only google/openrouter passed it through), so
  BYOK silently fell back to the provider env vars.

### Changed
- Comments in `agent/tools.ts` / `agent/run.ts` updated: the `unified` tool surface is
  the production surface (Kiln Studio runs `KILN_TOOL_SURFACE=unified`), no longer
  "flag-gated until a bench A/B clears it"; `current` remains the library default.

### Housekeeping
- Added the missing `LICENSE` file (MIT, already declared in `package.json`).
- Rewrote the stale `@pixel-forge/core` module headers (`metrics.ts`, `agent/index.ts`,
  `agent/run.ts`, `palette.ts`) to the `@kiln/engine` reality and removed dangling
  references to files that do not exist in this repo.

## [0.1.1] — 2026-06-30

### Documentation
- Clarified that `@kiln/engine` remains private execution infrastructure. External developer access
  is mediated by Studio `/v1`, private SDK/skills, and future AgentCore Gateway product tools rather
  than direct engine, raw Forge, or composer harness exposure.

### Changed
- Treat native `claude-sonnet-5` as adaptive-only for Anthropic thinking controls: numeric
  `KILN_THINKING` budgets are ignored for this model so the agent harness does not send
  manual extended-thinking params that Sonnet 5 rejects.

### Added — scene composer (`@kiln/engine/composer`, `/composer/agent`)
A THREE-free scene-composition surface: a `PlacementModel` single-source-of-truth with a
small scene DSL (`scene()`/`asset()`), terrain-agnostic hierarchy-aware layout, an overlap
validator (MTV resolution), a ground sampler, and a `SceneRenderPort`; plus the Strands
agent loop (`runKilnComposer`, 14 `scene_*` tools) isolated under `/composer/agent` so the
SDK never leaks into the pure core. Transcript compaction collapses to `serialize(model)`
past a threshold (the externalized model IS the state), with a soft step-cap backstop and a
`scene_layout`-first prompt so large many-asset scenes converge. ~990 lines of new tests.

> The surface landed without a version bump (Studio consumed it via the committed
> `@kiln/engine` 0.1.0 tarball); formally versioned by the 0.2.0 release above.

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
