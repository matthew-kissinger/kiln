# Linux full integration gate — 5 September 2026

**Passed:** 1,720 tests, two existing skips, zero failures; 47,174 assertions across
194 files in165.57 seconds. Function coverage95.60% and line coverage92.55% exceed
the unchanged92%/91% ratchet. Toolchain validation, frozen dependency installation,
typecheck and lint also passed. Lint retains14 warnings and11 informational findings.

[Final receipt](linux-fullgate-2026-09-05/final-receipt.json),
[full test/coverage log](linux-fullgate-2026-09-05/final-coverage.log),
[LCOV](linux-fullgate-2026-09-05/lcov.info), and
[native dependency versions](linux-fullgate-2026-09-05/native-versions.log).

## Exact execution boundary

The engine identity is
`sha256:dffc31aa0b40c68acb7cfda3cd818d010a0fd1979cf604ac1a420be97913fe75`,
source hash `a664884bdce4d3fc78c66a79c492ef722a85031bf62f037aa0384223507450ea`.
The immutable847-file source snapshot has archive SHA-256
`5eff0a9a3db9cecb05a64685be476f1e02e8795e39e885c6c4b36a12d9ae63e7`;
its [manifest](linux-fullgate-2026-09-05/snapshot.json) binds every input file.
Later gallery/document changes are not silently included in this gate.

A Docker Linux x64 container extracted the read-only input archive into its writable
filesystem and installed native Linux dependencies with `bun install --frozen-lockfile`.
No host `node_modules`, credentials or provider configuration were mounted. Limits
were two CPUs and3GiB memory. No live model or GPU calls were made. The commands
match the existing Linux CI gate: toolchain, install, typecheck, lint and ordinary
`bun run test:coverage`. No test skips, retries, custom LCOV merge or isolation flags
were added to get a pass.

Pinned runtime inputs:

- Node22.23.1 bookworm image:
  `node:22.23.1-bookworm-slim@sha256:6c74791e557ce11fc957704f6d4fe134a7bc8d6f5ca4403205b2966bd488f6b3`.
- Bun1.3.14 binary from official image:
  `oven/bun:1.3.14@sha256:e10577f0db68676a7024391c6e5cb4b879ebd17188ab750cf10024a6d700e5c4`.
- npm12.0.1 installed inside the image only. Derived image:
  `sha256:bbdb0107f548dc2f03d411b82d2c296b042e910b9043d991ffad9cb16854acf6`.
- Linux native sharp0.35.3 / libvips8.18.3 / GLib2.89.1. Windows used GLib2.89.0;
  that difference is recorded, not established as the cause of its native fault.

The [Dockerfile](linux-fullgate-2026-09-05/Dockerfile) and
[runner](linux-fullgate-2026-09-05/runner.mjs) preserve the invocation details.
The final container exited0 and was removed.

## Failure found and fixed before the final pass

The first full Linux gate completed without a native crash but failed one evaluation
harness test:1,718 passed, two skips, one failure. In a fresh pilot run allowing one
tool call, the transport recorded request sequence1, while its handler recorded
sequence2 and rejected the first call as over budget. A focused Linux rerun reproduced
this mismatch. The implicit AsyncLocalStorage sequence was unavailable across that
SDK dispatch, causing the handler's fallback to increment the count again.

The evaluation harness now reserves the sequence by explicit JSON-RPC request ID
and removes that association when sending the response, including schema-error
responses. There is no fallback double increment. The original restart-budget
expectation remains unchanged. A new real concurrent-client test verifies two calls
consume exactly two reservations and a third is refused. All three focused harness
tests pass on both Windows and Linux.

Only `scripts/evaluation/server.ts` and its test changed between Linux snapshots.
The shipped engine/bundles and package identity did not change for this harness fix.
The [initial failure](linux-fullgate-2026-09-05/initial-coverage-failure.log),
[focused red](linux-fullgate-2026-09-05/pilot-red.log),
[transport reservation](linux-fullgate-2026-09-05/pilot-red-requests.jsonl),
[incorrect handler counter](linux-fullgate-2026-09-05/pilot-red-events.jsonl), and
[focused green](linux-fullgate-2026-09-05/pilot-green.log) are retained.
An earlier temporary runner identity-print typo failed before any tests ran; its
[setup receipt](linux-fullgate-2026-09-05/setup-wrapper-failure.json) is also retained.

## Windows limitation remains

Two small affected-file groups passed with shared and isolated Bun globals, but
neither reproduced or repaired the repeated Windows GLib native crash. A separate
fixture confirmed that Bun's isolation resets JavaScript globals while reusing the
native process; it was not adopted as a claimed native fix. The Linux gate establishes
successful execution on the existing CI platform. It does not claim Windows/Bun
native teardown is fixed. Windows end-user Node package checks remain separate,
and native Mac checks are deferred to community execution as directed by the owner.
