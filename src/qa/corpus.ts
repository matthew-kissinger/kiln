import * as THREE from 'three';

import {
  boxGeo,
  createPart,
  createPivot,
  createRoot,
  createVehicleFrame,
  createWheelAssembly,
  createWheelGeometrySet,
  foliageCardGeo,
  gameMaterial,
  sphereGeo,
} from '../primitives';
import {
  createAssetIntentV1,
  stampSemanticMetadataV1,
  type ArchitectureIntentV1Input,
  type AssetCategory,
  type AssetIntentV1,
  type CharacterIntentV1Input,
} from '../contracts';
import { foliageMaterial } from '../textures';

export type CorpusFixtureImplementation = 'active';

export type CorpusFixtureMeasurement = number | string | boolean;

export type CorpusFixturePayload =
  | {
      kind: 'scene';
      intent: AssetIntentV1;
      scene: THREE.Object3D;
      measurements: Readonly<Record<string, CorpusFixtureMeasurement>>;
    }
  | {
      kind: 'glb';
      intent: AssetIntentV1;
      glbBytes: Uint8Array;
      measurements: Readonly<Record<string, CorpusFixtureMeasurement>>;
    };

export interface KnownBadCorpusDescriptor {
  id: string;
  kind: 'failure' | 'control';
  category: AssetCategory;
  description: string;
  expectedCodes: readonly string[];
  implementation: CorpusFixtureImplementation;
  pairId: string;
  /** Deterministic executable fixture; category rules can consume these as they land. */
  build: () => CorpusFixturePayload | Promise<CorpusFixturePayload>;
}

const scenePayload = (
  category: AssetCategory,
  scene: THREE.Object3D,
  measurements: Readonly<Record<string, CorpusFixtureMeasurement>>,
  requiredParts: readonly string[] = [],
  architecture?: ArchitectureIntentV1Input,
  character?: CharacterIntentV1Input,
): CorpusFixturePayload => ({
  kind: 'scene',
  intent: createAssetIntentV1({
    category,
    requiredParts,
    ...(architecture ? { architecture } : {}),
    ...(character ? { character } : {}),
  }),
  scene,
  measurements,
});

function contactFixture(attached: boolean): CorpusFixturePayload {
  const root = createRoot(attached ? 'AttachedPartControl' : 'FloatingPart');
  const material = gameMaterial('#708090');
  createPart('Host', boxGeo(2, 1, 2), material, { parent: root, position: [0, 0.5, 0] });
  const partY = attached ? 1.25 : 1.6;
  createPart('Part', boxGeo(0.5, 0.5, 0.5), material, {
    parent: root,
    position: [0, partY, 0],
  });
  return scenePayload('prop', root, { contactGapMeters: partY - 1.25 }, ['Mesh_Host', 'Mesh_Part']);
}

function vehicleOrientationFixture(sideways: boolean): CorpusFixturePayload {
  const root = createRoot(sideways ? 'SidewaysVehicle' : 'ForwardVehicleControl');
  const material = gameMaterial('#445544');
  const frame = createVehicleFrame('VehicleFrame', {
    axles: [
      { id: 'front', position: [0.9, 0.3, 0] },
      { id: 'rear', position: [-0.9, 0.3, 0] },
    ],
    parent: root,
  });
  createPart('Hull', sideways ? boxGeo(0.8, 0.5, 3) : boxGeo(3, 0.5, 0.8), material, {
    parent: frame.root,
    position: [0, 0.25, 0],
  });
  const geometries = createWheelGeometrySet(0.3, 0.16);
  for (const [index, x] of [
    ['front', 0.9],
    ['rear', -0.9],
  ] as const) {
    for (const [side, z] of [
      ['left', -0.55],
      ['right', 0.55],
    ] as const) {
      createWheelAssembly(
        `${index}.${side}`,
        { tire: material, rim: material },
        {
          radius: 0.3,
          width: 0.16,
          side,
          index,
          position: [x, 0.3, z],
          steering: index === 'front',
          geometries,
          parent: frame.root,
        },
      );
    }
  }
  return scenePayload('vehicle', root, { dominantLengthAxis: sideways ? 'z' : 'x' }, ['Mesh_Hull']);
}

