import type { AssetIntentV1 } from '../contracts';
import type { InstanceabilityReport } from '../metrics';
import { MATERIAL_QA_RULE } from './material';
import { ARCHITECTURE_QA_RULES } from './architecture';
import { CHARACTER_QA_RULE } from './character';
import { CHARACTER_ADVISORY_QA_RULE } from './character-advisory';
import { VEHICLE_QA_RULES } from './vehicle';
import { VEGETATION_QA_RULES } from './vegetation';
import { PROP_QA_RULES } from './prop';
import { ENVIRONMENT_QA_RULES } from './environment';
import { W7_BREADTH_QA_RULES } from './breadth';
import { withDerivedW7BreadthEvidence } from './breadth-evidence';
import { QaRegistry, type QaRulePolicy } from './registry';
import {
  createAssetQaReportV1,
  type AssetQaReportV1,
  type QaContext,
  type QaFinding,
} from './types';
import { UNIVERSAL_QA_RULES } from './universal';
import type { KhronosGltfValidationReport } from './gltf';
import type { MaterialBudgetWarningV1, MaterialMetricsV1 } from '../material-metrics';

export const DETERMINISTIC_QA_REGISTRY = new QaRegistry([
  ...UNIVERSAL_QA_RULES,
  MATERIAL_QA_RULE,
  ...ARCHITECTURE_QA_RULES,
  CHARACTER_QA_RULE,
  CHARACTER_ADVISORY_QA_RULE,
  ...VEHICLE_QA_RULES,
  ...VEGETATION_QA_RULES,
  ...PROP_QA_RULES,
  ...ENVIRONMENT_QA_RULES,
  ...W7_BREADTH_QA_RULES,
]);

export function runDeterministicSceneQa(
  context: QaContext,
  policy: QaRulePolicy = {},
): AssetQaReportV1 {
  const result = DETERMINISTIC_QA_REGISTRY.run(withDerivedW7BreadthEvidence(context), policy);
  return createAssetQaReportV1(context.intent, {
    findings: result.findings,
    evaluatedDimensions: ['exportIntegrity', 'categoryReadiness'],
  });
}

export function gltfReportFindings(
  report: KhronosGltfValidationReport,
  profile: string,
): QaFinding[] {
  return report.issues.messages
    .filter((issue) => issue.severity === 0 || issue.severity === 1)
    .map((issue) => ({
      code: `GLTF_${issue.code}`.replace(/[^A-Z0-9_]/g, '_'),
      disposition: issue.severity === 0 ? ('block' as const) : ('warn' as const),
      dimension: 'exportIntegrity' as const,
      profile,
      message: issue.message,
      ...(issue.pointer ? { affected: { nodePath: issue.pointer } } : {}),
    }));
}

export function appendFinalGltfQa(
  intent: AssetIntentV1,
  sceneReport: AssetQaReportV1,
  gltfReport: KhronosGltfValidationReport,
): AssetQaReportV1 {
  const findings = Object.values(sceneReport.dimensions).flatMap((dimension) => dimension.findings);
  findings.push(...gltfReportFindings(gltfReport, intent.qaProfile));
  return createAssetQaReportV1(intent, {
    findings,
    evaluatedDimensions: ['exportIntegrity', 'categoryReadiness'],
    metrics: {
      exportIntegrity: {
        gltfErrors: gltfReport.issues.numErrors,
        gltfWarnings: gltfReport.issues.numWarnings,
      },
    },
  });
}

/**
 * Attach the existing A–F instanceability result only to the runtime-cost
 * dimension. It is deliberately not promoted to a composite quality grade.
 */
