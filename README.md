# Kiln

**A vision-in-the-loop code-generation agent that builds 3D assets as source code.**

Kiln turns a sentence into a game-ready GLB by having a model *write a program*, look at what it
rendered, and fix it — not by sampling a mesh. The output is a small program with named parts, not
an opaque blob: editable, diffable, parametric, and readable by the next agent that touches it.

![Six-view contact sheet of a procedurally generated field gun](examples/hero-sheet.png)

*The contact sheet the model looks at — `examples/field-gun.kiln.js`, 15,544 triangles: a revolved
bronze barrel bored with a boolean, a stepped oak carriage carrying strapwork and bolt heads, and
twelve-spoke wheels with iron tyres:*
`bun run kiln render examples/field-gun.kiln.js --views sheet.png`

## What this is

A working reference implementation of an agent loop that can **see its own work**:

```
list primitives -> write program -> validate (AST) -> render -> look at six views -> fix -> finalize
```

The interesting parts are architectural, and they generalize past 3D:

- **One tool definition, two transports.** [`src/tools/registry.ts`](src/tools/registry.ts) is the
  single source of truth. The in-process Strands skin and the MCP server both iterate it, so tool
  names and schemas cannot drift apart.
- **Deterministic gates, kept separate from model judgment.** Self-intersection, part connectivity,
  and AST validation all fail closed with no model call. `QaContext` is deliberately image-free so a
  QA rule *structurally cannot* read a render buffer.
- **A render port with a fail-closed degrade.** `captureViewsViaPort` owns the deadline, PNG
  validation, grid composition, and a never-throw fallback. Renderers are swappable; correctness
  does not depend on which one ran.
- **Budgets and compaction** as first-class concerns, because agent loops that render images run
  out of context and money.

## What this is not

- **Not photoreal reconstruction.** Output is stylized to mid-fidelity procedural geometry. If you
  want a scanned-looking mesh, use a diffusion model — Trellis, Hunyuan3D and friends are better at
  that, and it isn't close.
- **Not a mesh generator.** No diffusion, no photogrammetry, no point cloud. A model writes code;
  the code builds geometry.
