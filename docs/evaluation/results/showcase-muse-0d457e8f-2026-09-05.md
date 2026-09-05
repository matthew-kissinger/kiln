# Muse original-asset batch — 2026-09-05

Three new assets were authored in separate cleanrooms using the installed 0d457e8f package, the current project-local author/refine/QA skills, OpenCode 1.18.27 and its freshly listed `opencode/muse-spark-1.3-contributor-free` route. No asset source was supplied. No global skills, engine source, other runs, or web examples were supplied. The harness reported cost 0 for all three; this is not an account-balance assertion.

| Asset | Outcome | MCP calls / image cells | Successful edit calls | Curation recommendation |
| --- | --- | --- | --- | --- |
| brass-tellurion | 162.585s; exit 0 | 15 / 10 | 3 | Supporting gallery candidate; not a new hero. |
| canyon-funicular | 480.368s; deadline after exports | 19 / 13 | 3 | Reject: weak canyon and station design; timed out after exports. |
| glasswing-drone | 150.384s; exit 0 | 9 / 9 | 2 | Hold out of gallery: pale wing/body read and simple form do not meet stronger showcase bar. |

All three exported exact-ref source, GLB and chosen GPU PNG. Every successful literal MCP edit was replayed against its source-store input and matched the stored output bytes. All source-store filenames match their SHA-256 bytes. No complete source was passed through MCP in any run. Brass Tellurion and Glasswing Drone each imported the initial file once. Canyon Funicular retried a shell import command and re-imported after a local export-syntax correction; it does not meet the import-once ideal.

## Visual review

The reviewer opened all three final chosen PNGs, plus initial/intermediate whole/detail sheets. Brass Tellurion has a coherent brass/blue mechanical-instrument silhouette and useful refinements to globe relief, feet, gears and plaque; continents remain stylized patches and gear meshing is illustrative. It is a supporting candidate, not stronger than the existing Orrery hero. Canyon Funicular remains sparse and pale, with oversized cylindrical canyon forms and an underdeveloped station. Glasswing Drone completes its engineering journey cleanly, including two image-driven edits and animation, but its white body and pale panels remain visually flat and the wing structure does not reach the intended exhibit-quality standard. These quality judgments are separate from valid geometry and successful tooling.

## Errors and recoveries

- An earlier Tellurion attempt was stopped when the shared GPU server disappeared: authoring had begun, but zero image cells arrived. Its draft and 11-call trace remain separate; no source was reused.
- After root restored a persistent renderer, each run performed and saved a successful health preflight. GPU producer fingerprint: `sha256:10f346ec6287c8d635dabe4668d72925080e6fe3d059dd7a9252f2694ce595c2`; instance `457e4f85-753d-4e1a-ac20-f7d20c989694`.
- Tellurion corrected an unsupported projection field in a camera request and a JSON object mistakenly placed inside the animation clip string.
- Canyon corrected forbidden export syntax, degenerate loft normals blocked by GLB QA, and a literal edit anchor not found. The source-read/ref-edit recovery succeeded. It exported before the 480-second deadline but did not finish its review file. No finishing extension was spent on an asset already below the curation bar.
- Glasswing had no parsed engine/tool failures; its sweep self-intersection warning remains a documented limitation.

## Receipts and exact source histories

Machine-readable hashes, runtime/skill manifests, artifact sizes, source-store paths and replayed edit chains are in [the batch receipt](showcase-muse-0d457e8f-2026-09-05.json). Each run's `input-receipt.json`, `gpu-health.json`, `harness.jsonl`, `trace/transcript.jsonl`, `trace/images/`, `outcome.json` and `verified-receipt.json` live beneath:

`C:/Users/Mattm/X/kiln-cleanrooms/showcase-muse-0d457e8f-gpu-restored`

### brass-tellurion

Final source: `cf76e93c71f2a63dfd08863d014cf1b2a74b55f104a7d6146ec9c35db67f012a`.

Artifacts: `C:/Users/Mattm/X/kiln-cleanrooms/showcase-muse-0d457e8f-gpu-restored/brass-tellurion/workspace/assets/`.

Exact source snapshots:

