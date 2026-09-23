import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';
import {
  bobbingAnimation,
  createClip,
  idleBreathing,
  positionTrack,
  rotationTrack,
  scaleTrack,
  spinAnimation,
  type TrackInterpolation,
} from '../primitives';

type Vec3 = [number, number, number];
const positionKeys = (times = [0, 1], value: Vec3 = [1, 2, 3]) =>
  times.map((time) => ({ time, position: value }));

describe('animation preset rest position', () => {
  for (const preset of [idleBreathing, bobbingAnimation]) {
    test(`${preset.name} keeps the explicit local base position during playback`, () => {
      const parent = new THREE.Group();
      parent.position.set(20, 10, -4);
      parent.rotation.z = Math.PI / 3;
      parent.scale.set(2, 3, 4);
      const body = new THREE.Group();
      body.name = 'Body';
      body.position.set(2, 3, 4);
      body.rotation.x = 0.4;
      body.scale.set(0.8, 0.9, 1.1);
      parent.add(body);
      const basePosition: Vec3 = body.position.toArray();
      const clip = preset(body.name, 2, 0.5, { basePosition });
      basePosition[0] = 99;
      const mixer = new THREE.AnimationMixer(parent);
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.play();
      mixer.setTime(1);
      expect(body.position.toArray()).toEqual([2, 3.5, 4]);
      expect(body.rotation.x).toBeCloseTo(0.4);
      expect(body.scale.toArray()).toEqual([0.8, 0.9, 1.1]);
      mixer.setTime(2);
      expect(body.position.toArray()).toEqual([2, 3, 4]);
      expect(parent.position.toArray()).toEqual([20, 10, -4]);
    });

    test(`${preset.name} keeps legacy zero-origin motion when no base is supplied`, () => {
      expect(Array.from(preset('Body', 2, 0.5).tracks[0]!.values)).toEqual([
        0, 0, 0, 0, 0.5, 0, 0, 0, 0,
      ]);
      expect(() => preset('Body', 0)).toThrow(/duration/);
      expect(() => preset('Body', 2, Infinity)).toThrow(/finite/);
      expect(() => preset('Body', 2, 0.5, { basePosition: [NaN, 2, 3] })).toThrow(/basePosition/);
      expect(() => preset('Body', 2, 0.5, { basePosition: null as unknown as Vec3 })).toThrow(
        /basePosition/,
      );
    });
  }
});

describe('animation keyframe contracts', () => {
  for (const [label, times] of [
    ['negative', [-1, 1]],
    ['unordered', [1, 0]],
    ['duplicate', [0, 0]],
    ['NaN', [0, NaN]],
    ['infinite', [0, Infinity]],
    ['float32 overflow', [0, 1e40]],
    ['float32 collision', [1, 1 + 1e-9]],
    ['float32 underflow collision', [0, 1e-50]],
  ] as const) {
    test(`rejects ${label} times before a malformed sampler is constructed`, () => {
      expect(() => positionTrack('Body', positionKeys([...times]))).toThrow(/time/);
    });
  }

  test('all track helpers reject empty frames and malformed vectors', () => {
    expect(() => positionTrack('Body', [])).toThrow(/keyframe/);
    expect(() => rotationTrack('Body', [])).toThrow(/keyframe/);
    expect(() => scaleTrack('Body', [])).toThrow(/keyframe/);
    expect(() => positionTrack('Body', positionKeys([0], [1, Infinity, 2]))).toThrow(/position/);
    expect(() => positionTrack('Body', positionKeys([0], [1e40, 2, 3]))).toThrow(/position/);
    expect(() => rotationTrack('Body', [{ time: 0, rotation: [0, NaN, 0] }])).toThrow(/rotation/);
    expect(() => scaleTrack('Body', [{ time: 0, scale: [0, 1, Infinity] }])).toThrow(/scale/);
    expect(() => positionTrack('Body', positionKeys([0], [1, 2] as unknown as Vec3))).toThrow(
      /three/,
    );
  });

  test('targets are exact node names, with no property/path binding syntax', () => {
    for (const name of [
      '',
      ' ',
      ' Body',
      'Body ',
      'Body.position',
      'Body[0]',
      'A/B',
      'A:B',
      'A\\B',
      'A\nB',
    ]) {
      expect(() => positionTrack(name, positionKeys())).toThrow(/target/);
    }
    expect(positionTrack('Front arm_左', positionKeys()).name).toBe('Front arm_左.position');
  });

  test('interpolation is explicit, while finite zero/negative scale is permitted', () => {
    expect(() => positionTrack('Body', positionKeys(), 'CUBIC' as TrackInterpolation)).toThrow(
      /interpolation/,
    );
    const track = scaleTrack('Body', [{ time: 0, scale: [0, -1, 2] }], 'STEP');
    expect(track.getInterpolation()).toBe(THREE.InterpolateDiscrete);
    expect(Array.from(track.values)).toEqual([0, -1, 2]);
  });

  test('input arrays are detached and single keys need not start at time zero', () => {
    const frames = positionKeys([0.25]);
    const track = positionTrack('Body', frames);
    frames[0]!.position[0] = 90;
    frames[0]!.time = 9;
    expect(Array.from(track.times)).toEqual([0.25]);
    expect(Array.from(track.values)).toEqual([1, 2, 3]);
  });
});

