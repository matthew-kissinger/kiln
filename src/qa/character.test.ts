import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';

import {
  BIPED_RIG_PRESET_V1,
  QUADRUPED_RIG_PRESET_V1,
  createCharacterJointDescriptorV1,
  createCharacterRigGraphV1,
  createJointChain,
  stampCharacterJointDescriptorV1,
  stampCharacterRigGraphV1,
  type CharacterBodyPlan,
  type CharacterRigGraphV1,
} from '../character';
import { createAssetIntentV1, stampSemanticMetadataV1, type AssetIntentV1 } from '../contracts';
import { evaluateCharacterQa, sampleCharacterAnimation } from './character';

interface InstantiatedRig {
  root: THREE.Object3D;
  byRole: Map<string, THREE.Object3D>;
}

function instantiateGraph(graph: CharacterRigGraphV1, name = 'Character'): InstantiatedRig {
  const root = new THREE.Object3D();
  root.name = name;
  stampCharacterRigGraphV1(root, graph);
  const byRole = new Map<string, THREE.Object3D>();
  for (const descriptor of graph.joints) {
    const node = new THREE.Object3D();
    node.name = `Joint_${descriptor.role.replace(/[^A-Za-z0-9]+/g, '_')}`;
    node.position.fromArray(descriptor.rest.translation);
    node.quaternion.fromArray(descriptor.rest.rotation);
    node.scale.fromArray(descriptor.rest.scale);
    stampCharacterJointDescriptorV1(node, descriptor);
    const parent = descriptor.parentRole ? byRole.get(descriptor.parentRole) : root;
    if (!parent) throw new Error(`fixture parent ${descriptor.parentRole} missing`);
    parent.add(node);
    byRole.set(descriptor.role, node);
  }
  return { root, byRole };
}

function intent(
  options: {
    bodyPlan?: CharacterBodyPlan;
    articulated?: boolean;
    grounded?: boolean;
    rootMotion?: 'inPlace' | 'forward';
    locomotion?: 'stationary' | 'walk' | 'run' | 'fly' | 'swim' | 'slither' | 'roll' | 'custom';
    clips?: Array<{ name: string; playback: 'loop' | 'oneShot' }>;
    heldItem?: { required: boolean; attachmentRole: string };
  } = {},
): AssetIntentV1 {
  return createAssetIntentV1({
    category: 'character',
    capabilities: [
      ...(options.articulated === false ? [] : ['articulated' as const]),
      ...(options.grounded ? ['grounded' as const] : []),
    ],
    character: {
      bodyPlan: options.bodyPlan ?? 'biped',
      grounded: options.grounded ?? false,
      locomotion: options.locomotion ?? 'walk',
      rootMotion: options.rootMotion ?? 'inPlace',
      clips: options.clips ?? [],
      heldItem: options.heldItem ?? { required: false, attachmentRole: 'grip' },
    },
  });
}

function findings(
  trusted: AssetIntentV1,
  scene?: THREE.Object3D,
  clips: readonly THREE.AnimationClip[] = [],
) {
  return evaluateCharacterQa({ intent: trusted, scene, clips });
}

function codes(values: ReturnType<typeof findings>): string[] {
  return values.map((finding) => finding.code);
}

function positionClip(
  name: string,
  nodeName: string,
  end: [number, number, number],
  duration = 1,
): THREE.AnimationClip {
  return new THREE.AnimationClip(name, duration, [
    new THREE.VectorKeyframeTrack(`${nodeName}.position`, [0, duration], [0, 0, 0, ...end]),
  ]);
}

describe('W4 explicit character contract pass controls', () => {
  test('complete biped passes hierarchy, roles, contacts, grip, clips, and in-place policy', () => {
    const rig = instantiateGraph(BIPED_RIG_PRESET_V1);
    const item = new THREE.Object3D();
    item.name = 'HeldLantern';
    stampSemanticMetadataV1(item, { roles: ['character.held-item'] });
    rig.byRole.get('wrist.right')!.add(item);
    const trusted = intent({
      grounded: true,
      rootMotion: 'inPlace',
      clips: [
        { name: 'Idle', playback: 'loop' },
        { name: 'Impact', playback: 'oneShot' },
      ],
      heldItem: { required: true, attachmentRole: 'grip' },
    });
    expect(
      findings(trusted, rig.root, [
        positionClip('Idle', 'Character', [0, 0, 0]),
        positionClip('Impact', 'Character', [0.2, 0, 0]),
      ]),
    ).toEqual([]);
  });

  test('complete quadruped passes four chains, contacts, and exact walk clip', () => {
    const rig = instantiateGraph(QUADRUPED_RIG_PRESET_V1);
    const trusted = intent({
      bodyPlan: 'quadruped',
      grounded: true,
      clips: [{ name: 'Walk', playback: 'loop' }],
    });
    expect(findings(trusted, rig.root, [positionClip('Walk', 'Character', [0, 0, 0])])).toEqual([]);
  });
});

