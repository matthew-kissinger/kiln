/**
 * Deterministic, provider-free W6 experiment harness.
 *
 * Candidate builders stay in this non-exported package path. They are evidence,
 * not public primitives: W7 may expose only the paths that clear structural,
 * runtime, round-trip, and delegated-human preference gates.
 */
import { createHash } from 'node:crypto';
import { WebIO } from '@gltf-transform/core';
import * as THREE from 'three';

import { createAssetIntentV1, stampSemanticMetadataV1, type AssetIntentV1 } from '../contracts';
import {
  MATERIAL_RECIPE_EXECUTABLE_EXAMPLES_V1,
  MATERIAL_RECIPE_PROMPT_CONTEXT_V1,
} from '../material-recipe-prompt';
import { materialRecipe } from '../material-recipe-runtime';
import type { MaterialRecipeId } from '../material-recipes';
import { renderSceneToGLB } from '../render';
import { evaluateVegetationCanopyQa, measureVegetationCanopy } from '../qa/vegetation';
import { loadTexture } from '../textures';

export const W6_EXPERIMENT_SCHEMA_VERSION = 1 as const;

export interface RuntimeArtifactMetricsV1 {
  triangles: number;
  drawCalls: number;
  materialCount: number;
  textureCount: number;
  glbBytes: number;
  glbSha256: string;
  repeatGlbSha256: string;
  byteStable: boolean;
  validatorErrors: number;
  validatorWarnings: number;
  roundTrip: {
    nodeCount: number;
    meshCount: number;
    materialCount: number;
    textureCount: number;
  };
  parity: {
    triangleCount: boolean;
    materialCount: boolean;
    textureCount: boolean;
  };
}

export interface ExperimentPreferenceEvidenceV1 {
  status: 'insufficientEvidence';
  delegatedHumanLabels: 0;
  reason: string;
}

export interface ExperimentArmV1 {
  id: string;
  structural: Record<string, number | string | boolean | null>;
  runtime: RuntimeArtifactMetricsV1;
}

export interface ExperimentComparisonV1 {
  taskId: 'VEG-005' | 'VEG-009' | 'VEG-012' | 'MAT-020';
  corpusId: string;
  corpusSha256: string;
  baselineCodeSha256: string;
  candidateCodeSha256: string;
  baseline: ExperimentArmV1[];
  candidate: ExperimentArmV1[];
  preference: ExperimentPreferenceEvidenceV1;
  gate: 'closed';
  gateReason: string;
}

export interface MaterialPromptAblationV1 {
  taskId: 'MAT-019';
  method: 'offline-context-guided-plan-simulation';
  corpusId: string;
  corpusSha256: string;
  baselineContextSha256: string;
  candidateContextSha256: string;
  baselineCorrect: number;
  candidateCorrect: number;
  total: number;
  nonzeroCorrectRecipeUsage: boolean;
  portablePbrUsage: number;
  cases: Array<{
    id: string;
    prompt: string;
    expectedRecipeId: MaterialRecipeId;
    baselineRecipeId: MaterialRecipeId | null;
    candidateRecipeId: MaterialRecipeId | null;
  }>;
}

export interface W6MaterialVegetationExperimentReportV1 {
  schemaVersion: 1;
  deterministic: true;
  providerCalls: 0;
  generatedAtPolicy: 'omitted-for-byte-stability';
  materialPromptAblation: MaterialPromptAblationV1;
  branch: ExperimentComparisonV1;
  canopy: ExperimentComparisonV1;
  frond: ExperimentComparisonV1;
  proceduralMaterial: ExperimentComparisonV1;
  reportSha256: string;
}

interface StructuralScene {
  root: THREE.Group;
  intent: AssetIntentV1;
  structural: Record<string, number | string | boolean | null>;
}

const sha256 = (value: string | Uint8Array): string =>
  createHash('sha256').update(value).digest('hex');

const canonicalJson = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
const stable = (value: number): number => Math.round(value * 1_000_000) / 1_000_000;

