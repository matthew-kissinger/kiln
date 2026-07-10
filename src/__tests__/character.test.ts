import { describe, expect, test } from 'bun:test';
import { WebIO } from '@gltf-transform/core';
import * as THREE from 'three';

import {
  BIPED_RIG_PRESET_V1,
  QUADRUPED_RIG_PRESET_V1,
  characterBodyPlanRecipe,
  characterJointNodeName,
  createCharacterJointDescriptorV1,
  createCharacterRigGraphV1,
  createJointChain,
  expandCharacterRigPreset,
  readCharacterJointDescriptorV1,
  stampCharacterRigGraphV1,
  validateCharacterRigGraphV1,
  type JointChainSegmentV1,
} from '../character';
import { createAssetIntentV1, readSemanticMetadataV1 } from '../contracts';
import { renderSceneToGLB } from '../render';

const chainCases: Array<{ name: string; segments: JointChainSegmentV1[] }> = [
  {
    name: 'BipedLeg',
    segments: [
      { role: 'hip.left', offset: [0, 1, -0.15], side: 'left' },
      { role: 'knee.left', offset: [0, -0.5, 0], side: 'left' },
      {
        role: 'ankle.left',
        offset: [0, -0.5, 0],
        side: 'left',
        endEffector: true,
        contact: true,
      },
    ],
  },
  {
    name: 'QuadrupedForeleg',
    segments: [
      { role: 'shoulder.fore.right', offset: [0.3, 0.7, 0.25], side: 'right' },
      { role: 'elbow.fore.right', offset: [0, -0.4, 0], side: 'right' },
      {
        role: 'paw.fore.right',
        offset: [0, -0.3, 0],
        side: 'right',
        endEffector: true,
        contact: true,
      },
    ],
  },
  {
    name: 'Wing',
    segments: [
      { role: 'shoulder.wing.left', offset: [0, 1, -0.2], side: 'left' },
      { role: 'wing.mid.left', offset: [0, 0, -0.5], side: 'left' },
      { role: 'wing.tip.left', offset: [0, 0, -0.5], side: 'left', endEffector: true },
    ],
  },
  {
    name: 'Tail',
    segments: [
      { role: 'tail.base', offset: [-0.3, 0.6, 0] },
      { role: 'tail.mid', offset: [-0.4, 0, 0] },
      { role: 'tail.tip', offset: [-0.4, 0, 0], endEffector: true },
    ],
  },
  {
    name: 'Tentacle',
    segments: [
      { role: 'tentacle.3.base', offset: [0, 0.3, 0.2] },
      { role: 'tentacle.3.mid', offset: [0.2, 0, 0] },
      { role: 'tentacle.3.tip', offset: [0.2, 0, 0], endEffector: true },
    ],
  },
];

describe('CHAR-003/005 semantic rig graphs', () => {
  test('biped and quadruped presets are data graphs with every declared parent present', () => {
    for (const preset of [BIPED_RIG_PRESET_V1, QUADRUPED_RIG_PRESET_V1]) {
      const roles = new Set(preset.joints.map((joint) => joint.role));
      expect(validateCharacterRigGraphV1(preset).valid).toBe(true);
      expect(preset.joints.every((joint) => !joint.parentRole || roles.has(joint.parentRole))).toBe(
        true,
      );
      expect(new Set(preset.joints.map((joint) => joint.role)).size).toBe(preset.joints.length);
    }
    expect(BIPED_RIG_PRESET_V1.joints.map((joint) => joint.role)).toEqual(
      expect.arrayContaining([
        'hips',
        'spine',
        'head',
        'shoulder.left',
        'elbow.left',
        'wrist.left',
        'hip.right',
        'knee.right',
        'ankle.right',
      ]),
    );
    expect(
      QUADRUPED_RIG_PRESET_V1.joints.filter((joint) => joint.contact).map((joint) => joint.role),
    ).toEqual(['paw.fore.left', 'paw.fore.right', 'paw.hind.left', 'paw.hind.right']);
  });

  test('custom graph accepts non-humanoid roles and rejects missing parents/cycles', () => {
    const serpent = createCharacterRigGraphV1({
      bodyPlan: 'serpentine',
      joints: [
        createCharacterJointDescriptorV1({ role: 'spine.0' }),
        createCharacterJointDescriptorV1({ role: 'spine.1', parentRole: 'spine.0' }),
        createCharacterJointDescriptorV1({
          role: 'tail.tip',
          parentRole: 'spine.1',
          endEffector: true,
          contact: true,
        }),
      ],
    });
    expect(validateCharacterRigGraphV1(serpent)).toEqual({
      valid: true,
      value: serpent,
      issues: [],
    });
    expect(
      validateCharacterRigGraphV1({
        schemaVersion: 1,
        bodyPlan: 'custom',
        joints: [
          createCharacterJointDescriptorV1({ role: 'a', parentRole: 'b' }),
          createCharacterJointDescriptorV1({ role: 'b', parentRole: 'a' }),
        ],
      }).issues.map((issue) => issue.code),
    ).toContain('JOINT_PARENT_CYCLE');
  });

  test('preset expansion returns a detached graph', () => {
    const expanded = expandCharacterRigPreset('biped');
    expect(expanded).toEqual(BIPED_RIG_PRESET_V1);
    expect(expanded).not.toBe(BIPED_RIG_PRESET_V1);
    expect(expanded.joints).not.toBe(BIPED_RIG_PRESET_V1.joints);
  });
});

