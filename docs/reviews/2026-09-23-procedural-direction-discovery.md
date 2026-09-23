# Procedural texture direction in Discovery

Native10 repeatedly requested the procedural texture contract and searched for
stripe angle semantics. The contract listed `angleDeg` without specifying whether
it turned the bands or their direction of variation. The directional-sweep recipe
had one correct example, but the operation contract did not independently answer
the question. Retrieval succeeded; this is a missing explanation, not proof of a
transport fault or that the ranking failed to find the operation.

Discovery now specifies that 0 degrees varies color across U and makes stripe
bands run along V; 90 degrees swaps these roles. `count` counts alternating bands,
not pairs. Gradient follows the same projected coordinate with clamping. These
facts belong in the shared operation contract, available equally to CLI, MCP and
native tools. No Strands workflow instruction was added to shared skills.

The description also distinguishes repeat wrapping from matching repeat edges.
Seeded noise is tileable; arbitrary angled/odd-count stripes and nonconstant
gradients need boundary review. No texture algorithm, schema, wrapping mode,
recipe default or generated geometry changed.

Four independent pixel cases cover stripes and gradients at 0/90 degrees. They
confirm the stated axes, four alternating bands for count=4, and byte-identical
pixels against Native10's frozen preceding runtime. Actual compiled Node CLI,
stdio MCP and the real native tool adapter all return the same direction and
seam-limit guidance. The existing procedural/discovery suite passes 99 tests with
3,460 assertions. Full gate status belongs in the current checkpoint.

Evidence: external `procedural-direction-review/receipt.json`,
`review-procedural-direction.ts`, `procedural-direction-focused.log` and the
unchanged Native10 trace. Native10 continues on its frozen earlier contract;
no fresh-model benefit is claimed from this maintainer verification.
