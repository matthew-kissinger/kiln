/** Approved, ID-only texture resources and content-addressed runtime cache. */

import { createHash } from 'node:crypto';
import type * as THREE from 'three';

import {
  APPROVED_TEXTURE_RESOURCE_IDS,
  APPROVED_TEXTURE_RESOURCES_V1,
  type ApprovedTextureResourceDescriptorV1,
  type ApprovedTextureResourceId,
  type TextureResourceDelivery,
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
  /** Recorded so a persisted asset states whether its pixels came from the
   *  package or from the host registry. Both are hash-verified; they differ in
   *  who has to be reachable for the asset to be reproducible. */
  delivery: TextureResourceDelivery;
}

/**
 * Host-supplied byte source for `delivery: 'runtime'` resources.
 *
 * It receives the descriptor and nothing else. The engine holds no URL, bucket,
 * path, or credential, and cannot be steered to one by a model — a resolver is
 * registered by the host process, and every ID it can be asked for is a member
 * of the closed approved list. Returned bytes are checked against the pinned
 * length and hash before anything decodes them, so a resolver that is wrong,
 * stale, or compromised fails loudly instead of substituting pixels.
 */
export type ApprovedTextureResolver = (
  descriptor: ApprovedTextureResourceDescriptorV1,
) => Promise<Uint8Array>;

export interface ApprovedTextureResourceCacheOptions {
  resolver?: ApprovedTextureResolver;
  /**
   * Descriptor table this cache reads. Defaults to the shipped registry.
   *
   * It cannot widen the approved set: the key type is the closed ID union, so an
   * override can only restate a resource that is already approved — typically to
   * exercise the runtime delivery path, or to pin a different resource version.
   * The module-level helpers always use the shipped table.
   */
  registry?: Readonly<Record<ApprovedTextureResourceId, ApprovedTextureResourceDescriptorV1>>;
}

export class ApprovedTextureResourceUnavailableError extends Error {
  readonly resourceId: ApprovedTextureResourceId;

  constructor(id: ApprovedTextureResourceId, reason: string) {
    super(`Approved texture resource ${id} is unavailable: ${reason}`);
    this.name = 'ApprovedTextureResourceUnavailableError';
    this.resourceId = id;
  }
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

function provenance(
  descriptor: ApprovedTextureResourceDescriptorV1,
  hash: string,
): MaterialResourceProvenanceV1 {
  return {
    schemaVersion: 1,
    resourceId: descriptor.id,
    contentHash: hash,
    hashAlgorithm: 'sha256',
    usage: descriptor.usage,
    colorSpace: descriptor.colorSpace,
    resourceVersion: descriptor.version,
    recipeVersion: 1,
    delivery: descriptor.delivery,
  };
}

/**
 * The single gate every byte passes, whichever delivery produced it.
 *
 * Length first: a truncated body, an S3 error document, or the wrong object all
 * fail here with a number a human can act on, rather than as an opaque hash
 * mismatch that reads like corruption.
 */
function verifyResourceBytes(
  descriptor: ApprovedTextureResourceDescriptorV1,
  bytes: Uint8Array,
): string {
  if (bytes.byteLength !== descriptor.byteLength) {
    throw new ApprovedTextureResourceUnavailableError(
      descriptor.id,
      `expected ${descriptor.byteLength} bytes, received ${bytes.byteLength}`,
    );
  }
  const hash = sha256(bytes);
  if (hash !== descriptor.contentHash) {
    throw new ApprovedTextureResourceUnavailableError(
      descriptor.id,
      `content hash ${hash} does not match the pinned ${descriptor.contentHash}`,
    );
  }
  return hash;
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
  readonly #pendingById = new Map<
    ApprovedTextureResourceId,
    Promise<ApprovedTextureResolutionV1>
  >();
  readonly #registry: Readonly<
    Record<ApprovedTextureResourceId, ApprovedTextureResourceDescriptorV1>
  >;
  #resolver: ApprovedTextureResolver | undefined;

  constructor(options: ApprovedTextureResourceCacheOptions = {}) {
    this.#resolver = options.resolver;
    this.#registry = options.registry ?? APPROVED_TEXTURE_RESOURCES_V1;
  }

  /**
   * Registered once by the host process at startup, never by generated code.
   * Returns the previous resolver so a test can restore it.
   */
  setResolver(resolver: ApprovedTextureResolver | undefined): ApprovedTextureResolver | undefined {
    const previous = this.#resolver;
    this.#resolver = resolver;
    return previous;
  }

  /**
   * Whether this environment can actually produce the bytes. Embedded resources
   * are always available; runtime ones need a registered resolver. Callers use
   * this to decide what to offer a model, so it never promises what it cannot
   * deliver.
   */
  /** The descriptor this cache reads, which an override may have replaced. */
  descriptor(id: ApprovedTextureResourceId): ApprovedTextureResourceDescriptorV1 {
    if (!isApprovedId(id)) throw new RangeError(`Unsupported approved texture resource ID ${id}.`);
    return this.#registry[id];
  }

  available(id: ApprovedTextureResourceId): boolean {
    if (!isApprovedId(id)) return false;
    return this.#registry[id].delivery === 'embedded' || this.#resolver !== undefined;
  }

  #cacheBytes(id: ApprovedTextureResourceId, hash: string, bytes: Uint8Array): Uint8Array {
    let canonical = this.#bytesByHash.get(hash);
    if (!canonical) {
      canonical = bytes;
      this.#bytesByHash.set(hash, canonical);
    }
    this.#hashById.set(id, hash);
    return canonical;
  }