describe('clip contract and quaternion semantics', () => {
  test('duration is seconds, -1 derives from stored keys, and zero allows a static pose', () => {
    const track = positionTrack('Body', positionKeys([0, 0.1]));
    expect(createClip('Move', 0.1, [track]).duration).toBe(0.1);
    expect(createClip('Move', -1, [track]).duration).toBe(track.times[1]!);
    expect(createClip('Pose', 0, [positionTrack('Body', positionKeys([0]))]).duration).toBe(0);
    expect(() => createClip('Short', 0.05, [track])).toThrow(/duration/);
    for (const duration of [-2, NaN, Infinity, 1e40]) {
      expect(() => createClip('Invalid', duration, [track])).toThrow(/duration/);
    }
    expect(() => createClip(' ', 1, [track])).toThrow(/name/);
    expect(() => createClip('Empty', 1, [])).toThrow(/track/);
  });

  test('rejects malformed, duplicate, and unsupported tracks instead of clipping or repairing them', () => {
    const make = () => positionTrack('Body', positionKeys());
    expect(() => createClip('Duplicate', 1, [make(), make()])).toThrow(/duplicate/i);
    const malformed = make();
    malformed.name = 'Body';
    expect(() => createClip('Bad', 1, [malformed])).toThrow(/target|channel/);
    malformed.name = null as unknown as string;
    expect(() => createClip('Bad', 1, [malformed])).toThrow(/target|channel/);
    const unsupported = new THREE.NumberKeyframeTrack('Body.opacity', [0, 1], [0, 1]);
    expect(() => createClip('Bad', 1, [unsupported])).toThrow(/channel/);
    const wrongType = new THREE.VectorKeyframeTrack('Body.quaternion', [0], [0, 0, 0, 1]);
    expect(() => createClip('Bad', 0, [wrongType])).toThrow(/QuaternionKeyframeTrack/);
    const cubic = make().setInterpolation(THREE.InterpolateSmooth);
    expect(() => createClip('Bad', 1, [cubic])).toThrow(/interpolation/);
    const short = make();
    short.values = new Float32Array([0, 1, 2]);
    expect(() => createClip('Bad', 1, [short])).toThrow(/value/);
    const duplicateTime = make();
    duplicateTime.times[1] = 0;
    expect(() => createClip('Bad', 1, [duplicateTime])).toThrow(/time/);
    const nonfinite = make();
    nonfinite.values[0] = NaN;
    expect(() => createClip('Bad', 1, [nonfinite])).toThrow(/finite/);
  });

  test('raw quaternion samples must be unit quaternions and are never silently normalized', () => {
    for (const values of [
      [0, 0, 0, 0],
      [0, 0, 0, 2],
      [0, NaN, 0, 1],
    ]) {
      const track = new THREE.QuaternionKeyframeTrack('Body.quaternion', [0], values);
      expect(() => createClip('Bad', 0, [track])).toThrow(/quaternion|finite/i);
      expect(Array.from(track.values)).toEqual(values);
    }
  });

  test('rotation tracks use absolute local XYZ Euler degrees and shortest quaternion interpolation', () => {
    const track = rotationTrack('Body', [
      { time: 0, rotation: [10, 20, 30] },
      { time: 1, rotation: [10, 20, 30] },
    ]);
    const expected = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(...([10, 20, 30].map(THREE.MathUtils.degToRad) as Vec3), 'XYZ'),
    );
    expect(new THREE.Quaternion().fromArray(track.values).angleTo(expected)).toBeLessThan(0.001);
    const fullTurn = rotationTrack('Body', [
      { time: 0, rotation: [0, 0, 0] },
      { time: 1, rotation: [0, 360, 0] },
    ]);
    const sampled = fullTurn.InterpolantFactoryMethodLinear().evaluate(0.5);
    expect(Math.abs(sampled[3]!)).toBeCloseTo(1);
    expect(Math.abs(sampled[1]!)).toBeCloseTo(0);
  });

  test('spin samples quarter turns to retain a revolution and validates duration/axis', () => {
    const spin = spinAnimation('Body', 4, 'y');
    const midpoint = spin.tracks[0]!.InterpolantFactoryMethodLinear().evaluate(2);
    expect(Math.abs(midpoint[1]!)).toBeCloseTo(1);
    expect(Math.abs(midpoint[3]!)).toBeCloseTo(0);
    expect(() => spinAnimation('Body', 0)).toThrow(/duration/);
    expect(() => spinAnimation('Body', 1, 'invalid' as 'x')).toThrow(/axis/);
  });
});
