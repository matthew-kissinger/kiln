# Repository size reduction and site-asset migration

A fresh clone of this repository costs 440 MB and 79 seconds. The owner noticed
this after open-sourcing the project, and the cause is site and social media
material carried in git history rather than anything the tools need. This plan
removes that material, moves the gallery posters to Cloudflare R2 without
changing their bytes, and fixes the setup rough edges found while installing
Kiln as an MCP server from a clean checkout.

This document is the reference for that work. Each task carries a state. Any
deviation from the invariants below is a defect in the execution, not a
judgement call to make mid-flight.

## Measured baseline

Every number here was measured on 2026-09-10 against `main` at `5b903fb`. They
are the comparison set for verifying the work, and they should not be re-derived
from memory later.

| Measurement | Value |
| --- | --- |
| Full clone, wall clock | 79 s |
| Full clone, on disk | 440 MB (227 MB `.git` + 214 MB checkout) |
| Packed history | 226.06 MiB, 3206 objects, 2244 blobs |
| Uncompressed history | 355.4 MB across 176 commits |
| `git clone --depth=1` | 54 s, 325 MB |
| `git clone --filter=blob:none` | 36 s, 325 MB |
| `--depth=1 --filter=blob:none --sparse` | 1 s, 616 KB |

History bytes by directory:

| Path | History | Checkout | Notes |
| --- | --- | --- | --- |
| `assets/video/` | 171.3 MB | 69 MB | 37 blobs; four stored revisions of `kiln-launch.mp4` (27, 35, 38, 43 MB). Referenced by no file in the repository. |
| `examples/renders/` | 117.1 MB | 107.9 MB | 84 PNG at 1024x1024, average 1316 KB; 4 GIF at 1.9 MB; 83 JSON receipts |
| `dist/` | 29.2 MB | 11 MB | 22 blobs of committed build output |
| `assets/gallery/` | 9.3 MB | 7.4 MB | README-facing grid and three GIFs |
| everything else | 28.5 MB | — | source, docs, example programs |

Plugin install cost, measured by installing from GitHub and inspecting
`~/.claude/plugins`:

| Component | Size |
| --- | --- |
| Marketplace clone | 325 MB |
| Plugin cache, repository files | 214 MB |
| Plugin cache, `node_modules` (189 packages, installed automatically) | 414 MB |
| Total for one install | 953 MB |

The repository is counted twice per install, once in the marketplace clone and
once in the versioned cache copy. 539 MB of the 953 MB is repository content.
The whole `~/.claude/plugins` directory measured 958 MB during the check; the
extra 6.3 MB is the pre-existing `claude-plugins-official` marketplace and is
not attributable to this repository.

## Targets

| Outcome | Now | Target |
| --- | --- | --- |
| Uncompressed history | 355.4 MB | ~29 MB |
| Full clone wall clock | 79 s | a few seconds |
| One plugin install | 953 MB | ~480 MB |

The residual 414 MB of `node_modules` is inherent to the dependency set and is
not in scope.

## Invariants

These must hold at every checkpoint. A task that would break one is wrong.

| ID | Invariant | How it is checked |
| --- | --- | --- |
| I1 | Poster PNG bytes never change | Each file's sha256 still equals the `imageHash` in its `examples/*.provenance.json`. All 83 provenance files carry a `posterReceipt`, and the receipt also names the capturing GPU and driver, so a re-encode would silently void a provenance claim the project makes publicly. |
| I2 | `dist/mcp-server.mjs` at HEAD is byte-identical to a fresh build | `bun run build:runtime` leaves `git status` clean. This held at baseline and must keep holding. |
| I3 | The MCP server exposes 13 tools | `tools/list` over stdio returns 13 for `kiln@0.6.0` on protocol `2025-06-18`. |
| I4 | The README video keeps playing | The `user-attachments` URL on README line 16 is GitHub CDN content outside the git object database. It must remain the README's video source and must never be repointed at an in-repo file. |
| I5 | The gallery site still verifies | `site/scripts/verify-assets.mjs` passes, including its poster hash checks. It runs in `pages.yml`. |
| I6 | Tests and lint pass | `bun run test` and `bun run lint`. Lint is an error-level gate in CI. |
| I7 | Plugin installs keep resolving dependencies | `package.json` and `bun.lock` must both remain at the repository root. Claude Code runs `bun install --frozen-lockfile --ignore-scripts` only when both are present; committed `dist/` is required because no build step ever runs during an install. |

## Decisions

| ID | Decision | State |
| --- | --- | --- |
| D1 | Local archive path for the video | Open; default `~/kiln-media-archive/` |
| D2 | R2 bucket name and custom domain | Open; default bucket `kiln-assets`, domain `assets.kilnstudio.tools` |
| D3 | Move `assets/gallery/` to R2, or keep in repository | Open; default keep, so the README stays self-contained |
| D4 | New write target for `scripts/hero-shots.ts` and `scripts/anim-gifs.ts`, which currently write into `examples/renders/` | Open; default a gitignored local directory plus a separate upload step |
| D5 | Force-push approval | Deferred to the moment of pushing, task 3.11 |

## Phase 0 — Preserve

Nothing here is destructive. It runs first because the owner intends to post the
launch video to LinkedIn and an AI game development subreddit the same day.

| ID | Task | State |
| --- | --- | --- |
| 0.1 | Create the archive directory outside the repository, per D1 | Done |
| 0.2 | Copy `assets/video/` to the archive: `kiln-launch.mp4` 43 MB, `gallery-take.mp4` 10 MB, `showcase/` 15 MB, poster 1.3 MB | Done |
| 0.3 | Verify every copied file by sha256 against its original | Done |
| 0.4 | Confirm the README `user-attachments` video URL resolves independently of the repository | Done |
| 0.5 | Take a `git clone --mirror` backup to a safe location | Done |
| 0.6 | Verify the mirror: commit count and pack size match the baseline | Done |
| 0.7 | Record HEAD sha, commit count and pack size for post-rewrite comparison | Done |
| 0.8 | Confirm fork count, open PR count and star count with `gh`, establishing the real blast radius | Done |

## Phase 1 — Reductions that need no rewrite

Independently shippable. Task 1.1 alone takes a clone from 79 s to 36 s.

| ID | Task | State |
| --- | --- | --- |
| 1.1 | Document `git clone --filter=blob:none` as the recommended clone in `README.md` | Done |
| 1.2 | Document the same in `docs/install.md` | Done |
| 1.3 | Verify links and rendering are unaffected | Done |

## Phase 2 — Site assets to Cloudflare R2

Additive until task 2.8. The posters move byte-for-byte, which is what keeps I1
intact; this is the reason the plan uploads rather than optimizes.

| ID | Task | State |
| --- | --- | --- |
| 2.1 | Create the R2 bucket, per D2 | Done |
| 2.2 | Configure public access and the custom domain, including DNS | Done |
| 2.3 | Upload the 84 poster PNGs byte-for-byte, with no re-encode | Done |
| 2.4 | Upload the 4 GIFs | Done |
| 2.5 | Verify each uploaded object's sha256 equals the local file's | Done |
| 2.6 | Verify each poster's sha256 equals the `imageHash` in its provenance sidecar. This is the I1 gate | Done |
| 2.7 | Verify CDN URLs return 200 with correct `content-type` | Done |
| 2.8 | Repoint `docs/examples.md` at absolute CDN URLs | Done |
| 2.9 | Update `site/scripts/verify-assets.mjs` to fetch posters, preserving the hash check, with a local cache so CI does not depend on network availability | Done |
| 2.10 | Audit and update `site/scripts/build-example-poster.mjs`, which reads `examples/renders` | Done |
| 2.11 | Update the write targets in `scripts/hero-shots.ts` and `scripts/anim-gifs.ts`, per D4 | Done |
| 2.12 | Run `verify-assets.mjs` locally; it must pass | Done; green on CI run against PR #63 |
| 2.13 | Run `bun run test` and `bun run lint`; both must pass | Done |
| 2.14 | Push to a branch and confirm `pages.yml` passes, before any rewrite | Done; green on CI run against PR #63 |
| 2.15 | Repoint `site/scripts/build-assets.mjs`, which reads posters through a `RENDERS` constant and scrapes poster hrefs out of `docs/examples.md`. Added during execution: a literal search for `examples/renders` did not find it | Done |
| 2.16 | Extract the poster source into `site/scripts/posters.mjs` so the build and the verifier share one fetch-and-cache path. Added during execution | Done |
| 2.17 | Add `scripts/upload-posters.mjs` to publish `.posters/` to the bucket, refusing any image whose hash disagrees with an existing receipt. Added during execution | Done |
| 2.18 | Fix `src/__tests__/examples.test.ts`, whose GIF check matched a repository-relative `src=` attribute. Added during execution: this was a regression from task 2.8 | Done |

## Phase 3 — History rewrite

The only irreversible phase. One pass, never two: each rewrite invalidates every
commit sha, so batching all removals into a single pass costs contributors one
disruption instead of several.

| ID | Task | State |
| --- | --- | --- |
| 3.1 | Install `git-filter-repo`. `pipx` and `pip3` are both absent on this machine, so it came from the distribution package instead: `pacman -S git-filter-repo`, version 2.47.0-3 | Done |
| 3.2 | Commit all Phase 1 and Phase 2 changes first, so the rewrite carries them | Done; state was stale. The shipped rewrite demonstrably carries them -- corrected 2026-09-10 |
| 3.3 | Re-verify fork and PR counts immediately before proceeding | Done; 0 forks, 0 open pull requests, 0 open issues, 21 stars, unchanged from the Phase 0 reading |
| 3.4 | Add `.gitignore` guards for the removed paths | Done; `examples/renders/*.png`, `examples/renders/*.gif` and `assets/video/` are ignored, inert while the files are still tracked and effective the moment 3.5 removes them |
| 3.4a | Move the render-existence assertions off `readdir`. Added during execution; resolved by splitting the check across the two layers that can each honestly make it. See the Phase 3 record | Done |
| 3.5 | Single `git filter-repo` pass removing `assets/video/`, `examples/renders/*.png` and `examples/renders/*.gif` | Done in rehearsal; see the Phase 3 rehearsal record |
| 3.6 | Handle `dist/` separately. `filter-repo` removes a path from all history and cannot retain only the newest blob, so purge `dist/` entirely and re-add the current `dist/` in one fresh commit, leaving it stored once | Done in rehearsal; see the Phase 3 rehearsal record |
| 3.7 | Verify `dist/mcp-server.mjs` at the new HEAD is byte-identical to the pre-rewrite file, then that `bun run build:runtime` still leaves the tree clean. This is the I2 gate | Done in rehearsal; see the Phase 3 rehearsal record |
| 3.8 | Verify pack size, commit count, and that HEAD content matches the pre-rewrite checkout except for removed paths | Done in rehearsal; see the Phase 3 rehearsal record |
| 3.9 | Run `bun run test` and `bun run lint` on the rewritten tree | Done in rehearsal; see the Phase 3 rehearsal record |
| 3.10 | Clone from the local rewritten repository; record time and size | Done in rehearsal; see the Phase 3 rehearsal record |
| 3.11 | Force-push. Requires explicit approval at this moment, per D5 | Done; see the Phase 3 execution record |
| 3.12 | Clone from GitHub; record the real-world time and size against the targets | Done; see the Phase 3 execution record |
| 3.13 | Confirm `ci.yml` and `pages.yml` are green on the new `main` | Done; see the Phase 3 execution record |
| 3.14 | Re-validate the plugin path end to end: marketplace add, install, `tools/list` returns 13, then uninstall and clear the cache. Mandatory because 3.6 changed how `dist/` reaches HEAD. This is the I3 and I7 gate | Done; see the Phase 3 execution record |

## Phase 4 — Setup and error-legibility fixes

Found by installing Kiln from a clean checkout and driving its MCP server. These
are independent of Phases 0 to 3 and can ship at any time. The engine itself was
sound throughout: a clean-room workspace authored, validated, rendered and saved
a 96-triangle workbench, and a separate CLI process resolved the same
content-addressed ref and reused the build.

| ID | Task | State |
| --- | --- | --- |
| 4.0 | Independently reproduce findings 4.5 to 4.9 before editing. They came from a delegated run and are not yet personally confirmed | Done; all nine reproduced 2026-09-10 against `dist/mcp-server.mjs`. See "Phase 4 verification" |
| 4.1 | `--harness claude` writes skills to `./skills/`, so the harness registers none of them; they work only because `CLAUDE.md` instructs the agent to read them | Confirmed, then superseded. The either/or in the original wording is wrong: `.claude/skills/` serves only Claude, while `.agents/skills/` serves codex, opencode, hermes and agy. Rescoped into Phase 7 |
| 4.2 | `kiln_render` reports only "Generated asset execution was rejected." on a syntax error, while `kiln_validate` on the same source reports `Syntax error: Unexpected token (1:48)`. Surface the underlying message | Done; `runRenderViews` and `runScreenshot` now append the host-side acorn diagnostic. Verified: render reports `Syntax error: Unexpected token (1:48)`, matching validate. Safe because that parse precedes execution, so nothing crosses the evaluator boundary |
| 4.3 | The same rejection for an unknown helper never names the identifier. Name it and point at `kiln_list_primitives` | Done, within the boundary. The advice now points at `kiln_list_primitives`; the identifier is still not named, because only the sandboxed exception carries it and this module's contract forbids that. 4.9 names it from the host-side parse instead |
| 4.4 | The MCP server sends an empty `instructions` field, so a client reading only `.mcp.json` gets 13 tools with no indication that `programRef` should be reused rather than re-sending source | Done; `instructions` is 1,776 characters, about 354 tokens, verified delivered in the initialize result and guarded by `src/__tests__/mcp-instructions.test.ts` |
| 4.5 | `.mcp.json` records an absolute `node` path, which breaks for `nvm` users after `nvm use`. `--repair` fixes it; `START.md` frames repair as relocation-only | Done; `START.md` now says repair is needed after a replaced Node as well as a move, and explains that the manifest pins the interpreter the preflight validated |
| 4.6 | `scripts/create-workspace.mjs` exits 0 on a usage error and names `kiln-init`, which the caller did not invoke | Refuted and closed. Measured without a pipe: no args exits 1, `--bogus` exits 1, `--help` exits 0; `kiln-init` is a real `bin` entry. The original finding read `$?` from a piped command |
| 4.7 | `START.md` offers no copy-pasteable first command | Done; a fenced `cd` plus launch command, and a second block for repair, both carrying the workspace's own absolute path |
| 4.8 | Corrected: `qaReport` carries neither `materialCount` nor `drawCalls`. The real defect is that top-level `materials` always equals `meshes` -- it counts per-mesh material slots, not distinct materials | Done additively. Root cause proven and different from the hypothesis: the metric measures a scene re-imported from GLB. `distinctMaterials` now comes from the post-dedup GLB metrics at all three result sites. 20 parts sharing one material report `materials: 20, distinctMaterials: 1` |
| 4.9 | Reconsider `kiln_validate` returning `valid: true` for a program using an undefined helper | Done as a warning. `validate` names the undeclared called identifier with its line, from the host-side parse. Zero false positives across all 86 example programs; local functions and arrow consts are not flagged. Promoting it to an error would change `valid` for source that parses, and is left as a contract decision |

## Phase 5 — Test-artifact cleanup

| ID | Task | State |
| --- | --- | --- |
| 5.1 | Remove 2.3 GB of scratchpad test clones | Done; Phase 3 is verified, so the baseline comparison clones are no longer needed |
| 5.2 | Remove the test plugin install and marketplace entry | Done; `claude plugin list` reports none and only `claude-plugins-official` remains |

## Rollback

Phases 0, 1, 4 and 5 are ordinary commits or local file operations and revert
normally. Phase 2 is additive until task 2.8, and 2.8 to 2.11 are revertible
commits. Phase 3 is recoverable only from the task 0.5 mirror, which is why 0.5
precedes everything and why 3.11 carries its own approval gate.

## Rejected approaches

Recorded so they are not reintroduced.

**Re-encoding the poster PNGs.** The files are written by
`render-service/src/renderer.mjs` with `deflateLevel: 1, filterType: 0`, a
deliberate choice noted in that file as roughly ten times faster to encode. A
lossless re-encode would take 108 MB to about 7 MB. It was rejected because
image tokens are `ceil(width / 28) * ceil(height / 28)` visual tokens and do not
depend on file size at all, so the change saves no context; because it would
alter every `imageHash` and void all 83 poster receipts, breaking I1; and
because the remaining benefit, transfer latency, was never measured against the
encode-time cost it would reintroduce. Revisit only with that measurement in
hand.

**Treating committed `dist/` as a packaging defect.** A bundle built with
`--packages=external` does fail from a bare `git clone` with no `node_modules`.
That is not what a plugin install does. A real install from GitHub was verified:
Claude Code ran `bun install --frozen-lockfile --ignore-scripts`, produced 189
packages including `sharp`, `manifold-3d` and `gltf-validator`, and the server
started and listed 13 tools. Committing `dist/` is correct and required, since
no build step runs during an install. See I7.

**Lossy formats for agent-facing renders.** WebP or JPEG would shrink the
gallery further, but the vision documentation warns that lossy artifacts are
detrimental to model performance, especially across repeated passes. Any lossy
encoding stays confined to site presentation and never reaches tool output.

## Execution record

Appended as work completes, so the plan doubles as the audit trail. Figures here
are observed, not predicted.

### Phase 0 results

| Item | Recorded value |
| --- | --- |
| Decision D1 taken | `~/kiln-media-archive/` |
| Video archive | 31 files, 72,246,516 bytes; all 31 verified byte-identical by sha256 against source |
| Social-post masters preserved | `kiln-launch.mp4` 43 MB, `gallery-take.mp4` 11 MB, `kiln-launch-poster.png` 1.3 MB |
| README video URL (I4) | HTTP 200, 64,712,834 bytes, `video/mp4`, served from `github-production-user-asset` S3 |
| Mirror backup | `~/kiln-backup-2026-09-10.git`, 227 MB, `fsck` clean |
| Mirror verification | 176 commits, HEAD `5b903fbf5119`, 3206 objects; all three match source |
| Baseline HEAD | `5b903fbf5119` on `main` |
| Forks | 0 |
| Open pull requests | 0 |
| Open issues | 0 |
| Stars | 21 |

Two findings worth carrying forward. The published README video is 64.7 MB,
larger than the 43 MB copy that was in `assets/video/`, which confirms the
in-repository file was never the artifact the README served and can be removed
without touching the README. And the force-push blast radius is zero: no forks,
no open pull requests, no open issues. The rewrite in Phase 3 disrupts nobody
except clones already on disk.

### Phase 1 results

`--filter=blob:none` documented in `README.md` and `docs/install.md`, worded so
it stays accurate after Phase 3 shrinks the history. Committed as `82c9805`.

### Phase 2 results

| Item | Recorded value |
| --- | --- |
| Decision D2 taken | bucket `kiln-assets`, domain `assets.kilnstudio.tools`, zone `f5e56d7197cf2a23bcdd6e0cbc93d79b` |
| Decision D3 taken | `assets/gallery/` stays in the repository, so the README needs no network |
| Decision D4 taken | all three writers emit to a gitignored `.posters/`; `scripts/upload-posters.mjs` publishes it |
| Objects uploaded | 88 (84 PNG, 4 GIF), byte-for-byte, no re-encode |
| Upload integrity (2.5) | 88/88 sha256 identical after download from R2 |
| Receipt gate (2.6, I1) | 83/83 `posterReceipt.imageHash` values equal the stored object's sha256; 0 mismatches |
| CDN serving (2.7) | 88/88 return HTTP 200 with correct `content-type` over `https://assets.kilnstudio.tools`, each byte-identical |
| Doc rewrite (2.8) | 128 occurrences across 66 distinct posters; all 66 URLs return 200; the 68 `.kiln.js` program links left relative |
| Caption parity | 62 captions scraped before and after the rewrite |
| Lint (I6) | exit 0; 14 warnings, 11 infos, unchanged from baseline |
| Typecheck | engine and site both exit 0 |
| `tidal-observatory.png` | the one poster with no receipt: 84 PNGs, 83 receipts |

Three things were missed by the original plan and are recorded as tasks 2.15 to
2.18. `site/scripts/build-assets.mjs` reads posters through a `RENDERS`
constant, so searching for the literal string `examples/renders` did not find
it; it also scrapes poster `href`s out of `docs/examples.md` to build captions,
which task 2.8 broke until the pattern was loosened. `src/__tests__/examples.test.ts`
matched a repository-relative `src=` attribute for the GIF cells and failed for
the same reason. Both now key on the file name instead of the path, so either
form matches. The lesson worth keeping: `docs/examples.md` is machine-read in two
places, not just rendered.

#### Blocked, with cause

**Task 2.12 and 2.14.** `site/scripts/build-assets.mjs` exits 1 on this machine,
and this is pre-existing rather than caused by the migration. Verified by running
it on an untouched clone of the baseline commit, where it fails identically.

This entry previously described the failure as `artifactMatch: false` on
`abyssal-surveyor` and attributed it to baked texture encoding. Both details were
wrong and are corrected here. That JSON was a diagnostic written by hand while
debugging, not output any script in this repository emits, and it should not have
been recorded as though the tool reported it. The real error is
`Recorded poster is stale; regenerate it from the current gallery GLB.`, thrown by
`verifyRecordedPoster` in `site/scripts/provenance.mjs` from `build-assets.mjs:68`.
The scope was also far larger than one asset. Measured directly by re-rendering
every example on Linux and comparing all three recorded hashes:

| Receipts checked | Mismatched | Which field |
| --- | --- | --- |
| 83 | 75 | `artifactHash` only |

No `sourceHash` and no `imageHash` mismatched, on any asset. The poster bytes are
therefore intact and the R2 migration is clean; what diverges is the serialized
GLB. The meshes themselves are not diverging either: `src/__tests__/examples.test.ts`
asserts the README triangle counts by executing every program, and it passes 94 of
94 on Linux. Identical geometry with different serialized bytes on 75 of 83 assets
points at float formatting or precision in GLB serialization, not at different
models.

`pages.yml` pins `runs-on: windows-2022` with a comment recording that poster
receipts bind GLB bytes captured on Windows, which is how this has stayed
invisible. It is a genuine cross-platform gap in the maintainer pipeline and is
tracked as Phase 6. It does not affect the shipped tools, which do not verify
against these receipts, and it does not block Phase 3.

What was proven instead: the new fetch-and-cache path works against the live
bucket, and the poster it retrieved was byte-identical to the attested file, so
the migration's own behaviour is verified even though the surrounding build is
not. Confirming 2.12 and 2.14 needs either CI or the GPU machine.

**Pre-existing test failure.** The baseline clone also fails
`CLI saves, exports, imports, and restores a revision across independent stores`.
Unrelated to this work. Run counts also varied between 2 failures and 1 across
identical invocations, so at least one test in the suite is flaky. After the
task 2.18 fix, the working tree's only failure is that same pre-existing one,
and `src/__tests__/examples.test.ts` passes 94/94 on its own.

#### One trap worth naming

`wrangler r2 object put` defaults to a **local** simulator and needs `--remote`
to reach the bucket. It reports `Upload complete` either way. The first upload in
this work went nowhere real, and the simulator wrote 1.8 MB of sqlite state and a
copy of the image into `.wrangler/`, which was then briefly committed before
being caught and removed. `.wrangler/` is now in `.gitignore`. Anyone repeating
this work should confirm `Resource location: remote` in the output.

### Remaining work

Phase 3 is untouched and is the only irreversible phase. It gained task 3.4a
during Phase 2: `src/__tests__/examples.test.ts` asserts through `readdir` that
every hero and demo PNG exists in `examples/renders`, and those assertions fail
the moment the images leave the tree. Phase 4 is deferred by the owner for a
joint walk-through. Task 5.1 stays open deliberately: the pristine baseline clone
in the scratchpad is the comparison set for Phase 3 verification and should
outlive the rewrite.