function limbFixture(inverted: boolean): CorpusFixturePayload {
  const root = createRoot(inverted ? 'InvertedLimb' : 'OrderedLimbControl');
  const material = gameMaterial('#a97852');
  const hip = createPivot('Hip', [0, 2, 0], root);
  const middleName = inverted ? 'Ankle' : 'Knee';
  const terminalName = inverted ? 'Knee' : 'Ankle';
  const middle = createPivot(middleName, [0, -0.8, 0], hip);
  const terminal = createPivot(terminalName, [0, -0.8, 0], middle);
  createPart('HipMarker', sphereGeo(0.16), material, { parent: hip });
  createPart('MiddleMarker', sphereGeo(0.14), material, { parent: middle });
  createPart('TerminalMarker', sphereGeo(0.12), material, { parent: terminal });
  return scenePayload(
    'character',
    root,
    { jointOrder: `Joint_Hip>Joint_${middleName}>Joint_${terminalName}` },
    ['Joint_Hip', 'Joint_Knee', 'Joint_Ankle'],
    undefined,
    { bodyPlan: 'biped', grounded: false, locomotion: 'stationary' },
  );
}

function gableGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([0, 0, -1.5, 0, 0, 1.5, 0, 1.2, 0], 3),
  );
  geometry.computeVertexNormals();
  return geometry;
}

function gableFixture(closed: boolean): CorpusFixturePayload {
  const root = createRoot(closed ? 'ClosedGableControl' : 'OpenGable');
  const wall = gameMaterial('#c9b38c');
  const roof = gameMaterial('#5f646d');
  createPart('Building', boxGeo(5, 2, 3), wall, { parent: root, position: [0, 1, 0] });
  createPart('RoofA', boxGeo(5.4, 0.1, 1.9), roof, {
    parent: root,
    position: [0, 2.5, 0.72],
    rotation: [32, 0, 0],
  });
  createPart('RoofB', boxGeo(5.4, 0.1, 1.9), roof, {
    parent: root,
    position: [0, 2.5, -0.72],
    rotation: [-32, 0, 0],
  });
  const front = new THREE.Mesh(gableGeometry(), wall);
  front.name = 'Gable_Front';
  front.position.set(2.51, 2, 0);
  root.add(front);
  if (closed) {
    const back = new THREE.Mesh(gableGeometry(), wall);
    back.name = 'Gable_Back';
    back.position.set(-2.51, 2, 0);
    root.add(back);
  }
  return scenePayload(
    'architecture',
    root,
    { gableClosureCount: closed ? 2 : 1 },
    ['Gable_Front', 'Gable_Back'],
    { enterable: false },
  );
}

function roofPanelFixture(aligned: boolean): CorpusFixturePayload {
  const root = createRoot(aligned ? 'AlignedRoofPanelsControl' : 'RotatedRoofPanels');
  const roof = new THREE.Object3D();
  roof.name = 'Roof';
  root.add(roof);
  const material = gameMaterial('#59606a');
  for (const side of [-1, 1] as const) {
    for (let index = 0; index < 4; index++) {
      const panel = new THREE.Mesh(
        aligned ? boxGeo(0.9, 0.08, 2.3) : boxGeo(2.3, 0.08, 0.9),
        material,
      );
      panel.name = `RoofPanel_${side > 0 ? 'A' : 'B'}_${index}`;
      panel.position.set(-1.35 + index * 0.9, 2.4, side * 0.75);
      panel.rotation.x = side * 0.55;
      panel.userData['kilnRoofPanel'] = {
        ridgeAxis: 'x',
        spanAxis: aligned ? 'z' : 'x',
      };
      roof.add(panel);
    }
  }
  return scenePayload(
    'architecture',
    root,
    { ridgeAxis: 'x', panelSpanAxis: aligned ? 'z' : 'x' },
    ['Roof'],
    { enterable: false, roof: { closedEnds: false } },
  );
}

function wheelFixture(penetrating: boolean): CorpusFixturePayload {
  const root = createRoot(penetrating ? 'WheelChassisPenetration' : 'WheelClearanceControl');
  const body = gameMaterial('#3e5368');
  const rubber = gameMaterial('#202124');
  const rim = gameMaterial('#8b949e', { metalness: 0.7 });
  const chassisBottom = 0.8;
  const wheelRadius = 0.4;
  const wheelY = penetrating ? 1.05 : 0.4;
  const frame = createVehicleFrame('VehicleFrame', {
    axles: [
      { id: 'front', position: [1.05, wheelY, 0] },
      { id: 'rear', position: [-1.05, wheelY, 0] },
    ],
    parent: root,
  });
  createPart('Chassis', boxGeo(3, 0.6, 1.2), body, {
    parent: frame.root,
    position: [0, 1.1, 0],
  });
  const wheelWidth = 0.2;
  const geometries = createWheelGeometrySet(wheelRadius, wheelWidth);
  for (const x of [-1.05, 1.05]) {
    for (const z of [-0.75, 0.75]) {
      const index = x > 0 ? 'front' : 'rear';
      createWheelAssembly(
        `Wheel_${x}_${z}`,
        { tire: rubber, rim },
        {
          radius: wheelRadius,
          width: wheelWidth,
          side: z < 0 ? 'left' : 'right',
          index,
          position: [x, wheelY, z],
          steering: index === 'front',
          geometries,
          parent: frame.root,
        },
      );
    }
  }
  return scenePayload('vehicle', root, {
    wheelChassisOverlapMeters: Math.max(0, wheelY + wheelRadius - chassisBottom),
  });
}

