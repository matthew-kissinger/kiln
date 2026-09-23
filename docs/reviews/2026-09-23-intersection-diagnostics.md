# Bounded intersection diagnostics (E05)

The existing part-volume analyzer can distinguish solid overlap from contact on
small, static, closed meshes. It is not a general self-intersection or usable-space
test. Twenty-four controlled cases exposed specific correctness and resource
defects; the shared analyzer is now corrected for those cases. No new authoring
tool, automatic geometry repair, category requirement or QA enforcement is added.

| Case | Before | Current result |
| --- | --- | --- |
| Half-overlapping unit boxes | 0.5 m³, fraction 0.5 | Same |
| Flush contact / separated boxes | No positive overlap | Same |
| Contained box | Fraction 1 | Same |
| Intentional lap joint | Positive overlap | Still measured; advice now asks whether it is intentional |
| 0.0005 / 0.002 overlap fractions | Smaller suppressed by 0.001 threshold | Same explicit limit |
| One reflected operand | Missed the half overlap | Correct winding; fraction 0.5 |
| Translation by 10⁹ or 10¹² m | Float32 conversion invalidated both closed operands | Normalized local solids and a shared pair frame retain 0.5 m³ |
| Scale 10⁻⁶ / 10⁻³ | Reported volume 0 / 10⁻⁹ m³ | Correct 5×10⁻¹⁹ / 5×10⁻¹⁰ m³ |
| Scale 10³ / 10⁶ | Correct fraction 0.5 | Retained |
| Nonuniform scale and rotation | Approximately 1.5 m³, fraction 0.5 | Retained within Float32 error |
| Instanced or morphed input | Incorrect base-mesh overlap | Explicitly unmeasured; skin is also unsupported |
| Open sheet crossing a box | Failed solid conversion | Explicitly unmeasured; no claim that it cannot intersect |
| Two intersecting components inside one mesh | No part pair | Still outside this method |
| 1,000 overlapping boxes | Allocated 499,500 candidate pairs, tested 64 | At most 250,000 pair checks, retains 64; count explicitly a lower bound |

The conversion normalizes each static mesh before Float32 construction and puts
the resulting solids into a common pair frame. It corrects reflected winding and
uses relative precision for reported volumes. Partial draw ranges, unsupported
posed representations and invalid transformed data are not treated as base-shape
measurements. Bounds belong to each mesh rather than its child meshes. The
observation rule now exposes skipped measurements instead of returning an empty
finding list that could hide missing analysis.

The 20,000-triangle per-part limit, 64 Boolean-pair limit and 0.001 overlap-fraction
threshold remain. Pair discovery now has its own 250,000-check cap. This bounds
pair work and candidate allocation, not arbitrary scene traversal, all WASM
execution time or all geometry memory. Local single-run timings for 13/100/1,000
overlapping boxes were 38.3/44.1/51.6 ms after the correction, versus
18.9/24.8/52.0 ms before. Normalized pair transforms add cost to smaller cases;
these numbers are observations, not latency guarantees.

Four new regression tests first failed and now pass. They cover coordinate and
scale invariance, unsupported representations and their reported status, bounded
pair discovery, and advice for intentional overlap. The existing positive/contact/
bored-plate/socket controls remain: 20 focused tests pass. Original before/after
probe outputs are retained, including limitations rather than only successes.

## Decision and remaining integration

Retain this as a bounded static-solid observation. Do not promote it to an
automatic blocker or advertise a general mesh-repair tool. It cannot detect
intersections inside one mesh, certify open sheets, infer whether a joint is
intentional, prove continuous motion, or certify an empty passage. A positive
distance between surfaces also does not rule out containment.

Main30 illustrates a separate requirement: neighboring walls intrude into the
space intended for a new gateway. Preserving all other subtrees does not prove
that space is clear, and whole-part intersection volume is not a substitute for
an explicitly specified passage. Its finite ray evidence extends existing F187;
it does not justify category-specific human dimensions or an automatic repair.

At the end of the E05 evaluation, neutral CLI/MCP QA still reported this rule as
`notEvaluated`. The subsequent [neutral integration](2026-09-23-neutral-volume-qa.md)
now supplies the bounded observation with explicit incomplete-coverage status.
Broader applicability and physical acceptance remain separate work. No gallery
assets were repaired or replaced.

Evidence under `C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/`:
`probe-intersections.ts`, `intersections-before.json`, `intersections-after.json`,
`intersections-failing.log`, `intersections-focused.log` and
`intersections-final-gate.log`. Implementation: `src/qa/self-intersection.ts` and
`src/qa/self-intersection.test.ts`.

Final gate: **2,657 pass / 4 skip / 0 fail**; 95.18% functions / 92.32% lines.
All five bundles rebuilt; typecheck, lint and skills pass. Runtime:
`sha256:d2f0f93dd38a386586641ca52c0b12b7d5c6017dd0c0d87adb754ef057134a5c`. Renderer code is unchanged.
