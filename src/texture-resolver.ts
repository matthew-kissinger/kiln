/**
 * Closed texture/material dependency injected into generated-code evaluation.
 *
 * The trusted host may construct this object around a bounded resource cache.
 * Generated source never receives the object: primitives.ts exposes only two
 * argument-count-checked closures, so source cannot provide caches, paths,
 * URLs, bytes, hashes, deadlines, resolvers, or filesystem handles.
 */
import type * as THREE from 'three';

import {
  type ApprovedTextureResourceCache,
  DEFAULT_APPROVED_TEXTURE_CACHE,
} from './material-resources';
import { materialRecipe as applyTrustedMaterialRecipe } from './material-recipe-runtime';
import type {
  MaterialRecipeId,
  MaterialRecipeOverridesV1,
  ApprovedTextureResourceId,
} from './material-recipes';

export interface TextureResolver {
  loadApprovedTexture(resourceId: unknown): Promise<THREE.DataTexture>;
  materialRecipe(id: unknown, overrides?: unknown): Promise<THREE.MeshStandardMaterial>;
}

export function createTextureResolver(
  cache: ApprovedTextureResourceCache = DEFAULT_APPROVED_TEXTURE_CACHE,
): TextureResolver {
  return Object.freeze({
    async loadApprovedTexture(resourceId: unknown): Promise<THREE.DataTexture> {
      if (typeof resourceId !== 'string') {
        throw new RangeError('Unsupported approved texture resource ID.');
      }
      return (await cache.load(resourceId as ApprovedTextureResourceId)).texture;
    },
    async materialRecipe(id: unknown, overrides?: unknown): Promise<THREE.MeshStandardMaterial> {
      if (typeof id !== 'string') throw new TypeError('materialRecipe id must be a string');
      return applyTrustedMaterialRecipe(
        id as MaterialRecipeId,
        overrides as MaterialRecipeOverridesV1 | undefined,
        { cache },
      );
    },
  });
}

export const DEFAULT_TEXTURE_RESOLVER: TextureResolver = createTextureResolver();
