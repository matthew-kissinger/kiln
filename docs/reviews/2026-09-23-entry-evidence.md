# Per-entry evidence inventory

R05 is implemented in [the generated inventory](2026-09-23-entry-evidence.json).
It covers all 129 current Discovery entries: 103 operations/assemblies and 26
recipes. It separates test references, examples, observed agent use, visual
review associations and destination evidence. This is an evidence map, not a
quality ranking.

The current snapshot covers 32 completed authorings and their 64 edits. Source
hashes agree with the retained stage receipts. Failed or incomplete attempts are
listed separately. Forty-nine helpers have direct calls in delivered source;
43 entries have exact-ID Discovery requests, including 16 recipes. Requests do
not prove successful retrieval or recipe adoption. Source calls do not prove
that every branch ran.

All 26 current recipe examples executed in the completed checkout gate through
the sandbox and GLB exporter without validator errors. Helper test references
are lexical references, which may include comments or strings. They are not
invented per-helper assertions or coverage percentages. Asset-level image reviews
are linked to the observed helper calls without claiming isolated helper quality.
Nineteen entries have associations with the three fresh asset stages covered by
the bounded [Blender import checks](2026-09-23-destination-imports.md). These
associations do not isolate individual helper quality.

Historical example references are copied from the already retained census at
revision `b81cfd4caed64bd90547ff83b4e513e59a1d4913`. No gallery asset was inspected,
repaired, regenerated or promoted for this inventory. Those references describe
prior use, never accepted output quality.

The useful gap is direct evidence: 55 helpers have no observed direct calls in
this bounded campaign. That includes several deformations, roof assemblies,
specialized primitives and animation utilities. It is neither evidence of
nonuse elsewhere nor a reason to retire them. R06 should make adoption decisions
from actual authoring failures, and use these gaps to target remaining checks.

Regenerate from the retained evidence directory after reconciling campaign counts:

```powershell
bun scripts/research-discovery/evidence-ledger.ts C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22
```

The script uses the existing Acorn parser and binding analysis. Locally declared
names and parameters are conservatively excluded, so a model-authored function
called `circleProfile` is not credited to the sandbox helper. Aliased, property
and indirect calls may be missed. A zero is always “not observed by this method.”
The runtime identity is unchanged; this repository-only inventory is not loaded
by the shipped tools. Lint and actual inventory generation pass.
