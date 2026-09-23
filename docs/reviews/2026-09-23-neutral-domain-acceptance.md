# Neutral domain acceptance: bounded checkout disposition

P09-P14's implementation requirements are satisfied by the current independent
requirement adapters and their positive/negative corpora. This closes their
implementation status, not arbitrary semantic correctness, installed-package
acceptance or all geometry/representation coverage. The report continues to name
unmeasured requested fields as incomplete. Explicit old-policy equivalence and
replacement remain L03/L08 work; broader calibration and final held-outs remain
Q02/V09/V10 work. None of those requirements is deleted or declared passing here.

The current full gate runs the following existing checks. These counts describe
coverage already present, not new tests written to move statuses.

| Task | Existing measured behavior | Current focused evidence |
| --- | --- | --- |
| P09 | Requested placement/mechanism checks run without prop labels; unrequested floating/disconnected assets are not universally blocked; unsupported access/motion stays incomplete | 8 placement, 6 mechanism and 4 geometry tests; prior compiled CLI/MCP mechanism and surface/volume receipts |
| P10 | Independent wheel/axle/support requests, explicit zero and waterborne support; no invented wheel, steering, contact or front marker | 8 neutral mobility tests; current waterborne and mixed six-deck CLI/MCP cases |
| P11 | Independent storeys/roof/interior requests, beyond two floors; declared missing floor evidence blocks; unknown roof obligations stay incomplete | 36 neutral structure/corpus tests; current six-storey positive and seven-storey negative CLI/MCP cases |
| P12 | Navigation and tiling can coexist with other obligations; no assumed human dimensions or floor count; instances, transformed seams and unavailable shear measurements handled explicitly | 15 neutral spatial tests and prior compiled navigation receipts |
| P13 | Explicit body-plan/rig/clip and foliage requests preserve their calibrated modes without mandatory categories; sampled/rest evidence does not imply complete motion or biology | 22 rig and 19 foliage tests, reciprocal corpora and diagnostic/export checks |
| P14 | Effects requests apply without an effects category; final bytes rechecked; source declarations cannot fake alpha or supported runtime sidecars | 3 neutral effects tests plus the existing effects/final-byte corpora |

Six new maintainer interface checks use the ordinary compiled Node CLI and
standalone stdio MCP with the same explicit host requirements. Source labels
and host descriptive labels deliberately disagree. Both transports agree:

| Case | Result |
| --- | --- |
| Floating member, no grounding obligation | accepted |
| Waterborne member, explicitly zero wheels/axles | accepted without wheel/contact/steering/front findings |
| Floating six-storey deck set, waterborne, no roof | accepted without inferred ground contact or house defaults |
| Same six decks, seven storeys requested | blocked with ARCH_STOREY_COUNT |
| Modular grid requested without qualified join coverage | incomplete; modular gap retained |
| A required semantic part not measured by available checks | incomplete; parts gap retained |

These are deliberately simple checker fixtures, not authored assets or extra
campaign completions. The accepted cases do not establish buoyancy, building
safety, navigation through arbitrary concave geometry or physical attachment.
The two incomplete cases are known feature limits, not postponed tests that
would make them pass. No unqualified first-pair modular analyzer was enabled,
and no render pixels were added to structural QA.

Evidence: external `neutral-domain-acceptance-review/receipt.json` and
`review-neutral-domain-acceptance.ts`; current full gate
`procedural-direction-final-gate-rerun.log` (2,627 pass, 2 skip, 0 fail).
Runtime: `sha256:23c15bea328a8f13af58df0fb8a0435e1a0e12a01bc0dedbe0d8df1ab7070c6a`.
The original domain reports retain the history of their implementation and fixes.
This disposition replaces their blanket unfinished-integration status with named
implementation coverage and explicit remaining limits; it adds no new QA promise.
