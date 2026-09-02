---
name: kiln-author-asset
description: Author a 3D asset as a Kiln program, then render it and look at the result until it is right. Use when asked to create, model, build, or refine a 3D asset, prop, vehicle, character, building, or GLB file, or when a project needs a game-ready model that does not exist yet.
license: MIT
---

# Author a Kiln asset

You are the author. Kiln gives you a sandbox of geometry primitives, a validator, a renderer, and a
camera — you write the program and judge the pictures. Nothing here calls another model.

## The loop

1. **`kiln_list_primitives`** — read the catalog before writing anything. Signatures matter; guessing
   them wastes a render. Filter by category when you only need one area.
2. **Write the program.** A `meta` const, a `build()` returning a scene root, optionally `animate()`.
3. **`kiln_validate`** — cheap. Catches syntax errors, a missing `build()`, infinite loops, recursion,
   and keyframe typos before you spend a render on them.
4. **`kiln_render`** — builds the scene and returns metrics *and* the six-view contact sheet in one
   call: triangles, meshes, materials, bounding box, `lowestPart`, an instanceability grade, and the
   image. **Actually look at the image.** This is the step that makes the whole thing work, and it is
   the step that is easiest to skip.
5. Fix what you see. Go back to 3.
6. Write the final program to a `.kiln.js` file in the project.

A build failure returns an error and **no image**, so you never get a picture of a model that did not
build. If `kiln_render` returns without pixels, read the error rather than rendering again.

## Reading the contact sheet

The grid is Front / Right / Back on the top row, Left / Top / 3-4 on the bottom. Kiln's frame is
**+X forward, +Y up, +Z right**, and assets sit on **Y=0**.

Check, in this order:

- **Orientation.** The nose, muzzle, or face belongs in the Front cell. A vehicle facing sideways is
  the single most common failure and it is invisible in metrics.
- **Grounding.** `lowestPart` should touch Y=0. Anything below grade must be
  deliberate — earthworks, a keel — never wheels, feet, or equipment.
- **Attachment.** Floating parts show as gaps in the orthographic cells. The 3-4 view hides them;
  the axis-aligned views do not.
- **Silhouette and proportion.** Squint at the Front and Right cells. If the shape does not read as
  the thing at thumbnail size, more detail will not save it.
- **Symmetry.** The Top cell is where mirrored parts reveal that they are not mirrored.

Use **`kiln_inspect`** for a close-up orbit on a named part when a cell is too small to judge, and
**`kiln_screenshot_animation`** when the program has an `animate()`.

## Rules that save renders

- Build the silhouette first, then subdivide. Detail on a wrong shape is wasted work.
- Name parts for what they are. The names survive into the GLB and are how the next agent, and the
  game engine, address them.
- Reuse materials. The instanceability grade is driven by distinct-material count, and fewer shared
  materials grade higher.
- Prefer a few well-placed primitives over many small ones. Triangle budget is a soft warning, not a
  wall, but a 40k-triangle crate is a mistake.
- If two consecutive renders look the same, you are not changing what you think you are changing.
  Re-read the program instead of rendering a third time.

## What the render can and cannot tell you

**Read `viewFidelity` on every render.** It is the render telling you what it is honest about:

- `materialFaithful: true` — GPU PBR shading. Judge material, texture, roughness, metalness,
  emissive response, normal relief. This is a real picture of the surface.
- `materialFaithful: false` — flat-shaded CPU raster. Judge silhouette, proportion, orientation,
  contact, and part attachment **only**. Do not comment on colour accuracy, texture, or whether
  something looks metallic. It cannot show you that: a polished steel part and a grey plastic part
  render identically.

When `degraded` is set, `degradeReason` says why the GPU did not draw. A degrade is not a failure —
the geometry findings are still valid — but it does bound what you are allowed to conclude.

If material read matters and you only have the CPU raster, say plainly that material appearance was
not verified rather than implying it was. Running a GPU render service and pointing
`KILN_RENDER_PORT_URL` at it is what changes that.

**Structural validation is not a visual pass, and neither is a passing render.** A program that
builds cleanly can still look wrong. Only the picture tells you, and only if you look.

## Reporting

Say what you changed and why, name what still does not match, and never call a feature "done" when
it is only "improved". If a gate passed but the asset reads badly, say both.

Read [references/program-contract.md](references/program-contract.md) before writing the first
program: file shape, the `meta` fields, the strict +X-forward coordinate contract, `createPart`
auto-parenting, and what the sandbox forbids.
