# render-service

GLB bytes in, PBR PNG views out. Headless three.js `WebGPURenderer` on Dawn (the `webgpu` npm
prebuilt) -- no browser, no X server, no engine coupling. This is the **GPU** in Kiln's
`--render gpu` and `--render-port`.

It is a separate Node project on purpose: headless WebGPU needs Node loader hooks that Bun does not
run, so the renderer lives behind a socket rather than inside the engine process. The upside is that
local and remote GPU are the same code path -- a GPU on another machine works exactly like one here.

## Run it

```bash
npm install
npm start
```

It listens on `127.0.0.1:8000`, which is where `kiln --render auto` looks. Nothing else to
configure, and nothing off this machine can reach it:

```bash
cd .. && bun run kiln render examples/well.kiln.js --views sheet.png
#   sheet.png  (GPU dawn-d3d12:nvidia-geforce-rtx-3070:D3D12 driver version 32.0.16.1074)
```

Set `PORT` to move it. Point the engine at a non-default location with `--render-port <url>` or
`KILN_RENDER_PORT_URL`.

**To serve other machines, say so and bring a token.** `HOST` widens the bind, and a bind wider
than loopback requires `RENDER_SERVICE_TOKEN` -- without one the process refuses to start rather
than warning:

```bash
HOST=0.0.0.0 RENDER_SERVICE_TOKEN=$(openssl rand -hex 32) npm start
```

`POST /render` takes a 48 MB GLB and renders it on the GPU one frame at a time, so an exposed bind
with no auth hands any caller on that network both your GPU and a binary-asset parser. If something
in front of this process already authenticates for it -- a reverse proxy, a private container
network -- `RENDER_SERVICE_ALLOW_UNAUTHENTICATED=1` waives the requirement explicitly. The
container image sets `HOST=0.0.0.0` itself, because a container that binds loopback is unreachable
through `-p`.

**The process refuses to boot on a software adapter.** A driver regression gives you a service that
will not start, never one that quietly renders on CPU while reporting success.

## Contract

| Route | Body | Returns |
|---|---|---|
| `GET /health` | -- | `{ok, rendererId, backend, adapter, capabilities, presentationProfile, lightingPresetIds, instance}` |
| `POST /render` (legacy) | `{glb_base64, size?=384, views?, beauty_size?, backdrop?}` | `{ok, rendererId, presentationProfile, timings, views[base64 png], beauty?}` |
| `POST /render` (camera) | `{glb_base64, cameras, width, height, lighting_preset_id?, backdrop?}` | the above plus `{backend, cameras, width, height, lightingPresetId, viewSha256, outputSetSha256, cameraReceipts}` |
| `POST /bake` | -- | 501 |

`instance` is `{version, pid, ownerPid, startedAt, sourceDir, sourceFingerprint}`: who this process is,
so the engine that finds it on the shared port can tell a current renderer from an orphan running
older source (`src/instance.mjs`). `ownerPid` is the session that started it on demand, passed in as
`RENDER_SERVICE_OWNER_PID`; the service watches that pid and exits when it is gone. A hand-started
service has no owner and never exits on its own. `sourceFingerprint` hashes `src/` and nothing else,
so `npm install` does not change it and an edit does.

## Deploy it with the engine

The engine and this service are one contract and ship from one commit. The engine sends every field
it knows -- `backdrop`, `input_glb_sha256`, exact cameras -- and a service built before a field
existed rejects the request with a 400, which the engine reports as a CPU degrade with the status in
`degradeReason`. A local service is replaced or named automatically (see `instance` above); a hosted
one is not, because the engine will not stop a process it did not start. When you update the engine
behind `--render-port` or `KILN_RENDER_PORT_URL`, redeploy the service from the same commit, and
compare `/health.instance.sourceFingerprint` against `bun run kiln service status` on a checkout of
that commit if you need to prove which build is live.

Auth, when `RENDER_SERVICE_TOKEN` is set, is the `x-render-token` header -- **not** `Authorization`,
because serverless edge gateways routinely consume that one before it reaches the process.

`views` is an optional array of `[x,y,z]` camera directions (max 12); the default is the six-view set
matching the engine's grid conventions. A request for N views returns exactly N PNGs in request
order -- truncating or padding would silently reshape a grid whose geometry was chosen from that
length, so an over-long list is rejected rather than trimmed.

Renders serialize through a single GPU queue. `rendererId` (e.g.
`dawn-vulkan:nvidia-rtx-a4500:NVIDIA: 550.100`) is honest producer identity and must accompany any
downstream use of the output.

Camera mode is additive and exact: 1-12 perspective cameras with `position`, `target`, `up`,
`fovDeg`, `aspect`, `near`, `far`. Integer `width`/`height` are required, bounded 1-4096, capped at
16,777,216 total pixels, and every camera aspect must equal `width / height`. It is mutually
exclusive with `views`, `size`, and `beauty_size`. The only lighting identity is `neutral-studio-v1`;
`/health.lightingPresetIds` advertises the registry.

`backdrop` names one of `neutral`, `dark` or `light` from `src/backdrops.mjs`, the same table the
engine's CPU rasterizer paints from, and is accepted in both modes; omitted means `neutral`. The
backdrop is cleared into the HDR framebuffer and tone-mapped with the asset, so the service sets it
as the linear colour that comes out of the output pass as exactly the table's bytes
(`src/display-transform.mjs`), and a GPU sheet and a CPU sheet agree pixel for pixel on it. The old
free-hex `background` field is rejected in both modes: a colour the engine would not also paint
breaks the agreement the named table exists for.

## Docker

```bash
docker build -t kiln-render-service .
docker run --gpus all -p 8000:8000 kiln-render-service
```

The image installs `libglvnd0 libegl1 libgl1 libglx0` deliberately: without the GLVND dispatch libs
an injected NVIDIA Vulkan ICD init-fails with a NULL `vkCreateInstance` and Dawn lands on a software
renderer. `NVIDIA_DRIVER_CAPABILITIES` must include `graphics` -- the commonly-copied
`utility,compute` yields no ICD and a silent software fallback.

## Tests

```bash
npm test     # contract, material fixture, presentation presets
npm run smoke # end-to-end against a real adapter
```

These are `node:test` and are not part of the engine's `bun test` suite.

## License

MIT, same as the engine.
