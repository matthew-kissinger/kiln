# Assembly interoperability: C04/C05/C06

Wheel and roof results retain their specialized fields. Their existing roots are
the common adapter: `describeAssembly(result.root)` and `replicateAssembly(view,...)`.
No redundant wrapper or snapshot field is introduced. Existing tests cover scoped
frames, material bindings, hierarchy preservation and declared external references.
Independent wheel/roof replication must explicitly preserve or resolve references
to the surrounding chassis or walls; they are not silently redirected.

C04 testing exposed F166: the primitives-only roof wrapper moved slopes by half
the thickness but kept old face frames, producing a measured 0.05 offset at 0.1
thickness. Its Euler patch also disagreed with semantic local frames. Both patches
and the duplicate options/return definition are removed. One architecture constructor
serves all imports. Outer-eave versus wall-bearing datums remain useful distinct
constructors, explicitly documented. Both ridge axes now match face and common
ridge frames. Mesh names/offsets change; migration guidance is explicit.

C05 adds a root to ladders while retaining rail/rung result fields. Root placement
is the bottom endpoint; endpoints and width hints are supplied in parent coordinates.
A width-axis hint projects perpendicular to the endpoint line, using the least-aligned
canonical basis when nearly parallel. Explicit widthDirection rejects a zero/parallel
projection. There is no assembly-mode fallback. This changes parent-child layout;
old direct-child callers need the documented migration. Endpoint frames/sockets and
rail/rung roles survive replication and GLB reload. Invalid frames attach nothing.

C06 reports custom wheel position-buffer dimensions without mutating shared geometry
or trusting cached bounds. Checks are advisory: radius from the +Z axle, Z width,
AABB center, relative tolerance 1e-5. No circularity, suspension or physics claim.
Each supplied component is limited to 2,000,000 samples. Empty/nonfinite inputs fail.
No silent scaling or metadata correction occurs. A red regression also exposed F167:
unconditionally generating a default torus rejected valid wide custom rollers and
allocated unused default geometry. Defaults are now constructed only when needed;
the torus diameter constraint applies to the default tire profile only.

Focused tests passed after observed failures. Whole-suite, example output, visual
review and OpenCode qualification remain separate acceptance steps.

## V01 cross-helper conformance, current checkout

V01 is now satisfied by tests implemented during the shared fixes. This closes an
outdated pending status; it is not a new feature or another test framework.

| Invariant | Executable evidence |
| --- | --- |
| Reflection and parent frames | `geometry-composition-regression.test.ts`: all three reflection axes under rotated, nonuniformly scaled parents; preserved radial scale/orientation; world coordinates and outward winding through GLB. `assembly-transform.test.ts`: affine roundoff accepted, actual shear/projective/singular transforms rejected. |
| Ownership and source preservation | `assembly.test.ts`: explicit sharing/copying, one copy per shared resource, shared textures, source unchanged and atomic rejection. `deformation-seams.test.ts`: identity deformation owns buffers while preserving authored attributes. |
| Seams across scale and operations | `geometry-scale-contract.test.ts`: periodic boundaries, UV wraps and matching unit normals from tiny to large scales, with invalid-gap controls. `deformation-seams.test.ts`: smooth seams remain smooth, cap creases stay separate and both exporters preserve attributes. |
| Attribute/material preservation | `uv-projection.test.ts` and `csg-attribute-contract.test.ts`: transformed UV frames, seam splitting, corner attributes, material-face coverage and explicit unsupported inputs through both exporters. |
| Assembly replacement and playback | `assembly-replacement.test.ts`: wheel, roof, bay and branched-chain alternatives under a reflected/scaled parent, through both exporters. Neighbors remain equal, replacement placement is retained, references remap and sampled animation moves the replacement without moving retained meshes. |

All listed files passed in `part-listing-final-gate-complete.log` (2642 pass,
4 skip, zero failures). No additional test run was needed for this reconciliation.
The log and current runtime identity are recorded in the checkpoint. These are
bounded invariants, not proof of every helper combination, physical attachment,
general self-intersection freedom, visual quality or destination compatibility.
Fresh authoring, E05 diagnostics and destination checks retain their own tasks.
