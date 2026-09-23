# Renderer architecture decision (B06)

Implementation follow-through: root optional dependencies and managed-service
changes are now in the checkout, with real local and cross-device material
evidence. The numbered requirements below record this decision's original gates;
they are not a current unfinished-work list. Real cross-device material/animation and bounded host/service checkout
acceptance are now recorded in the [September 23 receipt](2026-09-23-cross-device-rendering.md). Cold installed
platform qualification remains open in the [checkpoint](../plans/2026-09-22-progress-checkpoint.md).

Decision: proceed with the existing Three.js/Dawn renderer shipped inside the official Kiln artifact, exact upstream `webgpu` as an optional dependency, ordinary dependency resolution, and a managed local HTTP process. Keep explicit remote endpoints on the same render-port contract. No runtime downloads and no native imports in deterministic engine entrypoints.

Evidence: [two installed-layout prototypes and execution comparisons](2026-09-21-renderer-architecture.md), followed by [independent adversarial probes](2026-09-21-renderer-adversarial.md). Both viable layouts rendered on the measured Windows host. A companion package provided no measured footprint benefit; repacking platform binaries creates additional provenance/release work. Direct in-process use would expose harness globals and process lifetime to renderer internals. These results justify implementing this candidate, not declaring platform qualification complete.

The official package owns the service source, hooks, PNG support and version pins. Optional native installation preserves independent CPU workflows, but an install is not proof of GPU readiness. Resolve actual dependency versions; report installation/native-load/device readiness separately. Retain the separate source directory if useful internally, while removing the user's nested dependency-install requirement after fresh-package qualification. No technology rewrite or renderer-plugin ecosystem is needed for this decision.

The research requires explicit corrections to the previous plan:

1. Replace initiating-owner lifetime authority for managed services with bounded idle lifetime protected by queued/in-flight requests. Keep one socket registry. Initiating PID remains provenance; a client exit must not terminate work owned by other sessions. Manual service lifetime remains explicit. Test shutdown/restart and explicit stop. Update AGENTS.md and mirrored lifecycle contracts with this deliberately revised policy.
2. A timeout from an unknown listener does not establish service identity. Join only an authenticated/validated compatible health response. Include protocol/build/dependency compatibility in that response and preserve actual device/capture identity in view receipts. Stale or incompatible services fail visibly without killing another client's process.
3. Bound queue admission, cancel queued work when a client leaves, and distinguish discard of a result from interruption of an already-submitted native GPU command. Set resource budgets for render targets, geometry and decoded textures before claiming safe sustained service use. The existing request byte limit does not bound all decoded allocations.
4. Enforce self-contained GLB inputs before GLTFLoader resolves resources. Reject external buffer/image references; preserve supported embedded buffers and data resources within bounded decoding. Rendering an asset must not perform arbitrary remote resource fetches.
5. Qualify full installed Kiln, not the prototype CPU marker. Required matrix remains Windows x64, Linux x64, macOS arm64/x64 with explicit evidence gaps where unavailable. A second-device run is still needed for cross-device acceptance. Preserve notices and verify dependency provenance before release qualification.

H03-H11 own these implementation/acceptance gates. None of the additional adversarial defects is waived by selecting this architecture. GPU fidelity remains separate from structural QA; `captureViewsViaPort` remains the degradation owner with separate loop and artifact deadlines. Optional CPU degradation is disclosed; required GPU evidence fails.

Decision status: implementation selected, release acceptance open. Reconsider companion/platform packages only if the full supported-platform install, footprint or update measurements show a concrete benefit or blocker. Do not automatically switch execution backends after an error.
