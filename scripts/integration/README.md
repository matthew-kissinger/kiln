# Optional importer qualification

This harness runs real Blender and/or Unity imports and checks explicit expectations.
It is separate from engine QA and offline CI. It does not render, install applications,
download packages, or change source GLBs. A successful receipt is structural evidence,
not visual, animation-playback, or player-build qualification.

```sh
node scripts/integration/run-imports.mjs \
  --input /path/to/glbs --output /path/to/new-receipts \
  --manifest /path/to/expectations.json --blender /path/to/blender
```

For Unity add `--unity /path/to/Unity --unity-project /path/to/disposable-project`.
Prepare that project with the chosen importer (for example stable glTFast 6.20.0)
before running. The harness adds an editor script and copies fixtures into that project;
it refuses to overwrite an existing audit script or fixture directory. Use a fresh
project or deliberately remove only those generated files and their Unity `.meta` files
before rerunning. It records
the editor version, registered packages and active render pipeline. It uses `-nographics`
only for structural inspection, not software rendering.

The input is a flat directory of GLBs. Receipts and process logs go to a new output
directory, with SHA-256 hashes of input assets and the expectation manifest; existing
receipts are rejected to avoid accepting stale results. Nonzero
process exits, missing receipts, import errors and failed assertions fail the command.

## Expectations

Write independent, engine-specific expected results, for example:

```json
{
  "blender": {
    "tolerance": 0.00001,
    "files": {
      "prop.glb": {
        "nodes": [{"name": "Mesh_Pennant", "parent": "Joint_Vane", "uvSets": 2}],
        "materials": [{"name": "Cloth", "metallic": 0.2}],
      "animationCount": 1,
      "animatedNodeCount": 1
      }
    }
  }
}
```

Add a `unity` section with expectations for its imported representation. Fields omitted
from an expectation are recorded but not asserted. Names must resolve uniquely; ambiguous
names fail rather than selecting an arbitrary object. Every expected file needs at least
one assertion. Position arrays use each application's coordinate system; Blender converts
glTF Y-up to Z-up, and Unity changes handedness. Do not compare those arrays directly
across engines. Unity may add a root or split primitives into separate objects.

Both adapters record node positions, vertex counts, UV-set counts, colour-attribute
presence, morph targets, materials and animation clip/action names. They sample imported
animation at the start, midpoint and end, recording changed object names and
`animatedNodeCount`; this catches inert transform clips but does not prove deformation
or every keyframe. Blender samples the imported scene's active animation configuration;
Unity samples each imported clip on the instantiated prefab. Blender records
armature modifiers and material metallic/roughness/culling values. Unity records skin
bone counts, shader names, shader-property names and bound texture slots. For shaders
exposing glTFast's `metallicFactor`, `roughnessFactor`, and `_CullMode`, Unity also records
their values with presence flags (assert those flags when asserting values). Nodes also
record `materialMetallicFactors` and `materialRoughnessFactors` arrays, allowing assertions
when material names are absent or repeated. A factor of -1 means no supported mapping.
These are
observations, not guarantees of shader fidelity or animation behavior. Application-level
checks must additionally exercise playback, GPU appearance and a Unity player build.

Run the portable assertion tests with:

```sh
bun test scripts/integration/check-receipt.test.mjs
```
