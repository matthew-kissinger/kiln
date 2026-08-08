/**
 * T4.1 — part-vs-part self-intersection.
 *
 * The gate's whole difficulty is the true negatives: bounding boxes call a bolt
 * in a hole an intersection, and triangle overlap cannot tell a lid resting on a
 * box from a lid sunk into it. Both are correct geometry that must not be
 * flagged, so both have fixtures here alongside the true positives.
 */

import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';
import {
  analyzePartPenetration,
  CONTACT_VOLUME_FRACTION,
  MAX_PART_TRIANGLES,
  SELF_INTERSECTION_QA_RULE,
} from './self-intersection';
import type { QaContext } from './types';
import { createAssetIntentV1 } from '../contracts';

function boxAt(name: string, size: [number, number, number], at: [number, number, number]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size));
  mesh.name = name;
  mesh.position.set(...at);
  return mesh;
}

function sceneOf(...meshes: THREE.Object3D[]): THREE.Object3D {
  const root = new THREE.Object3D();
  root.name = 'Asset';
  for (const m of meshes) root.add(m);
  return root;
}

const pairNames = (e: { penetrations: { a: string; b: string }[] }) =>
  e.penetrations.map((p) => [p.a, p.b]);

// -----------------------------------------------------------------------------
// True positives
// -----------------------------------------------------------------------------

describe('true positives — parts occupying the same space', () => {
  test('two boxes overlapping by half report the shared volume and fraction', async () => {
    const e = await analyzePartPenetration(
      sceneOf(boxAt('A', [1, 1, 1], [0, 0, 0]), boxAt('B', [1, 1, 1], [0.5, 0, 0])),
    );

    expect(pairNames(e)).toEqual([['A', 'B']]);
    // A 1x1x1 box overlapping another by 0.5 along x shares exactly 0.5 m³,
    // which is half of either part.
    expect(e.penetrations[0]!.volume).toBeCloseTo(0.5, 6);
    expect(e.penetrations[0]!.fraction).toBeCloseTo(0.5, 6);
  });

  test('a fully contained part reports a fraction of 1', async () => {
    const e = await analyzePartPenetration(
      sceneOf(boxAt('Outer', [2, 2, 2], [0, 0, 0]), boxAt('Inner', [0.5, 0.5, 0.5], [0, 0, 0])),
    );

    expect(e.penetrations).toHaveLength(1);
    expect(e.penetrations[0]!.fraction).toBeCloseTo(1, 6);
  });

  test('worst offender is reported first', async () => {
    const e = await analyzePartPenetration(
      sceneOf(
        boxAt('Base', [4, 1, 1], [0, 0, 0]),
        boxAt('Slight', [1, 1, 1], [1.95, 0, 0]),
        boxAt('Deep', [1, 1, 1], [-1.2, 0, 0]),
      ),
    );

    expect(e.penetrations.length).toBeGreaterThanOrEqual(2);
    expect(e.penetrations[0]!.fraction).toBeGreaterThan(e.penetrations[1]!.fraction);
    expect(e.penetrations[0]!.b).toBe('Deep');
  });
});

// -----------------------------------------------------------------------------
// True negatives — the reason this is a volume test
// -----------------------------------------------------------------------------

describe('true negatives — correct geometry that must not be flagged', () => {
  test('parts in flush contact share a surface, not a volume', async () => {
    // A lid sitting exactly on a box. Triangle overlap would call this a hit.
    const e = await analyzePartPenetration(
      sceneOf(boxAt('Box', [1, 1, 1], [0, 0, 0]), boxAt('Lid', [1, 0.1, 1], [0, 0.55, 0])),
    );

    expect(e.candidatePairs).toBeGreaterThan(0); // the broad phase did consider them
    expect(e.penetrations).toEqual([]);
  });

  /** Square plate, 2x2x0.2, with a bore of the given radius through its center. */
  function boredPlate(boreRadius: number): THREE.Mesh {
    const shape = new THREE.Shape();
    shape.moveTo(-1, -1);
    shape.lineTo(1, -1);
    shape.lineTo(1, 1);
    shape.lineTo(-1, 1);
    shape.closePath();
    const hole = new THREE.Path();
    hole.absarc(0, 0, boreRadius, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const plate = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false }),
    );
    plate.name = 'Plate';
    plate.rotation.x = -Math.PI / 2;
    return plate;
  }

  test('a bolt too fat for its bore IS caught — the negative below is not vacuous', async () => {
    const fat = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1, 24));
    fat.name = 'FatBolt';

    const e = await analyzePartPenetration(sceneOf(boredPlate(0.2), fat));

    expect(e.skipped).toEqual([]);
    expect(e.pairsTested).toBe(1);
    expect(pairNames(e)).toEqual([['Plate', 'FatBolt']]);
    expect(e.penetrations[0]!.fraction).toBeGreaterThan(0.1);
  });

  test('a socketed part in its hole is not flagged', async () => {
    // The classic bounding-box false positive: a bolt through a plate. The plate
    // has a real bore, so the two solids share no volume even though their boxes
    // overlap completely.
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1, 24));
    bolt.name = 'Bolt';

    const e = await analyzePartPenetration(sceneOf(boredPlate(0.2), bolt));

    expect(e.candidatePairs).toBe(1); // boxes do overlap
    // Neither part was skipped and the boolean really ran, so the empty result
    // is a measurement rather than an analysis that quietly did nothing.
    expect(e.skipped).toEqual([]);
    expect(e.pairsTested).toBe(1);
    expect(e.penetrations).toEqual([]); // volumes do not overlap
  });

  test('parts that are far apart never reach the narrow phase', async () => {
    const e = await analyzePartPenetration(
      sceneOf(boxAt('A', [1, 1, 1], [0, 0, 0]), boxAt('B', [1, 1, 1], [10, 0, 0])),
    );

    expect(e.candidatePairs).toBe(0);
    expect(e.pairsTested).toBe(0);
    expect(e.penetrations).toEqual([]);
  });

  test('a sliver of shared volume below the contact threshold is not a penetration', async () => {
    // Overlap of 1e-5 on a unit box — the scale of a coincident-face boolean
    // artifact, not of a modelling mistake.
    const e = await analyzePartPenetration(
      sceneOf(boxAt('A', [1, 1, 1], [0, 0, 0]), boxAt('B', [1, 1, 1], [1 - 1e-5, 0, 0])),
    );

    expect(e.penetrations).toEqual([]);
    expect(CONTACT_VOLUME_FRACTION).toBeGreaterThan(1e-5);
  });
});

