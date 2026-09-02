# render-service

GLB bytes in, PBR PNG views out. Headless three.js `WebGPURenderer` on Dawn (the `webgpu` npm
prebuilt) — no browser, no X server, no engine coupling. This is the **GPU** in Kiln's
`--render gpu` and `--render-port`.

It is a separate Node project on purpose: headless WebGPU needs Node loader hooks that Bun does not
run, so the renderer lives behind a socket rather than inside the engine process. The upside is that
local and remote GPU are the same code path — a GPU on another machine works exactly like one here.

## Run it

```bash
npm install
npm start
```

It listens on `:8000`, which is where `kiln --render auto` looks. Nothing else to configure:

```bash
cd .. && bun run kiln render examples/well.kiln.js --views sheet.png
#   sheet.png  (GPU dawn-d3d12:nvidia-geforce-rtx-3070:D3D12 driver version 32.0.16.1074)
```

Set `PORT` to move it and `RENDER_SERVICE_TOKEN` to require auth. Point the engine at a non-default
location with `--render-port <url>` or `KILN_RENDER_PORT_URL`.

**The process refuses to boot on a software adapter.** A driver regression gives you a service that
will not start, never one that quietly renders on CPU while reporting success.

## Contract

| Route | Body | Returns |
|---|---|---|
| `GET /health` | — | `{ok, rendererId, backend, adapter, capabilities, presentationProfile, lightingPresetIds}` |
| `POST /render` (legacy) | `{glb_base64, size?=384, views?, beauty_size?, background?}` | `{ok, rendererId, presentationProfile, timings, views[base64 png], beauty?}` |
| `POST /render` (camera) | `{glb_base64, cameras, width, height, lighting_preset_id?}` | the above plus `{backend, cameras, width, height, lightingPresetId, viewSha256, outputSetSha256, cameraReceipts}` |
| `POST /bake` | — | 501 |

Auth, when `RENDER_SERVICE_TOKEN` is set, is the `x-render-token` header — **not** `Authorization`,
because serverless edge gateways routinely consume that one before it reaches the process.

`views` is an optional array of `[x,y,z]` camera directions (max 12); the default is the six-view set
matching the engine's grid conventions. A request for N views returns exactly N PNGs in request
order — truncating or padding would silently reshape a grid whose geometry was chosen from that
length, so an over-long list is rejected rather than trimmed.

Renders serialize through a single GPU queue. `rendererId` (e.g.
`dawn-vulkan:nvidia-rtx-a4500:NVIDIA: 550.100`) is honest producer identity and must accompany any
downstream use of the output.

Camera mode is additive and exact: 1-12 perspective cameras with `position`, `target`, `up`,
`fovDeg`, `aspect`, `near`, `far`. Integer `width`/`height` are required, bounded 1-4096, capped at
16,777,216 total pixels, and every camera aspect must equal `width / height`. It is mutually
exclusive with `views`, `size`, and `beauty_size`. The only lighting identity is `neutral-studio-v1`;
`/health.lightingPresetIds` advertises the registry.

## Docker

```bash
docker build -t kiln-render-service .
docker run --gpus all -p 8000:8000 kiln-render-service
```

The image installs `libglvnd0 libegl1 libgl1 libglx0` deliberately: without the GLVND dispatch libs
an injected NVIDIA Vulkan ICD init-fails with a NULL `vkCreateInstance` and Dawn lands on a software
renderer. `NVIDIA_DRIVER_CAPABILITIES` must include `graphics` — the commonly-copied
`utility,compute` yields no ICD and a silent software fallback.

## Tests

```bash
npm test     # contract, material fixture, presentation presets
npm run smoke # end-to-end against a real adapter
```

These are `node:test` and are not part of the engine's `bun test` suite.

## License

MIT, same as the engine.
