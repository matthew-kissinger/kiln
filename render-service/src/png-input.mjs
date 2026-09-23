import { crc32, inflateSync } from 'node:zlib';

const fail = (message, status = 400) => Object.assign(new Error(`GLB: PNG ${message}`), { status });
const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
const DEPTHS = { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] };
const ADAM7 = [
  [0, 0, 8, 8],
  [4, 0, 8, 8],
  [0, 4, 4, 8],
  [2, 0, 4, 4],
  [0, 2, 2, 4],
  [1, 0, 2, 2],
  [0, 1, 1, 2],
];

/** Inspect before pngjs allocation, including its otherwise unbounded Adam7 inflate path. */
export function inspectPng(bytes, { maxDimension, maxPixels }) {
  if (
    bytes.length < 33 ||
    !bytes.subarray(0, 8).equals(SIGNATURE) ||
    bytes.readUInt32BE(8) !== 13 ||
    bytes.toString('ascii', 12, 16) !== 'IHDR'
  )
    throw fail('requires a complete IHDR chunk');
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (!width || !height || width > maxDimension || height > maxDimension)
    throw fail('image dimensions exceed budget', 413);
  if (width * height > maxPixels) throw fail('decoded image pixel budget exceeded', 413);
  const depth = bytes[24];
  const color = bytes[25];
  const interlace = bytes[28];
  if (!DEPTHS[color]?.includes(depth) || bytes[26] !== 0 || bytes[27] !== 0 || interlace > 1)
    throw fail('unsupported IHDR encoding');
  let offset = 8;
  let ended = false;
  const compressed = [];
  while (offset < bytes.length) {
    if (offset + 12 > bytes.length || ended) throw fail('truncated or trailing chunk');
    const length = bytes.readUInt32BE(offset);
    const end = offset + 12 + length;
    if (end > bytes.length) throw fail('truncated chunk');
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    if (crc32(bytes.subarray(offset + 4, end - 4)) !== bytes.readUInt32BE(end - 4))
      throw fail('chunk CRC mismatch');
    if (type === 'IHDR' && offset !== 8) throw fail('duplicate IHDR chunk');
    if (type === 'IDAT') compressed.push(bytes.subarray(offset + 8, end - 4));
    if (type === 'IEND') {
      if (length !== 0) throw fail('invalid IEND chunk');
      ended = true;
    }
    offset = end;
  }
  if (!ended || !compressed.length) throw fail('missing IDAT or IEND chunk');
  // pngjs bounds normal scanlines, but invokes plain zlib.inflateSync for
  // interlaced inputs. Check exact scanline length with an allocation ceiling
  // first. Valid interlaced PNGs retain their existing support.
  if (interlace) {
    let scanlineBytes = 0;
    for (const [x, y, dx, dy] of ADAM7) {
      const columns = Math.max(0, Math.ceil((width - x) / dx));
      const rows = Math.max(0, Math.ceil((height - y) / dy));
      if (columns && rows)
        scanlineBytes += (Math.ceil((columns * CHANNELS[color] * depth) / 8) + 1) * rows;
    }
    let inflated;
    try {
      inflated = inflateSync(Buffer.concat(compressed), { maxOutputLength: scanlineBytes });
    } catch {
      throw fail('inflate exceeds scanline budget or contains invalid compressed data');
    }
    if (inflated.length !== scanlineBytes)
      throw fail('inflate length does not match scanline budget');
  }
  return width * height;
}
