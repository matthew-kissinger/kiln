# Axis contracts and scaled-sweep warnings

G23 confirms the published dimension/axis contracts against vertex positions:
capsule outer length is straight-middle length plus two radii on X/Y/Z; cylinder
radiusTop faces the positive longitudinal direction; a torus lies in XY with its
hole axis on Z; planes face +Z; decal depth has the explicit 0.002 minimum.
Wing sweep offsets the tip leading edge relative to the root leading edge, not
the chord midpoint. Dihedral is a signed tip-height displacement. Discovery now
states the leading-edge distinction explicitly. These fixtures qualify dimensions,
not arbitrary mesh validity across all scales (G24).

G25 reproduced a false tight-turn warning when a profile was scaled down, and
missing warnings when uniform or station-specific anisotropic scale enlarged it.
Scale validation now precedes tangent diagnostics. The warning uses the maximum
hypotenuse of the scaled profile points at that turning station. Tests cover uniform
shrink/enlargement and both components of a per-station scale pair.

The test is a local heuristic against adjacent segment lengths. It does not prove
that distant path sections avoid one another, detect all rapid taper intersections,
or certify a solid. The general self-intersection advisory remains. Geometry
construction is unchanged; warning output can change for scaled sweeps.

The full example suite found one expected diagnostic change: eight old tight-turn
warnings on the mechanical peacock neck disappeared. Its unit octagon is shrunk
by per-station neck radii; the prior heuristic incorrectly used the unscaled unit
radius. Only those eight exact warning expectations were removed. The general
self-intersection warning remains, and no source asset or geometry was changed.
