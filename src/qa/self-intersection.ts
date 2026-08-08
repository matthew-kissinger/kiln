/**
 * Part-vs-part self-intersection gate — T4.1
 *
 * ## Why intersection VOLUME, not triangle overlap
 *
 * The accept criterion demands true negatives for "intentional contact and
 * socketed parts", and that is what rules out the cheaper checks:
 *
 * - **Bounding boxes** call a bolt in a hole, a wheel in a wheel well, and a
 *   handle through a loop all intersecting. Every one is correct geometry.
 * - **Triangle overlap** cannot separate two parts that merely touch — a lid
 *   resting on a box, a wheel meeting the ground — from two parts occupying the
 *   same space. Contact is coplanar triangles; interpenetration is shared
 *   volume. A triangle test sees both as "they overlap".
 *
 * Boolean intersection volume separates them by construction: surfaces in
 * contact enclose zero volume, interpenetrating solids enclose a real one. That
 * is exactly the distinction the gate has to make, so it is measured directly
 * rather than approximated.
 *
 * manifold-3d is already a dependency (`solids.ts`), so this costs no new
 * package and reuses the same watertight-solid machinery CSG runs on.
 *
 * ## Bounded time
 *
 * Booleans are expensive and pair count grows quadratically, so the pass is
 * staged:
 *
 * 1. **Broad phase** — world-space AABB overlap. Rejects almost every pair for
 *    the price of six comparisons. Parts that do not share a bounding box
 *    cannot share volume.
 * 2. **Narrow phase** — one boolean per surviving pair, capped by
 *    {@link MAX_NARROW_PHASE_PAIRS}. If the cap is hit, the analysis says so in
 *    `truncated` instead of silently checking less than it claims.
 *
 * Meshes are also capped at {@link MAX_PART_TRIANGLES}; above that a single
 * boolean stops being bounded-time in any useful sense. Skipped parts are
 * reported, never dropped quietly.
 *
 * ## Determinism
 *
 * Parts are collected in traversal order and compared in a fixed pair order,
 * volumes are rounded to a fixed precision, and findings are sorted by name.
 * The same scene yields the same report on every run and every machine.
 */

import * as THREE from 'three';
import type { QaContext, QaFinding } from './types';
import { KILN_ENGINE_QA_OWNER, type QaRule } from './registry';

/** Above this, one boolean is no longer bounded-time in any useful sense. */
export const MAX_PART_TRIANGLES = 20000;
/** Narrow-phase budget. Broad phase normally leaves far fewer than this. */
export const MAX_NARROW_PHASE_PAIRS = 64;
/**
 * Intersection volume below this fraction of the smaller part's volume is
 * treated as contact rather than penetration.
 *
 * Not zero: two parts snapped flush share a surface, and floating-point
 * evaluation of a boolean on coincident faces yields a sliver of volume rather
 * than exactly nothing. The threshold is a fraction rather than an absolute so
 * it means the same thing on a 2 cm bolt and a 20 m wall.
 */
export const CONTACT_VOLUME_FRACTION = 0.001;

export interface PartPenetrationPairV1 {
  a: string;
  b: string;
  /** Absolute intersection volume in cubic meters. */
  volume: number;
  /** Intersection volume over the smaller part's volume, 0..1. */
  fraction: number;
}

export interface PartPenetrationEvidenceV1 {
  schemaVersion: 1;
  source: 'engine-scene-analysis';
  /** Parts that were actually compared. */
  partsAnalyzed: number;
  /** Pairs that survived the AABB broad phase. */
  candidatePairs: number;
  /** Pairs a boolean was actually run on. */
  pairsTested: number;
  /** True when the narrow-phase cap stopped the analysis short. */
  truncated: boolean;
  /** Parts skipped, with the reason — never silently dropped. */
  skipped: { part: string; reason: string }[];
  /** Pairs whose shared volume exceeds the contact threshold, worst first. */
  penetrations: PartPenetrationPairV1[];
}

interface AnalyzedPart {
  name: string;
  mesh: THREE.Mesh;
  box: THREE.Box3;
  triangles: number;
}

/** Fixed precision so a report is byte-comparable across runs. */
const round = (n: number): number => Math.round(n * 1e9) / 1e9;

function triangleCount(geometry: THREE.BufferGeometry): number {
  const index = geometry.getIndex();
  const position = geometry.getAttribute('position');
  if (!position) return 0;
  return Math.floor((index ? index.count : position.count) / 3);
}

/**
 * Collect the meshes worth comparing, in traversal order.
 *
 * Only meshes with real geometry participate: a part with no triangles cannot
 * penetrate anything, and including it would produce a boolean on an empty
 * operand — which `solids.ts` now (correctly) throws on.
 */
