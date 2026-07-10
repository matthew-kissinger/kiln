import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';

import { createJointChain } from '../../character';
import { createAssetIntentV1 } from '../../contracts';
import type { QaFinding } from '../../qa/types';
import {
  CHARACTER_MOTION_DIAGNOSTIC_PHASES,
  buildCharacterDiagnosticDescriptor,
  planCharacterDiagnosticRequests,
} from '../character';
import { captureCharacterDiagnosticViews } from '../character-capture';

describe('CHAR-029 skeleton/local-axis/contact diagnostic descriptor', () => {
  test('labels joints, colors chains, shows +X/axes/contacts, and aligns invalid edges to paths', () => {
    const root = new THREE.Object3D();
    root.name = 'Creature';
    root.position.set(4, 3, -2);
    root.rotation.set(0.1, 0.8, -0.2);
    root.scale.setScalar(1.7);
    const chain = createJointChain(
      'Foreleg',
      [
        { role: 'shoulder.fore.left', offset: [0.2, 0.7, -0.2], side: 'left' },
        { role: 'elbow.fore.left', offset: [0, -0.4, 0], side: 'left' },
        {
          role: 'paw.fore.left',
          offset: [0, -0.3, 0],
          side: 'left',
          endEffector: true,
          contact: true,
        },
      ],
      { parent: root },
    );
    const initial = buildCharacterDiagnosticDescriptor(root);
    const elbow = initial.joints.find((joint) => joint.role === 'elbow.fore.left')!;
    const finding: QaFinding = {
      code: 'CHAR_PARENT_EDGE',
      disposition: 'block',
      dimension: 'categoryReadiness',
      profile: 'character.quadruped',
      message: 'broken edge',
      affected: { node: chain.nodes[1]!.name, nodePath: elbow.nodePath },
    };
    const descriptor = buildCharacterDiagnosticDescriptor(root, [finding]);

    expect(descriptor.canonicalForwardArrow).toEqual({
      start: [0, 0, 0],
      end: [1, 0, 0],
      label: '+X forward',
    });
    expect(descriptor.joints.map((joint) => joint.label)).toEqual([
      'shoulder.fore.left',
      'elbow.fore.left',
      'paw.fore.left',
    ]);
    expect(descriptor.joints.every((joint) => joint.color === descriptor.joints[0]?.color)).toBe(
      true,
    );
    expect(descriptor.joints.every((joint) => joint.forwardAxisEnd !== joint.assetPosition)).toBe(
      true,
    );
    expect(descriptor.contacts).toEqual([
      {
        role: 'paw.fore.left',
        nodePath: descriptor.joints[2]!.nodePath,
        assetPosition: [0.2, 0, -0.2],
      },
    ]);
    expect(descriptor.invalidFindingNodePaths).toEqual([elbow.nodePath]);
    expect(descriptor.edges.find((edge) => edge.childRole === 'elbow.fore.left')?.valid).toBe(
      false,
    );
    expect(descriptor.edges.find((edge) => edge.childRole === 'paw.fore.left')?.valid).toBe(true);
  });

  test('descriptor is byte-repeatable and does not mutate transformed source nodes', () => {
    const root = new THREE.Object3D();
    root.name = 'TailCreature';
    const chain = createJointChain(
      'Tail',
      [
        { role: 'tail.base', offset: [-0.2, 0.5, 0] },
        { role: 'tail.tip', offset: [-0.4, 0, 0], endEffector: true },
      ],
      { parent: root },
    );
    const before = chain.nodes.map((node) => ({
      position: node.position.toArray(),
      quaternion: node.quaternion.toArray(),
      scale: node.scale.toArray(),
    }));
    expect(JSON.stringify(buildCharacterDiagnosticDescriptor(root))).toBe(
      JSON.stringify(buildCharacterDiagnosticDescriptor(root)),
    );
    expect(
      chain.nodes.map((node) => ({
        position: node.position.toArray(),
        quaternion: node.quaternion.toArray(),
        scale: node.scale.toArray(),
      })),
    ).toEqual(before);
  });
});

