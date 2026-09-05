# MCP cancellation CI investigation — 5 September 2026

Publication CI run `33994572734` failed the cancellation integration test's final image assertion.
The cancelled request returned `CANCELLED`; the failure concerned the later valid request.
Adding a structured-result assertion exposed `ok: false, error: "Evaluator worker failed."`.

The original focused test passed once on Windows and once on Linux. A bounded ten-run Linux
reproduction failed eight times. A separate five-run diagnostic trace failed four times and retained
the child events: the cancelled worker closed with `SIGKILL`, then a subsequent valid worker exited
with status 1 after `EPIPE` writing to fd3. The parent received zero response bytes. The cancelled
worker's close preceded the next spawn, so adding a delay was not an evidence-based correction.

This is a **Bun 1.3.14 Linux subprocess limitation that remains unresolved**. No production evaluator
code was changed, no retry was added, and no failed worker output was accepted. A preliminary
container-lifecycle experiment was invalidated and excluded from these results.

The same original MCP sequence passed ten times with Node 22.23.1 and the installed worker. The
integration test now exercises the shipped Node runtime. It builds its MCP probe and evaluator
worker into an isolated temporary directory, so CI does not require a pre-existing `dist` build.
CI already provisions the pinned Bun and Node versions before running the tests.

The test still sends a real MCP cancellation notification to an actual subprocess. It now also
observes the worker's spawn, requires the `CANCELLED` outcome, verifies `SIGKILL` process closure
and PID disappearance, and only then submits a valid request. That request must return both
`ok: true` and a real image. Process events provide the synchronization; there are no sleeps or
test retries. Existing Bun failure, strict-response, cancellation and deadline tests remain intact.

Validation:

- Revised Windows focused test: 1 pass.
- Revised pinned Linux test, ten bounded repetitions: 10 pass, 0 fail, 11.96 seconds.
- Existing Bun pipe and Node worker recovery checks: 7 pass, 0 fail.
- Typecheck and focused Biome check: pass.

Full-suite verification belongs to the root release gate. The runtime/package identity is unchanged
by this test-only correction.

Evidence: [Bun child-event trace](mcp-cancellation-ci-2026-09-05/bun-linux-trace.log),
[original scenario under Node](mcp-cancellation-ci-2026-09-05/node-linux-original-scenario.log),
[revised Node integration test](mcp-cancellation-ci-2026-09-05/node-linux-test.log).