const TRANSLUCENT_GREEN_PNG = new Uint8Array([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 2, 0, 0, 0, 2, 8, 6, 0, 0,
  0, 114, 182, 13, 36, 0, 0, 0, 9, 112, 72, 89, 115, 0, 0, 3, 232, 0, 0, 3, 232, 1, 181, 123, 82,
  107, 0, 0, 0, 17, 73, 68, 65, 84, 8, 153, 99, 80, 88, 224, 208, 0, 194, 12, 48, 6, 0, 52, 146, 6,
  1, 143, 41, 75, 7, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
]);

function translucentLeafTexture(): THREE.DataTexture {
  const pixels = new Uint8Array([
    32, 160, 64, 128, 32, 160, 64, 128, 32, 160, 64, 128, 32, 160, 64, 128,
  ]);
  const texture = new THREE.DataTexture(pixels, 2, 2, THREE.RGBAFormat);
  texture.name = 'leaf-albedo';
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  texture.userData['encoded'] = { mime: 'image/png', bytes: TRANSLUCENT_GREEN_PNG };
  texture.userData['kilnTexture'] = {
    usage: 'albedo',
    colorSpace: 'srgb',
    width: 2,
    height: 2,
    hasAlpha: true,
  };
  return texture;
}

function foliageFixture(valid: boolean): CorpusFixturePayload {
  const root = createRoot(valid ? 'ValidFoliageCardControl' : 'BadFoliageCard');
  const contact = new THREE.Object3D();
  contact.name = 'Contact_Ground';
  stampSemanticMetadataV1(contact, { roles: ['vegetation.contact.ground'] });
  root.add(contact);
  const material = valid
    ? foliageMaterial(translucentLeafTexture(), { alphaCutoff: 0.5 })
    : gameMaterial('#228833');
  const card = new THREE.Mesh(foliageCardGeo({ width: 1.5, height: 2 }), material);
  card.name = 'Mesh_Leaves';
  root.add(card);
  return scenePayload('vegetation', root, { portableFoliageCardContract: valid }, ['Mesh_Leaves']);
}

async function validGlbFixture(): Promise<CorpusFixturePayload> {
  const root = createRoot('ValidGlbControl');
  createPart('Cube', boxGeo(1, 1, 1), gameMaterial('#778899'), {
    parent: root,
    position: [0, 0.5, 0],
  });
  const intent = createAssetIntentV1({ category: 'prop' });
  const { renderSceneToGLB } = await import('../render');
  const result = await renderSceneToGLB(root, { intent });
  return {
    kind: 'glb',
    intent,
    glbBytes: result.bytes,
    measurements: { validatorExpectedErrors: false },
  };
}

/**
 * Fixed W1 regression corpus. Every entry owns an executable deterministic
 * payload now; category-specific rules may consume the reserved expected codes
 * in later waves without having to invent or reinterpret test geometry.
 */
