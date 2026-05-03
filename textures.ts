/**
 * Kiln texture loading + PBR material — Wave 3B
 *
 * Loads image files (PNG/JPG/WebP) into Three.js Textures suitable for
 * MeshStandardMaterial slots (albedo / normal / roughness / metalness /
 * emissive). Works in Node via sharp (already a dep); the original
 * encoded bytes are stashed on `texture.userData.encoded` so the GLB
 * bridge can re-serialize without re-encoding.
 */

import * as THREE from 'three';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

export type TextureSource = string | Buffer | Uint8Array;

export interface EncodedTextureData {
  mime: 'image/png' | 'image/jpeg' | 'image/webp';
  bytes: Uint8Array;
}

/**
 * Load an image into a Three.js Texture. Accepts a file path, a Buffer,
 * or a Uint8Array of encoded bytes.
 *
 * The returned texture has:
 *   - a decoded RGBA DataTexture (for runtime preview in the editor)
 *   - `userData.encoded = { mime, bytes }` — original encoded bytes, used
 *     by the GLB bridge so we don't re-encode PNG on every export.
 *
 * @example
 * const wood = await loadTexture('./textures/oak-albedo.png');
 * const barrel = new THREE.Mesh(unwrapped, pbrMaterial({ albedo: wood }));
 */
export async function loadTexture(source: TextureSource): Promise<THREE.DataTexture> {
  let bytes: Uint8Array;
  if (typeof source === 'string') {
    const abs = path.isAbsolute(source) ? source : path.resolve(source);
    bytes = new Uint8Array(readFileSync(abs));
  } else if (Buffer.isBuffer(source)) {
    bytes = new Uint8Array(source);
  } else {
    bytes = source;
  }

  const mime = sniffMime(bytes);

  // Decode to RGBA via sharp so we have a live Texture for editor preview
  // and for any client-side work (projection baking, normal-map inspect).
  const img = sharp(bytes);
  const meta = await img.metadata();
  const { data } = await img
    .ensureAlpha()
    .raw({ depth: 'uchar' })
    .toBuffer({ resolveWithObject: true });

  if (!meta.width || !meta.height) {
    throw new Error('loadTexture: could not read image dimensions');
  }

  const tex = new THREE.DataTexture(
    new Uint8Array(data),
    meta.width,
    meta.height,
    THREE.RGBAFormat,
    THREE.UnsignedByteType
  );
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;

  (tex.userData as Record<string, unknown>)['encoded'] = {
    mime,
    bytes,
  } satisfies EncodedTextureData;

  return tex;
}

function sniffMime(bytes: Uint8Array): EncodedTextureData['mime'] {
  // PNG magic: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png';
  }
  // JPEG magic: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  // WebP magic: "RIFF????WEBP"
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  // Default to PNG — safe for sharp to re-encode if ever needed.
  return 'image/png';
}

// =============================================================================
// PBR material primitive
// =============================================================================

export interface PbrMaterialOptions {
  /** Base color — either a hex color or a Texture (albedo map). */
  albedo?: number | string | THREE.Texture;
  /** Normal map Texture. */
  normal?: THREE.Texture;
  /** Roughness: scalar [0,1] or Texture (R channel). */
  roughness?: number | THREE.Texture;
  /** Metalness: scalar [0,1] or Texture (R channel). */
  metalness?: number | THREE.Texture;
  /** Emissive: hex color or Texture. */
  emissive?: number | string | THREE.Texture;
  /** Emissive intensity multiplier. */
  emissiveIntensity?: number;
  /** Ambient occlusion map Texture (R channel). */
  aoMap?: THREE.Texture;
  /** AO intensity [0,1]. Default 1. */
  aoMapIntensity?: number;
}

/**
 * Full PBR material. Any of the slots can be a Texture or a scalar/color.
 * Maps to MeshStandardMaterial and exports as glTF pbrMetallicRoughness.
 *
 * @example
 * const wood = await loadTexture('./textures/oak-albedo.png');
 * const crate = pbrMaterial({ albedo: wood, roughness: 0.85, metalness: 0 });
 */
export function pbrMaterial(opts: PbrMaterialOptions = {}): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial();

  // Duck-typed `.isTexture` — sandbox-created textures may belong to a
  // different module realm. See render.ts cross-module-THREE comment.
  const isTex = (v: unknown): v is THREE.Texture =>
    !!(v as { isTexture?: boolean } | null)?.isTexture;

  if (isTex(opts.albedo)) {
    mat.map = opts.albedo;
    mat.color = new THREE.Color(0xffffff);
  } else if (opts.albedo !== undefined) {
    mat.color = new THREE.Color(opts.albedo as number | string);
  }

  if (opts.normal) mat.normalMap = opts.normal;

  if (isTex(opts.roughness)) {
    mat.roughnessMap = opts.roughness;
    mat.roughness = 1;
  } else if (opts.roughness !== undefined) {
    mat.roughness = opts.roughness as number;
  } else {
    mat.roughness = 0.8;
  }

  if (isTex(opts.metalness)) {
    mat.metalnessMap = opts.metalness;
    mat.metalness = 1;
  } else if (opts.metalness !== undefined) {
    mat.metalness = opts.metalness as number;
  }

  if (isTex(opts.emissive)) {
    mat.emissiveMap = opts.emissive;
    mat.emissive = new THREE.Color(0xffffff);
  } else if (opts.emissive !== undefined) {
    mat.emissive = new THREE.Color(opts.emissive as number | string);
  }
  if (opts.emissiveIntensity !== undefined) {
    mat.emissiveIntensity = opts.emissiveIntensity;
  }

  if (opts.aoMap) mat.aoMap = opts.aoMap;
  if (opts.aoMapIntensity !== undefined) mat.aoMapIntensity = opts.aoMapIntensity;

  return mat;
}
