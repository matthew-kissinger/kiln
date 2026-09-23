# Cross-device material and animation rendering, September 23

H09 has checkout evidence for real Windows-local, Linux-local and Windows-to-Linux
rendering. This completes the bounded second-device comparison. It does not qualify
a cold package install, public HTTP authentication, cancellation or arbitrary GPUs.

## Inputs and actual hosts

Runtime: `sha256:41212c7f1f8331430ac0b11b187866c753e225dc4bdc647e5d2b8948bd02290a`.
The Windows RTX 3070 used Dawn/D3D12, driver 32.0.16.1074. The connected Linux
laptop used CachyOS 7.2.0-1-cachyos, Node 22.23.2 and GTX 1660 Ti Max-Q through
Dawn/Vulkan, NVIDIA 610.57.04. All 591 selected checkout inputs were hashed and
verified after transfer. Dependencies were reused from the earlier isolated Linux
checkout; this was a source transfer and ordinary CLI execution, not packaging.

The fixtures were retained fresh campaign sources: main31's robot at stage 2 and
main33's grained handrail at stage 1. The robot's known gait defects remain. These
are transport fixtures, not golden assets or evidence of accepted asset quality.
No historical gallery assets were edited or regenerated.

The Linux service listened on loopback port 18129. A task-owned SSH forward exposed
it on Windows loopback port 18130. The ordinary compiled CLI selected this endpoint
with `--render-port`; no special rendering implementation was used. Windows-local
comparison used the same CLI with its local service on port 18131. SSH authenticated
the network hop; the loopback renderer did not require a separate HTTP token.

## Results

- Nine Walk phases from 0 through 1 in eighths have identical derivative GLB hashes,
  pose bounds, cameras, duration and frame times across all three routes. There are
  nine distinct posed inputs. Every frame has a full-material GPU receipt with
  validated camera echo and no degradation. Derivative `exactArtifact: false`
  remains visible and is not relabeled as canonical artifact identity.
- The handrail exports are byte-identical across all three routes. All material
  receipts identify the actual GPU and report no fallback.
- Linux-local and Windows-to-Linux decode to identical pixels for both sheets.
  PNG encoding bytes differ. The animation sheet is 784 × 784; the material sheet
  is 1168 × 780.
- Linux versus Windows GPU differences are small but nonzero: animation RGBA mean
  absolute channel error is 0.00444/255, maximum 31, with 0.322% of channels changed;
  material mean is 0.00219/255, maximum 23, with 0.103% changed. Visual inspection
  confirmed consistent motion and materials. This is a measured comparison of these
  fixtures, not a universal pixel-equivalence guarantee.

After stopping only the verified task-owned SSH process, the same explicit endpoint
was unreachable. `--render gpu` exited 1 with `Required GPU render failed: render
service http://127.0.0.1:18130 is absent`. `--render auto` exited 0 with
`delivered: geometry-flat`, `materialFaithful: false`, CPU renderer identity and the
same explicit degradation reason. Neither silently selected a local GPU.

## Retained proof and limits

Evidence lives in
`C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/remote-animation-review/`:
`input-manifest.json`, `remote-source-verification.json`, `remote-health.json`,
`parity.json`, the three route receipts and images for each fixture,
`unavailable-forward-receipt.json`, and the raw unavailable-endpoint CLI outputs.
The comparison driver is `../compare-remote-animation.mjs`.

## Reconciled host/service acceptance

Reviewing the existing implementation and the current passing gates also closes
H05, H07 and H08 for the checkout. This is reconciliation of existing proof, not
three new product features or a claim that SSH tests HTTP authentication.

| Task | Evidence covering its stated acceptance |
| --- | --- |
| H05 | Actual Node process lifecycle tests cover concurrent cold starts, compatible reuse, explicit stop, prompt client exit and service survival. The real HTTP service fixture kills its initiating owner with active and queued work, cancels one waiting client, completes the others and exits only after idle. CPU/startup/GPU-failure behavior is covered by the host gate and actual render trials. |
| H07 | Shared client tests reject contradictory or missing protocol/build/dependency/capture identities and unknown timed-out listeners. Authentication selection, redirect rejection and explicit remote routing are covered in the hardening gate. Actual unavailable-endpoint results above confirm no local GPU substitution. |
| H08 | Service tests bound admitted uploads, queued work, decoded images/buffers and scene-graph expansion, reject external GLB resources before loader dispatch, release disconnected queued jobs, and retain active native work until settlement. Client deadline tests close an already dispatched HTTP response. Actual material/animation receipts above qualify fidelity for the measured devices. |

These tests are in `render-service/test/hardening.test.mjs`,
`src/__tests__/render-service-hardening.test.ts`,
`src/__tests__/render-service-lifecycle.test.ts` and related view/cache tests.
The checkpoint retains the 73-test service gate and current 2611-test engine gate.
The [host receipt](2026-09-21-renderer-host-hardening.md) gives the earlier focused
203-test command and explains which fixtures simulate GPU work. Actual GPU
termination, arbitrary remote-network recovery and supported-platform installed
qualification are not implied. H03/H04/H11 retain their installation/release gates.
No engine implementation change was necessary for this qualification.
