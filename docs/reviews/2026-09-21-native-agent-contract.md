# Native agent contract for the unified workflow

Historical design for S01. The canonical loop is now implemented; see the
[current checkpoint](../plans/2026-09-22-progress-checkpoint.md) for implementation
and remaining live-provider qualification.

`runKilnAgent` remains the public invocation seam: a constructed Strands model and
an asset prompt, with optional host context. CLI `generate` constructs the selected
provider asynchronously and supplies its local evaluator, source store and renderer.
An embedded host may supply its own ports. Normal CLI/MCP consumers do not install
Strands. The native harness invokes shared tools directly rather than spawning an
MCP server to talk back to itself.

## Inputs and ownership

One run belongs to one task/asset lineage. Optional `requirements` is a validated
host binding and is snapshotted before the run. Source metadata cannot replace it.
Unbound runs use neutral requirements. A changed brief is a host store operation
with recorded history, followed by evaluation under the new binding.

The host supplies or owns `programStore`. A fresh run may omit it and receive an
in-memory store for the invocation. Cross-run source references require a retained
store. Refinement accepts one retained `existingProgramRef` or initial `existingCode`,
never both. Inline initial source is imported once; subsequent tools work with
immutable references. Results include source text for direct callers and its canonical
reference, but serialized results do not smuggle a store capability into JSON.

The run options must forward the complete relevant `KilnToolContext`, including
execution/capture limits, cache identity, renderer requirements and asset-library
capabilities. The old hand-picked forwarding list loses context and should be retired.
Legacy category/intent and tool-surface switches produce explicit migration errors;
there is one supported native workflow. Retained historical comparison data does not
make an old tool surface callable in a current run.

## Tools and completion

Shared program-reference definitions provide Discovery, source reads, validation,
render, edit, part inspection, animation and interior views. A host with an asset
library may also expose the shared save/asset/export/present tools. Hosts without
that capability do not advertise unusable delivery tools. Schemas, descriptions and
execution live in the central registry; Strands only adapts content blocks and hooks.

The native-only terminal tool is `kiln_finish({ programRef })`. Its definition also
belongs to the registry. It selects an exact retained revision after evaluation.
It cannot accept a fresh full-source payload, an unknown reference, an unevaluated
revision, a result from another requirements binding or an evicted artifact record.
An eviction tells the model to render that reference again. The private artifact
record is bounded and stores source identity, requirements receipt, exact GLB bytes,
QA and associated review evidence. It is a host capability, not model-supplied JSON.

Completion returns the same retained bytes and source that were evaluated. There is
no implicit final optimization pass that changes the artifact after review. A host
wanting another export transform runs and qualifies it explicitly. A successful
terminal call stops the loop without requiring another billed model turn, including
at the final admitted call. Batch handling must prevent terminal completion from
racing a conflicting operation.

Model completion and acceptance are separate. A result says whether the model
finished, a bounded run yielded partial work, or execution failed. It separately
carries QA acceptance and current image fidelity. An incomplete requested obligation
cannot become a successful accepted asset through terminal selection. A partial
checkpoint remains retrievable and explicitly partial. Old code-buffer salvage does
not silently promote a changed, unevaluated revision or discard the original error.

## Prompt, budgets and traces

The initial context teaches the frame, source contract, exact-reference workflow and
compact Discovery entry. Domain knowledge comes from optional recipes and requested
requirements, not a mandatory prop/vehicle/architecture classification. The shipped
authoring/refinement skills remain the maintained guidance; native bootstrap adapts
their terminal/delivery responsibilities without embedding a second geometry manual.

The harness owns model-call admission, time/cancellation limits, prompt compaction
and trace collection. Tool results expose actionable diagnostics and exact source,
policy and artifact identity. Compaction preserves active references, requirements,
current failures and the distinction between current versus older image evidence.
The tool loop and post-loop artifact presentation retain separate renderer deadlines.

Explicit model/provider and reasoning selections are preserved. The authorized live
lane is OpenRouter `google/gemini-3.8-flash` with high reasoning and a total campaign
ceiling of $10, bounded by available credit. Provider preflight and offline wire
tests are prerequisites, not evidence that the live authoring loop already works.

## Qualification

Use the real Strands harness with scripted models first: initial Discovery/source,
render/edit/reference selection, invalid/ambiguous edits, separate assets, changed
briefs, failed rendering, capped partial work, exact-last-call finish, cancellation
and restart. Verify delivered source/GLB identity and image fidelity across native,
CLI and MCP. Then use the authorized live route and mine traces for actual context,
tool ordering, warnings, errors, repairs and costs. Preserve failed attempts. Final
held-out qualification remains separate from development fixtures and trace tuning.
