export const PROP_HELPER_ABLATION_SCHEMA_VERSION = 1 as const;
export const PROP_HELPER_ABLATION_MINIMUM_LIFT = 0.15;

export type PropHelperCandidateKind = 'capability-scaffold' | 'noun-specific-helper';

export interface PropHelperAblationArmV1 {
  passedCases: number;
  evaluatedCases: number;
}

export interface PropHelperAblationEvidenceV1 {
  schemaVersion: typeof PROP_HELPER_ABLATION_SCHEMA_VERSION;
  experimentId: string;
  candidateKind: PropHelperCandidateKind;
  fixedCorpusId: string;
  baseline: PropHelperAblationArmV1;
  /** Generic capability scaffold, which is the mandatory comparison for noun helpers. */
  capabilityScaffold: PropHelperAblationArmV1;
  candidate: PropHelperAblationArmV1;
  propControlCorpusId: string;
  propControlCases: number;
  propControlRegressions: number;
}

export interface PropHelperAblationDecisionV1 {
  schemaVersion: typeof PROP_HELPER_ABLATION_SCHEMA_VERSION;
  experimentId: string;
  approved: boolean;
  baselineRate: number;
  capabilityScaffoldRate: number;
  candidateRate: number;
  requiredComparatorRate: number;
  lift: number;
  reasons: string[];
}

const rate = (arm: PropHelperAblationArmV1): number =>
  arm.evaluatedCases === 0 ? 0 : arm.passedCases / arm.evaluatedCases;
const stable = (value: number): number => Math.round(value * 1_000_000) / 1_000_000;

function validateArm(arm: PropHelperAblationArmV1, path: string): void {
  if (
    !Number.isInteger(arm.evaluatedCases) ||
    arm.evaluatedCases <= 0 ||
    !Number.isInteger(arm.passedCases) ||
    arm.passedCases < 0 ||
    arm.passedCases > arm.evaluatedCases
  ) {
    throw new TypeError(
      `${path} must contain integer passed/evaluated counts with 0 <= passed <= evaluated.`,
    );
  }
}

/**
 * PROP-006 policy. A capability scaffold must beat free composition; a future
 * noun-specific helper must then beat that scaffold. Either path closes when a
 * single frozen prop control regresses.
 */
export function evaluatePropHelperAblation(
  evidence: PropHelperAblationEvidenceV1,
): PropHelperAblationDecisionV1 {
  if (evidence.schemaVersion !== PROP_HELPER_ABLATION_SCHEMA_VERSION) {
    throw new TypeError(`schemaVersion must be ${PROP_HELPER_ABLATION_SCHEMA_VERSION}.`);
  }
  if (
    !evidence.experimentId.trim() ||
    !evidence.fixedCorpusId.trim() ||
    !evidence.propControlCorpusId.trim()
  ) {
    throw new TypeError('experimentId, fixedCorpusId, and propControlCorpusId are required.');
  }
  validateArm(evidence.baseline, 'baseline');
  validateArm(evidence.capabilityScaffold, 'capabilityScaffold');
  validateArm(evidence.candidate, 'candidate');
  if (
    !Number.isInteger(evidence.propControlCases) ||
    evidence.propControlCases <= 0 ||
    !Number.isInteger(evidence.propControlRegressions) ||
    evidence.propControlRegressions < 0 ||
    evidence.propControlRegressions > evidence.propControlCases
  ) {
    throw new TypeError('Prop control counts are invalid.');
  }

  const baselineRate = rate(evidence.baseline);
  const capabilityScaffoldRate = rate(evidence.capabilityScaffold);
  const candidateRate = rate(evidence.candidate);
  const comparatorRate =
    evidence.candidateKind === 'capability-scaffold' ? baselineRate : capabilityScaffoldRate;
  const lift = candidateRate - comparatorRate;
  const reasons: string[] = [];
  if (evidence.propControlRegressions > 0) {
    reasons.push(`${evidence.propControlRegressions} frozen prop control cases regressed.`);
  }
  if (
    evidence.candidateKind === 'capability-scaffold' &&
    capabilityScaffoldRate !== candidateRate
  ) {
    reasons.push('Capability-scaffold candidate arm must equal the named capabilityScaffold arm.');
  }
  if (lift + 1e-12 < PROP_HELPER_ABLATION_MINIMUM_LIFT) {
    reasons.push(
      `Candidate lift ${stable(lift)} is below the required ${PROP_HELPER_ABLATION_MINIMUM_LIFT}.`,
    );
  }
  return {
    schemaVersion: PROP_HELPER_ABLATION_SCHEMA_VERSION,
    experimentId: evidence.experimentId,
    approved: reasons.length === 0,
    baselineRate: stable(baselineRate),
    capabilityScaffoldRate: stable(capabilityScaffoldRate),
    candidateRate: stable(candidateRate),
    requiredComparatorRate: stable(comparatorRate),
    lift: stable(lift),
    reasons,
  };
}
