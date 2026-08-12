import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';

import { readMaterialResourceProvenance } from '../material-resources';
import { compilePortableMaterialSpecV2, ProceduralTextureError } from '../primitives';

const solid = (
  usage: 'albedo' | 'normal' | 'metallicRoughness' | 'emissive' | 'occlusion',
  color: number,
) => ({
  kind: 'procedural' as const,
  spec: {
    schemaVersion: 2 as const,
    size: 4,
    usage,
    layers: [{ op: 'solid' as const, color }],
  },
});

describe('PortableMaterialSpecV2 runtime compiler', () => {
  test('compiles only typed procedural slots with correct color spaces and packed MR identity', async () => {
    const material = await compilePortableMaterialSpecV2({
      schemaVersion: 2,
      model: 'pbrMetallicRoughness',
      name: 'PortableIron',
      baseColor: 0x806040,
      roughness: 0.62,
      metalness: 0.81,
      emissive: 0x201008,
      emissiveIntensity: 2,
      alphaMode: 'mask',
      alphaCutoff: 0.4,
      doubleSided: true,
      textures: {
        baseColor: solid('albedo', 0x8a6542),
        normal: solid('normal', 0x8080ff),
        metallicRoughness: solid('metallicRoughness', 0x00a0d0),
        emissive: solid('emissive', 0x402010),
        occlusion: solid('occlusion', 0xffffff),
      },
    });

    expect(material).toBeInstanceOf(THREE.MeshStandardMaterial);
    expect(material.name).toBe('PortableIron');
    expect(material.map?.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(material.emissiveMap?.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(material.normalMap?.colorSpace).toBe(THREE.NoColorSpace);
    expect(material.roughnessMap?.colorSpace).toBe(THREE.NoColorSpace);
    expect(material.aoMap?.colorSpace).toBe(THREE.NoColorSpace);
    expect(material.roughnessMap).toBe(material.metalnessMap);
    expect(material.roughness).toBe(0.62);
    expect(material.metalness).toBe(0.81);
    expect(material.alphaTest).toBe(0.4);
    expect(material.side).toBe(THREE.DoubleSide);
    expect((material.userData as Record<string, unknown>)['kilnPortableMaterial']).toMatchObject({
      schemaVersion: 2,
      model: 'pbrMetallicRoughness',
      name: 'PortableIron',
    });
  });

  test('loads a closed approved resource ID and preserves its verified provenance', async () => {
    const material = await compilePortableMaterialSpecV2({
      schemaVersion: 2,
      model: 'pbrMetallicRoughness',
      textures: {
        baseColor: { kind: 'resource', resourceId: 'kiln.texture.bark-albedo.v1' },
      },
    });

    expect(material.map?.name).toBe('kiln.texture.bark-albedo.v1');
    expect(material.map?.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(readMaterialResourceProvenance(material.map!)).toMatchObject({
      resourceId: 'kiln.texture.bark-albedo.v1',
      usage: 'albedo',
      hashAlgorithm: 'sha256',
    });
  });

  test('rejects unapproved IDs, wrong-slot resources, and executable or raw texture escapes', async () => {
    await expect(
      compilePortableMaterialSpecV2({
        schemaVersion: 2,
        model: 'pbrMetallicRoughness',
        textures: {
          baseColor: { kind: 'resource', resourceId: 'kiln.texture.not-approved.v1' },
        },
      }),
    ).rejects.toThrow(/not an approved texture resource/i);

    await expect(
      compilePortableMaterialSpecV2({
        schemaVersion: 2,
        model: 'pbrMetallicRoughness',
        textures: {
          baseColor: { kind: 'resource', resourceId: 'kiln.texture.neutral-normal.v1' },
        },
      }),
    ).rejects.toThrow(/baseColor.*not approved for that slot/i);

    const raw = new THREE.DataTexture(new Uint8Array(4 * 4 * 4), 4, 4);
    await expect(
      compilePortableMaterialSpecV2({
        schemaVersion: 2,
        model: 'pbrMetallicRoughness',
        textures: { baseColor: raw },
      }),
    ).rejects.toThrow(ProceduralTextureError);
    await expect(
      compilePortableMaterialSpecV2({
        schemaVersion: 2,
        model: 'pbrMetallicRoughness',
        textures: {
          baseColor: { kind: 'resource', resourceId: 'https://example.invalid/wood.png' },
        },
      }),
    ).rejects.toThrow(/bounded kiln.* resource ID/i);
    await expect(
      compilePortableMaterialSpecV2({
        schemaVersion: 2,
        model: 'pbrMetallicRoughness',
        shader: 'void main() {}',
      }),
    ).rejects.toThrow(/unknown key "shader"/i);
  });
});
