# Independent renderer architecture review (B05)

Date: 2026-09-21. Reviewed the B01-B04 architecture report, all seven receipts, all nine research scripts, and the actual host/service implementation. Additional bounded probes used Bun 1.4.2 and Node 22.23.2 on Windows x64. They did not initialize a GPU, access the existing service, modify runtime/package files, or change user `qa/` work.

## Decision for B06

Accept **ordinary optional native dependencies in the official package, with an isolated managed Node HTTP renderer** as the implementation candidate, subject to the gates below. The research supports removing the nested manual install and retaining one local/remote protocol. It does not establish a finished installation experience, a reliable shared service, or portability beyond this Windows host.

Keep the native binding out of the agent process. The existing renderer owns global shims, loader hooks and a device-loss process exit; eliminating its process boundary would move those effects into CLI/MCP/Strands. Keep the unchanged upstream binary package rather than starting a Kiln binary-distribution program without a demonstrated size requirement. Root optional dependencies are a simpler release arrangement than an internal companion under the current measured constraints. Revisit that choice if full-package or platform qualification contradicts the prototypes.

The highest-priority revision is broader than changing a dependency field: **replace the first-owner lifetime rule and establish bounded service admission and a verified compatibility handshake before advertising automatic shared rendering.** The report correctly identifies this as an explicit change to AGENTS.md and its lifecycle tests. Implement that change deliberately; do not layer a second undocumented lifetime rule on top.

## Evidence assessment

The successful install/render receipts are internally consistent: fresh npm installations and Bun script-disabled installations produced the same 26,705-byte PNG for the same fixture on the same RTX 3070. The two candidate layouts have nearly identical normal installed sizes. Optional omission leaves the prototype CPU marker importable and native rendering unavailable, as the report states. The companion candidate's omitted render attempt throws a raw module-not-found error, which is useful failure evidence but not acceptable final-user diagnostics.

Several limits deserve explicit retention in the final decision:

- The packages contain renderer source and a trivial CPU marker, not the official Kiln import/export/CLI/MCP/Strands dependency graph. Successful marker imports cannot close H03/H11.
- The HTTP receipt's two concurrent client submissions both report `queueDepthAtEnqueue: 0` and `queueWaitMs: 0` in service logs. The calls succeeded, but no actual queued backlog was observed. They do not qualify admission, cancellation, fairness or health responsiveness while queued.
- `probe-boundary.mjs` sends no `input_glb_sha256` and reads `result.renderFidelity`, whereas the current response calls that field `fidelity` and includes it only for an identity-aware request. Consequently its saved render records have no fidelity receipt. The identical PNG is useful parity evidence; material-fidelity contract validation remains a separate required probe.
- The IPC/direct scripts terminate their native processes explicitly. They prove isolation and output feasibility, not graceful lifecycle behavior. IPC readiness covers adapter acquisition, while HTTP readiness also initializes the renderer and fingerprint; the reported times are not directly comparable.
- The 18-second HTTP startup observation remains an unexplained outlier. A later 1.4-second warm profile does not invalidate it or establish a cold-start percentile.
- `run.mjs` records individual failures but does not fail its own run whenever a required normal case fails. These are research receipts to inspect, not release gates whose process exit alone proves success.
- Archive integrity and binary hashes are evidence of byte identity. Published provenance metadata is not verified provenance. Preserve the report's open notice/provenance work rather than interpreting its MIT metadata field as a complete redistribution inventory.
- No Linux, macOS, other vendor GPU, read-only installation, failed optional-install hook, or second-machine run was measured. Warmed-cache offline installs are not clean offline provisioning.

## Confirmed implementation findings

