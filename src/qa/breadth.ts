import {
  assessAssetScopeV1,
  evaluateModularJoinV1,
  validateModularKitContractV1,
  validateVfxIntentV1,
  type AssetScopeObservationV1,
  type ModularJoinObservationV1,
  type VfxAnimationIntentV1,
  type VfxFacingIntentV1,
  type VfxIntentV1,
  type VfxRuntimeSidecarV1,
  type VfxTransparencyMode,
} from '../contracts/breadth';
import { KILN_ENGINE_QA_OWNER, conformancePromotionAuthorization, type QaRule } from './registry';
import type { QaContext, QaFinding } from './types';

export interface VfxMaterialEvidenceV1 {
  id: string;
  surfaceRole: 'card' | 'beam' | 'trail' | 'volume' | 'core';
  /** Engine-analyzed role scope. False identifies support/emitter geometry. */
  effectSurface?: boolean;
  alphaMode: VfxTransparencyMode;
  alphaData: boolean;
  doubleSided: boolean;
  alphaCutoff?: number;
  /** Diagnostic-view estimate, not an instanceability grade. */
  screenAreaRatio: number;
  transparentLayers: number;
  textureMemoryBytes: number;
}

export interface VfxArtifactEvidenceV1 {
  schemaVersion: 1;
  facing: VfxFacingIntentV1;
  animation: VfxAnimationIntentV1 & { endpointMatches: boolean };
  sidecar?: VfxRuntimeSidecarV1;
  materials: VfxMaterialEvidenceV1[];
  clips: Array<{ name: string; durationSeconds: number }>;
  uniforms: string[];
}

export interface VfxRuntimeCostV1 {
  schemaVersion: 1;
  blendedScreenAreaRatio: number;
  transparentLayerCount: number;
  overdrawProxy: number;
  textureMemoryBytes: number;
  shaderSidecarRequired: boolean;
}

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stable = (value: number): number => Math.round(value * 1_000_000) / 1_000_000;

const finiteTuple = (value: unknown, length: number): value is number[] =>
  Array.isArray(value) &&
  value.length === length &&
  value.every((component) => typeof component === 'number' && Number.isFinite(component));

function validModularJoinObservation(value: unknown): value is ModularJoinObservationV1 {
  if (!record(value)) return false;
  return (
    typeof value.aSocketId === 'string' &&
    value.aSocketId.length > 0 &&
    typeof value.bSocketId === 'string' &&
    value.bSocketId.length > 0 &&
    finiteTuple(value.aWorldPosition, 3) &&
    finiteTuple(value.bWorldPosition, 3) &&
    finiteTuple(value.aWorldNormal, 3) &&
    finiteTuple(value.bWorldNormal, 3) &&
    typeof value.relativeRotationDegrees === 'number' &&
    Number.isFinite(value.relativeRotationDegrees) &&
    (value.toleranceMeters === undefined ||
      (typeof value.toleranceMeters === 'number' &&
        Number.isFinite(value.toleranceMeters) &&
        value.toleranceMeters >= 0)) &&
    (value.normalToleranceDegrees === undefined ||
      (typeof value.normalToleranceDegrees === 'number' &&
        Number.isFinite(value.normalToleranceDegrees) &&
        value.normalToleranceDegrees >= 0))
  );
}

function validVfxArtifactEvidence(value: unknown): value is VfxArtifactEvidenceV1 {
  if (!record(value) || value.schemaVersion !== 1) return false;
  if (!record(value.facing) || !record(value.animation)) return false;
  if (!Array.isArray(value.materials)) return false;
  if (!Array.isArray(value.clips) || !Array.isArray(value.uniforms)) return false;
  if (!value.uniforms.every((name) => typeof name === 'string' && name.length > 0)) return false;
  if (
    !value.clips.every(
      (clip) =>
        record(clip) &&
        typeof clip.name === 'string' &&
        clip.name.length > 0 &&
        typeof clip.durationSeconds === 'number' &&
        Number.isFinite(clip.durationSeconds) &&
        clip.durationSeconds >= 0,
    )
  ) {
    return false;
  }
  return value.materials.every(
    (material) =>
      record(material) &&
      typeof material.id === 'string' &&
      material.id.length > 0 &&
      ['card', 'beam', 'trail', 'volume', 'core'].includes(String(material.surfaceRole)) &&
      ['opaque', 'mask', 'blend'].includes(String(material.alphaMode)) &&
      (material.effectSurface === undefined || typeof material.effectSurface === 'boolean') &&
      typeof material.alphaData === 'boolean' &&
      typeof material.doubleSided === 'boolean' &&
      typeof material.screenAreaRatio === 'number' &&
      Number.isFinite(material.screenAreaRatio) &&
      material.screenAreaRatio >= 0 &&
      typeof material.transparentLayers === 'number' &&
      Number.isInteger(material.transparentLayers) &&
      material.transparentLayers >= 0 &&
      typeof material.textureMemoryBytes === 'number' &&
      Number.isInteger(material.textureMemoryBytes) &&
      material.textureMemoryBytes >= 0,
  );
}

