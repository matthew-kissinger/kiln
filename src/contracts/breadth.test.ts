import { describe, expect, test } from 'bun:test';

import {
  ASSET_SCOPES,
  REFERENCE_QA_RUN_MODES,
  VFX_SUBTYPES,
  assessAssetScopeV1,
  evaluateModularJoinV1,
  scoreReferenceAgreementV1,
  shouldRunReferenceQa,
  validateReferenceViewAssumptionsV1,
  validateModularKitContractV1,
  validateVfxIntentV1,
  type ModularKitContractV1,
  type VfxIntentV1,
} from './breadth';

const billboard = (): VfxIntentV1 => ({
  schemaVersion: 1,
  subtype: 'billboard',
  portability: 'portable',
  transparency: 'blend',
  doubleSided: true,
  facing: { source: 'explicit', mode: 'camera-y-axis', normalAxis: '+X' },
  animation: {
    playback: 'loop',
    durationSeconds: 2,
    endpointBehavior: 'matchStart',
    driver: 'clip',
    clipName: 'SmokeLoop',
  },
});

const modularKit = (): ModularKitContractV1 => ({
  schemaVersion: 1,
  units: 'm',
  grid: [1, 1, 1],
  sockets: [
    {
      id: 'wall-a.east',
      pieceId: 'wall-a',
      type: 'wall.edge.east',
      compatibleTypes: ['wall.edge.west'],
      frame: { translation: [1, 0, 0], rotation: [0, 0, 0, 1] },
      allowedRotationsDegrees: [0, 90, 180, 270],
    },
    {
      id: 'wall-b.west',
      pieceId: 'wall-b',
      type: 'wall.edge.west',
      compatibleTypes: ['wall.edge.east'],
      frame: { translation: [-1, 0, 0], rotation: [0, 1, 0, 0] },
      allowedRotationsDegrees: [0, 90, 180, 270],
    },
  ],
});

