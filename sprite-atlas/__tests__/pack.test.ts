/**
 * Sprite atlas packer tests — generates RGBA fixtures via sharp, then verifies
 * frame placement, overlap, and POT sizing.
 */

import { describe, expect, test } from 'bun:test';
import { Buffer } from 'node:buffer';
import sharp from 'sharp';

import { packSpriteAtlas } from '../pack';
import { SpriteFrameTableSchema } from '../schema';

async function solid(w: number, h: number, rgb: [number, number, number]): Promise<Buffer> {
  return sharp({
    create: {
      width: w,
      height: h,
      channels: 4,
      background: { r: rgb[0], g: rgb[1], b: rgb[2], alpha: 1 },
    },
  })
    .png()
    .toBuffer();
}

describe('packSpriteAtlas', () => {
  test('packs 10 equal-size sprites with no overlap', async () => {
    const sprites = await Promise.all(
      Array.from({ length: 10 }, async (_unused, i) => ({
        name: `sprite-${i}`,
        data: await solid(32, 32, [i * 20, 80, 200]),
      })),
    );
    const result = await packSpriteAtlas(sprites, { padding: 2, pot: true });

    expect(result.frames.frames).toHaveLength(10);
    expect(() => SpriteFrameTableSchema.parse(result.frames)).not.toThrow();

    // Atlas is a valid PNG.
    expect(result.atlas.subarray(0, 4).toString('hex')).toBe('89504e47');

    // No two frames overlap.
    const fs = result.frames.frames;
    for (let i = 0; i < fs.length; i++) {
      for (let j = i + 1; j < fs.length; j++) {
        const a = fs[i]!;
        const b = fs[j]!;
        const overlap = !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
        expect(overlap).toBe(false);
      }
    }

    // All frames fit inside the atlas.
    for (const f of fs) {
      expect(f.x + f.w).toBeLessThanOrEqual(result.frames.atlasWidth);
      expect(f.y + f.h).toBeLessThanOrEqual(result.frames.atlasHeight);
    }

    // Atlas is power-of-two.
    expect(isPot(result.frames.atlasWidth)).toBe(true);
    expect(isPot(result.frames.atlasHeight)).toBe(true);
  });

  test('preserves input order in the frame table', async () => {
    const sprites = [
      { name: 'tall', data: await solid(16, 64, [255, 0, 0]) },
      { name: 'wide', data: await solid(128, 16, [0, 255, 0]) },
      { name: 'small', data: await solid(8, 8, [0, 0, 255]) },
    ];
    const result = await packSpriteAtlas(sprites);
    expect(result.frames.frames.map((f) => f.name)).toEqual(['tall', 'wide', 'small']);
  });

  test('respects maxSize — throws when nothing fits', async () => {
    await expect(
      packSpriteAtlas([{ name: 'giant', data: await solid(512, 512, [0, 0, 0]) }], {
        maxSize: 1024,
        padding: 0,
        pot: false,
      }),
    ).resolves.toBeTruthy();
    await expect(
      packSpriteAtlas(
        [
          { name: 'a', data: await solid(900, 900, [0, 0, 0]) },
          { name: 'b', data: await solid(900, 900, [0, 0, 0]) },
        ],
        { maxSize: 1024, padding: 0, pot: false },
      ),
    ).rejects.toThrow(/ran out of atlas room/);
  });

  test('rejects a sprite larger than maxSize', async () => {
    await expect(
      packSpriteAtlas([{ name: 'huge', data: await solid(600, 600, [0, 0, 0]) }], {
        maxSize: 1024,
        padding: 0,
        pot: false,
      }),
    ).resolves.toBeTruthy();
    await expect(
      packSpriteAtlas([{ name: 'huge', data: await solid(1200, 1200, [0, 0, 0]) }], {
        maxSize: 1024,
      }),
    ).rejects.toThrow(/larger than maxSize/);
  });

  test('padding increases spacing between frames', async () => {
    const sprites = [
      { name: 'a', data: await solid(32, 32, [255, 0, 0]) },
      { name: 'b', data: await solid(32, 32, [0, 255, 0]) },
    ];
    const noPad = await packSpriteAtlas(sprites, { padding: 0, pot: false });
    const padded = await packSpriteAtlas(sprites, { padding: 8, pot: false });
    const gapNo = noPad.frames.frames[1]!.x - (noPad.frames.frames[0]!.x + noPad.frames.frames[0]!.w);
    const gapPad = padded.frames.frames[1]!.x - (padded.frames.frames[0]!.x + padded.frames.frames[0]!.w);
    expect(gapPad).toBeGreaterThan(gapNo);
  });
});

function isPot(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}
