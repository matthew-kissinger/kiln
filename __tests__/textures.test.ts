/**
 * Wave 3B: PBR materials + texture round-trip through the GLB bridge.
 */

import { describe, it, expect } from 'bun:test';
import * as THREE from 'three';
import sharp from 'sharp';
import { NodeIO } from '@gltf-transform/core';
import {
  createRoot,
  boxGeo,
  gameMaterial,
} from '../primitives';
import { loadTexture, pbrMaterial } from '../textures';
import { autoUnwrap } from '../uv';
import { renderSceneToGLB } from '../render';

async function makeSolidPng(color: { r: number; g: number; b: number }): Promise<Buffer> {
  return sharp({
    create: {
      width: 16,
      height: 16,
      channels: 4,
      background: { ...color, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
}

describe('Wave 3B: loadTexture + pbrMaterial', () => {
  it('loadTexture decodes a PNG into a DataTexture with encoded bytes stashed', async () => {
    const png = await makeSolidPng({ r: 255, g: 100, b: 50 });
    const tex = await loadTexture(png);

    expect(tex).toBeInstanceOf(THREE.DataTexture);
    expect(tex.image.width).toBe(16);
    expect(tex.image.height).toBe(16);
    const encoded = (tex.userData as Record<string, unknown>)['encoded'] as {
      mime: string;
      bytes: Uint8Array;
    };
    expect(encoded).toBeDefined();
    expect(encoded.mime).toBe('image/png');
    expect(encoded.bytes.length).toBe(png.length);
  });

  it('pbrMaterial with scalar inputs produces a MeshStandardMaterial', () => {
    const mat = pbrMaterial({ albedo: 0x886644, roughness: 0.9, metalness: 0 });
    expect(mat).toBeInstanceOf(THREE.MeshStandardMaterial);
    expect(mat.color.getHex()).toBe(0x886644);
    expect(mat.roughness).toBeCloseTo(0.9);
    expect(mat.metalness).toBe(0);
  });

  it('pbrMaterial with a Texture wires map + neutralizes color', async () => {
    const png = await makeSolidPng({ r: 200, g: 150, b: 100 });
    const tex = await loadTexture(png);
    const mat = pbrMaterial({ albedo: tex });

    expect(mat.map).toBe(tex);
    expect(mat.color.getHex()).toBe(0xffffff);
  });

  it('texture survives round-trip through GLB export', async () => {
    const png = await makeSolidPng({ r: 255, g: 0, b: 128 });
    const tex = await loadTexture(png);
    const mat = pbrMaterial({ albedo: tex, roughness: 0.7 });

    const root = createRoot('TexCrate');
    const geo = await autoUnwrap(boxGeo(1, 1, 1));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'Mesh_TexCrate';
    root.add(mesh);

    const { bytes } = await renderSceneToGLB(root);
    expect(bytes.byteLength).toBeGreaterThan(png.length); // contains the texture

    // Re-parse the GLB and confirm the albedo texture is present.
    const io = new NodeIO();
    const doc = await io.readBinary(bytes);
    const mats = doc.getRoot().listMaterials();
    expect(mats.length).toBe(1);
    const base = mats[0]!.getBaseColorTexture();
    expect(base).not.toBeNull();
    const img = base!.getImage();
    expect(img).not.toBeNull();
    expect(img!.byteLength).toBe(png.length);
  });

  it('untextured gameMaterial still exports without maps (regression)', async () => {
    const root = createRoot('Plain');
    const mesh = new THREE.Mesh(boxGeo(1, 1, 1), gameMaterial(0xff0000));
    mesh.name = 'Mesh_Plain';
    root.add(mesh);
    const { bytes } = await renderSceneToGLB(root);

    const io = new NodeIO();
    const doc = await io.readBinary(bytes);
    const mats = doc.getRoot().listMaterials();
    expect(mats[0]!.getBaseColorTexture()).toBeNull();
  });
});
