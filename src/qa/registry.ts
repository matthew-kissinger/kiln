import { createHash } from 'node:crypto';

import type { AssetCapability, AssetCategory } from '../contracts';
import type { QaContext, QaFinding } from './types';

export const QA_RULE_MODES = ['off', 'observe', 'warn', 'enforce'] as const;
export type QaRuleMode = (typeof QA_RULE_MODES)[number];

export const QA_RULE_CLASSES = ['exact', 'heuristic', 'vlm', 'appearance'] as const;
export type QaRuleClass = (typeof QA_RULE_CLASSES)[number];

/** rendererId stamped onto promotion evidence produced before renderer identity existed. */
export const LEGACY_CPU_RASTER_RENDERER_ID = 'cpu-raster:legacy' as const;

/** Cross-repo identities frozen by QA-023/026. The exact matrix must keep Studio in lock-step. */
export const QA_026_CALIBRATION_THRESHOLD_ID =
  'kiln.asset-quality-calibration.thresholds.v1' as const;
export const QA_026_CALIBRATION_THRESHOLD_SHA256 =
  '054ce5088b6b0685bbc0492f8bed0121311cf18920c5697bd6dce66dcb7b2cf9' as const;
export const QA_026_HELD_OUT_SET_VERSION = 'kiln.asset-quality.held-out.v1' as const;
export const QA_026_HELD_OUT_SET_SHA256 =
  '27c17e0e9dbcf22915550b46a94e6afaafe80584f30429e4eb97435163a176bd' as const;
export const QA_026_REVIEW_AUTHORITY_SCHEME = 'ed25519' as const;
export const QA_026_REVIEW_AUTHORITY_KEY_ID = 'kiln-studio.asset-quality-review.prod.v1' as const;
export const QA_026_REVIEW_AUTHORITY_PUBLIC_KEY_SHA256 =
  '08791ade50e377dfb3dc6bc1e852419515fbdaadabcd3880770507a2f192a528' as const;

export const QA_026_WARN_PROMOTION_MINIMUMS = Object.freeze({
  evaluatedCases: 20,
  validExamples: 5,
  defectiveExamples: 5,
  precision: 0.9,
  recall: 0.7,
  vlmMeanConfidence: 0.75,
  styles: 1,
} as const);

/** Owner-approved H* enforcement bar from implementation-plan §8. */
export const QA_026_ENFORCE_PROMOTION_MINIMUMS = Object.freeze({
  evaluatedCases: 60,
  validExamples: 30,
  defectiveExamples: 30,
  precision: 0.9,
  recall: 0.9,
  styles: 3,
  falseBlocks: 0,
} as const);

export interface QaRuleOwner {
  /** Stable human/team identity, never a generic value such as "unknown". */
  id: string;
  authority: 'named' | 'delegated';
}

export interface QaConformancePromotionAuthorization {
  basis: 'conformance';
  authorizedMode: 'warn' | 'enforce';
  fixtureSetId: string;
  /** Repository-relative fixture source whose exact bytes produce evidenceSha256. */
  fixturePath: string;
  evidenceSha256: string;
  frozenAt: string;
  authorizedBy: string;
  /** Renderer that produced the evidence: a `<family>:` prefix plus identity, e.g.
   *  `cpu-raster:0.6.0` or `dawn-vulkan:nvidia-rtx-a4500:...`. Evidence frozen before
   *  renderer identity existed carries {@link LEGACY_CPU_RASTER_RENDERER_ID}. */
  rendererId: string;
}

export interface QaCalibrationPromotionAuthorization {
  basis: 'qa-026-calibration';
  authorizedMode: 'warn' | 'enforce';
  packetId: string;
  evidenceSha256: string;
  frozenAt: string;
  authorizedBy: string;
  /** Renderer that produced the evidence (same format as conformance evidence). */
  rendererId: string;
  report: QaCalibrationReportEvidenceV1;
}

