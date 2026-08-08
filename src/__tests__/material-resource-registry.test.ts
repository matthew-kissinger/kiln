/**
 * T2.1 runtime-delivered texture resources.
 *
 * A resource that is not in the package has to be fetched, and the whole point of
 * a closed approved registry is that fetching cannot become a way to put
 * arbitrary pixels into an asset. These tests are about the two properties that
 * makes true: bytes are verified against a pinned length and hash before anything
 * decodes them, and a resource the environment cannot produce is refused loudly
 * rather than skipped.
 */
import { describe, expect, test } from 'bun:test';

import {
  APPROVED_TEXTURE_RESOURCE_IDS,
  APPROVED_TEXTURE_RESOURCES_V1,
  type ApprovedTextureResourceDescriptorV1,
  type ApprovedTextureResourceId,
} from '../material-recipes';
import {
  ApprovedTextureResourceCache,
  ApprovedTextureResourceUnavailableError,
  approvedTextureCatalogV1,
} from '../material-resources';
import { buildMaterialRecipePromptContextV1 } from '../material-recipe-prompt';

const SUBJECT: ApprovedTextureResourceId = 'kiln.texture.bark-albedo.v1';

/** The shipped bark bytes, re-declared as runtime-delivered production content. */
const shipped = APPROVED_TEXTURE_RESOURCES_V1[SUBJECT];
const RUNTIME_REGISTRY: Readonly<
  Record<ApprovedTextureResourceId, ApprovedTextureResourceDescriptorV1>
> = Object.freeze({
  ...APPROVED_TEXTURE_RESOURCES_V1,
  [SUBJECT]: Object.freeze({
    ...shipped,
    delivery: 'runtime',
    quality: 'production',
  } satisfies ApprovedTextureResourceDescriptorV1),
});

/** Byte-identical to what the package embeds, so the pinned hash still holds. */
function goodBytes(): Uint8Array {
  return new ApprovedTextureResourceCache().resolve(SUBJECT).bytes;
}

