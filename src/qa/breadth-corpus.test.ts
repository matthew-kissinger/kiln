import { describe, expect, test } from 'bun:test';

import {
  renderAssetScopePrompt,
  renderModularKitPrompt,
  renderVfxBreadthPrompt,
} from '../breadth-prompt';
import { createAssetIntentV1, type AssetIntentV1 } from '../contracts/asset';
import type {
  AssetScopeIntentV1,
  AssetScopeObservationV1,
  ModularJoinObservationV1,
  ModularKitContractV1,
  VfxIntentV1,
} from '../contracts/breadth';
import {
  W7_BREADTH_QA_RULES,
  evaluateAssetScopeQa,
  evaluateModularJoinQa,
  evaluateVfxAdvisoryQa,
  evaluateVfxExactQa,
  measureVfxRuntimeCostV1,
} from './breadth';
import { VFX_BENCH_RUBRIC_V1, VFX_BREADTH_CORPUS_V1 } from './breadth-corpus';
import { QaRegistry } from './registry';
import type { QaContext } from './types';

const context = (
  category: AssetIntentV1['category'],
  extras: {
    vfx?: VfxIntentV1;
    scope?: AssetScopeIntentV1;
    scopeObservation?: AssetScopeObservationV1;
    modularKit?: ModularKitContractV1;
    modularJoin?: ModularJoinObservationV1;
  },
  vfxArtifact?: unknown,
): QaContext => ({
  intent: createAssetIntentV1({
    category,
    subtype: category === 'vfx' ? extras.vfx?.subtype : undefined,
    ...(extras.vfx ? { vfx: extras.vfx } : {}),
    ...(extras.scope ? { scope: extras.scope } : {}),
    ...(extras.modularKit ? { scope: { scope: 'modularSet' as const, explicit: true } } : {}),
    material: {
      mode: extras.vfx?.portability === 'sidecar' ? 'runtimeTsl' : 'pbrRecipe',
      ...(extras.vfx ? { transparency: extras.vfx.transparency } : {}),
    },
  }),
  derivedEvidence: {
    source: 'engine-scene-analysis',
    ...(vfxArtifact !== undefined ? { vfxArtifact } : {}),
    ...(extras.scopeObservation ? { assetScope: extras.scopeObservation } : {}),
    ...(extras.modularKit ? { modularKit: extras.modularKit } : {}),
    ...(extras.modularJoin ? { modularJoin: extras.modularJoin } : {}),
  },
});

const modularKit = (): ModularKitContractV1 => ({
  schemaVersion: 1,
  units: 'm',
  grid: [1, 1, 1],
  sockets: [
    {
      id: 'a.east',
      pieceId: 'a',
      type: 'wall.east',
      compatibleTypes: ['wall.west'],
      frame: { translation: [1, 0, 0], rotation: [0, 0, 0, 1] },
      allowedRotationsDegrees: [0, 90, 180, 270],
    },
    {
      id: 'b.west',
      pieceId: 'b',
      type: 'wall.west',
      compatibleTypes: ['wall.east'],
      frame: { translation: [-1, 0, 0], rotation: [0, 1, 0, 0] },
      allowedRotationsDegrees: [0, 90, 180, 270],
    },
  ],
});

const joined = (overlap = 0): ModularJoinObservationV1 => ({
  aSocketId: 'a.east',
  bSocketId: 'b.west',
  aWorldPosition: [1, 0, 0],
  bWorldPosition: [1 - overlap, 0, 0],
  aWorldNormal: [1, 0, 0],
  bWorldNormal: [-1, 0, 0],
  relativeRotationDegrees: 0,
});

