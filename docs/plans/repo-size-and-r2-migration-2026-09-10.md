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
| 2.1 | Create the R2 bucket, per D2 | Pending |
| 2.2 | Configure public access and the custom domain, including DNS | Pending |
| 2.3 | Upload the 84 poster PNGs byte-for-byte, with no re-encode | Pending |
| 2.4 | Upload the 4 GIFs | Pending |
| 2.5 | Verify each uploaded object's sha256 equals the local file's | Pending |
| 2.6 | Verify each poster's sha256 equals the `imageHash` in its provenance sidecar. This is the I1 gate | Pending |
| 2.7 | Verify CDN URLs return 200 with correct `content-type` | Pending |
| 2.8 | Repoint `docs/examples.md` at absolute CDN URLs | Pending |
| 2.9 | Update `site/scripts/verify-assets.mjs` to fetch posters, preserving the hash check, with a local cache so CI does not depend on network availability | Pending |
| 2.10 | Audit and update `site/scripts/build-example-poster.mjs`, which reads `examples/renders` | Pending |
| 2.11 | Update the write targets in `scripts/hero-shots.ts` and `scripts/anim-gifs.ts`, per D4 | Pending |
| 2.12 | Run `verify-assets.mjs` locally; it must pass | Pending |
| 2.13 | Run `bun run test` and `bun run lint`; both must pass | Pending |
| 2.14 | Push to a branch and confirm `pages.yml` passes, before any rewrite | Pending |

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
