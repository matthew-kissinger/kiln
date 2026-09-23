# Basic primitive numeric domains

G19 implementation evidence; full composition and dogfood qualification remain open.

Basic box, sphere, capsule, cylinder, cone, torus, plane and decal factories now
reject nonfinite, negative and unrepresentable dimensions with named diagnostics.
Axis-specific variants share the same constructors. Explicit taper axes are checked;
oriented cylinder centers/normals are finite triples, zero normals fail before geometry
allocation, and large finite direction vectors normalize without length overflow.

Segment counts are bounded integers (maximum 4,096); sphere/torus/plane grid products
are capped at 262,144 vertices before construction. Circular minima are 3, sphere
height minimum 2, and plane minimum 1. No automatic rounding or quality reduction.
The allocation thresholds are per-operation guards, not a global heap guarantee.

Intentional forms remain supported: either cylinder radius may be zero when the
other is positive; a capsule's straight middle length may be zero; planes remain
open zero-thickness surfaces; torus proportions are not restricted to ring tori.
The existing decal minimum depth stays explicit. Degenerate zero-volume boxes fail
with guidance to use a plane. Custom geometry and Three.js remain available.

`primitive-domains.test.ts` reproduced five failing cases before implementation,
plus additional overflow regressions. It covers each basic family, fractional and
excessive segments, product bounds, the supported zero cases, frames/axes, very large
normal components and sandbox calls. Existing primitive tests remain green. Discovery
and geometry documentation carry the updated contracts. Specialized wing/gear/blade/
billboard numeric contracts remain G20 work and are not claimed by this report.
