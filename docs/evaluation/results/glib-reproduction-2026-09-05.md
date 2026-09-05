# Windows GLib reproduction — 5 September 2026

**Unresolved native fault; not reproduced in this bounded investigation.** Three
attempts ran: two passed and the last was stopped at its 55-second limit before
completion. The third attempt is neither a passing test nor evidence of a native
crash. No runtime or dependency change was made.

## Original failure

The retained concurrent coverage run aborted on entry to `examples.test.ts` with:

```
GLib-ERROR ... glib-2.89.0/glib/gthread-win32.c: line 420
(g_system_thread_free): error The handle is invalid. during CloseHandle (wt->handle)
error: script "test:coverage" exited with code 9
```

The complete [original log](glib-reproduction-2026-09-05/original-crash.log) is
preserved byte-for-byte, SHA-256
`14a51267d2341a4e2563380a0ab750cbd44d07375ef542eb0882c188e42d43df`.
A subsequent quiet full gate had passed 1,709 tests, two skips, zero failures in
165.31 seconds. That retry did not explain or repair the native failure.

## Environment and method

Windows 11 Pro x64, OS build `10.0.26200`; Node `22.23.1`; Bun `1.3.14`;
sharp `0.35.3`; libvips `8.18.3`; GLib `2.89.0`. Node launched the bounded runner;
Bun executed the example tests and companion image worker. Both Node's version
inventory and the Bun worker reported the same native dependency versions.
The [receipt](glib-reproduction-2026-09-05/receipt.json) retains the full inventory.

Each attempt executed only `bun test src/__tests__/examples.test.ts`, with
`KILN_RENDER=cpu` and `KILN_SPIKE_LIVE=0`. That test already evaluates every example
concurrently through its internal `Promise.all`; this is not a serial single-asset
microbenchmark. No model calls or GPU captures were started. The parent reserved
this lane for CPU testing; light browser/site metadata activity was possible, so
this is not an instrumented idle-machine benchmark.

Attempts 2 and 3 added one owned Bun/sharp worker: four concurrent 512-square RGBA
create/resize-to-384/PNG jobs per batch, followed by a 30 ms pause, for at most
45 seconds. Each completed 627 batches / 2,508 image operations. This supplies
controlled native image-processing contention; it does not reconstruct the exact
original full-suite process history or prove that host contention caused the fault.

| Attempt | Extra workload | Result | Elapsed |
| --- | --- | --- | --- |
| 1 | None | 64 passed, 559 assertions, exit0 | 41.478 s |
| 2 | Controlled image worker | 64 passed, 559 assertions, exit0 | 51.803 s |
| 3 | Controlled image worker | Host stopped test at deadline; no completed test summary; no GLib signature | 55.381 s |

Total runner time was about 149 seconds, within the three-attempt / three-minute
budget. Logs for [attempt1](glib-reproduction-2026-09-05/attempt-1.log),
[attempt2](glib-reproduction-2026-09-05/attempt-2.log), and
[attempt3](glib-reproduction-2026-09-05/attempt-3.log) are retained. Exact runner and
image-worker sources are beside the receipt; their original paths were
`tmp/glib-reproduction-runner.mjs` and `tmp/glib-image-worker.mjs`. No unrelated
process was stopped. All owned test/image processes ended.

## Disposition

Keep the native crash in known limitations. The investigation produced no matching
native failure and no proven engine bug, so it does not justify changing Kiln,
thread counts, sharp versions or GLib versions speculatively. The timed-out repeat
also prevents a claim that this workload is consistently fast under contention.

If the native signature recurs, capture the failing process's native stack/dump
and exact workload history, then isolate a small reproduction before choosing a
runtime/dependency mitigation. A repeat of the full suite solely to search for the
fault is not part of this completed bounded investigation.
