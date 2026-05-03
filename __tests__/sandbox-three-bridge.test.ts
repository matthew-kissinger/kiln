/**
 * Regression test for the cross-module THREE bug — see
 * `kiln-cross-module-three.md` memory entry.
 *
 * The kiln executor uses `new Function(...)` to run LLM-generated code,
 * which under bun creates an isolated module realm. `new THREE.Mesh()`
 * inside that sandbox produces objects whose constructor is NOT the same
 * class object as `THREE.Mesh` imported by render.ts / inspect.ts /
 * solids.ts / etc.
 *
 * Before this was fixed, every consumer using `instanceof THREE.Mesh`
 * silently dropped sandbox meshes (treated them as not-meshes), producing
 * GLBs with empty Mesh nodes and corrupted texture export.
 *
 * The fix: every cross-sandbox check uses Three.js's `.isMesh`,
 * `.isObject3D`, `.isTexture`, `.isMeshStandardMaterial` etc. duck-typing
 * flags, which are set on the prototype and survive across module realms.
 *
 * This test ensures the canonical "LLM emitted `new THREE.Mesh()` directly"
 * code path produces a GLB with the mesh attached (not stripped). If the
 * test fails, an `instanceof THREE.X` check regressed somewhere on the
 * bridge path.
 */
import { test, expect } from 'bun:test';
import { NodeIO } from '@gltf-transform/core';
import { renderGLB } from '../render';

test('sandbox new THREE.Mesh() survives the GLB bridge (cross-module realm)', async () => {
  const code = `
const meta = { name: 'sandbox-mesh-test', category: 'prop' };
function build() {
  const root = createRoot('Root');
  // The LLM canonical pattern: \`new THREE.Mesh(geo, mat)\` directly,
  // NOT via createPart. This goes through the cross-module realm.
  const m = new THREE.Mesh(boxGeo(1, 1, 1), gameMaterial(0xff0000));
  m.name = 'Mesh_DirectMesh';
  root.add(m);
  return root;
}
`;
  const result = await renderGLB(code);
  expect(result.warnings).toEqual([]);
  expect(result.meta.tris).toBeGreaterThan(0);

  // Confirm the mesh ACTUALLY made it into the GLB binary, not just the
  // Three.js scene. Read back via NodeIO and verify a node named
  // "Mesh_DirectMesh" has an attached mesh with non-zero tris.
  const io = new NodeIO();
  const doc = await io.readBinary(result.glb);
  const directNode = doc
    .getRoot()
    .listNodes()
    .find((n) => n.getName() === 'Mesh_DirectMesh');
  expect(directNode).toBeDefined();
  const mesh = directNode!.getMesh();
  expect(mesh).toBeDefined();
  let tris = 0;
  for (const p of mesh!.listPrimitives()) {
    tris += (p.getIndices()?.getCount() ?? 0) / 3;
  }
  expect(tris).toBeGreaterThan(0);
});

test('sandbox new THREE.Mesh() with pbrMaterial+texture survives — texture serialised', async () => {
  // Reproduces the textured-aircraft cycle issue: LLM does
  //   new THREE.Mesh(unwrappedGeo, pbrMaterial({ albedo: loadedTex }))
  // and the resulting GLB needs to actually carry the texture.
  // Build a tiny in-memory PNG via sharp to avoid coupling to disk paths.
  const { default: sharp } = await import('sharp');
  const pngBytes = await sharp({
    create: { width: 16, height: 16, channels: 4, background: { r: 200, g: 80, b: 80, alpha: 1 } },
  })
    .png()
    .toBuffer();
  const tmpPath = `${process.cwd()}/.tmp-sandbox-three-bridge.png`;
  const fs = await import('node:fs');
  fs.writeFileSync(tmpPath, pngBytes);

  try {
    const code = `
const meta = { name: 'sandbox-textured-mesh-test', category: 'prop' };
async function build() {
  const root = createRoot('Root');
  const tex = await loadTexture(${JSON.stringify(tmpPath)});
  const mat = pbrMaterial({ albedo: tex, roughness: 0.85, metalness: 0 });
  const geo = cylinderUnwrap(boxGeo(1, 1, 1));
  const m = new THREE.Mesh(geo, mat);
  m.name = 'Mesh_TexturedDirect';
  root.add(m);
  return root;
}
`;
    const result = await renderGLB(code);
    expect(result.warnings).toEqual([]);

    const io = new NodeIO();
    const doc = await io.readBinary(result.glb);
    const root = doc.getRoot();
    // Texture carried through?
    expect(root.listTextures().length).toBeGreaterThan(0);
    // Material with base-color texture present?
    const matWithTex = root.listMaterials().find((m) => m.getBaseColorTexture());
    expect(matWithTex).toBeDefined();
  } finally {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  }
});
