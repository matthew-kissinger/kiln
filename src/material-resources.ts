/** Approved, ID-only texture resources and content-addressed runtime cache. */

import { createHash } from 'node:crypto';
import type * as THREE from 'three';

import {
  APPROVED_TEXTURE_RESOURCE_IDS,
  APPROVED_TEXTURE_RESOURCES_V1,
  type ApprovedTextureResourceId,
} from './material-recipes';
import {
  loadTexture,
  type KilnTextureMetadata,
  type TextureLoadOptions,
  type TextureSource,
  type TextureUsage,
} from './textures';

export interface MaterialResourceProvenanceV1 {
  schemaVersion: 1;
  resourceId: ApprovedTextureResourceId;
  contentHash: string;
  hashAlgorithm: 'sha256';
  usage: TextureUsage;
  colorSpace: 'srgb' | 'linear';
  resourceVersion: 1;
  recipeVersion: 1;
}

export interface ApprovedTextureResolutionV1 {
  descriptor: (typeof APPROVED_TEXTURE_RESOURCES_V1)[ApprovedTextureResourceId];
  /** Caller-owned copy; the cache retains one canonical content-addressed byte array. */
  bytes: Uint8Array;
  provenance: MaterialResourceProvenanceV1;
}

export interface LoadedApprovedTextureV1 extends ApprovedTextureResolutionV1 {
  texture: THREE.DataTexture;
}

export interface MaterialResourceCacheStatsV1 {
  approvedIdsResolved: number;
  uniqueContentHashes: number;
  decodedTextureVariants: number;
  encodedBytes: number;
}

const EMBEDDED_RESOURCE_BASE64: Readonly<Record<ApprovedTextureResourceId, string>> = Object.freeze(
  {
    'kiln.texture.bark-albedo.v1':
      'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAFklEQVQImWMIMpT6X+Ch9h9GM5AuAACfBRvJB4zLLQAAAABJRU5ErkJggg==',
    'kiln.texture.leaf-mask-albedo.v1':
      'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAKUlEQVQImWMwaLFiMGixSjBosdoCYsM4/6E4ASQAkoEJbAEJwARBKhkACRMXLR+u+yUAAAAASUVORK5CYII=',
    'kiln.texture.neutral-normal.v1':
      'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVQImWNoaPj/H4QZYAwAZ9IL+W19YCAAAAAASUVORK5CYII=',
    'kiln.texture.neutral-metallic-roughness.v1':
      'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEElEQVQImWNguCT0H4xhDAA/hAeNGSjqWAAAAABJRU5ErkJggg==',
    'kiln.texture.emissive-grid.v1':
      'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAFklEQVQImWP4P0Hhv4MEy38GEAHiAABG+wgTqOP6IAAAAABJRU5ErkJggg==',
  },
);

const isApprovedId = (value: string): value is ApprovedTextureResourceId =>
  (APPROVED_TEXTURE_RESOURCE_IDS as readonly string[]).includes(value);

const bytesFromBase64 = (value: string): Uint8Array => new Uint8Array(Buffer.from(value, 'base64'));
const sha256 = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex');

function usageForResource(id: ApprovedTextureResourceId): TextureUsage {
  return APPROVED_TEXTURE_RESOURCES_V1[id].usage;
}

function provenance(id: ApprovedTextureResourceId, hash: string): MaterialResourceProvenanceV1 {
  const descriptor = APPROVED_TEXTURE_RESOURCES_V1[id];
  return {
    schemaVersion: 1,
    resourceId: id,
    contentHash: hash,
    hashAlgorithm: 'sha256',
    usage: usageForResource(id),
    colorSpace: descriptor.colorSpace,
    resourceVersion: descriptor.version,
    recipeVersion: 1,
  };
}

/**
 * The only path used by new generations/refines. Inputs are closed approved
 * IDs, and the returned DTO contains no filesystem location, URL, credential,
 * or provider-specific identifier.
 */
export class ApprovedTextureResourceCache {
  readonly #bytesByHash = new Map<string, Uint8Array>();
  readonly #hashById = new Map<ApprovedTextureResourceId, string>();
  readonly #textureByVariant = new Map<string, Promise<THREE.DataTexture>>();

