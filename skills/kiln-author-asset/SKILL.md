---
name: kiln-author-asset
description: Create a procedural 3D asset with Kiln JavaScript, review useful camera views, refine saved source, and export a GLB.
license: MIT
---

# Author a Kiln asset

Read the [program contract](references/program-contract.md) when writing source. Use `kiln_list_primitives` for unfamiliar signatures: `names: ["loftProfiles", "createPart", "createClip"]` retrieves up to six together. Search by operation or category when choosing an approach; avoid looking up helpers already explained in your context. Request `capabilities: true` for the runtime, source, export, and camera contract. The catalog is a modeling API, not a closed list of allowed shapes.

## Make the asset

Establish the subject, scale, style, and destination constraints from the request. Build a recognizable silhouette and meaningful construction details. Name parts by their role. Use metres, +X forward, +Y up, +Z right; ground contact normally sits at Y=0.

Write ordinary JavaScript with `meta` and `build()`. Keep dimensions that should change together in named parameters. Use [geometry recipes](references/geometry-recipes.md) for freeform surfaces, deformations, lofts, Boolean materials, or repeated parts. A model can author its own equations and topology; it does not need to assemble everything from boxes.

Submit `code` once to `kiln_render` or `kiln_validate`, then retain its `programRef`, including on a failed build. In a generated asset workspace, `node kiln.mjs source asset.kiln.js` imports a file directly. Pass the reference for later views and edits instead of retransmitting the program.

## Review what matters

Choose views that answer a question. A broad sheet can establish shape; a part-local view can reveal a seam, underside, or hidden attachment. Use the [camera recipes](references/camera-recipes.md) for image count, exact part framing, explicit cameras, and separate images. Read returned part paths instead of constructing them.

Inspect the actual images. Check silhouette, proportion, orientation, attachment, and ground contact. If the request calls for a finished asset, repair concrete gaps visible at its intended viewing distance rather than stopping at a blockout. Do not repeat the same render without a new question or change.

`viewFidelity.materialFaithful: false` means geometry evidence, not verified PBR appearance. Check camera/fallback receipts too. A GPU connection alone is not evidence that the requested view was used. Animation needs intermediate-pose review; interiors may need cutaway views.

## Revise and deliver

Read a bounded source region with `kiln_source({ programRef, query: "dimensionOrPart" })`. Copy an exact anchor into `kiln_edit`, batch related replacements, and continue with its new `programRef`. Rendering is on by default; `capture` can keep the relevant framing. An applied edit can still fail to build, so inspect `render.ok` separately.

Save the final reference without model transcription:

```sh
node kiln.mjs source sha256:FULL_HASH --out asset-v1.kiln.js
node kiln.mjs render sha256:FULL_HASH --out asset-v1.glb --views asset-v1.png
```

To save a chosen camera view, write the `capture` object itself to `cameras.json` and run `node kiln.mjs render sha256:FULL_HASH --capture cameras.json --views hero.png`. This uses the same camera schema and render pipeline as MCP. CLI image export supports grid output; use one shot for a single hero PNG. Do not copy image base64 into shell commands. The [camera recipes](references/camera-recipes.md) include a complete file example.

Source export refuses to overwrite a file. Report the source and GLB, important design choices, what you reviewed, and any unresolved limitation. Validation does not establish visual quality or destination-runtime performance. There is no default triangle target; measure geometry, draw calls, textures, and loading against the user's actual constraints.
