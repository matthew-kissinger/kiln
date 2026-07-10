import * as THREE from 'three';

import {
  BIPED_RIG_PRESET_V1,
  createCharacterRigGraphV1,
  stampCharacterJointDescriptorV1,
  stampCharacterRigGraphV1,
  type CharacterBodyPlan,
  type CharacterRigGraphV1,
} from '../character';
import { createAssetIntentV1, stampSemanticMetadataV1, type AssetIntentV1 } from '../contracts';
import {
  createVehicleFrame,
  createWheelAssembly,
  createWheelGeometrySet,
  type WheelAssemblyResult,
} from '../vehicle';

export interface W6CharacterVehicleCorpusPayload {
  intent: AssetIntentV1;
  scene: THREE.Object3D;
  clips: THREE.AnimationClip[];
}

export interface W6CharacterVehicleCorpusCase {
  id: string;
  pairId: string;
  kind: 'failure' | 'control';
  category: 'character' | 'vehicle';
  description: string;
  expectedCodes: readonly string[];
  forbiddenCodes: readonly string[];
  build: () => W6CharacterVehicleCorpusPayload;
}

export interface W6PromptCorpusCase {
  id: string;
  category: 'character' | 'vehicle';
  subtype: string;
  motion: 'static' | 'animated';
  prompt: string;
  expectedGuidance: readonly string[];
}

interface RigFixture {
  root: THREE.Object3D;
  byRole: Map<string, THREE.Object3D>;
}

function instantiateGraph(graph: CharacterRigGraphV1): RigFixture {
  const root = new THREE.Object3D();
  root.name = 'Character';
  stampCharacterRigGraphV1(root, graph);
  const byRole = new Map<string, THREE.Object3D>();
  for (const descriptor of graph.joints) {
    const node = new THREE.Object3D();
    node.name = `Joint_${descriptor.role.replace(/[^A-Za-z0-9]+/g, '_')}`;
    node.position.fromArray(descriptor.rest.translation);
    node.quaternion.fromArray(descriptor.rest.rotation);
    node.scale.fromArray(descriptor.rest.scale);
    stampCharacterJointDescriptorV1(node, descriptor);
    (descriptor.parentRole ? byRole.get(descriptor.parentRole) : root)?.add(node);
    byRole.set(descriptor.role, node);
  }
  return { root, byRole };
}

function characterIntent(
  options: {
    grounded?: boolean;
    locomotion?: 'stationary' | 'walk' | 'run';
    clips?: readonly { name: string; playback: 'loop' | 'oneShot' }[];
    heldItem?: boolean;
  } = {},
): AssetIntentV1 {
  return createAssetIntentV1({
    category: 'character',
    capabilities: ['articulated'],
    character: {
      bodyPlan: 'biped',
      grounded: options.grounded ?? false,
      locomotion: options.locomotion ?? 'stationary',
      gait: options.locomotion ?? 'none',
      rootMotion: 'inPlace',
      clips: options.clips ?? [],
      heldItem: options.heldItem ? { required: true, attachmentRole: 'grip' } : { required: false },
    },
  });
}

function characterStaticFixture(
  defect: 'none' | 'symmetry' | 'order' | 'forward',
): W6CharacterVehicleCorpusPayload {
  const rig = instantiateGraph(BIPED_RIG_PRESET_V1);
  if (defect === 'symmetry') rig.byRole.get('knee.right')!.position.x = 0.5;
  if (defect === 'order') rig.byRole.get('knee.left')!.position.y = 0.2;
  if (defect === 'forward') rig.byRole.get('head')!.rotation.y = Math.PI;
  return { intent: characterIntent(), scene: rig.root, clips: [] };
}

function loopPositionTrack(
  node: THREE.Object3D,
  axis: 'x' | 'z',
  middle: number,
): THREE.VectorKeyframeTrack {
  const base = node.position.clone();
  const values = [base.clone(), base.clone(), base.clone()];
  values[1]![axis] += middle;
  return new THREE.VectorKeyframeTrack(
    `${node.name}.position`,
    [0, 0.5, 1],
    values.flatMap((value) => value.toArray()),
  );
}

