---
name: kiln-author-asset
description: Author a 3D asset as a Kiln program, then render it and look at the result until it is right. Use when asked to create, model, build, or refine a 3D asset, prop, vehicle, character, building, or GLB file, or when a project needs a game-ready model that does not exist yet.
license: MIT
---

# Author a Kiln asset

You are the author. Kiln gives you a sandbox of geometry primitives, a validator, a renderer, and a
camera -- you write the program and judge the pictures. Nothing here calls another model.

## The loop

1. **`kiln_list_primitives`** -- read the catalog before writing anything. Signatures matter; guessing
   them wastes a render. Filter by category when you only need one area.
2. **Write the program to its file, rough.** A `meta` const, a `build()` returning a scene root,
   optionally `animate()`. Block out the primary masses and save it. Do not solve the geometry
   analytically first: the render is the feedback, and arithmetic done in advance of it is both
   the slowest way to find a proportion and the easiest way to run out of room before anything
   exists. Something crude on disk beats something exact you have not written yet.
3. **`kiln_validate`** -- cheap. Catches syntax errors, a missing `build()`, infinite loops, recursion,
   and keyframe typos before you spend a render on them.
4. **`kiln_render`** -- builds the scene and returns metrics *and* the six-view contact sheet in one
   call: triangles, meshes, materials, bounding box, `lowestPart`, an instanceability grade, and the
   image. **Actually look at the image.** This is the step that makes the whole thing work, and it is
   the step that is easiest to skip.
5. Fix what you see. Go back to 3.
6. Keep saving to the same `.kiln.js` file as you go, so the best version so far is always on disk.

The single most common way to fail this loop is never to enter it: spending the whole budget
planning the finished object and emitting nothing. Models have burned thirty thousand tokens
hand-solving pin positions and cylinder attachments in prose, been cut off mid-calculation, and
left no file at all. Write something that builds, look at it, then fix it.

A build failure returns an error and **no image**, so you never get a picture of a model that did not
build. If `kiln_render` returns without pixels, read the error rather than rendering again.

## Reading the contact sheet

The grid is Front / Right / Back on the top row, Left / Top / 3-4 on the bottom. Kiln's frame is
**+X forward, +Y up, +Z right**, and assets sit on **Y=0**.

Check, in this order:

- **Orientation.** The nose, muzzle, or face belongs in the Front cell. A vehicle facing sideways is
  the single most common failure and it is invisible in metrics.
- **Grounding.** `lowestPart` should touch Y=0. Anything below grade must be
  deliberate -- earthworks, a keel -- never wheels, feet, or equipment.
- **Attachment.** Floating parts show as gaps in the orthographic cells. The 3-4 view hides them;
  the axis-aligned views do not.
- **Silhouette and proportion.** Squint at the Front and Right cells. If the shape does not read as
  the thing at thumbnail size, more detail will not save it.
- **Symmetry.** The Top cell is where mirrored parts reveal that they are not mirrored.

Use **`kiln_inspect`** for a close-up orbit on a named part when a cell is too small to judge, and
**`kiln_screenshot_animation`** when the program has an `animate()`.

## The quality bar

**Build it as though it ships in a AAA title.** Not "a recognizable X" -- the version of X a studio
artist would put in front of a camera. Every asset you author should survive being placed next to a
real production asset without looking like the cheap one.

That bar is not rhetoric; it is the actual standard you check against in the critic loop below. An
asset that validates, renders, and is recognizable has cleared the *floor*, not the bar. Most
programs stop at the floor. Do not.

### There is no triangle budget

Kiln does not have one. Not a soft one, not an advisory, not a number you should feel is generous.
`kiln_validate` will not warn you for density and `validateAsset` will not either -- those advisories
existed and were deliberately deleted, because every number they printed read as a target to stay
under, and the result was assets that stopped at the blockout stage.

Triangles are not a runtime cost driver. Draw calls are, and those track distinct **materials**, not
geometry. So:

- **Detail is free. Spend it.** Ten thousand triangles on a hero prop is normal, not extravagant.
- If a render comes back at a few hundred triangles and nobody asked for low-poly, you built a
  blockout and stopped. Go back.
- The only real limits are the ones you were explicitly given in the request.

Reuse materials where surfaces genuinely match -- that is the number worth economizing. Never trade
away geometry to protect a grade.

### Work in three passes

Most failures are stopping after pass one.

1. **Silhouette.** Primary masses only. Get proportion and orientation right -- detail on a wrong
   shape is wasted work, and this is what the contact sheet judges hardest.