function semantic<T extends THREE.Object3D>(node: T, ...roles: string[]): T {
  return stampSemanticMetadataV1(node, { roles });
}

function vegetationIntent(
  input: {
    subtype?: 'tree' | 'conifer' | 'shrub' | 'frond/palm' | 'bare/dead';
    growthState?: 'lush' | 'sparse' | 'bare';
    canopyProfile?: 'broadleaf' | 'conifer' | 'topiary' | 'bare/dead';
  } = {},
): AssetIntentV1 {
  return createAssetIntentV1({
    category: 'vegetation',
    vegetation: {
      subtype: input.subtype ?? 'tree',
      growthState: input.growthState ?? 'lush',
      canopyProfile: input.canopyProfile ?? 'broadleaf',
    },
    material: { mode: 'pbrRecipe' },
  });
}

function rootWithContact(name: string): THREE.Group {
  const root = new THREE.Group();
  root.name = name;
  const contact = semantic(new THREE.Group(), 'vegetation.contact.ground');
  contact.name = 'Contact_Ground';
  root.add(contact);
  return root;
}

function cylinderBetween(
  name: string,
  start: THREE.Vector3,
  end: THREE.Vector3,
  radiusStart: number,
  radiusEnd: number,
  material: THREE.Material,
  parent: THREE.Object3D,
  roles: readonly string[],
): THREE.Mesh {
  const direction = end.clone().sub(start);
  const length = direction.length();
  const mesh = semantic(
    new THREE.Mesh(
      new THREE.CylinderGeometry(radiusEnd, radiusStart, length, 8, 1, false),
      material,
    ),
    ...roles,
  );
  mesh.name = name;
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  parent.add(mesh);
  return mesh;
}

function runtimeMetrics(
  root: THREE.Object3D,
): Pick<RuntimeArtifactMetricsV1, 'triangles' | 'drawCalls' | 'materialCount' | 'textureCount'> {
  let triangles = 0;
  let drawCalls = 0;
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    const geometry = node.geometry;
    const count = geometry.index?.count ?? geometry.getAttribute('position')?.count ?? 0;
    triangles += Math.floor(count / 3);
    const values = Array.isArray(node.material) ? node.material : [node.material];
    drawCalls += Math.max(1, values.length);
    for (const material of values) {
      materials.add(material);
      if (material instanceof THREE.MeshStandardMaterial) {
        for (const texture of [
          material.map,
          material.normalMap,
          material.roughnessMap,
          material.metalnessMap,
          material.aoMap,
          material.emissiveMap,
        ]) {
          if (texture) textures.add(texture);
        }
      }
    }
  });
  return { triangles, drawCalls, materialCount: materials.size, textureCount: textures.size };
}

async function artifactMetrics(scene: StructuralScene): Promise<RuntimeArtifactMetricsV1> {
  const metrics = runtimeMetrics(scene.root);
  const first = await renderSceneToGLB(scene.root, { intent: scene.intent, optimize: 'off' });
  const repeat = await renderSceneToGLB(scene.root, { intent: scene.intent, optimize: 'off' });
  const firstSha = sha256(first.bytes);
  const repeatSha = sha256(repeat.bytes);
  const document = await new WebIO().readBinary(first.bytes);
  return {
    ...metrics,
    glbBytes: first.bytes.byteLength,
    glbSha256: firstSha,
    repeatGlbSha256: repeatSha,
    byteStable: firstSha === repeatSha,
    validatorErrors: first.gltfValidation.issues.numErrors,
    validatorWarnings: first.gltfValidation.issues.numWarnings,
    roundTrip: {
      nodeCount: document.getRoot().listNodes().length,
      meshCount: document.getRoot().listMeshes().length,
      materialCount: document.getRoot().listMaterials().length,
      textureCount: document.getRoot().listTextures().length,
    },
    parity: {
      triangleCount: first.tris === metrics.triangles,
      materialCount: document.getRoot().listMaterials().length === metrics.materialCount,
      textureCount: document.getRoot().listTextures().length === metrics.textureCount,
    },
  };
}

