# Community exporter qualification

The candidate exporter is experimental. The existing production exporter remains the default until
the exporter and its downstream processing pass structural, visual, packaging, and real-consumer
checks. Passing glTF validation alone does not prove that authored features survived export.

## Repeatable existing-asset corpus

Run from the repository root with the pinned Bun toolchain:

```powershell
bun scripts/integration-corpus.mjs --self-test
bun scripts/integration-corpus.mjs --out tmp/exporter-corpus/baseline
$env:KILN_GLTF_EXPORTER = 'three'
bun scripts/integration-corpus.mjs --out tmp/exporter-corpus/candidate --compare tmp/exporter-corpus/baseline
Remove-Item Env:KILN_GLTF_EXPORTER
```

The runner exports every `examples/*.kiln.js` source twice with optimization disabled. Use `--input`
for a separate authoring workspace, `--filter` for a filename substring, or `--limit` for a smoke run.
It invokes no image renderer and no live model. Corpus geometry export is independent of CPU/GPU
view rendering; use GPU rendering in the separate visual qualification.

Each output directory contains the retained GLBs, source and output SHA-256 hashes, semantic
signatures, and an incrementally written `results.json`. A failure, nondeterministic repeat, or
signature difference causes a nonzero exit status. A missing baseline is an error, not a pass.
Run the baseline with the default exporter before enabling the candidate. Output hashes establish
repeatability within a backend; different binary hashes across exporters are expected and are not
used as the compatibility verdict.

Signatures cover named hierarchy paths, local/world matrices, undeformed world bounds, vertex
attributes, index topology, morph targets, skin joints and inverse bind matrices, node extras,
material assignments and core PBR factors, decoded texture pixels, extension names, and animation
channel targets/keyframes. Numeric arrays are rounded to six decimal places. The built-in self-test
checks serialization invariance and detects transform corruption, material changes, and vertex
changes that leave bounding boxes unchanged.

### Interpretation limits

- Differences need classification. Equivalent primitive reordering or deduplication can produce
  differences, while extension presence alone does not prove every extension parameter survived.
- This is a static structural comparison. It does not evaluate skin deformation, sampled animation,
  shader fidelity, texture sampling/UV transforms, material-variant mapping, or GPU instancing.
- PNG/JPEG texture pixels are decoded. KTX2/Draco/meshopt packaging is outside this uncompressed
  interchange corpus and needs a codec-aware qualification suite.
- Every source receives a generic prop intent so that the exporter comparison uses identical
  settings. These results are not category-specific authoring QA certification.
- Existing examples supplement focused fixtures and independently authored dogfood. They do not
  establish support for features absent from the corpus or prove imports in every engine.

## Baseline evidence

The unchanged main checkout completed `bun run test` on 2026-09-15 UTC: **1,943 passed, 4 skipped,
0 failed**, across 221 files, in 125.10 seconds. Skips were Windows permissions/symlink checks and
two pre-existing generated-skill checks. Local log:
`C:/Users/Mattm/X/kiln-oss/tmp/exporter-corpus/baseline-tests.log`.

Candidate evidence must be recorded separately from this unchanged-main baseline. No release
conclusion follows from the baseline alone.

The initial default-exporter corpus completed all **86 existing example sources**, each exported
twice: **172 exports, no failures, all byte-repeatable**. Retained evidence is under
`tmp/exporter-corpus/baseline/` in the migration worktree. This run began before the candidate
integration was loaded; subsequent candidate runs compare semantic signatures against these files.

## Initial candidate and default-preservation results

On the migration branch, both the explicit `legacy` backend and experimental `three` backend
completed all 86 sources twice (344 additional exports), with no export failures and byte-identical
repeats within each backend.

- **Branch legacy:** all 86 semantic signatures and all 86 GLB SHA-256 hashes match the
  pre-integration baseline exactly. This includes the shared extension-registration change.
- **Candidate:** 45 signatures match exactly; 41 show material changes. Across the corpus the only
  reported difference categories are material-extension presence (500 per-material entries and 41
  document-level extension lists) and eight roughness values for unlit materials in `crawler-crane`.
  Forty affected assets gain `KHR_materials_emissive_strength`; `crawler-crane` gains
  `KHR_materials_unlit`.
  Their legacy fallback roughness was 1; the community export uses 0.9 plus `KHR_materials_unlit`.
