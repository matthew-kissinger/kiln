# Cline image transport and first correction

Checked September 22, 2026, using Cline CLI **3.0.64** and its published
`@cline/core` **0.0.85**. These are supporting harness preflights, not additional
main-campaign authorings. The campaign remains **14/36 main, 28 edits, 0/12 held-outs**.

Follow-up [adversarial cross-harness review](2026-09-22-mcp-image-cross-harness.md)
adds official MCP SDK and tiny-image controls, passing OpenCode image transport,
Hermes cached-image/vision behavior, and the published VS Code Legacy/Next split.
Activated VS Code 1.138.0 tests now confirm the same defect in extension 4.1.20's
Next/SDK path. Legacy preserves the MCP image. The scope is the shared SDK path;
a blanket claim about every Cline implementation remains unsupported.

## Root cause: the harness converts an MCP envelope into text

The truncated base64 is a **Cline MCP-to-model conversion defect**, reproduced
offline before any provider call. It is not evidence that Muse lacks vision or
that Kiln returns base64 as a text result.

1. Kiln's `src/mcp-server.ts` returns a standard MCP `content` array containing an
   `image` block (`data`, `mimeType`) and a separate `text` block. Its shared media
   extractor removes the base64 field from the text. The retained packet contains
   one valid 68,008-byte PNG, matching the independently viewed image.
2. Cline's published `createMcpTools` returns the entire MCP result object without
   converting its content blocks to the agent's content representation.
3. Cline's persistence/message codec preserves arrays but JSON-stringifies objects.
   Our render therefore becomes a **112,301-character string**, with zero image
   blocks in the model conversation.
4. Cline's provider message builder applies its default **8,000-character tool-text
   limit**, yielding exactly `...[truncated 104335 chars]...`. Changing model does
   not repair a conversion that happens before inference.

