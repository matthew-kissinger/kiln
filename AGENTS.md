# Kiln Engine Agent Guide

## Scope

This repository turns model-authored source into GLB assets. It includes deterministic rendering,
validation/QA, primitives, the agent tool surface, arena ranking, scene composition, a CLI, and an
Agent Plugin (MCP server + skills).

Read [README.md](./README.md) before changing exports or package contents. Runtime code is under
`src/`; tests are colocated as `*.test.ts` or under `__tests__/`. Repository-only checks live under
`scripts/`. The package intentionally ships TypeScript source through the explicit `files` and
`exports` lists in `package.json`.

## The tool registry is the single source of truth

`src/tools/registry.ts` owns tool names, descriptions, and schemas. Two skins consume it: the
in-process Strands tools (`src/agent/tools.ts`) and the stdio MCP server. **Both must iterate the
registry** -- never hand-write a tool definition in a skin, or the transports drift apart and the
repo's central claim stops being true. There is a test that asserts name parity; keep it passing.

Prefer an explicit terminal submit tool over `structuredOutputSchema` in the in-process loop: the
latter's coexistence with a full tool set is provider-dependent, while a submit tool is unambiguous
everywhere. The MCP surface has no submit tool, because there the host agent writes the file itself.

## Host-injected render and cache boundaries

The engine defines the host-injected `PbrRenderPort`. Exported `captureViewsViaPort` is the **single
owner** of the deadline, renderer/PNG validation, grid composition, and never-throw CPU fallback. Do
not duplicate that degrade policy in a host or introduce network/service knowledge into the
deterministic engine paths.

The port is injected twice, for different jobs, and their deadlines must stay separate. A host calls
it once after the loop for the artifact sheet, where nothing is blocked and a long deadline is
correct. `KilnToolContext.viewRenderPort` injects it into `kiln_render` for the IN-LOOP grid, where a
slow render blocks the agent mid-thought -- that deadline is its own per-call argument and belongs far
lower. Never collapse the two onto one value.

Routing is conditional on `sceneNeedsPbrShading(root)`: bound texture or `metalness > 0`, never
material type, because `gameMaterial` and `pbrMaterial` both construct a `MeshStandardMaterial` and
are indistinguishable after construction. Host telemetry rides `onViewsRendered`, while every unified
`kiln_render` result also carries model-visible `ViewFidelityV1`; a geometry-flat CPU image must never
be treated as material evidence. Keep the input schema stable unless the active change explicitly
versions it -- the tool definition is cached, and changing it invalidates that cache.

**The GPU is a view producer only, never gate evidence.** `QaContext` is deliberately image-free so a
QA rule structurally cannot read a render buffer. Do not add pixels to it.

`src/views/renderer-id.ts` runs `readFileSync` at MODULE LOAD. Reach `CPU_RASTER_RENDERER_ID` through
the lazy `await import('../views')` that render paths already use; a static import puts a `node:fs`
edge, evaluated at import time, into a graph deliberately kept free of node-only dependencies. No test
catches this.

Prompt-cache transports are deliberately different. Native Anthropic and Bedrock adapters consume a
system `[TextBlock, CachePointBlock]`; OpenRouter-hosted Anthropic keeps plain system text and receives
top-level `cache_control: { type: 'ephemeral' }` because its Vercel bridge drops cache-point blocks.
Preserve that distinction and the provider usage fields when changing model routing.

## Toolchain and validation

Supported toolchain: Bun `1.3.14`; Node `22.23.1`; npm `12.0.1`. Do not use a Bun canary or implicit
latest for a release gate.

```bash
bun install --frozen-lockfile
bun run check:toolchain
bun run typecheck
bun run lint
bun run test
bun run test:coverage
```

Fast change loop: run the nearest test file first, then `bun run typecheck && bun run lint && bun run
test`. Full offline gate: also run `bun run test:coverage`; it emits text plus `coverage/lcov.info`
and enforces the checked-in line/function ratchet in `bunfig.toml`. Raise thresholds when practical;
do not lower them without an explicit measured rationale. Live model tests are opt-in only via
`bun run test:live` and may spend money.

Tests and CI pin `KILN_RENDER=cpu`. The coverage ratchet must not vary by whether the runner has a
GPU.

Use strict test-driven development for behavior changes: add a focused failing test, observe the
expected failure, implement the smallest fix, and rerun both the focused and full gates. Preserve
determinism and do not add `Date.now()` or `Math.random()` to render/rasterizer compute paths.

## Safety

- Never print, read unnecessarily, or commit provider keys, cloud credentials, `.env*`, or secrets.
- Keep normal validation offline. Do not invoke live providers unless explicitly requested.
- Do not commit, push, force-push, create remotes/releases, or publish packages without explicit user
  approval.
- Live model and arena runs spend money. Keep them manual and out of CI.