const BRANCH_CORPUS = Object.freeze([
  { id: 'oak-primary', yaw: 0.1, rise: 1.4, reach: 1.7, branches: 5 },
  { id: 'conifer-tier', yaw: 0.75, rise: 0.8, reach: 1.45, branches: 6 },
  { id: 'shrub-fork', yaw: 1.4, rise: 0.95, reach: 1.1, branches: 7 },
  { id: 'bare-deadwood', yaw: 2.1, rise: 1.2, reach: 1.55, branches: 7 },
] as const);

function buildBranchArm(
  spec: (typeof BRANCH_CORPUS)[number],
  arm: 'baseline' | 'candidate',
): StructuralScene {
  const root = rootWithContact(`Branch_${arm}_${spec.id}`);
  const wood = new THREE.MeshStandardMaterial({ color: 0x684327, roughness: 0.93 });
  const trunk = semantic(
    new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 4, 10), wood),
    'vegetation.trunk',
  );
  trunk.name = 'Mesh_Trunk';
  trunk.position.y = 2;
  root.add(trunk);
  const gaps: number[] = [];
  const taperPasses: boolean[] = [];
  for (let index = 0; index < spec.branches; index++) {
    const angle = spec.yaw + (index / spec.branches) * Math.PI * 2;
    const baseY = 1.2 + (index % 3) * 0.65;
    const parentRadius = 0.35;
    const radialStart = arm === 'candidate' ? parentRadius - 0.025 : parentRadius + 0.04;
    const start = new THREE.Vector3(
      Math.cos(angle) * radialStart,
      baseY,
      Math.sin(angle) * radialStart,
    );
    const end = new THREE.Vector3(
      Math.cos(angle) * spec.reach,
      baseY + spec.rise,
      Math.sin(angle) * spec.reach,
    );
    gaps.push(Math.max(0, radialStart - parentRadius));
    if (arm === 'baseline') {
      cylinderBetween(`Mesh_Branch_${index}`, start, end, 0.105, 0.105, wood, root, [
        `vegetation.branch.primary.${index}`,
      ]);
      taperPasses.push(false);
      continue;
    }
    const bend = start.clone().lerp(end, 0.55);
    bend.y += 0.18;
    const points = [start, bend, end];
    const radii = [0.115, 0.072, 0.026];
    for (let segment = 0; segment < 2; segment++) {
      cylinderBetween(
        `Mesh_Branch_${index}_${segment}`,
        points[segment]!,
        points[segment + 1]!,
        radii[segment]!,
        radii[segment + 1]!,
        wood,
        root,
        [`vegetation.branch.primary.${index}`, `vegetation.branch.segment.${segment}`],
      );
    }
    taperPasses.push(
      radii.every((radius, radiusIndex) => radiusIndex === 0 || radius < radii[radiusIndex - 1]!),
    );
  }
  root.updateMatrixWorld(true);
  return {
    root,
    intent: vegetationIntent({
      subtype:
        spec.id === 'conifer-tier'
          ? 'conifer'
          : spec.id === 'shrub-fork'
            ? 'shrub'
            : spec.id === 'bare-deadwood'
              ? 'bare/dead'
              : 'tree',
      growthState: spec.id === 'bare-deadwood' ? 'bare' : 'lush',
      canopyProfile:
        spec.id === 'conifer-tier'
          ? 'conifer'
          : spec.id === 'bare-deadwood'
            ? 'bare/dead'
            : 'broadleaf',
    }),
    structural: {
      attachmentPassRate: stable(gaps.filter((gap) => gap <= 0.02).length / gaps.length),
      maximumAttachmentGapMeters: stable(Math.max(...gaps)),
      monotonicTaperPassRate: stable(taperPasses.filter(Boolean).length / taperPasses.length),
      branchCount: spec.branches,
    },
  };
}

