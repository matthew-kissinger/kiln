---
name: kiln-refine-asset
description: Change an existing Kiln asset by patching its program in place rather than rewriting it, then look at the render to confirm the change did what you meant. Use when an asset already exists and needs a fix, a tweak, a variant, or a quality pass.
license: MIT
---

# Refine an existing asset

Authoring and refining are different jobs. Authoring starts from nothing and the risk is stopping
too early. Refining starts from something that already works, and the risk is the opposite: a
rewrite that fixes the one thing you were asked about and silently moves four things you were not.

This skill is the second job. The program on disk is the asset — the GLB is a build output — so
refining means patching that program with the smallest edit that does the work, and then looking at
the picture to confirm it did.

## The loop

1. **Read the program.** Open the `.kiln.js` file. Read it all, not the region you think you need.
   The part you are about to change usually depends on a constant or a helper defined elsewhere in
   the file.
2. **Render it as it stands.** `kiln_render` on the current source. This is the before picture, and
   without it you have nothing to compare against and no way to tell your edit apart from a
   coincidence. Skipping this step is how a refine pass ends with "I think that is better".
3. **Name the defect in words, from the picture.** Not from the request, and not from the code.
   "The roof cone sits below the tank rim, so the top view shows a ring open to the sky" is a defect
   you can fix. "Roof needs work" is not.
4. **Locate it in the source.** Which named part, which line, which number. The part names in the
   render match `createPart` names in the program; that is what they are for.
5. **`kiln_edit`.** Pass the full current source as `code` and one or more exact-string edits. It
   patches, renders, and returns the patched `code`, a unified `diff`, and the new contact sheet in
   one call.
6. **Look at the new sheet, and read the diff.** The diff is there so you can confirm that what
   changed is what you intended to change, before you judge the picture.
7. **Write `code` back to the file** once the change is right. `kiln_edit` writes nothing — the
   patched program only exists in the reply until you save it.
8. Not right yet? Go back to 3 with the returned `code` as the new current source.

## How `kiln_edit` behaves, and why

**Exact strings, copied verbatim.** `oldString` must appear in the source character for character,
including indentation. No line-number prefixes, no reflowing, no "close enough".

**Unique, or `replaceAll`.** An `oldString` that matches twice is refused rather than guessed at.
Either extend the string with surrounding context until it is unique, or say `replaceAll: true` and
mean it.

**All-or-nothing.** Edits apply in order against one buffer. If any of them fails to match, none of
them are applied and the reply names the one that failed. You are never handed a half-patched
program you then have to diff against your own intent. Fix the failed edit and call again.

**Byte-stable.** Every line you did not touch comes back identical. This is the whole point. A
rewrite through `kiln_render` cannot promise that, and the drift it introduces is invisible in the
contact sheet — a material constant that shifted, a part that lost its name, a comment that carried
the reason for a magic number.

**It renders by default.** The loop is edit-then-look, so the render is folded in. Pass
`render: false` for a pure text change you do not need to see — renaming a part, fixing a comment,
a rename you are about to follow with a real edit.

**It is stateless.** You hold the program; the tool holds nothing between calls. So each call sends
the current source, and the `code` in the reply is the only copy that reflects the edit.

## Batch related edits into one call

Six edits in one call is one render and one picture of the combined result. Six calls is six
renders, and if the sixth one makes things worse you cannot tell which of the six did it.

The useful grouping is **one intent per call**. "Thicken the legs" is one intent even when it takes
four edits across four parts. "Thicken the legs and re-colour the top" is two, and they should be
two calls, because the picture from the first is what tells you whether the second is still a good
idea.

## Reading a refine render

Everything in the author skill's contact-sheet section still applies — orientation, grounding,
attachment, silhouette, symmetry, and `viewFidelity` bounding what you are allowed to conclude about
material. Two things are specific to refining:

- **Compare against the before picture, not against your memory of it.** Two renders that look the
  same mean the edit did not do what you thought, and the fix for that is re-reading the program,
  not rendering a third time.
- **Check what you did not touch.** A change to a shared constant, a material, or a parent transform
  propagates to every part downstream of it. The diff tells you what lines moved; the render tells
  you what that meant. Read both.

## What tends to actually need fixing

| What the sheet shows | Where it lives in the program |
|---|---|
| Part hangs below Y=0, or floats | the `position` on that `createPart`, or its parent's transform |
| Asset faces the wrong way | rotations at the root, not per-part patches — Kiln is +X forward |
| A gap where two parts should join | overlap the parts, or cut real joinery with `boolDiff` / `boolUnion` |
| Reads as a blockout at thumbnail size | not an edit — go back to the author skill's pass 2 and 3 |
| Everything looks like grey plastic | `viewFidelity.materialFaithful` is false; you are on the CPU raster and cannot judge material at all |
| Mirrored parts are not mirrored | the sign on one axis in the Top cell's offending part |
| Draw calls high, triangles fine | distinct materials, not geometry — reuse a material where surfaces genuinely match |

Detail is still free. If the refine finding is "there is not enough of it", the fix is to author
more parts, not to rebalance what is there.

## Boundaries

- **A GLB alone cannot be refined.** Kiln refines programs. If the source `.kiln.js` is gone, say so
  and author a replacement rather than pretending a mesh can be patched.
- **Do not rewrite when you can patch.** If you find yourself re-emitting most of the file, stop and
  ask whether this is really a refine or an author task, and say which.
- **Do not overwrite the user's file without consent**, and keep the before source until the after
  render is confirmed good.
- **Report the diff, not just the verdict.** "Raised the roof cone 0.4m and widened its base past the
  tank rim" is a reviewable claim. "Fixed the roof" is not.
