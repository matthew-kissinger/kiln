# Implicit surfaces: shape and resolution follow-up

X0 now has six additional bounded cases: a smooth organic union of two spheres,
a sharp box joined to a smooth sphere, and a cellular field clipped to a sphere,
each at edge lengths 0.2 and 0.1. Run `node scripts/implicit-acceptance.mjs`.
The [receipt](implicit-acceptance-2026-09-05.json) records topology, bounds, field
residuals, callback counts, times, and repeated geometry hashes. Each case runs in
its own process with a 20-second timeout; all six completed.

The organic field uses a polynomial smooth maximum with blend width 0.3. The
mixed field takes the maximum of a positive-inside box distance and an offset
sphere distance, retaining a sharp join. The cellular field combines trigonometric
terms and a spherical boundary. Bounds are fixed at `[-1.5,-1.2,-1.2]` to
`[1.5,1.2,1.2]` for every case; source equations are in the experiment script.

| Field | Edge length | Triangles | Callback evaluations | Maximum vertex field residual | Maximum centroid field residual |
| --- | ---: | ---: | ---: | ---: | ---: |
| organic | 0.2 | 800 | 5,177 | 0.00432 | 0.01236 |
| organic | 0.1 | 4,608 | 37,856 | 0.00158 | 0.00260 |
| mixed | 0.2 | 944 | 5,177 | 0.02273 | 0.04545 |
| mixed | 0.1 | 4,056 | 37,856 | 0.02127 | 0.02520 |
| cellular | 0.2 | 2,012 | 5,177 | 0.16627 | 0.14956 |
| cellular | 0.1 | 17,380 | 37,856 | 0.14993 | 0.14998 |

Field residual is the absolute authored equation value at every output vertex or
triangle centroid. It is not a two-sided surface-distance bound, and the cellular
formula is not a signed-distance field. Residual values must not be compared
across different field formulas as geometric accuracy scores. There is no exact
Hausdorff or universal thin-feature guarantee in this measurement.

The smooth organic case improves substantially at the finer resolution. The mixed
case improves less uniformly: its worst vertex residual drops only from about
0.02273 to 0.02127, even as the worst centroid residual improves from about 0.04545
to 0.02520. The cellular case has little worst-residual improvement while producing
more than eight times as many triangles. These are fixture results, not a general
convergence or performance claim.

Repeated sampling of each field produced identical position, normal, and index
hashes within its process. All organic and mixed cases, and coarse cellular, had
no boundary, orientation-conflict, non-manifold-edge or degenerate-triangle
findings. Fine cellular had **nine edges shared by more than two triangles and
four degenerate triangles** under the exported Float32 position-matching diagnostic
at its default tolerance. It still had no boundary edges or orientation conflicts.
This is downstream tolerance evidence, not a claim that Manifold's internal solid
violated its own contract.

The earlier cellular trial used cubic bounds `[-1.2,-1.2,-1.2]` to `[1.2,1.2,1.2]`
and had no such findings. This follow-up changes the sampling grid through its
rectangular bounds; it demonstrates that prior clean output is not a topology
promise for all bounds or resolutions. Keep both receipts. No output retained UVs.
First-build times ranged from about 349 to 1,553 ms on this run, including first-use
Manifold startup and concurrent host load. A single timing per case does not
establish a speed ranking or suggest that fine sampling is cheaper than coarse.

**Decision: retain `implicitSurface` as an explicit experiment.** Its bounds, grid
and callback limits plus the host process deadline make exploration bounded; they
do not ensure shape fidelity. Models should choose resolution relative to feature
size, inspect the result and export diagnostics, and simplify pathological fields
when needed. These cases close the planned shape/resolution experiment matrix;
stable adoption still requires useful model choices and explicit accuracy/topology
limits rather than successful rendering alone. No new stable API is introduced.

## Additional acceptance fixtures

The geometry-authoring tests now exercise a longitude-seamed sphere through
UV-preserving subdivision, checking closed topology and preventing interpolation
across the UV wrap. A sampled open cylinder checks analytical bounds, outward
normals, exactly two boundary rings, coincident seam positions and distinct wrapped
UVs. The deformation test checks reflection identities: reflecting X reverses bend
and twist handedness but commutes with taper, while input buffers and UVs remain
unchanged. These fixtures pass against the existing implementation; no runtime fix
was needed. The initial sphere test assumed indexed output; it was corrected to
accept the documented nonindexed subdivision output before asserting UV triangles.