function characterEnergyFixture(lateral: boolean): W6CharacterVehicleCorpusPayload {
  const rig = instantiateGraph(BIPED_RIG_PRESET_V1);
  const knee = rig.byRole.get('knee.left')!;
  const clip = new THREE.AnimationClip('Walk', 1, [
    loopPositionTrack(knee, lateral ? 'z' : 'x', 0.35),
  ]);
  return {
    intent: characterIntent({ locomotion: 'walk', clips: [{ name: 'Walk', playback: 'loop' }] }),
    scene: rig.root,
    clips: [clip],
  };
}

function characterPhaseFixture(samePhase: boolean): W6CharacterVehicleCorpusPayload {
  const rig = instantiateGraph(BIPED_RIG_PRESET_V1);
  const left = rig.byRole.get('ankle.left')!;
  const right = rig.byRole.get('ankle.right')!;
  const clip = new THREE.AnimationClip('Run', 1, [
    loopPositionTrack(left, 'x', 0.3),
    loopPositionTrack(right, 'x', samePhase ? 0.3 : -0.3),
  ]);
  return {
    intent: characterIntent({ locomotion: 'run', clips: [{ name: 'Run', playback: 'loop' }] }),
    scene: rig.root,
    clips: [clip],
  };
}

function characterBendFixture(reverse: boolean): W6CharacterVehicleCorpusPayload {
  const rig = instantiateGraph(BIPED_RIG_PRESET_V1);
  const knee = rig.byRole.get('knee.left')!;
  const middle = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 0, 1),
    THREE.MathUtils.degToRad(reverse ? -45 : 45),
  );
  const identity = new THREE.Quaternion();
  const clip = new THREE.AnimationClip('Walk', 1, [
    new THREE.QuaternionKeyframeTrack(
      `${knee.name}.quaternion`,
      [0, 0.5, 1],
      [...identity.toArray(), ...middle.toArray(), ...identity.toArray()],
    ),
  ]);
  return {
    intent: characterIntent({ locomotion: 'walk', clips: [{ name: 'Walk', playback: 'loop' }] }),
    scene: rig.root,
    clips: [clip],
  };
}

function characterGripFixture(breaksGrip: boolean): W6CharacterVehicleCorpusPayload {
  const rig = instantiateGraph(BIPED_RIG_PRESET_V1);
  const item = new THREE.Object3D();
  item.name = 'HeldLantern';
  item.position.set(0.1, 0, 0);
  item.userData['kilnHeldItem'] = true;
  stampSemanticMetadataV1(item, { roles: ['character.held-item'] });
  rig.byRole.get('wrist.left')!.add(item);
  const clips = breaksGrip
    ? [new THREE.AnimationClip('Action', 1, [loopPositionTrack(item, 'x', 0.25)])]
    : [new THREE.AnimationClip('Action', 1, [])];
  return {
    intent: characterIntent({ clips: [{ name: 'Action', playback: 'loop' }], heldItem: true }),
    scene: rig.root,
    clips,
  };
}

function characterFootSlideFixture(slides: boolean): W6CharacterVehicleCorpusPayload {
  const rig = instantiateGraph(BIPED_RIG_PRESET_V1);
  const ankle = rig.byRole.get('ankle.left')!;
  const clips = slides
    ? [new THREE.AnimationClip('Walk', 1, [loopPositionTrack(ankle, 'x', 0.2)])]
    : [new THREE.AnimationClip('Walk', 1, [])];
  return {
    intent: characterIntent({
      grounded: true,
      locomotion: 'walk',
      clips: [{ name: 'Walk', playback: 'loop' }],
    }),
    scene: rig.root,
    clips,
  };
}

const tireMaterial = new THREE.MeshStandardMaterial({ color: 0x202124 });
const metalMaterial = new THREE.MeshStandardMaterial({ color: 0x8b949e });
const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x415a77 });

interface CarFixture {
  root: THREE.Object3D;
  chassis: THREE.Mesh;
  wheels: WheelAssemblyResult[];
  intent: AssetIntentV1;
}

