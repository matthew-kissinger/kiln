# Install Kiln for your coding agent

Use a built Kiln package with Node.js and your existing coding agent. You do not
need Bun, a source checkout, or a separate model API key to use the CLI/MCP tools.
Bun is needed only when building Kiln itself.

Download the `.tgz` package from [GitHub Releases](https://github.com/matthew-kissinger/kiln/releases),
or build one using the contributor steps below. npm registry publication is separate;
do not run an unpublished registry command.
Windows and Linux package receipts are recorded in the [platform matrix](evaluation/platform-matrix.md).
The macOS setup below is documented but has not been verified on native Apple
Silicon or Intel hardware. Native verification is welcome from the community and
does not block this release. CI jobs are configured for both architectures; see
[how to contribute a platform check](../CONTRIBUTING.md#help-verify-macos).
CPU package setup and optional GPU support are separate checks.

## Start on a Mac with a local package

Install Node.js from the [official download page](https://nodejs.org/en/download).
The pinned package-test runtime is Node **22.23.1**. Use native ARM64 Node on Apple
Silicon, or x64 Node on an Intel Mac. Check what this terminal is running:

```sh
node --version
npm --version
node -p "process.platform + ' ' + process.arch"
```

The last line should say `darwin arm64` or `darwin x64`. The npm supplied with Node
can install the package; contributor CI pins npm 12.0.1 for reproducible receipts.
You do not need to change global npm or install Homebrew for this workflow.

Choose a permanent installation directory and use the real tarball filename:

```sh
mkdir -p "$HOME/Developer/kiln-install"
cd "$HOME/Developer/kiln-install"
npm init -y
npm install "/absolute/path/to/kiln-engine-VERSION.tgz" --omit=dev --include=optional
npm exec --offline -- kiln-init ../my-assets --harness codex
cd ../my-assets
node kiln.mjs --help
```

Choose your harness from the table below, then follow `START.md` in the new
workspace. The setup creates project-local configuration and copies the skills.
Your source and revisions live in `my-assets`; the installed engine stays in
`kiln-install`. No global skills or agent configuration are changed. Keep the
installation in place while using its workspaces.

CPU images work without a GPU service. Start there to verify the connection.
They show geometry and flat color; use [GPU rendering](rendering.md) for material
review. Apple GPU/Metal operation is also unverified; a CPU package result would
not establish GPU support.

Kiln uses `sharp` for image work. Its upstream distribution includes native macOS
ARM64 and x64 binaries, installed through optional dependencies; keep those enabled.
Install dependencies on the Mac rather than copying `node_modules` from another
OS or architecture. The standard prebuilt path should not require a compiler or a
separate libvips installation. If installation instead tries to compile native code,
check the Node architecture and npm optional-dependency settings before adding a
build toolchain. See [sharp's installation guidance](https://sharp.pixelplumbing.com/install/).
Manifold CSG and xatlas UV unwrapping are shipped WASM dependencies and are exercised
by the package smoke alongside the native image dependency.

## Install from the repository

```sh
git clone https://github.com/matthew-kissinger/kiln
cd kiln
bun install --frozen-lockfile
bun run build:runtime
node scripts/create-workspace.mjs ../my-assets --harness opencode
```

Setup checks that the Node runtime, bundles, dependencies and selected skills are
available before writing the workspace. It does not install an agent or sign in on
your behalf. Open the generated `START.md` for the selected harness's launch steps.

The destination must be empty and outside the installation. Authoring, refinement
and QA skills are included. Add scene composition and batch dispatch when needed:

```sh
node scripts/create-workspace.mjs ../my-scene --harness codex --skills compose,batch
```

Skills are ordinary Markdown files with supporting resources. Ask the agent to read
`AGENTS.md` and the relevant skill; a special skill loader is not required. Setup does
not change global skills, configuration, or authentication.

## Install a local package

Contributors can build an installable tarball without publishing anything:

```sh
bun run build:runtime
npm pack --ignore-scripts
```

Install the resulting `.tgz` in a separate installation directory using npm. The
package includes the Node entry points and workspace setup; npm installs their
runtime dependencies. The build includes a separate worker and deterministic bundle
metadata. It does not need the original checkout or its devDependencies.
Use the actual tarball path and filename returned by `npm pack`:

```sh
mkdir kiln-install
cd kiln-install
npm init -y
npm install /absolute/path/to/kiln-engine-VERSION.tgz --omit=dev
npm exec --offline -- kiln-init ../my-assets --harness opencode
```

`kiln` renders programs and imports/exports source revisions. `kiln-init` creates a
workspace. These are installed package commands, not currently published npm
package names. Library exports remain TypeScript source for Bun or a compatible
bundler; ordinary Node callers should use the CLI/MCP bundles. The optional
`kiln generate` adapter is separate and needs its agent/provider dependencies;
connecting an existing harness does not load that stack.

## Choose a harness

| Harness | Project configuration | Launch from the workspace |
| --- | --- | --- |
| Claude Code | `.mcp.json` | `claude` |
| Codex | `.codex/config.toml` | `codex` |
| OpenCode | `opencode.json` | `opencode` |
| Antigravity | `.agents/mcp_config.json` | `node agy.mjs` |
| Hermes | Separate `.hermes/config.yaml` profile | `node hermes.mjs --ignore-rules` |

Sign in to your harness and accept its normal project/MCP trust prompts. Hermes's
separate profile needs its own authentication or provider credentials supplied
through the environment; setup does not copy credentials. The Antigravity launcher
sets the absolute project directory and disables automatic skill expansion in print
mode. Name `kiln_workspace` in the brief, use the project skill copies, and pass
absolute task-file paths. See [clean-room setup](clean-room.md) for evaluation controls and limitations.

## Verify the connection

Ask the agent to read `AGENTS.md`, discover geometry helpers, render a small draft,
read its source, edit it by `programRef`, and export the accepted revision. Check the
actual tools and files, not only the agent's final message. CPU rendering needs no
model key or GPU; [material-faithful rendering](rendering.md) requires the optional
GPU service and a successful fidelity result.

The CLI and MCP configuration point to the same `.kiln/programs` directory. Follow-up
calls use immutable source references, so the model need not retransmit its program.
[Source and revision semantics](programs.md).

## Move or repair an installation

Generated configuration records absolute runtime paths. Setup resolves the Node
executable to its real path, so temporary version-manager
shell links are not saved in MCP configuration. If you remove that Node version,
run repair using the replacement Node installation. Repair also updates workspaces
created by older setup versions that saved a temporary shell path.

After moving the runtime or workspace, close its agent session and run setup from
the current installation:

```sh
node /current/kiln/scripts/create-workspace.mjs /absolute/my-assets --repair
```

For an installed package, `npm exec --offline -- kiln-init /absolute/my-assets --repair`
works from its installation directory. Repair checks `.kiln/workspace.json` and
updates generated launchers/configuration. It preserves source revisions, asset
files, instructions and skill copies. It refuses to replace configuration you edited;
update those paths manually while preserving your changes. Restart the harness.

Repair does not upgrade the copied skills. For an evaluation of a new Kiln version,
create a fresh workspace from that candidate so instructions and tools match. Keep
exported `.kiln.js` files as portable checkpoints even when retaining the source store.

## Manual MCP configuration

Launch the installed `dist/mcp-server.mjs` over stdio using an absolute path. Choose
an explicit store shared with your CLI:

```json
{
  "mcpServers": {
    "kiln": {
      "command": "node",
      "args": ["/absolute/path/to/kiln/dist/mcp-server.mjs"],
      "env": {
        "KILN_PROGRAM_STORE": "/absolute/path/to/assets/.kiln/programs",
        "KILN_RENDER": "auto"
      }
    }
  }
}
```

The table above names each client's native configuration location; their JSON/TOML
shapes differ. Prefer generated configuration. Without an explicit store, the server
uses `.kiln/programs` beneath its process working directory.

The Claude plugin manifest also launches the Node bundle. A plugin clone alone does
not establish that its runtime dependencies were installed: verify tool discovery
and a render before considering that path ready. Use project setup when the host
cannot install the plugin's dependencies.

## Verify a distribution as a contributor

```sh
bun run build:runtime
npm run test:package
```

This explicit smoke test may download dependencies from npm. It makes no model calls
and publishes nothing. It packs the current files, installs without devDependencies
in a temporary directory, tests CSG and UV WASM, CPU images, MCP discovery, reference
editing, persistence across restart, and exact source export. It retains a JSON
receipt and artifacts at the printed path. Normal unit tests do not run npm installs.

To test an existing package instead of packing the checkout, run
`node scripts/smoke-package.mjs --tarball /absolute/candidate.tgz`. For Linux, run
`node scripts/smoke-package-linux.mjs /absolute/candidate.tgz /absolute/receipt.json`
with Docker running. See the [recorded Linux package check](evaluation/platform-matrix.md)
for the pinned image, exact candidate hash, coverage, and limitations.

CI builds one tarball on Linux, then runs the same npm package smoke natively on
`macos-15` (ARM64) and `macos-15-intel` (x64), with Node 22.23.1 and npm 12.0.1.
The Mac jobs install no contributor dependencies and do not set up Bun. Their
retained receipts include the tarball hash, native architecture and completed
checks. These versioned runner labels follow [GitHub's runner catalog](https://docs.github.com/en/actions/reference/runners/github-hosted-runners);
GitHub maintains the underlying images, so the labels are not immutable OS images.
A configured job is not a passing platform receipt: Mac support remains pending
until these jobs run successfully.

## Embed the tools

```ts
import { createKilnProgramToolRegistry } from '@kiln/engine/tools';
const tools = createKilnProgramToolRegistry();
```

Definitions include the schema, implementation and image extraction. Forward image
content as well as text. An embedded registry uses an in-memory store unless the host
injects a persistent `ProgramStore`. See [the library reference](architecture.md).

## Evaluation limits

Local CLI/MCP builds run in a separate process by default, with a 60-second deadline,
16 MiB GLB cap and 32 MiB response cap. The Node worker has a 512 MiB V8 old-space
heap cap; native/WASM buffers and total process memory are not bounded by that flag.
`KILN_EVALUATOR_TIMEOUT_MS` accepts 1 to 120000 and `KILN_EVALUATOR_HEAP_MB` accepts
64 to 4096 in the packaged Node runtime. Host callers can cancel through an AbortSignal.

`KILN_EVALUATOR_MODE=in-process` retains the trusted legacy path, with no hard
synchronous interruption. A separate process is not an operating-system security
sandbox. The isolated mode remains host-specific and requires its verified Linux
isolation setup.

Optimize and instancing options are sent explicitly to the worker. The legacy
`KILN_QA_MODE=observe|off` override is rejected in subprocess mode rather than silently
ignored; remove it or choose the trusted in-process mode deliberately.
