import { expect, test } from 'bun:test';
import { NodeIO } from '@gltf-transform/core';
import { buildSandboxGlobals } from '../primitives';
import { renderGLBInProcess } from '../render';
import { createDiscovery } from '../discovery';
import { describeAssembly } from '../assembly';
import { loadGlbReviewScene } from '../views/glb';

test('semantic joint lookup works in authored source and survives export and review reload', async () => {
  const result = await renderGLBInProcess(`function build(){
    const root=createRoot('ArticulatedAssembly');
    const mat=gameMaterial('#778899');
    const wheel=createWheelAssembly('Wheel',{tire:mat,rim:mat},{radius:.5,width:.2,side:'left',index:0,steering:true,parent:root});
    const arm=createJointChain('Arm',[{role:'arm',offset:[0,1,0]},{role:'tip',offset:[1,0,0]}],{parent:root});
    arm.nodes.forEach((node,i)=>node.name='ArmNode'+i);
    if(describeAssembly(root).joints.length!==4) throw new Error('semantic joints missing');
    return root;
  }`);
  const loaded = await loadGlbReviewScene(result.glb);
  const joints = describeAssembly(loaded.root).joints;
  expect(joints).toHaveLength(4);
  expect(joints.map((joint) => joint.kinds[0]).sort()).toEqual([
    'articulated',
    'articulated',
    'steering',
    'wheel-spin',
  ]);
  expect(joints.filter((joint) => joint.descriptor).map((joint) => joint.descriptor!.role)).toEqual(
    ['arm', 'tip'],
  );
});

test('assembly access and replication work through the authored sandbox and actual GLB export', async () => {
  const sandbox = buildSandboxGlobals();
  expect(typeof sandbox.describeAssembly).toBe('function');
  expect(typeof sandbox.replicateAssembly).toBe('function');
  const result = await renderGLBInProcess(`function build(){
    const root=createRoot('AssemblyAsset');
    const bay=createRoot('Bay');root.add(bay);
    createPart('Post',boxGeo(0.2,2,0.2),gameMaterial(0x777777),{parent:bay,position:[0,1,0]});
    const view=describeAssembly(bay);
    const replica=replicateAssembly(view,{namespace:'bay2',parent:root});
    replica.root.position.x=2;
    return root;
  }`);
  const doc = await new NodeIO().readBinary(result.glb);
  expect(
    doc
      .getRoot()
      .listNodes()
      .some((node) => node.getName().startsWith('bay2__')),
  ).toBe(true);
  for (const name of ['describeAssembly', 'replicateAssembly']) {
    const response = await createDiscovery()({ ids: [name] });
    expect(response.error).toBeUndefined();
    expect(response.entries[0]?.name).toBe(name);
  }
});
