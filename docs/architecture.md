# Library and architecture

Kiln builds JavaScript programs into GLB assets, validates structure, and renders views for visual review. The optional agent loop uses those results to refine a program.

## Entry points

The checkout is `@kiln/engine`; its package exports point to TypeScript source. Use a compatible TypeScript runtime or bundler. There is no published npm release yet.

| Subpath | Purpose |
|---|---|
| `@kiln/engine/tools` | SDK-independent tool definitions and registry factories |
| `@kiln/engine/agent` | Optional Strands agent loop, model factory, and draft buffer |
| `@kiln/engine/render` | Build, serialize, inspect, and compose GLBs |
| `@kiln/engine/views` | Shared cameras, CPU images, capture limits, GPU port helpers and cell caches |
| `@kiln/engine/validation` | Syntax and structural checks |
| `@kiln/engine/primitives` | Geometry and helper catalog |
| `@kiln/engine/geometry`, `/deform`, `/sweep` | Custom mesh/surface helpers, deformation and profile modeling |
| `@kiln/engine/implicit` | Experimental bounded field sampling |
| `@kiln/engine/programs`, `/programs/node` | Immutable memory/file stores and storage statistics |
| `@kiln/engine/cache`, `/cache/node` | Disposable memory/file build caches |
| `@kiln/engine/contracts` | Asset and integration manifests |
| `@kiln/engine/composer` | Layout and overlap helpers |
| `@kiln/engine/qa` | Deterministic QA gates and corpora |
| `@kiln/engine/arena` | Pairwise model evaluation |

See [package.json](../package.json) for all exports.

## Tool surfaces

[src/tools/registry.ts](../src/tools/registry.ts) defines the tools. `createKilnToolRegistry` preserves the original in-process baseline. `createKilnProgramToolRegistry` adds saved-source references and combines build metrics with rendered views for the current MCP surface. The two surfaces share implementations but intentionally differ in their available tools.

An embedded host can inject a `ProgramStore`. The default registry store is in memory; the stdio server and CLI use a local file store. [Program revisions](programs.md) describes the contract and lifecycle.

The render port abstracts GPU rendering. CPU fallback keeps geometry review available when material-faithful rendering is unavailable; camera and material fidelity are reported separately. Required-GPU requests fail when that route cannot honor the request.

Source revisions, evaluated GLB bytes and captured image cells have separate identities. Public tools reuse compatible builds and cells. Packaged Node CLI/MCP hosts keep verified builds on disk, separate from authoritative source; development hosts use process memory. Cached data is copied between requests, so an inspection cannot mutate a sibling request or the accepted artifact. [Runtime and cache controls](runtime.md) · [Generated tool reference](tools.md) · [Extending Kiln](extending.md).

## Validation and integration

Structural checks run without a model. Visual judgments require looking at the result. `inspectGlbIntegration(bytes)` derives a manifest from an existing GLB without executing its source; visual quality remains `not_assessed` until reviewed in the destination scene.

CPU render paths are deterministic for the same inputs. GPU images can vary by device and driver.

## Development

```bash
bun run typecheck
bun run lint
bun run test
bun run test:coverage
```

Offline tests pin CPU rendering and exercise the checked-in example programs. The coverage ratchet lives in [scripts/check-coverage.mjs](../scripts/check-coverage.mjs). Threshold decreases require an explicit measured rationale. Live provider tests require an explicit opt-in.

Core dependencies include Three.js, glTF Transform, Manifold, Acorn, and Zod. The agent SDK is an optional peer. Keep provider adapters compatible with the SDK's declared interface version; a TypeScript cast cannot fix a runtime protocol mismatch.
