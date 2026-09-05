import { Box3, Vector3 } from 'three';
import { selectCameraSubject, type CameraSubjectV1, type CameraVec3 } from './camera';
export interface AttachmentEndpointV1 {
  subject: CameraSubjectV1;
  point?: CameraVec3;
}
export interface AttachmentMeasurementV1 {
  from: AttachmentEndpointV1;
  to: AttachmentEndpointV1;
}
export function describeSubjectFrame(root: unknown, subject?: CameraSubjectV1) {
  const selected = selectCameraSubject(root, subject);
  selected.node.updateWorldMatrix(true, true);
  const matrix = selected.node.matrixWorld;
  const bounds = new Box3().setFromObject(selected.node);
  const local = new Box3();
  const invertible = matrix.determinant() !== 0;
  const inverse = matrix.clone().invert();
  selected.node.traverse((node) => {
    const mesh = node as import('three').Mesh;
    if (!mesh.isMesh || !invertible) return;
    const attr = mesh.geometry.getAttribute('position');
    if (!attr) return;
    for (let i = 0; i < attr.count; i++)
      local.expandByPoint(
        new Vector3()
          .fromBufferAttribute(attr, i)
          .applyMatrix4(mesh.matrixWorld)
          .applyMatrix4(inverse),
      );
  });
  const box = (b: Box3) => (b.isEmpty() ? null : { min: b.min.toArray(), max: b.max.toArray() });
  const axis = (i: number) => new Vector3().setFromMatrixColumn(matrix, i).normalize().toArray();
  return {
    path: selected.path,
    name: selected.name,
    units: 'asset units' as const,
    worldBounds: box(bounds),
    localBounds: box(local),
    invertible,
    worldMatrix: matrix.toArray(),
    axes: { frame: 'world' as const, x: axis(0), y: axis(1), z: axis(2) },
    origin: new Vector3().setFromMatrixPosition(matrix).toArray(),
  };
}
export function measureAttachment(root: unknown, input: AttachmentMeasurementV1) {
  const endpoint = (request: AttachmentEndpointV1) => {
    const selected = selectCameraSubject(root, request.subject);
    const local = request.point ?? [0, 0, 0];
    if (local.length !== 3 || local.some((n) => !Number.isFinite(n)))
      throw new Error('attachment point must be three finite subject-local coordinates');
    selected.node.updateWorldMatrix(true, false);
    return {
      path: selected.path,
      local: [...local],
      world: new Vector3(...local).applyMatrix4(selected.node.matrixWorld).toArray(),
    };
  };
  const from = endpoint(input.from),
    to = endpoint(input.to);
  return {
    units: 'asset units' as const,
    frame: 'world' as const,
    method: 'straight-line anchor distance' as const,
    from,
    to,
    distance: new Vector3(...from.world).distanceTo(new Vector3(...to.world)),
  };
}
