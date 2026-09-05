# Choose useful views

A render starts with six orthographic views. Change the camera when a joint is hidden, two sides look identical, or a close-up would answer the question faster. Keep passing the same `programRef`; a camera request does not require another copy of the source.

## A smaller sheet

```json
{"programRef":"sha256:<revision>","capture":{"preset":"2x2"}}
```

Available layouts are `1x1`, `1x2`, `2x1`, `3x1`, `2x2`, `3x2`, and `3x3`. For custom orbit angles, use `cells`:

```json
{"programRef":"sha256:<revision>","capture":{"cells":[
  {"azimuthDeg":45,"elevationDeg":25,"name":"Corner"},
  {"azimuthDeg":225,"elevationDeg":-20,"name":"Underside"}
]}}
```

Kiln uses +X forward, +Y up and +Z right. Azimuth 0 looks from the front (+X), 90 from the right (+Z). Positive elevation looks down. Legacy `zoom` is a padding multiplier: larger values show more surrounding space.

## Frame a part or place the camera

The versioned capture format supports up to nine `shots`. Use the exact `parts[].path` or a unique `parts[].name` from a render result. These identify evaluated scene nodes, whose names can include generated prefixes. Duplicate names require a path.

```json
{
  "programRef":"sha256:<revision>",
  "capture":{
    "version":"kiln.capture.v1",
    "cols":2,
    "size":512,
    "shots":[
      {"name":"Overview"},
      {
        "name":"Hinge contact",
        "subject":{"path":"/Asset[0]/Root[0]/Mesh_Hinge[0]"},
        "visibility":"context",
        "camera":{"type":"orbit","relativeTo":"part","azimuthDeg":90,"elevationDeg":15,"padding":1.3}
      }
    ]
  }
}
```

Replace the sample path with one returned for your asset. Paths encode node names and distinguish same-name siblings with occurrence indices. They are scoped to the evaluated revision; a topology-changing edit can change them.

`relativeTo` accepts `world`, `asset`, or `part`. Part-local directions follow the selected node's transformed axes. The camera frames its world bounds. `visibility:"context"` retains surrounding geometry; `"isolate"` hides other meshes for that shot. Inspection does not alter the saved program or exported original asset.

An explicit camera uses world positions in the asset's units:

```json
{"camera":{"type":"explicit","projection":"perspective","position":[4,2,5],"target":[0,1,0],"fovDeg":50}}
```

Use `projection:"orthographic"` and `halfHeight` instead of `fovDeg` for a measured view. Both projections accept `up`, `near`, and `far`. Perspective is implemented in both CPU and GPU rendering; CPU images remain geometry-flat.

The versioned format uses `shots`, not legacy `preset/cells`. Unknown or conflicting controls fail instead of being silently ignored. Cell size is an integer from 128 to 1024. Set `output:"separate"` to return one image per shot; omit it for a grid. Both deliveries preserve shot order and camera metadata.

## Inspection, edits, interiors and motion

- `kiln_edit` accepts the same `capture`, so an edit can return matched before/after views.
- `kiln_inspect` accepts a single `shot` at 512px. Use it instead of the legacy `part`, `view`, orbit, `zoom`, and `isolate` fields.
- `kiln_view_interior` accepts versioned `capture` after roof removal. Custom shots retain walls; the default three-view preset also removes near walls for its eye-level cutaway.
- `kiln_screenshot_animation` accepts `shot`, `frames` (2–6), or ordered `frameTimes` (1–9 phase fractions from 0 to 1). Do not combine `frames` and `frameTimes`. `framing:"locked"` is the default; it preserves one camera across the sampled motion. Choose `"follow"` to track a subject with a shot. `perFrame:true` returns separate images.

## What the receipts establish

`cameraShots` describes the resolved world cameras, subject bounds, and visibility. Derivative receipts also carry the camera and `cameraFidelity`: `engine-resolved` for the CPU projection, or `echo-validated` when a GPU service acknowledges the exact requested parameters and dimensions. An echo is a transport check, not independent proof that an arbitrary remote service rendered honest pixels.

Read `viewFidelity` separately before judging textures or materials. A CPU fallback preserves the requested camera while reporting geometry-flat material evidence. A backend that cannot honor the camera cannot silently substitute another projection. `--render gpu` treats GPU failure as failure instead of returning CPU success.

Use the same revision, camera recipe and lighting when comparing geometry. A source hash identifies source bytes; artifact and image identities are separate. Do not infer camera or material fidelity from a cache hit alone.

### Anchor measurements

`kiln_inspect` accepts `measure: {from: {subject: {path}, point: [x,y,z]}, to: {subject: {path}, point: [x,y,z]}}` alongside its camera controls. Each point uses its selected node's local coordinates. Omit `point` to measure from the node origin. Use ordinary named child groups or pivots as reusable attachment anchors; their returned exact paths distinguish repeated names.