describe('CHAR-008–012 exact semantic rig validation', () => {
  test('duplicate Joint_* names block before export and report both exact paths', () => {
    const root = new THREE.Object3D();
    root.name = 'Character';
    const first = new THREE.Object3D();
    first.name = 'Joint_KneeL';
    const second = new THREE.Object3D();
    second.name = 'Joint_KneeL';
    root.add(first, second);
    const result = findings(intent({ articulated: false }), root);
    const duplicate = result.find(
      (finding) => finding.code === 'CHAR_DUPLICATE_ANIMATED_NODE_NAME',
    )!;
    expect(duplicate.message).toContain('Character[0]/Joint_KneeL[0]');
    expect(duplicate.message).toContain('Character[0]/Joint_KneeL[1]');
    expect(duplicate.measurement).toEqual({
      name: 'animatedNodeNameCount',
      actual: 2,
      expected: 1,
    });
  });

  test('broken declared adjacency reports the exact child path and parent edge', () => {
    const rig = instantiateGraph(BIPED_RIG_PRESET_V1);
    const knee = rig.byRole.get('knee.left')!;
    rig.root.add(knee);
    const result = findings(intent(), rig.root);
    const edge = result.find(
      (finding) =>
        finding.code === 'CHAR_PARENT_EDGE' && finding.measurement?.expected === 'hip.left',
    )!;
    expect(edge.affected?.nodePath).toContain('/Joint_knee_left[');
    expect(edge.measurement).toEqual({
      name: 'parentRole',
      actual: 'Character',
      expected: 'hip.left',
    });
    expect(edge.repairText).toContain('Reparent only the reported joint');
    expect(edge.viewHints).toEqual(
      expect.arrayContaining(['character.skeleton.front', 'character.skeleton.right']),
    );
  });

  test('explicit biped requires paired arm/leg roles; static biped does not', () => {
    const incomplete = createCharacterRigGraphV1({
      bodyPlan: 'biped',
      joints: BIPED_RIG_PRESET_V1.joints.filter((joint) => joint.role !== 'wrist.right'),
    });
    const rig = instantiateGraph(incomplete);
    expect(codes(findings(intent(), rig.root))).toContain('CHAR_BIPED_REQUIRED_ROLE');
    expect(codes(findings(intent({ articulated: false }), rig.root))).not.toContain(
      'CHAR_BIPED_REQUIRED_ROLE',
    );
  });

  test('explicit quadruped requires all four limb chains plus spine/neck/head', () => {
    const incomplete = createCharacterRigGraphV1({
      bodyPlan: 'quadruped',
      joints: QUADRUPED_RIG_PRESET_V1.joints.filter((joint) => joint.role !== 'paw.hind.right'),
    });
    const rig = instantiateGraph(incomplete);
    const result = findings(intent({ bodyPlan: 'quadruped' }), rig.root);
    const missing = result.find((finding) => finding.code === 'CHAR_QUADRUPED_REQUIRED_ROLE')!;
    expect(missing.measurement?.expected).toBe('paw.hind.right');
  });

  test('serpentine and many-limbed custom graphs pass without humanoid assumptions', () => {
    const graphs = [
      createCharacterRigGraphV1({
        bodyPlan: 'serpentine',
        joints: [
          createCharacterJointDescriptorV1({ role: 'spine.0' }),
          createCharacterJointDescriptorV1({ role: 'spine.1', parentRole: 'spine.0' }),
          createCharacterJointDescriptorV1({ role: 'tail.tip', parentRole: 'spine.1' }),
        ],
      }),
      createCharacterRigGraphV1({
        bodyPlan: 'multi-limb',
        joints: [
          createCharacterJointDescriptorV1({ role: 'core' }),
          ...Array.from({ length: 6 }, (_, index) =>
            createCharacterJointDescriptorV1({
              role: `arm.${index + 1}`,
              parentRole: 'core',
              endEffector: true,
            }),
          ),
        ],
      }),
    ];
    for (const graph of graphs) {
      const rig = instantiateGraph(graph);
      expect(findings(intent({ bodyPlan: graph.bodyPlan }), rig.root)).toEqual([]);
    }
  });
});

