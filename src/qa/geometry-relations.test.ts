import { describe, expect, test } from 'bun:test';

import {
  createOrientedProbeBox3,
  probeLocalFrameFromQuaternion,
  probeOrientedAlignment,
  probeOrientedClearance,
  probeOrientedConcentricity,
  probeOrientedContact,
  probeOrientedContainment,
  probeOrientedCoverage,
  probeOrientedPenetration,
  type OrientedProbeBox3,
  type ProbeVector3,
} from './geometry-relations';

const yawQuaternion = (degrees: number): [number, number, number, number] => {
  const radians = (degrees * Math.PI) / 180;
  return [0, Math.sin(radians / 2), 0, Math.cos(radians / 2)];
};

const box = (
  id: string,
  origin: ProbeVector3,
  halfExtents: ProbeVector3,
  yawDegrees = 0,
): OrientedProbeBox3 =>
  createOrientedProbeBox3({
    id,
    frame: probeLocalFrameFromQuaternion(`${id}.frame`, origin, yawQuaternion(yawDegrees)),
    halfExtents,
  });

const rotateY = (point: ProbeVector3, degrees: number, translation: ProbeVector3): ProbeVector3 => {
  const radians = (degrees * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  return [
    cosine * point[0] + sine * point[2] + translation[0],
    point[1] + translation[1],
    -sine * point[0] + cosine * point[2] + translation[2],
  ];
};

describe('oriented local-space relation probes', () => {
  test('contact, clearance, and penetration are reciprocal with localized evidence', () => {
    const reference = box('chassis', [0, 0, 0], [1, 1, 1], 23);
    const touching = box(
      'wheel',
      [2 * Math.cos((23 * Math.PI) / 180), 0, -2 * Math.sin((23 * Math.PI) / 180)],
      [1, 0.5, 0.5],
      23,
    );

    const forward = probeOrientedContact(touching, reference);
    const reciprocal = probeOrientedContact(reference, touching);
    expect(forward.pass).toBe(true);
    expect(reciprocal.pass).toBe(true);
    expect(forward.measurements.separation).toBe(reciprocal.measurements.separation);
    expect(forward.measurements.penetration).toBe(reciprocal.measurements.penetration);
    expect(forward.evidence.coordinateSpace).toBe('reference-local');
    expect(forward.evidence.referenceFrameId).toBe('chassis.frame');
    expect(forward.evidence.points).toHaveLength(2);

    const separated = box(
      'separatedWheel',
      [2.25 * Math.cos((23 * Math.PI) / 180), 0, -2.25 * Math.sin((23 * Math.PI) / 180)],
      [1, 0.5, 0.5],
      23,
    );
    const clearance = probeOrientedClearance(separated, reference, { minimumClearance: 0.2 });
    const clearanceReciprocal = probeOrientedClearance(reference, separated, {
      minimumClearance: 0.2,
    });
    expect(clearance.pass).toBe(true);
    expect(clearance.measurements.clearance).toBeCloseTo(0.25, 7);
    expect(clearanceReciprocal.measurements.clearance).toBe(clearance.measurements.clearance);

    const embedded = box(
      'embeddedWheel',
      [1.6 * Math.cos((23 * Math.PI) / 180), 0, -1.6 * Math.sin((23 * Math.PI) / 180)],
      [1, 0.5, 0.5],
      23,
    );
    const penetration = probeOrientedPenetration(embedded, reference, { maxDepth: 0.1 });
    const penetrationReciprocal = probeOrientedPenetration(reference, embedded, {
      maxDepth: 0.1,
    });
    expect(penetration.pass).toBe(false);
    expect(penetration.measurements.penetrationDepth).toBeCloseTo(0.4, 7);
    expect(penetrationReciprocal.measurements.penetrationDepth).toBe(
      penetration.measurements.penetrationDepth,
    );
  });

  test('distinguishes rotated OBB separation where global AABBs overlap', () => {
    const yaw = 45;
    const radians = (yaw * Math.PI) / 180;
    const perpendicular: ProbeVector3 = [Math.sin(radians), 0, Math.cos(radians)];
    const reference = box('beamA', [0, 0, 0], [2, 0.2, 0.1], yaw);
    const subject = box(
      'beamB',
      [perpendicular[0] * 0.5, 0, perpendicular[2] * 0.5],
      [2, 0.2, 0.1],
      yaw,
    );

    // Each world AABB spans ~2.97m on X and Z, so those AABBs overlap. The
    // local-space slabs are actually 0.3m apart along their narrow Z axes.
    const relation = probeOrientedClearance(subject, reference, { minimumClearance: 0.25 });
    expect(relation.pass).toBe(true);
    expect(relation.measurements.clearance).toBeCloseTo(0.3, 7);
    expect(probeOrientedContact(subject, reference).pass).toBe(false);
    expect(relation.evidence.axis).toEqual([0, 0, 1]);
  });

  test('containment is directional and reports the exact escaped corners', () => {
    const container = box('cargoBay', [3, 2, -4], [2, 1.5, 1.25], 37);
    const contained = box('crate', [3, 2, -4], [0.5, 0.5, 0.5], 52);
    const inside = probeOrientedContainment(contained, container);
    const reciprocal = probeOrientedContainment(container, contained);
    expect(inside.pass).toBe(true);
    expect(inside.measurements.outsideCornerCount).toBe(0);
    expect(inside.measurements.minimumInteriorMargin).toBeGreaterThan(0);
    expect(reciprocal.pass).toBe(false);
    expect(reciprocal.measurements.outsideCornerCount).toBeGreaterThan(0);
    expect(
      reciprocal.evidence.points.every((point) => point.label.startsWith('cargoBay.corner.')),
    ).toBe(true);
  });

  test('alignment and concentricity separate angular, lateral, and axial measurements', () => {
    const axle = box('axle', [5, 1, 2], [1.5, 0.1, 0.1], 31);
    const centeredHub = box('hub', rotateY([0.35, 0, 0], 31, [5, 1, 2]), [0.2, 0.5, 0.5], 31);
    const aligned = probeOrientedAlignment(centeredHub, axle, {
      maxAngleDegrees: 0.01,
      maxLateralOffset: 0.001,
    });
    const concentric = probeOrientedConcentricity(centeredHub, axle, {
      maxRadialOffset: 0.001,
      maxAngleDegrees: 0.01,
    });
    expect(aligned.pass).toBe(true);
    expect(concentric.pass).toBe(true);
    expect(concentric.measurements.radialOffset).toBe(0);
    expect(concentric.measurements.axialOffset).toBeCloseTo(0.35, 10);

    const offsetHub = box(
      'offsetHub',
      rotateY([0.35, 0, 0.08], 31, [5, 1, 2]),
      [0.2, 0.5, 0.5],
      43,
    );
    const failed = probeOrientedConcentricity(offsetHub, axle, {
      maxRadialOffset: 0.02,
      maxAngleDegrees: 2,
    });
    expect(failed.pass).toBe(false);
    expect(failed.measurements.radialOffset).toBeCloseTo(0.08, 10);
    expect(failed.measurements.angleDegrees).toBeCloseTo(12, 6);
  });

  test('coverage clips a rotated projected polygon and remains intentionally directional', () => {
    const target = box('roofFootprint', [0, 0, 0], [1, 0.1, 1], 18);
    const cover = box('roofPanel', [0, 0.15, 0], [1.35, 0.05, 1.35], 33);
    const covered = probeOrientedCoverage(cover, target, {
      normalAxis: 'y',
      minimumRatio: 0.999,
    });
    const reciprocal = probeOrientedCoverage(target, cover, {
      normalAxis: 'y',
      minimumRatio: 0.9,
    });
    expect(covered.pass).toBe(true);
    expect(covered.measurements.coverageRatio).toBe(1);
    expect(covered.measurements.coveredArea).toBeCloseTo(4, 10);
    expect(covered.measurements.normalOffset).toBeCloseTo(0.15, 10);
    expect(reciprocal.pass).toBe(false);
    expect(reciprocal.measurements.coverageRatio).toBeLessThan(0.9);
    expect(covered.evidence.points.length).toBeGreaterThanOrEqual(4);
  });

  test('all seven probes are invariant under a shared rigid transform and deterministic on rerun', () => {
    const sharedYaw = 57;
    const translation: ProbeVector3 = [8, -3, 11];
    const baseReference = box('reference', [0, 0, 0], [1, 1, 1], 10);
    const baseSubject = box('subject', [1.75, 0, 0], [0.75, 0.5, 0.5], 10);
    const movedReference = box(
      'reference',
      rotateY(baseReference.frame.origin, sharedYaw, translation),
      [1, 1, 1],
      10 + sharedYaw,
    );
    const movedSubject = box(
      'subject',
      rotateY(baseSubject.frame.origin, sharedYaw, translation),
      [0.75, 0.5, 0.5],
      10 + sharedYaw,
    );

    const evaluate = (subject: OrientedProbeBox3, reference: OrientedProbeBox3) => [
      probeOrientedContact(subject, reference, { maxPenetration: 0.01 }),
      probeOrientedContainment(subject, reference),
      probeOrientedClearance(subject, reference, { minimumClearance: 0.1 }),
      probeOrientedConcentricity(subject, reference, { maxRadialOffset: 0.01 }),
      probeOrientedAlignment(subject, reference, { maxLateralOffset: 0.01 }),
      probeOrientedCoverage(subject, reference),
      probeOrientedPenetration(subject, reference, { maxDepth: 0.1 }),
    ];
    const base = evaluate(baseSubject, baseReference);
    const moved = evaluate(movedSubject, movedReference);
    expect(moved.map((result) => result.pass)).toEqual(base.map((result) => result.pass));
    moved.forEach((result, resultIndex) => {
      const baseMeasurements = base[resultIndex]!.measurements;
      expect(Object.keys(result.measurements)).toEqual(Object.keys(baseMeasurements));
      for (const [name, value] of Object.entries(result.measurements)) {
        expect(Math.abs(value - baseMeasurements[name]!)).toBeLessThan(2e-6);
      }
    });
    expect(evaluate(movedSubject, movedReference)).toEqual(moved);
    expect(new Set(moved.map((result) => result.relation))).toEqual(
      new Set([
        'contact',
        'containment',
        'clearance',
        'concentricity',
        'alignment',
        'coverage',
        'penetration',
      ]),
    );
  });

  test('directed local-axis clearance measures headroom rather than nearest global separation', () => {
    const ceiling = box('ceiling', [2, 3, -1], [2, 0.1, 2], 28);
    const actor = box('actor', rotateY([0, -1.1, 0], 28, [2, 3, -1]), [0.4, 0.9, 0.4], 28);
    const headroom = probeOrientedClearance(ceiling, actor, {
      minimumClearance: 0.09,
      axis: 'y',
      direction: 1,
    });
    expect(headroom.pass).toBe(true);
    expect(headroom.measurements.clearance).toBeCloseTo(0.1, 10);
    expect(headroom.evidence.axis).toEqual([0, 1, 0]);
  });
});
