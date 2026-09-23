import { expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { galleryRuntimeDownload } from './runtime-downloads.mjs';
import { renderGLB } from '../../src/render';

const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const json = (bytes: Uint8Array) => JSON.parse(new TextDecoder().decode(bytes.subarray(
  20, 20 + new DataView(bytes.buffer, bytes.byteOffset).getUint32(12, true),
)));

test('gallery runtime downloads preserve playback, original bytes and exact provenance links', async () => {
  const source = `const meta = { name: 'Arm' };
function build() { const root = createRoot('Proof');
  const arm = createPivot('Arm', [0, 0.5, 0], root);
  createPart('Armor', boxGeo(.2, 1, .2), gameMaterial(0x668899), { parent: arm, position: [0, .5, 0] });
  return root;
}
function animate() { return [createClip('swing', 1, [rotationTrack('Joint_Arm', [{time: 0, rotation: [0,0,0]}, {time: 1, rotation: [0,0,70]}])])]; }`;
  const original = (await renderGLB(source)).glb;
  const before = original.slice();
  const output = await galleryRuntimeDownload('test-arm', source, original);
  const metadata = JSON.parse(new TextDecoder().decode(output.metadata));
  expect(output.index.file).toBe('assets/test-arm.runtime.glb');
  expect(output.index.sha256).toBe(hash(output.glb));
  expect(output.index.metadata.sha256).toBe(hash(output.metadata));
  expect(metadata.source.glbSha256).toBe(`sha256:${hash(original)}`);
  expect(metadata.source.sourceSha256).toBe(`sha256:${hash(new TextEncoder().encode(source))}`);
  const runtime = json(output.glb);
  expect(runtime.asset.extras.kilnProvenanceV1.metadata).toEqual({
    uri: output.index.metadata.file.split('/').at(-1), sha256: `sha256:${hash(output.metadata)}`,
  });
  delete runtime.asset.extras.kilnProvenanceV1;
  const canonical = json(original);
  canonical.asset.extras ??= {};
  for (const scene of canonical.scenes ?? []) if (scene.extras) delete scene.extras.kilnReviewClipsV1;
  expect(runtime).toEqual(canonical);
  const bin = (bytes: Uint8Array) => bytes.subarray(20 + new DataView(bytes.buffer, bytes.byteOffset).getUint32(12, true));
  expect(bin(output.glb)).toEqual(bin(original));
  expect(original).toEqual(before);
  expect(await galleryRuntimeDownload('test-arm', source, original)).toEqual(output);
});
