import { expect, test } from 'bun:test';
import * as THREE from 'three';
import { collectCharacterJointNodes, readCharacterRigGraphV1 } from '../character';
import { executeKilnCode, renderSceneToGLB } from '../render';
import { loadGlbReviewScene } from '../views/glb';
import { poseSceneAtTime, prepareClip } from '../views/pose';
import { createDiscovery, listDiscoveryEntries } from './index';

function example(id: string) {
  const entry = listDiscoveryEntries().find((e) => e.id === id);
  expect(entry?.kind).toBe('recipe');
  if (entry?.kind !== 'recipe') throw new Error(`Missing ${id}`);
  return entry.recipe.example;
}

async function exported(source: string, gltfExporter: 'legacy' | 'three') {
  const { root, clips } = await executeKilnCode(source);
  const result = await renderSceneToGLB(root, { clips, optimize: 'off', gltfExporter });
  expect(result.gltfValidation.issues.numErrors).toBe(0);
  return loadGlbReviewScene(result.bytes);
}

test('wheel and branching recipes are discoverable without an asset category', async () => {
  const discover = createDiscovery(async () => ({}));
  for (const [query, id] of [
    ['steer and spin a caster wheel', 'recipe:steerable-wheel-v1'],
    ['branching articulated gripper', 'recipe:branched-articulation-v1'],
  ]) {
    const result = await discover({ query, kind: 'recipe' });
    expect(result.entries.slice(0, 6).map((e) => e.id)).toContain(id!);
  }
});

for (const exporter of ['legacy', 'three'] as const) {
  test(`wheel recipe separates steering and spin while keeping sampled tread above the plane (${exporter})`, async () => {
    for (const radius of [0.25, 0.4]) {
      const { root, clips } = await exported(
        example('recipe:steerable-wheel-v1').replace(
          'const radius = 0.25;',
          `const radius = ${radius};`,
        ),
        exporter,
      );
      const spin = root.getObjectByName('WheelPivot_center_caster')!;
      const steering = root.getObjectByName('SteeringPivot_center_caster')!;
      const fork = root.getObjectByName('Fork')!;
      expect(spin.parent).toBe(steering);
      expect(fork.parent).toBe(steering);
      expect(steering.position.y).toBeCloseTo(radius);
      const mark = root.getObjectByName('Mesh_SpinMarker')!;
      const tire = root.getObjectByName('Tire_center_caster')!;
      expect(mark.parent).toBe(spin);
      const restingFork = fork.matrixWorld.clone();
      const spinClip = prepareClip(root, clips.find((c) => c.name === 'Spin')!);
      const points: THREE.Vector3[] = [];
      for (const time of [0, 0.017, 0.25, 0.375, 0.5, 0.75, 1]) {
        poseSceneAtTime(root, spinClip, time);
        root.updateMatrixWorld(true);
        expect(fork.matrixWorld.equals(restingFork)).toBe(true);
        const bounds = new THREE.Box3().setFromObject(tire, true);
        expect(bounds.min.y).toBeGreaterThanOrEqual(-1e-6);
        expect(bounds.min.y).toBeLessThan(0.002);
        points.push(mark.getWorldPosition(new THREE.Vector3()));
      }
      expect(points[0]!.distanceTo(points[2]!)).toBeGreaterThan(radius * 0.3);
      poseSceneAtTime(root, prepareClip(root, clips.find((c) => c.name === 'Steer')!), 0.5);
      root.updateMatrixWorld(true);
      expect(fork.matrixWorld.equals(restingFork)).toBe(false);
      expect(spin.position.toArray()).toEqual([0, 0, 0]);
      expect(steering.position.y).toBeCloseTo(radius);
    }
  });

  test(`branched recipe exports rest frames and animates without resetting offsets (${exporter})`, async () => {
    const source = example('recipe:branched-articulation-v1');
    const { root, clips } = await exported(source, exporter);
    const graph = readCharacterRigGraphV1(root.getObjectByName('BranchedGripper')!);
    expect(graph?.bodyPlan).toBe('custom');
    const nodes = collectCharacterJointNodes(root);
    expect(nodes.length).toBe(7);
    const byRole = new Map(nodes.map((n) => [n.descriptor.role, n]));
    for (const { node, descriptor } of nodes) {
      expect(node.position.toArray()).toEqual(descriptor.rest.translation);
      expect(
        Math.abs(node.quaternion.dot(new THREE.Quaternion().fromArray(descriptor.rest.rotation))),
      ).toBeCloseTo(1, 6);
      if (descriptor.parentRole) expect(node.parent).toBe(byRole.get(descriptor.parentRole)!.node);
    }
    const poses = new Map(
      nodes.map(({ node }) => [
        node.name,
        { p: node.position.clone(), q: node.quaternion.clone() },
      ]),
    );
    const tip = byRole.get('left.tip')!.node;
    const initialTip = tip.getWorldPosition(new THREE.Vector3());
    poseSceneAtTime(root, prepareClip(root, clips[0]!), 0.5);
    root.updateMatrixWorld(true);
    for (const { node } of nodes) expect(node.position.equals(poses.get(node.name)!.p)).toBe(true);
    expect(tip.getWorldPosition(new THREE.Vector3()).distanceTo(initialTip)).toBeGreaterThan(0.05);
    expect(
      byRole.get('core')!.node.quaternion.equals(poses.get(byRole.get('core')!.node.name)!.q),
    ).toBe(true);
    poseSceneAtTime(root, prepareClip(root, clips[0]!), 0);
    for (const { node } of nodes)
      expect(Math.abs(node.quaternion.dot(poses.get(node.name)!.q))).toBeCloseTo(1, 6);
  });
}
