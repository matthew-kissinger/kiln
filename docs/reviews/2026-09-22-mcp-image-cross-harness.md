# MCP image transport: adversarial cross-harness check

September 22, 2026. The confirmed defect affects **Cline CLI 3.0.64 and the
Next/SDK implementation of VS Code extension 4.1.20** when converting an MCP
result into model input. The activated Legacy extension preserves images. This
is a shared Cline SDK-path defect, not a Kiln renderer failure or an MCP protocol
limitation. Do not extend this conclusion to every Cline implementation.

These are local mock-provider experiments: captured outgoing HTTP bodies, no
real inference or account credentials. They establish transport behavior, not
model understanding or real-provider acceptance of every multimodal format.
Campaign counts remain **14/36 main, 28 edits, 0/12 held-outs**.

## Evidence matrix

| Surface | After MCP image tool | Native image control | Evidence strength |
| --- | --- | --- | --- |
| Cline CLI 3.0.64, Windows and Linux | Zero image parts; MCP envelope serialized into text, large payload truncated | Same PNG produces one image part | Actual official CLI binaries and provider HTTP bodies |
| Cline CLI, official SDK server, Windows | Same failure; tiny 106-byte PNG produces 269 untruncated characters and still zero image parts | One image part | Rules out fixture implementation and size as the cause |
| OpenCode 2.0.14, official SDK server | One image part; image bytes absent from tool text | Second image part added | Actual CLI, Code Mode MCP invocation and provider HTTP bodies |
| Hermes 0.21.4, official SDK server | A `MEDIA:` file reference, zero inline images | `vision_analyze` opens that exact cached file and sends one image part in the main conversation | Actual CLI; cached PNG bytes equal server input |
| Cline VS Code 4.1.20, Legacy | One native image part after MCP | Second image part added; exact PNG bytes match | Activated official VSIX in VS Code 1.138.0, provider HTTP bodies |
| Cline VS Code 4.1.20, Next/SDK | Zero image parts; 269-character untruncated MCP envelope in text | One native image part; exact PNG bytes match | Activated official VSIX in VS Code 1.138.0, provider HTTP bodies |

The path is `MCP server -> harness adapter -> model provider request`. Kiln's CLI
is not involved in these MCP tests. The native file read is a control for that
harness's image transport, not a required step in Kiln's MCP protocol.

## Challenges to the diagnosis

- **Old installation or wrong PATH:** Cline used an explicit official binary with
  fresh config/data. Windows SHA-256:
  `679c59ced816b761119a062ce2fcb2d7f6813f0ce68b3771a81d56a70639695e`.
  A separately installed Linux binary reproduces the failure. Both report 3.0.64.
- **Incorrect MCP fixture:** replaced the hand-written fixture with
  `@modelcontextprotocol/server@2.0.0`, `McpServer`, and
  `serveStdio(() => server)`. No Kiln imports. Cline still fails; OpenCode preserves
  the image. An initial incorrect SDK startup passed the server instead of a
  factory; that setup failure is retained and excluded from the image verdict.
- **Only the text limit:** the 16x16 PNG's 269-character result is not truncated
  but still has no image part. Raising the limit cannot restore the lost type.
- **Only UI/transcript display:** measurements come from provider HTTP bodies.
  Native reading proves the same configured route can produce an image part.
- **Vision configuration:** genuinely relevant in Hermes. Without capability
  metadata for the custom mock model, its vision tool used an auxiliary request
  and returned text to the main model. Declaring `model.supports_vision: true`
  caused an image to reach the main conversation. Use accurate metadata; this
  override cannot give a text-only model vision. Real-provider acceptance remains
  separate from this local wire check.
