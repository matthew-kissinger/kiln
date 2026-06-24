# @kiln/engine

The **Kiln 3D engine** — a sentence in, a game-ready GLB out. A model-agnostic
Strands agent loop drives a tool surface (`list → validate → render → screenshot →
finalize`) over a primitive/CSG library, a deterministic pure-CPU rasterizer that
lets the model *see* its asset, and post-bake grading (instanceability, palette
consolidation). Plus a Bradley-Terry pairwise **arena** for ranking. A scene **composer** (a THREE-free
placement core — layout, overlap resolution, a small scene DSL — plus its own Strands
agent loop) arranges many finished assets into one coherent, overlap-free scene.

Extracted from the `pixel-forge` monorepo (`packages/core/src/kiln`) as a lean,
self-contained package: **no Playwright, no 2D image SDKs, no FBX/imposter/LOD
pipeline** — just the text-to-GLB engine Kiln Studio runs in production.

> **Private package.** Not published to npm. Consumed by the `kiln-studio` app via a
> **committed tarball** (`agent-runtime/vendor/kiln-engine.tgz`, refreshed by `sync:engine`)
> for local dev, CI, and both Docker images — NOT a path-link (`file:../kiln` hits a Windows
> `EPERM` copying native deps). See `../plan/`.

## Install

```bash
bun install
bun run typecheck   # tsc --noEmit
bun run test        # bun test (offline; live agent tests gated behind KILN_SPIKE_LIVE=1)
```

## Subpath exports

The engine ships TypeScript source (Bun/tsx transpile on the fly); consume by subpath:

| Import | What |
|---|---|
| `@kiln/engine/agent` | the Strands agent loop, model factory, tool surface, edit buffer, unified-diff |
| `@kiln/engine/render` | GLB build + serialize, `grade`/`optimize`/`snap`, `composeScene` (the core bake) |
| `@kiln/engine/palette` | canonical `OPTIMIZED_PALETTE` + directive (pure data, browser-safe) |
| `@kiln/engine/views` | the pure-CPU six-view rasterizer + `node:zlib` PNG encoder (`kiln_screenshot`) |
| `@kiln/engine/arena` | Bradley-Terry + adaptive pairwise sampling (pure math) |
| `@kiln/engine/validation` | structural validator + AST analysis (acorn) |
| `@kiln/engine/primitives` | the 70+ primitive/helper registry |
| `@kiln/engine/prompt`, `/prompt-api`, `/list-primitives` | system-prompt generation + catalog |
| `@kiln/engine/metrics`, `/inspect` | instanceability grade + scene-structure analysis |
| `@kiln/engine/composer`, `/composer/agent` | THREE-free scene-composition core (placement model, layout, overlap, DSL) + its Strands agent loop (`runKilnComposer`) |

## Dependencies

Runtime: `three`, `@gltf-transform/*`, `manifold-3d` (CSG, WASM), `three-subdivide`,
`acorn`/`acorn-walk`, `zod`, `@openrouter/ai-sdk-provider`, plus lazy-loaded `sharp`
(texture decode) and `xatlasjs` (UV atlas). The agent stack —
`@strands-agents/sdk` + `@ai-sdk/provider` — is an **optional peer**: install it only
when you use `@kiln/engine/agent`.

## Determinism

Render/rasterizer compute paths are deterministic — no `Date.now()` / `Math.random()` —
so six-view output is byte-reproducible (the basis for golden-image tests). Inject
seeds/timestamps at the boundary.

## Provenance

Initial extraction from `pixel-forge@d396c10`, file history preserved via
`git subtree split`. See `CHANGELOG.md`.
