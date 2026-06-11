/**
 * Phase 5.1 geometry gains: snapTo contact resolution, gap-vector fix hints on
 * floating-part warnings, the category orientation advisory, settleContacts,
 * and the upgraded static tri estimates (loops, gearGeo, subdivide).
 */
import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';
import { buildSandboxGlobals, snapTo } from '../primitives';
import { executeKilnCode, inspectSceneStructure, settleContacts } from '../render';
import { validate } from '../validation';

const FLOATER_CODE = `
const meta = { name: 'floaty', category: 'prop' };
function build() {
  const root = createRoot('Root');
  createPart('Mesh_Base', boxGeo(1, 1, 1), gameMaterial('#888888'), { parent: root, position: [0, 0.5, 0] });
  // float bottom at 1.14-0.1=1.04 vs base top at 1.0 → a 4cm gap (settleable)
  createPart('Mesh_Float', boxGeo(0.2, 0.2, 0.2), gameMaterial('#ff0000'), { parent: root, position: [0, 1.14, 0] });
  return root;
}
`;

describe('snapTo', () => {
  test('translates a floating part into contact with its host', () => {
    const g = buildSandboxGlobals();
    void g; // sandbox registration sanity is covered by the parity test
    const host = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());
    host.position.set(0, 0.5, 0);
    const part = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshStandardMaterial());
    part.position.set(0, 1.8, 0); // 0.7 above the host top
    const scene = new THREE.Object3D();
    scene.add(host, part);

    snapTo(part, host);
    const a = new THREE.Box3().setFromObject(part);
    const b = new THREE.Box3().setFromObject(host);
    expect(a.intersectsBox(b)).toBe(true);
  });

  test('is a no-op when already in contact', () => {
    const host = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
    const part = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4));
    part.position.set(0, 0.6, 0); // overlapping
    const scene = new THREE.Object3D();
    scene.add(host, part);
    const before = part.position.clone();
    snapTo(part, host);
    expect(part.position.distanceTo(before)).toBe(0);
  });
});

describe('floating-part fix hints', () => {
  test('warning carries the minimal gap vector and the snapTo suggestion', async () => {
    const { root } = await executeKilnCode(FLOATER_CODE);
    const warnings = inspectSceneStructure(root);
    const floatWarning = warnings.find((w) => w.includes('Floating parts'));
    expect(floatWarning).toBeDefined();
    expect(floatWarning).toContain('Mesh_Float');
    expect(floatWarning).toContain('shift');
    expect(floatWarning).toContain('snapTo');
    // 4cm downward gap → the hint vector's Y component is -0.040.
    expect(floatWarning).toContain('-0.040');
  });
});

describe('orientation advisory', () => {
  test('flags a sideways vehicle (Z-dominant), passes an X-forward one', async () => {
    const sideways = await executeKilnCode(`
      const meta = { name: 'sideways' };
      function build() {
        const root = createRoot('Root');
        createPart('Mesh_Hull', boxGeo(0.8, 0.5, 3.0), gameMaterial('#445544'), { parent: root, position: [0, 0.25, 0] });
        return root;
      }
    `);
    const w1 = inspectSceneStructure(sideways.root, { category: 'vehicle' });
    expect(w1.some((w) => w.includes('Orientation'))).toBe(true);

    const forward = await executeKilnCode(`
      const meta = { name: 'forward' };
      function build() {
        const root = createRoot('Root');
        createPart('Mesh_Hull', boxGeo(3.0, 0.5, 0.8), gameMaterial('#445544'), { parent: root, position: [0, 0.25, 0] });
        return root;
      }
    `);
    const w2 = inspectSceneStructure(forward.root, { category: 'vehicle' });
    expect(w2.some((w) => w.includes('Orientation'))).toBe(false);
    // No category → no orientation check at all.
    expect(inspectSceneStructure(sideways.root).some((w) => w.includes('Orientation'))).toBe(false);
  });
});

describe('settleContacts', () => {
  test('closes a small gap and reports the moved part; leaves big gaps alone', async () => {
    const { root } = await executeKilnCode(FLOATER_CODE); // 4cm gap
    const settled = settleContacts(root, { maxGap: 0.05 });
    expect(settled).toEqual(['Mesh_Mesh_Float']);
    expect(inspectSceneStructure(root).some((w) => w.includes('Floating parts'))).toBe(false);

    const far = await executeKilnCode(`
      const meta = { name: 'far' };
      function build() {
        const root = createRoot('Root');
        createPart('Mesh_Base', boxGeo(1, 1, 1), gameMaterial('#888888'), { parent: root, position: [0, 0.5, 0] });
        createPart('Mesh_Far', boxGeo(0.2, 0.2, 0.2), gameMaterial('#ff0000'), { parent: root, position: [0, 3, 0] });
        return root;
      }
    `);
    expect(settleContacts(far.root, { maxGap: 0.05 })).toEqual([]);
  });
});

describe('tri estimate upgrades', () => {
  const wrap = (body: string) => `
    const meta = { name: 'est', category: 'prop' };
    function build() {
      const root = createRoot('Root');
      ${body}
      return root;
    }
  `;

  test('for-loop literal bounds multiply the estimate', () => {
    // 8 cylinders at 16 segs = 8 * 64 = 512 estimated tris (vs 64 unscaled).
    const r = validate(
      wrap(`for (let i = 0; i < 8; i++) {
        createPart('P' + i, cylinderGeo(0.1, 0.1, 1, 16), gameMaterial('#999999'), { parent: root });
      }`),
      { category: 'vfx' }, // 2000 budget — single counting stays silent
    );
    expect(r.valid).toBe(true);
    // 30 spheres at 32x16 → 30 * 1024 = 30720 >> any budget → advisory fires.
    const heavy = validate(
      wrap(`for (let i = 0; i < 30; i++) {
        createPart('S' + i, sphereGeo(0.5, 32, 16), gameMaterial('#999999'), { parent: root });
      }`),
      { category: 'prop' },
    );
    expect(heavy.warnings.some((w) => w.message.includes('tris'))).toBe(true);
  });

  test('gearGeo and subdivide contribute estimates', () => {
    const r = validate(
      wrap(`
        createPart('Gear', gearGeo({ teeth: 64 }), gameMaterial('#999999'), { parent: root }); // ~2048
        const blob = subdivide(sphereGeo(1, 16, 12), 2); // 384 base + 384*15 growth
        createPart('Blob', blob, gameMaterial('#999999'), { parent: root });
      `),
      { category: 'vfx' }, // budget 2000 → combined ~8200 trips the advisory
    );
    expect(r.warnings.some((w) => w.message.includes('tris'))).toBe(true);
  });
});
