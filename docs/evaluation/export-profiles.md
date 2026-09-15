# Export profile qualification, 2026-09-15

Scope: ordinary local asset generation, saved revisions, export delivery and native
glTF playback. No Tier 2 harness runs, model/provider calls, deployment, compression,
or changes to the exporter backend were used.

## Reproduce

Use the supported Bun 1.4.2, Node 22.23.2 and npm 12.0.2 toolchain:

```sh
bun install --frozen-lockfile
bun run build:runtime
node scripts/dogfood-export-profiles.mjs
# Optionally add a real local, embedded-PNG GLB as a second fixture:
node scripts/dogfood-export-profiles.mjs /absolute/path/to/asset.glb
```

The script creates a fresh temporary asset workspace against the checkout's built
runtime and leaves its outputs plus `export-profile-receipt.json` there. It prints
that path. The built `kiln_workspace` stdio MCP must answer a capabilities request
before source generation proceeds. This is deterministic source authoring through
the normal tools, not a model capability evaluation.

The small fixture has textured armor and a named articulated pivot. Its source is
retained, rendered, saved, exported as the default editable ZIP, and restored. Runtime
exports then exercise:

- Actual CLI paired files, default/explicit editable preservation, refused overwrites,
  binary-only import, refused source restore and refused second runtime transformation.
- Actual built MCP descriptors and `resources/read` bytes, with verified sizes/hashes.
- Actual built local viewer HTTP GLB/sidecar delivery, compared to those MCP bytes.
- Exact native JSON semantics outside the owned review field/provenance link, and exact
  bytes of every post-JSON chunk, including mesh/animation/texture BIN data.
- Three.js r186 `GLTFLoader` with real Sharp-decoded PNGs and native `AnimationMixer`
  playback. No sidecar is supplied to the loader; resource resolution rejects network access.
- Exact before/after node transforms at five times in every clip, canonical revision
  files unchanged, and Khronos glTF validation.

## Observed results

Windows x64, Node 22.23.2, Bun 1.4.2, npm 12.0.2, Three.js 0.186.0. Both fixtures
passed the complete script, with zero Khronos errors and zero warnings.

Offline gates passed: frozen install, toolchain, skills, typecheck, lint, runtime
bundle rebuild, 1,953 tests (4 existing skips), and 45 render-service tests. Coverage
passed at 95.40% functions and 92.88% lines, above unchanged ratchets. The package
smoke installed the actual tarball without development dependencies and exercised
CLI/workspace/MCP/edit/worker flows. The new `@kiln/engine/asset-export` TypeScript
entry also resolved from that installation under Bun.

| Fixture | Canonical GLB | Runtime GLB | Sidecar | Native clips / tracks | Compared poses | Decoded PNGs |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Generated demonstrator | 7,240 B | 7,188 B | 616 B | 1 / 1 | 5 | 1 |
| Jaeger v4, local real asset | 3,771,340 B | 2,102,176 B | 1,669,629 B | 16 / 359 | 80 | 8 |

The Jaeger **GLB alone** is 44.26% smaller: 1,669,164 fewer bytes. Its complete
GLB-plus-sidecar pair is 3,771,805 B, which is **465 B larger** than the canonical
GLB. The benefit is loading only the runtime GLB in an application and retaining
the review sidecar separately. No draw-call, triangle, texture-memory, or FPS reduction
is claimed. A small/static asset may get a slightly larger GLB.

Canonical fixture hashes:

- Generated demonstrator: `sha256:c0252c00f7c845766e00b2cec2ce390780aa1414305637755197bd53ecad1d7f`.
- Jaeger v4: `sha256:14155efa3ebef47839b70632c0b185557d743abcb99d00e2fa093ba75e3553e0`.

Runtime hashes depend on the saved asset/revision IDs and selected metadata filename.
Repeated export of the same revision and filename is byte-deterministic. The external
fixture is user-owned and is not included in this repository.

## Regression boundaries

Focused tests cover missing review metadata, multiple scenes, preserved custom/node
extras, immutable input bytes, unsupported owned metadata, malformed chunk lengths,
file integrity, unsafe sibling filenames, preexisting provenance, native animation
playback, CLI/MCP profile selection and resource delivery. Paired-write tests cover
partial staging failures, rollback after a later publish fails, existing destination
preservation and distinct output paths. Default generation, save, render and editable
export behavior continues through the ordinary full suite.

This establishes these local generation/export flows and sampled native poses. It does
not establish compatibility with every glTF consumer, GPU visual equivalence, or scene
performance. Arbitrary extras are preserved, not privacy-scrubbed. A process crash can
leave a complete orphan sidecar; the paired publication is not a power-loss transaction.

## Integration with the community exporter

PR #115 merged as `e1f1e3d6274ab0212c82b72333278548827d10f4`. The export-profile
candidate was combined with that main commit in an isolated worktree. The changelog
retained both entries, and every runtime bundle was rebuilt from the combined source.
No source-code conflicts were present. The final #115 documentation update produced
the same combined source and CLI/MCP/worker bundle hashes as the tested runtime.

Toolchain, skills, typecheck, lint and the combined engine suite passed: 1,977 tests,
four existing skips, no failures. A fresh package installation passed its CLI, workspace,
MCP, worker, source-edit and textured experimental-exporter checks. The ordinary
generation/export script passed separately with `KILN_GLTF_EXPORTER=legacy` and
`KILN_GLTF_EXPORTER=three`, including exact native JSON/BIN, decoded PNGs, standalone
playback and CLI/MCP/HTTP delivery.

The full Jaeger source was also replayed through the experimental exporter in a separate
asset workspace. Both native animation batches combined on their asserted identical
graph, and all 226 asset checks passed. Its runtime derivative passed the same delivery
script with 16 clips, 359 tracks, eight decoded PNGs and 80 sampled poses, with zero
Khronos errors or warnings. This replay produced a 3,771,324-byte canonical GLB and a
2,102,160-byte runtime GLB, plus a 1,669,629-byte sidecar.

An additional combined skin/morph fixture retained material extensions, double-sided
surfaces, vertex colors and sampled deformed vertices through runtime export, both
before and after full geometry optimization. Native JSON and BIN were unchanged outside
the documented metadata fields. Khronos reported no errors; the fixture's three existing
skin warnings were identical before and after delivery. Full optimization removed unused
UV channels before delivery, as expected; the runtime profile introduced no such change.

These features act at separate boundaries. The converter selects how source becomes a
canonical GLB; the delivery profile derives files from a saved revision. The established
converter and editable delivery remain the defaults. Runtime delivery neither enables nor
qualifies the experimental converter. Its native-canvas requirement, unsupported UV shear
cases and consumer-extension limits remain described in the
[community-exporter guide](../community-exporter.md).
