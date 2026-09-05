# Short immutable references

Built-in CLI and MCP workflows now return registered `p_` handles, normally 14 characters instead of the 71-character full reference. The full SHA-256 identity remains the source-storage key and is still accepted as input. Custom stores without `shortRef()` keep their existing canonical output.

Mappings are append-only and persist alongside the sources. They are not mutable aliases or an implicit current program. Prefix collisions extend the new handle by four characters; published handles are never reassigned. Arbitrary abbreviated hashes do not resolve. Reads check the registered mapping and full source hash. Removing the store removes access to its handles.

The tests cover collisions, concurrent registration, legacy stores, corrupt mappings, source integrity, edits, failed drafts, and restarts. The package workflow imports through the CLI, reads and edits through MCP, restarts MCP, and exports the exact revised source through the CLI. Its recorded handles are `p_bd1be775f345` and `p_7fd2baaf40e0`.

## Verification

- Focused store/workflow tests: 20 pass, 144 assertions.
- Full pinned Linux suite: 1,740 pass, 2 skip, 0 fail; 47,260 assertions.
- Coverage: 95.55% functions, 92.53% lines; existing 92%/91% thresholds unchanged.
- Packaged Windows and Linux workflows: 16 checks pass on each platform.
- Tool schemas remain below the existing 24 KiB context budget. Repeated descriptions were shortened rather than raising that limit.
- Core skills, tool documentation, website examples and generated workspace instructions use returned handles exactly.

Final tested archive SHA-256: `19add77366f489f078ca50f58d6d0bcb4c4d3e86a18df4bc8da387285ab90822`.
The final archive includes a subsequent text-only correction to generated workspace instructions; the focused workspace test and both final package checks passed after it. The runtime is the one exercised by the full gate.

[Windows package receipt](short-references-2026-09-05/windows-package.json) · [Linux package receipt](short-references-2026-09-05/linux-package.json) · [Linux full gate](short-references-2026-09-05/linux-fullgate.json) · [Coverage output](short-references-2026-09-05/coverage.log) · [Focused tests](short-references-2026-09-05/focused.log)

Earlier packages and authoring receipts remain historical evidence for their own runtimes. The Opus subscription batch uses this new package; its model results are recorded separately. Publication still awaits owner approval of the redesigned page.
