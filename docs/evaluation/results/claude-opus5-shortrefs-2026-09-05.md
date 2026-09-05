# Claude Opus 5: short-reference clean-room authoring

Two sessions ran; the third was not launched because the second exhausted the subscription's weekly allowance. Each fresh project uses only the packaged core skills, generated workspace instructions, and an original brief. Claude Code 2.1.259 uses `claude-opus-5` for authoring through the existing Claude subscription login. API/provider overrides are removed from child environments; credentials are not copied. The separate earlier API billing failure remains recorded in the preflight report.

Package SHA-256: `19add77366f489f078ca50f58d6d0bcb4c4d3e86a18df4bc8da387285ab90822`. Setup receipts preserve bundle, skill, observer and prompt hashes. Each attempt has a 600-second observer budget, 610-second process cap, 32 MCP calls and 48 image cells. Processes run strictly sequentially; a timeout is retained as a partial attempt, with no retry.

| Asset | Outcome | MCP calls | Image cells | Edit requests | Export files |
| --- | --- | ---: | ---: | ---: | ---: |
| mechanical-peacock | partial: wall-time cap | 7 | 4 | 1 | 0 |
| folding-botanical-field-station | failed | 4 | 0 | 0 | 0 |
| kinetic-marble-machine | not launched: subscription limit | 0 | 0 | 0 | 0 |

Botanical Field Station ended with HTTP 429 and the explicit message: “You've hit your weekly limit · resets Sep 10, 12am (America/New_York).” It made four discovery calls but never imported a program or rendered an image. Both processes exited before the batch stopped; no retry, provider fallback, or third launch followed. A separately considered five-minute Peacock repair was also not launched.

The authoring messages identify `claude-opus-5`. The Botanical terminal usage additionally reports an internal `claude-haiku-4-5-20251001` entry with 1,003 input and 13 output tokens; no subagents were requested or spawned. This is not evidence of an Opus-only harness internally. Botanical reports 46,479 Opus output tokens, including 31,548 thinking tokens. Its reported $1.85206 is list-price usage metadata, not proof of a subscription charge.

The JSON receipt preserves exact short-handle mappings, canonical source hashes, edit replay checks, image delivery evidence, artifact hashes and raw transcript paths. Source snapshots accompany each finished attempt. Timeout runs have no terminal token/cost summary and are not counted as successful authoring sessions. CLI-reported cost, when available, is usage metadata rather than proof of a subscription charge.

Mechanical Peacock repaired invalid zero normals through `kiln_source` and `kiln_edit`, reusing `p_7c04e74fe347` and receiving `p_b36982692607`. The exact edit replay matches the stored source. The successful four-view sheet shows a jewel-enamel fan and brass radial mechanisms, but the time limit stopped the session before the requested second refinement and final exports. Its image is evidence of an intermediate result, not a gallery acceptance.

Independent review found a visible head/neck gap in the Peacock. It remains outside the gallery pending repair and animation checks. These attempts establish that short handles survive CLI import, MCP source reads and exact edits without resending the source; they do not establish a completed asset workflow under this time budget.

Subsequent maintainer repair: a Codex maintainer agent extended the retained Peacock neck centerline to meet the skull, inspected FanOpen at 0%, 50% and 100%, and exported the repaired asset. The accepted gallery source retains Claude Opus 5 attribution and explicitly discloses this local repair. [Source history and repair record](../../../site/examples/history/mechanical-peacock/history.json) preserve the original draft, model revision and maintainer revision. This later acceptance does not change the original incomplete authoring result above.
