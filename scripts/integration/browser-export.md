# Browser exporter GPU gate

Run the community exporter directly in an isolated hardware-accelerated Chrome session, reimport
the GLB with Three.js GLTFLoader, and compare original/reimported GPU readbacks and deformed vertex
positions. This does not use the CPU preview renderer or live model providers.

```sh
node scripts/integration/run-browser-export.mjs
```

Requires Bun, Playwright, and installed Chrome with a working GPU. Optional arguments:

- `--playwright <module-or-absolute-package-path>`: resolve an existing Playwright installation.
- `--browser <channel-or-absolute-executable>`: defaults to the `chrome` channel.
- `--bun <executable>`: choose the Bun executable used for the direct browser bundle.

The script does not install dependencies or change any existing browser profile. It writes a fresh
temporary folder containing `receipt.json`, the exact browser bundle, retained GLBs, and a GPU
screenshot. The receipt includes the browser version, GPU identity, bundle SHA-256, output hashes,
Khronos validation counts, pixel/vertex errors, and expected unsupported cases. Failures return a
nonzero exit code. Software GPU fallback is explicitly rejected.

## Coverage

- Raw and encoded textures with a quaternion animation.
- Two-bone weighted skin deformation and morph-target animation, each sampled five times.
- Physical-material sheen at intensity 0.6, with a sheen-disabled visibility control.
- Uniform texture scale with rotation and nonzero center.
- A manually assigned, glTF-representable UV matrix.
- A double-sided thin surface viewed from both front and back.

Animations must visibly change the image, and every sample must contain visible geometry. The
comparison checks deformed vertex positions as well as pixels. Geometry tolerance is `1e-5` scene
units; pixel tolerances are a mean channel difference at most 0.1/255 and at most 0.1% of channels
differing by more than 8/255. Receipts preserve the actual measured errors, including exact matches.

Three explicitly unsupported UV fixtures assert the precise rejection diagnostic: nonuniform
Three.js scale combined with rotation, that transform with a nonzero center, and a manually sheared
matrix. Their receipts say `supported: false`, `expectedRejection: true`. Passing these negative
tests means data loss was prevented; it does **not** mean these UV configurations are supported.
glTF's texture transform composes translation/rotation/scale in a different order from Three.js.
Lossless UV baking or another qualified strategy is needed before expanding this boundary.

## Latest measured evidence

On Chrome 152.0.7977.83 with NVIDIA RTX 3070 through ANGLE Direct3D11, eight supported fixtures
passed 25 original/reimported GPU comparisons with **zero channel differences**. Maximum deformed
vertex difference was `1.49e-8`. All eight exported GLBs passed Khronos validation with zero errors.
The three unsupported UV configurations were rejected explicitly. The sheen-disabled control
changed the image (maximum 25/255, mean 0.105/255), showing the sheen fixture exercised an actual
visible effect. Browser bundle SHA-256:
`c64461b92f628f4b4dd350a5fc9ddf206ca4270d41b19e8334598cbc8a52bb7a`.
This final rerun includes the texture-resource naming fix and corresponds to runtime build identity
`413501ff069d991b8be09cdbabc57c8ca2333179bc67288e2c33eca586959ef8`.

These are small deterministic fixtures, not full material-portfolio certification. They do not
qualify Unity/Blender appearance, shader variants in player builds, macOS/Linux GPUs, compression,
normal-map tangent edge cases, all skin bindings, all morph interpolation, or every combination of
material extensions. A successful browser gate is one part of exporter qualification.
