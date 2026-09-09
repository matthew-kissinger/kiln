import { describe, expect, it } from 'bun:test';
import { deflateSync } from 'three/addons/libs/fflate.module.js';
import type { AssetRecord } from './assets';
import { decodeWidgetAsset, encodeWidgetFiles, WIDGET_TRANSFER_LIMIT } from './widget-transfer';

async function fixture(): Promise<AssetRecord> {
  const files = {
    'asset.glb': new Uint8Array(4096).fill(17),
    'source.kiln.js': new TextEncoder().encode('const source = "Exact source bytes";'),
    'preview.png': new Uint8Array([0, 255, 1, 2, 3, 128]),
  };
  const entries = await Promise.all(
    Object.entries(files).map(async ([name, bytes]) => [
      name,
      {
        bytes: bytes.length,
        sha256: `sha256:${Buffer.from(await crypto.subtle.digest('SHA-256', bytes)).toString('hex')}`,
      },
    ]),
  );
  return {
    manifest: {
      version: 'kiln.asset.v1',
      assetId: 'a_test',
      revisionId: 'r_test',
      name: 'Transfer fixture',
      tags: [],
      createdAt: '2026-09-08T00:00:00.000Z',
      editable: true,
      files: Object.fromEntries(entries),
    },
    files,
  };
}
function legacy(record: AssetRecord) {
  return {
    manifest: record.manifest,
    files: Object.fromEntries(
      Object.entries(record.files).map(([name, bytes]) => [
        name,
        Buffer.from(bytes).toString('base64'),
      ]),
    ),
  };
}
describe('widget asset transfer', () => {
  it('losslessly roundtrips compressed GLB, source and preview bytes', async () => {
    const record = await fixture();
    const files = encodeWidgetFiles(record.files);
    expect(typeof files['asset.glb']).toBe('object');
    const decoded = await decodeWidgetAsset({ manifest: record.manifest, files });
    expect(decoded.record).toEqual(record);
  });
  it('reads legacy plain base64 without changing any bytes', async () => {
    const record = await fixture();
    expect((await decodeWidgetAsset(legacy(record))).record).toEqual(record);
  });
  it('rejects the observed non-Latin1 transfer error and truncated base64', async () => {
    const record = await fixture();
    for (const value of [
      'AAAA…AAAA',
      Buffer.from(record.files['asset.glb']!).toString('base64').slice(0, -1),
    ]) {
      const payload = legacy(record);
      payload.files['asset.glb'] = value;
      await expect(decodeWidgetAsset(payload)).rejects.toThrow('transfer');
    }
  });
  it('rejects corrupt, truncated and oversized compressed data', async () => {
    const record = await fixture();
    const files = encodeWidgetFiles(record.files);
    const compressed = files['asset.glb'] as { encoding: string; data: string };
    for (const data of [
      compressed.data.slice(0, -4),
      Buffer.from([255, 255, 255]).toString('base64'),
      Buffer.from(deflateSync(new Uint8Array(8192).fill(17))).toString('base64'),
    ]) {
      await expect(
        decodeWidgetAsset({
          manifest: record.manifest,
          files: { ...files, 'asset.glb': { ...compressed, data } },
        }),
      ).rejects.toThrow('transfer');
    }
    const bad = structuredClone(record.manifest);
    bad.files['asset.glb']!.bytes = WIDGET_TRANSFER_LIMIT + 1;
    await expect(decodeWidgetAsset({ manifest: bad, files })).rejects.toThrow('limit');
  });
  it('rejects valid-length corruption via manifest hashes', async () => {
    const record = await fixture();
    const payload = legacy(record);
    payload.files['asset.glb'] = Buffer.from(new Uint8Array(4096).fill(18)).toString('base64');
    await expect(decodeWidgetAsset(payload)).rejects.toThrow('integrity');
  });
  it('rejects malformed/missing metadata and unknown encoding', async () => {
    const record = await fixture();
    for (const payload of [
      undefined,
      null,
      {},
      { manifest: record.manifest, files: [] },
      { manifest: record.manifest, files: {} },
      {
        manifest: record.manifest,
        files: { ...legacy(record).files, 'asset.glb': { encoding: 'unknown', data: 'AAAA' } },
      },
    ])
      await expect(decodeWidgetAsset(payload)).rejects.toThrow('transfer');
  });
  it('enforces aggregate decoded and encoded bounds before decoding', async () => {
    const record = await fixture();
    const payload = legacy(record);
    const manifest = structuredClone(record.manifest);
    manifest.files['asset.glb']!.bytes = WIDGET_TRANSFER_LIMIT;
    await expect(decodeWidgetAsset({ ...payload, manifest })).rejects.toThrow('limit');
    await expect(
      decodeWidgetAsset({
        ...payload,
        files: {
          ...payload.files,
          'asset.glb': 'A'.repeat(Math.ceil(WIDGET_TRANSFER_LIMIT / 3) * 4 + 4),
        },
      }),
    ).rejects.toThrow('limit');
    expect(() =>
      encodeWidgetFiles({ 'asset.glb': new Uint8Array(WIDGET_TRANSFER_LIMIT + 1) }),
    ).toThrow('limit');
  });
  it('rejects omitted saved files and malformed download metadata', async () => {
    const record = await fixture();
    const payload = legacy(record);
    delete payload.files['preview.png'];
    await expect(decodeWidgetAsset(payload)).rejects.toThrow('missing a saved file');
    await expect(decodeWidgetAsset({ ...legacy(record), downloadUrls: [] })).rejects.toThrow(
      'download metadata',
    );
    await expect(
      decodeWidgetAsset({ ...legacy(record), downloadUrls: { 'asset.glb': 42 } }),
    ).rejects.toThrow('download metadata');
  });
});