const CANOPY_CORPUS = Object.freeze([
  { id: 'broadleaf-oak', subtype: 'tree', profile: 'broadleaf', clusters: 9 },
  { id: 'conifer-pine', subtype: 'conifer', profile: 'conifer', clusters: 10 },
  { id: 'irregular-shrub', subtype: 'shrub', profile: 'broadleaf', clusters: 8 },
  { id: 'formal-topiary', subtype: 'shrub', profile: 'topiary', clusters: 7 },
] as const);

function buildCanopyArm(
  spec: (typeof CANOPY_CORPUS)[number],
  arm: 'baseline' | 'candidate',
): StructuralScene {
  const root = rootWithContact(`Canopy_${arm}_${spec.id}`);
  const wood = new THREE.MeshStandardMaterial({ color: 0x684327, roughness: 0.92 });
  const trunk = semantic(
    new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 3.4, 8), wood),
    'vegetation.trunk',
  );
  trunk.name = 'Mesh_Trunk';
  trunk.position.y = 1.7;
  root.add(trunk);
  const dark = new THREE.MeshStandardMaterial({ color: 0x285b32, roughness: 0.86 });
  const light = new THREE.MeshStandardMaterial({ color: 0x65994b, roughness: 0.86 });
  const count = arm === 'baseline' ? Math.max(3, Math.floor(spec.clusters / 2)) : spec.clusters;
  for (let index = 0; index < count; index++) {
    const angle = (index / count) * Math.PI * 2 + (arm === 'candidate' ? (index % 2) * 0.19 : 0);
    const ring = arm === 'baseline' ? 1.45 : 0.55 + (index % 3) * 0.36;
    const y = spec.profile === 'conifer' ? 3.2 + (index / count) * 2.3 : 3.55 + (index % 3) * 0.55;
    const scale = arm === 'baseline' ? 0.48 : 0.7 + (index % 4) * 0.09;
    const cluster = semantic(
      new THREE.Mesh(new THREE.SphereGeometry(scale, 8, 6), index % 2 === 0 ? dark : light),
      `vegetation.canopy.cluster.${index}`,
      'vegetation.foliage',
    );
    cluster.name = `Mesh_Canopy_${index}`;
    cluster.position.set(Math.cos(angle) * ring, y, Math.sin(angle) * ring);
    root.add(cluster);
  }
  root.updateMatrixWorld(true);
  const intent = vegetationIntent({
    subtype: spec.subtype,
    canopyProfile: spec.profile,
  });
  const measured = measureVegetationCanopy(intent, root);
  const findings = evaluateVegetationCanopyQa({ intent, scene: root });
  return {
    root,
    intent,
    structural: {
      frontOccupancy: measured.frontOccupancy,
      sideOccupancy: measured.sideOccupancy,
      topOccupancy: measured.topOccupancy,
      canopyToTrunkVolumeRatio: measured.canopyToTrunkVolumeRatio,
      profileFindingCount: findings.length,
      structuralProfilePass: findings.length === 0,
    },
  };
}

const FROND_CORPUS = Object.freeze([
  { id: 'date-palm', count: 12, reach: 2.2, droop: 0.7 },
  { id: 'fan-palm', count: 10, reach: 1.8, droop: 0.35 },
  { id: 'tree-fern', count: 9, reach: 1.65, droop: 0.55 },
  { id: 'cycad', count: 14, reach: 1.35, droop: 0.28 },
] as const);