function carFixture(sideways = false): CarFixture {
  const frame = createVehicleFrame('Car', {
    axles: [
      { id: 'front', position: [1.2, 0.5, 0] },
      { id: 'rear', position: [-1.2, 0.5, 0] },
    ],
  });
  const chassis = new THREE.Mesh(
    sideways ? new THREE.BoxGeometry(1.2, 0.5, 4) : new THREE.BoxGeometry(3.4, 0.5, 1.2),
    bodyMaterial,
  );
  chassis.name = 'Vehicle_Chassis';
  chassis.position.set(0, 1, 0);
  stampSemanticMetadataV1(chassis, { roles: ['vehicle.chassis'] });
  frame.root.add(chassis);
  const geometry = createWheelGeometrySet(0.5, 0.2);
  const wheels: WheelAssemblyResult[] = [];
  for (const [index, x] of [
    ['front', 1.2],
    ['rear', -1.2],
  ] as const) {
    for (const side of ['left', 'right'] as const) {
      wheels.push(
        createWheelAssembly(
          'Wheel',
          { tire: tireMaterial, rim: metalMaterial },
          {
            radius: 0.5,
            width: 0.2,
            side,
            index,
            position: [x, 0.5, side === 'left' ? -0.85 : 0.85],
            steering: index === 'front',
            geometries: geometry,
            parent: frame.root,
          },
        ),
      );
    }
  }
  return {
    root: frame.root,
    chassis,
    wheels,
    intent: createAssetIntentV1({
      category: 'vehicle',
      subtype: 'wheeled',
      vehicle: {
        subtype: 'wheeled',
        wheelCount: 4,
        axleCount: 2,
        steering: 'front',
        supportPolicy: 'grounded',
      },
    }),
  };
}

function carPayload(
  defect:
    | 'none'
    | 'offset-hub'
    | 'wrong-axle'
    | 'duplicate'
    | 'buried'
    | 'symmetry'
    | 'penetration'
    | 'fender-overlap'
    | 'sideways',
): W6CharacterVehicleCorpusPayload {
  const car = carFixture(defect === 'sideways');
  if (defect === 'offset-hub') car.wheels[0]!.hub.position.y = 0.18;
  if (defect === 'wrong-axle') car.wheels[0]!.spinPivot.rotation.y = Math.PI / 2;
  if (defect === 'buried') car.wheels[0]!.spinPivot.position.y = 0.2;
  if (defect === 'symmetry') car.wheels[1]!.spinPivot.position.x += 0.25;
  if (defect === 'penetration') {
    car.wheels[0]!.spinPivot.position.y = 0.85;
    car.chassis.position.z = -0.55;
  }
  if (defect === 'fender-overlap') {
    const fender = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.4), bodyMaterial);
    fender.name = 'FrontLeftFender';
    fender.position.set(1.2, 0.8, -0.85);
    stampSemanticMetadataV1(fender, { roles: ['vehicle.fender.front.left'] });
    car.root.add(fender);
  }
  if (defect === 'duplicate') {
    car.wheels[3]!.root.removeFromParent();
    car.wheels.pop();
    car.wheels.push(
      createWheelAssembly(
        'DuplicateWheel',
        { tire: tireMaterial, rim: metalMaterial },
        {
          radius: 0.5,
          width: 0.2,
          side: 'left',
          index: 'front',
          position: [1.2, 0.5, -0.85],
          steering: true,
          parent: car.root,
        },
      ),
    );
  }
  return { intent: car.intent, scene: car.root, clips: [] };
}

function wideFixedWingPayload(): W6CharacterVehicleCorpusPayload {
  const frame = createVehicleFrame('WideFixedWing');
  const wing = new THREE.Mesh(new THREE.BoxGeometry(3, 0.15, 8), bodyMaterial);
  wing.name = 'WideWing';
  wing.position.y = 1;
  stampSemanticMetadataV1(wing, { roles: ['vehicle.wing.main'] });
  frame.root.add(wing);
  return {
    intent: createAssetIntentV1({
      category: 'vehicle',
      subtype: 'fixed-wing',
      vehicle: { subtype: 'fixed-wing', propulsionAssemblies: [] },
    }),
    scene: frame.root,
    clips: [],
  };
}

