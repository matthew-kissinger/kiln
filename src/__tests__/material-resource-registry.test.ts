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
import sharp from 'sharp';

import {
  APPROVED_TEXTURE_RESOURCE_IDS,
  APPROVED_TEXTURE_RESOURCES_V1,
  type ApprovedTextureResourceDescriptorV1,
  type ApprovedTextureResourceId,
} from '../material-recipes';
import {
  ApprovedTextureResourceCache,
  ApprovedTextureResourceUnavailableError,
  TEXTURE_RESOLVER_LIMITS_V1,
  approvedTextureCatalogV1,
} from '../material-resources';
import { buildMaterialRecipePromptContextV1 } from '../material-recipe-prompt';
import { PRODUCTION_TEXTURE_SOURCE_PROVENANCE_V1 } from '../material-texture-library.generated';

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
      resolver: async () => ({ bytes: goodBytes(), mime: 'image/png' }),
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
        return { bytes, mime: 'image/png' };
      },
    });
    await expect(wrong.resolveAsync(SUBJECT)).rejects.toThrow(/does not match the pinned/);

    const truncated = new ApprovedTextureResourceCache({
      registry: RUNTIME_REGISTRY,
      resolver: async () => ({ bytes: goodBytes().subarray(0, 40), mime: 'image/png' }),
    });
    // Reported as a length, because the usual cause is an error document or a
    // partial body, and a hash mismatch would read as corruption instead.
    await expect(truncated.resolveAsync(SUBJECT)).rejects.toThrow(
      /expected 100 bytes, received 40/,
    );
  });

  test('host payloads reject oversize bytes, unsupported MIME/format, and unsafe dimensions', async () => {
    const oversized = new ApprovedTextureResourceCache({
      registry: RUNTIME_REGISTRY,
      resolver: async () => ({
        bytes: new Uint8Array(TEXTURE_RESOLVER_LIMITS_V1.maxEncodedBytes + 1),
        mime: 'image/png',
      }),
    });
    await expect(oversized.resolveAsync(SUBJECT)).rejects.toThrow(/encoded-byte limit/);

    const wrongMime = new ApprovedTextureResourceCache({
      registry: RUNTIME_REGISTRY,
      resolver: async () => ({ bytes: goodBytes(), mime: 'image/jpeg' as never }),
    });
    await expect(wrongMime.resolveAsync(SUBJECT)).rejects.toThrow(/MIME/);

    const wrongFormat = new ApprovedTextureResourceCache({
      registry: RUNTIME_REGISTRY,
      resolver: async () => ({ bytes: new Uint8Array(goodBytes().byteLength), mime: 'image/png' }),
    });
    await expect(wrongFormat.resolveAsync(SUBJECT)).rejects.toThrow(/PNG signature|format/);

    const hugeDimensions = goodBytes();
    new DataView(hugeDimensions.buffer, hugeDimensions.byteOffset).setUint32(16, 8192, false);
    const dimensions = new ApprovedTextureResourceCache({
      registry: RUNTIME_REGISTRY,
      resolver: async () => ({ bytes: hugeDimensions, mime: 'image/png' }),
    });
    await expect(dimensions.resolveAsync(SUBJECT)).rejects.toThrow(/dimension limit/);

    const tooManyPixels = goodBytes();
    const pixelView = new DataView(tooManyPixels.buffer, tooManyPixels.byteOffset);
    pixelView.setUint32(16, 4096, false);
    pixelView.setUint32(20, 4096, false);
    const pixels = new ApprovedTextureResourceCache({
      registry: RUNTIME_REGISTRY,
      resolver: async () => ({ bytes: tooManyPixels, mime: 'image/png' }),
    });
    await expect(pixels.resolveAsync(SUBJECT)).rejects.toThrow(/pixel limit/);

    const suppliedHash = new ApprovedTextureResourceCache({
      registry: RUNTIME_REGISTRY,
      resolver: async () =>
        ({
          bytes: goodBytes(),
          mime: 'image/png',
          sha256: shipped.contentHash,
        }) as never,
    });
    await expect(suppliedHash.resolveAsync(SUBJECT)).rejects.toThrow(/only bytes and MIME/);
  });

  test('host resolution has a hard deadline and exposes only an abort signal to the host', async () => {
    let signal: AbortSignal | undefined;
    const cache = new ApprovedTextureResourceCache({
      registry: RUNTIME_REGISTRY,
      resolverDeadlineMs: 10,
      resolver: async (_descriptor, context) => {
        signal = context.signal;
        return await new Promise(() => {});
      },
    });
    await expect(cache.resolveAsync(SUBJECT)).rejects.toThrow(/deadline exceeded/);
    expect(signal?.aborted).toBe(true);
  });

  test('concurrent requests for one resource share a single fetch', async () => {
    let calls = 0;
    const cache = new ApprovedTextureResourceCache({
      registry: RUNTIME_REGISTRY,
      resolver: async () => {
        calls += 1;
        await Promise.resolve();
        return { bytes: goodBytes(), mime: 'image/png' };
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
        return { bytes: goodBytes(), mime: 'image/png' };
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
        return { bytes: goodBytes(), mime: 'image/png' };
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
  test('placeholder swatches are withheld while production texture families are advertised', () => {
    const catalog = approvedTextureCatalogV1();
    expect(catalog).toHaveLength(24);
    expect(catalog.map((entry) => entry.id)).toEqual(
      expect.arrayContaining([
        'kiln.texture.bark-brown-01-albedo.v1',
        'kiln.texture.weathered-planks-albedo.v1',
        'kiln.texture.rough-concrete-normal.v1',
        'kiln.texture.denim-arm.v1',
        'kiln.texture.rusted-metal-albedo.v1',
        'kiln.texture.rock-face-normal.v1',
        'kiln.texture.dry-soil-arm.v1',
        'kiln.texture.brick-wall-albedo.v1',
      ]),
    );
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
    expect(approvedTextureCatalogV1({ cache: withoutResolver })).toHaveLength(24);
    expect(
      approvedTextureCatalogV1({ cache: withoutResolver }).some((entry) => entry.id === SUBJECT),
    ).toBe(false);

    const withResolver = new ApprovedTextureResourceCache({
      registry: production,
      resolver: async () => ({ bytes: goodBytes(), mime: 'image/png' }),
    });
    const catalog = approvedTextureCatalogV1({ cache: withResolver });
    expect(catalog).toHaveLength(25);
    expect(catalog.find((entry) => entry.id === SUBJECT)?.delivery).toBe('runtime');
  });

  test('the prompt names resolvable IDs, and says so plainly when there are none', () => {
    const empty = buildMaterialRecipePromptContextV1([]);
    // The historical text claimed slots accept "IDs reported by capabilities"
    // while nothing reported any, so the only way to use a slot was to guess an
    // ID and be rejected by validation.
    expect(empty).toContain('none are available in this');
    expect(empty).toContain('proceduralTexture({ schemaVersion: 2, ... })');
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
  test('every production family ships a verified albedo, normal, and packed ARM map', async () => {
    const cache = new ApprovedTextureResourceCache();
    const productionIds = APPROVED_TEXTURE_RESOURCE_IDS.filter(
      (id) => APPROVED_TEXTURE_RESOURCES_V1[id].quality === 'production',
    );
    expect(productionIds).toHaveLength(24);

    const families = new Map<string, Set<string>>();
    for (const id of productionIds) {
      const resolved = cache.resolve(id);
      expect(resolved.bytes.subarray(0, 8)).toEqual(
        new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      );
      expect(resolved.bytes.byteLength).toBe(APPROVED_TEXTURE_RESOURCES_V1[id].byteLength);
      const image = sharp(resolved.bytes);
      const metadata = await image.metadata();
      expect([metadata.width, metadata.height, metadata.format]).toEqual([128, 128, 'png']);
      const stats = await image.stats();
      expect(Math.max(...stats.channels.map((channel) => channel.stdev))).toBeGreaterThan(2);
      const match = id.match(/^kiln\.texture\.(.+)-(albedo|normal|arm)\.v1$/);
      expect(match).not.toBeNull();
      const family = match?.[1] ?? '';
      const map = match?.[2] ?? '';
      const maps = families.get(family) ?? new Set<string>();
      maps.add(map);
      families.set(family, maps);

      const source =
        PRODUCTION_TEXTURE_SOURCE_PROVENANCE_V1[
          id as keyof typeof PRODUCTION_TEXTURE_SOURCE_PROVENANCE_V1
        ];
      expect(source.sourceUrl).toMatch(/^https:\/\/dl\.polyhaven\.org\//);
      expect(source.sourceMd5).toMatch(/^[0-9a-f]{32}$/);
      expect(source.transform).toContain('128x128');
    }
    expect(families.size).toBe(8);
    for (const maps of families.values())
      expect([...maps].sort()).toEqual(['albedo', 'arm', 'normal']);
  });

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
    // Eight 128px photographic families carry albedo, normal, and packed ARM.
    // One MiB keeps the engine tarball bounded while preserving materially more
    // signal than the historical 2x2/4x4 proof swatches.
    expect(embedded).toBeLessThanOrEqual(1024 * 1024);
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
