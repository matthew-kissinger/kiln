# Geometry you can shape

Kiln programs are JavaScript. The helpers cover common modeling operations; equations, loops, and custom `THREE.BufferGeometry` remain available when you need a different shape. Geometry functions belong in the saved program, so a later source edit can change one parameter and keep the rest.

Use meters for dimensions. The asset convention is **+X forward, +Y up, +Z right**. Helper `rotation` values use Euler XYZ **degrees**; direct Three.js rotations use radians.

## Size and orient a gear

`gearGeo` builds a gear in the XZ plane, centered at the origin, with its axle and thickness along Y. To mount its axle along Z, use `rotation: [90, 0, 0]` on the part.

Radii are absolute dimensions, not proportions. Set all three when making a small gear: `boreRadius < rootRadius < tipRadius`. A zero bore makes a solid center. Changing only `tipRadius` can leave it smaller than the default root radius of 0.8 meters.

```js
createPart('ElevationWheel', gearGeo({
  teeth: 28, rootRadius: 0.063, tipRadius: 0.075,
  boreRadius: 0.012, height: 0.024,
}), brass, { rotation: [90, 0, 0], parent: yoke });
```

The helper makes a stylized toothed shape; it does not calculate an involute tooth profile or prove that two gears mesh correctly.

## Own geometry before changing it

Primitive calls with identical arguments can share a cached geometry. Copy before changing its vertices or applying a geometry transform:

```js
const editable = copyGeometry(boxGeo(1, 1, 1));
editable.translate(0, 0.5, 0);
const red = copyMaterial(steel);
red.color.set(0xaa2222);
```

`copyGeometry` copies vertex buffers. `copyMaterial` copies material properties while retaining shared texture references. The older `cloneGeometry` and `cloneMaterial` names are deprecated: **they return their input**, preserving their original reuse behavior. They are not safe copying functions. Direct `.clone()` is also available.

New shaping helpers return independent geometry. Use `createInstance` when sharing geometry and materials is intentional.

## Author a surface with an equation

```js
const canopy = parametricSurface(
  (u, v) => [u, 0.4 * Math.sin(u * 2) + 0.15 * v * v, v],
  { u: [-2, 2], v: [-1, 1], uSegments: 48, vSegments: 24 },
);
```

`u` and `v` are finite parameter domains. Sampling defaults to 24 segments in each direction. The default `orientation: 'uv'` follows the cross product of the increasing U and V directions; use `'vu'` to reverse it. UVs run from 0 to 1.

For a periodic surface, declare the matching seam explicitly:

```js
const torus = parametricSurface(
  (u, v) => [
    (2 + 0.5 * Math.cos(v)) * Math.cos(u),
    0.5 * Math.sin(v),
    (2 + 0.5 * Math.cos(v)) * Math.sin(u),
  ],
  { u: [0, 2 * Math.PI], v: [0, 2 * Math.PI],
    uSegments: 48, vSegments: 24, periodicU: true, periodicV: true },
);
```

Periodic endpoint positions must coincide. Kiln retains distinct 0/1 UVs while matching seam positions and normals. Sampling does not add thickness, cap poles, remove self-intersections, or turn every equation into a solid. Avoid collapsed parameter rows unless you deliberately handle their degenerate triangles.

For hand-authored topology, `meshGeo` takes flat arrays:

```js
const triangle = meshGeo({
  positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
  indices: [0, 1, 2],
  uvs: [0, 0, 1, 0, 0, 1],
});
```

Positions contain XYZ triples; each index triple is a counterclockwise triangle. Without indices, every three vertices form one triangle. Optional `normals`, `uvs`, and `tangents` must match the vertex count. Normals are computed when omitted and normalized when supplied. Tangents use unit XYZ plus handedness +1 or -1. Validation rejects nonfinite data and invalid indices. Raw Three.js can carry additional attributes, but check Kiln's export diagnostics before assuming every Three.js feature survives GLB export.

## Bend, twist, taper, and displace

```js
const twisted = twist(column, { angle: 120 });
const narrower = taper(column, { endScale: [0.4, 0.7] });
const arched = bend(rib, { angle: 90 });
const corrugated = displace(sheet, ([x, y, z]) => [0, 0.06 * Math.sin(x * 18), 0]);
```

These operations work along **local +Y**. `bend` turns +Y toward +X; `twist` rotates around +Y. `taper` interpolates positive X/Z scale pairs from `startScale` (default `[1,1]`) to `endScale`. `displace` returns a vector to add, not an absolute replacement position.

A shared options shape controls the frame and affected region:

```js
const shaped = twist(geometry, {
  angle: 75,
  frame: { origin: [0, 1, 0], rotation: [0, 0, 90] },
  interval: [-1, 1],
  falloff: t => Math.sin(Math.PI * t),
});
```

`frame` is a rigid origin and degree-based rotation. `interval` contains local Y distances; it defaults to the mesh's local Y extent. Vertices outside an explicit interval remain unchanged. The optional falloff returns a weight from 0 to 1. Use a weight that reaches zero at the region boundary when a hard transition would tear or fold the surface. A zero-height mesh has normalized interval coordinate 0.

Deformation preserves vertex topology and UVs, recomputes normals and bounds, and invalidates old tangents. Apply `creaseNormals` afterward when you want controlled smooth/sharp boundaries. Enough segments must exist before shaping: bending a single quad does not create a curved surface.

