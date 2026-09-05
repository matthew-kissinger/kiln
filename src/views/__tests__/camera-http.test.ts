import { test, expect } from 'bun:test';
import { makeRemoteRenderPort } from '../../cli-render-mode';
import { cameraFromBounds } from '../camera';
test('HTTP adapter forwards exact cameras and artifact fidelity', async () => {
  let body: Record<string, unknown> = {};
  const camera = cameraFromBounds({ min: [-1, -1, -1], max: [1, 1, 1] }, [1, 0, 0]);
  const server = Bun.serve({
    port: 0,
    fetch: async (req) => {
      body = (await req.json()) as Record<string, unknown>;
      return Response.json({
        ok: true,
        rendererId: 'gpu:test',
        cameras: body.cameras,
        width: 128,
        height: 128,
        views: [],
        fidelity: {
          version: 'kiln.render-fidelity.v1',
          producer: 'kiln-render-service',
          materialFaithful: true,
          delivered: 'full-material',
          degraded: false,
          inputGlbSha256: body.input_glb_sha256,
          rendererId: 'gpu:test',
        },
      });
    },
  });
  try {
    const result = await makeRemoteRenderPort(server.url.toString())({
      glb: new Uint8Array([1]),
      cameras: [camera],
      width: 128,
      height: 128,
    });
    expect(body.cameras).toEqual([camera]);
    expect(body.input_glb_sha256).toMatch(/^sha256:/);
    expect(result.cameras).toEqual([camera]);
    expect(result.derivativeFidelity?.materialFaithful).toBe(true);
  } finally {
    server.stop(true);
  }
});
