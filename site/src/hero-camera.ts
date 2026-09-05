import { Box3, Vector3, type Mesh, type Object3D } from 'three';

/** Fixed 4:3 orthographic composition shared by the poster generator and viewer. */
export function heroCamera(root: Object3D) {
  root.updateWorldMatrix(true, true);
  const box = new Box3().setFromObject(root);
  const centre = box.getCenter(new Vector3());
  const direction = new Vector3(1, 0.48, 0.7).normalize();
  const right = new Vector3().crossVectors(new Vector3(0, 1, 0), direction).normalize();
  const up = new Vector3().crossVectors(direction, right).normalize();
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  const point = new Vector3();
  root.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    const positions = mesh.geometry.getAttribute('position');
    for (let i = 0; i < positions.count; i++) {
      point.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld).sub(centre);
      const x = point.dot(right),
        y = point.dot(up);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  });
  if (!Number.isFinite(minX)) throw new Error('Hero asset contains no mesh positions.');
  const target = centre
    .clone()
    .addScaledVector(right, (minX + maxX) / 2)
    .addScaledVector(up, (minY + maxY) / 2);
  const radius = Math.max(1, box.getSize(new Vector3()).length());
  return {
    version: 'kiln.camera.v1' as const,
    projection: 'orthographic' as const,
    position: target
      .clone()
      .addScaledVector(direction, radius * 2)
      .toArray() as [number, number, number],
    target: target.toArray() as [number, number, number],
    up: [0, 1, 0] as [number, number, number],
    aspect: 4 / 3,
    near: 0.01,
    far: radius * 5,
    halfHeight: Math.max((maxY - minY) / 2, (maxX - minX) / 2 / (4 / 3)) * 1.12,
  };
}