A deterministic displacement can use an authored hash instead of ambient randomness:

```js
function seededHeight(x, z, seed) {
  const value = Math.sin(x * 12.9898 + z * 78.233 + seed * 37.719) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}
const rough = displace(surface, ([x, y, z]) => [0, 0.02 * seededHeight(x, z, 7), 0]);
```

## Sweep a profile or loft sections

```js
const profile = [[-0.12, -0.2], [0.12, -0.2], [0.12, 0.2], [-0.12, 0.2]];
const rail = sweepProfile(profile, [[0, 0, 0], [0, 1, 0], [0.5, 2, 0]], {
  twist: 20,
  scale: [[1, 1], [0.9, 0.9], [0.7, 0.7]],
});
```

Profiles use local `[x,z]` coordinates. Sweep paths are **polyline stations**, not automatically smoothed splines. Sample a curve first for smooth curvature. The initial `up` vector defines profile +Z after projection perpendicular to the path. If omitted, Kiln chooses a stable cardinal direction. Subsequent frames use parallel transport instead of repeatedly projecting a global up vector.

`twist` is the total degree rotation along the path. `scale` can be one positive number or one positive `[x,z]` pair per station. Caps default to true. For `closed: true`, omit the repeated endpoint; total twist must be a multiple of 360 degrees. Closed frames receive a seam correction and retain a wrapped UV seam.

For profiles that change shape rather than just scale:

```js
const body = loftProfiles([
  { profile: [[-1,-1],[1,-1],[1,1],[-1,1]] },
  { profile: [[-.5,-1],[.8,-.6],[.6,.5],[-.5,.7]],
    frame: { origin: [0.4, 2, 0], rotation: [0, 15, 0] } },
]);
```

Each loft section lies in its frame's local XZ plane, with local +Y along the intended loft. All profiles need the same vertex count and meaningful index-to-index correspondence. Winding is normalized while retaining the first vertex. First versions accept one simple outline without holes; use existing `extrudeProfile` for straight profiles with holes. `cap: false` leaves end boundaries open.

These helpers reject self-crossing 2D outlines, duplicate path stations, and near-reversals. Tight turns get a warning. **Closed boundaries do not prove the resulting 3D surface is free of self-intersections.** Review nearby path segments, large profiles, and crossed loft sections. Kiln does not claim a general CAD-solid guarantee for sweeps or lofts.

## Preserve seams and control shading

```js
const smooth = subdivide(texturedGeometry, 1, { preserveUV: true });
const shaded = creaseNormals(smooth, { angle: 45 });
const report = geometryDiagnostics(shaded);
```

- `subdivide(..., { preserveUV: true })` keeps per-corner UV charts while smoothing positions. Legacy subdivision defaults retain their existing position-only weld and may discard UVs; the result carries a `SUBDIVIDE_UV_DROPPED` warning when that happens.
- `mergeVertices` normally keeps separate vertices where normals or UVs differ. `{ positionOnly: true }` explicitly drops other attributes to weld geometric topology.
- `creaseNormals` preserves UV corners, averages neighboring face normals within the degree threshold, and invalidates tangents. Its position tolerance defaults relative to mesh size; override `tolerance` when necessary.
- `geometryDiagnostics` reports boundary edges, non-manifold edges, inconsistent edge orientation, degenerate triangles, invalid indices, and nonfinite vertices. It matches position seams using a caller-adjustable tolerance (default `1e-6`). Open boundary edges are expected for sheets. It does not run a general self-intersection test.

## Keep Boolean materials and UVs when useful

```js
const carved = await boolDiff('Housing', body, cutter, { preserveAttributes: true });
```

`preserveAttributes: true` carries UV0 through Manifold interpolation and returns material groups. Exposed subtraction surfaces inherit their cutter's material and UVs. Missing UVs on an operand receive zero coordinates and an explicit warning. Normals are regenerated according to `smooth`; tangents are invalidated. This is useful for existing tileable mappings; it does not create a new unified atlas.

Legacy calls retain their original first-material/no-UV behavior. Use `autoUnwrap` after a Boolean when you want a fresh atlas. Profile solids also generate their own surfaces without UVs.

CSG metadata now records actual output runs and source face IDs, including the backside flag for subtraction, rather than allocating guessed triangle ranges. Nested preserving operations retain source names and material groups. A hull creates new faces, so it reports unknown provenance and retains only the first material with no UVs even when preservation was requested.

## Experiment with implicit fields

```js
const blob = await implicitSurface(
  ([x, y, z]) => 1 - Math.hypot(x, y, z),
  { bounds: { min: [-1.2,-1.2,-1.2], max: [1.2,1.2,1.2] }, edgeLength: 0.15 },
);
```

The field is **positive inside**. Bounds and `edgeLength` are required. Smaller spacing can increase cost sharply and is necessary for thin features. The default limits are one million estimated grid cells and eight million actual callback evaluations; `maxCells` and `maxEvaluations` are explicit overrides. An evaluation counter cannot stop a callback that never returns: use the host's process-bounded evaluator for untrusted source.

Output is experimental, has no UVs, and records resolution and evaluation counts. A finite grid cannot guarantee preservation of every thin feature or exact CAD dimensions. See the [candidate measurements and adoption decisions](experiments/geometry-frontier.md) for implicit surfaces, general beveling, normal-offset shells, and mesh-to-field remeshing.
