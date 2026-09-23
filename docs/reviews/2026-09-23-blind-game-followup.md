# Blind onboarding and game asset follow-up

The owner-requested follow-up is complete: three onboarding attempts, four new game
asset baselines and three localized edits. Nine stages completed; one OpenCode
setup failed with HTTP 400. All inference is terminal. Original sources, traces
and images are retained without reviewer repairs. These are evaluation outputs,
not vetted gallery examples.

Evidence root: `C:/Users/Mattm/X/kiln-dogfood/blind-games-2026-09-23`.
Frozen engine: `sha256:18f0f0edca1e37e73db6e3e77415a7645fa6615563617a718feae0db012ba95e`.

## Runs and budget policy

OpenCode 2.0.14 used `opencode-go/deepseek-v4.1-flash`. At the owner's request,
remaining trials used AGY 1.2.3 and `gemini-3.8-flash-high`, with explicit high
effort. Every AGY initialization reported that exact model. No model fallback or
new Google API/OpenRouter route was used.

| Trial | Outcome | Seconds | Recorded response steps |
| --- | --- | ---: | ---: |
| OpenCode setup 1, install-doc entry | Incomplete: provider.invalid-request, HTTP 400 | 108 | 17 |
| OpenCode setup 2, README entry and path with spaces | Completed setup and three-part GPU smoke asset | 238 | 29 |
| AGY setup, README entry | Completed setup and three-part CPU smoke asset | 151 | 41 |
| OpenCode rogue satchel | Baseline completed; retained when the owner switched routes | 1,639 | 92 |
| AGY floating cave creature | Baseline / healed-stump edit completed | 524 / 128 | 89 / 18 |
| AGY volcanic cave junction | Baseline / wider-opening edit completed | 482 / 203 | 68 / 25 |
| AGY damaged escape pod | Baseline / bent-hatch edit completed | 419 / 117 | 70 / 14 |

Counts are OpenCode `step_finish` events and AGY model-response steps, not billing
units or a controlled efficiency benchmark. AGY calls an entire interaction one
user turn even when it contains many model responses. Different briefs/providers
prevent a controlled comparison with Strands.

Explicit inference-turn and spending budgets belong to metered Strands runs.
Subscription-harness counts are diagnostic. Later launches had no turn or
wall-clock cutoff and were monitored for stalls, repeated failures and provider
limits. Earlier launches retained their recorded wall-clock deadlines; none hit
them. No turn cap stopped any run. Nominal OpenCode costs are not invoices.

## What worked

Agents used ordinary Discovery queries, exact contracts, shared skills and
procedural geometry across soft goods, organic animation, an environment interior
and a mechanical prop. No asset category selection was needed. The gallery and
engine implementation were not observed in reviewed authoring reads. This supports
workflow breadth; it does not measure improvement over an earlier Kiln version.

AGY's MCP image results became image files that the agent explicitly read. Retained
`tool-outputs` archives contain those referenced tool results. Final creature/cave
GPU receipts include the exported GLB hashes; their quality findings are not CPU
fallbacks. AGY's matte setup smoke used CPU views, which establish geometry only.

All seven game GLBs independently pass glTF validation with zero errors and
warnings. This establishes export integrity, not visual, attachment, traversal or
prompt acceptance. See `independent-export-review.json` and each trace review.

## Confirmed fixes

1. **Stale OpenCode instructions.** OpenCode 2.0.14 has no `opencode debug skill`.
   Both setup agents encountered that recommendation. Installation guidance now
   describes optional `debug config` / `mcp list` diagnostics and actual fresh-session
   observations. These are harness-specific diagnostics, not Kiln requirements.
   Current clean-room/dispatch examples replace removed `run --dir` with changing
   directory and `run --standalone`. Historical receipts remain unchanged.
2. **False workspace drift across Node interpreters.** AGY's terminal used Node 24
   in a workspace created with Node 22. Kiln incorrectly reported changed runtime
   and configuration while the pinned executable remained installed. Read-only
   checks now compare the configured interpreter; setup, repair and upgrade still
   select their caller's interpreter. A missing recorded executable still reports
   drift and requires explicit repair. Checks do not silently rewrite configuration.
   The generated startup guide reflects this distinction.