export function appendRuntimeCostQa(
  intent: AssetIntentV1,
  report: AssetQaReportV1,
  instanceability?: InstanceabilityReport,
  metricsError?: string,
): AssetQaReportV1 {
  const findings = Object.values(report.dimensions).flatMap((dimension) => dimension.findings);
  if (metricsError) {
    findings.push({
      code: 'RUNTIME_COST_METRICS_FAILED',
      disposition: 'warn',
      dimension: 'runtimeCost',
      profile: intent.qaProfile,
      message: `Runtime-cost metrics could not be computed: ${metricsError}`,
    });
  }
  const evaluatedDimensions = Object.entries(report.dimensions)
    .filter(([, dimension]) => dimension.status !== 'notEvaluated')
    .map(([dimension]) => dimension as keyof AssetQaReportV1['dimensions']);
  evaluatedDimensions.push('runtimeCost');
  const metrics = Object.fromEntries(
    Object.entries(report.dimensions).flatMap(([dimension, result]) =>
      result.metrics ? [[dimension, result.metrics]] : [],
    ),
  ) as Partial<
    Record<keyof AssetQaReportV1['dimensions'], Record<string, number | string | boolean | null>>
  >;
  if (instanceability) {
    metrics.runtimeCost = {
      instanceabilityGrade: instanceability.grade,
      instanceabilitySummary: instanceability.summary,
      uniqueGeometries: instanceability.metrics.uniqueGeometries,
      uniqueMaterials: instanceability.metrics.uniqueMaterials,
      drawCalls: instanceability.metrics.drawCalls,
      textureCount: instanceability.metrics.textureCount,
      transparentMaterials: instanceability.metrics.transparentMaterials,
      triangles: instanceability.metrics.triangles,
      skinned: instanceability.metrics.skinned,
    };
  }

  return createAssetQaReportV1(intent, {
    findings,
    evaluatedDimensions,
    ...(Object.keys(metrics).length > 0 ? { metrics } : {}),
  });
}

/** Attach portable material metrics and advisory budget findings to runtimeCost
 * without collapsing them into the independent instanceability grade. */
export function appendMaterialMetricsQa(
  intent: AssetIntentV1,
  report: AssetQaReportV1,
  materialMetrics: MaterialMetricsV1,
  budgetWarnings: readonly MaterialBudgetWarningV1[] = [],
): AssetQaReportV1 {
  const findings = Object.values(report.dimensions).flatMap((dimension) => dimension.findings);
  findings.push(
    ...budgetWarnings.map(
      (warning): QaFinding => ({
        code: warning.code,
        disposition: 'warn',
        dimension: 'runtimeCost',
        profile: `${warning.profile}.${warning.tier}`,
        message: `${warning.message} ${warning.advice}`,
        measurement: warning.measurement,
      }),
    ),
  );
  const evaluatedDimensions = Object.entries(report.dimensions)
    .filter(([, dimension]) => dimension.status !== 'notEvaluated')
    .map(([dimension]) => dimension as keyof AssetQaReportV1['dimensions']);
  if (!evaluatedDimensions.includes('runtimeCost')) evaluatedDimensions.push('runtimeCost');
  const metrics = Object.fromEntries(
    Object.entries(report.dimensions).flatMap(([dimension, result]) =>
      result.metrics ? [[dimension, result.metrics]] : [],
    ),
  ) as Partial<
    Record<keyof AssetQaReportV1['dimensions'], Record<string, number | string | boolean | null>>
  >;
  metrics.runtimeCost = {
    ...(metrics.runtimeCost ?? {}),
    materialCount: materialMetrics.materialCount,
    opaqueMaterials: materialMetrics.opaqueMaterials,
    maskedMaterials: materialMetrics.maskedMaterials,
    blendedMaterials: materialMetrics.blendedMaterials,
    singleSidedMaterials: materialMetrics.singleSidedMaterials,
    doubleSidedMaterials: materialMetrics.doubleSidedMaterials,
    texturedMaterials: materialMetrics.texturedMaterials,
    materialExtensionCount: materialMetrics.materialExtensionCount,
    materialExtensionsUsed: materialMetrics.materialExtensionsUsed.join(','),
    imageCount: materialMetrics.imageCount,
    maxImageDimension: materialMetrics.maxImageDimension,
    decodedImageBytesRgba8: materialMetrics.decodedImageBytesRgba8,
    estimatedGpuBytesWithMipmaps: materialMetrics.estimatedGpuBytesWithMipmaps,
    blendedSurfaceAreaRatio: materialMetrics.blendedSurfaceAreaRatio,
  };
  return createAssetQaReportV1(intent, { findings, evaluatedDimensions, metrics });
}

export class AssetQaBlockedError extends Error {
  readonly report: AssetQaReportV1;
  readonly stage: 'scene' | 'final-glb';
  readonly gltfValidation?: KhronosGltfValidationReport;

  constructor(
    report: AssetQaReportV1,
    stage: 'scene' | 'final-glb',
    gltfValidation?: KhronosGltfValidationReport,
  ) {
    const blockers = Object.values(report.dimensions)
      .flatMap((dimension) => dimension.findings)
      .filter((finding) => finding.disposition === 'block');
    super(
      `Asset QA blocked at ${stage}: ${blockers.map((finding) => finding.code).join(', ') || 'unknown blocker'}`,
    );
    this.name = 'AssetQaBlockedError';
    this.report = report;
    this.stage = stage;
    this.gltfValidation = gltfValidation;
  }
}
