# Part-volume observations in neutral QA

The corrected solid-overlap analyzer now participates in the shared export path
used by CLI, MCP and the native harness. An asynchronous engine pre-pass supplies
measured evidence to the existing neutral QA runner. The runner shares the same
observation kernel as the historical rule and never constructs a category intent
or trusts an authored `partPenetration` declaration.

This remains an optional `observe` rule. Positive overlap can be intentional;
floating parts, flush contact and embedded joints are not rejected. Existing
policy can disable the observation, and the pre-pass then does no volume work.
Structural acceptance and measured overlap remain separate.

Reports include eligible parts, candidate pairs, pairs tested, skipped count,
whether the candidate count is only a lower bound, and a scope statement. When
analysis is truncated, skips unsupported geometry, or fails, the rule stays
`notEvaluated` and the visual-quality dimension also stays `notEvaluated`.
Available findings remain visible. An empty result from incomplete analysis is
not presented as proof of clear geometry. A fully measured static pair set still
does not certify intersections within one mesh, animation, intentional-joint
semantics, alpha/displacement appearance or usable passage space.

Six integration regressions cover reflected overlap, flush contact and floating
parts, open sheets, truncated work, disabled policy and unavailable analysis.
The first five failed before integration. The broader focused run passes all
47 tests, including policy compatibility. Policy selection now has nine neutral kernels eligible instead of
eight, with the same 27 registered rule IDs and unchanged modes.

Eight actual compiled CLI and standalone stdio MCP cases agree on complete or
partial coverage, findings and acceptance: overlap, one reflected operand, flush
contact, separated floating parts, an open sheet, instancing, the 64-pair limit,
and the unmodified fresh main30 coliseum. All eight GLBs are byte-identical to
the frozen pre-integration build. No geometry is repaired or altered by QA.

Three fresh campaign GLBs were also measured for cost: coliseum, lantern and
foliage took 77.5, 159.5 and 41.5 ms locally. All were partial under the existing
64-pair/representation limits. The coliseum's first 64 of 1,648 candidates showed
no solid overlap; that cannot rebut the independently measured gateway blockage.
The UI/model report now makes that incomplete coverage explicit. Timings are
single-run observations, not a guarantee for every Boolean input.

This closes the missing neutral adapter for this rule. It does not close all QA
calibration or requirements-applicability work. Reference-comparison and modular-
join adapters, broader physical constraints and fresh-model uptake remain separate
open requirements. Main31 stays frozen on the preceding candidate, so it cannot
be counted as model uptake of this integration.

Evidence under `C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/`:
`neutral-volume-review/receipt.json`, `neutral-volume-failing.log`,
`neutral-volume-focused-complete.log`, `intersection-campaign-cost.json` and
`neutral-volume-qualified-gate.log`. The original eight CLI/MCP responses and both
sets of GLBs are retained beside the receipt.

Full gate: **2,663 pass / 4 skip / 0 fail**, 95.19% functions / 92.34% lines.
Typecheck, lint and skills pass. The preceding full gate retained in
`neutral-volume-final-gate.log` exposed an old global-enforce fixture, corrected
to keep both geometry observations in observe mode. No enforcement was promoted.
Current runtime: `sha256:64b5de16741d671161119770c19ad06da736a2c866b55f42ef421b1748996245`. All five bundles rebuilt.
