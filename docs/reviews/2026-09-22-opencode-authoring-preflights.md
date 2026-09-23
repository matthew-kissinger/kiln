# OpenCode authoring preflights

These are bounded checkout workflow probes, separate from the planned 36 main
and 12 held-out authorings and installed-package qualification. They retain the
original model output. No release package was created. The first wiring-only
preflight is recorded in [the earlier report](2026-09-22-opencode-preflight-and-root-renderer.md).

## MCP author, image, edit and save

OpenCode 1.18.30 ran exactly `opencode/muse-spark-1.3-contributor-free`, with the
owner's contributor-training consent. It completed in 81.831 seconds, exit 0,
without timeout, reporting $0 model cost. Twenty model steps made 21 completed
tool calls: seven reads, six Discovery calls, one render, two saves, one source
query, one anchored edit and three shell calls. All file reads stayed within the
fresh workspace; the actual events show no engine example/implementation reads
or unrelated MCP calls. This is context isolation, not an OS sandbox.

The brief requested a copper ribbon arch on a dark circular pedestal, then a
25% wider pedestal and blue metal ribbon. Discovery found suitable sweep and
material contracts without a category requirement. The two anchored replacements
exactly reproduce the exported final source. Radius changed from 0.6 to 0.75.
Baseline `p_c54a54e6ede2` became `p_0b4e30c63c5c` with the correct parent reference.

Project asset `a_19ccff704fd148d2bdd988f43c08e233` retains baseline revision
`r_4ff505356b554b8496b164ddbafe8d98` and child
`r_32087495702646e99bca87b01a89f398`. The child's parent points to the baseline.
Saved source, GLB and preview hashes match the final CLI exports. The edited
MCP view's input GLB hash matches the saved/exported artifact:
`sha256:16e54a9521a2b58caed0f27894d32a81b1f3f7e56f337cef18cdc711ce141443`.

Both MCP renders returned actual PNG attachments and full-material GPU fidelity
from Dawn/D3D12 on the RTX 3070. They correctly report `exactArtifact: false` and
`IN_LOOP_BUILD_NOT_PERSISTED`; later hash agreement does not rewrite that original
claim. The model read the exported PNG and accurately discussed these limits.
Structural QA accepted the 260-triangle asset; sweep self-intersection remains
explicitly unchecked.

Visual review confirms the blue arch and central opening in side/three-quarter
views. The nine-station path is visibly pointed/faceted; the thin ribbon appears
edge-on in front/back views. This is useful workflow evidence, not independent
art-quality acceptance or evidence that smooth curvature is solved. Do not repair
the original before campaign assessment.

The runtime build identity is
`sha256:d2e8f710cc5f56a2e3d312f6a7bf1d442b911aa837614e8cb74731c389211318`.
Its execution/cache identity is separately
`sha256:bc25c9c0016e8fd9753b3f6c86f78721540889944d1e01e5800f2a448d09c4cc`.
External evidence under
`C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/evidence-preflight-author-mcp/`
includes hashed inputs/skills/config/build, actual events, extracted PNGs, source,
save responses, process outcome, model final text and `receipt.json`.
The sibling `preflight-author-mcp/` holds the authored files and saved collection.

## CLI author, image, file edit and save

The third preflight used the same harness/model and runtime build. Only this fresh
workspace's MCP `enabled` flag was set false, as supported by the
[OpenCode configuration](https://opencode.ai/docs/mcp-servers/). The original
generated config is retained; the managed manifest still describes the original
generation. This intentional experimental condition is not an unmodified managed
workspace or a global configuration change.

The run completed in 82.889 seconds, exit 0, with $0 reported cost. Its 22 model
steps made 26 completed calls: 11 reads, 13 shell calls and two writes. All reads
were within the workspace. Every Kiln operation used the CLI, with no MCP calls.
Both PNG read attachments match the files on disk. Two explicit renders succeeded.

The model built five curved coral branches with spherical tip caps on a stone base,
then reduced base height from 0.18 to 0.144 and center height from 0.09 to 0.072,
keeping its bottom at zero. Branch roots were lowered to retain overlap with the
base; coral base color changed from ivory to orange. The two images preserve the
openings and overall composition. This is a simple tube-and-tip construction,
not a fused branch surface or independent artwork-quality result.

Source `p_2593f946e737` became `p_d082be5b1b7e` through local file revision/import.
Asset `a_4ca09f8556b74daabed33d984c66edcb` retains baseline
`r_b669845b252d49c9ba03002c643dca50` and child
`r_bd14c2a098894e65805fcd0250d65615`, with the correct parent. Every saved file's
hash/size verifies on disk; source export equals the edited file, and both GLB/PNG
exports match their respective saved revisions. Final GLB:
`sha256:8bb7f612fcecfe709d8edc987823ec302f60ae53e1ffaa00760ecf8eba184e47`.
Both revisions contain 4,152 triangles and accepted structural QA.

The untextured, zero-metalness materials deliberately select CPU geometry views.
Both saved manifests say `geometry-flat`, `materialFaithful: false`, `degraded: false`.
The model correctly limits material claims, but one sentence calls this a fallback
because no service was listening. That causal explanation is inaccurate: no GPU
startup was needed under the current routing policy. Do not infer material fidelity
from visible base colors or structural acceptance.

Evidence is in sibling directories `preflight-author-cli/` and
`evidence-preflight-author-cli/` under the same external campaign root. The latter
contains input/config/build hashes, actual events, tool outputs, model final text,
process outcome and `receipt.json`. Original outputs remain unchanged.

## Guidance corrections after trace review

The generated workspace guide and setup skill still instructed a separate nested
renderer dependency installation. Those instructions now match the root optional
dependency layout, with readiness checks and the explicit Node loader hook for a
manual start. Registered skill copies and the rendering/service guides agree.
The context also explains deliberate CPU routing for ordinary untextured,
nonmetallic materials and `--render gpu` for required material review.

A fresh `guidance-check/` workspace verifies the resulting instructions. Sixteen
existing bootstrap/dependency tests pass (104 assertions), lint passes, and six
skills/two registered copies pass. All five runtime identities remain unchanged;
engine/renderer source was not edited, so the prior full coverage gate stands.

A separate maintainer GPU probe of the exact final coral GLB succeeds without
changing its bytes. Its warm, much lighter PBR appearance differs visibly from
the CPU base-color rendering. The model did not see this extra probe and its
original preflight receives no retroactive material-review credit. Hashes and
instruction checks are in `evidence-preflight-author-cli/guidance-followup.json`.
These observations map to F178-F179. Broader guidance and QA acceptance stays open.

## Remaining work

All three checkout preflights are recorded. The substantive diversity/repair/held-out
campaign remains open. Do not count these probes as installed-package acceptance.
Discovery query observations belong to the observed evaluation set, not future
holdouts. Engine source and the green offline gate are unchanged by this run.
