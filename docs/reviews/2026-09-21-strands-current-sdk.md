# Current Strands integration

Checked 2026-09-21 against official documentation, published package metadata and
the installed TypeScript implementation. S02/S04/S05/S09 remain under qualification.

## Foundation and version

The maintainer dependency is pinned to `@strands-agents/sdk` 1.18.0, and the optional
peer minimum is 1.18.0. The upstream repository is now `strands-agents/harness-sdk`;
the old repository's latest-release redirect is not a reliable version source.
[TypeScript 1.18.0 release](https://github.com/strands-agents/harness-sdk/releases/tag/typescript/v1.18.0).

Decision: retain the SDK's `Agent` as Kiln's native foundation. The newly published
`@strands-agents/harness` 0.1.0 is a configurable assembled harness whose defaults
include shell/file/web/subagent tools and context management. Kiln's native loop
needs direct domain tools, its evaluator boundary and terminal exact-artifact
selection. Replacing the factory would add defaults we would then disable, without
an established improvement. This is an architectural judgment, not a comparative
quality benchmark. No harness package was added.
[Official factory configuration](https://strandsagents.com/docs/user-guide/harness/reference/configuration/).

## Standard SDK responsibilities

- `Agent.invoke(input, { cancelSignal, limits })` owns cancellation and per-invocation
  turns/output-token/total-token limits. Kiln returns the SDK `stopReason` separately
  from its `finished`/`partial`/`failed` state. SDK limits apply between turns, after
  the preceding tool batch; they are soft token bounds, not hard cost reservations.
  [Lifecycle controls](https://strandsagents.com/docs/user-guide/sdk/agents/lifecycle-controls/).
- `AgentSkills` and `Skill` own skill parsing, metadata and progressive activation.
  The docs explicitly leave resource access to host tools. Kiln snapshots selected
  local text references and exposes a read-only paged reader through its registry.
  The model can select snapshot keys, not arbitrary paths. A file is capped at
  256 KiB, total snapshot text at 1 MiB, and file count at 128. Missing/invalid skill
  configuration fails before dispatch. No subprocess/shell tools are added.
  [Skills and resource access](https://strandsagents.com/docs/user-guide/sdk/plugins/skills/).
- Typed `Model`, `Tool` and `InvokeOptions` replace casts at the agent seam. Native
  tools still consume Kiln's common registry. SDK `sandbox: false` is explicit:
  Kiln's generated source runs through its injected evaluator, and no SDK built-in
  shell/file tools are installed.
  [Sandbox configuration](https://strandsagents.com/docs/user-guide/concepts/sandbox/).

Kiln retains domain-specific hooks for exact-artifact completion, conflicting tool
batches, shared cross-role call admission, usage and stale-render-image removal.
These use public hook APIs, not SDK internals. Per-invocation limits cannot replace
a budget shared with observer/refinement work. Invalid explicit call ceilings now
throw instead of turning into unlimited dispatch.

The new context presets are experimental. Their default broad truncation or
summarization is not equivalent to removing superseded render pixels while keeping
source references, QA receipts and the user's reference image. Retain the tested
image-only hook for now. Adoption of broader strategies requires trace/cost and
restart tests, especially where summarization makes additional model calls.
[Official strategy presets](https://strandsagents.com/docs/user-guide/sdk/context-management/presets/).

## OpenRouter compatibility boundary

Installed OpenRouter 2.10.0 speaks AI SDK LanguageModelV3, as required by Strands
1.18.0's VercelModel. OpenRouter 3.1.0 targets AI SDK 7 and is not a drop-in V3
upgrade. Do not cast incompatible provider protocols merely to use a newer version.
[Provider changelog](https://github.com/OpenRouterTeam/ai-sdk-provider/blob/main/CHANGELOG.md).

`openrouter-conformance.test.ts` now sends offline SSE through the actual provider
and Strands packages. The unadapted stream still omits `stream-start` and fails with
`Stream ended without completing a message`. The narrow existing adapter adds that
required event; a complete tool loop then preserves arguments, returned tool text,
final text and aggregate usage (40 input / 20 output tokens in the fixture).
Retain the adapter only while this reproduction holds. No SDK monkey patch,
alternate agent loop or silent model/provider fallback was introduced.

## Evidence and remaining work

Focused checks cover all SDK limit reasons, invalid SDK limits, exact final-call
completion, cancellation of owned rendering, shared-call budget rejection, skill
activation/reference read/Discovery/render/finish, immutable reference paging,
path selection, UTF-8, size/depth limits and symlink rejection. A strict fixture
also checks that SDK skill names match their containing directories.

These are offline integration checks, not live model quality evidence. Provider
reasoning/cache/image wire checks, optional-dependency isolation and existing
concurrency tests remain part of the gate. Installed-package, restart and live
OpenRouter trace qualification remain open. No paid call was made for this review.
