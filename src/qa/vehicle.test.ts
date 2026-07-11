import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';

import { createAssetIntentV1, stampSemanticMetadataV1 } from '../contracts';
import {
  createVehicleFrame,
  createWheelAssembly,
  createWheelGeometrySet,
  type WheelAssemblyResult,
} from '../vehicle';
import { evaluateVehicleQa } from './vehicle';

const tireMaterial = new THREE.MeshStandardMaterial({ color: 0x171717 });
const metalMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });

function wheeledVehicle() {
  const frame = createVehicleFrame('Car', {
    axles: [
      { id: 'front', position: [1.2, 0.5, 0] },
      { id: 'rear', position: [-1.2, 0.5, 0] },
    ],
  });
  frame.root.position.set(3, 1, -2);
  frame.root.rotation.set(0.1, 0.6, -0.05);
  const geometry = createWheelGeometrySet(0.5, 0.2);
  const wheels: WheelAssemblyResult[] = [];
  for (const [index, x] of [
    ['front', 1.2],
    ['rear', -1.2],
  ] as const) {
    for (const side of ['left', 'right'] as const) {
      wheels.push(
        createWheelAssembly(
          'Wheel',
          { tire: tireMaterial, rim: metalMaterial },
          {
            radius: 0.5,
            width: 0.2,
            side,
            index,
            position: [x, 0.5, side === 'left' ? -0.85 : 0.85],
            steering: index === 'front',
            geometries: geometry,
            parent: frame.root,
          },
        ),
      );
    }
  }
  const intent = createAssetIntentV1({
    category: 'vehicle',
    subtype: 'wheeled',
    vehicle: {
      subtype: 'wheeled',
      wheelCount: 4,
      axleCount: 2,
      steering: 'front',
      supportPolicy: 'grounded',
    },
  });
  const findings = () => evaluateVehicleQa({ intent, scene: frame.root });
  return { frame, wheels, intent, findings };
}

function codes(findings: readonly { code: string }[]): string[] {
  return findings.map((finding) => finding.code);
}

