import { test, expect } from 'bun:test';
import { Group, Mesh, BoxGeometry, MeshStandardMaterial } from 'three';
import { renderSceneToGLB } from '../../render';
import { captureViewsViaPort } from '../port';
import { encodePng } from '../png';
import { createHash } from 'node:crypto';
test('SDK advanced capture sends isolated derivative with explicit cameras and returns receipts', async () => {
  const root = new Group();
  root.name = 'Root';
  const mesh = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
  mesh.name = 'Body';
  root.add(mesh);
  const rendered = await renderSceneToGLB(root, { derivative: true });
  let calls = 0;
  const out = await captureViewsViaPort(
    async (req) => {
      calls++;
      return {
        ok: true,
        rendererId: 'gpu:test',
        cameras: req.cameras,
        width: req.width,
        height: req.height,
        viewsPng: [encodePng(new Uint8Array(128 * 128 * 3), 128, 128)],
        derivativeFidelity: {
          materialFaithful: true,
          inputGlbSha256: `sha256:${createHash('sha256').update(req.glb).digest('hex')}`,
        },
      };
    },
    rendered.bytes,
    5000,
    { version: 'kiln.capture.v1', shots: [{}], size: 128 },
  );
  expect(out.ok).toBe(true);
  expect(calls).toBe(1);
  if (out.ok) expect(out.derivativeReceipts?.[0]?.cameraFidelity).toBe('echo-validated');
});
