import { expect, it } from 'bun:test';
import { implicitSurface } from '../implicit';
import { geometryDiagnostics } from '../geometry';
const options = {
  bounds: { min: [-1.2, -1.2, -1.2] as const, max: [1.2, 1.2, 1.2] as const },
  edgeLength: 0.3,
};
it('samples a bounded sphere with positive-inside convention and closed topology', async () => {
  const sphere = await implicitSurface(([x, y, z]) => 1 - Math.hypot(x, y, z), options);
  expect(geometryDiagnostics(sphere)).toMatchObject({
    boundaryEdges: 0,
    nonManifoldEdges: 0,
    orientationConflicts: 0,
  });
  expect(sphere.boundingBox!.max.x).toBeCloseTo(1, 1);
  expect(sphere.userData.kilnImplicit.evaluations).toBeGreaterThan(0);
  expect(sphere.userData.kilnImplicit.estimatedGridCells).toBe(512);
  expect(sphere.getAttribute('uv')).toBeUndefined();
});
it('rejects runaway resolution before sampling and enforces callback evaluation count', async () => {
  let called = false;
  await expect(
    implicitSurface(
      () => {
        called = true;
        return 1;
      },
      { ...options, edgeLength: 0.001, maxCells: 1000 },
    ),
  ).rejects.toThrow('maxCells');
  expect(called).toBe(false);
  await expect(implicitSurface(() => 1, { ...options, maxEvaluations: 3 })).rejects.toThrow(
    'maxEvaluations',
  );
  await expect(implicitSurface(() => NaN, options)).rejects.toThrow('finite');
  await expect(implicitSurface(() => -1, options)).rejects.toThrow('empty');
  await expect(implicitSurface(() => 1, { ...options, edgeLength: 0 })).rejects.toThrow(
    'edgeLength',
  );
});
it('repeats deterministically and marks the output as experimental', async () => {
  const field = ([x, y, z]: readonly [number, number, number]) =>
    Math.max(0.7 - Math.hypot(x - 0.35, y, z), 0.7 - Math.hypot(x + 0.35, y, z));
  const a = await implicitSurface(field, options),
    b = await implicitSurface(field, options);
  expect(a.getAttribute('position').array).toEqual(b.getAttribute('position').array);
  expect(a.userData.kilnGeometryWarnings[0].code).toBe('EXPERIMENTAL_IMPLICIT_SURFACE');
});
