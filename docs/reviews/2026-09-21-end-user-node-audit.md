# End-user Node compatibility audit

Status: runtime separation is implemented with actual Windows checkout probes.
Cold installed-package and Debian/Cline qualification remain open. The current
implementation is described below; the later original audit notes are historical.

## Implemented runtime separation, September 22

The candidate declares `engines.node: ^20.15.0 || >=22.2.0`, without Bun/npm
consumer engine requirements. `toolchain.json` owns the unchanged exact maintainer
versions. The build packageManager pin remains Bun; receipt verification reads
exact qualification versions from the maintainer contract, not a consumer range.
Workspace setup, CLI and MCP share `src/runtime-support.mjs`. Optional native CLI
generation requires Node 22.2.0+ before loading the SDK/provider. Direct TypeScript
library consumers still need a loader/build system.

The installed declared dependency/required-peer closure has 68 core, six renderer
and 139 agent packages. All required dependencies resolve. Core and renderer engine
ranges accept 20.15.0, 20.20.2, 22.2.0, 22.23.2 and 24.0.0; the Strands SDK is the
agent lane's Node-20 conflict. Missing optional platform packages are recorded,
without claiming Linux/macOS installation success. This is installed metadata
evidence, not execution of every transitive module or a new installation.

`zlib.crc32` is the renderer API boundary: Node's versioned
[22.2 documentation](https://raw.githubusercontent.com/nodejs/node/v22.2.0/doc/api/zlib.md)
records its introduction, and the official Node 20.15.0 executable exposes and
executes it. The two-branch range avoids accepting Node 21 or early 22 through a
broad `>=20` declaration. This is API compatibility, not a recommendation to deploy
unmaintained Node releases. The lifecycle recommendation remains Node 22/24 LTS.

Official Windows Node 20.15.0, 22.2.0 and 24.0.0 archives were checked against their
official HTTPS SHA-256 lists; detached signatures were not checked. All three
execute setup, Discovery, source import, anchored edit, textured GLB rendering,
save/source recovery, three animation frames and actual stdio MCP rendering. GLB
bytes agree, including the embedded texture and one animation channel. Node 20.15
also starts/stops a private Dawn/D3D12 renderer and produces a reviewed full-material
image. Native generation on Node 20 fails with the intended version explanation;
the native bundle imports on Node 22.2 and 24 without inference. Bundled npm 10.7/11.3
version commands work; no npm installation was run.

Evidence: `C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/runtime-compatibility/`.
The before receipt retains Node 20 setup's old rejection. The first workflow proof
retains a harness mistake (`edit --json`, an unsupported flag). Corrected evidence
is under `qualified/receipt.json`, using runtime `49c2cf...d23f`. All probe services
are stopped. No provider calls, package creation, commit or publication occurred.
Cold installation, other platforms, the actual Debian/Cline flow and native live
generation remain open.

Full runtime-contract gate: 2537 pass, four skips, zero failures; 95.08% function
and 92.34% line coverage with unchanged thresholds. Log:
`%TEMP%/kiln-runtime-support-qualified.log`. The earlier two fixture/assertion
failures are retained in `%TEMP%/kiln-runtime-support-final.log`.

## Original audit and intermediate probes

The owner supplied community feedback: Kiln worked in Cline after the user installed Node 22 separately because their Debian installation supplied Node 20. The user plans to recommend Kiln in programming classes. The reporter's identity and Debian release/patch version were not provided; do not invent them or contact the reporter from this task.

The repository currently conflates release reproducibility with user requirements. Root `package.json` pins all three `engines` to Bun 1.4.2, Node 22.23.2 and npm 12.0.2. `scripts/check-toolchain.mjs` requires those exact values and forces user documentation to repeat the pins. `scripts/verify-package-receipt.mjs` also reads exact qualification runtime versions from `engines`. The workspace bootstrap separately checks only Node major >=22. Thus an ordinary newer Node 22 installation can disagree with package metadata even while passing setup.

Keep exact maintainer/release pins in a dedicated toolchain contract, and derive release checks/receipt assertions from it. End-user `engines` and setup diagnostics should express only supported runtime compatibility. A compatible npm version should not be rejected simply because it differs from the release receipt toolchain. Bun is not a prerequisite for installed Node CLI/MCP use.

The first installed dependency inspection found MCP client/server/ext-apps 2.0.0 require Node >=20, Sharp 0.35.4 requires >=20.9.0, and OpenRouter's adapter 2.10.0 requires >=18. The optional Strands SDK 1.17.0 declares >=22.0.0. Direct library exports ship TypeScript, whereas CLI/MCP ship compiled modules; compatibility of those entrypoints must be assessed separately. These are current manifest observations, not transitive-graph or execution proof.

The renderer now imports `crc32` from `node:zlib` in its PNG preflight. That is a concrete Node API to check against any proposed lower floor. Shader loading uses `node:module`'s `register`, not the newer `registerHooks`. Do not relax the root range while allowing an incompatible optional renderer to be silently treated as ready.

Upstream lists Node 20 as EOL and Node 22/24 as LTS on September 21, 2026. Runtime compatibility, distribution-provided security patches and recommended installation versions are distinct; a Debian report is not evidence that upstream Node 20 is currently supported. Source: [Node.js release status](https://nodejs.org/en/about/previous-releases), checked September 21, 2026.

Remaining N01 evidence: complete executed dependency closure and core API audit; actual minimum/newer Node prototypes; distribution/runtime availability; explicit capability support decision. N02–N04 then implement, qualify and document that decision. The final package must exercise setup, Discovery, source/edit/render/export and MCP on every claimed runtime boundary; Strands and native GPU checks retain their own requirements and receipts.

The architecture already has useful separation: `scripts/build-runtime.mjs` invokes pinned Bun with `--target=node --packages=external`, producing separate CLI, MCP, worker and agent bundles. `src/cli.ts` dynamically loads the generation bundles only for `generate`. Direct inspection found Strands imports in the agent bundles, not top-level imports in the CLI/MCP bundles. This supports keeping one official package with optional generation capabilities rather than forcing every external-agent user to install the native harness. Bun remains a maintainer build/test runtime; compiled Node consumers should not need it. Bun's [Node-target bundling documentation](https://bun.sh/docs/bundler#target) describes this build/runtime distinction.

The initial audit found eager provider imports, required OpenRouter dependencies and a Strands peer range starting at 1.4.0 despite development using 1.17.0. Those observations are historical. The September 22 checkout uses provider-specific dynamic imports; Strands, the OpenRouter adapter and the AI provider interface are optional peers. The Strands peer floor and installed development SDK are now 1.18.0. The provider-isolation tests cover absent unrelated vendor adapters. Full installed-package and runtime-boundary qualification remains outstanding; optional metadata alone does not establish it.

Use package metadata intentionally: npm's [current package.json documentation](https://docs.npmjs.com/cli/v12/configuring-npm/package-json/) distinguishes runtime `engines`, development `devEngines`, optional peers and optional installed dependencies. Optional native rendering may be attempted during normal installation; optional Strands peers should be requested only by users choosing that harness. A dependency marked optional still needs lazy imports and clear capability diagnostics. Separate packages become justified if independent release/runtime requirements cannot be represented cleanly and qualified; they are not required merely because source is modular.

An isolated feasibility probe used the official Node 20.20.2 Windows x64 archive, verified against its official HTTPS SHA-256 listing. The existing compiled CLI successfully performed ranked Discovery and CPU crate export (324 triangles, 1.02 × 0.90 × 1.02 bounds); current renderer PNG-preflight module import also succeeded. Thus `crc32` is available in that tested Node 20 patch and is not by itself a Node 22 floor. This was the earlier compiled integration checkpoint, not the final source/package candidate, a minimum-patch test, a fresh npm installation or a Cline run. Archive receipt and output remain under `C:/Users/Mattm/AppData/Local/Temp/kiln-node-compat-szcBle/`.

The authorized Strands lane has a separate preflight: the existing OpenRouter key is valid; live inventory contains `google/gemini-3.8-flash` with reasoning controls, and available credit permits the $10 campaign ceiling. No inference was invoked. Recheck credit and exact configured reasoning before runs. A new offline wire test reproduced a silent high-to-medium downgrade through the actual Strands Vercel adapter. Explicit effort keywords now pass unchanged regardless of output budget. The wire fixture sends the exact Gemini route, 16000 output tokens and high reasoning. The 37 provider tests passed with 127 assertions. Numeric reasoning-budget normalization is a separate retained contract, not evidence about effort allocation by every upstream vendor.

Current [Strands TypeScript setup](https://strandsagents.com/docs/user-guide/sdk/quickstart/typescript/) confirms Node 22+ and provider-specific installation. Its [Vercel adapter documentation](https://strandsagents.com/docs/user-guide/sdk/model-providers/vercel/) also separates the provider package from the harness. Installed SDK 1.18.0 itself has Bedrock runtime as a regular dependency; Kiln can avoid forcing the entire harness on core CLI/MCP users, but cannot honestly promise an OpenRouter harness install contains no AWS libraries. Avoid an unnecessary synchronous ESM loading constraint while separating providers: [Node's documentation](https://nodejs.org/download/release/latest-jod/docs/api/modules.html#loading-ecmascript-modules-using-require) limits `require(esm)` to synchronous graphs and documents when it became available without a flag.

The September 22 Node 20 replay uses runtime `sha256:5253a92023a9f3191af85d56393faaaff534427d7dabdef700f6441765e9e846` and the retained verified Node 20.20.2 archive. CLI capabilities, CPU rendering, and the new shared CLI animation sampler all succeed. An actual stdio MCP child under Node 20 also completes Discovery and renders a 12-triangle cube with one image. The original robot's animation returns three geometry-flat frames. The receipt is `C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/node20-animation-checkout/receipt.json`. This establishes current compiled-checkout feasibility with existing dependencies on Windows only. It does not qualify a fresh installation, minimum patch, optional GPU/Strands, Debian or Cline. No support range changed. Node 20 remains upstream EOL on the release-status page rechecked September 22.