describe('CHAR-013/014 held-item and contact validation', () => {
  test('held item passes under a grip end effector and fails under shoulder/elbow', () => {
    const rig = instantiateGraph(BIPED_RIG_PRESET_V1);
    const item = new THREE.Object3D();
    item.name = 'Sword';
    item.userData['kilnHeldItem'] = true;
    stampSemanticMetadataV1(item, { roles: ['character.held-item'] });
    rig.byRole.get('wrist.left')!.add(item);
    const heldIntent = intent({ heldItem: { required: true, attachmentRole: 'grip' } });
    expect(codes(findings(heldIntent, rig.root))).not.toContain('CHAR_HELD_ITEM_ATTACHMENT');

    rig.byRole.get('shoulder.left')!.add(item);
    const bad = findings(heldIntent, rig.root).find(
      (finding) => finding.code === 'CHAR_HELD_ITEM_ATTACHMENT',
    )!;
    expect(bad.measurement).toEqual({
      name: 'heldItemAttachmentRole',
      actual: 'shoulder.left',
      expected: 'grip',
    });
    expect(bad.affected?.nodePath).toBe(
      'Character[0]/Joint_hips[0]/Joint_spine[0]/Joint_shoulder_left[1]/Sword[1]',
    );
  });

  test('ground contacts use asset-local Y=0 under transformed roots', () => {
    const rig = instantiateGraph(BIPED_RIG_PRESET_V1);
    rig.root.position.set(5, 7, -3);
    rig.root.rotation.set(0.2, 0.5, -0.1);
    rig.root.scale.setScalar(1.4);
    expect(findings(intent({ grounded: true }), rig.root)).toEqual([]);
  });

  test('floating and buried contacts report exact path, signed Y, and tolerance', () => {
    for (const [offset, expectedCode] of [
      [0.1, 'CHAR_CONTACT_FLOATING'],
      [-0.1, 'CHAR_CONTACT_BURIED'],
    ] as const) {
      const rig = instantiateGraph(BIPED_RIG_PRESET_V1);
      rig.byRole.get('ankle.left')!.position.y += offset;
      const result = findings(intent({ grounded: true }), rig.root);
      const contact = result.find((finding) => finding.code === expectedCode)!;
      expect(contact.affected?.nodePath).toContain('/Joint_ankle_left[0]');
      expect(contact.measurement?.name).toBe('contactY');
      expect(contact.measurement?.actual).toBeCloseTo(offset, 8);
      expect(contact.measurement?.threshold).toBe(0.02);
      expect(contact.measurement?.unit).toBe('m');
    }
  });
});

describe('CHAR-026 declared attachment motion', () => {
  test('blocks item-local animation that breaks a declared grip and accepts a stable grip', () => {
    const rig = instantiateGraph(BIPED_RIG_PRESET_V1);
    const item = new THREE.Object3D();
    item.name = 'HeldLantern';
    item.position.set(0.1, 0, 0);
    item.userData['kilnHeldItem'] = true;
    stampSemanticMetadataV1(item, { roles: ['character.held-item'] });
    rig.byRole.get('wrist.left')!.add(item);
    const trusted = intent({
      clips: [{ name: 'Carry', playback: 'loop' }],
      heldItem: { required: true, attachmentRole: 'grip' },
    });
    const stable = new THREE.AnimationClip('Carry', 1, []);
    expect(codes(findings(trusted, rig.root, [stable]))).not.toContain('CHAR_HELD_ITEM_GRIP_BREAK');

    const broken = new THREE.AnimationClip('Carry', 1, [
      new THREE.VectorKeyframeTrack(
        `${item.name}.position`,
        [0, 0.5, 1],
        [0.1, 0, 0, 0.4, 0, 0, 0.1, 0, 0],
      ),
    ]);
    const finding = findings(trusted, rig.root, [broken]).find(
      (value) => value.code === 'CHAR_HELD_ITEM_GRIP_BREAK',
    )!;
    expect(finding.disposition).toBe('block');
    expect(finding.affected).toMatchObject({ node: 'HeldLantern', clip: 'Carry' });
    expect(finding.measurement?.name).toBe('heldItemGripDistanceDrift');
    expect(finding.measurement?.actual).toBeCloseTo(0.3, 6);
    expect(finding.repairText).toContain('remove only the item-local animation keys');
  });
});

