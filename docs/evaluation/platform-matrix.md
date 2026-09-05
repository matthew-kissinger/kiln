# Package platform checks

## Tested runtime candidate — 5 September 2026

The actual `@kiln/engine` 0.6.0 candidate installed without development dependencies
and passed all 15 distribution checks on Windows and Linux x64. Both used Node
22.23.1 and npm 12.0.1, with spaces and Unicode in install/workspace paths.

| Platform | Result | Exact receipt |
| --- | --- | --- |
| Windows x64 | 15 checks passed | [Windows](results/windows-package-0d457e8f-2026-09-05.json) |
| Linux x64 | 15 checks passed | [Linux](results/linux-package-0d457e8f-2026-09-05.json) |
| macOS | Deferred to community verification | No support-validation claim |

The exact tarball SHA-256 is:

```
0d457e8f8763730079da013abfa6662aadc02843f090fcae594c0f711399d16c
```

CLI and MCP bundle hashes, and original/edited source references, match across the
two receipts. The check covers packaged plugin manifests; direct Node and npm CLI
entry points; `kiln-init`; CSG and UV WASM; CPU PNG; source references from another
working directory; the packaged Node worker; MCP discovery; reference edits with
images; source persistence across restart; and exact source export.

The final two checks exercise `--capture` from the installed CLI: a JSON recipe
selects two part-relative views and produces a 332×168 PNG; changing a camera changes
the image; the exported GLB remains byte-identical; camera-only export reports
reuse of the evaluated build. These checks pass a saved reference, not source code.

No providers or GPU services were called by these package tests. They verify the
CPU distribution workflow, not GPU setup, model quality, or an operating-system
sandbox for untrusted source. Actual GPU evidence is tracked in the camera guide
and model-run receipts. The Windows install is retained outside the checkout; the
Linux container was removed after its JSON receipt was retained.

## Linux environment and reproduction

The Linux container uses two CPUs, a 2 GiB memory limit and this pinned official image:

```
node:22.23.1-bookworm-slim@sha256:6c74791e557ce11fc957704f6d4fe134a7bc8d6f5ca4403205b2966bd488f6b3
```

With Docker running, from the repository:

```sh
node scripts/smoke-package-linux.mjs /absolute/candidate.tgz /absolute/receipt.json
```

The wrapper mounts only the tarball and smoke scripts read-only, installs npm 12.0.1
inside the temporary container, and verifies platform, versions and the tarball
hash. It may download the pinned image and dependencies. It installs nothing
globally on the host and publishes nothing.

## Earlier candidates and failures

The earlier 614b1c9e candidate passed its then-current 13-check smoke on
[Windows](results/windows-package-614b1c9e-2026-09-05.json) and
[Linux](results/linux-package-614b1c9e-2026-09-05.json). Those receipts remain
historical evidence; they do not cover the subsequently added camera-file export.

The [first candidate](results/linux-package-initial-entry-failure-2026-09-05.json)
ran directly through Node, but the npm CLI symlink skipped its entry point and
exited without help output. The
[next candidate](results/linux-package-init-entry-failure-2026-09-05.json) exposed
the same error in `kiln-init`. Both guards now compare resolved filesystem paths.
A focused regression exercises linked entries and verifies direct imports stay
inert; the final Linux package check exercises actual npm symlinks successfully.

The capture check also rejects a missing shortened subject name with the canonical
reason and confirms recovery using an exact returned part path. This closes the
CLI diagnostic gap seen during the Muse run. The three model recertifications
remain attributed to package `833b9bf1`; the final package only adds that CLI error
message. MCP, worker, agent runtime and provider bundles are byte-identical. See
the [package delta receipt](results/cli-diagnostic-delta-204f1a7d-2026-09-05.json).
