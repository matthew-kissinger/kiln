import { expect, test } from 'bun:test';
import * as THREE from 'three';
import { NodeIO } from '@gltf-transform/core';
import { revolveProfile, type Profile2D } from '../profile';
import { boolDiff, getManifoldModule, manifoldToGeometry } from '../solids';
import { renderSceneToGLB } from '../render';

const section: Profile2D = [
  [0.047, 0.254],
  [0.0555, 0.254],
  [0.058, 0.2565],
  [0.0612, 0.27],
  [0.06, 0.283],
  [0.056, 0.294],
  [0.045, 0.307],
  [0.036, 0.314],
  [0.03, 0.32],
  [0, 0.32],
  [0, 0.3115],
  [0.028, 0.31],
  [0.039, 0.3015],
  [0.047, 0.283],
  [0.049, 0.266],
  [0.047, 0.254],
];

test('a solid that loses its thickness in Float32 fails instead of exporting a partial shell', async () => {
  const mod = await getManifoldModule();
  const cube = mod.Manifold.cube([1, 1, 1]);
  const thin = cube.scale([1e-50, 1, 1]);
  try {
    expect(() => manifoldToGeometry(thin)).toThrow('Solid output cannot retain valid faces');
  } finally {
    thin.delete();
    cube.delete();
  }
});

function assertRenderable(geometry: THREE.BufferGeometry) {
  const p = geometry.getAttribute('position'),
    n = geometry.getAttribute('normal');
  const corner = (i: number) =>
    new THREE.Vector3().fromBufferAttribute(p, geometry.index?.getX(i) ?? i);
  for (let i = 0; i < (geometry.index?.count ?? p.count); i += 3) {
    const a = corner(i),
      b = corner(i + 1),
      c = corner(i + 2);
    expect(b.sub(a).cross(c.sub(a)).length()).toBeGreaterThan(0);
  }
  for (let i = 0; i < n.count; i++)
    expect(Math.hypot(n.getX(i), n.getY(i), n.getZ(i))).toBeCloseTo(1, 5);
}

async function makeCut(scale: number, preserveAttributes: boolean, smooth: boolean) {
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x336699 });
  bodyMat.name = 'Body';
  const cutMat = new THREE.MeshStandardMaterial({ color: 0xcc5533 });
  cutMat.name = 'Cut';
  const geo = await revolveProfile(section, { segments: 96, smooth: true });
  // A linear UV field makes interpolation checkable after cleanup and export.
  const position = geo.getAttribute('position'),
    uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i++) {
    uv[i * 2] = position.getX(i);
    uv[i * 2 + 1] = position.getZ(i);
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const body = new THREE.Mesh(geo, bodyMat);
  body.name = 'Body';
  const cutter = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 24), cutMat);
  cutter.name = 'Cut';
  cutter.position.y = 0.319;
  const cp = cutter.geometry.getAttribute('position'),
    cuv = new Float32Array(cp.count * 2);
  for (let i = 0; i < cp.count; i++) {
    cuv[i * 2] = cp.getX(i);
    cuv[i * 2 + 1] = cp.getZ(i);
  }
  cutter.geometry.setAttribute('uv', new THREE.BufferAttribute(cuv, 2));
  const parent = new THREE.Group();
  parent.scale.setScalar(scale);
  parent.position.x = 1e8 * scale;
  parent.add(body, cutter);
  const before = Array.from(position.array);
  const cut = await boolDiff('CutResult', body, cutter, { preserveAttributes, smooth });
  expect(Array.from(position.array)).toEqual(before);
  expect(body.parent).toBe(parent);
  return cut;
}

for (const smooth of [false, true])
  for (const preserveAttributes of [false, true]) {
    test(`Float32 solid boundary retains finite faces, UVs and source runs (smooth=${smooth}, preserve=${preserveAttributes})`, async () => {
      for (const scale of [1e-12, 1e-6, 1, 1e6, 1e12]) {
        const cut = await makeCut(scale, preserveAttributes, smooth),
          g = cut.geometry;
        assertRenderable(g);
        const p = g.getAttribute('position'),
          uv = g.getAttribute('uv');
        if (preserveAttributes) {
          for (let i = 0; i < p.count; i++) {
            expect(uv.getX(i)).toBeCloseTo(p.getX(i) / scale, 6);
            expect(uv.getY(i)).toBeCloseTo(p.getZ(i) / scale, 6);
          }
          expect((cut.material as THREE.Material[]).map((m) => m.name).sort()).toEqual([
            'Body',
            'Cut',
          ]);
        }
        const provenance = g.userData.kilnCsgProvenance;
        const triangles = (g.index?.count ?? p.count) / 3;
        expect(provenance.faceIds.length).toBe(triangles);
        expect(provenance.runs.reduce((n: number, r: { count: number }) => n + r.count, 0)).toBe(
          triangles,
        );
        expect(new Set(provenance.runs.map((r: { sourceName: string }) => r.sourceName))).toEqual(
          new Set(['Body', 'Cut']),
        );
        if (preserveAttributes)
          expect(g.groups.reduce((n, r) => n + r.count, 0)).toBe(triangles * 3);
        // Manifold accepts the final consumer vertices, including their topology,
        // rather than merely reporting a valid higher-precision intermediate.
        const mod = await getManifoldModule();
        const mesh = new mod.Mesh({
          numProp: 3,
          vertProperties: new Float32Array(p.array),
          triVerts: g.index
            ? new Uint32Array(g.index.array)
            : Uint32Array.from({ length: p.count }, (_, i) => i),
        });
        mesh.merge();
        const solid = mod.Manifold.ofMesh(mesh);
        try {
          expect(solid.status()).toBe('NoError');
          expect(solid.volume()).toBeGreaterThan(0);
        } finally {
          solid.delete();
        }
      }
    });
  }

for (const gltfExporter of ['legacy', 'three'] as const)
  test(`${gltfExporter} exports the cleaned cut with valid normals and material ownership`, async () => {
    const root = new THREE.Group();
    root.add(await makeCut(1, true, false));
    const rendered = await renderSceneToGLB(root, { gltfExporter, optimize: 'off' });
    expect(rendered.gltfValidation.issues.numErrors).toBe(0);
    const doc = await new NodeIO().readBinary(rendered.bytes);
    expect(
      doc
        .getRoot()
        .listMaterials()
        .map((m) => m.getName())
        .sort(),
    ).toEqual(['Body', 'Cut']);
    for (const mesh of doc.getRoot().listMeshes())
      for (const primitive of mesh.listPrimitives()) {
        const g = new THREE.BufferGeometry();
        g.setAttribute(
          'position',
          new THREE.BufferAttribute(
            new Float32Array(primitive.getAttribute('POSITION')!.getArray()!),
            3,
          ),
        );
        g.setAttribute(
          'normal',
          new THREE.BufferAttribute(
            new Float32Array(primitive.getAttribute('NORMAL')!.getArray()!),
            3,
          ),
        );
        if (primitive.getIndices())
          g.setIndex(
            new THREE.BufferAttribute(new Uint32Array(primitive.getIndices()!.getArray()!), 1),
          );
        assertRenderable(g);
      }
  });
