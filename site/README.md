# Kiln website

The home page and gallery load text and static posters first. Three.js is loaded
when a visitor opens an asset or requests the interactive hero. Models start
stationary. Source downloads refer to the files produced alongside the displayed
GLBs, rather than a potentially newer branch on GitHub.

From the repository root:

```sh
bun run --cwd site assets
bun site/scripts/verify-assets.mjs
bun run --cwd site build
bun run --cwd site preview --host 127.0.0.1 --port 4175
```

Install the site dependencies with `cd site && bun install --frozen-lockfile` if
they are not present. Asset generation uses the root engine dependencies and
makes no model calls. It rebuilds the gallery, workbench edit demonstration, and
the equation-surface example with part-relative camera inspection.
Run it after engine/source changes; building only the Vite application does not
regenerate GLBs. Keep the engine tree stable during generation: the build refuses
to issue a build record if its inputs change.

Validation:

```sh
bun test site/scripts/provenance.test.ts
bunx tsc -p site/tsconfig.json
bunx biome check site/src
```

Before sharing the page, inspect desktop and mobile layouts, keyboard navigation,
the hero's first loaded frame, gallery filters, source and GLB downloads, and the
failed-WebGL/load fallback. Automated bundle checks do not establish visual quality.

[Example attribution and build records](../docs/example-provenance.md) explains
the distinction between source-header declarations, evaluation evidence and
new gallery captures and historical evaluation images.

To make a new exact-GLB gallery poster with the local GPU service running:

```sh
bun site/scripts/build-example-poster.mjs abyssal-surveyor --square
bun site/scripts/build-hero-poster.mjs abyssal-surveyor
```

Run these from the repository root after asset generation. They do not call a
model or edit the asset source. They check the returned camera and material
receipt, require a stable renderer identity across the request, and save hashes
and capture settings with the image. `build-example-poster` updates the example's
source-bound sidecar and the generated index. Use the hero command only when a
large opening image is needed; source and framing still match its downloadable
GLB. Review the pixels before featuring an example. If an exact-poster guard
rejects a later asset rebuild, remove that example's old `posterReceipt` from the
sidecar, rebuild, then generate and review a new poster.
