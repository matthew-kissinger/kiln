import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';

import { createAssetIntentV1, stampSemanticMetadataV1 } from '../contracts';
import {
  evaluateVegetationAdvisoryQa,
  evaluateVegetationCanopyQa,
  evaluateVegetationContactQa,
  evaluateVegetationFoliageAttachmentQa,
  evaluateVegetationGrowthQa,
  evaluateVegetationMaterialQa,
  evaluateVegetationRepetitionQa,
  evaluateVegetationScopeQa,
  measureVegetationCanopy,
  measureVegetationFoliageAttachment,
  measureVegetationFoliageMaterials,
  measureVegetationGrowth,
  measureVegetationRepetition,
  VEGETATION_CONTACT_TOLERANCE_METERS,
} from './vegetation';
import { runDeterministicSceneQa } from './run';

function semantic<T extends THREE.Object3D>(node: T, ...roles: string[]): T {
  return stampSemanticMetadataV1(node, { roles });
}

function vegetationIntent(
  growthState: 'lush' | 'sparse' | 'bare' = 'lush',
  mode: 'flatOptimized' | 'pbrRecipe' = 'pbrRecipe',
) {
  return createAssetIntentV1({
    category: 'vegetation',
    vegetation: {
      subtype: growthState === 'bare' ? 'bare/dead' : 'tree',
      growthState,
      canopyProfile: growthState === 'bare' ? 'bare/dead' : 'broadleaf',
    },
    material: { mode },
  });
}

function treeScene(
  options: {
    contactY?: number;
    trunkBottomY?: number;
    sparseCanopy?: boolean;
    foliageColors?: number[];
    clutter?: boolean;
    contact?: boolean;
  } = {},
): THREE.Group {
  const root = new THREE.Group();
  root.name = 'VegetationRoot';
  const trunkBottomY = options.trunkBottomY ?? 0;
  const trunkHeight = 3;
  const trunk = semantic(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.34, trunkHeight, 8),
      new THREE.MeshStandardMaterial({ color: 0x6b4426, roughness: 0.9 }),
    ),
    'vegetation.trunk',
  );
  trunk.name = 'Mesh_Trunk';
  trunk.position.y = trunkBottomY + trunkHeight / 2;
  root.add(trunk);

  if (options.contact !== false) {
    const contact = semantic(new THREE.Group(), 'vegetation.contact.ground');
    contact.name = 'Contact_Ground';
    contact.position.y = options.contactY ?? 0;
    root.add(contact);
  }

  const colors = options.foliageColors ?? [0x2f6f32, 0x5f9142];
  const positions = options.sparseCanopy
    ? [
        [-1.8, 4, 0],
        [1.8, 4, 0],
      ]
    : [
        [-0.7, 3.8, 0],
        [0.7, 3.9, 0.2],
        [0, 4.45, -0.45],
        [0.1, 3.65, 0.75],
      ];
  positions.forEach(([x, y, z], index) => {
    const foliage = semantic(
      new THREE.Mesh(
        new THREE.SphereGeometry(options.sparseCanopy ? 0.25 : 0.9, 8, 6),
        new THREE.MeshStandardMaterial({ color: colors[index % colors.length], roughness: 0.86 }),
      ),
      `vegetation.canopy.cluster.${index}`,
      'vegetation.foliage',
    );
    foliage.name = `Mesh_Canopy_${index}`;
    foliage.position.set(x!, y!, z!);
    root.add(foliage);
  });

  if (options.clutter) {
    const soil = semantic(
      new THREE.Mesh(
        new THREE.CylinderGeometry(2.2, 2.2, 0.05, 16),
        Object.assign(new THREE.MeshStandardMaterial({ color: 0x5d4129 }), {
          name: 'SoilMaterial',
        }),
      ),
      'terrain.soil.base',
    );
    soil.name = 'Mesh_Soil_Mound';
    soil.position.y = 0.025;
    root.add(soil);
  }
  root.updateMatrixWorld(true);
  return root;
}