// -----------------------------------------------------------------------------
// Determinism and bounds
// -----------------------------------------------------------------------------

describe('determinism and bounds', () => {
  test('the same scene produces an identical report every run', async () => {
    const build = () =>
      sceneOf(
        boxAt('A', [1, 1, 1], [0, 0, 0]),
        boxAt('B', [1, 1, 1], [0.5, 0, 0]),
        boxAt('C', [1, 1, 1], [0.25, 0.5, 0]),
      );

    const a = await analyzePartPenetration(build());
    const b = await analyzePartPenetration(build());
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  test('an oversized mesh is skipped with the reason, not silently ignored', async () => {
    const dense = new THREE.Mesh(new THREE.SphereGeometry(1, 200, 200));
    dense.name = 'Dense';
    expect(dense.geometry.getIndex()!.count / 3).toBeGreaterThan(MAX_PART_TRIANGLES);

    const e = await analyzePartPenetration(sceneOf(dense, boxAt('B', [1, 1, 1], [0, 0, 0])));

    expect(e.skipped.map((s) => s.part)).toContain('Dense');
    expect(e.skipped[0]!.reason).toContain('analysis budget');
    expect(e.partsAnalyzed).toBe(1);
  });

  test('an open shell encloses no volume and is reported, not treated as clean', async () => {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    plane.name = 'Card';
    const e = await analyzePartPenetration(sceneOf(plane, boxAt('B', [1, 1, 1], [0, 0, 0])));

    // Either manifold rejects it (reported in `skipped`) or it is closed enough
    // to measure; what must not happen is a silent pass with no record.
    expect(e.skipped.length + e.pairsTested).toBeGreaterThan(0);
    expect(e.penetrations).toEqual([]);
  });

  test('a scene with fewer than two parts costs nothing', async () => {
    const e = await analyzePartPenetration(sceneOf(boxAt('Only', [1, 1, 1], [0, 0, 0])));
    expect(e.partsAnalyzed).toBe(1);
    expect(e.candidatePairs).toBe(0);
    expect(e.penetrations).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
// The rule
// -----------------------------------------------------------------------------

describe('the QA rule', () => {
  const contextWith = (partPenetration: unknown): QaContext => ({
    intent: createAssetIntentV1({ category: 'prop' }),
    derivedEvidence: { source: 'engine-scene-analysis', partPenetration },
  });

  test('starts in observe, as the plan requires before any promotion evidence', () => {
    expect(SELF_INTERSECTION_QA_RULE.defaultMode).toBe('observe');
    expect(SELF_INTERSECTION_QA_RULE.promotion).toBeUndefined();
    // `exact` in this registry is a promotion contract, not a claim about the
    // arithmetic: every exact rule must be enforcing on frozen conformance
    // evidence. Until that evidence exists this stays heuristic, however precise
    // the boolean volume underneath it is.
    expect(SELF_INTERSECTION_QA_RULE.ruleClass).toBe('heuristic');
  });

  test('a finding names both parts, the shared volume, and how to fix it', async () => {
    const evidence = await analyzePartPenetration(
      sceneOf(boxAt('Handle', [1, 1, 1], [0, 0, 0]), boxAt('Body', [1, 1, 1], [0.5, 0, 0])),
    );
    const [finding] = SELF_INTERSECTION_QA_RULE.evaluate(contextWith(evidence));

    expect(finding!.code).toBe('GEO_PART_SELF_INTERSECTION');
    expect(finding!.disposition).toBe('observe');
    expect(finding!.message).toContain('"Handle"');
    expect(finding!.message).toContain('"Body"');
    expect(finding!.repairText).toContain('boolDiff');
  });

  test('no evidence yields no findings — an analysis that did not run is not a pass', () => {
    expect(SELF_INTERSECTION_QA_RULE.evaluate(contextWith(undefined))).toEqual([]);
    expect(
      SELF_INTERSECTION_QA_RULE.evaluate({ intent: createAssetIntentV1({ category: 'prop' }) }),
    ).toEqual([]);
  });

  test('a truncated analysis says so rather than reading as complete', () => {
    const findings = SELF_INTERSECTION_QA_RULE.evaluate(
      contextWith({
        schemaVersion: 1,
        source: 'engine-scene-analysis',
        partsAnalyzed: 40,
        candidatePairs: 200,
        pairsTested: 64,
        truncated: true,
        skipped: [],
        penetrations: [],
      }),
    );

    expect(findings).toHaveLength(1);
    expect(findings[0]!.code).toBe('GEO_PART_SELF_INTERSECTION_TRUNCATED');
    expect(findings[0]!.message).toContain('64 of 200');
  });
});
