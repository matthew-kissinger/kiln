import { expect, test } from 'bun:test';
import type { AssetManifest } from '../assets';
import { assetAttributionRows } from './attribution';

const manifest = (attribution?: AssetManifest['attribution']) => ({ attribution }) as AssetManifest;

test('viewer attribution labels the model and harness instead of burying them in JSON', () => {
  expect(
    assetAttributionRows(
      manifest({ model: 'gpt-5.6-luna', harness: 'codex', author: 'Kiln dogfood' }),
    ),
  ).toEqual([
    { label: 'Model', value: 'gpt-5.6-luna' },
    { label: 'Harness', value: 'codex' },
    { label: 'Author', value: 'Kiln dogfood' },
  ]);
  expect(assetAttributionRows(manifest())).toEqual([]);
});