describe('runtime-delivered approved resources', () => {
  test('a runtime resource cannot be produced synchronously', () => {
    const cache = new ApprovedTextureResourceCache({ registry: RUNTIME_REGISTRY });

    // resolve() has no way to await a host call. Returning anything at all here
    // would mean returning bytes that are not the requested resource.
    expect(() => cache.resolve(SUBJECT)).toThrow(ApprovedTextureResourceUnavailableError);
    expect(() => cache.resolve(SUBJECT)).toThrow(/resolveAsync\(\) or load\(\)/);
    // The other four are still embedded and still work synchronously.
    expect(cache.resolve('kiln.texture.neutral-normal.v1').bytes.byteLength).toBeGreaterThan(0);
  });

  test('with no resolver registered it fails by name instead of silently degrading', async () => {
    const cache = new ApprovedTextureResourceCache({ registry: RUNTIME_REGISTRY });

    expect(cache.available(SUBJECT)).toBe(false);
    const error = await cache.resolveAsync(SUBJECT).catch((value: unknown) => value);
    expect(error).toBeInstanceOf(ApprovedTextureResourceUnavailableError);
    expect((error as ApprovedTextureResourceUnavailableError).resourceId).toBe(SUBJECT);
    expect((error as Error).message).toMatch(/no runtime texture resolver is registered/);
  });

  test('resolved bytes carry the same provenance as embedded ones, marked by delivery', async () => {
    const cache = new ApprovedTextureResourceCache({
      registry: RUNTIME_REGISTRY,
      resolver: async () => goodBytes(),
    });

    const resolved = await cache.resolveAsync(SUBJECT);
    expect(resolved.provenance.contentHash).toBe(shipped.contentHash);
    expect(resolved.provenance.delivery).toBe('runtime');
    expect(resolved.provenance.usage).toBe('albedo');
    // Delivery is the only difference. A consumer that verifies provenance must
    // not have to care where the bytes came from, only that they were verified.
    const embedded = new ApprovedTextureResourceCache().resolve(SUBJECT);
    expect({ ...resolved.provenance, delivery: 'embedded' }).toEqual(embedded.provenance);
    expect(resolved.bytes).toEqual(embedded.bytes);
  });

  test('a resolver returning the wrong bytes is rejected, not trusted', async () => {
    const wrong = new ApprovedTextureResourceCache({
      registry: RUNTIME_REGISTRY,
      // Right length, wrong content: the case a length check alone would pass.
      resolver: async () => {
        const bytes = goodBytes();
        const last = bytes.byteLength - 1;
        bytes.set([(bytes[last] ?? 0) ^ 0xff], last);
        return bytes;
      },
    });
    await expect(wrong.resolveAsync(SUBJECT)).rejects.toThrow(/does not match the pinned/);

    const truncated = new ApprovedTextureResourceCache({
      registry: RUNTIME_REGISTRY,
      resolver: async () => goodBytes().subarray(0, 40),
    });
    // Reported as a length, because the usual cause is an error document or a
    // partial body, and a hash mismatch would read as corruption instead.
    await expect(truncated.resolveAsync(SUBJECT)).rejects.toThrow(
      /expected 100 bytes, received 40/,
    );
  });

  test('concurrent requests for one resource share a single fetch', async () => {
    let calls = 0;
    const cache = new ApprovedTextureResourceCache({
      registry: RUNTIME_REGISTRY,
      resolver: async () => {
        calls += 1;
        await Promise.resolve();
        return goodBytes();
      },
    });

    // A scene binds the same resource from several materials at once. Without
    // in-flight deduplication each one is its own network round trip.
    await Promise.all([
      cache.resolveAsync(SUBJECT),
      cache.resolveAsync(SUBJECT),
      cache.resolveAsync(SUBJECT),
    ]);
    await cache.resolveAsync(SUBJECT);
    expect(calls).toBe(1);
  });

  test('a failed fetch is retryable rather than cached as a permanent failure', async () => {
    let calls = 0;
    const cache = new ApprovedTextureResourceCache({
      registry: RUNTIME_REGISTRY,
      resolver: async () => {
        calls += 1;
        if (calls === 1) throw new Error('transient network failure');
        return goodBytes();
      },
    });

    await expect(cache.resolveAsync(SUBJECT)).rejects.toThrow(/transient/);
    // A cached rejection would turn one blip into a dead resource for the life
    // of the process, which for a long-lived runtime means until redeploy.
    expect((await cache.resolveAsync(SUBJECT)).provenance.contentHash).toBe(shipped.contentHash);
    expect(calls).toBe(2);
  });

  test('a resolver only ever sees approved descriptors, never a caller-supplied string', async () => {
    const seen: string[] = [];
    const cache = new ApprovedTextureResourceCache({
      registry: RUNTIME_REGISTRY,
      resolver: async (descriptor) => {
        seen.push(descriptor.id);
        return goodBytes();
      },
    });

    await expect(cache.resolveAsync('kiln.texture.invented.v1' as never)).rejects.toThrow(
      /Unsupported/,
    );
    await cache.resolveAsync(SUBJECT);
    // The descriptor is the entire input. There is no path, URL, or credential
    // in it for a model to reach through, and an unapproved ID never arrives.
    expect(seen).toEqual([SUBJECT]);
    expect(JSON.stringify(APPROVED_TEXTURE_RESOURCES_V1[SUBJECT])).not.toMatch(
      /(?:https?:|s3:|path|token|secret)/i,
    );
  });
});

