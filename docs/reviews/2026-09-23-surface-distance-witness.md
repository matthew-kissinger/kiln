# Surface distance: false contact under nearly coplanar geometry

Fresh Main37 motion review found a false zero between separated gripper pads at
0.65 seconds. The exported triangles have a separating Z interval greater than
40 mm. Three.js ray/triangle arithmetic nevertheless returned a point nearly
50 mm outside the target triangle, which Kiln treated as contact.

The shared distance helper now projects that candidate onto the target triangle
and retains a point on each surface, with the correct witness ownership. It does
not introduce a contact tolerance or reject legitimate near-parallel geometry.
Existing edge/edge, vertex/face and actual crossing checks remain in place.

The captured two-face regression failed before the change. Focused checks pass
(12 tests, 93 assertions). The complete checkout gate passes: 2615 tests, two
skips, zero failures; coverage 95.18% functions and 92.21% lines. Candidate identity:
`sha256:0d54c6bd4dc9d0d8fe08a8d8e83da2eddcd0e068152656fb4ead276f3aedae1d`.

The original authoring is unchanged. A separate source fixture fixes its fingers
at the failing exported pose. The frozen compiled CLI reports zero; rebuilt Node
CLI, actual stdio MCP and the real native SDK tool all report
**0.04047667307594477 m** on that same source. Receipt:
`C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/surface-coplanar-review/receipt.json`.
The original sampled measurements remain retained with the trial.

This corrects measurement, not asset geometry. Unsigned distance still cannot
distinguish contact from penetration or prove physical attachment. Positive
surface separation can also describe one solid entirely inside another. It is
not a general collision certificate or a gallery-quality gate.