| Priority | Finding and evidence | Required revision |
| --- | --- | --- |
| P1 | Shared service lifetime is still tied to the initiating owner. The existing real receipt demonstrates exit about 1.7 seconds after that owner dies while a separate observer is alive. `server.mjs:349` watches only that PID; `render-service-host.ts:326` also kills the spawned service on host exit. | Managed lifetime must follow admitted/active work and a bounded idle policy. Creator PID is provenance, not authority over joiners. Explicitly preserve manual long-lived mode. |
| P1 | Startup accepts an unknown unresponsive endpoint. `startLocalRenderService` returns the URL when inspection says `busy` (`render-service-host.ts:356`). An owned fake listener that never returned a health response was accepted after 1,502 ms. | A timeout is an unknown/busy state, not a verified renderer. Bounded reprobe may retain a previously verified instance; first contact must establish service identity and compatibility before joining. |
| P1 | An unversioned `{ok:true, rendererId:'unversioned-probe'}` endpoint is accepted as a current service. Inspection marks it `stale:false`; startup returns it even when the local service directory does not exist. Startup race checks use the still weaker `healthy()` boolean. | Apply one strict handshake to first contact, startup races, recovery and remote selection. Require supported protocol/build/dependency identity and capabilities; unknown versions should fail with an upgrade/conflict message. Never kill an unrelated port occupant. |
| P1 | The serial queue is not bounded. A pure probe admitted 128 jobs behind one deliberately blocked job, then ran all 128. `contract.mjs:149` has no admission or abort contract. The `MAX_OPERATIONAL_QUEUE_DEPTH` constant clamps telemetry, not work. The HTTP route has no request-close cancellation. | Bound pending jobs and total admitted bytes before retaining large bodies; reject overload explicitly. Remove aborted queued jobs, release their buffers and retain accurate activity counts. Define running-job cancellation honestly: safe checkpoints or worker recovery, not a promise to interrupt arbitrary native work. |
| P1 | The current GLB boundary does not require self-contained data. The service directly calls default `GLTFLoader.parse` at `renderer.mjs:347`. A 384-byte GLB with one external buffer URI caused the identical loader to fetch a triangle from an owned loopback server and load it successfully. | Validate and reject external buffer/image URIs before parsing and enforce a rejecting loader resource resolver as defense in depth. Self-contained GLB bytes must determine both rendering and content identity; an external dependency defeats that claim. |
| P1 | Dependency and compatibility identities remain different concerns. Readiness checks physical nested directories, source stale detection omits dependency bytes, and capture-identity creation silently returns undefined if hashing fails (`cache-identity.mjs:63`). | Resolve dependencies using the renderer's actual module-resolution context; compare supported build/dependency identity during joins. Retain actual capture identity for evidence. A missing identity must be visible and cannot satisfy required reproducible material-evidence acceptance. |
| P2 | Legacy target pools are finite but too weakly bounded to call memory-safe. One accepted request can ask for 12 views at 2048² = 50,331,648 view pixels. All seven size rungs retain up to 75,890,688 target pixels with no eviction (`renderer.mjs:95`). Those counts exclude depth, MSAA, beauty and scene resources. Exact-camera mode has a separate 16,777,216-pixel cap. | Specify a unified render/pixel budget and a measured pooled-resource ceiling or eviction policy. Avoid allocating all maximum-size configurations during acceptance merely to prove arithmetic; test bounds with fakes and qualify realistic peak memory on hardware. |
| P2 | Compressed/body-byte limits do not bound decoded content. `PNG.sync.read` runs without an explicit decoded-pixel budget at `renderer.mjs:35`; GLB parsing can expand textures and scene resources beyond the 48 MB input cap. | Validate image dimensions/count, buffer/accessor ranges, supported extensions and total decoded resource estimates before native submission. Add malformed/decompression-budget fixtures; do not treat a small compressed file as cheap work. |

The external-resource probe exercised the actual dependency's loader directly, without a GPU or HTTP renderer. Combining it with the current direct-loader call proves that the parser boundary lacks self-contained enforcement. It is not a remote penetration test or a claim that a second machine was exercised.

## Browser and CPU boundary

