# Saved revisions and focused views

Replace `REF` and `PART_PATH` with values returned by Kiln, copied exactly. `REF` may be a short `p_` handle or a canonical SHA-256 reference; do not derive it from a displayed hash. Each handle maps permanently to one revision in its store. Edits return a new reference rather than moving a global current asset.

```js
kiln_source({ programRef: REF, query: 'POST_WIDTH', limit: 3000 });
kiln_edit({ programRef: REF,
  edits: [{ oldString: 'const POST_WIDTH = 0.13;', newString: 'const POST_WIDTH = 0.18;' }],
  capture: { preset: '2x1', cells: [
    { azimuthDeg: 0, elevationDeg: 0, name: 'Front' },
    { azimuthDeg: 90, elevationDeg: 0, name: 'Right' },
  ] },
});
```

`kiln_source` defaults to 8,000 characters and allows up to 16,000 per page. Follow `nextOffset` for more text; search again from `matchOffset + 1` for a later occurrence. `found: false` is a search result, not missing source. The returned `code` has no line prefixes.

Edits are ordered and atomic, up to 20 replacements per call. Empty/no-op replacements are rejected. `ok: true` means the edits applied; inspect `render.ok` for build/render success. `parentRef` records the base. Reference-based edit replies omit full code unless `includeCode: true`; legacy inline-code replies retain their old default.

## An exact local close-up

```js
kiln_inspect({ programRef: REF, shot: {
  name: 'Hinge seam', subject: { path: PART_PATH }, visibility: 'context',
  camera: { type: 'orbit', relativeTo: 'part', azimuthDeg: 100, elevationDeg: 15, padding: 1.3 },
} });
```

Use either `shot` or the legacy `part`/`view`/orbit fields. Exact names can be ambiguous; returned paths identify a particular node. `visibility: 'isolate'` removes neighboring geometry for this view without changing the asset.

For multiple subjects in one call, use `kiln_render` or edit `capture`:

```js
{ version: 'kiln.capture.v1', cols: 2, size: 512, output: 'separate', shots: [
  { name: 'Context', subject: { path: PART_PATH }, camera: { type: 'orbit', relativeTo: 'asset', azimuthDeg: 45 } },
  { name: 'Behind', subject: { path: PART_PATH }, visibility: 'isolate',
    camera: { type: 'orbit', relativeTo: 'part', azimuthDeg: 180, elevationDeg: 0 } },
] }
```

Versioned capture has 1–9 shots, columns 1–3, and size 128–1024; output is `grid` or `separate`. Legacy presets use `COLSxROWS`, and each optional cell has `azimuthDeg`, `elevationDeg`, `zoom`, and `name`. Do not combine the two capture shapes.

Explicit cameras use `{ type: 'explicit', projection: 'perspective', position, target, up?, fovDeg? }` or `projection: 'orthographic'` with optional `halfHeight`. Their vectors are world-space. Orbit `relativeTo` supports world/asset/part frames. Use returned camera records to verify how a request resolved.

## Motion and interiors

```js
kiln_screenshot_animation({ programRef: REF, clip: 'Open',
  frameTimes: [0, 0.35, 0.7, 1], framing: 'locked',
  shot: { subject: { path: PART_PATH }, camera: { type: 'orbit', relativeTo: 'asset', azimuthDeg: 90 } },
});
```

`frameTimes` contains phase fractions 0..1 in the order you want (1–9 entries). Alternatively use `frames` (2–6); the two are mutually exclusive. `framing: 'locked'` supports comparisons across motion; `follow` reframes the changing subject. `perFrame: true` returns separate frames. A sampled sheet cannot prove everything between sampled phases.

`kiln_view_interior` accepts optional versioned `capture` for roof-off shots. Normally roof semantics/name are resolved automatically; `nodeName` selects a roof explicitly. Review `roofsHidden` and warnings rather than assuming every obstructing surface disappeared.

Read fidelity and fallback receipts before drawing conclusions. Geometry-flat images do not verify texture/roughness/metalness, and bounds/anchor measurements do not establish visual quality.

## Named anchors and measurements

Use ordinary named child groups or pivots for attachment points. Select their exact returned paths; no extra anchor language is needed. `createPivot` adds a `Joint_` prefix.

```json
{
  "programRef": "RETURNED_REFERENCE",
  "measure": {
    "from": {"subject": {"path": "RETURNED_ANCHOR_PATH"}},
    "to": {"subject": {"path": "RETURNED_PART_PATH"}, "point": [0, 0.2, 0]}
  }
}
```

This is a `kiln_inspect` request. Each point is local to its selected node; omitting it selects that node's origin. The returned measurement contains both world points and their straight-line distance in asset units. It is not a surface-distance or clearance test.

Exact-shot inspection also returns `subjectFrame`: local/world bounds, a column-major world matrix, origin, and world-space axes. Use these receipts to place explicit world-space cameras or check an attachment. Camera suggestions are an authoring decision; there is no `suggestViews` request field.