2. **Structure.** Break the masses into the parts the real object actually has: individual planks
   rather than one slab, staves rather than a cylinder, panels, frames, joints, trim, thickness.
   **Count the parts on the real thing and match that count.**
3. **Detail.** Bolts, hinges, brackets, rivets, straps, chamfers, seams, wear, overhangs, sag,
   asymmetry. Small repeated elements are what read as *made* rather than *generated*, and they cost
   nothing you have to save.

### Reach for the tools that make detail cheap

Boxes and cylinders alone produce blockouts. The catalog exists to get past that:

- `roundedBoxGeo` instead of `boxGeo` on anything manufactured -- a chamfer catches light and reads as
  a real object instead of a primitive. This is the single highest-value substitution available.
- `subdivide` for organic or worn forms. Each iteration is roughly 4x the triangles; that is the
  point.
- `boolDiff` / `boolUnion` / `boolIntersect` for openings, sockets, recesses, and cut joinery -- real
  joinery instead of parts parked against each other.
- `revolveProfile` / `extrudeProfile` for anything turned or extruded: posts, rims, mouldings,
  finials. A revolved profile looks crafted in a way a stack of cylinders never does.
- `hull` for organic bulk from a few control points.
- Arrays for repeated structure: staves, planks, rivets, palings, tiles, links.

Run `kiln_list_primitives` filtered to `csg`, `mesh-ops`, `curves`, and `arrays` before concluding a
shape is "as good as primitives allow". It usually is not.

## The critic loop

This is the part that produces quality, and it is the part that gets skipped.

After a render that builds and looks broadly right, **stop being the author and become a hostile art
director reviewing someone else's work.** Not a light polish pass -- an adversarial one. If your
harness can hand the render to a fresh agent or a separate reviewing pass with no memory of writing
the program, do that; a fresh reader is much harder to fool than the author. If it cannot, run the
pass explicitly and in writing anyway.

The critic's job:

1. **Name a real reference.** Say out loud what real object or production asset this is competing
   with. "A weathered oak barrel from a period drama set." Vague targets produce vague assets.
2. **Compare side by side, and be specific.** For each of silhouette, proportion, part count,
   joinery, surface detail, and wear: does the render hold up against that reference, or does it
   read as the cheap version? Name the gap in words. "The staves are too uniform and there are no
   hoops" is actionable; "needs more detail" is not.
3. **Answer one question honestly: if these two were shown blind, which is obviously the generated
   one -- and what gave it away?** The giveaway is your next task.
4. **Be harsh.** "Good enough" from the author is the default state of every asset and it is what
   ceilings quality. If the critic pass produces no findings, the pass was not run properly -- look
   again at the cell you skimmed.

Then go fix the findings and render again. **Loop.** Keep looping until the critic pass genuinely
cannot name a gap that matters, not until you are tired of looping or the program stops erroring.

Two things that end the loop legitimately: the critic has no substantive finding left, or you have
hit a real limit of the primitives and can say concretely what it is. "It builds" is not one of them.

## Rules that save renders

- Build the silhouette first, then add detail. See the three passes above.
- Name parts for what they are. The names survive into the GLB and are how the next agent, and the
  game engine, address them.
- **Proportion errors are more damaging than missing detail.** A roof that does not oversail the
  walls it covers, posts too thin for what they carry, or a part that floats reads as broken no
  matter how much detail sits on it. Check the orthographic cells against how the real object is
  actually built and loaded.
- Reuse materials where surfaces genuinely match. The instanceability grade rewards fewer distinct
  materials, but grade is informational -- a B that looks right beats an A that looks like a toy.
- If two consecutive renders look the same, you are not changing what you think you are changing.
  Re-read the program instead of rendering a third time.

## What the render can and cannot tell you

**Read `viewFidelity` on every render.** It is the render telling you what it is honest about:

- `materialFaithful: true` -- GPU PBR shading. Judge material, texture, roughness, metalness,
  emissive response, normal relief. This is a real picture of the surface.
- `materialFaithful: false` -- flat-shaded CPU raster. Judge silhouette, proportion, orientation,
  contact, and part attachment **only**. Do not comment on colour accuracy, texture, or whether
  something looks metallic. It cannot show you that: a polished steel part and a grey plastic part
  render identically.

When `degraded` is set, `degradeReason` says why the GPU did not draw. A degrade is not a failure --
the geometry findings are still valid -- but it does bound what you are allowed to conclude.

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
