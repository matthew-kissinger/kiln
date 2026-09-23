import { expect, test } from 'bun:test';
import { WebIO, type Document, type Node } from '@gltf-transform/core';
import * as THREE from 'three';
import { executeKilnCode, renderSceneToGLB } from '../render';
import { loadGlbReviewScene } from '../views/glb';
import { createDiscovery, listDiscoveryEntries } from './index';

function example(id: string) {
  const entry = listDiscoveryEntries().find((e) => e.id === id);
  expect(entry?.kind).toBe('recipe');
  if (entry?.kind !== 'recipe') throw new Error(`Missing ${id}`);
  return entry.recipe.example;
}

async function exported(source: string, transformed = false) {
  const { root } = await executeKilnCode(source);
  if (transformed) {
    const parent = new THREE.Group();
    parent.position.set(3, 2, -7);
    parent.rotation.set(0.2, 0.7, -0.1);
    parent.scale.set(2, 1.5, 0.8);
    parent.add(root);
    const result = await renderSceneToGLB(parent, { optimize: 'off' });
    expect(result.gltfValidation.issues.numErrors).toBe(0);
    return new WebIO().readBinary(result.bytes);
  }
  const result = await renderSceneToGLB(root, { optimize: 'off' });
  expect(result.gltfValidation.issues.numErrors).toBe(0);
  return new WebIO().readBinary(result.bytes);
}

function find(doc: Document, name: string) {
  const node = doc
    .getRoot()
    .listNodes()
    .find((n) => n.getName() === name);
  expect(node).toBeDefined();
  return node!;
}

function geometry(node: Node) {
  return node
    .getMesh()
    ?.listPrimitives()
    .map((p) => ({
      attributes: Object.fromEntries(
        p.listSemantics().map((s) => [s, Array.from(p.getAttribute(s)!.getArray()!)]),
      ),
      indices: Array.from(p.getIndices()?.getArray() ?? []),
      material: p.getMaterial()?.getName(),
    }));
}

test('structural recipes are discoverable without selecting a category', async () => {
  const discover = createDiscovery(async () => ({}));
  for (const [query, id] of [
    ['stack editable facade bays and openings', 'recipe:structural-bays-v1'],
    ['open arena tiered seating entrance', 'recipe:open-tiered-seating-v1'],
  ]) {
    const response = await discover({ query, kind: 'recipe' });
    expect(response.entries.slice(0, 6).map((e) => e.id)).toContain(id!);
  }
});

test('six-storey bay recipe widens the center without stretching outer detailing or closing the entry', async () => {
  const source = example('recipe:structural-bays-v1');
  const before = await exported(source);
  const after = await exported(
    source.replace('const centerWidth = 3;', 'const centerWidth = 4.5;'),
  );
  for (let level = 1; level <= 6; level++) {
    expect(find(after, `Storey_${level}`).getTranslation()).toEqual([0, (level - 1) * 3, 0]);
    for (const bay of [0, 2]) {
      const name = `Bay_${level}_${bay}`;
      const old = find(before, name),
        changed = find(after, name);
      expect(changed.getTranslation()[0]! - old.getTranslation()[0]!).toBeCloseTo(
        bay === 0 ? -0.75 : 0.75,
        6,
      );
      expect(changed.getScale()).toEqual([1, 1, 1]);
      for (const node of before
        .getRoot()
        .listNodes()
        .filter((n) => n.getMesh() && n.getName().includes(`${name}_`))) {
        expect(geometry(find(after, node.getName()))).toEqual(geometry(node));
      }
    }
  }
  for (const doc of [before, after]) {
    const { root: scene } = await loadGlbReviewScene(await new WebIO().writeBinary(doc));
    scene.updateMatrixWorld(true);
    // Sample the full requested entry, including near ground. No plinth or infill across it.
    for (const x of [-0.6, 0, 0.6])
      for (const y of [0.02, 0.2, 1, 2.2]) {
        const ray = new THREE.Raycaster(
          new THREE.Vector3(x, y, 1),
          new THREE.Vector3(0, 0, -1),
          0,
          2,
        );
        expect(ray.intersectObject(scene, true)).toHaveLength(0);
      }
    const pane = find(doc, 'Mesh_Bay_2_0_Pane');
    const point = new THREE.Vector3().setFromMatrixPosition(
      new THREE.Matrix4().fromArray(pane.getWorldMatrix()),
    );
    expect(point.z).toBeGreaterThan(-0.3);
    expect(point.z).toBeLessThan(0);
  }
});

test('replacing one opening retains the bay datum and all unrelated exported parts under a transformed parent', async () => {
  const source = example('recipe:structural-bays-v1');
  const before = await exported(source, true);
  const after = await exported(
    source.replace('const replaceCenterFourth = false;', 'const replaceCenterFourth = true;'),
    true,
  );
  const frame = 'Glazing_4_1';
  expect(find(after, frame).getWorldMatrix()).toEqual(find(before, frame).getWorldMatrix());
  expect(find(after, frame).listChildren().length).not.toBe(
    find(before, frame).listChildren().length,
  );
  const replaced = new Set(find(before, frame).listChildren());
  for (const node of before
    .getRoot()
    .listNodes()
    .filter((n) => n.getMesh() && !replaced.has(n))) {
    const unchanged = find(after, node.getName());
    expect(geometry(unchanged)).toEqual(geometry(node));
    expect(unchanged.getWorldMatrix()).toEqual(node.getWorldMatrix());
    expect(unchanged.getParentNode()?.getName()).toBe(node.getParentNode()?.getName());
  }
});

test('open seating leaves its entrance empty and removing a sector preserves every other sector', async () => {
  const source = example('recipe:open-tiered-seating-v1');
  const before = await exported(source);
  const after = await exported(
    source.replace('const omittedSector = -1;', 'const omittedSector = 6;'),
  );
  const sectors = find(before, 'OpenTieredSeating').listChildren();
  expect(sectors).toHaveLength(20);
  expect(find(after, 'OpenTieredSeating').listChildren()).toHaveLength(19);
  expect(
    before
      .getRoot()
      .listNodes()
      .filter((n) => n.getMesh()),
  ).toHaveLength(80);
  for (const sector of sectors) {
    expect(sector.getTranslation().some((v) => Math.abs(v) > 1)).toBe(true);
    expect(sector.listChildren()).toHaveLength(4);
    if (sector.getName() === 'Sector_6') continue;
    for (const row of sector.listChildren()) {
      const retained = find(after, row.getName());
      expect(geometry(retained)).toEqual(geometry(row));
      expect(retained.getWorldMatrix()).toEqual(row.getWorldMatrix());
    }
  }
  const { root: scene } = await loadGlbReviewScene(await new WebIO().writeBinary(before));
  scene.updateMatrixWorld(true);
  for (const z of [-1, 0, 1])
    for (const y of [0.02, 0.4, 1.2]) {
      const ray = new THREE.Raycaster(
        new THREE.Vector3(0, y, z),
        new THREE.Vector3(1, 0, 0),
        0,
        20,
      );
      expect(ray.intersectObject(scene, true)).toHaveLength(0);
    }
});
