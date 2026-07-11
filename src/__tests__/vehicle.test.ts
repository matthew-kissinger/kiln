import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';

import { readSemanticMetadataV1 } from '../contracts';
import {
  VEHICLE_AXES,
  createVehicleFrame,
  createWheelAssembly,
  createWheelGeometrySet,
  hasCanonicalVehicleFront,
  resolveVehicleWheelAssemblies,
} from '../vehicle';

const tire = new THREE.MeshStandardMaterial({ color: 0x181818 });
const metal = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.8 });

function layout(count: 2 | 4 | 6, transformed = false) {
  const parent = new THREE.Object3D();
  if (transformed) {
    parent.position.set(4, 2, -3);
    parent.rotation.set(0.2, 0.7, -0.1);
  }
  const axleXs = count === 2 ? [0] : count === 4 ? [1.2, -1.2] : [1.6, 0, -1.6];
  const frame = createVehicleFrame(`Vehicle${count}`, {
    parent,
    axles: axleXs.map((x, index) => ({ id: String(index), position: [x, 0.5, 0] })),
    seats: [{ id: 'driver', position: [0.25, 1, -0.25] }],
    contacts: axleXs.flatMap((x, index) => [
      { id: `${index}-left`, position: [x, 0, -0.8] as [number, number, number] },
      { id: `${index}-right`, position: [x, 0, 0.8] as [number, number, number] },
    ]),
    steering: [{ id: 'front', position: [axleXs[0]!, 0.5, 0] }],
    propulsion: [{ id: 'motor', position: [-0.5, 0.65, 0] }],
  });
  const geometries = createWheelGeometrySet(0.5, 0.2);
  const wheels = axleXs.flatMap((x, index) =>
    (['left', 'right'] as const).map((side) =>
      createWheelAssembly(
        'Wheel',
        { tire, rim: metal },
        {
          radius: 0.5,
          width: 0.2,
          side,
          index,
          position: [x, 0.5, side === 'left' ? -0.8 : 0.8],
          steering: index === 0,
          geometries,
          parent: frame.root,
        },
      ),
    ),
  );
  parent.updateMatrixWorld(true);
  return { parent, frame, wheels, resolved: resolveVehicleWheelAssemblies(frame.root) };
}

