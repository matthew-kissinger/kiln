# Three.js upstream renderer review

Research date: September 21, 2026, America/New_York. GitHub state and source were checked during this review; the final local receipt was recorded at `2026-09-22T00:39:13Z`. Kiln base HEAD was `b81cfd4caed64bd90547ff83b4e513e59a1d4913`, with substantial existing working-tree changes. This review changed no product source, dependency, running service, or renderer decision. Nothing was posted upstream.

## Recommendation

Keep the [selected distribution and process boundary](2026-09-21-renderer-decision.md). Both PRs are useful, but they address different layers: #34525 makes Three.js render targets less dependent on a canvas; #34572 separates native and browser screenshot tests. Neither replaces Kiln's host-injected `PbrRenderPort`, shared local HTTP service, explicit remote endpoint, or CPU degradation contract.

There are two concrete, tested contributions we could make. #34525 currently discards an explicitly supplied canvas whenever a device is supplied. #34572's native image-upload shim ignores the source crop origin. Reproducers and draft comments follow. These findings do not establish that either PR should be rejected; they identify small cases worth adding before adoption.

## Exact upstream state

| PR | Reviewed head | Status at review | Latest checks inspected |
| --- | --- | --- | --- |
| [#34525, WebGPURenderer: Make canvas optional](https://github.com/mrdoob/three.js/pull/34525) | `4fb3f8b87dd45d21a719edd03e9aa9fd81e90104` | Open, draft; created September 9; not merged | Eight successful checks and one failed E2E shard. [Run 34414989323](https://github.com/mrdoob/three.js/actions/runs/34414989323) reports `webgpu_texturegather` and `webgpu_xr_native_layers` image failures. Their cause was not reproduced here. |
| [#34572, E2E: Separate native WebGL/WebGPU and browser capture](https://github.com/mrdoob/three.js/pull/34572) | `ba05fca85b538e7f66f335d5a6c4d6695a87e69d` | Open, not draft; created September 16; not merged | All ten current-head checks succeeded. [Run 35220942589](https://github.com/mrdoob/three.js/actions/runs/35220942589) is green, including both native and all four browser shards. The older red screenshot bot comment refers to a different run. |

Both API records had `updated_at: 2026-09-21T01:37:13Z`. The reviewed discussion contained author descriptions and automated comments, with no human review establishing adoption consensus. API checks were queried against the exact head, not inferred from conversation badges. The source checkouts were verified with `git rev-parse HEAD`.

## What #34525 changes

The diff changes only [`src/renderers/common/Renderer.js`](https://github.com/mrdoob/three.js/blob/4fb3f8b87dd45d21a719edd03e9aa9fd81e90104/src/renderers/common/Renderer.js): 20 additions and 13 deletions. It skips `CanvasTarget` construction when `parameters.device` is present, derives internal framebuffer dimensions from an output target, and uses the selected render target's viewport, scissor and dimensions. It also uses the target's `scissorTest`, where the previous path used the canvas flag.

This directly overlaps Kiln's dummy canvas in [renderer.mjs](../../render-service/src/renderer.mjs). Our renderer already supplies a native device, renders into targets, and runs the display conversion through [renderDisplayTarget](../../render-service/src/display-output.mjs). The PR could eventually remove that dummy canvas. It does not change the image decoder, Three.js import alias, GPU acquisition, process ownership, request protocol, or resource budgets.

The animation module still starts its internal loop during initialization and uses `self.requestAnimationFrame`; `setAnimationLoop(null)` only changes the user callback. [Exact animation source](https://github.com/mrdoob/three.js/blob/4fb3f8b87dd45d21a719edd03e9aa9fd81e90104/src/renderers/common/Animation.js). Native WebGPU also does not supply browser image/canvas integration, and a retained native GPU reference can keep Node alive. [Upstream native integration and lifetime documentation](https://github.com/dawn-gpu/node-webgpu#lifetime). Those are separate reasons to retain the service boundary and explicitly qualify its shims.

### Tested cases

All local probes ran in fresh temporary Node processes on Windows x64, Node `22.23.2`. Native cases used installed `webgpu@0.6.1`, NVIDIA RTX 3070, D3D12 driver `32.0.16.1074`. The PR's exact source was imported directly, without rebuilding or patching it. No local service port was opened or existing service stopped.

| Probe | Result | Scope of evidence |
| --- | --- | --- |
| Device supplied, no canvas; 8 x 4 output target, four samples, animation shims | Render and readback succeeded. All 32 pixels were `[255, 0, 0, 255]`. | Real GPU smoke of the proposed canvas-free path. |
| Same target, ACES tone mapping, exposure 1.15, sRGB output, Kiln inverse backdrop transform | All 32 pixels were `[170, 177, 188, 255]`, matching `#aab1bc`. | The basic output pass preserves our measured backdrop convention on this device. |
| Same native initialization without `self`/animation-frame shims | Process exited 1 in `Animation.js:73`: `Cannot read properties of null (reading 'requestAnimationFrame')`. | The PR does not remove our animation integration requirement. |
| Constructor only, explicit canvas plus device placeholder | `getCanvasTarget()` returned null; `domElement`, `getSize`, `setSize` and `setCanvasTarget` threw. | No GPU required. This tests constructor/API behavior, not native device validity. |
| Same constructor cases against installed Three.js `0.186.0` | Canvas plus device retained the canvas; all four calls passed. Device without canvas failed with `document is not defined`. | Published-version control supports the intended benefit and identifies the explicit-canvas compatibility concern. |

The raw 8 x 4 readback was 800 bytes because rows were padded to 256-byte alignment, with no final trailing padding. After stripping padding, the 128-byte red buffer SHA-256 was `cfd2edd7f0273dde1ccdf312c8d871310aaab98ed8aa00c5f3a671ef314b74bf`; the neutral buffer was `eb916bb54bd84f5ee0eb9fdf007a5001fdd20a10fd0cb21d6dae3ac98d86f565`. This also confirms that our row-packing responsibility remains.

The constructor issue follows directly from the `parameters.device === undefined` condition: even a real supplied canvas is ignored. Public canvas getters remain unguarded, and `setCanvasTarget()` tries to remove a listener from the null old target. It is reasonable to discuss explicit canvas selection and transitions between canvas/output targets upstream. This review makes no claim that all canvas-oriented methods should work in an intentionally headless configuration.

Not tested: the full Kiln GLB/material suite with this PR, PMREM/RoomEnvironment, all material channels, animation, scissor/mipmap/XR regressions, sustained memory behavior, other operating systems or GPUs, or browser acceptance. A successful background readback is not a renderer migration gate.

## What #34572 changes

The change is test infrastructure plus one example adjustment and screenshot. It adds native capture, a loader, a worker shim and a browser classification list, changes the E2E runner/CI matrix, and adds development dependencies. It does not change renderer source or establish a new published renderer API. [Exact changed files](https://github.com/mrdoob/three.js/pull/34572/files).

The author reports 413 native examples and 141 browser examples, with a 2.6x reduction in the slowest CI shard duration. The current successful run is verified; this review did not independently reproduce the multi-run performance average. An isolated import of the exact-head browser classification file confirmed 141 entries. [Classification source](https://github.com/mrdoob/three.js/blob/ba05fca85b538e7f66f335d5a6c4d6695a87e69d/test/e2e/browser-examples.js).

Its native capture runs one child process per example. It supplies DOM/canvas/image shims and uses a software Vulkan implementation on Linux to resemble the existing browser baseline. GPU/shader/pixel errors fail; a recognized missing browser capability can select Puppeteer, while `--node` fails that case with a classification instruction. That is a test selection mechanism, not our material-fidelity degradation policy. [Native capture source](https://github.com/mrdoob/three.js/blob/ba05fca85b538e7f66f335d5a6c4d6695a87e69d/test/e2e/native.js), [runner source](https://github.com/mrdoob/three.js/blob/ba05fca85b538e7f66f335d5a6c4d6695a87e69d/test/e2e/puppeteer.js).

### Tested image-upload limitation

The exact function assigned to `device.queue.copyExternalImageToTexture` at `native.js:459` was extracted and executed in a VM with a captured `writeTexture` call. A two-by-two source contained red, green, blue and white texels. Four one-pixel copies requested origins `(0,0)`, `(1,0)`, `(0,1)`, `(1,1)`. Expected output was red, green, blue, white. Actual output was red four times, with zero reported errors.

This is a pure JavaScript test of the actual shim function, not a GPU or full E2E test. The source offset uses `y`, width and `flipY`, but never `source.origin`. The WebGPU API defines that origin as the start of the copied source region. [API documentation](https://developer.mozilla.org/en-US/docs/Web/API/GPUQueue/copyExternalImageToTexture#parameters). The finding does not establish that any of the current 554 examples exercise nonzero origins or that the PR's reported screenshots are wrong. A narrow regression fixture, or explicit rejection of unsupported source-region forms, would make the approximation easier to maintain.

The current Kiln native path uses its own decoded PNG-to-`DataTexture` conversion; it does not copy this shim. There is no direct Kiln defect to fix from this result. Origin, flip, alpha and color-space cases are useful tests if we later expand image upload or decoder support.

## Implications for Kiln

| Concern | Assessment and next useful action |
| --- | --- |
| Unified engine render contract | Already present in [PbrRenderPort](../../src/composer/render-port.ts) and [captureViewsViaPort](../../src/views/port.ts). Retain GLB/camera inputs, validated PNG outputs, identity and fidelity. Do not move native dependencies or host/service knowledge into deterministic engine paths. |
| Browser viewer versus service | [The viewer](../../src/viewer/scene.ts) uses `WebGLRenderer`, interactive controls and its own lighting; the service uses target-only WebGPU and a versioned presentation profile. These PRs do not prove the two have equal output or interchangeable lifecycles. If closer visual consistency is desired, first compare fixed GLBs, cameras, presentation settings and material channels in both. Shared presentation data may be a smaller change than replacing the viewer backend. |
| Internal renderer cleanup | After upstream API semantics settle, test removal of only the dummy canvas. Keep the small output-target wrapper; neither PR justifies a general renderer-plugin framework. Test rectangular targets, all backdrops, display conversion, PMREM, textures, resource disposal and errors before changing source. |
| Local versus remote rendering | Keep the existing host adapter/HTTP boundary. Neither PR implements a remote service, authentication, compatible identity, queueing or cancellation. A compatible explicitly chosen remote endpoint can still satisfy the same port without a local native device. Actual second-machine qualification remains open. |
| Process lifetime | Per-example child processes are sensible for independent upstream screenshot isolation. Replacing our shared service with one renderer process per tool call would discard warm state and sharing; that tradeoff has not been justified. Canvas removal does not eliminate native/global lifetime concerns. |
| CPU/software/GPU evidence | #34572 deliberately matches software-driven browser CI. Kiln currently refuses software adapters for normal native service readiness. Do not silently import its SwiftShader choice into runtime, relabel software output as hardware evidence, or use browser fallback to conceal GPU failures. Any software-only test lane should be explicitly identified. |
| Node/Bun/package requirements | #34525 adds no dependency or Node requirement. #34572 documents Node 24 for its E2E tooling and pins `webgpu@0.4.0` as a dev dependency; that does not raise Kiln's end-user minimum or justify downgrading our native pin. This review's narrow canvas-free GPU smoke worked on Node 22 with `webgpu@0.6.1`; it does not establish Node 20 or Bun-native compatibility. [Exact upstream package manifest](https://github.com/mrdoob/three.js/blob/ba05fca85b538e7f66f335d5a6c4d6695a87e69d/package.json), [E2E requirements](https://github.com/mrdoob/three.js/blob/ba05fca85b538e7f66f335d5a6c4d6695a87e69d/test/e2e/README.md). |

The useful unification is the capture contract and its evidence, while allowing browser presentation and native capture to keep the lifecycle each needs. This conclusion is an architectural judgment supported by the code and narrow probes, not a measured whole-application migration result.

## Optional upstream comments, not posted

### #34525

> We use Three.js/Dawn for render-target-only GLB captures in Kiln, so this would remove our dummy canvas. I tested `4fb3f8b` with Node 22.23.2 and webgpu 0.6.1 on Windows/D3D12: an 8 x 4 output target rendered and read back correctly, including ACES/sRGB output. The animation-frame shims are still needed.
>
> One constructor case worth covering: passing both `device` and `canvas` currently leaves `getCanvasTarget()` null. `domElement`, `getSize()` and `setSize()` then throw; `setCanvasTarget()` also throws while removing the old target's listener. A constructor-only repro needs no initialized GPU. Could explicit canvas selection and the transition from a canvas-free renderer to a CanvasTarget be defined alongside this change? Happy to provide the small repro.

### #34572

> We have had to make the image-upload boundary explicit in Kiln's native GLB renderer too. I checked the `copyExternalImageToTexture` shim at `ba05fca8` with a small pure-JS fixture: a 2 x 2 red/green/blue/white source, copied one pixel at a time from all four source origins. All four copies produce red because the offset never includes `source.origin`; no error is reported. This tests the shim directly, not the full E2E suite, and I don't know whether the current examples use nonzero origins.
>
> Would a small upload fixture covering source origin, then flip/alpha behavior, help guard the native/browser comparison? Supporting the origin or explicitly rejecting that unsupported case would prevent a future example from silently capturing the wrong region.

## Reproduction and retained receipts

The temporary research directory is `C:/Users/Mattm/AppData/Local/Temp/kiln-upstream-renderer-01792cf4a9e94539a6985aa760120465`. It contains sparse exact-head source checkouts and three probes: `constructor-probe.mjs`, `native-probe.mjs`, `image-origin-probe.mjs`. It is disposable research data, not part of Kiln's runtime or installed artifact.

To reconstruct the source checkouts in a fresh temporary directory, initialize an empty Git repository for each PR, fetch the exact SHA from its fork with `--depth 1 --filter=blob:none`, select `src` for #34525 and `test/e2e` for #34572 with sparse checkout, then check out `FETCH_HEAD`. No dependency installation is required for the constructor or extracted upload-function cases. Native reproduction requires an independently installed `webgpu@0.6.1` and a working adapter.

Constructor repro, after setting `sourceModule` to the exact checkout's `src/Three.WebGPU.js` file URL:

```js
const { WebGPURenderer, Vector2, CanvasTarget } = await import(sourceModule);
const canvas = {
  width: 4, height: 4, style: {},
  addEventListener() {}, removeEventListener() {}, dispatchEvent() {}
};
const renderer = new WebGPURenderer({ device: {}, canvas });
console.log(renderer.getCanvasTarget()); // null on the reviewed PR
// Run independently; each throws on that head:
renderer.domElement;
renderer.getSize(new Vector2());
renderer.setSize(8, 4);
renderer.setCanvasTarget(new CanvasTarget(canvas));
```

Upload-function repro, saved as an `.mjs` file and given the exact-head `native.js` path as its argument:

```js
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const text = readFileSync(process.argv[2], 'utf8');
const start = text.indexOf('device.queue.copyExternalImageToTexture = ');
const end = text.indexOf('\n\t\t\t};', start) + 7;
if (start < 0 || end < start) throw Error('Source shape changed; inspect again');
const calls = [], errors = [];
const device = { queue: { writeTexture: (_, data) => calls.push([...data]) } };
vm.runInNewContext(text.slice(start, end), { device, errors, Uint8Array, Math, Error });
const data = new Uint8Array([
  255,0,0,255, 0,255,0,255, 0,0,255,255, 255,255,255,255
]);
const source = { _toRGBA8: () => ({ width: 2, height: 2, data }) };
for (const origin of [{x:0,y:0}, {x:1,y:0}, {x:0,y:1}, {x:1,y:1}]) {
  device.queue.copyExternalImageToTexture(
    { source, origin }, { texture: { format: 'rgba8unorm' } }, { width: 1, height: 1 }
  );
}
console.log({ calls, errors }); // red four times, no errors
```

The native probe follows the author's device/output-target example, changes the target to 8 x 4 with four samples and `HalfFloatType` output buffering, verifies every pixel after stripping padded rows, and repeats with Kiln's `backdropClearColor('#aab1bc', 1.15)`. It explicitly destroys its device and exits its isolated process. Repeat without the three animation globals to reproduce the initialization failure. It uses a local file import for Kiln's unchanged display-transform helper; it does not import the service or run any host lifecycle code.

Recorded SHA-256 source identities:

| File | SHA-256 |
| --- | --- |
| PR #34525 `src/renderers/common/Renderer.js` | `3f73fc5946b3a92dbf5bd223e58a07627f88acfae4144bb358cdca08a9006796` |
| PR #34572 `test/e2e/native.js` | `2b9fbb453c9835c37ff0472f1bf76acdb495ccb89541883ab55c0750230e8fca` |
| Kiln `render-service/src/display-transform.mjs` used by the native probe | `aa7a9c25f977d9d2c59630d14bcf6a071d8032314d9ecdf3a90fe09605b5709a` |
| Kiln `render-service/src/renderer.mjs` reviewed | `9ccc408e50add6358a3ecfcbd03b722ae3bd4c9b74c60d0199fe9a55afa730f2` |

GitHub metadata reproduction: `gh api repos/mrdoob/three.js/pulls/34525`, the corresponding endpoint for `34572`, their `/files`, `/comments`, `/reviews` and issue-comments endpoints, and `repos/mrdoob/three.js/commits/<exact-head>/check-runs`. These are read-only calls. Recheck current head/status before posting a comment or opening an adoption change.