function rotorPayload(offCenter: boolean): W6CharacterVehicleCorpusPayload {
  const frame = createVehicleFrame('Rotorcraft');
  const pivot = new THREE.Object3D();
  pivot.name = 'MainRotorPivot';
  pivot.position.set(0, 1.5, 0);
  stampSemanticMetadataV1(pivot, {
    roles: ['propulsion.pivot.main'],
    frames: [{ id: 'propulsion-axis.+y', translation: [0, 0, 0], rotation: [0, 0, 0, 1] }],
  });
  const rotor = new THREE.Mesh(new THREE.BoxGeometry(3, 0.05, 0.12), metalMaterial);
  rotor.name = 'MainRotor';
  rotor.position.x = offCenter ? 0.25 : 0;
  stampSemanticMetadataV1(rotor, { roles: ['propulsion.rotor.main'] });
  pivot.add(rotor);
  frame.root.add(pivot);
  return {
    intent: createAssetIntentV1({ category: 'vehicle', subtype: 'rotorcraft' }),
    scene: frame.root,
    clips: [],
  };
}

function trackLoop(name: string, side: 'left' | 'right', open: boolean): THREE.Object3D {
  const loop = new THREE.Object3D();
  loop.name = name;
  loop.position.set(0, 1.15, side === 'left' ? -0.7 : 0.7);
  loop.userData['kilnTrackLoopClosed'] = !open;
  stampSemanticMetadataV1(loop, { roles: [`track.loop.${side}`, `support.track.${side}`] });
  const geometry = open
    ? new THREE.PlaneGeometry(2, 1, 2, 1)
    : new THREE.TorusGeometry(1, 0.15, 8, 24);
  const mesh = new THREE.Mesh(geometry, tireMaterial);
  mesh.name = `${name}_Mesh`;
  loop.add(mesh);
  return loop;
}

function trackedPayload(
  options: {
    open?: boolean;
    escapedWheel?: boolean;
    uneven?: boolean;
    missingSupport?: boolean;
  } = {},
): W6CharacterVehicleCorpusPayload {
  const frame = createVehicleFrame('TrackedVehicle');
  const left = trackLoop('LeftTrack', 'left', options.open ?? false);
  const right = trackLoop('RightTrack', 'right', false);
  if (options.uneven) right.position.y += 0.2;
  if (options.missingSupport) {
    stampSemanticMetadataV1(left, { roles: ['track.loop.left'] });
    stampSemanticMetadataV1(right, { roles: ['track.loop.right'] });
  }
  frame.root.add(left, right);
  for (const [side, z] of [
    ['left', -0.7],
    ['right', 0.7],
  ] as const) {
    const roadWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.16, 12).rotateX(Math.PI / 2),
      metalMaterial,
    );
    roadWheel.name = `RoadWheel_${side}`;
    roadWheel.position.set(options.escapedWheel && side === 'left' ? 2.5 : 0, 1.15, z);
    stampSemanticMetadataV1(roadWheel, { roles: [`track.road-wheel.${side}.1`] });
    frame.root.add(roadWheel);
  }
  return {
    intent: createAssetIntentV1({
      category: 'vehicle',
      subtype: 'tracked',
      vehicle: { subtype: 'tracked', supportPolicy: 'grounded' },
    }),
    scene: frame.root,
    clips: [],
  };
}

function pair(
  base: string,
  category: 'character' | 'vehicle',
  description: string,
  code: string,
  failure: () => W6CharacterVehicleCorpusPayload,
  control: () => W6CharacterVehicleCorpusPayload,
): W6CharacterVehicleCorpusCase[] {
  const failureId = `${base}-failure`;
  const controlId = `${base}-control`;
  return [
    {
      id: failureId,
      pairId: controlId,
      kind: 'failure',
      category,
      description,
      expectedCodes: [code],
      forbiddenCodes: [],
      build: failure,
    },
    {
      id: controlId,
      pairId: failureId,
      kind: 'control',
      category,
      description: `Known-good reciprocal control for ${description}`,
      expectedCodes: [],
      forbiddenCodes: [code],
      build: control,
    },
  ];
}