- `C:/Users/Mattm/X/kiln-cleanrooms/showcase-muse-0d457e8f-gpu-restored/brass-tellurion/workspace/.kiln/programs/05d5e0de75367f4bba2ef0a924fea6e1c2e4e2d03092f8b47383f110e25c6242.js`
- `C:/Users/Mattm/X/kiln-cleanrooms/showcase-muse-0d457e8f-gpu-restored/brass-tellurion/workspace/.kiln/programs/35f4aa1102b30e9a808d3bde07e9c2486f59710ad810f9b00540580c5ce50272.js`
- `C:/Users/Mattm/X/kiln-cleanrooms/showcase-muse-0d457e8f-gpu-restored/brass-tellurion/workspace/.kiln/programs/a3f7ce3965611f22ac464e2f8de2be89a225386536348943628047dae5c450b9.js`
- `C:/Users/Mattm/X/kiln-cleanrooms/showcase-muse-0d457e8f-gpu-restored/brass-tellurion/workspace/.kiln/programs/cf76e93c71f2a63dfd08863d014cf1b2a74b55f104a7d6146ec9c35db67f012a.js`

### canyon-funicular

Final source: `095099390342dd6b7e2ba9f66e8a0ea947ebcb486be59ea02480b054dc51d89f`.

Artifacts: `C:/Users/Mattm/X/kiln-cleanrooms/showcase-muse-0d457e8f-gpu-restored/canyon-funicular/workspace/assets/`.

Exact source snapshots:

- `C:/Users/Mattm/X/kiln-cleanrooms/showcase-muse-0d457e8f-gpu-restored/canyon-funicular/workspace/.kiln/programs/095099390342dd6b7e2ba9f66e8a0ea947ebcb486be59ea02480b054dc51d89f.js`
- `C:/Users/Mattm/X/kiln-cleanrooms/showcase-muse-0d457e8f-gpu-restored/canyon-funicular/workspace/.kiln/programs/11bc8dca8b167a24127123ba3ba861d58462ab6907ea0fe2229bad362f69986f.js`
- `C:/Users/Mattm/X/kiln-cleanrooms/showcase-muse-0d457e8f-gpu-restored/canyon-funicular/workspace/.kiln/programs/623bc5525dc64449221ea92b48d88760dffd0d5ef1970c76ab4285f39c1b9849.js`
- `C:/Users/Mattm/X/kiln-cleanrooms/showcase-muse-0d457e8f-gpu-restored/canyon-funicular/workspace/.kiln/programs/74cb1bf11cc488afbe35f9cbceadf9fb79eec2587225302ce3b22416d15d1a75.js`
- `C:/Users/Mattm/X/kiln-cleanrooms/showcase-muse-0d457e8f-gpu-restored/canyon-funicular/workspace/.kiln/programs/fe6c86ee74274aec69f7aad88fb022d9ed01a917381fb9b50b868100d7a506a4.js`

### glasswing-drone

Final source: `2034b9489cce2ec28d05d3eb2da09ef454dbbc7d31e1d3de21d5736cfcfd2b3f`.

Artifacts: `C:/Users/Mattm/X/kiln-cleanrooms/showcase-muse-0d457e8f-gpu-restored/glasswing-drone/workspace/assets/`.

Exact source snapshots:

- `C:/Users/Mattm/X/kiln-cleanrooms/showcase-muse-0d457e8f-gpu-restored/glasswing-drone/workspace/.kiln/programs/2034b9489cce2ec28d05d3eb2da09ef454dbbc7d31e1d3de21d5736cfcfd2b3f.js`
- `C:/Users/Mattm/X/kiln-cleanrooms/showcase-muse-0d457e8f-gpu-restored/glasswing-drone/workspace/.kiln/programs/a047f865e9e2d31b5e04cafce08318021aa23a81c91f21d6bbb14a11c233bbb9.js`
- `C:/Users/Mattm/X/kiln-cleanrooms/showcase-muse-0d457e8f-gpu-restored/glasswing-drone/workspace/.kiln/programs/c5547c4127e9b6b5721e984ad3aea70f5e4d459877d57d16c1b765f3a2bb169e.js`

No gallery files, engine code, or skills were changed by this lane. No further model runs were launched.
