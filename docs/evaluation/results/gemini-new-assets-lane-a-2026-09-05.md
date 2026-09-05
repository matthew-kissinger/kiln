# Five fresh Gemini assets — lane A, 2026-09-05

Five independent Gemini 3.8 Flash High conversations produced source, GLB and chosen PNG exports using the latest installed candidate and copied project skills. All five exited successfully. Successful execution did not make every asset gallery quality: Ribbon Tea Pavilion is accepted as a supporting study; Orchid Conservatory and Clockwork Manta are excluded after visual review; Alpine Cable Terminal is accepted after uniform-poster review, while Iris Lantern remains excluded.

## Run identity and scope

- Harness: Antigravity CLI, requested and resolved model gemini-3.8-flash-high, existing subscription.
- Immutable tarball SHA-256: 0d457e8f8763730079da013abfa6662aadc02843f090fcae594c0f711399d16c.
- Node: v22.23.1; package bundle and copied skill hashes are in the [machine-readable receipt](gemini-new-assets-lane-a-2026-09-05.json).
- Each run started in its own new workspace with a brief, three copied core skills and generated launchers; no supplied asset or example source.
- Observed file reads stayed in the workspace, that conversation's generated outputs, and the harness-generated kiln_workspace tool-schema cache. No engine implementation, collection example, global skill, or older run was observed being read.
- The first Orchid startup failed before any tool call because the local GPU service was offline. That conversation was stopped, its evidence retained separately, and a new conversation began after GPU health passed. It was not a model generation failure.
- Restored renderer fingerprint: 10f346ec6287c8d635dabe4668d72925080e6fe3d059dd7a9252f2694ce595c2, NVIDIA RTX 3070 / Dawn D3D12. Actual MCP image receipts report full-material, material-faithful rendering. Chosen CLI images include labels and need the normal gallery poster pipeline before publication.
- No provider key was printed, no credits were purchased, and no fallback model was substituted.

## Measured results

| Asset | Accepted MCP calls | Full-source MCP submissions | Image cells | Explicit image reads | Exit |
| --- | ---: | ---: | ---: | ---: | ---: |
| orchid-conservatory | 10 | 1 | 9 | 5 | 0 |
| ribbon-tea-pavilion | 18 | 1 | 6 | 4 | 0 |
| clockwork-manta | 18 | 0 | 10 | 5 | 0 |
| alpine-cable-terminal | 25 + 1 denied | 1 | 7 | 4 | 0 |
| iris-lantern | 22 | 1 | 17 | 7 | 0 |

Totals: 93 accepted calls, one budget-denied request, 49 image cells. Four runs submitted one initial source through MCP; Manta imported a file through the CLI and used references from its first MCP render. Later edits reused references. Literal replay of every successful edit reproduces the final exported source hash for all five assets. Each clean room retains exact source-history snapshots.

Orchid, Ribbon, Manta and Iris completed two visual refinement passes. Ribbon also recovered from one rejected malformed edit payload. Iris corrected a torus orientation after its two passes. Alpine recovered from an undeclared-variable error, then completed one visual refinement; repeated small source reads exhausted its 25-call budget before the second visual pass. The refused request was not executed. Its valid final artifacts were still exported, and this is not recorded as two completed visual passes.

## Visual curation

- **Ribbon Tea Pavilion — accept, supporting study.** The actual final image shows a coherent curved timber roof, woven underside, seating and tea details. The normal gallery poster was independently reviewed by the lead agent. It is restrained architectural work rather than a featured hero.
- **Orchid Conservatory — exclude for now.** Green iron ribs and a curved glasshouse silhouette are coherent, but milky glazing obscures the orchids and weakens color contrast. The model's notes overstate the visibility of the interior. The uniform gallery poster did not resolve this limitation.
- **Clockwork Manta — reject.** The selected hero clipped a wing. The correctly framed gallery poster still showed detached-looking wingtip rods and a broken mechanism silhouette. Two edits and successful animation renders did not establish convincing attachment or gallery quality.
- **Alpine Cable Terminal — accept, supporting study.** The lead agent accepted the uniform square poster. The final chosen image shows a curved green roof, exposed pulley, correctly suspended-looking red gondola and boarding platform. Pale cabin glazing and the abruptly terminated cable assembly limit its realism. It only completed one visual pass after its compile repair; acceptance is a visual curation choice, not a claim that the full requested refinement sequence passed.
- **Iris Lantern — exclude for now.** Its brass silhouette and collars are coherent, but the six vertical shutters are a different mechanism from a radial iris, and the default closed pose hides nearly all cobalt glass and the light chamber. It adds little visual variety in that pose. The chosen PNG was inspected, not accepted on the model's written claims.

The lane reviewer opened each final chosen PNG and initial/final detail sheets where available. The lead agent separately reviewed uniform gallery posters for Orchid, Ribbon, Manta and Alpine, and the chosen Iris PNG. This report records both views; it does not imply that every exported asset was added to the gallery.

## Final source hashes

| Asset | SHA-256 |
| --- | --- |
| orchid-conservatory | 8de3359ffa54c4ff6f4f363c5b89188431fe48908c608a726d66b19529f31fcb |
| ribbon-tea-pavilion | 81c0880f18dc90290d667c9101ffbd08e0b74f48ecd605389e4de7a0bd62f054 |
| clockwork-manta | 9db19dfe6e366bf6db0ed2fec321d427998e6d05d9c89005c1c5d52c59c5d019 |
| alpine-cable-terminal | c368480584e957410a252651f8e2254b3e8823be5cbc94324d65a12d5f5c6d90 |
| iris-lantern | 6837c0195c92b225c419124446710da1abdf911d46662df0fce9226c45fcf3a2 |

## Evidence and follow-up

Machine-local evidence for each asset lives under C:/Users/Mattm/X/kiln-cleanrooms/new-gemini-ASSET-0d457e8f-20260905/. The workspace/assets directory contains final.kiln.js, final.glb, final-chosen.png, initial.kiln.js and NOTES.md. The evidence directory contains setup/launch/exit receipts, the observer transcript and images, explicit image-read events, asset-receipt.json, source-history.json and exact replayed snapshots. These are evidence locations, not paths required by users of the package.

Dogfooding suggests a narrow skill refinement: reserve calls for two actual image-led edits and final exports, combine helper discovery by name, and request enough source context once instead of exhausting the budget on many overlapping reads. Do not count a compile repair as a visual pass. Require the hero view to show the asset's defining mechanism and verify its silhouette and attachments before choosing it. These are workflow lessons; no engine defect was established by this lane.

Alpine public history includes the explicitly labeled rejected source, its material-declaration repair and the final visual revision. All three snapshot hashes were checked against literal replay, and the current snapshot matches the gallery source exactly.