`bun build src/composer/render-port.ts --target browser` passed and bundled six modules. This is useful evidence that the host-injected port contract can remain independent of native setup. Preserve that boundary: optional dependencies must be resolved only in host service code, not eagerly imported by primitive, evaluator or port APIs.

A separate `bun build src/primitives.ts --target browser` failed in the existing `detect-libc` dependency's `require('child_process')`. `bun why detect-libc` identifies the `sharp`/`ndarray-pixels`/`@gltf-transform/functions`/`manifold-3d` dependency chain. No new renderer dependency was installed. This is an existing broader import-graph concern, not evidence that optional `webgpu` causes it. The final package must state and test its actual supported browser entrypoints rather than treating a Node CPU-marker import as a browser gate. Do not expand B06 into an unrelated browser rewrite without making that product scope explicit.

## Required implementation gates

1. **Lifecycle and startup:** a joined session finishes work after the creator exits normally or is killed; a crashed job cannot keep the service forever; idle expiry never interrupts admitted work; manual services remain manual. A short-lived CLI returns without remaining alive solely through its renderer child handles. Detached/unreferenced child and stdio handling must be designed alongside idle shutdown. Concurrent cold starts converge on one verified service.
2. **Version coexistence:** two installed Kiln versions encounter the same socket. Compatible clients join; incompatible clients receive actionable conflict information. No active/manual renderer is silently replaced. Missing or malformed instance/build identity, health timeouts and an unrelated listener are distinct states. Recheck the successful race winner with the same handshake as first contact.
3. **Bounded load:** overload yields a documented retryable response before large request retention. Test count/byte/pixel budgets, slow uploads, disconnect before enqueue, queued cancellation, shutdown with admitted work, device loss and recovery. Health responsiveness and queue waiting must be measured under actual contention, not inferred from concurrent client promises.
4. **Payload and identity:** require self-contained GLBs; reject external references without performing network/file reads. Bind each accepted render and PNG set to input/build/dependency identity. Exercise identity-aware fidelity responses rather than only legacy views. Unsupported image formats and dropped material channels must be visible, not certified as complete material evidence.
5. **Official installation:** test a packed full Kiln candidate, source hooks/assets included, normal and omitted optional dependencies, failed native loading, scripts disabled, cache reuse, hoisted/isolated dependency resolution, writable/read-only installation and the supported Node/Bun combinations. CPU asset generation and GLB export must actually run with native rendering unavailable.
6. **Remote:** explicit remote configuration never starts a local GPU. Exercise a second device with transport/authentication, capability/version negotiation, bounded request deadlines and overload behavior. Keep remote PIDs informational; local stop logic must never signal a local PID merely because a remote health document carries that number. Preserve the existing sole engine fallback owner and fidelity reporting.
7. **Platform evidence:** actual supported-platform installs and material rendering remain open until run. Use the current Windows evidence to proceed locally; do not relabel unrun platforms as passing or silently remove them from the target matrix.

## Reproduction and disposition

New evidence is in [renderer-adversarial-receipt.json](2026-09-21-renderer-adversarial-receipt.json). Reproduce the bounded probes using the already staged successful prototype service directory:

```powershell
$receipt = Get-Content docs/reviews/2026-09-21-renderer-boundary-receipt.json | ConvertFrom-Json
bun scripts/research-renderer/probe-adversarial.mjs $receipt.serviceDir docs/reviews/2026-09-21-renderer-adversarial-receipt.json
```

The probe owns all temporary listeners and closes them. It stores source hashes, queue measurements, unknown/unversioned endpoint behavior, direct-loader external-resource evidence and browser-build results. No existing renderer is stopped, no native dependencies are installed and no paid/external rendering service is called.

B05's review is complete. B06 can select the proposed architecture with these revisions mapped into H03-H11 and explicit open platform/remote acceptance. Architecture selection is justified; release qualification is not yet achieved.
