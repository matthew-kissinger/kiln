/** Browser-safe, lossless presentation transport. Stored asset bytes never change. */
import { deflateSync, inflateSync } from 'three/addons/libs/fflate.module.js';
import { assetManifestSchema, type AssetRecord } from './assets';

export const WIDGET_TRANSFER_LIMIT = 16 * 1024 * 1024;
const ENCODED_LIMIT = Math.ceil(WIDGET_TRANSFER_LIMIT / 3) * 4;
type EncodedFile = string | { encoding: 'kiln.deflate-base64.v1'; data: string };
const invalid = (detail: string): never => {
  throw new Error(
    `Asset transfer ${detail}. Present the saved asset again or open it in Kiln; the saved files are unchanged.`,
  );
};
function base64(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 8192)
    binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
  return btoa(binary);
}
function unbase64(data: unknown): Uint8Array {
  if (typeof data !== 'string' || data.length > ENCODED_LIMIT)
    return invalid('exceeds the encoded size limit');
  if (data.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(data))
    invalid('contains damaged base64 data');
  let binary: string;
  try {
    binary = atob(data);
  } catch {
    return invalid('contains damaged base64 data');
  }
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  if (base64(bytes) !== data) invalid('contains noncanonical base64 data');
  return bytes;
}
export function encodeWidgetFiles(files: AssetRecord['files']): Record<string, EncodedFile> {
  if (
    Object.values(files).reduce((total, bytes) => total + bytes.length, 0) > WIDGET_TRANSFER_LIMIT
  )
    invalid('exceeds the decoded size limit');
  return Object.fromEntries(
    Object.entries(files).map(([name, bytes]) => {
      const plain = base64(bytes);
      const compressed = base64(deflateSync(bytes, { level: 6 }));
      return [
        name,
        compressed.length + 64 < plain.length
          ? { encoding: 'kiln.deflate-base64.v1' as const, data: compressed }
          : plain,
      ];
    }),
  );
}
function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
export async function decodeWidgetAsset(value: unknown): Promise<{
  record: AssetRecord;
  downloadUrls: Record<string, string>;
}> {
  if (!object(value)) return invalid('metadata is missing');
  if (typeof value.error === 'string') throw new Error(value.error);
  const parsed = assetManifestSchema.safeParse(value.manifest);
  if (!parsed.success || !object(value.files)) return invalid('metadata is malformed');
  const manifest = parsed.data;
  const entries = Object.entries(value.files);
  if (!entries.length || entries.length > 16 || !Object.hasOwn(value.files, 'asset.glb'))
    return invalid('file list is missing or invalid');
  let declaredBytes = 0;
  let encodedBytes = 0;
  for (const [name, entry] of entries) {
    if (!/^[a-z0-9][a-z0-9._-]{0,127}$/.test(name) || !Object.hasOwn(manifest.files, name))
      return invalid('file metadata is missing');
    declaredBytes += manifest.files[name]!.bytes;
    if (declaredBytes > WIDGET_TRANSFER_LIMIT) return invalid('exceeds the decoded size limit');
    const data = typeof entry === 'string' ? entry : object(entry) ? entry.data : undefined;
    if (typeof data !== 'string') return invalid('file encoding is malformed');
    encodedBytes += data.length;
    if (encodedBytes > ENCODED_LIMIT) return invalid('exceeds the encoded size limit');
  }
  // A fixed output buffer bounds allocation even when the compressed stream lies
  // about its expansion. The extra byte detects expansion beyond the manifest.
  const files: AssetRecord['files'] = {};
  for (const [name, entry] of entries) {
    const expected = manifest.files[name]!;
    let bytes: Uint8Array;
    if (typeof entry === 'string') bytes = unbase64(entry);
    else {
      if (!object(entry) || entry.encoding !== 'kiln.deflate-base64.v1')
        return invalid('encoding is unsupported');
      const compressed = unbase64(entry.data);
      try {
        bytes = inflateSync(compressed, { out: new Uint8Array(expected.bytes + 1) });
      } catch {
        return invalid('compressed data is damaged');
      }
    }
    if (bytes.length !== expected.bytes) return invalid('byte count does not match the saved file');
    const digest = await crypto.subtle.digest('SHA-256', Uint8Array.from(bytes));
    const hex = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('');
    if (`sha256:${hex}` !== expected.sha256) return invalid('integrity check failed');
    files[name] = bytes;
  }
  for (const name of Object.keys(manifest.files))
    if (!Object.hasOwn(files, name)) return invalid('is missing a saved file');
  const downloadUrls: Record<string, string> = {};
  if (value.downloadUrls !== undefined) {
    if (!object(value.downloadUrls)) return invalid('download metadata is malformed');
    for (const [name, url] of Object.entries(value.downloadUrls)) {
      if (typeof url !== 'string') return invalid('download metadata is malformed');
      downloadUrls[name] = url;
    }
  }
  return { record: { manifest, files }, downloadUrls };
}
