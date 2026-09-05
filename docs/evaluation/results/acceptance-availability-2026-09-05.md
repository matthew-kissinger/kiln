# Acceptance execution availability — 5 September 2026

## Native Mac

A bounded read-only inventory found no currently connected native Mac execution
surface. The desktop app exposed only its local Windows host. Configured network
inventory exposed Windows, Linux and Android devices; SSH host metadata identified
no Mac. Docker contexts were local Windows/Linux endpoints. No speculative host
scan, remote login, installation or remote mutation was performed.

The repository's current GitHub runner inventory contained zero self-hosted
runners. The latest completed remote CI run at the starting revision contained
only its typecheck/lint/test job. The remote default-branch workflow had neither
Mac jobs nor manual dispatch. These observations distinguish accessible existing
CI from the new workflow still present only in the local working tree.

The immutable local candidate exists and was freshly hash-verified:
`tmp/q1-kiln-204f1a7d.tgz`, SHA-256
`204f1a7dd754904aa107fd8916addc3777ae75012d29dd07312f86bbca9c35e6`.
Windows and Linux receipts already cover this artifact; native Apple Silicon and
Intel Mac checks remain unexecuted.

### Existing execution path

The local `.github/workflows/ci.yml` uses a normal producer/consumer design:
`package-candidate` builds and packs the checked-out source once, uploads the
`node-package-candidate` artifact, and both `macos-package` matrix consumers
(arm64 and x64) download that same artifact. Consumers verify native architecture,
run the Node/npm installation checklist, hash the actual tarball and retain their
receipts. This is appropriate candidate construction, not a repacking defect.
It shares one artifact across the two Mac consumers; existing local Windows/Linux
receipts are separate executions, not jobs automatically covered by that workflow.

`scripts/smoke-package.mjs --tarball /absolute/candidate.tgz` already tests an exact
supplied artifact without repacking. The Mac workflow already uses this mode.
No extra exact-tarball feature or workflow change is needed to enable that behavior.

A future authorized CI run would establish native Mac evidence for the tarball
produced from its own checked-out revision, with its own recorded hash. It would
not establish Mac evidence for `204f1a7d` unless it actually consumes those exact
bytes. Either route is legitimate when its identity is reported accurately.

The minimal missing surface is authorized execution on native arm64 and x64 Mac
hosts, or authorized use of the locally prepared CI workflow. Testing the existing
`204f1a7d` artifact additionally requires delivering that artifact to those hosts.
There is no native Mac pass to report from the current inventory. Apple GPU/Metal
validation is separate from these CPU distribution checks.

## Browser accessibility and physical device

Root inspected the live in-app browser's advertised capabilities again. It exposes
only `visibility` and `viewport`; no zoom or media-preference capability is exposed.
A browser keyboard attempt with `Control++` left the viewport at 926 × 912 CSS
pixels and device-pixel ratio 1, both immediately and on a second observation.
`Control+0` was sent afterward. This shortcut did not establish any zoom change,
much less the required 200% setting. The actual reduced-motion query remained
false in the final site review.

The enabled controls support the already completed responsive-width review, but
cannot currently establish A4 or A5. No CSS emulation was relabeled as browser zoom,
and the user's global motion preference was not changed. The other review lane's
surface inventory was empty; no physical mobile browser or device-control tool was
exposed. An Android entry in a configured network inventory is not browser access
or physical-device test evidence.

## Same-model cross-harness comparison

Fresh read-only harness commands established the following availability without
starting a model generation or changing authentication:

| Route | Observed availability |
| --- | --- |
| Codex | Logged in using ChatGPT; model catalog includes `gpt-6-astra`. |
| Antigravity | Live model catalog includes `gemini-3.8-flash-high`. |
| OpenCode | One stored OpenCode Go credential; catalog includes `opencode/muse-spark-1.3-contributor-free` and an OpenCode Go Contributor route. |
| Hermes | Both OpenAI Codex and Google Antigravity authentication report logged out. |

OpenCode also lists Astra and Gemini API routes, but a catalog entry is not proof
of authorized subscription access or an identical resolved model. API-key values
were neither read nor copied, and paid API access was not substituted. Two Muse
aliases inside OpenCode are still one harness; alias similarity is also insufficient
to prove identical model resolution.

No eligible same-exact-model pair across two authenticated subscription harnesses
was established. Concrete missing second routes are authenticated Hermes Codex or
Hermes Antigravity access, followed by verification of exact model resolution.
The completed three-model evidence is unaffected; it answers a different question.

## Disposition

The preceding goal turn made implementation and visual-review progress. This
continuation refreshed the missing-surface evidence and confirmed that no extra
Mac workflow feature is needed. Its independent acceptance audit also found two
local site gaps, now fixed and reviewed: informational contrast and retained
brief/revision history. The subsequent full gate exposed a Windows/Bun worker-pipe
failure, tracked separately as A10. A4, A5, X-A, X-B, X-C and X-D remain open in the
[atomic checklist](../../plans/remaining-work-audit-2026-09-05.md). No unavailable
check or failed gate is recorded as a pass, and the broad goal is not complete.
