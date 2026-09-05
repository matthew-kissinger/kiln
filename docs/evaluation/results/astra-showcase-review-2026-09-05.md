# Two independent Astra showcase assets

Both fresh Codex authoring runs completed on the installed `0d457e8f` candidate.
The maintainer opened each exported PNG, regenerated a square GPU poster from
the gallery GLB, and opened both resulting posters before accepting them.

- **Nautilus habitat:** readable shell, structural ribs, two levels and circulation.
  Accepted as an architectural study. Some roof-panel seams remain visible;
  unchecked swept-surface self-intersections are not certified absent.
- **Kestrel rescue craft:** coherent cockpit, wing and nacelle silhouette, attached
  landing gear and authored animation. Accepted as a supporting vehicle example.
  This review does not establish mechanical feasibility or destination-engine fidelity.

Source bytes are unchanged from the model exports. Sidecars record the source,
original export and final poster hashes. Each poster uses `gallery-studio-v1`,
1024-square framing and the shared medium-gray background.

[The transcript audit](astra-showcase-audit-2026-09-05.json) records 12 MCP calls
and 10 image cells for Nautilus, and 16 calls and 19 cells for Kestrel. Neither
sent a full program through MCP: the initial files were imported through the CLI.
All five successful edit calls replay byte-for-byte from the retained input to
output snapshots. Seven exact revisions are now available in the two public
history directories. Kestrel's first second-pass request used strings where
camera coordinates required numbers; schema validation rejected it, and the
corrected request succeeded. Nautilus had no MCP error responses.

The repository's regenerated GLBs are not byte-identical to the installed-package
exports. [The comparison](astra-showcase-export-comparison-2026-09-05.jsonl)
shows identical binary chunks in both assets. JSON differences are the exporter
version (installed 4.5.0 versus repository 4.4.1) and last-bit floating-point
material/rotation values. Exact original and gallery artifact hashes remain
separate; no byte-identical-export claim is made.

After addition, the gallery build produced 55 assets and 828,932 triangles.
The source/GLB/poster verifier passed for all 55 assets, both edit-demo revisions
and the geometry/camera example. The production site build passed.

The wider Gemini/Muse batch, complete transcript audit and final collection
curation remain in progress in the [batch checklist](../../plans/showcase-expansion-2026-09-05.md).
