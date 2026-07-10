import { describe, expect, test } from 'bun:test';
import { WebIO, type Node as GltfNode } from '@gltf-transform/core';
import * as THREE from 'three';

import { createGableShell, createRoofSurfaceLayout } from '../architecture';
import {
  createAssetIntentV1,
  readSemanticMetadataV1FromExtras,
  stampSemanticMetadataV1,
} from '../contracts';
import { renderSceneToGLB } from '../render';
import { hideArchitectureRoofInScene } from '../views/architecture';
import {
  ARCHITECTURE_REGRESSION_CORPUS,
  buildArchitectureCorpusFixture,
} from './architecture-corpus';
import {
  ARCHITECTURE_REPAIR_CODES,
  architectureRepairRecipe,
  withArchitectureRepair,
} from './architecture-repairs';
import { ARCHITECTURE_REALISTIC_SCALE_BANDS, evaluateArchitectureQa } from './architecture';
import { DETERMINISTIC_QA_REGISTRY, runDeterministicSceneQa } from './run';

const canonicalCodes = new Set([
  'ARCH_ROOF_AXIS',
  'ARCH_OPEN_GABLE',
  'ARCH_RIDGE_GAP',
  'ARCH_ENVELOPE_GAP',
  'ARCH_BLOCKED_PORTAL',
]);

function canonicalHelperShell(ridgeAxis: 'x' | 'z' = 'x') {
  const wall = new THREE.MeshStandardMaterial({ color: 0xc8ad82 });
  const roof = new THREE.MeshStandardMaterial({ color: 0x59616d });
  const shell = createGableShell(
    `Canonical_${ridgeAxis}`,
    { wall, roof },
    {
      spanX: 6,
      spanZ: 4,
      wallHeight: 3,
      wallThickness: 0.15,
      rise: ridgeAxis === 'x' ? 1.5 : 2.25,
      ridgeAxis,
      overhang: 0.3,
      enterable: true,
      closedEnds: true,
    },
  );
  for (const face of shell.roof.faces) {
    createRoofSurfaceLayout(`Panels_${face.side}`, roof, {
      face,
      kind: 'panels',
      panelWidth: 0.9,
    });
  }
  const halfRun = (ridgeAxis === 'x' ? 4 : 6) / 2;
  const rise = ridgeAxis === 'x' ? 1.5 : 2.25;
  const intent = createAssetIntentV1({
    category: 'architecture',
    architecture: {
      subtype: 'gable building',
      enterable: true,
      footprint: { spanX: 6, spanZ: 4 },
      wallHeight: 3,
      roof: {
        type: 'gable',
        ridgeAxis,
        rise,
        pitchDegrees: THREE.MathUtils.radToDeg(Math.atan2(rise, halfRun)),
        overhang: 0.3,
        closedEnds: true,
      },
      portal: { width: 1.1, height: 2.1, depth: 0.15 },
    },
  });
  return { shell, intent };
}

describe('ARCH-019 executable reciprocal architecture corpus', () => {
  for (const descriptor of ARCHITECTURE_REGRESSION_CORPUS) {
    test(`${descriptor.kind}: ${descriptor.id}`, () => {
      const payload = descriptor.build();
      const findings = evaluateArchitectureQa({
        intent: payload.intent,
        scene: payload.scene,
      });
      const codes = findings.map((finding) => finding.code);
      if (descriptor.expectedPrimaryCode) {
        const primary = findings.find((finding) => canonicalCodes.has(finding.code));
        expect(primary?.code).toBe(descriptor.expectedPrimaryCode);
        expect(primary?.affected?.node).toBeTruthy();
        expect(primary?.measurement).toBeTruthy();
        expect(primary?.viewHints?.length).toBeGreaterThan(0);
        expect(primary?.repairText).toBeTruthy();
      }
      for (const forbidden of descriptor.forbiddenCodes) expect(codes).not.toContain(forbidden);
    });
  }

  test('covers every observed architecture failure with a reciprocal control', () => {
    const byId = new Map(ARCHITECTURE_REGRESSION_CORPUS.map((fixture) => [fixture.id, fixture]));
    for (const fixture of ARCHITECTURE_REGRESSION_CORPUS) {
      if (fixture.kind !== 'failure') continue;
      const pair = byId.get(fixture.pairId!);
      expect(pair?.kind).toBe('control');
      expect(pair?.pairId).toBe(fixture.id);
    }
  });
});

