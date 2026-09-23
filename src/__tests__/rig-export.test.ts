import { afterEach, expect, test } from 'bun:test';
import { WebIO } from '@gltf-transform/core';
import * as THREE from 'three';
import { createJointChain, stampCharacterRigGraphV1 } from '../character';
import { renderSceneToGLB } from '../render';

const previous = process.env.KILN_GLTF_EXPORTER;
afterEach(() => {
  if (previous === undefined) delete process.env.KILN_GLTF_EXPORTER;
  else process.env.KILN_GLTF_EXPORTER = previous;
});
function fixture() {
  const root = new THREE.Group();
  root.name = 'Rig';
  const chain = createJointChain(
    'Arm',
    [
      { role: 'core', offset: [0, 1, 0] },
      { role: 'tip', offset: [1, 0, 0], endEffector: true },
    ],
    { parent: root },
  );
  stampCharacterRigGraphV1(root, { bodyPlan: 'custom', joints: chain.descriptors });
  chain.end.add(
    new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshStandardMaterial()),
  );
  root.userData.privatePayload = root;
  return { root, chain };
}
for (const exporter of ['legacy', 'three'] as const) {
  for (const optimize of ['off', 'palette', 'full'] as const)
    test(`${exporter}/${optimize} preserves typed rig descriptors without arbitrary userData`, async () => {
      process.env.KILN_GLTF_EXPORTER = exporter;
      const { root, chain } = fixture();
      const output = await renderSceneToGLB(root, { optimize });
      const doc = await new WebIO().readBinary(output.bytes);
      const exported = doc.getRoot().listNodes();
      const rig = exported.find((n) => n.getName() === 'Rig')!;
      expect(rig.getExtras().kilnCharacterRig).toEqual(root.userData.kilnCharacterRig);
      expect(rig.getExtras().privatePayload).toBeUndefined();
      for (const node of chain.nodes)
        expect(
          exported.find((n) => n.getName() === node.name)!.getExtras().kilnCharacterJoint,
        ).toEqual(node.userData.kilnCharacterJoint);
      expect(output.gltfValidation.issues.numErrors).toBe(0);
      expect(root.userData.privatePayload).toBe(root);
    });
  test(`${exporter} rejects malformed reserved rig and joint payloads`, async () => {
    process.env.KILN_GLTF_EXPORTER = exporter;
    for (const key of ['kilnCharacterRig', 'kilnCharacterJoint']) {
      const { root } = fixture();
      root.userData[key] = { schemaVersion: 999 };
      await expect(renderSceneToGLB(root, { derivative: true })).rejects.toThrow(key);
    }
  });
}
