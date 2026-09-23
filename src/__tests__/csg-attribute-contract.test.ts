import { expect, test } from 'bun:test';
import { NodeIO } from '@gltf-transform/core';
import * as THREE from 'three';
import { autoUnwrap } from '../uv';
import { renderSceneToGLB } from '../render';
import { boolDiff, boolIntersect, boolUnion, hull } from '../solids';

const operations = { boolUnion, boolDiff, boolIntersect, hull };
function box(name: string, color: number, x = 0) {
  const material = new THREE.MeshStandardMaterial({ color });
  material.name = name;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), material);
  mesh.name = name;
  mesh.position.x = x;
  return mesh;
}
function notes(mesh: THREE.Mesh) {
  return mesh.geometry.userData.kilnAttributeWarnings as { code: string; message: string }[];
}

for (const preserveAttributes of [false, true]) {
  test(`CSG reports unsupported attributes and carries source diagnostics (preserve=${preserveAttributes})`, async () => {
    const source = box('Source', 0xff0000);
    for (const [name, size] of [
      ['color', 4],
      ['uv1', 2],
      ['tangent', 4],
      ['temperature', 1],
    ] as const)
      source.geometry.setAttribute(
        name,
        new THREE.Float32BufferAttribute(new Float32Array(24 * size).fill(0.5), size),
      );
    source.geometry.morphAttributes.position = [source.geometry.getAttribute('position').clone()];
    source.updateMorphTargets();
    source.geometry.userData.kilnAttributeWarnings = [
      { code: 'SOURCE_ATTRIBUTE', message: 'Source attribute diagnostic.' },
    ];
    source.geometry.userData.kilnGeometryWarnings = [
      { code: 'SOURCE_GEOMETRY', message: 'Source geometry diagnostic.' },
    ];
    const before = JSON.stringify(source.geometry.toJSON());
    const result = await boolUnion('Union', source, box('Other', 0x0000ff, 1), {
      preserveAttributes,
    });
    expect(Object.keys(result.geometry.attributes).sort()).toEqual(
      preserveAttributes ? ['normal', 'position', 'uv'] : ['normal', 'position'],
    );
    const dropped = notes(result).find((n) => n.code === 'CSG_ATTRIBUTES_DROPPED');
    for (const name of ['color', 'uv1', 'tangent', 'temperature'])
      expect(dropped?.message).toContain(name);
    expect(notes(result).some((n) => n.code === 'CSG_MORPHS_DROPPED')).toBe(true);
    expect(notes(result).some((n) => n.code === 'SOURCE_ATTRIBUTE')).toBe(true);
    expect(result.geometry.userData.kilnGeometryWarnings).toContainEqual({
      code: 'SOURCE_GEOMETRY',
      message: 'Source geometry diagnostic.',
    });
    expect(JSON.stringify(source.geometry.toJSON())).toBe(before);
    const inherited = notes(result).find((n) => n.code === 'SOURCE_ATTRIBUTE')!;
    inherited.message = 'Output edit';
    expect(source.geometry.userData.kilnAttributeWarnings[0].message).toBe(
      'Source attribute diagnostic.',
    );
    for (const gltfExporter of ['legacy', 'three'] as const) {
      const root = new THREE.Group().add(result);
      const exported = await renderSceneToGLB(root, { gltfExporter, optimize: 'off' });
      for (const code of [
        'CSG_ATTRIBUTES_DROPPED',
        'CSG_MORPHS_DROPPED',
        'SOURCE_ATTRIBUTE',
        'SOURCE_GEOMETRY',
      ])
        expect(exported.warnings.some((w) => w.includes(code))).toBe(true);
    }
  });
}

