import { afterEach, expect, test } from 'bun:test';
import * as THREE from 'three';
import { WebIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import sharp from 'sharp';
import { createLocalToolContext } from '../local-runtime';
import { renderSceneToGLB, optimizeGlbBytes } from '../render';

const previous = process.env['KILN_GLTF_EXPORTER'];
afterEach(() => {
  if (previous === undefined) delete process.env['KILN_GLTF_EXPORTER'];
  else process.env['KILN_GLTF_EXPORTER'] = previous;
});
function fixture() {
  const root = new THREE.Group();
  root.name = 'Asset';
  const pivot = new THREE.Group();
  pivot.name = 'Joint_Vane';
  pivot.position.set(0.2, 1.1, -0.3);
  root.add(pivot);
  const geometry = new THREE.BoxGeometry(0.6, 0.2, 0.01);
  geometry.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(new Array(24).fill([1, 0, 0]).flat(), 3),
  );
  geometry.setAttribute('uv1', geometry.getAttribute('uv').clone());
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshPhysicalMaterial({
      color: 0x4477aa,
      metalness: 0.65,
      roughness: 0.27,
      clearcoat: 0.8,
      transmission: 0.5,
      side: THREE.DoubleSide,
      vertexColors: true,
    }),
  );
  mesh.name = 'Mesh_Pennant';
  mesh.userData['privatePayload'] = 'do not export';
  pivot.add(mesh);
  return root;
}
const io = () => new WebIO().registerExtensions(ALL_EXTENSIONS);

test('experimental exporter preserves attributes and physical extensions without arbitrary metadata', async () => {
  process.env['KILN_GLTF_EXPORTER'] = 'three';
  const result = await renderSceneToGLB(fixture(), { optimize: 'off', derivative: true });
  expect(result.gltfValidation.issues.numErrors).toBe(0);
  const doc = await io().readBinary(result.bytes);
  const primitive = doc.getRoot().listMeshes()[0]!.listPrimitives()[0]!;
  expect(primitive.getAttribute('COLOR_0')).not.toBeNull();
  expect(primitive.getAttribute('TEXCOORD_1')).not.toBeNull();
  expect(
    doc
      .getRoot()
      .listExtensionsUsed()
      .map((extension) => extension.extensionName),
  ).toContain('KHR_materials_clearcoat');
  expect(
    doc
      .getRoot()
      .listNodes()
      .find((node) => node.getName() === 'Mesh_Pennant')!
      .getExtras(),
  ).toEqual({});
  expect(result.warnings.some((warning) => warning.includes('color is not preserved'))).toBe(false);
});

test('existing exporter stays the default and candidate selection fails closed on typos', async () => {
  delete process.env['KILN_GLTF_EXPORTER'];
  const baseline = await renderSceneToGLB(fixture(), { optimize: 'off', derivative: true });
  process.env['KILN_GLTF_EXPORTER'] = 'legacy';
  expect((await renderSceneToGLB(fixture(), { optimize: 'off', derivative: true })).bytes).toEqual(
    baseline.bytes,
  );
  process.env['KILN_GLTF_EXPORTER'] = 'thre';
  expect(renderSceneToGLB(fixture())).rejects.toThrow('KILN_GLTF_EXPORTER');
});

test('physical extensions survive downstream optimization', async () => {
  process.env['KILN_GLTF_EXPORTER'] = 'three';
  const result = await renderSceneToGLB(fixture(), { optimize: 'off', derivative: true });
  const optimized = await optimizeGlbBytes(result.bytes, { mode: 'palette' });
  expect(optimized).toBeDefined();
  const doc = await io().readBinary(optimized!.bytes);
  expect(
    doc
      .getRoot()
      .listExtensionsUsed()
      .map((extension) => extension.extensionName),
  ).toContain('KHR_materials_clearcoat');
});

test('headless textures retain pixels and source state across concurrent exports', async () => {
  process.env['KILN_GLTF_EXPORTER'] = 'three';
  const root = fixture();
  const mesh = root.getObjectByName('Mesh_Pennant') as THREE.Mesh<
    THREE.BufferGeometry,
    THREE.MeshPhysicalMaterial
  >;
  const pixels = Uint8Array.from([
    255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255,
  ]);
  const texture = new THREE.DataTexture(pixels, 2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  const source = texture.source;
  const sourceImage = texture.image;
  mesh.material.map = texture;
  const [a, b] = await Promise.all([
    renderSceneToGLB(root, { derivative: true }),
    renderSceneToGLB(root, { derivative: true }),
  ]);
  expect(a.bytes).toEqual(b.bytes);
  const doc = await io().readBinary(a.bytes);
  const image = doc.getRoot().listTextures()[0]!.getImage()!;
  expect(new Uint8Array(await sharp(image).ensureAlpha().raw().toBuffer())).toEqual(pixels);
  expect(mesh.material.map).toBe(texture);
  expect(texture.source).toBe(source);
  expect(texture.image).toBe(sourceImage);
  expect(mesh.userData['privatePayload']).toBe('do not export');
});

test('candidate preserves morph and skin data and does not mutate bone references', async () => {
  process.env['KILN_GLTF_EXPORTER'] = 'three';
  const root = new THREE.Group();
  const geometry = new THREE.BoxGeometry();
  geometry.morphAttributes.position = [geometry.getAttribute('position').clone()];
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(24 * 4), 4));
  geometry.setAttribute(
    'skinWeight',
    new THREE.Float32BufferAttribute(new Array(24).fill([1, 0, 0, 0]).flat(), 4),
  );
  const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshStandardMaterial());
  const bone = new THREE.Bone();
  bone.name = 'Bone';
  mesh.add(bone);
  mesh.bind(new THREE.Skeleton([bone]));
  root.add(mesh);
  const result = await renderSceneToGLB(root, { derivative: true, geometryPolicy: 'strict' });
  const doc = await io().readBinary(result.bytes);
  expect(doc.getRoot().listSkins()).toHaveLength(1);
  expect(doc.getRoot().listMeshes()[0]!.listPrimitives()[0]!.listTargets()).toHaveLength(1);
  expect(mesh.skeleton.bones[0]).toBe(bone);
});