export interface QaCalibrationReportEvidenceV1 {
  schemaVersion: 1;
  reportId: string;
  thresholdId: typeof QA_026_CALIBRATION_THRESHOLD_ID;
  thresholdSha256: typeof QA_026_CALIBRATION_THRESHOLD_SHA256;
  heldOutSetVersion: typeof QA_026_HELD_OUT_SET_VERSION;
  heldOutSetSha256: typeof QA_026_HELD_OUT_SET_SHA256;
  reviewAuthorityScheme: typeof QA_026_REVIEW_AUTHORITY_SCHEME;
  reviewAuthorityKeyId: typeof QA_026_REVIEW_AUTHORITY_KEY_ID;
  reviewAuthorityPublicKeySha256: typeof QA_026_REVIEW_AUTHORITY_PUBLIC_KEY_SHA256;
  ruleCode: string;
  source: 'deterministic-heuristic' | 'vlm';
  generatedAt: string;
  labeledCases: number;
  evaluatedCases: number;
  insufficientEvidenceCases: number;
  humanDisagreementCases: number;
  validExamples: number;
  defectiveExamples: number;
  truePositive: number;
  falsePositive: number;
  trueNegative: number;
  falseNegative: number;
  precision: number;
  recall: number;
  meanConfidence: number | null;
  styles: number;
  falseBlocks: number;
}

function canonicalCalibrationReportEvidence(report: QaCalibrationReportEvidenceV1): string {
  return JSON.stringify({
    schemaVersion: report.schemaVersion,
    reportId: report.reportId,
    thresholdId: report.thresholdId,
    thresholdSha256: report.thresholdSha256,
    heldOutSetVersion: report.heldOutSetVersion,
    heldOutSetSha256: report.heldOutSetSha256,
    reviewAuthorityScheme: report.reviewAuthorityScheme,
    reviewAuthorityKeyId: report.reviewAuthorityKeyId,
    reviewAuthorityPublicKeySha256: report.reviewAuthorityPublicKeySha256,
    ruleCode: report.ruleCode,
    source: report.source,
    generatedAt: report.generatedAt,
    labeledCases: report.labeledCases,
    evaluatedCases: report.evaluatedCases,
    insufficientEvidenceCases: report.insufficientEvidenceCases,
    humanDisagreementCases: report.humanDisagreementCases,
    validExamples: report.validExamples,
    defectiveExamples: report.defectiveExamples,
    truePositive: report.truePositive,
    falsePositive: report.falsePositive,
    trueNegative: report.trueNegative,
    falseNegative: report.falseNegative,
    precision: report.precision,
    recall: report.recall,
    meanConfidence: report.meanConfidence,
    styles: report.styles,
    falseBlocks: report.falseBlocks,
  });
}

export function calibrationReportEvidenceSha256(report: QaCalibrationReportEvidenceV1): string {
  return createHash('sha256').update(canonicalCalibrationReportEvidence(report)).digest('hex');
}

export type QaPromotionAuthorization =
  | QaConformancePromotionAuthorization
  | QaCalibrationPromotionAuthorization;

/** Checked-in owner for engine conformance rules. Delegated rules must name their delegate instead. */
export const KILN_ENGINE_QA_OWNER: QaRuleOwner = Object.freeze({
  id: 'kiln-engine-maintainers',
  authority: 'named',
});

export function conformancePromotionAuthorization(
  fixtureSetId: string,
  fixturePath: string,
  evidenceSha256: string,
  owner: QaRuleOwner = KILN_ENGINE_QA_OWNER,
  frozenAt = '2026-07-09T00:00:00.000Z',
  authorizedMode: 'warn' | 'enforce' = 'enforce',
  /** Default stamps pre-existing frozen evidence honestly: it was produced by the
   *  CPU rasterizer before renderer identity was recorded. New evidence generated
   *  under a known renderer must pass that renderer's real id explicitly. */
  rendererId: string = LEGACY_CPU_RASTER_RENDERER_ID,
): QaConformancePromotionAuthorization {
  return {
    basis: 'conformance',
    authorizedMode,
    fixtureSetId,
    fixturePath,
    evidenceSha256,
    frozenAt,
    authorizedBy: owner.id,
    rendererId,
  };
}

export type QaRuleScope =
  | { kind: 'universal' }
  | { kind: 'category'; category: AssetCategory }
  | { kind: 'subtype'; category: AssetCategory; subtype: string }
  | { kind: 'capability'; capability: AssetCapability };

export interface QaRule {
  /** Stable registry identity. Findings may use more specific stable codes. */
  id: string;
  profile: string;
  scope: QaRuleScope;
  ruleClass: QaRuleClass;
  owner: QaRuleOwner;
  /** Required before warn/enforce promotion; exact and calibrated rules use different evidence. */
  promotion?: QaPromotionAuthorization;
  defaultMode: QaRuleMode;
  evaluate(context: QaContext): readonly QaFinding[];
}

