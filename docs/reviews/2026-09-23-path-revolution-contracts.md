# Path and revolution consolidation (C09)

Two active construction paths duplicated the same algorithms. `lathe` now calls
the shared surface-revolution implementation, and `pipeAlongPath` calls the
shared tube constructor after its optional corner-waypoint preparation. This
reduces places where geometry fixes can diverge. It introduces no fallback,
retired executable alias, implicit cap, unit conversion or changed return type.

The public shorthands remain deliberate: `lathe` names a full-Y surface with a
compact positional signature; `revolveGeo` supplies partial sweep and arbitrary
axis selection. `curveToMesh` accepts spline waypoints directly; `pipeAlongPath`
adds its named corner-preparation options. All return surface geometry. In
contrast, `sweepProfile` follows explicit stations with profile frames, scale,
twist and optional caps; `revolveProfile` constructs a solid from a closed section.
Collapsing these into one nominally interchangeable function would obscure those
differences. Previously retired helper paths remain retired.

Fourteen executable fixtures compare buffers, indices, normals, UVs, bounds,
groups, open boundaries, units, axis orientation and interpolation. Every
before/after result is identical. Three overlap pairs are byte-identical at the
geometry-buffer level: lathe/full surface, open curve/default pipe, and closed
curve/closed pipe. A prepared bend and a polyline sweep deliberately differ.

| Representative fixture | Triangles | Open boundary edges | UVs |
| --- | ---: | ---: | --- |
| Full lathe/surface | 64 | 32 | Yes |
| Half surface | 64 | 36 | Yes |
| Full/half solid | 96 / 102 | 0 | No |
| Open spline tube | 512 | 16 | Yes |
| Closed spline tube | 512 | 0 | Yes |
| Capped/open polyline sweep | 92 / 80 | 0 / 16 | Yes |

The half-revolution cases expose a convention that is now explicit in Discovery:
the default-Y surface starts at +Z and advances toward +X; the Y solid starts at
+X and advances toward -Z. Their angle parameters also use radians and degrees,
respectively. These existing conventions are retained; partial shapes require
explicit orientation alignment as well as unit conversion.

Sixty existing focused tests pass. Two combined fixtures exported through the
compiled CLI remain byte-identical to the frozen pre-refactor build, and actual
stdio MCP returns matching artifact hashes. CLI and MCP deliver the same updated
Discovery detail text. This proves the stated consolidation, not arbitrary path
validity, self-intersection freedom, physical mating or model uptake.

External evidence under `C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/`:
`path-revolution-before.json`, `path-revolution-after.json`,
`path-revolution-focused.log`, `path-revolution-review-final/receipt.json` and
`path-revolution-qualified-gate.log`. The initial review incorrectly parsed
multiple Discovery cards as one JSON object; its failed attempt is retained.
The corrected review compares the documented detail text. Main30 stays frozen on
its original runtime and does not count as fresh uptake of this later change.

Final gate: **2,653 pass / 4 skip / 0 fail**; 95.18% functions / 92.33% lines.
Runtime: `sha256:0af460c8962df73f9082e240a0f2133e328057f13609cb7b44d916449e23bcc1`. All five bundles rebuilt; typecheck and lint pass.