function collectParts(
  root: THREE.Object3D,
  skipped: PartPenetrationEvidenceV1['skipped'],
): AnalyzedPart[] {
  const parts: AnalyzedPart[] = [];
  root.updateWorldMatrix(true, true);

  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    const name = mesh.name || '(unnamed mesh)';
    const triangles = triangleCount(mesh.geometry);
    if (triangles === 0) return;
    if (triangles > MAX_PART_TRIANGLES) {
      skipped.push({
        part: name,
        reason: `${triangles} triangles exceeds the ${MAX_PART_TRIANGLES}-triangle analysis budget`,
      });
      return;
    }
    const box = new THREE.Box3().setFromObject(mesh);
    if (box.isEmpty()) return;
    parts.push({ name, mesh, box, triangles });
  });

  return parts;
}

/**
 * World-space triangle soup for one mesh, as manifold wants it.
 *
 * Deliberately independent of `solids.ts`'s `threeToManifold`: that one walks a
 * whole Object3D and enforces CSG's stricter operand contract, whereas this
 * needs one already-located mesh and must tolerate geometry a QA pass should
 * report on rather than throw over.
 */
function meshToArrays(
  mesh: THREE.Mesh,
): { vertProperties: Float32Array; triVerts: Uint32Array } | null {
  const geometry = mesh.geometry;
  const position = geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
  if (!position) return null;

  const matrix = mesh.matrixWorld;
  const v = new THREE.Vector3();
  const verts = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    v.set(position.getX(i), position.getY(i), position.getZ(i)).applyMatrix4(matrix);
    verts[i * 3] = v.x;
    verts[i * 3 + 1] = v.y;
    verts[i * 3 + 2] = v.z;
  }

  const index = geometry.getIndex();
  let tris: Uint32Array;
  if (index) {
    if (index.count % 3 !== 0) return null;
    tris = new Uint32Array(index.count);
    for (let i = 0; i < index.count; i++) tris[i] = index.getX(i);
  } else {
    if (position.count % 3 !== 0) return null;
    tris = new Uint32Array(position.count);
    for (let i = 0; i < position.count; i++) tris[i] = i;
  }

  return { vertProperties: verts, triVerts: tris };
}

/**
 * Measure how much volume every pair of parts shares.
 *
 * Async because manifold is WASM and initializes on first use. The QA registry
 * evaluates rules synchronously, so this runs as a pre-pass and its result
 * travels to the rule through `QaContext.derivedEvidence` — the seam that
 * exists precisely for engine measurements a rule cannot take itself.
 */
export async function analyzePartPenetration(
  root: THREE.Object3D,
): Promise<PartPenetrationEvidenceV1> {
  const skipped: PartPenetrationEvidenceV1['skipped'] = [];
  const parts = collectParts(root, skipped);

  const base: PartPenetrationEvidenceV1 = {
    schemaVersion: 1,
    source: 'engine-scene-analysis',
    partsAnalyzed: parts.length,
    candidatePairs: 0,
    pairsTested: 0,
    truncated: false,
    skipped,
    penetrations: [],
  };
  if (parts.length < 2) return base;

  // Broad phase first, so an unwinnable scene never pays for WASM init.
  const candidates: Array<[AnalyzedPart, AnalyzedPart]> = [];
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      if (parts[i]!.box.intersectsBox(parts[j]!.box)) candidates.push([parts[i]!, parts[j]!]);
    }
  }
  base.candidatePairs = candidates.length;
  if (candidates.length === 0) return base;

  const tested = candidates.slice(0, MAX_NARROW_PHASE_PAIRS);
  base.truncated = candidates.length > tested.length;

  const Module = await import('manifold-3d');
  const wasm = await Module.default();
  wasm.setup();
  const { Manifold, Mesh } = wasm;

  const cache = new Map<THREE.Mesh, InstanceType<typeof Manifold> | null>();
  const build = (part: AnalyzedPart): InstanceType<typeof Manifold> | null => {
    if (cache.has(part.mesh)) return cache.get(part.mesh)!;
    let solid: InstanceType<typeof Manifold> | null = null;
    try {
      const arrays = meshToArrays(part.mesh);
      if (arrays) {
        const mesh = new Mesh({ numProp: 3, ...arrays });
        // Three's primitives split vertices at UV/normal seams — a BoxGeometry
        // has 24 positions for 8 corners — and manifold reads that as an open
        // surface ("Not manifold"). merge() welds coincident positions, which
        // is the same step `solids.ts` takes before every CSG operand.
        mesh.merge();
        solid = new Manifold(mesh);
      } else {
        skipped.push({ part: part.name, reason: 'its triangle list is malformed' });
      }
    } catch (err) {
      // A part that is not a closed solid (an open shell, a foliage card) cannot
      // enclose volume, so it cannot penetrate anything. Reported, not fatal.
      skipped.push({
        part: part.name,
        reason: `it is not a closed solid, so it encloses no volume (${err instanceof Error ? err.message : String(err)})`,
      });
      solid = null;
    }
    cache.set(part.mesh, solid);
    return solid;
  };

  const penetrations: PartPenetrationPairV1[] = [];
  try {
    for (const [a, b] of tested) {
      const sa = build(a);
      const sb = build(b);
      if (!sa || !sb) continue;
      base.pairsTested++;

      let overlap: InstanceType<typeof Manifold> | null = null;
      try {
        overlap = Manifold.intersection(sa, sb);
        const volume = overlap.volume();
        if (volume > 0) {
          const smaller = Math.min(Math.abs(sa.volume()), Math.abs(sb.volume()));
          const fraction = smaller > 0 ? volume / smaller : 0;
          if (fraction > CONTACT_VOLUME_FRACTION) {
            penetrations.push({
              a: a.name,
              b: b.name,
              volume: round(volume),
              fraction: round(fraction),
            });
          }
        }
      } finally {
        overlap?.delete();
      }
    }
  } finally {
    for (const solid of cache.values()) solid?.delete();
  }

  // Worst first, then by name so equal-volume pairs keep a stable order.
  penetrations.sort(
    (x, y) => y.fraction - x.fraction || `${x.a}:${x.b}`.localeCompare(`${y.a}:${y.b}`),
  );
  base.penetrations = penetrations;
  return base;
}

