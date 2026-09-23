# Requirements surface integration checkpoint

This is implementation evidence, not final package or whole-initiative qualification.

The evaluator now uses V2 request/result envelopes and V2 public execution symbols.
Focused protocol tests first failed on the old version, then passed with strict old
envelope rejection. Request correlation, bounded response decoding, policy-aware
cache validation and current requirements receipts remain enforced.

Tool contexts accept a host binding. The evaluation path snapshots it before calling
an asynchronous evaluator. Independent bound contexts can evaluate identical source
without mixing task/lineage identity. Registry construction rejects legacy category
or intent policy. Validation identifies its syntax/sandbox scope; render, derivative
review and inspection return the source evaluation receipt separately from visual
fidelity. A derivative uses the evaluated binding through its asynchronous capture.

The public inspection API accepts the same binding. Saved asset build options retain
the full requirements context and a canonical source-hash checkpoint. Restore and
revision check checkpoint/source agreement and require a current host binding whose
history extends the saved lineage. A new host explicitly restores the checked binding
through its store; importing a manifest alone cannot activate it. A restore always
requests reevaluation, including when its host has the same effective policy.

Evidence: `src/tools/__tests__/registry-requirements.test.ts`,
`src/requirements-assets.test.ts`, `src/evaluator/protocol.test.ts`, existing actual
MCP save/restore tests and derivative review tests. The surface/inspection group
passed 23 tests with 127 assertions; the filesystem save/restore and actual MCP group
passed five with 66 assertions. Type checking and repository lint passed after this
integration checkpoint.

CLI render/save/restore now accepts an explicitly selected, validated host binding
file and reports the resolved policy. The old category flag fails with migration
guidance. An actual subprocess test exercised CLI save, rejected unbound restore,
authorized restore, source rendering and old-policy-file rejection. The CLI restore
previously imported source directly; it now delegates to the shared tool. The
evaluator/cache/store group also passed 84 tests with 368 assertions across 17 files,
including subprocess execution and pipe-failure cases.

The native loop subsequently migrated to the same requirements context; see the
[native integration evidence](2026-09-21-native-program-loop-integration.md).
The standalone MCP server now accepts `--requirements <host-binding.json>`, using
the same bounded UTF-8 reader as the CLI. It validates startup options and policy
before workspace/renderer startup, rejects the retired category flag and unknown
options, and holds the binding fixed for the session. Actual Node stdio tests
verify binding retention after the selected file changes, ignored source policy
claims, and enforcement of a requested missing clip. Six compiled CLI/standard-MCP
mechanism/opening cases agree; their receipt is in external
`neutral-mechanisms-standalone/receipt.json`. This closes P06 implementation.

Still open: complete domain-rule migration, qualified activation of explicit
old-manifest conversion proposals, live native acceptance and installed-package
qualification. Bound registries are scoped
to one task/asset lineage; a host serving independent briefs must construct separate
contexts. This is not a mutable global current-asset policy or a new model-selected
requirements input. No imported history is claimed to prove cryptographic authorship.