for (const kind of ['instanced', 'skinned', 'active morph'] as const) {
  test(`CSG rejects ${kind} operands instead of silently using the base mesh`, async () => {
    const source = box('Source', 0xff0000);
    let operand: THREE.Mesh = source;
    if (kind === 'instanced') {
      const instances = new THREE.InstancedMesh(source.geometry, source.material, 2);
      instances.setMatrixAt(1, new THREE.Matrix4().makeTranslation(4, 0, 0));
      operand = instances;
    } else if (kind === 'skinned')
      operand = new THREE.SkinnedMesh(source.geometry, source.material);
    else {
      source.geometry.morphAttributes.position = [source.geometry.getAttribute('position').clone()];
      source.updateMorphTargets();
      source.morphTargetInfluences![0] = 0.5;
    }
    for (const operation of Object.values(operations))
      for (const preserveAttributes of [false, true])
        await expect(
          operation('Result', operand, box('Other', 0x0000ff, 1), { preserveAttributes }),
        ).rejects.toThrow(/CSG.*bake.*static/i);
  });
}

// Compare complete oriented triangle corner records, independent of primitive split,
// index welding and cyclic corner rotation. UV/material associations must survive.
function triangleKey(corners: string[], material: string) {
  return (
    material +
    ':' +
    [corners, [corners[1]!, corners[2]!, corners[0]!], [corners[2]!, corners[0]!, corners[1]!]]
      .map((c) => c.join('|'))
      .sort()[0]
  );
}
const vectorKey = (v: number[]) => v.map((n) => Math.round(n * 1e5)).join(',');
function meshTriangles(mesh: THREE.Mesh) {
  mesh.updateWorldMatrix(true, false);
  const g = mesh.geometry,
    p = g.getAttribute('position'),
    uv = g.getAttribute('uv'),
    n = g.getAttribute('normal');
  const count = g.index?.count ?? p.count;
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const result: string[] = [];
  for (let i = 0; i < count; i += 3) {
    const material =
      g.groups.find((group) => i >= group.start && i < group.start + group.count)?.materialIndex ??
      0;
    const corners = [0, 1, 2].map((k) => {
      const v = g.index?.getX(i + k) ?? i + k;
      const point = new THREE.Vector3().fromBufferAttribute(p, v).applyMatrix4(mesh.matrixWorld);
      return vectorKey([
        ...point.toArray(),
        n.getX(v),
        n.getY(v),
        n.getZ(v),
        ...(uv ? [uv.getX(v), uv.getY(v)] : []),
      ]);
    });
    result.push(triangleKey(corners, materials[material]!.name));
  }
  return result.sort();
}
async function glbTriangles(bytes: Uint8Array) {
  const document = await new NodeIO().readBinary(bytes);
  const result: string[] = [];
  for (const node of document.getRoot().listNodes()) {
    const matrix = new THREE.Matrix4().fromArray(node.getWorldMatrix());
    for (const primitive of node.getMesh()?.listPrimitives() ?? []) {
      const p = primitive.getAttribute('POSITION')!,
        uv = primitive.getAttribute('TEXCOORD_0'),
        n = primitive.getAttribute('NORMAL')!,
        indices = primitive.getIndices();
      expect(primitive.getAttribute('COLOR_0')).toBeNull();
      expect(primitive.getAttribute('TEXCOORD_1')).toBeNull();
      expect(primitive.listTargets()).toHaveLength(0);
      const count = indices?.getCount() ?? p.getCount();
      for (let i = 0; i < count; i += 3) {
        const corners = [0, 1, 2].map((k) => {
          const v = indices?.getScalar(i + k) ?? i + k;
          const point = new THREE.Vector3().fromArray(p.getElement(v, [])).applyMatrix4(matrix);
          return vectorKey([
            ...point.toArray(),
            ...n.getElement(v, []),
            ...(uv?.getElement(v, []) ?? []),
          ]);
        });
        result.push(triangleKey(corners, primitive.getMaterial()!.getName()));
      }
    }
  }
  return result.sort();
}
for (const [name, operation] of Object.entries(operations)) {
  for (const preserveAttributes of [false, true]) {
    for (const gltfExporter of ['legacy', 'three'] as const) {
      test(`${name}, preserve=${preserveAttributes}, ${gltfExporter}: triangle winding, normals, UVs and material assignments survive export`, async () => {
        const a = box('Body', 0xff0000, 3),
          b = box('Cutter', 0x0000ff, 4);
        const result = await operation('Result', a, b, { preserveAttributes });
        const uv = result.geometry.getAttribute('uv');
        expect(!!uv).toBe(preserveAttributes && name !== 'hull');
        if (!preserveAttributes || name === 'hull') expect(result.material).toBe(a.material);
        const expected = meshTriangles(result);
        const exported = await renderSceneToGLB(new THREE.Group().add(result), {
          gltfExporter,
          optimize: 'off',
        });
        expect(exported.gltfValidation.issues.numErrors).toBe(0);
        expect(await glbTriangles(exported.bytes)).toEqual(expected);
      });
    }
  }
}

