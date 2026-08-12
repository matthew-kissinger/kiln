/**
 * Wave 2A: verifies CSG primitives work inside the sandbox via
 * executeKilnCode — the real agent-authoring path.
 */

import { describe, it, expect } from 'bun:test';
import { executeKilnCode, renderGLB } from '../render';

describe('Wave 2A: CSG inside sandbox (agent authoring path)', () => {
  it('async build() with boolDiff produces a gear', async () => {
    const code = `
const meta = { name: 'Gear', category: 'prop' };

async function build() {
  const root = createRoot('Gear');
  const steel = gameMaterial(0xb0b0b0, { metalness: 0.7, roughness: 0.3 });
  const body = createPart('Body', cylinderGeo(1, 1, 0.3, 32), steel, {});
  const notch = createPart('Notch', boxGeo(0.3, 2.2, 0.5), steel, {});
  const gear = await boolDiff('GearBody', body, notch);
  root.add(gear);
  return root;
}
`;
    const { root } = await executeKilnCode(code);
    expect(root.name).toBe('Gear');
    expect(root.children[0]?.name).toBe('Mesh_GearBody');
  });

  it('agent-style code using createPart siblings + boolDiff', async () => {
    // This is what a kiln prompt would actually produce: build parts with
    // createPart, then feed them through boolDiff. The parts become
    // detached from root once fed to CSG (we replace them with the
    // result).
    const code = `
const meta = { name: 'PiercedBox', category: 'prop' };

async function build() {
  const root = createRoot('PiercedBox');
  const steel = gameMaterial(0x888888);

  // Build operand meshes as standalone (no parent) so they don't end up
  // in root before being consumed by CSG.
  const body = createPart('Body', boxGeo(2, 2, 2), steel, {});
  const hole = createPart('Hole', cylinderGeo(0.4, 0.4, 3, 16), gameMaterial(0x000000), {});

  const pierced = await boolDiff('Pierced', body, hole);
  root.add(pierced);
  return root;
}
`;
    const r = await renderGLB(code);
    expect(r.glb.byteLength).toBeGreaterThan(1000);
    expect(r.tris).toBeGreaterThan(12); // More than a bare box
  });
});
