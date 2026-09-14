import type { AssetManifest } from '../assets';

export interface AssetAttributionRow {
  label: 'Model' | 'Harness' | 'Author';
  value: string;
}

/** Compact, user-visible provenance for the viewer; the full manifest remains available below. */
export function assetAttributionRows(manifest: AssetManifest): AssetAttributionRow[] {
  const attribution = manifest.attribution;
  if (!attribution) return [];
  return [
    attribution.model ? { label: 'Model' as const, value: attribution.model } : null,
    attribution.harness ? { label: 'Harness' as const, value: attribution.harness } : null,
    attribution.author ? { label: 'Author' as const, value: attribution.author } : null,
  ].filter((row): row is AssetAttributionRow => row !== null);
}