- **Not novel in category.** [img2threejs](https://github.com/img2threejs/img2threejs) is an
  architectural peer running the same essential loop. Kiln differs in being TypeScript/Strands, in
  running its vision loop with no browser required, and in its deterministic gate layer.
- A single reference view cannot reveal hidden sides. Assets are inferred, not measured.

## Quickstart

**No API key required.** Render an existing Kiln program and look at the result:

```bash
git clone https://github.com/matthew-kissinger/kiln && cd kiln
bun install
bun run kiln render examples/crate.kiln.js --out crate.glb --views sheet.png
```

That exercises the geometry build, the QA gates, and the rasterizer with no model and no key. The
default `--render auto` briefly looks for a local GPU render service and falls back to the CPU
rasterizer when there is none, so this works unchanged on a machine with no GPU.

To generate from a prompt, set one provider key and:

```bash
bun run kiln generate "a weathered wooden crate" --out crate.glb
```

## Rendering: three modes

Kiln renders the views the model looks at, and there are three ways to do it. All three are in this
repository; none requires a cloud account.

```bash
--render auto          # default: local GPU service if one is up, else CPU
--render cpu           # force the deterministic CPU rasterizer
--render gpu           # force GPU; error rather than degrade
--render-port <url>    # a GPU render service anywhere, local or remote
```

### What the difference actually looks like

The same program — the field gun above — rendered both ways:

| CPU rasterizer | GPU PBR |
|---|---|
| ![Field gun flat-shaded, every material rendering as white plastic](examples/gun-cpu.png) | ![The same gun with oak, iron and bronze all reading distinctly](examples/gun-gpu.png) |

Geometry is equally legible in both. On the CPU sheet you can still count the twelve spokes, see the
bolt heads on the cheek straps, and read the stepped carriage — silhouette, proportion, orientation
and part contact all survive intact.

What does not survive is every material cue in the asset. The oak carriage, the iron tyres, and the
bronze barrel render as **the same white plastic**. Not dimmer — *absent*. The procedural albedo and
the derived normal maps that separate weathered wood from gun-metal simply do not exist in a
flat-shaded render, so an agent looking at the left-hand sheet has no way to tell that this asset has
three materials at all.

**If your assets have textures or metal, use the GPU.** That is most real assets, and it is why
`auto` reaches for a GPU first. The CPU rasterizer is the floor that guarantees the loop runs
anywhere — CI, a container, a laptop with no GPU — not the target.

This is also why every render reports `viewFidelity`. When `materialFaithful` is false the agent is
told, in band, that it may judge geometry and **not** material. An agent that cannot see a texture
must not conclude the texture is wrong.

|  | CPU raster | GPU PBR |
|---|---|---|
| Why it exists | Runs where there is no GPU at all | Material, texture, and metal legibility |
| Cost | None | A render service, local or remote |
| Determinism | Byte-identical | Varies by driver and adapter |
| Honest about | Silhouette, proportion, orientation, contact | All of that, plus material |
| Role | Guaranteed floor and fallback | What you want for textured assets |

### Running the GPU renderer

[`render-service/`](render-service/) in this repository is the renderer: GLB bytes in, PBR PNG views
out, headless three.js `WebGPURenderer` on Dawn. No browser and no X server.

```bash
cd render-service && npm install && npm start
```

That is **gpu (local)**. It listens on `:8000`, which is where `--render auto` looks, so nothing else
needs configuring — the next `kiln render` picks it up and says so:

```
sheet.png  (GPU dawn-d3d12:nvidia-geforce-rtx-3070:D3D12 driver version 32.0.16.1074)
```

For **gpu (remote)**, run the same service on a GPU box (there is a `Dockerfile`) and point at it:

```bash
kiln render asset.kiln.js --render-port https://your-renderer.example --views sheet.png
```

The service refuses to boot on a software adapter, so a driver regression gives you a renderer that
will not start rather than one that silently renders on CPU and lies about it.

With nothing reachable, `auto` falls back to the CPU rasterizer, which is why a machine with no GPU
needs no configuration at all. `captureViewsViaPort` owns the deadline, PNG validation, grid
composition, and a never-throw fallback: a slow or broken renderer costs fidelity, never correctness.

**The GPU is a view producer only — it is never gate evidence.** QA rules never see pixels.

## Use it from your agent

Kiln ships as an [Agent Plugin](https://agentplugins.codes/): an MCP server exposing the tool
surface, plus skills that teach an agent how to use it well. It works in Claude Code, Codex CLI,
Cursor, and any other client supporting the standard.

The MCP server exposes the **raw tools**, which means *your* agent is the author — it writes the
program, looks at the render, and iterates using its own model. No separate provider key, no nested
agent loop.

Note that in this mode your harness supplies both the author and the vision judge. The
deterministic gates still run independently, but the eyes/judge separation the production system
maintained is collapsed. That is a deliberate trade for portability.

## Tool surface

| Tool | What it does |
|---|---|
| `kiln_list_primitives` | the primitive/helper catalog with signatures |
| `kiln_validate` | AST validation — syntax, structure, infinite loops, recursion |
| `kiln_render` | build the scene, return metrics **and** the six-view sheet, in one call |
| `kiln_screenshot_animation` | frames of an `animate()` program, so motion is visible too |
| `kiln_view_interior` | interior camera, for anything enterable |
| `kiln_inspect` | close-up orbit camera on a named part |

Every one of these comes from a factory in [`src/tools/registry.ts`](src/tools/registry.ts); no
transport hand-writes a definition, and `src/mcp-parity.test.ts` is what keeps that true.

`kiln_render` here is the *unified* definition — the one that returns metrics and pixels together,
accepts a custom camera capture, routes to the GPU when the scene needs PBR shading, and reports
`viewFidelity` so the agent knows whether it may judge material from what it is looking at. The
engine also carries a frozen four-tool bench baseline whose `kiln_screenshot` is CPU-only by
construction; the in-process loop still runs that baseline plus a terminal `kiln_submit`. Shipping
the baseline over MCP would have meant shipping a surface the render port can never reach.

## Subpath exports

The engine ships TypeScript source; consume by subpath:

| Import | What |
|---|---|
| `kiln/tools` | the tool registry — the single source of truth, and free of any agent SDK |
| `kiln/agent` | the Strands agent loop, model factory, tool surface, edit buffer, unified diff |
| `kiln/render` | GLB build + serialize, grade/optimize/snap, `composeScene` |
| `kiln/views` | the pure-CPU six-view rasterizer + `node:zlib` PNG encoder |
| `kiln/validation` | structural validator + AST analysis (acorn) |
| `kiln/primitives` | the primitive/helper registry |
| `kiln/qa` | the deterministic QA gate registry and corpora |
| `kiln/arena` | Bradley-Terry + adaptive pairwise sampling, for model bake-offs |
| `kiln/palette` | canonical `OPTIMIZED_PALETTE` + directive (pure data, browser-safe) |
| `kiln/metrics`, `kiln/inspect` | instanceability grade + scene-structure analysis |
| `kiln/contracts` | asset and integration contracts, `IntegrationManifestV1`, semantic roles |
| `kiln/composer` | THREE-free scene composition — layout, overlap resolution, scene DSL |

Finished renders include `integrationManifest`, a versioned sidecar carrying the artifact hash,
metres/+Y-up axes, bounds, grounding offset, default scene, role, render metrics, and structural QA.
Consumers holding only GLB bytes can derive the same sidecar with `inspectGlbIntegration(bytes)`;
that path parses the artifact and never executes model-authored source.

Visual quality stays explicitly `not_assessed` until something actually looks at the asset in its
real scene. Structural validation is not a visual pass.

## Determinism

Render and rasterizer compute paths use no `Date.now()` or `Math.random()`, so CPU six-view output
is byte-reproducible — the basis for golden-image tests. Inject seeds and timestamps at the
boundary.

## Tests

```bash
bun run typecheck
bun run test           # offline; live agent tests gated behind KILN_SPIKE_LIVE=1
bun run test:coverage  # LCOV plus the checked coverage ratchet
```

Baseline is **95.38% functions / 91.80% lines** across 130 test files. CI enforces non-regression
ratchets of 92% and 91% and uploads `coverage/lcov.info`.
Threshold decreases require an explicit measured rationale.
Tests pin `KILN_RENDER=cpu` so coverage cannot vary by runner GPU.

## Dependencies

Runtime: `three`, `@gltf-transform/*`, `manifold-3d` (CSG, WASM), `three-subdivide`,
`acorn`/`acorn-walk`, `zod`, plus lazy-loaded `sharp` (texture decode) and `xatlasjs` (UV atlas).
The agent stack — `@strands-agents/sdk` + `@ai-sdk/provider` — is an **optional peer**: install it
only if you use `kiln/agent`.

Textures are eight [Poly Haven](https://polyhaven.com) CC0 families, embedded with source provenance
retained. Runtime output is self-contained and never calls Poly Haven.

### `@ai-sdk/provider` is pinned to v3 by Strands, not by us

Do not bump `@ai-sdk/provider` to v4 or `@openrouter/ai-sdk-provider` to v3. Every
`@strands-agents/sdk` version through 1.11.1 peers `@ai-sdk/provider@^3.0.0`, and its `VercelModel`
is typed against `LanguageModelV3`. A cast does not help, because Strands emits V3 shapes at
*runtime*: `vercel.js` sends `{type: 'file', data: <bare bytes>}` where V4 expects
`{type: 'data', data}`, plus `{type: 'file-data', ...}`, which does not exist in V4 at all.

v4 is purely additive and the only real change here would be one string in three files — which is
exactly why it looks deceptively easy. Stay on `@openrouter/ai-sdk-provider@2.10.0` until Strands
ships v4 support.

## History

Kiln was a commercial text-to-3D product. It is shut down; this is the engine, which is the half
that stays true regardless of how the product did.

Some of the design here reflects constraints that no longer apply — most visibly the CPU rasterizer,
which exists because the production agent runtime container had no GPU. Where an original decision
made sense only for a hosted multi-tenant product, this repo does the thing that makes sense for an
open one, and `docs/history/` records what the production system did and why.

Initially extracted from the `pixel-forge` monorepo with file history preserved via
`git subtree split`. See `CHANGELOG.md`.

## License

MIT. See [LICENSE](LICENSE).
