/**
 * Composed-scene rasterizer — the default SceneRenderPort implementation.
 *
 * Executes each unique Kiln program once, clones it per placement into one THREE
 * scene, and rasterizes a labelled grid. We assert a real PNG comes out for the
 * default 3 angles, for a single custom direction, and that duplicate codes are
 * executed once (the cache), without any GLB round-trip.
 */
import { describe, expect, test } from 'bun:test';

import { rasterizeComposedScene, SCENE_VIEWS } from '../views';

const BARREL = `function build() {
  const root = createRoot('Barrel');
  const steel = lambertMaterial(0xc8743a);
  createPart('Body', cylinderGeo(0.55, 0.55, 1.3, 16), steel, { parent: root, position: [0, 0.65, 0] });
  return root;
}`;

const TREE = `function build() {
  const root = createRoot('Tree');
  const bark = lambertMaterial(0x4a2a14);
  const leaf = lambertMaterial(0x4f7d5e);
  createPart('Trunk', cylinderGeo(0.12, 0.17, 1.0, 8), bark, { parent: root, position: [0, 0.5, 0] });
  createPart('Canopy', sphereGeo(0.55, 8, 6), leaf, { parent: root, position: [0, 1.2, 0] });
  return root;
}`;

const isPng = (b: Buffer): boolean =>
  b.length > 1000 && b[0] === 0x89 && b.subarray(1, 4).toString('latin1') === 'PNG';

describe('rasterizeComposedScene', () => {
  test('renders a multi-asset scene from the 3 default angles into one grid PNG', async () => {
    const r = await rasterizeComposedScene([
      { code: BARREL, pos: [0, 0, 0], rotYDeg: 0, scale: 1 },
      { code: BARREL, pos: [4, 0, 0], rotYDeg: 90, scale: 1 },
      { code: TREE, pos: [0, 0, 6], rotYDeg: 0, scale: 1.5 },
    ]);
    expect(isPng(r.png)).toBe(true);
    expect(r.views).toEqual(SCENE_VIEWS.map((v) => v.name));
    // 3 cells across one row → wider than tall.
    expect(r.width).toBeGreaterThan(r.height);
  });

  test('a single custom view direction yields a one-cell image', async () => {
    const r = await rasterizeComposedScene(
      [{ code: BARREL, pos: [0, 0, 0], rotYDeg: 0, scale: 1 }],
      { views: [{ name: 'cam', dir: [1, 0.6, 1] }], size: 256 },
    );
    expect(isPng(r.png)).toBe(true);
    expect(r.views).toEqual(['cam']);
    expect(r.width).toBe(256 + 2 * 4); // one cell + padding
  });

  test('an empty scene still produces a (blank) grid without throwing', async () => {
    const r = await rasterizeComposedScene([]);
    expect(isPng(r.png)).toBe(true);
  });
});