describe('vehicle semantic QA', () => {
  test('accepts a transformed canonical four-wheel assembly', () => {
    const { findings } = wheeledVehicle();
    expect(findings()).toEqual([]);
  });

  test('blocks an explicit four-wheel intent when five assemblies resolve', () => {
    const fixture = wheeledVehicle();
    createWheelAssembly(
      'Spare',
      { tire: tireMaterial, rim: metalMaterial },
      {
        radius: 0.5,
        width: 0.2,
        side: 'left',
        index: 'spare',
        position: [0, 0.5, -0.85],
        parent: fixture.frame.root,
      },
    );
    const findings = fixture.findings();
    expect(codes(findings)).toContain('VEH_WHEEL_COUNT');
    expect(findings.find((finding) => finding.code === 'VEH_WHEEL_COUNT')?.disposition).toBe(
      'block',
    );
  });

  test('blocks duplicate semantic assemblies at one corner even when total count remains four', () => {
    const fixture = wheeledVehicle();
    fixture.wheels[3]!.root.removeFromParent();
    createWheelAssembly(
      'Duplicate',
      { tire: tireMaterial, rim: metalMaterial },
      {
        radius: 0.5,
        width: 0.2,
        side: 'left',
        index: 'front',
        position: [1.2, 0.5, -0.85],
        steering: true,
        parent: fixture.frame.root,
      },
    );
    const duplicate = fixture
      .findings()
      .find((finding) => finding.code === 'VEH_DUPLICATE_ASSEMBLY')!;
    expect(duplicate.disposition).toBe('block');
    expect(duplicate.measurement?.name).toBe('duplicateAssemblyCenterDelta');
    expect(duplicate.measurement?.actual).toBeCloseTo(0, 8);
    expect(duplicate.repairText).toContain('Remove only duplicate assembly');
  });

  test('localizes raised hubcaps and invalid nested radii', () => {
    const fixture = wheeledVehicle();
    fixture.wheels[0]!.hub.position.y = 0.16;
    fixture.wheels[1]!.hub.scale.setScalar(2.4);
    const findings = fixture.findings();
    expect(codes(findings)).toContain('VEH_WHEEL_CONCENTRICITY');
    expect(codes(findings)).toContain('VEH_WHEEL_RADIUS');
    expect(
      findings.find((finding) => finding.code === 'VEH_WHEEL_CONCENTRICITY')?.measurement?.actual,
    ).toBeGreaterThan(0.1);
  });

  test('uses scale-relative local measurements for concentricity', () => {
    const fixture = wheeledVehicle();
    fixture.frame.root.scale.setScalar(10);
    fixture.wheels[0]!.hub.position.y = 0.005;
    expect(codes(fixture.findings())).not.toContain('VEH_WHEEL_CONCENTRICITY');
    fixture.wheels[0]!.hub.position.y = 0.02;
    const concentricity = fixture
      .findings()
      .find((finding) => finding.code === 'VEH_WHEEL_CONCENTRICITY');
    expect(concentricity?.measurement?.actual).toBeCloseTo(0.02, 6);
    expect(concentricity?.measurement?.threshold).toBeCloseTo(0.015, 6);
  });

  test('detects wrong axle orientation and off-center component ownership', () => {
    const fixture = wheeledVehicle();
    fixture.wheels[0]!.spinPivot.rotation.y = Math.PI / 2;
    for (const part of [fixture.wheels[1]!.tire, fixture.wheels[1]!.rim, fixture.wheels[1]!.hub]) {
      part.position.x = 0.2;
    }
    const findings = fixture.findings();
    expect(codes(findings)).toContain('VEH_WHEEL_AXLE_AXIS');
    expect(codes(findings)).toContain('VEH_WHEEL_PIVOT');
  });

  test('detects paired-X/Y mismatch and floating contact', () => {
    const fixture = wheeledVehicle();
    fixture.wheels[1]!.root.position.x = 0.2;
    fixture.wheels[2]!.root.position.y = 0.18;
    const findings = fixture.findings();
    expect(codes(findings)).toContain('VEH_AXLE_PAIR');
    expect(codes(findings)).toContain('VEH_CONTACT_PLANE');
  });

  test('requires declared non-wheel supports to touch the canonical contact plane', () => {
    const frame = createVehicleFrame('TrackedVehicle');
    const leftTrack = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 0.25), metalMaterial);
    leftTrack.name = 'LeftTrackSupport';
    leftTrack.position.set(0, 0.2, -0.75); // bottom = +0.1, floating
    stampSemanticMetadataV1(leftTrack, { roles: ['support.track.left'] });
    const rightTrack = leftTrack.clone();
    rightTrack.name = 'RightTrackSupport';
    rightTrack.position.set(0, 0, 0.75); // bottom = -0.1, buried
    stampSemanticMetadataV1(rightTrack, { roles: ['support.track.right'] });
    frame.root.add(leftTrack, rightTrack);
    const intent = createAssetIntentV1({ category: 'vehicle', subtype: 'tracked' });
    const findings = evaluateVehicleQa({ intent, scene: frame.root }).filter(
      (finding) => finding.code === 'VEH_CONTACT_PLANE',
    );
    expect(findings).toHaveLength(2);
    expect(findings.map((finding) => finding.measurement?.actual)).toEqual(
      expect.arrayContaining([expect.closeTo(0.1, 6), expect.closeTo(-0.1, 6)]),
    );
    leftTrack.position.y = 0.1;
    rightTrack.position.y = 0.1;
    expect(codes(evaluateVehicleQa({ intent, scene: frame.root }))).not.toContain(
      'VEH_CONTACT_PLANE',
    );
  });

  test('requires declared non-wheel support types and one stable contact plane', () => {
    const frame = createVehicleFrame('TrackedVehicle');
    const left = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 0.25), metalMaterial);
    left.name = 'LeftTrack';
    left.position.set(0, 0.1, -0.75);
    const right = left.clone();
    right.name = 'RightTrack';
    right.position.set(0, 0.3, 0.75);
    frame.root.add(left, right);
    const intent = createAssetIntentV1({ category: 'vehicle', subtype: 'tracked' });
    expect(codes(evaluateVehicleQa({ intent, scene: frame.root }))).toContain(
      'VEH_SUPPORT_SET_MISSING',
    );

    stampSemanticMetadataV1(left, { roles: ['support.track.left'] });
    stampSemanticMetadataV1(right, { roles: ['support.track.right'] });
    const findings = evaluateVehicleQa({ intent, scene: frame.root });
    expect(codes(findings)).not.toContain('VEH_SUPPORT_SET_MISSING');
    expect(codes(findings)).toContain('VEH_SUPPORT_PLANE');
    expect(
      findings.find((finding) => finding.code === 'VEH_SUPPORT_PLANE')?.measurement?.actual,
    ).toBeCloseTo(0.2, 6);

    right.position.y = 0.1;
    expect(codes(evaluateVehicleQa({ intent, scene: frame.root }))).not.toEqual(
      expect.arrayContaining(['VEH_SUPPORT_SET_MISSING', 'VEH_SUPPORT_PLANE']),
    );
  });

  test('requires generated +X-front semantics and centered steering ownership', () => {
    const fixture = wheeledVehicle();
    fixture.frame.root.userData = {};
    fixture.wheels[0]!.spinPivot.removeFromParent();
    fixture.frame.root.add(fixture.wheels[0]!.spinPivot);
    fixture.wheels[0]!.spinPivot.position.copy(fixture.wheels[0]!.steeringPivot!.position);
    const findings = fixture.findings();
    expect(codes(findings)).toContain('VEH_FRONT_AXIS');
    expect(codes(findings)).toContain('VEH_STEERING_PIVOT');
  });

  test('rejects a centered steering pivot whose declared local axis is not vehicle +Y', () => {
    const fixture = wheeledVehicle();
    fixture.wheels[0]!.steeringPivot!.rotation.z = Math.PI / 2;
    const steering = fixture.findings().find((finding) => finding.code === 'VEH_STEERING_PIVOT');
    expect(steering?.disposition).toBe('block');
    expect(steering?.measurement?.actual).not.toBe(0);
  });

  test('boat and wheelless profiles never inherit wheel rules', () => {
    const frame = createVehicleFrame('Boat');
    const intent = createAssetIntentV1({ category: 'vehicle', subtype: 'watercraft' });
    const findings = evaluateVehicleQa({ intent, scene: frame.root });
    expect(codes(findings)).not.toContain('VEH_WHEEL_COUNT');
    expect(codes(findings)).not.toContain('VEH_WHEEL_RADIUS');
  });

  test('validates declared rotor pivot, hierarchy, mast center, and +Y axis frame', () => {
    const frame = createVehicleFrame('Helicopter');
    const intent = createAssetIntentV1({ category: 'vehicle', subtype: 'rotorcraft' });
    expect(codes(evaluateVehicleQa({ intent, scene: frame.root }))).toContain('VEH_ROTOR_PIVOT');
    const pivot = new THREE.Object3D();
    pivot.name = 'MainRotorPivot';
    stampSemanticMetadataV1(pivot, {
      roles: ['propulsion.pivot.main'],
      frames: [{ id: 'propulsion-axis.+y', translation: [0, 0, 0], rotation: [0, 0, 0, 1] }],
    });
    const rotor = new THREE.Mesh(new THREE.BoxGeometry(3, 0.05, 0.12), metalMaterial);
    rotor.name = 'MainRotor';
    stampSemanticMetadataV1(rotor, { roles: ['propulsion.rotor.main'] });
    pivot.add(rotor);
    frame.root.add(pivot);
    expect(evaluateVehicleQa({ intent, scene: frame.root })).toEqual([]);

    pivot.rotation.z = Math.PI / 2;
    expect(codes(evaluateVehicleQa({ intent, scene: frame.root }))).toContain('VEH_ROTOR_PIVOT');
  });

  test('validates a declared propeller shaft at its center on vehicle-local +X', () => {
    const frame = createVehicleFrame('PropPlane');
    const pivot = new THREE.Object3D();
    pivot.name = 'PropellerPivot';
    stampSemanticMetadataV1(pivot, {
      roles: ['propulsion.pivot.main'],
      frames: [{ id: 'propulsion-axis.+x', translation: [0, 0, 0], rotation: [0, 0, 0, 1] }],
    });
    const propeller = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.4, 0.12), metalMaterial);
    stampSemanticMetadataV1(propeller, { roles: ['propulsion.propeller.main'] });
    pivot.add(propeller);
    frame.root.add(pivot);
    const intent = createAssetIntentV1({ category: 'vehicle', subtype: 'fixed-wing' });
    expect(evaluateVehicleQa({ intent, scene: frame.root })).toEqual([]);
    propeller.position.y = 0.2;
    expect(codes(evaluateVehicleQa({ intent, scene: frame.root }))).toContain('VEH_ROTOR_PIVOT');
  });
});
