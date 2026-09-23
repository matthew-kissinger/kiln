import { expect, test } from 'bun:test';
import { Group, QuaternionKeyframeTrack, VectorKeyframeTrack, AnimationClip } from 'three';
import { measureLoopClosure } from '../pose';

function scene() {
  const root = new Group();
  root.name = 'Joint';
  return root;
}
test('reports rotation gaps without treating every clip as an intended loop', () => {
  const clip = new AnimationClip('Open', 1, [
    new QuaternionKeyframeTrack(
      'Joint.quaternion',
      [0, 1],
      [0, 0, 0, 1, 0, 0, Math.sin(Math.PI / 8), Math.cos(Math.PI / 8)],
    ),
  ]);
  const result = measureLoopClosure(scene(), clip);
  expect(result.status).toBe('open');
  expect(result.maxRotationDegrees).toBeCloseTo(45, 4);
  expect(result.mismatches[0]?.track).toBe('Joint.quaternion');
  expect(result.loopIntent).toBe('unspecified');
});
test('quaternion signs and full turns describe the same endpoint orientation', () => {
  const clip = new AnimationClip('Spin', 1, [
    new QuaternionKeyframeTrack('Joint.quaternion', [0, 1], [0, 0, 0, 1, 0, 0, 0, -1]),
  ]);
  expect(measureLoopClosure(scene(), clip).status).toBe('closed');
});
test('samples actual duration and reports local translation and scale separately', () => {
  const clip = new AnimationClip('Move', 0.5, [
    new VectorKeyframeTrack('Joint.position', [0, 1], [0, 0, 0, 2, 0, 0]),
    new VectorKeyframeTrack('Joint.scale', [0, 1], [1, 1, 1, 1, 3, 1]),
  ]);
  const result = measureLoopClosure(scene(), clip);
  expect(result.maxPositionDistance).toBe(1);
  expect(result.maxScaleDistance).toBe(1);
  expect(result.mismatchCount).toBe(2);
});
test('missing targets, unsupported properties and invalid data cannot report closed', () => {
  const root = scene();
  for (const track of [
    { name: 'Missing.position', times: [0, 1], values: [0, 0, 0, 0, 0, 0] },
    { name: 'Joint.weights', times: [0, 1], values: [0, 0] },
    { name: 'Joint.position', times: [0, 1], values: [0, 0, 0, NaN, 0, 0] },
    { name: 'Joint.quaternion', times: [0, 1], values: [0, 0, 0, 0, 0, 0, 0, 0] },
    { name: 'Joint.position', times: [1, 0], values: [0, 0, 0, 0, 0, 0] },
  ])
    expect(measureLoopClosure(root, { duration: 1, tracks: [track] }).status).toBe('incomplete');
  expect(measureLoopClosure(root, { duration: 1, tracks: [] }).status).toBe('incomplete');
});
test('bounded details retain complete mismatch totals', () => {
  const root = scene();
  const track = { name: 'Joint.position', times: [0, 1], values: [0, 0, 0, 1, 0, 0] };
  const result = measureLoopClosure(root, {
    duration: 1,
    tracks: Array.from({ length: 40 }, () => track),
  });
  expect(result.mismatchCount).toBe(40);
  expect(result.mismatches).toHaveLength(32);
  expect(result.detailsTruncated).toBe(true);
});