  #resolution(id: ApprovedTextureResourceId, hash: string): ApprovedTextureResolutionV1 {
    const canonical = this.#bytesByHash.get(hash);
    if (!canonical) throw new Error(`Approved resource cache lost content ${hash}.`);
    return {
      descriptor: this.#registry[id],
      bytes: canonical.slice(),
      provenance: provenance(this.#registry[id], hash),
    };
  }

  /**
   * Synchronous resolution. Only ever succeeds for embedded bytes — a runtime
   * resource cannot be produced without awaiting a host call, and quietly
   * returning something else is the failure mode this whole registry exists to
   * prevent.
   */
  resolve(id: ApprovedTextureResourceId): ApprovedTextureResolutionV1 {
    if (!isApprovedId(id)) throw new RangeError(`Unsupported approved texture resource ID ${id}.`);
    const hash = this.#hashById.get(id);
    if (hash) return this.#resolution(id, hash);

    const descriptor = this.#registry[id];
    if (descriptor.delivery !== 'embedded') {
      throw new ApprovedTextureResourceUnavailableError(
        id,
        'it is delivered at runtime; use resolveAsync() or load()',
      );
    }
    const decoded = bytesFromBase64(EMBEDDED_RESOURCE_BASE64[id]);
    this.#cacheBytes(id, verifyResourceBytes(descriptor, decoded), decoded);
    return this.#resolution(id, this.#hashById.get(id)!);
  }

