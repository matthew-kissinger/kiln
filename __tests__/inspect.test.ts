/**
 * Kiln introspection tests (W3b.1)
 *
 * Render-only — no LLM, no network. Feeds hand-written Kiln code into
 * `kiln.inspect()` and asserts the structured report captures everything
 * agents need for debugging.
 */

import { describe, expect, test } from 'bun:test';

import { inspect } from '../inspect';

const CHEST_CODE = `
const meta = { name: 'TestChest', category: 'prop', tris: 60 };
function build() {
  const root = createRoot('TestChest');
  const body = createPart('Body', boxGeo(1, 0.6, 0.6), gameMaterial(0x8b4513), {
    position: [0, 0.3, 0], parent: root,
  });
  createPart('Lid', boxGeo(1, 0.2, 0.6), gameMaterial(0x6b3410), {
    position: [0, 0.7, 0], pivot: true, parent: root,
  });
  return root;
}
function animate() {
  return [createClip('Open', 1, [
    rotationTrack('Joint_Lid', [
      { time: 0, rotation: [0, 0, 0] },
      { time: 1, rotation: [-80, 0, 0] },
    ]),
  ])];
}
`;

const FLOATING_CODE = `
const meta = { name: 'Floater' };
function build() {
  const root = createRoot('Floater');
  createPart('Body', sphereGeo(0.5), gameMaterial(0x00ff00), {
    position: [0, 5, 0], parent: root,
  });
  return root;
}
`;

const BROKEN_JOINT_CODE = `
const meta = { name: 'Broken' };
function build() {
  const root = createRoot('Broken');
  createPivot('Body', [0, 0, 0], root);
  return root;
}
function animate() {
  return [createClip('bad', 1, [
    rotationTrack('Joint_DoesNotExist', [
      { time: 0, rotation: [0, 0, 0] },
      { time: 1, rotation: [30, 0, 0] },
    ]),
  ])];
}
`;

const EMPTY_CODE = `
const meta = { name: 'Empty' };
function build() {
  return createRoot('Empty');
}
`;

describe('kiln.inspect', () => {
  test('reports triangles, materials and bounding box for a real chest', async () => {
    const r = await inspect(CHEST_CODE);

    expect(r.triangles).toBeGreaterThan(0);
    expect(r.materials).toBe(2);
    expect(r.boundingBox.size[0]).toBeGreaterThan(0);
    expect(r.boundingBox.size[1]).toBeGreaterThan(0);
    expect(r.boundingBox.size[2]).toBeGreaterThan(0);
    expect(r.warnings).toEqual([]);
    expect(r.meta.name).toBe('TestChest');
  });

  test('captures named parts with type classification', async () => {
    const r = await inspect(CHEST_CODE);

    const names = r.namedParts.map((p) => p.name);
    expect(names).toContain('TestChest');
    expect(names).toContain('Mesh_Body');
    expect(names).toContain('Joint_Lid');

    const joint = r.namedParts.find((p) => p.name === 'Joint_Lid');
    expect(joint?.type).toBe('pivot');

    const mesh = r.namedParts.find((p) => p.name === 'Mesh_Body');
    expect(mesh?.type).toBe('mesh');
  });

  test('surfaces animation tracks with targetResolved flag', async () => {
    const r = await inspect(CHEST_CODE);

    expect(r.animationTracks.length).toBe(1);
    const track = r.animationTracks[0];
    expect(track?.clipName).toBe('Open');
    expect(track?.targetName).toBe('Joint_Lid');
    expect(track?.property).toBe('rotation');
    expect(track?.targetResolved).toBe(true);
  });

  test('flags animation tracks whose target is missing from the scene', async () => {
    const r = await inspect(BROKEN_JOINT_CODE);

    expect(r.animationTracks.length).toBe(1);
    expect(r.animationTracks[0]?.targetResolved).toBe(false);
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.warnings.some((w) => w.includes('Joint_DoesNotExist'))).toBe(true);
  });

  test('lists the primitives actually used in the code', async () => {
    const r = await inspect(CHEST_CODE);

    expect(r.primitivesUsed).toContain('createRoot');
    expect(r.primitivesUsed).toContain('createPart');
    expect(r.primitivesUsed).toContain('boxGeo');
    expect(r.primitivesUsed).toContain('gameMaterial');
    expect(r.primitivesUsed).toContain('rotationTrack');
    expect(r.primitivesUsed).toContain('createClip');

    // Should not falsely detect unused primitives.
    expect(r.primitivesUsed).not.toContain('sphereGeo');
    expect(r.primitivesUsed).not.toContain('torusGeo');
  });

  test('bounds reflect a floating asset (debugging aid)', async () => {
    const r = await inspect(FLOATING_CODE);

    // Sphere at y=5 with r=0.5 → min y >= 4.5, max y <= 5.5
    expect(r.boundingBox.min[1]).toBeGreaterThan(4);
    expect(r.boundingBox.min[1]).toBeLessThan(5);
    expect(r.boundingBox.max[1]).toBeGreaterThan(5);
  });

  test('returns zeroed bounds for a pivots-only scene', async () => {
    const r = await inspect(EMPTY_CODE);

    expect(r.triangles).toBe(0);
    expect(r.materials).toBe(0);
    expect(r.boundingBox.min).toEqual([0, 0, 0]);
    expect(r.boundingBox.max).toEqual([0, 0, 0]);
    expect(r.boundingBox.size).toEqual([0, 0, 0]);
    expect(r.animationTracks).toEqual([]);
  });
});
