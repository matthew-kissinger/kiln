# The Kiln program contract

Read this when you are about to write or repair a `.kiln.js` program. The
[SKILL.md](../SKILL.md) loop assumes you already know this shape.

## File shape

A program is plain JavaScript with **no imports and no exports**. Primitives and helpers arrive as
globals. Three top-level declarations matter:

```js
const meta = { name: 'AssetName', category: 'prop', role: 'prop' };

function build() {
  const root = createRoot('AssetName');
  // ...
  return root;
}

function animate(root) {   // optional
  return [clip];           // THREE.AnimationClip[]
}
```

`build()` may be **sync or async**. Mark it `async` if you use any CSG op (`boolUnion`, `boolDiff`,
`boolIntersect`, `hull`) or any bevel/sweep op (`roundedBoxGeo`, `extrudeProfile`,
`revolveProfile`) — those await WASM.

An `export` statement is a validation error, not a style problem: the program is evaluated in a
sandbox, not imported as a module.

## `meta`

| Field | Meaning |
|---|---|
| `name` | the asset name; also the conventional root node name |
| `category` | picks the advisory triangle reference point (see below) |
| `role` | how the asset sits in a scene — drives composition layout |

`role` is one of `ground`, `building`, `wonder`, `poi`, `prop`, `fill`, `vehicle`. It is the field a
scene composer reads later, so set it deliberately even for a standalone asset.

## The coordinate contract

This is strict, and violating it is the most common failure that metrics cannot catch:

- **+X** = forward / nose / muzzle
- **+Y** = up
- **+Z** = asset right
- Ground rests at **Y = 0**

Vehicles, aircraft, weapons, boats, and buildings all follow this frame. If a part points forward,
build it along +X. If a part spans left-to-right, build it along Z. Do not let each asset invent its
own forward axis — a scene composed of assets with private conventions is unfixable.

## `createPart` auto-parents

```js
// WRONG — double-adds
parent.add(createPart('Name', geo, mat, { parent: parentObj }));

// RIGHT
createPart('Name', geo, mat, { parent: parentObj });
```

`createPivot(name, position, parent)` is positional and takes **no rotation**. If you need a rotated
group, set rotation on the returned object after creating it.

## Triangle budgets are advisory

`kiln_validate` emits an informational nudge when an asset is far past the reference point for its
category — 25k for `prop`, 40k for `character`/`vehicle`/`vegetation`, 60k for `building`, 120k for
`environment`, 40k default. **These never gate.** Triangles are not the cost driver; draw calls are.
Keep the detail if the silhouette needs it, and reuse materials to keep draw calls down.

## What the sandbox forbids

No `globalThis`/`global`/`process`, no network, no dynamic `import`/`eval`/`Function`, no constructor
chains, and no raw `THREE.DataTexture`/`ShaderMaterial`/`RawShaderMaterial`. The validator rejects
these before a render, so hitting one costs a round trip, not a mystery.