describe('W7 dependency-free breadth contracts', () => {
  test('VFX-001 freezes every subtype plus an explicit portable/sidecar requirement', () => {
    expect(VFX_SUBTYPES).toEqual([
      'billboard',
      'beam',
      'trail',
      'aura',
      'portal',
      'impact',
      'volume-like',
      'runtimeShader',
    ]);
    expect(validateVfxIntentV1(billboard())).toEqual({
      valid: true,
      value: billboard(),
      issues: [],
    });

    const runtimeShader: VfxIntentV1 = {
      ...billboard(),
      subtype: 'runtimeShader',
      portability: 'sidecar',
      facing: { source: 'explicit', mode: 'fixed', normalAxis: '+X' },
      animation: {
        playback: 'loop',
        durationSeconds: 1,
        endpointBehavior: 'matchStart',
        driver: 'timeUniform',
        timeUniformName: 'kilnTimeSeconds',
      },
      sidecar: { kind: 'tsl', id: 'kiln.vfx.portal.tsl.v1', version: '1.0.0' },
    };
    expect(validateVfxIntentV1(runtimeShader).valid).toBe(true);
    expect(
      validateVfxIntentV1({ ...runtimeShader, portability: 'portable' }).issues.map(
        (issue) => issue.code,
      ),
    ).toEqual(
      expect.arrayContaining(['VFX_PORTABLE_SIDECAR_CONFLICT', 'VFX_RUNTIME_SHADER_NOT_PORTABLE']),
    );
  });

  test('VFX-003/004 reject incomplete facing, direction, loop, and runtime-driver contracts', () => {
    const beam = {
      ...billboard(),
      subtype: 'beam',
      facing: { source: 'explicit', mode: 'fixed', normalAxis: '+Y' },
      animation: {
        playback: 'loop',
        durationSeconds: 0,
        endpointBehavior: 'holdLast',
        driver: 'none',
      },
    };
    expect(validateVfxIntentV1(beam).issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'VFX_DIRECTION_REQUIRED',
        'VFX_ANIMATION_DURATION_REQUIRED',
        'VFX_ANIMATION_DRIVER_REQUIRED',
        'VFX_LOOP_ENDPOINT_REQUIRED',
      ]),
    );
  });

  test('SCOPE-001 carries all four scopes and flags only the evidence it measured', () => {
    expect(ASSET_SCOPES).toEqual(['single', 'cluster', 'modularSet', 'packMember']);
    const explicit = assessAssetScopeV1(
      { schemaVersion: 1, scope: 'single', explicit: true },
      { topLevelAssetRoots: 2, reusableMemberCount: 2, sceneDressingRoles: [] },
    );
    expect(explicit).toMatchObject({
      status: 'flagged',
      code: 'ASSET_SCOPE_EXPLICIT_SINGLE_CLUSTER',
      explicitSingleViolation: true,
    });
    const cluster = assessAssetScopeV1(
      { schemaVersion: 1, scope: 'cluster', explicit: true },
      { topLevelAssetRoots: 3, reusableMemberCount: 3, sceneDressingRoles: [] },
    );
    expect(cluster.status).toBe('pass');
    expect('disposition' in explicit).toBe(false);
  });

  test('MOD-001 validates grid/units/socket compatibility and proves a zero-seam two-piece join', () => {
    const kit = modularKit();
    expect(validateModularKitContractV1(kit)).toEqual({ valid: true, value: kit, issues: [] });
    const joined = evaluateModularJoinV1(kit, {
      aSocketId: 'wall-a.east',
      bSocketId: 'wall-b.west',
      aWorldPosition: [1, 0, 0],
      bWorldPosition: [1, 0, 0],
      aWorldNormal: [1, 0, 0],
      bWorldNormal: [-1, 0, 0],
      relativeRotationDegrees: 0,
    });
    expect(joined).toMatchObject({
      pass: true,
      seamMeters: 0,
      overlapMeters: 0,
      lateralOffsetMeters: 0,
      normalErrorDegrees: 0,
      codes: [],
    });
    const overlapped = evaluateModularJoinV1(kit, {
      aSocketId: 'wall-a.east',
      bSocketId: 'wall-b.west',
      aWorldPosition: [1, 0, 0],
      bWorldPosition: [0.99, 0, 0],
      aWorldNormal: [1, 0, 0],
      bWorldNormal: [-1, 0, 0],
      relativeRotationDegrees: 45,
    });
    expect(overlapped.pass).toBe(false);
    expect(overlapped.codes).toEqual(
      expect.arrayContaining([
        'MOD_ROTATION_NOT_ALLOWED',
        'MOD_GRID_MISALIGNED',
        'MOD_JOIN_OVERLAP',
      ]),
    );
  });

  test('REF-001 is scheduled only for Bench/flagged/sample and never collapses separate scores', () => {
    expect(REFERENCE_QA_RUN_MODES).toEqual(['bench', 'flagged', 'sample']);
    expect(shouldRunReferenceQa('generation')).toBe(false);
    const assumptions = [
      {
        id: 'reference.front',
        targetViewId: 'front',
        projection: 'perspective' as const,
        mirrored: false,
        materialVisibility: 'full' as const,
      },
      {
        id: 'reference.right',
        targetViewId: 'right',
        projection: 'unknown' as const,
        mirrored: false,
        materialVisibility: 'partial' as const,
      },
    ];
    const report = scoreReferenceAgreementV1({
      runMode: 'sample',
      assumptions,
      samples: [
        {
          assumptionId: 'reference.front',
          silhouetteIntersectionPixels: 80,
          silhouetteUnionPixels: 100,
          meanMaterialDeltaE: 10,
        },
      ],
      structuralReadiness: 'warn',
    });
    expect(report).toEqual({
      schemaVersion: 1,
      scheduled: true,
      runMode: 'sample',
      silhouetteAgreement: 0.8,
      materialAgreement: 0.9,
      structuralReadiness: 'warn',
      evaluatedViews: ['reference.front'],
      insufficientEvidenceViews: ['reference.right'],
      assumptionIssues: [],
      disposition: 'observe',
      repairEligible: false,
    });
    expect('overallScore' in report).toBe(false);
    expect(
      validateReferenceViewAssumptionsV1([
        assumptions[0],
        { ...assumptions[0], targetViewId: 'right' },
      ]).issues.map((issue) => issue.code),
    ).toContain('DUPLICATE_REFERENCE_VIEW_ID');
    expect(
      scoreReferenceAgreementV1({
        runMode: 'generation',
        assumptions,
        samples: [],
        structuralReadiness: 'block',
      }),
    ).toMatchObject({ scheduled: false, disposition: 'observe', repairEligible: false });
  });
});
