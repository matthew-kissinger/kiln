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
| 2.12 | Run `verify-assets.mjs` locally; it must pass | Blocked; see record |
| 2.13 | Run `bun run test` and `bun run lint`; both must pass | Done |
| 2.14 | Push to a branch and confirm `pages.yml` passes, before any rewrite | Blocked; see record |
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
| 3.1 | Install `git-filter-repo` with `pipx`; it is not currently present | Pending |
| 3.2 | Commit all Phase 1 and Phase 2 changes first, so the rewrite carries them | Pending |
| 3.3 | Re-verify fork and PR counts immediately before proceeding | Pending |
| 3.4 | Add `.gitignore` guards for the removed paths | Pending |
| 3.4a | Update `src/__tests__/examples.test.ts`, which asserts every hero and demo PNG exists in `examples/renders` via `readdir`. Those assertions fail the moment the images leave the tree, so they must move to the receipts or the bucket. Added during execution | Pending |
| 3.5 | Single `git filter-repo` pass removing `assets/video/`, `examples/renders/*.png` and `examples/renders/*.gif` | Pending |
| 3.6 | Handle `dist/` separately. `filter-repo` removes a path from all history and cannot retain only the newest blob, so purge `dist/` entirely and re-add the current `dist/` in one fresh commit, leaving it stored once | Pending |
| 3.7 | Verify `dist/mcp-server.mjs` at the new HEAD is byte-identical to the pre-rewrite file, then that `bun run build:runtime` still leaves the tree clean. This is the I2 gate | Pending |
| 3.8 | Verify pack size, commit count, and that HEAD content matches the pre-rewrite checkout except for removed paths | Pending |
| 3.9 | Run `bun run test` and `bun run lint` on the rewritten tree | Pending |
| 3.10 | Clone from the local rewritten repository; record time and size | Pending |
| 3.11 | Force-push. Requires explicit approval at this moment, per D5 | Pending |
| 3.12 | Clone from GitHub; record the real-world time and size against the targets | Pending |
| 3.13 | Confirm `ci.yml` and `pages.yml` are green on the new `main` | Pending |
| 3.14 | Re-validate the plugin path end to end: marketplace add, install, `tools/list` returns 13, then uninstall and clear the cache. Mandatory because 3.6 changed how `dist/` reaches HEAD. This is the I3 and I7 gate | Pending |

## Phase 4 — Setup and error-legibility fixes

Found by installing Kiln from a clean checkout and driving its MCP server. These
are independent of Phases 0 to 3 and can ship at any time. The engine itself was
sound throughout: a clean-room workspace authored, validated, rendered and saved
a 96-triangle workbench, and a separate CLI process resolved the same
content-addressed ref and reused the build.

| ID | Task | State |
| --- | --- | --- |
| 4.0 | Independently reproduce findings 4.5 to 4.9 before editing. They came from a delegated run and are not yet personally confirmed | Pending |
| 4.1 | `--harness claude` writes skills to `./skills/`, so the harness registers none of them; they work only because `CLAUDE.md` instructs the agent to read them. Either install to `.claude/skills/` or correct `START.md`, which currently states they are installed | Pending |
| 4.2 | `kiln_render` reports only "Generated asset execution was rejected." on a syntax error, while `kiln_validate` on the same source reports `Syntax error: Unexpected token (2:39)`. Surface the underlying message | Pending |
| 4.3 | The same rejection for an unknown helper never names the identifier. Name it and point at `kiln_list_primitives` | Pending |
| 4.4 | The MCP server sends an empty `instructions` field, so a client reading only `.mcp.json` gets 13 tools with no indication that `programRef` should be reused rather than re-sending source | Pending |
| 4.5 | `.mcp.json` records an absolute `node` path, which breaks for `nvm` users after `nvm use`. `--repair` fixes it; `START.md` frames repair as relocation-only | Pending |
| 4.6 | `scripts/create-workspace.mjs` exits 0 on a usage error and names `kiln-init`, which the caller did not invoke | Pending |
| 4.7 | `START.md` offers no copy-pasteable first command | Pending |
| 4.8 | Reconcile metric naming: top-level `materials: 8` against `qaReport` `materialCount: 2` and `drawCalls: 8` for one render | Pending |
| 4.9 | Reconsider `kiln_validate` returning `valid: true` for a program using an undefined helper | Pending |

## Phase 5 — Test-artifact cleanup

| ID | Task | State |
| --- | --- | --- |
| 5.1 | Remove 2.3 GB of scratchpad test clones | Pending |
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

**Task 2.12 and 2.14.** `site/scripts/build-assets.mjs` cannot complete on this
machine, and this is pre-existing rather than caused by the migration. Verified
by running it on an untouched clone of the baseline commit, where it fails
identically. The failing check reports `sourceMatch: true`, `imageMatch: true`,
`artifactMatch: false` on `abyssal-surveyor`: the poster bytes still match their
receipt, but the GLB the engine produces here does not match the recorded
`artifactHash`. GLB is not byte-reproducible across this environment and the GPU
machine that recorded the receipts, most likely through baked texture encoding.
Because `verify-assets.mjs` needs `site/public/assets/` and only `build-assets.mjs`
generates it, neither can be run to completion locally.

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