export interface QaRulePolicy {
  defaultMode?: QaRuleMode;
  byProfile?: Readonly<Record<string, QaRuleMode>>;
  byRule?: Readonly<Record<string, QaRuleMode>>;
}

export interface QaRegistryResult {
  findings: QaFinding[];
  executedRules: string[];
  skippedRules: string[];
  decisions: QaRulePolicyDecision[];
}

export interface QaRulePolicyDecision {
  ruleId: string;
  profile: string;
  mode: QaRuleMode;
  ruleClass: QaRuleClass;
  owner: QaRuleOwner;
  promotionBasis?: QaPromotionAuthorization['basis'];
  authorizedMode?: QaPromotionAuthorization['authorizedMode'];
  evidenceId?: string;
}

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const OWNER_ID_PATTERN = /^[a-z0-9][a-z0-9:._/-]*$/;
/** Renderer family prefix + ':' — e.g. "cpu-raster:0.6.0", "dawn-vulkan:nvidia-...". */
const RENDERER_ID_PATTERN = /^[a-z0-9-]+:/;

function evidenceId(promotion: QaPromotionAuthorization): string {
  return promotion.basis === 'conformance' ? promotion.fixtureSetId : promotion.packetId;
}

function assertOwner(owner: QaRuleOwner | undefined, ruleId: string): asserts owner is QaRuleOwner {
  if (!owner || !OWNER_ID_PATTERN.test(owner.id) || owner.id === 'unknown') {
    throw new TypeError(`QA rule ${ruleId} must name a stable rule owner`);
  }
  if (owner.authority !== 'named' && owner.authority !== 'delegated') {
    throw new TypeError(`QA rule ${ruleId} has an invalid owner authority`);
  }
}

function assertNonNegativeInteger(value: number, path: string, ruleId: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new TypeError(`QA rule ${ruleId} calibration ${path} must be a non-negative integer`);
  }
}

const roundedRatio = (numerator: number, denominator: number): number =>
  Math.round((numerator / denominator) * 1_000_000) / 1_000_000;

