---
name: kiln-qa-asset
description: Wire a finished GLB into the user's actual project and prove it works by looking at it running, then repair what fails. Use after generating or receiving a 3D asset, when integrating a model into a game or web app, or when asked whether an asset is actually usable.
license: MIT
---

# QA an asset in the real project

A structurally valid GLB is not a usable asset. This skill is the step between "it built" and "it
works in the thing you are shipping". It is renderer, framework, and art-style agnostic.

## Workflow

1. **Verify the file.** Check GLB magic (`glTF`), that the JSON chunk parses, and the byte length.
   Distinguish a missing optional file from a corrupt required one -- they have different fixes.
2. **Derive the integration manifest.** `inspectGlbIntegration(bytes)` from `kiln/render` returns a
   `kiln.integration-manifest.v1` from the artifact alone. Read it *before* writing any transform.
   Never synthesize the fields by eyeballing the model.
3. **Wire it into the project's own stack.** Their loader, their scene graph, their build. Do not
   introduce a new renderer or framework to make the asset easier to test.
4. **Run the real project in a browser and look at it.** Load, controls, camera, traversal, layout,
   responsive behavior, console and page errors. Screenshot and *inspect the screenshot*. DOM
   assertions do not prove that a scene looks right.
5. **Repair, then re-run.** Fix application code, camera, lighting, or placement first -- most
   "asset problems" are integration problems. Regenerate the asset only for an actual asset defect.
   Re-run the failed journey plus the regressions it could touch.
6. **Report candidly.** What worked, what failed, what was confusing, what you repaired, what risk
   remains. Link every claim to the evidence that supports it.

## What the manifest tells you

| Field | Use it for |
|---|---|
| `units` / `axes` | always metres, +X forward / +Y up / +Z right -- mismatched imports show here |
| `bounds` | scale relative to the project's own objects; never guess scale from category |
| `ground.offsetToGround`, `ground.grounded` | the exact Y correction to sit the asset on the floor |
| `defaultScene` | which scene to instantiate; a missing default breaks many loaders |
| `renderMetrics.drawCalls`, `uniqueMaterials` | runtime cost, which is draw calls, not triangles |
| `structuralQa` | validator errors/warnings that survived generation |
| `artifactSha256` | that the file you are wiring is the file you were given |

**`visualQa` is always `not_assessed`.** That is literal, and it is the reason this skill exists.
Nothing upstream has looked at the asset in its real scene. You are the first thing that does.

## Failures worth checking for specifically

- **Scale.** Correct-looking in isolation, wrong next to a character controller.
- **Ground contact.** `offsetToGround` applied in the wrong direction sinks or floats the asset.
- **Orientation.** An asset authored to the contract still lands sideways if the project's forward
  axis differs. Fix it in the project's import transform, not by re-authoring the asset.
- **Material read.** If the asset was authored against the flat-shaded CPU rasterizer, this is the
  first time real lighting touches it. Metal and texture problems appear here or nowhere.
- **Occlusion and collision.** Geometry that blocks the camera or traps the player.
- **Draw calls.** A visually fine asset that costs 400 draws is a performance bug, not a win.

## The visual bar

`visualQa: not_assessed` means you own the aesthetic verdict, and a functional pass is not one.
Once the asset loads correctly in the real scene, judge it the way an art director would:

- **Name what it is competing with.** The real object, or a production asset from a comparable
  title. Write it down.
- **Ask which one is obviously the generated one, and what gives it away.** Uniformity, missing
  secondary structure, absent wear, parts parked against each other instead of joined, edges with no
  chamfer catching no light. Name the specific giveaway.
- **Report it as a finding, not a footnote.** "Loads correctly; reads as a blockout next to the
  surrounding set dressing" is the useful sentence. An asset that works and looks cheap is a real
  defect, and it is the one nothing upstream can catch.

Detail is not a cost here -- Kiln has no triangle budget and draw calls track materials, not
geometry. If the fix is "author more of it", that fix is available.

## Boundaries

- A successful load is not a QA result. Neither is a passing type check.
- Never overwrite the user's files without consent, and never let a downloaded filename escape the
  project root.
- Stop after bounded repair attempts with a reproducible case and a precise next action, rather than
  looping.
- Do not soften the report to make it look complete. A named unresolved problem is more useful than
  a clean summary that is wrong.
