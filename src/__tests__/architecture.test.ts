import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';

import {
  createGableEndPanel,
  createGableRoof,
  createGableShell,
  createRoofSurfaceLayout,
  type RidgeAxis,
  type RoofFaceFrame,
} from '../architecture';
import { readSemanticMetadataV1 } from '../contracts';

const EPSILON = 1e-6;

function material(color = 0x8899aa): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide });
}

function expectVectorClose(actual: THREE.Vector3, expected: THREE.Vector3): void {
  expect(actual.distanceTo(expected)).toBeLessThan(EPSILON);
}

function expectUnorderedEndpoints(
  actual: [THREE.Vector3, THREE.Vector3],
  expected: [THREE.Vector3, THREE.Vector3],
): void {
  const direct = actual[0].distanceTo(expected[0]) + actual[1].distanceTo(expected[1]);
  const reversed = actual[0].distanceTo(expected[1]) + actual[1].distanceTo(expected[0]);
  expect(Math.min(direct, reversed)).toBeLessThan(EPSILON);
}

function worldPoint(root: THREE.Object3D, point: THREE.Vector3): THREE.Vector3 {
  root.updateWorldMatrix(true, false);
  return point.clone().applyMatrix4(root.matrixWorld);
}

function expectedFaceEndpoints(
  root: THREE.Object3D,
  axis: RidgeAxis,
  side: 'positive' | 'negative',
  spanX: number,
  spanZ: number,
  overhang: number,
  rise: number,
  pitchDegrees: number,
): { ridge: [THREE.Vector3, THREE.Vector3]; eave: [THREE.Vector3, THREE.Vector3] } {
  const sign = side === 'positive' ? 1 : -1;
  const ridgeHalf = (axis === 'x' ? spanX : spanZ) / 2 + overhang;
  const eaveOffset = (axis === 'x' ? spanZ : spanX) / 2 + overhang;
  const eaveY = -Math.tan((pitchDegrees * Math.PI) / 180) * overhang;
  const ridgeLocal: [THREE.Vector3, THREE.Vector3] =
    axis === 'x'
      ? [new THREE.Vector3(-ridgeHalf, rise, 0), new THREE.Vector3(ridgeHalf, rise, 0)]
      : [new THREE.Vector3(0, rise, -ridgeHalf), new THREE.Vector3(0, rise, ridgeHalf)];
  const eaveLocal: [THREE.Vector3, THREE.Vector3] =
    axis === 'x'
      ? [
          new THREE.Vector3(-ridgeHalf, eaveY, sign * eaveOffset),
          new THREE.Vector3(ridgeHalf, eaveY, sign * eaveOffset),
        ]
      : [
          new THREE.Vector3(sign * eaveOffset, eaveY, -ridgeHalf),
          new THREE.Vector3(sign * eaveOffset, eaveY, ridgeHalf),
        ];
  return {
    ridge: [worldPoint(root, ridgeLocal[0]), worldPoint(root, ridgeLocal[1])],
    eave: [worldPoint(root, eaveLocal[0]), worldPoint(root, eaveLocal[1])],
  };
}

function assertRigidFaceFrame(face: RoofFaceFrame): void {
  expect(face.ridgeTangent.length()).toBeCloseTo(1, 8);
  expect(face.downhillDirection.length()).toBeCloseTo(1, 8);
  expect(face.outwardNormal.length()).toBeCloseTo(1, 8);
  expect(Math.abs(face.ridgeTangent.dot(face.downhillDirection))).toBeLessThan(EPSILON);
  expect(Math.abs(face.ridgeTangent.dot(face.outwardNormal))).toBeLessThan(EPSILON);
  expect(Math.abs(face.downhillDirection.dot(face.outwardNormal))).toBeLessThan(EPSILON);
  expect(
    face.ridgeTangent.clone().cross(face.outwardNormal).dot(face.downhillDirection),
  ).toBeCloseTo(1, 8);
  expect(face.downhillDirection.y).toBeLessThan(0);
  expect(face.outwardNormal.y).toBeGreaterThan(0);
}

