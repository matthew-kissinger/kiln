/** Bounded offline acceptance probes, not public geometry APIs. */
import * as THREE from 'three';
import { meshGeo, parametricSurface, geometryDiagnostics } from '../geometry';
import { getManifoldModule, manifoldToGeometry } from '../solids';
import { implicitSurface } from '../implicit';

/** Candidate for one indexed, consistently oriented open sheet. Drops attributes. */
export function thickenOpenSurface(source: THREE.BufferGeometry, distance: number) {
  const p = source.getAttribute('position'),
    n = source.getAttribute('normal'),
    index = source.index!;
  const positions = Array.from(p.array),
    triangles = Array.from(index.array);
  const edges = new Map<string, { a: number; b: number; count: number }>();
  for (let t = 0; t < triangles.length; t += 3)
    for (let k = 0; k < 3; k++) {
      const a = triangles[t + k]!,
        b = triangles[t + ((k + 1) % 3)]!,
        key = [Math.min(a, b), Math.max(a, b)].join(':');
      const entry = edges.get(key);
      if (entry) entry.count++;
      else edges.set(key, { a, b, count: 1 });
    }
  for (let i = 0; i < p.count; i++)
    positions.push(
      p.getX(i) + n.getX(i) * distance,
      p.getY(i) + n.getY(i) * distance,
      p.getZ(i) + n.getZ(i) * distance,
    );
  const indices: number[] = [];
  for (let t = 0; t < triangles.length; t += 3) {
    const [a, b, c] = triangles.slice(t, t + 3) as [number, number, number];
    indices.push(a, c, b, a + p.count, b + p.count, c + p.count);
  }
  for (const { a, b, count } of edges.values())
    if (count === 1) indices.push(a, b, b + p.count, a, b + p.count, a + p.count);
  if (distance < 0)
    for (let t = 0; t < indices.length; t += 3)
      [indices[t + 1], indices[t + 2]] = [indices[t + 2]!, indices[t + 1]!];
  return meshGeo({ positions, indices });
}
function triangles(geometry: THREE.BufferGeometry) {
  const p = geometry.getAttribute('position'),
    index = geometry.index;
  return Array.from(
    { length: (index?.count ?? p.count) / 3 },
    (_, i) =>
      new THREE.Triangle(
        ...([0, 1, 2].map((k) =>
          new THREE.Vector3().fromBufferAttribute(p, index ? index.getX(i * 3 + k) : i * 3 + k),
        ) as [THREE.Vector3, THREE.Vector3, THREE.Vector3]),
      ),
  );
}
function signedVolume(geometry: THREE.BufferGeometry) {
  return triangles(geometry).reduce(
    (sum, t) => sum + t.a.dot(new THREE.Vector3().crossVectors(t.b, t.c)) / 6,
    0,
  );
}
function sampledError(a: THREE.BufferGeometry, b: THREE.BufferGeometry) {
  const from = triangles(a),
    to = triangles(b).filter((t) => t.getArea() > 1e-16),
    point = new THREE.Vector3(),
    closest = new THREE.Vector3();
  let max = 0,
    count = 0;
  for (let i = 0; i < from.length; i += Math.max(1, Math.ceil(from.length / 192))) {
    const tri = from[i]!;
    for (const p of [tri.a, tri.b, tri.c, tri.getMidpoint(point)]) {
      let distance = Infinity;
      for (const target of to) {
        const candidate = target.closestPointToPoint(p, closest).distanceTo(p);
        if (Number.isFinite(candidate)) distance = Math.min(distance, candidate);
      }
      max = Math.max(max, distance);
      count++;
    }
  }
  return { maxDistance: max, samples: count };
}
function aspect(geometry: THREE.BufferGeometry) {
  const ratios = triangles(geometry)
    .map(
      (t) =>
        Math.max(
          t.a.distanceToSquared(t.b),
          t.b.distanceToSquared(t.c),
          t.c.distanceToSquared(t.a),
        ) /
        (2 * t.getArea()),
    )
    .sort((a, b) => a - b);
  return {
    median: ratios[Math.floor(ratios.length * 0.5)],
    p95: ratios[Math.floor(ratios.length * 0.95)],
    max: ratios.at(-1),
  };
}
async function run(id: string) {
  const mod = await getManifoldModule();
  const owned: InstanceType<typeof mod.Manifold>[] = [];
  const track = (m: InstanceType<typeof mod.Manifold>) => {
    owned.push(m);
    return m;
  };
  const start = performance.now();
  let geometry: THREE.BufferGeometry;
  const measures: Record<string, unknown> = {};
  try {
    if (id.startsWith('bevel-')) {
      let source: InstanceType<typeof mod.Manifold>;
      if (id === 'bevel-concave') {
        const a = track(mod.Manifold.cube([2, 0.7, 1], true)),
          b = track(mod.Manifold.cube([0.7, 2, 1], true));
        source = track(a.add(b));
      } else if (id === 'bevel-mixed') {
        const a = track(mod.Manifold.cylinder(1.2, 0.55, 0.55, 24, true)),
          b = track(mod.Manifold.cube([1.7, 1.7, 0.3], true).translate([0, 0, -0.6]));
        source = track(a.add(b));
      } else source = track(mod.Manifold.cube([2, 2, 0.12], true));
      const original = manifoldToGeometry(source),
        kernel = track(mod.Manifold.sphere(0.1, 12));
      const inset = track(source.minkowskiDifference(kernel));
      measures.erosionEmpty = inset.isEmpty();
      const result = track(inset.isEmpty() ? source.subtract(source) : inset.minkowskiSum(kernel));
      geometry = manifoldToGeometry(result);
      measures.inputTriangles = source.numTri();
      measures.inputVolume = source.volume();
      measures.outputVolume = result.volume();
      measures.selectedEdgeControl = false;
      measures.attributePolicy =
        'position-only candidate; UV/material/face provenance not transported';
      measures.sampledSourceToResult = geometry.getAttribute('position').count
        ? sampledError(original, geometry)
        : { empty: true };
    } else if (id.startsWith('shell-')) {
      const curved = id !== 'shell-open-plane-in' && id !== 'shell-open-plane-out';
      const radius = id === 'shell-curved-collision' ? 0.06 : 1;
      const source = curved
        ? parametricSurface((u, v) => [radius * Math.cos(u), v, radius * Math.sin(u)], {
            u: [0, Math.PI * 1.5],
            v: [-1, 1],
            uSegments: 32,
            vSegments: 4,
          })
        : new THREE.PlaneGeometry(2, 2, 4, 4);
      // Increasing angle cross +Y points inward; choose outward normals explicitly.
      if (curved) {
        const n = source.getAttribute('normal');
        for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
        const ix = source.index!;
        for (let i = 0; i < ix.count; i += 3) {
          const b = ix.getX(i + 1);
          ix.setX(i + 1, ix.getX(i + 2));
          ix.setX(i + 2, b);
        }
      }
      const distance = id.endsWith('-out') ? 0.1 : -0.1;
      geometry = thickenOpenSurface(source, distance);
      const p = source.getAttribute('position'),
        q = geometry.getAttribute('position');
      let min = Infinity,
        max = 0;
      for (let i = 0; i < p.count; i++) {
        const d = new THREE.Vector3()
          .fromBufferAttribute(p, i)
          .distanceTo(new THREE.Vector3().fromBufferAttribute(q, i + p.count));
        min = Math.min(min, d);
        max = Math.max(max, d);
      }
      measures.signedOffset = distance;
      measures.correspondingVertexDistance = { min, max };
      measures.signedVolume = signedVolume(geometry);
      measures.curvedRadius = curved ? radius : undefined;
      measures.crossesAnalyticAxis = curved && radius + distance <= 0;
      measures.inputUv = !!source.getAttribute('uv');
      measures.outputUv = !!geometry.getAttribute('uv');
      measures.boundaryCaps = true;
    } else if (id.startsWith('remesh-')) {
      let source: InstanceType<typeof mod.Manifold>;
      if (id === 'remesh-deformed') {
        source = track(
          track(mod.Manifold.cylinder(2, 0.55, 0.55, 16, true).refine(3)).warp((v) => {
            v[0] += 0.3 * Math.sin(v[2] * 2);
            v[1] *= 1 + 0.25 * v[2];
          }),
        );
      } else if (id === 'remesh-uneven')
        source = track(mod.Manifold.sphere(1, 24).scale([1, 0.3, 1]));
      else
        source = track(
          track(mod.Manifold.cube([2, 2, 1], true)).subtract(
            track(mod.Manifold.cylinder(2, 0.45, 0.45, 24, true)),
          ),
        );
      const original = manifoldToGeometry(source),
        tris = triangles(original),
        point = new THREE.Vector3(),
        nearest = new THREE.Vector3();
      // Tagged input fixture lets the trial report exactly what its reconstruction drops.
      original.setAttribute(
        'uv',
        new THREE.Float32BufferAttribute(
          new Float32Array(original.getAttribute('position').count * 2),
          2,
        ),
      );
      original.addGroup(0, original.index?.count ?? original.getAttribute('position').count, 0);
      original.userData.sourceFaceIds = Array.from({ length: source.numTri() }, (_, i) => i);
      original.computeBoundingBox();
      const bounds = original.boundingBox!.clone().expandByScalar(0.2);
      geometry = await implicitSurface(
        ([x, y, z]) => {
          point.set(x, y, z);
          let d = Infinity;
          for (const triangle of tris)
            d = Math.min(d, triangle.closestPointToPoint(point, nearest).distanceTo(point));
          // Manifold bridge preserves coordinate components.
          const inside =
            source.rayCast([x, y, z], [bounds.max.x + 1, y + 0.137, z + 0.271]).length % 2 === 1;
          return inside ? d : -d;
        },
        {
          bounds: {
            min: bounds.min.toArray() as [number, number, number],
            max: bounds.max.toArray() as [number, number, number],
          },
          edgeLength: 0.15,
        },
      );
      const refined = manifoldToGeometry(track(source.refine(2)));
      measures.inputTriangles = source.numTri();
      measures.inputAspect = aspect(original);
      measures.outputAspect = aspect(geometry);
      measures.sourceToResult = sampledError(original, geometry);
      measures.resultToSource = sampledError(geometry, original);
      measures.refineControl = {
        triangles: (refined.index?.count ?? refined.getAttribute('position').count) / 3,
        sourceToResult: sampledError(original, refined),
        resultToSource: sampledError(refined, original),
        aspect: aspect(refined),
      };
      measures.inputVolume = source.volume();
      measures.outputVolume = signedVolume(geometry);
      measures.attributePolicy = {
        inputUv: true,
        outputUv: !!geometry.getAttribute('uv'),
        inputGroups: original.groups.length,
        outputGroups: geometry.groups.length,
        inputFaceIds: true,
        outputFaceIds: !!geometry.userData.sourceFaceIds,
      };
    } else throw new Error('Unknown case');
    geometry.computeBoundingBox();
    console.log(
      JSON.stringify({
        id,
        elapsedMs: performance.now() - start,
        triangles: (geometry.index?.count ?? geometry.getAttribute('position').count) / 3,
        bounds: geometry.boundingBox!.isEmpty()
          ? null
          : { min: geometry.boundingBox!.min.toArray(), max: geometry.boundingBox!.max.toArray() },
        topology: geometryDiagnostics(geometry),
        ...measures,
      }),
    );
  } finally {
    for (const m of owned) m.delete();
  }
}
if (import.meta.main) await run(process.argv[2]!);
