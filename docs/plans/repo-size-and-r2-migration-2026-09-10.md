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
over MCP on the existing Resources primitive under a `skill://` URI scheme, with
`skills/list` returning lightweight discovery metadata and `skills/activate`
returning the full bundle plus scoped tools, prompts, resources and nested
skills. Scoped primitives stay out of the top-level lists until activation, so
progressive disclosure moves into the protocol itself.

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