// -----------------------------------------------------------------------------
// The rule
// -----------------------------------------------------------------------------

function readEvidence(context: {
  derivedEvidence?: Record<string, unknown>;
}): PartPenetrationEvidenceV1 | undefined {
  const evidence = context.derivedEvidence?.['partPenetration'] as
    | PartPenetrationEvidenceV1
    | undefined;
  return evidence?.schemaVersion === 1 ? evidence : undefined;
}

/**
 * Report parts that occupy the same space.
 *
 * Starts in `observe` as the plan requires: it has no promotion evidence yet,
 * and the registry will not let an unpromoted rule warn or block regardless.
 */
export const SELF_INTERSECTION_QA_RULE: QaRule = Object.freeze({
  id: 'GEO_PART_SELF_INTERSECTION',
  profile: 'geometry.selfIntersection',
  scope: { kind: 'universal' as const },
  // 'heuristic', not 'exact', even though the measurement IS exact — a boolean
  // volume, not a proxy for one. In this registry `exact` is a promotion
  // contract, not a statement about the arithmetic: every `exact` rule must sit
  // in `enforce` with frozen conformance evidence, and the registry test
  // enforces that. A rule with no evidence yet is `heuristic` regardless of how
  // precise its measurement is. Reclassify to `exact` at the same time as
  // freezing a fixture set and promoting, never before.
  ruleClass: 'heuristic',
  owner: KILN_ENGINE_QA_OWNER,
  defaultMode: 'observe',
  evaluate(context: QaContext): readonly QaFinding[] {
    const evidence = readEvidence(context as { derivedEvidence?: Record<string, unknown> });
    if (!evidence) return [];

    const findings: QaFinding[] = evidence.penetrations.map((pair) => ({
      code: 'GEO_PART_SELF_INTERSECTION',
      disposition: 'observe' as const,
      dimension: 'visualQuality' as const,
      profile: 'geometry.selfIntersection',
      message: `Parts ${JSON.stringify(pair.a)} and ${JSON.stringify(pair.b)} occupy the same space: they share ${pair.volume.toPrecision(3)} m³, which is ${(pair.fraction * 100).toFixed(1)}% of the smaller part.`,
      affected: { node: pair.a },
      measurement: {
        name: 'intersectionVolumeFraction',
        actual: pair.fraction,
        expected: CONTACT_VOLUME_FRACTION,
      },
      repairText:
        'Move one part clear of the other, or subtract it with boolDiff so the overlap becomes a real cut instead of two solids in the same place.',
    }));

    if (evidence.truncated) {
      findings.push({
        code: 'GEO_PART_SELF_INTERSECTION_TRUNCATED',
        disposition: 'observe' as const,
        dimension: 'visualQuality' as const,
        profile: 'geometry.selfIntersection',
        message: `Only ${evidence.pairsTested} of ${evidence.candidatePairs} overlapping part pairs were checked (analysis budget). Parts beyond that were not examined.`,
      });
    }

    return findings;
  },
});
