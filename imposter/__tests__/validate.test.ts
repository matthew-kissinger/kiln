import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, test } from 'bun:test';
import sharp from 'sharp';

import { validateImposterSidecar } from '../validate';

const BASE_META = {
  tileSize: 128,
  worldSize: 1,
  yOffset: 0.5,
  projection: 'orthographic',
  bbox: { min: [0, 0, 0], max: [1, 1, 0] },
  source: { path: 'one-triangle.glb', bytes: 988, tris: 1 },
  auxLayers: ['albedo', 'normal', 'depth'],
  bgColor: 'transparent',
  colorLayer: 'baseColor',
  normalSpace: 'capture-view',
  edgeBleedPx: 2,
  textureColorSpace: 'srgb',
} as const;

function makeDir(): string {
  return mkdtempSync(join(tmpdir(), 'pf-imposter-validate-'));
}

async function writePng(path: string, width: number, height: number): Promise<void> {
  const png = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 80, g: 120, b: 40, alpha: 1 },
    },
  }).png().toBuffer();
  writeFileSync(path, png);
}

async function writeSidecarSet(dir: string, name: string, meta: unknown): Promise<string> {
  const sidecar = join(dir, `${name}.json`);
  writeFileSync(sidecar, JSON.stringify(meta, null, 2), 'utf-8');
  const m = meta as { atlasWidth: number; atlasHeight: number };
  await writePng(join(dir, `${name}.png`), m.atlasWidth, m.atlasHeight);
  await writePng(join(dir, `${name}.normal.png`), m.atlasWidth, m.atlasHeight);
  await writePng(join(dir, `${name}.depth.png`), m.atlasWidth, m.atlasHeight);
  return sidecar;
}

describe('validateImposterSidecar', () => {
  test('accepts a v1 latlon sidecar and sibling PNGs', async () => {
    const dir = makeDir();
    const meta = {
      version: 1,
      angles: 16,
      tilesX: 4,
      tilesY: 4,
      atlasWidth: 512,
      atlasHeight: 512,
      axis: 'hemi-y',
      hemi: true,
      layout: 'latlon',
      azimuths: [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2],
      elevations: [1.4, 1.0, 0.5, 0.1],
      ...BASE_META,
    };
    const sidecar = await writeSidecarSet(dir, 'latlon', meta);

    const result = await validateImposterSidecar(sidecar);
    expect(result.ok).toBe(true);
    expect(result.meta?.version).toBe(1);
    expect(result.meta?.layout).toBe('latlon');
  });

  test('accepts a v2 octahedral sidecar with unit directions', async () => {
    const dir = makeDir();
    const meta = {
      version: 2,
      angles: 4,
      tilesX: 2,
      tilesY: 2,
      atlasWidth: 256,
      atlasHeight: 256,
      axis: 'octahedral',
      hemi: false,
      layout: 'octahedral',
      directionEncoding: 'octahedral',
      directions: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
        [-1, 0, 0],
      ],
      ...BASE_META,
    };
    const sidecar = await writeSidecarSet(dir, 'octa', meta);

    const result = await validateImposterSidecar(sidecar);
    expect(result.ok).toBe(true);
    expect(result.meta?.version).toBe(2);
    expect(result.meta?.layout).toBe('octahedral');
  });

  test('flags sibling PNG dimension mismatches', async () => {
    const dir = makeDir();
    const meta = {
      version: 1,
      angles: 8,
      tilesX: 4,
      tilesY: 2,
      atlasWidth: 512,
      atlasHeight: 256,
      axis: 'hemi-y',
      hemi: true,
      layout: 'latlon',
      azimuths: [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2],
      elevations: [1.0, 0.2],
      ...BASE_META,
    };
    const sidecar = await writeSidecarSet(dir, 'bad-png', meta);
    await writePng(join(dir, 'bad-png.normal.png'), 128, 128);

    const result = await validateImposterSidecar(sidecar);
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.message.includes('PNG dimensions'))).toBe(true);
  });
});