function buildFrondArm(
  spec: (typeof FROND_CORPUS)[number],
  arm: 'baseline' | 'candidate',
): StructuralScene {
  const root = rootWithContact(`Frond_${arm}_${spec.id}`);
  const wood = new THREE.MeshStandardMaterial({ color: 0x76502f, roughness: 0.9 });
  const leaf = new THREE.MeshStandardMaterial({
    color: 0x376f39,
    roughness: 0.86,
    side: THREE.DoubleSide,
  });
  const trunk = semantic(
    new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, 3.2, 8), wood),
    'vegetation.trunk',
  );
  trunk.name = 'Mesh_Trunk';
  trunk.position.y = 1.6;
  root.add(trunk);
  const baseGaps: number[] = [];
  const droopPasses: boolean[] = [];
  for (let index = 0; index < spec.count; index++) {
    const angle = (index / spec.count) * Math.PI * 2;
    const baseRadius = arm === 'baseline' ? 0.27 : 0.16;
    const start = new THREE.Vector3(
      Math.cos(angle) * baseRadius,
      3.18,
      Math.sin(angle) * baseRadius,
    );
    const shoulder = new THREE.Vector3(
      Math.cos(angle) * spec.reach * 0.48,
      3.65,
      Math.sin(angle) * spec.reach * 0.48,
    );
    const tip = new THREE.Vector3(
      Math.cos(angle) * spec.reach,
      3.65 - spec.droop,
      Math.sin(angle) * spec.reach,
    );
    baseGaps.push(Math.max(0, baseRadius - 0.22));
    if (arm === 'baseline') {
      cylinderBetween(`Mesh_Frond_${index}`, start, tip, 0.055, 0.055, leaf, root, [
        `vegetation.frond.${index}`,
      ]);
      droopPasses.push(false);
      continue;
    }
    cylinderBetween(`Mesh_Frond_${index}_0`, start, shoulder, 0.065, 0.038, leaf, root, [
      `vegetation.frond.${index}`,
      'vegetation.frond.spine',
    ]);
    cylinderBetween(`Mesh_Frond_${index}_1`, shoulder, tip, 0.038, 0.012, leaf, root, [
      `vegetation.frond.${index}`,
      'vegetation.frond.spine',
    ]);
    for (let leaflet = 1; leaflet <= 4; leaflet++) {
      const t = leaflet / 5;
      const center = shoulder.clone().lerp(tip, t);
      const side = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
      for (const sign of [-1, 1]) {
        const end = center.clone().addScaledVector(side, sign * (0.28 - t * 0.08));
        end.y -= 0.06 + t * 0.08;
        cylinderBetween(
          `Mesh_Frond_${index}_Leaflet_${leaflet}_${sign}`,
          center,
          end,
          0.018,
          0.006,
          leaf,
          root,
          [`vegetation.frond.${index}`, 'vegetation.frond.leaflet'],
        );
      }
    }
    droopPasses.push(shoulder.y > start.y && tip.y < shoulder.y);
  }
  root.updateMatrixWorld(true);
  return {
    root,
    intent: vegetationIntent({ subtype: 'frond/palm', canopyProfile: 'broadleaf' }),
    structural: {
      requestedFrondCount: spec.count,
      resolvedFrondCount: spec.count,
      attachmentPassRate: stable(baseGaps.filter((gap) => gap <= 0.02).length / baseGaps.length),
      maximumAttachmentGapMeters: stable(Math.max(...baseGaps)),
      arcAndDroopPassRate: stable(droopPasses.filter(Boolean).length / droopPasses.length),
    },
  };
}

const MATERIAL_PROMPT_CASES = Object.freeze([
  { id: 'bark', prompt: 'a weathered oak trunk', expectedRecipeId: 'kiln.material.bark.v1' },
  { id: 'leaf', prompt: 'a leafy hedge', expectedRecipeId: 'kiln.material.leaf.v1' },
  { id: 'wood', prompt: 'a warm wooden crate', expectedRecipeId: 'kiln.material.wood.v1' },
  { id: 'stone', prompt: 'a granite boundary stone', expectedRecipeId: 'kiln.material.stone.v1' },
  { id: 'rubber', prompt: 'a black vehicle tire', expectedRecipeId: 'kiln.material.rubber.v1' },
  {
    id: 'painted-metal',
    prompt: 'a red painted metal toolbox',
    expectedRecipeId: 'kiln.material.painted-metal.v1',
  },
  { id: 'cloth', prompt: 'a rough linen cloth banner', expectedRecipeId: 'kiln.material.cloth.v1' },
  {
    id: 'skin',
    prompt: 'a stylized human face with warm skin',
    expectedRecipeId: 'kiln.material.skin.v1',
  },
  {
    id: 'glass',
    prompt: 'a translucent greenhouse window',
    expectedRecipeId: 'kiln.material.glass.v1',
  },
  { id: 'emissive', prompt: 'a glowing amber sign', expectedRecipeId: 'kiln.material.emissive.v1' },
] as const satisfies readonly { id: string; prompt: string; expectedRecipeId: MaterialRecipeId }[]);

