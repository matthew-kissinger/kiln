import { type Box3, Vector3 } from 'three';

/** Initial orbit-camera pose for an asset's world-space bounds. */
export function frameAssetBounds(
  box: Box3,
  aspect: number,
  verticalFovDeg = 40,
  componentBounds: readonly Box3[] = [box],
) {
  const center = box.getCenter(new Vector3());
  const radius = Math.max(box.getSize(new Vector3()).length() / 2, 0.01);
  const back = new Vector3(1, 0.65, 1.25).normalize();
  const right = new Vector3().crossVectors(new Vector3(0, 1, 0), back).normalize();
  const up = new Vector3().crossVectors(back, right);
  const corners: Vector3[] = [];
  for (const component of componentBounds.length ? componentBounds : [box]) {
    for (const x of [component.min.x, component.max.x]) {
      for (const y of [component.min.y, component.max.y]) {
        for (const z of [component.min.z, component.max.z]) corners.push(new Vector3(x, y, z));
      }
    }
  }
  let left = Infinity;
  let rightmost = -Infinity;
  let bottom = Infinity;
  let top = -Infinity;
  for (const corner of corners) {
    const offset = corner.clone().sub(center);
    const horizontal = offset.dot(right);
    const vertical = offset.dot(up);
    left = Math.min(left, horizontal);
    rightmost = Math.max(rightmost, horizontal);
    bottom = Math.min(bottom, vertical);
    top = Math.max(top, vertical);
  }
  center.addScaledVector(right, (left + rightmost) / 2);
  center.addScaledVector(up, (bottom + top) / 2);
  const tanVertical = Math.tan((verticalFovDeg * Math.PI) / 360);
  const tanHorizontal = tanVertical * aspect;
  let distance = radius;
  // At each corner, depth + projected extent is the minimum distance that
  // fits that point. Reserve 12% padding in both screen dimensions.
  // Component bounds exclude empty corners between a long hull and a tall mast.
  for (const corner of corners) {
    const offset = corner.clone().sub(center);
    const depth = offset.dot(back);
    distance = Math.max(
      distance,
      depth + (Math.abs(offset.dot(right)) * 1.12) / tanHorizontal,
      depth + (Math.abs(offset.dot(up)) * 1.12) / tanVertical,
    );
  }
  const position = center.clone().addScaledVector(back, distance);
  return { center, radius, distance, position };
}
