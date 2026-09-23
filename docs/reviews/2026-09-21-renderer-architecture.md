# Renderer distribution and execution research

Date: 2026-09-21. Scope: B01-B04 evidence and a recommendation for B05/B06. This is research against the current renderer, not acceptance of a finished Kiln package. No engine, package manifest, lockfile, rendering policy, or deployment was changed.

Current disposition: the [architecture decision](2026-09-21-renderer-decision.md)
selected ordinary optional dependencies and a managed HTTP process after the
[independent review](2026-09-21-renderer-adversarial.md). Host/service corrections
and real cross-device checks have [checkout evidence](2026-09-23-cross-device-rendering.md).
The original measurements and then-open questions below remain historical;
full installed-package/platform and native notice/provenance gates remain open.

## Recommendation to challenge

Ship the existing renderer source in the official package, add exact `webgpu@0.6.1` as an optional normal package dependency, and resolve renderer dependencies through normal module resolution. Keep the renderer in a separate managed Node HTTP process, using the same protocol for an explicitly configured remote renderer. Do not add runtime installation or download behavior. Make installation state, native loadability, GPU readiness, selected endpoint and fidelity separate visible states.

This is a concrete viable Windows candidate, not a universal-platform claim. Both shortlisted package layouts produced identical real GPU PNGs from fresh installations. Neither required a custom binary downloader, build toolchain, or postinstall script on this Windows host. A second internal runtime package adds release coordination without saving native bytes in its normal installation. Platform-split binary packages would save bytes but transfer packaging, provenance and platform maintenance to Kiln; the upstream package already contains the supported prebuilt targets.

The existing initiating-owner lifecycle must change before calling this a shared renderer. A real probe showed the service exiting while another live process was still using it. Prefer a managed service with a bounded idle lifetime and active-request protection; keep its socket as the only registry. Manual services remain explicitly long-lived. The initiating PID can remain provenance but cannot be the sole lifetime authority for a shared service. This is an explicit revision to the current owner-exit contract, not an implementation detail to hide.

## Evidence and reproduction

All native receipts use Node 22.23.2, npm 12.0.2 and, where named, Bun 1.4.2. Hardware: Windows x64, NVIDIA RTX 3070, D3D12 driver 32.0.16.1074. The research runner records base HEAD and service-source/fixture hashes. A fresh temporary npm cache was used for the first npm candidate; subsequent cases deliberately reuse it. Bun used its existing cache. Single observations are feasibility measurements, not statistical performance comparisons.

The checkout's installed `webgpu` was **0.4.0**, while its manifest and lockfile require **0.6.1**. Research therefore staged fresh dependencies rather than treating the checkout install as release evidence. npm on ordinary PATH was 10.9.8; the actual research command invoked an isolated npm 12.0.2 CLI with Node 22.23.2. npm 12 `pack --json` returned an object keyed by package name, rather than the older array shape; the prototype handles both formats.

Runnable scripts live in [scripts/research-renderer](../../scripts/research-renderer/README.md). They create isolated temporary installations and never install into the repository. Their packages contain the unchanged renderer source and a minimal CPU marker; they are **not full engine package prototypes**. The CPU marker proves that their own non-rendering entrypoint remains usable with native dependencies omitted. H03/H11 must still prove real Kiln CPU generation, export and imports.

| Receipt | What it establishes |
| --- | --- |
| [Baseline](2026-09-21-renderer-baseline-receipt.json) | Existing standalone manifest/lock staged unchanged, fresh `npm ci`, actual PBR output |
| [Layouts](2026-09-21-renderer-layout-receipt.json) | Two packed layouts, normal/script-disabled/optional-omitted/offline npm installations, Bun script-disabled installations and actual PBR output |
| [Native package](2026-09-21-renderer-native-receipt.json) | Published tarball SHA-512 verified; native file inventory, hashes, bytes, upstream metadata and notices |
| [HTTP boundary](2026-09-21-renderer-boundary-receipt.json) | Real HTTP service, concurrent requests, live observer and initiating-owner exit reproduction |
| [Child IPC](2026-09-21-renderer-ipc-receipt.json) | Actual PBR result through an isolated child protocol; parent GPU globals untouched |
| [Failure injection](2026-09-21-renderer-failure-receipt.json) | Simulated missing adapter, software adapter and driver initialization rejection fail boot before listening |
| [Startup profile](2026-09-21-renderer-startup-receipt.json) | Warm repeat separates imports, acquisition, initialization and capture fingerprint time |

The material-channel fixture is 6,364 bytes. Every successful direct, IPC and HTTP probe returned the same 26,705-byte, 128-pixel single-view PNG with SHA-256 `bd6c0164d3ff2d69d19a8eefadd85869bff9a530b9402d917bcc5ff309f99920`. That establishes this fixture's output parity across these boundaries on this host. It does not establish all material fidelity, visual quality or cross-device determinism.

