# Choose geometry by the shape you need

Read current catalog entries before using a helper. Useful filters are `geometry`, `mesh-ops`, `curves`, `csg`, `uv`, and `instancing`. Each recipe below lives in `build()` with a named root and suitable material.

## Surfaces from equations

An asymmetric canopy or corrugated sheet can be much shorter as a function than as many primitives:

```js
const canopy = parametricSurface(
  (u, v) => [u, 0.35 * Math.sin(u * 2) + 0.12 * v * v, v],
  { u: [-2, 2], v: [-1, 1], uSegments: 48, vSegments: 24 },
);
createPart('Canopy', canopy, metal, { parent: root });
```

Domains and segment counts are explicit. `orientation: 'uv'` follows increasing-U cross increasing-V; `'vu'` reverses winding. `periodicU`/`periodicV` require matching endpoints and retain wrapped UV seams. A sampled surface has no automatic thickness or caps.

For authored topology, `meshGeo({ positions, indices, normals?, uvs?, tangents? })` uses flat numeric arrays. Triangle winding is counterclockwise. An open sheet is valid geometry; do not label it a watertight solid.

## Shape an existing mesh

```js
const twisted = twist(column, { angle: 90 });
const narrowed = taper(column, { endScale: [0.4, 0.7] });
const curved = bend(rib, { angle: 60 });
const rippled = displace(sheet, ([x, y, z]) => [0, 0.04 * Math.sin(x * 16), 0]);
```

All return owned geometry. They work along local +Y; bend turns +Y toward +X. Set `frame: { origin, rotation }` for another local frame; rotations are degrees. `interval: [minY,maxY]` selects local Y distances, with outside vertices unchanged. An optional `falloff(t)` returns 0..1. Displacement returns an offset, not a replacement position.

Add enough segments before shaping. UVs remain, normals/bounds are recomputed, and stale tangents are removed. `creaseNormals(geometry, { angle: 45 })` then gives controlled hard/smooth boundaries. `subdivide(geometry, 1, { preserveUV: true })` preserves UV charts; legacy subdivision can discard them. Topology-changing subdivision drops old CSG face provenance rather than guessing.

## Vary the cross-section

```js
const profile = [[-.12,-.2],[.12,-.2],[.12,.2],[-.12,.2]];
const rail = sweepProfile(profile, [[0,0,0],[0,1,0],[.5,2,0]], {
  twist: 20, scale: [[1,1],[.9,.9],[.7,.7]],
});
const housing = loftProfiles([
  { profile },
  { profile: [[-.2,-.1],[.3,-.1],[.2,.15],[-.2,.15]],
    frame: { origin: [0,1,0], rotation: [0,15,0] } },
]);
```

Profiles use local `[x,z]`; loft sections lie in local XZ planes. A sweep follows supplied polyline stations using transported frames. Sample a curve first if you need smooth curvature. `up` sets initial profile +Z and must not parallel the path.

Caps default on. Closed sweeps omit the repeated path endpoint and require total twist to be a multiple of 360. Loft sections require matching point counts and deliberate index correspondence. These versions accept a simple outline without holes; use `extrudeProfile` for straight sections with holes. Review tight turns and nearby surfaces for self-intersections.

## Preserve useful Boolean surfaces

```js
const housing = await boolDiff('Housing', body, portCutter, { preserveAttributes: true });
```

Preservation mode carries UV0 and material groups; exposed cuts inherit the cutter's UVs/material. Missing input UVs produce a warning. Normals are regenerated; tangents are not retained. Without the option, legacy calls keep the first material and discard UVs. Use `autoUnwrap` afterward for a new atlas. Convex hulls create new faces and cannot promise source UV/material provenance.

`roundedBoxGeo` rounds a box's twelve edges. Profile beveling rounds profile corners; extrusion cap edges remain sharp. Subdivision is smoothing, not a dimension-preserving general bevel.

## Reuse structure without a new language

Put repeated assemblies in ordinary functions with JSDoc parameters and named return values. Pass parent/material explicitly; return the assembly root and attachment markers. Change one parameter at the call site for a variant. The runnable [reusable-frame recipe](reusable-frame.kiln.js) demonstrates this without imports or hidden dependencies.

## Implicit fields are experimental

```js
const blob = await implicitSurface(([x,y,z]) => 1 - Math.hypot(x,y,z), {
  bounds: { min: [-1.2,-1.2,-1.2], max: [1.2,1.2,1.2] }, edgeLength: 0.15,
});
```

Positive values are inside. Bounds/resolution are required; smaller cells cost more and thin features can disappear. Explicit grid/evaluation limits apply. Output has no UVs. Use this for a deliberate organic/cellular experiment, not an unsupported promise of general shelling, remeshing, or CAD accuracy.
