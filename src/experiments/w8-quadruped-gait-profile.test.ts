import { createHash } from 'node:crypto';

import { describe, expect, test } from 'bun:test';

type CandidateGait = 'walk' | 'trot' | 'gallop';
type LegRole = 'front.left' | 'front.right' | 'rear.left' | 'rear.right';
type PhaseProfile = Readonly<Record<LegRole, number>>;

const LEG_ROLES: readonly LegRole[] = Object.freeze([
  'front.left',
  'front.right',
  'rear.left',
  'rear.right',
]);

/**
 * W8 test-only candidates. These are deliberately not exported through the engine, injected into
 * prompts, or registered as QA rules. Their purpose is to measure whether an optional profile is
 * mechanically testable before human calibration, not to claim that one phase sequence is
 * universal animal-motion truth.
 */
const CANDIDATE_PROFILES: Readonly<Record<CandidateGait, PhaseProfile>> = Object.freeze({
  walk: Object.freeze({
    'front.left': 0,
    'front.right': 0.5,
    'rear.left': 0.75,
    'rear.right': 0.25,
  }),
  trot: Object.freeze({
    'front.left': 0,
    'front.right': 0.5,
    'rear.left': 0.5,
    'rear.right': 0,
  }),
  gallop: Object.freeze({
    'front.left': 0.5,
    'front.right': 0.65,
    'rear.left': 0,
    'rear.right': 0.15,
  }),
});

const MAX_PHASE_RMSE = 0.08;

function wrapPhase(value: number): number {
  const wrapped = value % 1;
  return wrapped < 0 ? wrapped + 1 : wrapped;
}

function circularDistance(left: number, right: number): number {
  const distance = Math.abs(wrapPhase(left) - wrapPhase(right));
  return Math.min(distance, 1 - distance);
}

function signedCircularDelta(value: number, reference: number): number {
  let delta = wrapPhase(value) - wrapPhase(reference);
  if (delta > 0.5) delta -= 1;
  if (delta <= -0.5) delta += 1;
  return delta;
}

function shifted(profile: PhaseProfile, offset: number, jitter: readonly number[]): PhaseProfile {
  return Object.freeze(
    Object.fromEntries(
      LEG_ROLES.map((role, index) => [
        role,
        wrapPhase(profile[role] + offset + (jitter[index] ?? 0)),
      ]),
    ) as Record<LegRole, number>,
  );
}

function bestAlignedPhaseRmse(expected: PhaseProfile, observed: PhaseProfile): number {
  const residuals = LEG_ROLES.map((role) => wrapPhase(observed[role] - expected[role]));
  // Circular least squares is piecewise Euclidean between the antipodes of the
  // residuals. Enumerate every interval, unwrap at its midpoint, solve the
  // Euclidean mean, and include the interval boundaries for constrained minima.
  const boundaries = [...new Set(residuals.map((residual) => wrapPhase(residual + 0.5)))].sort(
    (left, right) => left - right,
  );
  const intervalMeans = boundaries.map((start, index) => {
    const next = boundaries[(index + 1) % boundaries.length]!;
    const end = index + 1 < boundaries.length ? next : next + 1;
    const midpoint = wrapPhase((start + end) / 2);
    const mean =
      residuals.reduce(
        (sum, residual) => sum + midpoint + signedCircularDelta(residual, midpoint),
        0,
      ) / residuals.length;
    return wrapPhase(mean);
  });
  const candidateOffsets = [...boundaries, ...intervalMeans];
  return Math.min(
    ...candidateOffsets.map((offset) => {
      const squaredError = LEG_ROLES.reduce((sum, role) => {
        const distance = circularDistance(observed[role], expected[role] + offset);
        return sum + distance * distance;
      }, 0);
      return Math.sqrt(squaredError / LEG_ROLES.length);
    }),
  );
}

function evaluateCandidate(
  gait: CandidateGait | undefined,
  observed?: PhaseProfile,
): Readonly<{
  status: 'evaluated' | 'not-applicable' | 'insufficient-evidence';
  findingCount: number;
  predictedDefect: boolean;
  phaseRmse: number | null;
}> {
  if (gait === undefined) {
    return Object.freeze({
      status: 'not-applicable',
      findingCount: 0,
      predictedDefect: false,
      phaseRmse: null,
    });
  }
  if (observed === undefined) {
    return Object.freeze({
      status: 'insufficient-evidence',
      findingCount: 0,
      predictedDefect: false,
      phaseRmse: null,
    });
  }
  const phaseRmse = bestAlignedPhaseRmse(CANDIDATE_PROFILES[gait], observed);
  const predictedDefect = phaseRmse > MAX_PHASE_RMSE;
  return Object.freeze({
    status: 'evaluated',
    findingCount: predictedDefect ? 1 : 0,
    predictedDefect,
    phaseRmse: Math.round(phaseRmse * 1_000_000) / 1_000_000,
  });
}

const SYNCHRONOUS: PhaseProfile = Object.freeze({
  'front.left': 0,
  'front.right': 0,
  'rear.left': 0,
  'rear.right': 0,
});

const PACE: PhaseProfile = Object.freeze({
  'front.left': 0,
  'front.right': 0.5,
  'rear.left': 0,
  'rear.right': 0.5,
});

interface SyntheticCase {
  id: string;
  gait: CandidateGait;
  expectedDefect: boolean;
  phases: PhaseProfile;
}

