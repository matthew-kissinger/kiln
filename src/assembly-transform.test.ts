import { expect, test } from 'bun:test';
import * as THREE from 'three';
import { describeAssembly, replicateAssembly } from './assembly';
import { checkedTrs } from './assembly-transform';

test('world-space replication accepts affine inverse roundoff under a rotated scaled parent', () => {
  for (const reflected of [false, true]) {
    const parent = new THREE.Group();
    parent.position.set(3, -2, 7);
    parent.rotation.set(0.3, 0.7, -0.2);
    parent.scale.set(reflected ? -1.5 : 1.5, 2, 0.8);
    const source = new THREE.Group();
    source.name = 'Assembly';
    source.position.set(0.7, 2, -0.3);
    source.rotation.set(0.1, 0.4, 0.2);
    source.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial()));
    parent.add(source);
    source.updateWorldMatrix(true, true);
    const before = source.matrixWorld.clone();
    const replica = replicateAssembly(describeAssembly(source), {
      namespace: 'copy',
      parent,
      space: 'world',
    });
    replica.root.updateWorldMatrix(true, true);
    for (const [i, value] of before.elements.entries())
      expect(replica.root.matrixWorld.elements[i]).toBeCloseTo(value, 12);
    expect(source.matrixWorld.equals(before)).toBe(true);
    expect(replica.root.scale.x).toBeCloseTo(1, 12);
    expect(replica.root.scale.y).toBeCloseTo(1, 12);
    expect(replica.root.scale.z).toBeCloseTo(1, 12);
  }
});

test('TRS validation still rejects projective, nonfinite, singular and sheared matrices', () => {
  for (const index of [3, 7, 11]) {
    const projective = new THREE.Matrix4();
    projective.elements[index] = 1e-15;
    expect(() => checkedTrs(projective, 'test')).toThrow(/affine/);
  }
  for (const value of [0, 1 + 1e-9, Number.NaN, Number.POSITIVE_INFINITY]) {
    const invalid = new THREE.Matrix4();
    invalid.elements[15] = value;
    expect(() => checkedTrs(invalid, 'test')).toThrow(/affine/);
  }
  expect(() => checkedTrs(new THREE.Matrix4().makeScale(0, 1, 1), 'test')).toThrow(/singular/);
  const shear = new THREE.Matrix4();
  shear.elements[4] = 0.1;
  expect(() => checkedTrs(shear, 'test')).toThrow(/shear/);
});