export const W1_KNOWN_BAD_CORPUS = [
  {
    id: 'invalid-glb',
    kind: 'failure',
    category: 'prop',
    description: 'Malformed final GLB bytes rejected by the Khronos validator.',
    expectedCodes: ['GLTF_GLB_UNEXPECTED_END_OF_HEADER'],
    implementation: 'active',
    pairId: 'valid-glb-control',
    build: () => ({
      kind: 'glb',
      intent: createAssetIntentV1({ category: 'prop' }),
      glbBytes: new Uint8Array([0x67, 0x6c, 0x54, 0x46]),
      measurements: { validatorExpectedErrors: true },
    }),
  },
  {
    id: 'valid-glb-control',
    kind: 'control',
    category: 'prop',
    description: 'Minimal validator-clean GLB.',
    expectedCodes: [],
    implementation: 'active',
    pairId: 'invalid-glb',
    build: validGlbFixture,
  },
  {
    id: 'floating-part',
    kind: 'failure',
    category: 'prop',
    description: 'One visible part has no contact with any intended assembly.',
    expectedCodes: ['UNIVERSAL_FLOATING_PART'],
    implementation: 'active',
    pairId: 'attached-part-control',
    build: () => contactFixture(false),
  },
  {
    id: 'attached-part-control',
    kind: 'control',
    category: 'prop',
    description: 'Equivalent part attached to its intended host.',
    expectedCodes: [],
    implementation: 'active',
    pairId: 'floating-part',
    build: () => contactFixture(true),
  },
  {
    id: 'sideways-vehicle',
    kind: 'failure',
    category: 'vehicle',
    description: 'Vehicle body is built along Z instead of trusted +X forward.',
    expectedCodes: ['VEH_ORIENTATION_SIDEWAYS'],
    implementation: 'active',
    pairId: 'forward-vehicle-control',
    build: () => vehicleOrientationFixture(true),
  },
  {
    id: 'forward-vehicle-control',
    kind: 'control',
    category: 'vehicle',
    description: 'Equivalent vehicle is built nose-first along +X.',
    expectedCodes: [],
    implementation: 'active',
    pairId: 'sideways-vehicle',
    build: () => vehicleOrientationFixture(false),
  },
  {
    id: 'inverted-limb',
    kind: 'failure',
    category: 'character',
    description: 'Declared limb chain has inverted semantic joint ordering.',
    expectedCodes: ['CHAR_LIMB_ORDER_INVERTED'],
    implementation: 'active',
    pairId: 'ordered-limb-control',
    build: () => limbFixture(true),
  },
  {
    id: 'ordered-limb-control',
    kind: 'control',
    category: 'character',
    description: 'Equivalent limb follows its declared parent/child order.',
    expectedCodes: [],
    implementation: 'active',
    pairId: 'inverted-limb',
    build: () => limbFixture(false),
  },
  {
    id: 'open-gable',
    kind: 'failure',
    category: 'architecture',
    description: 'Trusted closed gable shell is missing an end closure.',
    expectedCodes: ['ARCH_OPEN_GABLE'],
    implementation: 'active',
    pairId: 'closed-gable-control',
    build: () => gableFixture(false),
  },
  {
    id: 'closed-gable-control',
    kind: 'control',
    category: 'architecture',
    description: 'Equivalent gable shell has both complete end closures.',
    expectedCodes: [],
    implementation: 'active',
    pairId: 'open-gable',
    build: () => gableFixture(true),
  },
  {
    id: 'rotated-roof-panels',
    kind: 'failure',
    category: 'architecture',
    description: 'Roof panels run along the ridge instead of ridge-to-eave.',
    expectedCodes: ['ARCH_ROOF_AXIS'],
    implementation: 'active',
    pairId: 'aligned-roof-panels-control',
    build: () => roofPanelFixture(false),
  },
  {
    id: 'aligned-roof-panels-control',
    kind: 'control',
    category: 'architecture',
    description: 'Equivalent roof panels run ridge-to-eave in roof-local coordinates.',
    expectedCodes: [],
    implementation: 'active',
    pairId: 'rotated-roof-panels',
    build: () => roofPanelFixture(true),
  },
  {
    id: 'wheel-chassis-penetration',
    kind: 'failure',
    category: 'vehicle',
    description: 'A wheel assembly penetrates the chassis beyond allowed fender overlap.',
    expectedCodes: ['VEH_WHEEL_CHASSIS_PENETRATION'],
    implementation: 'active',
    pairId: 'wheel-clearance-control',
    build: () => wheelFixture(true),
  },
  {
    id: 'wheel-clearance-control',
    kind: 'control',
    category: 'vehicle',
    description: 'Equivalent wheel assembly retains valid chassis/fender clearance.',
    expectedCodes: [],
    implementation: 'active',
    pairId: 'wheel-chassis-penetration',
    build: () => wheelFixture(false),
  },
  {
    id: 'bad-foliage-card',
    kind: 'failure',
    category: 'vegetation',
    description: 'Foliage card lacks the required UV/alpha-mask/double-sided material contract.',
    expectedCodes: ['MAT_FOLIAGE_CARD_CONTRACT'],
    implementation: 'active',
    pairId: 'valid-foliage-card-control',
    build: () => foliageFixture(false),
  },
  {
    id: 'valid-foliage-card-control',
    kind: 'control',
    category: 'vegetation',
    description:
      'Equivalent foliage card has UVs, alpha data, MASK cutoff, and double-sided output.',
    expectedCodes: [],
    implementation: 'active',
    pairId: 'bad-foliage-card',
    build: () => foliageFixture(true),
  },
] as const satisfies readonly KnownBadCorpusDescriptor[];
