import { describe, expect, it } from 'bun:test';
import * as THREE from 'three';
import { WebIO } from '@gltf-transform/core';
import { renderSceneToGLB } from '../render';

function fixture() {
  const root = new THREE.Group();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3),
  );
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1], 2));
  geometry.setAttribute(
    'tangent',
    new THREE.Float32BufferAttribute([1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1], 4),
  );
  geometry.setIndex([0, 1, 2]);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide }));
  mesh.name = 'CustomPanel';
  root.add(mesh);
  return { root, geometry };
}

describe('custom mesh export contract', () => {
  it('round trips supported indexed attributes', async () => {
    const { root, geometry } = fixture();
    const result = await renderSceneToGLB(root, { dedup: false, optimize: 'off', instance: 'off' });
    const doc = await new WebIO().readBinary(result.bytes);
    const primitive = doc.getRoot().listMeshes()[0]!.listPrimitives()[0]!;
    for (const [attribute, semantic] of [
      ['position', 'POSITION'],
      ['normal', 'NORMAL'],
      ['uv', 'TEXCOORD_0'],
      ['tangent', 'TANGENT'],
    ]) {
      expect(Array.from(primitive.getAttribute(semantic!)!.getArray()!)).toEqual(
        Array.from(geometry.getAttribute(attribute!).array),
      );
    }
    expect(Array.from(primitive.getIndices()!.getArray()!)).toEqual([0, 1, 2]);
  });

  it('identifies dropped attributes and rejects them in strict mode', async () => {
    const { root, geometry } = fixture();
    geometry.setAttribute('uv1', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1], 2));
    const result = await renderSceneToGLB(root);
    expect(
      result.warnings.some(
        (warning) =>
          warning.includes('CustomPanel') &&
          warning.includes('uv1') &&
          warning.includes('EXPORT_ATTRIBUTE_UNSUPPORTED'),
      ),
    ).toBe(true);
    await expect(renderSceneToGLB(root, { geometryPolicy: 'strict' })).rejects.toThrow('uv1');
  });

  it('rejects nonfinite positions before writing invalid bytes', async () => {
    const { root, geometry } = fixture();
    geometry.getAttribute('position').setX(0, Number.NaN);
    await expect(renderSceneToGLB(root)).rejects.toThrow('CustomPanel: position');
  });

  it('preserves interleaved source attributes using their stride and offset', async () => {
    const { root, geometry } = fixture();
    const data = new THREE.InterleavedBuffer(
      new Float32Array([0, 0, 0, 99, 1, 0, 0, 99, 0, 1, 0, 99]),
      4,
    );
    geometry.setAttribute('position', new THREE.InterleavedBufferAttribute(data, 3, 0));
    const result = await renderSceneToGLB(root, { dedup: false, optimize: 'off', instance: 'off' });
    const doc = await new WebIO().readBinary(result.bytes);
    expect(
      Array.from(
        doc.getRoot().listMeshes()[0]!.listPrimitives()[0]!.getAttribute('POSITION')!.getArray()!,
      ),
    ).toEqual([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  });
});