describe('ARCH-010–016 validator policy', () => {
  test('the canonical shell and roof-local panels pass exact QA for both ridge axes', () => {
    for (const ridgeAxis of ['x', 'z'] as const) {
      const { shell, intent } = canonicalHelperShell(ridgeAxis);
      shell.root.position.set(3, 1, -2);
      shell.root.rotation.set(0.08, 0.55, -0.04);
      shell.root.updateMatrixWorld(true);
      const findings = evaluateArchitectureQa({ intent, scene: shell.root });
      expect(findings.filter((finding) => canonicalCodes.has(finding.code))).toEqual([]);
      expect(findings.filter((finding) => finding.code.startsWith('ARCH_SCALE_'))).toEqual([]);
    }
  });

  test('final export preserves helper portal/roof semantics and safely degrades full optimize', async () => {
    const { shell, intent } = canonicalHelperShell('x');
    const rendered = await renderSceneToGLB(shell.root, { intent, optimize: 'full' });
    expect(rendered.optimize?.mode).toBe('palette');
    expect(rendered.qaReport.disposition).toBe('pass');
    const document = await new WebIO().readBinary(rendered.bytes);
    const opening = document
      .getRoot()
      .listNodes()
      .find((node) => node.getName().startsWith('Opening_front_'));
    expect(readSemanticMetadataV1FromExtras(opening!.getExtras())?.roles).toContain(
      'opening.front.door',
    );
    expect(opening?.getScale()).toEqual([0.15, 2.1, 1.1]);
    const roofRoles = document
      .getRoot()
      .listNodes()
      .flatMap((node) => readSemanticMetadataV1FromExtras(node.getExtras())?.roles ?? [])
      .filter((role) => role.startsWith('roof.'));
    expect(roofRoles).toEqual(
      expect.arrayContaining([
        'roof.assembly',
        'roof.slope.positive',
        'roof.slope.negative',
        'roof.gable.positive',
        'roof.gable.negative',
      ]),
    );

    const adapt = (node: GltfNode): Record<string, unknown> => ({
      name: node.getName(),
      visible: true,
      userData: node.getExtras(),
      children: node.listChildren().map(adapt),
    });
    const reloaded = {
      name: 'ReloadedShell',
      visible: true,
      userData: {},
      children: document.getRoot().listScenes()[0]!.listChildren().map(adapt),
    };
    const selection = hideArchitectureRoofInScene(reloaded);
    expect(selection.mode).toBe('semantic');
    expect(selection.nodes.map((node) => node.name).sort()).toEqual(['Roof']);
    expect(
      (selection.nodes[0]!.children ?? [])
        .map((node) => node.name)
        .filter((name): name is string => typeof name === 'string' && name.includes('_Gable_'))
        .sort(),
    ).toEqual(['Mesh_Canonical_x_Gable_negative', 'Mesh_Canonical_x_Gable_positive']);
    for (const selected of selection.nodes) {
      const roles = readSemanticMetadataV1FromExtras(selected.userData ?? {})?.roles ?? [];
      expect(roles.some((role) => role.startsWith('roof.'))).toBe(true);
    }
    const wallNode = document
      .getRoot()
      .listNodes()
      .find((node) =>
        readSemanticMetadataV1FromExtras(node.getExtras())?.roles.includes('wall.front'),
      );
    const adaptedWall = (reloaded.children as Array<Record<string, unknown>>)
      .flatMap(function flatten(node): Array<Record<string, unknown>> {
        return [
          node,
          ...((node.children as Array<Record<string, unknown>> | undefined)?.flatMap(flatten) ??
            []),
        ];
      })
      .find((node) => node.name === wallNode?.getName());
    expect(adaptedWall?.visible).toBe(true);
  });

  test('registry selects architecture rules and hard-gates a tagged exact defect', () => {
    const payload = buildArchitectureCorpusFixture({ panelAxis: 'rotated-90' });
    const context = { intent: payload.intent, scene: payload.scene };
    expect(DETERMINISTIC_QA_REGISTRY.list(context).map((rule) => rule.id)).toContain(
      'ARCHITECTURE_PROFILE',
    );
    const report = runDeterministicSceneQa(context);
    expect(report.disposition).toBe('block');
    expect(report.dimensions.categoryReadiness.findings.map((finding) => finding.code)).toContain(
      'ARCH_ROOF_AXIS',
    );
  });

  test('passes a ridge-Z nonsquare shell under translated and rotated root transforms', () => {
    const payload = buildArchitectureCorpusFixture({ ridgeAxis: 'z' });
    payload.scene.position.set(7, 2, -4);
    payload.scene.rotation.set(0.1, 0.7, -0.05);
    payload.scene.updateMatrixWorld(true);
    const findings = evaluateArchitectureQa({ intent: payload.intent, scene: payload.scene });
    expect(findings.filter((finding) => canonicalCodes.has(finding.code))).toEqual([]);
  });

  test('rejects complete-looking gables that do not occupy the claimed end boundaries', () => {
    const { shell, intent } = canonicalHelperShell('x');
    expect(
      evaluateArchitectureQa({ intent, scene: shell.root }).map((finding) => finding.code),
    ).not.toContain('ARCH_OPEN_GABLE');
    shell.gables[0]!.position.x = 0;
    shell.gables[1]!.position.x = 0;
    shell.root.updateMatrixWorld(true);
    const findings = evaluateArchitectureQa({ intent, scene: shell.root });
    const misplaced = findings.filter((finding) => finding.code === 'ARCH_OPEN_GABLE');
    expect(misplaced).toHaveLength(2);
    expect(misplaced.every((finding) => finding.measurement?.name.endsWith('EndSeparation'))).toBe(
      true,
    );
  });

  test('rejects a clearance marker floating outside its claimed exterior wall', () => {
    const { shell, intent } = canonicalHelperShell('x');
    expect(
      evaluateArchitectureQa({ intent, scene: shell.root }).map((finding) => finding.code),
    ).not.toContain('ARCH_BLOCKED_PORTAL');
    shell.openings[0]!.position.x = 100;
    shell.root.updateMatrixWorld(true);
    const finding = evaluateArchitectureQa({ intent, scene: shell.root }).find(
      (candidate) => candidate.code === 'ARCH_BLOCKED_PORTAL',
    );
    expect(finding?.measurement).toMatchObject({
      name: 'portalClaimedWallCoverageRatio',
      actual: 0,
      threshold: 0.9,
    });
  });

  test('keeps untagged/inferred roof defects warn-only and asks for semantic roles', () => {
    const scene = new THREE.Group();
    scene.name = 'LegacyBuilding';
    const roof = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 2), new THREE.MeshStandardMaterial());
    roof.name = 'Roof_Plane';
    scene.add(roof);
    const intent = createAssetIntentV1({
      category: 'architecture',
      architecture: { enterable: false, roof: { closedEnds: false } },
    });
    const findings = evaluateArchitectureQa({ intent, scene });
    expect(findings.some((finding) => finding.code === 'ARCH_MISSING_ROOF_ROLES')).toBe(true);
    expect(findings.every((finding) => finding.disposition !== 'block')).toBe(true);
  });

  test('explicit stylized scale suppresses every realistic scale-band warning', () => {
    const payload = buildArchitectureCorpusFixture({ stylized: true });
    const findings = evaluateArchitectureQa({ intent: payload.intent, scene: payload.scene });
    expect(findings.some((finding) => finding.code.startsWith('ARCH_SCALE_'))).toBe(false);
  });

  test('reports every realistic door, ceiling, stair, wall, and footprint band', () => {
    expect(Object.keys(ARCHITECTURE_REALISTIC_SCALE_BANDS).sort()).toEqual([
      'ceilingHeight',
      'doorHeight',
      'doorWidth',
      'footprint',
      'stairRiser',
      'stairTread',
      'wallThickness',
    ]);
    const payload = buildArchitectureCorpusFixture();
    const opening = payload.scene.getObjectByName('Opening_front_door')!;
    opening.scale.set(0.15, 1, 0.4);
    const thinWall = payload.scene.getObjectByName('WallBack')!;
    thinWall.scale.x = 0.1;
    const stair = stampSemanticMetadataV1(
      new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 0.8), new THREE.MeshStandardMaterial()),
      { roles: ['stair.step.1'] },
    );
    stair.name = 'OversizeStairStep';
    payload.scene.add(stair);
    payload.scene.updateMatrixWorld(true);
    const tinyIntent = createAssetIntentV1({
      category: 'architecture',
      architecture: {
        enterable: false,
        footprint: { spanX: 1, spanZ: 1 },
        wallHeight: 1,
        roof: { rise: 0.3 },
      },
    });
    const codes = evaluateArchitectureQa({ intent: tinyIntent, scene: payload.scene }).map(
      (finding) => finding.code,
    );
    expect(codes).toEqual(
      expect.arrayContaining([
        'ARCH_SCALE_DOOR_WIDTH',
        'ARCH_SCALE_DOOR_HEIGHT',
        'ARCH_SCALE_CEILING_HEIGHT',
        'ARCH_SCALE_STAIR_RISER',
        'ARCH_SCALE_STAIR_TREAD',
        'ARCH_SCALE_WALL_THICKNESS',
        'ARCH_SCALE_FOOTPRINT_X',
        'ARCH_SCALE_FOOTPRINT_Z',
      ]),
    );
  });
});

