# Antigravity project routing check — 2026-09-05

The project MCP configuration works. A failed asset pilot selected a globally
installed Kiln skill and server; absence of observer traffic did not establish that
Antigravity ignored the project configuration.

Two fresh, bounded discovery checks used Gemini 3.8 Flash High, an absolute project
directory, a new conversation, and `--disable-slash-commands` in print mode:

1. A minimal project MCP server and a project plugin MCP server both started. The
   model called the requested project server and returned its marker.
2. The actual candidate Kiln configuration started its observer. The model read the
   requested local AGENTS.md and author skill, then called
   `kiln_workspace/kiln_list_primitives` with `capabilities: true`. The observer
   recorded one tool call, no image requests, and source storage at zero entries and
   zero bytes. Execution mode was subprocess. No asset was authored in this check.

The runtime identity in the second receipt was
`sha256:14d3933c67e8ac05376d750f30bd6bfb86ae1e541ce19e62f2deda96e1a93460`.
This is a routing proof for the tested candidate, not a final asset quality or
operating-system isolation result.

The generated `agy.mjs` launcher now supplies the absolute project directory and
adds the print-mode flag. Project instructions explicitly select `kiln_workspace`
and local skill copies. Existing global settings and authentication are unchanged.
A trace must still verify the selected server and files: global plugins may remain
available. The standalone `agy mcp list` output is not a conversation trace.

Offline regressions check launcher arguments, preservation of explicit conversation
selection, and repair migration: a missing newly managed launcher is created, while
an existing user launcher is refused. These tests do not invoke a model.

Primary documentation: [project MCP configuration](https://antigravity.google/docs/cli/mcp/)
and [project identity](https://antigravity.google/docs/cli/projects/). The installed
CLI help documents `--disable-slash-commands` as disabling slash-command and skill
expansion in print mode.

Local raw evidence is retained outside the package under
`kiln-cleanrooms/agy-scope-probe-20260905/evidence/` and
`kiln-cleanrooms/agy-kiln-discovery-20260905/evidence/`. The latter contains
`events.jsonl` and `mcp/transcript.jsonl`. These machine-local paths are provenance
notes, not files required to use the package.