describe('W7 VFX/modular/scope/reference corpus', () => {
  test('VFX-002/003/004 exact fixtures emit only their frozen expected codes', () => {
    for (const fixture of VFX_BREADTH_CORPUS_V1) {
      const findings = evaluateVfxExactQa(
        context('vfx', { vfx: fixture.intent }, fixture.evidence),
      );
      expect(
        findings.map((finding) => finding.code),
        fixture.id,
      ).toEqual(fixture.expectedExactCodes);
      for (const finding of findings) expect(finding.disposition).toBe('block');
    }
  });

  test('VFX-005 reports transparent area/layers/overdraw/texture/sidecar separately', () => {
    const fixture = VFX_BREADTH_CORPUS_V1.find((value) => value.id === 'vfx.tsl-sidecar.valid')!;
    const cost = measureVfxRuntimeCostV1(fixture.evidence);
    expect(cost).toEqual({
      schemaVersion: 1,
      blendedScreenAreaRatio: 0.24,
      transparentLayerCount: 2,
      overdrawProxy: 0.48,
      textureMemoryBytes: 1_048_576,
      shaderSidecarRequired: true,
    });
    expect('instanceabilityGrade' in cost).toBe(false);
    const findings = evaluateVfxAdvisoryQa(
      context('vfx', { vfx: fixture.intent }, fixture.evidence),
    );
    expect(findings.map((finding) => finding.code)).toContain('VFX_RUNTIME_COST_REPORT');
    expect(findings.every((finding) => finding.disposition === 'observe')).toBe(true);
  });

  test('VFX-006 corpus covers every subtype and freezes the Studio rubric identities', () => {
    expect(new Set(VFX_BREADTH_CORPUS_V1.map((fixture) => fixture.intent.subtype))).toEqual(
      new Set([
        'billboard',
        'beam',
        'trail',
        'aura',
        'portal',
        'impact',
        'volume-like',
        'runtimeShader',
      ]),
    );
    expect(VFX_BENCH_RUBRIC_V1.criteria).toEqual([
      'vfx.intent-readability',
      'vfx.transparency',
      'vfx.facing',
      'vfx.temporal-policy',
      'vfx.runtime-portability',
    ]);
    expect(VFX_BENCH_RUBRIC_V1.deterministicEvidenceIsDelegatedDecision).toBe(false);
  });

  test('VFX prompt is resolved to one subtype and preserves portable/sidecar truth', () => {
    const beam = VFX_BREADTH_CORPUS_V1.find((value) => value.id === 'vfx.beam.valid')!.intent;
    const portal = VFX_BREADTH_CORPUS_V1.find(
      (value) => value.id === 'vfx.tsl-sidecar.valid',
    )!.intent;
    const beamPrompt = renderVfxBreadthPrompt(beam);
    expect(beamPrompt).toContain('subtype=beam');
    expect(beamPrompt).toContain('direction=+X');
    expect(beamPrompt).toContain('standard glTF PBR only');
    expect(beamPrompt).not.toContain('runtimeShader');
    const sidecarPrompt = renderVfxBreadthPrompt(portal);
    expect(sidecarPrompt).toContain('nonportable TSL sidecar');
    expect(sidecarPrompt).toContain('kilnTimeSeconds');
  });

  test('MOD-001 blocks only an explicit modular contract failure and prompt names the exact sockets', () => {
    const kit = modularKit();
    expect(
      evaluateModularJoinQa(context('environment', { modularKit: kit, modularJoin: joined() })),
    ).toEqual([]);
    const findings = evaluateModularJoinQa(
      context('environment', { modularKit: kit, modularJoin: joined(0.02) }),
    );
    expect(findings.map((finding) => finding.code)).toEqual(
      expect.arrayContaining(['MOD_GRID_MISALIGNED', 'MOD_JOIN_OVERLAP']),
    );
    expect(findings.every((finding) => finding.disposition === 'block')).toBe(true);
    const prompt = renderModularKitPrompt(kit);
    expect(prompt).toContain('a/a.east');
    expect(prompt).toContain('b/b.west');
    expect(prompt).toContain('zero seam and zero overlap');
  });

  test('SCOPE-001 remains observe-only even for an explicit single-vs-cluster violation', () => {
    const scope: AssetScopeIntentV1 = { schemaVersion: 1, scope: 'single', explicit: true };
    const findings = evaluateAssetScopeQa(
      context('prop', {
        scope,
        scopeObservation: {
          topLevelAssetRoots: 3,
          reusableMemberCount: 2,
          sceneDressingRoles: ['terrain.disk'],
        },
      }),
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      code: 'ASSET_SCOPE_EXPLICIT_SINGLE_CLUSTER',
      disposition: 'observe',
      dimension: 'promptAlignment',
    });
    expect(renderAssetScopePrompt(scope)).toContain('one reusable asset root');
  });

  test('REF-001 has no synchronous deterministic registry rule or automatic repair surface', () => {
    expect(W7_BREADTH_QA_RULES.map((rule) => rule.id)).toEqual([
      'VFX_EXACT_PROFILE',
      'VFX_ADVISORY_PROFILE',
      'MODULAR_JOIN_PROFILE',
      'ASSET_SCOPE_PROFILE',
    ]);
    expect(W7_BREADTH_QA_RULES.some((rule) => /REF|REFERENCE/.test(rule.id))).toBe(false);
    const registry = new QaRegistry(W7_BREADTH_QA_RULES);
    const fixture = VFX_BREADTH_CORPUS_V1.find(
      (value) => value.id === 'vfx.billboard-smoke.valid',
    )!;
    const result = registry.run(context('vfx', { vfx: fixture.intent }, fixture.evidence));
    expect(result.decisions.map((decision) => [decision.ruleId, decision.mode])).toEqual([
      ['VFX_EXACT_PROFILE', 'enforce'],
      ['VFX_ADVISORY_PROFILE', 'observe'],
      ['MODULAR_JOIN_PROFILE', 'enforce'],
      ['ASSET_SCOPE_PROFILE', 'observe'],
    ]);
  });

  test('missing trusted VFX contract is a request-normalization blocker, not model repair evidence', () => {
    const valid = context('vfx', {});
    const findings = evaluateVfxExactQa({
      ...valid,
      intent: { ...valid.intent, vfx: undefined } as unknown as AssetIntentV1,
    });
    expect(findings[0]).toMatchObject({ code: 'VFX_INTENT_INVALID', disposition: 'block' });
    expect(findings[0]?.repairText).toContain('cannot repair trusted intent');
  });
});
