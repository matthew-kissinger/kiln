import { test, expect } from 'bun:test';
import { createHash } from 'node:crypto';
import { createKilnProgramToolRegistry } from '../registry';
import { encodePng } from '../../views';
import type { PbrRenderRequest } from '../../composer/render-port';
const code =
  "const meta={name:'box',category:'prop'};function build(){const r=createRoot('Root');createPart('Body',boxGeo(1,1,1),gameMaterial('#888888'),{parent:r});return r;}";
test('public references render mixed exact cameras and expose separate images', async () => {
  const defs = createKilnProgramToolRegistry();
  const render = defs.find((d) => d.name === 'kiln_render')!;
  const first = (await render.run({
    code,
    capture: {
      version: 'kiln.capture.v1',
      shots: [
        {},
        {
          subject: { name: 'Mesh_Body' },
          visibility: 'isolate',
          camera: {
            type: 'explicit',
            projection: 'perspective',
            position: [3, 2, 3],
            target: [0, 0, 0],
          },
        },
      ],
      size: 128,
      output: 'separate',
    },
  })) as Record<string, unknown>;
  expect(first).toMatchObject({ ok: true });
  expect(first.cameraShots).toHaveLength(2);
  expect(first.framesBase64).toHaveLength(2);
  expect(render.mediaMulti?.(first)?.pngs).toHaveLength(2);
  const second = (await render.run({
    programRef: first.programRef,
    capture: { preset: '1x1' },
  })) as Record<string, unknown>;
  expect(second.ok).toBe(true);
});
test('GPU inspect honors padding and contextual framing with explicit camera receipt', async () => {
  const requests: PbrRenderRequest[] = [];
  const defs = createKilnProgramToolRegistry({
    viewRenderPort: async (req) => {
      requests.push(req);
      return {
        ok: true,
        rendererId: 'gpu:test',
        cameras: req.cameras,
        width: req.width,
        height: req.height,
        viewsPng: [encodePng(new Uint8Array(512 * 512 * 3), 512, 512)],
        derivativeFidelity: {
          materialFaithful: true,
          inputGlbSha256: `sha256:${createHash('sha256').update(req.glb).digest('hex')}`,
        },
      };
    },
  });
  const inspect = defs.find((d) => d.name === 'kiln_inspect')!;
  const result = (await inspect.run({ code, part: 'Body', zoom: 4 })) as Record<string, unknown>;
  expect(result.ok).toBe(true);
  expect(requests[0]?.cameras?.[0]).toMatchObject({
    projection: 'orthographic',
    halfHeight: expect.any(Number),
  });
  expect(result.viewFidelity).toMatchObject({ materialFaithful: true });
});

test('inspection shares strict shot selection; animation locks explicit frame and samples requested phases', async () => {
  const defs = createKilnProgramToolRegistry();
  const inspect = defs.find((d) => d.name === 'kiln_inspect')!;
  const close = (await inspect.run({
    code,
    shot: {
      subject: { name: 'Mesh_Body' },
      camera: { type: 'orbit', relativeTo: 'part', azimuthDeg: 90 },
    },
  })) as Record<string, unknown>;
  expect(close.cameraShot).toMatchObject({ subject: { name: 'Mesh_Body' } });
  const animated =
    "const meta={name:'motion',category:'prop'};function build(){const r=createRoot('Root');const p=createPivot('Body',[0,0,0],r);createPart('Body',boxGeo(1,1,1),gameMaterial('#888888'),{parent:p});return r;}function animate(){return [createClip('move',1,[positionTrack('Joint_Body',[{time:0,position:[0,0,0]},{time:1,position:[4,0,0]}])])];}";
  const anim = defs.find((d) => d.name === 'kiln_screenshot_animation')!;
  const out = (await anim.run({
    code: animated,
    clip: 'move',
    frameTimes: [0, 0.25, 1],
    shot: { camera: { type: 'orbit', azimuthDeg: 90, elevationDeg: 0 } },
    perFrame: true,
  })) as Record<string, unknown>;
  expect(out).toMatchObject({ ok: true, frames: 3, frameTimes: [0, 0.25, 1] });
  const cameras = (out.cameraShots as { camera: unknown }[]).map((s) => s.camera);
  expect(cameras[0]).toEqual(cameras[2]);
});
test('required GPU does not return CPU success when camera attestation is missing', async () => {
  const defs = createKilnProgramToolRegistry({
    viewRenderRequired: true,
    viewRenderPort: async () => ({ ok: false, rendererId: 'gpu:test', error: 'offline' }),
  } as never);
  const result = (await defs
    .find((d) => d.name === 'kiln_inspect')!
    .run({ code, zoom: 4 })) as Record<string, unknown>;
  expect(result.ok).toBe(false);
  expect(result.error).toMatch(/GPU/);
});
test('public CPU grids and derivative inspection reuse cells and expose counters', async () => {
  const defs = createKilnProgramToolRegistry();
  const render = defs.find((d) => d.name === 'kiln_render')!;
  const first = (await render.run({ code, capture: { preset: '1x1' } })) as Record<string, unknown>;
  const second = (await render.run({
    programRef: first.programRef,
    capture: { preset: '2x1' },
  })) as Record<string, unknown>;
  expect(second.captureCache).toMatchObject({ reused: 1, total: 2 });
  const inspect = defs.find((d) => d.name === 'kiln_inspect')!;
  await inspect.run({ programRef: first.programRef, zoom: 4 });
  const close = (await inspect.run({ programRef: first.programRef, zoom: 4 })) as {
    viewFidelity: { receipts: { captureCache?: { hit: boolean } }[] };
  };
  expect(close.viewFidelity.receipts[0]?.captureCache?.hit).toBe(true);
});
test('public GPU derivative cells reuse only with declared backend identity', async () => {
  let calls = 0;
  const defs = createKilnProgramToolRegistry({
    captureCacheIdentity: 'gpu-fixture',
    viewRenderPort: async (req: PbrRenderRequest) => {
      calls++;
      return {
        ok: true,
        rendererId: 'gpu:fixture',
        cameras: req.cameras,
        width: req.width,
        height: req.height,
        viewsPng: [encodePng(new Uint8Array(512 * 512 * 3), 512, 512)],
        derivativeFidelity: {
          materialFaithful: true,
          inputGlbSha256: `sha256:${createHash('sha256').update(req.glb).digest('hex')}`,
        },
      };
    },
  } as never);
  const inspect = defs.find((d) => d.name === 'kiln_inspect')!;
  await inspect.run({ code, zoom: 4 });
  const out = (await inspect.run({ code, zoom: 4 })) as {
    viewFidelity: { receipts: { captureCache?: { hit: boolean } }[] };
  };
  expect(calls).toBe(1);
  expect(out.viewFidelity.receipts[0]?.captureCache?.hit).toBe(true);
});
test('inspect exposes subject frames and measures exact part-local anchors', async () => {
  const defs = createKilnProgramToolRegistry();
  const out = (await defs
    .find((d) => d.name === 'kiln_inspect')!
    .run({
      code,
      shot: { subject: { name: 'Mesh_Body' } },
      measure: {
        from: { subject: { name: 'Mesh_Body' } },
        to: { subject: { name: 'Mesh_Body' }, point: [0, 2, 0] },
      },
    })) as { ok: boolean; measurement: unknown; subjectFrame: { worldMatrix: number[] } };
  expect(out.ok).toBe(true);
  expect(out.measurement).toMatchObject({ distance: 2, units: 'asset units', frame: 'world' });
  expect(out.subjectFrame.worldMatrix).toHaveLength(16);
});
