/** Execute a validated portable recipe with approved texture resources. */

import * as THREE from 'three';

import {
  createMaterialRecipeRequestV1,
  resolveMaterialRecipeV1,
  type MaterialRecipeId,
  type MaterialRecipeOverridesV1,
  type MaterialRecipeRequestV1,
  type MaterialTextureSlot,
  type PortablePbrRecipeV1,
} from './material-recipes';
import {
  type ApprovedTextureResourceCache,
  DEFAULT_APPROVED_TEXTURE_CACHE,
  type MaterialResourceProvenanceV1,
} from './material-resources';
import { pbrMaterial, type PbrMaterialOptions } from './textures';

export interface MaterialRecipeApplicationProvenanceV1 {
  schemaVersion: 1;
  recipeId: MaterialRecipeId;
  recipeVersion: 1;
  request: MaterialRecipeRequestV1;
  portableModel: 'pbrMetallicRoughness';
  resources: MaterialResourceProvenanceV1[];
}

export interface AppliedMaterialRecipeV1 {
  material: THREE.MeshStandardMaterial;
  resolved: PortablePbrRecipeV1;
  provenance: MaterialRecipeApplicationProvenanceV1;
}

export interface ApplyMaterialRecipeOptions {
  cache?: ApprovedTextureResourceCache;
  name?: string;
}

const lowerAlphaMode = (
  value: PortablePbrRecipeV1['alphaMode'],
): NonNullable<PbrMaterialOptions['alphaMode']> =>
  value === 'MASK' ? 'mask' : value === 'BLEND' ? 'blend' : 'opaque';

/**
 * One executable recipe path used by prompt helpers and manifest execution.
 * Every texture slot is resolved from the closed approved-ID registry.
 */
export async function applyMaterialRecipeV1(
  request: MaterialRecipeRequestV1,
  options: ApplyMaterialRecipeOptions = {},
): Promise<AppliedMaterialRecipeV1> {
  const resolved = resolveMaterialRecipeV1(request);
  const cache = options.cache ?? DEFAULT_APPROVED_TEXTURE_CACHE;
  const loaded = new Map<
    MaterialTextureSlot,
    Awaited<ReturnType<ApprovedTextureResourceCache['load']>>
  >();
  for (const [slot, id] of Object.entries(resolved.textureResources)) {
    if (id) loaded.set(slot as MaterialTextureSlot, await cache.load(id));
  }

  const materialOptions: PbrMaterialOptions = {
    roughness: resolved.roughnessFactor,
    metalness: resolved.metallicFactor,
    alphaMode: lowerAlphaMode(resolved.alphaMode),
    ...(resolved.alphaMode === 'MASK' ? { alphaCutoff: resolved.alphaCutoff ?? 0.5 } : {}),
    doubleSided: resolved.doubleSided,
    ...(loaded.get('baseColor') ? { albedo: loaded.get('baseColor')!.texture } : {}),
    ...(loaded.get('normal') ? { normal: loaded.get('normal')!.texture } : {}),
    ...(loaded.get('metallicRoughness')
      ? { metallicRoughness: loaded.get('metallicRoughness')!.texture }
      : {}),
    ...(loaded.get('emissive') ? { emissive: loaded.get('emissive')!.texture } : {}),
    ...(loaded.get('occlusion') ? { aoMap: loaded.get('occlusion')!.texture } : {}),
  };
  const material = pbrMaterial(materialOptions);
  material.name = options.name ?? request.id;
  material.color.setRGB(
    resolved.baseColorFactor[0],
    resolved.baseColorFactor[1],
    resolved.baseColorFactor[2],
    THREE.LinearSRGBColorSpace,
  );
  material.opacity = resolved.baseColorFactor[3];
  material.emissive.setRGB(
    resolved.emissiveFactor[0],
    resolved.emissiveFactor[1],
    resolved.emissiveFactor[2],
    THREE.LinearSRGBColorSpace,
  );

  const resources = [...loaded.values()]
    .map((entry) => entry.provenance)
    .sort((a, b) => `${a.resourceId}:${a.usage}`.localeCompare(`${b.resourceId}:${b.usage}`));
  const provenance: MaterialRecipeApplicationProvenanceV1 = {
    schemaVersion: 1,
    recipeId: request.id,
    recipeVersion: 1,
    request: {
      schemaVersion: 1,
      id: request.id,
      ...(request.overrides
        ? {
            overrides: {
              ...request.overrides,
              ...(request.overrides.textureResources
                ? { textureResources: { ...request.overrides.textureResources } }
                : {}),
            },
          }
        : {}),
    },
    portableModel: 'pbrMetallicRoughness',
    resources,
  };
  (material.userData as Record<string, unknown>)['kilnMaterialRecipe'] = provenance;
  return { material, resolved, provenance };
}

/** Concise sandbox helper: materialRecipe('kiln.material.wood.v1', overrides?). */
export async function materialRecipe(
  id: MaterialRecipeId,
  overrides?: MaterialRecipeOverridesV1,
  options: ApplyMaterialRecipeOptions = {},
): Promise<THREE.MeshStandardMaterial> {
  return (await applyMaterialRecipeV1(createMaterialRecipeRequestV1(id, overrides), options))
    .material;
}

export function readMaterialRecipeApplication(
  material: THREE.Material,
): MaterialRecipeApplicationProvenanceV1 | undefined {
  return (material.userData as Record<string, unknown>)['kilnMaterialRecipe'] as
    | MaterialRecipeApplicationProvenanceV1
    | undefined;
}

/** Scene-side hook for exact render/provenance persistence. */
export function collectMaterialRecipeApplications(
  root: THREE.Object3D,
): MaterialRecipeApplicationProvenanceV1[] {
  const applications = new Map<string, MaterialRecipeApplicationProvenanceV1>();
  root.traverse((node) => {
    const value = (node as THREE.Mesh).material;
    const materials = Array.isArray(value) ? value : value ? [value] : [];
    for (const material of materials) {
      const application = readMaterialRecipeApplication(material);
      if (!application) continue;
      const resourceKey = application.resources
        .map((resource) => `${resource.resourceId}:${resource.contentHash}`)
        .sort()
        .join(',');
      applications.set(
        `${application.recipeId}:${JSON.stringify(application.request)}:${resourceKey}`,
        application,
      );
    }
  });
  return [...applications.values()].sort((a, b) => a.recipeId.localeCompare(b.recipeId));
}
