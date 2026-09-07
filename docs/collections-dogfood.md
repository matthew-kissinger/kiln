# Collection workflow dogfood — September 6, 2026

The change adds explicit durable asset saves, project/personal collection roots, immutable child revisions, GLB/source/ZIP exports, and a read-only local GLB viewer. Draft rendering remains separate from saved collections. Full provenance travels in a hashed manifest; compact tool replies link to the record.

## Harness evidence

| Harness | Model evidence | Result |
| --- | --- | --- |
| Codex CLI | Reported `gpt-6-astra` | Completed recorder asset, image review, project save, copy to personal, source restore, child revision, and exports. |
| Antigravity CLI | Requested `gemini-3.8-flash-high`; log says resolved via default, so exact model remains unconfirmed | Completed animated orrery, image review, project save, copy to personal, source restore, child revision, and exports. |
| Claude CLI | Reported `claude-sonnet-5` | API-key attempt blocked by credit balance. Subscription attempt blocked by weekly limit. Neither generated an asset. |
| OpenCode CLI | Reported `glm-5.3-flash` | Timed out after ten minutes with no saved revision; transcript contains only the model header. This is not evidence of asset quality. |
| ChatGPT web | Composer reported GPT-5.6 Sol Light | Created the botanical scanner, reviewed actual CPU images, corrected its height, saved/copied/restored source, and saved a child refinement. Both native skills are installed and updated. Interactive MCP App viewing is verified; native attachment downloads are not. |

Runs used isolated asset workspaces containing the project skills and MCP configuration. They were authorized manual live tests, outside CI. No examples were copied into the test workspaces. Raw evidence remains local under `.dogfood/collections/`, including run metadata, transcripts, workspace outputs, and file hashes.

## Independent review

The actual exported GLBs were opened in the new viewer, beyond the models' CPU previews. The recorder's silhouette, twin reels, controls, handle, and protective frame read clearly. Its refined revision has 9,240 triangles, 136 meshes, eight materials, and a 113 KiB GLB: a plausible gallery candidate, with draw-call optimization still worth doing for a game destination. The orrery's gold/blue materials and orbit animation work in the viewer; its refined revision has 7,708 triangles, 45 meshes, six materials, and a 242 KiB GLB. Neither has been promoted to the gallery.

The local viewer delivered the recorder's editable bundle through the browser download event. Both original and child revisions of the recorder, orrery, and ChatGPT scanner were independently exported to ZIP, imported into a fresh library, hash-verified, and rebuilt from restored source. All six regenerated GLBs match the saved artifact hashes under Node 22.23.1. A Bun regeneration differs in last-place floating-point JSON values; cross-runtime byte identity is not claimed.

## Findings addressed

- Real model runs complained about verbose provenance replies. Save/export/restore now return compact revision summaries and separate manifest resources. A focused regression verifies that a 50,000-character integration record does not inflate export replies.
- ChatGPT classified tools without annotations as destructive/open-world. The registry now owns explicit annotations: source/discovery/export/presentation are reads, stateful operations are writes, all operations preserve existing revisions. Transport tests verify the advertised annotations. Refresh is asynchronous: verify the actual metadata afterward. Versioning UI resource URIs was necessary to replace cached viewer HTML during the browser test.
- The initial Platform page briefly reported insufficient tunnel permissions while account data loaded. Reopening it showed existing access. No organization roles were changed.
- ChatGPT web accepted ZIP skills directly, including their reference files. The installed-skill UI and loaded SKILL.md confirmed installation; this was not merely an attachment to a prompt.

## Validation

Supported toolchain check, typecheck, lint, packaged runtime smoke test, plugin packaging checks, and skill/plugin validators passed. The collection implementation passed **1,752 tests, two skipped, zero failed**. The first widget/download-helper coverage run passed **1,755 tests, two skipped, zero failed**, with functions **95.48%** and lines **92.71%**, above the unchanged 92%/91% gates. After adding host-provided delivery URLs and the presentation output schema, the focused 15-test set passed; two full coverage attempts aborted in the previously documented Windows GLib `g_system_thread_free`/invalid `CloseHandle` fault at `examples.test.ts`. Those attempts are not clean gates. No dependency version, thread limit, or coverage threshold was changed to mask the fault. Existing lint warnings remain.

A final local non-coverage suite also aborted at `examples.test.ts`, reporting `GetQueuedCompletionStatusEx: (735) ERROR_ABANDONED_WAIT_0`. These Windows attempts did not complete a full offline gate. Logs are `.dogfood-widget-final-coverage.log`, `.dogfood-widget-final-coverage-retry.log`, and `.dogfood-widget-final-test.log`; the successful focused/package logs are retained separately.