- **No observed structural differences:** named hierarchy, local/world transforms, undeformed bounds,
  vertex attributes, index topology, animation channels, node extras, and decoded texture data match
  wherever those features occur in these examples. This does not establish coverage of all features.

These material changes preserve authored features absent from the legacy conversion, but they are
still appearance changes that need GPU/consumer qualification. They must not be silently relabeled
as exact parity. Retained results are `tmp/exporter-corpus/candidate/results.json` and
`tmp/exporter-corpus/branch-default/results.json`. The comparison command intentionally reports a
nonzero status when these differences exist; manual classification is recorded here separately.

## Browser qualification

The first direct browser bundle attempt exposed native Node dependencies reachable through the
candidate exporter (sharp and the native canvas library). The candidate now accepts an injected
host platform, with native browser decoding as its default. After that boundary change, a direct
browser bundle of `communitySceneDocument` and its fixture built successfully with no Node shims.

An isolated headless Chrome session executed raw RGBA and encoded PNG texture fixtures, each with a
named pivot and quaternion animation, twice. Both cases preserved exact decoded pixels, the animation
channel, and private-metadata filtering, and repeated byte-identically. Both final GLBs passed
Khronos validation with zero errors. An actual WebGL draw reported **ANGLE NVIDIA GeForce RTX 3070,
Direct3D11**, with software renderers explicitly rejected by the probe.

Local reproduction/evidence: `tmp/browser-export-audit/browser.ts`, `run.cjs`,
`browser-results.json`, `browser-{raw,encoded}.glb`, `verified.json`, and `browser-gpu.png`.
Each browser GLB was also reimported with Three.js GLTFLoader. GPU readbacks of the original and
reimported scenes at animation times 0, 0.5, and 1 second matched byte-for-byte for both texture
cases (six comparisons, maximum/mean channel differences both zero). This establishes parity for
the small textured cube/pivot fixtures, not the entire material portfolio or complete browser
authoring support.

## CLI worker qualification finding

The first Node 22.23.2 bundled CLI comparison found two boundary problems: a cache entry generated by
the legacy exporter was reused for the candidate request, and disabling the build cache still
produced legacy bytes because the sanitized worker environment did not carry the experimental
selection. These runs establish the legacy CLI baseline only. Candidate CLI acceptance requires
explicit worker configuration and exporter-specific cache identity, followed by a fresh test of the
rebuilt package. Environment selection in a parent process alone is not evidence of the worker's
actual exporter.

After those fixes, `scripts/exporter-cli-check.mjs` exercises the actual bundled entry point with
one textured, emissive, animated fixture in a fresh temporary workspace. Both exporters share one
disk cache directory. It requires a distinct first-build key and distinct GLB hash for each backend,
then requires each second run to hit its own key and return identical bytes. Run it with the
supported Node executable (or pass `--node <absolute-executable>`); it does not install a runtime or
rebuild the package. It prints and retains a receipt with runtime version and exact CLI bundle hash.

The gate passed on **Node 22.23.2** for CLI SHA-256
`a689760533a77bca67680512411e63104bf6b18d4c14b03d6d50d3e5fdda9bc5`.
Separately, the same bundle exported a procedural-texture fixture and the existing `robot-arm`
asset through both backends, twice each, with distinct backend keys and successful own-cache hits.
All eight outputs repeated within their backend; the four unique outputs passed Khronos validation
with zero errors. The robot retained five textures, one animation, and eight animation channels.
Texture-fixture signatures match; the robot differs only by two preserved emissive-strength
material extensions. Evidence: `tmp/browser-export-audit/final-verified.json` and
`reusable-cli-check.log`. These are Windows bundled-entry checks with installed repository
dependencies, not clean-install tests on other operating systems.

The final source snapshot was also rerun through both complete 86-asset corpora after worker/cache
changes: **344 exports, all deterministic, no export failures**. Final default signatures and GLB
hashes still match all 86 baseline assets exactly. Final candidate differences remain the same
41 material-only cases classified above. Evidence: `tmp/exporter-corpus/final-default/results.json`
and `tmp/exporter-corpus/final-candidate/results.json`.

