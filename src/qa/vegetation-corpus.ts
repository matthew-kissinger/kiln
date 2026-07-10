import * as THREE from 'three';

import {
  createAssetIntentV1,
  stampSemanticMetadataV1,
  type AssetIntentV1,
  type VegetationCanopyProfile,
  type VegetationGrowthState,
  type VegetationSubtype,
} from '../contracts';

export const W7_VEGETATION_CORPUS_VERSION = 'kiln.vegetation.helper-independent.v1' as const;

export interface W7VegetationCorpusPayload {
  intent: AssetIntentV1;
  scene: THREE.Group;
}

export interface W7VegetationCorpusCase {
  id: string;
  kind: 'control' | 'adversary';
  subtype: VegetationSubtype;
  description: string;
  expectedCodes: readonly string[];
  forbiddenCodes: readonly string[];
  build: () => W7VegetationCorpusPayload;
}

const wood = new THREE.MeshStandardMaterial({ color: 0x674229, roughness: 0.92 });
const leafDark = new THREE.MeshStandardMaterial({ color: 0x285b32, roughness: 0.86 });
const leafLight = new THREE.MeshStandardMaterial({ color: 0x65964a, roughness: 0.86 });

function semantic<T extends THREE.Object3D>(node: T, ...roles: string[]): T {
  return stampSemanticMetadataV1(node, { roles });
}

function rootWithContact(name: string, contactY = 0): THREE.Group {
  const root = new THREE.Group();
  root.name = name;
  const contact = semantic(new THREE.Group(), 'vegetation.contact.ground');
  contact.name = 'Contact_Ground';
  contact.position.y = contactY;
  root.add(contact);
  return root;
}

