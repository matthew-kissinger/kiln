import { createHash } from 'node:crypto';
import { exportAssetGlb } from '../../src/asset-export';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

// Use the same delivery profile as CLI/MCP. Gallery IDs are scoped to this
// collection; the revision and source hashes identify the downloadable originals.
export async function galleryRuntimeDownload(name, source, glb) {
  if (!/^[a-z0-9-]{1,60}$/.test(name)) throw new Error('Invalid gallery asset name');
  const files = { 'asset.glb': glb, 'source.kiln.js': new TextEncoder().encode(source) };
  const record = {
    manifest: {
      version: 'kiln.asset.v1',
      assetId: `gallery_${name}`,
      revisionId: `r_${hash(glb)}`,
      name,
      tags: [],
      // This transient record is created during the build, not an authorship date.
      createdAt: new Date().toISOString(),
      editable: true,
      files: Object.fromEntries(Object.entries(files).map(([file, bytes]) => [file, {
        bytes: bytes.length, sha256: `sha256:${hash(bytes)}`,
      }])),
    },
    files,
  };
  const output = await exportAssetGlb(record, {
    profile: 'runtime', metadataFileName: `${name}.runtime.kiln-metadata.json`,
  });
  const index = {
    file: `assets/${name}.runtime.glb`, bytes: output.glb.length, sha256: hash(output.glb),
    metadata: {
      file: `assets/${output.metadata.name}`, bytes: output.metadata.bytes.length,
      sha256: hash(output.metadata.bytes),
    },
  };
  return { index, glb: output.glb, metadata: output.metadata.bytes };
}
