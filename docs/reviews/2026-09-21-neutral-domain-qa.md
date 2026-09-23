# Neutral mobility and structure checkpoint

Current rendering now calls mobility and structure measurement kernels with
host-bound requests. No current path synthesizes an AssetIntent or chooses a
category. Historical conformance wrappers call these same kernels; their eventual
public retirement remains tracked separately.

Mobility preserves semantic wheel geometry, pivots, axle pairing, steering,
duplicate detection, contacts, supports, propulsion and the existing orientation
observations. Counts are independent, including explicit zero. Waterborne support
does not request wheels, grounded contact or a front marker. The old +X marker
obligation is now an explicit optional `mobility.frontFrame`; old-record conversion
preserves it visibly. Custom ground planes use asset-local coordinates.

Two defects were corrected during migration: zero counts previously skipped count
checks, and requested non-wheel support assemblies could be ignored when wheels
were present or the support policy was airborne. Requested supports are now checked
independently. Unknown propulsion/animation semantics and arbitrary subtype claims
remain listed as unmeasured, rather than being reported accepted. Exact rules and
observational heuristics keep their different modes; disabling or downgrading an
exact requested rule leaves acceptance incomplete.

Native source, saved-reference and edit paths, shared registry render, animation
and interior feedback preserve the same requested mobility evidence. Underbody
and wheel-section diagnostics are restored on the neutral render path. The
capture function now accepts `(root, size?)`, without an intent/category argument.
Capturing views changes neither source transforms/children nor exported GLB bytes.
These CPU semantic overlays are inspection evidence, not material or QA gate input.

Structure supports independent storey count, interior mode, roof mode and portal
requests. Eight storeys need no roof, interior or residential-scale defaults.
Unspecified fields do not inherit the old architecture defaults. Explicit realistic
scale selects advisory bands; descriptive subtype/scene tags cannot introduce a
roof requirement or cancel an explicit closed-gable requirement. Existing gable
axis, ridge, ends, envelope, portal and dome tests run through the neutral kernel.

A single requested storey previously passed with no floor evidence. It now needs
an indexed floor or a renderable unindexed `floor` role. Isolated roof, interior
and rotunda fixtures declaring one storey now include a floor, and the bridge deck
also carries its floor role. The untagged-roof test requests only its roof check,
preserving its warning-only inference assertion without an unrelated storey default.

Partial geometry measurements remain explicit limitations. Footprint, wall height,
roof specification and arbitrary subtype requests are not yet fully qualified as
standalone neutral obligations. Existing full geometry checks still execute when
their required dimensions are present, but the report leaves uncovered fields
incomplete. This is not full P10/P11 closure, final QA calibration or release evidence.

Focused verification: 113 tests / 570 assertions across neutral mobility/structure,
old reciprocal corpora, native context and shared registry context passed. A further
10 tests / 73 assertions covering the restored views and native/shared paths passed.
Type checking passed. New neutral integration cases were observed failing before
kernel integration; the one-storey and view cases were also observed failing before
their fixes. Final runtime identity and broad gates must be refreshed after these changes.
