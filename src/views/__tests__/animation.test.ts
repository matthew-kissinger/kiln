/**
 * Animation-view tests: the time-sampled poser + the clip grid renderer that back
 * kiln_screenshot_animation. The key property is that POSING ACTUALLY MOVES the
 * scene (so the agent sees motion, not a static repeat) and that a name-mismatched
 * track surfaces as `unresolvedTracks` (the "frozen clip" signal).
 */
import { describe, expect, test } from 'bun:test';

import { executeKilnCode } from '../../render';
import { renderClipAnimation, planFrameTimes, prepareClip, findClip } from '../index';

// A minimal biped whose legs swing forward/back (rotation about Z) on a 1s walk.
const WALKER = `
const meta = { name: 'walker', category: 'character' };
function build() {
  const root = createRoot('Root');
  const hips = createPivot('Hips', [0, 1, 0], root);
  createPart('Pelvis', boxGeo(0.4, 0.3, 0.3), gameMaterial('#888888'), { parent: hips });
  const legL = createPivot('LegL', [0, 0, 0.12], hips);
  createPart('LegLMesh', boxGeo(0.15, 0.9, 0.15), gameMaterial('#444444'), { parent: legL, position: [0, -0.45, 0] });
  const legR = createPivot('LegR', [0, 0, -0.12], hips);
  createPart('LegRMesh', boxGeo(0.15, 0.9, 0.15), gameMaterial('#444444'), { parent: legR, position: [0, -0.45, 0] });
  return root;
}
function animate(root) {
  return [createClip('walk', 1, [
    rotationTrack('Joint_LegL', [
      { time: 0, rotation: [0, 0, 35] }, { time: 0.5, rotation: [0, 0, -35] }, { time: 1, rotation: [0, 0, 35] },
    ]),
    rotationTrack('Joint_LegR', [
      { time: 0, rotation: [0, 0, -35] }, { time: 0.5, rotation: [0, 0, 35] }, { time: 1, rotation: [0, 0, -35] },
    ]),
  ])];
}
`;

// A clip that targets a joint that doesn't exist (the #1 "frozen clip" cause).
const BROKEN_RIG = `
const meta = { name: 'broken', category: 'character' };
function build() {
  const root = createRoot('Root');
  const arm = createPivot('ArmR', [0, 1, 0], root);
  createPart('ArmMesh', boxGeo(0.2, 0.6, 0.2), gameMaterial('#999999'), { parent: arm });
  return root;
}
function animate(root) {
  // BUG: createPivot('ArmR') makes 'Joint_ArmR' but the track targets bare 'ArmR'.
  return [createClip('wave', 1, [
    rotationTrack('ArmR', [{ time: 0, rotation: [0, 0, 0] }, { time: 1, rotation: [0, 0, 45] }]),
  ])];
}
`;

test('planFrameTimes samples endpoints inclusively', () => {
  expect(planFrameTimes(1, 6)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
  expect(planFrameTimes(2, 6).at(-1)).toBe(2);
  expect(planFrameTimes(0, 6)).toEqual([0, 0, 0, 0, 0, 0]); // a static "clip"
});

describe('renderClipAnimation', () => {
  test('renders a 6-frame grid for a named clip with correct metadata', async () => {
    const { root, clips } = await executeKilnCode(WALKER);
    const r = await renderClipAnimation(root, clips, { clip: 'walk', camera: 'right' });
    expect(r.ok).toBe(true);
    expect(r.clip).toBe('walk');
    expect(r.camera).toBe('Right');
    expect(r.frames).toBe(6);
    expect(r.duration).toBe(1);
    expect(r.frameTimes).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
    expect(r.png).toBeInstanceOf(Buffer);
    expect(r.png!.length).toBeGreaterThan(100);
    expect(r.unresolvedTracks).toBeUndefined(); // both tracks bind
  });

  test('posing actually moves the scene — frames differ from each other', async () => {
    const { root, clips } = await executeKilnCode(WALKER);
    const r = await renderClipAnimation(root, clips, { clip: 'walk', camera: 'right', perFrame: true });
    expect(r.pngs).toHaveLength(6);
    // Mid-stride (frame 2, ~40%) must look different from the start pose (frame 0).
    expect(Buffer.compare(r.pngs![0]!, r.pngs![2]!)).not.toBe(0);
  });

  test('a track targeting a missing joint surfaces as unresolvedTracks (frozen clip)', async () => {
    const { root, clips } = await executeKilnCode(BROKEN_RIG);
    const r = await renderClipAnimation(root, clips, { clip: 'wave', camera: 'right' });
    expect(r.ok).toBe(true);
    expect(r.unresolvedTracks).toEqual(['ArmR.quaternion']);
  });

  test('an unknown clip name returns the available clips', async () => {
    const { root, clips } = await executeKilnCode(WALKER);
    const r = await renderClipAnimation(root, clips, { clip: 'sprint' });
    expect(r.ok).toBe(false);
    expect(r.error).toContain('not found');
    expect(r.availableClips).toEqual(['walk']);
  });

  test('a scene with no clips reports it cleanly', async () => {
    const { root } = await executeKilnCode(WALKER);
    const r = await renderClipAnimation(root, [], { clip: 'walk' });
    expect(r.ok).toBe(false);
    expect(r.error).toContain('no animation');
  });

  test('findClip resolves case-insensitively and by substring', async () => {
    const { clips } = await executeKilnCode(WALKER);
    expect(findClip(clips, 'WALK')?.name).toBe('walk');
    expect(findClip(clips, 'wal')?.name).toBe('walk');
    expect(findClip(clips, 'nope')).toBeUndefined();
  });

  test('prepareClip parses tracks + derives duration', async () => {
    const { root, clips } = await executeKilnCode(WALKER);
    const prepared = prepareClip(root, clips[0]!);
    expect(prepared.name).toBe('walk');
    expect(prepared.duration).toBe(1);
    expect(prepared.tracks).toHaveLength(2);
    expect(prepared.tracks[0]!.prop).toBe('quaternion');
    expect(prepared.tracks[0]!.stride).toBe(4);
    expect(prepared.unresolved).toHaveLength(0);
  });
});