function artifactEvidence(context: QaContext): VfxArtifactEvidenceV1 | undefined {
  if (context.derivedEvidence?.source !== 'engine-scene-analysis') return undefined;
  const candidate = context.derivedEvidence.vfxArtifact;
  return validVfxArtifactEvidence(candidate) ? candidate : undefined;
}

function finding(
  context: QaContext,
  value: Omit<QaFinding, 'profile'>,
  profile = 'vfx.w7',
): QaFinding {
  return { ...value, profile: context.intent.qaProfile || profile };
}

export function measureVfxRuntimeCostV1(evidence: VfxArtifactEvidenceV1): VfxRuntimeCostV1 {
  let blendedScreenAreaRatio = 0;
  let transparentLayerCount = 0;
  let overdrawProxy = 0;
  let textureMemoryBytes = 0;
  for (const material of evidence.materials) {
    textureMemoryBytes += material.textureMemoryBytes;
    if (material.alphaMode !== 'blend') continue;
    blendedScreenAreaRatio += material.screenAreaRatio;
    transparentLayerCount += material.transparentLayers;
    overdrawProxy += material.screenAreaRatio * Math.max(1, material.transparentLayers);
  }
  return {
    schemaVersion: 1,
    blendedScreenAreaRatio: stable(blendedScreenAreaRatio),
    transparentLayerCount,
    overdrawProxy: stable(overdrawProxy),
    textureMemoryBytes,
    shaderSidecarRequired: evidence.sidecar !== undefined,
  };
}

function exactVfxIntent(
  context: QaContext,
): { intent: VfxIntentV1; evidence: VfxArtifactEvidenceV1 } | { findings: QaFinding[] } {
  const candidate = context.intent.vfx;
  const validated = validateVfxIntentV1(candidate);
  if (!validated.valid || !validated.value) {
    return {
      findings: [
        finding(context, {
          code: 'VFX_INTENT_INVALID',
          disposition: 'block',
          dimension: 'categoryReadiness',
          message: `Trusted VFX intent is missing or invalid: ${validated.issues
            .map((issue) => `${issue.path || '<root>'}:${issue.code}`)
            .join(', ')}`,
          measurement: {
            name: 'vfxIntentIssueCount',
            actual: validated.issues.length,
            expected: 0,
          },
          repairText:
            'Return to request normalization; model-authored source cannot repair trusted intent.',
        }),
      ],
    };
  }
  const evidence = artifactEvidence(context);
  if (!evidence) {
    return {
      findings: [
        finding(context, {
          code: 'VFX_RUNTIME_CONTRACT_MISSING',
          disposition: 'block',
          dimension: 'categoryReadiness',
          message:
            'VFX output is missing its versioned facing/material/animation runtime evidence.',
          measurement: { name: 'vfxEvidencePresent', actual: false, expected: true },
          repairText:
            'Return a renderable Three.js scene so the engine can analyze actual materials, facing behavior, clips/uniforms, and sidecar availability.',
        }),
      ],
    };
  }
  return { intent: validated.value, evidence };
}