Primary upstream source, pinned to the inspected revision:
[MCP bridge](https://github.com/cline/cline/blob/d7e4c640a5d1dce2984d19722155337cd30dcbed/sdk/packages/core/src/extensions/mcp/tools.ts),
[object serialization](https://github.com/cline/cline/blob/d7e4c640a5d1dce2984d19722155337cd30dcbed/sdk/packages/core/src/session/persisted-tool-result-content.ts),
[message conversion](https://github.com/cline/cline/blob/d7e4c640a5d1dce2984d19722155337cd30dcbed/sdk/packages/core/src/runtime/config/agent-message-codec.ts),
[text budget](https://github.com/cline/cline/blob/d7e4c640a5d1dce2984d19722155337cd30dcbed/sdk/packages/core/src/session/services/message-builder.ts).
The installed bundle was checked separately; this conclusion does not depend on
assuming repository HEAD exactly matches the npm release.

The offline reproduction exercises the real installed `createMcpTools` against
the retained response, then the two unmodified pure serialization/truncation
functions extracted from that installed bundle. It reproduces both the persisted
string and the exact truncation marker. A control conversion to Cline's array
representation preserves an image block. This is a boundary diagnosis, not a full
patched-harness end-to-end acceptance test.

### End-to-end wire isolation on Windows and Linux

A second, stronger experiment runs the **unmodified official CLI binary** with
fresh isolated config/data directories, the documented flat stdio configuration,
a minimal standard MCP image server and a loopback OpenAI-compatible mock endpoint.
The server imports no Kiln code. The mock only requests the MCP fixture and then
the native `read_files` control; it captures complete outgoing requests and returns
canned responses. No actual model inference or account credentials are involved.

| Host | CLI | After standard MCP image call | After native read of the same PNG |
| --- | --- | --- | --- |
| Windows, driver Node 24.20.0 | 3.0.64 official Windows x64 binary | 0 image blocks; 7,999-character text containing partial base64 and truncation marker | 1 actual image block |
| CachyOS Linux, driver Node 22.23.2 | 3.0.64 official Linux x64 binary | 0 image blocks; the same 7,999-character text/truncation result | 1 actual image block |

Both processes exit successfully after exactly three loopback completion requests.
The native-reader control proves the selected provider path can transmit images;
the missing MCP image is not an absent-vision model configuration. These are captured
provider HTTP bodies, not CLI display events or saved conversation interpretations.
The replicated failure is independent of Kiln, real model behavior, Windows paths
and the initial hand-wired workspace. No evidence supports changing Kiln's image
size, renderer or MCP schema to address it.

The portable probe and results live at
`C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/cline-protocol-probe`.
`results/win32-native-control/request-{1,2,3}.json` contains the Windows captures;
`linux-receipt.json` is copied from the laptop. Full Linux captures remain under
`/home/matthewk/kiln-qualification-20260922/cline-protocol-probe/results/linux-native-control`.
The earlier `win32-flat` run captured the failure but lacked a native-image control;
keep it as preliminary evidence, not the decisive comparison.

**Resolution:** preserve Kiln's standards-compliant MCP image response. The proper
upstream repair is a typed MCP-to-agent adapter: unpack `content`, translate image
`mimeType` to the harness's `mediaType`, preserve text, and correctly propagate
errors and other supported content types. Test image-only, mixed text/image,
text-only, structured and error results through the provider request. Do not
globally JSON-parse arbitrary tool text, increase the text budget to carry pixels,
or add a Kiln-specific envelope. No installed Cline files were patched and no
upstream message or issue was posted.

Until that path is repaired and verified, **Cline CLI plus Kiln CLI and native
`read_files` image loading is usable**. Cline MCP image review is unqualified.
The activated Next/SDK extension also fails this boundary; Legacy passes. Desktop
and other extension/provider versions are not qualified by these tests.

## Latest release, configuration and prior upstream work

A fresh `npm view cline version dist-tags --json` reports stable **3.0.64**;
`cline --version` agrees. `npm view @cline/core version` reports **0.0.85**, also
the installed version. The available nightly is not evidence of a fix and was
not installed. CLI and VS Code extension version numbers are separate.

The [official MCP setup](https://docs.cline.bot/mcp/mcp-overview) documents local
stdio servers using `command`, `args` and `env`. Our canonical nested `transport`
shape and that documented flat shape normalize to **identical transports** when
passed through the installed SDK's `parseMcpServerRegistration`; the offline
receipt asserts this. All 14 Kiln tools are callable in the corrected workspace.
The initial invalid managed-workspace flag was an operator error already corrected
before the failing image run. No documented image-preservation setting was found.
Changing transport configuration cannot repair the observed object serialization.

Relevant history, with scopes kept distinct:

- [Issue #1865](https://github.com/cline/cline/issues/1865) and
  [issue #1033](https://github.com/cline/cline/issues/1033) report older MCP-image
  interpretation failures. #1865 was consolidated into #4391. They are evidence
  of prior reports, not confirmation that our present CLI defect is tracked.
- [PR #2962](https://github.com/cline/cline/pull/2962), merged April 18, 2025,
  added image handling to the older task/VS Code path. That implementation does
  not establish behavior of the new SDK-based CLI.
- [Issue #7060](https://github.com/cline/cline/issues/7060) concerns duplicate
  base64 in the VS Code display. Its proposed
  [PR #8701](https://github.com/cline/cline/pull/8701) closed without merging.
- [PR #13643](https://github.com/cline/cline/pull/13643) and test follow-up
  [#13645](https://github.com/cline/cline/pull/13645), merged August 28, 2026,
  extract tool images for the desktop/shared **display UI**. Their changed files
  do not repair the MCP-to-model adapter. A human-visible thumbnail is therefore
  not sufficient evidence that the model received an image.
- [PR #11475](https://github.com/cline/cline/pull/11475) introduced the default
  8,000-character tool-result text cap. Correctly typed images are protected;
  the earlier conversion of the envelope to a string prevents that protection.

Current upstream HEAD at inspection is
`d7e4c640a5d1dce2984d19722155337cd30dcbed`. Its MCP wrapper still returns the raw
envelope. The runtime's provider preparation converts agent messages to the core
message representation and invokes `MessageBuilder` before the next request;
this is not merely a stored-transcript display artifact. The focused issue/PR and
discussion search did not identify a merged fix or supported toggle for this exact
current-CLI path. Keep the standard Kiln protocol and qualify a future upstream
release against the retained reproduction before restoring MCP visual acceptance.

For current Cline setup, use the existing Kiln CLI to export both the GLB and PNG,
then request native image-file loading in the asset workspace. For example, where
the workspace already has its `kiln.mjs` launcher:

```sh
node kiln.mjs render asset.kiln.js --out asset.glb --views asset.png --render gpu --json
```

Have Cline open `asset.png` with its native image reader; inspect `viewFidelity`
before material judgments. This uses normal interfaces on both sides and needs
no Kiln-specific Cline protocol, hidden compatibility flag, provider change or
installed-code patch. It is an explicitly selected CLI workflow, not a silent
fallback presented as an MCP pass. No `--harness cline` setup option is claimed.
The owner has submitted [Cline #14421](https://github.com/cline/cline/issues/14421);
the concise user setup is in [harnesses](../harnesses.md#cline-cli-and-next-image-review).

## Actual runs and independent checks

| Trial | Result | Limit |
| --- | --- | --- |
| Cline 01, Muse Pass | Stopped after incorrect operator workspace wiring; server correctly rejected the managed-workspace flag without a manifest | Setup failure; no completed asset |
| Cline 02, Muse Pass, MCP | Completed unchanged handrail baseline in 18 iterations; exact original GLB hash; 583,632 input / 16,134 output / 218,572 cache-read tokens | Model received truncated image text and correctly declined visual claims; export required unnecessary shell/cache exploration |
| Cline 03, MiMo V2.6 Flash Pass, Kiln CLI | Completed requested bend-amplitude correction in 7 iterations, 137.6 seconds; 201,691 input / 7,547 output / 163,712 cache-read tokens | One correction, not a campaign pair; model's final dimension claim was false |

The third trial's automatic `@` attachment initially failed because the operator
attached punctuation to the filename and launched from a different directory.
The model recovered using native `read_files`. Both baseline and edited PNGs are
actual image blocks in the saved conversation, not base64 prose. Launch future
trials from the asset workspace and place each `@path` alone without punctuation.

Independent source comparison confirms the only requested change:
`BEND_AMP = 0.18` to `0.09`. Materials and embedded texture hashes are unchanged.
The exported bounds change from `[2.442528248, 0.985000014, 0.460000008]` metres
to `[2.422871828, 0.985000014, 0.280000001]`. The model claimed the X extent was
amplitude-independent; actual X extent shrank **19.656 mm**, because the swept
profile's orientation changes. Nominal path span does not prove overall bounds.
Retain this as a model reporting failure, not an engine geometry defect or a
successful exact-dimension preservation claim.

## Metering and provenance

After these terminal runs, the authenticated Cline dashboard still shows the
separate usage-billing balance **11.2858**. Visible MiMo and Muse request rows show
**0.0000 credits used**. ClinePass is active through October 22; its five-hour,
weekly and monthly meters display **0%**, with respective countdowns of
4 hours 41 minutes, 6 days 23 hours and 29 days 23 hours at observation.
Zero displayed percentage does not prove zero allowance consumption or a fixed
number of remaining trials. The dashboard explicitly says input includes cached
tokens; do not add cache-read tokens to its input total again.

All artifacts are outside the engine in
`C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22`:

- `evidence-cline-02/image-transport-diagnosis.json` and
  `diagnose-cline-mcp-image.mjs`: offline reproduction and bundle fingerprint.
- `evidence-cline-02/baseline-trace.jsonl`, `baseline-render.json`,
  `baseline-tool-image.png`: original MCP run evidence.
- `evidence-cline-03/independent-review.json`: source/material/texture/bounds
  comparison; the workspace retains `edited.kiln.js`, `edited.glb`, `edited.png`.

These preflights use frozen runtime
`sha256:4dd42c4e91f3c702f66ee6bdaf00a379f2c152f7657041d0f8259a29a7b3212a`.
They do not qualify the later peer-alignment build. No Google inference or
unauthorized Cline usage-billing request was needed.