### Rebuilt candidate identity

After the unmatched-animation diagnostic regression was fixed, the bundled CLI cache gate was
rerun on Node 22.23.2. It passed again with build identity
`5ab4a924cbcac4120e3e00de43416d42d284535e6259d028cb642c9dcb180dfb`
and verified CLI SHA-256
`c2119cae8205f047c0afce084a22a0aeb47415ad193715cad2f0c762ea2d384c`.
Both backend fixture hashes remain unchanged from the previous successful check, and each backend
created its own disk-cache key and reused it on its second invocation. Receipt:
`tmp/browser-export-audit/release-candidate-cli-check.log`.

Both complete corpora were rerun after that last fix: `release-candidate-default` and
`release-candidate-three` each contain 86 successful, deterministic cases (344 exports total).
Every semantic signature and every GLB hash matches the corresponding prior `final-default` or
`final-candidate` run. The advisory fix changes none of these valid existing-asset outputs.

## Release decision

### Authored-asset qualification

Four fresh OpenCode Muse Spark 1.3 Contributor Free assets exercised CLI creation, GPU review,
targeted edits and same-path output replacement: a sailing vane, textured coolant pump,
transparent compass and folding solar assembly. Initial author sessions used legacy conversion
because the subprocess did not receive the experimental selection. This was detected, corrected
with bounded host-option transport and cache separation, and rechecked; the initial sessions are
workflow evidence, not candidate-conversion evidence.

After that fix, all four sources were exported through both backends with the packaged Node
22.23.2 subprocess CLI and GPU8017/Dawn D3D12 on RTX3070. Sailing and assembly image comparisons
were byte-identical. Mean RGB differences were approximately 0.06015/255 for industrial and
0.01161/255 for instrument; maximum channel differences were 9 and 8. Both instrument views
show the same overly milky cover, so asset art quality is not represented as fully accepted.
An additional bounded Muse session made a targeted pennant edit with two actual candidate GPU
reviews and repeated same-path export. Author source snapshots and tool/renderer receipts were
retained outside the checkout.

Blender 5.2.0 LTS and Unity 6000.2.3f1 Built-in RP/glTFast 6.20.0 imported the four actual packaged
candidate GLBs and passed source-derived pivot, material and sampled-motion expectations.
Unity's static-root filename policy was identified and recorded as an importer-specific mapping.
A built Windows Unity player ran these assets using Direct3D11 on RTX3070: 189 renderers, zero
unsupported/error shaders, and three intended joints moving through native Playables.

The separate technical corpus also imported twelve comparison GLBs into both applications,
covering colours, extra UVs, morphs, skin data, materials and clips. These receipts establish the
tested features only. They do not establish every shader extension, skin deformation, runtime
downloaded GLB shader inclusion, other Unity pipelines, or clean installations on every OS.

### Bugs found during qualification

- Explicit exporter selection was missing from worker transport and disk cache identity.
- Export texture clones shared their image source with the author scene.
- Community conversion bypassed legacy material-group partition validation.
- Transformed `THREE.Scene` roots needed a named Group representation.
- Unresolved advisory tracks could become invalid empty native glTF animations.
- Browser conversion needed a host-injected decode boundary instead of Node dependencies.

Each behavior correction has targeted coverage or a repeatable integration gate. The adapter
continues to reject unsupported lines/points explicitly and to filter metadata on export copies.

### Decision

The final local gate passed 1,961 tests with four intentional skips and zero failures.
Coverage was 95.18% of functions and 92.83% of lines, above the unchanged 94.00% and 92.10%
thresholds. Toolchain, skill checks, typecheck, lint, and all 45 render-service tests passed.
The final packaged Node 22.23.2 subprocess CLI reproduced all five reviewed dogfood GLBs
byte-for-byte. The existing exporter remains the default; this branch does not approve a
production rollout or a default-backend switch. Hosted CI results are reported on the PR.

Keep the default unchanged if any required qualification is incomplete or an unexplained
regression remains. Required evidence includes the complete engine gates, supported-platform
packaging, independently authored CLI dogfood with GPU reviews, actual Three.js/Blender/Unity
imports, animation and material checks, and a Unity player build. The engine/importer/version/render
pipeline combination must be named in results rather than claiming universal engine support.