/** Varied model-independent prompts; no provider/model roster is embedded. */
export const W6_CHARACTER_PROMPT_CORPUS: readonly W6PromptCorpusCase[] = Object.freeze([
  {
    id: 'character-biped-static',
    category: 'character',
    subtype: 'biped',
    motion: 'static',
    prompt: 'A balanced biped courier in a readable neutral rest pose, facing +X.',
    expectedGuidance: ['BIPED', '+X'],
  },
  {
    id: 'character-biped-animated',
    category: 'character',
    subtype: 'biped',
    motion: 'animated',
    prompt: 'A biped runner with an in-place looping run and alternating planted feet.',
    expectedGuidance: ['BIPED', 'run'],
  },
  {
    id: 'character-quadruped-static',
    category: 'character',
    subtype: 'quadruped',
    motion: 'static',
    prompt: 'A grounded four-legged hound with all paws at Y=0 and muzzle facing +X.',
    expectedGuidance: ['QUADRUPED', 'muzzle'],
  },
  {
    id: 'character-quadruped-animated',
    category: 'character',
    subtype: 'quadruped',
    motion: 'animated',
    prompt: 'A quadruped walking forward with four semantic paw chains and stable contacts.',
    expectedGuidance: ['QUADRUPED', 'walk'],
  },
  {
    id: 'character-avian-static',
    category: 'character',
    subtype: 'avian',
    motion: 'static',
    prompt: 'A perched avian character with paired wing chains and a +X beak marker.',
    expectedGuidance: ['AVIAN', 'wing'],
  },
  {
    id: 'character-avian-animated',
    category: 'character',
    subtype: 'avian',
    motion: 'animated',
    prompt: 'An avian flapping loop with opposed wings and no unintended root travel.',
    expectedGuidance: ['AVIAN', 'flight'],
  },
  {
    id: 'character-serpentine-static',
    category: 'character',
    subtype: 'serpentine',
    motion: 'static',
    prompt: 'A serpentine creature built as one axial graph with no invented humanoid limbs.',
    expectedGuidance: ['SERPENTINE', 'axial'],
  },
  {
    id: 'character-serpentine-animated',
    category: 'character',
    subtype: 'serpentine',
    motion: 'animated',
    prompt: 'A +X slither loop with sequential spine phases and stable ground contacts.',
    expectedGuidance: ['SERPENTINE', 'slither'],
  },
  {
    id: 'character-multilimb-static',
    category: 'character',
    subtype: 'multi-limb',
    motion: 'static',
    prompt: 'A six-limbed original creature with six unique terminal roles.',
    expectedGuidance: ['MULTI-LIMB', 'unique'],
  },
  {
    id: 'character-multilimb-animated',
    category: 'character',
    subtype: 'multi-limb',
    motion: 'animated',
    prompt: 'A six-limbed locomotion loop preserving every declared branch.',
    expectedGuidance: ['MULTI-LIMB', 'branch'],
  },
  {
    id: 'character-wheeled-static',
    category: 'character',
    subtype: 'wheeled',
    motion: 'static',
    prompt: 'A wheeled robot character with a semantic core and separate arm graph.',
    expectedGuidance: ['WHEELED CHARACTER', 'wheel'],
  },
  {
    id: 'character-wheeled-animated',
    category: 'character',
    subtype: 'wheeled',
    motion: 'animated',
    prompt: 'A wheeled robot rolling +X while waving one articulated arm.',
    expectedGuidance: ['WHEELED CHARACTER', '+X'],
  },
]);

