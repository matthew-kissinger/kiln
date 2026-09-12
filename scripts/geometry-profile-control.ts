import { extrudeProfile } from '../src/profile';
import { getManifoldModule } from '../src/solids';
import { geometryDiagnostics } from '../src/geometry';
await getManifoldModule();
const start = performance.now();
const geometry = await extrudeProfile(
  [
    [-1, -0.35],
    [-0.35, -0.35],
    [-0.35, -1],
    [0.35, -1],
    [0.35, -0.35],
    [1, -0.35],
    [1, 0.35],
    [0.35, 0.35],
    [0.35, 1],
    [-0.35, 1],
    [-0.35, 0.35],
    [-1, 0.35],
  ],
  { depth: 1, axis: 'z', bevel: 0.1 },
);
geometry.computeBoundingBox();
console.log(
  JSON.stringify({
    id: 'bevel-concave-profile',
    elapsedMs: performance.now() - start,
    triangles: (geometry.index?.count ?? geometry.getAttribute('position').count) / 3,
    bounds: { min: geometry.boundingBox!.min.toArray(), max: geometry.boundingBox!.max.toArray() },
    topology: geometryDiagnostics(geometry),
    capEdgesRounded: false,
    selectedEdgeControl: 'sweep-axis edges only',
  }),
);