describe('vehicle frame and wheel assembly', () => {
  test('owns the canonical +X/+Y/+Z frame and all typed socket families', () => {
    const { frame } = layout(4);
    expect(VEHICLE_AXES).toEqual({
      forward: [1, 0, 0],
      up: [0, 1, 0],
      right: [0, 0, 1],
      wheelAxle: [0, 0, 1],
    });
    expect(hasCanonicalVehicleFront(frame.root)).toBe(true);
    expect(frame.chassis.name).toBe('Socket_chassis_main');
    expect(frame.axles).toHaveLength(2);
    expect(frame.seats).toHaveLength(1);
    expect(frame.contacts).toHaveLength(4);
    expect(frame.steering).toHaveLength(1);
    expect(frame.propulsion).toHaveLength(1);
    expect(readSemanticMetadataV1(frame.axles[0]!)?.sockets[0]?.type).toBe('vehicle.axle');
  });

  for (const count of [2, 4, 6] as const) {
    test(`${count}-wheel transformed layout preserves one assembly per corner and +Z axles`, () => {
      const { frame, wheels, resolved } = layout(count, true);
      expect(resolved).toHaveLength(count);
      expect(new Set(resolved.map((wheel) => wheel.id)).size).toBe(count);
      const expectedAxle = new THREE.Vector3(0, 0, 1).transformDirection(frame.root.matrixWorld);
      for (const [wheelIndex, wheel] of resolved.entries()) {
        expect(wheel.source).toBe('semantic');
        expect(wheel.radius).toBeCloseTo(0.5, 4);
        expect(wheel.width).toBeCloseTo(0.2, 4);
        expect(wheel.spinAxisWorld.length()).toBeCloseTo(1, 6);
        expect(THREE.MathUtils.radToDeg(wheel.spinAxisWorld.angleTo(expectedAxle))).toBeCloseTo(
          0,
          6,
        );
        expect(wheel.centerWorld.distanceTo(wheel.pivotCenterWorld)).toBeCloseTo(0, 6);
        expect(wheel.pivot.name).toMatch(/^WheelPivot_(left|right)_\d+$/);
        expect(wheel.tire?.name).toMatch(/^Tire_(left|right)_\d+$/);
        expect(wheel.rim?.name).toMatch(/^Rim_(left|right)_\d+$/);
        expect(wheel.hub?.name).toMatch(/^Hub_(left|right)_\d+$/);
        expect(wheel.tire?.parent).toBe(wheel.pivot);
        expect(wheel.rim?.parent).toBe(wheel.pivot);
        expect(wheel.hub?.parent).toBe(wheel.pivot);
        wheel.pivot.rotation.z = (wheelIndex + 1) * 0.125;
        expect(wheel.pivot.rotation.z).toBeCloseTo((wheelIndex + 1) * 0.125, 8);
      }
      expect(wheels[0]!.tire.geometry).toBe(wheels.at(-1)!.tire.geometry);
      expect(wheels[0]!.rim.geometry).toBe(wheels.at(-1)!.rim.geometry);
      expect(wheels[0]!.hub.geometry).toBe(wheels.at(-1)!.hub.geometry);
    });
  }

  test('optional steering remains centered above the spin pivot and spin is animatable around +Z', () => {
    const { wheels } = layout(2);
    const wheel = wheels[0]!;
    expect(wheel.steeringPivot).toBeDefined();
    expect(wheel.spinPivot.parent).toBe(wheel.steeringPivot!);
    expect(wheel.spinPivot.position.length()).toBe(0);
    wheel.steeringPivot!.rotation.y = Math.PI / 8;
    wheel.spinPivot.rotation.z = Math.PI / 2;
    expect(wheel.steeringPivot!.rotation.y).toBeCloseTo(Math.PI / 8);
    expect(wheel.spinPivot.rotation.z).toBeCloseTo(Math.PI / 2);
    expect(readSemanticMetadataV1(wheel.spinPivot)?.frames.map((frame) => frame.id)).toContain(
      'spin-axis.+z',
    );
  });

  test('declared tire width is exact and cannot equal or exceed the diameter', () => {
    const geometry = createWheelGeometrySet(0.5, 0.22);
    geometry.tire.computeBoundingBox();
    expect(geometry.tire.boundingBox!.max.z - geometry.tire.boundingBox!.min.z).toBeCloseTo(
      0.22,
      6,
    );
    expect(() => createWheelGeometrySet(0.5, 1)).toThrow('less than its diameter');
  });

  test('canonical component names recover one legacy corner as one assembly', () => {
    const root = new THREE.Object3D();
    const pivot = new THREE.Object3D();
    pivot.name = 'WheelPivot_front_left';
    const legacyTire = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.1, 8, 16), tire);
    legacyTire.name = 'Tire_front_left';
    const legacyRim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.16, 16).rotateX(Math.PI / 2),
      metal,
    );
    legacyRim.name = 'Rim_front_left';
    const legacyHub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.18, 16).rotateX(Math.PI / 2),
      metal,
    );
    legacyHub.name = 'Hub_front_left';
    pivot.add(legacyTire, legacyRim, legacyHub);
    root.add(pivot);
    const resolved = resolveVehicleWheelAssemblies(root);
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.source).toBe('legacy');
    expect(resolved[0]?.side).toBe('left');
    expect(resolved[0]?.index).toBe('front');
    expect(resolved[0]?.tire).toBe(legacyTire);
    expect(resolved[0]?.rim).toBe(legacyRim);
    expect(resolved[0]?.hub).toBe(legacyHub);
  });
});
