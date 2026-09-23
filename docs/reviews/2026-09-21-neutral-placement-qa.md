# Neutral placement QA checkpoint

`inspectPlacement` extracts the existing scale/base measurements from the prop
category evaluator. Current QA invokes it with explicit requested bounds and/or a
grounding plane. No category or fake `AssetIntentV1` is synthesized. The remaining
old-data conformance wrapper calls the same measurement function; it is not used
as a current render-policy branch.

Unspecified, inferred and inapplicable placement do not introduce contact demands.
A floating object or disconnected collection remains valid in a neutral request.
Requested `planeY` defaults to the canonical zero only when the grounding
statement is present. Bounds and ground measurements are asset-local, preserving
the previous transformed-root convention. Per-instance transforms now contribute
to bounds; the old prop collection helper ignored those transforms.

The existing advisory thresholds and mode are preserved: ground tolerance 0.02 m;
extent band max(0.05 m, 20% of requested extent). This is bounding-box evidence,
not a contact manifold, load-bearing proof, full animation sweep or visual review.
The default rule disposition remains observe. Promotion still requires frozen
evidence; adding neutral applicability does not promote an advisory to a gate.

Applicability now distinguishes unconditional kernels from requested kernels.
Unrequested placement is not evaluated or subjected to a promotion decision.
A requested but disabled/unexecuted placement checker leaves acceptance incomplete.
The report still distinguishes execution coverage, rule mode and finding evidence.
Articulation, openings, circular-assembly observations and the other domain kernels
remain open. A generic opening must not silently become a container requirement.
Representation edge cases and final domain corpus qualification remain open too.

Focused evidence: six new neutral placement cases cover legitimate floating and
separated geometry, custom/default planes, transformed roots, explicit extents,
inferred/disabled policy, instance transforms and promotion ceilings. Together
with existing prop, report/applicability, QA-mode and native-loop checks, 38 tests
passed with 128 assertions. Type checking passed. New tests first failed before
kernel integration; the promotion-applicability test exposed a real attempted
promotion of an unrequested rule and passed after selection moved ahead of mode
validation. The broad native cutover checkpoint predates this kernel change.
