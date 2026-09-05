# Kiln local release candidate

Local integration review on 2026-09-05. This report records the candidate,
its evidence and the limits of that evidence. It is not a publication announcement
or a comparative model ranking.

The [short-reference follow-up](results/short-references-2026-09-05.md) records the newer runtime and package checks. Earlier package receipts below apply to their original candidates.

## What changed

The agent can submit a program once, retain its immutable reference, read a small
source region and make exact edits. Camera requests reuse compatible evaluated
assets. The CLI can export the same chosen capture grid directly from the reference
with `--capture cameras.json --views chosen.png`. Source revisions survive local
server restarts; they do not depend on an MCP conversation session.

Custom mesh data, sampled equations, bends, twists, taper, displacement, sweeps and
lofts now have explicit ownership and export contracts. UV-preserving subdivision
and Boolean attribute preservation are opt-in. Cameras share world, asset and part
frames across render, inspection and animation, with bounded grids or separate
images and explicit fidelity reporting.

The website leads with a single station model and a real source-edit demonstration.
Its nine featured examples use verified Astra, Gemini and Muse credits. The warm,
varied homepage includes developer entry points and a plain-text agent reading guide. A new
submersible joins the selection; the tidal observatory and fire lookout tower are removed from the public
gallery and generated downloads, with source and evaluation history retained. The vessel,
canopy and instrument studies remain useful evaluation examples without being
presented as exceptional artwork. Source-bound provenance distinguishes independent
authoring, supplied-source refinement and maintainer teaching examples.

## Installation and platforms

End users can install a built tarball with Node/npm and generate a separate asset
workspace. Bun is only required to build Kiln. Setup copies project-local skills,
keeps existing harness authentication, and resolves temporary Node-manager links to
the durable executable. The [Mac-first installation guide](../install.md) covers
native Apple Silicon and Intel Node, optional native dependencies and CPU-first
setup. No global skill or harness configuration installation is required.

Native Mac CI jobs are configured, but no hosted Mac run has occurred. Windows and
Linux package receipts are recorded in the [platform matrix](platform-matrix.md).
Apple GPU/Metal operation remains unverified.

## Tested runtime candidate identity

The last verified immutable `@kiln/engine` 0.6.0 tarball has SHA-256
`0d457e8f8763730079da013abfa6662aadc02843f090fcae594c0f711399d16c`.
It was built with Bun 1.3.14 and packed with Node 22.23.1 / npm 12.0.1. Both Windows and Linux passed all 15 distribution checks on this exact artifact. The documentation-refreshed distribution has a separate companion archive/equivalence receipt, preserving this original tested hash. That comparison covers every archive member and requires unchanged production source, bundles, setup, plugin manifests, dependencies and skills; it does not claim new platform execution.
The three earlier supplied-source recertification runs used capsule
`833b9bf14468798640447d2ba98d16d1bcedaaff8ac8752d266881e29aaabb97`.
The intermediate 204f1a7d added CLI failed-capture diagnostics. The only later production source change is the Windows/Bun fd3 guard; standard Node does not enter it. The evaluator worker and all skills remain unchanged. Final CLI/MCP/agent bundles are identified below rather than described as byte-identical. Original model evidence retains 833b9bf1, and the new runtime receives actual Windows/Linux installed checks. See the [complete delta](results/runtime-delta-0d457e8f-2026-09-05.json).

| Component | SHA-256 |
| --- | --- |
| Build identity | `dffc31aa0b40c68acb7cfda3cd818d010a0fd1979cf604ac1a420be97913fe75` |
| Evaluator worker | `5a574c3be5f352c9d1c4bfd4c77dc184e202921bb2767b20dce8b467b69cf150` |
| MCP bundle | `776d049ab819ff898450320b59540b3d61c0460a6954d2db9c1aaabb7d7f0354` |
| CLI bundle | `4f70681d55901b2416babe9108b291e4a7ab2de462360f8d13bdd7084bea6126` |
| GPU service source fingerprint | `10f346ec6287c8d635dabe4668d72925080e6fe3d059dd7a9252f2694ce595c2` |

Reports written after this capsule was packed do not retroactively change its
contents. Later documentation and gallery records identify their actual source,
runtime and image hashes separately.

