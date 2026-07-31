/**
 * Unit tests for the part-framed close-up (kiln_inspect's render half).
 *
 * The interesting property is `isolate`: framing a part does NOT stop a sibling
 * from covering it, so a buried part is unreadable at every camera angle. These
 * tests prove isolation removes the occluder's triangles entirely (not merely
 * dims them), that it is a no-op without a part, and that the framing box is
 * unaffected either way.
 */
import { describe, expect, test } from 'bun:test';
import sharp from 'sharp';
import * as THREE from 'three';

import { renderInspectView, listPartNames, INSPECT_SIZE } from '../inspect';
import { executeKilnCode } from '../../render';

// A small red core fully enclosed by a larger blue shell. From EVERY camera the
// shell covers the core, so this is the "buried part" the model cannot inspect
// by picking another view.
const BURIED_CODE = `
const meta = { name: 'buried-core', category: 'prop' };
function build() {
  const root = createRoot('Root');
  createPart('Core', boxGeo(0.4, 0.4, 0.4), gameMaterial('#ff0000'), { parent: root, position: [0, 0.8, 0] });
  createPart('Shell', boxGeo(1.6, 1.6, 1.6), gameMaterial('#0000ff'), { parent: root, position: [0, 0.8, 0] });
  return root;
}
`;

/** Pixels whose hue is unambiguously the red part vs the blue occluder.
 *  Shading is a scalar multiply on a linear color, so a pure-red material can
 *  never produce a blue-dominant pixel and vice versa. */
async function hueCounts(png: Buffer): Promise<{ red: number; blue: number; background: number }> {
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  let red = 0;
  let blue = 0;
  let background = 0;
  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * info.channels]!;
    const g = data[i * info.channels + 1]!;
    const b = data[i * info.channels + 2]!;
    if (r === 26 && g === 26 && b === 26) background++;
    else if (r > b) red++;
    else if (b > r) blue++;
  }
  return { red, blue, background };
}

describe('renderInspectView isolate', () => {
  test('a buried part is fully occluded by default — the sibling owns every drawn pixel', async () => {
    const { root } = await executeKilnCode(BURIED_CODE);
    const r = renderInspectView(root, { part: 'Core', size: 96 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.part).toBe('Mesh_Core');
    expect(r.isolated).toBe(false);
    const counts = await hueCounts(r.png);
    expect(counts.blue).toBeGreaterThan(0); // the occluding shell is drawn...
    expect(counts.red).toBe(0); // ...and nothing of the framed part survives it
  });

  test('isolate:true removes the occluding sibling entirely — it contributes zero triangles', async () => {
    const { root } = await executeKilnCode(BURIED_CODE);
    const r = renderInspectView(root, { part: 'Core', size: 96, isolate: true });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.isolated).toBe(true);
    const counts = await hueCounts(r.png);
    expect(counts.blue).toBe(0); // the sibling drew nothing at all
    expect(counts.red).toBeGreaterThan(0); // the part is now visible
  });

  test('isolation does not move the camera: same part, same framing, same size', async () => {
    const plain = renderInspectView((await executeKilnCode(BURIED_CODE)).root, {
      part: 'Core',
      size: 96,
    });
    const isolated = renderInspectView((await executeKilnCode(BURIED_CODE)).root, {
      part: 'Core',
      size: 96,
      isolate: true,
    });
    expect(plain.ok && isolated.ok).toBe(true);
    if (!plain.ok || !isolated.ok) return;
    expect(isolated.view).toBe(plain.view);
    expect(isolated.zoom).toBe(plain.zoom);
    expect(isolated.width).toBe(plain.width);
    // Framing is measured from the part's own bounds, which isolation cannot
    // change — so the visible core lands on exactly the same pixels.
    const before = await hueCounts(plain.png);
    const after = await hueCounts(isolated.png);
    expect(after.red + after.background).toBe(before.red + before.blue + before.background);
  });

  test('isolate without a part is a no-op — the whole asset still renders', async () => {
    const { root } = await executeKilnCode(BURIED_CODE);
    const whole = renderInspectView(root, { isolate: true, size: 96 });
    expect(whole.ok).toBe(true);
    if (!whole.ok) return;
    expect(whole.isolated).toBe(false); // nothing was singled out, so nothing was hidden
    expect('part' in whole).toBe(false);
    const counts = await hueCounts(whole.png);
    expect(counts.blue).toBeGreaterThan(0); // the shell is still drawn
  });

  test('isolate:false is the documented default framing (occluders kept for context)', async () => {
    const { root } = await executeKilnCode(BURIED_CODE);
    const r = renderInspectView(root, { part: 'Core', size: 96, isolate: false });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.isolated).toBe(false);
    expect((await hueCounts(r.png)).blue).toBeGreaterThan(0);
  });

  test('an unresolved part is still a retryable miss, isolate or not', async () => {
    const { root } = await executeKilnCode(BURIED_CODE);
    const r = renderInspectView(root, { part: 'Nonexistent', isolate: true });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain('Nonexistent');
    expect(r.availableParts).toEqual(listPartNames(root));
    // Nothing was hidden on the way out: a miss must not mutate the scene.
    const whole = renderInspectView(root, { size: 64 });
    expect(whole.ok).toBe(true);
    if (!whole.ok) return;
    expect((await hueCounts(whole.png)).blue).toBeGreaterThan(0);
  });

  test('a resolvable part with no drawable geometry is a miss, not a blank frame', async () => {
    const root = new THREE.Group();
    const empty = new THREE.Group(); // a pivot/holder the model named but never filled
    empty.name = 'Hollow';
    const solid = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
    solid.name = 'Mesh_Solid';
    root.add(empty, solid);

    const r = renderInspectView(root, { part: 'Hollow', isolate: true });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain('no visible geometry');
    expect(r.availableParts).toContain('Hollow');
    // Bailing before isolation matters: hiding the rest of the scene for a part
    // that cannot be drawn would leave the caller a blank image.
    expect(solid.visible).toBe(true);
  });

  test('the default square size is unchanged by the new option', async () => {
    const { root } = await executeKilnCode(BURIED_CODE);
    const r = renderInspectView(root, { part: 'Core', isolate: true });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.width).toBe(INSPECT_SIZE);
    expect(r.height).toBe(INSPECT_SIZE);
  });
});
