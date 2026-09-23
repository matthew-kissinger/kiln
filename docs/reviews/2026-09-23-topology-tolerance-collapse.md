# Topology counts at insufficient diagnostic resolution

The previously unretained rotated-cavity concern now has a reproducible class of
fixtures. Thirty loft-derived hollow boxes span five scales, three rotations and
two placements. Twenty-two report false nonmanifold edges with the default
diagnostic tolerance; all thirty have closed, consistently oriented topology at
a tolerance 1,000 times finer. Maximum normalized volume error is about 1.17e-6
against the analytical value 2.88. This does not establish universal solid validity.

The cause is in `geometryDiagnostics`, not a broken Boolean surface. A small
triangle can have two corners merged by the diagnostic grid. Its two remaining
directed edges then increment the same undirected edge twice, inventing excess
incident faces. Area testing does not catch every such case because a thin face
can have nonzero area even though one short edge disappears in the grid.

The diagnostic now reports `collapsedByToleranceTriangles` and excludes those
faces from edge counts. It retains the separate area-based `degenerateTriangles`
count. Nonzero collapsed counts explicitly mean the chosen tolerance has lost
topology detail; use a finer deliberate tolerance before interpreting edge counts.
No source geometry is welded, removed or repaired. Discovery and geometry docs
explain the new field and its limits.

All thirty repeated probes now report the lost resolution without false edge
defects. The focused regression checks the actual rotated Boolean cavity, an
unchanged position buffer and a finer-tolerance result. A positive control with
three real incident faces still reports its nonmanifold edge. Together with the
geometry and sweep cases, **23 focused tests / 6,697 assertions** pass. Actual
compiled CLI and MCP execute three cavity assertions at scales 1, 1e6 and 1e9,
return matching GLB hashes and retain finite exported attributes.

Evidence under `C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/` includes
`cavity-diagnostic-grid.json`, `cavity-diagnostic-after.json`,
`tolerance-collapse-{before,focused,final-gate}.log` and
`tolerance-collapse-transport/receipt.json`. The first exploratory script assumed
indexed geometry and failed in the reviewer code; its log is preserved. The
corrected probe handles both indexed and non-indexed output. It did not require a
product change to Boolean output.

This resolves the recorded cavity diagnostic class and the remaining sweep-scale
defect with bounded evidence. General self-intersection, physical clearance and
arbitrary representation acceptance remain separate QA obligations. Historical
gallery assets were not used or changed.
