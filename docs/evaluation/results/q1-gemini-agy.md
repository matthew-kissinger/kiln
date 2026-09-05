# Gemini / Antigravity integrated workflow

Gemini `gemini-3.8-flash-high` authored a twisting ribbed canopy in a fresh external
workspace on 2026-09-05. The installed package was
`614b1c9ea2adf55bd7b4c1b058c0b7c7f4dd24f76f8a2d22267c6fb2221281ef`;
the workspace contained its current author/refine/QA skills and the canopy brief.
No finished source or gallery example was supplied. The model used the project
`kiln_workspace` server through the packaged Antigravity launcher.

The tool and export journey completed in 231 seconds: 11 Kiln calls, three PNG
blocks containing eight image cells, and one transmission of the full program.
After a bounded source read, the model changed `serviceOffset = 0.20` to `0.35`
using `kiln_edit`. Independent comparison verified that every other source byte
was unchanged. The whole-asset camera was reused, with an additional part-relative
view of the light-rail attachment. All delivered tool images reported faithful
GPU materials; derivative images remain identified as derivatives.

- Original reference: `sha256:978417452ba0d2764d82af9697bfa888b907787f38ce4cdc6a196e468d451e9f`.
- Final reference: `sha256:2d3d12e4e53613289f017fc5c4e20731fe7736655781839168dc2480be3efdcf`.
- Exported source: 8,358 bytes. Exported GLB: 139,828 bytes,
  SHA-256 `392ab403413b9ce8e4616df05cb37d6260d70078d4c0d8a2c5903af64be9c310`.
- Direct GLB inspection confirmed a 0.25 m translation and return at times
  0, 0.5 and 1, with all 20 descendant parts, including brackets and lights,
  retained beneath `ServiceAssembly`.

The canopy has a visibly twisting continuous surface, twelve curved ribs and two
offset supports. Its source and images are useful evidence of custom surfaces,
sweeps and local edits. The dark underside makes small fittings difficult to
judge in the whole view. The roof is an open sheet with no thickness. The model's
claim that the ribs have no self-intersections exceeds what the images establish;
the engine's unchecked-intersection warning remains applicable. This candidate
is not automatically a featured gallery asset.

## Two separate harness findings

Antigravity exited with code 0 after exporting the requested files, but its final
stream event reported an interruption after the completed summary. This is retained
as a harness reporting error; an exit code alone would have hidden it. Acceptance
of the completed tool workflow comes from the actual transcript and exported
files, not that status or the model's assertion.

The native export used unqualified `node`, while the instrumented MCP server used
Node 22.23.1. Rebuilding with Node 24.20.0 reproduces the native export's exact
cache key and bytes, including with caching disabled. That identifies its runtime
through reproduction rather than a directly logged version command. Node 22.23.1
instead reproduces the MCP artifact hash
`c73bcf9aa3c02280787cea77cfceff8d73bb76ddfa437db7fec1ba222816a099`.

The two GLBs have identical binary geometry and animation data. Their JSON differs
only in two material color components by less than `1.4e-17`; both agree when
rounded to Float32. Cache keys correctly distinguish the runtimes. Exact byte
reproduction requires the same runtime; a source reference alone does not promise
identical GLB bytes across Node versions.

The previous routing failure used an older global skill and server and is excluded
from this result. [Routing fix and discovery proof](../agy-bootstrap-2026-09-05.md).
No credentials were copied, no global configuration was changed, and no paid API
fallback was used. Existing subscription usage is not described as free.

Local evidence: `C:/Users/Mattm/X/kiln-cleanrooms/q1-gemini-614b1c9e-20260905/evidence/`.
It contains the exact setup and skill hashes, native event stream, observer
arguments and PNGs, and `independent-verification.json`. The runtime comparison
is also retained with the evaluation results.
