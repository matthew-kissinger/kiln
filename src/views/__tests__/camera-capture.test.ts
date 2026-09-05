import { test, expect } from 'bun:test';
import { Group, Mesh, BoxGeometry, MeshBasicMaterial } from 'three';
import { renderCaptureGrid } from '../camera-capture';
test('mixed part sheet resolves exact identities and restores visibility', async () => {
  const root = new Group();
  root.name = 'Root';
  for (let i = 0; i < 2; i++) {
    const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    mesh.name = `Part${i}`;
    mesh.position.x = i * 4;
    root.add(mesh);
  }
  const out = await renderCaptureGrid(root, {
    version: 'kiln.capture.v1',
    shots: [{}, { subject: { name: 'Part1' }, visibility: 'isolate' }],
    cols: 2,
    size: 128,
    output: 'separate',
  });
  expect(out.cameraShots).toHaveLength(2);
  expect(out.perFramePngs).toHaveLength(2);
  expect(out.cameraShots[1]?.subject.path).toBe('/Root[0]/Part1[0]');
  expect(root.children.every((n) => n.visible)).toBe(true);
  await expect(
    renderCaptureGrid(root, { version: 'kiln.capture.v1', shots: [], size: 128 }),
  ).rejects.toThrow(/1..9/);
});
