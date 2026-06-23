/**
 * Retex tests — builds a procedural GLB with one textured material, swaps the
 * diffuse, and verifies the output GLB carries the new bytes.
 */

import { describe, expect, test } from 'bun:test';
import { Buffer } from 'node:buffer';
import sharp from 'sharp';
import * as THREE from 'three';

import { NodeIO } from '@gltf-transform/core';

import { renderSceneToGLB } from '../../render';
import { retexCharacter } from '../retex';

async function solid(w: number, h: number, rgb: [number, number, number]): Promise<Buffer> {
  return sharp({
    create: { width: w, height: h, channels: 4, background: { r: rgb[0], g: rgb[1], b: rgb[2], alpha: 1 } },
  })
    .png()
    .toBuffer();
}

async function makeFixture(): Promise<Buffer> {
  const root = new THREE.Group();
  root.name = 'TexturedCube';
  const geom = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  mat.name = 'CharacterAtlas';
  // DataTexture works headlessly — no HTMLImageElement needed.
  const data = new Uint8Array(4 * 4 * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 200;
    data[i + 1] = 180;
    data[i + 2] = 100;
    data[i + 3] = 255;
  }
  const dataTex = new THREE.DataTexture(data, 4, 4, THREE.RGBAFormat);
  dataTex.needsUpdate = true;
  mat.map = dataTex;
  const mesh = new THREE.Mesh(geom, mat);
  root.add(mesh);

  const { bytes } = await renderSceneToGLB(root, {});
  return Buffer.from(bytes);
}

describe('retexCharacter', () => {
  test('swaps the first material\'s base-color texture', async () => {
    const fixture = await makeFixture();
    const newDiffuse = await solid(32, 32, [50, 150, 50]); // OG-107-ish
    const result = await retexCharacter(fixture, {
      diffuse: newDiffuse,
      presetName: 'OG-107-jungle',
    });
    expect(result.glb.readUInt32LE(0)).toBe(0x46546c67);
    expect(result.meta.materialIndex).toBe(0);
    expect(result.meta.presetName).toBe('OG-107-jungle');
    expect(result.meta.sourceBytes).toBe(fixture.byteLength);

    // Verify the new texture is in the output GLB by re-reading it.
    const io = new NodeIO();
    const doc = await io.readBinary(result.glb);
    const textures = doc.getRoot().listTextures();
    expect(textures.length).toBeGreaterThanOrEqual(1);
    const diffuseImg = textures[0]!.getImage();
    expect(diffuseImg).toBeTruthy();
    // The embedded texture size should match the new diffuse, not the original 4x4.
    expect(diffuseImg!.length).toBe(newDiffuse.length);
  });

  test('selects material by name', async () => {
    const fixture = await makeFixture();
    const newDiffuse = await solid(16, 16, [10, 10, 10]);
    const result = await retexCharacter(fixture, {
      diffuse: newDiffuse,
      materialName: 'CharacterAtlas',
    });
    expect(result.meta.materialName).toBe('CharacterAtlas');
  });

  test('throws on unknown material name', async () => {
    const fixture = await makeFixture();
    const newDiffuse = await solid(16, 16, [10, 10, 10]);
    await expect(
      retexCharacter(fixture, { diffuse: newDiffuse, materialName: 'NoSuchMaterial' }),
    ).rejects.toThrow(/no material named/);
  });

  test('throws on out-of-bounds materialIndex', async () => {
    const fixture = await makeFixture();
    const newDiffuse = await solid(16, 16, [10, 10, 10]);
    await expect(
      retexCharacter(fixture, { diffuse: newDiffuse, materialIndex: 99 }),
    ).rejects.toThrow(/out of bounds/);
  });
});