The owner's subsequent fifteen-attempt independent showcase batch uses the tested
`0d457e8f` package directly with current project-local skills. It is separate from
the earlier recertification and matched pilot. Completed [Astra audits](results/astra-showcase-audit-2026-09-05.json)
and the [Muse batch](results/showcase-muse-0d457e8f-2026-09-05.md) record image cells,
exact literal-edit replay, exported artifacts and failures. No full source was
resent through MCP in those five new runs. Canyon Funicular did re-import a local
file during error recovery, so import-once is not claimed for every attempt.
Both Gemini lanes are complete: [five architectural/mechanism studies](results/gemini-new-assets-lane-a-2026-09-05.md)
and [five additional assets](results/fresh-agy-batch-b-2026-09-05.md).
[Final curation](results/showcase-curation-2026-09-05.md) accepted ten of the fifteen
attempts. All failed drafts, rejected edits, budget limits and excluded designs
remain recorded in the [atomic ledger](../plans/showcase-expansion-2026-09-05.md)
and linked receipts. Alpine completed one visual refinement after its compile
repair; no claim of two visual passes is made for that run.

## Dogfooding and fixes

The [12-run pilot](pilot-2026-09-05.md) retained all attempts, including setup and
budget failures. It compared matched conditions within each available route;
it cannot isolate harness quality from model quality. A fixed-model cross-harness
comparison was unavailable through the existing authenticated subscriptions.
No older model, Claude, Omen, paid API fallback or credit purchase filled that gap.

Independent final-workflow authoring produced a [research vessel with Astra](results/q1-astra-codex.md),
a [canopy with Gemini/Antigravity](results/q1-gemini-agy.md), and an
[instrument with Muse/OpenCode](q1-muse-opencode.md). Additional
[Muse optical curation](curation-muse-optical.md) and the Astra submersible are
separately attributed creative runs. They are not extra matched benchmark cells.

Those runs exposed actionable defects and friction:

- Windows subprocess cancellation could settle with the wrong outcome; process
  completion is now recorded before termination can trigger a competing event.
- A generated `uv`/`uvs` typo received only a generic rejection. The evaluator now
  exposes a closed, source-free repair hint for undeclared variables.
- Small gears hit absolute default radii and, once corrected, exposed duplicated
  crown vertices. The catalog and bounded diagnostic explain the radius order;
  generated gears now have nondegenerate faces, including with no bore.
- Numeric strings in a versioned camera triggered misleading legacy-union errors.
  The error now identifies the intended shot and expected numeric value; accepted
  inputs and the advertised schema are unchanged.
- Astra wasted its export time copying image base64. The new capture-file CLI
  option and updated skills save the actual chosen PNG directly.
- The GPU offscreen path bypassed display tone mapping and clipped highlights.
  Its public Three.js output-target path now preserves HDR until ACES/exposure and
  sRGB conversion. Nine actual GPU color patches agree with an independent
  reference within one byte. The legacy beauty camera and returned beauty-image
  mapping were also repaired. [GPU evidence](results/gpu-display-output.md).

Fresh supplied-source recertification on all three required routes completed after
these shared changes. All three imported source through the CLI and made later
calls by reference, with no full source in MCP requests. Literal edit replay and
exported artifacts were independently checked.

| Route | Final check | Recorded result |
| --- | --- | --- |
| Astra / Codex | [Submersible refinement](results/astra-capture-recert-833b9bf1-2026-09-05.json) | 5 MCP calls; arm mount moved 0.06 m; useful part-relative views and direct chosen-grid export; exact Node GLB reproduction |
| Gemini / Antigravity | [Canopy refinement](results/q1-gemini-recert-833b9bf1.md) | 9 MCP calls, 7 MCP image cells; only serviceOffset 0.35→0.50 changed; all 20 assembly descendants retained; CLI PNG byte-identical to the edited MCP image |
| Muse / OpenCode | [Instrument refinement](results/q1-muse-recert-833b9bf1.md) | 13 MCP calls, 18 image cells including CLI; real small gear replaces decorative teeth; exact edit replay; corrected GPU and animation reviewed |

Each run completed with exit 0 within its declared budget. Muse's initial CLI
recipe used a part name that did not exist. Its exact-path, part-relative retry
succeeded before it selected a world-frame camera. The final CLI now exposes the
bounded tool error instead of hiding the cause behind “returned no image.” This
was a selection/diagnostic issue, not a part-relative camera defect. The gear-axis
discovery friction is retained; the geometry guide now makes that orientation
explicit.

These checks are distinct from independent authoring and do not replace or relabel
earlier traces, setup failures, the interrupted earlier Agy summary, or the timed-out
creative Astra run.

## Engineering and visual evidence

The final [Linux integration gate](results/linux-fullgate-2026-09-05.md) passed **1,720 tests**, two existing skips and zero failures: 47,174 assertions across 194 files in 165.57 seconds. Coverage 95.60% functions/92.55% lines exceeds unchanged 92%/91% thresholds. Toolchain, frozen install, typecheck and lint passed; lint retains 14 warnings and 11 informational findings. The ordinary CI test command ran without extra skips, retries or a custom coverage merge.