const RECIPE_PROMPT_PATTERNS: ReadonlyArray<readonly [RegExp, MaterialRecipeId]> = [
  [/(?:bark|tree trunk|oak trunk)/i, 'kiln.material.bark.v1'],
  [/(?:leaf|leaves|leafy|foliage)/i, 'kiln.material.leaf.v1'],
  [/(?:wood|wooden)/i, 'kiln.material.wood.v1'],
  [/(?:stone|granite|rock)/i, 'kiln.material.stone.v1'],
  [/(?:rubber|tire)/i, 'kiln.material.rubber.v1'],
  [/(?:painted metal|toolbox)/i, 'kiln.material.painted-metal.v1'],
  [/(?:cloth|linen|fabric)/i, 'kiln.material.cloth.v1'],
  [/(?:skin|face)/i, 'kiln.material.skin.v1'],
  [/(?:glass|window)/i, 'kiln.material.glass.v1'],
  [/(?:emissive|glow|glowing)/i, 'kiln.material.emissive.v1'],
];

const MATERIAL_ABLATION_BASELINE_CONTEXT = `Use portable glTF metallic-roughness materials. Preserve authored colors.`;

function offlineRecipePlan(prompt: string, context: string): MaterialRecipeId | null {
  const matching = RECIPE_PROMPT_PATTERNS.find(([pattern]) => pattern.test(prompt))?.[1];
  if (!matching) return null;
  return context.includes(`materialRecipe('${matching}'`) ? matching : null;
}

export function runMaterialPromptAblation(): MaterialPromptAblationV1 {
  const cases = MATERIAL_PROMPT_CASES.map((value) => ({
    ...value,
    baselineRecipeId: offlineRecipePlan(value.prompt, MATERIAL_ABLATION_BASELINE_CONTEXT),
    candidateRecipeId: offlineRecipePlan(value.prompt, MATERIAL_RECIPE_PROMPT_CONTEXT_V1),
  }));
  const baselineCorrect = cases.filter(
    (value) => value.baselineRecipeId === value.expectedRecipeId,
  ).length;
  const candidateCorrect = cases.filter(
    (value) => value.candidateRecipeId === value.expectedRecipeId,
  ).length;
  return {
    taskId: 'MAT-019',
    method: 'offline-context-guided-plan-simulation',
    corpusId: 'material-recipe-ablation-v1',
    corpusSha256: sha256(canonicalJson(MATERIAL_PROMPT_CASES)),
    baselineContextSha256: sha256(MATERIAL_ABLATION_BASELINE_CONTEXT),
    candidateContextSha256: sha256(MATERIAL_RECIPE_PROMPT_CONTEXT_V1),
    baselineCorrect,
    candidateCorrect,
    total: cases.length,
    nonzeroCorrectRecipeUsage: candidateCorrect > 0,
    portablePbrUsage: cases.filter((value) => value.candidateRecipeId !== null).length,
    cases,
  };
}

const PROCEDURAL_MATERIAL_CORPUS = Object.freeze([
  { id: 'bark', recipeId: 'kiln.material.bark.v1', color: [101, 65, 38] },
  { id: 'leaf', recipeId: 'kiln.material.leaf.v1', color: [47, 111, 50] },
  { id: 'wood', recipeId: 'kiln.material.wood.v1', color: [154, 106, 58] },
  { id: 'stone', recipeId: 'kiln.material.stone.v1', color: [125, 122, 116] },
] as const satisfies readonly {
  id: string;
  recipeId: MaterialRecipeId;
  color: readonly [number, number, number];
}[]);

