/**
 * kiln_screenshot_animation registry def: the run() contract (grid vs perFrame),
 * the media/mediaMulti extractors (PNG bytes out, base64 stripped from JSON), and
 * the image-free failure path. Mirrors registry-screenshot.test.ts.
 */
import { describe, expect, test } from 'bun:test';

import {
  kilnScreenshotAnimationDef,
  screenshotAnimationMedia,
  screenshotAnimationMediaMulti,
  type KilnScreenshotAnimationResult,
} from '../registry';

const WALKER = `
const meta = { name: 'walker', category: 'character' };
function build() {
  const root = createRoot('Root');
  const hips = createPivot('Hips', [0, 1, 0], root);
  createPart('Pelvis', boxGeo(0.4, 0.3, 0.3), gameMaterial('#888888'), { parent: hips });
  const legL = createPivot('LegL', [0, 0, 0.12], hips);
  createPart('LegLMesh', boxGeo(0.15, 0.9, 0.15), gameMaterial('#444444'), { parent: legL, position: [0, -0.45, 0] });
  return root;
}
function animate(root) {
  return [createClip('walk', 1, [
    rotationTrack('Joint_LegL', [
      { time: 0, rotation: [0, 0, 35] }, { time: 0.5, rotation: [0, 0, -35] }, { time: 1, rotation: [0, 0, 35] },
    ]),
  ])];
}
`;

describe('kilnScreenshotAnimationDef', () => {
  test('grid mode: returns metrics + a base64 grid PNG', async () => {
    const out = (await kilnScreenshotAnimationDef.run({
      code: WALKER,
      clip: 'walk',
    })) as KilnScreenshotAnimationResult;
    expect(out.ok).toBe(true);
    expect(out.clip).toBe('walk');
    expect(out.camera).toBe('Right'); // default camera
    expect(out.frames).toBe(6);
    expect(typeof out.pngBase64).toBe('string');
    expect(out.pngBase64!.length).toBeGreaterThan(0);
    expect(out.framesBase64).toBeUndefined();
  });

  test('media extractor strips base64 and returns PNG bytes', async () => {
    const out = await kilnScreenshotAnimationDef.run({ code: WALKER, clip: 'walk' });
    const media = screenshotAnimationMedia(out);
    expect(media).toBeDefined();
    expect(media!.png).toBeInstanceOf(Uint8Array);
    expect(media!.png.length).toBeGreaterThan(0);
    expect('pngBase64' in (media!.json as object)).toBe(false);
    // PNG magic number.
    expect(Array.from(media!.png.subarray(0, 4))).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });

  test('perFrame mode: 6 separate frame PNGs via mediaMulti', async () => {
    const out = (await kilnScreenshotAnimationDef.run({
      code: WALKER,
      clip: 'walk',
      perFrame: true,
    })) as KilnScreenshotAnimationResult;
    expect(out.framesBase64).toHaveLength(6);
    expect(out.pngBase64).toBeUndefined();
    const multi = screenshotAnimationMediaMulti(out);
    expect(multi!.pngs).toHaveLength(6);
    expect(multi!.pngs[0]).toBeInstanceOf(Uint8Array);
    expect('framesBase64' in (multi!.json as object)).toBe(false);
    // The grid extractor declines a perFrame result.
    expect(screenshotAnimationMedia(out)).toBeUndefined();
  });

  test('a build failure is image-free (ok:false, no png)', async () => {
    const out = (await kilnScreenshotAnimationDef.run({
      code: 'not valid (',
      clip: 'walk',
    })) as KilnScreenshotAnimationResult;
    expect(out.ok).toBe(false);
    expect(out.error).toBeDefined();
    expect(out.pngBase64).toBeUndefined();
    expect(screenshotAnimationMedia(out)).toBeUndefined();
  });

  test('an unknown clip reports the available clips, no image', async () => {
    const out = (await kilnScreenshotAnimationDef.run({
      code: WALKER,
      clip: 'jump',
    })) as KilnScreenshotAnimationResult;
    expect(out.ok).toBe(false);
    expect(out.availableClips).toEqual(['walk']);
    expect(out.pngBase64).toBeUndefined();
  });
});