describe('CHAR-018–020 exact clip/key/loop validation', () => {
  test('requires exactly requested names and rejects missing, duplicate, and extra clips', () => {
    const trusted = intent({
      clips: [
        { name: 'Idle', playback: 'loop' },
        { name: 'Impact', playback: 'oneShot' },
      ],
    });
    const idle = positionClip('Idle', 'Character', [0, 0, 0]);
    const duplicateIdle = positionClip('Idle', 'Character', [0, 0, 0]);
    const extra = positionClip('Dance', 'Character', [0, 0, 0]);
    const result = findings(trusted, undefined, [idle, duplicateIdle, extra]);
    expect(codes(result)).toEqual(
      expect.arrayContaining(['CHAR_CLIP_DUPLICATE', 'CHAR_CLIP_MISSING', 'CHAR_CLIP_UNEXPECTED']),
    );
  });

  test('rejects invalid duration, non-finite values, duplicate/unsorted/out-of-range keys, and tuple mismatch', () => {
    const trusted = intent({ clips: [{ name: 'Bad', playback: 'oneShot' }] });
    const track = new THREE.VectorKeyframeTrack(
      'Character.position',
      [0, 0.5, 0.5, 2],
      [0, 0, 0, 1, 0, 0, Number.NaN, 0, 0, 2, 0, 0],
    );
    track.values = new Float32Array([...track.values, 7]);
    const clip = new THREE.AnimationClip('Bad', 1, [track]);
    clip.duration = 0;
    const result = findings(trusted, undefined, [clip]);
    expect(codes(result)).toEqual(
      expect.arrayContaining([
        'CHAR_CLIP_DURATION',
        'CHAR_ANIMATION_NONFINITE',
        'CHAR_KEY_TIME_ORDER',
        'CHAR_TRACK_VALUE_COUNT',
      ]),
    );

    clip.duration = 1;
    expect(codes(findings(trusted, undefined, [clip]))).toContain('CHAR_KEY_OUT_OF_RANGE');
  });

  test('loop endpoints must match while declared one-shot impact is exempt', () => {
    const loopIntent = intent({ clips: [{ name: 'Idle', playback: 'loop' }] });
    const mismatch = positionClip('Idle', 'Character', [0.2, 0, 0]);
    expect(codes(findings(loopIntent, undefined, [mismatch]))).toContain('CHAR_LOOP_ENDPOINT');

    const oneShotIntent = intent({ clips: [{ name: 'Impact', playback: 'oneShot' }] });
    const impact = positionClip('Impact', 'Character', [0.2, 0, 0]);
    expect(codes(findings(oneShotIntent, undefined, [impact]))).not.toContain('CHAR_LOOP_ENDPOINT');
  });
});

describe('CHAR-021/022 deterministic sampling and root motion', () => {
  test('fixed normalized samples reproduce joint positions across runs', () => {
    const root = new THREE.Object3D();
    root.name = 'Character';
    const chain = createJointChain(
      'Leg',
      [
        { role: 'hip.left', offset: [0, 1, 0], side: 'left' },
        { role: 'knee.left', offset: [0, -0.5, 0], side: 'left' },
      ],
      { parent: root },
    );
    const clip = new THREE.AnimationClip('Step', 2, [
      new THREE.VectorKeyframeTrack(`${chain.nodes[0]!.name}.position`, [0, 2], [0, 1, 0, 2, 1, 0]),
    ]);
    const first = sampleCharacterAnimation(root, clip);
    const second = sampleCharacterAnimation(root, clip);
    expect(second).toEqual(first);
    expect(first.fractions).toEqual([0, 0.25, 0.5, 0.75, 1]);
    expect(first.samples[2]?.nodes.find((node) => node.role === 'hip.left')?.worldPosition).toEqual(
      [1, 1, 0],
    );
  });

  test('forward root motion rejects -X and Z-dominant travel; +X and in-place pass', () => {
    const root = new THREE.Object3D();
    root.name = 'Character';
    const forwardIntent = intent({
      articulated: false,
      rootMotion: 'forward',
      clips: [{ name: 'Walk', playback: 'loop' }],
    });
    expect(
      codes(findings(forwardIntent, root, [positionClip('Walk', 'Character', [-1, 0, 0])])),
    ).toContain('CHAR_ROOT_MOTION_BACKWARD');
    expect(
      codes(findings(forwardIntent, root, [positionClip('Walk', 'Character', [0.1, 0, 1])])),
    ).toContain('CHAR_ROOT_MOTION_LATERAL');
    expect(
      codes(findings(forwardIntent, root, [positionClip('Walk', 'Character', [1, 0, 0])])),
    ).not.toEqual(
      expect.arrayContaining(['CHAR_ROOT_MOTION_BACKWARD', 'CHAR_ROOT_MOTION_LATERAL']),
    );

    const inPlaceIntent = intent({
      articulated: false,
      rootMotion: 'inPlace',
      clips: [{ name: 'Walk', playback: 'loop' }],
    });
    expect(
      codes(findings(inPlaceIntent, root, [positionClip('Walk', 'Character', [0, 0, 0])])),
    ).not.toEqual(
      expect.arrayContaining(['CHAR_ROOT_MOTION_BACKWARD', 'CHAR_ROOT_MOTION_LATERAL']),
    );
  });
});
