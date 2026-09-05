import { expect, it } from 'bun:test';
import { NodeIO } from '@gltf-transform/core';
import { renderGLB } from '../render';

it('exports equation, deformation, sweep and loft helpers from generated source', async () => {
  const code = `
const meta = { name: 'Geometry authoring sample', category: 'prop' };
function build() {
  const root = createRoot('Root');
  const mat = gameMaterial(0x778899);
  const surface = parametricSurface((u,v) => [u,0.2*Math.sin(u*2)*Math.cos(v*3),v], {u:[-1,1],v:[-1,1],uSegments:8,vSegments:8});
  createPart('Canopy', creaseNormals(displace(surface, ([x,y,z]) => [0,0.02*Math.sin(z*8),0])), mat, {parent:root});
  const profile = [[-.1,-.15],[.1,-.15],[.1,.15],[-.1,.15]];
  createPart('Rail', sweepProfile(profile, [[0,0,0],[0,1,0],[.3,2,0]], {twist:15}), mat, {parent:root});
  createPart('Housing', loftProfiles([{profile},{profile,frame:{origin:[0,1,0],rotation:[0,20,0]}}]), mat, {parent:root});
  return root;
}`;
  const result = await renderGLB(code);
  const doc = await new NodeIO().readBinary(result.glb);
  const primitives = doc
    .getRoot()
    .listMeshes()
    .flatMap((mesh) => mesh.listPrimitives());
  expect(primitives.length).toBeGreaterThanOrEqual(3);
  for (const primitive of primitives) {
    expect(primitive.getAttribute('POSITION')!.getCount()).toBeGreaterThan(0);
    expect(primitive.getAttribute('TEXCOORD_0')!.getCount()).toBe(
      primitive.getAttribute('POSITION')!.getCount(),
    );
    const normals = primitive.getAttribute('NORMAL')!;
    for (let i = 0; i < normals.getCount(); i++) {
      const xyz = normals.getElement(i, []);
      expect(Math.hypot(...xyz)).toBeCloseTo(1, 4);
    }
  }
});
