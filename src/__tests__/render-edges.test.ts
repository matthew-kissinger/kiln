/**
 * Render edge-cases (W7.3)
 *
 * The spike test covers the happy path for renderGLB with MeshStandard
 * materials and quaternion tracks. This suite exercises the bits left
 * uncovered: executeKilnCode guard clauses, Lambert/Basic material
 * bridges, position/scale animation paths, missing target warnings,
 * and the scale-track branch of inspectGeneratedAnimation.
 */

import { describe, expect, test } from 'bun:test';
import { Accessor, NodeIO } from '@gltf-transform/core';
import * as THREE from 'three';

import { boxGeo, createPart, createRoot, gameMaterial } from '../primitives';
import { executeKilnCode, renderGLB, renderSceneToGLB, inspectGeneratedAnimation } from '../render';

// =============================================================================
// executeKilnCode guard clauses
// =============================================================================

describe('executeKilnCode input validation', () => {
  test('throws on empty string', async () => {
    await expect(executeKilnCode('')).rejects.toThrow(/non-empty string/);
  });

  test('throws when build is not defined at all', async () => {
    // The wrapper's missing build reference receives the same bounded authoring
    // diagnostic as an undeclared variable in the authored program.
    await expect(executeKilnCode(`const meta = { name: 'NoBuild' };`)).rejects.toMatchObject({
      diagnostic: 'UNBOUND_VARIABLE',
    });
  });

  test('throws when build is defined but is not a function', async () => {
    await expect(
      executeKilnCode(`
const meta = { name: 'NotFn' };
const build = 'not a function';
`),
    ).rejects.toThrow(/did not define `build`/);
  });

  test('throws when build() does not return an Object3D', async () => {
    await expect(
      executeKilnCode(`
const meta = { name: 'BadReturn' };
function build() { return 42; }
`),
    ).rejects.toThrow(/did not return a THREE.Object3D/);
  });

  test('normalizes CRLF line endings', async () => {
    const code = `\r\nconst meta = { name: 'CRLF' };\r\nfunction build() { return createRoot('CRLF'); }\r\n`;
    const { meta, root } = await executeKilnCode(code);
    expect(meta.name).toBe('CRLF');
    expect(root.name).toBe('CRLF');
  });
});

// =============================================================================
// Material bridges (Lambert + Basic)
// =============================================================================

describe('renderGLB with non-Standard materials', () => {
  test('lambertMaterial is serialized into a valid GLB', async () => {
    const code = `
const meta = { name: 'Lambert' };
function build() {
  const root = createRoot('Lambert');
  createPart('Body', boxGeo(1, 1, 1), lambertMaterial(0xff00ff, { emissive: 0x220011 }), {
    parent: root,
  });
  return root;
}
`;
    const r = await renderGLB(code);
    expect(r.glb).toBeInstanceOf(Buffer);
    expect(r.glb.byteLength).toBeGreaterThan(500);

    const io = new NodeIO();
    const doc = await io.readBinary(r.glb);
    const mats = doc.getRoot().listMaterials();
    expect(mats.length).toBe(1);
    // Lambert maps to roughness=1, metallic=0 in the bridge.
    expect(mats[0]?.getRoughnessFactor()).toBe(1);
    expect(mats[0]?.getMetallicFactor()).toBe(0);
  });

  test('basicMaterial is serialized into a valid GLB', async () => {
    const code = `
const meta = { name: 'Basic' };
function build() {
  const root = createRoot('Basic');
  createPart('Body', boxGeo(1, 1, 1), basicMaterial(0x00ffff, { transparent: true, opacity: 0.5 }), {
    parent: root,
  });
  return root;
}
`;
    const r = await renderGLB(code);
    const io = new NodeIO();
    const doc = await io.readBinary(r.glb);
    const mats = doc.getRoot().listMaterials();
    expect(mats.length).toBe(1);
    expect(mats[0]?.getMetallicFactor()).toBe(0);
  });

  test('glassMaterial emits alphaMode=BLEND and doubleSided', async () => {
    const code = `
const meta = { name: 'Glass' };
function build() {
  const root = createRoot('Glass');
  createPart('Pane', planeGeo(1, 1), glassMaterial(0x88ccff), { parent: root });
  return root;
}
`;
    const r = await renderGLB(code);
    const io = new NodeIO();
    const doc = await io.readBinary(r.glb);
    const mat = doc.getRoot().listMaterials()[0];
    expect(mat?.getAlphaMode()).toBe('BLEND');
    expect(mat?.getDoubleSided()).toBe(true);
  });
});