## B01: requirements and baseline

Hard gates before adoption:

1. CPU authoring/import/export works when native rendering is omitted or unavailable, without eagerly loading native modules.
2. An ordinary official-package installation resolves the renderer without a nested manual install. No installation or arbitrary dependency resolution occurs during rendering.
3. Missing dependency, missing binary, native-load failure, missing adapter, device loss, remote failure and explicit CPU selection remain distinguishable. Required GPU evidence cannot pass using a CPU sheet.
4. Capture identity includes the executed renderer and dependencies. Host/service compatibility cannot rely only on a source-directory hash.
5. CLI, MCP and native Strands share bounded local startup/join/reprobe behavior and explicit remote selection. Engine QA remains image-free.
6. Concurrent users survive the initiating host's exit; active jobs prevent idle shutdown; cancellation and queue limits are bounded. Explicit stop and idle cleanup are diagnosable.
7. Installation and actual GPU rendering are qualified per OS/architecture/runtime. An included binary is not proof of driver compatibility.

Current nested baseline: fresh `npm ci` took 3.80 seconds on this host, followed by successful actual GPU output. This demonstrates the current renderer is installable, but its extra install step remains. See the baseline receipt for output times and exact bytes.

Target matrix: Windows x64; Linux x64; macOS arm64 and x64 are the existing user-facing package targets. Linux arm64 and Windows arm64 binaries are present upstream, but should remain separately classified until Kiln qualifies them. This lane has actual GPU evidence only for Windows x64. Linux distribution/glibc compatibility, musl, Metal hardware, quarantined macOS binaries, read-only/ACL-restricted installations and a second remote machine remain unrun.

## B02: native distribution facts