export const W6_VEHICLE_PROMPT_CORPUS: readonly W6PromptCorpusCase[] = Object.freeze([
  {
    id: 'vehicle-wheeled',
    category: 'vehicle',
    subtype: 'wheeled',
    motion: 'animated',
    prompt: 'A four-wheel car with front steering, facing +X.',
    expectedGuidance: ['WHEELED', 'createWheelAssembly'],
  },
  {
    id: 'vehicle-tracked',
    category: 'vehicle',
    subtype: 'tracked',
    motion: 'animated',
    prompt: 'A tracked utility carrier with two closed loops.',
    expectedGuidance: ['TRACKED', 'track.loop'],
  },
  {
    id: 'vehicle-rail',
    category: 'vehicle',
    subtype: 'rail',
    motion: 'animated',
    prompt: 'A compact rail maintenance car.',
    expectedGuidance: ['RAIL', 'rail-wheel'],
  },
  {
    id: 'vehicle-watercraft',
    category: 'vehicle',
    subtype: 'watercraft',
    motion: 'animated',
    prompt: 'A small patrol boat with propeller and rudder.',
    expectedGuidance: ['WATERCRAFT', 'Do not add wheels'],
  },
  {
    id: 'vehicle-fixed-wing',
    category: 'vehicle',
    subtype: 'fixed-wing',
    motion: 'animated',
    prompt: 'A propeller aircraft with wide wings.',
    expectedGuidance: ['FIXED-WING', 'Wingspan'],
  },
  {
    id: 'vehicle-rotorcraft',
    category: 'vehicle',
    subtype: 'rotorcraft',
    motion: 'animated',
    prompt: 'A utility helicopter on two skids.',
    expectedGuidance: ['ROTORCRAFT', 'rotor pivot'],
  },
  {
    id: 'vehicle-hover',
    category: 'vehicle',
    subtype: 'hover',
    motion: 'static',
    prompt: 'A small hover courier with four pads.',
    expectedGuidance: ['HOVER', 'hover pads'],
  },
  {
    id: 'vehicle-walking',
    category: 'vehicle',
    subtype: 'walking',
    motion: 'animated',
    prompt: 'A four-legged walking transport.',
    expectedGuidance: ['WALKING', 'load-bearing leg'],
  },
  {
    id: 'vehicle-custom',
    category: 'vehicle',
    subtype: 'custom',
    motion: 'static',
    prompt: 'A custom fantastical transport using declared supports only.',
    expectedGuidance: ['CUSTOM', 'declared support'],
  },
]);

