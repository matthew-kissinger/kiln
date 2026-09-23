import { expect, test } from 'bun:test';
import * as THREE from 'three';
import { createLadder, gameMaterial } from '../primitives';
import { describeAssembly, replicateAssembly } from '../assembly';
import { renderSceneToGLB } from '../render';
import { loadGlbReviewScene } from '../views/glb';

const material = gameMaterial('#778899');

test('ladder owns a relocatable root, perpendicular rails and portable endpoint frames', async () => {
  const parent = new THREE.Group();
  parent.position.set(4, 1, -3);
  parent.rotation.y = 0.7;
  const bottom: [number, number, number] = [2, 1, 3];
  const top: [number, number, number] = [4, 4, 5];
  const ladder = createLadder('Access', { bottom, top, width: 0.6, material, parent });
  expect(parent.children).toEqual([ladder.root]);
  expect(ladder.root.children).toHaveLength(8);
  expect(ladder.root.position.toArray()).toEqual(bottom);
  const centerline = new THREE.Vector3(...top).sub(new THREE.Vector3(...bottom));
  const width = ladder.rightRail.position.clone().sub(ladder.leftRail.position);
  expect(width.length()).toBeCloseTo(0.6, 8);
  expect(width.dot(centerline)).toBeCloseTo(0, 8);
  const view = describeAssembly(ladder.root);
  expect(view.roles.get('ladder.rail')).toHaveLength(2);
  expect(view.roles.get('ladder.rung')).toHaveLength(6);
  expect(view.sockets.map((entry) => entry.socket.id)).toEqual(['bottom', 'top']);
  const topFrame = view.frames.find((entry) => entry.frame.id === 'top')!;
  expect(topFrame.frame.translation).toEqual(centerline.toArray());
  const replica = replicateAssembly(view, { namespace: 'access2', parent });
  replica.root.position.x += 3;
  expect(replica.sockets).toHaveLength(2);
  expect(replica.nodes).toHaveLength(9);
  const rendered = await renderSceneToGLB(parent);
  const loaded = await loadGlbReviewScene(rendered.bytes);
  expect(describeAssembly(loaded.root).sockets).toHaveLength(4);
});

test('axis-aligned and near-parallel ladders use a stable perpendicular width frame', () => {
  for (const top of [
    [2, 0, 0],
    [2, 1e-12, 0],
    [0, 0, 2],
    [0, -2, 0],
  ] as [number, number, number][]) {
    const ladder = createLadder('Axis', { bottom: [0, 0, 0], top, material, rungCount: 0 });
    const width = ladder.rightRail.position.clone().sub(ladder.leftRail.position);
    expect(width.length()).toBeCloseTo(0.42, 8);
    expect(width.dot(new THREE.Vector3(...top))).toBeCloseTo(0, 8);
  }
  const directed = createLadder('Directed', {
    bottom: [0, 0, 0],
    top: [0, 2, 0],
    material,
    widthDirection: [1, 1, 1],
  });
  const width = directed.rightRail.position.clone().sub(directed.leftRail.position).normalize();
  expect(width.toArray()).toEqual([Math.SQRT1_2, 0, Math.SQRT1_2]);
});

test('invalid ladder frames fail atomically instead of leaving rails in a parent', () => {
  const parent = new THREE.Group();
  for (const widthDirection of [
    [0, 0, 0],
    [0, 1, 0],
    [NaN, 0, 0],
  ] as [number, number, number][]) {
    expect(() =>
      createLadder('Bad', {
        bottom: [0, 0, 0],
        top: [0, 2, 0],
        material,
        parent,
        widthDirection,
      }),
    ).toThrow(/widthDirection/);
  }
  expect(() =>
    createLadder('Zero', {
      bottom: [1, 1, 1],
      top: [1, 1, 1],
      material,
      parent,
    }),
  ).toThrow(/endpoint|different/);
  expect(parent.children).toHaveLength(0);
});
