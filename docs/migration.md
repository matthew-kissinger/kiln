# Updating an existing Kiln integration

This candidate keeps the package version at `0.6.0` until release review. Existing
inline-code calls and the legacy capture format remain supported. The additions
below are opt-in, except for corrections to export, camera and setup behavior.

## Retain the source once

Save the `programRef` returned by a render or source import. Pass that reference to
later read, edit, validation, inspection and animation calls. An edit creates a new
revision; retain its returned reference for subsequent work. There is no global
“current asset.” Existing references remain available after a local server restart.

`kiln_source` reads bounded source; `kiln_edit` applies exact replacements atomically
and normally renders the result. Export source through the CLI instead of asking
the model to transcribe it. [Source storage and limits](programs.md).

## Use the versioned camera format for new integrations

Use `capture.version: "kiln.capture.v1"` for explicit camera positions, part-relative
views, perspective, mixed subjects, separate images and selected animation times.
The legacy preset/angle form keeps its existing defaults. New capture objects
reject unknown fields so a misspelled camera option cannot silently disappear.

CPU and GPU receive the same resolved camera. Read the returned camera and material
fidelity separately: a correct camera does not establish faithful PBR shading.
[Camera fields and examples](cameras.md).

The CLI accepts the same capture object from a JSON file:
`node kiln.mjs render REF --capture cameras.json --views chosen.png`.
Use grid output for this single PNG destination. This avoids copying image data
from a tool response and reuses the evaluated asset.

The GPU service now preserves HDR values until tone mapping and conversion to
sRGB. Earlier previews could clip highlights despite reporting full-material
rendering. Regenerate comparison images with the updated service; its capture
identity invalidates older cached cells. The legacy beauty-image route also works
again. [Measured display correction](evaluation/results/gpu-display-output.md).

## Copy before changing shared geometry

Primitive geometry is memoized. Use `copyGeometry` or `copyMaterial` before changing
an instance independently. The older `cloneGeometry` and `cloneMaterial` names are
deprecated identity helpers; their behavior has deliberately not changed.

Subdivision defaults remain compatible. Request `preserveUV: true` when the
subdivided geometry needs its UVs. Boolean property preservation is explicit too;
use the documented option and inspect diagnostics when attributes or provenance
matter. Export now supports material groups and validates supported vertex data.
Unsupported channels produce diagnostics under the default warning policy;
`geometryPolicy: "strict"` rejects them. A strict host policy cannot be weakened by
a request. [Geometry and preservation contracts](geometry.md).

`gearGeo` no longer duplicates tooth-boundary vertices or creates degenerate caps
when the bore is zero. Gear topology and exported bytes consequently change.
Radii keep their absolute defaults: set `boreRadius < rootRadius < tipRadius`
together when making a small gear. The isolated evaluator now returns a bounded
repair hint for this mistake and for undeclared variables.

## Rebuild the local runtime and refresh project setup

Build all runtime entries together with `bun run build:runtime`, or install the
complete new tarball. Do not copy just the MCP bundle: the CLI, evaluator worker,
build manifest, setup script and skills belong to the same installation.

Packaged Node tools now use a terminable subprocess and a bounded disk build cache.
Changing cameras can reuse an evaluated asset; source references and cached builds
have separate lifetimes. Keep exported source before removing `.kiln/programs`.
[Execution, limits and cache controls](runtime.md).

For a new task, generate a fresh external workspace from the candidate. Use
`--repair` for moved installations; it preserves authored files and copied skills
and refuses to overwrite edited configuration. Fresh setup is required to obtain
updated skill copies. Antigravity workspaces include `agy.mjs`; use it and the
project's `kiln_workspace` server to avoid selecting an older global plugin.
[Installation and repair](install.md).

## Keep experimental operations explicit

`implicitSurface` is experimental and bounded. General bevel, shell and remeshing
are not stable helpers in this candidate. Their trials and adoption decisions are
documented in [geometry experiments](experiments/geometry-frontier.md) and the
[additional acceptance cases](experiments/geometry-acceptance.md). Ordinary
JavaScript functions remain the supported way to reuse parameterized parts.
