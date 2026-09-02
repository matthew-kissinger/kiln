---
name: kiln-compose-scene
description: Lay out several finished GLBs into one scene — resolve placements from each asset's integration manifest, prove the layout is overlap-free, and export a single composed GLB. Use for multi-asset layouts, levels, worlds, dioramas, kits, or scene refinement.
license: MIT
---

# Compose a scene from finished assets

Composition is a separate problem from authoring. Each asset already knows its own units, bounds,
and ground offset; your job is to place them relative to each other and prove the result holds
together before exporting.

## Workflow

1. **Collect the parts.** Every input is a finished GLB on disk. Name each one — the name survives
   into the composed scene and is how anything downstream addresses it.
2. **Read each manifest.** `inspectGlbIntegration(bytes)` from `kiln/render` gives you
   `bounds`, `ground.offsetToGround`, `defaultScene`, and `assessedRole` per asset. Placement
   derived from anything else is a guess.
3. **Place by role, not by category.** See the table below.
4. **Prove it.** `findOverlaps` / `isOverlapFree` from `kiln/composer` take world-space AABBs and
   return violations; `summarizeOverlaps` makes them readable. Zero overlaps is a floor, not a pass.
5. **Export.** `composeSceneGLB(parts, opts)` from `kiln/render` merges the placed GLBs into one
   document — textures copied losslessly, `dedup()` collapsing repeated blueprints so thirty
   identical fence posts cost one geometry, and materials consolidated to a few draws. A corrupt
   part becomes a warning and is skipped rather than failing the whole export.
6. **Hand off to QA.** Apply `kiln-qa-asset` to the composed scene inside the real project. A layout
   that validates can still be unplayable.

## Placement by role

| Role | Placement intent |
|---|---|
| `ground` | the base plane everything else sits on; place first |
| `building` | structural edges and enclosure; defines where the player cannot go |
| `wonder` | the readable anchor — the thing visible from anywhere, placed for sightlines |
| `poi` | landmarks that orient the player at mid-range |
| `vehicle` | along traversal paths, aligned to the direction of travel |
| `prop` | dressing, placed without blocking movement or camera |
| `fill` | density; the first thing to cut when the scene gets busy |

## Rules

- **Derive scale and ground contact from `bounds` and `offsetToGround`.** Do not infer scale from
  what the asset is supposed to be — a "crate" can be authored at any size, and the manifest is the
  only thing that knows which.
- **Respect the shared frame.** Every asset is +X forward, +Y up, +Z right, sitting on Y=0. Rotate
  at placement time; never re-author an asset to fix a scene-level orientation choice.
- **Check the things a bounding box cannot see:** camera spawn position, traversal routes,
  occlusion, collision, clipping, and dead empty space. `kiln/composer` also exposes reachability
  and ground-sampling helpers for exactly this.
- **A plausible manifest is not a QA result.** Overlap-free, grounded, and correctly scaled is the
  precondition for looking at the scene, not a substitute for it.

## Reporting

Name the assets placed, the transforms applied, any parts skipped by the exporter, the overlap
result, and what has *not* been verified — which is everything about how the scene feels until
something has run it and looked.
