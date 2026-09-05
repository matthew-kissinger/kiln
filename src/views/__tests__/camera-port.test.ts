import { test, expect } from 'bun:test';
import { type PbrRenderRequest, validatePbrRenderRequest } from '../../composer/render-port';
import { cameraFromBounds } from '../camera';
import { captureViewPngsViaPort } from '../../agent/generate';
import { encodePng } from '../png';
const camera = cameraFromBounds({ min: [-1, -1, -1], max: [1, 1, 1] }, [1, 0, 0]);
test('explicit camera transport validates orthographic extent and preserves projection', () => {
  const request = { glb: new Uint8Array([1]), cameras: [camera], width: 128, height: 128 };
  expect(validatePbrRenderRequest(request).cameras?.[0]).toEqual(camera);
  expect(() =>
    validatePbrRenderRequest({ ...request, cameras: [{ ...camera, halfHeight: 0 }] }),
  ).toThrow(/halfHeight/);
});
test('port requires matching actual cameras and dimensions, not a successful image alone', async () => {
  let received: PbrRenderRequest | undefined;
  const png = encodePng(new Uint8Array(128 * 128 * 3), 128, 128);
  const port = async (request: PbrRenderRequest) => {
    received = request;
    return {
      ok: true,
      rendererId: 'gpu:test',
      viewsPng: [png],
      cameras: request.cameras,
      width: 128,
      height: 128,
    };
  };
  const good = await captureViewPngsViaPort(port, new Uint8Array([1]), 100, [[1, 0, 0]], 128, [
    camera,
  ]);
  expect(good.ok).toBe(true);
  expect(received?.cameras).toEqual([camera]);
  expect(received?.viewDirs).toBeUndefined();
  const bad = await captureViewPngsViaPort(
    async () => ({ ok: true, rendererId: 'gpu:test', viewsPng: [png] }),
    new Uint8Array([1]),
    100,
    [[1, 0, 0]],
    128,
    [camera],
  );
  expect(bad.ok).toBe(false);
});
import { renderGLB } from '../../render';
import { captureViewsViaPort } from '../../agent/generate';
test('grid padding reaches the GPU as exact orthographic extent', async () => {
  const built = await renderGLB(
    "const meta={name:'box',category:'prop'};function build(){const r=createRoot('Root');createPart('Body',boxGeo(1,1,1),gameMaterial('#888888'),{parent:r});return r;}",
  );
  let cameraHalf: number | undefined;
  const out = await captureViewsViaPort(
    async (request) => {
      cameraHalf = (request.cameras?.[0] as typeof camera)?.halfHeight;
      return {
        ok: true,
        rendererId: 'gpu:test',
        cameras: request.cameras,
        width: 384,
        height: 384,
        viewsPng: [encodePng(new Uint8Array(384 * 384 * 3), 384, 384)],
      };
    },
    built.glb,
    100,
    { cells: [{ azimuthDeg: 0, elevationDeg: 0, zoom: 4 }] },
  );
  expect(out.ok).toBe(true);
  expect(cameraHalf).toBeGreaterThan(2);
});