/** H/H* VFX contract checks. Only explicit trusted requirements can block. */
export function evaluateVfxExactQa(context: QaContext): readonly QaFinding[] {
  if (context.intent.category !== 'vfx') return [];
  const resolved = exactVfxIntent(context);
  if ('findings' in resolved) return resolved.findings;
  const { intent, evidence } = resolved;
  const findings: QaFinding[] = [];
  const effectMaterials = evidence.materials.filter((material) => material.effectSurface !== false);
  if (effectMaterials.length === 0) {
    findings.push(
      finding(context, {
        code: 'VFX_EFFECT_SURFACE_MISSING',
        disposition: 'block',
        dimension: 'exportIntegrity',
        message: 'VFX output has no explicitly analyzed effect-surface material.',
        measurement: { name: 'effectMaterialCount', actual: 0, expected: '>=1' },
        repairText:
          'Stamp effect-rendering nodes with vfx.effect.surface.* and keep opaque support geometry in vfx.support.* roles.',
      }),
    );
  }
  for (const material of effectMaterials) {
    if (material.alphaMode !== intent.transparency) {
      findings.push(
        finding(context, {
          code: 'VFX_TRANSPARENCY_MODE_MISMATCH',
          disposition: 'block',
          dimension: 'exportIntegrity',
          message: `${material.id} exported ${material.alphaMode} but trusted VFX intent requires ${intent.transparency}.`,
          affected: { material: material.id },
          measurement: {
            name: 'alphaMode',
            actual: material.alphaMode,
            expected: intent.transparency,
          },
          repairText: `Set ${material.id} to the declared ${intent.transparency} alpha mode without changing unrelated materials.`,
        }),
      );
    }
    if (intent.transparency !== 'opaque' && !material.alphaData) {
      findings.push(
        finding(context, {
          code: 'VFX_ALPHA_DATA_MISSING',
          disposition: 'block',
          dimension: 'exportIntegrity',
          message: `${material.id} declares ${intent.transparency} but has no alpha-bearing factor or texture data.`,
          affected: { material: material.id },
          measurement: { name: 'alphaData', actual: false, expected: true },
          repairText: `Add alpha-bearing data to ${material.id}; do not leave an opaque effect-card rectangle.`,
        }),
      );
    }
    if (material.doubleSided !== intent.doubleSided) {
      findings.push(
        finding(context, {
          code: 'VFX_SIDEDNESS_MISMATCH',
          disposition: 'block',
          dimension: 'exportIntegrity',
          message: `${material.id} sidedness does not match trusted VFX intent.`,
          affected: { material: material.id },
          measurement: {
            name: 'doubleSided',
            actual: material.doubleSided,
            expected: intent.doubleSided,
          },
          repairText: `Set ${material.id} doubleSided=${intent.doubleSided}.`,
        }),
      );
    }
    if (
      intent.transparency === 'mask' &&
      (material.alphaCutoff === undefined ||
        !Number.isFinite(material.alphaCutoff) ||
        material.alphaCutoff <= 0 ||
        material.alphaCutoff > 1)
    ) {
      findings.push(
        finding(context, {
          code: 'VFX_ALPHA_CUTOFF_INVALID',
          disposition: 'block',
          dimension: 'exportIntegrity',
          message: `${material.id} uses MASK without a finite cutoff in (0, 1].`,
          affected: { material: material.id },
          measurement: {
            name: 'alphaCutoff',
            actual: material.alphaCutoff ?? null,
            expected: '0 < cutoff <= 1',
          },
          repairText: `Set a valid alpha cutoff on ${material.id}.`,
        }),
      );
    }
  }

  const facingFields = ['mode', 'normalAxis', 'directionAxis'] as const;
  for (const field of facingFields) {
    if (intent.facing[field] === evidence.facing[field]) continue;
    if (intent.facing.source !== 'explicit') continue;
    findings.push(
      finding(context, {
        code: 'VFX_FACING_CONTRACT_MISMATCH',
        disposition: 'block',
        dimension: 'categoryReadiness',
        message: `Explicit VFX facing ${field} does not match the emitted runtime contract.`,
        measurement: {
          name: `facing.${field}`,
          actual: evidence.facing[field] ?? null,
          expected: intent.facing[field] ?? null,
        },
        repairText: `Stamp and implement the requested ${field}; preserve the canonical Kiln frame.`,
      }),
    );
  }

  const requestedAnimation = intent.animation;
  const actualAnimation = evidence.animation;
  for (const field of ['playback', 'endpointBehavior', 'driver'] as const) {
    if (requestedAnimation[field] === actualAnimation[field]) continue;
    findings.push(
      finding(context, {
        code: 'VFX_ANIMATION_POLICY_MISMATCH',
        disposition: 'block',
        dimension: 'categoryReadiness',
        message: `VFX animation ${field} does not match trusted intent.`,
        measurement: {
          name: `animation.${field}`,
          actual: actualAnimation[field],
          expected: requestedAnimation[field],
        },
        repairText: `Implement the declared ${field} without changing the effect subtype.`,
      }),
    );
  }
  if (Math.abs(requestedAnimation.durationSeconds - actualAnimation.durationSeconds) > 1e-6) {
    findings.push(
      finding(context, {
        code: 'VFX_ANIMATION_DURATION_MISMATCH',
        disposition: 'block',
        dimension: 'categoryReadiness',
        message: 'VFX animation duration does not match trusted intent.',
        measurement: {
          name: 'animation.durationSeconds',
          actual: actualAnimation.durationSeconds,
          expected: requestedAnimation.durationSeconds,
          threshold: 0.000001,
          unit: 's',
        },
        repairText: 'Use the declared duration and resample endpoint keys deterministically.',
      }),
    );
  }
  if (requestedAnimation.playback === 'loop' && !actualAnimation.endpointMatches) {
    findings.push(
      finding(context, {
        code: 'VFX_LOOP_ENDPOINT_MISMATCH',
        disposition: 'block',
        dimension: 'categoryReadiness',
        message: 'Looping VFX does not return to its start state at the declared endpoint.',
        measurement: { name: 'endpointMatches', actual: false, expected: true },
        repairText: 'Make the final loop sample equal the initial sample for every driven channel.',
      }),
    );
  }
  if (
    requestedAnimation.driver === 'clip' &&
    !evidence.clips.some(
      (clip) =>
        clip.name === requestedAnimation.clipName &&
        Math.abs(clip.durationSeconds - requestedAnimation.durationSeconds) <= 1e-6,
    )
  ) {
    findings.push(
      finding(context, {
        code: 'VFX_REQUIRED_CLIP_MISSING',
        disposition: 'block',
        dimension: 'categoryReadiness',
        message: 'The declared VFX clip name/duration is absent from the artifact evidence.',
        affected: { clip: requestedAnimation.clipName ?? '<missing>' },
        repairText: `Emit clip ${requestedAnimation.clipName ?? '<declared clip>'} with the requested duration.`,
      }),
    );
  }
  if (
    requestedAnimation.driver === 'timeUniform' &&
    !evidence.uniforms.includes(requestedAnimation.timeUniformName ?? '')
  ) {
    findings.push(
      finding(context, {
        code: 'VFX_REQUIRED_TIME_UNIFORM_MISSING',
        disposition: 'block',
        dimension: 'categoryReadiness',
        message: 'The declared runtime time uniform is absent from the sidecar evidence.',
        measurement: {
          name: 'timeUniformName',
          actual: evidence.uniforms.join(','),
          expected: requestedAnimation.timeUniformName ?? null,
        },
        repairText: `Expose ${requestedAnimation.timeUniformName ?? 'the declared uniform'} in the runtime sidecar.`,
      }),
    );
  }
  if (intent.portability === 'portable' && evidence.sidecar !== undefined) {
    findings.push(
      finding(context, {
        code: 'VFX_UNDECLARED_SIDECAR',
        disposition: 'block',
        dimension: 'exportIntegrity',
        message: 'Portable VFX unexpectedly requires a runtime shader sidecar.',
        repairText:
          'Bake the portable appearance into standard glTF materials or update trusted intent before spend.',
      }),
    );
  }
  if (
    intent.portability === 'sidecar' &&
    (evidence.sidecar?.id !== intent.sidecar?.id ||
      evidence.sidecar?.version !== intent.sidecar?.version)
  ) {
    findings.push(
      finding(context, {
        code: 'VFX_SIDECAR_IDENTITY_MISMATCH',
        disposition: 'block',
        dimension: 'exportIntegrity',
        message: 'Runtime VFX sidecar identity/version does not match trusted intent.',
        measurement: {
          name: 'sidecarIdentity',
          actual: evidence.sidecar ? `${evidence.sidecar.id}@${evidence.sidecar.version}` : null,
          expected: intent.sidecar ? `${intent.sidecar.id}@${intent.sidecar.version}` : null,
        },
        repairText: 'Attach the exact declared sidecar identity and keep the GLB fallback honest.',
      }),
    );
  }
  return findings;
}

