/**
 * Minimal PNG encoder + decoder (8-bit truecolor, no interlace) over node:zlib.
 *
 * Deliberately dependency-free: this module must load inside the kiln-studio
 * agent-runtime container and under Bun without native modules (sharp is NOT
 * acceptable here). ~150 lines is cheaper than a dependency. The decoder exists
 * so host-rendered per-view PNGs (PbrRenderPort) can be composited into the same
 * grids the CPU rasterizer emits; unsupported formats throw and callers degrade.
 */

import { deflateSync, inflateSync } from 'node:zlib';

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]!) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  out.set(data, 8);
  const crcInput = out.subarray(4, 8 + data.length);
  out.writeUInt32BE(crc32(crcInput), 8 + data.length);
  return out;
}

/** Encode a row-major RGB buffer (width*height*3 bytes) as a PNG. */
export function encodePng(rgb: Uint8Array, width: number, height: number): Buffer {
  if (rgb.length !== width * height * 3) {
    throw new Error(`encodePng: expected ${width * height * 3} bytes, got ${rgb.length}`);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Filter byte 0 (None) per scanline.
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 3);
    raw[rowStart] = 0;
    raw.set(rgb.subarray(y * width * 3, (y + 1) * width * 3), rowStart + 1);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', new Uint8Array(0)),
  ]);
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;

export interface DecodedPng {
  /** Row-major RGB bytes (width*height*3); RGBA sources drop alpha. */
  rgb: Uint8Array;
  width: number;
  height: number;
}

/**
 * Decode an 8-bit non-interlaced truecolor PNG (color type 2 RGB or 6 RGBA,
 * filters 0-4) into a row-major RGB buffer. Anything else — palettes, 16-bit,
 * grayscale, Adam7 — throws; the port-calling shell treats that as a degrade.
 */
export function decodePng(png: Uint8Array): DecodedPng {
  if (png.length < 8 || PNG_SIGNATURE.some((b, i) => png[i] !== b)) {
    throw new Error('decodePng: not a PNG (bad signature)');
  }
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  let sawIhdr = false;
  const idat: Buffer[] = [];

  let off = 8;
  while (off + 8 <= png.length) {
    const len = view.getUint32(off);
    const type = String.fromCharCode(png[off + 4]!, png[off + 5]!, png[off + 6]!, png[off + 7]!);
    const dataStart = off + 8;
    if (dataStart + len + 4 > png.length) throw new Error('decodePng: truncated chunk');
    if (type === 'IHDR') {
      width = view.getUint32(dataStart);
      height = view.getUint32(dataStart + 4);
      bitDepth = png[dataStart + 8]!;
      colorType = png[dataStart + 9]!;
      interlace = png[dataStart + 12]!;
      sawIhdr = true;
    } else if (type === 'IDAT') {
      idat.push(Buffer.from(png.subarray(dataStart, dataStart + len)));
    } else if (type === 'IEND') {
      break;
    }
    off = dataStart + len + 4;
  }

  if (!sawIhdr || idat.length === 0) throw new Error('decodePng: missing IHDR or IDAT');
  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6) || interlace !== 0) {
    throw new Error(
      `decodePng: unsupported PNG (bitDepth ${bitDepth}, colorType ${colorType}, interlace ` +
        `${interlace}); only 8-bit non-interlaced RGB/RGBA is supported`,
    );
  }
  if (width <= 0 || height <= 0) throw new Error('decodePng: empty image');

  const channels = colorType === 6 ? 4 : 3;
  const stride = width * channels;
  const raw = inflateSync(idat.length === 1 ? idat[0]! : Buffer.concat(idat));
  if (raw.length !== height * (1 + stride)) {
    throw new Error(`decodePng: expected ${height * (1 + stride)} raw bytes, got ${raw.length}`);
  }

  const rgb = new Uint8Array(width * height * 3);
  const cur = new Uint8Array(stride);
  const prior = new Uint8Array(stride); // zero-filled: the row above row 0
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + stride);
    const filter = raw[rowStart]!;
    if (filter > 4) throw new Error(`decodePng: unknown filter type ${filter}`);
    for (let i = 0; i < stride; i++) {
      const x = raw[rowStart + 1 + i]!;
      const a = i >= channels ? cur[i - channels]! : 0; // left
      const b = prior[i]!; // up
      let value: number;
      if (filter === 0) value = x;
      else if (filter === 1) value = x + a;
      else if (filter === 2) value = x + b;
      else if (filter === 3) value = x + ((a + b) >> 1);
      else {
        // Paeth
        const c = i >= channels ? prior[i - channels]! : 0; // up-left
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        value = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      }
      cur[i] = value & 0xff;
    }
    for (let px = 0; px < width; px++) {
      const src = px * channels;
      const dst = (y * width + px) * 3;
      rgb[dst] = cur[src]!;
      rgb[dst + 1] = cur[src + 1]!;
      rgb[dst + 2] = cur[src + 2]!;
    }
    prior.set(cur);
  }
  return { rgb, width, height };
}
