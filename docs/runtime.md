# Execution and reuse

Kiln stores source revisions separately from evaluated builds and rendered images. A reference saves the model from repeating source. A compatible build cache saves the engine from evaluating it again.

## Local defaults

The packaged Node CLI and MCP server evaluate programs in a subprocess. Each request has a 60-second deadline, a 512 MiB V8 old-space heap limit, a 16 MiB GLB limit and a 32 MiB evaluator-response limit. The heap cap does not bound native allocations or total process memory. A process is terminable; it is not a complete security sandbox. MCP cancellation reaches the worker, and cancelling one request does not cancel another request's build.

Use `kiln_list_primitives({capabilities:true})` to inspect the actual host. The library's default trusted evaluator runs in process and cannot interrupt synchronous code. Host-injected evaluators can have different limits; absent host metadata is reported as unspecified.

| Environment variable | Supported values |
| --- | --- |
| `KILN_EVALUATOR_MODE` | `subprocess` (local default), `in-process`, or the separately configured `isolated` transport |
| `KILN_EVALUATOR_TIMEOUT_MS` | 1–120,000; default 60,000 |
| `KILN_EVALUATOR_HEAP_MB` | Node subprocess only, 64–4,096; default 512 |
| `KILN_BUILD_CACHE` | `disk` (packaged default), `memory`, or `off` |
| `KILN_BUILD_CACHE_MB` | Disk artifact budget, 0–1,024; default 128 |
| `KILN_BUILD_CACHE_DIR` | Optional disk-cache directory |
| `KILN_GEOMETRY_POLICY` | `warn` (default) or `strict`; strict rejects unsupported export attributes and cannot be weakened by a tool request |

Advanced geometry callbacks also have operation-specific input limits. Those checks do not replace the process deadline: a callback that never returns cannot check its own evaluation counter. Capture pixels and PNG payloads have independent host limits described in [cameras](cameras.md).

## What a build identity covers

Disk reuse requires a verified packaged Node worker. At host startup Kiln checks the worker bytes against its build manifest, then fingerprints the actual installed dependency code and data, including WASM and native assets. The identity also includes the engine build, Node/platform/architecture, evaluation policy and requested build options. A dependency version range or lockfile alone does not identify an npm installation.

Unknown dependencies, an unverifiable installation or unsupported execution modes fall back to process memory. Hosts must restart after changing an installation while it is running. Programs intended for reuse must be deterministic; source that reads ambient time or external state cannot promise reproducible output. Function-bearing material resolvers bypass generic caching unless encapsulated by a host evaluator with a complete dependency identity.

The cache bypasses known ambient time and random APIs, including `Date`, `performance`, `crypto`, `Math.random` and Three.js random helpers. This conservative source check is not a proof that arbitrary JavaScript is pure. Prefer an explicit seed and ordinary deterministic functions when reproducible revisions matter.

`buildCache.hit` reports a completed build reuse. The CLI prints `build reused` or `build created`. Camera changes reuse the same compatible GLB. Edits, changed build options and changed runtime identities produce different keys. Simultaneous requests without cancellation can share a build; cancellable misses own independent workers.

## Storage lifetime

The local cache defaults to `cache/builds` beside the source-store directory, normally `.kiln/cache/builds`. Its byte budget evicts disposable artifacts; it does not evict `.kiln/programs`. Corrupt cache records become misses. The quota concerns retained artifact records, not all temporary files or total memory used while building.

Source snapshots are append-only. `capabilities:true` reports their count and UTF-8 bytes when the host supports store statistics; counting files is not an integrity scan. Export accepted `.kiln.js` revisions before deleting a source store. See [source revisions](programs.md).

Image cells have a separate bounded memory cache. Their keys cover exact artifact/derivative bytes, resolved cameras, dimensions, presentation settings and renderer identity. CPU and GPU entries stay separate. GPU caching requires verified camera/material/artifact receipts and a current service identity; a restart or renderer update invalidates reuse. [Camera and renderer receipts](cameras.md).