function assertCalibrationPromotion(
  rule: QaRule,
  promotion: QaCalibrationPromotionAuthorization,
): void {
  const report = promotion.report;
  if (report.schemaVersion !== 1) {
    throw new TypeError(`QA rule ${rule.id} calibration report schemaVersion must be 1`);
  }
  if (!OWNER_ID_PATTERN.test(report.reportId) || promotion.packetId !== report.reportId) {
    throw new TypeError(`QA rule ${rule.id} calibration packet/report identity mismatch`);
  }
  if (
    report.thresholdId !== QA_026_CALIBRATION_THRESHOLD_ID ||
    report.thresholdSha256 !== QA_026_CALIBRATION_THRESHOLD_SHA256
  ) {
    throw new TypeError(`QA rule ${rule.id} calibration threshold identity mismatch`);
  }
  if (
    report.heldOutSetVersion !== QA_026_HELD_OUT_SET_VERSION ||
    report.heldOutSetSha256 !== QA_026_HELD_OUT_SET_SHA256
  ) {
    throw new TypeError(`QA rule ${rule.id} calibration held-out set identity mismatch`);
  }
  if (
    report.reviewAuthorityScheme !== QA_026_REVIEW_AUTHORITY_SCHEME ||
    report.reviewAuthorityKeyId !== QA_026_REVIEW_AUTHORITY_KEY_ID ||
    report.reviewAuthorityPublicKeySha256 !== QA_026_REVIEW_AUTHORITY_PUBLIC_KEY_SHA256
  ) {
    throw new TypeError(`QA rule ${rule.id} calibration review authority identity mismatch`);
  }
  if (report.ruleCode !== rule.id) {
    throw new TypeError(`QA rule ${rule.id} calibration report targets ${report.ruleCode}`);
  }
  const expectedSource = rule.ruleClass === 'vlm' ? 'vlm' : 'deterministic-heuristic';
  if (report.source !== expectedSource) {
    throw new TypeError(`QA rule ${rule.id} calibration source must be ${expectedSource}`);
  }
  if (!Number.isFinite(Date.parse(report.generatedAt))) {
    throw new TypeError(`QA rule ${rule.id} calibration report generatedAt is invalid`);
  }
  if (Date.parse(promotion.frozenAt) < Date.parse(report.generatedAt)) {
    throw new TypeError(`QA rule ${rule.id} calibration cannot be frozen before its report`);
  }
  const actualReportSha256 = calibrationReportEvidenceSha256(report);
  if (promotion.evidenceSha256 !== actualReportSha256) {
    throw new TypeError(`QA rule ${rule.id} calibration report SHA-256 mismatch`);
  }

  for (const field of [
    'labeledCases',
    'evaluatedCases',
    'insufficientEvidenceCases',
    'humanDisagreementCases',
    'validExamples',
    'defectiveExamples',
    'truePositive',
    'falsePositive',
    'trueNegative',
    'falseNegative',
    'styles',
    'falseBlocks',
  ] as const) {
    assertNonNegativeInteger(report[field], field, rule.id);
  }
  if (
    !Number.isFinite(report.precision) ||
    report.precision < 0 ||
    report.precision > 1 ||
    !Number.isFinite(report.recall) ||
    report.recall < 0 ||
    report.recall > 1
  ) {
    throw new TypeError(`QA rule ${rule.id} calibration precision/recall must be within [0, 1]`);
  }
  if (report.validExamples !== report.trueNegative + report.falsePositive) {
    throw new TypeError(`QA rule ${rule.id} calibration valid-example confusion counts mismatch`);
  }
  if (report.defectiveExamples !== report.truePositive + report.falseNegative) {
    throw new TypeError(
      `QA rule ${rule.id} calibration defective-example confusion counts mismatch`,
    );
  }
  if (report.evaluatedCases !== report.validExamples + report.defectiveExamples) {
    throw new TypeError(`QA rule ${rule.id} calibration evaluated-case count mismatch`);
  }
  if (
    report.labeledCases !==
    report.evaluatedCases + report.insufficientEvidenceCases + report.humanDisagreementCases
  ) {
    throw new TypeError(`QA rule ${rule.id} calibration labeled-case count mismatch`);
  }
  const warn = QA_026_WARN_PROMOTION_MINIMUMS;
  if (
    report.evaluatedCases < warn.evaluatedCases ||
    report.validExamples < warn.validExamples ||
    report.defectiveExamples < warn.defectiveExamples ||
    report.styles < warn.styles
  ) {
    throw new Error(`QA rule ${rule.id} calibration does not meet the warn promotion minimums`);
  }
  const expectedPrecision = roundedRatio(
    report.truePositive,
    report.truePositive + report.falsePositive,
  );
  const expectedRecall = roundedRatio(
    report.truePositive,
    report.truePositive + report.falseNegative,
  );
  if (
    !Number.isFinite(expectedPrecision) ||
    !Number.isFinite(expectedRecall) ||
    report.precision !== expectedPrecision ||
    report.recall !== expectedRecall
  ) {
    throw new TypeError(`QA rule ${rule.id} calibration metrics do not match confusion counts`);
  }
  if (report.insufficientEvidenceCases !== 0 || report.humanDisagreementCases !== 0) {
    throw new Error(`QA rule ${rule.id} calibration has unresolved evidence or human disagreement`);
  }

  if (report.precision < warn.precision || report.recall < warn.recall) {
    throw new Error(`QA rule ${rule.id} calibration does not meet the warn promotion minimums`);
  }
  if (report.source === 'vlm') {
    if (
      report.meanConfidence === null ||
      !Number.isFinite(report.meanConfidence) ||
      report.meanConfidence < warn.vlmMeanConfidence ||
      report.meanConfidence > 1
    ) {
      throw new Error(`QA rule ${rule.id} VLM calibration confidence is below the warn minimum`);
    }
    if (promotion.authorizedMode !== 'warn') {
      throw new Error(`VLM QA rule ${rule.id} promotion is permanently capped at warn`);
    }
  } else if (report.meanConfidence !== null) {
    throw new TypeError(`QA rule ${rule.id} deterministic calibration meanConfidence must be null`);
  }

  if (promotion.authorizedMode === 'warn') {
    if (report.falseBlocks !== 0) {
      throw new Error(`QA rule ${rule.id} warning calibration cannot report false blocks`);
    }
    return;
  }

  const enforce = QA_026_ENFORCE_PROMOTION_MINIMUMS;
  if (
    report.evaluatedCases < enforce.evaluatedCases ||
    report.validExamples < enforce.validExamples ||
    report.defectiveExamples < enforce.defectiveExamples ||
    report.precision < enforce.precision ||
    report.recall < enforce.recall ||
    report.styles < enforce.styles ||
    report.falsePositive !== 0 ||
    report.falseBlocks !== enforce.falseBlocks
  ) {
    throw new Error(`QA rule ${rule.id} calibration does not meet the enforce promotion minimums`);
  }
}

