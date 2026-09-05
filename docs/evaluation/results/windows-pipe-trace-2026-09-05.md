# Windows/Bun worker pipe trace — 5 September 2026

Metadata-only temporary parent/worker instrumentation reproduced a response-pipe
ordering fault in 24 requests / 8.285 seconds. Production source was unchanged.
Bun1.3.14 ran the parent and worker on Windows; Node22.23.1 remains the packaged
runtime. No GPU, providers, credentials or generated source were logged.

Child31792 received284 request bytes, generated a162-byte EXECUTION_REJECTED
response and finished. Its parent received all162 fd3 bytes, then fd3 emitted
EBADF before process close. The unchanged production error policy immediately
settled WORKER_FAILED. The later close event reported exit0. This demonstrates
that a Windows/Bun response-pipe error can discard an otherwise complete worker
reply. Strict envelope decoding and successful process close remain necessary;
receiving bytes alone must not establish success.

Child11496 subsequently emitted fd3 ENOENT with zero response bytes and no worker
trace. Its stdin later emitted EBADF after the request was already settled. This
is not evidence of a recoverable response. Child42052 then returned the expected
rejection normally. Do not collapse arbitrary pipe errors into successful results.

The temporary diagnostic only deferred stdin EBADF; response-pipe errors still
used the unchanged production handler. The recorded full-response fd3 case is
therefore evidence for a narrowly scoped deferral experiment, not proof that any
production fix has been implemented. Runtime mutation requires a deterministic
regression and strict failure-path checks first.

[Parent events](windows-pipe-trace-2026-09-05/pipe-delivery-parent.jsonl),
[worker byte-count/outcome events](windows-pipe-trace-2026-09-05/pipe-delivery-worker.jsonl),
[request outcomes](windows-pipe-trace-2026-09-05/pipe-delivery-outcomes.jsonl), and
[original coverage failure](windows-pipe-trace-2026-09-05/original-coverage.log).
Temporary sources remain `tmp/pipe-delivery-{parent,worker,run}.ts`.

## Narrow fix and verification

A deterministic fake-process regression first reproduced the exact162-byte reply,
fd3 EBADF, close0 sequence against the unchanged implementation and failed with
WORKER_FAILED. The production change now defers only fd3 EBADF when the parent
is Bun on Windows. The existing close handler still requires exit0 and strict
complete-envelope decoding. Other stream errors, stdin EBADF and ENOENT remain
failures. There is no automatic program retry or relaxed expected outcome.

The new regression also covers truncated/malformed responses, nonzero exit,
cancellation, deadline, output limits, stdin/stderr EBADF, ENOENT/EACCES and the
Node/non-Windows guard. Together with real subprocess and adversarial tests,
13 focused tests /71 assertions pass; typecheck and focused formatting/lint pass.
The underlying Bun pipe behavior is not repaired; this narrowly accommodates its
proved complete-response ordering. Separate startup faults remain explicitly
unresolved and are not silently converted to success.

Node-based model workflows do not enter the new compatibility branch. Rebuilt
bundle bytes will nevertheless differ; any later package must record its own
identity and receive relevant offline checks, without a false byte-identity claim.
