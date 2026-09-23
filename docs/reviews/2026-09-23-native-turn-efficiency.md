# Native harness turn and context review

The 30-turn native failure is not enough evidence that Strands intrinsically
takes too many turns. Thirty was our campaign driver limit, not an SDK limit.
The matched handrail brief already exceeded it in one successful OpenCode run.

| Recorded harness/model | Initial authoring | First edit | Second edit |
| --- | ---: | ---: | ---: |
| OpenCode CLI, Muse Spark contributor (Main04) | 48 | 12 | 17 |
| OpenCode CLI, Go DeepSeek Flash (Main20) | 28 | 11 | 16 |
| OpenCode MCP, Go DeepSeek Flash (Main33) | 22 | 10 | 7 |
| Native Strands, free Ling (trial05) | 30, capped without artifact | Not run | Not run |

Counts are recorded model-step completions, not individual tool calls, hidden
reasoning steps or provider retries. Models, runtime versions and transports
differ, and OpenCode also exports and saves files. These are observed workloads,
not a controlled harness ranking. Eighteen later reviewed main trials with the
same receipt convention have a median initial count of 29, range 22–70; eight
exceed 30. Their edit medians are 10 and 9. Earlier records are not silently
included in that aggregate.

Trial05 used 42 tools: 18 Discovery calls, eight reference reads, one skill
activation, two validations, five attempted renders, six edits, one source read
and one renderer check. Nine model turns preceded its first validation. It read
the same geometry-reference prefix twice. Input context grew from 15,391 to
54,071 reported tokens. The stop was the turn cap, not context overflow.

Two repair problems were material: F235 advice was delivered and the model fixed
its color-first material call. It then passed an unawaited geometry Promise to
`createPart`, whose useful library advice was lost across the evaluator boundary
(F238). Zero renders succeeded. Raising the cap alone would give that guessing
loop more room.

## Implemented corrections

- F238 preserves closed part-argument advice through CLI/MCP/native workers.
- F239 makes the native adapter honor the registry's existing text presentation,
  as MCP already does. Discovery no longer repeats structured entries and their
  formatted copy in the native result. Long truncated presentations use complete
  structured data; unknown-ID suggestions remain visible on both transports.
- The native prompt asks for references needed by the current step, reuse of
  loaded spans, pagination of unread content and batched exact contracts.
- Failed anchored edits now point to the current `kiln_source` tool.

An offline replay of all 18 recorded Discovery inputs through the actual SDK
adapter and compiled MCP gives equal text. Serialized content falls from 89,978
to 40,354 characters, a **55.15% reduction**. This measures response size, not
tokens or live completion improvement. Evidence:
`C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/native-context-review/receipt.json`.
The comparison input/count record is `harness-turn-comparison.json` in the same
campaign root. Original traces remain unchanged.

## Next bounded comparison

Keep the same brief, free model, renderer requirements and exact-artifact finish
contract. Use a declared 60-turn initial / 24-turn edit trial ceiling, retaining
the existing deadline and price guard. This is an experimental campaign budget,
not a new library default or a claim that 60 turns is optimal. Record first
successful render, calls before construction, duplicate retrievals, successful
repair, context growth, final geometry and protected edits. A successful finish
alone does not establish quality or isolate the effect of each change. If the
route keeps failing, use the already authorized Gemini comparison rather than
continuously expanding its budget.

The current SDK documents turn/token limits, lifecycle hooks and preserved
history after budget exhaustion in its [agent loop guide](https://strandsagents.com/docs/user-guide/sdk/agents/agent-loop/).
It also supplies [context offloading](https://strandsagents.com/docs/user-guide/sdk/plugins/context-offloader/)
and an experimental [context strategy API](https://strandsagents.com/docs/user-guide/sdk/context-management/).
We have not blindly enabled broad offloading: current view images must remain
visible, and introducing retrieval calls for already bounded helper contracts
can increase turns. The measured adapter mismatch and repair feedback are the
first corrections. Any broader context policy needs its own image, source-ref,
budget and fresh-run evidence.


The pre-Trial06 checkout gate was 2617 pass, two skips, zero failures;
coverage remains 95.18% functions / 92.21% lines. Runtime is
`sha256:32ec68d1201628d1f8901099a4640726e05b894dc4ea82fd17885dd8f0ca7b21`.
Trial06 subsequently failed at 60 turns with 71 tool calls and no reviewed
artifact. The [complete trace audit](2026-09-23-native-trace-audit.md) records the
failure sequence, verified clean-room context and remaining native context work.
It reached missing-UV QA after repairing asynchronous geometry, then stalled on
source edits. The larger cap did not qualify the native workflow. The subsequent
native-only workflow skill passes the 2620-test gate, with two skips and zero
failures (95.19% functions / 92.21% lines). Trial07's alternative free Inkling
route was rejected upstream before any tools ran, with no charge. It supplies no
evidence about model uptake of the new context. See the trace audit for current
runtime identity and the verified separation from external CLI/MCP workspaces.