### Phase 3 progress

Tasks 3.1, 3.3, 3.4 and 3.4a are complete. The rewrite itself, 3.5 onward, has
not started.

**Task 3.4a, and the standard it sets.** Three assertions in
`src/__tests__/examples.test.ts` proved that every hero, archive and demo had a
render, and one proved every README GIF existed, all four by reading
`examples/renders/`. None of them can survive the images leaving the tree. Two
replacements were considered and rejected. A generated manifest listing what had
been uploaded would assert only that an upload once happened, and would pass
while the bucket returned 404 -- a test that cannot fail when the thing it guards
is broken, which is worse than no test because it stops anyone looking. Folding
the check into `site/scripts/verify-assets.mjs` fails for a different reason:
that script reads `site/public/assets/index.json`, so it cannot run until the
entire gallery build has succeeded, and it iterates gallery rows rather than the
poster set, so it cannot see the animations or the archive entries at all.

What shipped instead splits the check by what each layer can observe.

| Layer | Asserts | Why it can be true there |
| --- | --- | --- |
| `src/__tests__/examples.test.ts` | heroes, archives and demos each have a poster receipt; the `GIFS` list, the README cells and the example programs agree | The 83 receipts stayed in the tree, so this remains a real local check and still catches a hero added without a render |
| `scripts/verify-posters.mjs` | every published image is served and, where attested, byte-identical to its receipt | Over HTTP against the bucket, the only place the published bytes exist |

The GIF assertion lost its third leg outright: animations are assembled from
frames and were never attested individually, so nothing local can speak to
whether one exists. That leg moved to the new script rather than being replaced
with a comparison of the declared list against itself.

The new script is deliberately standalone and deliberately runs *before*
`build-assets.mjs` in `pages.yml`. Whether the bucket still serves the attested
bytes has nothing to do with whether the GLBs rebuild, and running it first means
a broken bucket reports as a broken bucket instead of hiding behind a build
failure. It is wired into `pages.yml` and exposed as `bun run verify:posters`;
without that wiring this restructure would have been a downgrade, since the check
would have left `bun run test` and then never run again.

| Check | Result |
| --- | --- |
| `bun run verify:posters` | 88 images served; 83 byte-identical to their receipts; 5 present but unattested (`tidal-observatory.png` and the four GIFs) |
| `src/__tests__/examples.test.ts` | 94 pass, 0 fail, 647 assertions |
| `bun run lint` | exit 0; 14 warnings, 11 infos, unchanged from baseline |

**The blocker was re-measured, not assumed.** Chasing the Windows pin in
`pages.yml` led to re-running the build rather than trusting the earlier note, and
the earlier note was wrong in three ways: wrong error string, wrong failing
script, and wrong scope by a factor of seventy-five. The corrected finding is
recorded under Phase 2 above and is now tracked as Phase 6. CI remains the
correct place to settle 2.12 and 2.14, but only because CI runs Windows, which is
the workaround rather than the fix.

## Phase 6 -- GLB serialization is not byte-reproducible across platforms

Opened on 2026-09-10 from the measurement above, at the owner's clarification
that the project should work from Windows, macOS and Linux alike. It is
pre-existing, orthogonal to Phases 0 to 5, and deliberately not bundled into the
history rewrite.

Today a contributor on macOS or Linux cannot run `bun scripts/build-assets.mjs`
or `site/scripts/verify-assets.mjs` to completion, because 75 of 83 poster
receipts bind GLB bytes that only a Windows host reproduces. The shipped MCP
tools and CLI are unaffected: nothing an end user runs verifies against these
receipts, and `ci.yml` already exercises the engine on Ubuntu and both macOS
architectures.

| ID | Task | State |
| --- | --- | --- |
| 6.1 | Establish whether the divergence is float formatting, buffer padding, or accessor min/max precision, by diffing one small asset's GLB JSON chunk between a Linux and a Windows render | **ANSWERED 2026-09-11**, and it is none of the three: the float values themselves differ. Measured on 8 examples across both platforms at one commit -- JSON diverges in all 8, BIN in 2 of 8, and totals move by 4, 8 and 264 bytes, so digit counts change and formatting cannot be the cause. See the section below. `scripts/glb-chunk-hashes.mjs` is kept as the instrument |
| 6.2 | Decide the fix: make serialization deterministic across platforms, or make `artifactHash` cover geometry rather than serialized bytes | **Decided and done 2026-09-11**, and the dependency half turned out to be one line. See the section below: the whole of the 4.5.0 change was `asset.generator`, the serializer writing its own version number into every artifact. `src/render.ts` now pins it, measured byte-identical across 4.4.1 and 4.5.0 on **all 86 examples**, and the exact pin moves to 4.5.0 deliberately. The poster receipt stops asserting `artifactHash` and asserts `sourceHash` plus `imageHash`, which is what it could always honestly claim. The platform half is NOT fixed -- 6.1 reopened to measure it |
| 6.3 | Re-record the affected receipts once serialization is settled, deliberately and in one pass CLOSED 2026-09-11. The 83 gallery images are display assets; the maintainer's call. Their receipts were the only consumer of byte-identical cross-platform serialization, so the Windows host this needed now buys nothing. `artifactHash` remains a real identity claim and 9.3 may share a root cause -- reopen from there if it does, not from the posters |
| 6.4 | Unpin `pages.yml` from `windows-2022` and confirm the gallery builds on Ubuntu | **Done 2026-09-11.** `runs-on: ubuntu-latest`. Demonstrated locally first -- `bun run site:assets` then `site/scripts/verify-assets.mjs` complete on Linux, verifying 80 source/GLB pairs, posters, both edit-demo revisions and the geometry example; before the 6.2 narrowing the first example failed. **Phase 6 closes.** The cross-platform divergence itself is not fixed and, per 6.1, is not fixable by canonicalization -- what changed is that nothing asserts byte-identity across platforms any more |


### The 4.5.0 byte change was one metadata string

Measured 2026-09-11, after the bump had been bisected to `@gltf-transform` and
pinned. Splitting the same example's GLB into its declared chunks under both
versions:

| | 4.4.1 | 4.5.0 |
| --- | --- | --- |
| total bytes | 636,504 | 636,504 |
| BIN chunk (all geometry) | `20f853940f53fa63` | `20f853940f53fa63` |
| JSON chunk | `67d790a88a96a6a0` | `74be8b9c487ae8b3` |
| `artifactHash` | `300ece4cd5de6dbc` | `9c4aeac1804c9107` |

Diffing the parsed JSON gives exactly one line:

```
"generator": "glTF-Transform v4.4.1"  ->  "glTF-Transform v4.5.0"
```

That is the entire change. Not geometry, not materials, not animations, not even
accessor min/max -- the BIN chunk is bit-identical and so is a semantic digest
over nodes, meshes, materials and animations. All 83 receipts moved and the
gallery build broke because the serializer writes its own version number into the
file it serializes.

`@gltf-transform/core/src/io/writer.ts` is
`asset: { generator: \`glTF-Transform ${VERSION}\`, ...root.getAsset() }`. The
spread comes after, so a caller's own value wins, and Kiln never set one. One
line at the single `new Document()` site fixes it. Verified on the full corpus:
with the generator pinned, **all 86 examples are byte-identical across 4.4.1 and
4.5.0** -- including the ones using `palette()`, which 4.5.0 changed.

A dependency's version number is provenance about the tool, not identity of the
asset. Kiln's own version deliberately stays out of the bytes too: it belongs in
the provenance record, where changing it does not move artifact hashes.

**What this does not fix.** The Linux/Windows divergence is a separate cause. The
Windows gallery job passes, so Windows reproduces the recorded hashes and Linux
is the side that diverges. The remaining suspect is float math rather than
formatting -- `Math.sin` and friends are not bit-specified across libm
implementations, and a 1-ULP difference would land in the BIN chunk, where no
canonicalization reaches it. 6.1 now measures this rather than assuming it.

### 6.1, measured: it is float math, and no canonical form fixes it

Both platforms, same commit, `bun scripts/glb-chunk-hashes.mjs`. Linux from a
local run; Windows from a temporary step in the gallery job on `windows-2022`.
Both reported `node=v26.3.0`, so this is not a runtime version difference.

| example | JSON chunk | BIN chunk | total, Linux -> Windows |
| --- | --- | --- | --- |
| abyssal-surveyor | differs | **same** | 636488 -> 636488 |
| arcade-cabinet | differs | **differs** | 1237440 -> 1237176 |
| brass-tellurion | differs | **same** | 662816 -> 662820 |
| carousel | differs | **same** | 191024 -> 191024 |
| cathedral | differs | **differs** | 2259464 -> 2259464 |
| penny-farthing | differs | **same** | 823584 -> 823584 |
| robot-arm | differs | **same** | 1255776 -> 1255768 |
| windmill | differs | **same** | 419064 -> 419056 |

The question 6.1 asked was float formatting, buffer padding, or accessor min/max
precision. The answer is none of those three: it is the float values themselves.

Two readings carry it. The JSON chunk diverges in **every** example, and the
totals move by 4, 8 and 264 bytes -- string LENGTHS changing, which a formatting
difference cannot do, because ECMAScript specifies `Number` to string exactly.
Different digit counts mean different numbers. And the BIN chunk diverges in 2 of
8, at unchanged total size in `cathedral`, so that is differing values rather
than differing layout.

So the divergence is computation, not serialization, and it reaches both chunks:
the JSON through computed node transforms and accessor bounds, the BIN through
vertex data where a generator used an operation that came out differently. The
remaining suspect is the transcendentals -- `Math.sin`, `Math.cos`, `Math.pow`
are not bit-specified by IEEE-754 and each platform's libm is free to land on a
different last bit.

**This retroactively decides 6.2 the right way.** The alternative 6.2 offered was
"make serialization deterministic across platforms", and that was never
achievable: no canonical form reaches a value that was computed differently. The
narrowing was the only option that could work. A future content hash would have
to quantize geometry before digesting it, not canonicalize its encoding.

That `cathedral` and `arcade-cabinet` are the two with BIN divergence is worth a
follow-up: both bake procedural textures, whose PNG bytes also live in the BIN
chunk, so the differing bytes may be image encoding rather than vertex data.
`penny-farthing` and `robot-arm` also bake textures and matched, so that is a
lead rather than a conclusion.

### What a poster receipt asserts now

`verifyRecordedPoster` asserted `sourceHash`, `artifactHash` and `imageHash`. That
middle assertion is the single line that pinned the gallery to `windows-2022`,
and it claimed something glTF never promised: that rebuilding a source anywhere
reproduces the container byte for byte. It now asserts source and image, and
`artifactHash` stays in the record as provenance -- the bytes the poster was
rendered from, on the machine that recorded it.

Two consequences worth stating. `verify-assets.mjs` compared the published
`<name>.poster.json` to the run's own `artifactHash` one line later, which
re-imposed the same claim and is gone. And the prose in all 83 records said the
poster was a render of "the exact downloadable GLB", which the narrowing makes an
over-claim; three distinct strings covered all 83 and each now says the poster is
a render of that exact *source*, with the artifact hash naming the bytes the
image came from. Rewriting the prose rather than leaving it is the same standard
Phase 9 applied to `exactArtifact`: a receipt that over-claims is worse than one
that claims less.

The within-run integrity checks are untouched and still hash bytes, correctly:
the index against the files built beside it, the build receipt against the index,
and both demo receipts against their own run's GLBs. Those compare artifacts to
themselves within one build and cannot diverge by platform.

`pages.yml` now runs `site/scripts`'s tests explicitly.

**Correction, 2026-09-11.** The commit that added that step said those tests had
never run in any workflow. That is wrong, and measured rather than argued: `bun
run test` is `bun test src scripts`, bun treats positional arguments as substring
filters on paths, and `site/scripts` matches `scripts`. Both files were already in
the 210-file suite -- `bun test provenance.test` from the repository root finds
and runs all four of its tests. CI was covering them.

The step stays for a different and smaller reason than the one first given: that
coverage is incidental, and spelling the script `bun test ./src ./scripts` would
drop it without a word.

### Phase 3 rehearsal

The rewrite was executed in full on a throwaway clone before touching anything
that can reach GitHub, because `git filter-repo` rewrites a repository in place
and strips its remote. The clone used `--no-hardlinks` deliberately: a local
clone hardlinks objects by default, and rewriting hardlinked objects can reach
back into the source repository. The remote was then removed outright.

Tasks 3.5 through 3.10 are validated by this rehearsal. 3.11 onward, which begins
with the force-push, are not.

| Measurement | Baseline | After rewrite |
| --- | --- | --- |
| Packed history | 226.06 MiB | 16.62 MiB |
| `.git` on disk | 227 MB | 17 MB |
| Objects in pack | 3206 | 3020 |
| Commits | 180 | 180 |
| Clone, wall clock (local transport) | 79 s from GitHub | 203 ms |
| Clone, on disk | 440 MB | 35 MB (23 MB `.git` + 12 MB checkout) |

One pass removed `assets/video/`, `examples/renders/*.png`,
`examples/renders/*.gif` and `dist/`. All four are absent from every commit
afterwards, verified by searching the whole rewritten history for additions
rather than by inspecting HEAD. Every commit survived.

| Verification | Result |
| --- | --- |
| Files in tree | 1262 before, 1143 after; exactly 119 removed (31 under `assets/video/`, 88 under `examples/renders/`) |
| Unexpected additions | none |
| `dist/` re-added (3.6) | all 10 files byte-identical to the pre-rewrite blobs, by sha256 |
| `bun run build:runtime` (3.7, I2) | exit 0, working tree clean, `dist/` still byte-identical |
| `bun run lint` (3.9, I6) | exit 0; 14 warnings, 11 infos, unchanged from baseline |
| `bun run test` (3.9) | 1804 pass, 1 fail across 1807 tests in 206 files |

The single failure is `CLI saves, exports, imports, and restores a revision
across independent stores`, and it is pre-existing: the same test fails
identically in the untouched working repository, with
`SyntaxError: JSON Parse error: Unexpected EOF` at `src/asset-cli.test.ts:34`.
It passes on CI's Ubuntu runner, so it is a local environment fault rather than a
repository defect, and it is unrelated to this work.

### CI results on PR #63

Both workflows succeeded on the pull request, which resolves tasks 2.12 and
2.14. The Gallery workflow is the meaningful one: it ran `build-assets.mjs`,
`verify-assets.mjs` and the new `verify-posters.mjs` on `windows-2022`, so the
R2 poster path is confirmed end to end in the environment the receipts were
recorded in.

| Workflow | Conclusion |
| --- | --- |
| CI | success |
| Gallery | success |

### Phase 3 execution

The rewrite was run against a fresh clone of `main` at `dd9d5f7`, not against the
working repository, so that the working copy survived as a second pre-rewrite
backup. The mirror at `~/kiln-backup-2026-09-10.git` was fast-forwarded to
`dd9d5f7` first, since it had been taken at `5b903fb` and would otherwise have
been missing the squash-merge of #63.

New `main` is `fbc3da2`. Measured against the baseline table at the top of this
document:

| Measurement | Baseline | After |
| --- | --- | --- |
| Full clone from GitHub, wall clock | 79 s | 8.0 s |
| Full clone from GitHub, on disk | 440 MB | 52 MB (18 MB `.git` + 34 MB checkout) |
| `--filter=blob:none` clone | 36 s, 325 MB | 3.8 s, 48 MB |
| Packed history | 226.06 MiB | 17.41 MiB |
| Commits | 177 | 177 |
| Removed-path objects reachable in a fresh clone | -- | 0 |

Verification on the exact commit pushed: 1805 tests pass and 0 fail, `lint` exit
0 with the unchanged 14 warnings and 11 infos, `typecheck` exit 0,
`build:runtime` exit 0 leaving a clean tree with `dist/` still byte-identical to
the pre-rewrite blobs, `verify:posters` 88 of 88, `fsck` clean, 119 files removed
and none added.

#### Two traps this phase produced

**The tag was the whole rewrite.** `git push --force origin main` succeeded and
looked complete, but a fresh clone still measured 57.24 MiB of packed history and
still contained `examples/renders/*.png`. The cause was `refs/tags/oss-2026-09-05`,
which still pointed at the original `d941f15` and so held every removed blob
reachable. `filter-repo` had rewritten the tag correctly to `b2eff76` with zero
removed-path files; the omission was pushing only `main`. Pushing
`refs/tags/oss-2026-09-05 --force` took the clone from 92 MB to 52 MB. Anyone
repeating this work should push every ref, and should measure a fresh clone rather
than trusting the local pack size.

**`du` with two arguments deduplicates.** `du -sh repo/.git repo` reports the
`.git` size and then the checkout size, not the total, because the second figure
excludes what the first already counted. That is how "35 MB" for a full clone
reached `README.md` and `CHANGELOG.md` before being corrected to 52 MB. Sizes in
this document are now measured one path at a time.

#### Branch protection

`main` carries `enforce_admins: true`, `allow_force_pushes: false`,
`required_linear_history: true`, `required_conversation_resolution: true` and a
strict required check on `typecheck . lint . test`, so the rewrite needed
`allow_force_pushes` and `required_linear_history` relaxed for the duration of the
push and nothing else. `required_linear_history` was the less obvious of the two:
the history contains three genuine merge commits, which were grandfathered in
under the existing rule and only became violations once a force-push presented
them as new. Flattening them was rejected as destroying real history.

The original configuration was read and saved to disk before any change and
restored from that file, by a trap that runs whether the push succeeds or fails.
It was then compared field by field against the saved original: no differences.

#### Tasks 3.13 and 3.14

`ci.yml` and `pages.yml` both succeeded on the rewritten `main` at `fbc3da2`.

The run on `dd9d5f7`, the pre-rewrite squash merge, shows a `ci.yml` failure on
`shipping proxy forwards actual PNGs while retaining source args/text and blocking
excess calls`. The same job passes on `fbc3da2`, and the pull request checks for
the same content had passed, so this is more of the suite flakiness already noted
rather than a regression. Two distinct tests have now been seen to fail
intermittently: this one and `CLI saves, exports, imports, and restores a revision
across independent stores`. Worth a separate look; not part of this work.

Task 3.14 installed the plugin from GitHub end to end and drove the server.

| Check | Result |
| --- | --- |
| `claude plugin marketplace add` | 5.8 s |
| `claude plugin install kiln@kiln` | 2.2 s; 189 packages installed automatically |
| `~/.claude/plugins` after install (I3) | 502 MB, against 953 MB at baseline. Repository content is 82 MB of that, against 539 MB |
| Installed `dist/mcp-server.mjs` vs the repository copy | byte-identical by sha256 |
| `initialize` | protocol `2025-06-18`, `serverInfo` `kiln` 0.6.0 |
| `tools/list` (I7) | 13 tools |
| Cleanup | plugin uninstalled, marketplace removed, and the 448 MB orphaned `cache/kiln` that `uninstall` leaves behind deleted; `~/.claude/plugins` back to its 6.3 MB baseline |

Two things this confirmed for Phase 4. Finding 4.4 is real and now independently
verified: `initialize` returns `instructions: null`. Finding 4.5 needs rewording,
because the plugin's own `.mcp.json` uses `${PLUGIN_ROOT}` and the command `node`,
with no absolute path in it; the absolute-path problem belongs to the workspace
file that `scripts/create-workspace.mjs` writes, not to the shipped manifest.

## Phase 3 outcome

| Target | Goal | Achieved |
| --- | --- | --- |
| Uncompressed history | ~29 MB | 17.41 MiB packed |
| Full clone | -- | 8.0 s, 52 MB, from 79 s and 440 MB |
| Blobless clone | -- | 3.8 s, 48 MB, from 36 s and 325 MB |
| One plugin install | -- | 502 MB, from 953 MB |
| Commits preserved | all | 177 of 177 |
| Removed-path objects reachable in a fresh clone | 0 | 0 |

Phases 0, 1, 2, 3 and 5 are complete. Phase 4 remains open and is now partly
verified: 4.4 confirmed, 4.5 needs rewording, 4.6 partly refuted earlier. Phase 6
is open and untouched.

## Phase 4 verification

Run on 2026-09-10 against `dist/mcp-server.mjs` over stdio, after first reading
`skills/kiln-author-asset/SKILL.md` and `references/program-contract.md` so the
probe programs were contract-valid (`const meta` plus `function build()`, no
imports, exports or TypeScript). Omitting that step is what invalidated the
earlier delegated run.

Two findings changed on measurement. 4.6 is refuted outright. 4.8 was described
wrongly in the original table and is a different, worse defect than recorded.

Engine health measured in passing, so it is on the record rather than assumed:
server start 1.3 s; one-part render 913 ms; five parts 862 ms; twenty parts
798 ms; an identical re-render 57 ms from cache. Render cost is flat in part
count. An earlier impression that renders were slow was a probe script leaking
uncleared `setTimeout` handles, not engine behaviour.

Protocol negotiation is correct and current: the server echoes `2025-06-18` and
`2025-11-25` when asked, and falls back to `2025-11-25` for anything newer,
which is `LATEST_PROTOCOL_VERSION` in the pinned SDK 1.30.0. The `2026-01-26`
literal in `src/viewer/chat-app.ts` is the MCP-UI `ui/initialize` protocol, a
different protocol, and is not an inconsistency.

## Phase 7 -- Cross-harness skills and clean-room loadout

Opened 2026-09-10. Phase 4 task 4.1 was scoped as a Claude-only choice between
`.claude/skills/` and a `START.md` correction. Reading each harness's own
documentation shows that framing was wrong, and that the gap is a whole class of
defect rather than one setting.

### The documented harness matrix

| Harness | Project-local skill paths | Instruction file |
| --- | --- | --- |
| claude (Claude Code) | `.claude/skills/` only | `CLAUDE.md` only; does not read `AGENTS.md` |
| codex (OpenAI Codex) | `.agents/skills/`, scanned from cwd up to repo root | `AGENTS.md` |
| opencode | `.opencode/skills/`, `.claude/skills/`, `.agents/skills/` | `AGENTS.md` |
| hermes (NousResearch) | `.hermes/skills/`, `.agents/skills/` | -- |
| agy (Google Antigravity) | `.agents/skills/` | `agents.md` |

`.agents/skills/` serves four of the five; Claude Code is the sole holdout.

An important nuance, checked against the specification rather than inferred:
`.agents/skills/` is a **de-facto convention, not part of the standard.** Agent
Skills became a formal open standard on 2025-12-18 with the specification at
`agentskills.io/specification`, adopted across 20-plus platforms, but that
specification deliberately defines only the skill *format* -- directory layout
and `SKILL.md` frontmatter -- and says nothing about where agents should look for
skills. Discovery is left entirely to implementations, which is exactly why the
matrix above has five different answers and why no single directory can serve
all of them.

Two corrections to earlier belief. Codex does support skills, from December
2025; the claim that it had no native concept was wrong. And `skills/` at the
repository root is not a mistake -- it is the plugin convention, auto-discovered
from a Claude Code plugin root and declared explicitly by
`.codex-plugin/plugin.json`. The layout is correct for the path it was built for.

### Three install paths, one of them served

| Path | Tools | Skills |
| --- | --- | --- |
| Installed as a plugin | yes | yes -- Claude by auto-discovery, Codex by explicit field |
| `git clone` plus an agent | **no, see 7.1** | no -- root `skills/` is not a discovery path outside plugin context |
| `kiln-init` workspace | yes, all five harnesses | opencode only |
| Ad-hoc: configure the server by hand, open an empty folder | yes | files exist in the install root but sit in no scanned directory |

### Clean rooms invert the registration rule