Hosted validation subsequently passed on both the release candidate and merged
code: **1,758 passed, two skipped, zero failed**, functions **94.75%**, lines
**93.30%**. The portable package and both macOS architectures passed too.
[Merged-code CI](https://github.com/matthew-kissinger/kiln/actions/runs/34070595879).
The Windows fault remains unresolved; a successful Linux run is not its repair.

## ChatGPT integration

The private tunnel and connector are named **Kiln Local**. They use an outbound OpenAI Secure MCP Tunnel and expose only dedicated collection roots, not the user's other project directories. The MCP child does not inherit the tunnel's API key. The native authoring and refinement skills are installed, and a separate distributable plugin package is bound to the registered connector ID. The private assets and connector configuration are excluded from the code publication.

Both native skills were updated with `kiln_present` guidance through the ChatGPT skill editor, preserving their reference files. The authoring detail preview showed the saved new guidance. The refinement detail preview returned a host file-load error, while reopening its editor showed the persisted complete updated source; this preview inconsistency remains a host-side verification limitation.

The scanner asset is `a_eb0228e498f5462b897453d802c1fc30`. Its original is `r_b67dbd53f0364abb8d511fee5cbd4c7b`, copied to personal; its refined child `r_6c4b1ee212b74b9cac78a48cf222e9e0` is in project. The child moves the handle grip outward by 7 mm. It has 840 triangles, 19 meshes, and six materials. The independent replay verified both revisions.

`kiln_present` rendered the scanner and the more detailed WAYFARER recorder inside the actual ChatGPT conversation, using a self-contained MCP App resource and widget-only binary metadata. The recorder was copied from the separate Codex dogfood collection without rebuilding; it was not generated by ChatGPT. Its source attribution is preserved.

Download results must be described separately: ChatGPT returned `Method not found` for standard `ui/download-file`, and its optional `uploadFile` helper rejected GLB and ZIP as unsupported file types. A host-owned delivery URL now provides a fallback and the local endpoint returns exact bytes with attachment headers. ChatGPT displayed its external-link confirmation, but the embedded-browser download handoff did not complete reliably. A native download event was not verified there. A browser media-download attempt navigated the iframe and hit its frame security boundary; that is not a successful download test. No frame or browser security setting was weakened.

The unedited viewer preview is local at `.dogfood/chat-ui/recorder-viewer-downloads-pending.png`. The launch folder was located at `tmp/launch-kit` (including draft posts and gallery grids), but the preview has not been promoted there as a successful download demonstration. A temporary one-hour HTTPS relay for only the recorder GLB and editable ZIP is prepared. Automatic approval review rejected starting/testing the local relay with only `blocked by policy`; specific user approval for the temporary external exposure is pending. Nothing has been exposed publicly by that relay.

See [ChatGPT setup and packaging](chatgpt.md) for the reusable workflow and [collection semantics](collections.md) for the persistence and download contract.

## Closeout and remaining work

The owner authorized documentation, commit, push, and deployment, then asked to
finish with the download experiment documented. The temporary relay is deferred;
no account permission change is needed to publish the code. The automatic tool
review supplied no reason beyond `blocked by policy` for that separate relay action.

- Finish a real ChatGPT GLB and editable-ZIP download test before claiming native
  delivery. A temporary public relay remains a proposal, not a verified solution.
- After successful delivery, capture the actual chat and add it to
  `tmp/launch-kit/G-chat-mcp` with accurate author/model attribution. The existing
  local preview shows viewing only and remains outside launch-ready media.
- Review recorder/orrery candidates with the owner before gallery promotion.
- Recheck the ChatGPT refinement skill detail preview; its editor saved correctly
  but the host preview failed to load.
- Track the unresolved Windows native GLib fault. A fresh isolated examples run
  passed 75 tests and 592 assertions in 33.47 seconds during closeout; this does
  not explain the earlier full-suite crashes. Hosted CI supplies an independent
  full gate for the release candidate.
- Wait for Google's requested revalidation of six old duplicate URLs; see
  [Search Console findings](site-indexing.md).

The release also fixes plugin-check diagnostics contaminating the JSON package
receipt consumed by macOS CI. A regression failed before moving those diagnostics
to stderr and passed afterward. Canonical/sitemap consistency has a focused check.

The closeout package smoke passed on Windows with a parseable JSON receipt;
typecheck, lint, and the site build passed. A further local coverage run aborted
with `ERROR_ABANDONED_WAIT_0` during CLI render-mode tests rather than examples
(`.dogfood-release-coverage.log`). The fault is not confined to the example file.
No speculative runtime mitigation or relaxed gate was introduced.

## Publication receipt

[PR #54](https://github.com/matthew-kissinger/kiln/pull/54) merged as
`c15413ae32bec296d02acd38160c8971341adcbd`. The
[Pages deployment](https://github.com/matthew-kissinger/kiln/actions/runs/34070595924)
succeeded for that code. Live HTML referenced the same `index-xZWkf3qz.js` bundle
as the local build; the chat section was present, and all three crawler files
returned 200. README and site distinguish verified chat viewing from unverified
native attachments. No dogfood asset or private tunnel configuration was published.
