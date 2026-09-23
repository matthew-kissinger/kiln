# Specialized primitive domains and blade repair

G20 implementation evidence, with final visual and composition qualification open.

Wing, gear and blade dimensions now reject nonfinite or unrepresentable values.
Gear teeth are bounded integers (3..4096), radii ordered, tooth fraction strictly
between zero and one. Blade tip length is nonnegative and below length; bevel is
in 0..1. Wings retain signed sweep/dihedral displacements and a zero tip chord;
the pointed case omits collapsed faces. These are art-grade shapes, not engineering
profiles or a general self-intersection certificate.

Foliage, crossed and atlas cards share positive dimensions and a finite Float32
pivoted-frame check. Pivots outside 0..1 remain useful and supported. Crossed cards
require two or three sheets. Repeated ladder/stair counts have explicit upper
bounds before allocation. Descending/reversed stairs retain signed placement
while their solid dimensions remain positive. Ladder root/frame work is C05.

The bevel regression exposed overlapping blade side strips: the old four layers
at identical XY positions closed back over their own sides, creating non-manifold
edges. The replacement joins one convex cross-section at base/shoulder to a tip.
Partial bevels use six section points; full diamonds four. The flat default stays
unchanged. Beveled output intentionally changes topology and tapers in thickness
at the tip; callers must not depend on old vertex ordering or triangle counts.

Tests observed failures before fixes. Coverage includes malformed dimensions,
allocation counts, no parent mutation on rejected inputs, out-of-range card pivot
products, zero-tip wings, descending stairs, and blade bevels 0/0.25/0.5/1 with
zero/positive tip length. Blade tests check closed manifold edges, no degenerate
triangles, consistent orientation, positive signed volume and unit normals.
Visual suitability is not inferred from those structural checks.
