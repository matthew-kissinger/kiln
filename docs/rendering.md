# Rendering and materials

Kiln provides CPU geometry views and GPU PBR views. Use the returned `viewFidelity` to determine which visual conclusions a render supports.

| Mode | Use |
|---|---|
| `--render auto` | Use an available GPU service, otherwise return CPU views |
| `--render cpu` | Deterministic geometry review without a GPU |
| `--render gpu` | Require GPU rendering; report failure if unavailable |
| `--render-port URL` | Select a GPU render service |

CPU views show silhouette, orientation, proportion, and contact. They do not reproduce the asset's PBR materials. Use GPU views to review textures, roughness, metalness, and normal relief. GPU output can vary by device and driver.

### Running the GPU renderer

[`render-service/`](../render-service/) in this repository is the renderer: GLB bytes in, PBR PNG views
out, headless three.js `WebGPURenderer` on Dawn. No browser and no X server.

```bash
cd render-service && npm install && npm start
```

The service listens on port 8000, where `auto` looks by default. If the server sets `RENDER_SERVICE_TOKEN`, set the matching `KILN_RENDER_TOKEN` in the client environment; a health check can succeed while unauthenticated render requests return 401. For a remote service, supply `--render-port URL`. See the service README for deployment and authentication options.

In `auto` mode, an unavailable service falls back to CPU views. Read `degraded` and `degradeReason` before drawing conclusions about materials. Structural QA does not use image pixels.

## Materials, and where the pixels come from

Nothing in this pipeline samples an image model, textures included. There are two ways a surface gets
its detail, and a model authoring an asset reaches for both in the same program.

The first is **procedural**: a declarative stack of layers the model writes out as data, which the
engine rasterizes into a texture.

```js
const brick = proceduralTexture({
  schemaVersion: 2,
  size: 256,
  usage: 'albedo',
  layers: [
    { op: 'bricks', brick: 0x8c4a32, mortar: 0xbfb6a8, rows: 12, cols: 6, mortarWidth: 0.08 },
    { op: 'noise', colorA: 0x000000, colorB: 0x604030, scale: 24, octaves: 4, seed: 7,
      blend: 'multiply', opacity: 0.35 },
  ],
});

const wall = pbrMaterial({ albedo: brick, normal: normalMapFromHeight(brick), roughness: 0.9 });
```

Supported layer operations include `solid`, `checker`, `stripes`, `gradient`, `bricks`, and tileable `noise`. Layers specify opacity and blending; seeded noise makes the result reproducible. Read the texture catalog for current bounds and signatures.

The bundled scanned library contains Poly Haven CC0 material families with recorded provenance. Use catalog IDs rather than file paths or URLs. Assets embed their textures and do not fetch them at runtime.

Procedural layers suit regular patterns such as brickwork and painted stripes. Scanned materials can provide irregular surfaces such as bark, soil, or leather. Choose based on the requested appearance and check the result in a material-faithful view.