A generated workspace is a plain directory; `create-workspace.mjs` writes a
`.gitignore` but never runs `git init`. Both opencode and hermes gate
project-local skill discovery on being inside a git checkout, so convention
directories alone cannot be relied on there. Explicit configuration therefore
beats convention in a clean room, which reverses the first proposal drafted for
this phase: opencode's `skills.paths` must be KEPT, not replaced. It is a real
key, verified against the published `opencode.ai/config.json` schema
("Additional paths to skill folders").

### Repo-side and workspace-side skills are different audiences

All five existing skills are workspace-side: they assume a live `kiln_workspace`
server and a workspace to author in. Nothing is repo-side, and `AGENTS.md` never
mentions workspaces, `kiln-init` or clean rooms -- it addresses engine
contributors only. An agent in a bare clone has no way to learn that
`scripts/create-workspace.mjs` exists.

This also rules out an approach that was nearly adopted: committing all five
authoring skills to a root `.claude/skills/`. That would register, for an agent
sitting in the engine checkout, skills whose own guidance is to keep the engine
checkout out of the agent's task context. Root registers the repo-side skill
only.

| ID | Task | State |
| --- | --- | --- |
| 7.11 | Add specification validation of the skill files to CI. The standard ships a reference validator (`skills-ref validate`); a local equivalent avoids a new dependency. Guards the format against drift now that it is a published standard with 20-plus implementations | Done; folded into `check:skills` rather than adding a dependency on the reference validator |
| 7.1 | Root `.mcp.json` borrowed Antigravity's `${PLUGIN_ROOT}` while serving Claude Code project config and the Codex plugin, neither of which defines it, so a fresh clone opened onto a `kiln` server that could not start | Done. Root `.mcp.json` now uses `${CLAUDE_PROJECT_DIR:-.}`, the documented project-scoped idiom; the Codex manifest carries its server inline with a plugin-root-relative `cwd`, the documented alternative to a path. Both expansion branches verified to start the server; `mcp_config.json` untouched; a guard test asserts no plugin variable returns to this file |
| 7.2 | Author a repo-side `kiln-setup-workspace` skill: choosing a harness, generating the clean room, verifying `kiln_workspace` came up, and what `--repair` does and does not touch | Done; `skills/kiln-setup-workspace/`, specification-validated |
| 7.3 | Register 7.2 at the repository root in both `.claude/skills/` and `.agents/skills/`. Copies, not symlinks: symlinks need developer mode or admin on Windows and a `core.symlinks` checkout | Done; committed to `.claude/skills/` and `.agents/skills/`. `.gitignore` needed the `.claude/*` plus negation form, because git will not descend into a wholly excluded directory |
| 7.4 | Add a root `CLAUDE.md` containing the documented `@AGENTS.md` import, and an "authoring assets versus contributing to the engine" section to `AGENTS.md` naming 7.2. A skill cannot make itself discoverable, so this is the bootstrap | Done; root `CLAUDE.md` carries the documented `@AGENTS.md` import, and `AGENTS.md` gained an authoring-versus-contributing section |
| 7.5 | Workspace generator: copy the authoring skills into `.claude/skills/` and `.agents/skills/` instead of plain `skills/`, upgrading four harnesses from prose to native registration | Done; all five harnesses now receive `.claude/skills/` and `.agents/skills/` alongside the maintained `skills/` |
| 7.6 | Keep opencode `skills.paths`; add the hermes equivalent to the generated `.hermes/config.yaml`. The key is reported as `skills.external_dirs` but that came from prose, not a schema -- verify before writing it | Done; opencode `skills.paths` kept, hermes `skills.external_dirs` added after confirming the key and that its project-local scan needs a git checkout |
| 7.7 | Populate the MCP `instructions` field from the five skill descriptions, as the harness-independent floor. Same work as 4.4 | Done; 1,776 characters, about 354 tokens, verified delivered in the initialize result |
| 7.8 | Add a `check:skills` gate asserting the registered copies are byte-identical to canonical `skills/`, mirroring `check:toolchain`, and wire it into CI. This is what makes copying safe rather than a drift hazard | Done; `scripts/check-skills.mjs`, wired into CI before install, negative-tested against three distinct failure modes |
| 7.9 | Trim `skills/kiln-batch-dispatch/references/clean-room-evaluation.md` to evaluation scope once 7.2 owns setup, so two documents do not describe workspace creation | Done; trimmed 42 lines to 30, setup now owned by 7.2 |
| 7.10 | DECIDED: no `git init`. Clean rooms stay plain directories and skill registration goes through explicit configuration (7.6), which is independent of git state. Closed | Done |

### Clone readiness, measured

Verified 2026-09-10 against the live remote at `9b0c610`, in a fresh clone
rather than the working tree: clone 3.3 s for 52 MB; `bun install
--frozen-lockfile` 0.59 s, exit 0; `check:toolchain`, `typecheck` and `lint` all
exit 0 with the unchanged 14-warning baseline; `bun run test` 1805 pass, 0 fail,
2 skip. `dist/` is committed, so no build step precedes first use. Both
previously flaky tests passed here, so they are intermittent rather than broken.

Phase 6 does not gate a cloning developer: there is no `build:assets` script in
`package.json`, and the only consumer of the poster receipts is the Pages
workflow, already pinned to `windows-2022`. It stays maintainer-only work.

## Decisions taken 2026-09-10

| Ref | Decision | Rationale |
| --- | --- | --- |
| 7.1 | Split the two uses of `.mcp.json` | A fresh clone must not open onto a failing MCP server. The Codex plugin gets its own file; root `.mcp.json` becomes correct for a bare clone |
| 4.8 | Add a correct `distinctMaterials` alongside `materials` rather than changing `materials` | Additive. Nothing reading the existing key breaks, including the instanceability grade. Root cause is still to be proven before any edit |
| 7.10 | No `git init` for generated workspaces | Explicit configuration already covers opencode and hermes, and it works regardless of git state. Preserves the documented meaning of a clean room |
| Scope | This pass covers Phase 7, the Phase 4 error-legibility and docs tasks, and 4.8. Phase 6 and the two intermittent tests stay out | Phase 6 needs a Windows or GPU host to re-record receipts and gates no cloning developer |

### The ad-hoc path, and why `instructions` is not optional

Raised by the owner 2026-09-10: a user may never create a clean room at all.
They may start the MCP server, configure it in their coding agent, and open a
new empty folder. That path works today for tools and for storage --
`KILN_PROGRAM_STORE ?? '.kiln/programs'` resolves against the working directory,
so the store is created in the folder the agent opened, which is the correct
behaviour and not incidental.

A correction to an earlier statement in this section: that user is not missing
the skill files. All thirteen ship in the npm tarball and `skills/` sits as a
sibling of `dist/`, so the server can compute its own install root and name a
real absolute directory at runtime. What is missing is *registration* -- the
files are in a location no harness scans. The MCP `instructions` field is the
only channel that can tell that user the files exist and where. Task 7.7 therefore carries the whole
loadout for this path and must be substantive on its own -- an orientation to
the tool surface and the `programRef` contract -- rather than a pointer to skill
files that are not present.

### 7.1 is lower risk than first assessed

`scripts/package-plugin.mjs` deletes `manifest.mcpServers` when it builds the
Codex connector, so the published artifact is skills-only and never reads root
`.mcp.json`. The `"mcpServers": "./.mcp.json"` field in
`.codex-plugin/plugin.json` is effectively vestigial for the distributed plugin.
Root `.mcp.json` can be made correct for a bare clone without disturbing the
Codex packaging path. The Codex `plugin.json` schema could not be confirmed from
OpenAI's published documentation; the packaging script is the authority used here.

### The skills format is a published standard, and ours conforms

Validated 2026-09-10 against `agentskills.io/specification`, not against this
repository's own conventions.

Required frontmatter is `name` (max 64 characters, lowercase alphanumerics and
single hyphens, no leading, trailing or consecutive hyphens, and it **must match
the parent directory name**) and `description` (max 1024 characters, stating both
what the skill does and when to use it). Optional: `license`, `compatibility`
(max 500), `metadata` (string-to-string map), and the experimental
`allowed-tools`. The specification also sets progressive-disclosure guidance:
name and description are loaded for every skill at startup, so roughly 100
tokens each; the body loads on activation and should stay under 5000 tokens and
500 lines; `references/`, `scripts/` and `assets/` load on demand and file
references should stay one level deep.

All five skills pass every one of those checks:

| Skill | Lines | Description chars | Body tokens (approx) |
| --- | --- | --- | --- |
| kiln-author-asset | 47 | 117 | 911 |
| kiln-batch-dispatch | 21 | 225 | 338 |
| kiln-compose-scene | 20 | 133 | 239 |
| kiln-qa-asset | 28 | 182 | 421 |
| kiln-refine-asset | 45 | 160 | 795 |

Names match their directories, no non-specification frontmatter keys are
present, and the existing `references/` layout is the specification's own
recommended convention. The content layer needs no change; only registration
does.

### `${PLUGIN_ROOT}` is not a variable in either plugin system

Checked against both vendors rather than assumed from this repository. Claude
Code expands `${CLAUDE_PLUGIN_ROOT}`, which is the token the Claude plugin
manifest already uses correctly. Codex exposes no equivalent at all: its
plugin-provided MCP servers take a relative `cwd` that Codex resolves against
the installed plugin root, and the gap is tracked upstream in openai/codex
issues 22842 and 22105. Codex `plugin.json` accepts `mcpServers` as either a
relative path or an inline object, and `skills` as a relative path that
supplements rather than replaces default discovery.

**Correction, from this repository's own tests rather than vendor docs.**
`${PLUGIN_ROOT}` *is* a real variable: it is Antigravity's, and root
`mcp_config.json` uses it deliberately. `src/__tests__/mcp-bundle.test.ts`
records the measurement -- on `agy` 1.1.25 the file validates at the plugin root
(`mcpServers: 1 processed`) but is not merged into the session, so the test
asserts only that it names the node bundle and pointedly does not assert that
the variable expands. That file is correct and must be left alone.

The defect is narrower than first written: root `.mcp.json` borrowed
Antigravity's variable while serving two consumers that never define it -- Claude
Code reading project-scoped configuration in a plain clone, and the Codex plugin
manifest. Task 7.1 fixes that file only.

### 7.7 shape: an index and a pointer, not the skill bodies

Decided 2026-09-10 on the owner's suggestion that `instructions` should tell the
agent to add skills to its workspace rather than carry them inline. Agreed, for
two measured reasons.

Inlining the five bodies would cost roughly 2704 tokens (911, 338, 239, 421 and
795), paid at every session start by every client for content that is needed in
perhaps one conversation. That is exactly what the specification's progressive
disclosure model exists to prevent: name and description at startup, body only
on activation. And the pointer can be concrete rather than aspirational, because
`skills/` ships as a sibling of `dist/`.

`instructions` therefore carries three things, in roughly 350 to 450 tokens:
the tool-surface orientation and the `programRef` contract, which the ad-hoc user
has no other way to learn; the five names with a one-line trigger each and the
absolute source path; and one line offering to copy them into the workspace's
`.claude/skills/` or `.agents/skills/`.

Two constraints on the wording. The copy must be framed as something the agent
proposes, not performs unasked -- an MCP server prompting unrequested writes into
a user's project is a side effect, and someone who wanted one render should not
find new directories afterwards. And the text must say the copy takes effect
from the next session, because most harnesses will not register newly written
skills mid-session; without that, the agent copies files, observes no new
skills, and may retry.

Deferred, not adopted: exposing the skills as MCP resources. That idea has a
name and a specification -- see "Skills over MCP" below -- and this plan should
use it rather than describe the mechanism informally.

## Skills over MCP, and remote skill discovery

Raised by the owner 2026-09-10 as a half-remembered "new skill paradigm exposed
through MCP". It is real, and it matters for how much of Phase 7 is worth
building by hand.

### SEP-2640, the Skills Extension

Extension identifier `io.modelcontextprotocol/skills`. It serves Agent Skills
over MCP on the existing Resources primitive under a `skill://` URI scheme.

**This paragraph originally described `skills/activate` returning a bundle plus
scoped tools, prompts, resources and nested skills, with progressive disclosure
moving into the protocol itself. That design is gone -- see Phase 14's re-read
(14.9), which replaces this description.** The record is kept because the plan
below was decided against it.

Ratified, this would collapse most of Phase 7: no per-harness directories, no
filesystem copies, no registration step, and the ad-hoc path served by the same
mechanism as every other path.

It is not ratified. The SEP is an open pull request, accepted by core
maintainers and still under review in the Skills Over MCP working group at 45
commits, and it still requires reference-implementation completion, conformance
tests and specification documentation. It is absent from the 2026-07-28 release
candidate, which shipped MCP Apps and Tasks as the official extensions. It is an
optional extension rather than a core primitive. Host support is prototype-level
across gemini-cli, fast-agent, goose, codex and Claude Code. The SDK pinned here
is 1.30.0 at protocol 2025-11-25, well before any of it.

Decision: do not build on it in this pass. Building against an in-review API with
no conformance tests would mean rewriting when it lands. Task 7.7 is already the
manual form of `skills/list` -- an index plus a pointer -- so when the extension
ratifies the same five skills become `skill://` resources and nothing authored
now is wasted.

### `.well-known/skills/`, which is usable today

Cloudflare's Agent Skills Discovery RFC applies RFC 8615 well-known URIs to
skill distribution, and it is already adopted by Mintlify, Docus and Vercel's
skills CLI. It is what opencode's `skills.urls` config key consumes. Because
this project already publishes a site, serving the five skills at
`/.well-known/skills/` would let any opencode user fetch them by URL with no
clone and no install. It does not depend on SEP-2640.

| ID | Task | State |
| --- | --- | --- |
| 7.12 | Watch SEP-2640 to ratification, then expose the skills as `skill://` resources and retire the hand-built per-harness registration where clients support the extension | Deferred by decision; not this pass |
| 7.13 | Publish the skills at `/.well-known/agent-skills/index.json` on the existing site per the Cloudflare discovery RFC, giving opencode `skills.urls` users a zero-install path | **Done 2026-09-11.** The path is a correction to what this row recorded: the RFC is at `/.well-known/agent-skills/index.json` as of v0.2.0, not `/.well-known/skills/`. `site/scripts/build-skills-discovery.mjs` derives the index from `skills/` -- one `skill-md` entry, five `archive` entries for the skills carrying `references/`, each with a sha256 of the artifact's raw bytes. Verified: the apex is this repo's Pages deployment at an origin root, which a well-known URI requires; Vite copies the dot-directory into `dist/`; real `tar` extracts the archives with `SKILL.md` at the root and the contents byte-identical to `skills/`; and two builds publish identical digests. Gitignored and built in CI, because a committed copy would publish digests that go stale |

### 7.1 execution record

Root `.mcp.json` now reads `${CLAUDE_PROJECT_DIR:-.}/dist/mcp-server.mjs`.
Claude Code expands `${VAR}` and `${VAR:-default}` in `command`, `args` and
`env`, sets `CLAUDE_PROJECT_DIR` to the project root, and supports no `cwd`
field for stdio servers -- so the default form is what makes the file resolve
when nothing defines the variable. Verified by expanding both branches and
launching each: unset falls back to `./dist/mcp-server.mjs` and starts; set
resolves absolute and starts. The previous value failed with MODULE_NOT_FOUND.

`.codex-plugin/plugin.json` no longer points at that shared file. It carries the
server inline -- the documented alternative to a path -- with `"cwd": "."`, which
Codex resolves against the installed plugin root. `scripts/package-plugin.mjs`
still deletes `mcpServers` for the published connector: re-run after the change,
16 files, `connectorBound: true`, `mcpServers` absent, `skills` preserved.

Guarded by a new case in `src/__tests__/mcp-bundle.test.ts` asserting the exact
argument and that neither `${PLUGIN_ROOT}` nor `${CLAUDE_PLUGIN_ROOT}` appears in
root `.mcp.json`. Related suites re-run green: mcp-bundle, workspace-node-path,
workspace-bootstrap, workspace-setup and integration-manifest, 18 tests then 6.
`docs/chatgpt.md` corrected; the harness table in `docs/install.md` needed no
change because it describes the generated workspace, not repository root.

## Execution record, 2026-09-10

All nineteen sequenced tasks are complete. Full gate on the working tree:
`check:toolchain`, `check:skills`, `typecheck` and `lint` all exit 0 with the
unchanged 14-warning / 11-info baseline, `bun run test` reports **1810 pass, 0
fail, 2 skip** across 207 files, up from 1805 by the five tests added here, and
`build:runtime` is byte-identical across consecutive runs.

### What the docs changed about the plan

Four claims written earlier in this document were wrong and are corrected in
place above. `${PLUGIN_ROOT}` is real -- it is Antigravity's, used deliberately
by root `mcp_config.json`, which this work left untouched. Codex has supported
skills since December 2025. Root `skills/` is the plugin convention and was
never misplaced. And the "SDK pinned here" was `@modelcontextprotocol/sdk`
1.30.0, a transitive optional peer of `@google/genai` and `@strands-agents/sdk`
that nothing in this repository imports; the direct dependencies are
`@modelcontextprotocol/server` and `client` at 2.0.0, both the latest published,
whose own `LATEST_PROTOCOL_VERSION` is `2025-11-25`. There was nothing to update.

The skill format is a published standard, and all six skills validate against
it: names match their directories, descriptions sit inside 1024 characters,
bodies stay under the 500-line and 5000-token guidance, and no non-specification
frontmatter key is present. `.agents/skills/` is a de-facto convention rather
than part of that standard, which is why the matrix has five answers.

### 4.8 root cause, which was not the hypothesis

The leading hypothesis in this document -- that `mergeDocuments` gave each part a
distinctly named material copy that `dedup()` would not merge -- was wrong.
`loadEvaluatedReviewScene` renders to GLB and then **re-imports** the scene
(`loadGlbReviewScene(rendered.glb)`), and `collectSceneMetrics` measures that
re-imported scene, where authored sharing no longer survives as object identity.
That is why `materials` could never disagree with `meshes`.

The correct figure already existed, post-dedup, in
`rendered.meta.instanceability.metrics.uniqueMaterials`. `distinctMaterials` is
surfaced from it at all three render result sites. Verified: 20 parts sharing one
material now report `materials: 20, distinctMaterials: 1`; 20 distinct report 20
and 20. `materials` is unchanged and documented for what it actually measures.

### 4.2 and 4.3 are bounded by a security boundary, not by effort

`src/evaluator/authoring-diagnostic.ts` exists to stop exception text crossing
out of the isolated evaluator: "No captured identifier, path, message, or stack
crosses the boundary." Naming the identifier in a render rejection, as 4.3 asked,
would breach that deliberately. What was added instead is engine-owned text
pointing at `kiln_list_primitives`, and a test above it already asserts that
arbitrary exceptions keep the generic rejection.

4.2 is safe for a different reason: acorn parses host-side, before any generated
code runs, which is exactly why `kiln_validate` can already report a position.
Repeating that parse in the rejection path leaks nothing new. `kiln_render`
routes through `runRenderViews`, not `runRender`, so the diagnostic is applied at
both raw-source catches and deliberately not at the `programRef` paths, whose
source was validated when it was saved.

4.9 is where the identifier can be named, because that check is host-side and
pre-execution. It reports a warning rather than an error, and its declaration
set over-approximates -- every binding anywhere in the program counts as in
scope -- so a shadowed or conditionally declared name is never falsely flagged.
Measured against all 86 example programs: **zero** false positives; the
undefined helper is named with its line. Promoting it to an error would change
`valid` for programs that parse, and is left as a deliberate contract decision.

### Left open, with reasons

Task 7.13 (`/.well-known/agent-skills/`) was grouped with Phase 6 as
maintainer-side: publishing it ran through `pages.yml`, which was pinned to
`windows-2022`, so it could not be verified from a Linux checkout. **That
grouping is resolved as of 2026-09-11**: 6.4 unpinned the runner, so 7.13 is now
verifiable anywhere. Task 7.12 (SEP-2640) stays deferred until the SEP
ratifies.

A third order-dependent test was found and is **pre-existing**, not a
regression: `authoring-diagnostic.test.ts` "shipping registry exposes repair
advice from its isolated evaluator" fails when that file runs alone, with
"Evaluator worker failed.", and passes in a full run. The pristine clone at
`9b0c610` fails identically. It does not affect users: driving the shipped
server directly over stdio returns the full advice, `kiln_list_primitives`
pointer included. Test hygiene, tracked with the other two flaky tests.

Codex's published plugin sample does not enumerate `command`, `args`, `cwd` or
`env` for an inline `mcpServers` entry, so the `"cwd": "."` written into
`.codex-plugin/plugin.json` rests on two secondary sources rather than the
specification. It degrades gracefully -- the argument is relative, so it still
resolves if `cwd` is ignored but the server already starts at the plugin root --
and `scripts/package-plugin.mjs` deletes `mcpServers` from the published
connector regardless.

## Phase 8 -- `kiln save` writes nothing under Bun

Found 2026-09-10 while confirming CI readiness, by chasing the test recorded
above as merely flaky. It is not flaky in the way it looked, and it is not a
test problem.

| Runtime and entry | `kiln save` stdout | Exit |
| --- | --- | --- |
| `node dist/cli.mjs` | 2,061 bytes of JSON | 0 |
| `bun dist/cli.mjs` | **0 bytes** | 0 |
| `bun src/cli.ts` | **0 bytes** | 0 |

The trigger is Bun, not the TypeScript source, and the failure is silent: exit 0,
empty stdout, empty stderr, no unhandled rejection reported. The program store
*is* written -- the source is imported and a `p_` ref file appears -- so the
command runs partway and then stops without a diagnostic. `--help` prints
correctly under Bun, so the entry guard is fine; `isDirectCliEntry()` was checked
directly and both sides of its comparison match.

This explains `src/asset-cli.test.ts` completely. That test invokes
`spawnSync(process.execPath, [resolve('src/cli.ts'), 'save', ...])`, and under
`bun test` `process.execPath` is Bun, so `saved.stdout` is empty and
`JSON.parse('')` throws at line 34 -- while line 33's `expect(saved.status).toBe(0)`
passes, because the exit code really is 0. Measured 1 pass in 4 isolated runs on
this tree and 1 in 3 on a pristine `9b0c610`, so it is pre-existing and roughly a
coin flip; it passed in both full-suite runs here and failed once under
`test:coverage`.

End users are not affected: every shipped launcher and manifest invokes `node`
-- the workspace manifest pins the interpreter the preflight validated, and the
plugin manifests use bare `node`. Contributors are, because `AGENTS.md`
documents Bun as the toolchain.

### Root cause, found 2026-09-11

Neither suspect in 8.1 was right. The `save` path does not exit early and does not
fail: it never finishes. Under contention the command is still running when Bun's
event loop goes idle, `beforeExit` fires, and the process exits 0 having written
nothing. A preload that traced `process.exitCode` inside the child settled it --
every failing run reached `exit` with `exitCode` still `undefined`, so the `.then`
on `main()` had never run, while the one passing run in the same batch showed
`exitCode=0`. Adding a single `setInterval` in a preload, changing nothing else,
turned 8 silent failures into 8 full 2,062-byte successes that simply took longer.