/** S-class VFX evidence. It reports cost and inferred-facing drift without blocking. */
export function evaluateVfxAdvisoryQa(context: QaContext): readonly QaFinding[] {
  if (context.intent.category !== 'vfx') return [];
  const intent = context.intent.vfx;
  const validated = validateVfxIntentV1(intent);
  const evidence = artifactEvidence(context);
  if (!validated.valid || !validated.value || !evidence) return [];
  const findings: QaFinding[] = [];
  if (validated.value.facing.source === 'inferred') {
    const mismatch = (['mode', 'normalAxis', 'directionAxis'] as const).some(
      (field) => validated.value?.facing[field] !== evidence.facing[field],
    );
    if (mismatch) {
      findings.push(
        finding(context, {
          code: 'VFX_FACING_INFERRED_DRIFT',
          disposition: 'observe',
          dimension: 'categoryReadiness',
          message: 'Inferred VFX facing differs from emitted metadata; review the named views.',
          viewHints: ['front', 'right', 'three-quarter'],
        }),
      );
    }
  }
  const cost = measureVfxRuntimeCostV1(evidence);
  findings.push(
    finding(context, {
      code: 'VFX_RUNTIME_COST_REPORT',
      disposition: 'observe',
      dimension: 'runtimeCost',
      message: 'VFX transparency/runtime cost is reported separately from instanceability.',
      measurement: {
        name: 'vfxRuntimeCost',
        actual: `blendArea=${cost.blendedScreenAreaRatio};layers=${cost.transparentLayerCount};overdraw=${cost.overdrawProxy};textureBytes=${cost.textureMemoryBytes};sidecar=${cost.shaderSidecarRequired}`,
      },
      viewHints: ['front', 'right', 'three-quarter'],
    }),
  );
  if (cost.overdrawProxy > 2 || cost.textureMemoryBytes > 32 * 1024 * 1024) {
    findings.push(
      finding(context, {
        code: 'VFX_RUNTIME_PRESSURE',
        disposition: 'observe',
        dimension: 'runtimeCost',
        message: 'VFX exceeds the observe-mode overdraw or texture-memory review threshold.',
        measurement: {
          name: 'overdrawProxy',
          actual: cost.overdrawProxy,
          threshold: 2,
          unit: 'screen-layers',
        },
      }),
    );
  }
  return findings;
}

