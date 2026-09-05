import { test, expect } from 'bun:test';
import { Group } from 'three';
import { measureAttachment, describeSubjectFrame } from '../measurement';
test('attachment endpoints use named node origins and transformed local offsets', () => {
  const root = new Group();
  root.name = 'Root';
  const a = new Group();
  a.name = 'hinge';
  a.position.set(1, 0, 0);
  a.rotation.z = Math.PI / 2;
  root.add(a);
  const b = new Group();
  b.name = 'latch';
  b.position.set(1, 4, 0);
  root.add(b);
  const m = measureAttachment(root, {
    from: { subject: { name: 'hinge' }, point: [2, 0, 0] },
    to: { subject: { name: 'latch' } },
  });
  expect(m.distance).toBeCloseTo(2);
  expect(m.from.world[1]).toBeCloseTo(2);
  expect(m.units).toBe('asset units');
  expect(describeSubjectFrame(root, { name: 'hinge' }).axes.x[1]).toBeCloseTo(1);
});
test('singular transforms do not invent invertible local bounds', () => {
  const root = new Group();
  root.scale.x = 0;
  expect(describeSubjectFrame(root).invertible).toBe(false);
  expect(describeSubjectFrame(root).localBounds).toBeNull();
});