function cylinderBetween(
  name: string,
  start: THREE.Vector3,
  end: THREE.Vector3,
  baseRadius: number,
  tipRadius: number,
  roles: string[],
): THREE.Mesh {
  const direction = end.clone().sub(start);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(tipRadius, baseRadius, direction.length(), 12),
    new THREE.MeshStandardMaterial({ color: 0x6b4426 }),
  );
  if (roles.length > 0) semantic(mesh, ...roles);
  mesh.name = name;
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

function growthScene(options: { badTaper?: boolean; fallback?: boolean } = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'GrowthFixture';
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.4, 4, 12),
    new THREE.MeshStandardMaterial({ color: 0x6b4426 }),
  );
  trunk.name = 'Mesh_Trunk';
  trunk.position.y = 2;
  if (!options.fallback) semantic(trunk, 'vegetation.trunk');
  root.add(trunk);
  const branch = cylinderBetween(
    'Mesh_Branch_Primary',
    new THREE.Vector3(0.28, 2.1, 0),
    new THREE.Vector3(1.8, 3.25, 0),
    options.badTaper ? 0.04 : 0.12,
    options.badTaper ? 0.42 : 0.04,
    options.fallback ? [] : ['vegetation.branch.primary.0'],
  );
  root.add(branch);
  root.updateMatrixWorld(true);
  return root;
}

function attachmentScene(detached = false): THREE.Group {
  const root = growthScene();
  for (let index = 0; index < 4; index++) {
    const cluster = semantic(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.36, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0x34743b }),
      ),
      `vegetation.canopy.cluster.${index}`,
      'vegetation.foliage',
    );
    cluster.name = `Mesh_Foliage_${index}`;
    cluster.position.set(
      index === 0 && detached ? 4.5 : 1.45 + index * 0.08,
      3.05 + index * 0.08,
      (index - 1.5) * 0.16,
    );
    cluster.scale.setScalar(1 + index * 0.04);
    cluster.rotation.y = index * 0.17;
    root.add(cluster);
  }
  root.updateMatrixWorld(true);
  return root;
}

function radialScene(topiary = false): {
  scene: THREE.Group;
  intent: ReturnType<typeof vegetationIntent>;
} {
  const root = growthScene();
  for (let index = 0; index < 6; index++) {
    const angle = (index / 6) * Math.PI * 2;
    const cluster = semantic(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0x34743b }),
      ),
      `vegetation.canopy.cluster.${index}`,
    );
    cluster.name = `Mesh_Radial_${index}`;
    cluster.position.set(Math.cos(angle) * 1.6, 3.5, Math.sin(angle) * 1.6);
    root.add(cluster);
  }
  root.updateMatrixWorld(true);
  const intent = vegetationIntent();
  if (topiary && intent.vegetation) intent.vegetation.canopyProfile = 'topiary';
  return { scene: root, intent };
}

