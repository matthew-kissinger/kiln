# Tapered-cone argument repair feedback

F246 comes from Native09's original `HandrailAssemblyTest`. The source passed
`24` as the fourth argument to `taperConeGeo`, intending a segment count. That
position selects the axis; segments are fifth. The helper rejected the input,
but the worker exposed only a generic execution rejection. The model then spent
additional calls retrieving contracts and building isolated primitive tests.

The helper now raises the existing closed diagnostic type with engine-owned
advice naming the fourth and fifth arguments. No authored value, exception text
or stack is serialized. The signature, accepted inputs and resulting geometry
are unchanged. This correction belongs to the shared engine, not a Strands or
provider workaround.

Both numeric and arbitrary-string mistakes failed the focused reproduction
before the change. The worker now returns the positional repair advice, and a
corrected axis succeeds. Forged diagnostic objects remain rejected without
revealing their messages. The focused run passes 45 tests and 421 assertions.

Actual compiled Node CLI, stdio MCP and native SDK tools agree for the unchanged
original source and a minimal reproduction. A valid tapered-cone control exports
byte-identically through the preceding and current runtimes. Evidence root:
`C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22`:

- `taper-axis-red.log`, `taper-axis-focused.log`
- `taper-axis-transport/receipt.json`
- `taper-axis-final-gate-complete.log` (full gate status in the checkpoint)

Runtime: `sha256:0d58c4aab1d1daba1609955dd619db2712279154e99caa2b091237cb013be540`.
Original Native09 and Main41 remain on their frozen earlier runtime. No fresh
repair-uptake or native-completion improvement is claimed.

The full checkout gate passes 2627 tests, two skips and zero failures, with
95.19% function and 92.21% line coverage. Thresholds are unchanged. Toolchain,
skills, typecheck, lint, built bundles, generated tool docs and diff checks pass.
