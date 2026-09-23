# Renderer host and HTTP adapter implementation receipt

Original receipt: 2026-09-21. Scope: host/client portions of H05–H08. The September 22 supplement below adds in-session refresh and actual Windows GPU evidence. Cross-device and H05/H07/H08 checkout acceptance are now reconciled in the
[September 23 receipt](2026-09-23-cross-device-rendering.md). Installed-package
acceptance remains open; original lane-specific gaps below are historical.

## September 22: explicit session refresh

`kiln_renderer` is a shared registry tool with `status` and `reprobe` actions. An
existing MCP/native session can attach a recovered local renderer or retry a failed
lazy startup. Discovery stays read-only and reports `reprobeRequired` when a new
connection is needed. Reprobe itself does not install, start, stop or render.
CPU/local/remote selection and credentials stay fixed; environment or Kiln changes
require a host restart. A reproduced late-environment bug in local startup is also
fixed: the child uses the host's captured environment and selected socket.

Render operations snapshot the connection before producing views. A concurrent
refresh does not interrupt an active capture. Capture caches follow the selected
producer; CPU images do not become GPU evidence. Animation, interior and inspect
views use the same connection mechanism. Native final-sheet delivery reads the
refreshed connection while retaining its independent artifact deadline.

Actual compiled Node stdio MCP retained one connection through an initial HTTP
503, a CPU image, explicit reprobe, and real Dawn/D3D12 RTX 3070 GPU images. Reprobe
left the socket vacant; rendering started the service. Source reference and GLB
hash remained unchanged. Three animation derivatives carry full-material and
camera receipts. Their serialized geometry and image midline spans agree with
the 0/45/90-degree rotation; direct replay uses the same derivative hashes. CLI
capabilities identify the same producer, and CLI reprobe succeeds. The private
service was explicitly stopped after the probe.

Evidence: `C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/renderer-session-refresh-final/receipt.json`,
`pixel-pose-comparison.json`, and the original `renderer-session-refresh/derivative-pose-inspection.json`.
The final probe uses runtime `7bb354...d7ab5`. Original attempts are retained.
Focused checks: 84 pass / 377 assertions; repaired surface checks: 16 pass /
57 assertions. Typecheck, lint (664 files), skills and toolchain checks pass.
The public surface has fourteen tools; the context budget increases from 30 to
31 KiB to accommodate the new explicit control. Coverage thresholds are unchanged.
The first full gate found two stale surface assertions and the context-size gate;
its log is `%TEMP%/kiln-renderer-refresh-full.log`. Final gate status is recorded
in the initiative checkpoint.

This qualifies the refresh mechanism on the Windows checkout and the native
final-sheet path offline. It does not claim a live Strands run, cold installation,
other-platform support or actual second-device recovery.

## Original implemented behavior