  resolve(id: ApprovedTextureResourceId): ApprovedTextureResolutionV1 {
    if (!isApprovedId(id)) throw new RangeError(`Unsupported approved texture resource ID ${id}.`);
    let hash = this.#hashById.get(id);
    let canonical: Uint8Array | undefined;
    if (!hash) {
      const decoded = bytesFromBase64(EMBEDDED_RESOURCE_BASE64[id]);
      hash = sha256(decoded);
      if (hash !== APPROVED_TEXTURE_RESOURCES_V1[id].contentHash) {
        throw new Error(`Approved resource ${id} failed its pinned content hash.`);
      }
      canonical = this.#bytesByHash.get(hash);
      if (!canonical) {
        canonical = decoded;
        this.#bytesByHash.set(hash, canonical);
      }
      this.#hashById.set(id, hash);
    } else {
      canonical = this.#bytesByHash.get(hash);
    }
    if (!canonical) throw new Error(`Approved resource cache lost content ${hash}.`);
    return {
      descriptor: APPROVED_TEXTURE_RESOURCES_V1[id],
      bytes: canonical.slice(),
      provenance: provenance(id, hash),
    };
  }

  async load(id: ApprovedTextureResourceId): Promise<LoadedApprovedTextureV1> {
    const resolved = this.resolve(id);
    const variantKey = [
      resolved.provenance.contentHash,
      resolved.provenance.usage,
      resolved.provenance.colorSpace,
    ].join(':');
    let pending = this.#textureByVariant.get(variantKey);
    if (!pending) {
      pending = loadTexture(resolved.bytes, {
        usage: resolved.provenance.usage,
        name: id,
      }).then((texture) => {
        const metadata = (texture.userData as Record<string, unknown>)['kilnTexture'] as
          | KilnTextureMetadata
          | undefined;
        (texture.userData as Record<string, unknown>)['kilnTexture'] = {
          ...metadata,
          approvedResource: resolved.provenance,
        };
        return texture;
      });
      this.#textureByVariant.set(variantKey, pending);
    }
    return { ...resolved, texture: await pending };
  }

  stats(): MaterialResourceCacheStatsV1 {
    return {
      approvedIdsResolved: this.#hashById.size,
      uniqueContentHashes: this.#bytesByHash.size,
      decodedTextureVariants: this.#textureByVariant.size,
      encodedBytes: [...this.#bytesByHash.values()].reduce(
        (sum, bytes) => sum + bytes.byteLength,
        0,
      ),
    };
  }
}

export const DEFAULT_APPROVED_TEXTURE_CACHE = new ApprovedTextureResourceCache();

export function resolveApprovedTextureResource(
  id: ApprovedTextureResourceId,
): ApprovedTextureResolutionV1 {
  return DEFAULT_APPROVED_TEXTURE_CACHE.resolve(id);
}

export async function loadApprovedTextureResource(
  id: ApprovedTextureResourceId,
): Promise<LoadedApprovedTextureV1> {
  return DEFAULT_APPROVED_TEXTURE_CACHE.load(id);
}

/**
 * Compatibility-only reader for historical source programs. New manifests and
 * prompts must use loadApprovedTextureResource() so an untrusted model cannot
 * select a host path. This function deliberately does not claim approved
 * provenance.
 */
export async function loadLegacyTextureSource(
  source: TextureSource,
  options: TextureLoadOptions = {},
): Promise<THREE.DataTexture> {
  const texture = await loadTexture(source, options);
  (texture.userData as Record<string, unknown>)['kilnTextureSource'] = {
    schemaVersion: 1,
    source: 'legacy-compatible-read',
  };
  return texture;
}

export function readMaterialResourceProvenance(
  texture: THREE.Texture,
): MaterialResourceProvenanceV1 | undefined {
  const metadata = (texture.userData as Record<string, unknown>)['kilnTexture'] as
    | { approvedResource?: MaterialResourceProvenanceV1 }
    | undefined;
  return metadata?.approvedResource;
}

const materialTextures = (material: THREE.Material): THREE.Texture[] => {
  const standard = material as THREE.MeshStandardMaterial;
  const candidates = [
    standard.map,
    standard.normalMap,
    standard.roughnessMap,
    standard.metalnessMap,
    standard.emissiveMap,
    standard.aoMap,
  ];
  return [
    ...new Set(candidates.filter((value): value is THREE.Texture => value?.isTexture === true)),
  ];
};

/** Deterministic scene-side provenance hook for render/wire/provenance integration. */
export function collectMaterialResourceProvenance(
  root: THREE.Object3D,
): MaterialResourceProvenanceV1[] {
  const records = new Map<string, MaterialResourceProvenanceV1>();
  root.traverse((node) => {
    const material = (node as THREE.Mesh).material;
    const materials = Array.isArray(material) ? material : material ? [material] : [];
    for (const item of materials) {
      for (const texture of materialTextures(item)) {
        const record = readMaterialResourceProvenance(texture);
        if (record)
          records.set(`${record.resourceId}:${record.contentHash}:${record.usage}`, record);
      }
    }
  });
  return [...records.values()].sort((a, b) =>
    `${a.resourceId}:${a.usage}`.localeCompare(`${b.resourceId}:${b.usage}`),
  );
}
