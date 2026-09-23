import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';
import { WebIO } from '@gltf-transform/core';
import {
  boxGeo,
  createPart,
  createStairs,
  createWingPair,
  gameMaterial,
  octaGridPlane,
  room,
  snapTo,
  wallWithOpening,
} from '../primitives';
import { arrayRadial, mirror } from '../ops';
import { createGableShell } from '../architecture';
import { renderSceneToGLB } from '../render';

function signedVolume(positions: ArrayLike<number>, indices: ArrayLike<number>): number {
  let volume = 0;
  const point = (index: number) => new THREE.Vector3().fromArray(positions, index * 3);
  for (let i = 0; i < indices.length; i += 3) {
    const a = point(indices[i]!);
    const b = point(indices[i + 1]!);
    const c = point(indices[i + 2]!);
    volume += a.dot(b.cross(c)) / 6;
  }
  return volume;
}

function hitsWall(wall: THREE.Object3D, y: number, z: number): boolean {
  wall.updateWorldMatrix(true, true);
  return (
    new THREE.Raycaster(new THREE.Vector3(10, y, z), new THREE.Vector3(-1, 0, 0)).intersectObject(
      wall,
      true,
    ).length > 0
  );
}

describe('geometry composition audit regressions', () => {
  test('both baked wings have outward winding, outward normals and single-sided top faces', () => {
    const wings = createWingPair('Wing', new THREE.MeshStandardMaterial(), {
      rootZ: 0.4,
    });
    for (const [side, object] of Object.entries(wings)) {
      const mesh = object as THREE.Mesh;
      const geo = mesh.geometry;
      expect(signedVolume(geo.attributes.position!.array, geo.index!.array)).toBeGreaterThan(0);
      const sign = side === 'right' ? 1 : -1;
      const ray = new THREE.Raycaster(
        new THREE.Vector3(0.05, 1, sign * 0.9),
        new THREE.Vector3(0, -1, 0),
      );
      mesh.updateWorldMatrix(true, false);
      const hit = ray.intersectObject(mesh)[0]!;
      expect(hit).toBeDefined();
      expect(hit.point.y).toBeCloseTo(0.02, 6);
      expect(hit.face!.normal.y).toBeGreaterThan(0);
    }
    const rightBounds = new THREE.Box3().setFromObject(wings.right);
    const leftBounds = new THREE.Box3().setFromObject(wings.left);
    expect(rightBounds.max.z).toBeCloseTo(-leftBounds.min.z, 6);
    expect(rightBounds.min.z).toBeCloseTo(-leftBounds.max.z, 6);
    const rightNormals = (wings.right as THREE.Mesh).geometry.getAttribute('normal');
    const leftNormals = (wings.left as THREE.Mesh).geometry.getAttribute('normal');
    for (let i = 0; i < rightNormals.count; i++) {
      expect(leftNormals.getX(i)).toBeCloseTo(rightNormals.getX(i), 6);
      expect(leftNormals.getY(i)).toBeCloseTo(rightNormals.getY(i), 6);
      expect(leftNormals.getZ(i)).toBeCloseTo(-rightNormals.getZ(i), 6);
    }
  });

  test('export preserves outward wing orientation with a single-sided material', async () => {
    const root = new THREE.Group();
    createWingPair('Wing', new THREE.MeshStandardMaterial(), { rootZ: 0.4, parent: root });
    const result = await renderSceneToGLB(root, { dedup: false, optimize: 'off', instance: 'off' });
    const doc = await new WebIO().readBinary(result.bytes);
    expect(doc.getRoot().listMeshes()).toHaveLength(2);
    for (const mesh of doc.getRoot().listMeshes()) {
      const primitive = mesh.listPrimitives()[0]!;
      expect(primitive.getMaterial()!.getDoubleSided()).toBe(false);
      expect(
        signedVolume(
          primitive.getAttribute('POSITION')!.getArray()!,
          primitive.getIndices()!.getArray()!,
        ),
      ).toBeGreaterThan(0);
    }
  });

  test('radial arrays keep nonuniform scale and explicitly compose source orientation', () => {
    const source = createPart('Source', boxGeo(1, 2, 3), gameMaterial(0x888888), {
      position: [2, 0, 0],
      rotation: [30, 20, 10],
      scale: [2, 3, 4],
    });
    const outward = arrayRadial('Outward', source, 4);
    for (const [index, copy] of outward.entries()) {
      expect(copy.scale.toArray()).toEqual([2, 3, 4]);
      const rotation = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        ((index + 1) * Math.PI) / 2,
      );
      expect(copy.quaternion.angleTo(rotation)).toBeLessThan(1e-7);
    }
    const relative = arrayRadial('Relative', source, 4, 'y', undefined, undefined, {
      orientation: 'relative',
    });
    for (const [index, copy] of relative.entries()) {
      const expected = new THREE.Quaternion()
        .setFromAxisAngle(new THREE.Vector3(0, 1, 0), ((index + 1) * Math.PI) / 2)
        .multiply(source.quaternion);
      expect(copy.quaternion.angleTo(expected)).toBeLessThan(1e-7);
      expect(copy.scale.toArray()).toEqual([2, 3, 4]);
    }
  });

  for (const axis of ['x', 'y', 'z'] as const) {
    test(`mirror preserves the source frame across parent-local ${axis}`, () => {
      const parent = new THREE.Group();
      parent.position.set(5, -2, 3);
      parent.rotation.set(0.3, 0.6, -0.2);
      parent.scale.set(2, 1, 3);
      const source = createPart('Source', boxGeo(1, 2, 3), gameMaterial(0x888888), {
        position: [2, 3, 4],
        rotation: [30, 20, 10],
        scale: [2, 3, 4],
        parent,
      });
      const reflected = mirror('Reflected', source, axis, parent);
      parent.updateWorldMatrix(true, true);
      for (const vertex of [new THREE.Vector3(0.5, 1, 1.5), new THREE.Vector3(-0.5, -1, -1.5)]) {
        const expected = vertex.clone().applyMatrix4(source.matrix);
        expected[axis] *= -1;
        expected.applyMatrix4(parent.matrixWorld);
        const actual = vertex.clone().applyMatrix4(reflected.matrixWorld);
        expect(actual.distanceTo(expected)).toBeLessThan(1e-7);
      }
      expect((reflected as THREE.Mesh).geometry).toBe((source as THREE.Mesh).geometry);
      const rayOrigin = new THREE.Vector3(0, 0, 10).applyMatrix4(reflected.matrixWorld);
      const facePoint = new THREE.Vector3(0, 0, 1.5).applyMatrix4(reflected.matrixWorld);
      const hit = new THREE.Raycaster(
        rayOrigin,
        facePoint.clone().sub(rayOrigin).normalize(),
      ).intersectObject(reflected)[0];
      expect(hit).toBeDefined();
      expect(hit!.point.distanceTo(facePoint)).toBeLessThan(1e-6);
    });
  }

  test('mirror rejects a manually sheared local matrix instead of silently approximating it', () => {
    const source = new THREE.Mesh(boxGeo(1, 1, 1), gameMaterial(0x888888));
    source.matrixAutoUpdate = false;
    source.matrix.makeShear(0.2, 0, 0, 0, 0, 0);
    expect(() => mirror('Sheared', source, 'x')).toThrow('shear');
  });

  test('mirrored TRS and shared geometry preserve world coordinates through GLB export', async () => {
    const root = new THREE.Group();
    root.rotation.set(0.2, -0.3, 0.1);
    root.position.set(2, 1, -3);
    const source = createPart('Source', boxGeo(1, 2, 3), new THREE.MeshStandardMaterial(), {
      position: [2, 3, 4],
      rotation: [30, 20, 10],
      scale: [2, 3, 4],
      parent: root,
    });
    const reflected = mirror('Reflected', source, 'z', root) as THREE.Mesh;
    root.updateWorldMatrix(true, true);
    const result = await renderSceneToGLB(root, { dedup: false, optimize: 'off', instance: 'off' });
    const doc = await new WebIO().readBinary(result.bytes);
    const node = doc
      .getRoot()
      .listNodes()
      .find((entry) => entry.getName() === reflected.name)!;
    const primitive = node.getMesh()!.listPrimitives()[0]!;
    expect(primitive.getMaterial()!.getDoubleSided()).toBe(false);
    const matrix = new THREE.Matrix4().fromArray(node.getWorldMatrix());
    const actualPositions = primitive.getAttribute('POSITION')!.getArray()!;
    const expectedPositions = reflected.geometry.getAttribute('position');
    expect(actualPositions.length).toBe(expectedPositions.count * 3);
    for (let i = 0; i < expectedPositions.count; i++) {
      const actual = new THREE.Vector3().fromArray(actualPositions, i * 3).applyMatrix4(matrix);
      const expected = new THREE.Vector3()
        .fromBufferAttribute(expectedPositions, i)
        .applyMatrix4(reflected.matrixWorld);
      expect(actual.distanceTo(expected)).toBeLessThan(1e-6);
    }
  });

  test('snapTo refreshes moved ancestors and converts the gap into the scaled parent frame', () => {
    const root = new THREE.Group();
    const parent = new THREE.Group();
    root.add(parent);
    const part = createPart('Part', boxGeo(1, 1, 1), gameMaterial(0x888888), { parent });
    const host = createPart('Host', boxGeo(1, 1, 1), gameMaterial(0x888888), { parent: root });
    root.updateMatrixWorld(true);
    parent.position.x = 10;
    parent.rotation.z = Math.PI / 2;
    parent.scale.set(2, 3, 1);
    snapTo(part, host, { overlap: 0 });
    const a = new THREE.Box3().setFromObject(part);
    const b = new THREE.Box3().setFromObject(host);
    expect(a.min.x).toBeCloseTo(b.max.x, 6);
    expect(part.position.y).toBeCloseTo(8 / 3, 6);
  });

  test('room floor top matches wall bases and the gable-shell ground datum', () => {
    const mat = gameMaterial(0x888888);
    const simple = room('Room', mat, { floorThickness: 0.2 });
    const shell = createGableShell(
      'Shell',
      { wall: mat, roof: mat },
      {
        spanX: 4,
        spanZ: 4,
        rise: 1,
        floorThickness: 0.2,
      },
    );
    const a = new THREE.Box3().setFromObject(simple.floor!);
    const b = new THREE.Box3().setFromObject(shell.floor);
    expect(a.max.y).toBeCloseTo(0, 6);
    expect(a.min.y).toBeCloseTo(-0.2, 6);
    expect(a.max.y).toBeCloseTo(b.max.y, 6);
  });

  test('room and gable shell retain two doors and a vertically stacked window on one wall', () => {
    const mat = gameMaterial(0x888888);
    const openings = [
      { wall: 'front' as const, kind: 'door' as const, offset: -1, width: 0.8, height: 1.5 },
      { wall: 'front' as const, kind: 'door' as const, offset: 1, width: 0.8, height: 1.5 },
      {
        wall: 'front' as const,
        kind: 'window' as const,
        offset: -1,
        width: 0.8,
        height: 0.5,
        sill: 2,
      },
    ];
    const simple = room('Room', mat, { openings });
    const shell = createGableShell(
      'Shell',
      { wall: mat, roof: mat },
      {
        spanX: 4,
        spanZ: 4,
        rise: 1,
        openings,
      },
    );
    expect(shell.openings).toHaveLength(3);
    for (const wall of [simple.walls.front, shell.walls.front]) {
      expect(hitsWall(wall, 0.5, -1)).toBe(false);
      expect(hitsWall(wall, 0.5, 1)).toBe(false);
      expect(hitsWall(wall, 2.25, -1)).toBe(false);
      expect(hitsWall(wall, 1.75, -1)).toBe(true);
      expect(hitsWall(wall, 0.5, 0)).toBe(true);
    }
  });

  test('shared wall builder rejects actual overlap, out-of-wall and nonfinite apertures', () => {
    const mat = gameMaterial(0x888888);
    for (const openings of [
      [
        { wall: 'front' as const, offset: -0.2 },
        { wall: 'front' as const, offset: 0.2 },
      ],
      [{ wall: 'front' as const, offset: 2 }],
      [{ wall: 'front' as const, offset: Number.NaN }],
      [{ wall: 'front' as const, height: Number.POSITIVE_INFINITY }],
    ]) {
      const parent = new THREE.Group();
      expect(() => room('Room', mat, { openings, parent })).toThrow();
      expect(() =>
        createGableShell(
          'Shell',
          { wall: mat, roof: mat },
          {
            spanX: 4,
            spanZ: 4,
            rise: 1,
            openings,
            parent,
          },
        ),
      ).toThrow();
      expect(parent.children).toHaveLength(0);
    }
    expect(() =>
      wallWithOpening('Wall', mat, {
        length: 4,
        height: 2.8,
        thickness: 0.15,
        opening: { width: -1 },
      }),
    ).toThrow();
  });

  test('stacked partial-width openings preserve the exact solid volume on either wall axis', () => {
    for (const axis of ['x', 'z'] as const) {
      const wall = wallWithOpening('Wall', gameMaterial(0x888888), {
        length: 6,
        height: 4,
        thickness: 0.2,
        axis,
        openings: [
          { kind: 'window', offset: 0, width: 2, height: 1, sill: 0.5 },
          { kind: 'window', offset: 0.5, width: 2, height: 1, sill: 2 },
        ],
      });
      let volume = 0;
      wall.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          volume += signedVolume(
            object.geometry.attributes.position!.array,
            object.geometry.index!.array,
          );
        }
      });
      expect(volume).toBeCloseTo((6 * 4 - 2 * 1 - 2 * 1) * 0.2, 6);
    }
  });

  test('valid narrow jambs are retained consistently by room and gable walls', () => {
    const mat = gameMaterial(0x888888);
    const openings = [{ wall: 'front' as const, width: 0.9999999, height: 0.5 }];
    const simple = room('Room', mat, { width: 1, height: 1, openings });
    const shell = createGableShell(
      'Shell',
      { wall: mat, roof: mat },
      {
        spanX: 4,
        spanZ: 1,
        rise: 1,
        wallHeight: 1,
        openings,
      },
    );
    for (const wall of [simple.walls.front, shell.walls.front]) {
      expect(wall.children.filter((child) => child instanceof THREE.Mesh)).toHaveLength(3);
    }
  });

  test('stairs reject fractional, nonfinite and nonpositive counts before attaching a flight', () => {
    const parent = new THREE.Group();
    for (const steps of [1.5, Number.NaN, Number.POSITIVE_INFINITY, -1, 0]) {
      expect(() =>
        createStairs('Stairs', gameMaterial(0x888888), {
          steps,
          totalRise: 3,
          totalRun: 4,
          width: 1,
          parent,
        }),
      ).toThrow('steps');
      expect(parent.children).toHaveLength(0);
    }
    const flight = createStairs('Stairs', gameMaterial(0x888888), {
      steps: 6,
      totalRise: 3,
      totalRun: 4,
      width: 1,
    });
    const bounds = new THREE.Box3().setFromObject(flight.root);
    expect(bounds.max.y).toBeCloseTo(3, 6);
    expect(bounds.max.x).toBeCloseTo(4, 6);
  });

  test('atlas grids require positive finite integer dimensions', () => {
    for (const invalid of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => octaGridPlane({ tilesX: invalid, tilesY: 4 })).toThrow('tilesX');
      expect(() => octaGridPlane({ tilesX: 4, tilesY: invalid })).toThrow('tilesY');
    }
    expect(
      Array.from(octaGridPlane({ tilesX: 8, tilesY: 4 }).attributes.uv!.array).every(
        Number.isFinite,
      ),
    ).toBe(true);
  });
});
