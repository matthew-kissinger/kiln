import { expect, test } from 'bun:test';
import { WebIO, type Document, type Node } from '@gltf-transform/core';
import * as THREE from 'three';
import { describeAssembly, replicateAssembly } from '../assembly';
import { createWheelAssembly } from '../vehicle';
import { createGableRoof } from '../architecture';
import { createJointChain, stampCharacterRigGraphV1 } from '../character';
import { stampSemanticMetadataV1 } from '../contracts';
import { createClip, rotationTrack, wallWithOpening } from '../primitives';
import { renderSceneToGLB } from '../render';
import { loadGlbReviewScene } from '../views/glb';
import { poseSceneAtTime, prepareClip } from '../views/pose';

type Family = 'wheel' | 'roof' | 'bay' | 'branched-chain';
function fixture(family: Family, variant: boolean) {
  const material = new THREE.MeshStandardMaterial({ color: 0x778899 });
  material.name = 'StructuralSurface';
  let root: THREE.Object3D;
  let clips: THREE.AnimationClip[] = [];
  if (family === 'wheel') {
    const wheel = createWheelAssembly(
      'Caster',
      { tire: material, rim: material },
      {
        radius: 0.5,
        width: 0.2,
        rimRadius: variant ? 0.3 : 0.25,
        side: 'left',
        index: 'support',
        steering: true,
      },
    );
    root = wheel.root;
    clips = [
      createClip('Spin', 1, [
        rotationTrack(wheel.spinPivot.name, [
          { time: 0, rotation: [0, 0, 0] },
          { time: 1, rotation: [0, 0, 90] },
        ]),
      ]),
    ];
  } else if (family === 'roof') {
    root = createGableRoof('Roof', material, {
      spanX: 4,
      spanZ: 3,
      rise: variant ? 1.2 : 0.8,
      thickness: 0.1,
      overhang: 0,
    }).root;
  } else if (family === 'bay') {
    root = wallWithOpening('Bay', material, {
      length: 3,
      height: 2.6,
      thickness: 0.3,
      axis: 'x',
      opening: { kind: 'window', width: variant ? 1.8 : 1.2, height: 1.4, sill: 0.7 },
    });
    stampSemanticMetadataV1(root, {
      roles: ['structure.bay'],
      relationships: [{ kind: 'contains', targetType: 'node', target: root.children[0]!.name }],
    });
  } else {
    root = new THREE.Group();
    root.name = 'Mechanism';
    const core = createJointChain('Core', [{ role: 'core', offset: [0, 0.4, 0] }], {
      parent: root,
    });
    const branches = [-1, 1].map((side, index) =>
      createJointChain(
        `Arm${index}`,
        [
          { role: `arm${index}`, offset: [side * 0.2, 0, 0] },
          { role: `tip${index}`, offset: [side * (variant ? 0.9 : 0.6), 0, 0], endEffector: true },
        ],
        { parent: core.end, parentRole: 'core' },
      ),
    );
    for (const [index, branch] of branches.entries()) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.15), material);
      mesh.name = `Tool${index}`;
      branch.end.add(mesh);
    }
    stampCharacterRigGraphV1(root, {
      bodyPlan: 'custom',
      joints: [...core.descriptors, ...branches.flatMap((branch) => branch.descriptors)],
    });
    clips = [
      createClip('Bend', 1, [
        rotationTrack(branches[0]!.root.name, [
          { time: 0, rotation: [0, 0, 0] },
          { time: 1, rotation: [0, 0, 45] },
        ]),
      ]),
    ];
  }
  return { root, clips };
}

function record(node: Node) {
  return {
    world: node.getWorldMatrix(),
    parent: node.getParentNode()?.getName(),
    extras: node.getExtras(),
    primitives: node
      .getMesh()
      ?.listPrimitives()
      .map((p) => ({
        attributes: Object.fromEntries(
          p.listSemantics().map((name) => [name, Array.from(p.getAttribute(name)!.getArray()!)]),
        ),
        indices: Array.from(p.getIndices()?.getArray() ?? []),
        material: {
          name: p.getMaterial()?.getName(),
          color: p.getMaterial()?.getBaseColorFactor(),
        },
      })),
  };
}

function assertReferences(doc: Document) {
  const nodes = doc.getRoot().listNodes(),
    names = new Set(nodes.map((n) => n.getName()));
  expect(names.size).toBe(nodes.length);
  for (const node of nodes) {
    const semantic = node.getExtras().kilnSemantic as
      | { relationships?: { targetType: string; target: string }[] }
      | undefined;
    for (const relation of semantic?.relationships ?? [])
      if (relation.targetType === 'node') expect(names.has(relation.target)).toBe(true);
    const graph = node.getExtras().kilnCharacterRig as
      | { joints: { role: string; parentRole?: string }[] }
      | undefined;
    if (graph)
      for (const joint of graph.joints) {
        const exported = nodes.find(
          (n) =>
            (n.getExtras().kilnCharacterJoint as { role?: string } | undefined)?.role ===
            joint.role,
        );
        expect(exported).toBeDefined();
        if (joint.parentRole)
          expect(
            (
              exported!.getParentNode()?.getExtras().kilnCharacterJoint as
                | { role: string }
                | undefined
            )?.role,
          ).toBe(joint.parentRole);
      }
  }
  for (const animation of doc.getRoot().listAnimations())
    for (const channel of animation.listChannels())
      expect(names.has(channel.getTargetNode()!.getName())).toBe(true);
}

