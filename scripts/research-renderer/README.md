# Renderer architecture probes

These scripts are isolated research prototypes for [the architecture report](../../docs/reviews/2026-09-21-renderer-architecture.md). They do not change the engine, its dependencies or a running service on port 8000. Temporary installations are retained for review. No providers, credentials, paid services or deployment commands are used.

Use Node 22.23.2, npm 12.0.2 and Bun 1.4.2. Pass the path to npm's `bin/npm-cli.js` explicitly. Public registry access is needed for fresh installations and metadata; offline variants use a cache populated earlier in the run.

```powershell
node scripts/research-renderer/run.mjs --npm-cli <path-to-npm12/bin/npm-cli.js> --output <layout-receipt.json>
node scripts/research-renderer/baseline.mjs <path-to-npm12/bin/npm-cli.js> <baseline-receipt.json>
```

The layout receipt names every fresh `serviceDir`. Use a successful installation for the remaining probes:

```powershell
node scripts/research-renderer/probe-boundary.mjs <serviceDir> render-service/test/fixtures/material-channels-v1.glb <boundary-receipt.json>
node scripts/research-renderer/probe-ipc.mjs parent <serviceDir> render-service/test/fixtures/material-channels-v1.glb <ipc-receipt.json>
node scripts/research-renderer/probe-failures.mjs <serviceDir> <failure-receipt.json>
node scripts/research-renderer/profile-startup.mjs <serviceDir> <startup-receipt.json>
node scripts/research-renderer/inspect-native.mjs <installed-node_modules/webgpu> <native-receipt.json>
```

`probe-boundary` opens an ephemeral loopback port and launches only its own owner, renderer and observer processes. It kills those processes on completion. It intentionally reproduces the current owner-exit failure and records it instead of treating it as a passing shared-lifecycle test. `probe-failures` injects fake WebGPU acquisition results into unchanged service source and labels them simulated. Direct and IPC probes explicitly exit isolated native processes; they do not prove graceful product shutdown.

Prototype CPU imports are only markers. The full Kiln package, actual CPU asset export, other GPU vendors/platforms, read-only installations, unprimed offline installation and a second remote device need their own qualification.