test('candidate retains sprite quad geometry and camera-facing semantics', async () => {
  process.env['KILN_GLTF_EXPORTER'] = 'three';
  const root = new THREE.Group();
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ color: 0xff4400, opacity: 0.5, transparent: true }),
  );
  sprite.name = 'Card';
  sprite.center.set(0, 0);
  sprite.position.set(1, 2, 3);
  root.add(sprite);
  const result = await renderSceneToGLB(root, { derivative: true });
  const doc = await io().readBinary(result.bytes);
  const card = doc
    .getRoot()
    .listNodes()
    .find((node) => node.getName() === 'Card')!;
  expect(card.getTranslation()).toEqual([1, 2, 3]);
  expect(card.getMesh()!.listPrimitives()[0]!.getAttribute('POSITION')!.getCount()).toBe(4);
  expect(JSON.stringify(card.getExtras())).toContain('vfx.facing.camera-spherical');
  expect(root.children[0]).toBe(sprite);
});

test('local subprocess carries the host exporter choice without ambient environment', async () => {
  const local = createLocalToolContext({}, { KILN_GLTF_EXPORTER: 'three' });
  const result = await local.evaluatorPort!.render(
    `function build(){const root=createRoot('Root');const g=boxGeo(1,1,1);g.setAttribute('color',new THREE.Float32BufferAttribute(new Array(24).fill([1,0,0]).flat(),3));createPart('Body',g,new THREE.MeshStandardMaterial({vertexColors:true}),{parent:root});return root;}`,
  );
  const doc = await io().readBinary(result.glb);
  expect(
    doc.getRoot().listMeshes()[0]!.listPrimitives()[0]!.getAttribute('COLOR_0'),
  ).not.toBeNull();
  expect(local.localExecution.mode).toBe('subprocess');
});

test('candidate rejects invalid material groups before upstream export', async () => {
  process.env['KILN_GLTF_EXPORTER'] = 'three';
  const root = fixture();
  const mesh = root.getObjectByName('Mesh_Pennant') as THREE.Mesh;
  mesh.material = [new THREE.MeshStandardMaterial(), new THREE.MeshStandardMaterial()];
  mesh.geometry.clearGroups();
  mesh.geometry.addGroup(0, 3, 4);
  await expect(renderSceneToGLB(root, { derivative: true })).rejects.toThrow('material');
});

test('candidate rejects overlapping material groups', async () => {
  process.env['KILN_GLTF_EXPORTER'] = 'three';
  const root = fixture();
  const mesh = root.getObjectByName('Mesh_Pennant') as THREE.Mesh;
  mesh.material = [new THREE.MeshStandardMaterial(), new THREE.MeshStandardMaterial()];
  mesh.geometry.clearGroups();
  mesh.geometry.addGroup(0, 36, 0);
  mesh.geometry.addGroup(0, 36, 1);
  await expect(renderSceneToGLB(root, { derivative: true })).rejects.toThrow('material groups');
});

test('candidate keeps transformed Scene roots as named transform nodes', async () => {
  process.env['KILN_GLTF_EXPORTER'] = 'three';
  const root = new THREE.Scene();
  root.name = 'MovedScene';
  root.position.set(1, 2, 3);
  root.add(fixture());
  const result = await renderSceneToGLB(root, { derivative: true });
  const doc = await io().readBinary(result.bytes);
  const node = doc
    .getRoot()
    .listNodes()
    .find((n) => n.getName() === 'MovedScene');
  expect(node?.getTranslation()).toEqual([1, 2, 3]);
});

test('unresolved advisory animation tracks do not produce invalid empty glTF animations', async () => {
  process.env['KILN_GLTF_EXPORTER'] = 'three';
  const clip = new THREE.AnimationClip('Missing', 1, [
    new THREE.VectorKeyframeTrack('NoSuchNode.position', [0, 1], [0, 0, 0, 1, 0, 0]),
  ]);
  const result = await renderSceneToGLB(fixture(), { clips: [clip], derivative: true });
  expect(result.gltfValidation.issues.numErrors).toBe(0);
  expect((await io().readBinary(result.bytes)).getRoot().listAnimations()).toHaveLength(0);
  expect(result.warnings.some((w) => w.includes('NoSuchNode'))).toBe(true);
});