function cylinderBetween(
  name: string,
  start: THREE.Vector3,
  end: THREE.Vector3,
  baseRadius: number,
  tipRadius: number,
  roles: readonly string[],
): THREE.Mesh {
  const direction = end.clone().sub(start);
  const mesh = semantic(
    new THREE.Mesh(new THREE.CylinderGeometry(tipRadius, baseRadius, direction.length(), 8), wood),
    ...roles,
  );
  mesh.name = name;
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

interface PlantSpec {
  id: string;
  subtype: VegetationSubtype;
  growthState?: VegetationGrowthState;
  canopyProfile?: VegetationCanopyProfile;
  trunkHeight: number;
  trunkBase: number;
  trunkTip: number;
  branchCount: number;
  branchReach: number;
  branchRise: number;
  foliageScale: number;
  foliageShape?: 'sphere' | 'blade' | 'cap' | 'pad';
  noFoliage?: boolean;
}

function foliageGeometry(shape: PlantSpec['foliageShape'], scale: number): THREE.BufferGeometry {
  if (shape === 'blade') return new THREE.PlaneGeometry(scale * 0.5, scale * 2.2);
  if (shape === 'cap')
    return new THREE.SphereGeometry(scale, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2);
  if (shape === 'pad') return new THREE.SphereGeometry(scale, 8, 6).scale(0.55, 1.35, 0.3);
  return new THREE.SphereGeometry(scale, 8, 6);
}

function buildPlant(spec: PlantSpec): W7VegetationCorpusPayload {
  const root = rootWithContact(spec.id);
  const trunk = semantic(
    new THREE.Mesh(
      new THREE.CylinderGeometry(spec.trunkTip, spec.trunkBase, spec.trunkHeight, 10),
      wood,
    ),
    spec.subtype === 'grass' ? 'vegetation.stem' : 'vegetation.trunk',
  );
  trunk.name = spec.subtype === 'fungus' ? 'Mesh_Stipe' : 'Mesh_Trunk';
  trunk.position.y = spec.trunkHeight / 2;
  root.add(trunk);

  for (let index = 0; index < spec.branchCount; index++) {
    const angle = (index / Math.max(1, spec.branchCount)) * Math.PI * 2 + (index % 2) * 0.13;
    const baseY = Math.max(0.12, spec.trunkHeight * (0.45 + (index % 3) * 0.12));
    const start = new THREE.Vector3(
      Math.cos(angle) * spec.trunkBase * 0.78,
      baseY,
      Math.sin(angle) * spec.trunkBase * 0.78,
    );
    const reach = spec.branchReach * (0.82 + (index % 3) * 0.09);
    const end = new THREE.Vector3(
      Math.cos(angle) * reach,
      Math.min(spec.trunkHeight + spec.branchRise, baseY + spec.branchRise + (index % 2) * 0.12),
      Math.sin(angle) * reach,
    );
    const branch = cylinderBetween(
      `Mesh_Branch_${index}`,
      start,
      end,
      Math.max(0.018, spec.trunkTip * 0.48),
      Math.max(0.008, spec.trunkTip * 0.16),
      [`vegetation.branch.primary.${index}`],
    );
    root.add(branch);
    if (spec.noFoliage) continue;
    const cluster = semantic(
      new THREE.Mesh(
        foliageGeometry(spec.foliageShape, spec.foliageScale * (0.88 + (index % 4) * 0.06)),
        index % 2 === 0 ? leafDark : leafLight,
      ),
      `vegetation.canopy.cluster.${index}`,
      'vegetation.foliage',
    );
    cluster.name = `Mesh_Foliage_${index}`;
    cluster.position.copy(end);
    cluster.rotation.set(0.07 * (index % 2), angle + index * 0.07, 0.05 * ((index % 3) - 1));
    root.add(cluster);
  }

  if (!spec.noFoliage && spec.branchCount === 0) {
    const cluster = semantic(
      new THREE.Mesh(foliageGeometry(spec.foliageShape, spec.foliageScale), leafDark),
      'vegetation.canopy.cluster.0',
      'vegetation.foliage',
    );
    cluster.name = 'Mesh_Foliage_0';
    cluster.position.y = spec.trunkHeight;
    root.add(cluster);
  }
  root.updateMatrixWorld(true);
  return {
    intent: createAssetIntentV1({
      category: 'vegetation',
      vegetation: {
        subtype: spec.subtype,
        growthState: spec.growthState ?? (spec.subtype === 'bare/dead' ? 'bare' : 'lush'),
        canopyProfile:
          spec.canopyProfile ??
          (spec.subtype === 'conifer'
            ? 'conifer'
            : spec.subtype === 'bare/dead'
              ? 'bare/dead'
              : 'broadleaf'),
      },
      material: { mode: 'pbrRecipe' },
    }),
    scene: root,
  };
}

const CONTROL_SPECS = Object.freeze([
  {
    id: 'oak-control',
    subtype: 'tree',
    trunkHeight: 4,
    trunkBase: 0.42,
    trunkTip: 0.25,
    branchCount: 7,
    branchReach: 1.75,
    branchRise: 1.1,
    foliageScale: 0.72,
  },
  {
    id: 'conifer-control',
    subtype: 'conifer',
    trunkHeight: 4.8,
    trunkBase: 0.38,
    trunkTip: 0.2,
    branchCount: 9,
    branchReach: 1.45,
    branchRise: 0.65,
    foliageScale: 0.58,
    canopyProfile: 'conifer',
  },
  {
    id: 'palm-control',
    subtype: 'frond/palm',
    trunkHeight: 3.6,
    trunkBase: 0.28,
    trunkTip: 0.2,
    branchCount: 8,
    branchReach: 1.8,
    branchRise: 0.35,
    foliageScale: 0.7,
    foliageShape: 'blade',
  },
  {
    id: 'shrub-control',
    subtype: 'shrub',
    trunkHeight: 1.2,
    trunkBase: 0.24,
    trunkTip: 0.12,
    branchCount: 7,
    branchReach: 0.9,
    branchRise: 0.55,
    foliageScale: 0.5,
  },
  {
    id: 'grass-tuft-control',
    subtype: 'grass',
    trunkHeight: 0.6,
    trunkBase: 0.07,
    trunkTip: 0.025,
    branchCount: 7,
    branchReach: 0.34,
    branchRise: 0.7,
    foliageScale: 0.25,
    foliageShape: 'blade',
  },
  {
    id: 'vine-control',
    subtype: 'vine',
    trunkHeight: 1.8,
    trunkBase: 0.08,
    trunkTip: 0.035,
    branchCount: 6,
    branchReach: 0.65,
    branchRise: 1.1,
    foliageScale: 0.28,
  },
  {
    id: 'mushroom-control',
    subtype: 'fungus',
    trunkHeight: 0.8,
    trunkBase: 0.16,
    trunkTip: 0.12,
    branchCount: 0,
    branchReach: 0,
    branchRise: 0,
    foliageScale: 0.55,
    foliageShape: 'cap',
  },
  {
    id: 'flower-control',
    subtype: 'crop/flower',
    trunkHeight: 1.1,
    trunkBase: 0.055,
    trunkTip: 0.035,
    branchCount: 5,
    branchReach: 0.45,
    branchRise: 0.48,
    foliageScale: 0.26,
  },
  {
    id: 'succulent-control',
    subtype: 'succulent',
    trunkHeight: 0.5,
    trunkBase: 0.18,
    trunkTip: 0.13,
    branchCount: 6,
    branchReach: 0.42,
    branchRise: 0.45,
    foliageScale: 0.32,
    foliageShape: 'pad',
  },
  {
    id: 'bare-tree-control',
    subtype: 'bare/dead',
    growthState: 'bare',
    canopyProfile: 'bare/dead',
    trunkHeight: 3.8,
    trunkBase: 0.4,
    trunkTip: 0.22,
    branchCount: 7,
    branchReach: 1.5,
    branchRise: 1.2,
    foliageScale: 0,
    noFoliage: true,
  },
  {
    id: 'aquatic-control',
    subtype: 'aquatic',
    trunkHeight: 1.4,
    trunkBase: 0.08,
    trunkTip: 0.035,
    branchCount: 6,
    branchReach: 0.75,
    branchRise: 0.35,
    foliageScale: 0.42,
    foliageShape: 'blade',
  },
] as const satisfies readonly PlantSpec[]);

const CONTROL_FORBIDDEN_CODES = Object.freeze([
  'VEG_CONTACT_MISSING',
  'VEG_CONTACT_FLOATING',
  'VEG_CONTACT_BURIED',
  'VEG_MATERIAL_BURIED',
  'VEG_SCOPE_EXTRA',
  'VEG_FOLIAGE_DETACHED',
] as const);

function sparseAdversary(): W7VegetationCorpusPayload {
  const payload = buildPlant({ ...CONTROL_SPECS[0]!, id: 'sparse-adversary' });
  const clusters = payload.scene.children.filter((node) => /Mesh_Foliage_/.test(node.name));
  clusters.slice(2).forEach((node) => {
    payload.scene.remove(node);
  });
  clusters.slice(0, 2).forEach((node, index) => {
    node.scale.setScalar(0.18);
    node.position.set(index === 0 ? -2.4 : 2.4, 4.2, index === 0 ? -0.4 : 0.4);
  });
  payload.scene.updateMatrixWorld(true);
  payload.intent.vegetation!.growthState = 'lush';
  return payload;
}

function floatingAdversary(): W7VegetationCorpusPayload {
  const payload = buildPlant({ ...CONTROL_SPECS[3]!, id: 'floating-adversary' });
  payload.scene.getObjectByName('Contact_Ground')!.position.y = 0.12;
  payload.scene.updateMatrixWorld(true);
  return payload;
}

function baseClutterAdversary(): W7VegetationCorpusPayload {
  const payload = buildPlant({ ...CONTROL_SPECS[3]!, id: 'base-clutter-adversary' });
  const material = new THREE.MeshStandardMaterial({ color: 0x5d4129 });
  material.name = 'SoilMaterial';
  const soil = semantic(
    new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.05, 16), material),
    'terrain.soil.base',
  );
  soil.name = 'Mesh_Soil_Mound';
  soil.position.y = 0.025;
  payload.scene.add(soil);
  payload.scene.updateMatrixWorld(true);
  return payload;
}

