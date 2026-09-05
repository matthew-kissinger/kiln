# Harness checks · 5 September 2026

These checks exercise source reuse across tool calls. They are small integration tests, not a model-quality ranking.

## Procedure

Each run received a new directory outside the engine checkout, the five Kiln skills, a task brief, a local CLI launcher, and a project MCP configuration. Refinement runs also received one well program. No example library or engine implementation was supplied as task context.

The task was to change `POST_W` from `0.13` to `0.18`, preserve all other source, render the original, find the constant through `kiln_source`, edit by `programRef`, inspect a post, and export the revision. We compared exported bytes against the exact expected replacement and recorded MCP requests and responses with [observe-mcp.mjs](../scripts/observe-mcp.mjs).

The directory separation is not a security sandbox. Provider authentication remained available; harness-managed instructions and permissions could still apply. An earlier Antigravity attempt searched outside the task directory while resolving a relative brief, so it was excluded. The successful rerun used a new explicit project, added directory, and absolute paths.

## Results

| Harness and selected model | Time | Exact source edit | Qualification |
|---|---:|---|---|
| OpenCode 1.18.27 · Muse Spark 1.3 Contributor | 48 s | Pass | Five Kiln calls, all by reference; full requested sequence completed |
| OpenCode 1.18.27 · Omen Alpha | — | Not run successfully | Provider rejected the request at its weekly usage limit; no Kiln calls |
| Antigravity · Gemini 3.8 Flash High | 137 s | Pass | Four Kiln calls, all by reference; explicit project and paths required |
| Hermes · Qwen 3.5 35B A3B | 92 s | Pass | Compatibility check only; seven calls exceeded the six-call brief |
| OpenCode 1.18.27 · Gemini 3.1 Flash Lite | 36 s | Pass | Compatibility check only; omitted the requested inspection call |
| Codex 0.153.3 · configured default | 138 s | Pass | Model identity was not captured; initial CLI duplicate-start defect was found and fixed |

The requested frontier OpenCode identifier was `opencode/muse-spark-1.3-contributor-free`. Omen was requested as `opencode-go/omen-alpha`. The older Gemini and Qwen runs are retained only as compatibility evidence, not as substitutes in the frontier comparison. Claude was excluded from further runs after a provider credit refusal.

The supplied source was 10,601 bytes. Muse's edit arguments were 174 bytes, including the reference and replacement; its five Kiln requests totaled 573 bytes. Source lookup responses remain bounded source text, and images still have their normal payload cost.

All successful refinement runs used references without inline source in subsequent MCP requests. Reference-mode edit responses omitted the updated source. The server returned image blocks, and the models reported image review; those reports alone do not establish the quality of visual judgment. These refinement runs used CPU views and cannot establish material fidelity.

## What changed after testing

- Fixed duplicate CLI execution when importing the Node bundle. Source import now prints one reference; export performs one write.
- Added explicit workspace and absolute-path guidance for Antigravity and Hermes. Hermes's generated launcher sets a separate profile and terminal directory.
- Kept source viewing separate from editing. A read is bounded and has no mutation; an edit returns a new revision and renders by default.
- Shortened tool descriptions and skills, including guidance for missing references, failed edits, and degraded images.

## New asset trial

Muse Spark 1.3 Contributor also authored [the tidal observatory](../examples/tidal-observatory.kiln.js) from a design brief, with no starting asset. It used the tools to build and review the structure, then refined the island shape and category metadata after reviewer feedback using saved references.

The final geometry has 10,968 triangles. A separate GPU gallery render was inspected after authoring; the model's own views were CPU-only because the local render service required an authentication token. The result is a stylized specimen: its shiny copper and simplified rock do not fully match the requested aged surfaces. It is not evidence that material review succeeded in the model loop.

The checked-in source adds a provenance header to the model's final exported program. No geometry or materials were manually rewritten. Existing gallery examples retain their own model credits and refinement notes.

## Scope of the conclusion

The checks support using immutable source references to eliminate repeated program transmission across CLI and MCP calls. They do not establish universal model superiority, complete harness isolation, or a cross-call geometry cache. See [the design](programs.md) for storage lifetime, limits, and the current MCP rationale.
