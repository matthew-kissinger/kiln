import { expect, test } from 'bun:test';
import { Box3, PerspectiveCamera, Vector3 } from 'three';
import { frameAssetBounds } from './framing';

for (const aspect of [720 / 320, 1, 320 / 720]) {
  for (const size of [
    [32, 5, 7],
    [2, 30, 2],
    [6, 6, 6],
  ]) {
    test(`frames ${size.join('x')} bounds at aspect ${aspect} with useful screen coverage`, () => {
      const box = new Box3().setFromCenterAndSize(new Vector3(80, -20, 13), new Vector3(...size));
      const pose = frameAssetBounds(box, aspect);
      const camera = new PerspectiveCamera(
        40,
        aspect,
        pose.radius / 1000,
        pose.distance + pose.radius * 100,
      );
      camera.position.copy(pose.position);
      camera.lookAt(pose.center);
      camera.updateMatrixWorld();
      let extent = 0;
      for (const x of [box.min.x, box.max.x]) {
        for (const y of [box.min.y, box.max.y]) {
          for (const z of [box.min.z, box.max.z]) {
            const projected = new Vector3(x, y, z).project(camera);
            extent = Math.max(extent, Math.abs(projected.x), Math.abs(projected.y));
            expect(Math.abs(projected.x)).toBeLessThanOrEqual(0.9);
            expect(Math.abs(projected.y)).toBeLessThanOrEqual(0.9);
            expect(projected.z).toBeGreaterThan(-1);
            expect(projected.z).toBeLessThan(1);
          }
        }
      }
      expect(extent).toBeGreaterThan(0.85);
    });
  }
}

test('degenerate point bounds retain a finite usable camera distance', () => {
  const pose = frameAssetBounds(new Box3(new Vector3(), new Vector3()), 2);
  expect(Number.isFinite(pose.distance)).toBe(true);
  expect(pose.distance).toBeGreaterThan(0);
});

test('sparse assemblies fit their occupied bounds instead of empty global corners', () => {
  const hull = new Box3(new Vector3(-16, -1, -3), new Vector3(16, 1, 3));
  const mast = new Box3(new Vector3(-1, 1, -0.5), new Vector3(1, 12, 0.5));
  const box = hull.clone().union(mast);
  const aspect = 2.25;
  const conservative = frameAssetBounds(box, aspect);
  const pose = frameAssetBounds(box, aspect, 40, [hull, mast]);
  expect(pose.distance).toBeLessThan(conservative.distance * 0.9);
  const camera = new PerspectiveCamera(40, aspect, 0.01, 1000);
  camera.position.copy(pose.position);
  camera.lookAt(pose.center);
  camera.updateMatrixWorld();
  for (const component of [hull, mast]) {
    for (const x of [component.min.x, component.max.x]) {
      for (const y of [component.min.y, component.max.y]) {
        for (const z of [component.min.z, component.max.z]) {
          const point = new Vector3(x, y, z).project(camera);
          expect(Math.abs(point.x)).toBeLessThanOrEqual(0.9);
          expect(Math.abs(point.y)).toBeLessThanOrEqual(0.9);
          expect(point.z).toBeGreaterThan(-1);
          expect(point.z).toBeLessThan(1);
        }
      }
    }
  }
});
