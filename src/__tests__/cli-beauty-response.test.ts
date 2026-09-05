import { test, expect } from 'bun:test';
import { makeRemoteRenderPort } from '../cli-render-mode';
test('remote adapter preserves the requested beauty PNG alongside ordinary views', async () => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6u8AAAAASUVORK5CYII=',
    'base64',
  );
  let request: Record<string, unknown> = {};
  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    async fetch(req) {
      request = (await req.json()) as Record<string, unknown>;
      return Response.json({
        ok: true,
        rendererId: 'fixture',
        views: [png.toString('base64')],
        beauty: png.toString('base64'),
      });
    },
  });
  try {
    const result = await makeRemoteRenderPort(`http://127.0.0.1:${server.port}`)({
      glb: new Uint8Array([1, 2, 3]),
      size: 128,
      beautySize: 256,
    });
    expect(request.beauty_size).toBe(256);
    expect(result.viewsPng?.length).toBe(1);
    expect(result.beautyPng).toEqual(new Uint8Array(png));
  } finally {
    server.stop(true);
  }
});
