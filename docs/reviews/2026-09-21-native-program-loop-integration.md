# Native program-reference integration checkpoint

The canonical `runKilnAgent` path now constructs the shared program registry and
invokes it directly through Strands. It has a compact, category-free bootstrap,
lazy Discovery, immutable source references, edit/read/inspect/animation/interior
tools and one terminal `kiln_finish`. Collection tools require a supplied library.
Legacy category/intent and surface selection fail before model invocation.

The native terminal definition lives in `src/tools/registry.ts`, rather than in
the Strands skin. A private artifact store retains up to eight reviewed revisions
within a 64 MiB serialized-data budget. It copies exact GLB bytes, current host
requirements, diagnostic PNGs and review evidence; eviction preserves separately
stored source. Selecting an unknown, unevaluated, evicted or differently bound
revision fails with guidance to render again. Returned snapshots cannot mutate
retained bytes. Finalization never performs another bake or implicit optimization.

Completion and acceptance are independent. A completed loop may honestly report
incomplete requested checks. A capped or cancelled loop returns only reviewed
partial work, with its original reason and exact reference. It cannot turn an
unreviewed changed draft or final assistant text into an artifact. An SDK
`AfterToolsEvent.endTurn` hook stops successful completion without an additional
provider call, including the last admitted call. Mixed terminal batches are
rejected before any tool runs.

The canonical loop forwards the host context and snapshots requirements before
asynchronous work. Refinement accepts retained references or imports initial code
once. The renderer's shared deadline/validation boundary now also accepts caller
cancellation and aborts its owned port request. The native loop passes its signal
to evaluation and views; cancellation cannot retain a just-cancelled review.
Final presentation and in-loop rendering retain separate timeout settings.

Additional concrete delivery defects were fixed. CLI generation previously passed an
unused `maxSteps` field, leaving `--max-steps` ineffective. It now passes a real
shared call budget. CLI/library generation also rebuilt source after the loop,
with the library applying implicit optimization. Both now deliver retained bytes.
CLI partial work uses a `.partial.glb` destination, separately named previews, and exits 2. Source paths append `.kiln.js` when the requested output has no GLB extension; source no longer overwrites the just-written artifact. The source and
artifact result explicitly report the selected reference and completion state.

Focused tests use the real Strands harness with a scripted model, not a simulated
loop: Discovery/render/finish, exact-last-call completion, terminal batch rejection,
capped partial work, retained-reference edits, requirements incompleteness and
renderer cancellation. The CLI test runs a real subprocess with an offline harness
fixture that refuses a missing budget or another source evaluation. Store tests
cover eviction, binding mismatch, binary diagnostics and detached returned buffers.
Provider usage and final presentation tests remain offline; no inference was paid
for at this checkpoint.

The old `surface.ts`, native tool factories and mutable-buffer concurrency guard
are removed. Reader/media tests now invoke shared tools on explicit immutable
references. They preserve material contracts, view-fidelity history, exact camera
shots, part isolation, interior views, observer substitution and deadlines. Parallel
edits produce independent revisions and leave the base intact. Terminal batches
remain serialized. Native tests cover cache token accounting, candidate callbacks,
refinement context, recovery from a rejected batch and rejected final-text source.

The old automatic grade-refinement module and thinking A/B runner are retired.
They belonged to the removed loops and rebuilt source with implicit optimization.
Runtime-cost metrics remain in reviewed results. Explicit refinement replaces
post-finish mutation; historical experiment reports retain their historical meaning.
The native example and engine guide now describe current construction and delivery.

Still open: complete neutral domain QA, stronger trace collection and independent
run/restart fixtures, optional-provider setup diagnostics, fresh installed-package
checks and the authorized live/dogfood campaigns. The older exported prompt API
and category-era benchmark records still need their separate retirement/migration
pass; the native loop no longer consumes their generation prompt variants.

Broader offline cutover checkpoint: 2,187 passed, four skipped, 23 failed across
2,214 tests in 264 files (53,813 assertions, 129.28 seconds). Lint and type checking
passed. The 38-test count reduction versus the prior checkpoint is obsolete
surface-selection, mutable-buffer factory and post-completion grade-repair
coverage retired with those implementations; shared capabilities were migrated
and native completion/concurrency coverage was added. The remaining failures are
domain QA integrations. None was reclassified as a pass. Runtime identity:
`sha256:87c14588b024f85614ab20f8af96ea405a89afc158307a256e2b089c3e33cbe3`.
This checkpoint precedes the subsequent neutral placement-kernel change.
# September 22 checkout qualification of H02

H02 is implemented at the checkout boundary. `makeKilnNativeTools` directly adapts
shared registry callbacks to SDK tools; it does not call MCP or the CLI.
`runKilnAgent` creates a fresh default program store, artifact store and view history,
or uses an explicitly injected program store. Discovery is called on demand.

The real SDK loop with a deterministic offline model completed discovery, rendering
and terminal submission. A second run could not read its source reference and
failed before any model call. A deliberately injected store supported retained-source
review; another empty injected store again failed before model dispatch. The injected
evaluator ran exactly twice. Receipt:
`C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/native-store-isolation-receipt.json`.

Existing tests cover host render-port/deadline forwarding, typed image/JSON media,
requirements propagation, cancellation of in-flight rendering, exact terminal
artifact identity, refinement and concurrent finish/render rejection:
`program-loop.test.ts`, `tools-context.test.ts`, `tools-media.test.ts`,
`tools-unified.test.ts`, `run-surface.test.ts` and `concurrency.test.ts` under
`src/agent/` (the loop tests are under `__tests__/`). They are included in the final
checkout gate recorded in the current checkpoint. No SDK patch or new native
implementation was needed for this qualification.

This establishes native execution behavior with the installed SDK. It does not
establish live-provider reasoning, provider image forwarding or an installed-package
user flow; those remain separate tasks. Store isolation here means separate host
source state, not an operating-system security sandbox.