function assertPromotionShape(rule: QaRule, promotion: QaPromotionAuthorization): void {
  if (promotion.authorizedMode !== 'warn' && promotion.authorizedMode !== 'enforce') {
    throw new TypeError(`QA rule ${rule.id} promotion must explicitly authorize warn or enforce`);
  }
  if (!evidenceId(promotion).trim()) {
    throw new TypeError(`QA rule ${rule.id} promotion evidence must have a stable id`);
  }
  if (
    promotion.basis === 'conformance' &&
    (!promotion.fixturePath.startsWith('src/qa/') || !promotion.fixturePath.endsWith('.test.ts'))
  ) {
    throw new TypeError(
      `QA rule ${rule.id} conformance evidence must name a repository-relative src/qa/*.test.ts fixture`,
    );
  }
  if (!SHA256_PATTERN.test(promotion.evidenceSha256)) {
    throw new TypeError(`QA rule ${rule.id} promotion evidence must have a lowercase SHA-256`);
  }
  if (typeof promotion.rendererId !== 'string' || !promotion.rendererId.trim()) {
    throw new TypeError(
      `QA rule ${rule.id} promotion evidence must name its producing rendererId ` +
        `(e.g. "cpu-raster:0.6.0"; pre-existing evidence uses "${LEGACY_CPU_RASTER_RENDERER_ID}")`,
    );
  }
  if (!RENDERER_ID_PATTERN.test(promotion.rendererId)) {
    throw new TypeError(
      `QA rule ${rule.id} promotion rendererId "${promotion.rendererId}" must start with a ` +
        `renderer family prefix followed by ':' (e.g. "cpu-raster:", "dawn-vulkan:")`,
    );
  }
  if (!Number.isFinite(Date.parse(promotion.frozenAt))) {
    throw new TypeError(`QA rule ${rule.id} promotion evidence must have a frozenAt timestamp`);
  }
  if (promotion.authorizedBy !== rule.owner.id) {
    throw new TypeError(`QA rule ${rule.id} promotion must be authorized by its named rule owner`);
  }
  if (promotion.basis === 'conformance') {
    if (rule.ruleClass !== 'exact') {
      throw new TypeError(`Non-exact QA rule ${rule.id} cannot use conformance promotion evidence`);
    }
  } else {
    if (rule.ruleClass === 'exact') {
      throw new TypeError(`Exact QA rule ${rule.id} cannot use QA-026 calibration evidence`);
    }
    assertCalibrationPromotion(rule, promotion);
  }
}

function assertModeAuthorized(rule: QaRule, mode: QaRuleMode): void {
  assertOwner(rule.owner, rule.id);
  if (!(QA_RULE_MODES as readonly string[]).includes(mode)) {
    throw new TypeError(`QA rule ${rule.id} received unsupported rollout mode ${String(mode)}`);
  }
  if (mode === 'off' || mode === 'observe') {
    if (rule.promotion) assertPromotionShape(rule, rule.promotion);
    return;
  }

  // Stricter than the VLM warn cap below: appearance evidence derives from
  // rendered/GPU output, which is a non-deterministic VIEW producer — findings
  // may inform, never gate.
  if (rule.ruleClass === 'appearance') {
    throw new Error(
      `Appearance QA rule ${rule.id} cannot exceed observe; appearance findings derive from rendered output and are never gates`,
    );
  }

  const promotion = rule.promotion;
  if (!promotion) {
    throw new Error(
      `QA rule ${rule.id} cannot enter ${mode} without frozen promotion evidence and owner authorization`,
    );
  }
  assertPromotionShape(rule, promotion);
  if (rule.ruleClass === 'vlm' && mode === 'enforce') {
    throw new Error(`VLM QA rule ${rule.id} cannot be enforced; VLM findings are never blockers`);
  }
  if (mode === 'enforce' && promotion.authorizedMode !== 'enforce') {
    throw new Error(
      `QA rule ${rule.id} promotion authorizes warn, not enforce; a new owner approval is required`,
    );
  }

  if (rule.ruleClass === 'exact' && promotion.basis !== 'conformance') {
    throw new Error(`Exact QA rule ${rule.id} requires conformance-fixture promotion evidence`);
  }
  if (rule.ruleClass !== 'exact' && promotion.basis !== 'qa-026-calibration') {
    throw new Error(`QA rule ${rule.id} requires frozen QA-026 calibration evidence`);
  }
}

