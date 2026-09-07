/** MCP-only presentation payload; binary files never enter model-facing tool text. */
import { readFile } from 'node:fs/promises';
import type { AssetLibrary } from './assets';

export async function assetWidgetData(
  library: AssetLibrary,
  selector: {
    collection: string;
    downloadUrls?: Record<string, string>;
    asset: { assetId: string; revisionId: string };
  },
): Promise<Record<string, unknown>> {
  const record = await library.read(
    selector.collection,
    selector.asset.assetId,
    selector.asset.revisionId,
  );
  if (Object.values(record.files).reduce((sum, bytes) => sum + bytes.length, 0) > 16 * 1024 * 1024)
    return {
      kilnAsset: {
        error: 'This asset exceeds the 16 MiB chat preview limit. Open it with kiln view.',
      },
    };
  return {
    kilnAsset: {
      manifest: record.manifest,
      downloadUrls: selector.downloadUrls,
      files: Object.fromEntries(
        Object.entries(record.files).map(([name, bytes]) => [
          name,
          Buffer.from(bytes).toString('base64'),
        ]),
      ),
    },
  };
}
export async function readAssetWidgetHtml(): Promise<string> {
  return readFile(new URL('../dist/viewer/chat.html', import.meta.url), 'utf8');
}
