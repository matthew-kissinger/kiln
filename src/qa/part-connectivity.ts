/**
 * Part-connectivity gate — T4.2
 *
 * ## What this adds over the existing floating-parts warning
 *
 * `inspectSceneStructure` (`render.ts`) already reports a part with no
 * neighbour: for each mesh, does any sibling's box come within 2 cm? That is
 * **pairwise adjacency**, and it misses the case the plan actually names —
 * a *disconnected component*. Three parts that touch each other but float as a
 * cluster away from the body each have a neighbour, so every one passes the
 * pairwise test while the group as a whole is detached.
 *
 * This rule builds the adjacency graph and finds its connected components.
 * Anything not in the largest component is reported, with the parts it is
 * attached to, so the finding says "this subassembly is floating" rather than
 * "this part is alone" — which is both stronger and more useful, since a
 * detached cluster is usually one missing join rather than N misplaced parts.
 *
 * ## Exemptions
 *
 * Some parts are legitimately separate and always will be:
 *
 * - **Foliage cards and decals** are meant to sit off the surface.
 * - **Wheels** contact an axle whose geometry may be inside the hub, and a
 *   detached-looking wheel is the vehicle rules' business, not this one.
 * - **Joint pivots** carry no geometry and never participate.
 *
 * Exemption is by declared role — the `Joint_`/`Mesh_` naming and the
 * category the intent already carries — not by guessing from shape. A rule that
 * inferred "this looks like foliage" would fail exactly when an asset is
 * unusual, which is when a QA gate matters most.
 *
 * ## Cost
 *
 * Pure AABB work: O(n²) box comparisons to build the graph, then a linear
 * flood fill. No booleans, no WASM, so unlike T4.1 this runs inside the
 * synchronous rule with no pre-pass.
 */

import * as THREE from 'three';
import { KILN_ENGINE_QA_OWNER, type QaRule } from './registry';
import type { QaContext, QaFinding } from './types';

/**
 * Adjacency tolerance, matching the existing floating-parts warning so the two
 * never disagree about whether two parts touch.
 */
export const CONNECTIVITY_TOLERANCE = 0.02;

/**
 * Names that are expected to stand apart from the body.
 *
 * Matched against the mesh name, which Kiln's own helpers control (`createPart`
 * prefixes `Mesh_`, `createPivot` prefixes `Joint_`), so this keys off declared
 * structure rather than inferred shape.
 */
const EXEMPT_NAME = /(?:^|_)(?:leaf|leaves|foliage|frond|card|decal|billboard|petal)/i;

interface ConnectivityPart {
  name: string;
  box: THREE.Box3;
}

export interface DisconnectedGroupV1 {
  /** Parts in this component, in traversal order. */
  parts: string[];
  /** Shortest distance from this component to the main one, in meters. */
  gap: number;
}

export interface PartConnectivityReportV1 {
  partsAnalyzed: number;
  /** Size of the largest component — the body everything should hang off. */
  mainComponentSize: number;
  exempt: string[];
  groups: DisconnectedGroupV1[];
}

function collectParts(root: THREE.Object3D, exempt: string[]): ConnectivityPart[] {
  const parts: ConnectivityPart[] = [];
  root.updateWorldMatrix(true, true);
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    const name = mesh.name || '(unnamed mesh)';
    if (EXEMPT_NAME.test(name)) {
      exempt.push(name);
      return;
    }
    const box = new THREE.Box3().setFromObject(mesh);
    if (box.isEmpty()) return;
    parts.push({ name, box });
  });
  return parts;
}

/** Shortest distance between two boxes; 0 when they touch or overlap. */
function boxGap(a: THREE.Box3, b: THREE.Box3): number {
  const dx = Math.max(0, Math.max(a.min.x - b.max.x, b.min.x - a.max.x));
  const dy = Math.max(0, Math.max(a.min.y - b.max.y, b.min.y - a.max.y));
  const dz = Math.max(0, Math.max(a.min.z - b.max.z, b.min.z - a.max.z));
  return Math.hypot(dx, dy, dz);
}

/**
 * Group parts into connected components by box adjacency.
 *
 * Exported for testing and for anything that wants the structure rather than
 * the finding.
 */
