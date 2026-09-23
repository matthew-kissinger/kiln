/** Rebuild area-weighted normals while retaining authored smooth/hard seam classes. */
import * as THREE from 'three';

export function recomputeDeformedNormals(
  source: THREE.BufferGeometry,
  output: THREE.BufferGeometry,
): void {
  const original = source.getAttribute('position');
  const authored = source.getAttribute('normal');
  const position = output.getAttribute('position');
  const bounds = (attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) => {
    const box = new THREE.Box3().setFromBufferAttribute(attribute as THREE.BufferAttribute);
    return {
      center: box.getCenter(new THREE.Vector3()),
      size: box.getSize(new THREE.Vector3()).length() || 1,
    };
  };
  const before = bounds(original),
    after = bounds(position);
  const point = new THREE.Vector3(),
    normal = new THREE.Vector3();
  const quantized = (
    attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
    index: number,
    frame: typeof before,
  ) => {
    point.fromBufferAttribute(attribute, index).sub(frame.center).divideScalar(frame.size);
    return point
      .toArray()
      .map((value) => Math.round(value * 1e7))
      .join(',');
  };
  const classes = new Map<string, number>();
  const ids = new Uint32Array(position.count);
  for (let i = 0; i < position.count; i++) {
    // UV copies may share shading only when authored position AND normal agree.
    // Output coincidence also prevents smoothing displaced-apart callback results.
    let key = String(i);
    if (authored) {
      normal.fromBufferAttribute(authored, i).normalize();
      key = `${quantized(original, i, before)}:${normal
        .toArray()
        .map((value) => Math.round(value * 1e6))
        .join(',')}:${quantized(position, i, after)}`;
    }
    let id = classes.get(key);
    if (id === undefined) {
      id = classes.size;
      classes.set(key, id);
    }
    ids[i] = id;
  }
  const sums = new Float64Array(classes.size * 3);
  const index = output.index;
  const corners = index?.count ?? position.count;
  const a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    c = new THREE.Vector3();
  for (let t = 0; t < corners; t += 3) {
    const ia = index ? index.getX(t) : t;
    const ib = index ? index.getX(t + 1) : t + 1;
    const ic = index ? index.getX(t + 2) : t + 2;
    a.fromBufferAttribute(position, ia);
    // Normalize edges before cross products so neither huge nor tiny units break accumulation.
    b.fromBufferAttribute(position, ib).sub(a).divideScalar(after.size);
    c.fromBufferAttribute(position, ic).sub(a).divideScalar(after.size);
    normal.crossVectors(b, c);
    for (const vertex of [ia, ib, ic]) {
      const offset = ids[vertex]! * 3;
      sums[offset]! += normal.x;
      sums[offset + 1]! += normal.y;
      sums[offset + 2]! += normal.z;
    }
  }
  const normals = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const offset = ids[i]! * 3;
    normal
      .set(sums[offset]!, sums[offset + 1]!, sums[offset + 2]!)
      .normalize()
      .toArray(normals, i * 3);
  }
  output.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
}
