# Contributing to Kiln

Small fixes, clear bug reports, examples and documentation improvements are welcome.
For a behavior bug, include a minimal `.kiln.js` program, the command or tool call,
and the error or image you saw. Include your OS, Node version and whether rendering
used CPU or GPU. Remove credentials and private paths from shared logs.

## Work on the engine

Read [AGENTS.md](AGENTS.md) and the [README](README.md). Contributor checks use Bun
1.3.14, Node 22.23.1 and npm 12.0.1. End users only need Node/npm for a built package.

```sh
bun install --frozen-lockfile
bun run check:toolchain
bun run typecheck
bun run lint
bun run test
bun run test:coverage
```

For behavior changes, first add a focused failing test, then make the smallest fix
and run the relevant checks. Keep the coverage thresholds. Ordinary tests use CPU
rendering and make no model calls. Live provider tests are optional and can spend
credits; they are not required for a documentation or platform contribution.

Rebuild the runtime bundles after changing the CLI, MCP server or evaluator:

```sh
bun run build:runtime
```

Try the result in a separate authoring workspace:

```sh
node scripts/create-workspace.mjs ../kiln-test-assets --harness opencode
```

Choose your installed harness and follow the generated `START.md`. The directory
must be empty and outside the engine installation. Setup copies project-local
skills and configuration without changing global agent settings or authentication.

In a pull request, describe the problem, resulting behavior and checks you ran.
Keep generated source examples and their provenance together. If you change a
public tool, update its shared registry definition rather than duplicating a
transport-specific definition.

## Check a built package

```sh
bun run build:runtime
npm pack --ignore-scripts
npm run test:package -- --tarball /absolute/path/to/the-generated-package.tgz
```

Use the actual filename printed by `npm pack`. The check installs runtime
dependencies in a temporary directory and exercises the packaged CLI, MCP server,
workspace setup and exports. It uses npm registry access but makes no model calls
and publishes nothing.

## Help verify macOS

Windows and Linux have recorded package checks. The [Mac setup guide](docs/install.md)
is documented, but native Apple Silicon and Intel verification is still pending.
This is a community contribution opportunity, not a release blocker.

If you have a Mac, try the built-package workflow and report the package hash,
macOS version, Node/npm versions, architecture (`node -p process.arch`) and package
check result. A small PR fixing a reproduced installation issue is useful; a clear
passing or failing receipt is useful too. CI already contains native jobs for both
architectures. No model generation or paid provider account is needed.

Keep CPU package verification separate from Apple GPU/Metal testing. A successful
installation does not establish GPU support. There is no need to install a new
global skill set or copy authentication files to contribute either check.