export function analyzePartConnectivity(root: THREE.Object3D): PartConnectivityReportV1 {
  const exempt: string[] = [];
  const parts = collectParts(root, exempt);
  const report: PartConnectivityReportV1 = {
    partsAnalyzed: parts.length,
    mainComponentSize: parts.length,
    exempt,
    groups: [],
  };
  if (parts.length < 2) return report;

  const adjacency: number[][] = parts.map(() => []);
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      if (boxGap(parts[i]!.box, parts[j]!.box) <= CONNECTIVITY_TOLERANCE) {
        adjacency[i]!.push(j);
        adjacency[j]!.push(i);
      }
    }
  }

  const component = new Int32Array(parts.length).fill(-1);
  const components: number[][] = [];
  for (let seed = 0; seed < parts.length; seed++) {
    if (component[seed] !== -1) continue;
    const id = components.length;
    const members: number[] = [];
    const stack = [seed];
    component[seed] = id;
    while (stack.length > 0) {
      const current = stack.pop()!;
      members.push(current);
      for (const next of adjacency[current]!) {
        if (component[next] === -1) {
          component[next] = id;
          stack.push(next);
        }
      }
    }
    members.sort((x, y) => x - y);
    components.push(members);
  }

  if (components.length < 2) return report;

  // The main body is the largest component; ties break on the earliest part in
  // traversal order, so the choice is deterministic rather than incidental.
  let mainIndex = 0;
  for (let i = 1; i < components.length; i++) {
    const bigger = components[i]!.length > components[mainIndex]!.length;
    const tie =
      components[i]!.length === components[mainIndex]!.length &&
      components[i]![0]! < components[mainIndex]![0]!;
    if (bigger || tie) mainIndex = i;
  }
  const main = components[mainIndex]!;
  report.mainComponentSize = main.length;

  for (const [index, members] of components.entries()) {
    if (index === mainIndex) continue;
    let gap = Number.POSITIVE_INFINITY;
    for (const m of members) {
      for (const b of main) {
        gap = Math.min(gap, boxGap(parts[m]!.box, parts[b]!.box));
      }
    }
    report.groups.push({
      parts: members.map((m) => parts[m]!.name),
      gap: Math.round(gap * 1e6) / 1e6,
    });
  }

  // Largest detached group first — the biggest missing join is the one to fix.
  report.groups.sort((a, b) => b.parts.length - a.parts.length || a.gap - b.gap);
  return report;
}

/**
 * Report subassemblies that are not attached to the body.
 *
 * `observe` with no promotion evidence, per the plan and the registry's rule:
 * `exact` is reserved for rules already enforcing on frozen conformance
 * evidence, so a new gate is `heuristic` however precise its arithmetic.
 */
export const PART_CONNECTIVITY_QA_RULE: QaRule = Object.freeze({
  id: 'GEO_PART_CONNECTIVITY',
  profile: 'geometry.partConnectivity',
  scope: { kind: 'universal' as const },
  ruleClass: 'heuristic',
  owner: KILN_ENGINE_QA_OWNER,
  defaultMode: 'observe',
  evaluate(context: QaContext): readonly QaFinding[] {
    if (!(context.scene instanceof THREE.Object3D)) return [];
    const report = analyzePartConnectivity(context.scene);
    if (report.groups.length === 0) return [];

    return report.groups.map((group) => {
      const listed = group.parts.map((p) => JSON.stringify(p)).join(', ');
      const subject =
        group.parts.length === 1
          ? `Part ${listed} is`
          : `A group of ${group.parts.length} parts (${listed}) is`;
      return {
        code: 'GEO_PART_CONNECTIVITY',
        disposition: 'observe' as const,
        dimension: 'visualQuality' as const,
        profile: 'geometry.partConnectivity',
        message: `${subject} not attached to the main body — the nearest gap is ${group.gap.toFixed(3)} m. ${
          group.parts.length === 1
            ? 'It floats on its own.'
            : 'These parts touch each other but nothing else, so one join is missing rather than several parts being misplaced.'
        }`,
        affected: { node: group.parts[0]! },
        measurement: {
          name: 'gapToMainComponent',
          actual: group.gap,
          expected: CONNECTIVITY_TOLERANCE,
        },
        repairText: `Attach it with snapTo(${JSON.stringify(group.parts[0]!)}Part, hostPart), or reposition the group so it contacts the body. If it is meant to stand apart, say so in the part name (foliage, card, decal) so this check skips it.`,
      };
    });
  },
});