The result reports both resolved world points and their straight-line distance in asset units. It does not claim surface clearance, contact, collision, or a real-world unit conversion. Exact `shot` inspection also returns `subjectFrame`: local and world bounds, column-major world transform, origin, and normalized local axes expressed in world coordinates. Empty anchor groups have null bounds.

Capture caching is enabled for CPU cells in each public registry, bounded to 64 MiB. Reordering a sheet or changing its column count can reuse unannotated cells. GPU caching requires a host-declared `captureCacheIdentity` that changes with backend code, assets and hidden rendering settings; a hardware name alone is insufficient. Receipts expose `captureCache.reused` and `total`; a successful cache hit retains the original camera/material fidelity. Disable with `cacheCaptures: false`. SDK advanced captures now use the same shot renderer and camera validation and return per-cell derivative receipts.

### Camera experiments

A local RTX 3070/Dawn test rendered tight and wide orthographic views of the same box plus a perspective view. The colored object occupied 18,432 pixels at padding 1.2 and 1,740 at padding 4; changing the sheet from three columns to one reused all three cells. This checks actual projection behavior, beyond an echoed camera receipt.

An eight-azimuth geometric occlusion trial placed a wall in front of a selected part. Center rays were blocked at 0, 45 and 315 degrees and reached the part at the other five angles. This is useful for proposing another view, but a center ray misses partial occlusion and says nothing about materials or attachment quality. Automatic view selection therefore remains an advisory recipe: inspect a suspected part, try a few alternate azimuths, and let the model choose the next capture. No automatic quality claim or hidden camera change is made.

Explicit cameras default to `relativeTo:"world"`. Set it to `"asset"` for the evaluated root's coordinates, or `"part"` for the selected subject's coordinates. Position and target transform as points; up transforms as a direction. `relativeTo:"local"` requires `frame:{origin:[x,y,z],rotation:[xDeg,yDeg,zDeg]}`: a rigid frame in world coordinates, using Euler XYZ rotation in degrees. Omitted origin/rotation components default to zero. `frame` is valid only for local coordinates. Lens distances (`halfHeight`, `near`, `far`) remain world/asset units.

Set `framing:"bounds"` to fit the selected subject along the direction from `target` to `position`. Omit target to use the subject's world-bounds center. Orthographic fitting derives `halfHeight`; supplying both is an error. Perspective fitting uses the requested/default field of view and a conservative bounding sphere. `padding` defaults to 1.2 and applies only to bounds framing. `targetOffset:[x,y,z]` uses the chosen frame's axes: it shifts the look target for explicit framing, and shifts both eye and target for bounds framing. Positive padding pulls back; offsets can intentionally crop geometry.

Hosts can tighten `captureLimits:{maxTotalPixels,maxOutputBytes}` in `KilnToolContext`. The defaults are 24,000,000 cumulative cell-plus-composite pixels and 32 MiB of encoded PNG bytes per response. Model tool arguments cannot raise these limits. Pixel budgets are checked before source evaluation/rendering; output bytes are checked before delivery, for both grids and separate images. PNG headers from GPU producers are bounded before decompression. The SDK's `captureViewsViaPort` accepts the same limits as its fifth argument; `renderViewGrid` accepts `captureLimits` in its options. The one-to-nine shot and 128–1024 cell-size bounds remain additional controls.

### Local GPU cache admission

The CLI and MCP host now configure GPU cell reuse automatically when the renderer supplies a verifiable identity in `/health`. At boot the service hashes its `src` tree (including shaders and presentation presets), the installed `three`, `webgpu` and `pngjs` package contents, Node version, platform/architecture, backend and adapter/driver description. This is a content fingerprint rather than a package version or URL. Each process also has a fresh instance ID, so even a restart with identical code invalidates that process's cached captures.

The host fetches the current identity before every capture and checks it again before admitting a fresh render. A changed identity cannot populate an older cache entry. Unknown, older or unreachable health responses disable reuse; rendering still follows the selected CPU/auto/required-GPU policy. CPU mode performs no renderer probe or GPU initialization. Hashing installed runtime files happens once at renderer boot; ordinary health calls return the recorded identity without rescanning files. Hosts injecting their own render port can still supply a synchronous or asynchronous `captureCacheIdentity` callback.

A rectangular 1200×900 hero render exposed a readback defect despite valid camera receipts: Three/WebGPU returned 4,864-byte aligned rows, while the PNG path copied them as 4,800-byte rows, producing diagonal stripes. The service now removes row padding before encoding. Regression fixtures cover unaligned widths, packed/aligned arrays and byte offsets; the same station GLB/camera was rerendered at 1200×900 and visually verified after the fix. This is why camera echoes remain transport evidence rather than independent pixel validation.