describe('ARCH-018 evidence-bound repair recipes', () => {
  test('maps all five approved defect codes to localized repairs and views', () => {
    expect(ARCHITECTURE_REPAIR_CODES).toHaveLength(5);
    for (const code of ARCHITECTURE_REPAIR_CODES) {
      const recipe = architectureRepairRecipe(code);
      expect(recipe?.code).toBe(code);
      expect(recipe?.repairText.length).toBeGreaterThan(80);
      expect(recipe?.viewHints.length).toBeGreaterThan(1);
    }
  });

  test('preserves finding-specific localization when applying a recipe', () => {
    const finding = withArchitectureRepair({
      code: 'ARCH_RIDGE_GAP',
      disposition: 'block',
      dimension: 'categoryReadiness',
      profile: 'architecture.test',
      message: 'Localized ridge gap.',
      affected: { node: 'SlopeNegative' },
      measurement: { name: 'ridgeGap', actual: 0.2, threshold: 0.05, unit: 'm' },
      viewHints: ['custom.localized.view'],
    });
    expect(finding.affected?.node).toBe('SlopeNegative');
    expect(finding.measurement?.actual).toBe(0.2);
    expect(finding.viewHints).toContain('custom.localized.view');
    expect(finding.viewHints).toContain('architecture.gable.positive');
  });
});
