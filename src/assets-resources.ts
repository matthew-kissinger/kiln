import { encodeAssetBundle, type AssetLibrary, type AssetManifest } from './assets';

export interface AssetLink {
  type: 'resource_link';
  name: string;
  uri: string;
  mimeType: string;
}
export function assetLinks(collection: string, manifest: AssetManifest): AssetLink[] {
  return [...Object.keys(manifest.files), 'manifest.json', 'editable.zip'].map((name) => ({
    type: 'resource_link',
    name,
    uri: `kiln://assets/${collection}/${manifest.assetId}/${manifest.revisionId}/${name}`,
    mimeType: assetMime(name),
  }));
}
export function assetMime(name: string): string {
  return name.endsWith('.glb')
    ? 'model/gltf-binary'
    : name.endsWith('.png')
      ? 'image/png'
      : name.endsWith('.zip')
        ? 'application/zip'
        : name.endsWith('.json')
          ? 'application/json'
          : 'text/javascript';
}
export async function readAssetResource(
  library: AssetLibrary,
  uri: string,
): Promise<{ bytes: Uint8Array; mimeType: string; name: string }> {
  const match =
    /^kiln:\/\/assets\/([a-z][a-z0-9_-]{0,79})\/([a-z][a-z0-9_-]{0,79})\/([a-z][a-z0-9_-]{0,79})\/(asset\.glb|source\.kiln\.js|preview\.png|manifest\.json|editable\.zip)$/.exec(
      uri,
    );
  if (!match) throw new Error('Unknown asset resource');
  const collection = match[1]!;
  const asset = match[2]!;
  const revision = match[3]!;
  const name = match[4]!;
  const record = await library.read(collection, asset, revision);
  const bytes =
    name === 'editable.zip'
      ? encodeAssetBundle([record])
      : name === 'manifest.json'
        ? new TextEncoder().encode(JSON.stringify(record.manifest, null, 2))
        : record.files[name];
  if (!bytes) throw new Error('Asset file unavailable');
  return { bytes, mimeType: assetMime(name), name };
}
