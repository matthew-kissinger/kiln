/**
 * Sprite atlas packer — shelf algorithm.
 *
 * Sorts sprites by descending height, places them in horizontal shelves
 * (rows). Not the densest packing possible (MaxRects would be ~10% tighter),
 * but simple, deterministic, and fast. For <500 sprites at typical game-asset
 * sizes this leaves plenty of atlas headroom.
 *
 * Output is a single RGBA PNG plus a JSON frame table.
 */

import { Buffer } from 'node:buffer';
import sharp from 'sharp';

import {
  SPRITE_ATLAS_SCHEMA_VERSION,
  type SpriteFrame,
  type SpriteFrameTable,
} from './schema';

export interface PackSpriteAtlasInput {
  /** Species / asset name — preserved into the frame table. */
  name: string;
  /** PNG or other sharp-readable bytes. */
  data: Buffer;
}

export interface PackSpriteAtlasOptions {
  /** Maximum atlas edge in pixels. Default 2048. */
  maxSize?: 1024 | 2048 | 4096;
  /** Transparent pixels between packed sprites. Default 2. */
  padding?: number;
  /** Force the final atlas to power-of-two dimensions. Default true. */
  pot?: boolean;
}

export interface PackSpriteAtlasResult {
  atlas: Buffer;
  frames: SpriteFrameTable;
}

interface Prepared {
  name: string;
  buf: Buffer;
  w: number;
  h: number;
  sourceWidth: number;
  sourceHeight: number;
}

interface Placed extends Prepared {
  x: number;
  y: number;
}

export async function packSpriteAtlas(
  sprites: PackSpriteAtlasInput[],
  opts: PackSpriteAtlasOptions = {},
): Promise<PackSpriteAtlasResult> {
  if (!sprites.length) {
    throw new Error('packSpriteAtlas: at least one sprite is required');
  }
  const maxSize = opts.maxSize ?? 2048;
  const padding = opts.padding ?? 2;
  const pot = opts.pot ?? true;

  // Normalize input PNGs through sharp so downstream composite treats them uniformly.
  const prepared: Prepared[] = await Promise.all(
    sprites.map(async (s): Promise<Prepared> => {
      const { data, info } = await sharp(s.data).ensureAlpha().toBuffer({ resolveWithObject: true });
      return {
        name: s.name,
        buf: data,
        w: info.width,
        h: info.height,
        sourceWidth: info.width,
        sourceHeight: info.height,
      };
    }),
  );

  // Sort by height descending — standard shelf heuristic.
  const sorted = prepared.slice().sort((a, b) => b.h - a.h);

  // Shelf-pack.
  const placed: Placed[] = [];
  let shelfX = 0;
  let shelfY = 0;
  let shelfH = 0;
  let atlasW = 0;
  for (const s of sorted) {
    const w = s.w + padding * 2;
    const h = s.h + padding * 2;
    if (w > maxSize || h > maxSize) {
      throw new Error(
        `packSpriteAtlas: sprite "${s.name}" (${s.w}×${s.h}) larger than maxSize ${maxSize}`,
      );
    }
    if (shelfX + w > maxSize) {
      shelfY += shelfH;
      shelfX = 0;
      shelfH = 0;
    }
    if (shelfY + h > maxSize) {
      throw new Error(
        `packSpriteAtlas: ran out of atlas room at sprite "${s.name}". ` +
          `Increase maxSize (currently ${maxSize}) or split the input.`,
      );
    }
    placed.push({ ...s, x: shelfX + padding, y: shelfY + padding });
    shelfX += w;
    shelfH = Math.max(shelfH, h);
    atlasW = Math.max(atlasW, shelfX);
  }
  const atlasH = shelfY + shelfH;

  const finalW = pot ? nextPot(atlasW) : atlasW;
  const finalH = pot ? nextPot(atlasH) : atlasH;

  const composites: sharp.OverlayOptions[] = placed.map((p) => ({
    input: p.buf,
    left: p.x,
    top: p.y,
  }));
  const atlas = await sharp({
    create: {
      width: finalW,
      height: finalH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer();

  // Build the frame table in the INPUT order (not the packed order).
  const byName = new Map(placed.map((p) => [p.name, p]));
  const frames: SpriteFrame[] = sprites.map((s) => {
    const p = byName.get(s.name);
    if (!p) throw new Error(`packSpriteAtlas: missing placement for "${s.name}"`);
    return {
      name: s.name,
      x: p.x,
      y: p.y,
      w: p.w,
      h: p.h,
      sourceWidth: p.sourceWidth,
      sourceHeight: p.sourceHeight,
    };
  });

  return {
    atlas,
    frames: {
      version: SPRITE_ATLAS_SCHEMA_VERSION,
      atlasWidth: finalW,
      atlasHeight: finalH,
      padding,
      frames,
    },
  };
}

function nextPot(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}
