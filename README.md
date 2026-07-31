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

## External Access Boundary

Do not expose this engine package, its raw tool surface, or its composer harness directly to external
users. The approved private developer interface lives in the sibling `kiln-studio` repo:

- Studio `/v1` is the product contract for REST, SDK, and future AgentCore Gateway MCP tools.
- Studio owns `DeveloperClient` auth, scopes, quotas, audit, S3/Dynamo ownership, and artifact URLs.
- The generation AgentCore Runtime and this engine stay private execution infrastructure.
- Product-level tools may expose asset/pack/scene planning, validation, generation, composition, and
  downloads, but not raw `kiln_render`, `kiln_screenshot`, `scene_place`, `scene_render`,
  `scene_finalize`, transcripts, storage keys, or provider keys.

For current access and distribution decisions, see
`../kiln-studio/docs/launch/11-private-developer-platform-prod-handoff.md`.

## Install

```bash
bun install
bun run typecheck   # tsc --noEmit
bun run test        # bun test (offline; live agent tests gated behind KILN_SPIKE_LIVE=1)
bun run test:coverage # LCOV report plus the checked coverage ratchet
```

The reliability baseline is **95.38% functions / 91.80% lines**. CI enforces
non-regression ratchets of 92% functions and 91% lines and uploads `coverage/lcov.info`.
Threshold decreases require an explicit measured rationale.

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
| `@kiln/engine/contracts` | browser-safe asset and integration contracts, including `IntegrationManifestV1` and the semantic role vocabulary (`KILN_SEMANTIC_ROLES`, `semanticRole`, `semanticRoleMatches`, `hasSemanticRole`) |
| `@kiln/engine/composer`, `/composer/agent` | THREE-free scene-composition core (placement model, layout, overlap, DSL) + its Strands agent loop (`runKilnComposer`) |

Finished renders include `integrationManifest`, a versioned sidecar with the artifact
hash, metres/+Y-up axes, bounds, grounding offset, selected default scene, role, render
metrics, and structural QA. Consumers that only have GLB bytes can derive the same
sidecar with `inspectGlbIntegration(bytes)` from `@kiln/engine/render`; the inspection
path parses the artifact and never executes model-authored source code. Visual quality
remains explicitly `not_assessed` until a browser QA loop evaluates the asset in its
actual scene.

## Dependencies

Runtime: `three`, `@gltf-transform/*`, `manifold-3d` (CSG, WASM), `three-subdivide`,
`acorn`/`acorn-walk`, `zod`, `@openrouter/ai-sdk-provider`, plus lazy-loaded `sharp`
(texture decode) and `xatlasjs` (UV atlas). The agent stack —
`@strands-agents/sdk` + `@ai-sdk/provider` — is an **optional peer**: install it only
when you use `@kiln/engine/agent`.

### `@ai-sdk/provider` is pinned to v3 by Strands, not by us

Do not bump `@ai-sdk/provider` to v4 or `@openrouter/ai-sdk-provider` to v3. The blocker is
`@strands-agents/sdk`: every version through **1.11.1** peers `@ai-sdk/provider@^3.0.0`, and its
`VercelModel` — which every OpenRouter model here is wrapped in — is typed against
`LanguageModelV3`. A type cast does not help, because Strands emits V3 shapes at *runtime*:
`vercel.js` sends `{type: 'file', data: <bare bytes>}` where V4 expects `{type: 'data', data}`, and
`{type: 'file-data', ...}`, which does not exist in V4 at all.

`@ai-sdk/provider` v4 itself is purely additive, and our only real code change would be one string
(`'file-data'` → `'file'`) in three files — which is exactly why this looks deceptively easy. Stay on
`@openrouter/ai-sdk-provider@2.10.0` until Strands ships v4 support.

Note also that the `ai` package is an unused devDependency here; the engine imports it nowhere, so
"migrate `ai` v6 → v7" is not the task it appears to be.

## Determinism

Render/rasterizer compute paths are deterministic — no `Date.now()` / `Math.random()` —
so six-view output is byte-reproducible (the basis for golden-image tests). Inject
seeds/timestamps at the boundary.

## Provenance

Initial extraction from `pixel-forge@d396c10`, file history preserved via
`git subtree split`. See `CHANGELOG.md`.
