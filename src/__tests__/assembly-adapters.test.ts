import { expect, test } from 'bun:test';
import * as THREE from 'three';
import { createRoofPlanes, gameMaterial } from '../primitives';
import { createGableRoof, type GableRoofResult } from '../architecture';
import { describeAssembly, replicateAssembly } from '../assembly';

test('both roof datums expose the same physical ridge through face and common assembly frames', () => {
  const parent = new THREE.Group();
  parent.position.set(3, 4, -2);
  parent.rotation.set(0.2, 0.7, -0.1);
  parent.scale.set(2, 1, 3);
  for (const ridgeAxis of ['x', 'z'] as const) {
    const roofs = [
      createRoofPlanes('Eave', gameMaterial('#778899'), {
        width: 3,
        depth: 4,
        height: 1,
        thickness: 0.1,
        ridgeAxis,
        parent,
      }) as GableRoofResult,
      createGableRoof('Bearing', gameMaterial('#778899'), {
        spanZ: 3,
        spanX: 4,
        rise: 1,
        thickness: 0.1,
        ridgeAxis,
        parent,
      }),
    ];
    for (const roof of roofs) {
      const view = describeAssembly(roof.root);
      for (const [index, face] of roof.faces.entries()) {
        const entry = view.frames.find(
          (frame) => frame.node === roof.slopes[index] && frame.frame.id === 'ridge',
        )!;
        const common = new THREE.Vector3().setFromMatrixPosition(
          new THREE.Matrix4().fromArray(entry.matrix),
        );
        const specific = new THREE.Vector3().setFromMatrixPosition(face.localToRoof);
        expect(common.distanceTo(specific)).toBeLessThan(1e-10);
      }
      const replica = replicateAssembly(view, {
        namespace: `roof_${ridgeAxis}_${roof.root.name.toLowerCase()}`,
        externalReferences: 'preserve',
        parent,
      });
      expect(replica.materials).toHaveLength(2);
      expect(replica.frames).toHaveLength(view.frames.length);
      expect(replica.bounds).toEqual(view.bounds);
    }
  }
});