export const W6_CHARACTER_VEHICLE_FIXTURE_CORPUS: readonly W6CharacterVehicleCorpusCase[] =
  Object.freeze([
    ...pair(
      'character-bilateral-symmetry',
      'character',
      'Swapped or asymmetric bilateral joints.',
      'CHAR_REST_BILATERAL_SYMMETRY',
      () => characterStaticFixture('symmetry'),
      () => characterStaticFixture('none'),
    ),
    ...pair(
      'character-chain-order',
      'character',
      'Inverted hip-knee-ankle rest ordering.',
      'CHAR_REST_CHAIN_ORDER',
      () => characterStaticFixture('order'),
      () => characterStaticFixture('none'),
    ),
    ...pair(
      'character-forward-marker',
      'character',
      'Head marker facing away from +X.',
      'CHAR_FORWARD_MARKER',
      () => characterStaticFixture('forward'),
      () => characterStaticFixture('none'),
    ),
    ...pair(
      'character-lateral-energy',
      'character',
      'Lateral-dominant locomotion chain.',
      'CHAR_GAIT_LATERAL_ENERGY',
      () => characterEnergyFixture(true),
      () => characterEnergyFixture(false),
    ),
    ...pair(
      'character-leg-phase',
      'character',
      'Same-phase left/right biped legs.',
      'CHAR_GAIT_SAME_PHASE',
      () => characterPhaseFixture(true),
      () => characterPhaseFixture(false),
    ),
    ...pair(
      'character-bend-direction',
      'character',
      'Knee flexion opposite its declared bend axis.',
      'CHAR_JOINT_REVERSE_BEND',
      () => characterBendFixture(true),
      () => characterBendFixture(false),
    ),
    ...pair(
      'character-grip-motion',
      'character',
      'Held item breaks its declared grip while animated.',
      'CHAR_HELD_ITEM_GRIP_BREAK',
      () => characterGripFixture(true),
      () => characterGripFixture(false),
    ),
    ...pair(
      'character-foot-slide',
      'character',
      'Planted foot slides horizontally.',
      'CHAR_FOOT_SLIDE',
      () => characterFootSlideFixture(true),
      () => characterFootSlideFixture(false),
    ),
    ...pair(
      'vehicle-offset-hub',
      'vehicle',
      'Hub center is offset from its tire and rim.',
      'VEH_WHEEL_CONCENTRICITY',
      () => carPayload('offset-hub'),
      () => carPayload('none'),
    ),
    ...pair(
      'vehicle-wrong-axle',
      'vehicle',
      'Wheel spin axis is not vehicle-local +Z.',
      'VEH_WHEEL_AXLE_AXIS',
      () => carPayload('wrong-axle'),
      () => carPayload('none'),
    ),
    ...pair(
      'vehicle-duplicate-wheel',
      'vehicle',
      'One corner contains two semantic wheel assemblies.',
      'VEH_DUPLICATE_ASSEMBLY',
      () => carPayload('duplicate'),
      () => carPayload('none'),
    ),
    ...pair(
      'vehicle-buried-tire',
      'vehicle',
      'Load-bearing tire is buried below Y=0.',
      'VEH_CONTACT_PLANE',
      () => carPayload('buried'),
      () => carPayload('none'),
    ),
    ...pair(
      'vehicle-sideways-body',
      'vehicle',
      'Longitudinal wheeled body is Z-dominant while wide fixed-wing bounds are exempt.',
      'VEH_ORIENTATION_SIDEWAYS',
      () => carPayload('sideways'),
      wideFixedWingPayload,
    ),
    ...pair(
      'vehicle-open-track',
      'vehicle',
      'Track loop has localized open boundary edges.',
      'VEH_TRACK_LOOP_OPEN',
      () => trackedPayload({ open: true }),
      () => trackedPayload(),
    ),
    ...pair(
      'vehicle-off-center-rotor',
      'vehicle',
      'Rotor geometry is offset from its declared pivot.',
      'VEH_ROTOR_PIVOT',
      () => rotorPayload(true),
      () => rotorPayload(false),
    ),
    ...pair(
      'vehicle-bilateral-symmetry',
      'vehicle',
      'Wheel pair has asymmetric center placement.',
      'VEH_BILATERAL_SYMMETRY',
      () => carPayload('symmetry'),
      () => carPayload('none'),
    ),
    ...pair(
      'vehicle-chassis-penetration',
      'vehicle',
      'Tire penetrates non-fender chassis geometry while intentional fender overlap is allowed.',
      'VEH_WHEEL_CHASSIS_PENETRATION',
      () => carPayload('penetration'),
      () => carPayload('fender-overlap'),
    ),
    ...pair(
      'vehicle-support-set',
      'vehicle',
      'Declared tracked support semantics are missing.',
      'VEH_SUPPORT_SET_MISSING',
      () => trackedPayload({ missingSupport: true }),
      () => trackedPayload(),
    ),
    ...pair(
      'vehicle-support-plane',
      'vehicle',
      'Non-wheel support sets do not share one contact plane.',
      'VEH_SUPPORT_PLANE',
      () => trackedPayload({ uneven: true }),
      () => trackedPayload(),
    ),
    ...pair(
      'vehicle-track-containment',
      'vehicle',
      'Road wheel escapes its declared track loop.',
      'VEH_TRACK_ROAD_WHEEL_ESCAPED',
      () => trackedPayload({ escapedWheel: true }),
      () => trackedPayload(),
    ),
  ]);

export const W6_CHARACTER_BODY_PLAN_COVERAGE: readonly CharacterBodyPlan[] = Object.freeze(
  W6_CHARACTER_PROMPT_CORPUS.map((entry) => entry.subtype as CharacterBodyPlan).filter(
    (value, index, all) => all.indexOf(value) === index,
  ),
);

export const W6_CUSTOM_GRAPH_CONTROL = createCharacterRigGraphV1({
  bodyPlan: 'serpentine',
  joints: BIPED_RIG_PRESET_V1.joints.slice(0, 1).map((joint) => ({
    ...joint,
    role: 'spine.0',
    aliases: [],
  })),
});
