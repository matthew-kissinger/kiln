# Deformation seams and subdivision scale (G26, partial G24)

Six failing deformation regressions and four subdivision/preservation regressions
identified concrete defects beyond exporter success:

- Zero-strength deformation recomputed and changed authored normals.
- Recomputed normals split otherwise smooth UV seam copies (bent-cylinder seam dot
  product 0.918 rather than approximately 1), while cap creases still need to stay hard.
- The fixed 1e-7 deformation floor collapsed tiny nonzero intervals to progress zero
  and could include outside vertices; normalized position error reached 0.79.
- Default subdivision welded at a fixed world distance and used upstream adjacency
  rounding without the normalization already used by the preserveUV path. Tiny
  meshes changed shape/topology; normalized position error reached approximately 2.
- Position-only subdivision silently discarded material groups, non-UV attributes,
  morph attributes and existing diagnostic metadata.
- Generic interpolation of discrete skin joint indices was accepted despite lacking
  a skin-preserving subdivision contract.

## Implementation

Deformation retains authored normals when output positions are unchanged. Otherwise
it rebuilds area-weighted normals using original position/normal seam classes and
output coincidence, keeping UV splits smooth without merging intentional cap creases.
Position matching uses a relative 1e-7 diagonal grid and normal components a 1e-6
grid. Face accumulation uses normalized coordinates and Float64 sums, so units do
not overflow or underflow Float32 normal accumulation. This is finite-resolution
shading reconstruction, not exact topological welding or a self-intersection check.

Any nonzero interval now retains normalized progress. Endpoint roundoff is bounded
by interval length; outside positions stay unchanged. Geometry and metadata are
owned copies, UVs and material groups remain, and tangent invalidation is explicit.
Morph deformation is not implemented: deform before morph creation, and unsupported
inputs fail before callbacks. Position/corner counts and indices are bounded/checked.
Abrupt interval boundaries still require suitable segmentation/falloff and review.

Both subdivision paths normalize working coordinates before welding/upstream hashing
and restore authored units. preserveUV keeps corner UVs, colors, groups and tested
absolute morph deltas. Position-only loss is explicit for UVs, other attributes,
groups and morphs; prior diagnostics survive. Subdivide before skin binding rather
than averaging joint indices. The upstream finite relative grid still requires
review of extremely close features; this is not general remeshing certification.

## Evidence and limitations

41 focused tests / 2056 assertions across six files pass, including existing
longitude-seam subdivision, unit/outward normals, allocation guards, both GLB
converters, reflected/framed deformation and new no-op/seam/interval/attribute tests.
Deformation shape invariants cover scales 1e-9, 1e-4, 1e4 and 1e9. Both subdivision
paths cover 1e-8, 1e-3 and 1e6; source buffers are unchanged. Typecheck and lint pass.
Runtime bundles were explicitly rebuilt with node scripts/build-runtime.mjs all.
Full integration results are recorded in the current checkpoint after completion.

The separate deformation-probe fixture has before/after actual GPU sheets, GLBs,
logs and a hash-bound receipt under
C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/deformation-probe/.
Both have 832 triangles / 25.7 KB and accepted structural QA. Width grows from
4.90 to 5.11 because the deliberately enlarged tiny mesh now actually twists.
Direct visual comparison shows that correction and a preserved cap crease on the
bent cylinder. This is an opaque metallic fixture, not every material or asset style.
The floating-part advisory proposes joining independent specimens; keep that as
Q02 calibration evidence rather than changing the fixture to satisfy the advice.

G24 is only partially advanced. geometryDiagnostics' absolute tolerance, periodic
endpoint matching, CSG tolerances and broader tiny/large policy behavior remain to
be qualified. G26 source implementation does not establish final free-model dogfood,
installed-package acceptance, all animation preservation or universal visual quality.

## Four-component upstream limitation

A follow-up adversarial fixture found nonfinite RGBA alpha after two subdivisions.
The upstream implementation uses Vector3 temporaries for all attribute widths and
does not propagate normalized-storage flags. A raw upstream skin probe additionally
produced 144 nonfinite values among 576 skin-weight components (every fourth weight).
The initial fractional-joint probe found zero fractional values because integer
storage coerces them; that result was not treated as proof of valid skinning.

The preserving adapter now decodes continuous attributes to Float32 and runs
four-component attributes through temporary scalar channels with the same linear
weights, then restores their original names and four-component layout. Temporary
names avoid caller attributes and are removed from output. A two-iteration varying
RGBA fixture checks each component against its affine position relation, verifies
normalized scalar values, and checks that no temporary attributes leak. Matching
three-component morph attributes are decoded too. Skin binding remains explicitly
unsupported by this generic continuous interpolation.

The first complete gate passed 2413 tests / 4 skips, coverage 95.05% functions and
92.64% lines. The later RGBA regression was added after that gate; final acceptance
requires the subsequent rebuilt gate, recorded in the checkpoint.

## Final integrated checkpoint

The final rebuilt source passes **2414 tests, 4 skips, 0 failures**, 57430 assertions
across 287 files in 135.54 seconds. Coverage is 95.08% functions and 92.64% lines,
above unchanged 94.00% / 92.10% thresholds. Typecheck, lint and skills pass. All five
Node bundle identities match freshly computed source identity
sha256:d2e8f710cc5f56a2e3d312f6a7bf1d442b911aa837614e8cb74731c389211318.
The final GPU fixture was rerun at this identity; its after-image is byte-identical
to the reviewed intermediate image. Both artifact generations and receipts remain.
No package, commit, push or publication occurred. Overall acceptance remains open.
