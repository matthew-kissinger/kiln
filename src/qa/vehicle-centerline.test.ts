import { expect, test } from 'bun:test';
import * as THREE from 'three';
import { createAssetIntentV1 } from '../contracts';
import { createVehicleFrame, createWheelAssembly } from '../vehicle';
import { evaluateVehicleQa } from './vehicle';

test('centerline and paired wheels coexist without fabricated mates, while duplicates still fail', () => {
  const frame = createVehicleFrame('MixedLayout', {
    axles: [
      { id: 'front', position: [1.2, 0.5, 0] },
      { id: 'rear', position: [-1.2, 0.5, 0] },
    ],
  });
  frame.root.position.set(3, 1, -2);
  frame.root.rotation.set(0.1, 0.6, -0.05);
  const material = new THREE.MeshStandardMaterial();
  const center = {
    radius: 0.5,
    width: 0.2,
    side: 'center' as const,
    index: 'front',
    position: [1.2, 0.5, 0] as [number, number, number],
    steering: true,
    parent: frame.root,
  };
  createWheelAssembly('Center', { tire: material, rim: material }, center);
  for (const side of ['left', 'right'] as const) {
    createWheelAssembly(
      'Rear',
      { tire: material, rim: material },
      {
        radius: 0.5,
        width: 0.2,
        side,
        index: 'rear',
        position: [-1.2, 0.5, side === 'left' ? -0.85 : 0.85],
        parent: frame.root,
      },
    );
  }
  const intent = createAssetIntentV1({
    category: 'vehicle',
    subtype: 'wheeled',
    vehicle: {
      subtype: 'wheeled',
      wheelCount: 3,
      axleCount: 2,
      steering: 'front',
      supportPolicy: 'grounded',
    },
  });
  expect(evaluateVehicleQa({ intent, scene: frame.root })).toEqual([]);
  createWheelAssembly('Duplicate', { tire: material, rim: material }, center);
  const four = createAssetIntentV1({ ...intent, vehicle: { ...intent.vehicle!, wheelCount: 4 } });
  expect(evaluateVehicleQa({ intent: four, scene: frame.root }).map((f) => f.code)).toContain(
    'VEH_DUPLICATE_ASSEMBLY',
  );
});