describe('W6 vegetation QA', () => {
  test('VEG-003 blocks missing, floating, buried, and materially buried contacts', () => {
    const intent = vegetationIntent();
    expect(
      evaluateVegetationContactQa({ intent, scene: treeScene({ contact: false }) }).map(
        (finding) => finding.code,
      ),
    ).toContain('VEG_CONTACT_MISSING');
    expect(
      evaluateVegetationContactQa({
        intent,
        scene: treeScene({ contactY: VEGETATION_CONTACT_TOLERANCE_METERS + 0.01 }),
      }).map((finding) => finding.code),
    ).toContain('VEG_CONTACT_FLOATING');
    expect(
      evaluateVegetationContactQa({
        intent,
        scene: treeScene({ contactY: -VEGETATION_CONTACT_TOLERANCE_METERS - 0.01 }),
      }).map((finding) => finding.code),
    ).toContain('VEG_CONTACT_BURIED');
    expect(
      evaluateVegetationContactQa({
        intent,
        scene: treeScene({ trunkBottomY: -VEGETATION_CONTACT_TOLERANCE_METERS - 0.01 }),
      }).map((finding) => finding.code),
    ).toContain('VEG_MATERIAL_BURIED');
  });

  test('VEG-003 evaluates asset-local contact under a transformed root', () => {
    const scene = treeScene();
    scene.position.set(10, 4, -3);
    scene.rotation.set(0.1, 0.8, -0.15);
    scene.scale.setScalar(1.3);
    scene.updateMatrixWorld(true);
    expect(evaluateVegetationContactQa({ intent: vegetationIntent(), scene })).toEqual([]);
  });

  test('VEG-003 accepts a nonrendering ground-contact frame on the semantic trunk', () => {
    const scene = treeScene({ contact: false });
    const trunk = scene.getObjectByName('Mesh_Trunk')!;
    stampSemanticMetadataV1(trunk, {
      roles: ['vegetation.trunk', 'vegetation.contact.ground'],
      frames: [
        {
          id: 'ground-contact',
          translation: [0, -1.5, 0],
          rotation: [0, 0, 0, 1],
        },
      ],
    });
    scene.updateMatrixWorld(true);
    expect(evaluateVegetationContactQa({ intent: vegetationIntent(), scene })).toEqual([]);
  });

  test('VEG-004 needs corroborating scope evidence and remains observe-only in the registry', () => {
    const intent = vegetationIntent();
    const clean = treeScene();
    expect(evaluateVegetationScopeQa({ intent, scene: clean })).toEqual([]);
    const cluttered = treeScene({ clutter: true });
    const direct = evaluateVegetationScopeQa({ intent, scene: cluttered });
    expect(direct.map((finding) => finding.code)).toContain('VEG_SCOPE_EXTRA');
    expect(direct.every((finding) => finding.disposition === 'warn')).toBe(true);
    const report = runDeterministicSceneQa({ intent, scene: cluttered });
    const scope = report.dimensions.promptAlignment.findings.find(
      (finding) => finding.code === 'VEG_SCOPE_EXTRA',
    );
    expect(scope?.disposition).toBe('observe');
    expect(report.disposition).not.toBe('block');
  });

  test('VEG-014 measures front, side, top occupancy and canopy-to-trunk ratio by profile', () => {
    const intent = vegetationIntent();
    const full = measureVegetationCanopy(intent, treeScene());
    expect(full.profile).toBe('broadleaf');
    expect(full.source).toBe('semantic');
    expect(full.frontOccupancy).toBeGreaterThan(0.4);
    expect(full.sideOccupancy).toBeGreaterThan(0.4);
    expect(full.topOccupancy).toBeGreaterThan(0.32);
    expect(full.canopyToTrunkVolumeRatio).toBeGreaterThan(1.5);

    const sparseFindings = evaluateVegetationCanopyQa({
      intent,
      scene: treeScene({ sparseCanopy: true }),
    });
    expect(sparseFindings.some((finding) => finding.code.startsWith('VEG_CANOPY_OCCUPANCY_'))).toBe(
      true,
    );
    expect(
      sparseFindings.every((finding) => finding.measurement && finding.disposition === 'warn'),
    ).toBe(true);
  });

  test('VEG-014 treats explicitly bare/dead growth as a distinct zero-canopy profile', () => {
    const scene = treeScene();
    for (const node of [...scene.children]) {
      if (/Canopy/.test(node.name)) scene.remove(node);
    }
    const intent = vegetationIntent('bare');
    const measured = measureVegetationCanopy(intent, scene);
    expect(measured.profile).toBe('bare/dead');
    expect(measured.canopyNodeCount).toBe(0);
    expect(evaluateVegetationCanopyQa({ intent, scene })).toEqual([]);
  });

  test('VEG-018 keeps optimized one-role foliage while rich organic mode asks for restrained variation', () => {
    const oneColor = treeScene({ foliageColors: [0x3f7f3a] });
    const optimized = vegetationIntent('lush', 'flatOptimized');
    expect(measureVegetationFoliageMaterials(optimized, oneColor)).toMatchObject({
      valueRoleCount: 1,
      coherent: true,
    });
    expect(evaluateVegetationMaterialQa({ intent: optimized, scene: oneColor })).toEqual([]);

    const rich = vegetationIntent('lush', 'pbrRecipe');
    expect(measureVegetationFoliageMaterials(rich, oneColor).coherent).toBe(false);
    expect(evaluateVegetationMaterialQa({ intent: rich, scene: oneColor })[0]).toMatchObject({
      code: 'VEG_FOLIAGE_VALUE_ROLES',
      dimension: 'visualQuality',
      disposition: 'warn',
    });
    const varied = treeScene({ foliageColors: [0x245b2d, 0x72a94d] });
    expect(measureVegetationFoliageMaterials(rich, varied).coherent).toBe(true);
    expect(evaluateVegetationMaterialQa({ intent: rich, scene: varied })).toEqual([]);
  });

  test('VEG-013 measures semantic and fallback taper/length ratios with subtype bands', () => {
    const intent = vegetationIntent();
    const good = measureVegetationGrowth(intent, growthScene());
    expect(good).toMatchObject({
      subtype: 'tree',
      source: 'semantic',
      trunkCount: 1,
      branchCount: 1,
    });
    expect(good.nodes.every((node) => node.taperRatio !== null)).toBe(true);
    expect(evaluateVegetationGrowthQa({ intent, scene: growthScene() })).toEqual([]);

    const fallback = measureVegetationGrowth(intent, growthScene({ fallback: true }));
    expect(fallback.source).toBe('fallback');
    const bad = evaluateVegetationGrowthQa({ intent, scene: growthScene({ badTaper: true }) });
    expect(bad.map((finding) => finding.code)).toContain('VEG_GROWTH_TAPER_OUTLIER');
    expect(bad.every((finding) => finding.measurement && finding.disposition === 'warn')).toBe(
      true,
    );
  });

  test('VEG-015 lists detached foliage with nearest-support gap measurements', () => {
    const attached = measureVegetationFoliageAttachment(attachmentScene());
    expect(attached.source).toBe('semantic');
    expect(attached.clusters).toHaveLength(4);
    expect(attached.clusters.every((cluster) => !cluster.detached)).toBe(true);
    const findings = evaluateVegetationFoliageAttachmentQa({
      intent: vegetationIntent(),
      scene: attachmentScene(true),
    });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      code: 'VEG_FOLIAGE_DETACHED',
      disposition: 'warn',
      affected: { node: 'Mesh_Foliage_0' },
    });
    expect(findings[0]!.measurement?.actual).toBeGreaterThan(
      findings[0]!.measurement?.threshold ?? 0,
    );
  });

  test('VEG-016 detects identical transforms and perfect radial lockstep but suppresses formal topiary', () => {
    const regular = radialScene();
    const measured = measureVegetationRepetition(regular.intent, regular.scene);
    expect(measured.identicalTransformGroups[0]?.nodes).toHaveLength(6);
    expect(measured.perfectRadialLockstep).toBe(true);
    expect(evaluateVegetationRepetitionQa(regular).map((finding) => finding.code)).toEqual([
      'VEG_CLUSTER_TRANSFORM_REPEAT',
      'VEG_CLUSTER_RADIAL_LOCKSTEP',
    ]);

    const topiary = radialScene(true);
    expect(measureVegetationRepetition(topiary.intent, topiary.scene).suppressedForTopiary).toBe(
      true,
    );
    expect(evaluateVegetationRepetitionQa(topiary)).toEqual([]);
  });

  test('advisory aggregation never upgrades heuristic findings to blockers', () => {
    const findings = evaluateVegetationAdvisoryQa({
      intent: vegetationIntent(),
      scene: treeScene({ clutter: true, sparseCanopy: true, foliageColors: [0x3f7f3a] }),
    });
    expect(findings.length).toBeGreaterThan(2);
    expect(findings.every((finding) => finding.disposition === 'warn')).toBe(true);
  });
});