for (const family of ['wheel', 'roof', 'bay', 'branched-chain'] as const)
  for (const gltfExporter of ['legacy', 'three'] as const)
    test(`${family} replacement preserves neighbors, local placement and remapped export identity (${gltfExporter})`, async () => {
      const prototype = fixture(family, false),
        alternative = fixture(family, true);
      const scene = new THREE.Group();
      scene.name = 'Scene';
      const parent = new THREE.Group();
      parent.name = 'ReflectedScaledParent';
      parent.position.set(3, 2, -4);
      parent.rotation.set(0.2, 0.7, -0.1);
      parent.scale.set(-1.5, 2, 0.75);
      scene.add(parent);
      const source = describeAssembly(prototype.root, { clips: prototype.clips });
      const kept = replicateAssembly(source, {
        namespace: 'kept',
        parent,
        externalReferences: 'preserve',
      });
      kept.root.position.x = -4;
      const old = replicateAssembly(source, {
        namespace: 'old',
        parent,
        externalReferences: 'preserve',
      });
      old.root.position.set(2, 0.7, 1);
      old.root.rotation.set(0.1, -0.3, 0.2);
      const beforeBytes = (
        await renderSceneToGLB(scene, {
          gltfExporter,
          optimize: 'off',
          clips: [...kept.clips, ...old.clips],
        })
      ).bytes;
      const before = await new WebIO().readBinary(beforeBytes);
      const fresh = replicateAssembly(
        describeAssembly(alternative.root, { clips: alternative.clips }),
        {
          namespace: 'replacement',
          parent,
          geometry: 'copy',
          materials: 'copy',
          externalReferences: 'preserve',
        },
      );
      fresh.root.position.copy(old.root.position);
      fresh.root.quaternion.copy(old.root.quaternion);
      fresh.root.scale.copy(old.root.scale);
      parent.remove(old.root);
      const afterOutput = await renderSceneToGLB(scene, {
        gltfExporter,
        optimize: 'off',
        clips: [...kept.clips, ...fresh.clips],
      });
      expect(afterOutput.gltfValidation.issues.numErrors).toBe(0);
      const after = await new WebIO().readBinary(afterOutput.bytes);
      assertReferences(before);
      assertReferences(after);
      const afterByName = new Map(
        after
          .getRoot()
          .listNodes()
          .map((node) => [node.getName(), node]),
      );
      const retained = new Set(kept.nodes.map((n) => n.name));
      for (const node of before
        .getRoot()
        .listNodes()
        .filter((n) => retained.has(n.getName())))
        expect(record(afterByName.get(node.getName())!)).toEqual(record(node));
      const oldRoot = before
        .getRoot()
        .listNodes()
        .find((n) => n.getName() === old.root.name)!;
      expect(afterByName.get(fresh.root.name)!.getWorldMatrix()).toEqual(oldRoot.getWorldMatrix());
      for (const node of old.nodes) expect(afterByName.has(node.name)).toBe(false);
      for (const node of fresh.nodes) expect(afterByName.has(node.name)).toBe(true);
      expect(describeAssembly(kept.root).bounds).toEqual(source.bounds);
      expect(fresh.root).not.toBe(old.root);
      if (fresh.clips.length) {
        const loaded = await loadGlbReviewScene(afterOutput.bytes);
        const clip = loaded.clips.find((c) => c.name === fresh.clips[0]!.name)!;
        const targetName = clip.tracks[0]!.name.split('.')[0]!;
        const target = loaded.root.getObjectByName(targetName)!;
        const initial = target.quaternion.clone();
        const untouched = kept.nodes.filter((n) => (n as THREE.Mesh).isMesh).map((n) => n.name);
        loaded.root.updateMatrixWorld(true);
        const poses = untouched.map((name) =>
          loaded.root.getObjectByName(name)!.matrixWorld.clone(),
        );
        poseSceneAtTime(loaded.root, prepareClip(loaded.root, clip), 0.5);
        expect(Math.abs(initial.dot(target.quaternion))).toBeLessThan(0.999);
        loaded.root.updateMatrixWorld(true);
        for (const [index, name] of untouched.entries())
          expect(loaded.root.getObjectByName(name)!.matrixWorld.equals(poses[index]!)).toBe(true);
      }
    });
