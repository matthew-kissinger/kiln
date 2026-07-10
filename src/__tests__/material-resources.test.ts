import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';

import { applyMaterialRecipeV1 } from '../material-recipe-runtime';
import { createMaterialRecipeRequestV1 } from '../material-recipes';
import {
  ApprovedTextureResourceCache,
  collectMaterialResourceProvenance,
  loadLegacyTextureSource,
  readMaterialResourceProvenance,
} from '../material-resources';

describe('MAT-016 approved resource boundary', () => {
  test('resolves only a closed ID and exposes bytes without paths or secrets', () => {
    const cache = new ApprovedTextureResourceCache();
    const resolved = cache.resolve('kiln.texture.bark-albedo.v1');
    expect(resolved.bytes.subarray(0, 4)).toEqual(new Uint8Array([137, 80, 78, 71]));
    expect(resolved.provenance).toMatchObject({
      resourceId: 'kiln.texture.bark-albedo.v1',
      hashAlgorithm: 'sha256',
      usage: 'albedo',
      colorSpace: 'srgb',
      resourceVersion: 1,
      recipeVersion: 1,
    });
    expect(resolved.provenance.contentHash).toBe(
      'ec74fd42fe317f578018a13a65d81a726e9baeade068ae016cff30c15507017f',
    );
    expect(resolved.descriptor.contentHash).toBe(resolved.provenance.contentHash);
    expect(JSON.stringify(resolved.descriptor)).not.toMatch(
      /(?:path|file:|secret|token|[A-Z]:\\)/i,
    );
    expect(() => cache.resolve('kiln.texture.not-approved.v1' as never)).toThrow(/Unsupported/);
  });

  test('retains an explicit compatibility read for legacy byte/path programs', async () => {
    const cache = new ApprovedTextureResourceCache();
    const bytes = cache.resolve('kiln.texture.bark-albedo.v1').bytes;
    const legacy = await loadLegacyTextureSource(bytes, { usage: 'albedo', name: 'legacy-bark' });
    expect(legacy.name).toBe('legacy-bark');
    expect(legacy.userData['kilnTextureSource']).toEqual({
      schemaVersion: 1,
      source: 'legacy-compatible-read',
    });
    expect(readMaterialResourceProvenance(legacy)).toBeUndefined();
  });
});

describe('MAT-017 content cache and provenance', () => {
  test('deduplicates encoded content and decoded variants by content hash', async () => {
    const cache = new ApprovedTextureResourceCache();
    const first = await cache.load('kiln.texture.leaf-mask-albedo.v1');
    const second = await cache.load('kiln.texture.leaf-mask-albedo.v1');
    expect(second.texture).toBe(first.texture);
    expect(second.provenance).toEqual(first.provenance);
    expect(cache.stats()).toEqual({
      approvedIdsResolved: 1,
      uniqueContentHashes: 1,
      decodedTextureVariants: 1,
      encodedBytes: first.bytes.byteLength,
    });
  });

  test('recipe application records ID/hash/usage/color space/version and scene collection', async () => {
    const cache = new ApprovedTextureResourceCache();
    const applied = await applyMaterialRecipeV1(
      createMaterialRecipeRequestV1('kiln.material.leaf.v1', {
        textureResources: { baseColor: 'kiln.texture.leaf-mask-albedo.v1' },
      }),
      { cache, name: 'ApprovedLeaf' },
    );
    expect(applied.material.map).toBeDefined();
    expect(applied.material.alphaTest).toBe(0.5);
    expect(applied.material.transparent).toBe(false);
    expect(applied.provenance.resources).toHaveLength(1);
    expect(applied.provenance.resources[0]).toMatchObject({
      resourceId: 'kiln.texture.leaf-mask-albedo.v1',
      usage: 'albedo',
      colorSpace: 'srgb',
      resourceVersion: 1,
      recipeVersion: 1,
    });
    expect(applied.provenance.resources[0]!.contentHash).toMatch(/^[0-9a-f]{64}$/);

    const root = new THREE.Group();
    root.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), applied.material));
    expect(collectMaterialResourceProvenance(root)).toEqual(applied.provenance.resources);
  });
});
