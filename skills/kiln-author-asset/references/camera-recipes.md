# Camera recipes for authoring

Choose the number of images for the question you are answering. Replace `REF` with the actual `programRef`. Omit `capture` for the default six-view sheet.

## A compact orbit sheet

```js
kiln_render({ programRef: REF, capture: {
  preset: '2x1',
  cells: [
    { name: 'Form', azimuthDeg: 35, elevationDeg: 25 },
    { name: 'Underside', azimuthDeg: 215, elevationDeg: -25 },
  ],
} });
```

Presets are `COLSxROWS`: `1x1`, `1x2`, `2x1`, `3x1`, `2x2`, `3x2`, `3x3`. `cells` run row-major and cannot exceed preset capacity. Orbit azimuth 0/90/180/270 means front/right/back/left. Positive elevation looks down; negative looks up. Legacy `zoom` is a padding multiplier: larger values pull back.

## A whole asset and one local detail

Read exact part paths from a render result. `subject.name` requires an exact unique name; `subject.path` resolves duplicate names unambiguously.

```js
kiln_render({ programRef: REF, capture: {
  version: 'kiln.capture.v1', cols: 2, size: 512, output: 'grid',
  shots: [
    { name: 'Whole asset', camera: { type: 'orbit', azimuthDeg: 35, elevationDeg: 25 } },
    { name: 'Joint', subject: { path: PATH_FROM_RENDER }, visibility: 'context',
      camera: { type: 'orbit', relativeTo: 'part', azimuthDeg: 90, elevationDeg: 10, padding: 1.4 } },
  ],
} });
```

Versioned capture accepts 1–9 shots, 1–3 columns, and image size 128–1024. Set `output: 'separate'` when individual images better fit the harness. `visibility: 'isolate'` hides everything outside the selected subtree; context remains visible by default. Orbit `relativeTo` is `world`, `asset`, or `part`.

The same capture object can accompany `kiln_edit` so the edited result answers the same visual question. It is a render request, not a source change.

## Explicit framing

```js
{ name: 'Eye level', camera: {
  type: 'explicit', projection: 'perspective',
  position: [4,1.4,3], target: [0,1,0], up: [0,1,0], fovDeg: 45,
} }
```

This is a shot inside versioned `shots`. Explicit position/target/up default to world-space. Set `relativeTo: 'asset'` or `'part'` for asset/selected-part coordinates, or `'local'` with `frame: { origin, rotation }` for a rigid world-space frame. Frame rotation is Euler XYZ degrees; `frame` is accepted only with local mode. Lens distances remain world units. Orthographic cameras use `projection: 'orthographic'` and may set `halfHeight`. Optional near/far must enclose what you want to see. Unknown fields are errors; do not invent camera keys.

Inspect returned resolved cameras and fidelity/fallback receipts. A correct-looking CPU sheet can establish geometry but not PBR material appearance. A camera-only request may reuse a compatible evaluated build; a `programRef` identifies source, not a guarantee of a cache hit.

## Fit a local view to bounds

```js
{ subject: { path: PATH_FROM_RENDER }, camera: {
  type: 'explicit', projection: 'orthographic', relativeTo: 'part',
  position: [2,1,0], framing: 'bounds', padding: 1.3,
  targetOffset: [0,0.1,0],
} }
```

With `framing: 'bounds'`, target may be omitted and defaults to the selected world-bounds center. The camera fits the selected geometry; omit `halfHeight` because fitting computes it. `padding` is accepted only for bounds fitting. Perspective bounds fitting uses a conservative bounding sphere at the selected FOV.

`targetOffset` uses the selected frame's axes. It moves the target in explicit framing; bounds framing moves eye and target together. Inspect returned camera receipts when composing these controls. The host can impose smaller shot, pixel, or byte budgets than the schema maximum; follow the returned limit instead of retrying the same oversized request.

## Save chosen views to PNG

Write only the `capture` object to `cameras.json`, without `programRef` or an outer
`capture` key. Coordinates are JSON numbers, not quoted strings.

```json
{
  "version": "kiln.capture.v1",
  "output": "grid",
  "cols": 1,
  "size": 768,
  "shots": [{
    "name": "Hero",
    "camera": {"type": "orbit", "azimuthDeg": 40, "elevationDeg": 20}
  }]
}
```

```sh
node kiln.mjs render sha256:FULL_HASH --capture cameras.json --views hero.png --out asset.glb
```

Use the saved revision and reuse the file for matched before/after cameras. The CLI
uses the same validated camera pipeline as MCP and can reuse the evaluated build.
It writes PNG bytes directly; there is no need to copy image base64. `--capture`
requires `--views`, accepts JSON up to 1 MiB, and supports grid output only. A single
shot is one image; multiple shots share the grid. For separate files, export one
single-shot recipe per requested file. MCP still supports `output: "separate"` for
image blocks delivered to the agent.
