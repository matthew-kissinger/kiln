/** MCP-only presentation payload; binary files never enter model-facing tool text. */
import { readFile } from 'node:fs/promises';
import type { AssetLibrary } from './assets';
import { encodeWidgetFiles, WIDGET_TRANSFER_LIMIT } from './widget-transfer';

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
  if (
    Object.values(record.files).reduce((sum, bytes) => sum + bytes.length, 0) >
    WIDGET_TRANSFER_LIMIT
  )
    return {
      kilnAsset: {
        error: 'This asset exceeds the 16 MiB chat preview limit. Open it with kiln view.',
      },
    };
  return {
    kilnAsset: {
      manifest: record.manifest,
      downloadUrls: selector.downloadUrls,
      files: encodeWidgetFiles(record.files),
    },
  };
}
export async function readAssetWidgetHtml(): Promise<string> {
  return readFile(new URL('../dist/viewer/chat.html', import.meta.url), 'utf8');
}
