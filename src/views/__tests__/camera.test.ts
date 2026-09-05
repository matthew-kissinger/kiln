import { describe, expect, test } from 'bun:test';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three';
import {
  resolveAssetCamera,
  cameraFromBounds,
  selectCameraSubject,
  rasterizeCamera,
} from '../camera';
import { coverage, rasterizeView } from '../raster';
const scene = () => {
  const root = new Group();
  root.name = 'Asset';
  const part = new Mesh(new BoxGeometry(1, 2, 3), new MeshBasicMaterial());
  part.name = 'Body';
  root.add(part);
  return root;
};
describe('resolved asset cameras', () => {
  test('legacy fit resolves identically and padding changes pixels', () => {
    const root = scene();
    const camera = cameraFromBounds({ min: [-0.5, -1, -1.5], max: [0.5, 1, 1.5] }, [1, 0, 0]);
    expect(Buffer.from(rasterizeCamera(root, camera, 64))).toEqual(
      Buffer.from(rasterizeView(root, [1, 0, 0], { size: 64 })),
    );
    const zoom = resolveAssetCamera(root, {
      camera: { type: 'orbit', azimuthDeg: 0, elevationDeg: 0, padding: 4 },
    });
    expect(coverage(rasterizeCamera(root, zoom.camera, 64), 64)).toBeLessThan(
      coverage(rasterizeCamera(root, camera, 64), 64),
    );
  });
  test('exact paths distinguish duplicate names and name queries reject ambiguity', () => {
    const root = scene();
    const other = scene().children[0]!;
    root.add(other);
    expect(() => selectCameraSubject(root, { name: 'Body' })).toThrow(/ambiguous/i);
    const found = selectCameraSubject(root, { path: '/Asset[0]/Body[1]' });
    expect(found.node).toBe(other);
    expect(found.path).toBe('/Asset[0]/Body[1]');
  });
  test('part-local orbit follows parent rotation and preserves world bounds', () => {
    const root = scene();
    root.rotation.y = Math.PI / 2;
    root.position.set(4, 2, 1);
    const resolved = resolveAssetCamera(root, {
      subject: { name: 'Body' },
      camera: { type: 'orbit', azimuthDeg: 0, elevationDeg: 0, relativeTo: 'part' },
    });
    expect(resolved.camera.target[0]).toBeCloseTo(4);
    expect(resolved.camera.position[2]).toBeLessThan(resolved.camera.target[2]);
    expect(resolved.subject.path).toBe('/Asset[0]/Body[0]');
  });
  test('perspective has real depth and clips triangles at the near plane', () => {
    const root = scene();
    const shot = resolveAssetCamera(root, {
      camera: {
        type: 'explicit',
        projection: 'perspective',
        position: [4, 3, 5],
        target: [0, 0, 0],
        fovDeg: 50,
      },
    });
    expect(coverage(rasterizeCamera(root, shot.camera, 64), 64)).toBeGreaterThan(0);
    const near = resolveAssetCamera(root, {
      camera: {
        type: 'explicit',
        projection: 'perspective',
        position: [2, 0, 2],
        target: [0, 0, 0],
        near: 1,
        far: 10,
      },
    });
    expect(coverage(rasterizeCamera(root, near.camera, 64), 64)).toBeGreaterThan(0);
  });
  test('singular and unknown camera inputs fail clearly', () => {
    expect(() =>
      resolveAssetCamera(scene(), {
        camera: {
          type: 'explicit',
          projection: 'perspective',
          position: [0, 0, 0],
          target: [0, 0, 0],
        },
      }),
    ).toThrow(/differ/);
    expect(() =>
      resolveAssetCamera(scene(), { camera: { type: 'orbit', position: [1, 2, 3] } as never }),
    ).toThrow(/unknown/);
  });
});
test('part-local orbit handles nested and reflected transforms deterministically', () => {
  const root = scene();
  const assembly = new Group();
  assembly.name = 'Assembly';
  const part = root.children[0]!;
  root.remove(part);
  assembly.add(part);
  root.add(assembly);
  assembly.rotation.y = Math.PI / 2;
  assembly.scale.set(-2, 3, 0.5);
  assembly.position.set(4, 0, 0);
  const shot = resolveAssetCamera(root, {
    subject: { name: 'Body' },
    camera: { type: 'orbit', relativeTo: 'part', azimuthDeg: 0, elevationDeg: 0 },
  });
  expect(shot.camera.position[2]).toBeGreaterThan(shot.camera.target[2]);
  expect(shot.subject.bounds.min[0]).toBeCloseTo(3.25);
  expect(shot.subject.bounds.max[1]).toBeCloseTo(3);
  expect(
    resolveAssetCamera(root, {
      subject: { name: 'Body' },
      camera: { type: 'orbit', relativeTo: 'part', azimuthDeg: 0, elevationDeg: 0 },
    }),
  ).toEqual(shot);
});
test('context geometry determines camera depth while the selected part determines framing', () => {
  const root = scene();
  const blocker = new Mesh(new BoxGeometry(1, 10, 10), new MeshBasicMaterial());
  blocker.position.x = 100;
  root.add(blocker);
  const shot = resolveAssetCamera(root, {
    subject: { name: 'Body' },
    camera: { type: 'orbit', azimuthDeg: 0, elevationDeg: 0 },
  });
  expect(shot.camera.position[0]).toBeGreaterThan(100);
  expect(shot.camera.halfHeight).toBeLessThan(3);
});
test('fully clipped geometry does not leak into the image', () => {
  const root = scene();
  const camera = resolveAssetCamera(root, {
    camera: {
      type: 'explicit',
      projection: 'perspective',
      position: [5, 0, 0],
      target: [0, 0, 0],
      near: 0.1,
      far: 1,
    },
  }).camera;
  expect(coverage(rasterizeCamera(root, camera, 64), 64)).toBe(0);
});
test('explicit frames transform local positions, targets and up with part matrices', () => {
  const root = scene();
  const part = root.children[0]!;
  part.position.set(10, 0, 0);
  part.rotation.z = Math.PI / 2;
  const out = resolveAssetCamera(root, {
    subject: { name: 'Body' },
    camera: {
      type: 'explicit',
      projection: 'perspective',
      relativeTo: 'part',
      position: [0, 0, 5],
      target: [1, 0, 0],
      up: [0, 1, 0],
      targetOffset: [1, 0, 0],
    },
  });
  expect(out.camera.position).toEqual([10, 0, 5]);
  expect(out.camera.target[0]).toBeCloseTo(10);
  expect(out.camera.target[1]).toBeCloseTo(2);
  expect(out.camera.up[0]).toBeCloseTo(-1);
});
test('explicit rigid local frames and bounds fit preserve requested direction', () => {
  const root = scene();
  const out = resolveAssetCamera(root, {
    camera: {
      type: 'explicit',
      projection: 'orthographic',
      relativeTo: 'local',
      frame: { origin: [0, 0, 0], rotation: [0, 90, 0] },
      position: [0, 0, 5],
      framing: 'bounds',
      padding: 2,
      targetOffset: [0, 1, 0],
    },
  });
  expect(out.camera.position[0]).toBeGreaterThan(1);
  expect(out.camera.position[2]).toBeCloseTo(0);
  expect(out.camera.target[1]).toBe(1);
  expect(out.camera.halfHeight).toBeGreaterThan(2);
  expect(() =>
    resolveAssetCamera(root, {
      camera: {
        type: 'explicit',
        projection: 'perspective',
        relativeTo: 'local',
        position: [0, 0, 5],
        target: [0, 0, 0],
      },
    }),
  ).toThrow(/frame/);
});