describe('correct-by-construction architecture helpers', () => {
  for (const fixture of [
    { axis: 'x' as const, spanX: 8, spanZ: 5, pitchDegrees: 27, overhang: 0.35 },
    { axis: 'z' as const, spanX: 5, spanZ: 9, pitchDegrees: 41, overhang: 0.5 },
    { axis: 'x' as const, spanX: 6, spanZ: 6, pitchDegrees: 52, overhang: 0.2 },
    { axis: 'z' as const, spanX: 6, spanZ: 6, pitchDegrees: 33, overhang: 0.4 },
  ]) {
    test(`returns exact live face frames for ridge-${fixture.axis}, ${fixture.spanX}x${fixture.spanZ}`, () => {
      const parent = new THREE.Object3D();
      parent.position.set(3.25, 1.4, -2.75);
      parent.rotation.y = 0.61;
      const roof = createGableRoof('Roof', material(), {
        spanX: fixture.spanX,
        spanZ: fixture.spanZ,
        pitchDegrees: fixture.pitchDegrees,
        overhang: fixture.overhang,
        ridgeAxis: fixture.axis,
        parent,
      });
      roof.root.position.set(0.7, 2.9, -0.35);
      roof.root.rotation.y = -0.23;

      for (const face of roof.faces) {
        assertRigidFaceFrame(face);
        const expected = expectedFaceEndpoints(
          roof.root,
          fixture.axis,
          face.side,
          fixture.spanX,
          fixture.spanZ,
          fixture.overhang,
          roof.rise,
          roof.pitchDegrees,
        );
        expectUnorderedEndpoints([face.ridgeStart, face.ridgeEnd], expected.ridge);
        expectUnorderedEndpoints([face.eaveStart, face.eaveEnd], expected.eave);
        const ridgeToEave = face.eaveStart.clone().sub(face.ridgeStart).normalize();
        expectVectorClose(ridgeToEave, face.downhillDirection);
      }
      expectUnorderedEndpoints(
        [roof.faces[0].ridgeStart, roof.faces[0].ridgeEnd],
        [roof.faces[1].ridgeStart, roof.faces[1].ridgeEnd],
      );

      const before = roof.faces[0].ridgeStart;
      parent.position.x += 2;
      const after = roof.faces[0].ridgeStart;
      expect(after.x - before.x).toBeCloseTo(2, 8);
    });
  }

  test('builds an exact thick gable boundary and subtracts optional openings', () => {
    const solid = createGableEndPanel('Gable', material(), {
      span: 5,
      rise: 2,
      thickness: 0.2,
      ridgeAxis: 'z',
    });
    solid.geometry.computeBoundingBox();
    const size = new THREE.Vector3();
    solid.geometry.boundingBox!.getSize(size);
    expectVectorClose(size, new THREE.Vector3(5, 2, 0.2));

    const raycaster = new THREE.Raycaster();
    for (const fractionY of [0.1, 0.35, 0.7, 0.9]) {
      const y = fractionY * 2;
      const halfWidth = 2.5 * (1 - fractionY);
      for (const fractionX of [-0.9, 0, 0.9]) {
        raycaster.set(new THREE.Vector3(halfWidth * fractionX, y, 1), new THREE.Vector3(0, 0, -1));
        expect(raycaster.intersectObject(solid.root, false).length).toBeGreaterThan(0);
      }
      raycaster.set(new THREE.Vector3(halfWidth * 1.02, y, 1), new THREE.Vector3(0, 0, -1));
      expect(raycaster.intersectObject(solid.root, false)).toHaveLength(0);
    }

    const opened = createGableEndPanel('VentGable', material(), {
      span: 5,
      rise: 2,
      thickness: 0.2,
      ridgeAxis: 'z',
      openings: [{ id: 'vent', offset: 0.25, bottom: 0.3, width: 0.8, height: 0.7 }],
    });
    raycaster.set(new THREE.Vector3(0.25, 0.65, 1), new THREE.Vector3(0, 0, -1));
    expect(raycaster.intersectObject(opened.root, false)).toHaveLength(0);
    raycaster.set(new THREE.Vector3(0.9, 0.65, 1), new THREE.Vector3(0, 0, -1));
    expect(raycaster.intersectObject(opened.root, false).length).toBeGreaterThan(0);
    expect(() =>
      createGableEndPanel('Invalid', material(), {
        span: 2,
        rise: 1,
        openings: [{ width: 1.8, height: 0.9, bottom: 0.2 }],
      }),
    ).toThrow();
  });

  test('composes a closed, enterable semantic shell with a real doorway gap by default', () => {
    const shell = createGableShell(
      'House',
      { wall: material(0xbb9988), roof: material(0x554433) },
      { spanX: 8, spanZ: 5, wallHeight: 2.8, pitchDegrees: 35, ridgeAxis: 'x' },
    );
    expect(shell.gables).toHaveLength(2);
    expect(shell.gables[0]!.parent).toBe(shell.roof.root);
    expect(shell.gables[1]!.parent).toBe(shell.roof.root);
    expect(shell.openings).toHaveLength(1);
    expect(shell.openings[0]).not.toBeInstanceOf(THREE.Mesh);
    expect(shell.openings[0]!.scale.toArray()).toEqual([0.15, 2.1, 1.1]);

    const expectedRoles = new Map<THREE.Object3D, string>([
      [shell.root, 'architecture.shell.gable'],
      [shell.floor, 'floor'],
      [shell.roof.root, 'roof.assembly'],
      [shell.roof.slopes[0], 'roof.slope.positive'],
      [shell.roof.slopes[1], 'roof.slope.negative'],
      [shell.gables[0]!, 'roof.gable.positive'],
      [shell.gables[1]!, 'roof.gable.negative'],
      [shell.walls.front, 'wall.front'],
      [shell.walls.back, 'wall.back'],
      [shell.walls.left, 'wall.left'],
      [shell.walls.right, 'wall.right'],
      [shell.openings[0]!, 'opening.front.door'],
    ]);
    for (const [node, role] of expectedRoles) {
      expect(readSemanticMetadataV1(node)?.roles).toContain(role);
    }
    expect(
      readSemanticMetadataV1(shell.roof.root)?.relationships.some(
        (entry) => entry.kind === 'separable-from',
      ),
    ).toBe(true);
    expect(
      shell.gables.every((gable) =>
        readSemanticMetadataV1(gable)?.relationships.some(
          (entry) => entry.kind === 'separable-from',
        ),
      ),
    ).toBe(true);
    expect(
      readSemanticMetadataV1(shell.openings[0]!)?.relationships.map((entry) => entry.kind),
    ).toEqual(['cutout-of', 'portal-through']);
    expect(readSemanticMetadataV1(shell.openings[0]!)?.frames.map((frame) => frame.id)).toEqual([
      'clearance',
    ]);

    const doorwayWorld = shell.openings[0]!.getWorldPosition(new THREE.Vector3());
    const blockers = shell.walls.front.children.filter(
      (child): child is THREE.Mesh => child instanceof THREE.Mesh,
    );
    expect(
      blockers.some((mesh) => new THREE.Box3().setFromObject(mesh).containsPoint(doorwayWorld)),
    ).toBe(false);
  });

  for (const axis of ['x', 'z'] as const) {
    test(`lays every roof surface family downhill from the ridge-${axis} face frame`, () => {
      const roof = createGableRoof('Roof', material(), {
        spanX: axis === 'x' ? 9 : 5,
        spanZ: axis === 'x' ? 5 : 9,
        rise: 1.8,
        overhang: 0.35,
        ridgeAxis: axis,
      });
      for (const kind of ['panels', 'shingles', 'seams', 'corrugations'] as const) {
        const layout = createRoofSurfaceLayout(`Surface_${kind}`, material(), {
          face: roof.faces[0],
          kind,
          parent: roof.root,
        });
        expect(layout.items.length).toBeGreaterThan(1);
        for (const item of layout.items.slice(0, 3)) {
          item.updateWorldMatrix(true, false);
          const itemLength = new THREE.Vector3(0, 0, 1).transformDirection(item.matrixWorld);
          expect(Math.abs(itemLength.dot(roof.faces[0].downhillDirection))).toBeCloseTo(1, 8);
        }
        expect(readSemanticMetadataV1(layout.root)?.roles).toContain(`roof.surface.${kind}`);
      }
    });
  }

  test('rejects ambiguous or contradictory roof dimensions instead of guessing', () => {
    expect(() => createGableRoof('Bad', material(), { spanX: 0, spanZ: 4 })).toThrow();
    expect(() =>
      createGableRoof('Bad', material(), {
        spanX: 8,
        spanZ: 4,
        rise: 1,
        pitchDegrees: 60,
        ridgeAxis: 'x',
      }),
    ).toThrow();
  });
});
