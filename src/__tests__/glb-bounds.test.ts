/**
 * H-41: `measureGlbBounds` recovers the same world AABB from stored GLB bytes
 * that `executeKilnCode` + `measureBounds` computes from the live scene — the
 * equivalence Kiln Studio's compose catalog relies on to drop its
 * execute-model-code bbox fallback.
 */
import { describe, expect, test } from 'bun:test';

import { createAssetIntentV1 } from '../contracts';
import { executeKilnCode, measureGlbBounds, renderGLB } from '../render';
import { measureBounds } from '../views';

const OFFSET_CODE = `
const meta = { name: 'BoundsProbe', category: 'prop' };
function build() {
  const root = createRoot('BoundsProbe');
  createPart('Body', boxGeo(2, 1, 0.5), gameMaterial(0x8B4513), { position: [0.5, 0.5, -0.25], parent: root });
  const pivot = createPivot('Joint_Arm', [1, 1, 0], root);
  createPart('Arm', boxGeo(0.2, 1.2, 0.2), gameMaterial(0x445566), { position: [0, 0.6, 0], parent: pivot });
  return root;
}
`;

describe('measureGlbBounds', () => {
  test('matches the live-scene bounds for a rendered program', async () => {
    const intent = createAssetIntentV1({ category: 'prop' });
    const rendered = await renderGLB(OFFSET_CODE, { intent });
    const fromBytes = await measureGlbBounds(rendered.glb);
    expect(fromBytes).toBeDefined();

    const { root } = await executeKilnCode(OFFSET_CODE);
    const live = measureBounds(root);
    for (let axis = 0; axis < 3; axis++) {
      expect(fromBytes!.min[axis]!).toBeCloseTo(live.min[axis]!, 4);
      expect(fromBytes!.max[axis]!).toBeCloseTo(live.max[axis]!, 4);
    }
  });

  test('returns undefined for bytes with no measurable geometry', async () => {
    const intent = createAssetIntentV1({ category: 'prop' });
    // Render something valid, then strip it to an empty document via a re-read
    // is overkill — an asset whose only node is empty is not producible through
    // renderGLB (QA blocks it), so probe the guard directly with a minimal
    // valid-but-empty GLB written by gltf-transform.
    const { Document, WebIO } = await import('@gltf-transform/core');
    const doc = new Document();
    doc.createScene('Empty');
    const bytes = await new WebIO().writeBinary(doc);
    expect(await measureGlbBounds(bytes)).toBeUndefined();
    // And the happy path still stands on the same IO round-trip.
    const rendered = await renderGLB(OFFSET_CODE, { intent });
    expect(await measureGlbBounds(rendered.glb)).toBeDefined();
  });
});
