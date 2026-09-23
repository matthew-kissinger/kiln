# Kiln Engine Agent Guide

## Scope

This repository turns model-authored source into GLB assets. It includes deterministic rendering,
validation/QA, primitives, the agent tool surface, arena ranking, scene composition, a CLI, and an
Agent Plugin (MCP server + skills).

Read [README.md](./README.md) before changing exports or package contents. Runtime code is under
`src/`; tests are colocated as `*.test.ts` or under `__tests__/`. Repository-only checks live under
`scripts/`. The package intentionally ships TypeScript source through the explicit `files` and
`exports` lists in `package.json`.

The active V1 initiative's current goal, exact validation state and resume action
are in [the progress checkpoint](docs/plans/2026-09-22-progress-checkpoint.md).
Use it with the linked task ledger; dated audit/run reports retain historical
facts and must not override the current checkpoint or imply release acceptance.

## Authoring an asset is a different task from changing the engine

This guide covers changing the engine. Authoring an asset does not happen here: it happens in a
separate workspace, because the authoring skills assume a live `kiln_workspace` server, and giving a
model this implementation and the example collection alongside an asset brief changes what it
produces.

If the request is to make or refine an asset, read the `kiln-setup-workspace` skill and create a
workspace first. It is registered for a bare clone at `.claude/skills/` and `.agents/skills/`, and
the maintained copy is `skills/kiln-setup-workspace/`. Everything else in this file assumes you are
working on the engine itself.

## Historical gallery assets

Gallery assets are unvetted historical showcases, not golden outputs. Regression
comparisons do not establish their quality. Repairing or replacing them is outside
the V1 goal; qualify the upgrade through fresh dogfooding and shared defect fixes.

## The tool registry is the single source of truth

`src/tools/registry.ts` owns tool names, descriptions, and schemas. Two skins consume it: the
in-process Strands tools (`src/agent/tools.ts`) and the stdio MCP server. **Both must iterate the
registry** -- never hand-write a tool definition in a skin, or the transports drift apart and the
repo's central claim stops being true. There is a test that asserts name parity; keep it passing.

`createKilnProgramToolRegistry` supplies the fourteen MCP tools.
`createKilnNativeToolRegistry` uses those same definitions and adds `kiln_finish`.
The native default is ten tools: nine authoring/reference tools and completion.
Injecting an `assetLibrary` enables the five delivery tools as well, for fifteen.
A configured skill-resource reader adds `kiln_skill_resource` to either native set.
Unavailable host services must not become advertised tools that always fail.

Both skins use unified `kiln_render`: metrics, part paths, QA, images and fidelity
share one evaluation. `kiln_screenshot`, the mutable-buffer factories and surface
selector are retired. `kiln_validate` provides the image-free syntax check.

Native completion uses `kiln_finish({programRef})`, defined in the registry rather
than the Strands skin. It selects an exact retained reviewed artifact without
re-evaluation. Completion and QA acceptance remain separate. A completion call
must run alone; immutable edits and reads may run concurrently. The MCP surface
has no terminal action because its host owns the outer loop and delivery.
Do not restore the old submit/finalize factories or silently route old selectors.