export const W7_VEGETATION_CORPUS: readonly W7VegetationCorpusCase[] = Object.freeze([
  ...CONTROL_SPECS.map(
    (spec): W7VegetationCorpusCase => ({
      id: spec.id,
      kind: 'control',
      subtype: spec.subtype,
      description: `Helper-independent ${spec.id.replaceAll('-', ' ')} using current primitives.`,
      expectedCodes: [],
      forbiddenCodes: CONTROL_FORBIDDEN_CODES,
      build: () => buildPlant(spec),
    }),
  ),
  {
    id: 'sparse-adversary',
    kind: 'adversary',
    subtype: 'tree',
    description: 'Lush tree intent with two tiny, widely separated foliage clusters.',
    expectedCodes: ['VEG_CANOPY_OCCUPANCY_SIDE', 'VEG_CANOPY_OCCUPANCY_TOP'],
    forbiddenCodes: [],
    build: sparseAdversary,
  },
  {
    id: 'floating-adversary',
    kind: 'adversary',
    subtype: 'shrub',
    description: 'Trusted vegetation contact marker floats above asset-local ground.',
    expectedCodes: ['VEG_CONTACT_FLOATING'],
    forbiddenCodes: [],
    build: floatingAdversary,
  },
  {
    id: 'base-clutter-adversary',
    kind: 'adversary',
    subtype: 'shrub',
    description: 'Standalone shrub carries a corroborated unrequested soil mound.',
    expectedCodes: ['VEG_SCOPE_EXTRA'],
    forbiddenCodes: [],
    build: baseClutterAdversary,
  },
]);

export function w7VegetationCorpusDescriptor(): unknown {
  return {
    version: W7_VEGETATION_CORPUS_VERSION,
    cases: W7_VEGETATION_CORPUS.map((fixture) => ({
      id: fixture.id,
      kind: fixture.kind,
      subtype: fixture.subtype,
      description: fixture.description,
      expectedCodes: [...fixture.expectedCodes],
      forbiddenCodes: [...fixture.forbiddenCodes],
    })),
  };
}
