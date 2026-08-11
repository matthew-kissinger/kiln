/**
 * Model-authored procedural textures — T2.2
 *
 * ## Why a declarative spec and not a callback
 *
 * The obvious API is "give me a function and I will call it per pixel". It is
 * rejected here for the same reason `material-recipes.ts` resolves texture
 * slots through a closed approved-ID registry: the author of this code is an
 * untrusted model. A callback is arbitrary code with arbitrary cost and no
 * reviewable record of what it drew. A declarative layer stack is bounded
 * before a single pixel is written, recorded verbatim in provenance, and
 * reproducible from the manifest alone.
 *
 * Procedural content also sidesteps the licensing problem entirely: pixels
 * computed from numbers have no third-party provenance to track, unlike the
 * curated tiling library T2.1 has to license and ship.
 *
 * ## Determinism
 *
 * Every generator is a pure function of the spec. Noise uses an integer hash of
 * the lattice coordinate plus the seed — never `Math.random()`, which would
 * make the same asset code produce different bytes on every generation and
 * break the byte-identity fixtures the repo pins.
 *
 * Noise is also **tileable**: the lattice wraps at the cell period, so a
 * texture sampled with `RepeatWrapping` (which is what the loader sets, and
 * what a tiling material wants) does not show a seam where the pattern
 * restarts. Non-tiling noise is the usual reason a procedural material looks
 * fine on a test cube and obviously wrong on a wall.
 *
 * ## Color space
 *
 * Unlike `texture-bake.ts` — which must never guess, because it is handed
 * finished pixels whose meaning it cannot know — this function is told the
 * usage up front and therefore sets `colorSpace` itself, exactly as
 * `loadTexture` does. Getting it wrong here is an authoring error the QA gate
 * still catches.
 */

import * as THREE from 'three';
import {
  type CanonicalProceduralLayerV2,
  type CanonicalProceduralTextureSpecV2,
  type ProceduralBlend,
  type ProceduralTextureSpec,
  ProceduralTextureError,
  canonicalProceduralTextureJsonV2,
  canonicalizeProceduralTextureSpecV2,
  hashProceduralTextureSpecV2,
} from './procedural-material-v2';

export {
  MAX_NOISE_OCTAVES,
  MAX_PORTABLE_MATERIAL_TEXELS,
  MAX_PORTABLE_MATERIAL_TEXTURES,
  MAX_PROCEDURAL_LAYERS,
  MAX_PROCEDURAL_NAME_LENGTH,
  MAX_PROCEDURAL_PATTERN_COUNT,
  MAX_PROCEDURAL_SIZE,
  MIN_PROCEDURAL_SIZE,
  PORTABLE_MATERIAL_SPEC_VERSION,
  PROCEDURAL_TEXTURE_SPEC_VERSION,
  ProceduralTextureError,
  canonicalProceduralTextureJsonV2,
  canonicalizePortableMaterialSpecV2,
  canonicalizeProceduralTextureSpecV2,
  hashProceduralTextureSpecV2,
  migrateProceduralTextureSpecV1,
} from './procedural-material-v2';
export type {
  CanonicalPortableMaterialSpecV2,
  CanonicalPortableTextureRefV2,
  CanonicalProceduralLayerV2,
  CanonicalProceduralTextureSpecV2,
  PortableMaterialSpecV2,
  PortableTextureRefV2,
  ProceduralBlend,
  ProceduralLayer,
  ProceduralTextureSpec,
  ProceduralTextureSpecV1,
  ProceduralTextureSpecV2,
} from './procedural-material-v2';

// -----------------------------------------------------------------------------
// Deterministic value noise
// -----------------------------------------------------------------------------

/**
 * Integer hash of a lattice coordinate. Not a cryptographic hash — it only has
 * to decorrelate neighbouring integers and return the same value forever.
 */
function hash2(x: number, y: number, seed: number): number {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1274126177)) | 0;
  h = h ^ (h >>> 13);
  h = Math.imul(h, 1274126177) | 0;
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}

const smoothstep = (t: number): number => t * t * (3 - 2 * t);

/**
 * Value noise on a lattice that wraps at `period`, so the result tiles.
 * `period` is in lattice cells, and both axes use the same one.
 */
function valueNoise(u: number, v: number, period: number, seed: number): number {
  const x = u * period;
  const y = v * period;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  // Wrapping the lattice index (not the sample point) is what makes it tile:
  // the cell to the right of the last one is the first one again.
  const wrap = (n: number): number => ((n % period) + period) % period;
  const x0 = wrap(xi);
  const y0 = wrap(yi);
  const x1 = wrap(xi + 1);
  const y1 = wrap(yi + 1);
  const sx = smoothstep(xf);
  const sy = smoothstep(yf);
  const n00 = hash2(x0, y0, seed);
  const n10 = hash2(x1, y0, seed);
  const n01 = hash2(x0, y1, seed);
  const n11 = hash2(x1, y1, seed);
  const top = n00 + sx * (n10 - n00);
  const bottom = n01 + sx * (n11 - n01);
  return top + sy * (bottom - top);
}

