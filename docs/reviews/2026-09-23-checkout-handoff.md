# Unified Kiln checkout handoff

The unified checkout is ready for owner review. This is a precommit handoff with
explicit limitations, not an installed-package or V1 release qualification.
No package, commit, push, publication or deployment was performed for this closeout.

Subsequent owner-requested [blind onboarding and game asset trials](2026-09-23-blind-game-followup.md)
are tracked separately. Their documentation corrections and interpreter-check fix
postdate the manifest below; it remains the original closeout snapshot.

## Delivered behavior

- CLI/MCP authoring starts without a category. Host requirements remain bound to
  source lineage; recipes and descriptive labels cannot weaken them. Explicit old
  data conversion preserves originals and names policy differences for review.
- `kiln_discover` and CLI `discover` share offline relevance retrieval, exact
  contracts, related results and bounded output. No local model, embedding service,
  API key or inference download is required. Retired names fail explicitly.
- Shared primitives, geometry operations and assemblies have corrected transform,
  winding, scale, ownership, attribute, allocation and export contracts. New
  inspection capabilities expose part lists, surface measurements, protected-part
  differences and sampled animation bounds. They do not certify all intended joints.
- The official-package design includes renderer source and ordinary optional native
  dependencies, with one managed local service and explicit remote selection.
  Readiness, identity, cancellation/admission and CPU/GPU fidelity are explicit.
  Source-checkout behavior is tested; the final installed distribution is not.
- Strands is optional. Its native tools call the shared registry directly, with
  retained programs, bounded images and an exact-reference finish. Native workflow
  context lives outside shared skills and never enters generated CLI/MCP workspaces.

## Candidate identity and validation

Base HEAD: `b81cfd4caed64bd90547ff83b4e513e59a1d4913`.
The worktree is intentionally dirty; HEAD alone does not identify this candidate.

Runtime identity:
`sha256:18f0f0edca1e37e73db6e3e77415a7645fa6615563617a718feae0db012ba95e`.
All five bundles in `dist/build.json` match that source/dependency-declaration
identity and their recorded SHA256 bytes. The closeout independently recomputes
those values without rebuilding. Documentation-only closeout changes do not change
the runtime identity.

External evidence root:
`C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22`.

| Evidence | Qualified scope |
| --- | --- |
| `mesh-data-final-gate.log` | Pinned toolchain, skills, typecheck, lint, runtime build and coverage: 2,642 pass, two skip, zero fail; 95.16% functions / 92.21% lines, above unchanged 94% / 92.10% ratchets. |
| `final-checkout-gate-3fe733.log` | Previous full gate and 73 passing renderer-service tests. Renderer source is unchanged in the current identity; this evidence is reused. |
| `mesh-data-diagnostic-review/receipt.json` | Current compiled CLI and standalone MCP reject nonfinite mesh inputs with safe advice, preserve the valid corrected GLB, and keep forged exceptions generic. |
| `native-skill-setup-boundary-review/receipt.json` | Fresh workspace with all shared skills and actual CLI/MCP excludes the native finish protocol. |
| `final-candidate-verification.json` | Independent current source/bundle identity check and document/evidence consistency checks; no new runtime build or provider call. |
| `final-candidate-manifest.json` | SHA256 inventory of nonignored checkout files, tracked deletions, all five built bundles and selected external qualification receipts. Records base HEAD and Git status. |

The manifest is an observed checkout snapshot, not an instruction to stage every
file. Existing user work, research artifacts and historical QA assets remain
untouched. Dependency directories, caches and secrets are not publication inputs
or part of this snapshot; a later clean installation must qualify actual resolved
dependencies. The manifest is stored outside the checkout to avoid a self-hash
cycle. Its own digest is delivered separately. Any later file change invalidates
the corresponding snapshot entry; a future commit/package must be reconciled to it.

The two test skips concern POSIX file permissions on Windows. Green checks prove
their tested contracts, not asset quality, every model/provider, or every platform.

## Dogfood and remaining quality limits

The [main campaign](2026-09-22-opencode-main-campaign.md) completed 36 authorings
and 72 requested edits. The [frozen held-out campaign](2026-09-23-heldout-campaign.md)
completed 12 authorings and 24 edits. Failed attempts, original sources, images,
traces and independent reviews are retained. Scored artifacts were not repaired
by the reviewer; historical gallery assets remain unvetted showcases.