describe('what the model is told it can bind', () => {
  test('placeholder swatches are withheld, so the catalogue is empty as shipped', () => {
    // Every shipped resource is a 2x2 or 4x4 swatch that exists to prove a slot
    // binds. Offering one to a model competes with proceduralTexture() and looks
    // worse than it, so the honest catalogue today is empty.
    expect(approvedTextureCatalogV1()).toEqual([]);
    expect(approvedTextureCatalogV1({ includePlaceholders: true })).toHaveLength(
      APPROVED_TEXTURE_RESOURCE_IDS.length,
    );
  });

  test('the catalogue reports only what this environment can resolve', () => {
    const production: Readonly<
      Record<ApprovedTextureResourceId, ApprovedTextureResourceDescriptorV1>
    > = Object.freeze({
      ...RUNTIME_REGISTRY,
      [SUBJECT]: Object.freeze({
        ...RUNTIME_REGISTRY[SUBJECT],
        quality: 'production',
      } satisfies ApprovedTextureResourceDescriptorV1),
    });

    const withoutResolver = new ApprovedTextureResourceCache({ registry: production });
    expect(approvedTextureCatalogV1({ cache: withoutResolver })).toEqual([]);

    const withResolver = new ApprovedTextureResourceCache({
      registry: production,
      resolver: async () => goodBytes(),
    });
    const catalog = approvedTextureCatalogV1({ cache: withResolver });
    expect(catalog.map((entry) => entry.id)).toEqual([SUBJECT]);
    expect(catalog[0]?.delivery).toBe('runtime');
  });

  test('the prompt names resolvable IDs, and says so plainly when there are none', () => {
    const empty = buildMaterialRecipePromptContextV1([]);
    // The historical text claimed slots accept "IDs reported by capabilities"
    // while nothing reported any, so the only way to use a slot was to guess an
    // ID and be rejected by validation.
    expect(empty).toContain('none are available in this');
    expect(empty).toContain('proceduralTexture()');
    // It still names the shape of the IDs, but no concrete one — there is
    // nothing to bind, and a guessable example would be guessed.
    expect(empty).not.toMatch(/kiln\.texture\.[a-z]/);

    const named = buildMaterialRecipePromptContextV1([
      { id: SUBJECT, usage: 'albedo', allowedSlots: ['baseColor'] },
    ]);
    expect(named).toContain(`- ${SUBJECT} (albedo) for slots: baseColor`);
    expect(named).toContain('do not invent one');
  });
});

describe('package weight', () => {
  test('runtime resources ship no bytes, and the embedded set stays negligible', () => {
    for (const id of APPROVED_TEXTURE_RESOURCE_IDS) {
      const descriptor = APPROVED_TEXTURE_RESOURCES_V1[id];
      expect(descriptor.byteLength).toBeGreaterThan(0);
      if (descriptor.delivery !== 'runtime') continue;
      // The budget this task was asked to document is enforced by construction
      // rather than by a number: runtime resources have nowhere in the package
      // to put bytes, so a photographic library cannot grow the tarball at all.
      expect(() => new ApprovedTextureResourceCache().resolve(id)).toThrow(
        ApprovedTextureResourceUnavailableError,
      );
    }

    const embedded = APPROVED_TEXTURE_RESOURCE_IDS.filter(
      (id) => APPROVED_TEXTURE_RESOURCES_V1[id].delivery === 'embedded',
    ).reduce((sum, id) => sum + APPROVED_TEXTURE_RESOURCES_V1[id].byteLength, 0);
    // The engine is vendored as a tarball and installed into two container
    // images by two package managers, so embedded bytes are paid for on every
    // image build. 64 KB is far above today's 508 and far below one photo.
    expect(embedded).toBeLessThanOrEqual(64 * 1024);
  });

  test('every resource records a licence, so silence is never the default', () => {
    for (const id of APPROVED_TEXTURE_RESOURCE_IDS) {
      const license = APPROVED_TEXTURE_RESOURCES_V1[id].license;
      expect(license.spdx.length).toBeGreaterThan(0);
      expect(license.source.length).toBeGreaterThan(0);
      // `attribution` may be empty, but it is never absent: an empty string is a
      // recorded decision that this licence requires none.
      expect(typeof license.attribution).toBe('string');
    }
  });
});