function policyDecision(rule: QaRule, mode: QaRuleMode): QaRulePolicyDecision {
  const promotion = rule.promotion;
  return {
    ruleId: rule.id,
    profile: rule.profile,
    mode,
    ruleClass: rule.ruleClass,
    owner: { ...rule.owner },
    ...(promotion
      ? {
          promotionBasis: promotion.basis,
          authorizedMode: promotion.authorizedMode,
          evidenceId: evidenceId(promotion),
        }
      : {}),
  };
}

function applies(rule: QaRule, context: QaContext): boolean {
  const { scope } = rule;
  if (scope.kind === 'universal') return true;
  if (scope.kind === 'category') return context.intent.category === scope.category;
  if (scope.kind === 'subtype') {
    return context.intent.category === scope.category && context.intent.subtype === scope.subtype;
  }
  return context.intent.capabilities.includes(scope.capability);
}

function effectiveMode(rule: QaRule, policy: QaRulePolicy): QaRuleMode {
  return (
    policy.byRule?.[rule.id] ??
    policy.byProfile?.[rule.profile] ??
    policy.defaultMode ??
    rule.defaultMode
  );
}

function applyMode(finding: QaFinding, mode: QaRuleMode): QaFinding {
  if (mode === 'observe') return { ...finding, disposition: 'observe' };
  if (mode === 'warn') return { ...finding, disposition: 'warn' };
  return finding;
}

/** Composes universal, category, subtype, and capability rules without branching callers. */
export class QaRegistry {
  readonly #rules: QaRule[] = [];
  readonly #ids = new Set<string>();

  constructor(rules: readonly QaRule[] = []) {
    for (const rule of rules) this.register(rule);
  }

  register(rule: QaRule): this {
    if (!/^[A-Z][A-Z0-9_]*$/.test(rule.id)) {
      throw new TypeError(`QA rule id must be a stable uppercase code: ${rule.id}`);
    }
    if (this.#ids.has(rule.id)) throw new Error(`Duplicate QA rule id: ${rule.id}`);
    if (!(QA_RULE_CLASSES as readonly string[]).includes(rule.ruleClass)) {
      throw new TypeError(`QA rule ${rule.id} has an invalid rule class: ${rule.ruleClass}`);
    }
    assertModeAuthorized(rule, rule.defaultMode);
    this.#ids.add(rule.id);
    this.#rules.push(rule);
    return this;
  }

  list(context?: QaContext): readonly QaRule[] {
    return context ? this.#rules.filter((rule) => applies(rule, context)) : [...this.#rules];
  }

  /** Stable, auditable rollout state for every registered rule, including rules outside a context. */
  describePolicy(policy: QaRulePolicy = {}): readonly QaRulePolicyDecision[] {
    return this.#rules.map((rule) => {
      const mode = effectiveMode(rule, policy);
      assertModeAuthorized(rule, mode);
      return policyDecision(rule, mode);
    });
  }

  run(context: QaContext, policy: QaRulePolicy = {}): QaRegistryResult {
    const findings: QaFinding[] = [];
    const executedRules: string[] = [];
    const skippedRules: string[] = [];
    const decisions: QaRulePolicyDecision[] = [];

    for (const rule of this.#rules) {
      if (!applies(rule, context)) continue;
      const mode = effectiveMode(rule, policy);
      assertModeAuthorized(rule, mode);
      decisions.push(policyDecision(rule, mode));
      if (mode === 'off') {
        skippedRules.push(rule.id);
        continue;
      }
      executedRules.push(rule.id);
      for (const finding of rule.evaluate(context)) findings.push(applyMode(finding, mode));
    }

    return { findings, executedRules, skippedRules, decisions };
  }
}
