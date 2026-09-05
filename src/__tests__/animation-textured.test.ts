import { describe, expect, test } from 'bun:test';

import { createKilnScreenshotAnimationDef } from '../tools/registry';

/**
 * `kiln_screenshot_animation` on an asset that has textures.
 *
 * This is a regression test for a bug that reached the examples directory: the
 * animation preview posed the scene, exported it again to render one cell, and
 * that export was submitted to asset QA as if it were a new asset. It is not —
 * it is a re-serialization of bytes this engine had already produced and
 * passed. But a texture that has been through a GLB round trip comes back as a
 * decoded image without the payload provenance `MAT_TEXTURE_DECODE_FAILED`
 * requires, so QA rejected it, and *every textured asset was unable to preview
 * its own animation*. The repository's designated animation example is a
 * textured robot arm, so the flagship case was the broken one.
 *
 * The fixture below is deliberately tiny and inline rather than a real example:
 * the bug needs one procedural texture and one clip to reproduce, and a test
 * that renders six cells of a fifteen-thousand-triangle arm would be slow
 * enough that someone would eventually delete it.
 */
const TEXTURED_ANIMATED = `
const meta = { name: 'Spinner', category: 'prop', role: 'prop' };

async function build() {
  const root = createRoot('Spinner');
  const albedo = proceduralTexture({
    schemaVersion: 2, size: 64, usage: 'albedo', name: 'Paint',
    layers: [
      { op: 'solid', color: 0x9c4a1e },
      { op: 'noise', colorA: 0x84400f, colorB: 0xb85a28, scale: 30, octaves: 2, seed: 3, blend: 'overlay', opacity: 0.3 },
    ],
  });
  const painted = pbrMaterial({ albedo, roughness: 0.5, metalness: 0.0 });
  createPart('Base', boxGeo(0.6, 0.2, 0.6), painted, { position: [0, 0.1, 0], parent: root });
  createPart('Vane', boxGeo(0.15, 0.7, 0.15), painted, {
    position: [0, 0.55, 0],
    parent: root,
    pivot: [0, -0.35, 0],
  });
  return root;
}

function animate() {
  return [
    createClip('spin', 2, [
      rotationTrack('Vane', [
        { time: 0, rotation: [0, 0, 0] },
        { time: 1, rotation: [0, 180, 0] },
        { time: 2, rotation: [0, 360, 0] },
      ]),
    ]),
  ];
}
`;

describe('kiln_screenshot_animation with textures', () => {
  test('previews a textured asset instead of rejecting its own render', async () => {
    const def = createKilnScreenshotAnimationDef();
    const result = (await def.run({ code: TEXTURED_ANIMATED, clip: 'spin' })) as {
      ok: boolean;
      frames: number;
      clip?: string;
      error?: string;
    };

    // Named explicitly: the failure mode was a QA block, and asserting only
    // `ok` would let a future regression pass with a different error.
    expect(result.error ?? '').not.toContain('MAT_TEXTURE_DECODE_FAILED');
    expect(result.error ?? '').not.toContain('Asset QA blocked');
    expect(result.ok).toBe(true);
    expect(result.frames).toBeGreaterThan(1);
    expect(result.clip).toBe('spin');
  }, 120_000);
});
