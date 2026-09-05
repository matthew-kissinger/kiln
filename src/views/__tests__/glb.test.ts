import { createHash } from 'node:crypto';
import { describe, expect, spyOn, test } from 'bun:test';
import { Document, WebIO } from '@gltf-transform/core';
import { EXTMeshGPUInstancing, KHRTextureBasisu } from '@gltf-transform/extensions';

import * as renderModule from '../../render';
import {
  GLB_GEOMETRY_FLAT_REASON,
  geometryFlatTextureReasonCode,
  loadGlbGeometryFlatScene,
  loadGlbReviewScene,
  measureBounds,
  renderGlbViewGrid,
} from '..';

const io = (): WebIO => new WebIO().registerExtensions([EXTMeshGPUInstancing, KHRTextureBasisu]);

function triangleDocument(
  options: {
    alpha?: number;
    texture?: boolean;
    translation?: [number, number, number];
    scale?: [number, number, number];
  } = {},
): Document {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const positions = doc
    .createAccessor('positions')
    .setType('VEC3')
    .setArray(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]))
    .setBuffer(buffer);
  const indices = doc
    .createAccessor('indices')
    .setType('SCALAR')
    .setArray(new Uint16Array([0, 1, 2]))
    .setBuffer(buffer);
  const material = doc
    .createMaterial('FactorMaterial')
    .setBaseColorFactor([0.25, 0.5, 0.75, options.alpha ?? 1])
    .setAlphaMode(options.alpha === undefined ? 'OPAQUE' : 'BLEND')
    .setDoubleSided(true);
  if (options.texture) {
    material.setBaseColorTexture(
      doc
        .createTexture('TinyPng')
        .setMimeType('image/png')
        .setImage(
          new Uint8Array(
            Buffer.from(
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFgAI/ScL9WQAAAABJRU5ErkJggg==',
              'base64',
            ),
          ),
        ),
    );
  }
  const primitive = doc
    .createPrimitive()
    .setAttribute('POSITION', positions)
    .setIndices(indices)
    .setMaterial(material);
  const node = doc
    .createNode('Triangle')
    .setMesh(doc.createMesh('TriangleMesh').addPrimitive(primitive))
    .setTranslation(options.translation ?? [0, 0, 0])
    .setScale(options.scale ?? [1, 1, 1]);
  const scene = doc.createScene('Scene').addChild(node);
  doc.getRoot().setDefaultScene(scene);
  return doc;
}

describe('GLB-native geometry-flat view input', () => {
  test('reads exact bytes without executeKilnCode and reports their SHA-256 identity', async () => {
    const bytes = await io().writeBinary(triangleDocument());
    const executeSpy = spyOn(renderModule, 'executeKilnCode');
    try {
      const result = await renderGlbViewGrid(bytes, { size: 32 });
      expect(result.png.byteLength).toBeGreaterThan(100);
      expect(executeSpy).not.toHaveBeenCalled();
      expect(result.inputGlbSha256).toBe(
        `sha256:${createHash('sha256').update(bytes).digest('hex')}`,
      );
    } finally {
      executeSpy.mockRestore();
    }
  });

  test('preserves node world transforms and base color/alpha factors', async () => {
    const bytes = await io().writeBinary(
      triangleDocument({ alpha: 0.4, translation: [2, 3, 4], scale: [2, 3, 1] }),
    );
    const loaded = await loadGlbGeometryFlatScene(bytes);
    expect(measureBounds(loaded.root)).toEqual({ min: [2, 3, 4], max: [4, 6, 4] });

    const meshes: Array<{
      material?: { color?: unknown; opacity?: number; doubleSided?: boolean };
    }> = [];
    loaded.root.traverse?.((value: unknown) => meshes.push(value as (typeof meshes)[number]));
    expect(meshes[0]?.material).toMatchObject({
      color: { r: 0.25, g: 0.5, b: 0.75 },
      opacity: 0.4,
      doubleSided: true,
    });
  });

  test('expands EXT_mesh_gpu_instancing transforms into exact flat geometry', async () => {
    const doc = triangleDocument();
    const node = doc.getRoot().listNodes()[0]!;
    const translations = doc
      .createAccessor('instance translations')
      .setType('VEC3')
      .setArray(new Float32Array([0, 0, 0, 10, 0, 0]))
      .setBuffer(doc.getRoot().listBuffers()[0]!);
    const extension = doc.createExtension(EXTMeshGPUInstancing).setRequired(true);
    node.setExtension(
      'EXT_mesh_gpu_instancing',
      extension.createInstancedMesh().setAttribute('TRANSLATION', translations),
    );

    const loaded = await loadGlbGeometryFlatScene(await io().writeBinary(doc));
    expect(loaded.instanceCount).toBe(2);
    expect(measureBounds(loaded.root)).toEqual({ min: [0, 0, 0], max: [11, 1, 0] });
  });

  test('reports stable structured reasons for ignored PNG and KTX2 sampling', async () => {
    const png = await loadGlbGeometryFlatScene(
      await io().writeBinary(triangleDocument({ texture: true })),
    );
    expect(png.reasonCodes).toEqual([GLB_GEOMETRY_FLAT_REASON.TEXTURE_SAMPLING_UNSUPPORTED]);
    expect(geometryFlatTextureReasonCode('image/ktx2')).toBe(
      GLB_GEOMETRY_FLAT_REASON.KTX2_SAMPLING_UNSUPPORTED,
    );
  });

  test('review scene retains embedded texture bytes for derivative re-export', async () => {
    const source = triangleDocument({ texture: true });
    const expected = source.getRoot().listTextures()[0]!.getImage()!;
    const loaded = await loadGlbReviewScene(await io().writeBinary(source));
    let encoded: Uint8Array | undefined;
    loaded.root.traverse((node) => {
      const map = (node as { material?: { map?: { userData?: Record<string, unknown> } } }).material
        ?.map;
      const record = map?.userData?.encoded as { bytes?: Uint8Array } | undefined;
      if (record?.bytes) encoded = record.bytes;
    });
    expect(encoded).toEqual(expected);
  });

  test('review scene retains normal and uv attributes from primitive', async () => {
    const doc = triangleDocument();
    const buffer = doc.getRoot().listBuffers()[0]!;
    const normals = doc
      .createAccessor('normals')
      .setType('VEC3')
      .setArray(new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]))
      .setBuffer(buffer);
    const uvs = doc
      .createAccessor('uvs')
      .setType('VEC2')
      .setArray(new Float32Array([0, 0, 1, 0, 0.5, 1]))
      .setBuffer(buffer);
    const prim = doc.getRoot().listMeshes()[0]!.listPrimitives()[0]!;
    prim.setAttribute('NORMAL', normals).setAttribute('TEXCOORD_0', uvs);

    const loaded = await loadGlbReviewScene(await io().writeBinary(doc));
    let foundNormal = false;
    let foundUv = false;
    loaded.root.traverse((node) => {
      const mesh = node as { isMesh?: boolean; geometry?: { getAttribute(name: string): unknown } };
      if (mesh.isMesh && mesh.geometry) {
        if (mesh.geometry.getAttribute('normal')) foundNormal = true;
        if (mesh.geometry.getAttribute('uv')) foundUv = true;
      }
    });
    expect(foundNormal).toBe(true);
    expect(foundUv).toBe(true);
  });
});
