# Example credits and build records

The gallery is a collection of saved work. Its examples use different models,
briefs and review processes. It is not a model benchmark.

Each asset detail shows the credited model and harness, the basis of that credit,
and the authoring context we can establish from the saved source. Missing context
is marked **Not recorded**. A source comment declaring a clean directory is a
declaration, not an independently verified isolation boundary.

Open **Brief & revisions** on the four recent examples to read a brief summary and
download the retained source versions. The displayed version is marked **Shown
here**. Each snapshot keeps its exact source hash; the site build rejects a history
that no longer matches its example. Older examples say when this record is missing.

Older programs without an `Authored by` header retain the collection's historical
attribution. Do not promote that fallback to a verified model ID or a clean-room
result. Reviewer feedback, supplied examples, inherited conversations and direct
source edits must be disclosed when known.

The site asset build writes the exact program beside its GLB and records both
SHA-256 hashes. It also records the engine source and dependency-lock hashes and
the runtime used for the build. These records identify the generated files;
they do not establish how the original model authored the program. All 54 public
gallery posters have now been rendered from their downloadable GLBs with one
square studio recipe. Each retains exact source, artifact and image hashes, camera
settings and renderer identity. Older evaluation images remain historical evidence
and do not inherit these new capture records.

The workbench before/after demonstration is a separate maintainer-agent teaching
example. Its build script calls `kiln_render`, reads the returned revision with
`kiln_source`, then passes that reference to `kiln_edit`. Both images use the same
explicit camera. The downloadable record contains the actual edit, references,
diff and view-fidelity receipts. It is not an independent model evaluation.

Recorded runs can keep their exported source byte-for-byte. Add a sibling
`examples/<name>.provenance.json` with `sourceHash`, `model`, `harness`,
`authoredDate` and the `provenance` fields; the site build rejects a stale source
hash. Use public descriptions in that file, without local evidence paths or
credentials. Distinguish original authoring from any supplied-source refinement.
A new poster should be generated from the downloadable GLB and retain its camera,
renderer and source/artifact/image hashes. Older evaluation images do not inherit
that guarantee when a runtime rebuild changes the GLB.

The equation-canopy teaching example demonstrates a parametric surface and a camera
positioned relative to a named attachment. Its source, GLB, PNG and capture receipt
are verified alongside the workbench pair. It is maintainer-authored teaching
material, not a model-authorship example.

## Adding an example

1. Keep the final `.kiln.js` program and its exact model ID and harness. Record
   the brief, date, source access, starting examples, inherited context and human
   intervention. Preserve unsuccessful attempts in the evaluation notes.
2. Separate geometry-only authoring feedback from material-faithful review. Keep
   the renderer and capture settings with new images so they can be reproduced.
3. Review the asset at useful scale. A successful build and attractive thumbnail
   do not establish working joints, a correct back side or useful materials.
4. Rebuild site assets from a stable engine tree, verify the source/GLB hashes,
   then review the production page at desktop and mobile widths. Check the
   source and GLB downloads as well as the picture.

To add retained revisions, place exact source snapshots and a `history.json` in
`site/examples/history/<name>/`. The record contains `version: 1`,
`currentSourceHash`, a `brief` with `kind` (`summary` or `recorded`) and `text`, and
ordered `revisions` with `title`, `description`, `file` and `sourceHash`. Use a
simple `.kiln.js` filename for each snapshot, and include the displayed revision
exactly once. Summaries must be labeled; a later evaluation revision must not be
presented as the current gallery source.

See [the evaluation notes](dogfooding.md) for completed authoring runs and their
limits, and [clean-room setup](clean-room.md) for how to create a separate project.

The public gallery excludes the tidal observatory after visual review. Its source
and historical evaluation records remain in the repository archive; archive
presence does not imply gallery selection. The current public collection contains
54 examples. New gallery thumbnails are framed as whole assets, without cropping.
