/**
 * Wave 3B: PBR materials + texture round-trip through the GLB bridge.
 */

import { describe, it, expect } from 'bun:test';
import * as THREE from 'three';
import sharp from 'sharp';
import { NodeIO } from '@gltf-transform/core';
import { createRoot, boxGeo, foliageCardGeo, gameMaterial } from '../primitives';
import { foliageMaterial, loadTexture, pbrMaterial } from '../textures';
import { autoUnwrap } from '../uv';
import { optimizeGlbBytes, renderSceneToGLB } from '../render';
import { createAssetIntentV1 } from '../contracts';
import { inspectSceneMaterials } from '../qa/material';
import { validateFinalGlbBytes } from '../qa/gltf';

async function makeSolidPng(
  color: { r: number; g: number; b: number },
  alpha = 1,
): Promise<Buffer> {
  return sharp({
    create: {
      width: 16,
      height: 16,
      channels: 4,
      background: { ...color, alpha },
    },
  })
    .png()
    .toBuffer();
}

async function makePatternPng(color: { r: number; g: number; b: number }): Promise<Buffer> {
  const width = 16;
  const height = 16;
  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const scale = (x + y) % 2 === 0 ? 1 : 0.5;
      pixels[offset] = Math.round(color.r * scale);
      pixels[offset + 1] = Math.round(color.g * scale);
      pixels[offset + 2] = Math.round(color.b * scale);
      pixels[offset + 3] = 255;
    }
  }
  return sharp(pixels, { raw: { width, height, channels: 4 } })
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
    const meta = (tex.userData as Record<string, unknown>)['kilnTexture'] as {
      hasAlpha: boolean;
    };
    expect(meta.hasAlpha).toBe(false);

    const translucent = await loadTexture(await makeSolidPng({ r: 255, g: 100, b: 50 }, 0.4));
    expect(
      (
        (translucent.userData as Record<string, unknown>)['kilnTexture'] as {
          hasAlpha: boolean;
        }
      ).hasAlpha,
    ).toBe(true);
  });

  it('assigns sRGB only to color textures and linear space to data textures', async () => {
    const png = await makeSolidPng({ r: 128, g: 128, b: 255 });
    expect((await loadTexture(png, { usage: 'albedo' })).colorSpace).toBe(THREE.SRGBColorSpace);
    expect((await loadTexture(png, { usage: 'emissive' })).colorSpace).toBe(THREE.SRGBColorSpace);
    for (const usage of [
      'normal',
      'roughness',
      'metalness',
      'metallicRoughness',
      'occlusion',
    ] as const) {
      expect((await loadTexture(png, { usage })).colorSpace).toBe(THREE.NoColorSpace);
    }
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

  it('requires one explicit packed G/B metallic-roughness texture', async () => {
    const png = await makeSolidPng({ r: 0, g: 180, b: 80 });
    const packed = await loadTexture(png, { usage: 'metallicRoughness' });
    const mat = pbrMaterial({ metallicRoughness: packed });
    expect(mat.roughnessMap).toBe(packed);
    expect(mat.metalnessMap).toBe(packed);

    const roughness = await loadTexture(png, { usage: 'roughness' });
    const metalness = await loadTexture(png, { usage: 'metalness' });
    expect(() => pbrMaterial({ roughness, metalness })).toThrow(/Pack G=roughness\/B=metalness/);
    expect(() => pbrMaterial({ roughness })).toThrow(/same packed G\/B texture/);
    expect(() => pbrMaterial({ metallicRoughness: roughness })).toThrow(
      /loaded for roughness, not metallicRoughness/,
    );
  });

  it('rejects invalid portable alpha and sidedness combinations at construction', () => {
    expect(() => pbrMaterial({ alphaMode: 'invalid' as never })).toThrow(/alphaMode must be/);
    expect(() => pbrMaterial({ alphaMode: 'opaque', alphaCutoff: 0.5 })).toThrow(
      /only when alphaMode is "mask"/,
    );
    expect(() => pbrMaterial({ alphaMode: 'mask', alphaCutoff: Number.NaN })).toThrow(
      /finite number in \[0,1\]/,
    );
    expect(() => pbrMaterial({ doubleSided: 'yes' as never })).toThrow(
      /doubleSided must be a boolean/,
    );
  });

  it('reports stable blockers for decode, dimensions, UVs, and color-space errors', async () => {
    const png = await makeSolidPng({ r: 80, g: 120, b: 160 });
    const intent = createAssetIntentV1({ category: 'prop' });
    const findingsFor = (root: THREE.Object3D) => inspectSceneMaterials({ intent, scene: root });
    const findingCodes = (root: THREE.Object3D): string[] =>
      findingsFor(root).map((finding) => finding.code);

    const undecodable = new THREE.DataTexture(
      new Uint8Array([255, 255, 255, 255]),
      1,
      1,
      THREE.RGBAFormat,
    );
    undecodable.name = 'raw-data';
    const decodeMaterial = pbrMaterial({ albedo: undecodable });
    decodeMaterial.name = 'DecodeMaterial';
    const decodeMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), decodeMaterial);
    decodeMesh.name = 'Mesh_Decode';
    const decodeRoot = createRoot('DecodeFailure');
    decodeRoot.add(decodeMesh);
    const decodeFinding = findingsFor(decodeRoot).find(
      (finding) => finding.code === 'MAT_TEXTURE_DECODE_FAILED',
    );
    expect(decodeFinding?.affected).toEqual({
      node: 'Mesh_Decode',
      material: 'DecodeMaterial',
      texture: 'raw-data',
      attribute: 'map',
    });

    const invalidDimensions = await loadTexture(png, { usage: 'albedo' });
    (invalidDimensions.image as { width: number }).width = 0;
    const dimensionsRoot = createRoot('InvalidDimensions');
    dimensionsRoot.add(
      new THREE.Mesh(new THREE.PlaneGeometry(1, 1), pbrMaterial({ albedo: invalidDimensions })),
    );
    expect(findingCodes(dimensionsRoot)).toContain('MAT_TEXTURE_INVALID_DIMENSIONS');

    const withoutUvs = await loadTexture(png, { usage: 'albedo' });
    withoutUvs.name = 'missing-uv-albedo';
    const noUvGeometry = new THREE.PlaneGeometry(1, 1);
    noUvGeometry.deleteAttribute('uv');
    const noUvMaterial = pbrMaterial({ albedo: withoutUvs });
    noUvMaterial.name = 'MissingUvMaterial';
    const noUvMesh = new THREE.Mesh(noUvGeometry, noUvMaterial);
    noUvMesh.name = 'Mesh_MissingUv';
    const uvRoot = createRoot('MissingUvs');
    uvRoot.add(noUvMesh);
    const uvFinding = findingsFor(uvRoot).find(
      (finding) => finding.code === 'MAT_TEXTURE_UV_MISSING',
    );
    expect(uvFinding?.affected).toEqual({
      node: 'Mesh_MissingUv',
      material: 'MissingUvMaterial',
      texture: 'missing-uv-albedo',
      attribute: 'map',
    });

    const wrongColorSpace = await loadTexture(png, { usage: 'albedo' });
    const wrongColorMaterial = pbrMaterial({ albedo: wrongColorSpace });
    wrongColorSpace.colorSpace = THREE.NoColorSpace;
    const colorRoot = createRoot('WrongColorSpace');
    colorRoot.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), wrongColorMaterial));
    expect(findingCodes(colorRoot)).toContain('MAT_TEXTURE_COLOR_SPACE');
  });

  it('localizes non-finite factors and missing tangent-space data', async () => {
    const intent = createAssetIntentV1({ category: 'prop' });
    const png = await makePatternPng({ r: 128, g: 128, b: 255 });
    const normal = await loadTexture(png, { usage: 'normal', name: 'normal-detail' });
    const material = pbrMaterial({ normal });
    material.name = 'DamagedPbr';
    material.roughness = Number.NaN;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    mesh.name = 'Mesh_Panel';
    const root = createRoot('MaterialDiagnostics');
    root.add(mesh);

    const findings = inspectSceneMaterials({ intent, scene: root });
    const factor = findings.find((finding) => finding.code === 'MAT_NONFINITE_FACTOR');
    expect(factor?.affected?.material).toBe('DamagedPbr');
    expect(factor?.measurement?.name).toBe('roughness');
    const tangents = findings.find((finding) => finding.code === 'MAT_NORMAL_TANGENTS_MISSING');
    expect(tangents?.affected).toEqual({
      node: 'Mesh_Panel',
      material: 'DamagedPbr',
      texture: 'normal-detail',
      attribute: 'normal',
    });
    expect(tangents?.disposition).toBe('warn');

    const strictFindings = inspectSceneMaterials({
      intent: createAssetIntentV1({
        category: 'prop',
        capabilities: ['precomputedTangents'],
      }),
      scene: root,
    });
    expect(
      strictFindings.find((finding) => finding.code === 'MAT_NORMAL_TANGENTS_MISSING')?.disposition,
    ).toBe('block');
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

  it('foliage cards export MASK cutoff + double-sided and remain valid after rebake', async () => {
    const png = await makeSolidPng({ r: 30, g: 180, b: 60 }, 0.4);
    const albedo = await loadTexture(png, { usage: 'albedo', name: 'leaf-albedo' });
    const root = createRoot('Foliage');
    const card = new THREE.Mesh(
      foliageCardGeo({ width: 2, height: 3 }),
      foliageMaterial(albedo, { alphaCutoff: 0.42 }),
    );
    card.name = 'Mesh_Leaves';
    root.add(card);

    const sceneQa = inspectSceneMaterials({
      intent: createAssetIntentV1({ category: 'vegetation' }),
      scene: root,
    });
    expect(sceneQa).toEqual([]);

    const rendered = await renderSceneToGLB(root);
    expect(rendered.gltfValidation.issues.numErrors).toBe(0);
    const doc = await new NodeIO().readBinary(rendered.bytes);
    const mat = doc.getRoot().listMaterials()[0]!;
    expect(mat.getAlphaMode()).toBe('MASK');
    expect(mat.getAlphaCutoff()).toBeCloseTo(0.42);
    expect(mat.getDoubleSided()).toBe(true);

    const rebaked = await optimizeGlbBytes(rendered.bytes, { mode: 'palette' });
    expect(rebaked?.gltfValidation.issues.numErrors).toBe(0);
    const rebakedDoc = await new NodeIO().readBinary(rebaked!.bytes);
    const rebakedMat = rebakedDoc.getRoot().listMaterials()[0]!;
    expect(rebakedMat.getAlphaMode()).toBe('MASK');
    expect(rebakedMat.getAlphaCutoff()).toBeCloseTo(0.42);
    expect(rebakedMat.getDoubleSided()).toBe(true);
  });

  it('preserves UVs, tangents, PBR factors, and texture slots through a validated rebake', async () => {
    const albedo = await loadTexture(await makePatternPng({ r: 180, g: 120, b: 80 }), {
      usage: 'albedo',
    });
    const normal = await loadTexture(await makePatternPng({ r: 128, g: 128, b: 255 }), {
      usage: 'normal',
    });
    const metallicRoughness = await loadTexture(await makePatternPng({ r: 0, g: 180, b: 80 }), {
      usage: 'metallicRoughness',
    });
    const geometry = new THREE.PlaneGeometry(1, 1);
    const tangentValues = new Float32Array(geometry.getAttribute('position').count * 4);
    for (let offset = 0; offset < tangentValues.length; offset += 4) {
      tangentValues.set([1, 0, 0, 1], offset);
    }
    geometry.setAttribute('tangent', new THREE.BufferAttribute(tangentValues, 4));

    const root = createRoot('PortablePbr');
    root.add(
      new THREE.Mesh(
        geometry,
        pbrMaterial({
          albedo,
          normal,
          metallicRoughness,
          roughness: 0.37,
          metalness: 0.62,
        }),
      ),
    );

    const rendered = await renderSceneToGLB(root);
    expect(rendered.gltfValidation.issues.numErrors).toBe(0);
    const renderedDoc = await new NodeIO().readBinary(rendered.bytes);
    const renderedMaterial = renderedDoc.getRoot().listMaterials()[0]!;
    expect(renderedMaterial.getBaseColorTexture()).not.toBeNull();
    expect(renderedMaterial.getNormalTexture()).not.toBeNull();
    expect(renderedMaterial.getMetallicRoughnessTexture()).not.toBeNull();
    const rebaked = await optimizeGlbBytes(rendered.bytes, { mode: 'palette' });
    expect(rebaked).toBeDefined();
    expect(rebaked!.gltfValidation.issues.numErrors).toBe(0);

    const doc = await new NodeIO().readBinary(rebaked!.bytes);
    const material = doc.getRoot().listMaterials()[0]!;
    expect(material.getBaseColorTexture()).not.toBeNull();
    expect(material.getNormalTexture()).not.toBeNull();
    expect(material.getMetallicRoughnessTexture()).not.toBeNull();
    expect(material.getRoughnessFactor()).toBeCloseTo(0.37);
    expect(material.getMetallicFactor()).toBeCloseTo(0.62);
    const primitive = doc.getRoot().listMeshes()[0]!.listPrimitives()[0]!;
    expect(primitive.getAttribute('TEXCOORD_0')).not.toBeNull();
    expect(primitive.getAttribute('TANGENT')).not.toBeNull();
  });

  it('preserves slot semantics when different usages have byte-identical source images', async () => {
    const sharedBytes = await makeSolidPng({ r: 22, g: 33, b: 44 });
    const albedo = await loadTexture(sharedBytes, { usage: 'albedo' });
    const normal = await loadTexture(sharedBytes, { usage: 'normal' });
    const metallicRoughness = await loadTexture(sharedBytes, {
      usage: 'metallicRoughness',
    });
    const geometry = new THREE.PlaneGeometry(1, 1);
    const tangentValues = new Float32Array(geometry.getAttribute('position').count * 4);
    for (let offset = 0; offset < tangentValues.length; offset += 4) {
      tangentValues.set([1, 0, 0, 1], offset);
    }
    geometry.setAttribute('tangent', new THREE.BufferAttribute(tangentValues, 4));

    const root = createRoot('IdenticalTextureBytes');
    root.add(
      new THREE.Mesh(
        geometry,
        pbrMaterial({ albedo, normal, metallicRoughness, roughness: 0.4, metalness: 0.6 }),
      ),
    );

    const rendered = await renderSceneToGLB(root);
    const rebaked = await optimizeGlbBytes(rendered.bytes, { mode: 'palette' });
    expect(rendered.gltfValidation.issues.numErrors).toBe(0);
    expect(rebaked?.gltfValidation.issues.numErrors).toBe(0);

    for (const bytes of [rendered.bytes, rebaked!.bytes]) {
      const doc = await new NodeIO().readBinary(bytes);
      const material = doc.getRoot().listMaterials()[0]!;
      expect(material.getBaseColorTexture()).not.toBeNull();
      expect(material.getNormalTexture()).not.toBeNull();
      expect(material.getMetallicRoughnessTexture()).not.toBeNull();
      expect(material.getRoughnessFactor()).toBeCloseTo(0.4);
      expect(material.getMetallicFactor()).toBeCloseTo(0.6);
    }
  });

  it('rejects an opaque foliage card with a stable structured finding', () => {
    const root = createRoot('BadFoliage');
    const card = new THREE.Mesh(foliageCardGeo(), gameMaterial(0x228833));
    card.name = 'Mesh_BadLeaves';
    root.add(card);
    const findings = inspectSceneMaterials({
      intent: createAssetIntentV1({ category: 'vegetation' }),
      scene: root,
    });
    expect(findings.map((finding) => finding.code)).toContain('MAT_FOLIAGE_CARD_CONTRACT');
  });

  it('Khronos validator reports malformed final bytes as errors', async () => {
    const report = await validateFinalGlbBytes(new Uint8Array([0x67, 0x6c, 0x54, 0x46]));
    expect(report.issues.numErrors).toBeGreaterThan(0);
  });
});
