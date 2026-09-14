export type AssetViewerSelection = {
  collection: string;
  assetId: string;
  revisionId: string;
};

const idPattern = /^[a-z][a-z0-9_-]{0,79}$/u;
const revisionPattern = /^r_[a-z0-9_-]{1,77}$/u;

export function assetViewerSelection(search: string): AssetViewerSelection | undefined {
  const params = new URLSearchParams(search);
  const collection = params.get('collection');
  const assetId = params.get('asset');
  const revisionId = params.get('revision');
  if (
    !collection ||
    !assetId ||
    !revisionId ||
    !idPattern.test(collection) ||
    !idPattern.test(assetId) ||
    !revisionPattern.test(revisionId)
  )
    return undefined;
  return { collection, assetId, revisionId };
}

export function assetViewerHref(base: string, selection: AssetViewerSelection): string {
  const url = new URL(base);
  url.searchParams.set('collection', selection.collection);
  url.searchParams.set('asset', selection.assetId);
  url.searchParams.set('revision', selection.revisionId);
  if (!assetViewerSelection(url.search)) throw new Error('Invalid asset viewer selection');
  return url.href;
}