What Bun is failing to count is still open. `process.getActiveResourcesInfo()`
returns `[]` throughout, but that says nothing either way -- Bun implements it as a
stub that always returns `[]` (oven-sh/bun#24538), so it is not evidence. `sharp`
was the obvious suspect, being the one native dependency on this path, and it is
innocent: a pending `sharp` operation holds Bun open exactly as it holds Node
open, checked directly. Identifying the primitive is worth a bounded look, because
it would say whether other hosts are exposed; it does not gate the fix, which is
correct whatever the primitive turns out to be.

So this is not a `save` bug, an evaluator bug, or a flush race. It is the CLI
entry contract. Every entry -- `isDirectCliEntry`, the generated workspace
`kiln.mjs` launcher, `assetMain` through `main` -- awaits `main()` and then sets
`process.exitCode`, which assumes the runtime keeps the process alive while that
promise is pending. Node does in practice; Bun does not. The fix wraps `main`
itself in `withProcessAlive`, a ref'd far-future timer cleared in a `finally`, so
it costs no wakeups and covers every call site rather than one. Measured on the
same 8-way concurrent repro that produced 7-of-8 silent failures before: 8 of 8
full output after. The load-sensitive `src/asset-cli.test.ts` went from 3 failures
in 6 concurrent runs to 6 of 6 passing.

| ID | Task | State |
| --- | --- | --- |
| 8.1 | Find where the `save` path exits early under Bun without a diagnostic | Done -- it does not exit early; `main()` never settles and Bun exits the idle loop at 0. Fixed by `withProcessAlive` in `src/cli.ts` |
| 8.2 | Decide whether the CLI should refuse to exit 0 having produced no output at all, independent of the Bun cause | DECIDED: no. The silent-success shape is now structurally unreachable from this cause, and a blanket "no stdout means nonzero" rule would be a guess layered over a fixed defect -- it would have to assume every command is obliged to print, which is a contract the CLI has never stated. The guard belongs in the test that reads the output, not in the command that produces it. Closed |
| 8.3 | Point `src/asset-cli.test.ts` at an interpreter that reflects how the CLI actually ships, or assert non-empty stdout before parsing so the failure names the real cause | Done -- asserts non-empty stdout before `JSON.parse`. Left on Bun deliberately: Bun is the documented toolchain, so the test should keep exercising the runtime that exposed this |
| 8.4 | Re-check the other two intermittent tests against this finding | Done, and the hypothesis does not hold. `shipping proxy forwards actual PNGs ...` in `scripts/evaluation/observe-shipping.test.mjs` passed 8 of 8 under the same concurrency that reproduced the `save` failure on demand, and its entry is event-driven with a live child-process handle rather than an awaited `main()`, so it cannot reach this state. That test's intermittency is still unexplained; it is not this defect |

## Phase 10 -- Toolchain currency, and what the bump uncovered

Taken 2026-09-11. Bun 1.3.14 -> 1.4.2, Node 22.23.1 -> 22.23.2, npm 12.0.1 ->
12.0.2. Deliberately its own pass with nothing else in it, because every gate in
this repository runs on Bun and a regression needed exactly one suspect. That
discipline paid for itself immediately: the bump surfaced a shipped defect that
had been present since the bundle was introduced.

Bun 1.4 also fixes Phase 8 at its source. Running the *pre-fix* CLI from
`origin/main` against both runtimes: 2 of 8 concurrent runs produced output on
1.3.14, 8 of 8 on 1.4.2, and 16 of 16 on a longer trial. `withProcessAlive`
stays anyway -- it holds for anyone still on 1.3.x, and no runtime contract
promises the behaviour. The offline suite runs about 18% faster (133 s against
163 s).

### 10.1 -- `dist/mcp-server.mjs` started a server when merely imported

`src/mcp-server.ts` guarded its entry block with `import.meta.main`. That is a
Bun property, and no Bun release lowers it correctly for a `--target=node`
bundle. Both lowerings observed emit `__require.main == __require.module`; under
Node ESM both sides are `undefined`, so the guard was **always true**. Verified
directly against the committed 1.3.14 bundle: importing it printed
`kiln MCP server on stdio (auto)` and left a live stdio server attached to a
process that only wanted to read the module.

Bun 1.4 then stopped emitting the `__require` helper the line still references,
so the same expression became a `ReferenceError` at startup -- loud where it had
been silent, which is the only reason this was caught at all. The bundle is what
every harness launches, so a bundle built on 1.4 without this fix would not have
started at all.

Both entries now share `isDirectEntry` in `src/direct-entry.ts`, deciding from
`process.argv[1]` rather than from whatever the bundler makes of
`import.meta.main`. `src/cli.ts` already did this correctly through a private
`isDirectCliEntry`; the two are now one function, and `mcp-bundle.test.ts` has
the inertness guard `cli-entry.test.ts` always had.

| ID | Task | State |
| --- | --- | --- |
| 10.1 | `import.meta.main` does not survive bundling to Node; the MCP entry block ran on import and became a `ReferenceError` under Bun 1.4 | Done 2026-09-11 -- shared `isDirectEntry`, guarded by a new inertness test |
| 10.2 | Re-record the coverage baseline measured under Bun 1.4.2 | Done 2026-09-11 |
| 10.3 | Consider whether other Bun-only globals reach a `--target=node` bundle. `import.meta.main` was the one that mattered; nothing else is asserted | **Done 2026-09-11.** Audited, and it found one live instance -- `src/experiments/geometry-acceptance.ts` still guarded its entry with `import.meta.main`. That file **ships** (`files` carries `src/**/*.ts`), and unbundled under plain `node` the identifier is `undefined`, so the guard was always FALSE and running the script with node did nothing at all, silently. The same defect as 10.1 with its sign flipped: there, bundling made the guard always TRUE and started a server nobody asked for. Now `isDirectEntry`. The bundles themselves were already clean of all nine patterns checked. `src/__tests__/bun-only-globals.test.ts` now asserts both halves, and was verified to fail on an injected defect in each rather than trusted for passing |

## Phase 9 -- Review surfaces that misreport a correct asset

Found 2026-09-10 into 2026-09-11 by a blind clone-and-author run: an agent given
no context beyond the repository itself, asked to clone it, set it up, and make
two assets, then to report what confused it. It followed the intended document
chain (`README.md`, engine `AGENTS.md`, `kiln-setup-workspace`, the workspace
`START.md` and `AGENTS.md`, the author skill and its references), never authored
in the checkout, never opened `src/`, `examples/` or `docs/`, mixed the MCP and
CLI surfaces without confusion, carried `programRef` lineage through anchored
edits three and four refs deep, and reported its inherited session loadout
unprompted -- including a rival `kiln-setup-workspace` registered from another
installation's plugin cache, which it declined in favour of the clone's copy.
Phase 7's guide and audit work is therefore validated end to end for the CLI
path. What the run could not exercise is the in-loop MCP surface, because only a
harness session started inside the workspace registers `kiln_workspace`.

The findings below share a shape worth naming: the asset was correct every time,
and the surface used to *review* it was what lied. That is the most expensive
class of defect here, because the review step is the whole loop's evidence, and a
model has no independent way to catch it.

9.1 is fixed. Everything else is recorded from the run's report and is not yet
independently verified; 9.2 is the one that looks like the same bug class as 9.1.

| Task | Detail |
| --- | --- |
| 9.1 | `visibility: 'isolate'` and legacy `isolate: true` were silently ignored whenever a GPU service was attached. Both hide by clearing `mesh.visible`; `views/raster.ts` culls on it, but glTF has no per-mesh visibility and Kiln writes its own GLB rather than three's `GLTFExporter`, whose `onlyVisible` defaults true. `kiln_inspect` asserted "nothing in this image occludes it" about images where everything still did. **Done 2026-09-11**: `renderDerivativeCell` prunes hidden meshes from a copy. Escaped because the only prior test framed a single-mesh scene, where isolation cannot change the image |
| 9.2 | `kiln_screenshot_animation` renders the entire asset rotating where the clip drives one joint. The run parsed the exported GLB's JSON chunk and found the `Spin` animation holds exactly one channel, targeting the spindle node, and that the node's subtree excludes the bench and seat that were visibly turning. Camera receipts were byte-identical across frames, so it is not a framing artefact. **NOT REPRODUCED 2026-09-11, and the engine is correct.** Measured on world matrices rather than pixels: a one-channel clip on a two-part asset moves the joint's subtree through a clean 180-degree yaw while the un-animated sibling stays at the origin at every phase. An image cannot tell a turret sweeping from a scene spinning, which is why the report was plausible. Closed with a regression test in `views/__tests__/animation.test.ts` so the question does not recur |
| 9.3 | `viewFidelity.exactArtifact` reported `false` on every render, including ones where the run independently hashed `inputGlbSha256` equal to both the exported GLB and the saved `asset.glb`. Either the flag means something narrower than its name, or it is wrong. **Done 2026-09-11.** It was neither the comparison nor the meaning: `exactArtifact` was a hard-coded `false` literal at every site, never computed. So its false value carried no information and invited the opposite of the truth -- a model could read it as "these bytes differ from an export" when they frequently do not. The value stays false, because this surface only ever renders an in-loop build; the new `IN_LOOP_BUILD_NOT_PERSISTED` reason code is what makes it readable |
| 9.4 | `kiln_screenshot_animation` requires a `clip` name and `frameTimes` normalized to 0..1, and neither is stated in the author skill or the camera recipes. The run guessed the clip name from its own `createClip` call and hit a validation error on seconds-valued frame times. **Done 2026-09-11.** The program contract now states that `clip` is required and matched by name, that `frameTimes` is 1..9 strictly increasing phases in 0..1 rather than seconds, and that a frozen-looking clip means `unresolvedTracks` -- a joint-name mismatch |
| 9.5 | `arrayRadial` count semantics are not inferable from the signature plus the example: whether the source mesh survives as the copy at index 0 had to be deduced from a mesh count. **Done 2026-09-11.** Both array helpers now say it outright: `count` is the TOTAL including the source, which survives as copy 0, so the call returns count-1 new instances |
| 9.6 | CLI `--out` does not create parent directories, failing with a bare `ENOENT` *after* the build succeeded and printed a `programRef`. Invisible from the README, whose example writes into the cwd | Done 2026-09-11 -- `prepareDestination` in `src/cli-output.ts`, applied at every CLI destination: `render --out`, `render --views`, `generate`, `source <ref> --out` and `export --out`. Guarded by `src/__tests__/cli-out-directories.test.ts` |
| 9.7 | The MCP server resolves the render service once before its first connection, so a service started afterwards is invisible until the session restarts, while the CLI picks it up on the next call. **Done 2026-09-11, and by a wider route than a lazy re-probe: see Phase 11.** Re-probing would have cured the symptom while leaving the user two processes to sequence. The server now starts the service itself, so there is nothing to have started first and nothing to restart |
| 9.8 | Narrow the generated per-harness configuration to suppress user-level skills and MCP servers where each harness supports it | **ANSWERED 2026-09-11: not implementable as written, and the reason is structural rather than effort.** Every documented suppression mechanism across all five harnesses is name-based, and the generator runs before it can know which unrelated skills and servers a given user has installed -- it has no names to write. The two name-agnostic candidates each fail the row's own test. See the section below; the vendor evidence is recorded there so this does not have to be researched again |

## Phase 11 -- The renderer moves to where the users are

Taken 2026-09-11. The render service was built for a hosted deployment: Graviton
instances running the engine, a RunPod GPU running the renderer, one HTTP hop
between them. That deployment is gone, and the people running this now are
running both halves on one laptop through an MCP server their coding harness
starts for them. The socket between the two is still right -- headless WebGPU
needs Node loader hooks Bun does not run, so the renderer cannot live in
process -- but everything around it still assumed an operator who starts
services in a known order.

Two things followed from that, and they are the whole phase.

### 11.1 -- The renderer is started on demand, not found or not at all

`buildRenderPort` gained an opt-in `autoSpawn`, which the MCP server passes and
the CLI deliberately does not: a one-shot `kiln render` should not pay a GPU
process's startup to draw one sheet, whereas a session amortizes it over
everything that follows.

Three properties carry the design.

**It attaches only where a renderer could actually run.** `localRenderServiceState`
answers from the filesystem alone -- no socket, no process, no GPU query -- and
`auto` attaches nothing unless it says `ready`. This is not an optimization. The
absence of `context.viewRenderPort` is exactly what `describeDrawnBy` reads to
call a CPU render ordinary rather than a degrade, so a hopeful port on a machine
with no renderer would make every ordinary render on every CPU-only machine
report itself as an incident. That is the Phase 9 defect class, and it would have
been worse than 9.7.

**It joins before it starts, and stops only what it started.** The shared port is
the documented 8000 rather than an ephemeral one, so a batch of dispatched agents
converges on one renderer instead of holding a GPU context each; the spawn also
re-probes if the child loses the port race. `stopLocalRenderService` kills
`child`, which stays undefined on the join path -- so the second agent to exit
cannot pull the renderer out from under the others, which would have shown up as
flat-white materials and no error anywhere.

**It adds no second deadline.** The lazy port awaits the start rather than failing
fast and warming in the background, because `captureViewsViaPort` already owns a
deadline for one in-loop call and already degrades to the CPU rasterizer when it
expires. A start that outruns it costs one CPU view and the next render has the
GPU. A second budget here would be the duplicated degrade policy AGENTS.md
forbids. A start that FAILS is cached as failed: a renderer that could not start
will not start for the next view, and a spawn per render would stall the loop.

`KILN_RENDER_PORT_URL` and `--render-port` short-circuit ahead of all of it, so
the hosted path this replaced is still exactly one flag.

**Measured end to end on the shipped bundle**, driven over stdio by a real MCP
client with nothing listening on 8000: first `kiln_render` returned in 5.4 s with
`materialFaithful: true` from `dawn-vulkan:nvidia-geforce-gtx-1660-ti` -- start,
GPU init, build and render, inside the 20 s in-loop deadline, so the first render
was material-faithful rather than the CPU view the design allows for. Second
render 1.7 s on the same service. The service was gone after the client
disconnected, and the server's stderr held one line. That last part is not
incidental: stdout is the MCP transport and the service greets its own boot on
stdout, so the child is spawned `stdio: ['ignore','ignore','pipe']`. One
`listening on :8000` line in that stream is a protocol error for every tool call
after it.

### 11.2 -- `render-service/` now ships

The MCP `instructions` string tells every model that material-faithful views come
from a renderer that "ships as render-service/ in this installation". That
sentence was false for anyone who installed from npm: the directory was in no
`files` entry, so a plugin user could not start a GPU renderer at all. Its source
now ships (15 files, 104 KB; tests and the Dockerfile stay out), while the ~94 MB
of native dependencies remain a deliberate opt-in install. `smoke-package.mjs`
asserts it both in the tarball and in a real installation, and walks the exact
`new URL('../render-service', import.meta.url)` arithmetic the bundle resolves
rather than trusting three paths to sit where the server will look.

`webgpu` moved 0.4.0 -> 0.6.0 in the same pass and was smoked on hardware: 36/36
unit tests, display conformance passed, end-to-end smoke ALL PASS.

Two failures found while doing it, **both pre-existing and both confirmed against
0.4.0 before being called that**:

- The smoke's health check pinned `lightingPresetIds` to exactly
  `['neutral-studio-v1']`, so adding `gallery-studio-v1` turned it red and left it
  red. Fixed to assert membership plus capability backing. A smoke that always
  reports one failure is a smoke nobody reads.
- `material-conformance.mjs` fails its albedo check with `lumaSpread: 0`, its
  textures failing to load as `blob:nodedata:` URLs. Not a general texture defect:
  a real textured example rendered through the on-demand path came back correctly
  textured. Harness-specific and open.

### A note on binding

`server.listen(PORT)` bound every interface. For a service the user starts that
is their call and the container deployment needs it, so the default is unchanged;
`HOST` is now honoured and the on-demand start passes `127.0.0.1`. Choosing to
put a renderer on somebody's LAN is not a choice to make on their behalf.

| ID | Task | State |
| --- | --- | --- |
| 11.1 | Start the packaged render service on demand from the MCP server, join one already listening, stop only what was started | Done 2026-09-11; closes 9.7 |
| 11.2 | Ship `render-service/` in the package so the `instructions` claim is true, and move `webgpu` to 0.6.0 | Done 2026-09-11, smoked on hardware |
| 11.3 | `material-conformance.mjs` cannot load `blob:nodedata:` textures, so its albedo/normal/ORM checks assert against an untextured render | **Done 2026-09-11, and the cause was the file's own guard.** It replaces `globalThis.fetch` with a thrower to prove an embedded fixture never crosses a network boundary -- but `blob:` is an in-memory object URL, and GLTFLoader mints one per embedded image that `ImageBitmapLoader` reads back through `fetch`. The guard blocked the only path a texture has into the renderer, and the file then measured an untextured render and asserted against it. `blob:` is now exempt and the guard self-checks that `https:` still throws. First `PASS` this file has ever produced |
| 11.5 | `material-conformance.mjs`'s normal-map threshold was `>= 3` and had never been evaluated, because the albedo assertion above it always failed first. Recalibrated to `>= 1` from measurement | Done 2026-09-11. The small number is the tone curve, not a weak response: the panel sits at mean luma ~242 of 255 under the fixture's own exposure of 1.38, past the ACES shoulder. Measured 1.51 at exposure 1.38 and 2.61 at 0.9 with nothing else changed, which is also the proof the map applies. The check still discriminates what it must -- an absent normal map reads near zero, the way the albedo checker read exactly 0.0 while textures were blocked |
| 11.4 | Give the CLI the same on-demand start behind an explicit flag. Deliberately excluded: a one-shot render should not pay a GPU startup, and `auto` must stay instant on a CPU-only machine | Not planned; revisit if asked |

### 6.4 is not independent of 6.2

Attempted and stopped, 2026-09-11. Unpinning `pages.yml` from `windows-2022`
cannot be done without first deciding 6.2, and the ledger was wrong to separate
them. All 83 provenance records carry a `posterReceipt`, and
`verifyRecordedPoster` asserts `artifactHash` against a GLB rebuilt on the
runner. Measured rather than assumed: `abyssal-surveyor` records
`eb18c8e8ec9b1c6f...` and rebuilds on Linux as `300ece4cd5de6dbc...`, so the
first example fails and so would the other 82. The Windows pin is not an
incidental choice of runner -- it IS the workaround for `artifactHash` hashing
bytes that serialization is free to change. Removing it means either re-recording
83 receipts on Linux, which only moves the pin, or changing what a poster receipt
asserts, which is 6.2. The maintainer's call on 6.1/6.3 -- that the gallery images
are display assets -- points at narrowing the receipt to `sourceHash` and
`imageHash`, the two claims that are platform-stable and that the gallery
actually makes. That remains a decision, not a task.

### 7.13, and why the archive is hand-rolled

The digest is published, so determinism is not a nicety here: an archive whose
bytes move on every build publishes a digest that is wrong the moment it is
written, and a client that verifies would reject every skill. Neither the system
`tar` nor a convenience library gives that by default -- both record real mtimes,
uids and gids. So `build-skills-discovery.mjs` writes POSIX ustar headers itself
with every non-content field pinned: mode 0644, uid and gid 0, mtime 0, empty
uname and gname, entries in sorted order. `node:zlib`'s gzip was measured
deterministic already, writing a zero MTIME and a fixed OS byte.

`skills-discovery.test.ts` asserts the pinned header fields directly rather than
only comparing two builds, and was verified to fail on an injected mtime. Two
builds agreeing proves nothing on its own: it is exactly what a tar with a
coarse-grained clock does when both builds land in the same second.

One limitation worth stating rather than discovering. This path carries skills and
no MCP server, so a client that loads them has the workflows and none of the tools
they describe -- `kiln_workspace` is absent and no call resolves. `docs/install.md`
says so where it offers the URL. SEP-2640 (7.12) is the mechanism that would carry
both, and it is still unratified.

### 9.8, and why a generator cannot narrow a loadout

Researched against vendor documentation on 2026-09-11, which is what the row said
it needed. The answer is that the task is not doable as specified, and the reason
is worth recording precisely so it is not attempted again on a hunch.

| Harness | Suppress user MCP servers from project config | Suppress or bound user skills from project config |
| --- | --- | --- |
| claude | `deniedMcpServers` (by name, URL or command), `disabledMcpjsonServers`, both settable in any settings file | `skillOverrides`, keys are skill NAMES, values `on` / `name-only` / `user-invocable-only` / `off`; any settings file. Plugin skills are explicitly exempt. Name-agnostic: `disableBundledSkills`, `skillListingMaxDescChars`, `skillListingBudgetFraction` |
| codex | project `.codex/config.toml` (trusted projects only), and `codex mcp disable <server> --scope project` | Nothing documented |
| opencode | project config MERGES with global rather than replacing it; nothing documented to suppress | **Nothing.** Global skills load from `~/.config/opencode/skills`, `~/.claude/skills` and `~/.agents/skills` unconditionally. `permission.skill.*` and `tools.skill` exist but govern invocation |
| hermes | `mcp_servers:` in `config.yaml`; skills in `~/.hermes/skills/` plus `external_dirs` | Nothing documented |
| agy | workspace `.agents/mcp_config.json` exists | Nothing documented |

**The structural blocker.** Every mechanism above that actually suppresses is
keyed by NAME. `deniedMcpServers` takes names, `skillOverrides` takes skill names,
`codex mcp disable` takes a server name. `scripts/create-workspace.mjs` runs
before any of that is knowable: it cannot enumerate what a stranger has in
`~/.claude/skills` on a machine it has not seen. There is no documented
"project skills only" or "ignore user scope" flag in any of the five.

**Both name-agnostic candidates fail their own test.** `skillListingMaxDescChars`
and `skillListingBudgetFraction` are real, are settable in a project file, and
would bound the cost of whatever is inherited without naming anyone -- but their
defaults and units are **not documented**. The skills page states only that the
combined description text is truncated at 1,536 characters. Writing a key whose
semantics cannot be verified is exactly the `${PLUGIN_ROOT}` failure class this
row was written to avoid. And OpenCode's `permission.skill.*` deny glob is fully
documented, but it blocks INVOCATION rather than loading, so it does not reduce
inherited context -- which is the entire point of 9.8 -- while it would stop a
user invoking their own skills inside their own workspace.

**One confirmation that the feared class is real, not hypothetical.**
`google-antigravity/antigravity-cli` issue 60: project-local
`.antigravitycli/mcp_config.json` is discovered at startup and its `mcpServers`
field is **silently ignored**, with only the HOME-level config loading servers.
Configuration that validates and does nothing, in the exact shape this row
predicted. CLI toggles landed in v1.1.16, which are again name-based.

**What would unblock it**, in order of how much it would buy: documented defaults
and units for the two Claude listing-budget keys, which would let a generated
workspace bound inherited context without naming anything; or a name-agnostic
project-scope switch in any harness; or SEP-2640 (7.12), under which a host
advertises its own skills as resources and the question of what else is registered
stops mattering as much.

Until one of those exists, reporting the inherited loadout -- which the setup skill
already does, and which the blind run did unprompted -- is the whole of what can
be done. That is a weaker outcome than the row wanted and it is the honest one.

### 7.13's first deployment served a 404, and the build was not at fault

Worth recording because the diagnosis ran the wrong way round for a while, and
because the cause is the failure class this document keeps naming.

The index was generated in CI -- the step logged all six skills with digests
byte-identical to a local build, which incidentally proved the archives
deterministic across machines as well as across runs. `vite build` copied
`public/` to `dist/` as it does locally. And
`https://kilnstudio.tools/.well-known/agent-skills/index.json` returned 404.

Downloading the Pages artifact settled it: 465 entries, `assets/`, `thumbs/`,
`build/` and the loose files, and **not one dot-entry**. So the files never
reached the deployment, which ruled out Pages' serving layer and Jekyll, the two
usual suspects. Reproducing CI's exact step order locally produced all seven
files, which ruled out the build.

The cause is in the action. `actions/upload-pages-artifact` v5 archives with:

```
--exclude=.git --exclude=.github ${{ inputs.include-hidden-files != 'true' && '--exclude=.[^/]*' || '' }} .
```

`--exclude=.[^/]*` strips **every** hidden path unless `include-hidden-files` is
set. A well-known URI is by definition under a dotted directory, so the default
silently deletes exactly what RFC 8615 requires. Nothing on a workstation could
have reproduced it: the exclusion lives in the upload, not the build.

Two things generalize. Reading the pinned action's own `action.yml` at its pinned
SHA answered in one request what several rounds of deduction had not -- the
dependency was right there and pinned, so there was nothing to guess about. And
`.well-known` is the only dot-entry in `site/dist`, so the flag was verified to
add exactly that and nothing else before being set.

## Phase 12 -- The in-loop MCP surface, finally exercised by real models

Taken 2026-09-11. Phase 9's blind clone-and-author run validated the CLI path end
to end but could not reach the in-loop MCP surface, "because only a harness session
started inside the workspace registers `kiln_workspace`". That sentence was the
real blocker the whole time. A note in the working plan had recorded it instead as
"needs credits or a working free model", which was wrong: it generalized a
third-party harness's billing failure -- one of the two dead opencode attempts --
into a requirement. The owner had already authorized subscription dogfooding; see
the M6 record. No credit purchase was needed or made.

Closed by two runs in two fresh generated workspaces, each a different model, so
neither inherited the engine implementation or the example collection that
`kiln-setup-workspace` warns changes what a model produces.

| Lane | Harness | Model | Result |
| --- | --- | --- | --- |
| A | `opencode` | `muse-spark-1.3-contributor-free` | Authored, reviewed, refined, exported. Exit 0 |
| B | `agy` | `gemini-3.8-flash-high` | Authored, reviewed, refined, saved, exported. Exit 0 |

Both followed the same real loop rather than a happy path: render, **look at the
image**, find a specific defect in their own work, fix it through an anchored
`kiln_edit`, and re-render to confirm. Lane A found its corner plates stopping
flush at the box edge instead of wrapping, and corrected the inset. Lane B found
bracket bolts protruding to `y = -0.012` under the floor and guarded the bottom
face, reaching `lowestPart.y = -5.96e-9`. Neither needed help; neither reported a
blocking defect.

Three things were verified that had never been verified by a real harness:

- **Phase 11's auto-spawn works.** Nobody started the render service. The first
  view needing PBR shading started it, and both lanes rendered material-faithful
  on `dawn-vulkan:nvidia-geforce-gtx-1660-ti`, with `materialFaithful: true`. The
  claim that there is "no order to get right and no session to restart" is now
  exercised rather than argued.
- **The generated workspace config loads in both harnesses.** `agy mcp list`
  reports "No MCP servers configured" inside a workspace that has a valid
  `.agents/mcp_config.json`, which looked like `antigravity-cli#60` -- project-local
  `mcpServers` read and silently ignored. It is not: a run resolves all thirteen
  tools. That subcommand lists user-level servers only. Worth knowing before it
  is diagnosed as a defect again.
- **`kiln-setup-workspace`'s loadout audit is followed.** Lane B reported nine
  unrelated user-level registrations unprompted. That is 9.8's problem measured
  rather than asserted, and it does not change 9.8's answer: the suppression
  mechanisms are still name-based, and the generator still has no names to write.

### Two findings from the reports, both verified rather than taken on trust

| Task | Detail |
| --- | --- |
| 12.1 | Lane A reported a doubled root: `/WoodenCrate[0]/WoodenCrate[0]/Mesh_...`, "harmless but unexpected on first read". **Reproduced, and the engine is correct.** The exported GLB has exactly one root and no per-primitive child nodes; the `parts` array is two levels deeper because it walks `/{scene}/{node}/{node}/{primitive}`, and `createRoot(name)` names the glTF **scene** and the root **node** identically. So the path is accurate and the repetition is two different things that share a name. Recorded so it is not re-investigated as duplicate nesting; Lane A's own characterization was right |
| 12.2 | Lane A noted `materials: 38` on an asset with three distinct materials. Accurate but easy to misread: `materials` counts per-mesh material slots and equals the draw count, while the same result already carries `distinctMaterials` alongside it. Measured on a fixture reusing two material objects across six meshes: `materials: 6`, `distinctMaterials: 2`, `uniqueMaterials: 2`. Both numbers are honest and both are present; only the more eye-catching one is the less useful. Not changed -- renaming a stable result field is a schema break for a cached tool definition, and the correct value is already there |

Also observed, and **not** a defect: `kiln_validate` accepts a program whose
`createPart` arity is wrong, and `kiln_render` then rejects it. That is the
documented split -- validate covers syntax and sandbox rules, not semantics -- and
Lane B's sandbox rejection did carry its specific diagnostic
(`generated code used an undeclared variable`), so the generic message is what a
caller sees only when no diagnostic maps to the failure.

## Phase 13 -- Parity, gates, and the remaining polish queue

Opened 2026-09-12. Phases 6, 9, 10, 11 and 12 are closed; 7.12 is the only older
row still open and it is blocked upstream. This phase is the agreed queue for
getting the repository to a state a stranger can build on, decided with the owner
on 2026-09-12.

### The lesson this phase starts from

The r186 bump moved `three` in the engine and in `render-service` and **missed
`site/`**. That is not tidiness: kiln emits `EXT_mesh_gpu_instancing`, and r186
fixed that extension's custom instance attribute sharing in `GLTFLoader`, so a
site one minor behind renders the gallery with an unfixed loader for an extension
the engine writes. The same class of defect -- a value that must agree across
files with nothing enforcing it -- had been caught in the prose that same morning,
by a person, hours earlier. Twice in one day is the argument for a gate rather
than for more care.

| ID | Task | State |
| --- | --- | --- |
| 13.1 | `site/` to three 0.186.0, and `check:toolchain` gains a cross-manifest guard: `three` must be byte-identical in every manifest that pins it, and `@types/three` must track its minor | **Done 2026-09-12.** Verified by injecting three separate defects -- the exact site drift that shipped, a `render-service` drift, and a `@types/three` left a minor behind -- and confirming each is caught and names the offending manifest |
| 13.2 | Safe in-range dependency refresh, kept strictly separate from the deferred majors: `ai` 6.0.222 to 6.0.282, `openai` 6.46.0 to 6.49.0, `@ai-sdk/provider` 3.0.14 to 3.0.16, `@aws-sdk/client-bedrock-runtime` 3.1083.0 to 3.1131.0, and in `site/` react/react-dom 19.3.0 and vite 8.3.0 | **Done 2026-09-12.** Every other pin in the tree was already at latest. Two things came out of it. The `@types/three` rule generalized to every `@types/*` whose runtime the same manifest pins, which is what brought `@types/react` and `@types/react-dom` along with react 19.3 rather than leaving them a release line behind. And `check-toolchain.mjs` gained **its own test**: it takes `--root`, and each case stages a real copy of the repository's files, mutates one value, and asserts the gate names it. Three extensions had each been verified by hand once; nothing stopped a later edit from leaving a rule that could no longer fail |
| 13.3 | Raise the coverage ratchet from 92/91 to 94/92. Measured 95.27% functions / 92.49% lines, so this keeps roughly 1.3 and 0.5 points for normal churn | **Done 2026-09-12.** In absolute terms that is 42 functions and 224 lines of room, which is what the gate now prints -- a percentage says whether it passed, and turning that into work needs LCOV totals the person who tripped it does not have. The gate also refuses a threshold set above the baseline it records, and refuses a thresholds file that records no baseline: a threshold above anything ever measured fails in whatever change runs next and reads there as that change's regression |
| 13.4 | Promote the Windows job from `continue-on-error` to blocking | **Done 2026-09-12, both halves.** Nine runs with the job: seven green, two red, no recurrence of the GLib fault, and four consecutive greens including two on main. Both reds were this session's own new code and both were real Windows-only defects, which is the argument for blocking. Given a 30-minute bound, since a blocking job that hangs is a blocked merge. A test now rejects `continue-on-error` at job level so this cannot be demoted by one line. main's branch protection now requires three contexts rather than one -- `typecheck . lint . test`, `typecheck . lint . test (Windows)` and `render service tests` (13.7) -- added after the jobs had each reported on main, since a required context that never reports blocks every PR instead of guarding them. `strict` stays on, so a branch must be current with main to merge |
| 13.5 | Clear the one substantive lint finding: an unused import in `src/__tests__/optimize.test.ts`. Everything else in the 14/11 baseline is `useTemplate` and `useOptionalChain` style | **Done 2026-09-12, wider than written.** The 14/11 split was not all style: `isFinite` in the render inspector was the coercing global, `forEach` in the Bradley-Terry fit returned a value its callback discards, and three `any` bounds in `buildSandboxGlobals` were guarded by `eslint-disable` comments in a repository that lints with Biome and has no ESLint config -- suppressing nothing while reading as accepted. All 25 findings are fixed and the tree reports zero. `lint` now runs `--error-on-warnings`, and since that does not reach Biome's info severity the seven rules involved carry an explicit `error`; each was verified by reintroducing its defect. A baseline kept in prose is one the next finding arrives invisible against, which is why this went past the single unused import |
| 13.6 | Decide shadows by comparison, not assumption. r186 deleted the `PCFSoftShadowMap` implementation; `render-service` now names `PCFShadowMap`, and `VSMShadowMap` is the soft filter that survives. Render gallery presets under both and choose by eye, because this is the only user-visible regression in the r186 upgrade and it lands on marketing surface | **Premise was wrong; the real defect is fixed 2026-09-12.** **No shipped preset enables shadows** -- `neutral-studio-v1` sets `shadows.enabled: false` deliberately, `gallery-studio-v1` spreads it, and every light has `castsShadow: false`. So r186 is not a visible regression here and there is nothing to compare by eye: both filters render the same image, which has no shadow in it. Yesterday's `PCFShadowMap` edit corrected a line that never executes, and its claim about keeping the log clean was overstated -- the assignment is inside `if (preset.shadows.enabled)`, so the deprecation warning never fired either. What WAS wrong: `shadows.type` described a filter and selected nothing, and after r186 the one string the validator accepted was the one filter that no longer exists. It now selects from `basic`/`pcf`/`vsm`, the renderer maps each to its three constant, and the renderer checks at load that the map covers the schema's list -- verified by adding `pcf-soft` back and watching the service refuse to start. The gallery is unaffected for a second, independent reason: neither `<Canvas>` in `site/` sets r3f's `shadows` prop, so `shadowMap.enabled` is false there as well, and the only shadowing on that surface is drei's `ContactShadows`, which runs its own depth pass to a texture and never reads `shadowMap.type`. Across both paths r186's PCFSoft removal changes nothing anyone can see. **Comparison rendered 2026-09-12; see 13.8.** The filter question is answered and it is not a decision. What remains open is whether the gallery should cast shadows at all, which turns out to cost renderer work rather than a preset flag |

| 13.7 | `render-service` in CI. Found while fixing 13.6: a shipped subsystem with 37 tests ran in no workflow, so the 13.6 change itself would have had no CI coverage. Every one of those tests is pure -- framing arithmetic, PNG readback packing, cache identity, contract and preset validation -- and none acquires a device, so the job installs with `--ignore-scripts` and skips the `webgpu` package's native Dawn build | **Done 2026-09-12.** Verified against exactly that install with no binding built: 37 pass, 0 fail. The GPU smoke and the two conformance runs stay manual, because those do need a device |

| 13.8 | Render the shadow comparison 13.6 called for, on three gallery assets spanning the size range: espresso machine (0.76 m radius), ribbon tea pavilion (5.67 m), gothic gatehouse (12.47 m) | **Done 2026-09-12.** See the measurements and the three findings below |

### What the comparison measured

Each asset rendered through the real service under four rigs, against a fourth
control with the ground present and nothing casting, so the shadow itself is
isolated. Deltas are per-pixel maximum across RGB, and the percentage is pixels
differing by more than two levels out of 255.

| Asset | shadow vs no shadow | PCF vs VSM |
| --- | --- | --- |
| espresso-machine (0.76 m) | max 54/255, 1.84% of pixels | max 41/255, 0.29% |
| ribbon-tea-pavilion (5.67 m) | max 26/255, 6.05% | max 17/255, 0.20% |
| gothic-gatehouse (12.47 m) | max 27/255, 2.61% | max 25/255, 1.29% |
| ribbon-tea-pavilion at 1280px | max 40/255, 6.01% | max 17/255, **0.14%** |

**The filter is not a decision.** PCF and VSM differ on at most 1.3% of pixels and
never by more than 41 levels, at a shadow edge, with a mean delta of 0.01--0.09.
There is nothing to choose between them by eye, which is what the 1:1 crop of the
pavilion's shadow edge confirms. `pcf` stays the shipped name.

**Decided 2026-09-12: the gallery does not cast shadows.** The owner's call, and the
measurements support it. The site's `<Canvas>` already grounds an asset with drei
`ContactShadows`, which runs its own depth pass and never consults
`shadowMap.type`, so the surface a visitor actually looks at has the cue that
matters. A directional shadow would add 2-6% of pixels at a maximum delta of
27-54/255, from a shipped 3/4 view whose camera sits six degrees from the key light
-- close to the worst angle for showing one -- in exchange for the four pieces of
silently-failing renderer work below. **This row is closed, not deferred.** The
analysis stays because it is the reason, and because anything that revisits the
question starts from these four rather than rediscovering them.

**Turning shadows on is renderer work, not a preset flag.** Four things stood in the
way, and the first three were each found by the probe producing no shadow at all:

1. **A receiver.** The service renders an asset against a flat background with no
   ground, so a shadow has nowhere to land. The no-ground variants came out
   comparable to the shipped render -- self-shadowing on these assets is invisible.
   The probe added a plane; a real implementation has to decide whether the gallery
   gets a visible floor or a shadow-only catcher, which is the look the site already
   uses via drei `ContactShadows`.
2. **Per-asset shadow-camera placement.** A directional light's position is only a
   direction for shading, but the shadow camera is *physically placed there*. Preset
   positions are fixed world coordinates -- key at `(4, 7, 5)` -- and gallery assets
   run from 0.76 m to 43.4 m radius, so the caster sits 9.1 m from an espresso
   machine and **inside** a 12 m gatehouse or a 43 m cathedral. Without fitting, no
   asset in the gallery gets a shadow. The fit must move the camera along the
   preset's direction, never change that direction, or shading changes with it.
3. **Frustum fitting.** three's default directional shadow camera is a fixed 10-unit
   box. near/far must bracket the light's *distance to the asset*, not the asset's
   radius -- sizing far from the radius put the far plane at 9.07 m with the caster
   at 9.14 m, and the result was a correctly rendered 2048x2048 shadow map with no
   shadow in the picture. Silent in both directions.

4. **The camera is standing on the light.** Pointed out by the owner mid-review and
   confirmed by orbiting: `beautyCameraSpec` looks down `[1, 0.65, 1]`, azimuth 45
   degrees, and the key light at `(4, 7, 5)` is azimuth `atan2(5, 4)` = 51 degrees.
   **Six degrees apart**, so the shadow falls almost directly behind the asset from
   the camera's point of view and the shipped 3/4 view is close to the worst angle
   for showing one. An eight-step orbit of the pavilion at 22 degrees elevation makes
   this obvious: barely visible at 45, unmistakable at 225 and 270. Any decision to
   ship shadows has to separate the camera azimuth from the key light's, or move the
   key -- and moving the key changes the lighting of all 86 gallery assets, so the
   camera is the cheaper end.

Not a finding, but ruled out along the way: shadow maps work in this WebGPU/Dawn
build. A minimal box-on-plane scene casts correctly under all three filters, which
is what separated "the rig is wrong" from "the backend cannot do this".

### Explicitly not in this phase

- **7.12 / SEP-2640.** Still `In Review` on the Skills Over MCP working group's own
  board, with the reference implementation also in review. Nothing to build against.
  Re-checked 2026-09-11; the first summary read claimed it had gone Final, and that
  was wrong -- the charter is the authority, not a page summary. Re-checked again
  2026-09-12 and superseded by Phase 14: the row now turns on the TypeScript SDK's
  version, not on the SEP's status.
- **The `ai` 7 / `@ai-sdk/provider` 4 / `@openrouter/ai-sdk-provider` 3 family.**
  Deferred by decision. Only `test:live` exercises those paths, it spends money, and
  the deliberate prompt-cache transport asymmetry is exactly what a provider major
  breaks silently. 13.2 deliberately takes the in-range updates and leaves these.
  **Superseded by Phase 14**, which checked this reason rather than inheriting it:
  the family is blocked upstream and the money was never the binding constraint.
- **11.4.** Answered: the CLI already joins a running service, and auto-spawn would
  make a one-shot command pay a GPU startup it cannot amortize.


## Phase 14 -- The two deferred rows, re-grounded

Opened 2026-09-12, after Phase 13 closed. Nothing here was queued work. Both rows
left open were deferred *with a reason*, and this phase checked the reasons instead
of inheriting them. One held for a different cause than the one recorded, one was
wrong, and the wrong one was sitting on top of a mismatch that already exists in
the installed tree.

| ID | Task | State |
| --- | --- | --- |
| 14.1 | Re-ground 7.12 / SEP-2640 against an authoritative source | **Done 2026-09-12.** Deferred still, for a stronger reason. See below |
| 14.2 | Establish what actually blocks the `ai` 7 family, and gate it | **Done 2026-09-12.** `@strands-agents/sdk@1.17.0` is latest, declares peer `@ai-sdk/provider: ^3.0.0`, and its `VercelModel` is typed on `LanguageModelV3` in 21 places. `@openrouter/ai-sdk-provider@3.0.0` requires `ai: ^7.0.0`; `ai@7.0.99` depends on `@ai-sdk/provider@4.0.14`. The family cannot be taken until Strands ships a release accepting the v4 spec -- no budget changes that. `scripts/peer-ranges.test.mjs` now fails on a peer range the version beside it does not meet, verified by patching the installed `@openrouter/ai-sdk-provider` manifest to peer `ai: ^7.0.0` and watching it report `installed 6.0.282` |
| 14.3 | Assert the prompt-cache breakpoint on the wire, offline | **Done 2026-09-12.** Both native transports captured in `src/agent/providers.test.ts`, both differential. See below |
| 14.9 | Re-read SEP-2640 from primary sources; correct the record and close the readiness gap it exposed | **Done 2026-09-12.** The recorded design was two mechanisms out of date, the recorded status heuristic was backwards, and "nothing to build against" is no longer true. Still not implemented, for a different reason. See below |
| 14.8 | Regenerate `docs/tools.md` and wire its drift check into the suite | **Done 2026-09-12.** 128 insertions of understated schema, published since 13.2. The check is a test now, verified by dropping one `minItems` line and watching it name the file |
| 14.7 | The rest of `scripts/` under the formatter, now that 14.5 made it free | **Done 2026-09-12.** 480 files where 442 were; every directory holding code is in the surface. Turned up two findings nothing else would have: two `any` in the evaluation host, and a stale generated doc -- see 14.8 |
| 14.6 | `render-service/` into the lint surface, which needed its line endings settled first | **Done 2026-09-12.** 442 files where 416 were. See below |
| 14.5 | Give the coverage ratchet a scope, so repo-only code cannot move the engine's contract | **Done 2026-09-12.** Measured over `src/` alone; baseline re-measured at 95.39% functions / 92.59% lines; `lines` raised 92 to 92.1 so the narrowing does not quietly hand back slack. See below |
| 14.4 | Bring the repository's own gates under the lint gate, which they were never under | **Done 2026-09-12** for the gates and their tests: 416 files checked where 405 were, and the tree reports nothing. The one-off tools beside them are measured and deliberately left, below |

### 14.1 -- the decisive fact is not the SEP's status

Checked against the GitHub API rather than a rendered page: PR 2640 is `OPEN`,
neither merged nor closed, labelled `SEP`, `draft` ("SEP proposal with a sponsor")
and `extension`, last updated 2026-09-11T22:34Z. A page summary again reported it
as accepted and "now Final, with reference implementations and conformance tests in
place." That is the **second** time the same summary has been wrong about this row,
so the 2026-09-11 note is now load-bearing rather than incidental: read the labels,
not the prose.

What actually settles the row sits downstream of the SEP. `@modelcontextprotocol/sdk`
publishes **1.30.0** as latest -- the exact version installed here, at protocol
2025-11-25. There is no TypeScript surface for `skill://` resources to build
against, so ratification tomorrow would still leave nothing to implement. The thing
to re-check is the SDK's version, not the pull request's.

### 14.2 -- why a peer range needed a gate of its own

The repository's recurring defect is a value that must agree across files with
nothing enforcing it. A peer range is that shape one level out: the agreement is
between manifests this repository does not own, `bun install` warns and installs
anyway, and the code that breaks is a provider adapter reached only through the
agent loop.

`typecheck` looks like it would catch this and does not.
`@ai-sdk/provider@4.0.14` still exports `LanguageModelV3` beside V2 and V4, so
`import type { LanguageModelV3 }` keeps compiling after the bump; the break is a v4
model handed to a v3 wrapper, at runtime, on a path only `test:live` drives.

**The mismatch that already exists.** The peer walk found one, and it is not the
deferred family: `@strands-agents/sdk@1.17.0` declares peer
`@anthropic-ai/sdk: ^0.109.1`, which on a 0.x version resolves to
`>=0.109.1 <0.110.0`, and 13.2 took **0.125.0**. Fifteen minors past the range its
author declares, moved by a routine in-range refresh, noticed by nothing. Kept
rather than reverted -- the surface Kiln uses is `messages.stream` plus
system-prompt formatting -- and listed in the gate's `ACCEPTED` table with that
reasoning, so a *second* mismatch fails while this one is a decision on the record.
The staleness arm is gated too: an accepted entry that stops mismatching must be
dropped, verified by widening the range in the installed manifest and watching the
test say so.

### 14.3 -- what "only `test:live` exercises those paths" was hiding

Half true, and the wrong half had been assumed.

The OpenRouter side already asserted the bytes: it drives `doStream` with
`globalThis.fetch` replaced and reads `cache_control` and `provider.sort` out of the
outgoing JSON. The native side asserted that `toCachedSystemPrompt` returns
`[TextBlock, CachePointBlock]` and that those carry the discriminators the adapters
branch on -- the **input** to the transport, never its output. So the claim the whole
design rests on, that a cache point becomes `cache_control` on the wire, was carried
by a comment. Both native dependencies move inside their caret ranges on every
refresh, and losing this silently bills full price for every prefix that should have
been a cache read while every offline gate stays green.

Both native transports are now captured offline: the Anthropic client takes a
`fetch` that records and throws, the Bedrock client a `requestHandler` that does the
same, and neither test reaches the network. Both are differential -- a plain string
goes out with no breakpoint at all -- so the breakpoint has exactly one possible
origin.

Establishing that took an injected defect. The first draft asserted that Bedrock
auto-injects a system cache point for `anthropic`/`claude` model ids and that Kiln's
block array is therefore redundant there. It does not:
`_shouldEnableCaching()` returns false when no `cacheConfig` was passed, and Kiln
passes none to either native provider. `toCachedSystemPrompt` is the sole mechanism
on all three transports.

Verified the way the rest of this queue was -- by patching the installed Strands
adapters to drop `cache_control` and the converse `cachePoint`. Each injection fails
exactly the new test while **every pre-existing test stays green**, including the one
named "the adapter emits `cache_control`", which never checked that it did.

### 14.4 -- the lint baseline covered a subset of the repository

13.5 took the lint baseline to zero and `CONTRIBUTING.md` said so. Biome's
`files.includes` was `src/**/*.ts`, `site/src/**/*.{ts,tsx}` and `site/*.ts`, so
`scripts/` -- which holds this repository's own gates, and which `test:coverage`
already measures -- was outside the surface entirely. Found by adding
`scripts/peer-ranges.test.mjs` and watching `biome check` on its own path report
"No files were processed."

**Taken: the gates and their tests.** `scripts/check-*.mjs` and
`scripts/**/*.test.mjs`, which is a category rather than a subset -- the checks are
now checked. 416 files where 405 were. Ten findings were behind the hole: seven
format, reflowing seven files by 116 lines in total, and three real ones. A dead
`const` in `check-vision.mjs`, easy to miss because the identical line two loops
down is load-bearing, which is also what made the fix need a block-scoped anchor.
And two `useTemplate` on the `JSON.stringify(...) + '\n'` idiom. `reliability.test.mjs`
asserts both include patterns, verified by dropping `scripts/check-*.mjs` and
watching it fail: a directory silently leaving the lint surface is how this started.

**Left, with the cost measured rather than guessed.** The rest of `scripts/` is
one-off tools -- dispatch, promotion, poster upload, geometry experiments -- and
several are authored as dense single-expression lines; `observe-shipping.test.mjs`
was one 1,300-character line before this pass. Taking the whole directory costs:

- **26 lint findings**, 22 of them the same `+ '\n'` idiom, several inside minified
  lines where the fix is unreviewable and the file is no more readable after.
- **A 1,530-line reflow.** `scripts/` goes from 3,078 lines to 4,608, a 50% growth
  that is entirely formatting.
- **162 lines of coverage slack.** Lines fall 92.49% to 92.14% against a threshold
  of 92, leaving 62 lines of room where there were 224. Measured by taking the full
  pass and running the gate, not estimated.

**Correction, 2026-09-12, to the sentence this row first carried.** It said the
one-off tools are never executed so the reflow lands in the uncovered denominator.
That number is right and that mechanism is wrong, and the wrong mechanism pointed
at the wrong fix. Bun instruments only files it loads, and
`coveragePathIgnorePatterns` already dropped `**/*.test.mjs`, so the one-off tools
were **never in the report at all**: no `SF:` record for `dispatch-asset`,
`promote-asset`, `upload-posters`, `curate-texture-library`, `geometry-experiments`
or `harness`. Exactly four files under `scripts/` were instrumented, because tests
import them -- `evaluation/observe-shipping.mjs`, `build-runtime.mjs`,
`evaluation/conditions.ts` and `authorship.ts` -- totalling 229 lines against the
engine's 45,726, which is 0.5% of the denominator. Two of those four are dense
single-expression files, and reflowing them inflated their line counts while their
covered lines stayed where they were. That is where the 162 lines went.

So the finding is not "helper scripts dilute the ratchet in bulk"; `scripts/` was
only ever dragging the total down by 0.10 points. It is narrower and worse: **the
engine's coverage contract had a repo-only formatting input at all.** Fixed in 14.5.

`render-service/` stays out for an unrelated reason: its `src/**` is CRLF by
`.gitattributes` and Biome's formatter would rewrite the line endings.

One incidental finding worth keeping. Biome caps output at 20 diagnostics by
default, so `bun run lint` reported 20 findings in `scripts/` when there were 26.
`--error-on-warnings` still fails the gate, so nothing escapes -- but a count read
off that output is a floor, not a total.

### 14.5 -- the ratchet now says what it measures

The owner's call on 14.4's open question was to take the proper fix rather than the
cheap one. Measuring first changed what the proper fix was: see the correction in
14.4. The problem was never volume, it was that a number the repository enforces as
policy could be moved by reformatting code that does not ship.

`bunfig.toml` ignores `scripts/**` for coverage. Those tests still run -- they are
the gates -- but their sources leave the denominator, so the ratchet is a statement
about the shipped engine and nothing else. Re-measured on the narrowed scope:
**95.39% functions (3168/3321), 92.59% lines (42336/45726)**, both a little higher
than the blended numbers because the four instrumented `scripts/` files sat at
72.93%.

That narrowing hands back 44 lines of slack no new test earned, so `lines` goes from
92 to **92.1**, holding the 224-line margin 13.3 chose instead of pocketing it --
222 lines now. `functions` stays at 94, where the margin is unchanged in practice
(1.39 points against 1.27, 46 functions against 42). Tightening further is a
separate decision with its own friction and is not taken here.

**The record now carries its own scope.** `measuredBaseline` requires a
`measuredOver`, the gate refuses a baseline without one, and it prints it:
`Recorded baseline: functions 95.39%, lines 92.59% (over src/, bun@1.4.2,
2026-09-12)`. A percentage without its scope is as ambiguous as a threshold without
a baseline, and that ambiguity is exactly what made 14.4's first explanation
plausible enough to write down. Verified by a case in
`scripts/check-coverage.test.mjs` that omits the field, and by
`reliability.test.mjs` pinning both the raised threshold and the scope --
`bunfig.toml` losing the `scripts/**` line puts the formatting input straight back.

`AGENTS.md` states the scope where an agent reads it, beside the existing rule that
the ratchet must not vary by whether the runner has a GPU. Same class of rule: the
contract must not depend on things that are not the engine.

### 14.6 -- render-service was kept out by a frozen accident

14.4 left `render-service/` out because its `src/**` is `-text` in
`.gitattributes` and Biome's formatter would rewrite the line endings. Looking at
what the attribute was protecting turned that from a reason into the finding.

**The attribute was sweeping, not deliberate.** It arrived in the OSS release
commit (#51) alongside the other `-text` entries, and what it froze is
*inconsistent*: `contract.mjs`, `health-contract.mjs`, `presentation-presets.mjs`
and `server.mjs` fully CRLF; `renderer.mjs` at 395 of 399 lines; `cache-identity.mjs`,
`display-output.mjs` and `readback.mjs` each carrying a single stray CRLF line;
`framing.mjs`, `gpu.mjs`, `register-hooks.mjs` and `three-alias-hooks.mjs` fully LF.
A single stray CRLF line in an otherwise-LF file is the signature of an editor, not
of a decision.

**Those bytes really are hashed, which is why the replacement matters.**
`fingerprintRendererInputs` walks `render-service/src/` and hashes the file bytes
into the renderer's capture identity, so this is not a directory where line endings
are cosmetic. But `-text` only guarantees "whatever was committed"; the
`* text=auto eol=lf` rule at the top of the file guarantees what the fingerprint
actually needs, which is ONE line ending on every platform. Normalizing is a
strictly better guarantee than the attribute it replaces.

**Nothing re-validates the old fingerprint.** `capture-producer.v1` digests appear
in checked-in `examples/*.provenance.json` and evaluation results, but they are
records of the renderer build a poster was made under -- no test recomputes one and
compares. The precedent settles it: 13.6 edited `presentation-presets.mjs` and
`renderer.mjs` (#86), changing the fingerprint, and every gate stayed green. A later
build hashing differently is the point of recording it.

Eight files converted to LF, the attribute removed with the reasoning left in
`.gitattributes` where the next reader will ask, and the directory joined the lint
surface: 442 files where 416 were. Twenty-two format findings, then five real ones
-- three `useIterableCallbackReturn` and two `useTemplate`. The
`useIterableCallbackReturn` in `presentation-presets.mjs` is the same defect 13.5
fixed in the Bradley-Terry fit: a one-expression arrow in a `forEach` returning a
value the callback's contract discards. That is production render-service code, and
it was outside every lint gate this repository has.

`reliability.test.mjs` pins both include patterns and asserts the `-text` line stays
gone, since the next edit to a CRLF-era file is what would reintroduce the mix.
render-service's own 37 tests pass on the normalized sources.

### 14.7 -- the objection to the rest of `scripts/` was the coverage cost, and 14.5 removed it

14.4 left the one-off tools out and priced the alternative at 26 lint findings, a
1,530-line reflow, and 162 lines of coverage slack. After 14.5 the third term is
**zero** -- `scripts/**` is not instrumented at all -- so what remained was a diff
and a taste question, and the owner's call was to take it.

Thirty-four format findings and thirty-two real ones, over `.mjs` and `.ts` alike
(the `.ts` files under `scripts/` had never been linted either, since the pattern
was `src/**/*.ts`). The reflow is +1,993 lines, on repo-only code with tests.

Twenty-five were `useTemplate`, and seventeen of those were one idiom:
`JSON.stringify(...) + '\n'`, the receipt-file shape, repeated across eleven files.
Rewritten by walking back from each `) + '\n'` with a depth counter rather than
matching the argument, because those calls contain nested parens, objects and their
own string literals -- a regex over them misses the multi-line ones or stops at the
wrong paren. A shared helper is the obvious DRY move and is deliberately not taken:
`package-plugin.mjs` is in the package's `files` list, so importing one would mean
shipping another file for a cosmetic win.

Three findings were not cosmetic:

- **Two `any` in `scripts/evaluation/server.ts`**, the pilot evaluation host.
  `let previous: any` is read as `previous.config`, `previous?.deadline` and for
  truthiness, so it is now `{ config?: unknown; deadline?: number } | undefined`.
  And `args as Record<string, any>` fed a budget estimator that reaches through
  optional chains -- `Record<string, unknown>` does not typecheck there, which is
  presumably why it was `any`. It is now a declared `PilotToolInput` naming exactly
  the fields the image-cell budget depends on, which is documentation the estimator
  did not have.
- **`noAssignInExpressions` in `smoke-package.mjs`**: a loop's update step inside its
  condition, now a `for` header where a reader looks for it.
- **The literal ESC byte in `harness.mjs`'s ANSI stripper**, invisible in every diff
  and editor, now `\u001B` with the rule suppressed on the adjacent line -- matching
  ESC is the point of that expression, not an accident.

### 14.8 -- `docs/tools.md` is stale, and its drift checker runs nowhere

Found by the lint pass touching `generate-tool-reference.ts`.
`bun run docs:tools --check` exists, reports drift, exits non-zero -- and appears in
no workflow and no test. The same shape as 13.7, where a shipped subsystem's 37
tests ran on nobody's machine.

It is drifting now, and the cause is 13.2: `zod` 4.4.3 to 4.6.2 changed
`z.toJSONSchema` to emit `"items": false`, `"minItems"` and `"maxItems"` for
fixed-length tuples, so the published tool reference has understated every tuple
schema since that bump. Verified to predate this phase by stashing the rewrite and
re-running the check.

Not folded into 14.7: regenerating a shipped document and wiring its gate is its own
change with its own reasoning, and burying it in a formatting pass is how a doc
artifact changes without anyone reading why.

**Fixed 2026-09-12.** `docs/` is in the package's `files` list, so this was not an
internal note being wrong -- the understated schemas were published to every
install. Regenerating moved 128 lines.

The wiring is a test, not a workflow step. `generate-tool-reference.ts` now exports
`toolReferenceMarkdown()` and `toolReferencePath`, with the CLI behaviour behind a
direct-entry guard so importing the module neither writes the file nor sets an exit
code, and `scripts/tool-reference.test.mjs` compares the published file to the
registry. `bun test` already runs on Linux, Windows and both macOS architectures, so
a test needs no new job and cannot be a job somebody forgets to add -- which is the
failure mode being fixed, not a new instance of it.

Compared whole rather than section by section, because the drift that shipped was
four added lines inside one nested schema and any summary comparison would have
missed it. Verified by dropping a single `minItems` line and watching the test name
the file with the command that fixes it.

### 14.9 -- SEP-2640, read from the spec instead of from a page about it

Re-checked 2026-09-12 against the SEP text on the PR branch
(`seps/2640-skills-extension.md`) and the working group's own repository
(`modelcontextprotocol/experimental-ext-skills`), which carries the spec at
`specification/stable/skills.mdx` plus eighteen design documents. Three things this
ledger recorded are wrong.

**The design changed, and not cosmetically.** The extension now defines
`skills/list`, **`skills/get`**, and an optional `resources/directory/read`.
`skills/activate` is gone. So is everything that hung off it: no bundle, no scoped
tools or prompts revealed on activation, no progressive disclosure in the protocol.
The SEP is explicit that it "defines only the transport binding" and delegates the
format and the progressive-disclosure model entirely to the Agent Skills
specification. A `skills/list` entry is
`{uri, frontmatter, resources: [{uri, digest, size}] | "dynamic"}`, where
`frontmatter` is the verbatim YAML rendered as JSON, and `resources` is the unit a
host verifies and a user's approval binds to.

**The status heuristic recorded here was backwards.** This ledger told a future
session to "read the labels, not the prose", after a page summary twice reported the
SEP as Final. The SEP document's own `Status:` field now reads **Final**, while the
pull request's label still reads `draft`. Under the SEP process the document is the
status of record and the label lags it, so the note was pointing at the weaker
signal. What made the summaries untrustworthy was that they narrated merge state and
implementation state as if they were the same thing; the fix is to read the SEP's own
header and the individual implementation PRs, which is what this entry does.

**"Nothing to build against" is no longer true.** The spec's Dependencies section:
"This extension has no dependencies beyond the base MCP Resources primitive." The
2026-07-28 list-caching attributes are additive. Capability declaration rides SEP-2133
extension negotiation, and `@modelcontextprotocol/sdk@1.30.0` -- the pinned version --
already carries `extensions` in `ServerCapabilitiesSchema`, while `setRequestHandler`
accepts any schema, so `skills/list` and `skills/get` are registerable today. The
conformance tests **merged** on 2026-09-11 (`conformance#330`).

### Why 7.12 still waits, stated correctly

Not the SDK, and not the spec. **Nothing public consumes it.**

| Implementation | State, 2026-09-12 |
| --- | --- |
| TypeScript SDK convenience wrappers (`ext-skills#71`) | **Closed, unmerged** (2026-08-19) |
| Python SDK (`python-sdk#3485`) | Open |
| C# SDK (`csharp-sdk#1856`) | Open |
| Go SDK (`go-sdk#1238`) | Open |
| Conformance tests (`conformance#330`) | **Merged** 2026-09-11 |
| gemini-cli, fast-agent, goose, codex | Prototypes, all in one contributor's forks |
| Claude Code | "prototyped internally at Anthropic; not yet public" |
| GitHub MCP Server (`github-mcp-server#2360`) | **Closed, unmerged** |

Shipping the extension now would add a third transport of the tool-and-skill surface
that no host can call. This repository's central claim is that the registry drives
skins which are actually exercised, and a surface nobody calls is the opposite of
that. **The thing to re-check is the TypeScript SDK**: the published package gaining
skills helpers, or `ext-skills#71` reopening and landing, is the signal that a host
is expected to call this. Not the SEP's status, which is already Final.

### What the re-read is worth having done

Two pieces of the eventual work turn out to be already in place, and one gap was
open.

`skills/list` publishes, per file, `{uri, digest, size}` where the digest is
`sha256:{hex}` over raw bytes. 7.13's `/.well-known/agent-skills/index.json` already
derives sha256 over skill artifacts, so that derivation extends rather than gets
invented -- per file instead of per archive.

The SEP requires the final `<skill-path>` segment to equal the frontmatter `name`,
"so the skill name is always recoverable from the URI alone, without reading
frontmatter". `check:skills` has enforced exactly that -- `name` matches the
directory, and the Agent Skills naming rules -- since Phase 7. Nothing to add.

**The gap: skill bytes were not canonical.** `skills/**` was `-text` in
`.gitattributes` and carried the same accidental mix 14.6 found in
`render-service/src`: five files fully CRLF, two mixed, seven LF. It went unnoticed
because `check-skills.mjs` parses frontmatter with `\r?\n` and splits lines the same
way -- tolerant parsing, which is correct, over an artifact whose *bytes* this
repository publishes a digest of. Under `skills/list` those bytes become an
addressable resource with a published `digest` and `size`; under 7.13 they already
are. A digest is only a property of the content if the line endings are canonical.

Normalized to LF across `skills/` and both registry copies, the attribute removed,
and `check:skills` now rejects CRLF in any skill file with the reason in its header.
Verified by reintroducing one CRLF and watching it name the file -- and then, more
usefully, by `git checkout` restoring HEAD's pre-normalization bytes and the gate
firing on that too, which is the regression path that actually happens.

**Archives are on the record as removed, which bears on 7.13.** An earlier revision
of the SEP let an entry advertise pre-packed tar and ZIP archives; the Core
Maintainers removed them, for unpacking attack surface (decompression bombs, path
traversal, symlinks escaping the directory, normalization collisions overwriting
`SKILL.md`, setuid bits, device nodes) and because two encodings of one skill puts a
compatibility hazard in every host. 7.13's archives are not invalidated -- they are
Cloudflare's discovery RFC, fetched over HTTPS from this project's own origin, not
supplied by an arbitrary connected server -- but if archives ever come back to MCP,
the SEP names the conditions: no symlinks, no non-regular entries, a declared
uncompressed size, never the sole retrieval form, and unpacking to exactly the file
set the entry enumerates.


## Phase 15 -- What an audit of the audit found

Opened 2026-09-12, after Phase 14 closed with every row done or blocked upstream. The
starting question was whether "nothing open" was true, and the way to answer it was to
measure the repository rather than re-read the record. Every gate passes offline --
`check:toolchain`, `check:skills`, `typecheck`, `lint` over 481 files, 1858 pass / 2
skip / 0 fail across 215 files, render-service 37 pass, coverage 95.39% functions /
92.59% lines with 46 functions and 222 lines of slack. `bun outdated` across all three
manifests returns only the upstream-blocked `ai` 7 family plus one `webgpu` patch.

So the ledger was accurate. Four things it does not cover came out of measuring anyway,
and three of them are the same shape: a claim this repository publishes that nobody had
re-measured since the day it was written.

| ID | Task | State |
| --- | --- | --- |
| 15.1 | The README's remedy for converting a pre-rewrite clone does not work | **Done 2026-09-12.** See below |
| 15.2 | Three CI jobs report on every PR and block nothing | **Done 2026-09-12.** Both halves. See below |
| 15.3 | The documented offline gate does not run render-service's 37 tests, or `check:skills` | **Done 2026-09-12.** See below |
| 15.4 | `version` has been `0.6.0` for 21 shipped changes, and the tarball is named from it | **Done 2026-09-12.** 0.7.0, gated. See below |
| 15.5 | Linux and Windows package receipts had no reproducible source | **Done 2026-09-12.** Four receipts from one CI run; the check extracted. See below |
| 15.6 | `webgpu` 0.6.0 to 0.6.1 in `render-service/` | **Deferred 2026-09-12, and the reason is its publish date.** Gated on the owner's GPU smoke. See below |
| 15.7 | `--receipt` resolved against `root`, not the working directory | **Done 2026-09-12.** Found by assembling the release. See below |
| 15.8 | `v0.7.0` released | **Done 2026-09-12.** Tag `v0.7.0` at `44b4bc8`; four receipts and `SHA256SUMS.txt` from one CI run, each verified against the published tarball |
| 15.9 | The Windows failure was a real bug in the alias lock, not a flake | **Found and fixed 2026-09-12.** `mkdir` contention on Windows reports `EPERM`/`EACCES`, which was rethrown. See below |
| 15.10 | Post-release polish: is the repository actually pickup-ready? | **Done 2026-09-12.** Measured rather than asserted; two stale docs and one comprehension trap found. See below |

### 15.1 -- the tag is the whole rewrite, on the clone side too

Phase 3 already learned this in one direction. `git push --force origin main` looked
complete while a fresh clone still measured 57 MiB, because `refs/tags/oss-2026-09-05`
still pointed at the original `d941f15` and held every removed blob reachable; pushing
the tag took the clone from 92 MB to 52 MB, and the note written then says *"anyone
repeating this work should push every ref."*

The same fact applies to a reader converting an old clone, and the README did not say
so. Its remedy was `git fetch origin && git reset --hard origin/main`, which moves the
branch and leaves the tag. **This working copy was the evidence**: `.git` at 228 MB,
`HEAD` in sync with `origin/main`, the local tag still at `d941f15` with 66 removed
PNGs, against a fresh clone's 26 MB of identical content.

Reproduced in a throwaway copy by running the documented commands verbatim -- 59 MB
afterwards, and only because a `git gc` the README never mentions was added; without it,
228 MB. The two obvious next guesses are worse than ineffective, they are **refused**:

| Command | Result |
| --- | --- |
| `git fetch origin && git reset --hard origin/main` (documented) | tag unchanged at `d941f15` |
| `git fetch --tags origin` | `! [rejected] ... would clobber existing tag` |
| `git fetch --prune-tags --tags origin` | same rejection |
| `git fetch --tags --force origin` | `t [tag update]`, then 23 MB after `gc --prune=now` |

A reader therefore cannot discover `--force` by trying the obvious things first, which
is what makes this a documentation defect rather than a shortcut anybody would find.

Fixed, pinned in `scripts/reliability.test.mjs`, and verified the way the ratchet's own
tests are: the assertion fails on the old README text for the stated reason before it
passes on the new one. It asserts the **absence** of the broken form as well as the
presence of the working one, because the short version is the one a later simplification
reaches for.

Applied to this clone as well, backup first: a `git bundle` of the pre-rewrite lineage
(`dd9d5f7`, 177 commits, 235 MB) was written outside the tree and *verified by restoring
it* -- 119 removed files present at the tip, and all 83 posters recovered with sha256
matching the `imageHash` in their `examples/renders/*.json` receipts, which is invariant
I1 from Phase 1 run against the backup instead of the bucket. Only then the tag was
forced and the objects pruned: 228 MB to 23 MB, `fsck` clean, `HEAD` and tree hash
byte-identical.

**The clone figures had also drifted**, which is the second instance of the same shape.
60 MB full and 49 MB filtered, where the README said 52 MB and 48 MB: `.git` grew 18 MB
to 26 MB when the runtime bundles were re-added after the rewrite, and the checkout is
unchanged at 34 MB. The timing claims came out rather than being restated, because they
are network-bound and cannot be honestly re-measured from a different link.


### 15.2 -- the other half of "every CI job blocks"

`ci.yml` has five jobs producing six check contexts, because `macos-package` is a
matrix. Three of the six were required by main's branch protection. The other three
-- `build portable Node package`, `Node package . macOS arm64` and `Node package .
macOS x64` -- ran on every push and every pull request, reported **24 of 24 green
across the last 8 runs on main**, and gated nothing. A change that broke macOS
packaging failed the workflow and still permitted the merge.

This is the sibling of the defect class Phase 14 named. That one was a gate that
existed but ran nowhere; this is a gate that runs, reports, and does not bite.

What makes it worth recording is that the repository already knew. The test
`every CI job blocks; none of them merely reports` carries the comment *"This asserts
the repository's half. The other half is a GitHub setting: the job's check context has
to be listed in main's branch protection."* The comment was right, the name was
broader than the assertion, and for three jobs the setting had never been made. A test
name is a claim; this one outran its `continue-on-error` check by three contexts.

13.4's precedent decides the promotion rather than green runs alone: a context is
required only once it has reported, because one that never reports blocks every merge
instead of guarding it. It promoted the Windows job on nine runs, seven green. These
three have reported on every run since they were added.

The test now derives the context list from the workflow -- expanding the matrix into
one context per leg, since GitHub requires the expanded name and not the job key --
and compares it against the list that must be required. Verified by three separate
mutations, each failing and naming the exact context gained or lost: a job added, a
job renamed, and one matrix leg dropped. The first derivation attempt was wrong in a
way worth noting, because it still produced a plausible list: slicing each job with
`search()` from the job's own offset matched that job's header at position 0, so every
job sliced to a single newline and the matrix never expanded. It failed loudly only
because the expected list was written out independently.

**`build the gallery` stays unrequired, and that is the interesting half.** It is a
seventh context, from `pages.yml`, and it appeared on this phase's own first pull
request. Requiring it would be the obvious way to "complete the set" and would be
wrong: `pages.yml` is path-filtered to `examples/`, `site/`, `src/`,
`scripts/authorship.ts` and `README.md`, so it is silent on any pull request touching
none of those -- and a required context that never reports blocks the merge. `ci.yml`
carries no path filter, which is exactly why all six of its contexts can be required.
The rule, so nobody completes the set later: unconditional workflow, required;
conditional workflow, unrequired. `deploy to Pages` is a third case and needs nothing,
since it reports `skipping` rather than staying absent.


### 15.2, confirmed by its own pull request

Worth adding because the claim stopped being a deduction. `build the gallery` is
**absent** from PR #99's checks entirely -- that PR touched `CHANGELOG.md`, this file
and `reliability.test.mjs`, none of which match `pages.yml`'s path filter. Had the
context been required to "complete the set", PR #99 could not have merged. The rule is
not a precaution against something that might happen; it is a description of what did.

### 15.3 -- the gate that was documented and the gate that was run

`bun run test` is `bun test src scripts`. It never reached `render-service/`, whose 37
tests ran only in the CI job 13.7 added -- so a contributor editing that subsystem got
no local signal at all and learned about a break from a red pull request. `check:skills`
was the same mismatch pointing the other way: a step in CI's `checks` job that the
documented gate never named. Neither was broken. Both were invisible from the
instructions.

The subsystem genuinely cannot fold into `bun test src scripts` -- separate npm project,
own lockfile, native dependency -- so it gets its own script. What makes that cheap is
already recorded in the CI job's comment: all 37 tests are pure, none acquires a device,
and `--ignore-scripts` skips the Dawn build. Nothing had to change but the wiring.

The test asserts the general defect instead of the instance: every `bun run` command
`AGENTS.md` names must exist as a script, in both directions. **Reading the fenced gate
block rather than the whole file is what makes it discriminate**, and that was found by
trying to break it rather than by reasoning. The first version checked "named anywhere in
`AGENTS.md`" and stayed green when the gate line was deleted -- because the explanatory
prose that the same commit added mentions the same command. An assertion written against
a file is only as narrow as the region it reads.

That is three for three in this phase: every fix wired the check into `bun test` rather
than adding a CI job, for the reason Phase 14 gave -- a job is the thing somebody forgets
to add. 15.2 is the exception that proves it, since half of it could only ever be a
GitHub setting, and the repository half is what makes that half's absence loud.


### 15.4 -- a version that did not move, and a gate that could not see it

`version` was set to `0.6.0` at the OSS release and stayed there through 21 shipped
changes, while `package-candidate` named every tarball from it on every push. Two people
holding `kiln-engine-0.6.0.tgz` could have materially different software: the three.js
r186 major, the CommonJS removal, 128 lines of understated tool schema and a changed
`shadows.type` contract all landed under that one filename. That is why 0.7.0 rather
than a patch -- what accumulated is behaviour, not fixes.

The interesting half is the gate. `runtimeBuildIdentity` hashes `engineVersion` into each
entry's `identity` in `dist/build.json`, so a bump that is not rebuilt leaves the
committed bundle claiming a version it was not built at -- and `identity` is the value a
build receipt cites.

**Nothing caught that, and it was measured rather than reasoned.** With `version` at
0.7.0 and `dist/build.json` still recording 0.6.0, the full suite passed: 1860 tests,
zero failures. The obvious candidate to catch it cannot. `mcp-bundle.test.ts` rebuilds
`dist/mcp-server.mjs` and compares sha256 against the committed bytes, but the engine
version is read from `package.json` at module load rather than inlined by the bundler, so
the bytes are byte-identical at any version. The rebuild confirmed it from the other
side: `dist/build.json` was the *only* file that changed, all five `.mjs` bundles
untouched.

So the sequence was the repository's own TDD rule applied to a release step: bump, watch
1860 tests pass on a mismatch, add the assertion, watch it name `mcp 0.6.0` against
`mcp 0.7.0`, rebuild, watch it pass. A byte comparison is not a version check, and the
difference only shows up when the version is the one thing that moved.


### 15.5 -- a receipt that could not fail

The 2026-09-05 release attached four platform receipts. Only two of them had a
reproducible source: `test:package` ran in the macOS job and nowhere else, so
`linux-package.json` and `windows-package.json` were made by hand. Wiring the other two
platforms in is what the owner chose over hand-making them again, on the grounds that it
is what makes the *next* release cheap rather than this one.

That turned a copy-paste job into an extraction, and the reason is worth stating because
it is not deduplication. The receipt check was a ~400-character `node -e` one-liner
living inside the macOS job, and it hard-codes `assert.equal(r.platform,'darwin')`.
Copied to Linux and Windows, the line that has to change is buried mid-string among six
other assertions -- so the natural failure is a Linux job that asserts `darwin`, passes,
and attests nothing. **A receipt that cannot fail is not evidence**, and four near-copies
of one assertion is four chances to produce one.

`scripts/verify-package-receipt.mjs` is now one line in each of the four package jobs,
and extracting it bought two things nobody was looking for:

- Expected Node and npm versions are read from `engines` instead of written a second
  time, so `check-toolchain.mjs` stays their single source. The one-liner carried
  `'v22.23.2'` and `'12.0.2'` as literals, which would have silently outlived a
  toolchain bump.
- The receipt already records `engineVersion`, so it is now checked against
  `package.json`. Combined with 15.4 that closes the loop: the tarball's name, the
  committed bundle's `identity`, and every platform receipt now have to agree on one
  version.

`--tarball` overrides the path the receipt recorded, which is what lets one verifier
serve both uses. In the job the receipt names a tarball sitting right there and the
default is correct. At release-assembly time the receipts are downloaded artifacts whose
absolute paths belong to runners that no longer exist -- but their `tarballSha256` is
exactly what has to be checked against the file about to be published. Without the
override, verifying a release's own receipts would fail on a missing file, which is the
kind of thing found by thinking about the last step before writing the first.

Verified against a real receipt rather than fixtures alone. The Linux smoke was run on a
Linux host before the job was written -- 16 checks, `status: passed`,
`engineVersion: 0.7.0` -- so the job landed with evidence instead of hope. That receipt
is accepted; asking the verifier to assert `darwin` against it is rejected with
`platform: expected darwin, receipt says linux`; and appending one byte to the tarball is
rejected naming both hashes.

`REQUIRED_CHECKS` moves to eight, and **15.2's gate is what forced that edit** -- the
suite fails on a job whose context nobody decided about. First time a gate from this
phase caught the next change rather than a past one, which is the only real evidence that
any of them will keep working.


### 15.6 -- a native patch that is three hours old

The bump was selected for the release and then held, because reading what is in it
changed the decision. `webgpu@0.6.1` was published 2026-09-12T10:25Z, roughly three hours
before it was considered here, and `v0.6.0...v0.6.1` is four commits:

| Change | Weight |
| --- | --- |
| unmap a device's buffers when the device is destroyed | `index.js` +63, and a new `device-destroy-tests.js` +114 |
| `third_party/dawn` submodule, "update to latest" | the entire native graphics engine moves |
| `third_party/depot_tools` submodule | toolchain |
| README | +2/-2 |

The fix is relevant rather than incidental: render-service creates and destroys devices
per capture, and buffer unmapping on destroy is the readback path this repository has a
test file for. It is worth having.

What holds it is the second row against the calendar. A submodule bumped to "latest"
means the driver-facing native code moved by an unbounded amount, on the same day, and
**nothing in this repository can exercise it.** CI installs render-service with
`--ignore-scripts` precisely so the 37 pure tests can run without a device, so those
tests prove the package still resolves and nothing more. `render-service/src/`,
`package.json` and `package-lock.json` all ship inside the engine tarball, so this is not
a local-only dependency: it would be in the release artifact, attested by four receipts
that never touched a GPU.

So 0.7.0 ships from what CI has fully proven, and this is the first change after it,
gated on the owner's GPU smoke -- the same gate that already holds Phase 4 section 7 and
the two conformance runs. The distinction worth keeping is between a dependency whose
tests are evidence and one whose tests are only resolution: `--ignore-scripts` is correct
for CI and is exactly why CI cannot clear this.

**One thing found while looking, not fixed here.** `render-service/package.json` carries
an `allowScripts` field keyed by exact version -- `{"webgpu@0.6.0": true}` -- and
**nothing reads it.** It is not Bun's `trustedDependencies`, there is no
`@lavamoat/allow-scripts` dependency in the tree, and the README instructs plain
`npm install`, which runs install scripts regardless. It looks like a control over native
build execution and is not one. Left in place rather than deleted, because removing a
field that appears to be a security boundary is a decision the owner should make
knowingly: either wire it to a tool that honours it, or drop it. Noted so the version key
is not mistaken for something enforcing anything when 15.6 is eventually taken.


### 15.7 -- a test that could not tell two rules apart

`verify-package-receipt.mjs` shipped in 15.5 resolving `--receipt` against `--root`. In
the CI step those are the same directory, so it worked there, passed its own eleven tests,
and passed on four platforms across three pull requests.

Assembling the release is the first use where they differ: the receipts are downloaded
artifacts in a staging directory while `root` is the repository, so every path became
`<repo>/linux-package.json` and all four verifications failed with `ENOENT`. The assembly
script refused to publish rather than warning, which is the only reason this was found
before a release carried four unverified receipts.

The fix is one line. The lesson is in the test that did not catch it.

Its fixture wrote `package.json` and `package-smoke.json` into **one** temp directory and
passed that directory as `root`, which mirrors the CI step exactly -- and that is precisely
why it was blind. A fixture that reproduces the environment where a bug is invisible
inherits the blindness. The two rules "relative to root" and "relative to the working
directory" have identical behaviour whenever those directories coincide, so the assertion
had no way to distinguish them no matter how many fields it checked.

It now addresses the receipt explicitly, and a second case pins the rule with `root` and
the receipt in deliberately *different* directories. Both fail if the old behaviour comes
back, and the error names the defect: a doubled path,
`/tmp/kiln-receipt-root-BkY0tL/tmp/kiln-receipt-cwd-7OWwVU/package-smoke.json`.

Worth pairing with 15.3, which was the same shape in a different medium: there an
assertion read the whole file when it needed to read one block, and the prose in the same
commit kept it green. Here a fixture collapsed two directories that had to stay apart.
Both times the assertion was true and measured nothing.


### 15.8 -- what 0.7.0 attests to

Tag `v0.7.0` at `44b4bc8`, published with `kiln-engine-0.7.0.tgz`, four platform receipts
and `SHA256SUMS.txt`. The property worth naming is that all five assets come from **one**
CI run: the tarball is the artifact that run built, and each receipt is that same run's
smoke on its own platform. Before publication every receipt was verified against the
published file -- four platforms, one `tarballSha256`,
`cf3491064ed139898977bbcb6cfeccd430444c3a492dc834e9d1e51793202b17`, and all four agreeing
`engineVersion: 0.7.0`.

That chain is what 15.4 and 15.5 were for, and it only closed because 15.7's bug was
caught by a script that refused rather than warned. A release assembled by hand would
have had no step at which four receipts and one tarball were required to agree.

### 15.9 -- the number that was in the log the whole time

`rejects lost updates from eight independent processes` went red once on a Windows runner,
on a pull request whose diff could not reach it. The first reading here was that it was a
timing flake, with two candidate causes -- runner startup contention or a stall in
`rename`/`rmdir` -- and a note that neither could be told apart from a Linux host. **That
was wrong, and the datum refuting it was already captured:**

```
(fail) rejects lost updates from eight independent processes [123.61ms]
```

123ms. Both hang guards are 10 and 15 seconds away. Nothing was slow, nothing was killed,
and every explanation resting on elapsed time was dead on arrival. Ten green `main` runs
and a green rerun made "flake" the comfortable conclusion, and the duration beside the
failure was the thing that should have been read first.

A worker died fast, and `compareAndSet` has exactly one way to do that: the `throw error`
beside its lock, reached whenever `mkdir` reports contention with a code other than
`EEXIST`.

**Windows has exactly that case.** Directory deletion there is not synchronous: a directory
whose last handle has not closed sits in a pending-delete state, and `mkdir` on that name
fails with `EPERM` or `EACCES` rather than `EEXIST`. Every release in this file runs
`rmdir(lock)` inside a `finally`, so with eight processes contending on one lock, a
process arriving in that window is ordinary contention -- and the code rethrew it, exiting
the worker non-zero with a stack trace the parent reported as `Worker failed:` and an
empty stderr.

Two changes, and the second matters as much as the first:

- `isLockContention` recognises `EPERM` and `EACCES` **on Windows only**. Widening it to
  every platform is the over-fix: on POSIX those codes from `mkdir` mean the parent
  directory is not writable, and swallowing them would report a real permission fault as
  "busy". Both mistakes are pinned -- reverting to `EEXIST`-only fails the Windows case,
  over-widening fails the POSIX guard.
- Lock release can no longer decide what the call throws. `rmdir` has no `force`, and on
  Windows it can fail while a scanner holds the directory; inside a `finally` that would
  replace a precise `Alias conflict` with an unrelated errno, or turn a successful write
  into a failure. Cleanup failures are swallowed now, and a lingering lock degrades to
  "busy" because `isLockContention` treats it that way.

Verified on Linux, because the decision was the defect and a predicate taking `platform`
as a parameter has every branch reachable from anywhere. That is the general point: this
looked like it needed a Windows host, and it needed the error-code decision extracted far
enough to test.

**The lesson is the diagnosis, not the fix.** "Intermittent on one platform, green on
rerun, ten green runs behind it" is a description that fits both a flake and a real race,
and the reflex was to treat the frequency as the diagnosis. The distinguishing evidence
cost nothing to read. This sits alongside 15.3 and 15.7: there an assertion was true and
measured nothing; here an explanation was plausible and measured nothing.


### 15.10 -- measuring "easy to pick up" instead of claiming it

The new-developer path was run rather than reviewed, in a fresh `--filter=blob:none` clone:

| Step, exactly as the README gives it | Time |
| --- | --- |
| `git clone --filter=blob:none ...` | 4 s |
| `bun install --frozen-lockfile` | 26 s |
| `bun run kiln render examples/crate.kiln.js --out crate.glb --views sheet.png` | 1 s |

About half a minute from nothing to a 324-triangle GLB and a rendered sheet. The
contributor path was run in that same clone, including the step 15.3 had documented but
never tested from scratch: `npm --prefix render-service ci --ignore-scripts` in 2 s, then
`bun run test:render-service` at 37 pass. `check:toolchain`, `check:skills`, `typecheck`
and `lint` all clean on first run.

Three things were wrong, and all three were doc rot rather than code:

**`docs/install.md` was directing readers away from the release.** Its "Release
compatibility" section named `kiln-engine-0.6.0.tgz`, an eight-tool surface, and five
tools the package lacked, closing with "use the checkout installation below **until an
updated package is released**" -- the exact condition 15.8 had just changed. Checked by
driving the published tarball's own MCP server over stdio rather than reasoning from the
registry: 13 tools, including all five named as absent.

The section was fragile because it restated facts that live in gated files. `docs/tools.md`
is already generated from the registry and drift-checked (14.8), so prose repeating it is a
second copy that nothing verifies. It now links the latest release and the tool reference,
and a test enforces that: install guidance may not hard-code a tarball version and must
point at `releases/latest` and `tools.md`. Scoped to the docs that tell a reader how to
*obtain* the package -- `CONTRIBUTING.md` keeps its `kiln-engine-0.6.0.tgz`, where the
filename is the evidence for why the version policy exists. Explaining a past artifact is
not directing a download, and the first draft of the gate did not make that distinction and
failed on it.

**`docs/migration.md`** still said the package version was held at `0.6.0` "until release
review".

**The two tool registries were a comprehension trap**, and this one came from a question
rather than a grep. `AGENTS.md` said two skins consume `registry.ts`, which reads as one
shared list; in fact `kilnToolRegistry` is the in-process loop's four tools and
`createKilnProgramToolRegistry` is the MCP surface's thirteen. The honest answer about the
one differing name is that **`kiln_screenshot` is merged, not missing**: in-process,
`kiln_render` returns metrics only and `kiln_screenshot` carries the six-view grid, so a
cheap structural check need not pay for an image; on MCP, `kiln_render` holds
`media: screenshotMedia` and returns metrics, part paths and images together, defaulting to
six views when `capture` is omitted. A separate screenshot tool there would be a second way
to ask for the same grid. The parity test pins the absence, and the first version of this
note cited that test as if it were the reason -- a test records a decision, it does not
explain it.

## Phase 16 -- What a user's bug report actually contained

Opened 2026-09-12 from a Reddit reply: VS Code Copilot showed "massive token usage
because of how Copilot mishandles `resource_link`", compacting seven times in about
thirty seconds, and the reporter had patched `createKilnAssetDefs` locally to return
`resourceUris` instead of `resources`. Three questions: was it already fixed, is it a
harness bug, or is it ours. The answer turned out to be "ours, but not where they
pointed" -- and finding that took measuring rather than reading.

| ID | Task | State |
| --- | --- | --- |
| 16.1 | Is the report already resolved? | **No, and provably.** `src/assets-resources.ts` has exactly one commit in its history (`dd98f82`, PR #54), and so does the `runTool` block that spreads links into `content`. The surface had never been touched since it shipped |
| 16.2 | Does the reported mechanism exist? | **No.** `kiln_save`/`kiln_export` results are ~2 KB; the links are 941 B of URIs carrying no bytes. A JSON-RPC tap recorded the Copilot CLI calling `resources/read` **zero** times |
| 16.3 | Asset links carried none of the fields a client needs to decide | **Done 2026-09-12.** `size` + `annotations.audience`/`priority` added; `editable.zip` unadvertised. See below |
| 16.4 | `kiln_present` puts up to 16 MiB of base64 files in `_meta` | **Open, with the shape decided.** The widget may call `resources/read` itself; see below |
| 16.5 | Reproduce in the reporter's actual client | **Done 2026-09-12.** VS Code logged the error 26s after our pre-fix server connected; after the fix the owner's own VS Code lists 13 of 13, `kiln_edit` included |

### 16.2 -- the measurement that redirected the whole phase

The instinct was to accept the report's mechanism and patch it. What the numbers said:

| Response | Whole | model-facing text | links | `_meta` |
| --- | --- | --- | --- | --- |
| `kiln_export` | 2,044 B | 1,058 B | 941 B | absent |
| `kiln_present` | 29,410 B | 1,058 B | 941 B | **25,661 B (87.3%)** |

So no asset tool sends file bytes to the model -- except `kiln_present`, which is the
only def in the registry carrying `ui:`, and which base64-encodes `asset.glb`,
`source.kiln.js` and `preview.png` into `_meta` up to `WIDGET_TRANSFER_LIMIT` = **16
MiB**. `src/asset-widget.ts`'s header comment -- *"binary files never enter
model-facing tool text"* -- is an assumption about client behaviour, not a property
the code enforces.

Two token deltas were measured on the Copilot CLI and then **discarded as evidence**,
which is worth recording because the first reading of them was wrong. A save-then-ask
session cost 240.4k input tokens for a tool-free question, against 169.8k for the same
question in a no-save session; that 70.6k gap looked like the resource links being
inlined. It is not. Copilot's reported input figure is **cumulative across internal
agent turns**, so one extra tool call adds roughly one whole transcript resend. The
stub server settled it independently: a tool returning **2,000,000 bytes** in `_meta`
produced a 31.2k-token turn. A correlation that survives one control can still be
measuring the wrong variable.

### 16.3 -- the fields that were missing

The pinned SDK's `ResourceLinkSchema` carries `size`, `annotations.audience`,
`annotations.priority`, `description` and `title`. Kiln set **none** of them, so a
client deciding what to spend context on had only a MIME type to go on. `audience` is
precisely the spec's channel for "for the human, not the model", and `size` lets a
client price a link before resolving it.

Both are now emitted. `asset.glb` and `preview.png` are `['user']`, because the model
already receives rendered views as image blocks from `kiln_render` and geometry from
metrics -- decoding a mesh buys it nothing. `source.kiln.js` is `['user','assistant']`,
since re-reading source is a legitimate model move even though `kiln_source` is the
cheaper way.

`editable.zip` is no longer advertised: it is a bundle of the files listed beside it,
so a client resolving every link paid twice, and it was simultaneously the largest
entry and the only derived one. It stays readable at its URI and in `downloadUrls`.

Net wire cost went **941 B to 1,017 B**, and that is not sold as a saving -- it is 76
bytes for every client becoming *able* to choose. The test compares each declared
`size` against the bytes `resources/read` actually returns for that URI, because a
size a client cannot trust is worse than none.

**The reporter's own patch is the shape to avoid.** Returning plain `resourceUris`
strips the typed blocks, so conforming clients lose `resources/read` discovery and the
widget wiring -- it fixes one broken client by degrading every correct one.

### 16.4 -- why the widget can stop carrying bytes, without a ceiling cut

The obvious fix was to drop the inline base64 and let the widget fetch. Checking
before committing said no: `src/viewer/chat-app.ts` spoke only `ui/*` --
`ui/notifications/tool-result` inbound (the host **pushes** the whole result),
`ui/resource-teardown`, and two outbound notifications -- with no way to ask the
server for anything. The fallback on the table was cutting `WIDGET_TRANSFER_LIMIT`,
which nerfs a working feature.

Reading the frontier instead found the answer already standardised. **MCP Apps**
(official extension, spec revision 2026-01-26) states that *"UI iframes can use the
following subset of standard MCP protocol messages: Tools: `tools/call`; Resources:
`resources/read`"*. So a widget **may** read resources itself, and Kiln is already on
that dialect -- `chat-app.ts` sends `ui/initialize` today and simply never uses the
read it is entitled to. The server half also already exists: `mcp-server.ts` registers
`kiln://assets/{collection}/{asset}/{revision}/{file}` and serves every file as
`blob`/`text`.

So the shape is: `_meta` carries the manifest and URIs, the widget reads each file
through `resources/read`, and `decodeWidgetAsset` keeps verifying sha256 against the
manifest exactly as it does now. This is **strictly better than the present
behaviour**, not a reduction: today anything over 16 MiB is *refused* a preview, and
per-file reads have no such wall. `tools/call` is available to the widget as a second
independent path if a host does not proxy reads. MCP Apps is supported by Claude,
Claude Desktop, VS Code Copilot, Goose and Postman.

### 16.5 -- the client under test was never the client reported

The Copilot **CLI** (1.0.83) does not reproduce the report: zero `resources/read`, and
`_meta` demonstrably not forwarded to the model. The reporter said "from VsCode", and
VS Code Copilot Chat is a **different MCP client** -- shipped **built in** to VS Code
1.137 (invisible to `code --list-extensions`; installing it fails as a downgrade).
Registering a tapped server there needs `code --add-mcp`, and the reproduction is in
flight behind that tap.

One harness fact worth keeping: of everything installed here, only the Copilot CLI
prints token counts and credits per run, which is why it is the instrument for token
accounting even though it is not the client with the bug. `antigravity` has no
headless mode at all -- it is an Electron IDE whose `bin/` holds only
`language_server` and `webm_encoder` -- so `--harness agy` targets a GUI, and `gemini`
CLI is the headless substitute for that model family.

### 16.6 -- the bug the report was actually sitting on top of

The user pasted one line from their own VS Code session while this phase was open:

> Failed to validate tool mcp_kiln_kiln_edit: Error: tool parameters array type must have
> items. Please open an issue for the MCP server or extension which provides this tool

That is a different failure from the token complaint, and a worse one. Five of the
thirteen tools -- `kiln_render`, `kiln_edit`, `kiln_inspect`, `kiln_view_interior`,
`kiln_screenshot_animation` -- shared a `z.tuple` camera vector, which zod renders as
`prefixItems` plus **`items: false`**. VS Code tests `items` for truthiness, so a
2020-12-correct tuple reads to it as an array with no items and the tool is refused
outright. Those five are the authoring loop: in that host an asset could not be built
at all, while `tools/list` looked healthy.

**It was never a regression.** The tuple arrived with the camera capture work in
`b2eff76` (2026-09-05) and has not changed since. Measured, not assumed:

| harness | tools registered |
| --- | --- |
| Claude Code | 13 of 13 (this repo's own session holds all five) |
| opencode 1.18.30 | 13 of 13 |
| Copilot **CLI** 1.0.83 | 13 of 13 |
| VS Code Copilot Chat 0.65.0 | rejects 5 |

The two Copilot surfaces disagree with each other, which is the clearest sign this is
client-side.

**And Kiln was the conformant party.** SEP-1613 is **Final**: 2020-12 is the default
dialect for `inputSchema`/`outputSchema`, it names "positional array validation (->
`prefixItems`)" as the migration, and it says *"Clients MUST support at least JSON
Schema 2020-12"*. The same error is filed against many servers -- `microsoft/vscode`
#296386, #277462, #257537, `docker/mcp-gateway` #311, a GitLab MR, and a PR elsewhere
titled "Emit strict-validators-friendly JSON schemas (no tuple items, no `$ref`)" --
and the mirror image exists too, `typescript-sdk` #745, where an SDK emitting draft-07
breaks strict 2020-12 clients such as Claude Code.

The change was still worth making, and the reason is not "Copilot asked". **Tuples are
the one construct the two dialects spell irreconcilably**: draft-07 says `items: [...]`,
2020-12 says `prefixItems` + `items: false`. A bounded uniform array -- `items: {type:
number}` with `minItems`/`maxItems` -- is the only representation that is valid and
*identical* under both. Choosing it retires a class of incompatibility instead of
patching a client. It also shrank the surface: `tools/list` went 33,937 B to 32,081 B
(~464 tokens per session, every harness) and `docs/tools.md` lost 288 lines.

**The near-miss is the part worth keeping.** The first attempt recovered the tuple type
with `.transform(v => v as [number, number, number])`. It typechecked, the MCP surface
was perfect, and it **broke every non-MCP harness**: the Strands skin converts with
`io: 'output'`, where zod throws "Transforms cannot be represented in JSON Schema",
while the MCP SDK converts with `io: 'input'` and never sees it. Nothing but the
in-process parity test would have caught it -- a change can be invisible on the
transport you are looking at and fatal on the one you are not. A static type assertion
has no such asymmetry, and both `io` modes were checked before it was kept.

Two gates, because the obvious one is not sufficient on its own: no array in any
advertised schema may carry a falsy `items`, **and** a camera vector must still refuse
two, four, and non-numeric members at runtime. The first alone would stay green on a
schema that had quietly widened into an unbounded number list, which is exactly the
regression this fix could have introduced for the harnesses that already worked.

### 16.7 -- how the VS Code side actually resolved

The pre-fix reproduction is exact. `code --add-mcp` registered a tapped server at
18:09:14; the tap recorded `initialize` then `tools/list` returning **33,937 B**; VS
Code logged `Discovered 13 tools` at 18:09:39 and
`Error: tool parameters array type must have items` at **18:09:40.648** -- twenty-six
seconds after registration, from our own schema. Discovery succeeding and validation
failing afterwards is why the server looked healthy while five tools were unusable.

After the fix the same tap recorded `tools/list` at **32,081 B**, matching the local
measurement exactly, and the owner's VS Code listed all thirteen `mcp_kiln_*` tools
including `kiln_edit` -- the one the error had named.

Two things are recorded as *not* proven, because the temptation is to round them up:

- **No log line ever says a tool validated successfully.** Copilot Chat logs the
  failure, not the pass, so "zero errors" is only evidence in a window that actually
  started the server. `window2` had zero errors and an **empty** server log -- it never
  started one, so its zero means nothing. Errors continuing at 23:37-23:40 in `window1`
  are likewise not evidence against the fix: the stale pre-fix server was still
  registered there and was stopped two seconds before the last of them.
- **The server named `kiln` was never located.** The pasted error read
  `mcp_kiln_kiln_edit`, but every server VS Code ran was one of the two registered here
  (`kiln_workspace`, `kiln_verify`); there is no `kiln` in any MCP log, none in
  `~/.config/Code/User/mcp.json`, none in `/home/matthewk/X/kiln/.vscode/`, and the
  checkout at `scratch/kiln-docs/engine` is on `dccfe41` with no `dist` at all. The
  before/after in the owner's own client is the evidence; the process behind it was not
  identified.

A GUI host is a poor instrument and that cost real time. What worked, in order of
usefulness: **a JSON-RPC tap** wrapping the server (it answers "what did this client
actually ask for" with no guessing -- it is how `resources/read` was ruled out at zero
calls), then **`~/.config/Code/logs/*/window*/`**, where per-server logs give
`Discovered N tools` and the Copilot Chat log gives the validation errors. `code chat -m
agent` drives the desktop editor but cannot clear workspace trust, and there is no
`--disable-workspace-trust` flag. `code serve-web` renders the editor in a browser and
is scriptable, but Copilot Chat there needs a GitHub sign-in, so it is a dead end for
unattended work. Registering a *new* server name is the reliable way to force a start;
killing the process is not -- VS Code marks it `Error` and waits.


## Phase 17 -- Seven harnesses, and what a plain prompt found that a scripted one could not

| # | Question | Answer |
|---|---|---|
| 17.1 | How many harnesses can reach the tools? | **Seven.** `copilot` and `cursor-agent` adapters added; a full `smoke:harness` run returned 6/7, the seventh being opencode's *default model* down provider-side (three distinct `UnknownError` refs, and it fails on a bare "reply OK"). `muse-spark` passes |
| 17.2 | Is npm the right way to install these? | **No, and it was never the real problem.** Every one of the seven ships a first-party `update` subcommand. The flakiness was three simultaneous owners of one binary: `codex` existed at `/usr/bin` (0.153.4, root-owned `sudo npm -g`), in an inactive nvm tree (0.139.0), and in the user prefix, with a `.zshrc` wrapper pinning the oldest. `codex doctor` reported `PATH entries (5)` |
| 17.3 | Does the engine advertise its own version honestly? | **It did not.** `package.json` moved to 0.7.0 and four other declarations stayed at 0.6.0, so every MCP client reported `kiln v0.6.0`. Fixed, with a parity test |
| 17.4 | Does a scripted brief measure what it claims? | **No.** See 17.5 |
| 17.5 | What did Tier-1 plain prompts find? | Two `create-workspace.mjs` defects and two array-helper traps, none reachable by tier 0. See below |

### 17.4 -- the brief was the harness dependency

`harness-smoke.mjs` told the agent to call `kiln_list_primitives` and then "nothing else".
Three things were wrong with that, and each failed before the model saw the subject.

**Naming a tool is a portability bug.** Copilot namespaces MCP tools as `<server>-<tool>`.
Its agent looked for the literal `kiln_list_primitives`, found none, and correctly reported
the tools unavailable -- while `copilot -p` listing its own tools showed all thirteen as
`kiln_workspace-kiln_*`. That single clause cost a whole harness. Saying the prefix may
exist fixed it: 10 s, 12 tris.

**A bare overview is names, not signatures.** It returns `createPart` as one name among
eighteen in `structure:`, and its own first line says to call again with `{names:[...]}`.
Under a brief that also says "nothing else", two of five harnesses wrote the
JS-conventional `createPart(parent, {name, geo, material})` and were rejected at build
time; codex, hermes and agy wrote the real positional form. Asking for the signatures made
both failures pass **with the same models** -- claude 18 s, cursor-agent 17 s. It was never
a model-capability difference.

**The opaque rejection is not a defect.** `Generated asset execution was rejected.` carries
no position because nothing from a sandboxed exception may cross that boundary; a syntax
error is the one exception, recovered host-side by re-parsing with acorn. `kiln_validate`
returning `valid: true` for that program is also correct -- it is documented as static.

### 17.5 -- two workspace defects that only an authoring run could reach

**A generated hermes workspace cannot run at all.** `hermes.mjs` sets
`HERMES_HOME=<workspace>/.hermes` so the generated `config.yaml` supplies `mcp_servers` and
`skills.external_dirs`. That same redirect discards the provider: the user's `model:` and
`~/.hermes/.env` live in the real home, so the run dies with *"No inference provider
configured"*. Tier 0 never saw it because `smoke:harness` invokes `hermes` directly and
never touches the launcher. The fix is a decision about how a workspace inherits provider
secrets, so it is recorded rather than guessed at.

**A generated codex workspace's MCP registration is inert.** `managedFiles` writes
`.codex/config.toml`, but codex reads only `$CODEX_HOME/config.toml`: run from inside the
workspace, `codex doctor` still reports `config.toml ~/.codex/config.toml` and counts the
user-level servers. Codex workspaces therefore depend on a user-level registration existing.
Its programs do land in the workspace store, but by accident of `--cd` setting the server's
CWD, not because the workspace config was read.

### 17.6 -- the array helpers surprise agents in two different ways

Two models found these independently, and `src/ops.ts` confirms both.

- **`arrayLinear` drops rotation.** It reads `source.position` only and passes
  `{ position }` to `createInstance`; the source's rotation never reaches the copies. The
  longship author proved it with an isolated four-bar control -- source tilted 30 degrees,
  copies axis-aligned -- then kept the helper for spacing and restored the angle in a loop.
- **`arrayRadial` orbits the world origin.** `basePos.applyMatrix4(m)` rotates the position
  vector about the origin, which its own comment states and its example hides by starting at
  `[1, 0, 0]`. A diving-bell author put it on portholes whose centres are off-origin and the
  bolts were "flung across the scene".

They are also inconsistent with each other: `arrayRadial` sets a rotation on every copy,
`arrayLinear` carries none.

### 17.7 -- what the tiers are actually for

Tier 0 proves plumbing and nothing else, which is why it may name a tool. Tier 1 is one
sentence -- "Generate a weathered dockside crane asset with rusted steel and frayed rope" --
in a generated workspace, and the agent finding `kiln-author-asset` unaided is part of the
result; opencode did, then made 18 tool calls, bound five procedural textures, reviewed a
material-faithful GPU sheet and saved a 10,304-triangle asset. Asking for the subject rather
than the API is what produced the textures. Tier 2 hands over nothing but a repository
location, so the setup instructions are inside the system under test.

Evidence rule for every tier: rebuild the saved source independently. The gallery counts
`proceduralTexture` calls in the source rather than trusting the report -- which is how a
lighthouse described as "green-grey barnacled stone" was shown to contain zero textures and
zero `pbrMaterial`, its barnacles modelled as geometry.

### 17.8 -- which harnesses actually read a workspace-local config

Registering `kiln_workspace` at user level for all seven made the tier-1 runs work, and it
also **masked** the question this section answers. The program store is not a discriminator
either: a user-level server with no `KILN_PROGRAM_STORE` defaults to `.kiln/programs`
relative to its CWD, and the harness runs with the workspace as CWD, so both paths write to
the same place. The only honest test is to remove the user-level entry and see what survives.

- **agy reads it.** With `kiln_workspace` removed from its user config and
  `agy mcp list` reporting none, a run inside the workspace still listed every Kiln tool.
  `.agents/mcp_config.json` is genuinely consumed.
- **codex cannot read one, structurally.** Every configuration source it has is
  `$CODEX_HOME`-rooted: `-c key=value` overrides `~/.codex/config.toml`, `-p <name>` layers
  `$CODEX_HOME/<name>.config.toml`, and `-C/--cd` only changes the working directory. Run
  from inside a workspace, `codex doctor` still reports `config.toml ~/.codex/config.toml`.
  The `.codex/config.toml` that `managedFiles` writes can never be read by anything.
- **claude, copilot, cursor-agent and opencode** read project-local config as their
  documented norm, and their generated files match the spelling each one's own tooling
  produces. They were not re-tested with the user-level entry removed, so this row is
  documentation rather than measurement.

### 17.9 -- the agnostic fix for a harness whose config is user-global

Two of the three user-global harnesses are handled by redirecting their home -- `agy.mjs`
sets nothing, `hermes.mjs` sets `HERMES_HOME` -- and that redirect is precisely what breaks
hermes: the provider selection and API key live in the real home, so an isolated home is a
logged-out home. Codex would hit the same wall for `auth.json` if a `codex.mjs` launcher
redirected `CODEX_HOME`.

**Inject the server per invocation instead of redirecting the home.** Codex takes nested
TOML overrides on the command line, and they compose into exactly the entry the workspace
needs:

```sh
codex exec \
  -c 'mcp_servers.kiln_workspace.command="node"' \
  -c 'mcp_servers.kiln_workspace.args=["<runtime>/dist/mcp-server.mjs"]' \
  -c 'mcp_servers.kiln_workspace.env={KILN_PROGRAM_STORE="<ws>/.kiln/programs",KILN_RENDER="auto"}' \
  --approve-for-me --skip-git-repo-check --cd <ws> "<prompt>"
```

Verified with the user-level registration removed: all thirteen tools appeared as
`mcp__kiln_workspace__*`. Nothing is written outside the workspace, `CODEX_HOME` is
untouched so authentication survives, and only documented flags are used. The shape is the
generated-launcher pattern the repository already uses for agy and hermes, so
`codex.mjs` belongs beside `agy.mjs` and `hermes.mjs` rather than being a special case.

The principle generalises, and it is the rule worth carrying to the next user-global
harness: **a workspace may add configuration to an invocation, but it must not replace the
home that holds credentials.** Redirecting a home is what turned a working hermes install
into "No inference provider configured".

One more duplicate surfaced during that test: codex also exposes
`mcp__codex_apps__kiln_local_kiln_*`, a second Kiln registration from a codex app, alongside
`kiln_workspace`. Same hazard as the stale `kiln` in `~/.cursor/mcp.json` -- a name that
looks like this engine and may not be it.

## Phase 18 -- Closing the stabilisation queue

The queue ROADMAP.md opened on 2026-09-13 is closed. This phase records what changed about
the *diagnoses*, because in three of eight rows the first explanation was wrong and the
measurement that corrected it is the reusable part.

### 18.1 -- the hermes failure had no credential in it

The row read "the workspace launcher discards the provider selection and API key". Half of
that was invented. Measured instead of assumed:

| | real home | `HERMES_HOME` -> workspace |
| --- | --- | --- |
| `model.default` | `gpt-5.6-sol` | not set |
| `model.provider` | `openai-codex` ("ChatGPT or Codex Subscription") | not set -> "Auto" |
| every API key | not set | not set |

`~/.hermes/.env` holds `TERMINAL_TIMEOUT`, `BROWSER_*` and `*_DEBUG` -- tool toggles. The
provider is a **subscription OAuth**, so the credential is a token in `auth.json`, and there
is no key anywhere for a workspace to inherit. A plan to symlink `.env` forward would have
linked the wrong file and fixed nothing.

`HERMES_HOME` resolves both paths, which `hermes config path` and `hermes config env-path`
report separately and which is why the redirect was so quietly destructive:

```
HERMES_HOME=<ws>/.hermes hermes config path      -> <ws>/.hermes/config.yaml   # wanted
HERMES_HOME=<ws>/.hermes hermes config env-path   -> <ws>/.hermes/.env          # not wanted
```

The owner's instinct that the install might be stale was also correct: it was 45 commits
behind. Updating it first was the right order, and it changed nothing -- upstream HEAD still
has no project-local config and `hermes mcp add` still has no scope flag. So the fix is the
invocation-shaped one, and the update is now recorded as checked rather than assumed.

### 18.2 -- two flags that fail in opposite directions

Both found by running the launcher rather than reading the help twice.

`--skills SKILLS` reads "Preload one or more skills for the session", which sounds like a
path and is not: it takes NAMES resolved against configured sources. Handing it
`<ws>/.agents/skills` aborts the whole run with `Unknown skill(s): <path>`. Skills reach the
agent through `--in`, which makes hermes inject the workspace's AGENTS.md as a rule.

`--ignore-rules` was in the *documented* hermes command, presumably to keep user-level rules
out of a workspace session. It also skips AGENTS.md -- the workspace's own guide, the thing
the whole directory exists to deliver. It is gone from the generated instruction and
documented as opt-in for anyone who does want both suppressed.

### 18.3 -- S7 was two claims and only one was a defect

"`--render auto` falls back to CPU rather than starting the GPU service" described intended
behaviour. `RenderPortOptions.autoSpawn` says why in its own docstring: a one-shot CLI
invocation should not pay a GPU process's startup to draw one sheet. That stands.

The defect was next door. `--render gpu` **threw** when nothing was listening, even where the
installation ships a renderer that would start in seconds, because only the MCP server ever
passed `autoSpawn`. A mode whose entire meaning is "I asked for a guarantee and would rather
know than be quietly downgraded" was answering with a technicality. `mode === 'gpu'` now
implies the spawn.

Making that change surfaced two more things the type checker found and no test would have:
the branch read `options.serviceDir` unguarded, and `gpu` can now reach it with no options at
all -- a crash; and the outer `if (mode === 'gpu') throw` became unreachable, which TS proved
by narrowing `mode` to `'auto'`. The remaining message names both facts, what was probed and
why nothing could start, because "not reachable" alone left the reader unable to tell whether
to start something or install something.

The workspace guide's "restart this session, because the MCP server resolves the service once
at startup" was wrong about the mechanism and accidentally right about one case. `autoSpawn`
attaches a lazy port that starts the renderer on the first view needing it -- no restart. But
`buildRenderPort` attaches nothing when the service is not INSTALLED, deliberately, so that a
CPU-only machine reports an ordinary CPU render rather than a GPU degrade. Install it
mid-session and that session stays on CPU for its lifetime. The sentence now says that, and
the code was left alone: attaching unconditionally would make every machine without a GPU
report a degrade on every render.

### 18.4 -- the bind default, and why refusing beats warning

`HOST` unset bound every interface. The MCP server's on-demand spawn already passed
`127.0.0.1`, so the exposure was confined to the *documented* manual start -- `npm start`,
under the words "Nothing else to configure".

What that exposed is worth stating plainly, because "a render service" sounds harmless.
`POST /render` accepts a 48 MB GLB, parses it with three.js, and hands the buffers to Dawn and
a native Vulkan driver, on a queue that renders one frame at a time. So an unauthenticated
exposed bind is a free GPU, a denial of the owner's own renders from a single slow request,
and an untrusted binary-asset parser in front of a kernel driver. CVE-2026-7482 is that last
one realised: a crafted model file drove a heap out-of-bounds read in a local inference
server, scored 9.1, against roughly 175k publicly reachable instances. Their default was
loopback and operators widened it. Ours widened itself.

The rule is **the bind address decides whether auth is required** -- loopback free, anything
wider token-or-refuse, `RENDER_SERVICE_ALLOW_UNAUTHENTICATED=1` as an explicit waiver the
operator has to spell out. Refusing rather than warning is not a new policy in that file; it
is the one already applied to a software adapter, so a driver regression yields a service that
will not start rather than one that silently renders on CPU. A warning on the stderr of a
backgrounded process is not a control.

Two details worth keeping. `0.0.0.0` and `::` are NOT loopback: reading an unspecified bind as
local is the exact mistake, and the test pins it. And the policy is a **pure module** with its
own test, because `render-service/test/` had no HTTP-surface test at all and every one of its
tests is pure -- which is what makes `npm ci --ignore-scripts` sufficient in CI. The one module
deciding whether this service is reachable from the network must not be the one that needs a
GPU to verify.

### 18.5 -- both stale `kiln` servers were local, and the fix is a field not a cleanup

Investigated rather than documented further:

| Suspect | Finding |
| --- | --- |
| `kiln` in `~/.cursor/mcp.json` | Points at `/home/matthewk/kiln-oss-test/src/mcp-server.ts`. The directory exists, reports **0.6.0**, and is **not a git repository** -- an extracted package. Registered beside the correct `kiln_workspace`, so Cursor offers both |
| `codex_apps__kiln_local` | Appears only in `~/.codex/cache/codex_apps_tools/<hash>.json`, a **cache** file. `~/.codex/config.toml` registers only `kiln_workspace` |

Neither is shipped by this repository and removing them is a local edit. What the repository
was missing is different: the generated guide has always said *"a server named kiln may be a
different installation; do not substitute it silently"*, and nothing in any tool result let an
agent comply. `kiln_list_primitives {capabilities:true}` now reports
`engine: {version, installUrl}`, and the guide names the comparison against `runtime` in
`.kiln/workspace.json`.

`src/engine-identity.ts` reads no file, deliberately: `src/views/renderer-id.ts` does a
`readFileSync` at module load and AGENTS.md warns about that specific hazard, and this module is
reachable from the tool registry. The version is a literal, kept honest by the version-parity
test that already pins three plugin manifests and `MCP_SERVER_VERSION` to `package.json`.

### 18.6 -- the check that would have caught 18.1 and S1

Both workspace defects passed every gate, for one reason: `harness-smoke.mjs` invokes each CLI
directly and never touches the generated launcher. The launcher was the only unexercised
artifact in the workspace, and it was where both bugs lived.

`workspace-bootstrap.test.ts` now asserts each user-global harness's launcher: that it
registers per invocation, that it parses under `node --check` rather than a regex, and that it
does **not** name the home holding credentials. A real invocation needs a signed-in CLI and
costs money, which is what Tier 0 is for; what belongs in CI is the shape.

### 18.7 -- the array helpers disagreed with each other

`arrayLinear` read only `source.position`, so a copy of a rotated part came back
axis-aligned, while `arrayRadial` twelve lines below set a rotation on every copy. Two
dispatched models hit it independently. Copies carry rotation and scale now. This **changes
exported geometry** for a program that arrays a rotated or scaled source, which is correct at
0.7.0 and recorded in the changelog as a behaviour change.

`arrayRadial` orbiting the parent's origin was not a bug -- its docstring and example both say
so -- but it was unworkaroundable short of writing the matrix by hand, so it takes an optional
`center`. Both helpers had **no unit tests**, which is how two neighbours contradicting each
other survived; there are seven now, written failing first.

### 18.8 -- what stayed deferred, re-checked rather than restated

- **`ai` 7 / `openai` 7**: re-read from the registry, and it is now **two** independent
  conflicts, not one. `@strands-agents/sdk@1.17.0` (latest) peers `@ai-sdk/provider: ^3.0.0`
  *and* `openai: ^6.45.0`; `@openrouter/ai-sdk-provider@3.0.0` peers `ai: ^7.0.0`, which needs
  provider 4. Upstream and structural.
- **SEP-2640**: the re-check signal 14.1 named was the published TypeScript SDK gaining skills
  helpers. This repo has since moved to `@modelcontextprotocol/{client,server}@2.0.0`, which
  are also the latest -- and neither carries `skills/list`. Still nothing public consumes it.
- **16.4 / S4**: confirmed against the spec rather than the memory of it. MCP Apps (Stable,
  2026-01-26) permits a UI iframe `tools/call`, `resources/read`, `notifications/message`,
  `ui/initialize` and `ping`. The decided shape holds; deferred to the next cycle by the
  owner's call, since today's over-limit behaviour is a graceful refusal.
- **Tier 2 dogfooding**: still never run, still the tier most likely to find documentation
  defects, and still needing one harness isolated from user-level registration.

### 18.9 -- `bun test --update-snapshots` wrote a corrupt file, twice in a row

Worth recording because the failure mode is silent and the obvious retry reproduces it.

Changing two catalog descriptions moved two review-gate snapshots, as intended. Running
`bun test <file> --update-snapshots` (Bun 1.4.2) reported `0 fail` and `snapshots: +2 added`,
and an immediate isolated re-run passed. The full gate then failed on both, with

```
error: Failed to snapshot value: // Scene & structure (globals ...
```

which reads like a serializer complaint and is not one. The written `.snap` file was **invalid
JavaScript**: the new content is shorter than the old, and the writer overwrote in place rather
than rewriting, leaving an orphaned tail of the previous value *after* the closing delimiter.

```
  // e.g. const v = validateAsset(root, 'prop');"
`;
n' | 'vehicle')          <-- orphaned tail of the old snapshot
  // Checks geometry and material costs for the selected category. ...
`;
```

`node --check` on a copy renamed to `.js` proves it in one command, and confirms the committed
file was valid before. `+2 added` rather than "updated" was the tell in the tool output.

The fix is to **delete the `.snap` file and regenerate**, which produces a valid file and a diff
containing only the intended change. The lesson generalises past snapshots: a formatter or
writer reporting success is not evidence that what it wrote parses. Where a generated file is
executable, check that it executes -- which is the same reasoning behind running `node --check`
on the generated launchers in 18.6 rather than regex-matching them.
