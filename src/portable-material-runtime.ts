/** Compile the strict portable material contract into bounded Three.js state. */

import type * as THREE from 'three';

import {
  APPROVED_TEXTURE_RESOURCE_IDS,
  type ApprovedTextureResourceId,
  type MaterialTextureSlot,
} from './material-recipes';
import { DEFAULT_APPROVED_TEXTURE_CACHE } from './material-resources';
import {
  type CanonicalPortableMaterialSpecV2,
  type CanonicalPortableTextureRefV2,
  ProceduralTextureError,
  canonicalizePortableMaterialSpecV2,
} from './procedural-material-v2';
import { proceduralTexture } from './procedural-texture';
import { pbrMaterial, type PbrMaterialOptions, type TextureUsage } from './textures';

const SLOT_USAGE = {
  baseColor: 'albedo',
  normal: 'normal',
  metallicRoughness: 'metallicRoughness',
  emissive: 'emissive',
  occlusion: 'occlusion',
} as const satisfies Record<MaterialTextureSlot, TextureUsage>;

type PortableSlot = keyof typeof SLOT_USAGE;

const isApprovedResourceId = (value: string): value is ApprovedTextureResourceId =>
  (APPROVED_TEXTURE_RESOURCE_IDS as readonly string[]).includes(value);

/**
 * Compile a JSON-shaped V2 material without exposing loaders, paths, URLs,
 * DataTextures, shader source, or a host resolver to authored code.
 *
 * The whole contract and every resource/slot binding are validated before the
 * first texture is compiled or loaded. A late invalid slot therefore cannot
 * cause partial allocations or host resource calls.
 */
export async function compilePortableMaterialSpecV2(
  input: unknown,
): Promise<THREE.MeshStandardMaterial> {
  const spec = canonicalizePortableMaterialSpecV2(input);
  // Deliberately not injectable at this boundary. The host can register a
  // resolver on the default closed-ID cache, but authored code cannot replace
  // the cache with an object that returns arbitrary textures.
  const cache = DEFAULT_APPROVED_TEXTURE_CACHE;
  const entries = Object.entries(spec.textures) as Array<
    [PortableSlot, CanonicalPortableTextureRefV2]
  >;

  for (const [slot, ref] of entries) {
    if (ref.kind !== 'resource') continue;
    if (!isApprovedResourceId(ref.resourceId)) {
      throw new ProceduralTextureError(
        `portableMaterial.textures.${slot} resource ${JSON.stringify(ref.resourceId)} is not an approved texture resource ID.`,
      );
    }
    const descriptor = cache.descriptor(ref.resourceId);
    if (!(descriptor.allowedSlots as readonly string[]).includes(slot)) {
      throw new ProceduralTextureError(
        `portableMaterial.textures.${slot} resource ${JSON.stringify(ref.resourceId)} is not approved for that slot.`,
      );
    }
    if (descriptor.usage !== SLOT_USAGE[slot]) {
      throw new ProceduralTextureError(
        `portableMaterial.textures.${slot} requires ${SLOT_USAGE[slot]} data, but ${JSON.stringify(ref.resourceId)} provides ${descriptor.usage}.`,
      );
    }
  }

  const loaded = new Map<PortableSlot, THREE.Texture>();
  await Promise.all(
    entries.map(async ([slot, ref]) => {
      const texture =
        ref.kind === 'procedural'
          ? proceduralTexture(ref.spec)
          : (await cache.load(ref.resourceId as ApprovedTextureResourceId)).texture;
      loaded.set(slot, texture);
    }),
  );

  const materialOptions: PbrMaterialOptions = {
    roughness: spec.roughness,
    metalness: spec.metalness,
    emissiveIntensity: spec.emissiveIntensity,
    alphaMode: spec.alphaMode,
    ...(spec.alphaMode === 'mask' ? { alphaCutoff: spec.alphaCutoff } : {}),
    doubleSided: spec.doubleSided,
    ...(loaded.get('baseColor')
      ? { albedo: loaded.get('baseColor') }
      : spec.baseColor !== undefined
        ? { albedo: spec.baseColor }
        : {}),
    ...(loaded.get('normal') ? { normal: loaded.get('normal') } : {}),
    ...(loaded.get('metallicRoughness')
      ? { metallicRoughness: loaded.get('metallicRoughness') }
      : {}),
    ...(loaded.get('emissive')
      ? { emissive: loaded.get('emissive') }
      : spec.emissive !== undefined
        ? { emissive: spec.emissive }
        : {}),
    ...(loaded.get('occlusion') ? { aoMap: loaded.get('occlusion') } : {}),
  };
  const material = pbrMaterial(materialOptions);
  if (spec.name) material.name = spec.name;
  if (loaded.has('baseColor') && spec.baseColor !== undefined)
    material.color.setHex(spec.baseColor);
  if (loaded.has('emissive') && spec.emissive !== undefined)
    material.emissive.setHex(spec.emissive);
  (material.userData as Record<string, unknown>)['kilnPortableMaterial'] =
    spec satisfies CanonicalPortableMaterialSpecV2;
  return material;
}