Strands harness guidance is registered programmatically by
`src/agent/native-workflow.ts`, outside the shared `skills/` tree. Keep its native
completion/recovery protocol out of CLI/MCP setup, generated workspace instructions,
Discovery and shared skills. Geometry, materials and inspection contracts stay
shared through explicitly selected technical references; do not load workspace
workflow instructions in Strands or duplicate the contracts. See
[the native workflow boundary](docs/runtime.md#optional-native-strands-workflow).

## Host-injected render and cache boundaries

Kiln Discovery is `kiln_discover` / `kiln discover`. The internal helper specs and typed
catalog live under `src/discovery/`; `./discovery` is the public package entrypoint.
The old discovery tool, selectors and `./list-primitives` export are removed. Search is
ranked local text retrieval with reviewed metadata, without models, network access,
provider keys or a GPU. Any future optional semantic enhancement requires an explicit
adoption decision and cannot weaken the independently supported offline baseline.

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

`src/views/background.ts` owns the named backdrops; `render-service/src/backdrops.mjs`
mirrors them, guarded by `backdrop.test.ts`. Neutral studio grey is the default.
`render-service/src/display-transform.mjs` makes GPU and CPU backdrop pixels match.
Captures accept only `neutral`, `dark` or `light`, never free colours: comparable
views must not hide seams through arbitrary backdrop choices. Both capture-cache
keys include the id; results echo `capture.backdrop`. `kiln_save` uses the supplied
backdrop and records `preview.backdrop` in the manifest.

**One render service per machine, and the socket is its registry.** Sessions share port
8000 (or `KILN_RENDER_SERVICE_PORT`). Join only a validated compatible protocol, instance,
build, dependency and capture identity. A timed-out listener is unknown, not a verified busy
renderer. Stale, incompatible and foreign listeners are reported without replacement;
`kiln service stop` is the explicit action. The old orphan-based `service prune` is removed.

Managed services have a bounded idle lifetime (five minutes by default), protected by all
admitted upload, queued and active work. The initiating PID is provenance only. Host exit
must not kill a shared service or another client's work. Manual services remain long-lived.
The service and host share `render-service/src/build-identity.mjs` and its source fingerprint
implementation; exact resolved dependency pins count. Do not add lease files or another
discovery path. CLI status/reprobe checks its own process. In-session `kiln_renderer`
reprobe refreshes availability for the existing route; restart after runtime,
environment or credential changes. Reprobe does not install dependencies.

Render requests are self-contained GLBs. Admission, upload time, decoded PNG allocations,
geometry and scene depth are bounded before loading. Cancellation removes queued work;
already submitted native GPU work may finish before its result is discarded. Propagate the
optional second-argument execution signal through every `PbrRenderPort` wrapper, including
capture caches, while keeping deadline and CPU degradation ownership in `captureViewsViaPort`.

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

Maintainer toolchain: Bun `1.4.2`; Node `22.23.2`; npm `12.0.2`, pinned in `toolchain.json`.
Consumer Node compatibility is defined separately in `src/runtime-support.mjs` and `engines.node`;
do not add Bun or npm maintainer pins to end-user `engines`. Do not use a Bun canary or implicit
latest for a release gate.

```bash
bun install --frozen-lockfile
bun run check:toolchain
bun run check:skills
bun run typecheck
bun run lint
bun run test
bun run test:render-service
bun run test:coverage
```

`bun run build` is a typecheck only. After runtime source changes, rebuild the Node bundles with
`node scripts/build-runtime.mjs all` before CLI/MCP dogfood and full gates; use `bun run build:runtime`
when viewer assets also changed. A successful typecheck does not refresh `dist/` or its build identity.

Fast change loop: run the nearest test file first, then `bun run typecheck && bun run lint && bun run
test`. Full offline gate: also run `bun run test:coverage`; it emits text plus `coverage/lcov.info`
and enforces the checked-in line/function ratchet in `bunfig.toml`. Raise thresholds when practical;
do not lower them without an explicit measured rationale. Live model tests are opt-in only via
`bun run test:live` and may spend money.

`bun run test` is `bun test src scripts`, so it does **not** reach `render-service/`.
`bun run test:render-service` runs that suite. Its framing, PNG, identity, input and HTTP
lifecycle fixtures need no GPU or loaded Dawn library; native work is simulated where required.
Runtime dependencies can resolve from the root installation. Run it whenever you change
`render-service/`; CI requires it. Real GPU and installed-package checks remain separate gates.

The test scripts set `--timeout 20000`. Bun's 5 s default is below what a cold process spawn or a
first native-library call costs on a loaded CI runner: tests that take under a second locally have
timed out at 5 s on the Windows runner while passing on re-run. A test that legitimately needs more
than 20 s names its own budget as the third argument to `test()`, with the measured duration in a
comment; a real hang still fails, it just takes 20 s to.

Tests and CI pin `KILN_RENDER=cpu`. The coverage ratchet must not vary by whether the runner has a
GPU. It is measured over `src/` alone -- the shipped engine -- so nothing you change under
`scripts/` can move it; those tests still run, and their correctness is their own assertions' job.

Use strict test-driven development for behavior changes: add a focused failing test, observe the
expected failure, implement the smallest fix, and rerun both the focused and full gates. Preserve
determinism and do not add `Date.now()` or `Math.random()` to render/rasterizer compute paths.

## Safety

- Never print, read unnecessarily, or commit provider keys, cloud credentials, `.env*`, or secrets.
- Keep normal validation offline. Do not invoke live providers unless explicitly requested.
- Do not commit, push, force-push, create remotes/releases, or publish packages without explicit user
  approval.
- Live model and arena runs spend money. Keep them manual and out of CI.