describe('CHAR-030 automatic fixed-phase motion diagnostics', () => {
  test('captures labeled skeleton overlays and both cameras for resolved clips without mutating the rig', async () => {
    const root = new THREE.Object3D();
    root.name = 'AnimatedCreature';
    const chain = createJointChain(
      'Leg',
      [
        { role: 'hip.left', offset: [0, 1, 0], side: 'left' },
        { role: 'knee.left', offset: [0, -0.5, 0], side: 'left' },
        {
          role: 'ankle.left',
          offset: [0, -0.5, 0],
          side: 'left',
          endEffector: true,
          contact: true,
        },
      ],
      { parent: root },
    );
    for (const [index, joint] of chain.nodes.entries()) {
      joint.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(0.09 - index * 0.01, 8, 6),
          new THREE.MeshStandardMaterial({ color: 0x7799bb }),
        ),
      );
    }
    const clips = [
      new THREE.AnimationClip('Run', 1, [
        new THREE.VectorKeyframeTrack(
          `${chain.nodes[0]!.name}.position`,
          [0, 0.5, 1],
          [0, 1, 0, 0.25, 1, 0, 0, 1, 0],
        ),
      ]),
      new THREE.AnimationClip('Bite', 1, [
        new THREE.QuaternionKeyframeTrack(
          `${chain.nodes[1]!.name}.quaternion`,
          [0, 1],
          [0, 0, 0, 1, 0, 0, 0.3826834, 0.9238795],
        ),
      ]),
    ];
    const character = createAssetIntentV1({
      category: 'character',
      character: {
        bodyPlan: 'custom',
        grounded: true,
        locomotion: 'run',
        clips: [
          { name: 'Run', playback: 'loop' },
          { name: 'Bite', playback: 'oneShot' },
        ],
      },
    }).character!;
    const before = chain.nodes.map((node) => ({
      position: node.position.toArray(),
      quaternion: node.quaternion.toArray(),
    }));
    const captures = await captureCharacterDiagnosticViews(root, clips, character, [], 64);

    expect(captures.map((capture) => capture.id)).toEqual([
      'character.skeleton.front',
      'character.skeleton.right',
      'character.motion-strip.front.run',
      'character.motion-strip.right.run',
      'character.motion-strip.front.bite',
      'character.motion-strip.right.bite',
    ]);
    expect(captures.every((capture) => capture.png.byteLength > 100)).toBe(true);
    expect(
      captures
        .filter((capture) => capture.kind === 'skeleton')
        .every((capture) =>
          capture.regions.some((region) => region.semanticRoles[0]?.startsWith('joint.')),
        ),
    ).toBe(true);
    expect(
      captures
        .filter((capture) => capture.kind === 'motion-strip')
        .every((capture) => capture.phaseFractions?.join(',') === '0,0.2,0.4,0.6,0.8,1'),
    ).toBe(true);
    expect(
      chain.nodes.map((node) => ({
        position: node.position.toArray(),
        quaternion: node.quaternion.toArray(),
      })),
    ).toEqual(before);
  });

  test('plans front/right strips for resolved locomotion and primary action', () => {
    const trusted = createAssetIntentV1({
      category: 'character',
      character: {
        bodyPlan: 'quadruped',
        grounded: true,
        locomotion: 'run',
        clips: [
          { name: 'Run', playback: 'loop' },
          { name: 'Bite', playback: 'oneShot' },
          { name: 'Idle', playback: 'loop' },
        ],
      },
    }).character!;
    const requests = planCharacterDiagnosticRequests(trusted);
    expect(requests.slice(0, 2).map((request) => request.id)).toEqual([
      'character.skeleton.front',
      'character.skeleton.right',
    ]);
    expect(requests.map((request) => request.id)).toEqual(
      expect.arrayContaining([
        'character.motion-strip.front.run',
        'character.motion-strip.right.run',
        'character.motion-strip.front.bite',
        'character.motion-strip.right.bite',
      ]),
    );
    expect(
      requests
        .filter((request) => request.variant === 'character-motion-strip')
        .every((request) => request.automatic),
    ).toBe(true);
    for (const request of requests.filter(
      (candidate) => candidate.variant === 'character-motion-strip',
    )) {
      expect(request.phaseFractions).toEqual(CHARACTER_MOTION_DIAGNOSTIC_PHASES);
    }
  });

  test('no animation still gets automatic skeleton views and no phantom strip', () => {
    const trusted = createAssetIntentV1({
      category: 'character',
      character: { bodyPlan: 'custom', grounded: false, locomotion: 'stationary', clips: [] },
    }).character!;
    expect(planCharacterDiagnosticRequests(trusted).map((request) => request.id)).toEqual([
      'character.skeleton.front',
      'character.skeleton.right',
    ]);
  });
});
