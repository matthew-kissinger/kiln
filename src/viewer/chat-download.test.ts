import { expect, test } from 'bun:test';
import { downloadChatFile } from './chat-download';
test('uses a host-provided URL without uploading files when the standard bridge is unsupported', async () => {
  const result = await downloadChatFile(
    new Uint8Array([1]),
    'asset.glb',
    'model/gltf-binary',
    async () => {
      throw Object.assign(new Error('Method not found'), { code: -32601 });
    },
    undefined,
    'http://127.0.0.1:4321/asset.glb',
  );
  expect(result.downloadUrl).toBe('http://127.0.0.1:4321/asset.glb');
});

test('uses the standard download bridge without uploading a duplicate', async () => {
  const calls: string[] = [];
  await downloadChatFile(
    new Uint8Array([1, 2]),
    'asset.glb',
    'model/gltf-binary',
    async (method) => {
      calls.push(method);
      return {};
    },
  );
  expect(calls).toEqual(['ui/download-file']);
});
test('uses ChatGPT file storage when the standard method is unsupported', async () => {
  let uploaded: File | undefined;
  const result = await downloadChatFile(
    new Uint8Array([1, 2]),
    'asset.glb',
    'model/gltf-binary',
    async () => {
      throw Object.assign(new Error('Method not found'), { code: -32601 });
    },
    {
      uploadFile: async (file) => {
        uploaded = file;
        return { fileId: 'file-test' };
      },
      getFileDownloadUrl: async ({ fileId }) => {
        expect(fileId).toBe('file-test');
        return { downloadUrl: 'https://example.com/download' };
      },
    },
  );
  expect(uploaded?.name).toBe('asset.glb');
  expect(Array.from(new Uint8Array(await uploaded!.arrayBuffer()))).toEqual([1, 2]);
  expect(result.downloadUrl).toBe('https://example.com/download');
});
test('does not upload after a denied download', async () => {
  await expect(
    downloadChatFile(new Uint8Array([1]), 'x.glb', 'model/gltf-binary', async () => {
      throw new Error('Permission denied');
    }),
  ).rejects.toThrow('Permission denied');
});
