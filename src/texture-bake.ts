/**
 * Bake in-memory textures to encoded PNG bytes before export — T2.2
 *
 * ## The problem this closes
 *
 * The GLB bridge (`render.ts` `bridgeTexture`) serializes a texture only if it
 * carries `userData.encoded` — the original bytes `loadTexture` stashed. A
 * texture built in code (a procedural `DataTexture`) has pixels but no encoded
 * bytes, so the bridge returned `null` and the slot was simply left off the
 * material.
 *
 * Measured, before this module existed: a `MeshStandardMaterial` with a
 * hand-built 8x8 checker `map` exported 1912 bytes of valid GLB with **zero
 * warnings**, no image in the file, and a QA disposition of `pass` under
 * `KILN_QA_MODE=off`. The asset shipped looking clean with its texture gone.
 * The scene QA gate does catch it at default settings
 * (`MAT_TEXTURE_DECODE_FAILED`), but that gate is downgradable and it is a
 * *block*, not a bake — it tells an author the texture is unexportable rather
 * than making it exportable.
 *
 * ## What this does
 *
 * Runs before scene QA, so QA judges what will actually be in the file. Every
 * texture reachable from a material slot that has readable 8-bit pixel data and
 * no encoded bytes is encoded to PNG and stamped with the same two `userData`
 * records `loadTexture` writes, so everything downstream — QA, the bridge,
 * provenance — treats a baked texture and a loaded one identically.
 *
 * Anything that cannot be baked gets a warning naming the material, the slot,
 * and the reason. That is the "loud" half: the bridge sees only a `THREE.Texture`
 * and cannot name where it came from, whereas this pass walks slots and can.
 *
 * ## What this deliberately does not do
 *
 * It never sets `texture.colorSpace`. QA requires sRGB for `map`/`emissiveMap`
 * and linear for the data maps, and a hand-built `DataTexture` defaults to
 * linear — but silently reinterpreting an author's pixels is the same class of
 * bug as the silent drop. A procedural albedo with the wrong color space still
 * blocks, with a message that now names the procedural fix.
 */

import { createHash } from 'node:crypto';
import * as THREE from 'three';
import type { EncodedTextureData, KilnTextureMetadata, TextureUsage } from './textures';

/** Provenance for one texture this pass encoded. Deterministic and sorted. */
export interface BakedTextureProvenanceV1 {
  schemaVersion: 1;
  /** `texture.name`, or `(unnamed texture)` — matches QA's `affected` naming. */
  texture: string;
  /** Owning material name, for locating it in the source. */
  material: string;
  /** glTF-facing slot the texture fills (`map`, `normalMap`, ...). */
  slot: string;
  usage: TextureUsage;
  width: number;
  height: number;
  channels: 3 | 4;
  /** Encoded PNG size in bytes. */
  bytes: number;
  /** SHA-1 of the PNG bytes — the handle a determinism test compares. */
  sha1: string;
}

/**
 * Material slots the GLB bridge can serialize, with the glTF usage each one
 * implies. Kept in the same order the bridge reads them so a warning list and a
 * material read the same way.
 *
 * `map` is read off every material type, not just `MeshStandardMaterial` — the
 * bridge's non-PBR path (`common.map`) bridges it too, and a Lambert or Basic
 * material with a dropped texture was just as silent.
 */
const SLOT_USAGE: ReadonlyArray<readonly [string, TextureUsage]> = [
  ['map', 'albedo'],
  ['normalMap', 'normal'],
  ['roughnessMap', 'roughness'],
  ['metalnessMap', 'metalness'],
  ['emissiveMap', 'emissive'],
  ['aoMap', 'occlusion'],
];

interface RawPixels {
  data: Uint8Array;
  width: number;
  height: number;
  channels: 3 | 4;
}

/**
 * Read 8-bit pixels off a texture, or explain why they are unusable.
 *
 * Returns a string instead of throwing because every failure here is a warning
 * on an otherwise-valid asset, not an error that should lose the whole export.
 */
function readPixels(texture: THREE.Texture): RawPixels | string {
  const image = texture.image as
    | { data?: ArrayLike<number>; width?: number; height?: number }
    | undefined;
  if (!image) return 'it has no image data';

  const { width, height } = image;
  if (!Number.isFinite(width) || !Number.isFinite(height) || !width || !height) {
    return 'its image has no usable width/height';
  }

  const data = image.data;
  if (!data) {
    // A texture from an <img>/ImageBitmap has pixels the CPU cannot read without
    // a canvas, which does not exist headlessly.
    return 'its pixels are not readable in Node (only DataTexture-style byte arrays can be baked)';
  }
  if (!(data instanceof Uint8Array) && !(data instanceof Uint8ClampedArray)) {
    return `its pixel data is ${data.constructor?.name ?? 'an unknown type'}, not 8-bit bytes (float/half-float textures cannot be baked to PNG)`;
  }

  const pixels = (width as number) * (height as number);
  const channels = data.length / pixels;
  if (channels !== 3 && channels !== 4) {
    return `its pixel data is ${data.length} bytes for ${width}x${height}, which is neither RGB nor RGBA`;
  }

  return {
    data: data instanceof Uint8Array ? data : new Uint8Array(data),
    width: width as number,
    height: height as number,
    channels,
  };
}