/** MOD-001 applies only when trusted modular-kit data and a join observation are present. */
export function evaluateModularJoinQa(context: QaContext): readonly QaFinding[] {
  if (context.intent.scope.scope !== 'modularSet' || !context.intent.scope.explicit) return [];
  const modularKit = context.derivedEvidence?.modularKit;
  const modularJoin = context.derivedEvidence?.modularJoin;
  const validation = validateModularKitContractV1(modularKit);
  if (!validation.valid || !validation.value || !validModularJoinObservation(modularJoin)) {
    return [
      finding(
        context,
        {
          code: 'MODULAR_CONTRACT_INVALID',
          disposition: 'block',
          dimension: 'categoryReadiness',
          message: `Explicit modular-set intent requires a valid grid/units/socket contract and join observation: ${validation.issues
            .map((issue) => issue.code)
            .join(', ')}`,
          repairText:
            'Emit the requested modular socket metadata; do not infer a noun-specific primitive.',
        },
        'modular.w7',
      ),
    ];
  }
  const result = evaluateModularJoinV1(validation.value, modularJoin);
  if (result.pass) return [];
  return result.codes.map((code) =>
    finding(
      context,
      {
        code,
        disposition: 'block',
        dimension: 'categoryReadiness',
        message: `Explicit modular join failed ${code}: seam=${result.seamMeters} m, overlap=${result.overlapMeters} m, lateral=${result.lateralOffsetMeters} m.`,
        measurement: {
          name: 'modularJoinError',
          actual: Math.max(result.seamMeters, result.overlapMeters, result.lateralOffsetMeters),
          expected: 0,
          threshold: result.toleranceMeters,
          unit: 'm',
        },
        repairText:
          'Snap the named compatible sockets on the declared meter grid using an allowed rotation.',
      },
      'modular.w7',
    ),
  );
}