The first Linux gate found an experimental-observer request-accounting defect. Explicit JSON-RPC request IDs now preserve each reservation across SDK dispatch; three focused tests/15 assertions passed on both platforms before the complete rerun. This script-only fix did not change shipped engine bundles.

The Windows/Bun fd3 guard passed 13 focused tests/71 assertions and both Node distribution smokes. Repeated Windows GLib native crashes remain unresolved; the successful Linux gate is not a claim that the Windows native fault was repaired. Earlier failed logs and the earlier gate results retain their actual scope in linked reports.

All 63 gallery source/GLB pairs agree with their build records. Every gallery
poster was freshly rendered from its downloadable GLB at 1024 × 1024, with the
same gallery-studio-v1 recipe: exposure 0.9, neutral #747474 background and consistent framing. The 560 × 560 thumbnails keep
the whole image. Source, artifact, image and resolved-camera receipts accompany
each asset; the home hero keeps its separately recorded 4:3 view. Three reviewers
inspected the prior 53 PNGs in disjoint batches; the maintainer inspected all ten
accepted additions in their final square presentation. This is presentation review, not blanket
approval of every asset's construction or artistic quality.

The final focused example/provenance checks passed 69 tests / 578 assertions,
including exact expected geometry advisories and header-or-sidecar credits.
Site TypeScript, formatting, asset verification and production build pass. The
rebuilt gallery has square cards, aligned credit rows and matching backgrounds.
Browser review confirmed 63 cards, the requested exclusions, complete thumbnail
silhouettes, working interactive rendering, source/GLB links and provenance
details. The narrow-screen detail layout gives the model its own viewport and
places statistics and authorship beneath it, so they cannot cover the model.

A subsequent acceptance audit found low-contrast informational labels and missing
detail-page revision history. Twelve text selectors now meet at least 5.79:1
against their declared backgrounds. Four recorded examples expose brief summaries
and ten exact source snapshots in a keyboard-accessible dialog; missing histories
remain explicit. The build validates current-source identity and every snapshot
before publishing any history files. All ten HTTP downloads matched their hashes,
and desktop/mobile interaction was observed. These are website changes; the
installed CLI, MCP, evaluator worker and skills retain their tested package identity.
See the earlier [history and contrast review](results/gallery-history-and-contrast-2026-09-05.md).
The expanded collection now exposes **14 histories and 46 snapshots**. The final
[browser/build review](results/final-gallery-review-2026-09-05.md) includes
235 hash-checked HTTP downloads and the new rover's narrow-screen history dialog.

The [implementation plan](../plans/2026-09-05-engine-and-oss-experience.md) contains
the package acceptance ledger, and the [atomic remaining-task list](../plans/remaining-work-audit-2026-09-05.md)
separates completed local work from outstanding execution checks. The [site review](site-review.md) records actual
browser measurements and their limits; the [working-tree inventory](results/working-tree-inventory-2026-09-05.md)
distinguishes the 41-entry starting diff from this implementation.

## Decisions and remaining limits

The owner has explicitly deferred native Apple Silicon/Intel Mac execution to future community contributions. Genuine 200% zoom, reduced-motion-on, physical mobile review and the unavailable same-model cross-harness comparison are recorded follow-ups rather than local-candidate blockers. No result or support guarantee is inferred from that deferral. Runtime/platform checks, final visual/build review and the additional authoring batch are complete. The documentation-only archive is accompanied by its own equivalence receipt.

Use immutable source references plus separately keyed build and capture caches.
Keep source viewing and atomic editing separate. Application storage solves reuse
without an ambiguous global current asset or dependence on transport sessions.
Ordinary JavaScript functions are the reusable-part mechanism; an extra modeling
language is not justified by this evaluation.

General bevel is not adopted. Restricted shell/remeshing trials and the implicit
surface API remain experimental, with measured failure cases. Loft/sweep caps do
not prove freedom from self-intersections. Source handles do not promise identical
GLB bytes across different JavaScript runtimes. A terminable worker and V8 heap cap
are not an operating-system sandbox or a total native-memory bound.

Browser review covers local desktop behavior, responsive layouts, visible keyboard
focus, lazy GLB loading and a controlled WebGL fallback. Genuine 200% browser zoom,
reduced-motion-on behavior and physical mobile performance remain unverified.
Warm-cache localhost timings are not internet or mobile benchmarks.

See [migration notes](../migration.md), [geometry decisions](../experiments/geometry-frontier.md),
[additional geometry cases](../experiments/geometry-acceptance.md),
[implicit resolution trials](../experiments/implicit-acceptance.md),
[alias trials](../experiments/program-aliases.md), and
[reusable-part trials](../experiments/reusable-parts.md).

Public release, npm publication, commits, pushes and deployment remain separate
from this local review.