// =============================================================================
// Animation track variants
// =============================================================================

describe('renderGLB animation track bridging', () => {
  test('position tracks are written as translation channels', async () => {
    const code = `
const meta = { name: 'PosTrack' };
function build() {
  const root = createRoot('PosTrack');
  const body = createPivot('Body', [0, 0, 0], root);
  createPart('BodyMesh', boxGeo(0.2, 0.2, 0.2), gameMaterial(0x888888), { parent: body });
  return root;
}
function animate() {
  return [createClip('Bob', 1, [
    positionTrack('Joint_Body', [
      { time: 0, position: [0, 0, 0] },
      { time: 1, position: [0, 1, 0] },
    ]),
  ])];
}
`;
    const r = await renderGLB(code);
    expect(r.warnings).toEqual([]);

    const io = new NodeIO();
    const doc = await io.readBinary(r.glb);
    const animation = doc.getRoot().listAnimations()[0];
    expect(animation).toBeDefined();
    const channel = animation?.listChannels()[0];
    expect(channel?.getTargetPath()).toBe('translation');
  });

  test('scale tracks are written as scale channels', async () => {
    const code = `
const meta = { name: 'ScaleTrack' };
function build() {
  const root = createRoot('ScaleTrack');
  const body = createPivot('Body', [0, 0, 0], root);
  createPart('BodyMesh', boxGeo(0.2, 0.2, 0.2), gameMaterial(0x888888), { parent: body });
  return root;
}
function animate() {
  return [createClip('Grow', 1, [
    scaleTrack('Joint_Body', [
      { time: 0, scale: [1, 1, 1] },
      { time: 1, scale: [2, 2, 2] },
    ]),
  ])];
}
`;
    const r = await renderGLB(code);
    expect(r.warnings).toEqual([]);

    const io = new NodeIO();
    const doc = await io.readBinary(r.glb);
    const channel = doc.getRoot().listAnimations()[0]?.listChannels()[0];
    expect(channel?.getTargetPath()).toBe('scale');
  });

  test('warns (but does not fail) when an animation targets a missing joint', async () => {
    const code = `
const meta = { name: 'Missing' };
function build() {
  const root = createRoot('Missing');
  const body = createPivot('Body', [0, 0, 0], root);
  createPart('BodyMesh', boxGeo(0.2, 0.2, 0.2), gameMaterial(0x888888), { parent: body });
  return root;
}
function animate() {
  return [createClip('Bad', 1, [
    rotationTrack('Joint_DoesNotExist', [
      { time: 0, rotation: [0, 0, 0] },
      { time: 1, rotation: [30, 0, 0] },
    ]),
  ])];
}
`;
    const r = await renderGLB(code);
    // Still produces a GLB.
    expect(r.glb).toBeInstanceOf(Buffer);
    // But surfaces the warning both from inspectGeneratedAnimation and
    // the bridge's own "target not found - skipped" path.
    expect(r.warnings.some((w) => w.includes('Joint_DoesNotExist'))).toBe(true);
  });
});

// =============================================================================
// Index componentType selection (Uint16 vs Uint32)
// =============================================================================