/** SCOPE-001 remains advisory under the owner-approved S-rule policy. */
export function evaluateAssetScopeQa(context: QaContext): readonly QaFinding[] {
  const scope = context.intent.scope;
  const scopeObservation = context.derivedEvidence?.assetScope;
  if (
    context.derivedEvidence?.source !== 'engine-scene-analysis' ||
    !record(scopeObservation) ||
    typeof scopeObservation.topLevelAssetRoots !== 'number' ||
    typeof scopeObservation.reusableMemberCount !== 'number' ||
    !Array.isArray(scopeObservation.sceneDressingRoles)
  ) {
    return [];
  }
  const result = assessAssetScopeV1(scope, scopeObservation as unknown as AssetScopeObservationV1);
  if (result.status === 'pass' || !result.code) return [];
  return [
    finding(
      context,
      {
        code: result.code,
        disposition: 'observe',
        dimension: 'promptAlignment',
        message: `Requested ${result.requested} scope produced ${result.observed} evidence: ${result.evidence.join('; ')}.`,
        measurement: {
          name: 'explicitSingleViolation',
          actual: result.explicitSingleViolation,
          expected: false,
        },
        viewHints: ['top', 'three-quarter'],
      },
      'scope.w7',
    ),
  ];
}

export const VFX_EXACT_QA_RULE: QaRule = {
  id: 'VFX_EXACT_PROFILE',
  profile: 'vfx.w7.exact',
  scope: { kind: 'category', category: 'vfx' },
  ruleClass: 'exact',
  owner: KILN_ENGINE_QA_OWNER,
  promotion: conformancePromotionAuthorization(
    'vfx-w7-conformance-v1',
    'src/qa/breadth-corpus.test.ts',
    '58837182f467de6757194d54c8b42682d21d3d9355daecab694888cd742d2405',
  ),
  defaultMode: 'enforce',
  evaluate: evaluateVfxExactQa,
};

export const VFX_ADVISORY_QA_RULE: QaRule = {
  id: 'VFX_ADVISORY_PROFILE',
  profile: 'vfx.w7.advisory',
  scope: { kind: 'category', category: 'vfx' },
  ruleClass: 'heuristic',
  owner: KILN_ENGINE_QA_OWNER,
  defaultMode: 'observe',
  evaluate: evaluateVfxAdvisoryQa,
};

export const MODULAR_JOIN_QA_RULE: QaRule = {
  id: 'MODULAR_JOIN_PROFILE',
  profile: 'modular.w7.exact',
  scope: { kind: 'universal' },
  ruleClass: 'exact',
  owner: KILN_ENGINE_QA_OWNER,
  promotion: conformancePromotionAuthorization(
    'modular-w7-conformance-v1',
    'src/qa/breadth-corpus.test.ts',
    '58837182f467de6757194d54c8b42682d21d3d9355daecab694888cd742d2405',
  ),
  defaultMode: 'enforce',
  evaluate: evaluateModularJoinQa,
};

export const ASSET_SCOPE_QA_RULE: QaRule = {
  id: 'ASSET_SCOPE_PROFILE',
  profile: 'scope.w7.advisory',
  scope: { kind: 'universal' },
  ruleClass: 'heuristic',
  owner: KILN_ENGINE_QA_OWNER,
  defaultMode: 'observe',
  evaluate: evaluateAssetScopeQa,
};

/** REF-001 is intentionally absent: reference QA is sampled/Bench/flagged only. */
export const W7_BREADTH_QA_RULES: readonly QaRule[] = [
  VFX_EXACT_QA_RULE,
  VFX_ADVISORY_QA_RULE,
  MODULAR_JOIN_QA_RULE,
  ASSET_SCOPE_QA_RULE,
] as const;