function fbm(u: number, v: number, period: number, octaves: number, seed: number): number {
  let sum = 0;
  let amplitude = 1;
  let total = 0;
  let p = period;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise(u, v, p, seed + o * 101) * amplitude;
    total += amplitude;
    amplitude *= 0.5;
    // Doubling the period keeps every octave tileable at the base period.
    p *= 2;
  }
  return total > 0 ? sum / total : 0;
}

// -----------------------------------------------------------------------------
// Layer evaluation
// -----------------------------------------------------------------------------

const rgbOf = (color: number): [number, number, number] => [
  (color >> 16) & 0xff,
  (color >> 8) & 0xff,
  color & 0xff,
];

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Rotate normalized coords about the center so angled patterns stay centered. */
function project(u: number, v: number, angleDeg: number): number {
  const a = (angleDeg * Math.PI) / 180;
  return (u - 0.5) * Math.cos(a) + (v - 0.5) * Math.sin(a) + 0.5;
}

/** Evaluate one layer at a normalized coordinate, returning 0-255 RGB. */
function evalLayer(
  layer: CanonicalProceduralLayerV2,
  u: number,
  v: number,
): [number, number, number] {
  switch (layer.op) {
    case 'solid':
      return rgbOf(layer.color);

    case 'checker': {
      const cx = Math.floor(u * layer.squares);
      const cy = Math.floor(v * layer.squares);
      return rgbOf((cx + cy) % 2 === 0 ? layer.colorA : layer.colorB);
    }

    case 'stripes': {
      const t = project(u, v, layer.angleDeg);
      return rgbOf(Math.floor(t * layer.count) % 2 === 0 ? layer.colorA : layer.colorB);
    }

    case 'gradient': {
      const t = Math.min(1, Math.max(0, project(u, v, layer.angleDeg)));
      const from = rgbOf(layer.from);
      const to = rgbOf(layer.to);
      return [lerp(from[0], to[0], t), lerp(from[1], to[1], t), lerp(from[2], to[2], t)];
    }

    case 'bricks': {
      const row = Math.floor(v * layer.rows);
      // Offset alternate rows, wrapping into [0,1) so the pattern still tiles.
      const shifted = (u + (row % 2 === 0 ? 0 : layer.stagger / layer.cols) + 1) % 1;
      const inCol = (shifted * layer.cols) % 1;
      const inRow = (v * layer.rows) % 1;
      const isMortar =
        inCol < layer.mortarWidth ||
        inCol > 1 - layer.mortarWidth ||
        inRow < layer.mortarWidth ||
        inRow > 1 - layer.mortarWidth;
      return rgbOf(isMortar ? layer.mortar : layer.brick);
    }

    case 'noise': {
      const n = fbm(u, v, layer.scale, layer.octaves, layer.seed);
      const a = rgbOf(layer.colorA);
      const b = rgbOf(layer.colorB);
      return [lerp(a[0], b[0], n), lerp(a[1], b[1], n), lerp(a[2], b[2], n)];
    }
  }
}

function blendChannel(mode: ProceduralBlend, base: number, top: number): number {
  const b = base / 255;
  const t = top / 255;
  let out: number;
  switch (mode) {
    case 'multiply':
      out = b * t;
      break;
    case 'screen':
      out = 1 - (1 - b) * (1 - t);
      break;
    case 'overlay':
      out = b < 0.5 ? 2 * b * t : 1 - 2 * (1 - b) * (1 - t);
      break;
    default:
      out = t;
  }
  return out * 255;
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Build a tiling texture from a bounded, deterministic layer stack.
 *
 * The result is a plain RGBA `DataTexture`; `renderSceneToGLB` bakes it to PNG
 * and embeds it, so nothing else has to be done to ship it.
 *
 * @example
 * const bark = proceduralTexture({
 *   schemaVersion: 2,
 *   size: 256,
 *   usage: 'albedo',
 *   name: 'Bark',
 *   layers: [
 *     { op: 'solid', color: 0x5a4632 },
 *     { op: 'noise', colorA: 0x3d2f21, colorB: 0x7a6248, scale: 6, octaves: 4, blend: 'overlay' },
 *     { op: 'stripes', colorA: 0x000000, colorB: 0xffffff, count: 24, angleDeg: 90,
 *       blend: 'multiply', opacity: 0.15 },
 *   ],
 * });
 * const trunk = createPart('Trunk', cylinderGeo(0.3, 0.3, 3), pbrMaterial({ albedo: bark }), { parent: root });
 */
export interface CompiledProceduralTextureV2 {
  spec: CanonicalProceduralTextureSpecV2;
  pixels: Uint8Array;
  canonicalJson: string;
  recipeHash: `sha256:${string}`;
}

/** Validate, canonicalize, and compile one texture without constructing Three.js state. */
export function compileProceduralTextureSpecV2(input: unknown): CompiledProceduralTextureV2 {
  const spec = canonicalizeProceduralTextureSpecV2(input);
  const { size, layers } = spec;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    // Sample at texel centers so a pattern with N divisions lands on exact
    // boundaries instead of drifting half a texel.
    const v = (y + 0.5) / size;
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size;
      let r = 0;
      let g = 0;
      let b = 0;
      for (const [i, layer] of layers.entries()) {
        const [lr, lg, lb] = evalLayer(layer, u, v);
        if (i === 0) {
          r = lr;
          g = lg;
          b = lb;
          continue;
        }
        r = lerp(r, blendChannel(layer.blend, r, lr), layer.opacity);
        g = lerp(g, blendChannel(layer.blend, g, lg), layer.opacity);
        b = lerp(b, blendChannel(layer.blend, b, lb), layer.opacity);
      }
      const o = (y * size + x) * 4;
      data[o] = Math.max(0, Math.min(255, Math.round(r)));
      data[o + 1] = Math.max(0, Math.min(255, Math.round(g)));
      data[o + 2] = Math.max(0, Math.min(255, Math.round(b)));
      data[o + 3] = 255;
    }
  }

  return {
    spec,
    pixels: data,
    canonicalJson: canonicalProceduralTextureJsonV2(spec),
    recipeHash: hashProceduralTextureSpecV2(spec),
  };
}

