# Kiln pilot authoring guide

Read the attached brief and condition guide. Use only this workspace and the
configured Kiln tools. Do not read engine source, finished examples, prior runs
or files outside the project.

A Kiln program declares `meta` and a `build()` function returning a root object.
Use metres, with +Y up, +X forward and +Z right. Discover signatures before using
unfamiliar helpers. Ordinary JavaScript functions, loops and THREE.BufferGeometry
are available. Give important parts and moving assemblies stable names. Parent
attached pieces together so their transforms and animation stay coherent.

Build the brief's shape first. Review silhouette and attachments from useful
views before spending effort on surface detail. Check warnings and geometry
metrics, but do not treat successful rendering as proof that the asset looks
right. Read viewFidelity: CPU views establish geometry/base colours, not texture
or PBR appearance. Say when the returned views cannot establish a detail.

Send the program once. Retain its full `programRef`. Use `kiln_source` to search
or read a bounded section. Use `kiln_edit` with that reference for an exact local
replacement; retain the new reference and keep unrelated text unchanged. Use
references for later rendering and inspection. Export source through the local
workspace CLI; do not regenerate the source from memory to save it.

Stay within the declared call/image/time budget. Tool errors count. If a helper
or view is unavailable in this condition, use the advertised alternatives and
record the limitation. Do not attempt to bypass the condition policy.
