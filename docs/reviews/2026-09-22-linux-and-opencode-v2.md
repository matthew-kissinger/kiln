# Linux and OpenCode V2 qualification checkpoint

September 22, 2026. These are checkout and harness observations, not packaged
release acceptance. No Kiln package was built, committed or published.

## Linux and second-device rendering

The user authorized the connected laptop. SSH alias `hub` reaches CachyOS Linux
(Arch family), x86_64, Node 22.23.2, npm 12.0.2, NVIDIA GTX 1660 Ti Max-Q with
driver 610.57.04. Work is isolated under
`/home/matthewk/kiln-qualification-20260922`; existing projects were untouched.
An archive of explicitly selected current source/bundle files was transferred,
without credentials or node_modules. It is a source transfer, not an npm package.

Observed install outcomes:

- `npm install --omit=dev --omit=peer` in the copied checkout failed with ERESOLVE:
  the root Anthropic development dependency 0.125.0 conflicts with optional
  Strands 1.18.0's peer range ^0.109.1. Omitting dev packages does not prevent npm
  from resolving their dependency tree. This was a real repository installation
  defect, repaired below without force/legacy-peer-deps.
- An isolated projection of the production manifest, retaining dependency,
  optional dependency and optional peer declarations but excluding root dev
  dependencies/scripts, installed 74 packages with npm and no Strands SDK.
  This narrows the conflict to the development graph. It is a controlled
  dependency experiment, not proof of an installed official package.
- A task-local Bun 1.4.2 production/frozen-lockfile install succeeded. The system
  Bun 1.4.0 was not replaced. That root install also pulled optional Strands peers;
  do not describe it as proof of the lean npm consumer graph.
- npm 12 blocked Bun's postinstall during the initial npx attempt. The trusted
  Bun package was installed into the task's tools directory and its documented
  install.js explicitly executed. No global script policy was weakened.

The unmodified checkout then completed generated workspace setup, offline
Discovery, subprocess GLB export and actual GPU rendering of the retained
main-04 handrail source. The six-view image was visually inspected: shaped rail,
directional wood grain, posts, plates and end caps are visible. This does not
re-qualify the original asset's attachment quality.

Windows also exported that exact source and sent its GLB to the laptop renderer
through an SSH loopback forward, using the ordinary `--render-port` interface.
Both hosts produced the identical GLB SHA-256:
`0525030bf8159b674b3264f50cdefcec15ffd4a72cd79eef2d927aba76bd76a3`.
Both receipts name the laptop's Dawn/Vulkan renderer and full-material fidelity
without degradation. The 1168x780 PNG files differ in encoded bytes but have
**identical decoded RGBA pixels**. This is real second-device evidence for one
asset. Authentication, cancellation, budgets, other platforms and cold official
package installs retain their separate acceptance requirements. CachyOS does not
establish Debian/Cline acceptance.

An attempted hand-start of the renderer returned EADDRINUSE because the earlier
managed service was still listening. The existing service was used; no other
service was killed or replaced. A later check found that PID and listener gone,
consistent with the current shared service's five-minute idle lifetime. Owner
exit alone is not a defect under that contract. The exact idle-exit timing was
not instrumented in this check.

Windows evidence directory:
`C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/linux-evidence`.
Linux install logs are copied there. The rendering trial's source/runtime identity is
`sha256:4dd42c4e91f3c702f66ee6bdaf00a379f2c152f7657041d0f8259a29a7b3212a`.

### npm dependency repair

The root development Anthropic SDK now pins **0.109.1**, satisfying Strands 1.18.0's
declared peer range. The prior peer-check exception was removed: successful mocked
wire tests cannot waive a package resolver conflict. The focused check first failed
against installed 0.125.0, then passed after manifest/lockfile alignment. All 44
nearby peer/provider/cache/reasoning tests pass.

The repaired full root manifest, including its development declarations, installs
in a fresh empty Linux directory with
`npm install --omit=dev --omit=peer --ignore-scripts --no-audit --no-fund`:
**75 packages, 13 seconds, no resolver override**. Evidence is
`linux-evidence/npm-peer-cold.log`; the target is
`/home/matthewk/kiln-qualification-20260922/peer-clean-install`.
This proves dependency resolution, not native postinstall or an official package
installation. Packaging was not performed.

The subsequent five-bundle build is
`sha256:24590dac888c5949788bbdb735086a3fcd23870793eb734e641f072ea7d0b180`.
Typecheck/lint/skills/toolchain checks pass; Bun 1.4.2 full tests:
**2567 pass, 4 skip, 0 fail; 62,245 assertions; 167.70 seconds**.
The earlier coverage result was not rerun for this dependency-alignment slice.

## OpenCode V2

The prior default was opencode-ai 1.18.30. The normal npm installation is now
the official `@opencode/cli@2.0.14`; `opencode --version` verifies it. A separate
1.18.30 executable is retained under the campaign's
`tools/opencode-v1/node_modules/opencode-windows-x64/bin/opencode.exe` for fixed
historical trials. Existing campaign inputs were not rewritten.

The [official migration guide](https://opencode.ai/v2/docs/migrate-v1/) requires
removing the package-managed V1 installation before V2 because both own the same
command. Existing supported configuration is normalized in memory. V2 introduces
intentional plugin and server-API changes.

A newly generated Kiln workspace is at the campaign's `opencode-v2-qualification`.
`opencode debug config` reads its MCP server and skills correctly. The initial
empty MCP catalog was traced to querying before connection completed and API calls
defaulting to the server's home directory. An explicit workspace location plus a
connected-server preflight returns the Kiln catalog and three authoring skills.
The workspace was explicitly upgraded to current runtime 24590d...b180.

Actual V2 provider-wire testing now preserves the image from an official SDK MCP
fixture. See the [cross-harness receipt](2026-09-22-mcp-image-cross-harness.md).
This qualifies image transport, not live-model Kiln authoring. A private task
server and isolated config were used; original setup failures remain in evidence.

The old campaign's `run --pure --dir` flags are absent from V2. Dispatch now uses
the process working directory and `--standalone --auto`; home-level instructions
can still apply and are not claimed isolated by that flag. Windows binary
resolution now follows PATH precedence, preventing a stale Scoop executable from
overriding the current npm shim. No scored old trial was silently resumed under V2.

Provider quota research is in
private operator inference research (not distributed). Updating the harness
does not establish a provider-quota reset.
