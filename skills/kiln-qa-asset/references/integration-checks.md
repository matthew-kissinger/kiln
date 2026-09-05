# Integration checks

These library APIs run in the destination project's TypeScript toolchain, not inside generated `.kiln.js` source. Use the project's installed Kiln package; do not copy engine implementation into the asset workspace.

`inspectGlbIntegration(bytes)` from `@kiln/engine/render` reads the actual GLB and returns an integration manifest or `undefined` when no usable scene bounds exist. Check that result before using bounds, axes, ground correction, structural findings, or artifact hash.

Kiln authors metres, +X forward, +Y up, +Z right. Confirm importer conversion in the destination. Ground correction must be applied in the frame it describes, especially under rotated/scaled parents. Bounds alone cannot prove that feet, wheels, or collision geometry make the intended contact.

## What to measure

| Question | Evidence |
|---|---|
| Did the intended file load? | Resolved asset path, parsed GLB, content hash/manifest |
| Does its size and orientation fit? | Scene comparison, importer transform, world-space bounds |
| Are materials correct? | Destination lighting and texture review; material-faithful Kiln view where available |
| Does it move correctly? | Named clip, intermediate poses, transitions, attachments and relevant controls |
| Can it be used in the scene? | Collision, reachability, interactions and contact under real placement |
| What does it cost? | Loading, geometry, draw calls, textures and representative-device measurements |

Source refs name source revisions. They do not identify arbitrary externally modified GLB bytes. Track the exact exported file used for integration.

`composeSceneGLB` defaults to static composition (`keepAnimations: false`). Explicitly keep animations when required. Its material optimization policy can change scene material organization; choose it deliberately, then inspect the result. Warnings can report skipped inputs, so successful export alone does not prove every required asset was included.

Do not invent a universal performance cap. State the destination, tested conditions, and material limits of the evidence.
