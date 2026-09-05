# Muse final-package refinement check

On September 5, 2026, OpenCode 1.18.27 ran `opencode/muse-spark-1.3-contributor-free` against a fresh, Node-only installation of package SHA256 `833b9bf14468798640447d2ba98d16d1bcedaaff8ac8752d266881e29aaabb97`. This was a supplied-source refinement of the earlier Muse bench refractor, not another independent authoring run. Project-local skills, the shipping MCP server, and required local GPU rendering were used; no fallback model was dispatched.

The run completed in 195.854 seconds, from 19:14:14 to 19:17:30 UTC. The observer recorded 13 MCP calls and 10 rendered cells. Successful CLI exports added eight cells, for 18 total, within the 24-call/32-cell/eight-minute limits. The harness exited zero without timeout.

Muse imported the supplied source once, used grouped discovery and bounded source reads, then made one reference-based edit with two literal replacements. It replaced the elevation wheel's cylinder and separate decorative teeth with a 28-tooth `gearGeo`, explicitly setting root radius 0.063, tip radius 0.075, bore radius 0.012 and height 0.024. A 90-degree X rotation preserved the wheel's Z axis. Independent replay of the recorded replacements exactly reproduces the exported source: all unrelated bytes remain unchanged.

- Original source: `sha256:32223e1d94c3034d14f5d3f401fd7fbb5da3e471ddf92c3acdc319a85a03106d`.
- Final source: `sha256:93fbc95991a140c3ff51d34411c5540dac8a962645c8defc0d686f6994bf0e22` (11,461 bytes).
- Final GLB: SHA256 `9d87f5d0123eb8a7fea6e6a081006390a1d616f1becd7f4e14fa3f80b83be665` (224,288 bytes; 7,780 triangles). This matches the edit render's input GLB hash.

The actual whole-asset contact sheet, gear close-up, and exported chosen-camera PNG were visually reviewed. The gear is attached at the preserved hub, with visible teeth and brass shading; the instrument's existing silhouette and supporting parts remain intact. The GLB retains `FocusTravel`, and the model reviewed beginning, middle and end frames. The preserved hub hides the bore, so the image does not prove its diameter. This is not a mechanical gear-meshing or clearance validation.

All three MCP render operations delivered non-degraded full-material GPU receipts from the corrected RTX 3070 renderer. Derivative camera receipts were echo-validated; their `exactArtifact:false` flags remain significant. Source and GLB were separately exported by reference, and the final CLI `--capture` image uses the exported source revision.

Two frictions remain in the record. Discovery omitted the gear's axis, causing several redundant lookups before Muse inferred the correct orientation. The first CLI recipe used `subject.name:"ElevWheel"`, whereas the actual node is `Mesh_ElevWheel`, and returned `kiln_render returned no image`. Muse replaced the name with the exact returned path; that part-relative export succeeded. It then removed `relativeTo` to choose a world-relative view, which also succeeded. This is a subject-selection and error-message friction, not a part-relative camera failure. Its own review discloses the failure but slightly overcounts MCP image cells; the observer and harness transcript are authoritative.

Full evidence is retained at `C:/Users/Mattm/X/kiln-cleanrooms/q1-muse-recert-833b9bf1`: setup and input hashes, `harness.jsonl`, `trace/transcript.jsonl`, actual PNGs, `source.diff`, independent verification, and final assets. The compact [machine-readable receipt](q1-muse-recert-833b9bf1.json) records hashes and exact replacements. Original supplied-source authorship credit remains unchanged.
