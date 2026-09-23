# Semantic joints and resource metrics

G17/G18 implementation evidence. Full candidate dogfooding remains open.

`describeAssembly` now exposes `joints` alongside its existing roles, frames, sockets,
materials and bounds. Validated articulated descriptors and exact wheel/steering role
families select nodes independently of their names. Snapshot node IDs distinguish
duplicate names; descriptor data is detached from the source. There is no new helper
to learn, and the legacy `getJointNames` prefix lookup is unchanged. Discovery explains
the distinction. Arbitrary custom roles are not inferred to be joints; unsupported
assembly node classes still fail explicitly.

Resource reporting now distinguishes final GLB mesh nodes, placed mesh copies,
material identities, triangles and estimated primitive draws. Source `countTriangles`
previously counted one geometry per InstancedMesh, regardless of its active count.
It now includes active copies, including zero. The GLB counter previously interpreted
point/line primitives as triangle lists; it now honors primitive mode and handles
triangle strips/fans separately. No new category or performance acceptance threshold
was introduced. Counts are static all-scene estimates, not GPU timing, live draw calls,
memory usage or evidence that an asset meets its destination performance budget.

Red regressions demonstrated absent semantic lookup, missing mesh/copy distinctions,
point data counted as triangles and instanced source undercounting. Focused tests cover
renamed wheel/steering nodes, duplicate joint-chain names, role-prefix near misses,
unchanged named lookup, detached descriptors, authored sandbox usage and GLB reload.
Metrics fixtures cover shared materials/geometry with ordinary and GPU-instanced nodes.
Existing replication, instancing and Discovery tests pass after implementation.

These are common capabilities for any asset. A wheel mechanism on a creature, a
jointed architectural component or a foliage assembly does not need a category to
use them. Final consumer and model-generated diversity checks remain in V01/V03/V10.
