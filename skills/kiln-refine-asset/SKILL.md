---
name: kiln-refine-asset
description: Refine an existing Kiln asset through bounded source reads, exact revision edits, and targeted image feedback. Use for repairs, variants, or proportion changes.
license: MIT
---

# Refine a Kiln asset

Work from the saved program. A GLB alone does not contain editable Kiln JavaScript. Keep the user's requested change distinct from unrelated redesign.

## Read, change, compare

1. Copy the returned `programRef` exactly, or import a file with `node kiln.mjs source asset.kiln.js`. Built-in stores return short immutable handles such as `p_7c94a132b8e0`; full SHA-256 references also work. Do not shorten a hash yourself. Submit source inline only when introducing a new draft to the store.
2. Obtain a before view when it resolves an uncertainty. Use returned exact part paths for targeted framing; the [revision and view recipes](references/revision-and-views.md) show source paging, custom cameras, and animation phases.
3. Read relevant text with `kiln_source({ programRef, query: "partOrConstant" })`. Search is literal and offsets count UTF-16 characters. Copy anchors exactly, including whitespace.
4. Apply related `{ oldString, newString }` replacements through `kiln_edit`. Keep the returned new reference. Shared constants and shared geometry can affect more than the selected part.
5. Review the diff and returned images against the same question. Check `render.ok` independently of edit success. Repair a failed draft by its new reference rather than recreating the whole source.

An edit renders by default and accepts the same `capture` object as `kiln_render`. Use `render: false` when no image is needed. A missing or ambiguous anchor changes nothing; expand the anchor or use `replaceAll: true` only when every match should change. Long diffs may set `diffTruncated`; read more source instead of requesting a full-program echo by habit.

## Preserve intended structure

Direct mutation needs `copyGeometry`/`.clone()` or `copyMaterial`; the older `cloneGeometry`/`cloneMaterial` are identity helpers. New deformation helpers already return independent geometry. Read relevant `kiln_list_primitives` entries before changing a loft, sweep, UV workflow, or Boolean operation.

Check the part in context before hiding neighbors. Isolation can reveal a surface but cannot prove its attachment. `viewFidelity.materialFaithful: false` leaves PBR appearance unverified. Animation and cutaway inspection should target the motion or occlusion in question, not add a fixed number of routine images.

Save source and GLB from the same final reference:

```sh
node kiln.mjs source RETURNED_REF --out revised-v1.kiln.js
node kiln.mjs render RETURNED_REF --out revised-v1.glb --views revised-v1.png
```

Replace `RETURNED_REF` with the final reference returned by Kiln. Keep the workspace store and its mappings to retain earlier revisions.

For matched before/after PNGs, save the `capture` object as `cameras.json`, then use `node kiln.mjs render RETURNED_REF --capture cameras.json --views revised-view.png` for each revision. The file contains only the capture object, uses the same MCP camera schema, and must request grid output. One shot produces a hero image. Export images directly; do not transcribe MCP image base64 into files.

Source export refuses overwrite. References persist in the configured local store; if one is missing elsewhere, import the saved file there. Report the change, the saved artifacts, the views reviewed, and unresolved issues.
