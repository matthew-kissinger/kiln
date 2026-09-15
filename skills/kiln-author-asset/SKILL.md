---
name: kiln-author-asset
description: Create a procedural 3D asset with Kiln JavaScript, review useful camera views, refine saved source, and export a GLB.
license: MIT
---

# Author a Kiln asset

Read the [program contract](references/program-contract.md) when writing source. Use `kiln_list_primitives` for unfamiliar signatures: `names: ["loftProfiles", "createPart", "createClip"]` retrieves up to six together. Search by operation or category when choosing an approach; avoid looking up helpers already explained in your context. Request `capabilities: true` for the runtime, source, export, and camera contract. The catalog is a modeling API, not a closed list of allowed shapes.

## Make the asset

Establish the subject, scale, style, and destination constraints from the request. Build a recognizable silhouette and meaningful construction details. Name parts by their role. Use metres, +X forward, +Y up, +Z right; ground contact normally sits at Y=0.

For Blender, Unity or an FBX handoff, read the [engine handoff guide](references/engine-handoff.md). Prefer direct GLB import. The established exporter remains the default; the guide explains when an explicitly identified experimental comparison is useful. Preserve the baseline output, report the selected backend and destination checks, and do not change global host settings silently.

Write ordinary JavaScript with `meta` and `build()`. Keep dimensions that should change together in named parameters. Use [geometry recipes](references/geometry-recipes.md) for freeform surfaces, deformations, lofts, Boolean materials, or repeated parts. A model can author its own equations and topology; it does not need to assemble everything from boxes.

Submit `code` once to `kiln_render` or `kiln_validate`, then retain its `programRef`, including on a failed build. In a generated asset workspace, `node kiln.mjs source asset.kiln.js` imports a file directly. Copy the returned reference exactly for later views and edits. Built-in stores return short handles such as `p_7c94a132b8e0`; full SHA-256 references also work. Do not construct a handle or retransmit the program.

## Review what matters

Choose views that answer a question. A broad sheet can establish shape; a part-local view can reveal a seam, underside, or hidden attachment. Use the [camera recipes](references/camera-recipes.md) for image count, exact part framing, explicit cameras, and separate images. Read returned part paths instead of constructing them.

Inspect the actual images. Check silhouette, proportion, orientation, attachment, and ground contact. If the request calls for a finished asset, repair concrete gaps visible at its intended viewing distance rather than stopping at a blockout. Do not repeat the same render without a new question or change.

`viewFidelity.materialFaithful: false` means geometry evidence, not verified PBR appearance. Check camera/fallback receipts too. A GPU connection alone is not evidence that the requested view was used. Animation needs intermediate-pose review; interiors may need cutaway views.

## Revise and deliver

Read the [export profile guide](references/export-profiles.md) when choosing delivery files. Keep the default editable ZIP for continued authoring; use the opt-in runtime GLB and metadata sidecar for application delivery when its measured size benefit is useful. Converter selection happens during rendering, while the delivery profile applies to a saved revision. Report the actual choices and preserve the canonical source; neither option establishes scene performance.

Read a bounded source region with `kiln_source({ programRef, query: "dimensionOrPart" })`. Copy an exact anchor into `kiln_edit`, batch related replacements, and continue with its new `programRef`. Rendering is on by default; `capture` can keep the relevant framing. An applied edit can still fail to build, so inspect `render.ok` separately.

When the collection tools are available, use them for delivery. A finished asset is not delivered until its accepted final reference is saved. The user chooses the destination when they name one. Call `kiln_assets({ action: "collections" })` to resolve available IDs when more than one collection is configured or the request mentions a destination. Use `project` only as the fallback when the user gave no destination; use `library` for an explicitly requested cross-workspace library. Then call `kiln_save({ programRef, name, collection, brief, description, attribution: { model, harness } })`. Record the actual model and harness when known, and omit unknown attribution rather than guessing. Saving creates the durable asset record and returns the asset ID, revision ID, and download resources for its exact GLB, source, preview, and ZIP bundle. Return those links to the user using the host's resource/download interface; do not transcribe binary data.

After saving, call `kiln_present` when available with the exact collection, asset ID, and revision ID. If the host confirms it rendered the interactive result, the handoff is complete. If the user wants to see the asset, the host only returns portable links, and you have a terminal, launch `node kiln.mjs view --collection COLLECTION --asset ASSET_ID --revision REVISION_ID` yourself in a persistent or background terminal from the asset workspace. Substitute the exact values returned by `kiln_save`, give the user the printed loopback URL, and use the harness's browser-opening capability when one exists. Do not ask the user to start the viewer unless the host gives you neither presentation nor process-launch capability. The deep link opens that exact revision in the same local viewer with orbit, zoom, revision history, animation, and downloads. Use returned download URLs when provided; never invent HTTPS URLs or claim that a host supports native attachments without evidence. A `kiln://` resource may require the host's resource reader or local viewer.

Save at meaningful completion points, not after each draft or camera change. Retain source revisions while working. For direct filesystem exports without collection tools:

```sh
node kiln.mjs source RETURNED_REF --out asset-v1.kiln.js
node kiln.mjs render RETURNED_REF --out asset-v1.glb --views asset-v1.png
```

Replace `RETURNED_REF` with the final reference returned by Kiln. Keep `.kiln/programs`, including its mappings, while using saved references.

To save a chosen camera view, write the `capture` object itself to `cameras.json` and run `node kiln.mjs render RETURNED_REF --capture cameras.json --views hero.png`. This uses the same camera schema and render pipeline as MCP. CLI image export supports grid output; use one shot for a single hero PNG. Do not copy image base64 into shell commands. The [camera recipes](references/camera-recipes.md) include a complete file example.

Source export refuses to overwrite a file. Report the source and GLB, important design choices, what you reviewed, and any unresolved limitation. Validation does not establish visual quality or destination-runtime performance. There is no default triangle target; measure geometry, draw calls, textures, and loading against the user's actual constraints.
