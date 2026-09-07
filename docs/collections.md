# Saved assets and the local viewer

Save an asset with its editable source, inspect it in a browser, and move a pinned
revision between a game project and a personal library. Everything runs locally;
viewing and exporting make no model calls. Collections are separate from source
snapshots and disposable build caches.

## Start in your asset workspace

```sh
node kiln.mjs save workbench.kiln.js --name "Workbench" --tag furniture
node kiln.mjs assets
node kiln.mjs view
```

Open the printed loopback URL. The viewer shows one card per asset, supports search,
tags, revision selection, animation playback, wireframe, lighting and downloads.
It loads the saved GLB, never executes its JavaScript. Selecting a revision in the
browser remembers that choice in that browser; it does not update other clients.
Multiple branch tips are identified on the asset card.

`kiln view asset.glb` or `kiln view bundle.zip` previews a standalone file without
importing it. The file picker also accepts local GLBs and Kiln ZIP bundles. Opened
files stay in browser memory until the page closes. A GLB without source is labelled
as such. Select several collection assets to download one ZIP, up to 100 revisions
and 64 MiB of uncompressed content.

From the engine checkout, use `node dist/cli.mjs` instead of `node kiln.mjs`.

## Project collections and personal libraries

The default `project` collection lives at `<workspace>/assets/kiln`. Remember another
location with:

```sh
node kiln.mjs collections add personal /absolute/path/to/my-library
node kiln.mjs collections
node kiln.mjs save chair.kiln.js --name "Chair" --collection personal
```

Paths are stored in the workspace's `.kiln/collections.json`. Restart an existing
viewer or MCP process after changing this configuration. `KILN_COLLECTIONS` can
override it with a JSON map, such as `{"project":"/game/assets/kiln","personal":"/my-library"}`.
The configured directories are the only collection roots the server exposes.
The CLI and MCP derive their workspace from the shared `KILN_PROGRAM_STORE` when set.

An asset directory contains `revisions/<revisionId>/manifest.json`, `asset.glb`, and,
when available, `source.kiln.js` and `preview.png`. Copy the whole collection to move it.
Source/manifest files are suitable for Git; decide whether generated binaries belong
in Git, LFS, or ordinary backups. The generated workspace ignores GLB and PNG files
by default. There is no automatic deletion or disk quota for saved collections.

## Agents and refinement

1. Author/review with the existing tools. Draft rendering retains source but does
   not create gallery entries.
2. Call `kiln_save` with `programRef`, `name`, and a collection. Optional fields include
   tags, brief, description and known attribution.
3. Save the returned asset/revision IDs. `kiln_export` returns resource links for the
   GLB, source, preview, manifest and ZIP. MCP clients choose how to show downloads.
4. In a later session, use `kiln_assets` with `action: "restore"`, collection,
   assetId and revisionId. Use the returned programRef with `kiln_source`/`kiln_edit`.
5. Save a child with the same assetId and `parentRevision` equal to the base revision.

`kiln_assets` also lists configured collections, searches/paginates revisions and
retrieves complete build records. `kiln_import` copies one exact revision between
configured collections. Copies preserve identity and never update automatically.

The viewer's **Copy refinement instructions** provides an exact restore/edit/save
instruction for your agent. Library integrators can inject `AssetLibrary` into
`KilnToolContext`; `makeKilnProgramTools` exposes the same registry through Strands
plus a terminal submit tool. Existing generation/buffer surfaces remain compatible.

## Export and import

```sh
node kiln.mjs export ASSET_ID REVISION_ID --out workbench.zip
node kiln.mjs export ASSET_ID REVISION_ID --format glb --out workbench.glb
node kiln.mjs export ASSET_ID REVISION_ID --format source --out workbench.kiln.js
node kiln.mjs import workbench.zip --collection personal
node kiln.mjs asset ASSET_ID REVISION_ID --collection personal --restore
```

Exports refuse to overwrite existing files. ZIPs are ordinary archives containing
one or more complete revisions. Source restore needs no original program store.
Source is capped at 1 MiB; normal evaluator limits can be lower. Bundles are bounded,
filenames are allowlisted and hashes are verified on import/read. GLBs must embed
resources, rather than fetch remote URLs when viewed.

Imports preserve original IDs and parent references, even when an ancestor was not
included. Importing the same revision twice is harmless; a conflicting identity is
rejected. Each revision is committed atomically; a multi-revision import may have
committed earlier revisions if a later filesystem operation fails. Retrying is safe.

## Provenance and rebuilding

The manifest records source/GLB/preview hashes, parent revision, build warnings,
integration/QA information, effective host options and runtime identity when verified.
Source-development or unverified hosts are labelled explicitly. Briefs and model
attribution are supplied context, not authenticated authorship claims.

The source depends on Kiln: preserve the indicated engine installation/version for
rebuilding. Approved packaged textures travel with that engine. A host-only runtime
texture dependency is recorded as `external-dependencies-required`; its bytes are
not silently claimed to be in the ZIP. The GLB itself remains self-contained.
CPU preview fidelity is recorded; use the interactive material rendering to inspect
appearance, and the structural report for geometry checks. GPU pixels are not QA evidence.

The local browser host binds to loopback, serves only configured collections and
bundled viewer files, and rejects cross-origin requests and writes. It has no remote
authentication or public hosting mode. Remote MCP hosts must supply reachable file
delivery; localhost links on a remote machine are not user download URLs. Embedded
chat viewing and each client's download behavior require separate verification.
