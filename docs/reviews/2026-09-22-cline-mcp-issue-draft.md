# Draft upstream issue: SDK-based clients serialize MCP images into tool text

Historical draft: the owner submitted
[Cline #14421](https://github.com/cline/cline/issues/14421) on September 22, 2026.
No agent posted an upstream issue or comment. A shareable reproduction using the official SDK and
a synthetic 106-byte PNG is prepared outside the repo at
`C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/cline-protocol-probe/cline-mcp-image-repro-20260922.zip`.
It includes no user assets, accounts, keys or captured user conversations.

## Proposed title

CLI 3.0.64 and VS Code 4.1.20 Next: MCP ImageContent becomes text before model input; Legacy and native images work

## Problem

A local stdio MCP tool returns a standard result:

```json
{
  "content": [
    { "type": "image", "data": "<valid PNG base64>", "mimeType": "image/png" },
    { "type": "text", "text": "Fixture image returned successfully." }
  ]
}
```

The next provider request contains the entire MCP envelope as a tool-content
string, truncated to 7,999 characters for a large PNG. There is no native image
part. Reading the same PNG through Cline's native `read_files` tool produces an
actual `image_url` part in the following provider request.
An independent 106-byte, 16x16 PNG control produces only 269 characters of text,
with no truncation, but still no image part. Lost image typing precedes truncation.

## Environment and reproduction

- Latest stable `cline@3.0.64`, bundled `@cline/core@0.0.85`, verified from npm.
- Reproduced with unmodified official Windows x64 and Linux x64 CLI binaries.
- Linux host: CachyOS, Node 22.23.2 driver. Windows driver: Node 24.20.0.
- Fresh `--config` and `--data-dir` directories; no real provider credentials.
- Documented flat stdio MCP config using `command`, `args`, `cwd`.
- OpenAI-compatible loopback test endpoint and a placeholder test key.
- A minimal MCP fixture with no Kiln dependency returns a valid 68 KB PNG.
- Repeated on Windows with the official `@modelcontextprotocol/server@2.0.0`,
  `McpServer` and `serveStdio(() => server)`, including the tiny PNG control.
- Explicit Windows binary SHA-256:
  `679c59ced816b761119a062ce2fcb2d7f6813f0ce68b3771a81d56a70639695e`.

The mock endpoint requests `image_probe__get_image`, then native `read_files` for
the same PNG, then returns a final text response. Capture the three HTTP request
bodies. Both operating systems produce:

| Provider request | Native image parts | Relevant tool content |
| --- | ---: | --- |
| Initial | 0 | No result yet |
| After MCP image tool | 0 | String, 7,999 characters, partial base64, truncation marker |
| After native file reader | 1 | Native image transmitted successfully |

All runs exit zero; no real inference is involved. This separates the defect from
model vision capability, provider billing, server rendering and OS-specific paths.
OpenCode 2.0.14 sends a real image part from the same official SDK fixture.

## Suspected boundary

At current source revision `d7e4c640a5d1dce2984d19722155337cd30dcbed`:

1. `sdk/packages/core/src/extensions/mcp/tools.ts` returns the raw MCP envelope.
2. The agent-message codec uses `toPersistedToolResultContent`; objects become
   JSON text, while arrays retain content structure.
3. Provider preparation passes that string through `MessageBuilder`, which applies
   its normal 8,000-character tool-text cap. Typed-image protection cannot recognize
   an image already serialized inside a string.

The same path was checked in the published bundle. Correct normalization of MCP
content into the runtime's typed content representation appears to be needed
before serialization/budgeting. Preserve content order, media types, tool errors
and supported resource variants. This should be a generic MCP adapter repair,
not a server-specific image envelope or a larger text cap.

## Related work and question

Older image handling appears in #1865/#1033 and merged #2962. Recent #13643/#13645
address desktop/shared image display; they do not change this provider-input path.
The text budget is described in #11475. The reproduction is not simply duplicate
base64 displayed alongside a successfully transmitted image.

Is there a supported current-CLI configuration or adapter intended to normalize
MCP image results before model requests, or should this boundary be repaired?
An end-to-end regression should assert a native image part reaches the provider
for a standard MCP result, alongside text-only, mixed-content and error cases.

## Activated VS Code comparison

The published VS Code 4.1.20 extension contains Legacy and Next/SDK implementations
selected by rollout/configuration. Both were activated from the unmodified official
VSIX in portable VS Code 1.138.0 using `@vscode/test-electron`, isolated editor/Cline
data directories and the public `startNewTask` extension API. The supported
`CLINE_BUNDLE_OVERRIDE` selected each implementation; loaded-module inspection
confirmed the selected bundle without fallback. No adapter or production code was
patched. The fixture, mock endpoint and image-capable model metadata were identical.

| Activated implementation | Initial image count | After MCP | After native reading |
| --- | ---: | ---: | ---: |
| Legacy | 0 | 1 | 2 |
| Next/SDK | 0 | 0 | 1 |

All typed images decode to the original PNG bytes. Next sends the MCP envelope as
269 untruncated text characters; the complete image bytes are present inside that
text. Thus the confirmed scope includes CLI and Next/SDK, while Legacy provides a
passing in-product control. This is provider-request evidence, not thumbnail/UI
inspection. Desktop and other provider adapters were not tested.

The initial Legacy setup probe used the wrong host settings location and returned
"No connection found"; it is excluded. The qualified run places MCP settings in
the isolated VS Code global-storage directory used by Legacy. Next uses shared
Cline data. No real inference or account credentials were used.

Detailed local comparison: [cross-harness review](2026-09-22-mcp-image-cross-harness.md).