for (const preserveAttributes of [false, true]) {
  test(`empty CSG rejects before export without mutating inputs (preserve=${preserveAttributes})`, async () => {
    const body = box('Body', 0xff0000),
      cutter = box('Cutter', 0x0000ff);
    const before = JSON.stringify(body.geometry.toJSON());
    await expect(boolDiff('Empty', body, cutter, { preserveAttributes })).rejects.toThrow(
      /result is empty.*removed the entire body/s,
    );
    cutter.position.x = 10;
    await expect(boolIntersect('Empty', body, cutter, { preserveAttributes })).rejects.toThrow(
      /result is empty.*do not overlap/s,
    );
    for (const operation of Object.values(operations))
      await expect(
        operation('Empty', body, new THREE.Group(), { preserveAttributes }),
      ).rejects.toThrow(/contributes no triangles/);
    expect(JSON.stringify(body.geometry.toJSON())).toBe(before);
  });
  for (const gltfExporter of ['legacy', 'three'] as const) {
    test(`${gltfExporter} embeds textured CSG after explicit UV retention or unwrap (preserve=${preserveAttributes})`, async () => {
      const a = box('Body', 0xff0000),
        b = box('Cutter', 0x0000ff, 1);
      for (const mesh of [a, b]) {
        const texture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        mesh.material.map = texture;
        const normal = new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1);
        normal.needsUpdate = true;
        mesh.material.normalMap = normal;
      }
      const result = await boolDiff('Textured', a, b, { preserveAttributes });
      expect(result.geometry.getAttribute('tangent')).toBeUndefined();
      if (!preserveAttributes) result.geometry = await autoUnwrap(result.geometry);
      const exported = await renderSceneToGLB(new THREE.Group().add(result), {
        gltfExporter,
        optimize: 'off',
      });
      expect(exported.gltfValidation.issues.numErrors).toBe(0);
      const document = await new NodeIO().readBinary(exported.bytes);
      expect(document.getRoot().listTextures().length).toBeGreaterThan(0);
      for (const material of document.getRoot().listMaterials()) {
        expect(material.getBaseColorTexture()?.getImage()?.length).toBeGreaterThan(0);
        expect(material.getNormalTexture()?.getImage()?.length).toBeGreaterThan(0);
      }
      for (const primitive of document
        .getRoot()
        .listMeshes()
        .flatMap((m) => m.listPrimitives())) {
        expect(primitive.getAttribute('TEXCOORD_0')?.getCount()).toBe(
          primitive.getAttribute('POSITION')!.getCount(),
        );
        const tangent = primitive.getAttribute('TANGENT')!;
        const normal = primitive.getAttribute('NORMAL')!;
        expect(tangent.getCount()).toBe(normal.getCount());
        for (let i = 0; i < tangent.getCount(); i++) {
          const t = tangent.getElement(i, []);
          const n = new THREE.Vector3().fromArray(normal.getElement(i, []));
          const v = new THREE.Vector3().fromArray(t);
          expect(v.length()).toBeCloseTo(1, 5);
          expect(v.dot(n)).toBeCloseTo(0, 5);
          expect(Math.abs(t[3]!)).toBe(1);
        }
      }
    });
  }
}