const SYNTHETIC_CASES: readonly SyntheticCase[] = Object.freeze(
  (Object.keys(CANDIDATE_PROFILES) as CandidateGait[]).flatMap((gait) => [
    Object.freeze({
      id: `${gait}-shifted-control-a`,
      gait,
      expectedDefect: false,
      phases: shifted(CANDIDATE_PROFILES[gait], 0.17, [0, 0.01, -0.01, 0.015]),
    }),
    Object.freeze({
      id: `${gait}-shifted-control-b`,
      gait,
      expectedDefect: false,
      phases: shifted(CANDIDATE_PROFILES[gait], 0.61, [0.012, -0.008, 0.006, -0.01]),
    }),
    Object.freeze({
      id: `${gait}-synchronous-adversary`,
      gait,
      expectedDefect: true,
      phases: SYNCHRONOUS,
    }),
    Object.freeze({
      id: `${gait}-pace-adversary`,
      gait,
      expectedDefect: true,
      phases: PACE,
    }),
  ]),
);

function experimentReport() {
  const evaluated = SYNTHETIC_CASES.map((entry) => ({
    id: entry.id,
    gait: entry.gait,
    expectedDefect: entry.expectedDefect,
    result: evaluateCandidate(entry.gait, entry.phases),
  }));
  const truePositive = evaluated.filter(
    (entry) => entry.expectedDefect && entry.result.predictedDefect,
  ).length;
  const falsePositive = evaluated.filter(
    (entry) => !entry.expectedDefect && entry.result.predictedDefect,
  ).length;
  const trueNegative = evaluated.filter(
    (entry) => !entry.expectedDefect && !entry.result.predictedDefect,
  ).length;
  const falseNegative = evaluated.filter(
    (entry) => entry.expectedDefect && !entry.result.predictedDefect,
  ).length;
  return Object.freeze({
    schemaVersion: 1,
    experimentId: 'kiln.w8.quadruped-gait-profile-experiment.v1',
    surface: 'test-only',
    threshold: { metric: 'global-phase-aligned-rmse', maximum: MAX_PHASE_RMSE },
    profileNames: Object.keys(CANDIDATE_PROFILES),
    syntheticCaseCount: evaluated.length,
    syntheticValidExamples: trueNegative + falsePositive,
    syntheticDefectiveExamples: truePositive + falseNegative,
    syntheticConfusion: { truePositive, falsePositive, trueNegative, falseNegative },
    unspecifiedGait: evaluateCandidate(undefined, SYNCHRONOUS),
    missingPhaseEvidence: evaluateCandidate('walk'),
    humanLabelCount: 0,
    eligibleForPublicSurface: false,
    eligibleForPromotion: false,
    reasons: [
      'No production-authority human labels exist for quadruped gait.',
      'Synthetic construction fixtures do not estimate frontier-model false-positive or false-negative rates.',
      'No R4 owner acceptance exists for a public gait-profile surface.',
    ],
  });
}

describe('CHAR-028 provider-free optional quadruped gait-profile experiment', () => {
  test('tests walk/trot/gallop phase relations without penalizing unspecified gait', () => {
    expect(new Set(Object.keys(CANDIDATE_PROFILES))).toEqual(new Set(['walk', 'trot', 'gallop']));
    expect(new Set(Object.values(CANDIDATE_PROFILES.walk)).size).toBe(4);
    expect(CANDIDATE_PROFILES.trot['front.left']).toBe(CANDIDATE_PROFILES.trot['rear.right']);
    expect(CANDIDATE_PROFILES.trot['front.right']).toBe(CANDIDATE_PROFILES.trot['rear.left']);
    expect(CANDIDATE_PROFILES.gallop['rear.right']).toBeGreaterThan(
      CANDIDATE_PROFILES.gallop['rear.left'],
    );
    expect(CANDIDATE_PROFILES.gallop['front.right']).toBeGreaterThan(
      CANDIDATE_PROFILES.gallop['front.left'],
    );
    expect(evaluateCandidate(undefined, SYNCHRONOUS)).toEqual({
      status: 'not-applicable',
      findingCount: 0,
      predictedDefect: false,
      phaseRmse: null,
    });
    expect(evaluateCandidate('walk')).toEqual({
      status: 'insufficient-evidence',
      findingCount: 0,
      predictedDefect: false,
      phaseRmse: null,
    });
    const jitter = [0, 0.01, -0.01, 0.015] as const;
    const earlyStart = bestAlignedPhaseRmse(
      CANDIDATE_PROFILES.walk,
      shifted(CANDIDATE_PROFILES.walk, 0.17, jitter),
    );
    const lateStart = bestAlignedPhaseRmse(
      CANDIDATE_PROFILES.walk,
      shifted(CANDIDATE_PROFILES.walk, 0.61, jitter),
    );
    expect(earlyStart).toBeCloseTo(lateStart, 12);
    expect(earlyStart).toBeLessThan(MAX_PHASE_RMSE);
  });

  test('reproduces the synthetic profile experiment but refuses to treat it as calibration', () => {
    const report = experimentReport();
    expect(report).toMatchObject({
      surface: 'test-only',
      syntheticCaseCount: 12,
      syntheticValidExamples: 6,
      syntheticDefectiveExamples: 6,
      syntheticConfusion: {
        truePositive: 6,
        falsePositive: 0,
        trueNegative: 6,
        falseNegative: 0,
      },
      humanLabelCount: 0,
      eligibleForPublicSurface: false,
      eligibleForPromotion: false,
    });
    expect(JSON.stringify(experimentReport())).toBe(JSON.stringify(report));
    const sha256 = createHash('sha256').update(JSON.stringify(report)).digest('hex');
    expect(sha256).toBe('076a2ac0c7c4f902a9fc4e4ad1da0802021b0892edfea8df701de286d69bc191');
  });
});
