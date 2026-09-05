/** Offline geometry candidates. Each case is launched in a separate bounded process by scripts/geometry-experiments.mjs. */
import * as THREE from 'three';
import { getManifoldModule, manifoldToGeometry } from '../solids';
import { implicitSurface } from '../implicit';
import { roundedBoxGeo, extrudeProfile } from '../profile';
import { geometryDiagnostics, meshGeo } from '../geometry';

const mod = await getManifoldModule();
const id = process.argv[2];
const owned: InstanceType<typeof mod.Manifold>[] = [];
const track = (m: InstanceType<typeof mod.Manifold>) => {
  owned.push(m);
  return m;
};
const start = performance.now();
let geometry: THREE.BufferGeometry;
const measures: Record<string, unknown> = {};
try {
  if (id === 'bevel-box-profile') {
    geometry = await roundedBoxGeo(2, 2, 2, 0.1, { segments: 12 });
  } else if (id === 'bevel-box-minkowski' || id === 'bevel-holed-minkowski') {
    let source = track(mod.Manifold.cube([2, 2, 2], true));
    if (id === 'bevel-holed-minkowski')
      source = track(source.subtract(track(mod.Manifold.cylinder(3, 0.4, 0.4, 16, true))));
    measures.inputTriangles = source.numTri();
    const kernel = track(mod.Manifold.sphere(0.1, 12));
    const inset = track(source.minkowskiDifference(kernel));
    const result = track(inset.minkowskiSum(kernel));
    geometry = manifoldToGeometry(result);
    measures.volume = result.volume();
  } else if (id === 'bevel-holed-profile') {
    geometry = await extrudeProfile(
      [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ],
      {
        depth: 2,
        holes: [
          Array.from(
            { length: 16 },
            (_, i) =>
              [0.4 * Math.cos((i / 16) * Math.PI * 2), 0.4 * Math.sin((i / 16) * Math.PI * 2)] as [
                number,
                number,
              ],
          ),
        ],
        bevel: 0.1,
      },
    );
    measures.capEdgesRounded = false;
  } else if (
    id === 'shell-sphere-normal-offset' ||
    id === 'shell-box-normal-offset' ||
    id === 'shell-thin-normal-offset'
  ) {
    const source = track(
      id === 'shell-sphere-normal-offset'
        ? mod.Manifold.sphere(1, 24)
        : mod.Manifold.cube(id === 'shell-thin-normal-offset' ? [2, 0.12, 2] : [2, 2, 2], true),
    );
    const outer = manifoldToGeometry(source, { smooth: true }),
      p = outer.getAttribute('position'),
      n = outer.getAttribute('normal');
    const positions = Array.from(p.array),
      indices = Array.from(outer.index!.array),
      thickness = 0.1;
    const inner: number[] = [];
    for (let i = 0; i < p.count; i++)
      inner.push(
        p.getX(i) - n.getX(i) * thickness,
        p.getY(i) - n.getY(i) * thickness,
        p.getZ(i) - n.getZ(i) * thickness,
      );
    const shellIndices = [...indices];
    for (let i = 0; i < indices.length; i += 3)
      shellIndices.push(
        indices[i]! + p.count,
        indices[i + 2]! + p.count,
        indices[i + 1]! + p.count,
      );
    geometry = meshGeo({ positions: [...positions, ...inner], indices: shellIndices });
    const innerGeometry = meshGeo({ positions: inner, indices });
    innerGeometry.computeBoundingBox();
    outer.computeBoundingBox();
    measures.requestedThickness = thickness;
    measures.axisInset = [0, 1, 2].map(
      (axis) =>
        innerGeometry.boundingBox!.min.getComponent(axis) -
        outer.boundingBox!.min.getComponent(axis),
    );
    measures.innerSignedVolume = indices.reduce((volume, _, i) => {
      if (i % 3) return volume;
      const a = new THREE.Vector3().fromArray(inner, indices[i]! * 3),
        b = new THREE.Vector3().fromArray(inner, indices[i + 1]! * 3),
        c = new THREE.Vector3().fromArray(inner, indices[i + 2]! * 3);
      return volume + a.dot(b.cross(c)) / 6;
    }, 0);
  } else if (id === 'remesh-box-field' || id === 'remesh-thin-field') {
    const halfY = id === 'remesh-thin-field' ? 0.03 : 1;
    const source = track(mod.Manifold.cube([2, halfY * 2, 2], true));
    const mesh = source.getMesh();
    const tris: THREE.Triangle[] = [];
    for (let t = 0; t < mesh.triVerts.length; t += 3) {
      const points = [0, 1, 2].map((k) =>
        new THREE.Vector3().fromArray(mesh.vertProperties, mesh.triVerts[t + k]! * mesh.numProp),
      );
      tris.push(new THREE.Triangle(points[0]!, points[1]!, points[2]!));
    }
    const point = new THREE.Vector3(),
      nearest = new THREE.Vector3();
    geometry = await implicitSurface(
      ([x, y, z]) => {
        point.set(x, y, z);
        let distance = Infinity;
        for (const triangle of tris)
          distance = Math.min(
            distance,
            triangle.closestPointToPoint(point, nearest).distanceTo(point),
          );
        const inside = source.rayCast([x, y, z], [3, y + 0.137, z + 0.271]).length % 2 === 1;
        return inside ? distance : -distance;
      },
      { bounds: { min: [-1.2, -1.2, -1.2], max: [1.2, 1.2, 1.2] }, edgeLength: 0.15 },
    );
    measures.inputTriangles = source.numTri();
    measures.sourceHalfY = halfY;
    measures.uvPreserved = !!geometry.getAttribute('uv');
    const positions = geometry.getAttribute('position');
    let maxError = 0;
    for (let i = 0; i < positions.count; i++) {
      point.fromBufferAttribute(positions, i);
      let distance = Infinity;
      for (const triangle of tris)
        distance = Math.min(
          distance,
          triangle.closestPointToPoint(point, nearest).distanceTo(point),
        );
      maxError = Math.max(maxError, distance);
    }
    measures.maxVertexDistance = maxError;
  } else if (id === 'sdf-sphere-coarse' || id === 'sdf-sphere-fine' || id === 'sdf-cellular') {
    const field =
      id === 'sdf-cellular'
        ? ([x, y, z]: readonly [number, number, number]) =>
            Math.min(
              1 - Math.hypot(x, y, z),
              0.15 -
                Math.abs(
                  Math.sin(x * 6) * Math.cos(y * 6) +
                    Math.sin(y * 6) * Math.cos(z * 6) +
                    Math.sin(z * 6) * Math.cos(x * 6),
                ),
            )
        : ([x, y, z]: readonly [number, number, number]) => 1 - Math.hypot(x, y, z);
    geometry = await implicitSurface(field, {
      bounds: { min: [-1.2, -1.2, -1.2], max: [1.2, 1.2, 1.2] },
      edgeLength: id === 'sdf-sphere-coarse' ? 0.25 : 0.1,
    });
    measures.sampling = geometry.userData.kilnImplicit;
  } else throw new Error(`Unknown experiment ${id}`);
  geometry.computeBoundingBox();
  console.log(
    JSON.stringify({
      id,
      elapsedMs: performance.now() - start,
      triangles: (geometry.index?.count ?? geometry.getAttribute('position').count) / 3,
      bounds: {
        min: geometry.boundingBox!.min.toArray(),
        max: geometry.boundingBox!.max.toArray(),
      },
      topology: geometryDiagnostics(geometry),
      ...measures,
    }),
  );
} finally {
  for (const object of owned) object.delete();
}