function proceduralPixels(
  base: readonly [number, number, number],
  size = 17,
): { bytes: Uint8Array; seamMismatch: number; valueStandardDeviation: number } {
  const bytes = new Uint8Array(size * size * 4);
  const values: number[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / (size - 1);
      const v = y / (size - 1);
      const wave =
        Math.sin(u * Math.PI * 2) * 0.55 +
        Math.cos(v * Math.PI * 4) * 0.3 +
        Math.sin((u + v) * Math.PI * 2) * 0.15;
      const value = Math.round(wave * 22);
      const offset = (y * size + x) * 4;
      bytes[offset] = Math.max(0, Math.min(255, base[0] + value));
      bytes[offset + 1] = Math.max(0, Math.min(255, base[1] + value));
      bytes[offset + 2] = Math.max(0, Math.min(255, base[2] + value));
      bytes[offset + 3] = 255;
      values.push((bytes[offset]! + bytes[offset + 1]! + bytes[offset + 2]!) / 3);
    }
  }
  let seamMismatch = 0;
  for (let index = 0; index < size; index++) {
    for (let channel = 0; channel < 4; channel++) {
      seamMismatch = Math.max(
        seamMismatch,
        Math.abs(
          bytes[index * size * 4 + channel]! - bytes[(index * size + size - 1) * 4 + channel]!,
        ),
        Math.abs(bytes[index * 4 + channel]! - bytes[((size - 1) * size + index) * 4 + channel]!),
      );
    }
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return {
    bytes,
    seamMismatch,
    valueStandardDeviation: stable(Math.sqrt(variance)),
  };
}

async function buildMaterialArm(
  spec: (typeof PROCEDURAL_MATERIAL_CORPUS)[number],
  arm: 'baseline' | 'candidate',
): Promise<StructuralScene> {
  const root = new THREE.Group();
  root.name = `Material_${arm}_${spec.id}`;
  const material = await materialRecipe(spec.recipeId);
  let structural: Record<string, number | string | boolean | null> = {
    tileableSeamMismatch: 0,
    valueStandardDeviation: 0,
    textureRoundTripExpected: false,
  };
  if (arm === 'candidate') {
    const generated = proceduralPixels(spec.color);
    const sharp = (await import('sharp')).default;
    const encoded = await sharp(Buffer.from(generated.bytes), {
      raw: { width: 17, height: 17, channels: 4 },
    })
      .png({ compressionLevel: 9 })
      .toBuffer();
    const texture = await loadTexture(new Uint8Array(encoded), {
      usage: 'albedo',
      name: `Experiment_${spec.id}_tileable`,
    });
    texture.flipY = false;
    material.map = texture;
    material.needsUpdate = true;
    structural = {
      tileableSeamMismatch: generated.seamMismatch,
      valueStandardDeviation: generated.valueStandardDeviation,
      textureRoundTripExpected: true,
    };
  }
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
  mesh.name = `Mesh_${spec.id}`;
  root.add(mesh);
  root.updateMatrixWorld(true);
  return {
    root,
    intent: createAssetIntentV1({
      category: 'prop',
      material: { mode: 'pbrRecipe', recipeId: spec.recipeId },
    }),
    structural,
  };
}

const preferenceMissing = (subject: string): ExperimentPreferenceEvidenceV1 => ({
  status: 'insufficientEvidence',
  delegatedHumanLabels: 0,
  reason: `No owner or delegated-human held-out preference labels were supplied for ${subject}; deterministic structure/cost evidence cannot substitute for D-11.`,
});

