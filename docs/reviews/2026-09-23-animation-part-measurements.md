# Several moving parts in one animation review

Main31 preserved its walking tracks through both edits, yet independent playback
found every foot above the requested ground plane at 54/65 phases. The author
used whole-scene pose bounds and acknowledged body bob; those bounds did not
establish support. Existing single-subject measurements made checking all contacts
require separate calls and images.

The shared animation tool now accepts optional `measureParts`: 1–16 exact name or
path selectors, measured together at every requested phase. `poseBounds.parts`
keeps input order, returns resolved paths and uses world metres. Camera isolation
does not remove measurement targets. Empty geometry returns null; missing,
ambiguous or duplicate selections fail explicitly. CLI exposes the same input
through `--measure-parts parts.json`; MCP and native tools derive it from the
registry. Existing image behavior and source geometry remain unchanged.

Three focused regressions failed before implementation. Twenty animation, CLI
and shared-tool tests pass. Actual compiled CLI and standalone MCP agree across
all three unchanged robot revisions, six feet and nine phases. Their bounds
agree with independent Three.js GLTFLoader/AnimationMixer playback within
6.34e-9 m, and all three exported GLBs remain byte-identical to the originals.
Six of nine selected phases have every foot more than 1 mm above Y=0.

The QA skill now distinguishes penetration checks from support and recommends
measuring the actual contact parts together when relevant. This adds inspection
evidence, not a gait policy, automatic source repair, balance solver or continuous
collision certificate. Skin/morph/shader limits of the review scene still apply.
Neither main31 nor main32 receives this change during its frozen trial; fresh
model uptake and closure of F191 remain open.

Evidence under `C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/`:
`animation-parts-failing.log`, `animation-parts-focused.log`,
`animation-parts-review/receipt.json` and `animation-parts-final-gate.log`.

Full gate: **2,666 pass / 4 skip / 0 fail**, 95.20% functions / 92.33% lines.
Typecheck, lint, skills and all five rebuilt runtime bundles pass. Runtime:
`sha256:7aed68673c0e669819b936ee0ecbc687aedd33e391ac3e0ef0480d83c4409efb`. No renderer implementation changed.