/**
 * Encode raw pixels to PNG.
 *
 * Options are pinned rather than left to sharp's defaults so the same pixels
 * produce the same bytes: T2.2's acceptance criterion is byte-level determinism
 * across runs, and a default that shifted between sharp releases would move the
 * output of every textured asset at once. `palette: false` matters most — sharp
 * may quantize to a palette when it thinks that is smaller, which is both
 * lossy and dependent on the encoder's own heuristics.
 */
async function encodePngFromRaw(raw: RawPixels): Promise<Uint8Array> {
  const sharp = (await import('sharp')).default;
  const out = await sharp(Buffer.from(raw.data.buffer, raw.data.byteOffset, raw.data.length), {
    raw: { width: raw.width, height: raw.height, channels: raw.channels },
  })
    .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
    .toBuffer();
  return new Uint8Array(out);
}

function hasTranslucentPixel(raw: RawPixels): boolean {
  if (raw.channels !== 4) return false;
  for (let i = 3; i < raw.data.length; i += 4) {
    if ((raw.data[i] ?? 255) < 255) return true;
  }
  return false;
}

function isTexture(value: unknown): value is THREE.Texture {
  return (value as THREE.Texture | undefined)?.isTexture === true;
}

/**
 * Encode every bakeable texture in the scene in place, and report what happened.
 *
 * Mutates `texture.userData` (adding `encoded` + `kilnTexture`) rather than
 * cloning, because the scene graph is handed straight to the bridge afterwards
 * and a clone would have to be re-attached to every slot that referenced it —
 * including the shared-texture case, where two materials point at one texture
 * and must keep doing so for the bridge's texture cache to dedupe them.
 *
 * A texture reachable from several slots is encoded once. The first slot that
 * reaches it decides the recorded `usage`, and slots are walked in a fixed
 * order over a deterministically-sorted scene traversal, so the choice is
 * stable across runs.
 *
 * @param root Scene root, traversed for meshes and their materials.
 * @param warnings Appended to, one line per texture that could not be baked.
 * @returns Provenance for each baked texture, sorted by name/slot.
 */
export async function bakeSceneTextures(
  root: THREE.Object3D,
  warnings: string[],
): Promise<BakedTextureProvenanceV1[]> {
  // Collect first, encode second: traversal is sync, encoding is not, and doing
  // them together would interleave awaits with a mutating walk.
  const pending: Array<{
    texture: THREE.Texture;
    material: string;
    slot: string;
    usage: TextureUsage;
  }> = [];
  const seen = new Set<THREE.Texture>();

  root.traverse((node) => {
    const material = (node as THREE.Mesh).material;
    const materials = Array.isArray(material) ? material : material ? [material] : [];
    for (const item of materials) {
      const bag = item as unknown as Record<string, unknown>;
      for (const [slot, usage] of SLOT_USAGE) {
        const texture = bag[slot];
        if (!isTexture(texture) || seen.has(texture)) continue;
        seen.add(texture);
        if ((texture.userData as Record<string, unknown>)['encoded']) continue;
        pending.push({
          texture,
          material: item.name || '(unnamed material)',
          slot,
          usage,
        });
      }
    }
  });

  const baked: BakedTextureProvenanceV1[] = [];
  for (const entry of pending) {
    const name = entry.texture.name || '(unnamed texture)';
    const raw = readPixels(entry.texture);
    if (typeof raw === 'string') {
      warnings.push(
        `Texture ${JSON.stringify(name)} on material ${JSON.stringify(entry.material)} (${entry.slot}) was dropped from the GLB: ${raw}.`,
      );
      continue;
    }

    let bytes: Uint8Array;
    try {
      bytes = await encodePngFromRaw(raw);
    } catch (err) {
      warnings.push(
        `Texture ${JSON.stringify(name)} on material ${JSON.stringify(entry.material)} (${entry.slot}) was dropped from the GLB: PNG encoding failed (${err instanceof Error ? err.message : String(err)}).`,
      );
      continue;
    }

    (entry.texture.userData as Record<string, unknown>)['encoded'] = {
      mime: 'image/png',
      bytes,
    } satisfies EncodedTextureData;
    // Describe what the texture IS, not what the slot wants — QA compares this
    // against `texture.colorSpace`, and reporting the slot's expectation here
    // would make a mismatched color space pass by asserting itself.
    (entry.texture.userData as Record<string, unknown>)['kilnTexture'] = {
      usage: entry.usage,
      colorSpace: entry.texture.colorSpace === THREE.SRGBColorSpace ? 'srgb' : 'linear',
      width: raw.width,
      height: raw.height,
      hasAlpha: hasTranslucentPixel(raw),
    } satisfies KilnTextureMetadata;

    baked.push({
      schemaVersion: 1,
      texture: name,
      material: entry.material,
      slot: entry.slot,
      usage: entry.usage,
      width: raw.width,
      height: raw.height,
      channels: raw.channels,
      bytes: bytes.length,
      sha1: createHash('sha1').update(bytes).digest('hex'),
    });
  }

  return baked.sort((a, b) => `${a.texture}:${a.slot}`.localeCompare(`${b.texture}:${b.slot}`));
}