- `src/render-service-client.ts` is the single HTTP health and rendering adapter. It verifies protocol `kiln.render-service.v2`, instance v2, managed/manual lifetime fields, required capabilities, actual dependency pins, recomputed build identity, matching source identity, and capture identity. An old `ok:true` health payload is incompatible. A timeout or failed HTTP health response is unknown. Only a refused connection means absent. No unknown listener is joined or displaced.
- The host and server use the same pure `build-identity.mjs` and source fingerprint implementation. Readiness resolves Node's actual dependency graph, including hoisted packages; it distinguishes missing dependencies, incompatible dependencies, unavailable Node, and absent packaged source. A focused test changes an installed webgpu version from 0.6.1 to 0.4.0 and back. Under Bun, a short Node subprocess avoids Bun 1.4.2's reproduced negative module-resolution cache and tests the same runtime that will execute the service. This loads no native GPU module.
- Local auto mode starts lazily when dependencies are available. CPU mode does not probe/start a renderer. Explicit remote URLs remain remote even when they fail; no local GPU is substituted. Only the explicit client token may go to remote endpoints. Health and render requests reject redirects and share token selection.
- A managed child detaches after startup, including closing its stderr pipe. There are no initiating-host exit hooks, owner-PID liveness replacements, or session-teardown stops. Concurrent local starts use the shared socket and join a verified current service. The server's own bounded idle lifecycle remains responsible for shutdown and active/queued work protection.
- Explicit `kiln service stop` applies only to the configured literal loopback service URL and rechecks PID, start time, capture instance, and build before signaling. Remote-reported PIDs never authorize a local kill. `service prune` returns a removed-command diagnostic and performs no action. The obsolete `stopLocalRenderService` host function is removed, including the CLI's finally teardown call.
- `kiln service status` reports installation, protocol, build, and lifetime. `kiln service reprobe` performs a fresh installation and health check and returns a nonzero result when a compatible running renderer cannot be verified. Neither installs packages or stops services.
- `PbrRenderPort` accepts optional execution `{signal}` as its second argument. The serialized request schema is unchanged. `captureViewPngsViaPort` remains the sole deadline/reply-validation/degradation owner and aborts the controller when its existing deadline expires. The HTTP adapter forwards that signal across health verification and render response reading; it no longer imposes the CLI's short in-loop deadline on artifact renders. Cache misses and bypasses preserve the execution signal; canceled cache work never dispatches a new render. The cache has no shared in-flight request coalescing, so cancellation remains local to each caller.

## Evidence

Strict red/green regressions first reproduced unversioned health adoption, timed-out listener adoption, and lack of execution cancellation. Three additional red/green regressions reproduced loss of cancellation through cache bypass, cache miss, and a pre-canceled cache lookup.

Final focused command:

```text
bun test src/__tests__/render-service-hardening.test.ts src/__tests__/render-service-host.test.ts src/__tests__/render-service-lifecycle.test.ts src/__tests__/cli-render-mode.test.ts src/__tests__/cli-service-lifecycle.test.ts src/__tests__/cli-capture-cache.test.ts src/__tests__/cli-beauty-response.test.ts src/__tests__/service-cli.test.ts src/views/__tests__ --timeout 20000
203 pass, 0 fail, 889 assertions across 31 files (8.37 seconds).
```

The real process fixture builds the CLI, executes it under Node, verifies prompt CLI exit and output PNG, then verifies the managed renderer remains available. Concurrent cold-start and explicit-stop tests use real local processes. HTTP cancellation verifies that an already-dispatched request closes its server response after the owner deadline. Health tests cover missing/contradictory protocol, PID/lifetime, source, dependency, digest, capabilities, and capture identity. Token isolation, exact cameras, input hash and material-fidelity receipt forwarding, cache invalidation on renderer restart, and CPU behavior are covered. These fixtures establish transport and lifecycle correctness; they do not establish native renderer material quality.

Biome passed for all 18 affected code/test files. Typecheck passed during this lane; the final rerun encountered a concurrent unrelated error in `src/__tests__/dispatch-categories.test.ts:18` (`null` passed where a string is required). Root owns the combined gate and full-suite/coverage run. Toolchain: Bun 1.4.2, Node 22.23.2. No live provider calls or commits were made.

## Acceptance still open

- **H05/H08 server integration:** idle expiration, queued/active protection, admission budgets, self-contained GLB and PNG allocation gates belong to the service lane. Host-side fake-process tests do not close those service or native GPU gates.
- **H06 in-session refresh:** the original gap is resolved by the September 22 supplement. An external CLI process still cannot refresh a different session; invoke `kiln_renderer` within that session.
- **H07/H08 remote deployment:** same-build strict routing, authentication selection, HTTP cancellation and fidelity forwarding are qualified offline. A real remote deployment, device loss/recovery behavior, and actual material output remain separate acceptance work.
- **H09–H11 packaging and devices:** root owns root-package dependency installation and package identity. The supported-platform matrix, cold installed package to image through CLI/MCP/native, and actual second-device comparison are not established here.
- Documentation in AGENTS, README, renderer setup, generated workspaces, and skills still needs the coordinated H10 pass. The old owner-exit lifecycle, nested install guidance, and one-shot auto startup assumptions must be removed there.