  /**
   * Resolution for either delivery. Concurrent callers share one fetch: the
   * generation path asks for the same resource from several materials at once,
   * and each duplicate would otherwise be a separate network round trip.
   */
  async resolveAsync(id: ApprovedTextureResourceId): Promise<ApprovedTextureResolutionV1> {
    if (!isApprovedId(id)) throw new RangeError(`Unsupported approved texture resource ID ${id}.`);
    const hash = this.#hashById.get(id);
    if (hash) return this.#resolution(id, hash);
    if (this.#registry[id].delivery === 'embedded') return this.resolve(id);

    let pending = this.#pendingById.get(id);
    if (!pending) {
      const descriptor = this.#registry[id];
      const resolver = this.#resolver;
      pending = (async () => {
        if (!resolver) {
          throw new ApprovedTextureResourceUnavailableError(
            id,
            'no runtime texture resolver is registered in this environment',
          );
        }
        const bytes = await resolver(descriptor);
        this.#cacheBytes(id, verifyResourceBytes(descriptor, bytes), bytes);
        return this.#resolution(id, this.#hashById.get(id)!);
      })().finally(() => {
        // Dropped either way: a success is served from #hashById afterwards, and
        // a failure must be retryable rather than cached forever.
        this.#pendingById.delete(id);
      });
      this.#pendingById.set(id, pending);
    }
    return pending;
  }

  async load(id: ApprovedTextureResourceId): Promise<LoadedApprovedTextureV1> {
    const resolved = await this.resolveAsync(id);
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

/** Registers the host's byte source for runtime-delivered resources. */
export function setApprovedTextureResolver(
  resolver: ApprovedTextureResolver | undefined,
): ApprovedTextureResolver | undefined {
  return DEFAULT_APPROVED_TEXTURE_CACHE.setResolver(resolver);
}

export interface ApprovedTextureCatalogEntryV1 {
  id: ApprovedTextureResourceId;
  label: string;
  usage: TextureUsage;
  delivery: TextureResourceDelivery;
  allowedSlots: readonly string[];
  recipeIds: readonly string[];
}

export interface ApprovedTextureCatalogOptions {
  cache?: ApprovedTextureResourceCache;
  /** Placeholder swatches are excluded by default; they exist to prove a slot
   *  binds, and offering one to a model competes with `proceduralTexture()`
   *  while looking worse than it. */
  includePlaceholders?: boolean;
}

/**
 * What this environment can actually bind, in the order the IDs are declared.
 *
 * The material prompt has always told models that texture slots accept "approved
 * kiln.texture.* resource IDs reported by capabilities" while no surface reported
 * any, so a model could only guess an ID and be rejected. This is that surface,
 * and it is filtered by real availability so it cannot advertise a resource whose
 * bytes no resolver can produce.
 */
export function approvedTextureCatalogV1(
  options: ApprovedTextureCatalogOptions = {},
): ApprovedTextureCatalogEntryV1[] {
  const cache = options.cache ?? DEFAULT_APPROVED_TEXTURE_CACHE;
  return APPROVED_TEXTURE_RESOURCE_IDS.filter((id) => {
    const descriptor = cache.descriptor(id);
    if (descriptor.quality === 'placeholder' && options.includePlaceholders !== true) return false;
    return cache.available(id);
  }).map((id) => {
    const descriptor = cache.descriptor(id);
    return {
      id,
      label: descriptor.label,
      usage: descriptor.usage,
      delivery: descriptor.delivery,
      allowedSlots: descriptor.allowedSlots,
      recipeIds: descriptor.recipeIds,
    };
  });
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

/**
 * Does this scene contain anything a flat-shaded raster cannot honestly show?
 *
 * The question a caller actually wants answered is "is `gameMaterial` enough here,
 * or did the author reach for PBR", and that is NOT recoverable from the material
 * type: `gameMaterial` and `pbrMaterial` both construct a `MeshStandardMaterial`,
 * so after construction they are the same object shape. Two signals survive, and
 * this checks both:
 *
 *   1. A bound texture in any of the six slots. Same six {@link materialTextures}
 *      reads, and the same duck-typed `.isTexture` — the sandbox is a different
 *      module realm, so `instanceof THREE.Texture` is always false here.
 *   2. `metalness > 0`. `gameMaterial` defaults it to 0 and a flat-shaded raster
 *      is at its most wrong exactly on metal, so an untextured chrome or brass
 *      surface has to count even though no texture is bound. Roughness is NOT a
 *      signal: `gameMaterial` sets it by default, so it says nothing about intent.
 *
 * Deterministic and read-only: a pure traversal of already-executed scene state,
 * no clock, no randomness, safe to call from a render path.
 */
export function sceneNeedsPbrShading(root: THREE.Object3D): boolean {
  let needs = false;
  root.traverse((node) => {
    if (needs) return;
    const material = (node as THREE.Mesh).material;
    const materials = Array.isArray(material) ? material : material ? [material] : [];
    for (const item of materials) {
      if (materialTextures(item).length > 0) {
        needs = true;
        return;
      }
      const metalness = (item as THREE.MeshStandardMaterial).metalness;
      if (typeof metalness === 'number' && metalness > 0) {
        needs = true;
        return;
      }
    }
  });
  return needs;
}

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
