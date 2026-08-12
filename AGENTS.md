# Kiln Engine Agent Guide

## Scope

This repository is the private `@kiln/engine` source of truth. It turns model-authored TypeScript into
GLB assets and includes deterministic rendering, validation/QA, primitives, agent tools, arena
ranking, and scene composition. Product UI, API, auth, storage, AgentCore runtime, SDK, realtime, and
IaC belong in the sibling `../kiln-studio/` repository; do not implement those here.

Read [README.md](./README.md) before changing exports or package contents. Runtime code is under
`src/`; tests are colocated as `*.test.ts` or under `__tests__/`. Repository-only checks live under
`scripts/`. The package intentionally ships TypeScript source through the explicit `files` and
`exports` lists in `package.json`.

## Host-injected render and cache boundaries

The engine defines the host-injected `PbrRenderPort`; Studio owns the HTTP adapter, authentication,
environment configuration, production service, and EMF telemetry. Exported `captureViewsViaPort` is
the single owner of the deadline, renderer/PNG validation, grid composition, and never-throw CPU
fallback. Do not duplicate that degrade policy in a host or introduce network/service knowledge into
the deterministic engine paths.

The port is injected twice, for different jobs, and their deadlines must stay separate. The host
calls it once after the loop for the artifact sheet, where nothing is blocked and a long deadline is
correct. `KilnToolContext.viewRenderPort` injects it into `kiln_render` for the IN-LOOP grid, where a
slow render blocks the agent mid-thought — that deadline is its own per-call argument and belongs far
lower. Never collapse the two onto one value. Routing there is conditional on
`sceneNeedsPbrShading(root)`: bound texture or `metalness > 0`, never material type, because
`gameMaterial` and `pbrMaterial` both construct a `MeshStandardMaterial` and are indistinguishable
after construction. Host telemetry still rides `onViewsRendered`, while every unified `kiln_render`
result also carries model-visible `ViewFidelityV1`; a geometry-flat CPU image must never be treated as
material evidence. Keep the input schema stable unless the active program explicitly versions it.

`src/views/renderer-id.ts` runs `readFileSync` at MODULE LOAD. Reach `CPU_RASTER_RENDERER_ID` through
the lazy `await import('../views')` that render paths already use; a static import puts a `node:fs`
edge, evaluated at import time, into a graph deliberately kept free of node-only dependencies. No test
catches this.

Prompt-cache transports are deliberately different. Native Anthropic and Bedrock adapters consume a
system `[TextBlock, CachePointBlock]`; OpenRouter-hosted Anthropic keeps plain system text and receives
top-level `cache_control: { type: 'ephemeral' }` because its Vercel bridge drops cache-point blocks.
Preserve that distinction and the provider usage fields when changing model routing.

## Toolchain and validation

Supported CI toolchain: Bun `1.3.14`; Node `22.23.1`; npm `12.0.1`. Do not use a Bun canary or implicit latest for a
release gate.

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

Use strict test-driven development for behavior changes: add a focused failing test, observe the
expected failure, implement the smallest fix, and rerun both the focused and full gates. Preserve
determinism and do not add `Date.now()` or `Math.random()` to render/rasterizer compute paths.

## Engine consumption and package boundary

Studio consumes a committed tarball, never a path link. After an approved engine change, refresh it
from Studio—not from this repository:

```bash
cd ../kiln-studio
bun run sync:engine
bun install
```

Do not hand-edit `../kiln-studio/agent-runtime/vendor/kiln-engine.tgz`. Before handing off, inspect a
package dry run and ensure tests, repository scripts, coverage output, and `AGENTS.md` have not entered
the tarball.

Container-manifest trap: Studio's local root `node_modules` can hide missing production dependencies.
The API image installs its own manifest with Bun; the Agent image installs
`agent-runtime/package.json` with `npm --legacy-peer-deps`. Engine optional provider peers must be
explicit in every consuming image manifest that needs them. Follow `../kiln-studio/CLAUDE.md` and its
current container boot-validation runbook before any deployment.

## Safety

- Keep the raw engine/tool surface private; Studio `/v1` is the approved external product boundary.
- Never print, read unnecessarily, or commit provider keys, AWS credentials, `.env*`, or secrets.
- Keep normal validation offline. Do not invoke live providers unless explicitly requested.
- Do not deploy, commit, push, force-push, create remotes/releases, mutate AWS, or publish packages
  without explicit user approval. Production changes belong to Studio's guarded deploy flow.
- Do not edit the historical `pixel-forge` repository or use it as a build dependency.
- Do not edit the workspace root or sibling Studio while performing an engine-only task, except when
  the user explicitly expands scope or requests the documented tarball synchronization.