The pinned npm package is `webgpu@0.6.1`, published 2026-09-12, with upstream `gitHead` `f2585d1b386b0f8df63b3d080131e35ab448a9bb`. Its npm tarball is 34,393,751 compressed bytes and declares 94,898,547 unpacked bytes. This archive includes all platforms together; it does not use npm platform-selected optional packages. Verified directories are `darwin-universal`, `linux-x64`, `linux-arm64`, `win32-x64`, and `win32-arm64`, including separate D3D compiler DLLs for both Windows architectures. [Published metadata](https://registry.npmjs.org/webgpu/0.6.1), [upstream build workflow](https://github.com/dawn-gpu/node-webgpu/blob/f2585d1b386b0f8df63b3d080131e35ab448a9bb/.github/workflows/build.yml).

Dawn documents this prebuilt Node distribution as its npm route. No source build was needed in these probes. The shipped postinstall only handles a macOS quarantine attribute; it does not download the binaries. Therefore `--ignore-scripts` is feasible on the tested Windows host, but that result must not be extrapolated to quarantined macOS distributions. Bun blocks untrusted dependency lifecycle scripts; both Bun prototype installs explicitly disabled scripts and still rendered here. [Dawn Node documentation](https://dawn.googlesource.com/dawn/+/HEAD/src/dawn/node/README.md), [pinned postinstall](https://github.com/dawn-gpu/node-webgpu/blob/f2585d1b386b0f8df63b3d080131e35ab448a9bb/build/postinstall.js), [Bun lifecycle documentation](https://bun.sh/docs/pm/lifecycle).

The metadata says MIT, while the included `LICENSE.md` contains Dawn/Tint three-clause redistribution conditions. Preserve the actual upstream notice and the package metadata; do not generate an MIT-only notice from the metadata field. The Windows payload also includes `d3dcompiler_47.dll`; a complete third-party notice/provenance review of the native build remains required before redistributing a Kiln-owned repack of these binaries. Staying with the unchanged upstream dependency avoids creating such a repack, but does not excuse a truthful dependency notice inventory. [Pinned license](https://github.com/dawn-gpu/node-webgpu/blob/f2585d1b386b0f8df63b3d080131e35ab448a9bb/LICENSE.md).

The tarball's SHA-512 was independently recomputed and matched published integrity. Registry signatures and a provenance attestation URL are present. This lane has **not** cryptographically verified the provenance attestation; its presence is not that verification. Keep exact native versions and release hashes, verify provenance/signatures during release preparation, and rerun installed-platform material/lifecycle checks whenever native or Three.js versions change. The native receipt includes recent publication dates; freshness alone is not evidence that an upgrade is safe.

## B03: distribution comparison

| Layout | Normal install and PBR | Scripts disabled | Optional omitted | Footprint and cost | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Current separate nested install | Passed fresh baseline | Supported by Windows mechanism, not rerun as a separate baseline case | GPU absent until manually installed | Requires a second package-manager operation | Baseline only |
| A: official source with optional native dependency | Passed npm and actual GPU | Passed npm and Bun | CPU marker imports; rendering fails visibly | ~116.26 MB prototype installed; native archive 34.39 MB compressed | Preferred local candidate |
| B: optional internal renderer-runtime companion | Passed npm and actual GPU | Passed npm and Bun | CPU marker imports; companion absent | ~116.26 MB installed normally; another artifact/version to coordinate | Viable, no measured benefit for current package |
| Required native dependency | Same upstream artifact mechanism | Windows load is feasible | Users cannot omit the dependency through `--omit=optional` | A native install failure can fail the complete package installation | Does not meet intended independent CPU-only experience |
| Kiln-owned platform split | Not prototyped | Could avoid lifecycle scripts | Can be designed | Windows x64 native files are 16.73 MB versus 94.90 MB all-platform archive contents | Reconsider only if download/footprint becomes a measured product blocker |
| Explicit Kiln provisioning command | No custom prototype needed to establish manual-install mechanism | Must be designed explicitly | Natural CPU default | Additional step and writable/cache provisioning complexity | Fallback design option if cross-platform automatic dependency install fails qualification |

For A and B, npm normal/script-disabled/offline installs all succeeded. Offline means a **warmed package cache** plus local candidate tarballs, not installation on a machine that has never received dependencies. Each normal install took approximately 3.4-4.2 seconds; optional-omitted B took 0.86 seconds. The first A install used an empty temporary npm cache; later rows are not cold network comparisons. Installed bytes include the small prototype, node_modules and lockfiles, not npm's download cache. The 29.6 KB A archive and 29.6 KB B runtime archive exclude external dependencies, so neither is the user's total download size. Full Kiln already depends on Three.js; prototype sizes must not be added mechanically to the package's existing installed size.

Optional dependencies intentionally allow the overall installation to succeed when their installation fails or they are omitted. Consequently, `installed` cannot mean `GPU ready`, and the package must provide an actionable readiness check. Standard resolution must replace `node_modules/webgpu` path existence checks: hoisted or isolated dependency layouts can both be valid. Pin versions and verify actual resolved package identity. [npm optional dependencies and platform fields](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/).

## B04: execution comparison and adversarial findings

| Boundary | Measured result | Main tradeoff |
| --- | --- | --- |
| Managed HTTP Node process | Actual PBR and concurrent requests succeeded; initiating-owner defect reproduced | Reuses local/remote contract and GPU queue; requires correct shared lifecycle |
| Dedicated IPC child | Actual PBR with identical PNG; parent `navigator.gpu` remained absent | Isolates crashes/globals, but one child per harness duplicates GPU contexts; a broker recreates the existing service |
| Direct in-process control | Actual PBR succeeded in isolated test process | Renderer alters global GPU/DOM shims and installs Three.js module hooks; native lifetime/failure reaches the host |
| Explicit remote HTTP | Existing protocol/code reviewed; loopback HTTP exercised | Keeps same request shape; second-device, network, authentication and latency acceptance remains open |

The direct control took 0.60-1.12 seconds to import and acquire the adapter; first render took 1.68-2.54 seconds, second 1.05-1.46 seconds. It explicitly exits because native references retain process lifetime. IPC reached readiness in 0.64 seconds, then rendered in 1.84/1.15 seconds; peak child RSS was 289,116 KiB. These samples establish feasibility, not a reason to introduce another protocol.

The first HTTP probe took 18.03 seconds to report healthy and 19.63 seconds to its first PNG. A separate warm repeat of boot stages totaled 1.40 seconds: imports 0.12, adapter 0.38, renderer init 0.59, capture fingerprint 0.32. The initial outlier is real and unexplained by this sample; do not call it network overhead or promise a subsecond cold start. H11 needs repeated cold-process and cold-install distributions under realistic contention. The HTTP and direct readiness measurements also cover different initialization work.

Confirmed findings:

1. **A joined session loses its shared renderer when the initiating owner exits.** A separate observer successfully polled `/health`, remained alive, and lost access about 1.7 seconds after the owner was killed. The service exited 0 and logged the dead owner. `startOwnerWatch` only knows that first PID. The host also kills its spawned child on normal exit. Registering no joiners is incompatible with claiming stable shared lifetime.
2. **Dependency identity drift is currently allowed by readiness checks.** The local dependency directory existed despite the installed native version differing from the lockfile. `localRenderServiceState` checks directory presence. Host stale detection hashes service source only, whereas capture identity correctly hashes installed renderer inputs. Same source with different native/Three.js bytes can therefore pass the source-based join check. Add a release/build compatibility identity with dependency pins and require it when joining; preserve the richer actual capture identity.
3. **Failure handling before listening is already strong.** Injected no-adapter, software adapter and requestDevice failure each exit 1 before opening the service. They are simulations of upstream responses, not physical driverless-host evidence. The software message refers to Linux advice even for the injected Windows software adapter; diagnostics can name the actual platform rather than prescribing an irrelevant library install.
4. **In-process rendering is not a safe default simplification.** The current code mutates global `navigator`, `self`, animation-frame hooks and image decoding, and aliases bare `three` imports. Its device-loss handler exits the process. In a dedicated service these are contained; inside a native Strands harness they would affect the agent and other tools. Upstream also documents native reference lifetime keeping Node alive. [Upstream lifetime guidance](https://github.com/dawn-gpu/node-webgpu#lifetime).
5. **Cancellation is not established by a client timeout.** The current HTTP handler has a serialized render queue but no request-close/abort cancellation path. An expired caller can leave GPU work running. B05 should challenge long queues, abandoned work, bounded admission and shutdown while work is active; renderer deadlines alone are not proof of cancellation.

## Proposed architecture decision and H-task refinements

Score 1 is weakest, 5 strongest. These are explicit engineering judgments after hard-gate screening, not benchmark outputs. Weights are equal because the objective prioritizes a reliable user experience over small latency differences.

| Candidate | One install | CPU separation | Native provenance maintenance | Shared/remote fit | Simplicity | Sum |
| --- | --- | --- | --- | --- | --- | --- |
| A + managed HTTP | 5 | 4 | 5 | 5 | 4 | 23 |
| B + managed HTTP | 5 | 5 | 4 | 5 | 3 | 22 |
| Platform split + managed HTTP | 5 | 5 | 2 | 5 | 2 | 19 |
| Explicit provision + managed HTTP | 3 | 5 | 4 | 5 | 3 | 20 |
| A + per-harness IPC | 5 | 4 | 5 | 2 | 3 | 19 |
| A + in-process native render | 5 | 2 | 5 | 1 | 2 | 15 |

All candidates still fail the **complete acceptance evidence gate** until unrun target tests are supplied. Ranking A first authorizes further implementation research; it does not waive that gate. If macOS or Linux expose a distribution blocker, reassess the score and concrete setup alternative rather than silently dropping those platforms.

Suggested changes for the root agent to apply after B05:

- H03: promote exact upstream dependencies through the ordinary install flow; use module resolution and resolved-version checks; capture native notices and provenance. Add real `--omit=optional` engine CPU tests and missing/invalid binding diagnostics. Validate package-manager behavior on the supported platform matrix.
- H04: keep renderer source/hooks inside the official artifact, remove nested-install instructions, update package/source identities and lockfiles, and verify the packed artifact resolves the same dependency versions. No render-triggered downloads.
- H05/H10: make the shared managed process independent of its initiating caller's death; use an in-memory idle deadline that cannot fire with queued/in-flight work, plus explicit stop. Keep the socket as registry and report managed/manual mode. Define and test cancellation/admission behavior; do not imply JavaScript can safely interrupt an arbitrary native GPU command.
- H06: return precise `not-installed`, `unsupported-platform`, `native-load-failed`, `no-adapter`, `initializing`, `ready`, `version-conflict` and remote-unavailable states as appropriate; reprobe deliberately and show the selected endpoint without secrets.
- H07/H08: keep explicit remote selection from launching local GPU work; transmit self-contained GLB/capture data only; verify remote capabilities/build contract and report degraded fidelity at the existing engine boundary. Second-machine acceptance stays open until actually run.
- H11: fresh official-package CLI/MCP/native-agent flows; multiple installed versions; concurrent owner exits; idle expiry; device-loss restart; offline warmed-cache setup; no scripts; read-only install; absent GPU; actual material fixture fidelity; cold-start distributions. Bind receipts to source, packed candidate and dependency identity.

The current repository AGENTS.md lifetime guidance and mirrored lifecycle tests must be deliberately updated with the adopted shared-lifetime policy. Until B05/B06 decide it, this report does not modify those contracts.

## Status and remaining evidence

B01: baseline and requirements established; non-Windows target measurements remain unavailable. B02: published native contents/install mechanism/integrity inspected; provenance signature verification and complete binary notice inventory remain open. B03: two viable packed layouts measured on Windows, including failure/omission cases; full-package and other-platform qualification is outstanding. B04: all three local execution boundaries probed, owner-exit defect established; remote transport is loopback evidence only. B05: not yet independently reviewed. B06: recommendation supplied, decision not final.

No missing hardware or unrun acceptance test is counted as a pass. Research is sufficient to select a concrete local implementation candidate and to reject in-process rendering as the default for this codebase. It is insufficient to advertise seamless renderer installation on every supported platform or to mark the full packaging initiative complete.
