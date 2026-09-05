import { expect, it } from 'bun:test';
import { PlaneGeometry } from 'three';
import { thickenOpenSurface } from '../experiments/geometry-acceptance';
import { geometryDiagnostics } from '../geometry';
it('caps a planar boundary with measurable inward and outward thickness', () => {
  const source = new PlaneGeometry(2, 2, 2, 2);
  for (const distance of [-0.1, 0.1]) {
    const shell = thickenOpenSurface(source, distance);
    shell.computeBoundingBox();
    expect(shell.boundingBox!.max.z - shell.boundingBox!.min.z).toBeCloseTo(0.1);
    expect(geometryDiagnostics(shell)).toMatchObject({
      boundaryEdges: 0,
      nonManifoldEdges: 0,
      orientationConflicts: 0,
    });
    expect(source.getAttribute('uv')).toBeDefined();
    expect(shell.getAttribute('uv')).toBeUndefined();
  }
});
