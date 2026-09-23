# Separate Boolean shading from surface defects

F244: Main38 noticed a scalloped bright band at its hull rim, then changed cap
placement, station density and cutter shape without testing its normal policy.
The final scored asset retains that band. This was a diagnosis gap, not evidence
that another Boolean implementation or hull primitive was needed.

A separate maintainer replay compared the unchanged baseline with only
`hull.geometry = creaseNormals(hull.geometry, { angle: 60 })` or angle 30 added.
All three ran through the frozen compiled CLI and required GPU rendering. Their
5,544 hull triangles have identical expanded position hashes; corner normals
differ. Direct image review shows the rim lighting band removed at both angles.
Some bottom shading remains. This does not certify topology or visual quality.

The shared geometry reference and geometry docs now explain that `smooth: true`
averages sharp boundaries too, and give the existing helper as a diagnostic before
changing geometry. They distinguish shading from real silhouette/gap defects and
leave angle selection to the author. No default, tool contract, geometry kernel
or category policy changed. Skill validation and runtime build pass; runtime
identity remains `sha256:e9d437939cb47ed4c5dad8e1283edd060d9cae03614966583c21149b56104b28`,
whose engine code passed the 2,622-test gate. No extra full suite was needed for
this reference-only edit. Fresh model uptake is unproved.

Evidence: `C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/main38-normal-review/receipt.json`,
the three source/GLB/GPU PNG pairs beside it, and `review-main38-normals.mjs`.
The scored workspace was not edited. Main39 receives the shared clarification
before its first call; Main38 keeps its original guidance throughout.