The regression failed before the fix; all six upgrade tests passed afterward,
including missing-interpreter handling and retained stale-skill rejection. A real
Node 22 setup / Node 24 Discovery and `--check` passed without configuration changes.
Pinned toolchain, skills, typecheck and lint pass; the full suite is **2,643 pass,
two platform skips, zero fail**. Evidence: `workspace-node-fix-gate.log`,
`node24-discovery-proof.json`, `node24-workspace-proof.json`.

No renderer or engine implementation changed. Prior renderer-service and engine
coverage evidence remains scoped to unchanged code; all five engine bundles still
match the current engine identity. Setup scripts/docs are separate from that
identity and are identified by the follow-up file hashes.

## Asset findings

- **Satchel:** lofted soft body, folded flap, strap, pouch and textured materials.
  The author recovered from missing UVs and iterated after viewing sheets. Visible
  flap/intersection and attachment details remain questionable; their geometric
  root cause was not isolated. This is not a golden example.
- **Creature:** organic silhouette and exported 24-channel Idle. The author corrected
  reversed mantle winding after inspection. The stump edit preserves 150 static
  nodes and all 21 protected animation tracks. However, the claimed seamless loop
  has endpoint rotation gaps on all 21 original tentacle tracks, up to **9.7819
  degrees**. Other tentacles retain those discontinuities after the edit. Preview
  sampling correctly includes the endpoint; the author missed the seam.
- **Cave:** interior views show three openings, a raised branch and a low arch;
  widening is visible. The agent claimed strict preservation but skipped revision
  comparison. Independent comparison finds **all eight mesh geometries changed**,
  including fissures and hanging formations. Global floor/ceiling resampling and
  shared height functions cause changes beyond the opening. Traversability,
  claimed grades and character clearances remain unverified.
- **Pod:** readable cockpit, exposed cables, layered breach and replacement hatch
  retaining a seat view. Independent comparison supports the localized edit:
  **124 nodes unchanged**; removed/added nodes belong to canopy/hatch hardware,
  with the expected root bounds change. This is a stylized rough asset, not a
  production-acceptance claim.

All three AGY originals remain byte-identical after editing. Independent static
comparisons have no unread pages. The creature's exported-accessor comparison
also checks animation preservation, outside the static comparison's scope.

The UV error needs no engine fix: `remapUV` already documents its prerequisite
and tells the author to project or unwrap first. Visual self-corrections do not
establish primitive defects. More asset-specific wrappers are not justified here.

## Onboarding and evidence limits

These are minimal-brief trials against a built checkout with reused dependencies,
not cold package installation. Public docs were available; implementation, examples
and prior reports were forbidden. OpenCode used fresh XDG configuration and standalone
run servers. AGY used fresh projects and disabled automatic slash expansion while
retaining its authenticated profile. Inherited context remains possible; these
are not OS-sandbox or strict isolated-home tier-2 claims.

Setup 1 wrote temporary probes outside its directory. Setup 2 invoked an inherited
OpenCode skill and fetched public OpenCode docs. Its first `mcp list` saw no servers;
a later check connected, with cause unconfirmed. AGY read its own harness-managed
MCP schema cache and conversation-local spilled tool outputs. These limits remain
visible instead of claiming zero inherited context.

The HTTP 400 is not a reported rate limit or exhausted-credit error. Its persisted
session contains more work than the emitted stream and lacks normal completion;
existing files are not promoted to success. Later OpenCode setup and asset runs
completed. There is no evidence here that buying credits was necessary, but the
exact failure cause remains unresolved.

## Atomic follow-ups and finish line

- **Done:** onboarding probes; four game baselines; three AGY edits; retained
  originals/traces; independent export validation, image review and revision
  comparisons; confirmed shared setup repairs; full tests; documentation update.
  No inference remains scheduled.
- **Proposed next:** qualify generic loop-closure evidence, distinguishing one-shot
  motion from requested seamless loops and equivalent quaternion signs. Retain
  the failing creature fixture.
- **Proposed next:** test how to make existing revision comparison harder to skip
  before preservation claims. Include merged geometry and globally sampled
  surfaces. Repeating the same skill instruction is not a demonstrated solution.
- **Conditional only:** investigate the OpenCode HTTP 400/stream discrepancy if a
  reproducible request recurs. It is not grounds to prolong this campaign.

The earlier [package/install/release gates](2026-09-22-value-and-remaining-work.md)
remain separate. No package, commit, push, deployment, public issue or gallery
replacement occurred. The original closeout manifest stays historical;
`independent-export-review.json` records the follow-up file hashes.
