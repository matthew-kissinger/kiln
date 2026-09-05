# Kiln source contract

A `.kiln.js` file is ordinary JavaScript evaluated with Kiln globals. Do not add imports, exports, or TypeScript syntax. JSDoc and local helper functions are supported.

```js
const meta = { name: 'Reading lamp', category: 'prop', role: 'prop' };
function build() {
  const root = createRoot('ReadingLamp');
  const metal = gameMaterial(0x556677);
  createPart('Base', cylinderGeo(0.25, 0.25, 0.06, 32), metal,
    { position: [0, 0.03, 0], parent: root });
  return root;
}
```

`meta.name` identifies the asset. `meta.category` selects subject-related validation/QA guidance; it does not impose a category triangle budget. Categories are `prop`, `character`, `vfx`, `environment`, `architecture`, `vegetation`, and `vehicle`. `meta.role` describes its scene role when composition needs one: `ground`, `building`, `wonder`, `poi`, `prop`, `fill`, or `vehicle`.

`build()` returns a `THREE.Object3D` and may be async. Use `async`/`await` for Boolean operations, `roundedBoxGeo`, `extrudeProfile`, `revolveProfile`, `implicitSurface`, approved texture loading, and other catalog signatures marked async. `sweepProfile`, `loftProfiles`, and ordinary deformations are synchronous.

Optional `animate(root)` returns an array of `THREE.AnimationClip`. Follow catalog keyframe signatures: rotation tracks use a `rotation` field, position tracks use `position`. Grounded and moving parts need meaningful named pivots.

## Frames and ownership

- Asset coordinates: metres; +X forward, +Y up, +Z right.
- Kiln helper rotations and deformation frame rotations: Euler XYZ degrees.
- Direct Three.js `object.rotation`: radians.
- `createPart` prefixes mesh names with `Mesh_`. `createPart(..., { parent })` attaches the part; do not separately add its return value to another parent.
- `createPivot(name, position?, parent?)` is positional and prefixes the node name with `Joint_`. Rotate the returned object directly if needed.
- Cached primitives may share geometry. Use `copyGeometry` or `.clone()` before direct vertex/geometry mutation. `copyMaterial` copies material properties while sharing referenced textures.
- Legacy `cloneGeometry` and `cloneMaterial` return their input. They are deprecated reuse helpers, not independent copies.

## Geometry and execution boundaries

Custom `THREE.BufferGeometry` is available. `meshGeo` helps validate flat positions, indices, normals, UV0, and tangents. Read export warnings for unsupported attributes; arbitrary Three.js features do not automatically survive GLB export. The host may select `geometryPolicy: 'strict'` to reject unsupported attributes instead of dropping them with warnings. In a local runtime, `KILN_GEOMETRY_POLICY=strict` configures this host policy; generated source and tool arguments cannot weaken it.

Use deterministic equations or explicit seeded recipes when repeatable builds matter. Avoid ambient state in reusable geometry functions.

The source policy rejects host-global access, network access, dynamic imports/evaluation, constructor chains, and raw `THREE.DataTexture`, `ShaderMaterial`, or `RawShaderMaterial`. Use approved texture/material helpers. Source checks are not an operating-system sandbox; evaluator process boundaries belong to the host.

`kiln_validate` checks source without building geometry. `kiln_render` evaluates and returns images and structural findings. A valid program can still make an unsuitable shape or fail a later export check.
