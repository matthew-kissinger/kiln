# Current checkout destination qualification

V05 has bounded Blender qualification on runtime
`sha256:7aed68673c0e669819b936ee0ecbc687aedd33e391ac3e0ef0480d83c4409efb`.
Three fresh dogfood sources were saved with the current compiled CLI, then
exported as editable GLB, runtime GLB and editable ZIP. Their canonical GLBs are
byte-identical to the reviewed originals. No authored source was repaired.

Blender **5.2.0 LTS** imported all six GLBs through its actual glTF importer.
The checks compare node names and parents, triangle counts, material bindings,
metallic/roughness factors, untextured base colours, sidedness, UV presence and
packed, connected texture images. Textured base colour is a graph connection,
not the unused default value of the shader input.

| Fresh asset | Nodes / meshes | Material / texture checks | Maximum world-bounds difference |
| --- | --- | --- | --- |
| Curved oak handrail, main33 edit 1 | 40 / 35 | 2 materials, 2 embedded textures | 0.0000000811 m |
| Torn leaf, main32 edit 2 | 8 / 7 | 7 materials, 4 embedded textures | 0 m |
| Articulated robot, main31 edit 2 | 155 / 129 | 6 materials | 0.0000002111 m over 9 animation phases |

Robot playback uses Blender's imported `Walk` action, including fractional frames,
and compares every mesh's world bounds with Three.js GLTFLoader/AnimationMixer
playback of the delivered GLB. Clip name and duration agree. This checks actual
motion, not merely the presence of a clip. It faithfully retains the original
gait's known shortcomings; importing it does not make the gait correct.

Editable and runtime imports produce identical hierarchies, materials, actions
and sampled poses. The robot runtime file is 138,228 bytes versus 151,360 editable
bytes. The two static runtime files grow by 220 and 224 bytes because they have
no duplicate animation data to remove. Runtime export is not a universal size
reduction. All three editable ZIPs decode with source and canonical GLB bytes
matching the current saves.

Evidence directory:
`C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/destination-review/`:

- `preparation.json`: current candidate identity, source/export hashes and CLI saves.
- `blender.json` and `blender-process.log`: actual imports and sampled states.
- `blender-checks.json`: all six imports pass; maximum material-factor error < 3e-8.
- `editable-bundles.json`: editable source/GLB round-trip checks.

This qualifies the default exporter and these rigid/static textured assets in
Blender. It does not qualify final appearance, Unity/player shaders, other
importers, skin/morph deformation, compression, physical correctness or every
helper. The historical Unity qualification remains historical. Refresh affected
checks if the final candidate changes relevant export behavior. Gallery assets
are outside this work.

The prompt-retirement candidate `sha256:a10b30f10bbbf830e10ff6b52fbddec3c66efe25c75a9f7f6de751baa626ca02` was re-exported with the
compiled CLI. All three canonical GLBs are byte-identical. The runtime GLB BIN
chunks and JSON are identical except `/asset/extras/kilnProvenanceV1/metadata/sha256`,
which changes with save provenance. The initial strict whole-file hash assertion
and the bounded equivalence check are both retained in `candidate-recheck/`.
`blender-qualified-candidate.json` links the original actual import receipt;
Blender was not rerun and no new visual qualification is claimed.

The subsequent loft/sweep tolerance candidate `sha256:19e0d2494b12046d9bd0c37c5e490780a59b008624a5075c8a1e6e6b59244a55` also passes that
exact canonical / provenance-only runtime comparison in `sweep-scale-recheck/`.
The three reviewed source revisions remain unchanged.

The diagnostic-only candidate `sha256:41212c7f1f8331430ac0b11b187866c753e225dc4bdc647e5d2b8948bd02290a` repeats that comparison successfully
in `diagnostic-recheck/`; both delivery profiles retain the same imported geometry
and material data. No Blender rerun is claimed.

September 23 material-diagnostic follow-up: runtime `sha256:d445c52e47090466d6330fba6d7bfd85b62ff15a60772c19b3c6e09ca9a68379`
re-exports all six qualified fixture GLBs with the same canonical bytes and runtime
geometry/material bytes. Only the runtime provenance metadata digest differs.
`destination-review/material-diagnostics-recheck/blender-qualified-candidate.json`
links the new outputs to the original actual imports; Blender was not rerun.