describe('CHAR-006/007 body-plan-agnostic createJointChain', () => {
  for (const fixture of chainCases) {
    test(`${fixture.name} has deterministic names, hierarchy, pivots, frames, and transformed-parent behavior`, () => {
      const asset = new THREE.Object3D();
      asset.name = `Asset_${fixture.name}`;
      asset.position.set(3, 2, -4);
      asset.rotation.set(0.2, 0.6, -0.1);
      asset.scale.set(1.5, 1.5, 1.5);
      const chain = createJointChain(fixture.name, fixture.segments, { parent: asset });

      expect(chain.nodes.map((node) => node.name)).toEqual(
        fixture.segments.map((segment) => characterJointNodeName(fixture.name, segment.role)),
      );
      expect(chain.root.parent).toBe(asset);
      for (let index = 1; index < chain.nodes.length; index++) {
        expect(chain.nodes[index]?.parent).toBe(chain.nodes[index - 1]);
      }
      const localEnd = fixture.segments.reduce(
        (sum, segment) => sum.add(new THREE.Vector3(...segment.offset)),
        new THREE.Vector3(),
      );
      asset.updateMatrixWorld(true);
      const expectedWorld = localEnd.applyMatrix4(asset.matrixWorld);
      expect(
        chain.end.getWorldPosition(new THREE.Vector3()).distanceTo(expectedWorld),
      ).toBeLessThan(1e-8);

      const before = chain.end.getWorldPosition(new THREE.Vector3());
      const childOffset = new THREE.Vector3(...fixture.segments[2]!.offset);
      if (Math.abs(childOffset.y) >= Math.max(Math.abs(childOffset.x), Math.abs(childOffset.z))) {
        chain.nodes[1]?.rotateZ(0.35);
      } else {
        chain.nodes[1]?.rotateY(0.35);
      }
      asset.updateMatrixWorld(true);
      expect(chain.end.getWorldPosition(new THREE.Vector3()).distanceTo(before)).toBeGreaterThan(
        0.01,
      );

      for (const [index, node] of chain.nodes.entries()) {
        const descriptor = readCharacterJointDescriptorV1(node)!;
        expect(descriptor.role).toBe(fixture.segments[index]!.role);
        expect(descriptor.parentRole).toBe(
          index === 0 ? undefined : fixture.segments[index - 1]?.role,
        );
        const semantic = readSemanticMetadataV1(node)!;
        expect(semantic.roles).toContain(`joint.${descriptor.role}`);
        expect(semantic.frames.map((frame) => frame.id)).toEqual(
          expect.arrayContaining(['rest', 'forward', 'bend']),
        );
      }
    });
  }

  test('rejects duplicate roles instead of creating ambiguous Joint_* nodes', () => {
    expect(() =>
      createJointChain('Bad', [
        { role: 'segment', offset: [0, 0, 0] },
        { role: 'segment', offset: [1, 0, 0] },
      ]),
    ).toThrow('Duplicate joint-chain role');
  });

  test('semantic joint extras survive exact GLB export/reload', async () => {
    const root = new THREE.Object3D();
    root.name = 'SemanticChain';
    const chain = createJointChain('Tail', chainCases[3]!.segments, { parent: root });
    stampCharacterRigGraphV1(root, { bodyPlan: 'custom', joints: chain.descriptors });
    const visual = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.2),
      new THREE.MeshStandardMaterial(),
    );
    visual.name = 'Mesh_Body';
    root.add(visual);
    const rendered = await renderSceneToGLB(root, {
      intent: createAssetIntentV1({
        category: 'character',
        capabilities: [],
        character: { bodyPlan: 'custom', grounded: false },
      }),
    });
    const document = await new WebIO().readBinary(rendered.bytes);
    const exported = document
      .getRoot()
      .listNodes()
      .filter((node) => node.getName().startsWith('Joint_'));
    expect(exported).toHaveLength(3);
    const exportedRoot = document
      .getRoot()
      .listNodes()
      .find((node) => node.getName() === 'SemanticChain');
    expect(exportedRoot).toBeDefined();
    const rootSemantic = exportedRoot!.getExtras()['kilnSemantic'] as { roles: string[] };
    expect(rootSemantic.roles).toEqual(
      expect.arrayContaining(['character.rig', 'character.body-plan.custom']),
    );
    for (const node of exported) {
      const semantic = node.getExtras()['kilnSemantic'] as {
        roles: string[];
        frames: Array<{ id: string }>;
        relationships: Array<{ kind: string; target: string }>;
      };
      expect(semantic.roles).toContain('skeleton.joint');
      expect(semantic.roles.some((role) => role.startsWith('joint.'))).toBe(true);
      expect(semantic.frames.map((frame) => frame.id)).toEqual(
        expect.arrayContaining(['rest', 'forward', 'bend']),
      );
    }
  });
});

describe('CHAR-031 resolved body-plan recipe', () => {
  test('injects one resolved recipe without cross-plan anatomy', () => {
    const dog = characterBodyPlanRecipe('quadruped');
    expect(dog).toContain('QUADRUPED');
    expect(dog).not.toContain('BIPED');
    const serpent = characterBodyPlanRecipe('serpentine');
    expect(serpent).toContain('SERPENTINE');
    expect(serpent.toLowerCase()).not.toContain('knee');
    expect(serpent).not.toContain('BIPED');
  });

  test('custom recipe names only roles from its declared graph', () => {
    const graph = createCharacterRigGraphV1({
      bodyPlan: 'custom',
      joints: [
        createCharacterJointDescriptorV1({ role: 'core' }),
        createCharacterJointDescriptorV1({ role: 'sensor.tip', parentRole: 'core' }),
      ],
    });
    const recipe = characterBodyPlanRecipe('custom', graph);
    expect(recipe).toContain('core, sensor.tip');
    expect(recipe).not.toContain('shoulder');
  });
});