describe('bridgeGeometry index componentType', () => {
  test('a >65,535-vertex geometry roundtrips with UNSIGNED_INT indices intact', async () => {
    const root = createRoot('BigMesh');
    // 256x256 segments -> 257^2 = 66,049 vertices, past the Uint16 ceiling.
    const geo = new THREE.PlaneGeometry(1, 1, 256, 256);
    createPart('Big', geo, gameMaterial(0x8899aa), { parent: root });

    const { bytes } = await renderSceneToGLB(root, { dedup: false });
    const doc = await new NodeIO().readBinary(bytes);
    const idx = doc.getRoot().listMeshes()[0]?.listPrimitives()[0]?.getIndices();
    expect(idx?.getComponentType()).toBe(Accessor.ComponentType.UNSIGNED_INT);

    // The top vertex index survives (a Uint16 write would wrap 66048 -> 512).
    const arr = idx?.getArray();
    let max = 0;
    if (arr) for (const v of arr) max = Math.max(max, v);
    expect(max).toBe(66049 - 1);
  });

  test('a small geometry keeps compact UNSIGNED_SHORT indices', async () => {
    const root = createRoot('SmallMesh');
    createPart('Small', boxGeo(1, 1, 1), gameMaterial(0x8899aa), { parent: root });

    const { bytes } = await renderSceneToGLB(root, { dedup: false });
    const doc = await new NodeIO().readBinary(bytes);
    const idx = doc.getRoot().listMeshes()[0]?.listPrimitives()[0]?.getIndices();
    expect(idx?.getComponentType()).toBe(Accessor.ComponentType.UNSIGNED_SHORT);
  });
});

// =============================================================================
// inspectGeneratedAnimation
// =============================================================================

describe('inspectGeneratedAnimation track validation', () => {
  test('flags tracks whose name lacks a dot separator', async () => {
    const { root, clips } = await executeKilnCode(`
const meta = { name: 'R' };
function build() { return createRoot('R'); }
function animate() {
  // Craft a track by hand so we can smuggle in a bad name.
  const track = rotationTrack('Joint_X', [{ time: 0, rotation: [0, 0, 0] }]);
  track.name = 'noSeparator'; // intentionally malformed
  return [createClip('c', 1, [track])];
}
`);
    const warnings = inspectGeneratedAnimation(root, clips);
    expect(warnings.some((w) => w.includes('missing a node.property separator'))).toBe(true);
  });

  test('flags tracks using unsupported properties', async () => {
    const { root, clips } = await executeKilnCode(`
const meta = { name: 'R' };
function build() {
  const root = createRoot('R');
  createPivot('Body', [0, 0, 0], root);
  return root;
}
function animate() {
  const track = rotationTrack('Joint_Body', [{ time: 0, rotation: [0, 0, 0] }]);
  track.name = 'Joint_Body.unsupportedChannel';
  return [createClip('c', 1, [track])];
}
`);
    const warnings = inspectGeneratedAnimation(root, clips);
    expect(warnings.some((w) => w.includes('unsupported property'))).toBe(true);
  });
});

// =============================================================================
// Primitive-usage instrumentation
// =============================================================================

describe('primitive usage tracking', () => {
  test('executeKilnCode surfaces primitiveUsage with exact call counts', async () => {
    const { primitiveUsage } = await executeKilnCode(`
const meta = { name: 'UsageProbe' };
function build() {
  const root = createRoot('R');
  createPart('A', boxGeo(1, 1, 1), gameMaterial(0xff0000), { parent: root });
  createPart('B', boxGeo(2, 1, 1), gameMaterial(0x00ff00), { parent: root });
  createPart('C', sphereGeo(0.5), gameMaterial(0x0000ff), { parent: root });
  return root;
}
`);
    expect(primitiveUsage.createRoot).toBe(1);
    expect(primitiveUsage.createPart).toBe(3);
    expect(primitiveUsage.boxGeo).toBe(2);
    expect(primitiveUsage.sphereGeo).toBe(1);
    expect(primitiveUsage.gameMaterial).toBe(3);
    expect(primitiveUsage.torusGeo).toBeUndefined();
  });

  test('renderGLB copies primitiveUsage into meta', async () => {
    const r = await renderGLB(`
const meta = { name: 'UsageProbeRender' };
function build() {
  const root = createRoot('R');
  createPart('A', boxGeo(1, 1, 1), gameMaterial(0xff0000), { parent: root });
  return root;
}
`);
    expect(r.meta.primitiveUsage).toBeDefined();
    const usage = r.meta.primitiveUsage!;
    expect(usage.createRoot).toBe(1);
    expect(usage.createPart).toBe(1);
    expect(usage.boxGeo).toBe(1);
    expect(usage.gameMaterial).toBe(1);
  });
});