Native13 completed generation and both refinements on the official Google Gemini
3.8 Flash/high-thinking route in 33 / 15 / 18 model calls. Its application request
snapshots contain at most one image each. Exported GLBs match reviewed GPU inputs;
the baseline's nonpersisted in-loop flag remains disclosed. Earlier partial and
failed routes remain visible. One changed model/provider cannot isolate the benefit
of context changes. See the [native audit](2026-09-23-native-trace-audit.md).

The campaign establishes usable, varied authoring/edit workflows and exposes real
limits. It does not establish a controlled overall quality improvement percentage.
Models still omit mounts, overlook interfaces, misunderstand motion and sometimes
modify protected parts or report nominal dimensions as measured facts. Shared
guidance and inspection help, but do not make those original assets pass. Later
guidance-only changes have no controlled fresh-model benefit claim.

Other explicit limits:

- Discovery can return noisy candidates for unsupported requests. Fresh supported
  recipe queries hit the first five, but the judgments were informed and small;
  there is no semantic abstention or optimal-ranking claim.
- QA deliberately reports incomplete coverage for unsupported requested checks.
  Static part-volume, sampled animation and selected surface witnesses are not
  general intra-mesh intersection, physical support, passage or motion certificates.
- General shell, selected-edge bevel and remesh promotion was declined on measured
  limits. Existing profile/sweep/CSG alternatives remain available. Frame-attachment
  and extra shape wrappers were not justified. Stairs remain geometry without
  landing sockets, as Discovery states; named local assembly frames are the existing
  composition route. [Promotion decisions](2026-09-23-helper-promotion-decisions.md).
- Cline CLI/Next's tested MCP image conversion remains an upstream limitation.
  The documented CLI export plus native image-reader route works; the tested Legacy
  extension preserves MCP images. Kiln does not alter standard image responses.
- Real local/remote GPU evidence covers the measured Windows/Linux NVIDIA devices.
  A startup outlier and broader hardware/device-loss behavior remain limitations;
  SSH-forwarded rendering does not establish public HTTP authentication acceptance.

## Atomic later gates

The ledger retains all 136 original requirements: **115 implemented, eight complete,
one research evidence-ready, eleven in progress and one pending**. These are
different kinds of dispositions, not an acceptance percentage. All 255 findings
and ten audit gaps have evidence-backed checkout decisions in the
[finding ledger](2026-09-21-finding-task-ledger.json). `V09` closes triage and bounded
shared repairs; it does not close the recorded authoring-quality limitations.

| Task | Remaining acceptance after this handoff |
| --- | --- |
| D18 | Low-power and cold installed offline Discovery; retain unsupported-query limits. |
| S09 | Broader live provider/route qualification before advertising it beyond offline contract support. |
| L07 | Negative retired-path checks on the final installed package. |
| B02 | Complete native notice inventory and verify release provenance; research supports the chosen dependency strategy. |
| H03 | Full native dependency/platform installation matrix, optional omission, disabled scripts, read-only and failure cases. |
| H04 | Cold official package resolves renderer source/hooks/native dependencies without a nested manual install. |
| H11 | Cold installed CLI/MCP/native-to-PBR flows and realistic platform/lifecycle/performance qualification. |
| V03 | Preserve the original installed-package campaign clause; completed checkout runs are not silently relabeled. |
| V06 | Full package/workspace gates when packaging is authorized; checkout gates already pass. |
| V08 | Package digest and later commit reconciliation; current tree/bundle evidence is delivered here. |
| V10 | Preserve final installed-candidate acceptance separately from the completed frozen checkout campaign. |
| N03 | Actual cold installed minimum/newer Node and Debian/Cline boundaries; Windows/CachyOS checkout results are distinct. |
| N04 | Complete Debian/classroom guidance after those actual installed checks; supplied unnamed community feedback is already credited. |

No additional authoring campaign, provider survey, gallery repair or category API
is scheduled for this checkout closeout. Reopen implementation for a demonstrated
shared blocker. Package/install/release work remains visible and requires its own
authorized phase; this handoff does not grant publication authority.
