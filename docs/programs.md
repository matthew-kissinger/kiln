# Source revisions

Kiln stores the program so the model does not have to repeat it in every tool call.
This is independent of the conversation or MCP connection.

Pass `code` once to `kiln_validate` or `kiln_render`. Both return a `programRef`, even
when the draft fails. Use it for later rendering, validation, inspection, animation
and interior views. `kiln_source` reads the source; `kiln_edit` changes it.

```js
kiln_source({ programRef, query: 'shelfHeight', limit: 1200 })
kiln_edit({ programRef, edits: [
  { oldString: 'shelfHeight = 0.2', newString: 'shelfHeight = 0.35' }
] })
```

An edit returns a new `programRef`, `parentRef`, a diff and rendered views. Use the
new reference for the next call. The original remains unchanged. Two edits can branch
from the same base without overwriting each other. Mutable aliases are not implemented.

Reference-based edit replies omit source by default; `includeCode: true` requests it.
Legacy callers may pass `code` and receive full updated source by default. Supply
exactly one of `code` or `programRef`.

## Source reads

`kiln_source` is read-only and returns exact text without line-number prefixes.

| Field | Meaning |
| --- | --- |
| `offset` | Starting UTF-16 character offset; default 0. |
| `limit` | Maximum characters returned; default 8,000, maximum 16,000. |
| `query` | Optional literal search at or after `offset`. |
| `nextOffset` | Start of the next page, or null at the end. |
| `matchOffset` | Query location; add one to find a later occurrence. |

Search returns surrounding source. A missing match returns `found: false` and empty
code. Read enough context to understand dependencies before editing.

## Files and persistence

From a generated workspace, import and export without model transcription:

```sh
node kiln.mjs source asset.kiln.js
node kiln.mjs source sha256:FULL_REFERENCE --out revised.kiln.js
node kiln.mjs render sha256:FULL_REFERENCE --out revised.glb --views revised.png
```

Source export refuses to overwrite an existing file. The saved JavaScript is portable;
a reference needs a store containing that source.

References hash the exact UTF-8 source, including whitespace and line endings. Local
CLI and MCP processes default to `.kiln/programs` in their working directory. The setup
command configures the same absolute store path for both; `KILN_PROGRAM_STORE` overrides it.

Local storage is append-only, limited to 1 MiB per program. There is no automatic
eviction or total disk quota. Export accepted work before deleting an old workspace's
store; its references then stop resolving. Source is integrity-checked on read. A hash
identifies content and does not authorize access in a hosted service.

## Failure handling

A failed replacement leaves the base unchanged. An edit may apply successfully while
its render fails: `ok` describes editing, `render.ok` describes building. The failed
draft has a reference for repair. Reference-mode diffs are limited to 8,000 characters
and set `diffTruncated`; use source reads for the rest.

## Library use

`createKilnProgramToolRegistry(context)` is exported from `@kiln/engine/tools` and returns the
same eight definitions used by MCP. Inject `context.programStore`, with asynchronous
`put(code)` and `get(programRef)` methods, to share revisions between instances. Without
it, one registry instance keeps an in-memory store bounded to 64 MiB. Keep that instance
for the run. The legacy registry and internal working-buffer surface remain separate.

## Why separate read and edit?

A source read should have no edit or render side effect. Editing includes rendering
because reviewing a change is the common next action. Explicit revisions avoid a
hidden current asset; bounded reads avoid fetching an entire program for one constant.

The current MCP specification recommends explicit handles for application state.
See its [release explanation](https://blog.modelcontextprotocol.io/posts/2026-07-28/)
and [transport specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http).
Bounded reads and combined edit/render follow the workflow-oriented approach in
[Anthropic's tool-design guidance](https://www.anthropic.com/engineering/writing-tools-for-agents).
These support the design; they do not prove one interface is best for every model.

Source references avoid sending the program again. Build caching separately avoids
running unchanged source again. The public tool registry reuses successful builds
when the source, evaluator identity and evaluation options match. Packaged Node
CLI/MCP runs can reuse builds on disk when the runtime bundle and installed dependency
files have a verifiable identity. Source-development runs use a process-local cache.

Camera changes can reuse geometry, but each image also depends on its renderer,
camera and capture settings. A source reference alone never identifies a rendered
image. Cache receipts describe reuse; they are not evidence of visual quality.