export function proceduralTexture(spec: ProceduralTextureSpec): THREE.DataTexture {
  const compiled = compileProceduralTextureSpecV2(spec);
  const { size, usage, name, layers } = compiled.spec;

  const tex = new THREE.DataTexture(
    compiled.pixels,
    size,
    size,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
  );
  if (name) tex.name = name;
  tex.colorSpace =
    usage === 'albedo' || usage === 'emissive' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;

  // Recorded so the manifest says what was generated, not merely that something
  // was. The spec is small, serializable, and enough to reproduce the bytes.
  (tex.userData as Record<string, unknown>)['kilnProcedural'] = {
    schemaVersion: 2,
    size,
    usage,
    ...(name ? { name } : {}),
    layers,
    canonicalJson: compiled.canonicalJson,
    recipeHash: compiled.recipeHash,
  };

  return tex;
}

/**
 * Derive a tangent-space normal map from the luminance of another texture.
 *
 * This is the cheap way to get PBR surface detail out of a procedural albedo:
 * treat brightness as height and take its gradient. Sampling wraps, so a
 * tiling source yields a tiling normal map.
 *
 * The output is linear data, never sRGB — a normal map holds vectors, not
 * color, and tagging it sRGB is the single most common way to get PBR lighting
 * subtly wrong.
 *
 * @param source Any texture with readable 8-bit RGB/RGBA pixels.
 * @param opts.strength Height scale. 1 is subtle; 4-8 reads clearly. Default 2.
 */
export function normalMapFromHeight(
  source: THREE.Texture,
  opts: { strength?: number; name?: string } = {},
): THREE.DataTexture {
  const image = source.image as
    | { data?: ArrayLike<number>; width?: number; height?: number }
    | undefined;
  const data = image?.data;
  const width = image?.width ?? 0;
  const height = image?.height ?? 0;
  if (!data || !width || !height) {
    throw new ProceduralTextureError(
      'normalMapFromHeight: the source texture has no readable pixels. Pass a proceduralTexture() result or a loadTexture() result, not a texture built from an image element.',
    );
  }
  const channels = data.length / (width * height);
  if (channels !== 3 && channels !== 4) {
    throw new ProceduralTextureError(
      `normalMapFromHeight: the source has ${data.length} bytes for ${width}x${height}, which is neither RGB nor RGBA.`,
    );
  }

  const strength = opts.strength ?? 2;
  if (!Number.isFinite(strength) || strength <= 0) {
    throw new ProceduralTextureError(
      `normalMapFromHeight: strength must be a positive number, got ${JSON.stringify(opts.strength)}.`,
    );
  }

  const lum = (x: number, y: number): number => {
    const xw = ((x % width) + width) % width;
    const yw = ((y % height) + height) % height;
    const o = (yw * width + xw) * channels;
    // Rec. 601 luma — matches how the eye reads the albedo this is derived from.
    return (0.299 * (data[o] ?? 0) + 0.587 * (data[o + 1] ?? 0) + 0.114 * (data[o + 2] ?? 0)) / 255;
  };

  const out = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Central differences; the wrap in `lum` is what keeps the edges seamless.
      const dx = (lum(x + 1, y) - lum(x - 1, y)) * strength;
      const dy = (lum(x, y + 1) - lum(x, y - 1)) * strength;
      // Gradient of a height field gives the surface normal as (-dx, -dy, 1).
      let nx = -dx;
      let ny = -dy;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      const o = (y * width + x) * 4;
      out[o] = Math.round((nx * 0.5 + 0.5) * 255);
      out[o + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      out[o + 2] = Math.round((nz / len) * 0.5 * 255 + 127.5);
      out[o + 3] = 255;
    }
  }

  const tex = new THREE.DataTexture(out, width, height, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.name = opts.name ?? (source.name ? `${source.name}_Normal` : '');
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}