- **All Cline products share the failure:** rejected. The official
  [4.1.20 VSIX](https://github.com/cline/cline/releases/tag/v4.1.20) contains Legacy
  and Next bundles, selected by rollout/configuration. Legacy converts images and
  explicitly warns a non-vision model when only the user can see them. Activated
  editor tests now prove Legacy preserves images and Next loses their type.

## Activated VS Code comparison

The official unmodified 4.1.20 VSIX ran under portable VS Code 1.138.0 through
Microsoft's `@vscode/test-electron` extension host. Each run had fresh editor,
extension and Cline data directories. The supported `CLINE_BUNDLE_OVERRIDE`
selected Legacy or Next; `require.cache` confirmed exactly the requested bundle
loaded, without rollout fallback. Cline's public extension API started the task.
No production Cline code, user installation or image adapter was patched.

The same official-SDK MCP fixture returned the 106-byte PNG to each implementation.
A loopback OpenAI-compatible mock requested MCP, then native file reading. Model
metadata declared image support. Legacy sent image counts **0, 1, 2** across the
three requests; Next sent **0, 0, 1**. Every typed image decoded to the original PNG
SHA-256. Next's 269-character MCP text still contained the complete original PNG,
so this failure occurs before any truncation. This directly separates what the
model receives from what a UI might display.

The first Legacy setup attempt placed MCP settings only in the shared Cline data
directory. That implementation reads them from VS Code global storage; its explicit
"No connection found" result is retained and excluded. The corrected run used that
documented/source-defined host storage path and completed both controls. Editor
tokenization-worker warnings did not prevent extension activation or the requests.
No real inference ran. Actual model understanding and other provider adapters are
not established by these transport controls.

The latest [MCP tools specification](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#image-content)
defines image content using `type: image`, base64 `data`, and `mimeType`. Kiln
uses that shape without a user-only audience annotation. The spec does not mandate
a particular UI or provider format. This review qualifies the image boundary,
not every latest-protocol feature. Kiln's active server dependency is split SDK
2.0.0, not the unrelated transitive 1.x SDK also present in node_modules.

## Changes and disposition

Keep Kiln's normal image protocol. Cline needs generic typed-content conversion
before serialization/text budgeting, preserving text, media, errors and supported
resources. No Cline code was patched. The
[upstream draft](2026-09-22-cline-mcp-issue-draft.md) reports the CLI and Next/SDK
defect, with Legacy as a passing control. The owner submitted
[Cline #14421](https://github.com/cline/cline/issues/14421). Cline CLI can
already use Kiln CLI exports followed by native image reading; document that
explicit workflow instead of silently substituting it for an MCP pass.

An independent Kiln harness defect was fixed: Windows resolution preferred a
later obsolete OpenCode `.exe` over an earlier current npm `.cmd`. It now follows
PATH order. OpenCode dispatch uses V2's working directory and `--standalone`,
replacing removed V1 flags. Focused tests cover Windows precedence and argv;
setup skill copies agree. The renderer and MCP image format are unchanged.

Validation: focused 27 tests pass; full suite **2569 pass, 4 skip, 0 fail**, 62,254
assertions in 173.13 seconds. Typecheck, lint (674 files), skills and diff checks
pass. Bun 1.4.2, PATH Node 24.20.0; this is not the pinned release-toolchain gate.
No new coverage measurement or renderer rebuild was needed for this harness slice.

Official tooling updated Hermes to 0.21.4 (upstream `ade48144`) and repaired its
stale Windows runtime: Python 3.11.16, SQLite 3.53.1, working `hermes.exe`, existing
Nous login preserved. Official config migration reached v46. Optional integration
warnings are not claimed fixed. The repaired install passed the cached-image
control. Free-model entitlement and real Kiln authoring through Hermes remain open.
The installer updated the user PATH; terminals already open may need restarting.

## Retained evidence

Root: `C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/cline-protocol-probe`.

- `results/win32-native-control` and `linux-receipt.json`: independent OS controls.
- `results/cline-official-sdk-factory-control`: SDK image absent in request 2;
  native reader image present in request 3.
- `results/cline-sdk-small-control`: tiny untruncated negative control.
- `results/opencode-v2-sdk-control`: request 4 has MCP image; request 5 adds native
  reader image. Initial title request is not a main agent tool turn.
- `results/hermes-repaired-cache-control`: request 5 has MCP media path; request
  6 has an image in the main tool conversation. `mcp-cache-control.json` records
  exact byte equality. Auxiliary/session-summary requests are kept distinct.
- `extension-boundaries.json`, `check-extension-boundaries.mjs`: published bundle
  hashes, original extracted functions, mocked UI/model metadata, and limitations.
- `results/vscode-activated-mcp-control`, `results/vscode-activated-next-control`:
  actual extension activations, isolated configuration and three provider requests.
- `extension-activated-verification.json`, `vscode-host/verify-extension.mjs`:
  active bundle identity, exact image-byte comparisons and untruncated Next result.
- `vscode-host/run-extension.mjs`, `extension-test.cjs`: external test driver using
  the public extension API and official VS Code test host; no patched VSIX.
- `cline-mcp-image-repro-20260922.zip`: shareable official-SDK runner and synthetic
  PNG only, with no captured user data. Source/fixture match the verified controls.

Failed setup probes remain alongside successful controls; they are not image
failures. Protocol probes are terminal. No upstream post or release was created.
