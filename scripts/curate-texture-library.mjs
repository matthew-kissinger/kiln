#!/usr/bin/env node

/**
 * Rebuild the small embedded CC0 texture catalogue from Poly Haven source maps.
 *
 * This is intentionally opt-in and networked. CI validates the checked-in bytes,
 * hashes, provenance, and package budget without calling an external service.
 */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const OUTPUT = fileURLToPath(new URL('../src/material-texture-library.generated.ts', import.meta.url));
const USER_AGENT = 'KilnTextureCuration/1.0 (matthew-kissinger/kiln)';
const TARGET_SIZE = 128;

const FAMILIES = [
  { slug: 'bark-brown-01', asset: 'bark_brown_01', label: 'Brown furrowed bark', recipes: ['kiln.material.bark.v1', 'kiln.material.wood.v1'] },
  { slug: 'weathered-planks', asset: 'brown_planks_03', label: 'Weathered brown planks', recipes: ['kiln.material.wood.v1'] },
  { slug: 'rough-concrete', asset: 'rough_concrete', label: 'Rough concrete', recipes: ['kiln.material.stone.v1'] },
  { slug: 'denim', asset: 'denim_fabric', label: 'Blue denim weave', recipes: ['kiln.material.cloth.v1'] },
  { slug: 'rusted-metal', asset: 'rust_coarse_01', label: 'Coarse rusted metal', recipes: ['kiln.material.painted-metal.v1'] },
  { slug: 'rock-face', asset: 'rock_face_03', label: 'Layered rock face', recipes: ['kiln.material.stone.v1'] },
  { slug: 'dry-soil', asset: 'brown_mud_dry', label: 'Dry compacted soil', recipes: ['kiln.material.stone.v1'] },
  { slug: 'brick-wall', asset: 'brick_wall_005', label: 'Weathered brick wall', recipes: ['kiln.material.stone.v1'] },
];

const MAPS = [
  { key: 'Diffuse', suffix: 'albedo', usage: 'albedo', colorSpace: 'srgb', slot: 'baseColor' },
  { key: 'nor_gl', suffix: 'normal', usage: 'normal', colorSpace: 'linear', slot: 'normal' },
  { key: 'arm', suffix: 'arm', usage: 'metallicRoughness', colorSpace: 'linear', slot: 'metallicRoughness' },
];

const hash = (algorithm, bytes) => createHash(algorithm).update(bytes).digest('hex');
const quote = (value) => JSON.stringify(value);

function wrappedBase64(bytes) {
  const value = bytes.toString('base64');
  const chunks = value.match(/.{1,100}/g) ?? [''];
  return chunks.map((chunk) => quote(chunk)).join(' +\n      ');
}

async function getJson(url) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

async function getBytes(url) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

const records = [];
for (const family of FAMILIES) {
  const files = await getJson(`https://api.polyhaven.com/files/${family.asset}`);
  for (const map of MAPS) {
    const source = files[map.key]?.['1k']?.jpg;
    if (!source?.url || !source?.md5) {
      throw new Error(`${family.asset} has no 1K JPG ${map.key} map`);
    }
    const original = await getBytes(source.url);
    const observedMd5 = hash('md5', original);
    if (observedMd5 !== source.md5) {
      throw new Error(`${source.url} md5 ${observedMd5} did not match API ${source.md5}`);
    }
    const derived = await sharp(original)
      .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
      .png({ compressionLevel: 9, adaptiveFiltering: true, palette: map.suffix !== 'normal', colours: 256, quality: 90 })
      .toBuffer();
    records.push({
      ...family,
      ...map,
      id: `kiln.texture.${family.slug}-${map.suffix}.v1`,
      sourceUrl: source.url,
      sourceMd5: source.md5,
      bytes: derived,
      sha256: hash('sha256', derived),
    });
  }
}

const ids = records.map((record) => `  ${quote(record.id)},`).join('\n');
const descriptors = records.map((record) => `  ${quote(record.id)}: Object.freeze({
    schemaVersion: 1,
    id: ${quote(record.id)},
    version: 1,
    label: ${quote(`${record.label} ${record.suffix}`)},
    usage: ${quote(record.usage)},
    colorSpace: ${quote(record.colorSpace)},
    mime: 'image/png',
    contentHash: ${quote(record.sha256)},
    delivery: 'embedded',
    quality: 'production',
    byteLength: ${record.bytes.byteLength},
    license: Object.freeze({
      spdx: 'CC0-1.0',
      attribution: '',
      source: ${quote(`https://polyhaven.com/a/${record.asset}`)},
    }),
    allowedSlots: Object.freeze([${quote(record.slot)}] as const),
    recipeIds: Object.freeze(${JSON.stringify(record.recipes)} as const),
  }),`).join('\n');
const payloads = records.map((record) => `  ${quote(record.id)}:
      ${wrappedBase64(record.bytes)},`).join('\n');
const provenance = records.map((record) => `  ${quote(record.id)}: Object.freeze({
    sourceAsset: ${quote(record.asset)},
    sourceUrl: ${quote(record.sourceUrl)},
    sourceMd5: ${quote(record.sourceMd5)},
    transform: ${quote(`sharp ${TARGET_SIZE}x${TARGET_SIZE} Lanczos3 PNG`)},
  }),`).join('\n');
const total = records.reduce((sum, record) => sum + record.bytes.byteLength, 0);

const generated = `/**
 * GENERATED by scripts/curate-texture-library.mjs.
 *
 * Eight Poly Haven CC0 families, each with albedo, OpenGL normal, and packed
 * ambient-occlusion/roughness/metalness (ARM) maps. Source download identity is
 * retained below; runtime output is self-contained and never calls Poly Haven.
 * Embedded payload: ${total} bytes.
 */

export const PRODUCTION_TEXTURE_RESOURCE_IDS = [
${ids}
] as const;

export const PRODUCTION_TEXTURE_RESOURCE_DESCRIPTORS_V1 = Object.freeze({
${descriptors}
});

export const PRODUCTION_TEXTURE_RESOURCE_BASE64 = Object.freeze({
${payloads}
});

export const PRODUCTION_TEXTURE_SOURCE_PROVENANCE_V1 = Object.freeze({
${provenance}
});
`;

await writeFile(OUTPUT, generated, 'utf8');
execFileSync('bun', ['x', 'biome', 'format', '--write', OUTPUT], { stdio: 'inherit' });
console.log(JSON.stringify({ output: OUTPUT, families: FAMILIES.length, resources: records.length, embeddedBytes: total }));
