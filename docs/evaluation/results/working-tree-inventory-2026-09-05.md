# Working-tree inventory — 5 September 2026

Branch: `codex/program-references-and-public-copy`. HEAD: `ef07a22ad2d069d5a0ec143105219a1afc8d4656`.
This is an intentional uncommitted local candidate, not publication approval.
The original implementation baseline already contained 41 status entries;
do not attribute the entire combined diff to the later work.

The current snapshot has 420 ordinary status entries and
636 individual entries with untracked directories expanded.
These are file-status counts, not feature counts. Generated website output and
ignored local evaluation workspaces are outside this inventory.

| Directory | Individual changed or untracked entries |
| --- | ---: |
| .claude-plugin | 2 |
| .github | 1 |
| dist | 6 |
| docs | 161 |
| examples | 209 |
| output | 3 |
| render-service | 19 |
| root | 6 |
| scripts | 24 |
| site | 90 |
| skills | 13 |
| src | 102 |

The built collection contains 63 examples, including 10 accepted assets from
the new showcase batch. Existing examples, generated posters and historical source revisions
have separate provenance; the batch ledger records the exact final decisions.
There are 14 public revision histories with 46 hash-bound source
snapshots. Fire Lookout Tower and Tidal Observatory remain excluded from the
collection. Historical sources and failed authoring evidence remain retained.

Production bundles under dist/ are deliberate package outputs. Local tarballs,
raw harness logs and temporary tooling remain under ignored tmp/ or the external
cleanrooms directory. No files are staged, committed, moved or deleted by this
inventory command. The reviewed release remains local.

Verification scope is recorded in the [candidate report](../release-candidate-2026-09-05.md),
[Linux full gate](linux-fullgate-2026-09-05.md), [showcase curation](showcase-curation-2026-09-05.md)
and [active batch ledger](../../plans/showcase-expansion-2026-09-05.md).
Windows and Linux passed the 15 package checks on exact runtime candidate
0d457e8f. The Windows Bun full-suite native GLib fault remains unresolved;
the Linux full gate passed 1,720 tests with unchanged coverage thresholds.
Native Mac and the explicitly deferred browser/device/comparison checks remain
unverified. A documentation-only archive comparison retains those original
runtime-test identities instead of claiming new platform execution.