async function executeComparison(
  taskId: ExperimentComparisonV1['taskId'],
  corpusId: string,
  corpus: readonly unknown[],
  baselineBuilder: (spec: never) => StructuralScene | Promise<StructuralScene>,
  candidateBuilder: (spec: never) => StructuralScene | Promise<StructuralScene>,
  subject: string,
): Promise<ExperimentComparisonV1> {
  const baseline: ExperimentArmV1[] = [];
  const candidate: ExperimentArmV1[] = [];
  for (const raw of corpus) {
    const id = (raw as { id: string }).id;
    const baselineScene = await baselineBuilder(raw as never);
    const candidateScene = await candidateBuilder(raw as never);
    baseline.push({
      id,
      structural: baselineScene.structural,
      runtime: await artifactMetrics(baselineScene),
    });
    candidate.push({
      id,
      structural: candidateScene.structural,
      runtime: await artifactMetrics(candidateScene),
    });
  }
  return {
    taskId,
    corpusId,
    corpusSha256: sha256(canonicalJson(corpus)),
    baselineCodeSha256: sha256(baselineBuilder.toString()),
    candidateCodeSha256: sha256(candidateBuilder.toString()),
    baseline,
    candidate,
    preference: preferenceMissing(subject),
    gate: 'closed',
    gateReason:
      'The required delegated-human preference dimension is insufficientEvidence; no public helper or procedural map class is promoted.',
  };
}

export async function runW6MaterialVegetationExperiments(): Promise<W6MaterialVegetationExperimentReportV1> {
  // Referencing the examples explicitly protects MAT-019 from a dead prompt-only export.
  if (!MATERIAL_RECIPE_EXECUTABLE_EXAMPLES_V1.includes('kiln.material.leaf.v1')) {
    throw new Error('Material recipe examples are not executable/discoverable.');
  }
  const materialPromptAblation = runMaterialPromptAblation();
  const branch = await executeComparison(
    'VEG-005',
    'vegetation-branch-ablation-v1',
    BRANCH_CORPUS,
    (spec: (typeof BRANCH_CORPUS)[number]) => buildBranchArm(spec, 'baseline'),
    (spec: (typeof BRANCH_CORPUS)[number]) => buildBranchArm(spec, 'candidate'),
    'parent-relative tapered branches',
  );
  const canopy = await executeComparison(
    'VEG-009',
    'vegetation-canopy-ablation-v1',
    CANOPY_CORPUS,
    (spec: (typeof CANOPY_CORPUS)[number]) => buildCanopyArm(spec, 'baseline'),
    (spec: (typeof CANOPY_CORPUS)[number]) => buildCanopyArm(spec, 'candidate'),
    'canopy/leaf-cluster scaffolds',
  );
  const frond = await executeComparison(
    'VEG-012',
    'vegetation-frond-ablation-v1',
    FROND_CORPUS,
    (spec: (typeof FROND_CORPUS)[number]) => buildFrondArm(spec, 'baseline'),
    (spec: (typeof FROND_CORPUS)[number]) => buildFrondArm(spec, 'candidate'),
    'palm/fern frond scaffolds',
  );
  const proceduralMaterial = await executeComparison(
    'MAT-020',
    'procedural-material-ablation-v1',
    PROCEDURAL_MATERIAL_CORPUS,
    (spec: (typeof PROCEDURAL_MATERIAL_CORPUS)[number]) => buildMaterialArm(spec, 'baseline'),
    (spec: (typeof PROCEDURAL_MATERIAL_CORPUS)[number]) => buildMaterialArm(spec, 'candidate'),
    'deterministic tileable procedural textures',
  );
  const withoutHash = {
    schemaVersion: W6_EXPERIMENT_SCHEMA_VERSION,
    deterministic: true as const,
    providerCalls: 0 as const,
    generatedAtPolicy: 'omitted-for-byte-stability' as const,
    materialPromptAblation,
    branch,
    canopy,
    frond,
    proceduralMaterial,
  };
  return { ...withoutHash, reportSha256: sha256(canonicalJson(withoutHash)) };
}

export function canonicalW6MaterialVegetationReport(
  report: W6MaterialVegetationExperimentReportV1,
): string {
  return canonicalJson(report);
}
